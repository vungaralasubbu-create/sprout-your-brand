/**
 * Automation Engine — shared types.
 * Keep this browser-safe (no server imports) so components can typecheck.
 */
export type JobStatus =
  | "queued"
  | "running"
  | "waiting_approval"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "dead_letter";

export interface JobRecord {
  id: string;
  handler: string;
  owner_id: string | null;
  parent_job_id: string | null;
  approval_id: string | null;
  idempotency_key: string | null;
  priority: number;
  status: JobStatus;
  attempts: number;
  max_attempts: number;
  backoff_seconds: number;
  timeout_seconds: number;
  run_at: string;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  last_error: string | null;
  correlation_id: string | null;
}

export interface HandlerContext {
  jobId: string;
  handler: string;
  ownerId: string | null;
  payload: Record<string, unknown>;
  attempts: number;
  correlationId: string | null;
  log: (message: string, data?: Record<string, unknown>) => void;
}

export interface HandlerResult {
  ok: boolean;
  data?: Record<string, unknown>;
  followUps?: EnqueueSpec[];
  notifications?: NotificationSpec[];
  /** Force a specific retry delay (seconds) instead of backoff. */
  retryInSeconds?: number;
}

export interface EnqueueSpec {
  handler: string;
  payload?: Record<string, unknown>;
  runAt?: Date;
  priority?: number;
  ownerId?: string | null;
  idempotencyKey?: string;
  maxAttempts?: number;
  backoffSeconds?: number;
  parentJobId?: string;
  correlationId?: string;
  approvalId?: string;
}

export interface NotificationSpec {
  recipientUserId?: string;
  recipientRole?: string;
  channel: "in_app" | "email" | "webhook" | "sms";
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}

export type Handler = (ctx: HandlerContext) => Promise<HandlerResult>;
