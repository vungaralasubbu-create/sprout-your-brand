/**
 * Knowledge Base — server functions.
 *
 * - Public: list categories, list articles, get article by slug, related & recommendations, search, submit feedback, ask AI.
 * - Admin: create/update/delete categories & articles, AI-generate articles, list versions, publish/unpublish.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callLovableAiJson, callLovableAiText, isAiAvailable } from "@/lib/ai-gateway.server";
import { z } from "zod";

const KB_KINDS = ["article", "faq", "documentation", "tutorial", "guide", "walkthrough", "video"] as const;
export type KbKind = (typeof KB_KINDS)[number];

function slugify(s: string) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
}

async function assertAdmin(context: any) {
  const { data } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
  if (!data) throw new Error("Admin access required");
}

// ---------- Public reads ----------

export const listKbCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: categories } = await supabase
    .from("kb_categories")
    .select("id, slug, name, description, icon, color, parent_id, position")
    .eq("published", true)
    .order("position", { ascending: true });
  const { data: counts } = await supabase
    .from("kb_articles")
    .select("category_id")
    .eq("published", true);
  const countMap: Record<string, number> = {};
  (counts || []).forEach((r: any) => {
    if (r.category_id) countMap[r.category_id] = (countMap[r.category_id] || 0) + 1;
  });
  return {
    categories: (categories || []).map((c: any) => ({ ...c, article_count: countMap[c.id] || 0 })),
  };
});

export const listKbArticles = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({
      category_slug: z.string().optional(),
      kind: z.enum(KB_KINDS).optional(),
      q: z.string().optional(),
      limit: z.number().min(1).max(100).default(30),
      featured_only: z.boolean().optional(),
    }).parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    let categoryId: string | null = null;
    if (data.category_slug) {
      const { data: cat } = await supabase
        .from("kb_categories").select("id").eq("slug", data.category_slug).maybeSingle();
      categoryId = cat?.id ?? null;
      if (!categoryId) return { articles: [] };
    }
    let q = supabase
      .from("kb_articles")
      .select("id, slug, title, kind, summary, cover_image, tags, category_id, view_count, helpful_count, featured, reading_time, updated_at")
      .eq("published", true)
      .order("featured", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(data.limit);
    if (categoryId) q = q.eq("category_id", categoryId);
    if (data.kind) q = q.eq("kind", data.kind);
    if (data.featured_only) q = q.eq("featured", true);
    if (data.q && data.q.trim()) {
      const term = data.q.trim().replace(/[%_]/g, "");
      q = q.or(`title.ilike.%${term}%,summary.ilike.%${term}%,body_md.ilike.%${term}%`);
    }
    const { data: articles } = await q;
    return { articles: articles || [] };
  });

export const getKbArticle = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: article } = await supabase
      .from("kb_articles")
      .select("*")
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    if (!article) return { article: null, related: [], category: null };
    const { data: category } = article.category_id
      ? await supabase.from("kb_categories").select("id, slug, name, icon, color").eq("id", article.category_id).maybeSingle()
      : { data: null };

    // Related: by explicit related_ids, else same category, else same tags
    let related: any[] = [];
    if (Array.isArray(article.related_ids) && article.related_ids.length) {
      const { data } = await supabase
        .from("kb_articles")
        .select("id, slug, title, kind, summary")
        .in("id", article.related_ids)
        .eq("published", true);
      related = data || [];
    }
    if (related.length < 4 && article.category_id) {
      const { data } = await supabase
        .from("kb_articles")
        .select("id, slug, title, kind, summary")
        .eq("category_id", article.category_id)
        .eq("published", true)
        .neq("id", article.id)
        .limit(6);
      const seen = new Set(related.map((r) => r.id));
      (data || []).forEach((r: any) => { if (!seen.has(r.id) && related.length < 6) related.push(r); });
    }

    // Fire-and-forget view increment via admin client (safe, single-column)
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.rpc("kb_increment_view", { _id: article.id }).then(() => {}, () => {
        // rpc might not exist; fall back to direct update
        return supabaseAdmin
          .from("kb_articles")
          .update({ view_count: (article.view_count || 0) + 1 })
          .eq("id", article.id);
      });
    } catch { /* non-fatal */ }

    return { article, related, category: category || null };
  });

export const kbRecommendations = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ limit: z.number().default(6) }).parse(d ?? {}))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: featured } = await supabase
      .from("kb_articles")
      .select("id, slug, title, kind, summary, cover_image")
      .eq("published", true)
      .order("featured", { ascending: false })
      .order("view_count", { ascending: false })
      .limit(data.limit);
    return { articles: featured || [] };
  });

export const submitKbFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      article_id: z.string().uuid(),
      helpful: z.boolean(),
      comment: z.string().max(2000).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("kb_feedback").insert({
      article_id: data.article_id,
      helpful: data.helpful,
      comment: data.comment ?? null,
      user_id: context.userId,
    });
    if (error) throw new Error(error.message);
    // Bump counters via admin
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const col = data.helpful ? "helpful_count" : "unhelpful_count";
    const { data: row } = await supabaseAdmin.from("kb_articles").select(col).eq("id", data.article_id).maybeSingle();
    await supabaseAdmin
      .from("kb_articles")
      .update({ [col]: ((row as any)?.[col] || 0) + 1 })
      .eq("id", data.article_id);
    return { ok: true };
  });

// ---------- AI chatbot ----------

export const askKbAi = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      question: z.string().min(2).max(1000),
      history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).max(20).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    if (!isAiAvailable()) {
      return { answer: "AI is not configured. Please browse categories or search articles.", sources: [] };
    }
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const term = data.question.trim().replace(/[%_]/g, "").slice(0, 80);
    const { data: candidates } = await supabase
      .from("kb_articles")
      .select("id, slug, title, kind, summary, body_md")
      .eq("published", true)
      .or(`title.ilike.%${term}%,summary.ilike.%${term}%,body_md.ilike.%${term}%`)
      .limit(6);

    const sources = (candidates || []).map((a: any) => ({
      id: a.id, slug: a.slug, title: a.title, kind: a.kind,
    }));
    const context = (candidates || [])
      .map((a: any, i: number) => `[${i + 1}] ${a.title}\n${(a.summary || "").slice(0, 300)}\n${(a.body_md || "").slice(0, 1200)}`)
      .join("\n\n---\n\n");

    const historyText = (data.history || [])
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n");

    try {
      const answer = await callLovableAiText({
        messages: [
          {
            role: "system",
            content:
              "You are Glintr's Knowledge Base assistant. Answer briefly, warmly, and only from the provided articles when possible. If the answer is not present, say so and suggest browsing categories. Cite sources inline using [1], [2] matching the numbered articles.",
          },
          { role: "user", content: `Conversation so far:\n${historyText}\n\nUser question: ${data.question}\n\nKnowledge base excerpts:\n${context || "(none)"}` },
        ],
        temperature: 0.3,
      });
      return { answer: answer.trim(), sources };
    } catch (e: any) {
      return { answer: "I couldn't reach the AI service right now. Try the search or category browser.", sources };
    }
  });

// ---------- Admin: categories ----------

export const adminListKbCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data } = await context.supabase
      .from("kb_categories")
      .select("*")
      .order("position", { ascending: true });
    return { categories: data || [] };
  });

export const upsertKbCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      slug: z.string().min(1).optional(),
      name: z.string().min(1),
      description: z.string().optional(),
      icon: z.string().optional(),
      color: z.string().optional(),
      parent_id: z.string().uuid().nullable().optional(),
      position: z.number().optional(),
      published: z.boolean().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const payload: any = {
      slug: data.slug || slugify(data.name),
      name: data.name,
      description: data.description ?? null,
      icon: data.icon ?? null,
      color: data.color ?? null,
      parent_id: data.parent_id ?? null,
      position: data.position ?? 0,
      published: data.published ?? true,
    };
    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("kb_categories").update(payload).eq("id", data.id).select().single();
      if (error) throw new Error(error.message);
      return { category: row };
    }
    const { data: row, error } = await context.supabase
      .from("kb_categories").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return { category: row };
  });

export const deleteKbCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("kb_categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Admin: articles ----------

export const adminListKbArticles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    category_id: z.string().uuid().optional(),
    kind: z.enum(KB_KINDS).optional(),
    published: z.enum(["all", "published", "draft"]).default("all"),
    q: z.string().optional(),
    limit: z.number().max(200).default(100),
  }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = context.supabase
      .from("kb_articles")
      .select("id, slug, title, kind, summary, category_id, published, featured, view_count, helpful_count, unhelpful_count, updated_at, version")
      .order("updated_at", { ascending: false })
      .limit(data.limit);
    if (data.category_id) q = q.eq("category_id", data.category_id);
    if (data.kind) q = q.eq("kind", data.kind);
    if (data.published === "published") q = q.eq("published", true);
    if (data.published === "draft") q = q.eq("published", false);
    if (data.q) {
      const term = data.q.replace(/[%_]/g, "");
      q = q.or(`title.ilike.%${term}%,slug.ilike.%${term}%`);
    }
    const { data: rows } = await q;
    return { articles: rows || [] };
  });

export const getAdminKbArticle = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: article } = await context.supabase.from("kb_articles").select("*").eq("id", data.id).maybeSingle();
    const { data: versions } = await context.supabase
      .from("kb_article_versions")
      .select("id, version_number, title, note, created_at, created_by")
      .eq("article_id", data.id)
      .order("version_number", { ascending: false });
    const { data: feedback } = await context.supabase
      .from("kb_feedback")
      .select("id, helpful, comment, created_at")
      .eq("article_id", data.id)
      .order("created_at", { ascending: false })
      .limit(50);
    return { article, versions: versions || [], feedback: feedback || [] };
  });

const upsertArticleSchema = z.object({
  id: z.string().uuid().optional(),
  category_id: z.string().uuid().nullable().optional(),
  slug: z.string().optional(),
  title: z.string().min(1),
  kind: z.enum(KB_KINDS).default("article"),
  summary: z.string().optional(),
  body_md: z.string().optional(),
  video_url: z.string().url().optional().nullable(),
  cover_image: z.string().url().optional().nullable(),
  tags: z.array(z.string()).optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  seo_keywords: z.array(z.string()).optional(),
  related_ids: z.array(z.string().uuid()).optional(),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
  version_note: z.string().optional(),
});

function estimateReadingTime(md: string | undefined): number {
  if (!md) return 1;
  const words = md.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function buildArticleJsonLd(a: {
  title: string; summary?: string | null; body_md?: string | null; kind: KbKind; slug: string; updated_at?: string;
}) {
  const url = `https://glintr.com/help/${a.slug}`;
  if (a.kind === "faq") {
    // best-effort FAQ parsing from markdown "Q: / A:" or "## Question"
    const md = a.body_md || "";
    const pairs: { q: string; a: string }[] = [];
    const re = /(?:^|\n)#{1,3}\s+(.+?)\n([\s\S]+?)(?=\n#{1,3}\s+|$)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(md)) !== null) pairs.push({ q: m[1].trim(), a: m[2].trim() });
    if (pairs.length) {
      return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: pairs.map((p) => ({
          "@type": "Question",
          name: p.q,
          acceptedAnswer: { "@type": "Answer", text: p.a },
        })),
      };
    }
  }
  return {
    "@context": "https://schema.org",
    "@type": a.kind === "video" ? "VideoObject" : "TechArticle",
    headline: a.title,
    description: a.summary || undefined,
    url,
    dateModified: a.updated_at,
  };
}

export const upsertKbArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => upsertArticleSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const slug = (data.slug && slugify(data.slug)) || slugify(data.title);
    const readingTime = estimateReadingTime(data.body_md);

    let existing: any = null;
    if (data.id) {
      const { data: row } = await context.supabase.from("kb_articles").select("*").eq("id", data.id).maybeSingle();
      existing = row;
    }

    const jsonLd = buildArticleJsonLd({
      title: data.title, summary: data.summary, body_md: data.body_md, kind: data.kind, slug,
      updated_at: new Date().toISOString(),
    });

    const payload: any = {
      category_id: data.category_id ?? existing?.category_id ?? null,
      slug,
      title: data.title,
      kind: data.kind,
      summary: data.summary ?? null,
      body_md: data.body_md ?? null,
      video_url: data.video_url ?? null,
      cover_image: data.cover_image ?? null,
      tags: data.tags ?? existing?.tags ?? [],
      seo_title: data.seo_title ?? data.title,
      seo_description: data.seo_description ?? data.summary ?? null,
      seo_keywords: data.seo_keywords ?? [],
      related_ids: data.related_ids ?? [],
      published: data.published ?? existing?.published ?? false,
      featured: data.featured ?? existing?.featured ?? false,
      reading_time: readingTime,
      json_ld: jsonLd,
      author_id: context.userId,
    };

    if (existing) {
      // snapshot previous
      const nextVersion = (existing.version || 1) + 1;
      await context.supabase.from("kb_article_versions").insert({
        article_id: existing.id,
        version_number: existing.version || 1,
        title: existing.title,
        body_md: existing.body_md,
        summary: existing.summary,
        note: data.version_note || null,
        created_by: context.userId,
      });
      payload.version = nextVersion;
      const { data: row, error } = await context.supabase
        .from("kb_articles").update(payload).eq("id", existing.id).select().single();
      if (error) throw new Error(error.message);
      return { article: row };
    }

    const { data: row, error } = await context.supabase.from("kb_articles").insert(payload).select().single();
    if (error) throw new Error(error.message);
    // First version
    await context.supabase.from("kb_article_versions").insert({
      article_id: row.id, version_number: 1, title: row.title, body_md: row.body_md, summary: row.summary, note: "Initial version", created_by: context.userId,
    });
    return { article: row };
  });

export const deleteKbArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("kb_articles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const restoreKbVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ article_id: z.string().uuid(), version_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: v } = await context.supabase.from("kb_article_versions").select("*").eq("id", data.version_id).maybeSingle();
    if (!v) throw new Error("Version not found");
    const { data: current } = await context.supabase.from("kb_articles").select("*").eq("id", data.article_id).maybeSingle();
    if (!current) throw new Error("Article not found");
    // snapshot current before restoring
    await context.supabase.from("kb_article_versions").insert({
      article_id: current.id,
      version_number: current.version,
      title: current.title,
      body_md: current.body_md,
      summary: current.summary,
      note: `Snapshot before restoring v${v.version_number}`,
      created_by: context.userId,
    });
    const { error } = await context.supabase.from("kb_articles").update({
      title: v.title, body_md: v.body_md, summary: v.summary, version: (current.version || 1) + 1,
    }).eq("id", current.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- AI generation ----------

export const aiGenerateKbArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      topic: z.string().min(3),
      kind: z.enum(KB_KINDS).default("article"),
      category_id: z.string().uuid().nullable().optional(),
      audience: z.string().optional(),
      save: z.boolean().default(false),
      publish: z.boolean().default(false),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (!isAiAvailable()) throw new Error("AI service not configured");

    const kindPrompt: Record<KbKind, string> = {
      article: "an in-depth help article",
      faq: "a set of 6-10 FAQs formatted as `### Question` followed by an answer paragraph",
      documentation: "developer-style documentation with code snippets where useful",
      tutorial: "a step-by-step tutorial with numbered steps and expected outcomes",
      guide: "a comprehensive guide with an intro, chaptered sections, and a summary",
      walkthrough: "a first-time-user platform walkthrough with numbered steps and screenshots-style descriptions",
      video: "a short intro paragraph plus a video transcript/outline (assume the video URL is added separately)",
    };

    const json = await callLovableAiJson<{
      title: string;
      summary: string;
      body_md: string;
      tags: string[];
      seo_title: string;
      seo_description: string;
      seo_keywords: string[];
    }>({
      messages: [
        { role: "system", content: "You are Glintr's help-center content engineer. Write clear, warm, India-first help content. Return STRICT JSON only, no prose, no markdown fences." },
        {
          role: "user",
          content: `Produce ${kindPrompt[data.kind]} for the topic: "${data.topic}".
Audience: ${data.audience || "Glintr platform users"}.
Return JSON with keys: title (<= 70 chars), summary (150-200 chars, plain), body_md (600-1500 words markdown, use ## headings, bullets, and a "Next steps" section at the end), tags (5-8 short lowercase), seo_title (<= 60 chars), seo_description (<= 160 chars), seo_keywords (6-10).`,
        },
      ],
      temperature: 0.5,
    });

    if (!data.save) return { preview: json };

    const upserted = await upsertKbArticle({
      data: {
        title: json.title,
        summary: json.summary,
        body_md: json.body_md,
        kind: data.kind,
        category_id: data.category_id ?? null,
        tags: json.tags,
        seo_title: json.seo_title,
        seo_description: json.seo_description,
        seo_keywords: json.seo_keywords,
        published: data.publish,
        version_note: "AI-generated",
      } as any,
    });
    return { article: (upserted as any).article, preview: json };
  });

export const kbKinds = KB_KINDS;
