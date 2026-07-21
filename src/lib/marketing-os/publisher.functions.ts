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

/* ------------------- CALENDAR HELPERS (reuse Publisher engine) ------------------- */

export const duplicateJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid(), scheduled_at: z.string().datetime().optional() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { data: src, error } = await context.supabase.from("publishing_jobs").select("*").eq("id", data.id).maybeSingle();
    if (error || !src) throw new Error("Job not found");
    const s = src as Any;
    const clone = {
      owner_id: context.userId, created_by: context.userId,
      content_id: s.content_id, campaign: s.campaign, campaign_id: s.campaign_id,
      platform: s.platform, account_id: s.account_id, account_label: s.account_label,
      payload: s.payload, mode: "schedule",
      timezone: s.timezone, priority: s.priority, recurrence: null,
      evergreen: false, evergreen_interval_days: null,
      scheduled_at: data.scheduled_at ?? new Date(Date.now() + 3600_000).toISOString(),
      status: "queued",
    };
    const { data: ins, error: e2 } = await context.supabase.from("publishing_jobs").insert(clone as Any).select("id").maybeSingle();
    if (e2) throw new Error(e2.message);
    return { id: (ins as Any)?.id };
  });

export const listHolidays = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ from: z.string(), to: z.string() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { data: rows } = await context.supabase
      .from("mkt_calendar_events")
      .select("id, event_date, category, title, description")
      .gte("event_date", data.from.slice(0, 10))
      .lte("event_date", data.to.slice(0, 10))
      .is("brand_id", null)
      .limit(500);
    return { holidays: rows ?? [] };
  });

/* ------------------- TEST PUBLISH (Social Accounts page) ------------------- */

const TEST_MESSAGE_DEFAULT =
  "Testing Glintr AI Publishing 🚀\nThis is an automated test post.";

const TestOneSchema = z.object({
  account_id: z.string().uuid(),
  message: z.string().min(1).max(6000).optional(),
  media_urls: z.array(z.string().url()).optional(),
});

async function runTestPublishForAccount(
  supabase: Any,
  userId: string,
  accountId: string,
  message: string,
  mediaUrls?: string[],
): Promise<Any> {
  const { data: acc, error: aerr } = await supabase
    .from("soc_accounts")
    .select("id, platform, account_name, connection_status")
    .eq("id", accountId)
    .eq("owner_id", userId)
    .maybeSingle();
  if (aerr) throw new Error(aerr.message);
  if (!acc) throw new Error("Account not found");
  const a = acc as Any;
  if (a.connection_status !== "connected") {
    throw new Error(`Account not connected (${a.connection_status ?? "unknown"})`);
  }

  const platform = String(a.platform).toLowerCase();
  const media = mediaUrls ?? (platform === "instagram"
    ? ["https://images.unsplash.com/photo-1518770660439-4636190af475?w=1080&h=1080&fit=crop"]
    : []);

  const row = {
    owner_id: userId,
    created_by: userId,
    platform,
    account_id: a.id,
    account_label: a.account_name ?? null,
    campaign: "publish-test",
    mode: "publish_now",
    status: "queued",
    scheduled_at: new Date().toISOString(),
    priority: 1,
    payload: {
      title: "Publish Test",
      body: message,
      hashtags: [],
      cta: null,
      media_urls: media,
      thread: null,
      metadata: { source: "social-accounts.test-publish" },
    },
  };
  const { data: ins, error: ie } = await supabase
    .from("publishing_jobs")
    .insert(row as Any)
    .select("id")
    .maybeSingle();
  if (ie) throw new Error(ie.message);
  const jobId = (ins as Any)?.id as string;

  const { runPublisherWorker } = await import("./publisher-worker.server");
  await runPublisherWorker({ maxJobs: 1, jobId });

  const { data: final } = await supabase
    .from("publishing_jobs")
    .select("id, status, platform, account_id, account_label, platform_post_id, platform_url, error_code, error_message, response_payload, published_at")
    .eq("id", jobId)
    .maybeSingle();
  const f = final as Any;
  return {
    job_id: jobId,
    platform,
    account_id: a.id,
    account_name: a.account_name,
    status: f?.status ?? "unknown",
    platform_post_id: f?.platform_post_id ?? null,
    platform_url: f?.platform_url ?? null,
    published_at: f?.published_at ?? null,
    error_code: f?.error_code ?? null,
    error_message: f?.error_message ?? null,
    response: f?.response_payload ?? null,
  };
}

// Publish a test post to ONE connected account.
// Creates a real publishing_jobs row, runs the worker inline, returns the
// provider post ID / URL / error so the UI can show the exact result.
export const testPublishAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => TestOneSchema.parse(raw))
  .handler(async ({ data, context }) => {
    return runTestPublishForAccount(
      context.supabase as Any,
      context.userId,
      data.account_id,
      data.message ?? TEST_MESSAGE_DEFAULT,
      data.media_urls,
    );
  });

// Publish a test post to ALL connected accounts of the current user.
export const testPublishAllAccounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({
    message: z.string().min(1).max(6000).optional(),
  }).parse(raw ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: accs, error } = await supabase
      .from("soc_accounts")
      .select("id, platform, account_name")
      .eq("owner_id", userId)
      .eq("connection_status", "connected");
    if (error) throw new Error(error.message);
    const list = ((accs ?? []) as Any[]);
    if (!list.length) return { total: 0, results: [] as Any[] };

    const message = data.message ?? TEST_MESSAGE_DEFAULT;
    const results: Any[] = [];
    for (const a of list) {
      try {
        const r = await runTestPublishForAccount(supabase as Any, userId, a.id, message);
        results.push(r);
      } catch (e) {
        results.push({
          account_id: a.id,
          account_name: a.account_name,
          platform: a.platform,
          status: "failed",
          error_code: "invoke_failed",
          error_message: e instanceof Error ? e.message : String(e),
        });
      }
    }
    return { total: list.length, results };
  });


/* ------------------- LINKEDIN AUTHOR (Personal vs Company Page) ------------------- */

// Helper: invoke a Supabase edge function using the caller's bearer token or
// the internal dispatch secret + service role, mirroring the publisher path.
async function invokeEdgeAsUser(
  fnName: string,
  userId: string,
  body: Record<string, unknown>,
): Promise<{ status: number; json: Any }> {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const dispatchSecret = process.env.INTERNAL_DISPATCH_SECRET;
  if (!url || !key) throw new Error("Supabase server env missing");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: key,
    Authorization: `Bearer ${key}`,
    "x-run-as-user-id": userId,
  };
  if (dispatchSecret) headers["x-internal-secret"] = dispatchSecret;
  const res = await fetch(`${url}/functions/v1/${fnName}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let parsed: Any = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
  return { status: res.status, json: parsed };
}

const ListOrgsSchema = z.object({ account_id: z.string().uuid() });

/**
 * List LinkedIn Organizations (Company Pages) the connected member administers.
 * Reuses the existing LinkedIn access token — no OAuth restart.
 */
export const listLinkedInOrgs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => ListOrgsSchema.parse(raw))
  .handler(async ({ data, context }) => {
    // Verify the caller owns this account before hitting LinkedIn.
    const { data: acc, error } = await context.supabase
      .from("soc_accounts")
      .select("id, platform")
      .eq("id", data.account_id)
      .eq("owner_id", context.userId)
      .eq("platform", "linkedin")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!acc) throw new Error("LinkedIn account not found");

    const { status, json } = await invokeEdgeAsUser("linkedin-orgs", context.userId, {
      account_id: data.account_id,
    });
    if (status >= 400) throw new Error((json as Any)?.error ?? `linkedin-orgs failed (${status})`);
    return json as {
      ok?: boolean;
      person: { urn: string; name: string };
      organizations: Array<{ id: string; urn: string; name: string; vanityName: string | null; logoUrn: string | null; role: string; state: string }>;
      default: { urn: string; kind: "person" | "organization"; name?: string };
      reconnect_required?: boolean;
      code?: string;
      error?: string;
    };
  });

const SetAuthorSchema = z.object({
  account_id: z.string().uuid(),
  author_urn: z.string().min(1).regex(/^urn:li:(person|organization):/, "Must be urn:li:person: or urn:li:organization:"),
  author_kind: z.enum(["person", "organization"]),
  author_name: z.string().min(1).max(200),
});

/**
 * Persist the LinkedIn publishing target (Personal profile OR a specific
 * Company Page) as the default author on the connected account. The publisher
 * uses this on every subsequent publish unless the caller overrides it.
 */
export const setLinkedInDefaultAuthor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => SetAuthorSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: acc, error } = await supabase
      .from("soc_accounts")
      .select("id, metadata")
      .eq("id", data.account_id)
      .eq("owner_id", userId)
      .eq("platform", "linkedin")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!acc) throw new Error("LinkedIn account not found");
    const md = ((acc as Any).metadata ?? {}) as Record<string, unknown>;
    const nextMd = {
      ...md,
      default_author_urn: data.author_urn,
      default_author_kind: data.author_kind,
      default_author_name: data.author_name,
      default_author_updated_at: new Date().toISOString(),
    };
    const { error: uerr } = await (supabase as Any)
      .from("soc_accounts")
      .update({ metadata: nextMd })
      .eq("id", data.account_id)
      .eq("owner_id", userId);
    if (uerr) throw new Error(uerr.message);
    return { ok: true, default: { urn: data.author_urn, kind: data.author_kind, name: data.author_name } };
  });

const TestOrgSchema = z.object({
  account_id: z.string().uuid(),
  author_urn: z.string().regex(/^urn:li:organization:/, "Company page URN required").optional(),
  message: z.string().min(1).max(3000).optional(),
});

/**
 * "Test Publish to Company Page" — creates a real publishing_jobs row with the
 * given LinkedIn organization URN as the author override, runs the worker
 * inline, and returns the provider post ID / URL / error. If author_urn is
 * omitted, uses the saved default (which may be personal or a company page).
 */
export const testPublishLinkedInAuthor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => TestOrgSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: acc, error } = await supabase
      .from("soc_accounts")
      .select("id, platform, account_name, connection_status, metadata")
      .eq("id", data.account_id)
      .eq("owner_id", userId)
      .eq("platform", "linkedin")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!acc) throw new Error("LinkedIn account not found");
    if ((acc as Any).connection_status !== "connected") {
      throw new Error(`Account not connected (${(acc as Any).connection_status ?? "unknown"})`);
    }

    const message = data.message ?? "Testing Glintr AI Publishing to LinkedIn Company Page 🚀";
    const row = {
      owner_id: userId,
      created_by: userId,
      platform: "linkedin",
      account_id: (acc as Any).id,
      account_label: (acc as Any).account_name ?? null,
      campaign: "publish-test",
      mode: "publish_now",
      status: "queued",
      scheduled_at: new Date().toISOString(),
      priority: 1,
      payload: {
        title: "Publish Test",
        body: message,
        hashtags: [],
        cta: null,
        media_urls: [],
        thread: null,
        // Connector forwards this to the edge function as `author_urn`.
        metadata: { source: "social-accounts.test-linkedin", author_urn: data.author_urn ?? null },
      },
    };
    const { data: ins, error: ie } = await (supabase as Any)
      .from("publishing_jobs")
      .insert(row as Any)
      .select("id")
      .maybeSingle();
    if (ie) throw new Error(ie.message);
    const jobId = (ins as Any)?.id as string;

    const { runPublisherWorker } = await import("./publisher-worker.server");
    await runPublisherWorker({ maxJobs: 1, jobId });

    const { data: final } = await supabase
      .from("publishing_jobs")
      .select("id, status, platform_post_id, platform_url, error_code, error_message, response_payload, published_at")
      .eq("id", jobId)
      .maybeSingle();
    const f = final as Any;
    return {
      job_id: jobId,
      status: f?.status ?? "unknown",
      platform_post_id: f?.platform_post_id ?? null,
      platform_url: f?.platform_url ?? null,
      published_at: f?.published_at ?? null,
      error_code: f?.error_code ?? null,
      error_message: f?.error_message ?? null,
      response: f?.response_payload ?? null,
    };
  });

