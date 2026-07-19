// AI Performance Optimizer + A/B tests.
// Reads recent analytics rollups, emits actionable recommendations to
// co_optimizations. Uses aiChat (OpenAI via AI Router).

import { aiChat } from "@/lib/ai/router.server";

export interface OptimizerInput {
  campaignName: string;
  kind: string;
  audience: Record<string, unknown>;
  recentAnalytics: Array<Record<string, unknown>>;
  currentAssetsSummary: string;
}

export interface Recommendation {
  category: "headline" | "cta" | "image" | "thumbnail" | "hashtags" | "timing" | "audience" | "landing_page" | "subject_line" | "other";
  severity: "info" | "warn" | "critical";
  title: string;
  detail: string;
  recommendedAction: Record<string, unknown>;
}

const SYSTEM = `You are Glintr's Campaign Performance Analyst.
Given recent analytics, return concrete, testable recommendations to lift
engagement or conversion. Respond as STRICT JSON. No prose, no code fences.`;

export async function generateRecommendations(input: OptimizerInput): Promise<Recommendation[]> {
  const raw = await aiChat({
    system: SYSTEM,
    messages: [{
      role: "user",
      content: `Campaign: ${input.campaignName} (${input.kind})
Audience: ${JSON.stringify(input.audience)}
Assets summary: ${input.currentAssetsSummary}
Analytics (last 7 days): ${JSON.stringify(input.recentAnalytics).slice(0, 6000)}

Return JSON: { "recommendations": [{
  "category": "headline"|"cta"|"image"|"thumbnail"|"hashtags"|"timing"|"audience"|"landing_page"|"subject_line"|"other",
  "severity": "info"|"warn"|"critical",
  "title": string,
  "detail": string,
  "recommendedAction": object
}] }`,
    }],
    responseFormat: "json",
    temperature: 0.4,
    maxTokens: 2000,
  });
  const list = (raw as { recommendations?: Recommendation[] }).recommendations;
  return Array.isArray(list) ? list.slice(0, 20) : [];
}

/** Decide the winner in a running A/B test. */
export function pickWinner(
  variants: Array<{ id: string; metric: number; sample: number }>,
  minSample = 100,
): { winnerId: string | null; confidence: number } {
  const qualified = variants.filter(v => v.sample >= minSample);
  if (qualified.length < 2) return { winnerId: null, confidence: 0 };
  const sorted = [...qualified].sort((a, b) => b.metric - a.metric);
  const top = sorted[0];
  const second = sorted[1];
  if (top.metric <= 0) return { winnerId: null, confidence: 0 };
  const lift = (top.metric - second.metric) / Math.max(second.metric, 1e-6);
  const confidence = Math.max(0, Math.min(1, lift * Math.log10(top.sample + 1) / 3));
  return { winnerId: confidence >= 0.6 ? top.id : null, confidence };
}
