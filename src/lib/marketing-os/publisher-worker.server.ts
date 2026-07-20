// Server-only Publishing Worker. Called by:
//   - pg_cron via `/api/public/hooks/publisher-tick`
//   - manual "Publish Now" server function (inline single-job invocation)
//
// Never imported by client code (server.ts suffix keeps it out of client bundle).
import { getConnector } from "./publisher/connectors/index.server";
import type { PublishInput } from "./publisher/connectors/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const RETRY_SCHEDULE_MIN = [5, 15, 30, 60]; // Auto-retry delays per spec.

export async function runPublisherWorker(opts: { maxJobs?: number; jobId?: string } = {}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const now = new Date().toISOString();
  const maxJobs = Math.max(1, Math.min(50, opts.maxJobs ?? 10));

  // Pick due jobs.
  let q = supabaseAdmin
    .from("publishing_jobs")
    .select("*")
    .in("status", ["queued", "retrying"])
    .lte("scheduled_at", now)
    .order("priority", { ascending: true })
    .order("scheduled_at", { ascending: true })
    .limit(maxJobs);
  if (opts.jobId) q = q.eq("id", opts.jobId);

  const { data: jobs, error } = await q;
  if (error) throw new Error(error.message);

  const results: Array<{ id: string; status: string; error?: string }> = [];

  for (const j of (jobs ?? []) as Any[]) {
    // Claim atomically.
    const { data: claimed } = await supabaseAdmin
      .from("publishing_jobs")
      .update({ status: "publishing", started_at: new Date().toISOString() } as Any)
      .eq("id", j.id).in("status", ["queued","retrying"])
      .select("id").maybeSingle();
    if (!claimed) { results.push({ id: j.id, status: "already_claimed" }); continue; }

    const start = Date.now();
    try {
      const conn = getConnector(j.platform);
      if (!conn) throw Object.assign(new Error(`No connector registered for platform: ${j.platform}`), { code: "validation" });
      if (!j.account_id) throw Object.assign(new Error("Job has no account_id"), { code: "validation" });

      const payload = (j.payload ?? {}) as Any;
      const input: PublishInput = {
        ownerId: j.owner_id, accountId: j.account_id,
        title: payload.title ?? "", body: payload.body ?? "",
        hashtags: Array.isArray(payload.hashtags) ? payload.hashtags : [],
        cta: payload.cta ?? null,
        mediaUrls: Array.isArray(payload.media_urls) ? payload.media_urls : [],
        thread: Array.isArray(payload.thread) ? payload.thread : null,
        metadata: (payload.metadata ?? {}) as Record<string, unknown>,
      };

      const issues = conn.validate(input);
      const fatal = issues.filter((i) => i.fatal);
      if (fatal.length) throw Object.assign(new Error(fatal.map((i) => i.message).join("; ")), { code: "validation", retryable: false });

      const res = await conn.publish(input);
      const duration = Date.now() - start;

      if (res.ok) {
        await supabaseAdmin.from("publishing_jobs").update({
          status: "published",
          published_at: new Date().toISOString(),
          platform_post_id: res.platformPostId,
          platform_url: res.platformUrl,
          response_payload: (res.response ?? null) as Any,
          error_code: null, error_message: null,
        } as Any).eq("id", j.id);

        await supabaseAdmin.from("publishing_history").insert({
          owner_id: j.owner_id, job_id: j.id, content_id: j.content_id,
          platform: j.platform, account_id: j.account_id,
          attempt: (j.retry_count ?? 0) + 1, status: "success",
          platform_post_id: res.platformPostId, platform_url: res.platformUrl,
          duration_ms: duration, request_payload: payload,
          response_payload: (res.response ?? null) as Any,
        } as Any);

        await notify(supabaseAdmin, j.owner_id, j.id, "publish_success", "success",
          `Published to ${conn.label}`,
          res.platformUrl ?? `Post ${res.platformPostId ?? ""}`);

        // Evergreen re-queue.
        if (j.evergreen && j.evergreen_interval_days) {
          const next = new Date(Date.now() + j.evergreen_interval_days * 86_400_000).toISOString();
          const { id: _id, created_at: _c, updated_at: _u, published_at: _p, started_at: _s, ...rest } = j as Any;
          void _id; void _c; void _u; void _p; void _s;
          await supabaseAdmin.from("publishing_jobs").insert({
            ...rest, status: "queued", scheduled_at: next, retry_count: 0,
            platform_post_id: null, platform_url: null, response_payload: null,
            error_code: null, error_message: null, last_evergreen_at: new Date().toISOString(),
          } as Any);
        }

        // If part of a campaign and all done, emit campaign_completed.
        if (j.campaign) {
          const { data: remain } = await supabaseAdmin
            .from("publishing_jobs").select("id", { count: "exact", head: true })
            .eq("owner_id", j.owner_id).eq("campaign", j.campaign)
            .in("status", ["queued","retrying","publishing"]);
          if (remain === null) await notify(supabaseAdmin, j.owner_id, j.id, "campaign_completed", "info",
            `Campaign "${j.campaign}" completed`, "All scheduled posts published.");
        }

        results.push({ id: j.id, status: "published" });
      } else {
        await handleFailure(supabaseAdmin, j, res.errorCode, res.errorMessage, res.retryable, res.response, duration, payload);
        results.push({ id: j.id, status: "failed", error: res.errorMessage });
      }
    } catch (e) {
      const err = e as { code?: string; retryable?: boolean; message: string };
      await handleFailure(supabaseAdmin, j, err.code ?? "unknown", err.message, err.retryable ?? true, null, Date.now() - start, j.payload);
      results.push({ id: j.id, status: "failed", error: err.message });
    }
  }

  return { processed: results.length, results };
}

async function handleFailure(
  supabaseAdmin: Any, j: Any, code: string, message: string,
  retryable: boolean, response: unknown, duration: number, payload: unknown,
) {
  const attempt = (j.retry_count ?? 0) + 1;
  const canRetry = retryable && attempt <= (j.max_retries ?? 4);
  const nextDelay = RETRY_SCHEDULE_MIN[Math.min(attempt - 1, RETRY_SCHEDULE_MIN.length - 1)];

  await supabaseAdmin.from("publishing_history").insert({
    owner_id: j.owner_id, job_id: j.id, content_id: j.content_id,
    platform: j.platform, account_id: j.account_id, attempt,
    status: canRetry ? "retry" : "failed",
    duration_ms: duration, request_payload: payload,
    response_payload: (response ?? null) as Any,
    error_code: code, error_message: message,
  });

  if (canRetry) {
    const nextAt = new Date(Date.now() + nextDelay * 60_000).toISOString();
    await supabaseAdmin.from("publishing_jobs").update({
      status: "retrying", retry_count: attempt,
      next_retry_at: nextAt, scheduled_at: nextAt,
      error_code: code, error_message: message,
    } as Any).eq("id", j.id);
    await notify(supabaseAdmin, j.owner_id, j.id, "retry_started", "warning",
      `Retry ${attempt}/${j.max_retries ?? 4} scheduled`, `${j.platform}: ${message}`);
  } else {
    await supabaseAdmin.from("publishing_jobs").update({
      status: "failed", retry_count: attempt,
      error_code: code, error_message: message,
    } as Any).eq("id", j.id);
    await notify(supabaseAdmin, j.owner_id, j.id, "publish_failed", "error",
      `Publish failed on ${j.platform}`, message);
  }
}

async function notify(supabaseAdmin: Any, ownerId: string, jobId: string, event: string, severity: string, title: string, message: string) {
  await supabaseAdmin.from("publishing_notifications").insert({
    owner_id: ownerId, job_id: jobId, event, severity, title, message,
  });
}
