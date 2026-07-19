// Enterprise pSEO admin API — server functions (typed RPC).
// All handlers require an authenticated admin/super_admin.
// AI generation goes through the existing centralized AI Router (OpenAI).
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(ctx: { supabase: unknown; userId: string }) {
  const supabase = ctx.supabase as {
    rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
  };
  const [{ data: isSuper }, { data: isAdmin }] = await Promise.all([
    supabase.rpc("has_role", { _user_id: ctx.userId, _role: "super_admin" }),
    supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" }),
  ]);
  if (!isSuper && !isAdmin) throw new Error("Forbidden");
}

// ---------- Templates ----------
export const seedPseoTemplates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { seedTemplates } = await import("./template-registry.server");
    return seedTemplates();
  });

export const listPseoTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ pageType: z.string().optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { listTemplates } = await import("./template-registry.server");
    return listTemplates(data.pageType as never);
  });

// ---------- Entities ----------
const entitySchema = z.object({
  kind: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  aliases: z.array(z.string()).optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  priority: z.number().int().optional(),
  is_active: z.boolean().optional(),
});
export const upsertPseoEntity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => entitySchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { getAdmin } = await import("./service-client.server");
    const admin = await getAdmin();
    const { data: row, error } = await admin.from("pseo_entities").upsert({
      kind: data.kind, slug: data.slug, name: data.name,
      aliases: data.aliases ?? [], attributes: data.attributes ?? {},
      priority: data.priority ?? 100, is_active: data.is_active ?? true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "kind,slug" }).select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listPseoEntities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ kind: z.string().optional(), limit: z.number().int().optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { getAdmin } = await import("./service-client.server");
    const admin = await getAdmin();
    let q = admin.from("pseo_entities").select("*").order("priority", { ascending: false });
    if (data.kind) q = q.eq("kind", data.kind);
    q = q.limit(data.limit ?? 500);
    const { data: rows } = await q;
    return rows ?? [];
  });

// ---------- Bulk generation ----------
const bulkSchema = z.object({
  name: z.string().min(1),
  templateId: z.string().uuid(),
  items: z.array(z.object({
    variables: z.record(z.string(), z.string()),
    keywords: z.array(z.string()).optional(),
    extraContext: z.string().optional(),
  })).min(1).max(10000),
  autoPublish: z.boolean().optional(),
  priority: z.number().int().optional(),
});
export const createPseoBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => bulkSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { createBatch } = await import("./bulk-orchestrator.server");
    return createBatch({
      name: data.name,
      templateId: data.templateId,
      items: data.items,
      autoPublish: data.autoPublish,
      priority: data.priority,
      createdBy: context.userId,
    });
  });

export const processPseoBatchQueue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ limit: z.number().int().min(1).max(200).optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { processBatchQueue } = await import("./bulk-orchestrator.server");
    return processBatchQueue(data.limit ?? 25);
  });

export const listPseoBatches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { getAdmin } = await import("./service-client.server");
    const admin = await getAdmin();
    const { data } = await admin.from("pseo_batches").select("*").order("created_at", { ascending: false }).limit(100);
    return data ?? [];
  });

// ---------- Single generation ----------
const genSchema = z.object({
  templateId: z.string().uuid(),
  variables: z.record(z.string(), z.string()),
  keywords: z.array(z.string()).optional(),
  extraContext: z.string().optional(),
  autoPublish: z.boolean().optional(),
});
export const generatePseoPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => genSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { getTemplate } = await import("./template-registry.server");
    const { generateAndStorePage } = await import("./pipeline.server");
    const tpl = await getTemplate(data.templateId);
    if (!tpl) throw new Error("Template not found");
    return generateAndStorePage({
      template: tpl,
      variables: data.variables,
      keywords: data.keywords,
      extraContext: data.extraContext,
      autoPublish: data.autoPublish,
    });
  });

// ---------- Workflow transitions ----------
const transitionSchema = z.object({
  pageId: z.string().uuid(),
  to: z.enum(["draft", "ai_generated", "human_review", "seo_review", "approved", "scheduled", "published", "archived", "rejected"]),
  scheduledAt: z.string().datetime().optional(),
});
export const transitionPseoPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => transitionSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { getAdmin } = await import("./service-client.server");
    const admin = await getAdmin();
    const patch: Record<string, unknown> = {
      review_state: data.to, reviewed_by: context.userId, reviewed_at: new Date().toISOString(),
    };
    if (data.to === "published") { patch.status = "published"; patch.published_at = new Date().toISOString(); }
    else if (data.to === "scheduled") { patch.status = "draft"; patch.scheduled_at = data.scheduledAt ?? null; }
    else if (data.to === "archived") { patch.status = "archived"; patch.archived_at = new Date().toISOString(); }
    else if (data.to === "rejected") { patch.status = "draft"; }
    await admin.from("pseo_pages").update(patch).eq("id", data.pageId);
    return { ok: true };
  });

// ---------- Quality re-review ----------
export const reReviewPseoPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ pageId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { getAdmin } = await import("./service-client.server");
    const { reviewPage } = await import("./quality-review.server");
    const { getTemplate } = await import("./template-registry.server");
    const admin = await getAdmin();
    const { data: page } = await admin.from("pseo_pages").select("*").eq("id", data.pageId).maybeSingle();
    if (!page) throw new Error("Page not found");
    const tpl = page.template_id ? await getTemplate(page.template_id as string) : null;
    if (!tpl) throw new Error("Template not found");
    const qr = await reviewPage(page.content as never, tpl, page.id as string);
    await admin.from("pseo_quality_reviews").insert({
      page_id: page.id, grammar_score: qr.grammar_score, readability_score: qr.readability_score,
      seo_score: qr.seo_score, duplicate_score: qr.duplicate_score, keyword_coverage: qr.keyword_coverage,
      internal_link_count: qr.internal_link_count, schema_complete: qr.schema_complete,
      word_count: qr.word_count, overall_score: qr.overall_score,
      issues: qr.issues, suggestions: qr.suggestions, reviewer: "ai",
    });
    await admin.from("pseo_pages").update({
      quality_score: qr.overall_score, seo_score: qr.seo_score,
      readability_score: qr.readability_score, duplicate_score: qr.duplicate_score,
    }).eq("id", page.id);
    return qr;
  });

// ---------- Indexing ----------
export const recordPseoIndexSnapshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    pageId: z.string().uuid(),
    url: z.string().url(),
    coverage_state: z.string().optional().nullable(),
    indexing_verdict: z.string().optional().nullable(),
    canonical_url: z.string().optional().nullable(),
    google_canonical: z.string().optional().nullable(),
    robots_txt_state: z.string().optional().nullable(),
    page_fetch_state: z.string().optional().nullable(),
    last_crawl_at: z.string().optional().nullable(),
    raw: z.unknown().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { recordIndexSnapshot } = await import("./indexing-tracker.server");
    await recordIndexSnapshot({
      page_id: data.pageId, url: data.url,
      coverage_state: data.coverage_state, indexing_verdict: data.indexing_verdict,
      canonical_url: data.canonical_url, google_canonical: data.google_canonical,
      robots_txt_state: data.robots_txt_state, page_fetch_state: data.page_fetch_state,
      last_crawl_at: data.last_crawl_at, raw: data.raw,
    });
    return { ok: true };
  });

export const getPseoIndexSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { indexCoverageSummary } = await import("./indexing-tracker.server");
    return indexCoverageSummary();
  });

// ---------- Analytics ----------
export const getPseoTopPages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ days: z.number().int().min(1).max(365).optional(), limit: z.number().int().min(1).max(500).optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { topPerformingPages } = await import("./analytics.server");
    return topPerformingPages(data.days ?? 30, data.limit ?? 50);
  });

export const getPseoDecliningPages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ days: z.number().int().min(2).max(365).optional(), limit: z.number().int().min(1).max(500).optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { decliningPages } = await import("./analytics.server");
    return decliningPages(data.days ?? 30, data.limit ?? 50);
  });

// ---------- Settings ----------
const settingsSchema = z.object({
  batch_size: z.number().int().optional(),
  daily_generation_limit: z.number().int().optional(),
  min_quality_score: z.number().optional(),
  auto_publish_threshold: z.number().optional(),
  canonical_domain: z.string().optional(),
  indexing_enabled: z.boolean().optional(),
  sitemap_split_size: z.number().int().optional(),
  rules: z.record(z.string(), z.unknown()).optional(),
});
export const getPseoSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { getAdmin } = await import("./service-client.server");
    const admin = await getAdmin();
    const { data } = await admin.from("pseo_settings").select("*").eq("id", 1).maybeSingle();
    return data;
  });

export const updatePseoSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => settingsSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { getAdmin } = await import("./service-client.server");
    const admin = await getAdmin();
    const { data: row, error } = await admin.from("pseo_settings")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", 1).select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });
