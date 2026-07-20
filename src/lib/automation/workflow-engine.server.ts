/**
 * Workflow Engine — universal execution runtime.
 *
 * Executes a workflow graph node-by-node. Each node dispatches to a
 * handler that reuses existing platform primitives:
 *   - AI Router (chat + analysis)   → executeChat
 *   - Generation Engine             → submitGeneration (text/image/blog…)
 *   - Publisher                     → publishing_jobs insert
 *   - Approval Center               → approval_queue insert
 *   - Notifications                 → automation_notifications insert
 *
 * The engine never talks to providers directly.
 *
 * Node types supported in graph.nodes[].type:
 *   trigger | action | delay | condition | approval | notification | loop | api
 *
 * Runs persist in automation_workflow_runs: current_step_index,
 * progress, error_message, retry_count, output, and a `history` jsonb.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { submitGeneration } from "@/lib/generation-engine/engine.server";
import { executeChat } from "@/lib/ai/router/failover.server";
import { buildBrandSystemPrompt } from "@/lib/marketing-os/brand-context.server";

// ------- Types -------
export interface WorkflowNode {
  id: string;
  type: "trigger" | "action" | "delay" | "condition" | "approval" | "notification" | "loop" | "api";
  position?: { x: number; y: number };
  data: {
    kind?: string;
    label?: string;
    [key: string]: unknown;
  };
}
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  label?: string;
}
export interface WorkflowGraph {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

interface RunRow {
  id: string;
  workflow_id: string;
  user_id: string | null;
  status: string;
  context: Record<string, unknown>;
  history: Array<Record<string, unknown>>;
  current_node_id: string | null;
  progress: number;
  retry_count: number;
  output: Record<string, unknown>;
}

interface WorkflowRow {
  id: string;
  owner_id: string;
  name: string;
  graph: WorkflowGraph;
  trigger: Record<string, unknown>;
  variables: Record<string, unknown>;
  retry_policy: { count?: number; delaySeconds?: number; fallbackWorkflowId?: string };
  brand_id: string | null;
}

// ------- Public API -------

/** Start a workflow run. Returns run id. */
export async function startWorkflowRun(
  supabase: SupabaseClient,
  userId: string,
  workflowId: string,
  input: { triggerSource?: string; triggerPayload?: Record<string, unknown> } = {},
): Promise<string> {
  const { data: wf, error } = await supabase
    .from("automation_workflows")
    .select("id, owner_id, name, graph, trigger, variables, retry_policy, brand_id, status")
    .eq("id", workflowId)
    .maybeSingle();
  if (error || !wf) throw new Error(error?.message ?? "Workflow not found");
  if (wf.status === "paused") throw new Error("Workflow is paused");

  const startNode = findStartNode(wf.graph as WorkflowGraph);
  if (!startNode) throw new Error("Workflow has no trigger/start node");

  const { data: run, error: runErr } = await supabase
    .from("automation_workflow_runs")
    .insert({
      workflow_id: workflowId,
      user_id: userId,
      brand_id: wf.brand_id,
      status: "running",
      current_node_id: startNode.id,
      current_step_index: 0,
      progress: 0,
      trigger_source: input.triggerSource ?? "manual",
      trigger_payload: input.triggerPayload ?? {},
      context: { variables: wf.variables ?? {}, ...(input.triggerPayload ?? {}) },
      history: [],
    })
    .select("id")
    .single();
  if (runErr || !run) throw new Error(runErr?.message ?? "Could not create run");

  await supabase.from("automation_workflows").update({
    run_count: ((wf as unknown as { run_count?: number }).run_count ?? 0) + 1,
    last_run_at: new Date().toISOString(),
  }).eq("id", workflowId);

  // Execute inline for the current step; long-running/waiting steps
  // hand control back and pg_cron will resume via tickWaiters().
  await stepRun(supabase, run.id);
  return run.id;
}

/** Execute the current step of a run. */
export async function stepRun(supabase: SupabaseClient, runId: string): Promise<void> {
  const { data: run, error } = await supabase
    .from("automation_workflow_runs")
    .select("id, workflow_id, user_id, status, context, history, current_node_id, progress, retry_count, output")
    .eq("id", runId)
    .maybeSingle();
  if (error || !run) return;
  if (!["running", "waiting", "retrying"].includes(run.status)) return;

  const { data: wf } = await supabase
    .from("automation_workflows")
    .select("id, owner_id, name, graph, trigger, variables, retry_policy, brand_id")
    .eq("id", run.workflow_id)
    .maybeSingle();
  if (!wf) return;

  const runRow = run as unknown as RunRow;
  const wfRow = wf as unknown as WorkflowRow;
  const graph = wfRow.graph;
  const node = graph.nodes.find((n) => n.id === runRow.current_node_id);
  if (!node) {
    await completeRun(supabase, runRow, "completed");
    return;
  }

  const t0 = Date.now();
  try {
    const result = await executeNode(supabase, wfRow, runRow, node);
    const history = [
      ...(runRow.history ?? []),
      { nodeId: node.id, kind: node.data.kind ?? node.type, at: new Date().toISOString(), ms: Date.now() - t0, ok: true, result: safeSummary(result) },
    ];

    if (result?.wait) {
      await supabase.from("automation_workflow_runs").update({
        status: "waiting",
        wait_until: result.wait,
        history,
      }).eq("id", runRow.id);
      return;
    }

    const nextId = pickNext(graph, node, result?.branch);
    const total = graph.nodes.length;
    const done = history.length;
    const progress = Math.min(99, Math.round((done / total) * 100));

    if (!nextId) {
      await supabase.from("automation_workflow_runs").update({
        status: "completed",
        history,
        current_node_id: null,
        progress: 100,
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - new Date((runRow as unknown as { started_at?: string }).started_at ?? Date.now()).getTime(),
      }).eq("id", runRow.id);
      await supabase.from("automation_workflows")
        .update({ success_count: await incr(supabase, wfRow.id, "success_count") })
        .eq("id", wfRow.id);
      return;
    }

    await supabase.from("automation_workflow_runs").update({
      status: "running",
      current_node_id: nextId,
      progress,
      history,
    }).eq("id", runRow.id);
    // Immediately advance to next step (bounded — pg_cron picks up remainder)
    await stepRun(supabase, runId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const retryPolicy = wfRow.retry_policy ?? {};
    const maxRetries = Number(retryPolicy.count ?? 2);
    if (runRow.retry_count < maxRetries) {
      const delay = Number(retryPolicy.delaySeconds ?? 30) * 1000;
      await supabase.from("automation_workflow_runs").update({
        status: "retrying",
        retry_count: runRow.retry_count + 1,
        wait_until: new Date(Date.now() + delay).toISOString(),
        history: [...(runRow.history ?? []), { nodeId: node.id, at: new Date().toISOString(), ok: false, error: message }],
      }).eq("id", runRow.id);
    } else {
      await supabase.from("automation_workflow_runs").update({
        status: "failed",
        error_message: message,
        completed_at: new Date().toISOString(),
        history: [...(runRow.history ?? []), { nodeId: node.id, at: new Date().toISOString(), ok: false, error: message }],
      }).eq("id", runRow.id);
      await supabase.from("automation_workflows")
        .update({ failure_count: await incr(supabase, wfRow.id, "failure_count") })
        .eq("id", wfRow.id);
    }
  }
}

/** Called by pg_cron / scheduler: resume waiting/retrying runs. */
export async function tickWaiters(supabase: SupabaseClient, limit = 25): Promise<{ processed: number }> {
  const now = new Date().toISOString();
  const { data: due } = await supabase
    .from("automation_workflow_runs")
    .select("id")
    .in("status", ["waiting", "retrying"])
    .lte("wait_until", now)
    .limit(limit);
  const ids = (due ?? []).map((r: { id: string }) => r.id);
  for (const id of ids) {
    await supabase.from("automation_workflow_runs")
      .update({ status: "running", wait_until: null })
      .eq("id", id);
    await stepRun(supabase, id);
  }
  return { processed: ids.length };
}

// ------- Node dispatch -------

interface NodeResult {
  wait?: string;                    // ISO — pause run until this time
  branch?: "yes" | "no" | string;   // for condition nodes
  output?: Record<string, unknown>;
}

async function executeNode(
  supabase: SupabaseClient,
  wf: WorkflowRow,
  run: RunRow,
  node: WorkflowNode,
): Promise<NodeResult | null> {
  const kind = String(node.data.kind ?? node.type);
  const ctx = run.context ?? {};

  switch (kind) {
    // --- entry / no-op ---
    case "trigger":
    case "manual":
    case "webhook":
    case "scheduled":
    case "event":
      return { output: { started: true } };

    // --- delay ---
    case "delay": {
      const amount = Number(node.data.amount ?? 1);
      const unit = String(node.data.unit ?? "minutes");
      const ms = toMs(amount, unit);
      return { wait: new Date(Date.now() + ms).toISOString() };
    }

    // --- condition ---
    case "condition": {
      const expr = String(node.data.expression ?? "true");
      const branch = evalCondition(expr, ctx) ? "yes" : "no";
      return { branch, output: { branch } };
    }

    // --- generation engine ---
    case "generate-content":
    case "generate-post": {
      const count = Number(node.data.count ?? 1);
      const outputs: unknown[] = [];
      for (let i = 0; i < count; i++) {
        const job = await submitGeneration(supabase, wf.owner_id, {
          contentType: "text",
          prompt: String(node.data.prompt ?? `Marketing post for ${wf.name} (${i + 1}/${count})`),
          brandId: wf.brand_id ?? undefined,
          campaignId: (ctx as { campaignId?: string }).campaignId,
          approvalRequired: true,
        });
        outputs.push({ jobId: job.id, status: job.status });
      }
      return { output: { generated: outputs.length, jobs: outputs } };
    }
    case "generate-image":
    case "generate-banner": {
      const job = await submitGeneration(supabase, wf.owner_id, {
        contentType: "image",
        prompt: String(node.data.prompt ?? `Image for ${wf.name}`),
        brandId: wf.brand_id ?? undefined,
        aspectRatio: String(node.data.aspectRatio ?? "1:1"),
        approvalRequired: true,
      });
      return { output: { jobId: job.id, status: job.status } };
    }
    case "generate-blog": {
      const job = await submitGeneration(supabase, wf.owner_id, {
        contentType: "text",
        prompt: String(node.data.prompt ?? `Write an SEO blog post for ${wf.name}`),
        brandId: wf.brand_id ?? undefined,
        approvalRequired: true,
      });
      return { output: { jobId: job.id } };
    }
    case "generate-plan":
    case "generate-marketing-plan": {
      const brandSystem = await buildBrandSystemPrompt(supabase, wf.owner_id).catch(() => "");
      const chat = await executeChat(
        { kind: "chat", quality: "balanced" },
        {
          messages: [
            { role: "system", content: brandSystem || "You are a marketing strategist." },
            { role: "user", content: String(node.data.prompt ?? "Draft a 30-day marketing plan.") },
          ],
        } as Parameters<typeof executeChat>[1],
      );
      return { output: { text: chat.ok ? (chat.result as { content?: string }).content ?? "" : "" } };
    }

    // --- AI analysis / router ---
    case "ai-analysis":
    case "run-ai-analysis": {
      const chat = await executeChat(
        { kind: "chat", quality: "fast" },
        {
          messages: [
            { role: "system", content: "Provide a concise analytical summary." },
            { role: "user", content: String(node.data.prompt ?? "Summarize current context.") },
          ],
        } as Parameters<typeof executeChat>[1],
      );
      return { output: { text: chat.ok ? (chat.result as { content?: string }).content ?? "" : "" } };
    }

    // --- publish (via Publisher: publishing_jobs) ---
    case "publish":
    case "publish-content": {
      const contentItemId = String(node.data.contentItemId ?? (ctx as { contentItemId?: string }).contentItemId ?? "");
      const platforms = (node.data.platforms as string[] | undefined) ?? ["facebook", "linkedin", "x"];
      if (!contentItemId) return { output: { skipped: "no content" } };
      for (const platform of platforms) {
        await supabase.from("publishing_jobs").insert({
          owner_id: wf.owner_id,
          content_item_id: contentItemId,
          platform,
          status: "queued",
          scheduled_at: new Date().toISOString(),
        }).select().maybeSingle();
      }
      return { output: { queued: platforms.length } };
    }

    // --- approval ---
    case "queue-approval":
    case "approve-content": {
      await supabase.from("approval_queue").insert({
        owner_id: wf.owner_id,
        brand_id: wf.brand_id,
        content_type: String(node.data.contentType ?? "text"),
        prompt: String(node.data.prompt ?? node.data.label ?? "Workflow-generated content"),
        status: "pending",
        source: "workflow",
        metadata: { workflowId: wf.id, runId: run.id } as never,
      });
      return { output: { queued: true } };
    }

    // --- notifications ---
    case "notify":
    case "send-notification": {
      await supabase.from("automation_notifications").insert({
        user_id: wf.owner_id,
        kind: String(node.data.channel ?? "in-app"),
        title: String(node.data.title ?? `Workflow: ${wf.name}`),
        body: String(node.data.body ?? node.data.label ?? "Workflow event"),
        status: "unread",
        payload: { workflowId: wf.id, runId: run.id } as never,
      }).select().maybeSingle();
      return { output: { notified: true } };
    }

    // --- email / crm placeholders (integrations handled by respective modules) ---
    case "send-email": {
      await supabase.from("engage_messages").insert({
        owner_id: wf.owner_id,
        channel: "email",
        subject: String(node.data.subject ?? node.data.label ?? "Follow-up"),
        content: String(node.data.body ?? "Automated email"),
        status: "queued",
        source: "workflow",
        metadata: { workflowId: wf.id, runId: run.id } as never,
      }).select().maybeSingle();
      return { output: { queued: true } };
    }
    case "crm-stage":
    case "move-crm-stage": {
      const leadId = String((ctx as { leadId?: string }).leadId ?? node.data.leadId ?? "");
      const stage = String(node.data.stage ?? "hot");
      if (leadId) {
        await supabase.from("platform_leads").update({ status: stage }).eq("id", leadId);
      }
      return { output: { leadId, stage } };
    }

    // --- external / api ---
    case "api-call":
    case "call-api": {
      const url = String(node.data.url ?? "");
      if (!url) return { output: { skipped: true } };
      const method = String(node.data.method ?? "POST");
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...((node.data.headers as Record<string, string>) ?? {}) },
        body: method === "GET" ? undefined : JSON.stringify(node.data.body ?? {}),
      });
      return { output: { status: res.status } };
    }

    default:
      // Unknown kind — record and continue, don't fail the workflow.
      return { output: { skipped: true, unknown: kind } };
  }
}

// ------- Helpers -------

function findStartNode(graph: WorkflowGraph): WorkflowNode | null {
  const targets = new Set(graph.edges.map((e) => e.target));
  return graph.nodes.find((n) => n.type === "trigger" || !targets.has(n.id)) ?? graph.nodes[0] ?? null;
}

function pickNext(graph: WorkflowGraph, node: WorkflowNode, branch?: string): string | null {
  const edges = graph.edges.filter((e) => e.source === node.id);
  if (edges.length === 0) return null;
  if (branch) {
    const match = edges.find((e) => (e.sourceHandle ?? e.label)?.toLowerCase() === branch.toLowerCase());
    if (match) return match.target;
  }
  return edges[0].target;
}

function toMs(amount: number, unit: string): number {
  const u = unit.toLowerCase();
  if (u.startsWith("second")) return amount * 1000;
  if (u.startsWith("minute")) return amount * 60_000;
  if (u.startsWith("hour"))   return amount * 3_600_000;
  if (u.startsWith("day"))    return amount * 86_400_000;
  if (u.startsWith("week"))   return amount * 7 * 86_400_000;
  if (u.startsWith("month"))  return amount * 30 * 86_400_000;
  return amount * 60_000;
}

function evalCondition(expr: string, ctx: Record<string, unknown>): boolean {
  // Sandboxed micro-DSL: field.op.value.  Examples:
  //   lead.score > 60
  //   revenue >= 1000
  //   status == "hot"
  try {
    const m = expr.match(/^\s*([\w.]+)\s*(==|!=|>=|<=|>|<)\s*(.+?)\s*$/);
    if (!m) return Boolean(expr);
    const [, path, op, rawVal] = m;
    const left = path.split(".").reduce<unknown>((acc, k) => (acc as Record<string, unknown> | undefined)?.[k], ctx);
    let right: string | number = rawVal.trim().replace(/^["']|["']$/g, "");
    if (!Number.isNaN(Number(right))) right = Number(right);
    switch (op) {
      case "==": return left == right; // eslint-disable-line eqeqeq
      case "!=": return left != right; // eslint-disable-line eqeqeq
      case ">":  return Number(left) >  Number(right);
      case "<":  return Number(left) <  Number(right);
      case ">=": return Number(left) >= Number(right);
      case "<=": return Number(left) <= Number(right);
    }
    return false;
  } catch {
    return false;
  }
}

function safeSummary(result: NodeResult | null): unknown {
  if (!result) return null;
  return { branch: result.branch, waitedUntil: result.wait ?? null, output: result.output ?? null };
}

async function incr(supabase: SupabaseClient, workflowId: string, column: "success_count" | "failure_count"): Promise<number> {
  const { data } = await supabase.from("automation_workflows").select(column).eq("id", workflowId).maybeSingle();
  return Number((data as Record<string, number> | null)?.[column] ?? 0) + 1;
}

async function completeRun(supabase: SupabaseClient, run: RunRow, status: "completed" | "failed" | "cancelled"): Promise<void> {
  await supabase.from("automation_workflow_runs").update({
    status,
    completed_at: new Date().toISOString(),
    progress: status === "completed" ? 100 : run.progress,
  }).eq("id", run.id);
}
