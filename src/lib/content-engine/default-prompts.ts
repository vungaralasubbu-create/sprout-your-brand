/**
 * Default prompt templates for the AI Content Engine.
 * Seeded on-demand into ce_prompt_registry/ce_prompt_versions.
 * Variables use {{name}} interpolation.
 */
import type { AssetType } from "./types";

export interface DefaultPrompt {
  key: string;
  category: string;
  description: string;
  template: string;
  variables: string[];
  modelPreference: { quality: "fast" | "balanced" | "premium" };
}

const COMMON_VARS = ["title", "description", "goal", "audience", "tone", "language", "brandName", "platforms"];

const wrap = (instr: string): string =>
  `You are a senior marketing copywriter for the Glintr platform. Write in {{language}} using a {{tone}} tone. Brand: {{brandName}}. Campaign: "{{title}}". Description: {{description}}. Goal: {{goal}}. Audience: {{audience}}. Platforms: {{platforms}}.\n\n${instr}\n\nReturn ONLY the final content with no preamble.`;

export const DEFAULT_PROMPTS: Record<AssetType, DefaultPrompt> = {
  linkedin_post:     { key: "ce.linkedin_post.v1",     category: "social",   description: "LinkedIn long-form post", template: wrap("Write a compelling LinkedIn post (120-220 words). Open with a hook, deliver a specific insight, and finish with an engagement question. Use short paragraphs. Include 3-5 relevant hashtags on the last line."), variables: COMMON_VARS, modelPreference: { quality: "balanced" } },
  instagram_caption: { key: "ce.instagram_caption.v1", category: "social",   description: "Instagram caption",       template: wrap("Write an Instagram caption (80-140 words) with an attention-grabbing first line, emoji sparingly, and a clear CTA. Add 8-12 targeted hashtags at the end on a new line."), variables: COMMON_VARS, modelPreference: { quality: "fast" } },
  facebook_caption:  { key: "ce.facebook_caption.v1",  category: "social",   description: "Facebook caption",        template: wrap("Write a Facebook post (60-120 words) with a conversational hook and a link-friendly CTA."), variables: COMMON_VARS, modelPreference: { quality: "fast" } },
  x_post:            { key: "ce.x_post.v1",            category: "social",   description: "X/Twitter post",          template: wrap("Write a single X post under 260 characters. High-signal, no filler. May include 1-2 hashtags. No emoji unless it improves clarity."), variables: COMMON_VARS, modelPreference: { quality: "fast" } },
  telegram_post:     { key: "ce.telegram_post.v1",     category: "social",   description: "Telegram broadcast",      template: wrap("Write a Telegram broadcast message (80-150 words). Use bold for the headline and bullet points for benefits. End with a link CTA placeholder [LINK]."), variables: COMMON_VARS, modelPreference: { quality: "fast" } },
  whatsapp_message:  { key: "ce.whatsapp_message.v1",  category: "messaging", description: "WhatsApp message",       template: wrap("Write a concise WhatsApp message (40-90 words). Personal, direct, first-person. End with a single clear CTA."), variables: COMMON_VARS, modelPreference: { quality: "fast" } },
  email:             { key: "ce.email.v1",             category: "email",    description: "Marketing email",         template: wrap("Write a marketing email. Return in this exact format:\nSubject: <subject line, max 60 chars>\nPreheader: <preview text, max 90 chars>\n\n<Email body 180-320 words with a headline, 2-3 short paragraphs, a bullet list of 3 benefits, and a single CTA button label on its own line prefixed with 'CTA:'>"), variables: COMMON_VARS, modelPreference: { quality: "balanced" } },
  blog_outline:      { key: "ce.blog_outline.v1",      category: "blog",     description: "Blog article outline",    template: wrap("Produce a detailed blog outline in Markdown. Include: 1) A working H1 title, 2) A 2-sentence intro hook, 3) 5-8 H2 sections with 2-4 H3 sub-bullets each, 4) A conclusion with CTA, 5) Suggested internal-link anchors, 6) Suggested primary and 3 secondary keywords."), variables: COMMON_VARS, modelPreference: { quality: "premium" } },
  cta:               { key: "ce.cta.v1",               category: "copy",     description: "Call to action lines",    template: wrap("Return 5 distinct call-to-action lines as a numbered list. Each under 8 words, action-first verbs, no punctuation at the end."), variables: COMMON_VARS, modelPreference: { quality: "fast" } },
  hashtags:          { key: "ce.hashtags.v1",          category: "seo",      description: "Hashtag set",             template: wrap("Return 15 relevant hashtags on a single line separated by spaces. Mix broad, niche, and branded tags. All lowercase, no duplicates."), variables: COMMON_VARS, modelPreference: { quality: "fast" } },
  keywords:          { key: "ce.keywords.v1",          category: "seo",      description: "SEO keyword list",        template: wrap("Return 12 SEO keywords as a comma-separated list. Mix short-tail and long-tail. Sort by likely search intent match with the campaign."), variables: COMMON_VARS, modelPreference: { quality: "fast" } },
  seo_title:         { key: "ce.seo_title.v1",         category: "seo",      description: "SEO title tag",           template: wrap("Return a single SEO title, 50-60 characters, keyword-front-loaded, brand appended with ' | Glintr' only if it fits."), variables: COMMON_VARS, modelPreference: { quality: "fast" } },
  meta_description:  { key: "ce.meta_description.v1",  category: "seo",      description: "Meta description",        template: wrap("Return a single meta description, 140-158 characters, include the primary keyword once, end with a soft CTA."), variables: COMMON_VARS, modelPreference: { quality: "fast" } },
};
