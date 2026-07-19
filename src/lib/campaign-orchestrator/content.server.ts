// Content generator — dispatches a queued task to the right generator.
// - Text/copy/landing/email/blog → aiChat (OpenAI via AI Router)
// - Image  → src/lib/ai/image.server (OpenAI native image API)
// - Video  → src/lib/video-studio/providers (pluggable adapter)
// - Voice  → OpenAI Audio via internal helper
// NO Lovable AI usage.

import { aiChat } from "@/lib/ai/router.server";
import { generateImageDataUrl, isImageProviderAvailable } from "@/lib/ai/image.server";
import type { TaskBrief, TaskKind, TaskOutput, Modality } from "./types";

function modalityOf(kind: TaskKind): Modality {
  if (kind === "landing_page") return "landing";
  if (kind === "seo_meta") return "meta";
  if (kind.startsWith("video_")) return "video";
  if (kind === "voice_narration") return "voice";
  if (["poster","banner","carousel_slide","story_creative","course_cover","thumbnail","infographic","certificate_promo"].includes(kind)) return "image";
  if (kind.startsWith("email_") || kind === "newsletter") return "email";
  return "text";
}

const SOCIAL_LIMITS: Partial<Record<TaskKind, number>> = {
  x_post: 280,
  threads_post: 500,
  instagram_post: 2200,
  instagram_story: 400,
  facebook_post: 2000,
  linkedin_post: 3000,
  telegram_message: 4096,
  whatsapp_message: 1000,
  youtube_community: 1500,
  push_notification: 180,
};

export async function generateForTask(brief: TaskBrief, campaignContext: string): Promise<TaskOutput> {
  const modality = modalityOf(brief.kind);
  switch (modality) {
    case "text":  return generateSocialCopy(brief, campaignContext);
    case "email": return generateEmail(brief, campaignContext);
    case "landing": return generateLandingPage(brief, campaignContext);
    case "meta":  return generateSeoMeta(brief, campaignContext);
    case "image": return generateImageAsset(brief, campaignContext);
    case "video": return generateVideoAsset(brief, campaignContext);
    case "voice": return generateVoiceScript(brief, campaignContext);
  }
}

// -- Text / social copy --------------------------------------------------
async function generateSocialCopy(brief: TaskBrief, ctx: string): Promise<TaskOutput> {
  const limit = SOCIAL_LIMITS[brief.kind] ?? 1200;
  if (brief.kind === "linkedin_carousel" || brief.kind === "instagram_carousel") {
    return generateCarousel(brief, ctx);
  }
  if (brief.kind === "blog") {
    return generateBlog(brief, ctx);
  }
  if (brief.kind === "faq") {
    return generateFaq(brief, ctx);
  }
  const raw = await aiChat({
    system: "You write high-conversion marketing copy. Return STRICT JSON.",
    messages: [{
      role: "user",
      content: `Write a ${brief.kind.replace(/_/g," ")} for this campaign.
Campaign context: ${ctx}
Angle: ${brief.angle ?? "value-first"}
Tone: ${brief.tone ?? "confident, human"}
CTA: ${brief.cta ?? "Enroll now"}
Language: ${brief.language ?? "en"}
Max length: ${limit} chars.
Return JSON: { "text": string, "hashtags": string[], "variants": string[] } — variants are 2 alternate headlines.`,
    }],
    responseFormat: "json",
    temperature: 0.7,
    maxTokens: 900,
  });
  const o = raw as { text?: string; hashtags?: string[]; variants?: string[] };
  return { text: (o.text ?? "").slice(0, limit), hashtags: o.hashtags ?? brief.hashtags ?? [], variants: o.variants ?? [] };
}

async function generateCarousel(brief: TaskBrief, ctx: string): Promise<TaskOutput> {
  const raw = await aiChat({
    system: "You design social carousels. Return STRICT JSON.",
    messages: [{
      role: "user",
      content: `Design a 6-slide ${brief.kind} for: ${ctx}
Angle: ${brief.angle ?? "value-first"}  CTA: ${brief.cta ?? "Enroll now"}
Return JSON: { "slides": [{ "title": string, "body": string, "imagePrompt": string }] }`,
    }],
    responseFormat: "json",
    temperature: 0.65,
    maxTokens: 1400,
  });
  const o = raw as { slides?: TaskOutput["slides"] };
  return { slides: o.slides ?? [], hashtags: brief.hashtags ?? [] };
}

async function generateBlog(brief: TaskBrief, ctx: string): Promise<TaskOutput> {
  const words = brief.wordCount ?? 1200;
  const raw = await aiChat({
    system: "You are a senior SEO editor. Return STRICT JSON.",
    messages: [{
      role: "user",
      content: `Write a ${words}-word blog article for: ${ctx}
Keywords: ${(brief.keywords ?? []).join(", ")}
Return JSON: { "title": string, "subtitle": string, "markdown": string, "seo": { "title": string, "description": string, "keywords": string[] } }`,
    }],
    responseFormat: "json",
    temperature: 0.5,
    maxTokens: 4000,
  });
  const o = raw as TaskOutput;
  return o;
}

async function generateFaq(brief: TaskBrief, ctx: string): Promise<TaskOutput> {
  const raw = await aiChat({
    system: "You produce campaign FAQs. Return STRICT JSON.",
    messages: [{ role: "user", content: `Produce 8 concise FAQ entries for: ${ctx}\nReturn JSON: { "meta": { "faqs": [{ "q": string, "a": string }] } }` }],
    responseFormat: "json",
    temperature: 0.4,
    maxTokens: 1600,
  });
  return raw as TaskOutput;
}

// -- Email ---------------------------------------------------------------
async function generateEmail(brief: TaskBrief, ctx: string): Promise<TaskOutput> {
  const raw = await aiChat({
    system: "You write high-deliverability marketing emails. Return STRICT JSON.",
    messages: [{
      role: "user",
      content: `Write a ${brief.kind} email for: ${ctx}
CTA: ${brief.cta ?? "Enroll now"}
Return JSON: { "title": string, "subtitle": string, "html": string, "markdown": string, "variants": string[] } — variants are 3 subject-line options.`,
    }],
    responseFormat: "json",
    temperature: 0.55,
    maxTokens: 2200,
  });
  return raw as TaskOutput;
}

// -- Landing page --------------------------------------------------------
async function generateLandingPage(brief: TaskBrief, ctx: string): Promise<TaskOutput> {
  const raw = await aiChat({
    system: "You design high-converting landing pages. Return STRICT JSON with a section blueprint.",
    messages: [{
      role: "user",
      content: `Design a landing page for: ${ctx}
CTA: ${brief.cta ?? "Enroll now"}  Goal: ${brief.extras?.landingGoal ?? "enrollment"}
Return JSON: {
  "title": string,
  "subtitle": string,
  "meta": {
    "hero": { "heading": string, "subheading": string, "primaryCta": string, "secondaryCta": string, "imagePrompt": string },
    "benefits": [{ "title": string, "body": string }],
    "curriculum": [{ "module": string, "topics": string[] }],
    "mentors": [{ "name": string, "role": string, "bio": string }],
    "testimonials": [{ "quote": string, "author": string, "role": string }],
    "pricing": [{ "plan": string, "price": string, "features": string[] }],
    "faqs": [{ "q": string, "a": string }],
    "cta": { "heading": string, "body": string, "button": string }
  },
  "seo": { "title": string, "description": string, "keywords": string[], "schema": object }
}`,
    }],
    responseFormat: "json",
    temperature: 0.5,
    maxTokens: 4000,
  });
  return raw as TaskOutput;
}

async function generateSeoMeta(brief: TaskBrief, ctx: string): Promise<TaskOutput> {
  const raw = await aiChat({
    system: "You are an SEO metadata author. Return STRICT JSON.",
    messages: [{
      role: "user",
      content: `SEO metadata for: ${ctx}\nReturn JSON: { "seo": { "title": string, "description": string, "keywords": string[], "schema": object } }`,
    }],
    responseFormat: "json",
    temperature: 0.3,
    maxTokens: 800,
  });
  return raw as TaskOutput;
}

// -- Image ---------------------------------------------------------------
async function generateImageAsset(brief: TaskBrief, ctx: string): Promise<TaskOutput> {
  if (!isImageProviderAvailable()) {
    return { text: "Image provider not configured", meta: { skipped: "no_image_provider" } };
  }
  const promptRaw = await aiChat({
    system: "Write concise, vivid image prompts for a marketing image generator. Return STRICT JSON.",
    messages: [{
      role: "user",
      content: `Create an image prompt for a ${brief.kind.replace(/_/g," ")} for: ${ctx}
Return JSON: { "prompt": string }`,
    }],
    responseFormat: "json",
    temperature: 0.6,
    maxTokens: 300,
  });
  const prompt = (promptRaw as { prompt?: string }).prompt ?? `${brief.kind} for ${ctx}`;

  try {
    const dataUrl = await generateImageDataUrl(prompt, { size: brief.kind === "instagram_story" ? "1024x1792" : "1024x1024" });
    return { imageUrl: dataUrl, text: prompt, meta: { imagePrompt: prompt } };
  } catch (e) {
    return { text: prompt, meta: { imagePrompt: prompt, error: e instanceof Error ? e.message : String(e) } };
  }
}

// -- Video ---------------------------------------------------------------
async function generateVideoAsset(brief: TaskBrief, ctx: string): Promise<TaskOutput> {
  // Generate the script + storyboard through AI Router; hand off the render
  // to the video-studio provider adapters. Actual render is queued
  // asynchronously by the video studio; here we return the storyboard so the
  // task has a shippable output even if the video renderer is offline.
  const raw = await aiChat({
    system: "You write short-form vertical video scripts and storyboards. Return STRICT JSON.",
    messages: [{
      role: "user",
      content: `Write a 30s ${brief.kind.replace(/_/g," ")} script for: ${ctx}
Return JSON: { "script": string, "slides": [{ "title": string, "body": string, "imagePrompt": string }] }`,
    }],
    responseFormat: "json",
    temperature: 0.6,
    maxTokens: 1800,
  });
  const o = raw as TaskOutput;

  // Try the pluggable video provider if configured
  try {
    const mod = await import("@/lib/video-studio/providers");
    const providers = mod as Record<string, unknown>;
    const provider = (providers.getDefaultVideoProvider as undefined | (() => { renderStoryboard?: (script: string) => Promise<{ url?: string }> }))?.();
    if (provider?.renderStoryboard && o.script) {
      const rendered = await provider.renderStoryboard(o.script);
      if (rendered.url) o.videoUrl = rendered.url;
    }
  } catch {
    /* provider optional — script alone is a usable output */
  }
  return o;
}

// -- Voice ---------------------------------------------------------------
async function generateVoiceScript(brief: TaskBrief, ctx: string): Promise<TaskOutput> {
  const raw = await aiChat({
    system: "You write brand voice narration scripts. Return STRICT JSON.",
    messages: [{
      role: "user",
      content: `Write a 20-second narration script for: ${ctx}\nReturn JSON: { "script": string, "meta": { "voice": "female", "language": "${brief.language ?? "en"}" } }`,
    }],
    responseFormat: "json",
    temperature: 0.5,
    maxTokens: 500,
  });
  return raw as TaskOutput;
}
