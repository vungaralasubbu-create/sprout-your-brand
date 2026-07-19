import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { callLovableAiJson, isAiAvailable } from "@/lib/ai-gateway.server";

async function ensureAdmin(context: any) {
  const { data, error } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
  if (error) throw new Error("Failed to verify admin");
  if (!data) throw new Error("Forbidden");
}

const CONTENT_TYPES = [
  "learn_guide","glossary","comparison","faq","roadmap",
  "career_guide","interview_guide","cheat_sheet","learning_path","program_support",
] as const;
const STATUSES = ["draft","in_review","approved","scheduled","published","archived"] as const;

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 90);
}
function wordCount(s: string | null | undefined) {
  if (!s) return 0;
  return s.replace(/`{1,3}[\s\S]*?`{1,3}/g, " ").replace(/[#>*_\-\[\]()!]/g, " ").split(/\s+/).filter(Boolean).length;
}
function readingTime(wc: number) { return Math.max(1, Math.round(wc / 220)); }

// ============ DASHBOARD ============

export const getContentDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const s = context.supabase;
    const now = new Date().toISOString();

    const [total, drafts, published, scheduled, review, recent, top] = await Promise.all([
      s.from("content_items").select("id", { count: "exact", head: true }),
      s.from("content_items").select("id", { count: "exact", head: true }).eq("status", "draft"),
      s.from("content_items").select("id", { count: "exact", head: true }).eq("status", "published"),
      s.from("content_items").select("id", { count: "exact", head: true }).eq("status", "scheduled"),
      s.from("content_items").select("id", { count: "exact", head: true }).eq("status", "in_review"),
      s.from("content_items")
        .select("id, title, type, status, slug, updated_at, view_count")
        .order("updated_at", { ascending: false }).limit(10),
      s.from("content_items")
        .select("id, title, type, slug, view_count, published_at")
        .eq("status", "published").order("view_count", { ascending: false }).limit(10),
    ]);

    const upcoming = await s.from("content_items")
      .select("id, title, type, slug, scheduled_for")
      .eq("status", "scheduled").gte("scheduled_for", now)
      .order("scheduled_for", { ascending: true }).limit(6);

    // Type breakdown
    const { data: byType } = await s.from("content_items").select("type, status");
    const typeBreakdown: Record<string, { total: number; published: number }> = {};
    for (const t of CONTENT_TYPES) typeBreakdown[t] = { total: 0, published: 0 };
    for (const r of (byType ?? []) as any[]) {
      if (typeBreakdown[r.type]) {
        typeBreakdown[r.type].total += 1;
        if (r.status === "published") typeBreakdown[r.type].published += 1;
      }
    }

    return {
      kpis: {
        total: total.count ?? 0,
        drafts: drafts.count ?? 0,
        published: published.count ?? 0,
        scheduled: scheduled.count ?? 0,
        review: review.count ?? 0,
      },
      recent: recent.data ?? [],
      top: top.data ?? [],
      upcoming: upcoming.data ?? [],
      typeBreakdown,
    };
  });

// ============ CONTENT LIST/GET/UPSERT ============

const ListInput = z.object({
  type: z.enum(CONTENT_TYPES).optional(),
  status: z.enum(STATUSES).optional(),
  q: z.string().optional(),
  category_id: z.string().uuid().optional(),
  tag: z.string().optional(),
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
});

export const listContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ListInput.parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    let q = context.supabase.from("content_items")
      .select("id, title, slug, type, status, summary, category_id, tag_slugs, author_id, updated_at, scheduled_for, published_at, view_count, word_count, reading_time_min", { count: "exact" })
      .order("updated_at", { ascending: false })
      .range(data.offset, data.offset + data.limit - 1);
    if (data.type) q = q.eq("type", data.type);
    if (data.status) q = q.eq("status", data.status);
    if (data.category_id) q = q.eq("category_id", data.category_id);
    if (data.tag) q = q.contains("tag_slugs", [data.tag]);
    if (data.q && data.q.trim()) {
      const pat = `%${data.q.trim()}%`;
      q = q.or(`title.ilike.${pat},slug.ilike.${pat},summary.ilike.${pat}`);
    }
    const { data: rows, count, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], count: count ?? 0 };
  });

export const getContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { data: item, error } = await context.supabase
      .from("content_items").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!item) throw new Error("Content not found");
    const [revs, comments, links] = await Promise.all([
      context.supabase.from("content_revisions")
        .select("id, revision_number, change_note, edited_by, created_at, status")
        .eq("content_id", data.id).order("revision_number", { ascending: false }).limit(50),
      context.supabase.from("content_comments")
        .select("id, body, anchor, resolved, author_name, created_at")
        .eq("content_id", data.id).order("created_at", { ascending: false }).limit(100),
      context.supabase.from("content_internal_links")
        .select("id, target_url, anchor_text, target_kind, target_content_id")
        .eq("source_content_id", data.id),
    ]);
    return { item, revisions: revs.data ?? [], comments: comments.data ?? [], links: links.data ?? [] };
  });

const UpsertInput = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(CONTENT_TYPES),
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(120).optional(),
  summary: z.string().max(500).optional().nullable(),
  body_markdown: z.string().default(""),
  featured_image: z.string().optional().nullable(),
  featured_image_alt: z.string().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  tag_slugs: z.array(z.string()).default([]),
  author_id: z.string().uuid().optional().nullable(),
  reviewer_id: z.string().uuid().optional().nullable(),
  seo_title: z.string().max(200).optional().nullable(),
  seo_description: z.string().max(300).optional().nullable(),
  canonical_url: z.string().optional().nullable(),
  og_image: z.string().optional().nullable(),
  focus_topic: z.string().max(120).optional().nullable(),
  related_topics: z.array(z.string()).default([]),
  schema_type: z.string().max(60).optional().nullable(),
  outline: z.any().optional(),
  metadata: z.any().optional(),
  change_note: z.string().max(240).optional(),
});

export const upsertContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpsertInput.parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const wc = wordCount(data.body_markdown);
    const rt = readingTime(wc);
    const slug = (data.slug && data.slug.trim()) ? slugify(data.slug) : slugify(data.title);

    const payload: any = {
      type: data.type,
      title: data.title,
      slug,
      summary: data.summary ?? null,
      body_markdown: data.body_markdown ?? "",
      featured_image: data.featured_image ?? null,
      featured_image_alt: data.featured_image_alt ?? null,
      category_id: data.category_id ?? null,
      tag_slugs: data.tag_slugs ?? [],
      author_id: data.author_id ?? null,
      reviewer_id: data.reviewer_id ?? null,
      seo_title: data.seo_title ?? null,
      seo_description: data.seo_description ?? null,
      canonical_url: data.canonical_url ?? null,
      og_image: data.og_image ?? null,
      focus_topic: data.focus_topic ?? null,
      related_topics: data.related_topics ?? [],
      schema_type: data.schema_type ?? null,
      outline: data.outline ?? [],
      metadata: data.metadata ?? {},
      word_count: wc,
      reading_time_min: rt,
      last_edited_by: context.userId,
    };

    let itemId = data.id;
    if (data.id) {
      const { data: current } = await context.supabase.from("content_items")
        .select("*").eq("id", data.id).maybeSingle();
      const { error } = await context.supabase.from("content_items").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      // Snapshot revision
      if (current) {
        const { data: last } = await context.supabase.from("content_revisions")
          .select("revision_number").eq("content_id", data.id).order("revision_number", { ascending: false }).limit(1).maybeSingle();
        const rn = ((last as any)?.revision_number ?? 0) + 1;
        await context.supabase.from("content_revisions").insert({
          content_id: data.id,
          revision_number: rn,
          title: current.title,
          body_markdown: current.body_markdown,
          status: current.status,
          snapshot: current,
          change_note: data.change_note ?? null,
          edited_by: context.userId,
        });
      }
    } else {
      payload.created_by = context.userId;
      const { data: row, error } = await context.supabase.from("content_items").insert(payload).select("id").maybeSingle();
      if (error) throw new Error(error.message);
      itemId = (row as any)?.id;
    }

    // Refresh internal links table from body
    if (itemId) {
      await context.supabase.from("content_internal_links").delete().eq("source_content_id", itemId);
      const linkMatches = Array.from((data.body_markdown ?? "").matchAll(/\[([^\]]+)\]\(([^)]+)\)/g));
      if (linkMatches.length) {
        const rows = linkMatches
          .map((m) => ({
            source_content_id: itemId!,
            target_url: m[2],
            anchor_text: m[1],
            target_kind: m[2].startsWith("http") ? "external" : "internal",
          }))
          .slice(0, 200);
        if (rows.length) await context.supabase.from("content_internal_links").insert(rows);
      }
    }

    return { id: itemId };
  });

export const changeContentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    id: z.string().uuid(),
    status: z.enum(STATUSES),
    scheduled_for: z.string().datetime().optional().nullable(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const patch: any = { status: data.status, last_edited_by: context.userId };
    if (data.status === "scheduled") patch.scheduled_for = data.scheduled_for ?? null;
    if (data.status === "published") patch.published_at = new Date().toISOString();
    if (data.status === "archived") patch.archived_at = new Date().toISOString();
    const { error } = await context.supabase.from("content_items").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { error } = await context.supabase.from("content_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ COMMENTS ============

export const addContentComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    content_id: z.string().uuid(),
    body: z.string().min(1).max(2000),
    anchor: z.string().optional(),
    author_name: z.string().optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { error } = await context.supabase.from("content_comments").insert({
      content_id: data.content_id,
      body: data.body,
      anchor: data.anchor ?? null,
      author_name: data.author_name ?? null,
      author_user_id: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleCommentResolved = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid(), resolved: z.boolean() }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { error } = await context.supabase.from("content_comments").update({ resolved: data.resolved }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ CATEGORIES / TAGS / AUTHORS ============

export const listCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const { data } = await context.supabase.from("content_categories").select("*").order("sort_order").order("name");
    return data ?? [];
  });

export const upsertCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).max(120),
    slug: z.string().optional(),
    description: z.string().optional().nullable(),
    parent_id: z.string().uuid().optional().nullable(),
    sort_order: z.number().int().default(0),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const slug = data.slug ? slugify(data.slug) : slugify(data.name);
    const payload = { name: data.name, slug, description: data.description ?? null, parent_id: data.parent_id ?? null, sort_order: data.sort_order };
    if (data.id) {
      const { error } = await context.supabase.from("content_categories").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("content_categories").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { error } = await context.supabase.from("content_categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listTags = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const { data } = await context.supabase.from("content_tags").select("*").order("usage_count", { ascending: false }).order("name").limit(500);
    return data ?? [];
  });

export const upsertTag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).max(80),
    slug: z.string().optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const slug = data.slug ? slugify(data.slug) : slugify(data.name);
    const payload = { name: data.name, slug };
    if (data.id) {
      const { error } = await context.supabase.from("content_tags").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("content_tags").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteTag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { error } = await context.supabase.from("content_tags").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAuthors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const { data } = await context.supabase.from("content_authors").select("*").order("name");
    return data ?? [];
  });

export const upsertAuthor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).max(120),
    slug: z.string().optional(),
    role: z.string().optional().nullable(),
    bio: z.string().optional().nullable(),
    avatar_url: z.string().optional().nullable(),
    socials: z.record(z.string(), z.string()).optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const slug = data.slug ? slugify(data.slug) : slugify(data.name);
    const payload = {
      name: data.name, slug,
      role: data.role ?? null, bio: data.bio ?? null,
      avatar_url: data.avatar_url ?? null, socials: data.socials ?? {},
    };
    if (data.id) {
      const { error } = await context.supabase.from("content_authors").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("content_authors").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteAuthor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { error } = await context.supabase.from("content_authors").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ MEDIA LIBRARY ============

export const listMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    folder: z.string().optional(),
    q: z.string().optional(),
    tag: z.string().optional(),
    limit: z.number().int().min(1).max(200).default(60),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    let q = context.supabase.from("content_media").select("*").order("created_at", { ascending: false }).limit(data.limit);
    if (data.folder && data.folder !== "all") q = q.eq("folder", data.folder);
    if (data.tag) q = q.contains("tags", [data.tag]);
    if (data.q) q = q.ilike("file_name", `%${data.q}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const { data: folders } = await context.supabase.from("content_media").select("folder");
    const foldersSet = Array.from(new Set((folders ?? []).map((r: any) => r.folder).filter(Boolean)));
    return { rows: rows ?? [], folders: foldersSet };
  });

export const registerMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    file_name: z.string(),
    storage_path: z.string(),
    public_url: z.string(),
    mime_type: z.string().optional(),
    size_bytes: z.number().optional(),
    folder: z.string().optional(),
    alt_text: z.string().optional(),
    caption: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { error, data: row } = await context.supabase.from("content_media").insert({
      file_name: data.file_name,
      storage_path: data.storage_path,
      public_url: data.public_url,
      mime_type: data.mime_type ?? null,
      size_bytes: data.size_bytes ?? null,
      folder: data.folder ?? "general",
      alt_text: data.alt_text ?? null,
      caption: data.caption ?? null,
      tags: data.tags ?? [],
      uploaded_by: context.userId,
    }).select("*").maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { data: item } = await context.supabase.from("content_media").select("storage_path").eq("id", data.id).maybeSingle();
    if (item?.storage_path) {
      await context.supabase.storage.from("content-media").remove([item.storage_path]);
    }
    const { error } = await context.supabase.from("content_media").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ INTERNAL LINK SUGGESTIONS ============

export const suggestInternalLinks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    id: z.string().uuid().optional(),
    text: z.string().default(""),
    topic: z.string().optional(),
    limit: z.number().int().default(15),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const words = new Set(
      (data.text + " " + (data.topic ?? "")).toLowerCase()
        .split(/[^a-z0-9]+/).filter((w) => w.length > 3).slice(0, 40)
    );
    let q = context.supabase.from("content_items")
      .select("id, title, slug, type, summary, focus_topic")
      .eq("status", "published").limit(120);
    if (data.id) q = q.neq("id", data.id);
    const { data: rows } = await q;
    const scored = (rows ?? []).map((r: any) => {
      const hay = `${r.title} ${r.slug} ${r.summary ?? ""} ${r.focus_topic ?? ""}`.toLowerCase();
      let score = 0;
      for (const w of words) if (hay.includes(w)) score += 1;
      return { ...r, score };
    }).filter((r) => r.score > 0).sort((a, b) => b.score - a.score).slice(0, data.limit);
    return scored;
  });

// ============ QUALITY CHECKER ============

export const runQualityChecks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { data: item } = await context.supabase.from("content_items").select("*").eq("id", data.id).maybeSingle();
    if (!item) throw new Error("Not found");
    const it: any = item;
    const md = String(it.body_markdown ?? "");
    const headings = md.match(/^#{1,3}\s.+$/gm) ?? [];
    const links = Array.from(md.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g));
    const externalLinks = links.filter((m) => m[2].startsWith("http"));
    const internalLinks = links.filter((m) => !m[2].startsWith("http"));
    const images = Array.from(md.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g));
    const missingAltImages = images.filter((m) => !m[1].trim()).length;
    const seoTitleLen = (it.seo_title ?? it.title ?? "").length;
    const seoDescLen = (it.seo_description ?? "").length;

    const checks = [
      { key: "title", label: "Title (30–70 chars)", pass: seoTitleLen >= 30 && seoTitleLen <= 70, detail: `${seoTitleLen} chars` },
      { key: "meta_desc", label: "Meta description (120–160 chars)", pass: seoDescLen >= 120 && seoDescLen <= 160, detail: `${seoDescLen} chars` },
      { key: "headings", label: "At least 3 headings", pass: headings.length >= 3, detail: `${headings.length} headings` },
      { key: "internal", label: "At least 2 internal links", pass: internalLinks.length >= 2, detail: `${internalLinks.length} internal links` },
      { key: "featured", label: "Featured image set", pass: Boolean(it.featured_image), detail: it.featured_image ? "✓" : "missing" },
      { key: "alt", label: "All images have alt text", pass: missingAltImages === 0, detail: missingAltImages ? `${missingAltImages} missing` : "✓" },
      { key: "canonical", label: "Canonical URL set", pass: Boolean(it.canonical_url), detail: it.canonical_url ? "✓" : "missing" },
      { key: "schema", label: "Schema type set", pass: Boolean(it.schema_type), detail: it.schema_type || "missing" },
      { key: "word_count", label: "Word count ≥ 500", pass: (it.word_count ?? 0) >= 500, detail: `${it.word_count ?? 0} words` },
      { key: "focus", label: "Focus topic set", pass: Boolean(it.focus_topic), detail: it.focus_topic || "missing" },
      { key: "category", label: "Category assigned", pass: Boolean(it.category_id), detail: it.category_id ? "✓" : "missing" },
      { key: "author", label: "Author assigned", pass: Boolean(it.author_id), detail: it.author_id ? "✓" : "missing" },
    ];
    const score = Math.round((checks.filter((c) => c.pass).length / checks.length) * 100);
    return { checks, score, externalLinks: externalLinks.length, internalLinks: internalLinks.length };
  });

// ============ AI WRITER ============

const AiWriterInput = z.object({
  topic: z.string().min(2).max(240),
  type: z.enum(CONTENT_TYPES),
  audience: z.string().max(240).optional(),
  keyPoints: z.array(z.string()).optional(),
  tone: z.string().optional(),
});

export const generateContentDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AiWriterInput.parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    if (!isAiAvailable()) throw new Error("AI service not configured");

    const typeGuidance: Record<string, string> = {
      learn_guide: "A comprehensive learn guide with intro, key sections (with h2 subheadings), examples, and takeaways.",
      glossary: "A definition-style entry: quick answer (2 sentences), full explanation, examples, related terms.",
      comparison: "Side-by-side comparison with an intro, criteria table, when to choose each, and verdict.",
      faq: "8–12 concise Q&A pairs written naturally.",
      roadmap: "Step-by-step roadmap grouped into 4–6 stages with recommended resources.",
      career_guide: "Career overview: what it is, skills, day-to-day, salary, path to enter, transitions.",
      interview_guide: "Common interview questions grouped by topic with concise sample answers and prep tips.",
      cheat_sheet: "Compact cheat sheet in tables/bullet lists — designed for quick reference.",
      learning_path: "Sequential path of 5–10 modules with clear goals and estimated time per module.",
      program_support: "Support article: problem summary, step-by-step resolution, related links.",
    };

    const sys = `You are a senior editor for Glintr, an EdTech platform. You produce accurate, non-hyperbolic educational content. Never fabricate statistics or brand names. Return ONLY JSON matching the requested schema.`;
    const usr = `Create a draft for a "${data.type.replace(/_/g, " ")}".
Topic: ${data.topic}
${data.audience ? `Audience: ${data.audience}` : ""}
${data.tone ? `Tone: ${data.tone}` : "Tone: clear, expert, friendly."}
${data.keyPoints?.length ? `Key points to cover:\n- ${data.keyPoints.join("\n- ")}` : ""}

Style: ${typeGuidance[data.type] ?? ""}

Return JSON with keys:
- title (string, <= 70 chars, includes the focus topic naturally)
- slug (kebab-case)
- seo_title (string, 40-65 chars)
- seo_description (string, 130-158 chars)
- summary (2-3 sentence editorial summary)
- focus_topic (string)
- related_topics (array of 3-8 strings)
- outline (array of { heading, level (2 or 3), points (array of short strings) })
- body_markdown (full article in Markdown, 800-1400 words, with H2/H3 headings, at least one bulleted list, and 2-3 internal-linkable phrases)
- faqs (array of 6-10 { question, answer })
- internal_link_suggestions (array of 4-8 short phrases we should link to Glintr programs / glossary / learn guides)
- glossary_suggestions (array of 3-8 term suggestions)
- comparison_suggestions (array of 2-4 comparison ideas as "X vs Y")
- learning_path_suggestions (array of 2-4 short strings)
- meta_reasoning (1 sentence editor note)

Return valid JSON only.`;

    const out = await callLovableAiJson<any>({
      messages: [{ role: "system", content: sys }, { role: "user", content: usr }],
      temperature: 0.55,
    });
    return out;
  });

// ============ REVISIONS ============

export const getRevision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { data: r, error } = await context.supabase.from("content_revisions").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    return r;
  });

export const restoreRevision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ revision_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { data: rev } = await context.supabase.from("content_revisions").select("*").eq("id", data.revision_id).maybeSingle();
    if (!rev) throw new Error("Revision not found");
    const snap: any = (rev as any).snapshot;
    const { error } = await context.supabase.from("content_items").update({
      title: snap.title, body_markdown: snap.body_markdown, summary: snap.summary,
      seo_title: snap.seo_title, seo_description: snap.seo_description,
      outline: snap.outline ?? [], last_edited_by: context.userId,
    }).eq("id", (rev as any).content_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ ANALYTICS ============

export const getContentAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid().optional() }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    if (data.id) {
      const [item, events] = await Promise.all([
        context.supabase.from("content_items")
          .select("id, title, view_count, avg_reading_time_sec, completion_rate, internal_click_count, published_at")
          .eq("id", data.id).maybeSingle(),
        context.supabase.from("content_analytics_events")
          .select("event_type, created_at, reading_time_sec, scroll_percent")
          .eq("content_id", data.id).order("created_at", { ascending: false }).limit(500),
      ]);
      return { item: item.data, events: events.data ?? [] };
    }
    const { data: rows } = await context.supabase.from("content_items")
      .select("id, title, type, view_count, avg_reading_time_sec, completion_rate, internal_click_count, published_at")
      .eq("status", "published").order("view_count", { ascending: false }).limit(30);
    return { rows: rows ?? [] };
  });

// ============ PUBLISHING QUEUE ============

export const getPublishingQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const [inReview, approved, scheduled] = await Promise.all([
      context.supabase.from("content_items").select("id, title, type, slug, updated_at, author_id").eq("status", "in_review").order("updated_at", { ascending: false }),
      context.supabase.from("content_items").select("id, title, type, slug, updated_at, author_id").eq("status", "approved").order("updated_at", { ascending: false }),
      context.supabase.from("content_items").select("id, title, type, slug, scheduled_for, author_id").eq("status", "scheduled").order("scheduled_for", { ascending: true }),
    ]);
    return {
      in_review: inReview.data ?? [],
      approved: approved.data ?? [],
      scheduled: scheduled.data ?? [],
    };
  });
