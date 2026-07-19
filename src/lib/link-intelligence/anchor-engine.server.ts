/**
 * Anchor text engine — generates natural anchor variants and tracks diversity.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type AnchorStyle =
  | "exact" | "partial" | "branded" | "long_tail"
  | "question" | "conversational" | "ai_optimized";

export interface AnchorProposal {
  text: string;
  style: AnchorStyle;
  score: number;
}

/** Deterministic anchor variants derived from title + keywords. */
export function proposeAnchors(
  title: string,
  keywords: string[] = [],
  brand = "Glintr",
): AnchorProposal[] {
  const clean = title.trim().replace(/\s+/g, " ");
  const first = keywords[0]?.toLowerCase() ?? clean.split(" ").slice(0, 2).join(" ").toLowerCase();
  const proposals: AnchorProposal[] = [
    { text: clean, style: "exact", score: 0.9 },
    { text: first, style: "partial", score: 0.75 },
    { text: `${brand} ${clean}`, style: "branded", score: 0.7 },
    { text: `complete guide to ${clean.toLowerCase()}`, style: "long_tail", score: 0.65 },
    { text: `what is ${clean.toLowerCase()}?`, style: "question", score: 0.6 },
    { text: `learn ${first}`, style: "conversational", score: 0.55 },
    { text: `everything about ${first}`, style: "ai_optimized", score: 0.5 },
  ];
  return proposals;
}

/**
 * Pick the best anchor that hasn't been over-used for the target node.
 * Returns null if all proposals exceed diversity cap.
 */
export async function pickDiverseAnchor(
  toNodeId: string,
  title: string,
  keywords: string[] = [],
  maxUsage = 3,
): Promise<AnchorProposal | null> {
  const proposals = proposeAnchors(title, keywords);
  const { data: history } = await supabaseAdmin
    .from("link_anchor_history").select("anchor_text, usage_count")
    .eq("to_node_id", toNodeId);
  const used = new Map<string, number>(
    (history ?? []).map((h: any) => [h.anchor_text.toLowerCase(), h.usage_count]),
  );
  for (const p of proposals) {
    if ((used.get(p.text.toLowerCase()) ?? 0) < maxUsage) return p;
  }
  return null;
}

/** Record anchor usage after a suggestion is accepted or a link is published. */
export async function recordAnchorUsage(
  toNodeId: string,
  anchorText: string,
  style: AnchorStyle,
  contentType?: string,
  contentId?: string,
): Promise<void> {
  const { data: existing } = await supabaseAdmin
    .from("link_anchor_history")
    .select("id, usage_count")
    .eq("to_node_id", toNodeId)
    .eq("anchor_text", anchorText)
    .maybeSingle();
  if (existing) {
    await supabaseAdmin.from("link_anchor_history").update({
      usage_count: (existing.usage_count ?? 0) + 1,
      last_used_at: new Date().toISOString(),
    }).eq("id", existing.id);
  } else {
    await supabaseAdmin.from("link_anchor_history").insert({
      to_node_id: toNodeId,
      to_content_type: contentType,
      to_content_id: contentId,
      anchor_text: anchorText,
      anchor_style: style,
    });
  }
}

/** Diversity ratio 0..1 for a target: unique anchors / total usages. */
export async function anchorDiversityFor(toNodeId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from("link_anchor_history").select("usage_count").eq("to_node_id", toNodeId);
  if (!data?.length) return 1;
  const totals = data.reduce((s: number, r: any) => s + (r.usage_count ?? 1), 0);
  return data.length / totals;
}
