// Project → Publisher bridge.
// Additive-only. Reuses existing publishing_jobs table, publisher-worker,
// and platform edge functions. Does not redesign the Publisher.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const SUPPORTED = ["instagram", "facebook", "linkedin", "x"] as const;
type SupportedPlatform = (typeof SUPPORTED)[number];

async function canManagePlatformPublishing(supabase: Any, userId: string): Promise<boolean> {
  const [{ data: isSuper }, { data: isAdmin }] = await Promise.all([
    supabase.rpc("has_role", { _user_id: userId, _role: "super_admin" }),
    supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
  ]);
  return !!isSuper || !!isAdmin;
}

async function getProjectBridgeDb(supabase: Any, userId: string): Promise<{ db: Any; canManageAll: boolean }> {
  const canManageAll = await canManagePlatformPublishing(supabase, userId);
  if (!canManageAll) return { db: supabase, canManageAll };
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return { db: supabaseAdmin as Any, canManageAll };
}

/**
 * The generator sometimes stores poster images inline as
 * `data:image/png;base64,...` (~1.5 MB per poster). Two problems:
 *  1. Meta/Facebook/Instagram Graph API rejects data URLs — it needs a
 *     publicly reachable HTTPS URL to fetch the image server-side.
 *  2. Inserting those multi-MB blobs into `publishing_jobs.payload` on
 *     every publish caused Postgres `canceling statement due to statement
 *     timeout` (TOAST rewrite + RLS on huge JSONB row).
 *
 * `materializeMediaUrls` uploads any `data:` URLs to the private
 * `marketing-posters` bucket via the service-role client and swaps them
 * for long-lived signed HTTPS URLs, so `publishing_jobs.payload.media_urls`
 * only ever carries small strings and the Graph API can fetch them.
 */
async function materializeMediaUrls(
  ownerId: string,
  projectId: string,
  urls: string[],
): Promise<string[]> {
  if (!urls.length) return urls;
  const needsUpload = urls.some((u) => typeof u === "string" && u.startsWith("data:"));
  if (!needsUpload) return urls;

  const t0 = Date.now();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const out: string[] = [];
  for (let i = 0; i < urls.length; i++) {
    const u = urls[i];
    if (!u || typeof u !== "string" || !u.startsWith("data:")) {
      out.push(u);
      continue;
    }
    const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(u);
    if (!m) {
      // Unknown data URL shape — drop it rather than send garbage to Meta.
      console.warn(`[materializeMediaUrls] skip non-image data URL at index ${i}`);
      continue;
    }
    const mime = m[1];
    const ext = mime.split("/")[1]?.split("+")[0] || "png";
    const bytes = Buffer.from(m[2], "base64");
    const path = `${ownerId}/${projectId}/${Date.now()}-${i}.${ext}`;
    const tUp = Date.now();
    const { error: upErr } = await supabaseAdmin.storage
      .from("marketing-posters")
      .upload(path, bytes, { contentType: mime, upsert: true });
    if (upErr) {
      console.error(`[materializeMediaUrls] upload failed ${path} in ${Date.now() - tUp}ms: ${upErr.message}`);
      throw new Error(`Poster upload failed: ${upErr.message}`);
    }
    // 7 days is well above the worker retry window; Meta fetches within seconds.
    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from("marketing-posters")
      .createSignedUrl(path, 60 * 60 * 24 * 7);
    if (sErr || !signed?.signedUrl) {
      console.error(`[materializeMediaUrls] sign failed ${path}: ${sErr?.message}`);
      throw new Error(`Poster URL sign failed: ${sErr?.message ?? "unknown"}`);
    }
    console.log(`[materializeMediaUrls] uploaded+signed ${path} size=${bytes.length}B in ${Date.now() - tUp}ms`);
    out.push(signed.signedUrl);
  }
  console.log(`[materializeMediaUrls] done ${urls.length} url(s) in ${Date.now() - t0}ms`);
  return out;
}

/**
 * Walk all built publishing_job rows, upload every unique base64 data URL
 * once to storage, and rewrite `payload.media_urls` to signed HTTPS URLs.
 * Avoids re-uploading the same poster N times when multiple accounts share it.
 */
async function materializeRowsMedia(rows: Any[], ownerId: string, projectId: string) {
  const uniq = new Set<string>();
  for (const r of rows) {
    for (const u of (r.payload?.media_urls ?? []) as string[]) {
      if (typeof u === "string" && u.startsWith("data:")) uniq.add(u);
    }
  }
  if (!uniq.size) return;
  const arr = Array.from(uniq);
  const mapped = await materializeMediaUrls(ownerId, projectId, arr);
  const map = new Map<string, string>();
  for (let i = 0; i < arr.length; i++) map.set(arr[i], mapped[i]);
  for (const r of rows) {
    const urls: string[] = (r.payload?.media_urls ?? []) as string[];
    r.payload.media_urls = urls.map((u) => (map.get(u) ?? u)).filter((u) => typeof u === "string" && !u.startsWith("data:"));
  }
}



/** Turn the project.result blob into per-item publish payloads. */
function buildPayloads(result: Any): Array<{
  title: string;
  body: string;
  hashtags: string[];
  cta?: string;
  media_urls: string[];
  metadata: Record<string, unknown>;
}> {
  const content: Any[] = Array.isArray(result?.content) ? result.content : [];
  const posters: Any[] = Array.isArray(result?.posters) ? result.posters : [];
  return content.map((c, i) => {
    const poster = posters[i] ?? posters[0];
    const media_urls: string[] = [];
    if (poster?.image_url && typeof poster.image_url === "string") media_urls.push(poster.image_url);
    const body = String(c.body ?? c.caption ?? c.text ?? "");
    const hashtags = Array.isArray(c.hashtags) ? c.hashtags.filter((h: unknown) => typeof h === "string") : [];
    return {
      title: String(c.hook ?? c.title ?? "Post"),
      body,
      hashtags,
      cta: c.cta ? String(c.cta) : undefined,
      media_urls,
      metadata: { hook: c.hook, source: "marketing_project" },
    };
  });
}

async function loadProjectAndAccounts(
  supabase: Any,
  userId: string,
  projectId: string,
  platforms?: SupportedPlatform[],
  opts: { includeResult?: boolean } = { includeResult: true },
) {
  const { db, canManageAll } = await getProjectBridgeDb(supabase, userId);
  const t0 = Date.now();
  const cols = opts.includeResult
    ? "id, created_by, campaign_id, name, result"
    : "id, created_by, campaign_id, name";
  let projectQ = db
    .from("marketing_projects")
    .select(cols)
    .eq("id", projectId);
  if (!canManageAll) projectQ = projectQ.eq("created_by", userId);
  const { data: project, error } = await projectQ.maybeSingle();
  const projMs = Date.now() - t0;
  if (error || !project) {
    console.error(`[publish.loadProject] failed in ${projMs}ms: ${error?.message ?? "not found"}`);
    throw new Error("Project not found");
  }
  console.log(`[publish.loadProject] ok in ${projMs}ms includeResult=${!!opts.includeResult}`);

  const t1 = Date.now();
  const { isLinkedInPublishingEnabled } = await import("@/lib/feature-flags");
  const liEnabled = isLinkedInPublishingEnabled();
  let wanted = (platforms?.length ? platforms : (SUPPORTED as readonly string[])) as string[];
  if (!liEnabled) {
    const before = wanted.length;
    wanted = wanted.filter((p) => p !== "linkedin");
    if (before !== wanted.length) {
      console.log("[publish] LinkedIn publishing disabled by feature flag — skipping linkedin accounts");
    }
  }
  let accountsQ = db
    .from("soc_accounts")
    .select("id, owner_id, platform, account_name, connection_status, can_post")
    .in("platform", wanted)
    .eq("connection_status", "connected");
  if (!canManageAll) accountsQ = accountsQ.eq("owner_id", userId);
  const { data: accounts, error: aErr } = await accountsQ;
  console.log(`[publish.loadAccounts] ${accounts?.length ?? 0} rows in ${Date.now() - t1}ms`);
  if (aErr) throw new Error(aErr.message);

  const usable = (accounts ?? []).filter((a: Any) => a.can_post !== false);
  return { project, accounts: usable as Any[], db, canManageAll };
}

function makeJobRows(opts: {
  userId: string;
  project: Any;
  accounts: Any[];
  scheduledAt: string;
  timezone: string;
  mode: "publish_now" | "schedule";
}) {
  const payloads = buildPayloads(opts.project.result);
  if (!payloads.length) throw new Error("No generated content to publish");
  if (!opts.accounts.length) throw new Error("No connected accounts to publish to");
  const campaign = String(opts.project.name ?? "Marketing Project");
  const rows: Any[] = [];
  for (const pl of payloads) {
    for (const acc of opts.accounts) {
      rows.push({
        owner_id: acc.owner_id ?? opts.userId,
        created_by: opts.userId,
        campaign,
        campaign_id: opts.project.campaign_id ?? null,
        platform: String(acc.platform).toLowerCase(),
        account_id: acc.id,
        account_label: acc.account_name ?? null,
        mode: opts.mode,
        status: "queued",
        scheduled_at: opts.scheduledAt,
        timezone: opts.timezone,
        priority: 5,
        payload: {
          title: pl.title,
          body: pl.body,
          hashtags: pl.hashtags,
          cta: pl.cta,
          media_urls: pl.media_urls,
          metadata: { ...pl.metadata, project_id: opts.project.id },
        },
      });
    }
  }
  return rows;
}

async function markProjectPublishState(supabase: Any, userId: string, projectId: string, patch: Record<string, unknown>) {
  // Write to the dedicated small `publish_state` column instead of rewriting
  // the multi-MB `result` JSONB (which triggered Postgres statement_timeout
  // on TOAST rewrite during Publish Now).
  const { db } = await getProjectBridgeDb(supabase, userId);
  const t0 = Date.now();
  const { data: cur } = await db
    .from("marketing_projects")
    .select("publish_state")
    .eq("id", projectId)
    .maybeSingle();
  const merged = { ...((cur?.publish_state ?? {}) as Record<string, unknown>), ...patch };
  const { error } = await db
    .from("marketing_projects")
    .update({ publish_state: merged })
    .eq("id", projectId);
  console.log(`[publish.markState] wrote publish_state in ${Date.now() - t0}ms${error ? ` err=${error.message}` : ""}`);
  if (error) throw new Error(error.message);
}

/* ------------------- STATUS ------------------- */

export const getProjectPublishStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ projectId: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { db, canManageAll } = await getProjectBridgeDb(supabase, userId);
    let projectQ = db
      .from("marketing_projects")
      .select("id, name, publish_state")
      .eq("id", data.projectId);
    if (!canManageAll) projectQ = projectQ.eq("created_by", userId);
    const { data: project } = await projectQ.maybeSingle();
    if (!project) throw new Error("Project not found");
    const campaign = String(project.name ?? "Marketing Project");
    let jobsQ = db
      .from("publishing_jobs")
      .select("id, platform, status, scheduled_at, published_at, platform_url, platform_post_id, error_message, account_label")
      .eq("campaign", campaign)
      .order("scheduled_at", { ascending: true });
    if (!canManageAll) jobsQ = jobsQ.eq("owner_id", userId);
    const { data: jobs } = await jobsQ;
    const publish = (project.publish_state && Object.keys(project.publish_state).length)
      ? project.publish_state
      : { state: "draft" };
    return { publish, jobs: jobs ?? [] };
  });

/* ------------------- DRAFT / APPROVE / REJECT ------------------- */

export const saveProjectDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ projectId: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    await markProjectPublishState(context.supabase, context.userId, data.projectId, { state: "draft", updated_at: new Date().toISOString() });
    return { ok: true };
  });

export const approveProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ projectId: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const now = new Date().toISOString();
    console.log(`[project.approve] approve clicked userId=${userId} projectId=${data.projectId}`);

    const { project, accounts, db } = await loadProjectAndAccounts(supabase, userId, data.projectId);
    const rows = makeJobRows({
      userId,
      project,
      accounts,
      scheduledAt: now,
      timezone: "UTC",
      mode: "publish_now",
    });

    console.log(`[project.approve] inserting publishing_jobs count=${rows.length}`);
    const { data: ins, error } = await db
      .from("publishing_jobs")
      .insert(rows as Any)
      .select("id, platform, account_id");
    if (error) {
      console.error(`[project.approve] publishing_jobs insert failed: ${error.message}`);
      throw new Error(`Failed to enqueue publishing jobs: ${error.message}`);
    }

    const jobs = (ins ?? []) as Array<{ id: string; platform: string; account_id: string }>;
    console.log(`[project.approve] publishing job ids=${jobs.map((j) => j.id).join(",")}`);
    await markProjectPublishState(supabase, userId, data.projectId, {
      state: "publishing",
      approved_by: userId,
      approved_at: now,
      last_action: "approve",
      last_action_at: now,
      job_count: jobs.length,
    });

    try {
      const { runPublisherWorker } = await import("./publisher-worker.server");
      const worker = await runPublisherWorker({ maxJobs: jobs.length });
      console.log(`[project.approve] worker picked jobs processed=${worker.processed}`);
    } catch (e) {
      console.error(`[project.approve] worker error: ${(e as Error).message}`);
    }

    return { ok: true, publishing: { created: jobs.length, jobs } };
  });

export const rejectProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ projectId: z.string().uuid(), reason: z.string().optional() }).parse(raw))
  .handler(async ({ data, context }) => {
    await markProjectPublishState(context.supabase, context.userId, data.projectId, {
      state: "rejected",
      rejected_by: context.userId,
      rejected_at: new Date().toISOString(),
      reason: data.reason ?? null,
    });
    return { ok: true };
  });

/* ------------------- PUBLISH NOW ------------------- */

const PlatformsSchema = z.object({
  projectId: z.string().uuid(),
  platforms: z.array(z.enum(SUPPORTED)).optional(),
});

export const publishProjectNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => PlatformsSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { project, accounts, db } = await loadProjectAndAccounts(supabase, userId, data.projectId, data.platforms);
    const rows = makeJobRows({
      userId, project, accounts,
      scheduledAt: new Date().toISOString(),
      timezone: "UTC",
      mode: "publish_now",
    });
    await materializeRowsMedia(rows, userId, data.projectId);
    const tIns = Date.now();
    const { data: ins, error } = await db.from("publishing_jobs").insert(rows as Any).select("id");
    console.log(`[publishProjectNow] insert ${rows.length} jobs in ${Date.now() - tIns}ms${error ? ` err=${error.message}` : ""}`);
    if (error) throw new Error(error.message);
    await markProjectPublishState(supabase, userId, data.projectId, {
      state: "publishing",
      last_action: "publish_now",
      last_action_at: new Date().toISOString(),
      job_count: rows.length,
    });
    // Fire the worker inline so users see immediate feedback.
    try {
      const { runPublisherWorker } = await import("./publisher-worker.server");
      await runPublisherWorker({ maxJobs: rows.length });
    } catch (e) {
      // Worker errors are surfaced through publishing_jobs.status/error_message.
      console.error("[publishProjectNow] worker error:", (e as Error).message);
    }
    return { created: ins?.length ?? 0, platforms: accounts.map((a) => a.platform) };
  });

/* ------------------- SCHEDULE ------------------- */

const ScheduleSchema = z.object({
  projectId: z.string().uuid(),
  platforms: z.array(z.enum(SUPPORTED)).optional(),
  scheduled_at: z.string().datetime(),
  timezone: z.string().default("UTC"),
});

export const scheduleProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => ScheduleSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { project, accounts, db } = await loadProjectAndAccounts(supabase, userId, data.projectId, data.platforms);
    const rows = makeJobRows({
      userId, project, accounts,
      scheduledAt: data.scheduled_at,
      timezone: data.timezone,
      mode: "schedule",
    });
    await materializeRowsMedia(rows, userId, data.projectId);
    const tIns = Date.now();
    const { data: ins, error } = await db.from("publishing_jobs").insert(rows as Any).select("id");
    console.log(`[scheduleProject] insert ${rows.length} jobs in ${Date.now() - tIns}ms${error ? ` err=${error.message}` : ""}`);
    if (error) throw new Error(error.message);
    await markProjectPublishState(supabase, userId, data.projectId, {
      state: "scheduled",
      last_action: "schedule",
      last_action_at: new Date().toISOString(),
      scheduled_at: data.scheduled_at,
      timezone: data.timezone,
      job_count: rows.length,
    });
    return { created: ins?.length ?? 0, scheduled_at: data.scheduled_at };
  });

/* ------------------- PER-POST ACTIONS (additive) -------------------
 *
 * Each generated post lives at `result.content[index]`. Per-post state
 * (approved/rejected/scheduled/publishing/published + edits) is stored at
 * `result.post_states[index]`. The Content tab reads/writes this map so
 * every post gains Preview / Edit / Approve / Reject / Schedule / Publish Now.
 * ---------------------------------------------------------------------- */

type PostState = {
  state: "draft" | "approved" | "rejected" | "scheduled" | "publishing" | "published" | "failed";
  edited?: { hook?: string; body?: string; cta?: string; hashtags?: string[] };
  scheduled_at?: string;
  timezone?: string;
  last_action_at?: string;
  job_ids?: string[];
};

async function readProjectResult(supabase: Any, userId: string, projectId: string) {
  // We used to `select("... , result")` here, which pulled the multi-MB
  // JSONB blob (posters store 1.5MB base64 per image). That was the
  // dominant contributor to statement_timeout on Publish Now. Fetch only
  // the two JSON sub-paths we actually need to build publishing_jobs rows.
  const { db, canManageAll } = await getProjectBridgeDb(supabase, userId);
  const t0 = Date.now();
  let projectQ = db
    .from("marketing_projects")
    .select("id, created_by, campaign_id, name, result_content:result->content, result_posters:result->posters")
    .eq("id", projectId);
  if (!canManageAll) projectQ = projectQ.eq("created_by", userId);
  const { data: project, error } = await projectQ.maybeSingle();
  console.log(`[publish.readProjectResult] in ${Date.now() - t0}ms err=${error?.message ?? "-"}`);
  if (error || !project) throw new Error("Project not found");
  // Re-shape so downstream code that reads `project.result.content` /
  // `project.result.posters` keeps working unchanged.
  return {
    id: (project as Any).id,
    created_by: (project as Any).created_by,
    campaign_id: (project as Any).campaign_id,
    name: (project as Any).name,
    result: {
      content: (project as Any).result_content ?? [],
      posters: (project as Any).result_posters ?? [],
    },
  } as Any;
}


async function writePostStates(supabase: Any, userId: string, projectId: string, states: Record<string, PostState>) {
  // Persist per-post state to the dedicated `post_states` column so we no
  // longer read+rewrite the multi-MB `result` blob on every approve/publish.
  const { db } = await getProjectBridgeDb(supabase, userId);
  const t0 = Date.now();
  const { data: cur } = await db
    .from("marketing_projects")
    .select("post_states")
    .eq("id", projectId)
    .maybeSingle();
  const merged = { ...((cur?.post_states ?? {}) as Record<string, PostState>), ...states };
  const { error } = await db
    .from("marketing_projects")
    .update({ post_states: merged })
    .eq("id", projectId);
  console.log(`[publish.writePostStates] ${Object.keys(states).length} keys in ${Date.now() - t0}ms${error ? ` err=${error.message}` : ""}`);
  if (error) throw new Error(error.message);
}

async function writePostEdits(supabase: Any, userId: string, projectId: string, index: number, edits: PostState["edited"]) {
  // Content lives inside `result`; edits still need to update it, but state
  // is stored separately in `post_states` to avoid two large rewrites.
  const { db } = await getProjectBridgeDb(supabase, userId);
  const { data: cur } = await db
    .from("marketing_projects")
    .select("result, post_states")
    .eq("id", projectId)
    .maybeSingle();
  const result = { ...(cur?.result ?? {}) };
  const content: Any[] = Array.isArray(result.content) ? [...result.content] : [];
  if (!content[index]) throw new Error("Post not found");
  content[index] = { ...content[index], ...edits, hashtags: edits?.hashtags ?? content[index].hashtags };
  result.content = content;
  const post_states = { ...((cur?.post_states ?? {}) as Record<string, PostState>) };
  post_states[String(index)] = { ...(post_states[String(index)] ?? { state: "draft" }), edited: edits, last_action_at: new Date().toISOString() };
  await db.from("marketing_projects").update({ result, post_states }).eq("id", projectId);
}

function buildRowsForIndexes(opts: {
  userId: string;
  project: Any;
  accounts: Any[];
  indexes: number[];
  scheduledAt: string;
  timezone: string;
  mode: "publish_now" | "schedule";
}) {
  const content: Any[] = Array.isArray(opts.project.result?.content) ? opts.project.result.content : [];
  const posters: Any[] = Array.isArray(opts.project.result?.posters) ? opts.project.result.posters : [];
  const campaign = String(opts.project.name ?? "Marketing Project");
  const rows: Any[] = [];
  for (const i of opts.indexes) {
    const c = content[i];
    if (!c) continue;
    const poster = posters[i] ?? posters[0];
    const media_urls: string[] = [];
    if (poster?.image_url && typeof poster.image_url === "string") media_urls.push(poster.image_url);
    const body = String(c.body ?? c.caption ?? c.text ?? "");
    const hashtags = Array.isArray(c.hashtags) ? c.hashtags.filter((h: unknown) => typeof h === "string") : [];
    for (const acc of opts.accounts) {
      rows.push({
        owner_id: acc.owner_id ?? opts.userId,
        created_by: opts.userId,
        campaign,
        campaign_id: opts.project.campaign_id ?? null,
        platform: String(acc.platform).toLowerCase(),
        account_id: acc.id,
        account_label: acc.account_name ?? null,
        mode: opts.mode,
        status: "queued",
        scheduled_at: opts.scheduledAt,
        timezone: opts.timezone,
        priority: 5,
        payload: {
          title: String(c.hook ?? c.title ?? "Post"),
          body,
          hashtags,
          cta: c.cta ? String(c.cta) : undefined,
          media_urls,
          metadata: { hook: c.hook, source: "marketing_project", project_id: opts.project.id, post_index: i },
        },
      });
    }
  }
  return rows;
}

const PostIndexesSchema = z.object({
  projectId: z.string().uuid(),
  indexes: z.array(z.number().int().nonnegative()).min(1),
});

export const approvePosts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => PostIndexesSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const now = new Date().toISOString();
    const patch: Record<string, PostState> = {};
    for (const i of data.indexes) patch[String(i)] = { state: "approved", last_action_at: now };
    await writePostStates(context.supabase, context.userId, data.projectId, patch);
    return { ok: true, count: data.indexes.length };
  });

export const rejectPosts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => PostIndexesSchema.extend({ reason: z.string().optional() }).parse(raw))
  .handler(async ({ data, context }) => {
    const now = new Date().toISOString();
    const patch: Record<string, PostState> = {};
    for (const i of data.indexes) patch[String(i)] = { state: "rejected", last_action_at: now };
    await writePostStates(context.supabase, context.userId, data.projectId, patch);
    return { ok: true, count: data.indexes.length };
  });

export const updatePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({
    projectId: z.string().uuid(),
    index: z.number().int().nonnegative(),
    edits: z.object({
      hook: z.string().optional(),
      body: z.string().optional(),
      cta: z.string().optional(),
      hashtags: z.array(z.string()).optional(),
    }),
  }).parse(raw))
  .handler(async ({ data, context }) => {
    await writePostEdits(context.supabase, context.userId, data.projectId, data.index, data.edits);
    return { ok: true };
  });

export const publishPostsNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => PostIndexesSchema.extend({
    platforms: z.array(z.enum(SUPPORTED)).optional(),
  }).parse(raw))
  .handler(async ({ data, context }) => {
    const tReq = Date.now();
    console.log(`[publishPostsNow] start indexes=${data.indexes.length} platforms=${(data.platforms ?? []).join(",") || "all"}`);
    const { supabase, userId } = context;
    const project = await readProjectResult(supabase, userId, data.projectId);
    // Second call skips fetching the multi-MB `result` blob again — accounts only.
    const { accounts, db } = await loadProjectAndAccounts(supabase, userId, data.projectId, data.platforms, { includeResult: false });
    if (!accounts.length) throw new Error("No connected accounts to publish to");
    const now = new Date().toISOString();
    const rows = buildRowsForIndexes({
      userId, project, accounts, indexes: data.indexes,
      scheduledAt: now, timezone: "UTC", mode: "publish_now",
    });
    if (!rows.length) throw new Error("No selected posts to publish");
    await materializeRowsMedia(rows, userId, data.projectId);
    const tIns = Date.now();
    // Return only ids — payload/media_urls carry image references, no need to echo them back.
    const { data: ins, error } = await db.from("publishing_jobs").insert(rows as Any).select("id");
    console.log(`[publishPostsNow] inserted ${rows.length} publishing_jobs in ${Date.now() - tIns}ms${error ? ` err=${error.message}` : ""}`);
    if (error) throw new Error(error.message);

    // Insert preserves row order, so map ids back to their source row index.
    const jobsByIdx: Record<string, string[]> = {};
    const insArr = (ins ?? []) as Any[];
    for (let k = 0; k < insArr.length && k < rows.length; k++) {
      const idx = rows[k].payload?.metadata?.post_index;
      if (typeof idx === "number") {
        jobsByIdx[String(idx)] = [...(jobsByIdx[String(idx)] ?? []), insArr[k].id];
      }
    }
    const patch: Record<string, PostState> = {};
    for (const i of data.indexes) {
      patch[String(i)] = { state: "publishing", last_action_at: now, job_ids: jobsByIdx[String(i)] ?? [] };
    }
    await writePostStates(supabase, userId, data.projectId, patch);

    try {
      const tWorker = Date.now();
      const { runPublisherWorker } = await import("./publisher-worker.server");
      const w = await runPublisherWorker({ maxJobs: rows.length });
      console.log(`[publishPostsNow] worker processed=${w.processed} in ${Date.now() - tWorker}ms`);
    } catch (e) {
      console.error("[publishPostsNow] worker error:", (e as Error).message);
    }
    console.log(`[publishPostsNow] done total=${Date.now() - tReq}ms`);
    return { created: ins?.length ?? 0, indexes: data.indexes };
  });

export const schedulePosts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => PostIndexesSchema.extend({
    platforms: z.array(z.enum(SUPPORTED)).optional(),
    scheduled_at: z.string().datetime(),
    timezone: z.string().default("UTC"),
  }).parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const project = await readProjectResult(supabase, userId, data.projectId);
    const { accounts, db } = await loadProjectAndAccounts(supabase, userId, data.projectId, data.platforms, { includeResult: false });
    if (!accounts.length) throw new Error("No connected accounts to publish to");
    const rows = buildRowsForIndexes({
      userId, project, accounts, indexes: data.indexes,
      scheduledAt: data.scheduled_at, timezone: data.timezone, mode: "schedule",
    });
    if (!rows.length) throw new Error("No selected posts to schedule");
    await materializeRowsMedia(rows, userId, data.projectId);
    const tIns = Date.now();
    const { data: ins, error } = await db.from("publishing_jobs").insert(rows as Any).select("id");
    console.log(`[schedulePosts] inserted ${rows.length} publishing_jobs in ${Date.now() - tIns}ms${error ? ` err=${error.message}` : ""}`);
    if (error) throw new Error(error.message);

    const jobsByIdx: Record<string, string[]> = {};
    const insArr = (ins ?? []) as Any[];
    for (let k = 0; k < insArr.length && k < rows.length; k++) {
      const idx = rows[k].payload?.metadata?.post_index;
      if (typeof idx === "number") jobsByIdx[String(idx)] = [...(jobsByIdx[String(idx)] ?? []), insArr[k].id];
    }
    const patch: Record<string, PostState> = {};
    const now = new Date().toISOString();
    for (const i of data.indexes) {
      patch[String(i)] = {
        state: "scheduled", last_action_at: now,
        scheduled_at: data.scheduled_at, timezone: data.timezone,
        job_ids: jobsByIdx[String(i)] ?? [],
      };
    }
    await writePostStates(supabase, userId, data.projectId, patch);
    return { created: ins?.length ?? 0, indexes: data.indexes, scheduled_at: data.scheduled_at };
  });

/* ------------------- REGENERATE (per post) ------------------- */

export const regeneratePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({
    projectId: z.string().uuid(),
    index: z.number().int().nonnegative(),
    instructions: z.string().max(500).optional(),
  }).parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const project = await readProjectResult(supabase, userId, data.projectId);
    const content: Any[] = Array.isArray(project.result?.content) ? project.result.content : [];
    const current = content[data.index];
    if (!current) throw new Error("Post not found");
    const brief = project.result?.brief ?? {};

    const { aiChat } = await import("@/lib/ai/router.server");
    const res = await aiChat({
      messages: [{
        role: "user",
        content: `Rewrite this social post to be fresh and higher-performing. Keep the same platform (${current.platform ?? "social"}). Respond as JSON: { hook, body, cta, hashtags: [] }. ${data.instructions ? `Extra guidance: ${data.instructions}. ` : ""}Brief: ${JSON.stringify(brief)}. Current post: ${JSON.stringify({ hook: current.hook, body: current.body, cta: current.cta, hashtags: current.hashtags })}`,
      }],
      responseFormat: "json",
      temperature: 0.8,
      maxTokens: 700,
    });
    const parsed = (res && typeof res === "object" ? res : {}) as Record<string, Any>;

    const { db } = await getProjectBridgeDb(supabase, userId);
    const { data: cur } = await db.from("marketing_projects").select("result").eq("id", data.projectId).maybeSingle();
    const result: Record<string, Any> = { ...((cur?.result ?? {}) as Record<string, Any>) };
    const list: Any[] = Array.isArray(result.content) ? [...result.content] : [];
    list[data.index] = {
      ...(list[data.index] ?? {}),
      hook: parsed.hook ?? list[data.index]?.hook,
      body: parsed.body ?? list[data.index]?.body,
      cta: parsed.cta ?? list[data.index]?.cta,
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : list[data.index]?.hashtags,
    };
    result.content = list;
    const post_states = { ...(result.post_states ?? {}) };
    post_states[String(data.index)] = {
      ...(post_states[String(data.index)] ?? {}),
      state: "draft",
      last_action_at: new Date().toISOString(),
    };
    result.post_states = post_states;
    await db.from("marketing_projects").update({ result }).eq("id", data.projectId);
    return { ok: true, post: list[data.index] };
  });

/* ------------------- POSTER EDIT / REGENERATE ------------------- */

const PosterEditSchema = z.object({
  projectId: z.string().uuid(),
  index: z.number().int().nonnegative(),
  edits: z.object({
    title: z.string().max(120).optional(),
    headline: z.string().max(120).optional(),
    subtitle: z.string().max(240).optional(),
    cta: z.string().max(60).optional(),
    description: z.string().max(280).optional(),
    dominant_colors: z.array(z.string()).max(6).optional(),
    text_color: z.string().max(20).optional(),
    accent_color: z.string().max(20).optional(),
    layout: z.string().max(40).optional(),
    image_url: z.string().optional(),
  }),
});

export const updatePoster = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => PosterEditSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { db } = await getProjectBridgeDb(context.supabase, context.userId);
    const { data: cur, error: rErr } = await db
      .from("marketing_projects")
      .select("result")
      .eq("id", data.projectId)
      .maybeSingle();
    if (rErr || !cur) throw new Error(rErr?.message ?? "Project not found");
    const result: Any = { ...(cur.result ?? {}) };
    const posters: Any[] = Array.isArray(result.posters) ? [...result.posters] : [];
    if (!posters[data.index]) throw new Error("Poster not found");
    posters[data.index] = { ...posters[data.index], ...data.edits };
    result.posters = posters;
    const { error } = await db
      .from("marketing_projects")
      .update({ result })
      .eq("id", data.projectId);
    if (error) throw new Error(error.message);
    return { ok: true, poster: posters[data.index] };
  });

export const regeneratePoster = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({
    projectId: z.string().uuid(),
    index: z.number().int().nonnegative(),
    backgroundPrompt: z.string().max(600).optional(),
  }).parse(raw))
  .handler(async ({ data, context }) => {
    const { db } = await getProjectBridgeDb(context.supabase, context.userId);
    const { data: cur, error: rErr } = await db
      .from("marketing_projects")
      .select("result")
      .eq("id", data.projectId)
      .maybeSingle();
    if (rErr || !cur) throw new Error(rErr?.message ?? "Project not found");
    const result: Any = { ...(cur.result ?? {}) };
    const posters: Any[] = Array.isArray(result.posters) ? [...result.posters] : [];
    const p = posters[data.index];
    if (!p) throw new Error("Poster not found");

    const { generateImageBase64 } = await import("@/lib/ai/image.server");
    const colors = Array.isArray(p.dominant_colors) && p.dominant_colors.length
      ? ` Palette: ${p.dominant_colors.join(", ")}.`
      : "";
    const style = p.style ? ` Style: ${p.style}.` : "";
    const bg = data.backgroundPrompt ?? p.background_prompt ?? p.concept ?? p.title ?? "";
    const prompt =
      `Design an ABSTRACT background artwork for a social media poster.` +
      ` ${bg}.${style}${colors}` +
      ` Square 1:1 composition, production-quality, cinematic lighting.` +
      ` STRICT: absolutely NO text, NO letters, NO numbers, NO logos,` +
      ` NO typography, NO watermarks. Pure artwork only.`;
    try {
      const b64 = await generateImageBase64(prompt, { size: "1024x1024", quality: "low" });
      posters[data.index] = {
        ...p,
        image_url: `data:image/png;base64,${b64}`,
        image_error: undefined,
        background_prompt: data.backgroundPrompt ?? p.background_prompt,
      };
    } catch (e: Any) {
      throw new Error(e?.message ?? "Image generation failed");
    }
    result.posters = posters;
    const { error } = await db
      .from("marketing_projects")
      .update({ result })
      .eq("id", data.projectId);
    if (error) throw new Error(error.message);
    return { ok: true, poster: posters[data.index] };
  });

