// Content recycling — identify high-performing variants and produce refreshed
// captions / carousel / blog / email variations.

import { aiChat } from "@/lib/ai/router.server";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function detectHighPerformers(ownerId: string, minScore = 5000) {
  const db = await admin();
  const { data } = await db
    .from("soc_analytics")
    .select("variant_id, reach, likes, shares, saves, ctr")
    .eq("owner_id", ownerId)
    .order("measured_at", { ascending: false })
    .limit(500);

  const scores = new Map<string, number>();
  for (const row of data ?? []) {
    const r = row as { variant_id: string; reach: number; likes: number; shares: number; saves: number; ctr: number };
    if (!r.variant_id) continue;
    const score = (r.reach ?? 0) + (r.likes ?? 0) * 2 + (r.shares ?? 0) * 5 + (r.saves ?? 0) * 4 + (r.ctr ?? 0) * 1000;
    scores.set(r.variant_id, Math.max(score, scores.get(r.variant_id) ?? 0));
  }

  const winners = [...scores.entries()].filter(([, s]) => s >= minScore);
  if (winners.length === 0) return { flagged: 0 };

  const rows = winners.map(([variant_id, score]) => ({
    owner_id: ownerId,
    source_variant_id: variant_id,
    score,
    reason: "engagement_threshold",
    status: "pending" as const,
  }));
  await db.from("soc_recycling_candidates").upsert(rows, { onConflict: "id" });
  return { flagged: winners.length };
}

export async function recycleVariant(
  candidateId: string,
  action: "rewrite" | "refresh" | "carousel" | "blog" | "email" | "variations",
) {
  const db = await admin();
  const { data: cand } = await db
    .from("soc_recycling_candidates")
    .select("*, soc_post_variants(*)")
    .eq("id", candidateId)
    .maybeSingle();
  if (!cand) return { ok: false, error: "candidate not found" };

  const variant = (cand as { soc_post_variants: { caption: string; platform: string } | null }).soc_post_variants;
  if (!variant) return { ok: false, error: "source variant missing" };

  const prompt = `Original ${variant.platform} caption: "${variant.caption}".
Action: ${action}. Produce a strict JSON object with { caption, hashtags[], cta }.`;

  let output: { caption: string; hashtags: string[]; cta: string } = { caption: variant.caption, hashtags: [], cta: "" };
  try {
    const raw = await aiChat({
      system: `You transform high-performing posts into fresh variants (${action}).`,
      messages: [{ role: "user", content: prompt }],
      responseFormat: "json",
      temperature: 0.6,
    });
    output = typeof raw === "string" ? JSON.parse(raw) : (raw as typeof output);
  } catch {
    /* fallback keeps original */
  }

  await db
    .from("soc_recycling_candidates")
    .update({
      status: "recycled",
      actions_taken: [{ action, at: new Date().toISOString(), output }],
    })
    .eq("id", candidateId);

  return { ok: true, output };
}
