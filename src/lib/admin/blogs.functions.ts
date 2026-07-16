/**
 * Admin CMS: Blog posts, topics, categories.
 * All fns are gated with requireSupabaseAuth + is_admin RPC.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function ensureAdmin(context: any) {
  const { data, error } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
  if (error) throw new Error("Failed to verify admin");
  if (!data) throw new Error("Forbidden");
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
}
function wordCount(s: string | null | undefined) {
  if (!s) return 0;
  return s
    .replace(/`{1,3}[\s\S]*?`{1,3}/g, " ")
    .replace(/[#>*_\-\[\]()!]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}
function readingTime(wc: number) {
  return Math.max(1, Math.round(wc / 220));
}

// ==================== LIST ====================

const ListInput = z.object({
  q: z.string().optional(),
  status: z.enum(["draft", "in_review", "scheduled", "published", "archived"]).optional(),
  topic: z.string().optional(),
  category: z.string().optional(),
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
});

export const listBlogPosts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ListInput.parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    let q = context.supabase
      .from("blog_posts")
      .select(
        "id, slug, title, subtitle, short_summary, topic_id, category_id, author_display_name, thumbnail_url, hero_image_url, is_featured, is_trending, status, is_published, published_at, editorial_updated_at, reading_time_minutes, display_order, updated_at, topic:blog_topics(id,name,slug), category:blog_categories(id,name,slug)",
        { count: "exact" },
      )
      .order("updated_at", { ascending: false })
      .range(data.offset, data.offset + data.limit - 1);
    if (data.status) q = q.eq("status", data.status);
    if (data.topic) q = q.eq("topic_id", data.topic);
    if (data.category) q = q.eq("category_id", data.category);
    if (data.q) {
      const s = data.q.replace(/[%_]/g, "");
      q = q.or(`title.ilike.%${s}%,slug.ilike.%${s}%,short_summary.ilike.%${s}%`);
    }
    const { data: rows, error, count } = await q;
    if (error) throw error;

    const [topics, categories, totals] = await Promise.all([
      context.supabase.from("blog_topics").select("id, name, slug").order("display_order"),
      context.supabase.from("blog_categories").select("id, name, slug").order("display_order"),
      context.supabase.from("blog_posts").select("status"),
    ]);
    const counts = { total: 0, draft: 0, in_review: 0, scheduled: 0, published: 0, archived: 0 };
    for (const r of (totals.data ?? []) as Array<{ status: string }>) {
      counts.total += 1;
      if (r.status in counts) (counts as any)[r.status] += 1;
    }
    return {
      rows: rows ?? [],
      count: count ?? 0,
      counts,
      topics: topics.data ?? [],
      categories: categories.data ?? [],
    };
  });

// ==================== GET ====================

export const getBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { data: post, error } = await context.supabase
      .from("blog_posts")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    if (!post) throw new Error("Not found");
    return post;
  });

// ==================== UPSERT ====================

const FaqSchema = z.array(z.object({ question: z.string(), answer: z.string() })).default([]);

const UpsertInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().optional(),
  title: z.string().min(1),
  subtitle: z.string().optional().nullable(),
  short_summary: z.string().default(""),
  intro: z.string().optional().nullable(),
  content_markdown: z.string().default(""),
  topic_id: z.string().uuid().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  author_display_name: z.string().default("Glintr Editorial"),
  author_display_role: z.string().optional().nullable(),
  author_bio: z.string().optional().nullable(),
  reviewer_display_name: z.string().optional().nullable(),
  reviewer_display_role: z.string().optional().nullable(),
  skill_level: z.string().optional().nullable(),
  featured_image_url: z.string().optional().nullable(),
  thumbnail_url: z.string().optional().nullable(),
  hero_image_url: z.string().optional().nullable(),
  social_image_url: z.string().optional().nullable(),
  faqs: FaqSchema,
  is_featured: z.boolean().default(false),
  is_trending: z.boolean().default(false),
  status: z.enum(["draft", "in_review", "scheduled", "published", "archived"]).default("draft"),
  published_at: z.string().nullable().optional(),
  display_order: z.number().int().default(0),
  seo_title: z.string().optional().nullable(),
  seo_description: z.string().optional().nullable(),
  keywords: z.array(z.string()).default([]),
  related_blog_slugs: z.array(z.string()).default([]),
  related_course_slugs: z.array(z.string()).default([]),
  schema_jsonld: z.any().optional().nullable(),
});

export const upsertBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpsertInput.parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const s = context.supabase;

    const wc = wordCount(data.content_markdown);
    const rt = readingTime(wc);
    const isPublished = data.status === "published";
    const now = new Date().toISOString();

    const baseSlug = data.slug?.trim() ? slugify(data.slug) : slugify(data.title);
    // Ensure unique slug
    let finalSlug = baseSlug || `post-${Date.now()}`;
    for (let i = 0; i < 20; i++) {
      const { data: clash } = await s
        .from("blog_posts")
        .select("id")
        .eq("slug", finalSlug)
        .maybeSingle();
      if (!clash || clash.id === data.id) break;
      finalSlug = `${baseSlug}-${i + 2}`;
    }

    const payload = {
      slug: finalSlug,
      title: data.title,
      subtitle: data.subtitle ?? null,
      short_summary: data.short_summary ?? "",
      intro: data.intro ?? null,
      content_markdown: data.content_markdown ?? "",
      topic_id: data.topic_id ?? null,
      category_id: data.category_id ?? null,
      author_display_name: data.author_display_name,
      author_display_role: data.author_display_role ?? null,
      author_bio: data.author_bio ?? null,
      reviewer_display_name: data.reviewer_display_name ?? null,
      reviewer_display_role: data.reviewer_display_role ?? null,
      skill_level: data.skill_level ?? null,
      featured_image_url: data.featured_image_url ?? null,
      thumbnail_url: data.thumbnail_url ?? null,
      hero_image_url: data.hero_image_url ?? null,
      social_image_url: data.social_image_url ?? null,
      faqs: data.faqs ?? [],
      is_featured: data.is_featured,
      is_trending: data.is_trending,
      status: data.status,
      is_published: isPublished,
      published_at: isPublished ? (data.published_at ?? now) : (data.published_at ?? null),
      display_order: data.display_order,
      seo_title: data.seo_title ?? null,
      seo_description: data.seo_description ?? null,
      keywords: data.keywords ?? [],
      related_blog_slugs: data.related_blog_slugs ?? [],
      related_course_slugs: data.related_course_slugs ?? [],
      schema_jsonld: data.schema_jsonld ?? null,
      reading_time_minutes: rt,
      editorial_updated_at: now,
    };

    if (data.id) {
      const { data: row, error } = await s
        .from("blog_posts")
        .update(payload)
        .eq("id", data.id)
        .select("id, slug")
        .single();
      if (error) throw error;
      return row;
    }
    const { data: row, error } = await s
      .from("blog_posts")
      .insert(payload)
      .select("id, slug")
      .single();
    if (error) throw error;
    return row;
  });

// ==================== DELETE ====================

export const deleteBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { error } = await context.supabase.from("blog_posts").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ==================== QUICK PATCH (status, flags) ====================

const PatchInput = z.object({
  id: z.string().uuid(),
  status: z.enum(["draft", "in_review", "scheduled", "published", "archived"]).optional(),
  is_featured: z.boolean().optional(),
  is_trending: z.boolean().optional(),
});

export const patchBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => PatchInput.parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const patch: Record<string, any> = { editorial_updated_at: new Date().toISOString() };
    if (data.status !== undefined) {
      patch.status = data.status;
      patch.is_published = data.status === "published";
      if (data.status === "published") {
        const { data: cur } = await context.supabase
          .from("blog_posts")
          .select("published_at")
          .eq("id", data.id)
          .maybeSingle();
        if (!cur?.published_at) patch.published_at = new Date().toISOString();
      }
    }
    if (data.is_featured !== undefined) patch.is_featured = data.is_featured;
    if (data.is_trending !== undefined) patch.is_trending = data.is_trending;

    const { error } = await context.supabase.from("blog_posts").update(patch as any).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
