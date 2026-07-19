// AI Campaign Planner — produces a structured plan from natural-language
// intent + campaign metadata. Uses the centralized AI Router (OpenAI native).
// No Lovable AI is used.

import { aiChat } from "@/lib/ai/router.server";
import type { CampaignInput, CampaignPlan, TaskKind } from "./types";

const DEFAULT_TIMELINE_DAYS = 14;

const SYSTEM = `You are Glintr's Enterprise Campaign Strategist.
Generate a rigorous, publish-ready marketing plan for the requested campaign.
Return STRICT JSON that matches the requested schema exactly. Do not include
commentary, markdown, or code fences. Every string must be practical, specific,
and grounded in the campaign inputs — no filler.`;

/** Default set of task kinds to seed for a given campaign kind. */
export function defaultTaskKindsFor(kind: CampaignInput["kind"]): TaskKind[] {
  const social: TaskKind[] = [
    "linkedin_post", "linkedin_carousel",
    "instagram_post", "instagram_carousel", "instagram_story",
    "facebook_post", "telegram_message", "whatsapp_message",
    "x_post", "threads_post",
  ];
  const creatives: TaskKind[] = ["poster", "banner", "carousel_slide", "story_creative", "thumbnail", "infographic"];
  const video: TaskKind[] = ["video_reel", "video_short", "video_promo"];
  const emails: TaskKind[] = ["email_campaign", "email_reminder", "email_last_chance"];
  const core: TaskKind[] = ["landing_page", "blog", "seo_meta", "faq"];

  switch (kind) {
    case "course_launch":
    case "bootcamp":
    case "certification":
      return [...core, "course_cover", ...creatives, ...video, "voice_narration", ...social, ...emails, "email_welcome", "email_enrollment", "push_notification"];
    case "admissions":
    case "internship":
    case "scholarship":
    case "placement_drive":
    case "hiring":
      return [...core, ...creatives, "video_promo", "video_explainer", ...social, ...emails, "push_notification"];
    case "live_class":
    case "masterclass":
    case "webinar":
      return ["landing_page", "seo_meta", "banner", "poster", "story_creative", "video_promo", "voice_narration", ...social, "email_campaign", "email_reminder", "email_last_chance", "push_notification"];
    case "discount":
    case "festival":
      return ["banner", "poster", "story_creative", ...social, "email_campaign", "email_last_chance", "push_notification"];
    case "referral":
      return ["landing_page", "banner", ...social, "email_campaign", "email_reminder"];
    case "partner_announcement":
    case "brand_awareness":
      return ["blog", "banner", "poster", ...social, "video_promo", "email_campaign"];
    case "email_campaign":
    case "newsletter" as unknown as CampaignInput["kind"]:
      return ["email_campaign", "email_reminder", "newsletter"];
    case "ai_news":
    case "tech_update":
      return ["blog", "seo_meta", "banner", "infographic", ...social, "newsletter"];
    case "success_story":
      return ["blog", "video_story", "poster", "carousel_slide", ...social, "email_campaign"];
    default:
      return [...core, ...creatives, ...social.slice(0, 5), "email_campaign"];
  }
}

function planSchemaHint(): string {
  return `{
  "strategy": string,
  "timeline": [{ "day": number, "theme": string, "tasks": string[] }],
  "contentCalendar": [{ "date": "YYYY-MM-DD", "channel": string, "taskKind": string, "brief": string }],
  "platformStrategy": { "<channel>": { "cadence": string, "angles": string[] } },
  "audienceSegments": [{ "name": string, "description": string, "size": string }],
  "keywordStrategy": string[],
  "hashtagStrategy": string[],
  "postingSchedule": [{ "channel": string, "times": string[] }],
  "estimatedReach": { "low": number, "expected": number, "high": number },
  "budgetAllocation": [{ "channel": string, "percent": number, "amount": number }],
  "suggestedCreatives": string[],
  "suggestedVideos": string[],
  "suggestedEmails": string[],
  "suggestedLandingPages": string[],
  "recommendedBlogTopics": string[],
  "kpis": { "primary_kpi": string, "target": number }
}`;
}

export async function generateCampaignPlan(input: CampaignInput): Promise<CampaignPlan> {
  const durationDays = input.durationDays ?? DEFAULT_TIMELINE_DAYS;
  const platforms = input.platforms?.length ? input.platforms : ["linkedin", "instagram", "facebook", "email"];

  const userPrompt = `Design a ${durationDays}-day ${input.kind.replace(/_/g, " ")} campaign.

Campaign name: ${input.name}
Objective: ${input.objective ?? "(inferred from kind)"}
User intent: ${input.prompt ?? "(none)"}
Audience: ${JSON.stringify(input.audience ?? {})}
Geo: ${JSON.stringify(input.geo ?? {})}
Language: ${input.language ?? "en"}
Budget: ${input.budget ?? "unspecified"} ${input.currency ?? ""}
Platforms: ${platforms.join(", ")}
Starts: ${input.startsAt ?? "flexible"}  Ends: ${input.endsAt ?? "flexible"}
Primary CTA: ${input.primaryCta ?? "Enroll now"}
Secondary CTA: ${input.secondaryCta ?? "Learn more"}
Keywords: ${(input.keywords ?? []).join(", ") || "(auto)"}
Landing goal: ${input.landingGoal ?? "conversion"}
Offer: ${JSON.stringify(input.offer ?? {})}
Coupon: ${input.couponCode ?? "(none)"}

Return JSON matching this schema (no prose, no code fence):
${planSchemaHint()}`;

  const raw = await aiChat({
    system: SYSTEM,
    messages: [{ role: "user", content: userPrompt }],
    responseFormat: "json",
    temperature: 0.4,
    maxTokens: 3500,
  });

  const obj = typeof raw === "string" ? safeParse(raw) : raw;
  return normalizePlan(obj, input, durationDays, platforms);
}

function safeParse(s: string): Record<string, unknown> {
  try { return JSON.parse(s); } catch { return {}; }
}

function normalizePlan(
  raw: Record<string, unknown>,
  input: CampaignInput,
  durationDays: number,
  platforms: string[],
): CampaignPlan {
  const arr = <T>(v: unknown, fallback: T[]): T[] => Array.isArray(v) ? (v as T[]) : fallback;
  const obj = <T extends object>(v: unknown, fallback: T): T => (v && typeof v === "object" ? v as T : fallback);
  const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);

  return {
    strategy: typeof raw.strategy === "string" ? raw.strategy : `${input.kind} campaign strategy`,
    timeline: arr(raw.timeline, Array.from({ length: durationDays }, (_, i) => ({
      day: i + 1, theme: i === 0 ? "Launch" : i === durationDays - 1 ? "Last chance" : "Nurture",
      tasks: ["linkedin_post"] as TaskKind[],
    }))),
    contentCalendar: arr(raw.contentCalendar, []),
    platformStrategy: obj(raw.platformStrategy, Object.fromEntries(platforms.map(p => [p, { cadence: "daily", angles: [] }]))),
    audienceSegments: arr(raw.audienceSegments, [{ name: "Primary", description: input.audience?.persona ?? "Target audience", size: "n/a" }]),
    keywordStrategy: arr(raw.keywordStrategy, input.keywords ?? []),
    hashtagStrategy: arr(raw.hashtagStrategy, input.hashtags ?? []),
    postingSchedule: arr(raw.postingSchedule, platforms.map(p => ({ channel: p, times: ["09:00", "18:00"] }))),
    estimatedReach: {
      low: num((raw.estimatedReach as { low?: number } | undefined)?.low, 5000),
      expected: num((raw.estimatedReach as { expected?: number } | undefined)?.expected, 15000),
      high: num((raw.estimatedReach as { high?: number } | undefined)?.high, 40000),
    },
    budgetAllocation: arr(raw.budgetAllocation, platforms.map(p => ({ channel: p, percent: Math.round(100 / platforms.length) }))),
    suggestedCreatives: arr(raw.suggestedCreatives, []),
    suggestedVideos: arr(raw.suggestedVideos, []),
    suggestedEmails: arr(raw.suggestedEmails, []),
    suggestedLandingPages: arr(raw.suggestedLandingPages, []),
    recommendedBlogTopics: arr(raw.recommendedBlogTopics, []),
    kpis: obj(raw.kpis, { primary_kpi: "enrollments", target: 100 }),
  };
}
