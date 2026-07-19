/**
 * AI Policy Engine
 * ----------------
 * Loads enabled policies from `ai_policies` (with in-memory TTL cache) and
 * evaluates prompts/outputs. Handles: prompt_injection, pii, regex,
 * blocklist, and model_restriction rules.
 *
 * Each violation is logged to `ai_policy_violations` (hashed text only).
 */

import { detectPromptInjection } from "./prompt-injection.server";
import { detectPII, hashText, redactPII } from "./pii.server";
import type { PolicyAction, PolicyDecision, SecurityContext, Severity } from "./types";

interface PolicyRow {
  id: string;
  name: string;
  scope: string;
  rule_type: string;
  patterns: unknown;
  config: Record<string, unknown> | null;
  action: PolicyAction;
  severity: Severity;
  enabled: boolean;
}

let cache: { at: number; rows: PolicyRow[] } | null = null;
const CACHE_TTL_MS = 60_000;

async function loadPolicies(): Promise<PolicyRow[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.rows;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("ai_policies")
      .select("id,name,scope,rule_type,patterns,config,action,severity,enabled")
      .eq("enabled", true);
    const rows = (data ?? []) as PolicyRow[];
    cache = { at: Date.now(), rows };
    return rows;
  } catch {
    return cache?.rows ?? [];
  }
}

export function invalidatePolicyCache() { cache = null; }

async function recordViolation(params: {
  ctx: SecurityContext;
  policy: PolicyRow;
  matchedText: string;
  actionTaken: string;
}) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("ai_policy_violations").insert({
      user_id: params.ctx.userId ?? null,
      policy_id: params.policy.id,
      policy_name: params.policy.name,
      action_taken: params.actionTaken,
      severity: params.policy.severity,
      request_id: params.ctx.requestId ?? null,
      matched_text_hash: hashText(params.matchedText),
      metadata: { scope: params.policy.scope, rule_type: params.policy.rule_type },
    });
  } catch { /* best-effort */ }
}

function inScope(policy: PolicyRow, ctx: SecurityContext): boolean {
  if (policy.scope === "global") return true;
  if (policy.scope.startsWith("role:")) return policy.scope.slice(5) === ctx.role;
  if (policy.scope.startsWith("agent:")) return true; // agent-level filtering happens in the caller
  return true;
}

function toPatternList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((p): p is string => typeof p === "string");
}

/** Evaluate an inbound prompt (user -> model). */
export async function evaluatePrompt(
  text: string,
  ctx: SecurityContext,
  opts: { direction: "input" | "output" } = { direction: "input" },
): Promise<PolicyDecision> {
  const policies = (await loadPolicies()).filter((p) => inScope(p, ctx));
  const reasons: string[] = [];
  const matched: string[] = [];
  let severity: Severity = "low";
  let action: PolicyAction | "allow" = "allow";
  let workingText = text;

  const bump = (s: Severity) => {
    const order: Severity[] = ["low", "medium", "high", "critical"];
    if (order.indexOf(s) > order.indexOf(severity)) severity = s;
  };
  const escalate = (a: PolicyAction) => {
    const order: (PolicyAction | "allow")[] = ["allow", "log", "warn", "redact", "block"];
    if (order.indexOf(a) > order.indexOf(action)) action = a;
  };

  for (const p of policies) {
    let hit = false;
    let matchedSample = "";

    switch (p.rule_type) {
      case "prompt_injection": {
        // Only run injection checks on user input.
        if (opts.direction !== "input") break;
        const r = detectPromptInjection(workingText);
        if (r.level === "likely" || r.level === "certain") {
          hit = true;
          matchedSample = r.signals.map((s) => s.id).join(",");
        }
        break;
      }
      case "pii": {
        const m = detectPII(workingText);
        if (m.length) {
          hit = true;
          matchedSample = m.map((x) => x.type).join(",");
          if (p.action === "redact") {
            workingText = redactPII(workingText).redacted;
          }
        }
        break;
      }
      case "regex": {
        for (const pat of toPatternList(p.patterns)) {
          try {
            const re = new RegExp(pat, "i");
            const m = workingText.match(re);
            if (m) { hit = true; matchedSample = m[0].slice(0, 60); break; }
          } catch { /* skip invalid regex */ }
        }
        break;
      }
      case "blocklist": {
        const needle = toPatternList(p.patterns).find((w) => workingText.toLowerCase().includes(w.toLowerCase()));
        if (needle) { hit = true; matchedSample = needle; }
        break;
      }
      case "model_restriction": {
        // Enforced by caller inspecting `config.allowed_models`; log-only here.
        break;
      }
      case "max_tokens": {
        const cfg = p.config as { max?: number } | null;
        if (cfg?.max && workingText.length / 4 > cfg.max) { hit = true; matchedSample = "length"; }
        break;
      }
      default: break;
    }

    if (hit) {
      matched.push(p.name);
      bump(p.severity);
      escalate(p.action);
      reasons.push(`${p.name} (${p.rule_type}:${p.action}:${p.severity})`);
      await recordViolation({ ctx, policy: p, matchedText: matchedSample, actionTaken: p.action });
    }
  }

  const allowed = action !== "block";
  return {
    allowed,
    action,
    severity,
    reasons,
    matchedPolicies: matched,
    redactedText: workingText !== text ? workingText : undefined,
  };
}

/** Evaluate an outbound model response. Used for output filtering. */
export async function evaluateOutput(text: string, ctx: SecurityContext): Promise<PolicyDecision> {
  return evaluatePrompt(text, ctx, { direction: "output" });
}
