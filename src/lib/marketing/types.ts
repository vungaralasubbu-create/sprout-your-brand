// Shared marketing types (client-safe: only types + enums, no imports of server-only modules).

export const MKT_CHANNELS = [
  "linkedin","instagram","facebook","twitter","threads",
  "youtube_community","telegram","whatsapp_channel","blog","email",
] as const;
export type MktChannel = (typeof MKT_CHANNELS)[number];

export const MKT_CONTENT_TYPES = [
  "course_launch","career_tip","hiring_update","success_story","project_showcase",
  "tech_news","ai_news","learning_tip","certification_promo","webinar","event",
  "discount_campaign","internship","partner_announcement","custom",
] as const;
export type MktContentType = (typeof MKT_CONTENT_TYPES)[number];

export const MKT_ASSET_KINDS = [
  "square","portrait","landscape","carousel_slide","quote","infographic",
  "story","event_poster","course_poster","video","thumbnail",
] as const;
export type MktAssetKind = (typeof MKT_ASSET_KINDS)[number];

export const MKT_APPROVAL_MODES = ["auto","manual","team_review"] as const;
export type MktApprovalMode = (typeof MKT_APPROVAL_MODES)[number];

export type ChannelVariantSpec = {
  channel: MktChannel;
  label: string;
  maxChars: number;
  hashtagStyle: "heavy" | "medium" | "light" | "none";
  tone: string;
};

export const CHANNEL_SPECS: Record<MktChannel, ChannelVariantSpec> = {
  linkedin:          { channel: "linkedin",          label: "linkedin", maxChars: 3000, hashtagStyle: "medium", tone: "professional, insightful" },
  instagram:         { channel: "instagram",         label: "instagram", maxChars: 2200, hashtagStyle: "heavy", tone: "vibrant, aspirational" },
  facebook:          { channel: "facebook",          label: "facebook", maxChars: 2000, hashtagStyle: "light", tone: "friendly, community" },
  twitter:           { channel: "twitter",           label: "x", maxChars: 280, hashtagStyle: "light", tone: "punchy, witty" },
  threads:           { channel: "threads",           label: "threads", maxChars: 500, hashtagStyle: "medium", tone: "conversational" },
  youtube_community: { channel: "youtube_community", label: "youtube", maxChars: 1500, hashtagStyle: "medium", tone: "engaging, promotional" },
  telegram:          { channel: "telegram",          label: "telegram", maxChars: 4000, hashtagStyle: "medium", tone: "direct, informative" },
  whatsapp_channel:  { channel: "whatsapp_channel",  label: "whatsapp", maxChars: 1024, hashtagStyle: "none",  tone: "concise, urgent" },
  blog:              { channel: "blog",              label: "blog", maxChars: 20000, hashtagStyle: "none", tone: "SEO-optimized long form" },
  email:             { channel: "email",             label: "email", maxChars: 8000, hashtagStyle: "none", tone: "warm, high-converting" },
};
