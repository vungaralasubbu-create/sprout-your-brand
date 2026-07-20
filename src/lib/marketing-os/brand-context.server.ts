/**
 * Brand Context — server-only helper for AI Router injection.
 *
 * Every AI module (Marketing OS, SEO, Blogs, Emails, Notifications, and
 * future Image/Video/Ad/Chat generators) calls `buildBrandSystemPrompt`
 * to receive the caller's Brand Kit as a compact system-prompt block.
 *
 * The helper is idempotent and safe when no Brand Kit exists — it returns
 * an empty string so callers can concat without conditionals.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

type BrandRow = {
  business_name: string | null;
  name: string;
  tagline: string | null;
  description: string | null;
  mission: string | null;
  industry: string | null;
  website: string | null;
  personality: string[] | null;
  tone_of_voice: string[] | null;
  writing_style: string[] | null;
  reading_level: string | null;
  target_audience: any;
  colors: any;
  keywords: any;
  writing_rules: any;
  content_rules: any;
  compliance: any;
  ai_rules: any;
};

function joinList(v: string[] | null | undefined): string {
  return (v ?? []).filter(Boolean).join(", ");
}

/**
 * Fetch the caller's default Brand Kit and format as a system-prompt block.
 * Pass any authenticated supabase client (RLS-scoped) or supabaseAdmin.
 */
export async function buildBrandSystemPrompt(
  supabase: SupabaseClient<any, any, any>,
  ownerId: string,
): Promise<string> {
  let row: BrandRow | null = null;
  const { data: def } = await supabase
    .from("mkt_brand_kits")
    .select(
      "business_name,name,tagline,description,mission,industry,website,personality,tone_of_voice,writing_style,reading_level,target_audience,colors,keywords,writing_rules,content_rules,compliance,ai_rules",
    )
    .eq("owner_id", ownerId)
    .eq("is_default", true)
    .maybeSingle();
  row = (def as BrandRow | null) ?? null;

  if (!row) {
    const { data: latest } = await supabase
      .from("mkt_brand_kits")
      .select(
        "business_name,name,tagline,description,mission,industry,website,personality,tone_of_voice,writing_style,reading_level,target_audience,colors,keywords,writing_rules,content_rules,compliance,ai_rules",
      )
      .eq("owner_id", ownerId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    row = (latest as BrandRow | null) ?? null;
  }

  if (!row) return "";

  const parts: string[] = ["BRAND CONTEXT (apply automatically to every response):"];
  const displayName = row.business_name ?? row.name;
  if (displayName) parts.push(`• Brand: ${displayName}${row.tagline ? ` — ${row.tagline}` : ""}`);
  if (row.industry) parts.push(`• Industry: ${row.industry}`);
  if (row.description) parts.push(`• About: ${row.description}`);
  if (row.mission) parts.push(`• Mission: ${row.mission}`);
  if (row.website) parts.push(`• Website: ${row.website}`);

  const personality = joinList(row.personality);
  if (personality) parts.push(`• Personality: ${personality}`);
  const tone = joinList(row.tone_of_voice);
  if (tone) parts.push(`• Tone of voice: ${tone}`);
  const style = joinList(row.writing_style);
  if (style) parts.push(`• Writing style: ${style}`);
  if (row.reading_level) parts.push(`• Reading level: ${row.reading_level}`);

  const audience = row.target_audience ?? {};
  const segments: string[] = Array.isArray(audience?.segments) ? audience.segments : [];
  if (segments.length) parts.push(`• Target audience: ${segments.join(", ")}`);

  const keywords = row.keywords ?? {};
  const primaryKw: string[] = Array.isArray(keywords?.primary) ? keywords.primary : [];
  const seoKw: string[] = Array.isArray(keywords?.seo) ? keywords.seo : [];
  const negativeKw: string[] = Array.isArray(keywords?.negative) ? keywords.negative : [];
  if (primaryKw.length) parts.push(`• Preferred keywords: ${primaryKw.join(", ")}`);
  if (seoKw.length) parts.push(`• SEO keywords: ${seoKw.join(", ")}`);

  const writingRules = row.writing_rules ?? {};
  const preferred: string[] = Array.isArray(writingRules?.preferred_words) ? writingRules.preferred_words : [];
  const avoid: string[] = Array.isArray(writingRules?.avoid_words) ? writingRules.avoid_words : [];
  const mandatoryCta = typeof writingRules?.mandatory_cta === "string" ? writingRules.mandatory_cta : "";
  const disclaimer = typeof writingRules?.mandatory_disclaimer === "string" ? writingRules.mandatory_disclaimer : "";
  if (preferred.length) parts.push(`• Preferred words: ${preferred.join(", ")}`);
  const doNotUse = [...avoid, ...negativeKw].filter(Boolean);
  if (doNotUse.length) parts.push(`• Do NOT use: ${doNotUse.join(", ")}`);
  if (mandatoryCta) parts.push(`• Mandatory CTA: ${mandatoryCta}`);
  if (disclaimer) parts.push(`• Mandatory disclaimer: ${disclaimer}`);

  const contentRules = row.content_rules ?? {};
  const contentBits: string[] = [];
  if (contentRules?.min_length) contentBits.push(`min ${contentRules.min_length}`);
  if (contentRules?.max_length) contentBits.push(`max ${contentRules.max_length}`);
  if (contentRules?.sentence_length) contentBits.push(`sentence ${contentRules.sentence_length}`);
  if (contentBits.length) parts.push(`• Length rules: ${contentBits.join(" · ")}`);

  const colors = row.colors ?? {};
  const colorBits = Object.entries(colors).filter(([, v]) => typeof v === "string" && v);
  if (colorBits.length)
    parts.push(`• Colors: ${colorBits.map(([k, v]) => `${k} ${v}`).join(", ")}`);

  const compliance = row.compliance ?? {};
  const complianceBits = Object.entries(compliance).filter(([, v]) => typeof v === "string" && v);
  if (complianceBits.length)
    parts.push(`• Compliance: ${complianceBits.map(([, v]) => v).join(" | ")}`);

  const ai = row.ai_rules ?? {};
  if (typeof ai?.global_prompt === "string" && ai.global_prompt.trim()) {
    parts.push(`• Global instruction: ${ai.global_prompt.trim()}`);
  }
  if (typeof ai?.extra_instructions === "string" && ai.extra_instructions.trim()) {
    parts.push(`• Additional: ${ai.extra_instructions.trim()}`);
  }

  parts.push(
    "Apply this brand context automatically. Do not restate it. Never contradict the tone, style, keywords, or compliance rules.",
  );
  return parts.join("\n");
}

/**
 * Convenience: prepend brand system prompt to an existing system string.
 */
export function withBrand(existingSystem: string | undefined, brandBlock: string): string {
  if (!brandBlock) return existingSystem ?? "";
  if (!existingSystem) return brandBlock;
  return `${brandBlock}\n\n---\n\n${existingSystem}`;
}
