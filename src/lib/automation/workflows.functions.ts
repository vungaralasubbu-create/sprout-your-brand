/**
 * Automation server functions — CRUD + run/pause/cancel/retry + templates.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { startWorkflowRun, stepRun, tickWaiters, type WorkflowGraph } from "./workflow-engine.server";

const GraphSchema = z.object({
  nodes: z.array(z.object({
    id: z.string(),
    type: z.enum(["trigger","action","delay","condition","approval","notification","loop","api"]),
    position: z.object({ x: z.number(), y: z.number() }).optional(),
    data: z.record(z.string(), z.unknown()),
  })),
  edges: z.array(z.object({
    id: z.string(), source: z.string(), target: z.string(),
    sourceHandle: z.string().optional(), label: z.string().optional(),
  })),
});

// ---------- Dashboard ----------
export const getAutomationStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [wfs, runs] = await Promise.all([
      context.supabase.from("automation_workflows").select("id, status, run_count, success_count, failure_count"),
      context.supabase.from("automation_workflow_runs").select("status, started_at, completed_at, duration_ms").order("started_at", { ascending: false }).limit(500),
    ]);
    const rows = runs.data ?? [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const runsToday = rows.filter((r: { started_at: string }) => new Date(r.started_at) >= today);
    const counts = (rows.reduce((acc: Record<string, number>, r: { status: string }) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>));
    const durations = rows.map((r: { duration_ms: number | null }) => r.duration_ms).filter((n): n is number => typeof n === "number");
    const avgMs = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    const totalWf = wfs.data?.length ?? 0;
    const active = wfs.data?.filter((w: { status: string }) => w.status === "active").length ?? 0;
    const paused = wfs.data?.filter((w: { status: string }) => w.status === "paused").length ?? 0;
    const completedToday = runsToday.filter((r) => r.status === "completed").length;
    const success = counts["completed"] ?? 0;
    const failed = counts["failed"] ?? 0;
    const successRate = success + failed ? Math.round((success / (success + failed)) * 100) : 100;
    return {
      activeWorkflows: active,
      pausedWorkflows: paused,
      totalWorkflows: totalWf,
      completedToday,
      running: counts["running"] ?? 0,
      waiting: counts["waiting"] ?? 0,
      failed: counts["failed"] ?? 0,
      scheduled: counts["retrying"] ?? 0,
      avgRuntimeMs: Math.round(avgMs),
      successRate,
    };
  });

// ---------- Workflows CRUD ----------
export const listWorkflows = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("automation_workflows")
      .select("id, name, description, status, category, tags, run_count, success_count, failure_count, last_run_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { workflows: data ?? [] };
  });

export const getWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const [wf, runs, versions] = await Promise.all([
      context.supabase.from("automation_workflows").select("*").eq("id", data.id).maybeSingle(),
      context.supabase.from("automation_workflow_runs").select("id, status, started_at, completed_at, duration_ms, progress, error_message, trigger_source").eq("workflow_id", data.id).order("started_at", { ascending: false }).limit(25),
      context.supabase.from("automation_workflow_versions").select("id, version, note, created_at").eq("workflow_id", data.id).order("version", { ascending: false }).limit(20),
    ]);
    if (wf.error) throw new Error(wf.error.message);
    return { workflow: wf.data, runs: runs.data ?? [], versions: versions.data ?? [] };
  });

export const createWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    category: z.string().optional(),
    graph: GraphSchema.optional(),
    trigger: z.record(z.string(), z.unknown()).optional(),
    variables: z.record(z.string(), z.unknown()).optional(),
    templateKey: z.string().optional(),
  }).parse(v))
  .handler(async ({ data, context }) => {
    // If templateKey provided, hydrate from templates
    let graph = data.graph ?? { nodes: [], edges: [] };
    let trigger = data.trigger ?? {};
    let variables = data.variables ?? {};
    let category = data.category;
    if (data.templateKey) {
      const { data: tpl } = await context.supabase
        .from("automation_templates")
        .select("graph, trigger, variables, category")
        .eq("key", data.templateKey).maybeSingle();
      if (tpl) {
        graph = (tpl.graph as unknown) as WorkflowGraph;
        trigger = (tpl.trigger as unknown) as Record<string, unknown>;
        variables = (tpl.variables as unknown) as Record<string, unknown>;
        category = category ?? tpl.category;
        await context.supabase.from("automation_templates")
          .update({ usage_count: 1 }).eq("key", data.templateKey);
      }
    }
    const { data: row, error } = await context.supabase
      .from("automation_workflows")
      .insert({
        owner_id: context.userId,
        name: data.name,
        description: data.description,
        category,
        graph: graph as never,
        trigger: trigger as never,
        variables: variables as never,
        status: "draft",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const updateWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({
    id: z.string().uuid(),
    name: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(["draft","active","paused","archived"]).optional(),
    graph: GraphSchema.optional(),
    trigger: z.record(z.string(), z.unknown()).optional(),
    variables: z.record(z.string(), z.unknown()).optional(),
    retryPolicy: z.object({ count: z.number(), delaySeconds: z.number(), fallbackWorkflowId: z.string().optional() }).optional(),
    schedule: z.record(z.string(), z.unknown()).optional(),
    createVersion: z.boolean().optional(),
    versionNote: z.string().optional(),
  }).parse(v))
  .handler(async ({ data, context }) => {
    if (data.createVersion) {
      const { data: cur } = await context.supabase.from("automation_workflows").select("name, graph, trigger, variables").eq("id", data.id).maybeSingle();
      if (cur) {
        const { data: max } = await context.supabase.from("automation_workflow_versions").select("version").eq("workflow_id", data.id).order("version", { ascending: false }).limit(1).maybeSingle();
        const nextVersion = ((max?.version ?? 0) as number) + 1;
        await context.supabase.from("automation_workflow_versions").insert({
          workflow_id: data.id,
          owner_id: context.userId,
          version: nextVersion,
          name: cur.name,
          graph: cur.graph as never,
          trigger: cur.trigger as never,
          variables: cur.variables as never,
          note: data.versionNote,
        });
      }
    }
    const patch: Record<string, unknown> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.description !== undefined) patch.description = data.description;
    if (data.status !== undefined) patch.status = data.status;
    if (data.graph !== undefined) patch.graph = data.graph;
    if (data.trigger !== undefined) patch.trigger = data.trigger;
    if (data.variables !== undefined) patch.variables = data.variables;
    if (data.retryPolicy !== undefined) patch.retry_policy = data.retryPolicy;
    if (data.schedule !== undefined) patch.schedule = data.schedule;
    const { error } = await context.supabase.from("automation_workflows").update(patch as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("automation_workflows").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Run controls ----------
export const runWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({
    id: z.string().uuid(),
    payload: z.record(z.string(), z.unknown()).optional(),
    source: z.string().optional(),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const runId = await startWorkflowRun(context.supabase, context.userId, data.id, {
      triggerSource: data.source ?? "manual",
      triggerPayload: data.payload,
    });
    return { runId };
  });

export const stepWorkflowRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ runId: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    await stepRun(context.supabase, data.runId);
    return { ok: true };
  });

export const cancelWorkflowRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ runId: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("automation_workflow_runs").update({
      status: "cancelled", completed_at: new Date().toISOString(),
    }).eq("id", data.runId).in("status", ["running","waiting","retrying"]);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const retryWorkflowRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ runId: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: run } = await context.supabase.from("automation_workflow_runs").select("workflow_id, context").eq("id", data.runId).maybeSingle();
    if (!run) throw new Error("Run not found");
    const runId = await startWorkflowRun(context.supabase, context.userId, run.workflow_id, {
      triggerSource: "retry",
      triggerPayload: (run.context as Record<string, unknown>) ?? {},
    });
    return { runId };
  });

export const getRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: run, error } = await context.supabase.from("automation_workflow_runs").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    return { run };
  });

// ---------- Templates ----------
export const listTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("automation_templates")
      .select("id, key, name, description, category, icon, tags, usage_count")
      .order("category", { ascending: true });
    if (error) throw new Error(error.message);
    return { templates: data ?? [] };
  });

// ---------- Scheduler tick (invoked by pg_cron via public route) ----------
export const runSchedulerTick = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return tickWaiters(context.supabase, 25);
  });

// ---------- Legacy compat aliases (do not remove — kept for /admin/automation-hub UI) ----------
type LegacyWf = { id: string; name: string; description: string | null; status: string };
type LegacyRun = { id: string; workflow_id: string; status: string; started_at: string };

export const listAutomationWorkflows = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ ok: true; workflows: LegacyWf[] }> => {
    const { data } = await context.supabase
      .from("automation_workflows")
      .select("id, name, description, status")
      .order("updated_at", { ascending: false })
      .limit(200);
    return { ok: true, workflows: (data ?? []) as LegacyWf[] };
  });

export const listAutomationRuns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ limit: z.number().optional() }).parse(v ?? {}))
  .handler(async ({ data, context }): Promise<{ ok: true; runs: LegacyRun[] }> => {
    const { data: rows } = await context.supabase
      .from("automation_workflow_runs")
      .select("id, workflow_id, status, started_at")
      .order("started_at", { ascending: false })
      .limit(data.limit ?? 25);
    return { ok: true, runs: (rows ?? []) as LegacyRun[] };
  });

export const getAutomationWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }): Promise<{ ok: true; workflow: Record<string, string | number | boolean | null> | null }> => {
    const { data: row } = await context.supabase.from("automation_workflows").select("id, name, description, status").eq("id", data.id).maybeSingle();
    return { ok: true, workflow: (row as Record<string, string | number | boolean | null> | null) ?? null };
  });

export const upsertAutomationWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({
    id: z.string().uuid().optional(),
    name: z.string(),
    description: z.string().optional(),
    status: z.string().optional(),
    graph: z.record(z.string(), z.unknown()).optional(),
    trigger: z.record(z.string(), z.unknown()).optional(),
  }).parse(v))
  .handler(async ({ data, context }): Promise<{ ok: true; id: string }> => {
    if (data.id) {
      await context.supabase.from("automation_workflows").update({
        name: data.name, description: data.description ?? null, status: data.status ?? "draft",
        graph: (data.graph ?? { nodes: [], edges: [] }) as never,
        trigger: (data.trigger ?? {}) as never,
      } as never).eq("id", data.id);
      return { ok: true, id: data.id };
    }
    const { data: row } = await context.supabase.from("automation_workflows").insert({
      owner_id: context.userId, name: data.name, description: data.description ?? null,
      status: data.status ?? "draft",
      graph: (data.graph ?? { nodes: [], edges: [] }) as never,
      trigger: (data.trigger ?? {}) as never,
    }).select("id").single();
    return { ok: true, id: row!.id };
  });

export const testRunAutomationWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }): Promise<{ ok: true; runId: string }> => {
    const runId = await startWorkflowRun(context.supabase, context.userId, data.id, { triggerSource: "test-run" });
    return { ok: true, runId };
  });

