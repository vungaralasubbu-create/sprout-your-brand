// Campaign Orchestrator — shared types.
// All AI generation is routed through @/lib/ai/router.server (aiChat),
// which calls the centralized provider registry (OpenAI native). No
// Lovable AI is used in this module.

export type CampaignKind =
  | "course_launch" | "admissions" | "internship" | "hiring" | "scholarship"
  | "live_class" | "masterclass" | "discount" | "festival" | "referral"
  | "certification" | "partner_announcement" | "placement_drive" | "brand_awareness"
  | "email_campaign" | "webinar" | "bootcamp" | "ai_news" | "tech_update" | "success_story"
  | "custom";

export type CampaignStatus =
  | "draft" | "planning" | "generating" | "review" | "approved" | "scheduled"
  | "publishing" | "running" | "paused" | "completed" | "archived" | "failed";

export type TaskKind =
  | "landing_page" | "blog" | "seo_meta"
  | "linkedin_post" | "linkedin_carousel" | "instagram_post" | "instagram_carousel"
  | "instagram_story" | "facebook_post" | "telegram_message" | "whatsapp_message"
  | "x_post" | "threads_post" | "youtube_community"
  | "email_welcome" | "email_campaign" | "email_reminder" | "email_last_chance"
  | "email_certificate" | "email_enrollment" | "newsletter" | "push_notification"
  | "video_reel" | "video_short" | "video_promo" | "video_explainer" | "video_ad"
  | "video_story" | "video_intro" | "voice_narration"
  | "poster" | "banner" | "carousel_slide" | "story_creative" | "course_cover"
  | "thumbnail" | "infographic" | "certificate_promo" | "faq";

export type TaskStatus =
  | "queued" | "generating" | "ready" | "failed" | "approved" | "rejected"
  | "scheduled" | "published";

export type Modality = "text" | "image" | "video" | "voice" | "landing" | "email" | "meta";

export interface CampaignInput {
  name: string;
  kind: CampaignKind;
  objective?: string;
  prompt?: string;
  audience?: {
    role?: string;
    persona?: string;
    interests?: string[];
    ageRange?: [number, number];
  };
  geo?: { country?: string; state?: string; city?: string };
  language?: string;
  budget?: number;
  currency?: string;
  platforms?: string[];
  startsAt?: string;   // ISO
  endsAt?: string;
  durationDays?: number;
  brandKitId?: string;
  primaryCta?: string;
  secondaryCta?: string;
  keywords?: string[];
  hashtags?: string[];
  landingGoal?: string;
  offer?: Record<string, unknown>;
  couponCode?: string;
  priority?: number;
}

/** AI-generated plan attached to co_campaigns.plan */
export interface CampaignPlan {
  strategy: string;
  timeline: Array<{ day: number; theme: string; tasks: TaskKind[] }>;
  contentCalendar: Array<{ date: string; channel: string; taskKind: TaskKind; brief: string }>;
  platformStrategy: Record<string, { cadence: string; angles: string[] }>;
  audienceSegments: Array<{ name: string; description: string; size?: string }>;
  keywordStrategy: string[];
  hashtagStrategy: string[];
  postingSchedule: Array<{ channel: string; times: string[] }>;
  estimatedReach: { low: number; expected: number; high: number };
  budgetAllocation: Array<{ channel: string; percent: number; amount?: number }>;
  suggestedCreatives: string[];
  suggestedVideos: string[];
  suggestedEmails: string[];
  suggestedLandingPages: string[];
  recommendedBlogTopics: string[];
  kpis: Record<string, number | string>;
}

/** Task brief passed to content generators */
export interface TaskBrief {
  kind: TaskKind;
  channel?: string;
  angle?: string;
  keywords?: string[];
  hashtags?: string[];
  wordCount?: number;
  tone?: string;
  cta?: string;
  brandKitId?: string;
  language?: string;
  extras?: Record<string, unknown>;
}

/** Result payload written to co_tasks.output */
export interface TaskOutput {
  text?: string;
  title?: string;
  subtitle?: string;
  body?: string;
  html?: string;
  markdown?: string;
  seo?: { title?: string; description?: string; keywords?: string[]; schema?: unknown };
  hashtags?: string[];
  imageUrl?: string;
  imageBase64?: string;
  videoUrl?: string;
  audioUrl?: string;
  script?: string;
  slides?: Array<{ title: string; body: string; imagePrompt?: string; imageUrl?: string }>;
  variants?: string[];
  meta?: Record<string, unknown>;
}
