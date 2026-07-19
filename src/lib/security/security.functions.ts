/**
 * Server functions surface for the Security & Governance layer.
 * All handlers require an authenticated caller; admin-only endpoints
 * additionally check `has_role` via `context.supabase`.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// ---- Admin: view audit log ------------------------------------------------

const AuditQuery = z.object({
  limit: z.number().int().min(1).max(500).default(100),
  action: z.string().optional(),
  actorUserId: z.string().uuid().optional(),
  riskLevel: z.enum(["low","medium","high","critical"]).optional(),
});

export const listAuditLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AuditQuery.parse(input))
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("security_audit_log").select("*").order("created_at", { ascending: false }).limit(data.limit);
    if (data.action) q = q.eq("action", data.action);
    if (data.actorUserId) q = q.eq("actor_user_id", data.actorUserId);
    if (data.riskLevel) q = q.eq("risk_level", data.riskLevel);
    const { data: rows, error } = await q;
    if (error) throw error;
    return { rows: rows ?? [] };
  });

// ---- Admin: policy violations --------------------------------------------

export const listPolicyViolations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ limit: z.number().int().max(500).default(100) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("ai_policy_violations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw error;
    return { rows: rows ?? [] };
  });

// ---- Current user: my usage ----------------------------------------------

export const getMyUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("usage_counters")
      .select("quota_key, period_start, used")
      .eq("user_id", context.userId)
      .order("period_start", { ascending: false })
      .limit(50);
    if (error) throw error;
    return { rows: data ?? [] };
  });

// ---- Admin: policy CRUD (uses RLS: super_admin only) ---------------------

const PolicyInput = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  scope: z.string().default("global"),
  ruleType: z.enum(["blocklist","regex","prompt_injection","pii","model_restriction","max_tokens"]),
  patterns: z.array(z.string()).default([]),
  config: z.any().optional(),
  action: z.enum(["block","redact","warn","log"]).default("block"),
  severity: z.enum(["low","medium","high","critical"]).default("medium"),
  enabled: z.boolean().default(true),
});

export const upsertPolicy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PolicyInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("ai_policies")
      .upsert({
        name: data.name,
        description: data.description ?? null,
        scope: data.scope,
        rule_type: data.ruleType,
        patterns: data.patterns,
        config: data.config ?? {},
        action: data.action,
        severity: data.severity,
        enabled: data.enabled,
      }, { onConflict: "name" })
      .select()
      .single();
    if (error) throw error;
    // Bust cache so new policy is picked up immediately.
    const { invalidatePolicyCache } = await import("./policy-engine.server");
    invalidatePolicyCache();
    return { policy: row };
  });

// ---- Health snapshot for the security posture dashboard ------------------

export const getSecurityPosture = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [policies, recentViolations, criticalEvents] = await Promise.all([
      context.supabase.from("ai_policies").select("id, name, enabled, severity, action").limit(100),
      context.supabase.from("ai_policy_violations").select("id, policy_name, severity, created_at").order("created_at", { ascending: false }).limit(20),
      context.supabase.from("security_audit_log").select("id, action, risk_level, created_at").in("risk_level", ["high","critical"]).order("created_at", { ascending: false }).limit(20),
    ]);
    return {
      policies: policies.data ?? [],
      recentViolations: recentViolations.data ?? [],
      criticalEvents: criticalEvents.data ?? [],
    };
  });
