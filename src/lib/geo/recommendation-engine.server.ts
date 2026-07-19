// GEO Recommendation Engine — produces AI-page enrichment suggestions
// (executive summary, TL;DR, quick answer, key takeaways, glossary, etc.).

import { aiChat } from "@/lib/ai/router.server";
import {
  GEO_RECOMMENDATION_CATEGORIES,
  type GeoRecommendationCategory,
} from "./constants";

export type GeoRecommendation = {
  category: GeoRecommendationCategory;
  kind: string;
  title: string;
  body: string;
  payload?: any;
  priority: "low" | "medium" | "high";
  impact: number;
};

const SYSTEM = `You are the Glintr GEO Recommendation Engine.
Analyze the provided EdTech content and propose additions that improve AI discoverability and citation likelihood
on Google AI Overviews, ChatGPT, Gemini, Claude, Perplexity, Microsoft Copilot.

Return STRICT JSON:
{ "recommendations": [{
  "category": one of ${GEO_RECOMMENDATION_CATEGORIES.join(" | ")},
  "kind": short slug (e.g. "add-tldr","add-faq","comparison-table"),
  "title": short imperative title,
  "body": markdown body of the recommended block (ready to paste),
  "priority": "low"|"medium"|"high",
  "impact": 0..1
}] }

Rules:
- Recommend only what is missing or weak.
- Body must be self-contained and factual to the source.
- Prefer scannable, semantic structure (lists, tables, definitions).
- Return 6–14 recommendations.`;

export async function generateRecommendations(args: {
  title?: string;
  body: string;
  gaps?: string[];
}): Promise<GeoRecommendation[]> {
  const text = [args.title, args.body].filter(Boolean).join("\n\n").slice(0, 14000);
  const gapNote = args.gaps?.length
    ? `\n\nKnown gaps to prioritize: ${args.gaps.join(", ")}.`
    : "";
  const raw = await aiChat({
    system: SYSTEM,
    messages: [{ role: "user", content: text + gapNote }],
    responseFormat: "json",
    temperature: 0.45,
    maxTokens: 3200,
  });
  const parsed = raw as { recommendations?: GeoRecommendation[] };
  const list = Array.isArray(parsed?.recommendations)
    ? parsed.recommendations
    : [];
  return list
    .filter(
      (r) =>
        r &&
        r.title &&
        r.body &&
        (GEO_RECOMMENDATION_CATEGORIES as readonly string[]).includes(
          r.category as string,
        ),
    )
    .map((r) => ({
      ...r,
      priority: (["low", "medium", "high"] as const).includes(r.priority)
        ? r.priority
        : "medium",
      impact: Math.max(0, Math.min(1, Number(r.impact) || 0.5)),
    }))
    .slice(0, 14);
}
