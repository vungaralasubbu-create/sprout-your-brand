// AI Planner — produces daily / weekly / monthly / quarterly / annual and
// specialized (seo, email, social, blog, video, growth, referral, placement,
// brand, content) plans via the centralized AI Router. Never calls providers
// directly. Prompts are compact; large enums live in the prompt text, not the
// JSON schema.

import { aiChat } from "@/lib/ai/router.server";
import type { AgentRow, PlanHorizon, DailyPlan } from "./types";

const PLAN_KIND_PROMPTS: Record<PlanHorizon, string> = {
  daily: "Generate today's marketing action plan.",
  weekly: "Generate this week's marketing plan with focus themes per day.",
  monthly: "Generate this month's marketing plan with weekly milestones.",
  quarterly: "Generate this quarter's marketing plan with monthly OKRs.",
  annual: "Generate an annual marketing plan with quarterly OKRs.",
  campaign: "Generate a campaign plan (goals, phases, KPIs, budgets).",
  content: "Generate a content calendar (topics, formats, channels, dates).",
  seo: "Generate an SEO plan (gaps, target keywords, on-page fixes, new pillars).",
  email: "Generate an email plan (segments, subjects, cadence, offers).",
  social: "Generate a social plan (platforms, times, hooks, hashtags, CTAs).",
  video: "Generate a video plan (reels, shorts, explainers, formats).",
  blog: "Generate a blog plan (titles, keywords, outlines, cadence).",
  brand: "Generate a brand plan (positioning, tone, creative pillars).",
  growth: "Generate a growth plan (new courses, skills, funnels).",
  referral: "Generate a referral plan (incentives, campaigns, triggers).",
  placement: "Generate a placement campaign plan (partners, hiring drives).",
};

export async function generatePlan(
  agent: AgentRow,
  horizon: PlanHorizon,
  context: {
    yesterdayMetrics?: Record<string, unknown>;
    recentWins?: Array<{ key: string; value: Record<string, unknown> }>;
    goals?: Record<string, unknown>;
  } = {},
): Promise<Record<string, unknown>> {
  const system = [
    "You are Glintr's autonomous marketing agent.",
    "Return ONLY valid JSON, no prose, no markdown.",
    `Language: ${agent.language}. Timezone: ${agent.timezone}.`,
    `Approval mode: ${agent.approval_level}.`,
    `Auto flags — publish:${agent.auto_publish} optimize:${agent.auto_optimize} email:${agent.auto_email} blog:${agent.auto_blog} video:${agent.auto_video} landing:${agent.auto_landing} social:${agent.auto_social}.`,
  ].join(" ");

  const user = [
    PLAN_KIND_PROMPTS[horizon],
    "",
    `Brand goals: ${JSON.stringify(context.goals ?? agent.goals ?? {})}`,
    `Channels: ${JSON.stringify(agent.channels ?? [])}`,
    context.yesterdayMetrics ? `Yesterday metrics: ${JSON.stringify(context.yesterdayMetrics)}` : "",
    context.recentWins?.length ? `Recent wins: ${JSON.stringify(context.recentWins).slice(0, 4000)}` : "",
    "",
    "Return a JSON object with keys: focus (string[]), items (array), kpis (object), risks (string[]).",
    horizon === "daily"
      ? "For daily also include: campaigns_to_review, content_to_create, seo_tasks, social_posts, emails, budget_moves."
      : "",
  ].join("\n");

  const result = await aiChat({
    system,
    messages: [{ role: "user", content: user }],
    responseFormat: "json",
    temperature: 0.4,
    maxTokens: 2200,
  });
  return (typeof result === "object" ? result : {}) as Record<string, unknown>;
}

export function coerceDailyPlan(raw: Record<string, unknown>): DailyPlan {
  const day = new Date().toISOString().slice(0, 10);
  const asArr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  return {
    date: day,
    focus: asArr<string>(raw.focus),
    campaigns_to_review: asArr<string>(raw.campaigns_to_review),
    content_to_create: asArr<{ kind: string; topic: string; priority: number }>(raw.content_to_create),
    seo_tasks: asArr<string>(raw.seo_tasks),
    social_posts: asArr<{ platform: string; theme: string; time: string }>(raw.social_posts),
    emails: asArr<{ segment: string; theme: string }>(raw.emails),
    budget_moves: asArr<{ campaign_id?: string; direction: "up" | "down" | "hold"; note: string }>(raw.budget_moves),
    risks: asArr<string>(raw.risks),
  };
}
