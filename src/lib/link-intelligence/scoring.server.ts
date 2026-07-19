/**
 * Link Quality Score per node. Uses settings-driven weights.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { anchorDiversityFor } from "./anchor-engine.server";

interface Weights {
  inbound: number; outbound: number; anchor_diversity: number;
  topical: number; cluster: number; authority: number; ctr: number;
}

const DEFAULT: Weights = {
  inbound: 0.25, outbound: 0.15, anchor_diversity: 0.15,
  topical: 0.2, cluster: 0.1, authority: 0.1, ctr: 0.05,
};

async function getWeights(): Promise<Weights> {
  const { data } = await supabaseAdmin
    .from("link_intelligence_settings").select("scoring_weights").limit(1).maybeSingle();
  const raw = (data?.scoring_weights ?? {}) as Record<string, unknown>;
  const merged = { ...DEFAULT } as Weights;
  for (const k of Object.keys(DEFAULT) as Array<keyof Weights>) {
    const v = raw[k as string];
    if (typeof v === "number") merged[k] = v;
  }
  return merged;
}

export async function computePageScore(nodeId: string): Promise<number> {
  const [w, node, edgesOut, edgesIn, clicks] = await Promise.all([
    getWeights(),
    supabaseAdmin.from("link_graph_nodes").select("*").eq("id", nodeId).maybeSingle(),
    supabaseAdmin.from("link_graph_edges").select("to_node_id, weight").eq("from_node_id", nodeId).eq("status", "active"),
    supabaseAdmin.from("link_graph_edges").select("from_node_id, weight").eq("to_node_id", nodeId).eq("status", "active"),
    supabaseAdmin.from("link_clicks").select("id", { count: "exact", head: true }).eq("to_node_id", nodeId),
  ]);
  if (!node.data) return 0;

  const inbound = (edgesIn.data ?? []).length;
  const outbound = (edgesOut.data ?? []).length;
  const inboundScore = Math.min(1, inbound / 25);
  const outboundScore = Math.min(1, outbound / 25);
  const diversity = await anchorDiversityFor(nodeId);
  const clusterScore = node.data.topic_cluster ? 1 : 0.3;
  const authorityScore = Math.min(1, (node.data.authority ?? 0));
  const topicalScore = Math.min(1, ((edgesIn.data ?? []).reduce((s: number, e: any) => s + (e.weight ?? 0), 0)) / Math.max(1, inbound));
  const ctrScore = Math.min(1, (clicks.count ?? 0) / 100);
  const orphanPenalty = node.data.is_orphan ? 0.2 : 0;

  const raw =
    w.inbound * inboundScore +
    w.outbound * outboundScore +
    w.anchor_diversity * diversity +
    w.topical * topicalScore +
    w.cluster * clusterScore +
    w.authority * authorityScore +
    w.ctr * ctrScore;
  const score = Math.max(0, Math.min(1, raw - orphanPenalty));

  await supabaseAdmin.from("link_page_scores").upsert({
    node_id: nodeId, score,
    inbound_score: inboundScore, outbound_score: outboundScore,
    anchor_diversity: diversity, topical_relevance: topicalScore,
    cluster_participation: clusterScore, authority_flow: authorityScore,
    orphan_penalty: orphanPenalty, ctr: ctrScore,
    breakdown: { weights: { ...w } as Record<string, number>, inbound, outbound } as unknown as Record<string, unknown>,
    computed_at: new Date().toISOString(),
  }, { onConflict: "node_id" });

  return score;
}

export async function computeAllScores(limit = 500): Promise<number> {
  const { data: nodes } = await supabaseAdmin
    .from("link_graph_nodes").select("id").order("authority", { ascending: false }).limit(limit);
  let done = 0;
  for (const n of nodes ?? []) {
    await computePageScore((n as any).id).catch(() => 0);
    done++;
  }
  return done;
}
