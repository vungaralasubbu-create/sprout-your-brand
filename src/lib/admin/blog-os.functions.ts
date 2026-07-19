/**
 * Blog OS — Enterprise AI Blog Management server functions.
 * Unified surface for admins + brand owners. All fns gated with is_admin.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callLovableAiJson } from "@/lib/ai-gateway.server";
import { z } from "zod";

async function ensureAdmin(context: any) {
  const { data } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
  if (!data) throw new Error("Forbidden");
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 90);
}
function wordCount(s: string | null | undefined) {
  if (!s) return 0;
  return s.replace(/`[\s\S]*?`/g, " ").split(/\s+/).filter(Boolean).length;
}

// ==================== DASHBOARD OVERVIEW ====================

export const getBlogOsOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const supabase = context.supabase;

    const [totalRes, pubRes, draftRes, schedRes, recentPubRes, recentUpdRes] = await Promise.all([
      supabase.from("blog_posts").select("id", { count: "exact", head: true }),
      supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "draft"),
      supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "scheduled"),
      supabase.from("blog_posts").select("id, title, slug, published_at, status").eq("status", "published").order("published_at", { ascending: false }).limit(6),
      supabase.from("blog_posts").select("id, title, slug, updated_at, status").order("updated_at", { ascending: false }).limit(6),
    ]);

    // Traffic aggregates from analytics rollup (last 30 days)
    const since = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
    const { data: analytics } = await supabase
      .from("blog_analytics_daily")
      .select("views, clicks, impressions, ctr, avg_position")
      .gte("day", since);

    const traffic = (analytics ?? []).reduce(
      (acc: any, r: any) => ({
        views: acc.views + (r.views ?? 0),
        clicks: acc.clicks + (r.clicks ?? 0),
        impressions: acc.impressions + (r.impressions ?? 0),
      }),
      { views: 0, clicks: 0, impressions: 0 },
    );
    const ctr = traffic.impressions > 0 ? (traffic.clicks / traffic.impressions) * 100 : 0;
    const avgPosition = analytics && analytics.length > 0
      ? analytics.reduce((s: number, r: any) => s + Number(r.avg_position ?? 0), 0) / analytics.length
      : 0;

    // Top performers by views (last 30d)
    const { data: topPerf } = await supabase
      .from("blog_analytics_daily")
      .select("blog_post_id, views")
      .gte("day", since);

    const perfMap = new Map<string, number>();
    (topPerf ?? []).forEach((r: any) => {
      perfMap.set(r.blog_post_id, (perfMap.get(r.blog_post_id) ?? 0) + r.views);
    });
    const topIds = [...perfMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);
    const lowIds = [...perfMap.entries()].sort((a, b) => a[1] - b[1]).slice(0, 5).map(([id]) => id);

    const { data: topPosts } = topIds.length
      ? await supabase.from("blog_posts").select("id, title, slug").in("id", topIds)
      : { data: [] as any[] };
    const { data: lowPosts } = lowIds.length
      ? await supabase.from("blog_posts").select("id, title, slug").in("id", lowIds)
      : { data: [] as any[] };

    return {
      counts: {
        total: totalRes.count ?? 0,
        published: pubRes.count ?? 0,
        drafts: draftRes.count ?? 0,
        scheduled: schedRes.count ?? 0,
      },
      traffic: {
        views: traffic.views,
        clicks: traffic.clicks,
        impressions: traffic.impressions,
        ctr: Number(ctr.toFixed(2)),
        avgPosition: Number(avgPosition.toFixed(2)),
      },
      recentlyPublished: recentPubRes.data ?? [],
      recentlyUpdated: recentUpdRes.data ?? [],
      topPerformers: (topPosts ?? []).map((p: any) => ({ ...p, views: perfMap.get(p.id) ?? 0 })),
      lowPerformers: (lowPosts ?? []).map((p: any) => ({ ...p, views: perfMap.get(p.id) ?? 0 })),
    };
  });

// ==================== AI BLOG GENERATOR ====================

const GenerateInput = z.object({
  primary_keyword: z.string().min(2),
  secondary_keywords: z.array(z.string()).default([]),
  topic: z.string().optional(),
  angle: z.enum(["guide", "tutorial", "comparison", "review", "roadmap", "listicle", "news"]).default("guide"),
  target_words: z.union([z.literal(1000), z.literal(2000), z.literal(3000), z.literal(5000), z.literal(10000)]).default(2000),
  audience: z.string().optional(),
  location: z.string().optional(),
  category: z.string().optional(),
  save_as_draft: z.boolean().default(true),
  provider: z.enum(["gemini", "openai"]).default("gemini"),
});

export const generateBlogWithAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => GenerateInput.parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const supabase = context.supabase;

    const model = data.provider === "openai" ? "openai/gpt-5.4-mini" : "google/gemini-3.5-flash";
    const prompt = `Write a SEO-optimized ${data.angle} blog post.

Primary keyword: "${data.primary_keyword}"
Secondary keywords: ${data.secondary_keywords.join(", ") || "(none)"}
Topic: ${data.topic || data.primary_keyword}
Target audience: ${data.audience || "learners and career switchers"}
${data.location ? `Location: ${data.location}` : ""}
Target length: ~${data.target_words} words.

Return strict JSON:
{
  "seo_title": "<= 60 chars, includes primary keyword",
  "meta_description": "<= 160 chars, compelling",
  "slug": "url-safe kebab-case slug",
  "intro": "engaging 2-paragraph intro",
  "content_markdown": "the full blog in Markdown with proper H2/H3 hierarchy, tables, bullet lists, callouts, and a strong CTA at the end. Do not include the H1 (it is added separately).",
  "faqs": [{"question": "...", "answer": "..."}, ...5 items],
  "keywords": ["...", "..."],
  "reading_time_minutes": 8,
  "image_prompts": {"featured": "...", "thumbnail": "...", "social": "..."},
  "internal_link_suggestions": ["/programs/ai", "/blog/some-related-topic"],
  "cta": "..."
}

Write helpful, human, non-fluffy prose. Avoid keyword stuffing. Use semantic LSI variations naturally.`;

    const ai = await callLovableAiJson<any>({ messages: [{ role: "user", content: prompt }], model });

    let saved: any = null;
    if (data.save_as_draft && ai?.content_markdown) {
      const slug = slugify(ai.slug || ai.seo_title || data.primary_keyword) + "-" + Date.now().toString(36).slice(-5);
      const wc = wordCount(ai.content_markdown);
      const rt = ai.reading_time_minutes || Math.max(1, Math.round(wc / 220));
      const insert = await supabase
        .from("blog_posts")
        .insert({
          slug,
          title: ai.seo_title || data.primary_keyword,
          short_summary: ai.meta_description,
          intro: ai.intro,
          content_markdown: ai.content_markdown,
          seo_title: ai.seo_title,
          seo_description: ai.meta_description,
          keywords: ai.keywords || [data.primary_keyword, ...data.secondary_keywords],
          faqs: ai.faqs || [],
          status: "draft",
          is_published: false,
          reading_time_minutes: rt,
        })
        .select("id, slug, title")
        .maybeSingle();
      saved = insert.data;
    }
    return { ai, blog: saved };
  });

// ==================== PROGRAMMATIC BULK GENERATION ====================

const BulkInput = z.object({
  template: z.string().min(5), // "Best {course} Course in {city}"
  variables: z.record(z.array(z.string())), // { course: ["AI","ML"], city: ["Bangalore","Hyderabad"] }
  angle: z.string().default("guide"),
  target_words: z.number().int().min(500).max(10000).default(1200),
  auto_publish: z.boolean().default(false),
});

export const startProgrammaticJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => BulkInput.parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const supabase = context.supabase;

    // Expand cartesian product of variables
    const keys = Object.keys(data.variables);
    const combos: Record<string, string>[] = [];
    const walk = (idx: number, current: Record<string, string>) => {
      if (idx === keys.length) { combos.push({ ...current }); return; }
      for (const v of data.variables[keys[idx]] ?? []) {
        current[keys[idx]] = v; walk(idx + 1, current);
      }
    };
    walk(0, {});

    if (combos.length === 0 || combos.length > 500) {
      throw new Error("Combo count must be 1-500");
    }

    const titles = combos.map((c) => {
      let t = data.template;
      for (const k of keys) t = t.replaceAll(`{${k}}`, c[k]);
      return { title: t, vars: c };
    });

    const { data: job } = await supabase
      .from("blog_generation_jobs")
      .insert({
        created_by: context.userId,
        job_type: "programmatic",
        title: data.template,
        input_payload: { template: data.template, variables: data.variables, titles, angle: data.angle, target_words: data.target_words, auto_publish: data.auto_publish },
        status: "queued",
        total_items: titles.length,
      })
      .select()
      .maybeSingle();

    return { job, count: titles.length };
  });

export const processProgrammaticJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ job_id: z.string().uuid(), batch: z.number().int().min(1).max(5).default(3) }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const supabase = context.supabase;
    const { data: job } = await supabase.from("blog_generation_jobs").select("*").eq("id", data.job_id).maybeSingle();
    if (!job) throw new Error("Job not found");
    if (job.status === "completed" || job.status === "cancelled") return { done: true, job };

    const payload = job.input_payload as any;
    const titles: any[] = Array.isArray((payload as any)?.titles) ? (payload as any).titles : [];
    const start = job.completed_items + job.failed_items;
    const slice = titles.slice(start, start + data.batch);

    await supabase.from("blog_generation_jobs").update({ status: "running", started_at: job.started_at ?? new Date().toISOString() }).eq("id", job.id);

    let completed = job.completed_items;
    let failed = job.failed_items;
    const outputs = [...(job.output_blog_ids ?? [])];
    const errors: any[] = Array.isArray(job.error_log) ? [...(job.error_log as any[])] : [];

    for (const item of slice) {
      try {
        const prompt = `Write a SEO blog titled "${item.title}". Target ~${payload.target_words} words. Angle: ${payload.angle}. Return JSON with keys: seo_title, meta_description, slug, intro, content_markdown, faqs (5), keywords, reading_time_minutes.`;
        const ai = await callLovableAiJson<any>({ messages: [{ role: "user", content: prompt }], model: "google/gemini-3.5-flash" });
        const slug = slugify(ai.slug || item.title) + "-" + Date.now().toString(36).slice(-4);
        const wc = wordCount(ai.content_markdown);
        const { data: post } = await supabase.from("blog_posts").insert({
          slug,
          title: ai.seo_title || item.title,
          short_summary: ai.meta_description,
          intro: ai.intro,
          content_markdown: ai.content_markdown,
          seo_title: ai.seo_title,
          seo_description: ai.meta_description,
          keywords: ai.keywords || [],
          faqs: ai.faqs || [],
          status: payload.auto_publish ? "published" : "draft",
          is_published: !!payload.auto_publish,
          published_at: payload.auto_publish ? new Date().toISOString() : null,
          reading_time_minutes: ai.reading_time_minutes || Math.max(1, Math.round(wc / 220)),
        }).select("id").maybeSingle();
        if (post?.id) { outputs.push(post.id); completed++; }
      } catch (e: any) {
        failed++;
        errors.push({ title: item.title, error: String(e?.message ?? e) });
      }
    }

    const isDone = completed + failed >= titles.length;
    await supabase.from("blog_generation_jobs").update({
      completed_items: completed,
      failed_items: failed,
      output_blog_ids: outputs,
      error_log: errors,
      status: isDone ? "completed" : "running",
      completed_at: isDone ? new Date().toISOString() : null,
    }).eq("id", job.id);

    return { done: isDone, completed, failed, total: titles.length };
  });

export const listGenerationJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const { data } = await context.supabase
      .from("blog_generation_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    return { jobs: data ?? [] };
  });

// ==================== SEO SCORE ====================

export const scoreBlogSeo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ blog_post_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const supabase = context.supabase;
    const { data: post } = await supabase.from("blog_posts").select("*").eq("id", data.blog_post_id).maybeSingle();
    if (!post) throw new Error("Post not found");

    const md = post.content_markdown || "";
    const wc = wordCount(md);
    const primary = (post.keywords || [])[0] || "";
    const primaryLower = primary.toLowerCase();
    const h2Count = (md.match(/^##\s/gm) || []).length;
    const h3Count = (md.match(/^###\s/gm) || []).length;
    const imgCount = (md.match(/!\[[^\]]*\]\([^)]+\)/g) || []).length;
    const linkCount = (md.match(/\[[^\]]+\]\([^)]+\)/g) || []).length;
    const kwDensity = primaryLower && wc > 0 ? ((md.toLowerCase().split(primaryLower).length - 1) / wc) * 100 : 0;

    const wordCountScore = wc >= 1500 ? 100 : wc >= 800 ? 80 : wc >= 400 ? 60 : 30;
    const headingsScore = h2Count >= 4 && h3Count >= 3 ? 100 : h2Count >= 3 ? 80 : h2Count >= 1 ? 60 : 30;
    const imagesScore = imgCount >= 3 ? 100 : imgCount >= 1 ? 70 : 30;
    const linksScore = linkCount >= 5 ? 100 : linkCount >= 2 ? 70 : 30;
    const metaScore = (post.seo_title && post.seo_title.length <= 65 ? 50 : 25) + (post.seo_description && post.seo_description.length <= 165 ? 50 : 25);
    const keywordScore = kwDensity >= 0.5 && kwDensity <= 2.5 ? 100 : kwDensity > 0 ? 60 : 30;
    const schemaScore = post.schema_jsonld ? 100 : 50;
    const readabilityScore = wc > 0 ? Math.min(100, Math.max(40, 100 - Math.floor((md.split(/\s+/).length / (md.split(/[.!?]/).length || 1)) - 15) * 3)) : 50;

    const overall = Math.round(
      keywordScore * 0.18 + readabilityScore * 0.12 + headingsScore * 0.14 + linksScore * 0.12 +
      imagesScore * 0.10 + metaScore * 0.15 + schemaScore * 0.09 + wordCountScore * 0.10,
    );

    const suggestions: string[] = [];
    if (wc < 1500) suggestions.push(`Expand content — currently ${wc} words, aim for 1500+.`);
    if (kwDensity < 0.5) suggestions.push(`Increase primary keyword usage (current density ${kwDensity.toFixed(2)}%).`);
    if (kwDensity > 2.5) suggestions.push(`Reduce keyword stuffing (density ${kwDensity.toFixed(2)}%).`);
    if (h2Count < 4) suggestions.push("Add more H2 sections for better structure.");
    if (imgCount < 3) suggestions.push("Add more images with descriptive ALT text.");
    if (linkCount < 5) suggestions.push("Add more internal + external links.");
    if (!post.schema_jsonld) suggestions.push("Add Article + FAQ JSON-LD schema.");
    if (!post.seo_title || post.seo_title.length > 65) suggestions.push("Tighten SEO title to under 60 chars.");
    if (!post.seo_description || post.seo_description.length > 165) suggestions.push("Tighten meta description to under 160 chars.");

    const { data: scoreRow } = await supabase.from("blog_seo_scores").insert({
      blog_post_id: post.id,
      overall_score: overall,
      keyword_score: keywordScore,
      readability_score: readabilityScore,
      headings_score: headingsScore,
      links_score: linksScore,
      images_score: imagesScore,
      meta_score: metaScore,
      schema_score: schemaScore,
      word_count: wc,
      suggestions,
    }).select().maybeSingle();

    return { score: scoreRow, breakdown: { wc, kwDensity, h2Count, h3Count, imgCount, linkCount } };
  });

// ==================== SCHEDULER ====================

export const scheduleBlog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    blog_post_id: z.string().uuid(),
    scheduled_for: z.string(),
    recurrence: z.enum(["once", "daily", "weekly", "monthly"]).default("once"),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const supabase = context.supabase;
    const { data: sched } = await supabase.from("blog_schedules").insert({
      blog_post_id: data.blog_post_id,
      scheduled_for: data.scheduled_for,
      recurrence: data.recurrence,
      created_by: context.userId,
    }).select().maybeSingle();
    await supabase.from("blog_posts").update({ status: "scheduled" }).eq("id", data.blog_post_id);
    return { schedule: sched };
  });

export const listSchedules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const { data } = await context.supabase
      .from("blog_schedules")
      .select("*, blog_posts(id,title,slug,status)")
      .order("scheduled_for", { ascending: true })
      .limit(100);
    return { schedules: data ?? [] };
  });

// ==================== REFRESH OLD BLOGS ====================

export const refreshBlogWithAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ blog_post_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const supabase = context.supabase;
    const { data: post } = await supabase.from("blog_posts").select("*").eq("id", data.blog_post_id).maybeSingle();
    if (!post) throw new Error("Not found");

    // Save revision snapshot first
    const { data: rev } = await supabase.from("blog_revisions").select("revision_number").eq("blog_post_id", post.id).order("revision_number", { ascending: false }).limit(1).maybeSingle();
    const nextRev = (rev?.revision_number ?? 0) + 1;
    await supabase.from("blog_revisions").insert({
      blog_post_id: post.id,
      revision_number: nextRev,
      title: post.title,
      content_markdown: post.content_markdown,
      seo_title: post.seo_title,
      seo_description: post.seo_description,
      snapshot: post,
      edited_by: context.userId,
      edit_note: "AI refresh snapshot",
    });

    const prompt = `Refresh this ${new Date(post.updated_at).toISOString().slice(0,10)} blog post for ${new Date().getFullYear()}.
Title: ${post.title}

Existing content:
${(post.content_markdown || "").slice(0, 8000)}

Return JSON: { seo_title, meta_description, content_markdown (updated, current year stats and examples, improved structure), faqs, keywords, changelog (array of what changed) }.`;
    const ai = await callLovableAiJson<any>({ messages: [{ role: "user", content: prompt }], model: "google/gemini-3.5-flash" });

    const wc = wordCount(ai.content_markdown);
    await supabase.from("blog_posts").update({
      title: ai.seo_title || post.title,
      seo_title: ai.seo_title,
      seo_description: ai.meta_description,
      short_summary: ai.meta_description,
      content_markdown: ai.content_markdown,
      keywords: ai.keywords || post.keywords,
      faqs: ai.faqs || post.faqs,
      reading_time_minutes: Math.max(1, Math.round(wc / 220)),
      editorial_updated_at: new Date().toISOString(),
    }).eq("id", post.id);

    return { changelog: ai.changelog || [], revision: nextRev };
  });

// ==================== AUDIT REPORT ====================

export const generateBlogAuditReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const supabase = context.supabase;
    const [{ count: total }, { count: pub }, { count: withSchema }, { count: recent }] = await Promise.all([
      supabase.from("blog_posts").select("id", { count: "exact", head: true }),
      supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("blog_posts").select("id", { count: "exact", head: true }).not("schema_jsonld", "is", null),
      supabase.from("blog_posts").select("id", { count: "exact", head: true }).gte("updated_at", new Date(Date.now() - 30 * 86400_000).toISOString()),
    ]);

    return {
      generated_at: new Date().toISOString(),
      totals: { total: total ?? 0, published: pub ?? 0, with_schema: withSchema ?? 0, updated_last_30d: recent ?? 0 },
      architecture: [
        "Unified Blog OS at /admin/blog-os and /brand/blog-os",
        "Supporting tables: blog_generation_jobs, blog_seo_scores, blog_schedules, blog_analytics_daily, blog_revisions",
        "Multi-provider AI (Gemini + OpenAI) via Lovable AI Gateway with 60s response cache",
      ],
      seo_features: [
        "Live SEO scorer with 8 sub-scores",
        "Article/FAQ/Breadcrumb JSON-LD",
        "Auto meta title/description generation",
        "Programmatic city × keyword × technology matrix generation",
      ],
      ai_features: [
        "Single-blog AI generator with 1k-10k word targeting",
        "Bulk programmatic generator with cartesian expansion (up to 500 posts/job)",
        "AI refresh with automatic revision snapshotting",
        "Image/thumbnail/social prompt generation",
      ],
      opportunities: [
        "Wire pg_cron worker to auto-process queued programmatic jobs",
        "Wire pg_cron worker to publish due blog_schedules rows",
        "Integrate Search Console API for real impression/CTR data",
        "Add plagiarism + AI-content detection check pre-publish",
      ],
    };
  });
