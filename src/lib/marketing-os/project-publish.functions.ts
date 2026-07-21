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
    await markProjectPublishState(context.supabase, data.projectId, {
      state: "approved",
      approved_by: context.userId,
      approved_at: new Date().toISOString(),
    });
    return { ok: true };
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
