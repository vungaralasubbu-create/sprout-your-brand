/**
 * Creative Direction Engine — additive layer on top of the poster generator.
 *
 * Pipeline:
 *   1. designBrief()   — derive creative-direction brief from marketing brief
 *   2. proposeConcepts() — 4–6 unique creative concepts (distinct styles + layouts)
 *   3. scorePoster()   — rubric-based creative score (0–100)
 *   4. filterAndRank() — reject below threshold, sort best-first
 *
 * This module does NOT replace `case "posters"`; it augments the prompts and
 * scoring around the existing image generation call. All returned concept
 * objects remain shape-compatible with PosterModel (added optional fields).
 */

import { aiChat } from "@/lib/ai/router.server";

// ---- Concept style catalog ----
export const CREATIVE_STYLES = [
  "minimal_apple",
  "modern_saas",
  "premium_corporate",
  "bold_startup",
  "luxury",
  "magazine_editorial",
  "education",
  "technology",
  "futuristic",
  "glassmorphism",
  "bento",
  "gradient_mesh",
  "three_d",
  "illustration",
  "photographic",
] as const;
export type CreativeStyle = (typeof CREATIVE_STYLES)[number];

// ---- Layout catalog (extends existing centered/split/top_left/bottom_bar) ----
export const LAYOUTS = [
  "centered",
  "split",
  "hero_left",
  "hero_right",
  "magazine",
  "card_grid",
  "diagonal",
  "minimal",
  "poster",
  "social",
  "banner",
  "top_left",
  "bottom_bar",
] as const;
export type LayoutKey = (typeof LAYOUTS)[number];

export type DesignBrief = {
  creative_style: string;
  industry: string;
  audience: string;
  platform: string;
  brand_personality: string;
  campaign_goal: string;
  visual_mood: string;
  color_strategy: string;
  typography_style: string;
  layout_direction: string;
  cta_importance: "low" | "medium" | "high" | string;
};

export type CreativeConcept = {
  title?: string;
  concept?: string;
  style?: string;
  headline?: string;
  subtitle?: string;
  cta?: string;
  description?: string;
  dominant_colors?: string[];
  text_color?: string;
  accent_color?: string;
  layout?: string;
  background_prompt?: string;
  // engine additions
  creative_direction?: string;
  score?: number;
  score_breakdown?: Record<string, number>;
  score_notes?: string;
};

async function aiJson(system: string | undefined, user: string, maxTokens = 1200) {
  const res = await aiChat({
    system,
    messages: [{ role: "user", content: user }],
    responseFormat: "json",
    temperature: 0.8,
    maxTokens,
  });
  return (typeof res === "object" ? res : {}) as Record<string, any>;
}

/** Step 1 — Design Brief */
export async function designBrief(
  brandSystem: string | undefined,
  marketingBrief: Record<string, any>,
  userPrompt: string,
): Promise<DesignBrief> {
  const raw = await aiJson(
    brandSystem,
    `You are a creative director. Convert this marketing brief into a Design Brief that will guide poster art direction.

Respond as JSON with EXACTLY these keys:
{
  "creative_style": "e.g. minimal apple, modern saas, luxury, editorial, futuristic, illustration, photographic",
  "industry": "",
  "audience": "",
  "platform": "instagram | linkedin | facebook | x | youtube | multi",
  "brand_personality": "3-5 adjectives",
  "campaign_goal": "awareness | consideration | conversion | retention | launch",
  "visual_mood": "e.g. calm & premium, energetic & bold, warm & human",
  "color_strategy": "mono | duotone | analogous | complementary | vibrant | pastel | dark & moody",
  "typography_style": "e.g. large geometric sans, editorial serif headline, mono accents",
  "layout_direction": "centered | asymmetric | grid | editorial | poster | banner",
  "cta_importance": "low | medium | high"
}

Marketing brief: ${JSON.stringify(marketingBrief)}
User request: ${userPrompt}`,
    900,
  );
  return raw as DesignBrief;
}

/** Step 2 — Propose N unique creative concepts */
export async function proposeConcepts(
  brandSystem: string | undefined,
  brief: DesignBrief,
  marketingBrief: Record<string, any>,
  count = 6,
): Promise<CreativeConcept[]> {
  const styles = CREATIVE_STYLES.slice(0, count).join(", ");
  const layouts = LAYOUTS.filter(
    (l) => !["top_left", "bottom_bar"].includes(l),
  ).join(", ");
  const raw = await aiJson(
    brandSystem,
    `You are a senior art director. Generate ${count} DISTINCT poster concepts for the same campaign.
Each concept MUST have a genuinely different creative direction — different style, layout, visual metaphor, and color strategy. Do NOT vary only colors.

Available styles (pick a different one per concept when possible): ${styles}
Available layouts (pick a different one per concept when possible): ${layouts}

Respond as JSON:
{ "concepts": [ {
    "title": "short concept name",
    "creative_direction": "one-sentence unique art direction",
    "style": "one of the styles above",
    "layout": "one of the layouts above",
    "headline": "<= 6 words",
    "subtitle": "<= 12 words",
    "cta": "<= 4 words",
    "description": "<= 20 words",
    "dominant_colors": ["#hex", "#hex", "#hex"],
    "text_color": "#hex — must be readable over dominant_colors",
    "accent_color": "#hex — used for CTA button",
    "background_prompt": "vivid description of an ABSTRACT / photographic background artwork. MUST NOT contain any words, letters, numbers, logos, or typography."
} ] }

Design brief: ${JSON.stringify(brief)}
Marketing brief: ${JSON.stringify(marketingBrief)}`,
    2200,
  );
  const arr = Array.isArray(raw.concepts) ? raw.concepts : [];
  return arr.slice(0, count) as CreativeConcept[];
}

/** Step 6 — Score a rendered poster concept against a rubric (0–100). */
export function scorePoster(c: CreativeConcept): {
  score: number;
  breakdown: Record<string, number>;
  notes: string;
} {
  const b: Record<string, number> = {
    composition: 0,
    balance: 0,
    contrast: 0,
    readability: 0,
    hierarchy: 0,
    brand_consistency: 0,
    whitespace: 0,
    modern_appearance: 0,
  };
  const notes: string[] = [];

  // Composition / balance — layout diversity + presence
  if (c.layout && LAYOUTS.includes(c.layout as LayoutKey)) b.composition = 10;
  else { b.composition = 5; notes.push("unknown layout"); }
  b.balance = c.headline && c.subtitle && c.cta ? 12 : 6;

  // Contrast / readability — text_color vs dominant color luminance delta
  const lum = (hex?: string) => {
    if (!hex) return -1;
    const h = hex.replace("#", "");
    if (h.length !== 6) return -1;
    const r = parseInt(h.slice(0, 2), 16),
      g = parseInt(h.slice(2, 4), 16),
      bl = parseInt(h.slice(4, 6), 16);
    return (0.2126 * r + 0.7152 * g + 0.0722 * bl) / 255;
  };
  const textL = lum(c.text_color);
  const bgL = lum(c.dominant_colors?.[0]);
  if (textL >= 0 && bgL >= 0) {
    const delta = Math.abs(textL - bgL);
    b.contrast = Math.round(Math.min(15, delta * 20));
    b.readability = delta > 0.4 ? 15 : delta > 0.2 ? 10 : 5;
    if (delta <= 0.2) notes.push("low text/background contrast");
  } else {
    b.contrast = 6;
    b.readability = 6;
  }

  // Hierarchy — headline present, short enough, cta short
  const hlWords = (c.headline || "").trim().split(/\s+/).filter(Boolean).length;
  const ctaWords = (c.cta || "").trim().split(/\s+/).filter(Boolean).length;
  b.hierarchy = hlWords > 0 && hlWords <= 8 && ctaWords > 0 && ctaWords <= 5 ? 12 : 6;
  if (hlWords > 8) notes.push("headline too long");

  // Brand consistency — accent + palette present
  b.brand_consistency =
    (c.dominant_colors?.length ?? 0) >= 2 && c.accent_color ? 12 : 6;

  // Whitespace — description short, subtitle present but not overrun
  const descWords = (c.description || "").trim().split(/\s+/).filter(Boolean).length;
  b.whitespace = descWords <= 22 ? 12 : 6;
  if (descWords > 22) notes.push("description too dense");

  // Modern appearance — has creative_direction, background_prompt, non-generic style
  b.modern_appearance =
    (c.creative_direction ? 6 : 0) +
    (c.background_prompt && c.background_prompt.length > 30 ? 4 : 0) +
    (c.style ? 2 : 0);

  const score = Object.values(b).reduce((a, x) => a + x, 0); // /100 approx
  return { score, breakdown: b, notes: notes.join("; ") };
}

/** Filter posters below threshold and sort best-first. */
export function filterAndRank(
  concepts: CreativeConcept[],
  threshold = 55,
): { kept: CreativeConcept[]; rejected: CreativeConcept[] } {
  const scored = concepts.map((c) => {
    const s = scorePoster(c);
    return { ...c, score: s.score, score_breakdown: s.breakdown, score_notes: s.notes };
  });
  scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return {
    kept: scored.filter((c) => (c.score ?? 0) >= threshold),
    rejected: scored.filter((c) => (c.score ?? 0) < threshold),
  };
}
