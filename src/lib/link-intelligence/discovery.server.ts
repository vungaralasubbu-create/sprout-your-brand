/**
 * Automatic contextual link discovery.
 * Uses keyword/cluster overlap + title tokenization to seed candidate edges.
 * AI recommender then refines the candidates.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

interface NodeLite {
  id: string;
  content_type: string;
  title: string | null;
  topic_cluster: string | null;
  keywords: string[];
}

function tokenize(s: string | null | undefined): Set<string> {
  if (!s) return new Set();
  return new Set(
    s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
      .filter((t) => t.length > 3),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

/**
 * Discover candidate edges for a source node against the graph.
 * Returns top-N most similar nodes with score >= threshold.
 */
export async function discoverCandidatesForNode(
  nodeId: string,
  limit = 40,
  threshold = 0.08,
): Promise<Array<{ to_node_id: string; similarity: number; link_type: string }>> {
  const { data: src } = await supabaseAdmin
    .from("link_graph_nodes").select("id, content_type, title, topic_cluster, keywords")
    .eq("id", nodeId).maybeSingle();
  if (!src) return [];

  const { data: pool } = await supabaseAdmin
    .from("link_graph_nodes")
    .select("id, content_type, title, topic_cluster, keywords")
    .neq("id", nodeId)
    .limit(5000);

  const srcTokens = new Set<string>([
    ...tokenize(src.title),
    ...(Array.isArray(src.keywords) ? src.keywords : []).map((k: string) => k.toLowerCase()),
  ]);

  const scored: Array<{ to_node_id: string; similarity: number; link_type: string }> = [];
  for (const n of (pool ?? []) as NodeLite[]) {
    const tgtTokens = new Set<string>([
      ...tokenize(n.title),
      ...(Array.isArray(n.keywords) ? n.keywords : []).map((k) => k.toLowerCase()),
    ]);
    let sim = jaccard(srcTokens, tgtTokens);
    if (src.topic_cluster && n.topic_cluster && src.topic_cluster === n.topic_cluster) sim += 0.15;
    if (src.content_type === n.content_type) sim += 0.05;
    if (sim >= threshold) {
      scored.push({
        to_node_id: n.id,
        similarity: Math.min(1, sim),
        link_type: inferLinkType(src.content_type, n.content_type, src.topic_cluster, n.topic_cluster),
      });
    }
  }
  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, limit);
}

function inferLinkType(
  fromT: string, toT: string,
  fromC: string | null, toC: string | null,
): string {
  if (fromC && toC && fromC === toC) {
    if (fromT === toT) return "sibling";
  }
  if (fromT === "course" && toT === "career_guide") return "career_resource";
  if (fromT === "course" && toT === "project") return "project_resource";
  if (fromT === "course" && toT === "certification") return "certification_resource";
  if (fromT === "career_guide" && toT === "salary") return "career_resource";
  if (fromT === "blog" && toT === "course") return "recommended_reading";
  if (fromT === "roadmap" && toT === "course") return "continue_learning";
  if (fromT === "interview_questions" && toT === "course") return "related_course";
  if (toT === "glossary") return "related_reading";
  return "related";
}

/** Persist discovered edges (non-AI, auto-generated baseline). */
export async function persistDiscoveredEdges(fromNodeId: string, maxEdges = 20): Promise<number> {
  const candidates = await discoverCandidatesForNode(fromNodeId, maxEdges, 0.1);
  if (!candidates.length) return 0;
  const rows = candidates.map((c) => ({
    from_node_id: fromNodeId,
    to_node_id: c.to_node_id,
    link_type: c.link_type,
    weight: c.similarity,
    similarity: c.similarity,
    discovered_by: "auto",
    status: "active",
  }));
  const { error } = await supabaseAdmin
    .from("link_graph_edges").upsert(rows, { onConflict: "from_node_id,to_node_id,link_type" });
  return error ? 0 : rows.length;
}
