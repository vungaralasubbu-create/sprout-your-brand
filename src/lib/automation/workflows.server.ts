/**
 * Workflow executor — walks a workflow_run through its graph.
 * Called by:
 *   - the tick worker (for delayed runs whose wait_until <= now)
 *   - workflows.functions.ts start-run helper (to advance immediately)
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { AutomationGraph, AutomationNodeBase, WorkflowRow } from "./types";
import { dispatch, type Channel } from "./channels.server";

type Sb = SupabaseClient<Database>;

interface RunRow {
  id: string;
  workflow_id: string;
  user_id: string | null;
  brand_id: string | null;
  current_node_id: string | null;
  status: string;
  context: Record<string, unknown>;
  history: unknown[];
}

function nextNode(graph: AutomationGraph, currentId: string, handle?: string): AutomationNodeBase | null {
  const edge = graph.edges.find(
    (e) => e.source === currentId && (handle ? e.sourceHandle === handle : !e.sourceHandle || e.sourceHandle === "out"),
  );
  if (!edge) return null;
  return graph.nodes.find((n) => n.id === edge.target) ?? null;
}

async function resolveRecipient(sb: Sb, userId: string, channel: Channel): Promise<string | null> {
  if (channel === "inapp" || channel === "push") return userId;
  const { data: user } = await sb.auth.admin?.getUserById?.(userId).catch(() => ({ data: null })) ?? { data: null };
  const email = (user as { user?: { email?: string } })?.user?.email;
  if (channel === "email") return email ?? null;
  // sms / whatsapp — look up phone from student_profiles if available
  const { data: prof } = await sb.from("student_profiles").select("phone").eq("user_id", userId).maybeSingle();
  return (prof as { phone?: string } | null)?.phone ?? email ?? null;
}

export async function advanceRun(sb: Sb, run: RunRow, workflow: WorkflowRow): Promise<void> {
  const graph = workflow.graph;
  let nodeId = run.current_node_id;
  if (!nodeId) {
    const triggerNode = graph.nodes.find((n) => n.type === "trigger");
    nodeId = triggerNode?.id ?? graph.nodes[0]?.id ?? null;
  }
  if (!nodeId) {
    await sb.from("automation_workflow_runs").update({ status: "exited", completed_at: new Date().toISOString() }).eq("id", run.id);
    return;
  }

  const history: unknown[] = [...(run.history ?? [])];
  let safety = 0;

  while (nodeId && safety < 30) {
    safety += 1;
    const node = graph.nodes.find((n) => n.id === nodeId);
    if (!node) break;

    if (node.type === "exit") {
      history.push({ node: nodeId, at: new Date().toISOString(), action: "exit" });
      await sb
        .from("automation_workflow_runs")
        .update({ status: "completed", current_node_id: nodeId, history: history as never, completed_at: new Date().toISOString() })
        .eq("id", run.id);
      return;
    }

    if (node.type === "goal") {
      history.push({ node: nodeId, at: new Date().toISOString(), action: "goal_met" });
      await sb
        .from("automation_workflow_runs")
        .update({ status: "goal_met", current_node_id: nodeId, history: history as never, completed_at: new Date().toISOString() })
        .eq("id", run.id);
      return;
    }

    if (node.type === "delay") {
      const d = node.data as { value?: number; unit?: string };
      const ms =
        (d.value ?? 1) *
        (d.unit === "minutes" ? 60000 : d.unit === "hours" ? 3600000 : 86400000);
      const waitUntil = new Date(Date.now() + ms).toISOString();
      const next = nextNode(graph, nodeId);
      history.push({ node: nodeId, at: new Date().toISOString(), action: "delay", waitUntil });
      await sb
        .from("automation_workflow_runs")
        .update({ current_node_id: next?.id ?? nodeId, wait_until: waitUntil, status: "running", history: history as never })
        .eq("id", run.id);
      return; // executor stops; tick will resume
    }

    if (node.type === "send") {
      const d = node.data as { channel?: Channel; subject?: string; body?: string; template_key?: string };
      const channel = (d.channel ?? "email") as Channel;
      const recipient = run.user_id ? await resolveRecipient(sb, run.user_id, channel) : null;
      if (recipient) {
        await dispatch(sb, channel, {
          userId: run.user_id ?? "",
          brandId: run.brand_id,
          workflowRunId: run.id,
          recipient,
          subject: d.subject,
          body: d.body ?? "",
          template_key: d.template_key,
        });
        history.push({ node: nodeId, at: new Date().toISOString(), action: "send", channel });
      } else {
        history.push({ node: nodeId, at: new Date().toISOString(), action: "send_skipped", reason: "no_recipient" });
      }
      const next = nextNode(graph, nodeId);
      nodeId = next?.id ?? null;
      continue;
    }

    if (node.type === "condition" || node.type === "branch") {
      const d = node.data as { field?: string; op?: string; value?: unknown };
      const ctx = run.context ?? {};
      let matched = false;
      if (d.field) {
        const actual = (ctx as Record<string, unknown>)[d.field];
        if (d.op === "eq") matched = actual === d.value;
        else if (d.op === "neq") matched = actual !== d.value;
        else if (d.op === "gte") matched = typeof actual === "number" && typeof d.value === "number" && actual >= d.value;
        else if (d.op === "lte") matched = typeof actual === "number" && typeof d.value === "number" && actual <= d.value;
        else matched = Boolean(actual);
      }
      const next = nextNode(graph, nodeId, matched ? "yes" : "no");
      history.push({ node: nodeId, at: new Date().toISOString(), action: "branch", matched });
      nodeId = next?.id ?? null;
      continue;
    }

    if (node.type === "notify_partner") {
      const d = node.data as { partnerId?: string; message?: string };
      if (d.partnerId) {
        await sb.from("automation_channel_messages").insert({
          user_id: d.partnerId,
          brand_id: run.brand_id,
          workflow_run_id: run.id,
          channel: "inapp",
          recipient: d.partnerId,
          subject: "Automation notification",
          body: d.message ?? "You have a new automation event.",
          status: "sent",
          provider: "inapp",
          sent_at: new Date().toISOString(),
        } as never);
        history.push({ node: nodeId, at: new Date().toISOString(), action: "notify_partner" });
      }
      const next = nextNode(graph, nodeId);
      nodeId = next?.id ?? null;
      continue;
    }

    // trigger or unknown — just move on
    const next = nextNode(graph, nodeId);
    nodeId = next?.id ?? null;
  }

  await sb
    .from("automation_workflow_runs")
    .update({ status: "completed", current_node_id: nodeId, history: history as never, completed_at: new Date().toISOString() })
    .eq("id", run.id);
}

export async function tickWaitingRuns(sb: Sb, limit = 100): Promise<number> {
  const now = new Date().toISOString();
  const { data: runs } = await sb
    .from("automation_workflow_runs")
    .select("*")
    .eq("status", "running")
    .not("wait_until", "is", null)
    .lte("wait_until", now)
    .limit(limit);

  if (!runs || runs.length === 0) return 0;

  const workflowIds = [...new Set(runs.map((r) => r.workflow_id))];
  const { data: wfs } = await sb.from("automation_workflows").select("*").in("id", workflowIds);
  const wfMap = new Map<string, WorkflowRow>();
  for (const w of wfs ?? []) wfMap.set(w.id, w as unknown as WorkflowRow);

  let advanced = 0;
  for (const r of runs) {
    const wf = wfMap.get(r.workflow_id);
    if (!wf) continue;
    try {
      // clear wait_until so the loop resumes past the delay
      await sb.from("automation_workflow_runs").update({ wait_until: null }).eq("id", r.id);
      await advanceRun(sb, r as unknown as RunRow, wf);
      advanced += 1;
    } catch (err) {
      console.error("[automation] advanceRun failed", r.id, err);
    }
  }
  return advanced;
}

export async function startRunForEvent(sb: Sb, workflowId: string, userId: string, brandId: string | null): Promise<string | null> {
  const { data: wf } = await sb.from("automation_workflows").select("*").eq("id", workflowId).maybeSingle();
  if (!wf || wf.status !== "active") return null;
  const { data: run, error } = await sb
    .from("automation_workflow_runs")
    .insert({ workflow_id: workflowId, user_id: userId, brand_id: brandId, status: "running" })
    .select("*")
    .single();
  if (error || !run) return null;
  await advanceRun(sb, run as unknown as RunRow, wf as unknown as WorkflowRow);
  return run.id;
}
