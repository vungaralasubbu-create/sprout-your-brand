/**
 * Secure AI Pipeline
 * ------------------
 * Composes the security primitives into a single pre-request / post-
 * response wrapper for AI calls:
 *
 *   1. requirePermission(userId, "ai.chat")
 *   2. rateLimit user+route (fixed window)
 *   3. quota check (hard-stop when configured)
 *   4. budget check (credit ceiling)
 *   5. policy engine (input) → block / redact / warn / log
 *   6. execute inner call
 *   7. policy engine (output)
 *   8. record quota + budget usage
 *   9. audit trail on every decision
 *
 * Wraps `executeChat` in the AI Platform without modifying it.
 */

import type { ChatMessage, ChatResponse } from "@/lib/ai/providers/types";
import { auditLog } from "./audit-log.server";
import { checkBudget, recordBudgetEvent } from "./budget-manager.server";
import { evaluateOutput, evaluatePrompt } from "./policy-engine.server";
import { getUserRoles, hasPermission } from "./permissions.server";
import { checkQuota, recordQuotaUsage } from "./quota-manager.server";
import { limitByUserAndRoute } from "./rate-limiter.server";
import type { AppRole, PolicyDecision } from "./types";

export interface SecureChatInput {
  userId: string;
  ip?: string;
  userAgent?: string;
  requestId?: string;
  route?: string;                    // for rate-limit bucket, e.g. "ai_chat"
  permission?: string;               // defaults to "ai.chat"
  quotaKey?: string;                 // defaults to "ai_chat_requests"
  rateLimit?: { limit: number; windowSeconds?: number };
  messages: ChatMessage[];
  profile?: Record<string, unknown>; // pass-through to AI platform
  temperature?: number;
  maxTokens?: number;
  tools?: Array<{ name: string; description: string; parameters: any }>;
  responseSchema?: any;
  estimatedCredits?: number;         // pre-flight cost hint
}

export interface SecureChatResult {
  ok: boolean;
  denied?: { code: string; message: string; details?: unknown };
  result?: ChatResponse;
  inputPolicy?: PolicyDecision;
  outputPolicy?: PolicyDecision;
}

async function firstRole(userId: string): Promise<AppRole | undefined> {
  const roles = await getUserRoles(userId);
  return roles[0];
}

export async function secureExecuteChat(input: SecureChatInput): Promise<SecureChatResult> {
  const permission = input.permission ?? "ai.chat";
  const quotaKey = input.quotaKey ?? "ai_chat_requests";
  const route = input.route ?? "ai_chat";
  const role = await firstRole(input.userId);
  const ctx = {
    actorUserId: input.userId,
    actorRole: role,
    ip: input.ip,
    userAgent: input.userAgent,
    requestId: input.requestId,
  };

  // 1. Permission
  if (!(await hasPermission(input.userId, permission))) {
    await auditLog({ ...ctx, action: `${permission}.denied`, outcome: "denied", riskLevel: "medium", resourceType: "ai", metadata: { reason: "missing_permission" } });
    return { ok: false, denied: { code: "forbidden", message: `Missing permission ${permission}` } };
  }

  // 2. Rate limit
  if (input.rateLimit) {
    const rl = await limitByUserAndRoute(input.userId, route, input.rateLimit.limit, input.rateLimit.windowSeconds ?? 60);
    if (!rl.ok) {
      await auditLog({ ...ctx, action: "rate_limit.exceeded", outcome: "denied", riskLevel: "low", resourceType: "ai", metadata: { ...rl } });
      return { ok: false, denied: { code: "rate_limited", message: "Rate limit exceeded", details: rl } };
    }
  }

  // 3. Quota
  const q = await checkQuota({ userId: input.userId, role, quotaKey });
  if (!q.ok) {
    await auditLog({ ...ctx, action: "quota.exceeded", outcome: "denied", riskLevel: "medium", resourceType: "ai", metadata: { ...q } });
    return { ok: false, denied: { code: "quota_exceeded", message: "Quota exceeded", details: q } };
  }

  // 4. Budget
  const b = await checkBudget({ userId: input.userId, role }, input.estimatedCredits ?? 0);
  if (!b.ok) {
    await auditLog({ ...ctx, action: "budget.exceeded", outcome: "denied", riskLevel: "high", resourceType: "ai", metadata: { ...b } });
    return { ok: false, denied: { code: "budget_exceeded", message: "Budget exceeded", details: b } };
  }

  // 5. Input policy
  const userText = input.messages.map((m) => m.content).join("\n");
  const inputPolicy = await evaluatePrompt(userText, { userId: input.userId, role, requestId: input.requestId });
  if (!inputPolicy.allowed) {
    await auditLog({ ...ctx, action: "policy.blocked_input", outcome: "denied", riskLevel: inputPolicy.severity, resourceType: "ai", metadata: { reasons: inputPolicy.reasons } });
    return { ok: false, denied: { code: "policy_blocked", message: "Prompt blocked by policy", details: inputPolicy.reasons }, inputPolicy };
  }

  // Apply any policy-driven redactions to the outgoing messages.
  let outgoingMessages = input.messages;
  if (inputPolicy.redactedText) {
    const original = userText;
    const redacted = inputPolicy.redactedText;
    if (original !== redacted) {
      // Redact only the LAST user turn to keep prior context stable.
      outgoingMessages = [...input.messages];
      for (let i = outgoingMessages.length - 1; i >= 0; i--) {
        if (outgoingMessages[i].role === "user") {
          outgoingMessages[i] = { ...outgoingMessages[i], content: redacted };
          break;
        }
      }
    }
  }

  // 6. Execute AI
  const { executeChat } = await import("@/lib/ai/router/failover.server");
  const exec = await executeChat(
    { ...(input.profile ?? {}), kind: "chat", needsTools: !!input.tools?.length, needsStructured: !!input.responseSchema } as any,
    {
      messages: outgoingMessages,
      temperature: input.temperature,
      maxTokens: input.maxTokens,
      tools: input.tools,
      responseSchema: input.responseSchema,
    },
    input.userId,
  );

  if (!exec.ok || !exec.result) {
    await auditLog({ ...ctx, action: "ai.execution_failed", outcome: "error", riskLevel: "low", resourceType: "ai", metadata: { error: exec.error, attempts: exec.attempts } });
    return { ok: false, denied: { code: exec.error?.code ?? "ai_failed", message: exec.error?.message ?? "AI failed", details: exec.attempts }, inputPolicy };
  }

  // 7. Output policy
  const outputPolicy = await evaluateOutput(exec.result.content, { userId: input.userId, role, requestId: input.requestId });
  let finalContent = exec.result.content;
  if (!outputPolicy.allowed) {
    await auditLog({ ...ctx, action: "policy.blocked_output", outcome: "denied", riskLevel: outputPolicy.severity, resourceType: "ai", metadata: { reasons: outputPolicy.reasons } });
    return {
      ok: false,
      denied: { code: "output_blocked", message: "Response blocked by policy", details: outputPolicy.reasons },
      inputPolicy,
      outputPolicy,
    };
  }
  if (outputPolicy.redactedText) finalContent = outputPolicy.redactedText;

  // 8. Record usage + budget
  await Promise.all([
    recordQuotaUsage({ userId: input.userId, quotaKey, delta: 1, role }),
    recordBudgetEvent({
      ctx: { userId: input.userId, role },
      credits: input.estimatedCredits ?? 0,
      source: route,
      requestId: input.requestId,
    }),
  ]);

  // 9. Success audit
  await auditLog({
    ...ctx,
    action: "ai.chat.completed",
    outcome: "allowed",
    riskLevel: "low",
    resourceType: "ai",
    metadata: {
      chosen: exec.chosen,
      inputSeverity: inputPolicy.severity,
      outputSeverity: outputPolicy.severity,
      redactedInput: !!inputPolicy.redactedText,
      redactedOutput: !!outputPolicy.redactedText,
      usage: exec.result.usage,
    },
  });

  return {
    ok: true,
    result: { ...exec.result, content: finalContent },
    inputPolicy,
    outputPolicy,
  };
}
