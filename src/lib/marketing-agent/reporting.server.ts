// Reporting engine — assembles the Morning Brief and periodic reports from
// the agent's own metrics, decisions, recommendations, and plans. AI writes
// the executive summary; numbers come straight from the database.

import { aiChat } from "@/lib/ai/router.server";
// New ma_* tables aren't in generated Database types yet; use permissive client.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;
import type { AgentRow, ReportKind } from "./types";

type Admin = AnySupabase;

export async function generateReport(
  admin: Admin,
  agent: AgentRow,
  kind: ReportKind,
): Promise<string> {
  const now = new Date();
  const start = new Date(now);
  if (kind === "weekly") start.setDate(now.getDate() - 7);
  else if (kind === "monthly") start.setDate(now.getDate() - 30);
  else if (kind === "quarterly") start.setDate(now.getDate() - 90);
  else if (kind === "annual") start.setDate(now.getDate() - 365);
  else start.setDate(now.getDate() - 1);

  const [snap, decisions, reco, plans] = await Promise.all([
    admin.from("ma_metrics_snapshots").select("day, metrics").eq("agent_id", agent.id)
      .gte("day", start.toISOString().slice(0, 10)).order("day", { ascending: false }).limit(60),
    admin.from("ma_decisions").select("kind, state, rationale, confidence, created_at")
      .eq("agent_id", agent.id).gte("created_at", start.toISOString()).order("created_at", { ascending: false }).limit(60),
    admin.from("ma_recommendations").select("kind, title, priority, state")
      .eq("agent_id", agent.id).gte("created_at", start.toISOString()).order("priority", { ascending: true }).limit(60),
    admin.from("ma_plans").select("horizon, period_start, period_end, plan").eq("agent_id", agent.id)
      .gte("created_at", start.toISOString()).order("created_at", { ascending: false }).limit(20),
  ]);

  const body = {
    metrics: snap.data ?? [],
    decisions: decisions.data ?? [],
    recommendations: reco.data ?? [],
    plans: plans.data ?? [],
  };

  const system = "You are Glintr's marketing operations analyst. Return ONLY JSON.";
  const user =
    `Write a ${kind} report titled and summarised for the founder. ` +
    "Return {\"title\": string, \"summary\": string, \"highlights\": string[], \"next_actions\": string[]}.\n" +
    `Data: ${JSON.stringify(body).slice(0, 12000)}`;
  const raw = (await aiChat({
    system,
    messages: [{ role: "user", content: user }],
    responseFormat: "json",
    temperature: 0.3,
    maxTokens: 1200,
  })) as { title?: string; summary?: string; highlights?: string[]; next_actions?: string[] };

  const title = raw.title ?? `${kind} report`;
  const { data } = await admin.from("ma_reports").insert({
    agent_id: agent.id,
    kind,
    title: title.slice(0, 240),
    summary: (raw.summary ?? "").slice(0, 4000),
    body: {
      highlights: raw.highlights ?? [],
      next_actions: raw.next_actions ?? [],
      data: body,
    } as never,
    period_start: start.toISOString().slice(0, 10),
    period_end: now.toISOString().slice(0, 10),
  }).select("id").maybeSingle();
  return data?.id ?? "";
}
