// Publishing Engine — server functions.
// Reuses existing publish-{facebook,instagram,linkedin,x} edge functions
// through the connector interface. Never re-implements platform logic.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const StatusEnum = z.enum(["draft","approved","queued","publishing","published","failed","cancelled","retrying","skipped"]);
const ModeEnum = z.enum(["publish_now","schedule","recurring","evergreen","campaign"]);

/* ------------------- LIST + STATS ------------------- */

const ListSchema = z.object({
  status: z.array(StatusEnum).optional(),
  platform: z.array(z.string()).optional(),
  campaign: z.array(z.string()).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(1000).default(500),
});

export const listPublishingJobs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => ListSchema.parse(raw ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("publishing_jobs")
      .select("*")
      .order("scheduled_at", { ascending: true })
      .limit(data.limit);
    if (data.status?.length) q = q.in("status", data.status);
    if (data.platform?.length) q = q.in("platform", data.platform);
    if (data.campaign?.length) q = q.in("campaign", data.campaign);
    if (data.from) q = q.gte("scheduled_at", data.from);
    if (data.to) q = q.lte("scheduled_at", data.to);
    if (data.search) q = q.ilike("account_label", `%${data.search}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { jobs: rows ?? [] };
  });

export const getPublishingStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const start = new Date(); start.setHours(0,0,0,0);
    const weekEnd = new Date(start); weekEnd.setDate(start.getDate() + 7);
    const [accs, jobs] = await Promise.all([
      context.supabase.from("soc_accounts").select("platform, connection_status").eq("owner_id", context.userId),
      context.supabase.from("publishing_jobs").select("id, status, scheduled_at, published_at").eq("owner_id", context.userId),
    ]);
    const j = (jobs.data ?? []) as Any[];
    const c = (s: string) => j.filter((r) => r.status === s).length;
    return {
      connectedAccounts: (accs.data ?? []).filter((a) => a.connection_status === "connected").length,
      pending: c("approved"),
      scheduled: c("queued") + c("retrying"),
      publishing: c("publishing"),
      publishedToday: j.filter((r) => r.published_at && new Date(r.published_at) >= start).length,
      failed: c("failed"),
      queued: c("queued"),
      upcomingWeek: j.filter((r) => r.status === "queued" && new Date(r.scheduled_at) >= start && new Date(r.scheduled_at) < weekEnd).length,
    };
  });

/* ------------------- ENQUEUE FROM APPROVAL ------------------- */

const EnqueueSchema = z.object({
  content_id: z.string().uuid(),
  platforms: z.array(z.object({ platform: z.string(), account_id: z.string().uuid() })).min(1),
  mode: ModeEnum.default("schedule"),
  scheduled_at: z.string().datetime().optional(),
  timezone: z.string().default("UTC"),
  priority: z.number().int().min(1).max(10).default(5),
  recurrence: z.object({ freq: z.enum(["daily","weekly","monthly","yearly","cron"]), cron: z.string().optional(), until: z.string().datetime().optional() }).optional(),
  evergreen: z.boolean().default(false),
  evergreen_interval_days: z.number().int().min(1).optional(),
  campaign: z.string().optional(),
});

export const enqueueFromApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => EnqueueSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: content, error } = await supabase.from("approval_queue").select("*").eq("id", data.content_id).maybeSingle();
    if (error || !content) throw new Error("Approved content not found");
    if (content.status !== "approved") throw new Error(`Only approved content can be scheduled (current: ${content.status})`);

    const rows = data.platforms.map((p) => ({
      owner_id: userId, created_by: userId,
      content_id: content.id,
      campaign: data.campaign ?? content.campaign ?? null,
      platform: p.platform.toLowerCase(),
      account_id: p.account_id,
      mode: data.mode,
      status: data.mode === "publish_now" ? "queued" : "queued",
      scheduled_at: data.mode === "publish_now" ? new Date().toISOString() : (data.scheduled_at ?? new Date().toISOString()),
      timezone: data.timezone,
      priority: data.priority,
      recurrence: data.recurrence ?? null,
      evergreen: data.evergreen,
      evergreen_interval_days: data.evergreen_interval_days ?? null,
      payload: {
        title: content.title, body: content.body ?? content.preview ?? "",
        hashtags: content.hashtags ?? [], cta: content.cta,
        media_urls: extractMediaUrls(content.content),
        thread: extractThread(content.content),
        metadata: content.content ?? {},
      },
    }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: ins, error: e2 } = await supabase.from("publishing_jobs").insert(rows as any).select("id");
    if (e2) throw new Error(e2.message);
    return { created: ins?.length ?? 0 };
  });

function extractMediaUrls(content: Any): string[] {
  if (!content || typeof content !== "object") return [];
  const urls: string[] = [];
  if (Array.isArray(content.media_urls)) urls.push(...content.media_urls.filter((x: unknown) => typeof x === "string"));
  if (typeof content.image_url === "string") urls.push(content.image_url);
  if (Array.isArray(content.images)) urls.push(...content.images.filter((x: unknown) => typeof x === "string"));
  return urls;
}
function extractThread(content: Any): string[] | null {
  if (!content || typeof content !== "object") return null;
  if (Array.isArray(content.thread) && content.thread.every((x: unknown) => typeof x === "string")) return content.thread as string[];
  return null;
}

/* ------------------- BULK STATE + ACTIONS ------------------- */

export const bulkCancelJobs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ ids: z.array(z.string().uuid()).min(1) }).parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("publishing_jobs")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString(), updated_by: context.userId } as Any)
      .in("id", data.ids).in("status", ["queued","retrying","approved"]);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const bulkReschedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ ids: z.array(z.string().uuid()).min(1), scheduled_at: z.string().datetime() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("publishing_jobs")
      .update({ scheduled_at: data.scheduled_at, status: "queued", updated_by: context.userId } as Any)
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const bulkRetry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ ids: z.array(z.string().uuid()).min(1) }).parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("publishing_jobs")
      .update({ status: "queued", next_retry_at: null, error_code: null, error_message: null, updated_by: context.userId } as Any)
      .in("id", data.ids).in("status", ["failed"]);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const bulkDeleteJobs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ ids: z.array(z.string().uuid()).min(1) }).parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("publishing_jobs").delete().in("id", data.ids);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------- CAMPAIGN ACTIONS ------------------- */

export const campaignAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({
    campaign: z.string().min(1),
    action: z.enum(["publish_all","pause","resume","clone","archive"]),
  }).parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.action === "publish_all") {
      const { error } = await supabase.from("publishing_jobs")
        .update({ scheduled_at: new Date().toISOString(), status: "queued" } as Any)
        .eq("campaign", data.campaign).in("status", ["approved","queued","retrying","cancelled"]);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    if (data.action === "pause") {
      const { error } = await supabase.from("publishing_jobs")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() } as Any)
        .eq("campaign", data.campaign).in("status", ["queued","retrying"]);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    if (data.action === "resume") {
      const { error } = await supabase.from("publishing_jobs")
        .update({ status: "queued", cancelled_at: null } as Any)
        .eq("campaign", data.campaign).eq("status", "cancelled");
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    if (data.action === "archive") {
      const { error } = await supabase.from("publishing_jobs")
        .update({ status: "skipped" } as Any)
        .eq("campaign", data.campaign).not("status", "in", "(publishing,published)");
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    if (data.action === "clone") {
      const { data: rows } = await supabase.from("publishing_jobs").select("*").eq("campaign", data.campaign);
      const dupes = (rows ?? []).map((r: Any) => ({
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ...(({ id, created_at, updated_at, published_at, started_at, cancelled_at, platform_post_id, platform_url, response_payload, error_code, error_message, retry_count, ...rest }: Any) => rest)(r),
        owner_id: userId, created_by: userId,
        campaign: `${r.campaign ?? "campaign"} (copy)`,
        status: "queued", scheduled_at: new Date(Date.now() + 24 * 3600_000).toISOString(),
      }));
      if (!dupes.length) return { ok: true, cloned: 0 };
      const { error } = await supabase.from("publishing_jobs").insert(dupes as Any);
      if (error) throw new Error(error.message);
      return { ok: true, cloned: dupes.length };
    }
    return { ok: true };
  });

/* ------------------- MANUAL "PUBLISH NOW" (single job) ------------------- */

export const publishJobNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    // Mark queued and immediately due; the worker will pick it up next tick.
    // Also runs the worker inline for instant feedback.
    const { error } = await context.supabase.from("publishing_jobs")
      .update({ status: "queued", scheduled_at: new Date().toISOString(), updated_by: context.userId } as Any)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    const { runPublisherWorker } = await import("./publisher-worker.server");
    const res = await runPublisherWorker({ maxJobs: 1, jobId: data.id });
    return res;
  });

/* ------------------- RECENT HISTORY / NOTIFICATIONS ------------------- */

export const listPublishingHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ limit: z.number().int().min(1).max(500).default(100) }).parse(raw ?? {}))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("publishing_history").select("*")
      .order("created_at", { ascending: false }).limit(data.limit);
    if (error) throw new Error(error.message);
    return { history: rows ?? [] };
  });

export const listPublishingNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("publishing_notifications").select("*")
      .order("created_at", { ascending: false }).limit(50);
    if (error) throw new Error(error.message);
    return { notifications: data ?? [] };
  });

/* ------------------- CONNECTED ACCOUNTS (for scheduling UI) ------------------- */

export const listConnectedAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("soc_accounts")
      .select("id, platform, account_name, connection_status, can_post, brand_id, token_expires_at")
      .eq("owner_id", context.userId).eq("connection_status", "connected");
    if (error) throw new Error(error.message);
    return { accounts: data ?? [] };
  });

export const listApprovedForPublishing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("approval_queue")
      .select("id, title, preview, platform, campaign, hashtags, cta, status, scheduled_at, approved_at")
      .eq("owner_id", context.userId).eq("status", "approved")
      .order("approved_at", { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return { items: data ?? [] };
  });
