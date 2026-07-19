/**
 * Analytics aggregations over link_clicks + graph.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function trackClick(input: {
  fromNodeId?: string; toNodeId: string; anchorText?: string;
  sessionId?: string; userId?: string;
}): Promise<void> {
  await supabaseAdmin.from("link_clicks").insert({
    from_node_id: input.fromNodeId ?? null,
    to_node_id: input.toNodeId,
    anchor_text: input.anchorText ?? null,
    session_id: input.sessionId ?? null,
    user_id: input.userId ?? null,
  });
}

export async function topClickedLinks(days = 30, limit = 50) {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data } = await supabaseAdmin
    .from("link_clicks")
    .select("to_node_id, from_node_id, anchor_text")
    .gte("clicked_at", since);
  const map = new Map<string, { to: string; from: string | null; anchor: string | null; clicks: number }>();
  for (const r of data ?? []) {
    const key = `${(r as any).from_node_id}|${(r as any).to_node_id}|${(r as any).anchor_text}`;
    const cur = map.get(key) ?? {
      to: (r as any).to_node_id, from: (r as any).from_node_id,
      anchor: (r as any).anchor_text, clicks: 0,
    };
    cur.clicks++;
    map.set(key, cur);
  }
  return Array.from(map.values()).sort((a, b) => b.clicks - a.clicks).slice(0, limit);
}

export async function leastUsedEdges(limit = 50) {
  const { data: edges } = await supabaseAdmin
    .from("link_graph_edges").select("id, from_node_id, to_node_id, link_type")
    .eq("status", "active").limit(2000);
  const { data: clicks } = await supabaseAdmin
    .from("link_clicks").select("from_node_id, to_node_id")
    .gte("clicked_at", new Date(Date.now() - 30 * 86_400_000).toISOString());
  const key = (a: string, b: string) => `${a}|${b}`;
  const clickSet = new Set((clicks ?? []).map((c: any) => key(c.from_node_id, c.to_node_id)));
  return (edges ?? [])
    .filter((e: any) => !clickSet.has(key(e.from_node_id, e.to_node_id)))
    .slice(0, limit);
}

export async function authorityDistribution() {
  const { data } = await supabaseAdmin
    .from("link_graph_nodes").select("content_type, authority");
  const buckets = new Map<string, { total: number; sum: number }>();
  for (const r of data ?? []) {
    const cur = buckets.get((r as any).content_type) ?? { total: 0, sum: 0 };
    cur.total++;
    cur.sum += (r as any).authority ?? 0;
    buckets.set((r as any).content_type, cur);
  }
  return Array.from(buckets.entries()).map(([type, v]) => ({
    content_type: type, nodes: v.total, avg_authority: v.total ? v.sum / v.total : 0,
  }));
}
