// Marketing Agent memory — winning creatives / CTAs / subjects / landings /
// videos / keywords, plus general patterns. Every write is idempotent per
// (agent, kind, key); scores are rolling exponential moving averages.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { KnowledgeKind } from "./types";

type Admin = SupabaseClient<never, "public", "public", never, never>;

const ALPHA = 0.35; // EMA weight for the new observation

export async function remember(
  admin: Admin,
  agentId: string,
  kind: KnowledgeKind,
  key: string,
  value: Record<string, unknown>,
  observedScore: number,
) {
  const { data: existing } = await admin
    .from("ma_knowledge")
    .select("id, score, value")
    .eq("agent_id", agentId).eq("kind", kind).eq("key", key)
    .maybeSingle();

  if (!existing) {
    await admin.from("ma_knowledge").insert({
      agent_id: agentId, kind, key, value: value as never, score: observedScore,
    });
    return;
  }
  const prev = Number(existing.score ?? 0);
  const merged = { ...(existing.value as Record<string, unknown> ?? {}), ...value };
  const nextScore = prev === 0 ? observedScore : ALPHA * observedScore + (1 - ALPHA) * prev;
  await admin.from("ma_knowledge").update({
    value: merged as never,
    score: nextScore,
    last_seen_at: new Date().toISOString(),
  }).eq("id", existing.id);
}

export async function topWins(admin: Admin, agentId: string, kind: KnowledgeKind, limit = 5) {
  const { data } = await admin
    .from("ma_knowledge")
    .select("key, value, score")
    .eq("agent_id", agentId).eq("kind", kind)
    .order("score", { ascending: false, nullsFirst: false })
    .limit(limit);
  return data ?? [];
}
