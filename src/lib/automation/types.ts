/**
 * Shared types for the AI Marketing Automation Engine.
 * Client-safe — imported by both UI and server functions.
 */

export type AutomationChannel = "email" | "sms" | "whatsapp" | "push" | "inapp";

export type AutomationEventName =
  | "signup"
  | "login"
  | "logout"
  | "page_view"
  | "course_view"
  | "wishlist_add"
  | "cart_add"
  | "payment"
  | "certificate_earned"
  | "internship_apply"
  | "workshop_register"
  | "partner_no_sales"
  | "brand_no_website"
  | "inactive"
  | "custom";

export interface AutomationNodeBase {
  id: string;
  type: string;
  data: Record<string, unknown>;
  position: { x: number; y: number };
}

export interface AutomationEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  label?: string;
}

export interface AutomationGraph {
  nodes: AutomationNodeBase[];
  edges: AutomationEdge[];
}

export type NodeType =
  | "trigger"
  | "condition"
  | "delay"
  | "send"
  | "branch"
  | "notify_partner"
  | "goal"
  | "exit";

export interface SendNodeData {
  channel: AutomationChannel;
  subject?: string;
  body: string;
  template_key?: string;
}

export interface DelayNodeData {
  value: number;
  unit: "minutes" | "hours" | "days";
}

export interface TriggerNodeData {
  event: AutomationEventName;
  filter?: Record<string, unknown>;
}

export interface WorkflowRow {
  id: string;
  brand_id: string | null;
  owner_id: string | null;
  name: string;
  description: string | null;
  status: "draft" | "active" | "paused";
  trigger: TriggerNodeData;
  graph: AutomationGraph;
  goal: Record<string, unknown> | null;
  stats: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export interface RecommendationRow {
  id: string;
  user_id: string;
  brand_id: string | null;
  kind: string;
  target_id: string | null;
  target_slug: string | null;
  title: string;
  reason: string | null;
  score: number;
  expires_at: string | null;
  dismissed_at: string | null;
  created_at: string;
}

// =====================================================================
// Legacy prototype types (retained for the local-first workflow builder)
// =====================================================================

export interface ConfigField {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "boolean";
  default?: string | number | boolean;
  options?: string[];
}

export interface BlockDef {
  id: string;
  kind:
    | "trigger"
    | "condition"
    | "action"
    | "ai_action"
    | "delay"
    | "notification"
    | "approval"
    | "webhook"
    | "integration"
    | "loop"
    | "end";
  label: string;
  description?: string;
  configSchema?: ConfigField[];
}

export interface WorkflowNode {
  id: string;
  defId: string;
  kind: BlockDef["kind"];
  label: string;
  x: number;
  y: number;
  config: Record<string, unknown>;
  next: string | null;
  branchYes?: string | null;
  branchNo?: string | null;
}

export interface WorkflowHistoryEntry {
  version: number;
  publishedAt: string;
  editor: string;
  nodes: WorkflowNode[];
  note?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: "draft" | "active" | "paused" | "scheduled";
  trigger: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  nodes: WorkflowNode[];
  version: number;
  history: WorkflowHistoryEntry[];
  errorPolicy: "retry" | "skip" | "abort";
  maxRetries: number;
  permissionRole: string;
}

export interface RunStep {
  nodeId: string;
  label: string;
  status: "success" | "failed" | "skipped" | "waiting_approval";
  startedAt: string;
  finishedAt: string;
  message?: string;
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  workflowName: string;
  status: "success" | "failed" | "running" | "waiting_approval";
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  triggeredBy: string;
  steps: RunStep[];
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  event: string;
  workflowId: string;
  workflowName: string;
  detail?: string;
}
