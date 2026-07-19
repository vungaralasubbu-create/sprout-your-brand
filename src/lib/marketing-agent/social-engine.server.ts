// Social engine — asks the AI Router for the best posting time, platform,
// hashtags, CTA, hook and image style given the brand's recent engagement.
// Result is returned inline for the planner and cached into ma_knowledge as
// a "pattern" so subsequent ticks can consult it cheaply.

import { aiChat } from "@/lib/ai/router.server";
// New ma_* tables aren't in generated Database types yet; use permissive client.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;
import type { AgentRow } from "./types";
import { remember } from "./knowledge-base.server";

type Admin = AnySupabase;

export interface SocialAdvice {
  best_times: Record<string, string[]>;   // platform -> ["09:30", "18:00"]
  hashtags: Record<string, string[]>;
  hooks: string[];
  cta_variants: string[];
  audience_notes: string[];
}

export async function recommendSocialStrategy(
  admin: Admin,
  agent: AgentRow,
  recentEngagement: Record<string, unknown>,
): Promise<SocialAdvice> {
  const system = "You are Glintr's social strategist. Return ONLY JSON.";
  const user =
    "Recommend the best posting strategy for the next 7 days across " +
    `${JSON.stringify(agent.channels ?? [])}.\n` +
    `Recent engagement: ${JSON.stringify(recentEngagement)}\n` +
    "Return keys: best_times (object), hashtags (object), hooks (string[]), " +
    "cta_variants (string[]), audience_notes (string[]).";

  const raw = (await aiChat({
    system,
    messages: [{ role: "user", content: user }],
    responseFormat: "json",
    temperature: 0.5,
    maxTokens: 900,
  })) as Partial<SocialAdvice>;

  const advice: SocialAdvice = {
    best_times: (raw.best_times as Record<string, string[]>) ?? {},
    hashtags: (raw.hashtags as Record<string, string[]>) ?? {},
    hooks: Array.isArray(raw.hooks) ? raw.hooks : [],
    cta_variants: Array.isArray(raw.cta_variants) ? raw.cta_variants : [],
    audience_notes: Array.isArray(raw.audience_notes) ? raw.audience_notes : [],
  };
  await remember(admin, agent.id, "pattern", "social_strategy", advice as unknown as Record<string, unknown>, 1);
  return advice;
}
