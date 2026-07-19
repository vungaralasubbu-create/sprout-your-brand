// Growth engine — asks the AI Router for new courses / skills / certifications
// / career paths / internships / webinars worth adding, based on the agent's
// goals and recent traffic. Writes them as ma_recommendations for humans (or
// fully-auto agents) to act on.

import { aiChat } from "@/lib/ai/router.server";
// New ma_* tables aren't in generated Database types yet; use permissive client.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;
import type { AgentRow } from "./types";

type Admin = AnySupabase;

export async function generateGrowthRecommendations(
  admin: Admin,
  agent: AgentRow,
): Promise<number> {
  const system =
    "You are Glintr's growth strategist. Return ONLY JSON.";
  const user =
    "Recommend up to 8 growth items — mix of new courses, trending skills, " +
    "certifications, career paths, internship programs, and webinar topics.\n" +
    `Brand goals: ${JSON.stringify(agent.goals ?? {})}\n` +
    `Channels: ${JSON.stringify(agent.channels ?? [])}\n` +
    "Return {\"items\":[{\"kind\":\"course|skill|certification|career|internship|webinar\",\"title\":\"...\",\"why\":\"...\",\"impact\":1-5}]}";

  const raw = (await aiChat({
    system,
    messages: [{ role: "user", content: user }],
    responseFormat: "json",
    temperature: 0.6,
    maxTokens: 1200,
  })) as { items?: unknown };

  const items = Array.isArray(raw?.items) ? raw.items : [];
  let count = 0;
  for (const r of items.slice(0, 8)) {
    const rec = r as Record<string, unknown>;
    if (!rec.title) continue;
    await admin.from("ma_recommendations").insert({
      agent_id: agent.id,
      kind: (rec.kind === "course" ? "course" : "growth"),
      title: String(rec.title).slice(0, 200),
      detail: rec as never,
      priority: Math.max(1, Math.min(5, Number(rec.impact ?? 3))),
    });
    count += 1;
  }
  return count;
}
