/**
 * Priority queue primitives — enqueue / claim / complete / retry / cancel.
 * Service-role only. Never import from client-reachable modules at module scope.
 */
import type { EnqueueSpec, JobRecord } from "./types";

type SB = Awaited<ReturnType<typeof getAdmin>>;

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function enqueue(spec: EnqueueSpec): Promise<{ id: string; deduped: boolean }> {
  const sb = await getAdmin();
  // Resolve handler defaults for priority/attempts/backoff/timeout.
  const { data: handler } = await sb
    .from("automation_handlers")
    .select("default_priority,default_max_attempts,default_timeout_seconds,requires_approval,is_enabled")
    .eq("code", spec.handler)
    .maybeSingle();
  if (!handler) throw new Error(`Unknown handler: ${spec.handler}`);
  if (!handler.is_enabled) throw new Error(`Handler disabled: ${spec.handler}`);

  const status = handler.requires_approval && !spec.approvalId ? "waiting_approval" : "queued";

  const row = {
    handler: spec.handler,
    owner_id: spec.ownerId ?? null,
    parent_job_id: spec.parentJobId ?? null,
    approval_id: spec.approvalId ?? null,
    idempotency_key: spec.idempotencyKey ?? null,
    priority: spec.priority ?? handler.default_priority,
    max_attempts: spec.maxAttempts ?? handler.default_max_attempts,
    backoff_seconds: spec.backoffSeconds ?? 30,
    timeout_seconds: handler.default_timeout_seconds,
    run_at: (spec.runAt ?? new Date()).toISOString(),
    payload: (spec.payload ?? {}) as any,
    correlation_id: spec.correlationId ?? null,
    status,
  };

  const { data, error } = await sb.from("automation_jobs").insert(row).select("id").maybeSingle();
  if (error) {
    // Handle idempotency clash → return the existing one.
    if (spec.idempotencyKey && String(error.code) === "23505") {
      const existing = await sb
        .from("automation_jobs")
        .select("id")
        .eq("handler", spec.handler)
        .eq("idempotency_key", spec.idempotencyKey)
        .maybeSingle();
      if (existing.data) return { id: existing.data.id, deduped: true };
    }
    throw error;
  }
  return { id: data!.id, deduped: false };
}

export async function claim(workerId: string, limit: number): Promise<JobRecord[]> {
  const sb = await getAdmin();
  const { data, error } = await sb.rpc("automation_claim_jobs", {
    _worker_id: workerId,
    _limit: limit,
    _lock_seconds: 120,
  } as any);
  if (error) throw error;
  return (data ?? []) as any;
}

export async function complete(jobId: string, result: Record<string, unknown>) {
  const sb = await getAdmin();
  await sb
    .from("automation_jobs")
    .update({
      status: "succeeded",
      completed_at: new Date().toISOString(),
      result: result as any,
      locked_at: null,
      locked_by: null,
    })
    .eq("id", jobId);
}

export async function failOrRetry(job: JobRecord, err: unknown) {
  const sb = await getAdmin();
  const message = err instanceof Error ? err.message : String(err);
  const canRetry = job.attempts < job.max_attempts;
  if (canRetry) {
    const delayMs = Math.min(60 * 60 * 1000, job.backoff_seconds * 1000 * Math.pow(2, job.attempts - 1));
    await sb
      .from("automation_jobs")
      .update({
        status: "queued",
        run_at: new Date(Date.now() + delayMs).toISOString(),
        last_error: message.slice(0, 2000),
        locked_at: null,
        locked_by: null,
      })
      .eq("id", job.id);
  } else {
    await sb
      .from("automation_jobs")
      .update({
        status: "dead_letter",
        completed_at: new Date().toISOString(),
        last_error: message.slice(0, 2000),
        locked_at: null,
        locked_by: null,
      })
      .eq("id", job.id);
  }
}

export async function requeueStuck(): Promise<number> {
  const sb = await getAdmin();
  const { data } = await sb.rpc("automation_requeue_stuck", { _lock_ttl_seconds: 300 } as any);
  return Number(data ?? 0);
}

export type { SB };
