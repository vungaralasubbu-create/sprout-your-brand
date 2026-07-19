/**
 * AI Content Engine — shared types.
 * Backend-only, no UI coupling.
 */

export const ASSET_TYPES = [
  "linkedin_post",
  "instagram_caption",
  "facebook_caption",
  "x_post",
  "telegram_post",
  "whatsapp_message",
  "email",
  "blog_outline",
  "cta",
  "hashtags",
  "keywords",
  "seo_title",
  "meta_description",
] as const;

export type AssetType = (typeof ASSET_TYPES)[number];

export const CAMPAIGN_STATUSES = [
  "draft",
  "scheduled",
  "published",
  "paused",
  "archived",
] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const GENERATION_STATUSES = [
  "draft",
  "edited",
  "approved",
  "scheduled",
  "published",
  "archived",
] as const;
export type GenerationStatus = (typeof GENERATION_STATUSES)[number];

export interface AssetTypeSpec {
  key: AssetType;
  label: string;
  promptKey: string; // registry key
  maxTokens: number;
  quality: "fast" | "balanced" | "premium";
}

export const ASSET_TYPE_SPECS: Record<AssetType, AssetTypeSpec> = {
  linkedin_post:      { key: "linkedin_post",      label: "LinkedIn Post",      promptKey: "ce.linkedin_post.v1",      maxTokens: 900,  quality: "balanced" },
  instagram_caption:  { key: "instagram_caption",  label: "Instagram Caption",  promptKey: "ce.instagram_caption.v1",  maxTokens: 500,  quality: "fast" },
  facebook_caption:   { key: "facebook_caption",   label: "Facebook Caption",   promptKey: "ce.facebook_caption.v1",   maxTokens: 500,  quality: "fast" },
  x_post:             { key: "x_post",             label: "X (Twitter) Post",   promptKey: "ce.x_post.v1",             maxTokens: 220,  quality: "fast" },
  telegram_post:      { key: "telegram_post",      label: "Telegram Post",      promptKey: "ce.telegram_post.v1",      maxTokens: 500,  quality: "fast" },
  whatsapp_message:   { key: "whatsapp_message",   label: "WhatsApp Message",   promptKey: "ce.whatsapp_message.v1",   maxTokens: 400,  quality: "fast" },
  email:              { key: "email",              label: "Email",              promptKey: "ce.email.v1",              maxTokens: 1400, quality: "balanced" },
  blog_outline:       { key: "blog_outline",       label: "Blog Outline",       promptKey: "ce.blog_outline.v1",       maxTokens: 1600, quality: "premium" },
  cta:                { key: "cta",                label: "Call To Action",     promptKey: "ce.cta.v1",                maxTokens: 120,  quality: "fast" },
  hashtags:           { key: "hashtags",           label: "Hashtags",           promptKey: "ce.hashtags.v1",           maxTokens: 200,  quality: "fast" },
  keywords:           { key: "keywords",           label: "SEO Keywords",       promptKey: "ce.keywords.v1",           maxTokens: 240,  quality: "fast" },
  seo_title:          { key: "seo_title",          label: "SEO Title",          promptKey: "ce.seo_title.v1",          maxTokens: 80,   quality: "fast" },
  meta_description:   { key: "meta_description",   label: "Meta Description",   promptKey: "ce.meta_description.v1",   maxTokens: 100,  quality: "fast" },
};

export interface CampaignContext {
  title: string;
  description?: string | null;
  goal?: string | null;
  audience?: string | null;
  platforms?: string[] | null;
  language?: string | null;
  tone?: string | null;
  brandName?: string | null;
}

export function renderTemplate(template: string, vars: Record<string, unknown>): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, k: string) => {
    const v = vars[k];
    if (v == null) return "";
    return Array.isArray(v) ? v.join(", ") : String(v);
  });
}
