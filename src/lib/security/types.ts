/**
 * Enterprise Security Layer — shared types
 */

export type AppRole =
  | "student"
  | "partner"
  | "mentor"
  | "instructor"
  | "admin"
  | "super_admin"
  | "organization";

export type PolicyAction = "block" | "redact" | "warn" | "log";
export type Severity = "low" | "medium" | "high" | "critical";
export type Outcome = "allowed" | "denied" | "error" | "info";

export interface SecurityContext {
  userId?: string;
  role?: AppRole;
  organizationId?: string;
  ip?: string;
  userAgent?: string;
  requestId?: string;
}

export interface PolicyDecision {
  allowed: boolean;
  action: PolicyAction | "allow";
  severity: Severity;
  reasons: string[];
  redactedText?: string;
  matchedPolicies: string[];
}

export interface QuotaCheck {
  ok: boolean;
  quotaKey: string;
  limit: number;
  used: number;
  remaining: number;
  periodStart: string;
  hardStop: boolean;
}

export interface BudgetCheck {
  ok: boolean;
  budgetId?: string;
  limitCredits: number;
  usedCredits: number;
  remainingCredits: number;
  hardStop: boolean;
  alertTriggered: boolean;
}

export interface RateLimitResult {
  ok: boolean;
  bucketKey: string;
  count: number;
  limit: number;
  windowSeconds: number;
  retryAfterMs?: number;
}

export interface AuditEntry {
  actorUserId?: string;
  actorRole?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  outcome: Outcome;
  ip?: string;
  userAgent?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
  riskLevel?: Severity;
}
