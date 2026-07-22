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
) {
  const { data: project, error } = await supabase
    .from("marketing_projects")
    .select("id, created_by, campaign_id, result, name")
    .eq("id", projectId)
    .eq("created_by", userId)
    .maybeSingle();
  if (error || !project) throw new Error("Project not found");

  const wanted = (platforms?.length ? platforms : (SUPPORTED as readonly string[])) as string[];
  const { data: accounts, error: aErr } = await supabase
    .from("soc_accounts")
    .select("id, platform, account_name, connection_status, can_post")
    .eq("owner_id", userId)
    .in("platform", wanted)
    .eq("connection_status", "connected");
  if (aErr) throw new Error(aErr.message);

  const usable = (accounts ?? []).filter((a: Any) => a.can_post !== false);
  return { project, accounts: usable as Any[] };
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
        owner_id: opts.userId,
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

async function markProjectPublishState(supabase: Any, projectId: string, patch: Record<string, unknown>) {
  const { data: cur } = await supabase.from("marketing_projects").select("result").eq("id", projectId).maybeSingle();
  const merged = { ...(cur?.result ?? {}), publish: { ...(cur?.result?.publish ?? {}), ...patch } };
  await supabase.from("marketing_projects").update({ result: merged }).eq("id", projectId);
}

/* ------------------- STATUS ------------------- */

export const getProjectPublishStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ projectId: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: project } = await supabase
      .from("marketing_projects")
      .select("id, name, result")
      .eq("id", data.projectId)
      .eq("created_by", userId)
      .maybeSingle();
    if (!project) throw new Error("Project not found");
    const campaign = String(project.name ?? "Marketing Project");
    const { data: jobs } = await supabase
      .from("publishing_jobs")
      .select("id, platform, status, scheduled_at, published_at, platform_url, platform_post_id, error_message, account_label")
      .eq("owner_id", userId)
      .eq("campaign", campaign)
      .order("scheduled_at", { ascending: true });
    return {
      publish: (project.result as Any)?.publish ?? { state: "draft" },
      jobs: jobs ?? [],
    };
  });

/* ------------------- DRAFT / APPROVE / REJECT ------------------- */

export const saveProjectDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ projectId: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    await markProjectPublishState(context.supabase, data.projectId, { state: "draft", updated_at: new Date().toISOString() });
    return { ok: true };
  });

export const approveProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ projectId: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const now = new Date().toISOString();
    console.log(`[project.approve] approve clicked userId=${userId} projectId=${data.projectId}`);

    const { project, accounts } = await loadProjectAndAccounts(supabase, userId, data.projectId);
    const rows = makeJobRows({
      userId,
      project,
      accounts,
      scheduledAt: now,
      timezone: "UTC",
      mode: "publish_now",
    });

    console.log(`[project.approve] inserting publishing_jobs count=${rows.length}`);
    const { data: ins, error } = await supabase
      .from("publishing_jobs")
      .insert(rows as Any)
      .select("id, platform, account_id");
    if (error) {
      console.error(`[project.approve] publishing_jobs insert failed: ${error.message}`);
      throw new Error(`Failed to enqueue publishing jobs: ${error.message}`);
    }

    const jobs = (ins ?? []) as Array<{ id: string; platform: string; account_id: string }>;
    console.log(`[project.approve] publishing job ids=${jobs.map((j) => j.id).join(",")}`);
    await markProjectPublishState(supabase, data.projectId, {
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
    await markProjectPublishState(context.supabase, data.projectId, {
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
    const { project, accounts } = await loadProjectAndAccounts(supabase, userId, data.projectId, data.platforms);
    const rows = makeJobRows({
      userId, project, accounts,
      scheduledAt: new Date().toISOString(),
      timezone: "UTC",
      mode: "publish_now",
    });
    const { data: ins, error } = await supabase.from("publishing_jobs").insert(rows as Any).select("id");
    if (error) throw new Error(error.message);
    await markProjectPublishState(supabase, data.projectId, {
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
    const { project, accounts } = await loadProjectAndAccounts(supabase, userId, data.projectId, data.platforms);
    const rows = makeJobRows({
      userId, project, accounts,
      scheduledAt: data.scheduled_at,
      timezone: data.timezone,
      mode: "schedule",
    });
    const { data: ins, error } = await supabase.from("publishing_jobs").insert(rows as Any).select("id");
    if (error) throw new Error(error.message);
    await markProjectPublishState(supabase, data.projectId, {
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
  const { data: project, error } = await supabase
    .from("marketing_projects")
    .select("id, created_by, campaign_id, name, result")
    .eq("id", projectId)
    .eq("created_by", userId)
    .maybeSingle();
  if (error || !project) throw new Error("Project not found");
  return project as Any;
}

async function writePostStates(supabase: Any, projectId: string, states: Record<string, PostState>) {
  const { data: cur } = await supabase.from("marketing_projects").select("result").eq("id", projectId).maybeSingle();
  const result = { ...(cur?.result ?? {}) };
  result.post_states = { ...(result.post_states ?? {}), ...states };
  await supabase.from("marketing_projects").update({ result }).eq("id", projectId);
}

async function writePostEdits(supabase: Any, projectId: string, index: number, edits: PostState["edited"]) {
  const { data: cur } = await supabase.from("marketing_projects").select("result").eq("id", projectId).maybeSingle();
  const result = { ...(cur?.result ?? {}) };
  const content: Any[] = Array.isArray(result.content) ? [...result.content] : [];
  if (!content[index]) throw new Error("Post not found");
  content[index] = { ...content[index], ...edits, hashtags: edits?.hashtags ?? content[index].hashtags };
  result.content = content;
  const post_states = { ...(result.post_states ?? {}) };
  post_states[String(index)] = { ...(post_states[String(index)] ?? { state: "draft" }), edited: edits, last_action_at: new Date().toISOString() };
  result.post_states = post_states;
  await supabase.from("marketing_projects").update({ result }).eq("id", projectId);
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
        owner_id: opts.userId,
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
    await writePostStates(context.supabase, data.projectId, patch);
    return { ok: true, count: data.indexes.length };
  });

export const rejectPosts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => PostIndexesSchema.extend({ reason: z.string().optional() }).parse(raw))
  .handler(async ({ data, context }) => {
    const now = new Date().toISOString();
    const patch: Record<string, PostState> = {};
    for (const i of data.indexes) patch[String(i)] = { state: "rejected", last_action_at: now };
    await writePostStates(context.supabase, data.projectId, patch);
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
    await writePostEdits(context.supabase, data.projectId, data.index, data.edits);
    return { ok: true };
  });

export const publishPostsNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => PostIndexesSchema.extend({
    platforms: z.array(z.enum(SUPPORTED)).optional(),
  }).parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const project = await readProjectResult(supabase, userId, data.projectId);
    const { accounts } = await loadProjectAndAccounts(supabase, userId, data.projectId, data.platforms);
    if (!accounts.length) throw new Error("No connected accounts to publish to");
    const now = new Date().toISOString();
    const rows = buildRowsForIndexes({
      userId, project, accounts, indexes: data.indexes,
      scheduledAt: now, timezone: "UTC", mode: "publish_now",
    });
    if (!rows.length) throw new Error("No selected posts to publish");
    const { data: ins, error } = await supabase.from("publishing_jobs").insert(rows as Any).select("id, platform, account_id, payload");
    if (error) throw new Error(error.message);

    const jobsByIdx: Record<string, string[]> = {};
    for (const row of (ins ?? []) as Any[]) {
      const idx = row.payload?.metadata?.post_index;
      if (typeof idx === "number") {
        jobsByIdx[String(idx)] = [...(jobsByIdx[String(idx)] ?? []), row.id];
      }
    }
    const patch: Record<string, PostState> = {};
    for (const i of data.indexes) {
      patch[String(i)] = { state: "publishing", last_action_at: now, job_ids: jobsByIdx[String(i)] ?? [] };
    }
    await writePostStates(supabase, data.projectId, patch);

    try {
      const { runPublisherWorker } = await import("./publisher-worker.server");
      await runPublisherWorker({ maxJobs: rows.length });
    } catch (e) {
      console.error("[publishPostsNow] worker error:", (e as Error).message);
    }
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
    const { accounts } = await loadProjectAndAccounts(supabase, userId, data.projectId, data.platforms);
    if (!accounts.length) throw new Error("No connected accounts to publish to");
    const rows = buildRowsForIndexes({
      userId, project, accounts, indexes: data.indexes,
      scheduledAt: data.scheduled_at, timezone: data.timezone, mode: "schedule",
    });
    if (!rows.length) throw new Error("No selected posts to schedule");
    const { data: ins, error } = await supabase.from("publishing_jobs").insert(rows as Any).select("id, payload");
    if (error) throw new Error(error.message);

    const jobsByIdx: Record<string, string[]> = {};
    for (const row of (ins ?? []) as Any[]) {
      const idx = row.payload?.metadata?.post_index;
      if (typeof idx === "number") jobsByIdx[String(idx)] = [...(jobsByIdx[String(idx)] ?? []), row.id];
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
    await writePostStates(supabase, data.projectId, patch);
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
    const parsed = (typeof res === "object" ? res : {}) as Any;

    const { data: cur } = await supabase.from("marketing_projects").select("result").eq("id", data.projectId).maybeSingle();
    const result: Any = { ...(cur?.result ?? {}) };
    const list: Any[] = Array.isArray(result.content) ? [...result.content] : [];
    list[data.index] = {
      ...list[data.index],
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
    await supabase.from("marketing_projects").update({ result }).eq("id", data.projectId);
    return { ok: true, post: list[data.index] };
  });
