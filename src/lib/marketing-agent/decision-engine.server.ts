// AI Decision Engine — turns metrics + plan into concrete decision proposals
// (pause / scale / budget_up / budget_down / create_ab / generate_asset /
// generate_video / generate_landing / generate_email). Every decision is
// persisted with rationale and a confidence score, and only executed when the
// agent's approval level permits it.

import { aiChat } from "@/lib/ai/router.server";
// New ma_* tables aren't in generated Database types yet; use permissive client.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;
import type { AgentRow, DecisionProposal } from "./types";

type Admin = AnySupabase;

export async function proposeDecisions(
  agent: AgentRow,
  metrics: Record<string, unknown>,
): Promise<DecisionProposal[]> {
  const system =
    "You are Glintr's marketing decision engine. Return ONLY JSON. " +
    "Each decision must include kind, action, rationale, confidence (0..1).";

  const user =
    "Based on the metrics below, recommend up to 10 concrete decisions.\n" +
    "Allowed kinds: pause, scale, budget_up, budget_down, create_ab, " +
    "generate_asset, generate_video, generate_landing, generate_email, other.\n" +
    `Metrics: ${JSON.stringify(metrics)}\n` +
    "Return {\"decisions\": [{...}]}";

  const raw = (await aiChat({
    system,
    messages: [{ role: "user", content: user }],
    responseFormat: "json",
    temperature: 0.3,
    maxTokens: 1400,
  })) as { decisions?: unknown };

  const arr = Array.isArray(raw?.decisions) ? raw.decisions : [];
  const proposals: DecisionProposal[] = [];
  for (const r of arr) {
    const rec = r as Record<string, unknown>;
    if (!rec.kind) continue;
    proposals.push({
      kind: String(rec.kind) as DecisionProposal["kind"],
      target_kind: rec.target_kind ? String(rec.target_kind) : undefined,
      target_id: rec.target_id ? String(rec.target_id) : undefined,
      action: (rec.action ?? {}) as Record<string, unknown>,
      rationale: String(rec.rationale ?? ""),
      confidence: Math.max(0, Math.min(1, Number(rec.confidence ?? 0.5))),
    });
  }
  // Silence unused param warning; keeps signature future-proof for guardrails.
  void agent;
  return proposals.slice(0, 10);
}

/** Persist a decision. Fully-auto agents mark high-confidence decisions as
 *  approved for the tick worker to execute; otherwise they wait for review. */
export async function recordDecision(
  admin: Admin,
  agent: AgentRow,
  p: DecisionProposal,
): Promise<string | null> {
  const autoApprove =
    agent.approval_level === "fully_auto" && p.confidence >= 0.75;
  const initialState =
    agent.approval_level === "suggest_only" ? "proposed" :
    autoApprove ? "approved" : "proposed";

  const { data } = await admin.from("ma_decisions").insert({
    agent_id: agent.id,
    kind: p.kind,
    target_kind: p.target_kind ?? null,
    target_id: p.target_id ?? null,
    action: p.action as never,
    rationale: p.rationale,
    confidence: p.confidence,
    state: initialState,
  }).select("id").maybeSingle();
  return data?.id ?? null;
}

/** Execute a single approved decision. Only pause/scale/budget_* touch
 *  existing campaign rows; asset/video/landing/email decisions become
 *  co_tasks the Campaign Orchestrator picks up on its next tick. */
export async function executeDecision(admin: Admin, decisionId: string) {
  const { data: d } = await admin.from("ma_decisions").select("*").eq("id", decisionId).maybeSingle();
  if (!d || d.state !== "approved") return { ok: false, reason: "not_approved" };

  const action = (d.action ?? {}) as Record<string, unknown>;
  const campaignId = (d.target_id ?? action.campaign_id) as string | undefined;

  try {
    switch (d.kind) {
      case "pause":
        if (campaignId) await admin.from("co_campaigns").update({ status: "paused" }).eq("id", campaignId);
        break;
      case "scale":
      case "budget_up":
      case "budget_down": {
        if (campaignId) {
          const delta = Number(action.delta ?? (d.kind === "budget_down" ? -0.2 : 0.2));
          const { data: c } = await admin.from("co_campaigns").select("budget").eq("id", campaignId).maybeSingle();
          const current = Number((c as { budget?: number } | null)?.budget ?? 0);
          const next = Math.max(0, current * (1 + delta));
          await admin.from("co_campaigns").update({ budget: next }).eq("id", campaignId);
        }
        break;
      }
      case "create_ab":
        if (campaignId) {
          await admin.from("co_ab_tests").insert({
            campaign_id: campaignId,
            metric: String(action.metric ?? "ctr"),
            hypothesis: String(action.hypothesis ?? ""),
            variant_asset_ids: (action.variant_asset_ids as string[]) ?? [],
          });
        }
        break;
      case "generate_asset":
      case "generate_video":
      case "generate_landing":
      case "generate_email":
        if (campaignId) {
          await admin.from("co_tasks").insert({
            campaign_id: campaignId,
            kind: d.kind === "generate_asset" ? "creative"
                : d.kind === "generate_video" ? "video"
                : d.kind === "generate_landing" ? "landing"
                : "email",
            status: "queued",
            payload: action as never,
          });
        }
        break;
      default:
        break;
    }
    await admin.from("ma_decisions").update({ state: "executed", executed_at: new Date().toISOString() }).eq("id", d.id);
    return { ok: true };
  } catch (e) {
    await admin.from("ma_decisions").update({ state: "failed" }).eq("id", d.id);
    return { ok: false, reason: e instanceof Error ? e.message : String(e) };
  }
}
