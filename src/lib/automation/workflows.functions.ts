/**
 * Workflow CRUD + run start (server functions).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const graphSchema = z.object({
  nodes: z.array(z.object({
    id: z.string(),
    type: z.string(),
    data: z.record(z.string(), z.unknown()).default({}),
    position: z.object({ x: z.number(), y: z.number() }),
  })),
  edges: z.array(z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    sourceHandle: z.string().nullish(),
    label: z.string().optional(),
  })),
});

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  brand_id: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(["draft", "active", "paused"]).default("draft"),
  trigger: z.object({ event: z.string(), filter: z.record(z.string(), z.unknown()).optional() }),
  graph: graphSchema,
  goal: z.record(z.string(), z.unknown()).nullish(),
});

export const listAutomationWorkflows = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ brand_id: z.string().uuid().optional().nullable() }).parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("automation_workflows").select("*").order("updated_at", { ascending: false });
    if (data.brand_id) q = q.eq("brand_id", data.brand_id);
    const { data: rows, error } = await q.limit(500);
    if (error) return { ok: false as const, error: error.message, workflows: [] };
    return { ok: true as const, workflows: rows ?? [] };
  });

export const getAutomationWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("automation_workflows")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, workflow: row };
  });

export const upsertAutomationWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => upsertSchema.parse(data))
  .handler(async ({ data, context }) => {
    const payload = {
      brand_id: data.brand_id ?? null,
      owner_id: context.userId,
      name: data.name,
      description: data.description ?? null,
      status: data.status,
      trigger: data.trigger as never,
      graph: data.graph as never,
      goal: (data.goal ?? null) as never,
    };
    if (data.id) {
      const { data: updated, error } = await context.supabase
        .from("automation_workflows")
        .update(payload)
        .eq("id", data.id)
        .select("*")
        .single();
      if (error) return { ok: false as const, error: error.message };
      return { ok: true as const, workflow: updated };
    }
    const { data: inserted, error } = await context.supabase
      .from("automation_workflows")
      .insert(payload)
      .select("*")
      .single();
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, workflow: inserted };
  });

export const deleteAutomationWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("automation_workflows").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const testRunAutomationWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { startRunForEvent } = await import("./workflows.server");
    const { data: wf } = await context.supabase
      .from("automation_workflows")
      .select("brand_id, status")
      .eq("id", data.id)
      .maybeSingle();
    // Force-active for test
    await context.supabase.from("automation_workflows").update({ status: "active" }).eq("id", data.id);
    const runId = await startRunForEvent(
      context.supabase,
      data.id,
      context.userId,
      (wf as { brand_id?: string | null } | null)?.brand_id ?? null,
    );
    // restore
    if (wf?.status && wf.status !== "active") {
      await context.supabase.from("automation_workflows").update({ status: wf.status }).eq("id", data.id);
    }
    return { ok: true as const, run_id: runId };
  });

export const listMyRecommendations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("automation_recommendations")
      .select("*")
      .eq("user_id", context.userId)
      .is("dismissed_at", null)
      .order("score", { ascending: false })
      .limit(10);
    if (error) return { ok: false as const, error: error.message, recommendations: [] };
    return { ok: true as const, recommendations: data ?? [] };
  });

export const listAutomationRuns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ workflow_id: z.string().uuid().optional() }).parse(data ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("automation_workflow_runs").select("*").order("started_at", { ascending: false }).limit(200);
    if (data.workflow_id) q = q.eq("workflow_id", data.workflow_id);
    const { data: rows, error } = await q;
    if (error) return { ok: false as const, error: error.message, runs: [] };
    return { ok: true as const, runs: rows ?? [] };
  });
