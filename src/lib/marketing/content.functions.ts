/**
 * Marketing Content Engine
 * ------------------------
 * Server functions to generate multi-channel marketing content
 * from a brief using the centralized AI Router (aiChat).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CHANNEL_SPECS, MKT_CHANNELS, MKT_CONTENT_TYPES, type MktChannel } from "./types";

const GenerateInput = z.object({
  brandId: z.string().uuid(),
  campaignId: z.string().uuid().optional(),
  contentType: z.enum(MKT_CONTENT_TYPES).default("custom"),
  title: z.string().optional(),
  brief: z.string().min(4),
  sourceKind: z.string().optional(),
  sourceRef: z.string().optional(),
  channels: z.array(z.enum(MKT_CHANNELS)).min(1),
  language: z.string().default("en"),
  approvalMode: z.enum(["auto","manual","team_review"]).default("manual"),
});

/**
 * generateContent — produces a content_item + one variant per selected channel.
 * Uses the centralized AI Router. Returns the created content_id + variants.
 */
export const generateContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => GenerateInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Load brand tone
    const { data: brand, error: brandErr } = await supabase
      .from("mkt_brands").select("id, name, tone, voice_notes, primary_color, default_approval_mode")
      .eq("id", data.brandId).maybeSingle();
    if (brandErr || !brand) throw new Error("Brand not found or not accessible");

    const { aiChat } = await import("@/lib/ai/ai-platform.functions");

    // Build a single structured request that asks for a per-channel variant map.
    const channelInstructions = data.channels.map((c) => {
      const s = CHANNEL_SPECS[c as MktChannel];
      return `- ${s.label} (${c}): max ${s.maxChars} chars, tone: ${s.tone}, hashtags: ${s.hashtagStyle}`;
    }).join("\n");

    const systemPrompt = `You are the head of marketing for "${brand.name}", an EdTech brand. Tone: ${brand.tone ?? "professional, empowering"}.
${brand.voice_notes ? `Voice notes: ${brand.voice_notes}` : ""}
Return STRICT JSON only. Do not include markdown, code fences, or commentary.`;

    const userPrompt = `Content type: ${data.contentType}
Title hint: ${data.title ?? "(auto)"}
Brief: ${data.brief}
Language: ${data.language}

Produce one variant per channel below.
${channelInstructions}

JSON schema:
{
  "headline": "string",
  "seo_title": "string",
  "seo_description": "string",
  "variants": {
    "<channel_key>": {
      "caption": "string",
      "body": "string (long form; may equal caption for short channels)",
      "cta": "string",
      "hashtags": ["string", ...]
    }
  }
}
Channel keys must match exactly: ${data.channels.join(", ")}.
Hashtag arrays: heavy=15-25, medium=5-10, light=1-3, none=[].`;

    const ai = await aiChat({
      data: {
        profile: { quality: "balanced" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        maxTokens: 4096,
      },
    });

    if (!ai.ok || !ai.result?.content) {
      throw new Error(`AI generation failed: ${typeof ai.error === "string" ? ai.error : JSON.stringify(ai.error ?? "unknown")}`);
    }

    // Robust JSON extraction
    const raw = ai.result.content.trim().replace(/^```(?:json)?\s*/, "").replace(/```$/, "");
    let parsed: {
      headline?: string; seo_title?: string; seo_description?: string;
      variants?: Record<string, { caption?: string; body?: string; cta?: string; hashtags?: string[] }>;
    };
    try { parsed = JSON.parse(raw); } catch {
      const m = raw.match(/\{[\s\S]*\}$/);
      if (!m) throw new Error("AI did not return parseable JSON");
      parsed = JSON.parse(m[0]);
    }

    // Insert content item
    const { data: item, error: insErr } = await supabase
      .from("mkt_content_items")
      .insert({
        brand_id: data.brandId,
        campaign_id: data.campaignId ?? null,
        content_type: data.contentType,
        title: data.title ?? parsed.headline ?? null,
        brief: data.brief,
        source_kind: data.sourceKind ?? null,
        source_ref: data.sourceRef ?? null,
        prompt: userPrompt,
        language: data.language,
        status: data.approvalMode === "auto" ? "approved" : "pending_review",
        approval_mode: data.approvalMode,
        created_by: userId,
        meta: JSON.parse(JSON.stringify({
          headline: parsed.headline,
          seo_title: parsed.seo_title,
          seo_description: parsed.seo_description,
          ai_chosen: ai.chosen,
        })),
      })
      .select("id").single();
    if (insErr || !item) throw new Error(insErr?.message ?? "Failed to insert content");

    // Insert variants
    const variantRows = data.channels.map((c) => {
      const v = parsed.variants?.[c] ?? parsed.variants?.[CHANNEL_SPECS[c as MktChannel].label] ?? {};
      return {
        content_id: item.id,
        channel_kind: c,
        variant_label: CHANNEL_SPECS[c as MktChannel].label,
        headline: parsed.headline ?? null,
        caption: v.caption ?? null,
        body: v.body ?? v.caption ?? null,
        cta: v.cta ?? null,
        hashtags: Array.isArray(v.hashtags) ? v.hashtags : [],
        seo_title: c === "blog" ? parsed.seo_title ?? null : null,
        seo_description: c === "blog" ? parsed.seo_description ?? null : null,
      };
    });
    const { data: variants, error: vErr } = await supabase
      .from("mkt_content_variants").insert(variantRows).select("id, channel_kind, variant_label");
    if (vErr) throw new Error(vErr.message);

    return {
      contentId: item.id,
      status: data.approvalMode === "auto" ? "approved" : "pending_review",
      variants: variants ?? [],
      chosen: ai.chosen,
    };
  });

const GenerateImageInput = z.object({
  contentId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  kind: z.enum([
    "square","portrait","landscape","carousel_slide","quote","infographic",
    "story","event_poster","course_poster","thumbnail",
  ]),
  stylePrompt: z.string().optional(),
});

const KIND_TO_SIZE: Record<string, string> = {
  square: "1024x1024",
  portrait: "1024x1536",
  landscape: "1536x1024",
  carousel_slide: "1024x1024",
  quote: "1024x1024",
  infographic: "1024x1536",
  story: "1024x1792",
  event_poster: "1024x1536",
  course_poster: "1024x1536",
  thumbnail: "1536x1024",
};

/**
 * generateContentImage — creates an image asset for a content item.
 */
export const generateContentImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => GenerateImageInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: content, error } = await supabase
      .from("mkt_content_items")
      .select("id, title, brief, meta, brand_id, mkt_brands(name, primary_color, accent_color)")
      .eq("id", data.contentId).maybeSingle();
    if (error || !content) throw new Error("Content not found");

    const brandName = (content as { mkt_brands?: { name?: string } }).mkt_brands?.name ?? "";
    const prompt = `${data.stylePrompt ?? "modern flat editorial style, premium EdTech brand, high contrast, clean sans-serif type"}. ${brandName ? `Brand: ${brandName}.` : ""} ${content.title ?? ""}. ${content.brief}`.slice(0, 900);

    const { aiImage } = await import("@/lib/ai/ai-platform.functions");
    const res = await aiImage({
      data: { profile: { quality: "balanced" }, prompt, size: KIND_TO_SIZE[data.kind] ?? "1024x1024" },
    });

    const url = (res as { url?: string; imageUrl?: string; result?: { url?: string } }).url
      ?? (res as { imageUrl?: string }).imageUrl
      ?? (res as { result?: { url?: string } }).result?.url;
    if (!url) throw new Error("Image provider returned no URL");

    const [w, h] = (KIND_TO_SIZE[data.kind] ?? "1024x1024").split("x").map((n) => parseInt(n, 10));
    const { data: asset, error: aErr } = await supabase
      .from("mkt_assets")
      .insert({
        content_id: data.contentId, variant_id: data.variantId ?? null,
        kind: data.kind, url, width: w, height: h, prompt, provider: "ai_router",
      })
      .select("id, url").single();
    if (aErr) throw new Error(aErr.message);
    return { assetId: asset!.id, url: asset!.url };
  });

const VideoScriptInput = z.object({
  contentId: z.string().uuid(),
  durationSec: z.number().int().min(15).max(180).default(60),
});

export const generateVideoScript = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => VideoScriptInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: c } = await supabase.from("mkt_content_items").select("brief, title").eq("id", data.contentId).maybeSingle();
    if (!c) throw new Error("Content not found");
    const { aiChat } = await import("@/lib/ai/ai-platform.functions");
    const ai = await aiChat({
      data: {
        profile: { quality: "balanced" },
        messages: [
          { role: "system", content: "You produce short-form vertical video scripts. Return STRICT JSON." },
          { role: "user", content: `Duration: ${data.durationSec}s. Title: ${c.title ?? ""}. Brief: ${c.brief}
Return JSON: {"script": string, "voiceover": string, "subtitles": [{"t": number, "text": string}], "thumbnail_title": string, "description": string, "tags": [string]}` },
        ],
        temperature: 0.7, maxTokens: 2048,
      },
    });
    if (!ai.ok || !ai.result?.content) throw new Error(typeof ai.error === "string" ? ai.error : "AI failed");
    const raw = ai.result.content.trim().replace(/^```(?:json)?\s*/, "").replace(/```$/, "");
    return JSON.parse(raw);
  });
