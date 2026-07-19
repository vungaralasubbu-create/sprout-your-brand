// Client-safe types for the Social Media Automation module.

export const SOC_PLATFORMS = [
  "linkedin",
  "facebook",
  "instagram",
  "threads",
  "x",
  "telegram",
  "whatsapp_channel",
  "youtube_community",
  "pinterest",
  "blog",
  "email",
] as const;
export type SocPlatform = (typeof SOC_PLATFORMS)[number];

export const SOC_POST_TYPES = [
  "single_image",
  "carousel",
  "video",
  "reel",
  "story",
  "pdf_carousel",
  "poll",
  "text_only",
  "link_post",
  "event",
  "course_launch",
  "hiring",
  "student_success",
  "blog_promotion",
  "ai_news",
  "tech_news",
] as const;
export type SocPostType = (typeof SOC_POST_TYPES)[number];

export const SOC_STATUSES = [
  "draft",
  "ai_generated",
  "pending_review",
  "approved",
  "rejected",
  "scheduled",
  "publishing",
  "published",
  "failed",
  "archived",
] as const;
export type SocStatus = (typeof SOC_STATUSES)[number];

export const SOC_FREQUENCIES = ["once", "daily", "weekly", "monthly", "quarterly", "custom"] as const;
export type SocFrequency = (typeof SOC_FREQUENCIES)[number];

export const SOC_APPROVAL_MODES = ["auto", "manual", "team_review"] as const;
export type SocApprovalMode = (typeof SOC_APPROVAL_MODES)[number];

export const SOC_RETRY_TIERS = ["1m", "5m", "15m", "1h", "24h"] as const;
export type SocRetryTier = (typeof SOC_RETRY_TIERS)[number];

export const SOC_RETRY_DELAYS_MS: Record<SocRetryTier, number> = {
  "1m": 60_000,
  "5m": 5 * 60_000,
  "15m": 15 * 60_000,
  "1h": 60 * 60_000,
  "24h": 24 * 60 * 60_000,
};
export const SOC_RETRY_LADDER: SocRetryTier[] = ["1m", "5m", "15m", "1h", "24h"];

export type SocMedia = {
  kind: "image" | "video" | "pdf" | "gif" | "link" | "poll";
  url?: string;
  alt?: string;
  duration?: number;
  meta?: Record<string, unknown>;
};

export type SocVariantContent = {
  caption: string;
  hashtags: string[];
  cta: string;
  media: SocMedia[];
  best_time_at?: string;
  suggested_comments?: string[];
  suggested_replies?: string[];
};

export type SocPublishResult = {
  ok: boolean;
  external_post_id?: string;
  external_url?: string;
  raw?: unknown;
  error_code?: string;
  error_message?: string;
};
