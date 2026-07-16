// Local-first storage for the Glintr AI Execution Engine.
import { useCallback, useEffect, useState } from "react";
import type { ApproverRole, ExecutionMode, QaCheck, Workflow, WorkflowStep } from "./catalog";
import { QA_CHECKS, WORKFLOWS } from "./catalog";

const KEY_RUNS = "glintr.execution.runs.v1";
const KEY_SETTINGS = "glintr.execution.settings.v1";
const KEY_AUDIT = "glintr.execution.audit.v1";

export type StepStatus = "pending" | "running" | "waiting_approval" | "done" | "failed" | "rolled_back";

export type StepInstance = {
  id: string;
  stepId: string;
  title: string;
  agent: string;
  produces: string;
  status: StepStatus;
  requiresApproval: boolean;
  approver?: ApproverRole;
  startedAt?: number;
  completedAt?: number;
  output?: string;
  approvedBy?: string;
  approvedAt?: number;
  rejectedReason?: string;
};

export type RunStatus =
  | "draft"
  | "queued"
  | "running"
  | "paused_for_approval"
  | "review"
  | "published"
  | "failed"
  | "rolled_back";

export type QaResult = { check: QaCheck; status: "pass" | "warn" | "fail"; note?: string };

export type RunRecord = {
  id: string;
  workflowId: string;
  workflowName: string;
  mode: ExecutionMode;
  command?: string;
  status: RunStatus;
  startedAt: number;
  updatedAt: number;
  steps: StepInstance[];
  qa: QaResult[];
  metrics: {
    tasksExecuted: number;
    hoursSaved: number;
    contentGenerated: number;
    campaignsPublished: number;
    revenueInfluenced: number;
    seoImprovements: number;
    admissionsGenerated: number;
  };
};

export type AuditEntry = {
  id: string;
  at: number;
  runId: string;
  workflowName: string;
  actor: string;
  action: string;
  detail?: string;
};

export type ExecutionSettings = {
  defaultMode: ExecutionMode;
  perWorkflowMode: Record<string, ExecutionMode>;
  activeApprovers: ApproverRole[];
  selfCheckEnabled: boolean;
  qaBlockOnFail: boolean;
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}
function write<T>(key: string, val: T) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(key, JSON.stringify(val)); } catch {}
}
function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

const DEFAULT_SETTINGS: ExecutionSettings = {
  defaultMode: "approval",
  perWorkflowMode: {},
  activeApprovers: ["content", "marketing", "seo", "founder", "academy_owner"],
  selfCheckEnabled: true,
  qaBlockOnFail: true,
};

export function useExecutionSettings() {
  const [settings, setSettings] = useState<ExecutionSettings>(DEFAULT_SETTINGS);
  useEffect(() => { setSettings({ ...DEFAULT_SETTINGS, ...read<ExecutionSettings>(KEY_SETTINGS, DEFAULT_SETTINGS) }); }, []);
  const update = useCallback((patch: Partial<ExecutionSettings>) => {
    setSettings((prev) => { const next = { ...prev, ...patch }; write(KEY_SETTINGS, next); return next; });
  }, []);
  const setWorkflowMode = useCallback((workflowId: string, mode: ExecutionMode) => {
    setSettings((prev) => { const next = { ...prev, perWorkflowMode: { ...prev.perWorkflowMode, [workflowId]: mode } }; write(KEY_SETTINGS, next); return next; });
  }, []);
  return { settings, update, setWorkflowMode };
}

export function useAudit() {
  const [items, setItems] = useState<AuditEntry[]>([]);
  useEffect(() => { setItems(read<AuditEntry[]>(KEY_AUDIT, [])); }, []);
  const push = useCallback((entry: Omit<AuditEntry, "id" | "at">) => {
    setItems((prev) => {
      const next = [{ ...entry, id: uid(), at: Date.now() }, ...prev].slice(0, 500);
      write(KEY_AUDIT, next);
      return next;
    });
  }, []);
  return { items, push };
}

function buildSteps(workflow: Workflow): StepInstance[] {
  return workflow.steps.map((step: WorkflowStep) => ({
    id: uid(),
    stepId: step.id,
    title: step.title,
    agent: step.agent,
    produces: step.produces,
    status: "pending" as StepStatus,
    requiresApproval: !!step.requiresApproval,
    approver: step.approver,
  }));
}

function buildQa(): QaResult[] {
  return QA_CHECKS.map((check) => ({ check, status: "pass" as const }));
}

export function useRuns() {
  const [items, setItems] = useState<RunRecord[]>([]);
  useEffect(() => { setItems(read<RunRecord[]>(KEY_RUNS, [])); }, []);
  const persist = (next: RunRecord[]) => { setItems(next); write(KEY_RUNS, next); };

  const start = useCallback((workflowId: string, mode: ExecutionMode, command?: string): RunRecord | null => {
    const wf = WORKFLOWS.find((w) => w.id === workflowId);
    if (!wf) return null;
    const run: RunRecord = {
      id: uid(),
      workflowId,
      workflowName: wf.name,
      mode,
      command,
      status: mode === "suggestion" ? "draft" : "running",
      startedAt: Date.now(),
      updatedAt: Date.now(),
      steps: buildSteps(wf),
      qa: buildQa(),
      metrics: {
        tasksExecuted: 0,
        hoursSaved: wf.metrics.hoursSaved,
        contentGenerated: 0,
        campaignsPublished: 0,
        revenueInfluenced: 0,
        seoImprovements: 0,
        admissionsGenerated: 0,
      },
    };
    setItems((prev) => { const next = [run, ...prev].slice(0, 200); write(KEY_RUNS, next); return next; });
    return run;
  }, []);

  const patchRun = useCallback((id: string, patch: Partial<RunRecord>) => {
    setItems((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, ...patch, updatedAt: Date.now() } : r));
      write(KEY_RUNS, next);
      return next;
    });
  }, []);

  const patchStep = useCallback((runId: string, stepId: string, patch: Partial<StepInstance>) => {
    setItems((prev) => {
      const next = prev.map((r) =>
        r.id !== runId ? r : {
          ...r,
          updatedAt: Date.now(),
          steps: r.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)),
        }
      );
      write(KEY_RUNS, next);
      return next;
    });
  }, []);

  const rollback = useCallback((runId: string) => {
    setItems((prev) => {
      const next = prev.map((r) =>
        r.id !== runId ? r : {
          ...r, status: "rolled_back" as RunStatus, updatedAt: Date.now(),
          steps: r.steps.map((s) => ({ ...s, status: s.status === "done" ? ("rolled_back" as StepStatus) : s.status })),
        }
      );
      write(KEY_RUNS, next);
      return next;
    });
  }, []);

  const remove = useCallback((runId: string) => {
    setItems((prev) => { const next = prev.filter((r) => r.id !== runId); write(KEY_RUNS, next); return next; });
  }, []);

  return { items, start, patchRun, patchStep, rollback, remove, persist };
}
