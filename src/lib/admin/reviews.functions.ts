/**
 * Student Reviews & Success Story Management
 * Admin/brand-side moderation, AI success-story generation, analytics.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callLovableAiJson } from "@/lib/ai-gateway.server";
import { z } from "zod";

async function assertAdmin(context: any) {
  const { data } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
  if (!data) throw new Error("Admin access required");
}

const SPAM_PATTERNS = [
  /https?:\/\/(?!(www\.)?(glintr|linkedin|github)\.)/i, // external links
  /\b(viagra|casino|crypto|forex|loan|earn \$?\d+)\b/i,
  /(.)\1{6,}/, // repeated chars
  /[A-Z]{20,}/, // long uppercase runs
];

function heuristicSpamScore(text: string, rating: number): number {
  let score = 0;
  const t = text || "";
  if (t.length < 20) score += 0.35;
  if (t.length > 4000) score += 0.15;
  const links = (t.match(/https?:\/\//g) || []).length;
  if (links > 2) score += 0.4;
  for (const p of SPAM_PATTERNS) if (p.test(t)) score += 0.2;
  if (rating === 1 && t.length < 50) score += 0.2;
  return Math.min(1, score);
}

// ---------- LIST + FILTERS ----------
export const listReviews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      status: z.enum(["pending", "approved", "rejected", "spam", "archived", "all"]).default("pending"),
      search: z.string().optional(),
      target_type: z.string().optional(),
      limit: z.number().min(1).max(200).default(50),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const cols = "id, user_id, reviewer_name, reviewer_email, reviewer_avatar_url, reviewer_linkedin_url, trigger_event, target_type, target_id, target_slug, target_label, rating, title, review_text, video_url, video_thumbnail_url, company_name, company_logo_url, salary_before_lpa, salary_after_lpa, salary_growth_pct, before_snapshot, after_snapshot, career_growth_notes, status, spam_score, featured, display_locations, moderation_notes, moderated_by, moderated_at, published_at, seo_slug, success_story_id, source, created_at, updated_at";
    let q = context.supabase.from("student_reviews").select(cols, { count: "exact" })
      .order("created_at", { ascending: false }).limit(data.limit);
    if (data.status !== "all") q = q.eq("status", data.status);
    if (data.target_type) q = q.eq("target_type", data.target_type);
    if (data.search) q = q.or(`reviewer_name.ilike.%${data.search}%,review_text.ilike.%${data.search}%,company_name.ilike.%${data.search}%`);
    const { data: rows, count, error } = await q;
    if (error) throw error;
    return { rows: rows || [], total: count || 0 };
  });

// ---------- MODERATE ----------
export const moderateReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      action: z.enum(["approve", "reject", "spam", "feature", "unfeature", "archive"]),
      notes: z.string().optional(),
      display_locations: z.array(z.string()).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const patch: any = { moderated_by: context.userId, moderated_at: new Date().toISOString() };
    if (data.notes) patch.moderation_notes = data.notes;
    switch (data.action) {
      case "approve":
        patch.status = "approved";
        patch.published_at = new Date().toISOString();
        if (data.display_locations) patch.display_locations = data.display_locations;
        break;
      case "reject": patch.status = "rejected"; break;
      case "spam": patch.status = "spam"; break;
      case "archive": patch.status = "archived"; break;
      case "feature": patch.featured = true; break;
      case "unfeature": patch.featured = false; break;
    }
    const { data: row, error } = await context.supabase.from("student_reviews").update(patch).eq("id", data.id).select("id, status, featured, published_at, moderation_notes, display_locations").single();
    if (error) throw error;
    return row;
  });

// ---------- AI SPAM DETECTION ----------
export const scanReviewSpam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: r } = await context.supabase.from("student_reviews").select("*").eq("id", data.id).single();
    if (!r) throw new Error("Review not found");
    const heur = heuristicSpamScore(r.review_text, r.rating);
    let ai_score = 0, verdict = "clean", reason = "";
    try {
      const out = await callLovableAiJson<{ spam_score: number; verdict: string; reason: string }>({
        model: "google/gemini-3.5-flash",
        messages: [
          { role: "system", content: "You are a review spam classifier. Return JSON only." },
          { role: "user", content: `Classify this review. Return {"spam_score":0..1, "verdict":"spam"|"suspicious"|"clean", "reason":"short"}.\nReview:\n${r.review_text}` },
        ],
      });
      ai_score = Number(out.spam_score) || 0; verdict = out.verdict; reason = out.reason;
    } catch { /* AI optional */ }
    const spam_score = Math.min(1, Math.max(heur, ai_score));
    await context.supabase.from("student_reviews").update({ spam_score, moderation_notes: `Auto: ${verdict} — ${reason}` }).eq("id", data.id);
    return { spam_score, heuristic: heur, ai_score, verdict, reason };
  });

// ---------- AI SUCCESS STORY GENERATOR ----------
export const generateSuccessStoryFromReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ review_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: r, error } = await context.supabase.from("student_reviews").select("*").eq("id", data.review_id).single();
    if (error || !r) throw new Error("Review not found");

    const prompt = `Convert this learner review into a rich SEO success story (JSON only).
Return: {"headline":"...","subheadline":"...","story_markdown":"800+ words, real narrative with before/after arcs, 6-8 H2 sections","quote":"1-2 sentence hero pull-quote","key_wins":["3-5 items"],"seo_title":"under 60 chars","seo_description":"under 155 chars","slug":"kebab-case-name-role-company"}.
Learner: ${r.reviewer_name}. Rating: ${r.rating}. Program: ${r.target_label || r.target_type}. Company: ${r.company_name || "n/a"}.
Before: ${JSON.stringify(r.before_snapshot)}. After: ${JSON.stringify(r.after_snapshot)}. Salary before/after LPA: ${r.salary_before_lpa}/${r.salary_after_lpa}.
Review text: ${r.review_text}`;

    const out = await callLovableAiJson<any>({
      model: "google/gemini-3.5-flash",
      messages: [
        { role: "system", content: "You write SEO-optimized success stories in JSON." },
        { role: "user", content: prompt },
      ],
    });
    const slug = String(out.slug || `${r.reviewer_name}-story`).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36).slice(-4);

    const { data: story, error: sErr } = await context.supabase.from("success_stories").insert({
      name: r.reviewer_name,
      avatar_url: r.reviewer_avatar_url,
      role: (r.after_snapshot as any)?.role || r.target_label || "Learner",
      company: r.company_name || "Independent",
      course: r.target_label || "Glintr Program",
      package_lpa: r.salary_after_lpa,
      rating: r.rating,
      quote: out.quote || (r.review_text || "").slice(0, 220),
      linkedin_url: r.reviewer_linkedin_url,
      story_url: `/success-stories/${slug}`,
      featured: true,
      published: true,
    }).select().single();
    if (sErr) throw sErr;

    await context.supabase.from("student_reviews").update({
      success_story_id: story.id,
      seo_slug: slug,
      status: "approved",
      published_at: new Date().toISOString(),
    }).eq("id", r.id);

    return { story, ai: out, slug };
  });

// ---------- BULK REQUEST TRIGGER ----------
export const triggerReviewRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      user_ids: z.array(z.string().uuid()).min(1).max(500),
      trigger_event: z.enum(["course_completion", "internship_completion", "certificate_completion", "placement", "manual"]),
      target_type: z.string(),
      target_id: z.string().uuid().optional(),
      target_label: z.string().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const rows = data.user_ids.map((uid) => ({
      user_id: uid,
      trigger_event: data.trigger_event,
      target_type: data.target_type,
      target_id: data.target_id,
      target_label: data.target_label,
      status: "pending" as const,
    }));
    const { data: inserted, error } = await context.supabase.from("review_requests").insert(rows).select("id, token");
    if (error) throw error;
    return { created: inserted?.length || 0, tokens: inserted };
  });

// ---------- ANALYTICS ----------
export const getReviewAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const s = context.supabase;
    const [{ data: byStatus }, { data: recent }, { data: reqStats }] = await Promise.all([
      s.from("student_reviews").select("status, rating, spam_score, created_at").limit(2000),
      s.from("student_reviews").select("id, reviewer_name, rating, review_text, status, created_at, target_label, company_name").order("created_at", { ascending: false }).limit(10),
      s.from("review_requests").select("status, created_at").limit(2000),
    ]);
    const counts = { pending: 0, approved: 0, rejected: 0, spam: 0, archived: 0 };
    let totalRating = 0, ratedCount = 0;
    const distribution = [0, 0, 0, 0, 0];
    (byStatus || []).forEach((r: any) => {
      counts[r.status as keyof typeof counts] = (counts[r.status as keyof typeof counts] || 0) + 1;
      if (r.status === "approved" && r.rating) { totalRating += r.rating; ratedCount++; distribution[r.rating - 1]++; }
    });
    const reqCounts = { pending: 0, sent: 0, submitted: 0, opened: 0, expired: 0 };
    (reqStats || []).forEach((r: any) => { if (r.status in reqCounts) (reqCounts as any)[r.status]++; });
    return {
      counts,
      total: (byStatus || []).length,
      avg_rating: ratedCount ? (totalRating / ratedCount).toFixed(2) : "0",
      distribution,
      recent: recent || [],
      request_counts: reqCounts,
      response_rate: reqCounts.submitted && (reqCounts.submitted + reqCounts.sent + reqCounts.pending)
        ? Math.round((reqCounts.submitted / (reqCounts.submitted + reqCounts.sent + reqCounts.pending)) * 100)
        : 0,
    };
  });

// ---------- PUBLIC READS ----------
export const getPublicReviews = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      location: z.enum(["homepage", "course_pages", "landing_pages", "blogs", "any"]).default("any"),
      target_id: z.string().uuid().optional(),
      target_type: z.string().optional(),
      limit: z.number().min(1).max(50).default(12),
      min_rating: z.number().min(1).max(5).default(4),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const url = process.env.SUPABASE_URL!;
    const supa = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    let q = supa.from("student_reviews")
      .select("id, reviewer_name, reviewer_avatar_url, reviewer_linkedin_url, rating, title, review_text, video_url, video_thumbnail_url, company_name, company_logo_url, salary_growth_pct, salary_after_lpa, target_label, before_snapshot, after_snapshot, featured, seo_slug, published_at")
      .eq("status", "approved").gte("rating", data.min_rating)
      .order("featured", { ascending: false }).order("published_at", { ascending: false }).limit(data.limit);
    if (data.location !== "any") q = q.contains("display_locations", [data.location]);
    if (data.target_id) q = q.eq("target_id", data.target_id);
    if (data.target_type) q = q.eq("target_type", data.target_type);
    const { data: rows } = await q;
    return { reviews: rows || [] };
  });

// ---------- PUBLIC SUBMIT (via token) ----------
export const submitReviewByToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      token: z.string().min(10),
      rating: z.number().min(1).max(5),
      title: z.string().trim().max(160).optional(),
      review_text: z.string().trim().min(30).max(5000),
      video_url: z.string().url().optional().or(z.literal("")),
      reviewer_linkedin_url: z.string().url().optional().or(z.literal("")),
      company_name: z.string().max(120).optional(),
      salary_before_lpa: z.number().nonnegative().max(500).optional(),
      salary_after_lpa: z.number().nonnegative().max(500).optional(),
      before_snapshot: z.record(z.any()).optional(),
      after_snapshot: z.record(z.any()).optional(),
      career_growth_notes: z.string().max(2000).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: req, error } = await context.supabase.from("review_requests").select("*").eq("token", data.token).maybeSingle();
    if (error || !req) throw new Error("Invalid or expired review link");
    if (req.status === "submitted") throw new Error("This review link has already been used");
    if (req.expires_at && new Date(req.expires_at) < new Date()) throw new Error("This review link has expired");
    if (req.user_id !== context.userId) throw new Error("This review link is not for your account");

    const spam_score = heuristicSpamScore(data.review_text, data.rating);
    const { data: profile } = await context.supabase.from("student_profiles").select("full_name").eq("user_id", context.userId).maybeSingle();
    const authUser = (await context.supabase.auth.getUser()).data.user;

    const { data: review, error: rErr } = await context.supabase.from("student_reviews").insert({
      user_id: context.userId,
      reviewer_name: profile?.full_name || authUser?.email || "Anonymous",
      reviewer_email: authUser?.email,
      reviewer_linkedin_url: data.reviewer_linkedin_url || null,
      trigger_event: req.trigger_event,
      target_type: req.target_type,
      target_id: req.target_id,
      target_slug: req.target_slug,
      target_label: req.target_label,
      rating: data.rating,
      title: data.title,
      review_text: data.review_text,
      video_url: data.video_url || null,
      company_name: data.company_name,
      salary_before_lpa: data.salary_before_lpa,
      salary_after_lpa: data.salary_after_lpa,
      before_snapshot: data.before_snapshot || {},
      after_snapshot: data.after_snapshot || {},
      career_growth_notes: data.career_growth_notes,
      status: spam_score > 0.5 ? "spam" : "pending",
      spam_score,
      source: "review_link",
    }).select().single();
    if (rErr) throw rErr;

    await context.supabase.from("review_requests").update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      review_id: review.id,
    }).eq("id", req.id);

    return { ok: true, review_id: review.id, status: review.status };
  });
