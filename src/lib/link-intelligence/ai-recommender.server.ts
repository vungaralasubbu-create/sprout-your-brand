/**
 * AI-powered link recommender.
 * Consumes discovery candidates and asks OpenAI (via centralized AI Router)
 * to rank + generate anchor text + reasoning. Suggestions land in
 * link_suggestions for editor approval; nothing is auto-inserted.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { aiChat } from "@/lib/ai/router.server";
import { discoverCandidatesForNode } from "./discovery.server";
import { proposeAnchors, type AnchorStyle } from "./anchor-engine.server";

const PROMPT_VERSION = "v1";

interface AIItem {
  to_node_id: string;
  link_type: string;
  anchor_text: string;
  anchor_style: AnchorStyle;
  relevance_score: number;
  intent_match?: number;
  reasoning: string;
  placement_hint?: string;
}

async function loadSettings() {
  const { data } = await supabaseAdmin
    .from("link_intelligence_settings").select("*").limit(1).maybeSingle();
  return data ?? { max_links_per_page: 30, suggestion_threshold: 0.55, ai_prompt_version: PROMPT_VERSION };
}

export async function generateSuggestionsForNode(
  nodeId: string,
  opts: { max?: number } = {},
): Promise<{ inserted: number }> {
  const settings = await loadSettings();
  const max = Math.min(opts.max ?? 20, settings.max_links_per_page ?? 30);

  const { data: src } = await supabaseAdmin
    .from("link_graph_nodes")
    .select("id, content_type, title, url, topic_cluster, keywords")
    .eq("id", nodeId).maybeSingle();
  if (!src) return { inserted: 0 };

  const candidates = await discoverCandidatesForNode(nodeId, max * 2, 0.08);
  if (!candidates.length) return { inserted: 0 };

  const { data: cNodes } = await supabaseAdmin
    .from("link_graph_nodes")
    .select("id, content_type, title, url, topic_cluster, keywords")
    .in("id", candidates.map((c) => c.to_node_id));

  const candLookup = new Map(candidates.map((c) => [c.to_node_id, c]));
  const candidatePayload = (cNodes ?? []).map((n: any) => ({
    id: n.id,
    type: n.content_type,
    title: n.title,
    cluster: n.topic_cluster,
    similarity: candLookup.get(n.id)?.similarity ?? 0,
    suggested_link_type: candLookup.get(n.id)?.link_type,
  }));

  const system = `You are the internal linking intelligence for Glintr, an EdTech platform.
Rank candidate internal links, generate natural anchor text, and explain each choice.
Return strict JSON only. Consider topic similarity, semantic intent, user journey,
learning progression, and topic-cluster relationships. Avoid keyword stuffing and
repetitive anchors. Prefer diverse anchor styles across the batch.`;

  const user = `SOURCE_PAGE:
${JSON.stringify({ title: src.title, type: src.content_type, cluster: src.topic_cluster, keywords: src.keywords }, null, 2)}

CANDIDATES:
${JSON.stringify(candidatePayload, null, 2)}

Return JSON of shape:
{"items":[{"to_node_id":"uuid","link_type":"related|sibling|parent|child|recommended_reading|continue_learning|career_resource|project_resource|certification_resource|company_resource|popular|beginner|advanced|related_course|related_reading","anchor_text":"...","anchor_style":"exact|partial|branded|long_tail|question|conversational|ai_optimized","relevance_score":0..1,"intent_match":0..1,"reasoning":"...","placement_hint":"intro|body|conclusion|sidebar"}]}
Pick at most ${max} items; drop weak or off-topic candidates.`;

  let items: AIItem[] = [];
  try {
    const raw = await aiChat({
      system,
      messages: [{ role: "user", content: user }],
      responseFormat: "json",
      temperature: 0.3,
      maxTokens: 2400,
    });
    const parsed = raw as { items?: AIItem[] };
    items = Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    items = [];
  }

  // Fallback: deterministic proposals when AI returns nothing
  if (!items.length) {
    items = candidatePayload.slice(0, max).map((c) => {
      const p = proposeAnchors(c.title ?? "", [])[0];
      return {
        to_node_id: c.id,
        link_type: c.suggested_link_type ?? "related",
        anchor_text: p.text,
        anchor_style: p.style,
        relevance_score: c.similarity,
        reasoning: "Deterministic fallback based on keyword and cluster similarity.",
      };
    });
  }

  const threshold = settings.suggestion_threshold ?? 0.55;
  const rows = items
    .filter((i) => i.relevance_score >= threshold && i.to_node_id && i.anchor_text)
    .slice(0, max)
    .map((i) => ({
      from_node_id: nodeId,
      to_node_id: i.to_node_id,
      from_content_type: src.content_type,
      from_content_id: src.id,
      link_type: i.link_type ?? "related",
      anchor_text: i.anchor_text,
      anchor_style: i.anchor_style ?? "partial",
      placement_hint: i.placement_hint ?? "body",
      relevance_score: i.relevance_score,
      intent_match: i.intent_match ?? null,
      reasoning: i.reasoning ?? null,
      ai_model: "openai-router",
      ai_prompt_version: settings.ai_prompt_version ?? PROMPT_VERSION,
      status: "pending",
    }));

  if (!rows.length) return { inserted: 0 };
  const { error } = await supabaseAdmin.from("link_suggestions").insert(rows);
  return { inserted: error ? 0 : rows.length };
}

/** Batch suggestion generation for a list of nodes. */
export async function generateSuggestionsBatch(nodeIds: string[]): Promise<number> {
  let total = 0;
  for (const id of nodeIds) {
    const r = await generateSuggestionsForNode(id).catch(() => ({ inserted: 0 }));
    total += r.inserted;
  }
  return total;
}
