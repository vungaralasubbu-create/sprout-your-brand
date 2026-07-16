// Local-first automation store — persists workflows, runs and audit log to localStorage.
import type { Workflow, WorkflowNode, WorkflowRun, AuditEntry, RunStep } from "./types";
import { seedWorkflowsFromTemplates, TEMPLATES } from "./templates";
import { findBlock } from "./blocks";

const KEY_WF = "glintr.automation.workflows.v1";
const KEY_RUNS = "glintr.automation.runs.v1";
const KEY_AUDIT = "glintr.automation.audit.v1";
const KEY_SEED = "glintr.automation.seeded.v1";

function isBrowser() { return typeof window !== "undefined"; }

function readJSON<T>(k: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) as T : fallback; } catch { return fallback; }
}
function writeJSON<T>(k: string, v: T) {
  if (!isBrowser()) return;
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}

function ensureSeed() {
  if (!isBrowser()) return;
  if (localStorage.getItem(KEY_SEED)) return;
  const wfs = seedWorkflowsFromTemplates();
  writeJSON(KEY_WF, wfs);
  // seed a few runs
  const runs: WorkflowRun[] = wfs.flatMap((wf) => {
    return [
      makeSyntheticRun(wf.id, wf.name, wf.nodes, "success", 3),
      makeSyntheticRun(wf.id, wf.name, wf.nodes, "success", 30),
      makeSyntheticRun(wf.id, wf.name, wf.nodes, "failed", 60),
    ];
  });
  writeJSON(KEY_RUNS, runs);
  const audit: AuditEntry[] = wfs.map((wf, i) => ({
    id: `a_${i}`, at: new Date(Date.now() - i * 3600000).toISOString(),
    actor: "system", event: "created", workflowId: wf.id, workflowName: wf.name,
  }));
  writeJSON(KEY_AUDIT, audit);
  localStorage.setItem(KEY_SEED, "1");
}

function makeSyntheticRun(wfId: string, name: string, nodes: WorkflowNode[], status: WorkflowRun["status"], minsAgo: number): WorkflowRun {
  const started = new Date(Date.now() - minsAgo * 60000);
  const steps: RunStep[] = nodes.slice(0, Math.max(2, Math.min(nodes.length, 4))).map((nn, idx) => ({
    nodeId: nn.id,
    label: nn.label,
    status: status === "failed" && idx === 2 ? "failed" : "success",
    startedAt: new Date(started.getTime() + idx * 500).toISOString(),
    finishedAt: new Date(started.getTime() + idx * 500 + 400).toISOString(),
    message: status === "failed" && idx === 2 ? "Simulated failure" : undefined,
  }));
  return {
    id: `run_${wfId}_${minsAgo}`,
    workflowId: wfId,
    workflowName: name,
    status,
    startedAt: started.toISOString(),
    finishedAt: new Date(started.getTime() + 2500).toISOString(),
    durationMs: 2500,
    triggeredBy: "system",
    steps,
  };
}

// ---- Workflows ----
export function listWorkflows(): Workflow[] {
  ensureSeed();
  return readJSON<Workflow[]>(KEY_WF, []);
}
export function getWorkflow(id: string): Workflow | undefined {
  return listWorkflows().find((w) => w.id === id);
}
export function saveWorkflow(wf: Workflow) {
  const all = listWorkflows();
  const idx = all.findIndex((w) => w.id === wf.id);
  const now = new Date().toISOString();
  const next = { ...wf, updatedAt: now };
  if (idx === -1) all.push(next); else all[idx] = next;
  writeJSON(KEY_WF, all);
  addAudit({ actor: "admin", event: idx === -1 ? "created" : "updated", workflowId: wf.id, workflowName: wf.name });
}
export function deleteWorkflow(id: string) {
  const all = listWorkflows();
  const wf = all.find((w) => w.id === id);
  writeJSON(KEY_WF, all.filter((w) => w.id !== id));
  if (wf) addAudit({ actor: "admin", event: "deleted", workflowId: id, workflowName: wf.name });
}
export function publishWorkflow(id: string, note?: string) {
  const wf = getWorkflow(id);
  if (!wf) return;
  const nextVer = wf.version + 1;
  wf.version = nextVer;
  wf.status = "active";
  wf.history = [...wf.history, { version: nextVer, publishedAt: new Date().toISOString(), editor: "admin", nodes: wf.nodes, note }];
  saveWorkflow(wf);
  addAudit({ actor: "admin", event: "published", workflowId: id, workflowName: wf.name, detail: `v${nextVer}` });
}
export function rollbackWorkflow(id: string, version: number) {
  const wf = getWorkflow(id);
  if (!wf) return;
  const ver = wf.history.find((h) => h.version === version);
  if (!ver) return;
  wf.nodes = ver.nodes.map((n) => ({ ...n }));
  saveWorkflow(wf);
  addAudit({ actor: "admin", event: "rolled_back", workflowId: id, workflowName: wf.name, detail: `to v${version}` });
}
export function duplicateWorkflow(id: string): Workflow | undefined {
  const wf = getWorkflow(id);
  if (!wf) return;
  const now = new Date().toISOString();
  const copy: Workflow = { ...wf, id: `wf_${Math.random().toString(36).slice(2, 9)}`, name: wf.name + " (copy)", status: "draft", createdAt: now, updatedAt: now, version: 1, history: [{ version: 1, publishedAt: now, editor: "admin", nodes: wf.nodes, note: "Duplicated" }] };
  saveWorkflow(copy);
  return copy;
}

export function createWorkflowFromTemplate(templateId: string): Workflow {
  const t = TEMPLATES.find((x) => x.id === templateId);
  const now = new Date().toISOString();
  const id = `wf_${Math.random().toString(36).slice(2, 9)}`;
  const wf: Workflow = t ? {
    id, name: t.name, description: t.description, status: "draft", trigger: t.trigger, tags: [t.category],
    createdAt: now, updatedAt: now, createdBy: "admin", nodes: t.nodes.map((n) => ({ ...n })), version: 1,
    history: [{ version: 1, publishedAt: now, editor: "admin", nodes: t.nodes.map((n) => ({ ...n })), note: `From template ${t.name}` }],
    errorPolicy: "retry", maxRetries: 3, permissionRole: "administrator",
  } : blankWorkflow(id);
  saveWorkflow(wf);
  return wf;
}

export function blankWorkflow(id: string): Workflow {
  const now = new Date().toISOString();
  const tNode: WorkflowNode = { id: "t", defId: "trg.student_registered", kind: "trigger", label: "Trigger", x: 80, y: 60, config: {}, next: "e" };
  const eNode: WorkflowNode = { id: "e", defId: "end.stop", kind: "end", label: "End", x: 80, y: 200, config: {}, next: null };
  return {
    id, name: "Untitled Workflow", description: "", status: "draft", trigger: "trg.student_registered",
    tags: [], createdAt: now, updatedAt: now, createdBy: "admin", nodes: [tNode, eNode], version: 1,
    history: [{ version: 1, publishedAt: now, editor: "admin", nodes: [tNode, eNode], note: "Blank" }],
    errorPolicy: "retry", maxRetries: 3, permissionRole: "administrator",
  };
}

// ---- Runs ----
export function listRuns(): WorkflowRun[] { ensureSeed(); return readJSON<WorkflowRun[]>(KEY_RUNS, []); }
export function addRun(run: WorkflowRun) {
  const all = listRuns(); all.unshift(run); writeJSON(KEY_RUNS, all.slice(0, 500));
}

export function testRunWorkflow(id: string): WorkflowRun {
  const wf = getWorkflow(id);
  if (!wf) throw new Error("Workflow not found");
  const started = new Date();
  const steps: RunStep[] = [];
  // simple linear walk following .next
  let cur: WorkflowNode | undefined = wf.nodes.find((n) => n.kind === "trigger") ?? wf.nodes[0];
  let guard = 0;
  while (cur && guard < 40) {
    guard++;
    const requiresApproval = cur.kind === "approval" || (cur.kind === "ai_action" && /email|blog|faq|followup|outline/.test(cur.defId));
    const status: RunStep["status"] = requiresApproval ? "waiting_approval" : "success";
    steps.push({
      nodeId: cur.id, label: cur.label, status,
      startedAt: new Date(started.getTime() + guard * 250).toISOString(),
      finishedAt: new Date(started.getTime() + guard * 250 + 200).toISOString(),
      message: requiresApproval ? "Human approval required" : undefined,
    });
    if (cur.kind === "end") break;
    const nextId: string | null | undefined = cur.next ?? null;
    if (!nextId) break;
    cur = wf.nodes.find((n) => n.id === nextId);
  }
  const overall: WorkflowRun["status"] = steps.some((s) => s.status === "failed") ? "failed" : steps.some((s) => s.status === "waiting_approval") ? "waiting_approval" : "success";
  const run: WorkflowRun = {
    id: `run_test_${Date.now()}`, workflowId: wf.id, workflowName: wf.name, status: overall,
    startedAt: started.toISOString(), finishedAt: new Date().toISOString(),
    durationMs: Date.now() - started.getTime(), triggeredBy: "admin (test)", steps,
  };
  addRun(run);
  addAudit({ actor: "admin", event: overall === "failed" ? "failed" : "executed", workflowId: wf.id, workflowName: wf.name, detail: `Test run ${overall}` });
  return run;
}

// ---- Audit ----
export function listAudit(): AuditEntry[] { ensureSeed(); return readJSON<AuditEntry[]>(KEY_AUDIT, []); }
export function addAudit(e: Omit<AuditEntry, "id" | "at">) {
  const all = listAudit();
  all.unshift({ ...e, id: `a_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, at: new Date().toISOString() });
  writeJSON(KEY_AUDIT, all.slice(0, 1000));
}

// ---- Analytics helpers ----
export function analytics() {
  const wfs = listWorkflows();
  const runs = listRuns();
  const successCount = runs.filter((r) => r.status === "success").length;
  const failCount = runs.filter((r) => r.status === "failed").length;
  const total = runs.length || 1;
  const rate = Math.round((successCount / total) * 100);
  const avgMs = runs.length ? Math.round(runs.reduce((s, r) => s + (r.durationMs ?? 0), 0) / runs.length) : 0;
  const active = wfs.filter((w) => w.status === "active").length;
  const draft = wfs.filter((w) => w.status === "draft").length;
  const scheduled = wfs.filter((w) => w.status === "scheduled").length;

  // Popular actions
  const counter = new Map<string, number>();
  wfs.forEach((w) => w.nodes.forEach((n) => counter.set(n.defId, (counter.get(n.defId) ?? 0) + 1)));
  const popular = [...counter.entries()]
    .map(([id, count]) => ({ id, label: findBlock(id)?.label ?? id, count }))
    .sort((a, b) => b.count - a.count).slice(0, 6);

  return { active, draft, scheduled, total: wfs.length, runs: runs.length, successCount, failCount, rate, avgMs, popular };
}

// Node graph edit helpers
export function addNodeToWorkflow(id: string, defId: string, x: number, y: number): Workflow | undefined {
  const wf = getWorkflow(id); if (!wf) return;
  const def = findBlock(defId); if (!def) return;
  const nid = `n_${Math.random().toString(36).slice(2, 8)}`;
  wf.nodes.push({ id: nid, defId, kind: def.kind, label: def.label, x, y, config: {}, next: null });
  saveWorkflow(wf); return wf;
}
export function updateNode(id: string, nodeId: string, patch: Partial<WorkflowNode>): Workflow | undefined {
  const wf = getWorkflow(id); if (!wf) return;
  wf.nodes = wf.nodes.map((n) => n.id === nodeId ? { ...n, ...patch } : n);
  saveWorkflow(wf); return wf;
}
export function removeNode(id: string, nodeId: string): Workflow | undefined {
  const wf = getWorkflow(id); if (!wf) return;
  wf.nodes = wf.nodes.filter((n) => n.id !== nodeId).map((n) => ({ ...n, next: n.next === nodeId ? null : n.next, branchYes: n.branchYes === nodeId ? null : n.branchYes, branchNo: n.branchNo === nodeId ? null : n.branchNo }));
  saveWorkflow(wf); return wf;
}
export function connectNodes(id: string, from: string, to: string): Workflow | undefined {
  return updateNode(id, from, { next: to });
}
