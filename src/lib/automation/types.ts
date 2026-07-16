// Glintr Automation Studio — core types
export type BlockKind =
  | "trigger"
  | "condition"
  | "action"
  | "delay"
  | "ai_action"
  | "notification"
  | "approval"
  | "webhook"
  | "integration"
  | "loop"
  | "end";

export type WorkflowStatus = "active" | "draft" | "scheduled" | "paused";

export type RunStatus = "success" | "failed" | "running" | "skipped" | "waiting_approval";

export interface BlockDef {
  id: string;
  kind: BlockKind;
  label: string;
  description: string;
  icon?: string;
  configSchema?: Array<{ key: string; label: string; type: "text" | "number" | "select" | "boolean"; options?: string[]; default?: any }>;
}

export interface WorkflowNode {
  id: string;
  defId: string; // reference to BlockDef.id
  kind: BlockKind;
  label: string;
  x: number;
  y: number;
  config: Record<string, any>;
  next?: string | null; // next node id
  branchYes?: string | null; // condition true
  branchNo?: string | null;  // condition false
}

export interface WorkflowVersion {
  version: number;
  publishedAt: string;
  editor: string;
  note?: string;
  nodes: WorkflowNode[];
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  trigger: string; // trigger def id
  schedule?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  nodes: WorkflowNode[];
  version: number;
  history: WorkflowVersion[];
  errorPolicy: "retry" | "skip" | "notify" | "pause";
  maxRetries: number;
  permissionRole: "administrator" | "operations" | "marketing" | "content" | "support" | "finance" | "auditor";
}

export interface RunStep {
  nodeId: string;
  label: string;
  status: RunStatus;
  startedAt: string;
  finishedAt?: string;
  message?: string;
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  workflowName: string;
  status: RunStatus;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  triggeredBy: string;
  steps: RunStep[];
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  event: "created" | "updated" | "deleted" | "executed" | "failed" | "published" | "rolled_back";
  workflowId: string;
  workflowName: string;
  detail?: string;
}
