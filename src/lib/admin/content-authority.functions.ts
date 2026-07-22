/**
 * Content Authority Engine — server functions.
 * Additive, read-mostly. Never rewrites content.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ContentType = z.enum(["blog", "course", "landing", "program", "resource", "career", "kb"]);
type ContentType = z.infer<typeof ContentType>;

async function ensureAdmin(context: any) {
  const { data } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
  if (!data) throw new Error("Forbidden");
}

// -------- Adapters: load content body per type. Blog is v1. --------
async function loadContent(sb: any, type: ContentType, id: string): Promise<{
  title: string;
  body: string;
  slug: string | null;
  updated_at: string | null;
  published_at: string | null;
  meta_description: string | null;
  keywords: string[];
  faqs: any[];
  author_display_name: string | null;
  reviewer_display_name: string | null;
  hero_image_url: string | null;
} | null> {
  if (type === "blog") {
    const { data } = await sb
      .from("blog_posts")
      .select(
        "title, slug, content_markdown, updated_at, published_at, seo_description, keywords, faqs, author_display_name, reviewer_display_name, hero_image_url",
      )
      .eq("id", id)
      .maybeSingle();
    if (!data) return null;
    return {
      title: data.title ?? "",
      body: data.content_markdown ?? "",
      slug: data.slug ?? null,
      updated_at: data.updated_at ?? null,
      published_at: data.published_at ?? null,
      meta_description: data.seo_description ?? null,
      keywords: Array.isArray(data.keywords) ? data.keywords : [],
      faqs: Array.isArray(data.faqs) ? data.faqs : [],
      author_display_name: data.author_display_name ?? null,
      reviewer_display_name: data.reviewer_display_name ?? null,
      hero_image_url: data.hero_image_url ?? null,
    };
  }
  // TODO: courses/landing/etc adapters — added on request.
  return null;
}

// -------- Signal extractors (pure heuristics) --------
function words(s: string) {
  return s.replace(/`[\s\S]*?`/g, " ").split(/\s+/).filter(Boolean);
}
function wordCount(s: string) {
  return words(s).length;
}

const CLAIM_PATTERNS: Array<{ type: string; re: RegExp }> = [
  { type: "percentage", re: /(?<![\w-])(\d{1,3}(?:\.\d+)?)\s?%/g },
  { type: "stat", re: /\b(\d{1,3}(?:,\d{3})+|\d{4,})\b(?!\s?%)/g },
  { type: "salary", re: /(?:₹|Rs\.?|INR|\$|USD|€|£)\s?\d[\d,\.]*\s?(?:LPA|lakh|lac|cr|crore|k|K|million|billion|per\s+annum|\/(?:year|yr|month|mo))?/g },
  { type: "job_growth", re: /\b(?:job|hiring|employment|demand|openings?)\s+(?:growth|growth\s+rate|increase|surge|rise)\b[^.]*/gi },
  { type: "tech_trend", re: /\b(?:according to|as per|reports?|survey|study)\s+[A-Z][\w\s&\.-]{2,50}\b/g },
  { type: "market", re: /\b(?:market size|CAGR|market share|revenue of|projected to reach)\b[^.]*/gi },
];

function extractClaims(body: string) {
  const claims: Array<{ text: string; type: string; offset_start: number; offset_end: number }> = [];
  const seen = new Set<string>();
  for (const { type, re } of CLAIM_PATTERNS) {
    for (const m of body.matchAll(re)) {
      const idx = m.index ?? 0;
      // Grab surrounding sentence
      const start = Math.max(0, body.lastIndexOf(".", idx) + 1);
      const endDot = body.indexOf(".", idx + m[0].length);
      const end = endDot === -1 ? Math.min(body.length, idx + m[0].length + 120) : endDot + 1;
      const text = body.slice(start, end).trim().replace(/\s+/g, " ").slice(0, 320);
      if (!text || text.length < 12) continue;
      const key = `${type}:${text.toLowerCase().slice(0, 80)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      claims.push({ text, type, offset_start: idx, offset_end: idx + m[0].length });
      if (claims.length >= 40) return claims;
    }
  }
  return claims;
}

function passiveVoiceRatio(body: string) {
  const sentences = body.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 8);
  if (!sentences.length) return 0;
  const passive = sentences.filter((s) => /\b(?:was|were|is|are|be|been|being)\s+\w+(?:ed|en)\b/i.test(s)).length;
  return passive / sentences.length;
}

function readabilityGrade(body: string) {
  // Flesch–Kincaid-lite
  const sentences = Math.max(1, body.split(/[.!?]+/).filter((s) => s.trim().length > 4).length);
  const w = words(body);
  const syllables = w.reduce((acc, wd) => acc + Math.max(1, (wd.toLowerCase().match(/[aeiouy]+/g)?.length ?? 1)), 0);
  const grade = 0.39 * (w.length / sentences) + 11.8 * (syllables / Math.max(1, w.length)) - 15.59;
  return Math.max(1, Math.min(20, Math.round(grade * 10) / 10));
}

function duplicateParagraphs(body: string) {
  const paras = body.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 60);
  const map = new Map<string, number>();
  for (const p of paras) {
    const key = p.slice(0, 120).toLowerCase();
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.values()].filter((n) => n > 1).length;
}

function repetitionScore(body: string) {
  // Repeated 4-grams
  const w = words(body).map((x) => x.toLowerCase());
  if (w.length < 8) return 0;
  const grams = new Map<string, number>();
  for (let i = 0; i < w.length - 3; i++) {
    const g = w.slice(i, i + 4).join(" ");
    grams.set(g, (grams.get(g) ?? 0) + 1);
  }
  const repeats = [...grams.values()].filter((n) => n > 2).length;
  return Math.min(100, Math.round((repeats / Math.max(1, w.length / 100)) * 20));
}

function outdatedYearMentions(body: string) {
  const now = new Date().getFullYear();
  const years = [...body.matchAll(/\b(19|20)\d{2}\b/g)].map((m) => Number(m[0]));
  return years.filter((y) => y > 1990 && y < now - 3).length;
}

// -------- Scoring --------
function clamp(n: number) { return Math.max(0, Math.min(100, Math.round(n))); }

function computeScores(input: {
  body: string;
  title: string;
  meta_description: string | null;
  keywords: string[];
  faqs: any[];
  updated_at: string | null;
  hero_image_url: string | null;
  author_display_name: string | null;
  reviewer_display_name: string | null;
  claimCount: number;
  verifiedClaims: number;
  citations: number;
}) {
  const wc = wordCount(input.body);
  const passive = passiveVoiceRatio(input.body);
  const grade = readabilityGrade(input.body);
  const repetition = repetitionScore(input.body);
  const dupParas = duplicateParagraphs(input.body);
  const outdated = outdatedYearMentions(input.body);

  const now = Date.now();
  const daysSinceUpdate = input.updated_at ? (now - new Date(input.updated_at).getTime()) / 86400_000 : 999;

  // Individual scores
  const experience_score = clamp(
    (input.author_display_name ? 25 : 0) +
    (input.reviewer_display_name ? 20 : 0) +
    (wc > 800 ? 25 : wc > 400 ? 15 : 5) +
    (input.body.match(/\b(I|we|our team|in my experience|firsthand)\b/gi)?.length ? 15 : 0) +
    (input.body.match(/```/g) ? 15 : 0),
  );

  const expertise_score = clamp(
    (input.author_display_name ? 20 : 0) +
    (input.faqs.length >= 3 ? 15 : input.faqs.length * 4) +
    (input.body.match(/^##\s/gm)?.length ?? 0) * 4 +
    (input.keywords.length >= 3 ? 15 : input.keywords.length * 4) +
    (grade >= 8 && grade <= 14 ? 20 : 5) +
    (wc > 1200 ? 15 : wc > 600 ? 10 : 0),
  );

  const authoritativeness_score = clamp(
    (input.citations >= 3 ? 35 : input.citations * 10) +
    (input.reviewer_display_name ? 20 : 0) +
    ((input.body.match(/\[[^\]]+\]\(https?:\/\/[^)]+\)/g)?.length ?? 0) * 3 +
    (input.body.match(/\b(?:according to|source:|reference:)\b/gi)?.length ? 10 : 0),
  );

  const trust_score = clamp(
    (input.citations >= 1 ? 25 : 0) +
    (input.meta_description ? 10 : 0) +
    (input.hero_image_url ? 10 : 0) +
    (input.reviewer_display_name ? 20 : 0) +
    (input.verifiedClaims >= input.claimCount * 0.5 && input.claimCount > 0 ? 25 : input.claimCount === 0 ? 15 : 5) +
    (daysSinceUpdate < 180 ? 10 : 0),
  );

  const freshness_score = clamp(
    (daysSinceUpdate < 30 ? 100 : daysSinceUpdate < 90 ? 85 : daysSinceUpdate < 180 ? 65 : daysSinceUpdate < 365 ? 40 : 15) -
    (outdated > 3 ? 20 : outdated > 0 ? 10 : 0),
  );

  const originality_score = clamp(
    100 - repetition - dupParas * 15 - (passive > 0.4 ? 15 : 0),
  );

  const overall_score = clamp(
    experience_score * 0.15 +
    expertise_score * 0.2 +
    authoritativeness_score * 0.2 +
    trust_score * 0.2 +
    freshness_score * 0.15 +
    originality_score * 0.1,
  );

  return {
    overall_score, experience_score, expertise_score, authoritativeness_score,
    trust_score, freshness_score, originality_score,
    signals: {
      word_count: wc,
      passive_voice_ratio: Math.round(passive * 100) / 100,
      readability_grade: grade,
      repetition_score: repetition,
      duplicate_paragraphs: dupParas,
      outdated_year_mentions: outdated,
      days_since_update: Math.round(daysSinceUpdate),
      claim_count: input.claimCount,
      verified_claims: input.verifiedClaims,
      citations: input.citations,
      quality_checks: {
        weak_intro: (input.body.slice(0, 400).match(/\b(welcome|in this article|hello|hey|introduction)\b/i) ? true : false),
        weak_conclusion: !/\b(in conclusion|to summarize|key takeaway|final thoughts)\b/i.test(input.body.slice(-800)),
        missing_examples: !/\b(for example|for instance|e\.g\.|such as)\b/i.test(input.body),
        missing_visuals: !/!\[[^\]]*\]\(https?:\/\/[^)]+\)/.test(input.body),
        missing_faqs: input.faqs.length === 0,
        missing_cta: !/\b(sign up|enroll|apply|get started|book a call|contact us|start free|explore)\b/i.test(input.body),
        passive_voice_high: passive > 0.35,
        readability_hard: grade > 14,
        duplicate_paragraphs: dupParas > 0,
      },
    },
  };
}

// ==================== ANALYZE ====================
export const analyzeContentAuthority = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      content_type: ContentType,
      content_id: z.string().uuid(),
      persist: z.boolean().optional().default(true),
    }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const sb = context.supabase;

    const loaded = await loadContent(sb, data.content_type, data.content_id);
    if (!loaded) throw new Error("Content not found");

    // Existing claims + citations
    const { data: existingClaims } = await sb
      .from("content_claims")
      .select("id, claim_text, claim_type, offset_start, offset_end, status, citation_id, note, reviewed_at")
      .eq("content_type", data.content_type)
      .eq("content_id", data.content_id);

    const detected = extractClaims(loaded.body);
    // De-dupe against existing by claim_text lowercased prefix
    const existingKeys = new Set(
      (existingClaims ?? []).map((c: any) => `${c.claim_type}:${(c.claim_text ?? "").toLowerCase().slice(0, 80)}`),
    );
    const newClaims = detected.filter((c) => !existingKeys.has(`${c.type}:${c.text.toLowerCase().slice(0, 80)}`));

    if (newClaims.length && data.persist) {
      const rows = newClaims.map((c) => ({
        content_type: data.content_type,
        content_id: data.content_id,
        claim_text: c.text,
        claim_type: c.type,
        offset_start: c.offset_start,
        offset_end: c.offset_end,
        status: "needs_citation",
        detected_by: "analyzer",
      }));
      await sb.from("content_claims").insert(rows);
    }

    const { data: allClaims } = await sb
      .from("content_claims")
      .select("id, claim_text, claim_type, offset_start, offset_end, status, citation_id, note, reviewed_at, updated_at")
      .eq("content_type", data.content_type)
      .eq("content_id", data.content_id)
      .neq("status", "dismissed")
      .order("detected_at", { ascending: false });

    const claimCount = allClaims?.length ?? 0;
    const verifiedClaims = (allClaims ?? []).filter((c: any) => c.status === "verified").length;
    const citationIds = [...new Set((allClaims ?? []).map((c: any) => c.citation_id).filter(Boolean))];

    const scores = computeScores({
      ...loaded,
      claimCount,
      verifiedClaims,
      citations: citationIds.length,
    });

    if (data.persist) {
      await sb.from("content_authority_scores").upsert(
        {
          content_type: data.content_type,
          content_id: data.content_id,
          ...scores,
          computed_at: new Date().toISOString(),
        },
        { onConflict: "content_type,content_id" },
      );
    }

    // Load citation library snapshot for these claims
    let citations: any[] = [];
    if (citationIds.length) {
      const { data: cits } = await sb
        .from("content_citations")
        .select("id, source_url, source_type, title, publisher, published_at, accessed_at")
        .in("id", citationIds);
      citations = cits ?? [];
    }

    return {
      content: {
        title: loaded.title,
        slug: loaded.slug,
        updated_at: loaded.updated_at,
        published_at: loaded.published_at,
        author_display_name: loaded.author_display_name,
        reviewer_display_name: loaded.reviewer_display_name,
      },
      scores,
      claims: allClaims ?? [],
      citations,
    };
  });

// ==================== CITATIONS ====================
export const listCitations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ q: z.string().optional() }).parse(raw ?? {}),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    let q: any = context.supabase
      .from("content_citations")
      .select("id, source_url, source_type, title, publisher, published_at, accessed_at, notes, updated_at")
      .order("updated_at", { ascending: false })
      .limit(100);
    if (data.q) q = q.or(`title.ilike.%${data.q}%,source_url.ilike.%${data.q}%,publisher.ilike.%${data.q}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createCitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      source_url: z.string().url(),
      source_type: z.enum(["gov", "research", "university", "docs", "vendor", "industry", "news", "other"]),
      title: z.string().optional(),
      publisher: z.string().optional(),
      published_at: z.string().optional(),
      notes: z.string().optional(),
    }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { data: row, error } = await context.supabase
      .from("content_citations")
      .insert({
        source_url: data.source_url,
        source_type: data.source_type,
        title: data.title ?? null,
        publisher: data.publisher ?? null,
        published_at: data.published_at || null,
        notes: data.notes ?? null,
        created_by: context.userId,
      })
      .select("id, source_url, source_type, title, publisher, published_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const attachCitationToClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ claim_id: z.string().uuid(), citation_id: z.string().uuid() }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { error } = await context.supabase
      .from("content_claims")
      .update({ citation_id: data.citation_id, status: "verified", reviewed_by: context.userId, reviewed_at: new Date().toISOString() })
      .eq("id", data.claim_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setClaimStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      claim_id: z.string().uuid(),
      status: z.enum(["verified", "needs_citation", "unverified", "dismissed"]),
      note: z.string().optional(),
    }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const patch: any = { status: data.status, reviewed_by: context.userId, reviewed_at: new Date().toISOString() };
    if (data.note !== undefined) patch.note = data.note;
    if (data.status !== "verified") patch.citation_id = null;
    const { error } = await context.supabase.from("content_claims").update(patch).eq("id", data.claim_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ==================== REVIEW WORKFLOW ====================
const WORKFLOW_STATES = ["draft", "ai_generated", "under_review", "fact_checked", "seo_approved", "legal_approved", "published", "archived"] as const;

export const transitionReviewStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      content_type: ContentType,
      content_id: z.string().uuid(),
      to_status: z.enum(WORKFLOW_STATES),
      note: z.string().optional(),
    }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const sb = context.supabase;
    const { data: current } = await sb
      .from("content_authority_scores")
      .select("workflow_status")
      .eq("content_type", data.content_type)
      .eq("content_id", data.content_id)
      .maybeSingle();

    const from = current?.workflow_status ?? "draft";

    await sb.from("content_authority_scores").upsert(
      { content_type: data.content_type, content_id: data.content_id, workflow_status: data.to_status },
      { onConflict: "content_type,content_id" },
    );

    const { data: profile } = await sb.auth.getUser();
    await sb.from("content_reviews").insert({
      content_type: data.content_type,
      content_id: data.content_id,
      from_status: from,
      to_status: data.to_status,
      reviewer_id: context.userId,
      reviewer_name: profile?.user?.email ?? null,
      note: data.note ?? null,
    });

    return { ok: true, from, to: data.to_status };
  });

export const listReviewHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ content_type: ContentType, content_id: z.string().uuid() }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("content_reviews")
      .select("id, from_status, to_status, reviewer_name, note, created_at")
      .eq("content_type", data.content_type)
      .eq("content_id", data.content_id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ==================== EDITOR DASHBOARD ====================
export const getAuthorityDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const sb = context.supabase;

    const [scoresRes, claimsRes] = await Promise.all([
      sb.from("content_authority_scores")
        .select("content_type, content_id, overall_score, freshness_score, trust_score, workflow_status, computed_at, signals")
        .limit(400),
      sb.from("content_claims")
        .select("content_type, content_id, status")
        .neq("status", "dismissed")
        .limit(2000),
    ]);

    const scores = scoresRes.data ?? [];
    const claims = claimsRes.data ?? [];

    // Load blog titles for anything referenced
    const blogIds = [...new Set(scores.filter((s: any) => s.content_type === "blog").map((s: any) => s.content_id))];
    let blogMap = new Map<string, { title: string; slug: string }>();
    if (blogIds.length) {
      const { data: blogs } = await sb.from("blog_posts").select("id, title, slug").in("id", blogIds as string[]);
      blogMap = new Map((blogs ?? []).map((b: any) => [b.id, { title: b.title, slug: b.slug }]));
    }

    const decorate = (s: any) => ({
      ...s,
      title: s.content_type === "blog" ? blogMap.get(s.content_id)?.title ?? "(untitled)" : "(untitled)",
      slug: s.content_type === "blog" ? blogMap.get(s.content_id)?.slug ?? null : null,
    });

    const needsCitationsCount = new Map<string, number>();
    for (const c of claims) {
      if (c.status !== "needs_citation") continue;
      const key = `${c.content_type}:${c.content_id}`;
      needsCitationsCount.set(key, (needsCitationsCount.get(key) ?? 0) + 1);
    }

    const outdated = scores.filter((s: any) => (s.signals?.outdated_year_mentions ?? 0) > 0);
    const stale = scores.filter((s: any) => s.freshness_score < 50);
    const lowAuthority = scores.filter((s: any) => s.overall_score < 60);
    const mostTrusted = [...scores].sort((a: any, b: any) => b.overall_score - a.overall_score).slice(0, 12);
    const lowestQuality = [...scores].sort((a: any, b: any) => a.overall_score - b.overall_score).slice(0, 12);
    const missingCitations = scores.filter((s: any) => (needsCitationsCount.get(`${s.content_type}:${s.content_id}`) ?? 0) > 0)
      .map((s: any) => ({ ...s, needs_citation_count: needsCitationsCount.get(`${s.content_type}:${s.content_id}`) ?? 0 }));

    return {
      totals: {
        analyzed: scores.length,
        needs_updates: stale.length,
        low_authority: lowAuthority.length,
        missing_citations: missingCitations.length,
        outdated: outdated.length,
      },
      needs_updates: stale.map(decorate).slice(0, 20),
      low_authority: lowAuthority.map(decorate).slice(0, 20),
      missing_citations: missingCitations.map(decorate).slice(0, 20),
      outdated: outdated.map(decorate).slice(0, 20),
      most_trusted: mostTrusted.map(decorate),
      lowest_quality: lowestQuality.map(decorate),
    };
  });

// ==================== PUBLIC TRUST STRIP (for /blog/$slug) ====================
export const getBlogTrustSignals = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => z.object({ slug: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    // Public, no auth. Reads via server publishable client would be nicer, but
    // this data is only meaningful on already-public posts. Use the anon
    // browser client contract via a direct fetch keeps things simple: rely on
    // an RPC-safe read using createClient here.
    const { createClient } = await import("@supabase/supabase-js");
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const url = process.env.SUPABASE_URL!;
    const sb = createClient(url, key, {
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
    const { data: post } = await sb.from("blog_posts").select("id, updated_at, reviewer_display_name").eq("slug", data.slug).eq("is_published", true).maybeSingle();
    if (!post) return null;
    // Note: content_authority_scores + content_claims are admin-only via RLS.
    // Public strip shows what the post record itself carries; the detailed
    // citations list will show up here once we expose a public-safe view later.
    return {
      updated_at: post.updated_at,
      reviewer_display_name: post.reviewer_display_name,
    };
  });
