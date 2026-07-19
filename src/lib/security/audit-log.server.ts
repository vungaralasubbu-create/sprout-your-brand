/**
 * Immutable Audit Log
 * -------------------
 * Writes to `security_audit_log`, which has database triggers blocking
 * UPDATE and DELETE for every role including service_role. Use for every
 * security-relevant event (auth grant/revoke, policy denial, budget hit,
 * admin action, secret rotation, PII redaction).
 *
 * Best-effort: never throws — a logging failure must not break the caller.
 */

import type { AuditEntry } from "./types";

export async function auditLog(entry: AuditEntry): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("security_audit_log").insert({
      actor_user_id: entry.actorUserId ?? null,
      actor_role: entry.actorRole ?? null,
      action: entry.action,
      resource_type: entry.resourceType ?? null,
      resource_id: entry.resourceId ?? null,
      outcome: entry.outcome,
      ip: entry.ip ?? null,
      user_agent: entry.userAgent ?? null,
      request_id: entry.requestId ?? null,
      metadata: entry.metadata ?? {},
      risk_level: entry.riskLevel ?? "low",
    });
  } catch (e) {
    // Fall back to server log so we do not lose the event entirely.
    console.warn("[audit-log] failed to persist entry", { action: entry.action, err: String(e) });
  }
}

export async function auditBatch(entries: AuditEntry[]): Promise<void> {
  if (!entries.length) return;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("security_audit_log").insert(
      entries.map((entry) => ({
        actor_user_id: entry.actorUserId ?? null,
        actor_role: entry.actorRole ?? null,
        action: entry.action,
        resource_type: entry.resourceType ?? null,
        resource_id: entry.resourceId ?? null,
        outcome: entry.outcome,
        ip: entry.ip ?? null,
        user_agent: entry.userAgent ?? null,
        request_id: entry.requestId ?? null,
        metadata: entry.metadata ?? {},
        risk_level: entry.riskLevel ?? "low",
      })),
    );
  } catch (e) {
    console.warn("[audit-log] batch persist failed", String(e));
  }
}
