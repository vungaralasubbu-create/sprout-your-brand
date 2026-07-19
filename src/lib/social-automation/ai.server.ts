// AI generation for social posts — uses the centralized AI Router.
// Produces per-platform captions/hashtags/CTA/best-time + suggested replies.

import { aiChat } from "@/lib/ai/router.server";
import type { SocPlatform, SocPostType, SocVariantContent } from "./types";

const PLATFORM_HINTS: Record<SocPlatform, { maxChars: number; hashtagStyle: string; tone: string }> = {
  linkedin: { maxChars: 3000, hashtagStyle: "light (3-5, professional)", tone: "authoritative, insightful" },
  facebook: { maxChars: 1200, hashtagStyle: "light (2-4)", tone: "warm, conversational" },
  instagram: { maxChars: 2200, hashtagStyle: "heavy (10-20)", tone: "vibrant, aspirational" },
  threads: { maxChars: 500, hashtagStyle: "medium (3-6)", tone: "candid, punchy" },
  x: { maxChars: 280, hashtagStyle: "light (1-3)", tone: "sharp, punchy" },
  telegram: { maxChars: 2000, hashtagStyle: "none", tone: "direct, informative" },
  whatsapp_channel: { maxChars: 1024, hashtagStyle: "none", tone: "friendly, direct" },
  youtube_community: { maxChars: 1500, hashtagStyle: "light (2-4)", tone: "engaging, curious" },
  pinterest: { maxChars: 500, hashtagStyle: "medium (5-8)", tone: "descriptive, keyword-rich" },
  blog: { maxChars: 5000, hashtagStyle: "none", tone: "editorial, thorough" },
  email: { maxChars: 4000, hashtagStyle: "none", tone: "personal, benefit-led" },
};

export async function generateVariant(params: {
  platform: SocPlatform;
  postType: SocPostType;
  topic: string;
  basePrompt?: string;
  language?: string;
  tone?: string;
  brandVoice?: string;
}): Promise<SocVariantContent> {
  const hint = PLATFORM_HINTS[params.platform];
  const sys = `You are a senior social media strategist. Generate a ${params.platform} ${params.postType} post.
Constraints:
- Max ${hint.maxChars} characters.
- Hashtag style: ${hint.hashtagStyle}.
- Tone: ${params.tone || hint.tone}.
- Language: ${params.language || "en"}.
- Return strict JSON with keys: caption, hashtags[], cta, media[], best_time_at (ISO), suggested_comments[3], suggested_replies[3].`;

  const user = `Topic: ${params.topic}
${params.basePrompt ? `Additional context: ${params.basePrompt}` : ""}
${params.brandVoice ? `Brand voice: ${params.brandVoice}` : ""}`;

  try {
    const raw = await aiChat({
      system: sys,
      messages: [{ role: "user", content: user }],
      responseFormat: "json",
      temperature: 0.7,
    });
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return {
      caption: String(parsed.caption ?? "").slice(0, hint.maxChars),
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.map(String).slice(0, 30) : [],
      cta: String(parsed.cta ?? ""),
      media: Array.isArray(parsed.media) ? parsed.media : [],
      best_time_at: parsed.best_time_at,
      suggested_comments: Array.isArray(parsed.suggested_comments) ? parsed.suggested_comments : [],
      suggested_replies: Array.isArray(parsed.suggested_replies) ? parsed.suggested_replies : [],
    };
  } catch {
    // Deterministic fallback so pipeline stays operational without AI.
    return {
      caption: `${params.topic}`,
      hashtags: [],
      cta: "Learn more",
      media: [],
      suggested_comments: [],
      suggested_replies: [],
    };
  }
}

export async function suggestReply(params: {
  platform: SocPlatform;
  comment: string;
  tone?: string;
}): Promise<{ reply: string; sentiment: "positive" | "neutral" | "negative" | "mixed"; is_spam: boolean }> {
  try {
    const raw = await aiChat({
      system: `You are a community manager for ${params.platform}. Return strict JSON with keys: reply, sentiment (positive|neutral|negative|mixed), is_spam (boolean).`,
      messages: [{ role: "user", content: `Comment: "${params.comment}". Tone: ${params.tone || "warm, professional"}.` }],
      responseFormat: "json",
      temperature: 0.5,
    });
    const p = typeof raw === "string" ? JSON.parse(raw) : raw;
    return {
      reply: String(p.reply ?? ""),
      sentiment: (p.sentiment || "neutral") as "positive" | "neutral" | "negative" | "mixed",
      is_spam: Boolean(p.is_spam),
    };
  } catch {
    return { reply: "Thanks for your comment!", sentiment: "neutral", is_spam: false };
  }
}
