// Approval Center — unified queue for AI-generated marketing content.
// Reuses centralized AI Router for scoring; never bypasses it.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callLovableAiJson } from "@/lib/ai-gateway.server";
import { z } from "zod";

const StatusEnum = z.enum(["draft","review","approved","scheduled","published","rejected","failed","archived"]);
export type ApprovalStatus = z.infer<typeof StatusEnum>;

const CreateSchema = z.object({
  plan_id: z.string().uuid().optional().nullable(),
  content_id: z.string().optional().nullable(),
  title: z.string().min(1),
  preview: z.string().optional().nullable(),
  body: z.string().optional().nullable(),
  content: z.record(z.string(), z.unknown()).default({}),
  platform: z.string().default("blog"),
  content_type: z.string().default("post"),
  campaign: z.string().optional().nullable(),
  language: z.string().default("English"),
  country: z.string().optional().nullable(),
  business_unit: z.string().optional().nullable(),
  ai_model: z.string().optional().nullable(),
  ai_generated: z.boolean().default(true),
  hashtags: z.array(z.string()).default([]),
  cta: z.string().optional().nullable(),
  media_prompts: z.array(z.record(z.string(), z.unknown())).default([]),
  status: StatusEnum.default("draft"),
  approval_mode: z.enum(["manual","manager","auto","multi_level"]).default("manual"),
  scheduled_at: z.string().datetime().optional().nullable(),
});

export const createApprovalItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => CreateSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const insert = { ...data, owner_id: userId, created_by: userId };
    const { data: row, error } = await supabase
      .from("approval_queue")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(insert as any)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await supabase.from("approval_activity").insert({
      queue_id: row.id, owner_id: userId, actor_id: userId, event: "created",
    });
    return { item: row };
  });

const ListSchema = z.object({
  status: z.array(StatusEnum).optional(),
  platform: z.array(z.string()).optional(),
  campaign: z.array(z.string()).optional(),
  language: z.array(z.string()).optional(),
  country: z.array(z.string()).optional(),
  content_type: z.array(z.string()).optional(),
  ai_model: z.array(z.string()).optional(),
  business_unit: z.array(z.string()).optional(),
  created_by: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(1000).default(500),
});

export const listApprovalItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => ListSchema.parse(raw ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("approval_queue").select("*").order("created_at", { ascending: false }).limit(data.limit);
    if (data.status?.length) q = q.in("status", data.status);
    if (data.platform?.length) q = q.in("platform", data.platform);
    if (data.campaign?.length) q = q.in("campaign", data.campaign);
    if (data.language?.length) q = q.in("language", data.language);
    if (data.country?.length) q = q.in("country", data.country);
    if (data.content_type?.length) q = q.in("content_type", data.content_type);
    if (data.ai_model?.length) q = q.in("ai_model", data.ai_model);
    if (data.business_unit?.length) q = q.in("business_unit", data.business_unit);
    if (data.created_by) q = q.eq("created_by", data.created_by);
    if (data.from) q = q.gte("created_at", data.from);
    if (data.to) q = q.lte("created_at", data.to);
    if (data.search) q = q.or(`title.ilike.%${data.search}%,preview.ilike.%${data.search}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { items: rows ?? [] };
  });

export const getApprovalItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { data: item, error } = await context.supabase.from("approval_queue").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!item) throw new Error("Item not found");
    const [{ data: comments }, { data: versions }, { data: activity }] = await Promise.all([
      context.supabase.from("approval_comments").select("*").eq("queue_id", data.id).order("created_at", { ascending: true }),
      context.supabase.from("approval_versions").select("id, version, note, edited_by, created_at").eq("queue_id", data.id).order("version", { ascending: false }),
      context.supabase.from("approval_activity").select("*").eq("queue_id", data.id).order("created_at", { ascending: false }).limit(200),
    ]);
    return { item, comments: comments ?? [], versions: versions ?? [], activity: activity ?? [] };
  });

const UpdateSchema = z.object({
  id: z.string().uuid(),
  patch: z.object({
    title: z.string().optional(),
    preview: z.string().nullable().optional(),
    body: z.string().nullable().optional(),
    content: z.record(z.string(), z.unknown()).optional(),
    platform: z.string().optional(),
    content_type: z.string().optional(),
    campaign: z.string().nullable().optional(),
    hashtags: z.array(z.string()).optional(),
    cta: z.string().nullable().optional(),
    scheduled_at: z.string().datetime().nullable().optional(),
  }),
  note: z.string().optional(),
});

export const updateApprovalItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => UpdateSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Snapshot existing before overwrite
    const { data: prev } = await supabase.from("approval_queue").select("*").eq("id", data.id).maybeSingle();
    if (!prev) throw new Error("Item not found");
    await supabase.from("approval_versions").insert({
      queue_id: data.id, owner_id: prev.owner_id, version: prev.version,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      snapshot: prev as any, edited_by: userId, note: data.note ?? null,
    });
    const { data: row, error } = await supabase
      .from("approval_queue")
      .update({ ...data.patch, version: (prev.version ?? 1) + 1 } as never)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await supabase.from("approval_activity").insert({
      queue_id: data.id, owner_id: prev.owner_id, actor_id: userId, event: "edited",
      detail: { fields: Object.keys(data.patch) },
    });
    return { item: row };
  });

const StatusChangeSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  status: StatusEnum,
  note: z.string().optional(),
  scheduled_at: z.string().datetime().optional().nullable(),
});

export const changeApprovalStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => StatusChangeSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { status: data.status, reviewer: userId, review_notes: data.note ?? null };
    if (data.status === "approved") patch.approved_at = now;
    if (data.status === "scheduled") { patch.scheduled_at = data.scheduled_at ?? now; }
    if (data.status === "published") patch.published_at = now;
    const { data: rows, error } = await supabase
      .from("approval_queue")
      .update(patch as never)
      .in("id", data.ids)
      // Select full row so we can auto-enqueue publishing_jobs when approved.
      .select("*");
    if (error) throw new Error(error.message);
    const acts = (rows ?? []).map((r) => ({
      queue_id: r.id, owner_id: r.owner_id, actor_id: userId,
      event: data.status, detail: { note: data.note ?? null },
    }));
    if (acts.length) await supabase.from("approval_activity").insert(acts);

    // ---- Auto-enqueue into Publishing Queue on approval (additive, reuses existing Publisher) ----
    const publishing: {
      created: number;
      jobs: Array<{ id: string; platform: string; account_id: string }>;
      skipped: Array<{ item_id: string; platform: string; reason: string }>;
    } = { created: 0, jobs: [], skipped: [] };

    if (data.status === "approved" && rows && rows.length) {
      console.log(`[approval.autoEnqueue] approve clicked userId=${userId} items=${rows.length}`);
      try {
        const { data: accs, error: aerr } = await supabase
          .from("soc_accounts")
          .select("id, platform, connection_status, can_post")
          .eq("owner_id", userId)
          .eq("connection_status", "connected");
        if (aerr) console.error(`[approval.autoEnqueue] soc_accounts error: ${aerr.message}`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const accounts = (accs ?? []) as Array<{ id: string; platform: string; can_post: boolean | null }>;
        const norm = (s: string) => (s ?? "").toLowerCase().trim();
        const SOCIAL = new Set(["facebook","instagram","linkedin","x","twitter","threads","youtube","pinterest","tiktok"]);

        const jobRows: Record<string, unknown>[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const r of rows as any[]) {
          const itemId = r.id as string;
          const platformRaw = String(r.platform ?? "");
          const platform = norm(platformRaw);
          if (!SOCIAL.has(platform)) {
            publishing.skipped.push({ item_id: itemId, platform: platformRaw, reason: "non_social_platform" });
            console.log(`[approval.autoEnqueue] skip item=${itemId} platform=${platformRaw} reason=non_social_platform`);
            continue;
          }
          const alias = platform === "twitter" ? "x" : platform;
          const matched = accounts.filter((a) => norm(a.platform) === alias && a.can_post !== false);
          if (!matched.length) {
            publishing.skipped.push({ item_id: itemId, platform: platformRaw, reason: "no_connected_account" });
            console.log(`[approval.autoEnqueue] skip item=${itemId} platform=${platformRaw} reason=no_connected_account`);
            continue;
          }
          const content = (r.content ?? {}) as Record<string, unknown>;
          const mediaUrls: string[] = [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const c = content as any;
          if (Array.isArray(c.media_urls)) mediaUrls.push(...c.media_urls.filter((x: unknown) => typeof x === "string"));
          if (typeof c.image_url === "string") mediaUrls.push(c.image_url);
          if (Array.isArray(c.images)) mediaUrls.push(...c.images.filter((x: unknown) => typeof x === "string"));

          const scheduledAt = (r.scheduled_at as string | null) ?? now;
          for (const a of matched) {
            jobRows.push({
              owner_id: userId, created_by: userId,
              content_id: itemId,
              campaign: r.campaign ?? null,
              platform: alias, account_id: a.id,
              mode: "publish_now", status: "queued",
              scheduled_at: scheduledAt, timezone: "UTC", priority: 5,
              payload: {
                title: r.title,
                body: r.body ?? r.preview ?? "",
                hashtags: Array.isArray(r.hashtags) ? r.hashtags : [],
                cta: r.cta ?? null,
                media_urls: mediaUrls,
                thread: null,
                metadata: content,
              },
            });
          }
        }

        if (jobRows.length) {
          console.log(`[approval.autoEnqueue] inserting publishing_jobs count=${jobRows.length}`);
          const { data: ins, error: ierr } = await supabase
            .from("publishing_jobs")
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .insert(jobRows as any)
            .select("id, platform, account_id");
          if (ierr) {
            console.error(`[approval.autoEnqueue] insert publishing_jobs failed: ${ierr.message}`);
            throw new Error(`Failed to enqueue publishing jobs: ${ierr.message}`);
          }
          publishing.jobs = (ins ?? []) as Array<{ id: string; platform: string; account_id: string }>;
          publishing.created = publishing.jobs.length;
          console.log(`[approval.autoEnqueue] job ids=${publishing.jobs.map((j) => j.id).join(",")}`);

          try {
            const { runPublisherWorker } = await import("./publisher-worker.server");
            await runPublisherWorker({ maxJobs: publishing.created });
            console.log(`[approval.autoEnqueue] worker dispatched maxJobs=${publishing.created}`);
          } catch (e) {
            console.error(`[approval.autoEnqueue] worker error: ${(e as Error).message}`);
          }
        } else {
          console.log(`[approval.autoEnqueue] no eligible jobs; skipped=${publishing.skipped.length}`);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[approval.autoEnqueue] fatal: ${msg}`);
        throw new Error(msg);
      }
    }

    return { updated: rows?.length ?? 0, publishing };
  });

export const bulkDeleteApprovals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ ids: z.array(z.string().uuid()).min(1) }).parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("approval_queue").delete().in("id", data.ids);
    if (error) throw new Error(error.message);
    return { deleted: data.ids.length };
  });

export const bulkDuplicateApprovals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ ids: z.array(z.string().uuid()).min(1) }).parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: srcs, error } = await supabase.from("approval_queue").select("*").in("id", data.ids);
    if (error) throw new Error(error.message);
    const dupes = (srcs ?? []).map((s) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, created_at, updated_at, approved_at, published_at, version, ...rest } = s as Record<string, unknown>;
      void id; void created_at; void updated_at; void approved_at; void published_at; void version;
      return {
        ...rest,
        owner_id: userId,
        title: `${rest.title as string} (copy)`,
        status: "draft" as const,
      };
    });
    if (!dupes.length) return { created: 0 };
    const { data: ins, error: e2 } = await supabase.from("approval_queue").insert(dupes as never).select("id");
    if (e2) throw new Error(e2.message);
    return { created: ins?.length ?? 0 };
  });

export const bulkMoveCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ ids: z.array(z.string().uuid()).min(1), campaign: z.string() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("approval_queue").update({ campaign: data.campaign }).in("id", data.ids);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const bulkChangePlatform = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ ids: z.array(z.string().uuid()).min(1), platform: z.string() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("approval_queue").update({ platform: data.platform }).in("id", data.ids);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---- Comments ---- */

export const addApprovalComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({
    queue_id: z.string().uuid(),
    body: z.string().min(1),
    mentions: z.array(z.string().uuid()).default([]),
  }).parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: parent } = await supabase.from("approval_queue").select("owner_id").eq("id", data.queue_id).maybeSingle();
    if (!parent) throw new Error("Item not found");
    const { data: row, error } = await supabase.from("approval_comments").insert({
      queue_id: data.queue_id, owner_id: parent.owner_id, author_id: userId, body: data.body, mentions: data.mentions,
    }).select("*").single();
    if (error) throw new Error(error.message);
    return { comment: row };
  });

export const restoreApprovalVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ version_id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: v, error } = await supabase.from("approval_versions").select("*").eq("id", data.version_id).maybeSingle();
    if (error || !v) throw new Error(error?.message ?? "Version not found");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const snap = v.snapshot as any;
    const patch = {
      title: snap.title, preview: snap.preview, body: snap.body, content: snap.content,
      hashtags: snap.hashtags, cta: snap.cta, platform: snap.platform, content_type: snap.content_type,
      campaign: snap.campaign,
    };
    const { data: row, error: e2 } = await supabase.from("approval_queue")
      .update(patch).eq("id", v.queue_id).select("*").single();
    if (e2) throw new Error(e2.message);
    await supabase.from("approval_activity").insert({
      queue_id: v.queue_id, owner_id: v.owner_id, actor_id: userId,
      event: "restored", detail: { version: v.version },
    });
    return { item: row };
  });

/* ---- AI Scoring ---- */

const SCORE_SYSTEM = `You are Glintr's Enterprise Content Reviewer.
Score the given social/marketing content strictly. Return ONLY JSON matching the schema. No prose.`;

export const scoreApprovalItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: item, error } = await supabase.from("approval_queue").select("*").eq("id", data.id).maybeSingle();
    if (error || !item) throw new Error(error?.message ?? "Item not found");

    const prompt = `Score this content. Platform: ${item.platform}. Type: ${item.content_type}.
TITLE: ${item.title}
BODY: ${item.body ?? item.preview ?? ""}
HASHTAGS: ${(item.hashtags ?? []).join(", ")}
CTA: ${item.cta ?? "(none)"}

Return JSON:
{
  "grammar": 0-100,
  "readability": 0-100,
  "brand_voice": 0-100,
  "seo": 0-100,
  "engagement": 0-100,
  "cta": 0-100,
  "originality": 0-100,
  "compliance": 0-100,
  "accessibility": 0-100,
  "overall_quality": 0-100,
  "overall_seo": 0-100,
  "overall_brand": 0-100,
  "warnings": [{"code":"missing_cta|weak_hook|too_long|too_short|repeated|duplicate_hashtags|keyword_stuffing|brand_inconsistency","message":string}],
  "suggestions": [string]
}`;

    let result: Record<string, unknown> = {};
    try {
      result = await callLovableAiJson<Record<string, unknown>>({
        messages: [{ role: "system", content: SCORE_SYSTEM }, { role: "user", content: prompt }],
        temperature: 0.2,
      });
    } catch (e) {
      throw new Error(`Scoring failed: ${e instanceof Error ? e.message : String(e)}`);
    }

    const n = (k: string) => {
      const v = (result as Record<string, unknown>)[k];
      return typeof v === "number" ? Math.max(0, Math.min(100, Math.round(v))) : null;
    };

    const patch = {
      quality_score: n("overall_quality") ?? n("grammar"),
      seo_score: n("overall_seo") ?? n("seo"),
      brand_score: n("overall_brand") ?? n("brand_voice"),
      engagement_score: n("engagement"),
      scores: result,
      warnings: Array.isArray((result as { warnings?: unknown }).warnings) ? (result as { warnings: unknown[] }).warnings : [],
    };
    const { data: row, error: e2 } = await supabase.from("approval_queue").update(patch as never).eq("id", data.id).select("*").single();
    if (e2) throw new Error(e2.message);
    await supabase.from("approval_activity").insert({
      queue_id: data.id, owner_id: item.owner_id, actor_id: userId, event: "reviewed",
      detail: { source: "ai" },
    });
    return { item: row };
  });

/** Seed demo items — useful when the queue is empty. Attaches to an existing plan if provided. */
export const seedApprovalDemo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ plan_id: z.string().uuid().optional() }).parse(raw ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const platforms = ["Instagram","LinkedIn","X","Blog","Facebook","Threads"];
    const rows = platforms.map((p, i) => ({
      owner_id: userId, created_by: userId, plan_id: data.plan_id ?? null,
      title: `Sample ${p} post ${i + 1}`,
      preview: `AI-drafted preview copy for ${p}. Replace with your generated content.`,
      body: `Long-form draft for ${p}. Written by AI, awaiting human review.`,
      platform: p, content_type: p === "Blog" ? "article" : "post",
      campaign: i % 2 === 0 ? "Admissions 2026" : "AI Week",
      language: "English", country: "India",
      hashtags: ["#glintr", `#${p.toLowerCase()}`, "#learn"],
      cta: "Enroll now",
      ai_model: "openai/gpt-4o-mini", ai_generated: true,
      status: (["draft","review","approved","scheduled","review"] as const)[i % 5],
    }));
    const { error, data: ins } = await supabase.from("approval_queue").insert(rows).select("id");
    if (error) throw new Error(error.message);
    return { created: ins?.length ?? 0 };
  });
