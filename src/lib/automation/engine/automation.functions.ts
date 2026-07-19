/**
 * Server functions exposing the Automation Engine to authenticated callers.
 * All admin-level ops guarded via requireSupabaseAuth + role check.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const enqueueSchema = z.object({
  handler: z.string().min(2).max(120),
  payload: z.record(z.any()).default({}),
  priority: z.number().int().min(1).max(1000).optional(),
  runAt: z.string().datetime().optional(),
  idempotencyKey: z.string().max(200).optional(),
  maxAttempts: z.number().int().min(1).max(20).optional(),
});

export const enqueueJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => enqueueSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { enqueue } = await import("./queue.server");
    const { id, deduped } = await enqueue({
      handler: data.handler,
      payload: data.payload,
      priority: data.priority,
      runAt: data.runAt ? new Date(data.runAt) : undefined,
      idempotencyKey: data.idempotencyKey,
      maxAttempts: data.maxAttempts,
      ownerId: context.userId,
    });
    return { jobId: id, deduped };
  });

export const listMyJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { limit?: number; status?: string } = {}) =>
    z.object({ limit: z.number().int().min(1).max(200).default(50), status: z.string().optional() }).parse(i))
  .handler(async ({ data, context }) => {
    return context.supabase
      .from("automation_jobs")
      .select("id, handler, status, priority, run_at, attempts, max_attempts, last_error, result, created_at")
      .eq("owner_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(data.limit)
      .then((r) => (data.status ? { ...r, data: (r.data ?? []).filter((x: any) => x.status === data.status) } : r))
      .then((r) => r.data ?? []);
  });

export const cancelJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { jobId: string }) => z.object({ jobId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("automation_jobs")
      .update({ status: "cancelled", completed_at: new Date().toISOString() })
      .eq("id", data.jobId)
      .in("status", ["queued", "waiting_approval"]);
    if (error) throw error;
    return { ok: true };
  });

export const emitAutomationEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    name: z.string().min(2).max(120),
    payload: z.record(z.any()).default({}),
  }).parse(input))
  .handler(async ({ data }) => {
    const { emitEvent } = await import("./scheduler.server");
    const id = await emitEvent(data.name, data.payload, "server_fn");
    return { eventId: id };
  });

export const decideApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    approvalId: z.string().uuid(),
    decision: z.enum(["approved", "rejected"]),
    reason: z.string().max(500).optional(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { decide } = await import("./approvals.server");
    await decide(data.approvalId, data.decision, context.userId, data.reason);
    return { ok: true };
  });

export const listPendingApprovals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("automation_approvals")
      .select("id, handler, summary, reason, created_at, expires_at, requested_by")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(100);
    return data ?? [];
  });

export const getAutomationHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const [queued, running, dead, approvals] = await Promise.all([
      sb.from("automation_jobs").select("*", { count: "exact", head: true }).eq("status", "queued"),
      sb.from("automation_jobs").select("*", { count: "exact", head: true }).eq("status", "running"),
      sb.from("automation_jobs").select("*", { count: "exact", head: true }).eq("status", "dead_letter"),
      sb.from("automation_approvals").select("*", { count: "exact", head: true }).eq("status", "pending"),
    ]);
    return {
      queued: queued.count ?? 0,
      running: running.count ?? 0,
      deadLetter: dead.count ?? 0,
      pendingApprovals: approvals.count ?? 0,
    };
  });
