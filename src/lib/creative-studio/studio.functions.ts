/**
 * AI Creative Studio — server functions
 * -------------------------------------
 * Backend-only APIs for the Creative Studio module. All AI calls flow
 * through the centralized AI Router (`aiChat`, `aiImage`). No UI, auth,
 * or payment code is modified.
 *
 * Surface area:
 *   - Brand Kit CRUD          (createBrandKit, listBrandKits, updateBrandKit, deleteBrandKit)
 *   - Template CRUD           (listTemplates, saveTemplate)
 *   - Folder CRUD             (listFolders, createFolder)
 *   - Design lifecycle        (generateDesign, listDesigns, getDesign, updateDesign, duplicateDesign, deleteDesign)
 *   - Editor ops              (saveDesignVersion, restoreDesignVersion, listDesignVersions)
 *   - Assets                  (listAssets, saveAsset, deleteAsset)
 *   - AI features             (rewriteHeadline, generateVariations, generatePalette, generateCTA,
 *                              resizeDesign, translateDesign, replaceBackground, suggestLayout,
 *                              suggestTypography, generateAsset)
 *   - Collaboration           (addComment, listComments)
 *   - Analytics               (trackDesignEvent, designAnalytics)
 *   - Export                  (exportDesign — records export intent + URL)
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { aiChat, aiImage } from "@/lib/ai/ai-platform.functions";
import {
  buildLayout,
  paletteForStyle,
  typographyForBrand,
} from "./layout-engine";
import type {
  BrandKitSnapshot,
  DesignCategory,
  DesignCopy,
  DesignFormat,
  DesignPalette,
  DesignStyle,
} from "./types";
import { FORMAT_SPECS } from "./types";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const FORMAT_ENUM = z.enum(Object.keys(FORMAT_SPECS) as [DesignFormat, ...DesignFormat[]]);
const STYLE_ENUM = z.enum([
  "minimal","modern","corporate","startup","glassmorphism","neumorphism",
  "dark","light","premium","bold","luxury",
]);
const CATEGORY_ENUM = z.enum([
  "education","technology","finance","healthcare","events","hiring","internships",
  "certifications","discount","admissions","announcements","festivals","ai","marketing",
  "business","corporate",
]);

const BrandKitInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  logo_url: z.string().url().nullish(),
  primary_color: z.string().nullish(),
  secondary_color: z.string().nullish(),
  accent_color: z.string().nullish(),
  heading_font: z.string().nullish(),
  body_font: z.string().nullish(),
  button_style: z.string().nullish(),
  border_radius: z.string().nullish(),
  illustration_style: z.string().nullish(),
  icon_style: z.string().nullish(),
  tone_of_voice: z.string().nullish(),
  cta_style: z.string().nullish(),
  watermark_url: z.string().url().nullish(),
  is_default: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loadBrandKit(supabase: any, brandKitId: string | null | undefined): Promise<BrandKitSnapshot | null> {
  if (!brandKitId) return null;
  const { data } = await supabase.from("cs_brand_kits").select("*").eq("id", brandKitId).maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    logoUrl: data.logo_url ?? null,
    primary: data.primary_color ?? "#111827",
    secondary: data.secondary_color ?? "#6B7280",
    accent: data.accent_color ?? "#3B82F6",
    headingFont: data.heading_font ?? "Inter",
    bodyFont: data.body_font ?? "Inter",
    toneOfVoice: data.tone_of_voice ?? null,
    ctaStyle: data.cta_style ?? null,
    buttonStyle: data.button_style ?? null,
    borderRadius: data.border_radius ?? null,
    watermarkUrl: data.watermark_url ?? null,
  };
}

function tryParseJson<T = unknown>(raw: string | null | undefined): T | null {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try { return JSON.parse(cleaned) as T; } catch { /* fallthrough */ }
  const start = cleaned.indexOf("{");
  const arrStart = cleaned.indexOf("[");
  const first = arrStart >= 0 && (start < 0 || arrStart < start) ? arrStart : start;
  const last = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
  if (first < 0 || last < 0 || last <= first) return null;
  try { return JSON.parse(cleaned.slice(first, last + 1)) as T; } catch { return null; }
}

async function generateCopyFromPrompt(params: {
  prompt: string;
  format: DesignFormat;
  style: DesignStyle;
  category?: DesignCategory;
  brand?: BrandKitSnapshot | null;
  slides?: number;
}): Promise<{ headline: string; slidesCopy: DesignCopy[]; base: DesignCopy }> {
  const brandTone = params.brand?.toneOfVoice ? `Brand tone of voice: ${params.brand.toneOfVoice}.` : "";
  const slides = params.slides ?? FORMAT_SPECS[params.format].slides ?? 1;
  const jsonSchemaHint = slides > 1
    ? `{"slides":[{"headline":"","subheadline":"","body":"","cta":"","bullets":["",""]}], "caption":"", "hashtags":["",""], "keywords":["",""]}`
    : `{"headline":"","subheadline":"","body":"","cta":"","bullets":["",""],"benefits":["",""],"caption":"","hashtags":["",""],"keywords":["",""],"footer":""}`;

  const system = `You are the AI Creative Director at Glintr. You write high-conversion visual copy for marketing designs. Output STRICT JSON only. No prose, no markdown.`;
  const user = [
    `User brief: ${params.prompt}`,
    `Format: ${FORMAT_SPECS[params.format].label} (${params.format})`,
    `Style: ${params.style}`,
    params.category ? `Category: ${params.category}` : "",
    brandTone,
    slides > 1 ? `Produce ${slides} slides.` : "",
    `Return JSON matching this shape exactly: ${jsonSchemaHint}`,
    `Keep headlines under 8 words. Subheadlines under 14 words. CTA under 4 words. Hashtags: 5-10, lowercase, no spaces.`,
  ].filter(Boolean).join("\n");

  const res = await aiChat({
    data: {
      profile: { quality: "balanced" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.8,
      maxTokens: 1200,
    },
  });

  const raw = res.result?.content ?? "";
  const parsed = tryParseJson<any>(raw);

  if (parsed && slides > 1 && Array.isArray(parsed.slides)) {
    const slidesCopy: DesignCopy[] = parsed.slides.slice(0, slides).map((s: any, idx: number) => ({
      headline: String(s.headline ?? `Slide ${idx + 1}`),
      subheadline: s.subheadline ? String(s.subheadline) : undefined,
      body: s.body ? String(s.body) : undefined,
      cta: s.cta ? String(s.cta) : undefined,
      bullets: Array.isArray(s.bullets) ? s.bullets.map(String) : undefined,
    }));
    const base: DesignCopy = {
      ...slidesCopy[0],
      caption: parsed.caption ? String(parsed.caption) : undefined,
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.map(String) : undefined,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map(String) : undefined,
    };
    return { headline: base.headline, slidesCopy, base };
  }

  const single: DesignCopy = {
    headline: String(parsed?.headline ?? params.prompt.slice(0, 60)),
    subheadline: parsed?.subheadline ? String(parsed.subheadline) : undefined,
    body: parsed?.body ? String(parsed.body) : undefined,
    cta: parsed?.cta ? String(parsed.cta) : "Learn More",
    bullets: Array.isArray(parsed?.bullets) ? parsed.bullets.map(String) : undefined,
    benefits: Array.isArray(parsed?.benefits) ? parsed.benefits.map(String) : undefined,
    caption: parsed?.caption ? String(parsed.caption) : undefined,
    hashtags: Array.isArray(parsed?.hashtags) ? parsed.hashtags.map(String) : undefined,
    keywords: Array.isArray(parsed?.keywords) ? parsed.keywords.map(String) : undefined,
    footer: parsed?.footer ? String(parsed.footer) : undefined,
  };
  return { headline: single.headline, slidesCopy: [single], base: single };
}

// ---------------------------------------------------------------------------
// Brand Kits
// ---------------------------------------------------------------------------

export const createBrandKit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => BrandKitInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { id, ...rest } = data;
    const payload = { ...rest, owner_id: userId };
    const { data: row, error } = id
      ? await supabase.from("cs_brand_kits").update(payload).eq("id", id).eq("owner_id", userId).select("*").single()
      : await supabase.from("cs_brand_kits").insert(payload).select("*").single();
    if (error) throw error;
    return row;
  });

export const listBrandKits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("cs_brand_kits").select("*")
      .eq("owner_id", context.userId)
      .order("is_default", { ascending: false })
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const updateBrandKit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => BrandKitInput.extend({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const { data: row, error } = await context.supabase
      .from("cs_brand_kits").update(rest).eq("id", id).eq("owner_id", context.userId).select("*").single();
    if (error) throw error;
    return row;
  });

export const deleteBrandKit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("cs_brand_kits").delete().eq("id", data.id).eq("owner_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export const listTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    category: CATEGORY_ENUM.optional(),
    format: FORMAT_ENUM.optional(),
    onlyMine: z.boolean().optional(),
  }).default({}).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("cs_templates").select("*");
    if (data.category) q = q.eq("category", data.category);
    if (data.format) q = q.eq("format", data.format);
    if (data.onlyMine) q = q.eq("owner_id", context.userId);
    const { data: rows, error } = await q.order("usage_count", { ascending: false }).limit(200);
    if (error) throw error;
    return rows ?? [];
  });

export const saveTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1),
    category: CATEGORY_ENUM,
    format: FORMAT_ENUM,
    style: STYLE_ENUM.optional(),
    layout: z.record(z.string(), z.any()).default({}),
    thumbnail_url: z.string().url().nullish(),
    is_public: z.boolean().optional(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const payload = { ...rest, owner_id: context.userId };
    const { data: row, error } = id
      ? await context.supabase.from("cs_templates").update(payload).eq("id", id).select("*").single()
      : await context.supabase.from("cs_templates").insert(payload).select("*").single();
    if (error) throw error;
    return row;
  });

// ---------------------------------------------------------------------------
// Folders
// ---------------------------------------------------------------------------

export const listFolders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("cs_folders")
      .select("*").eq("owner_id", context.userId).order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });

export const createFolder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    name: z.string().min(1),
    parent_id: z.string().uuid().nullish(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("cs_folders")
      .insert({ ...data, owner_id: context.userId }).select("*").single();
    if (error) throw error;
    return row;
  });

// ---------------------------------------------------------------------------
// Design generation
// ---------------------------------------------------------------------------

const GenerateDesignInput = z.object({
  prompt: z.string().min(4),
  format: FORMAT_ENUM,
  style: STYLE_ENUM.default("modern"),
  category: CATEGORY_ENUM.optional(),
  brand_kit_id: z.string().uuid().nullish(),
  folder_id: z.string().uuid().nullish(),
  template_id: z.string().uuid().nullish(),
  title: z.string().optional(),
  generate_image: z.boolean().optional().default(false),
});

export const generateDesign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenerateDesignInput.parse(input))
  .handler(async ({ data, context }) => {
    const brand = await loadBrandKit(context.supabase, data.brand_kit_id ?? null);
    const palette = paletteForStyle(data.style, brand);
    const typography = typographyForBrand(brand);

    const { slidesCopy, base } = await generateCopyFromPrompt({
      prompt: data.prompt,
      format: data.format,
      style: data.style,
      category: data.category,
      brand,
    });

    let previewUrl: string | null = null;
    if (data.generate_image) {
      try {
        const spec = FORMAT_SPECS[data.format];
        const size = `${spec.width}x${spec.height}`;
        const img = await aiImage({
          data: {
            profile: { quality: "balanced" },
            prompt: `Marketing ${spec.label} in ${data.style} style. ${data.prompt}. Palette: ${palette.primary}, ${palette.secondary}, ${palette.accent}. No embedded text.`,
            size,
            quality: "medium",
          },
        });
        // aiImage returns provider-specific payload; store URL if available.
        previewUrl = (img as any)?.url ?? (img as any)?.data?.[0]?.url ?? null;
      } catch {
        previewUrl = null;
      }
    }

    const layout = buildLayout({
      format: data.format,
      style: data.style,
      copy: base,
      palette,
      typography,
      brand,
      slidesCopy,
    });

    const { data: design, error } = await context.supabase.from("cs_designs").insert({
      owner_id: context.userId,
      folder_id: data.folder_id ?? null,
      brand_kit_id: data.brand_kit_id ?? null,
      template_id: data.template_id ?? null,
      title: data.title ?? base.headline.slice(0, 80),
      prompt: data.prompt,
      format: data.format,
      style: data.style,
      status: "ready",
      layout,
      copy: base,
      palette,
      typography,
      preview_url: previewUrl,
      metadata: { category: data.category ?? null },
    }).select("*").single();
    if (error) throw error;

    // Seed initial version
    await context.supabase.from("cs_design_versions").insert({
      design_id: design.id,
      version: 1,
      layout,
      copy: base,
      palette,
      typography,
      preview_url: previewUrl,
      created_by: context.userId,
      note: "Initial AI generation",
    });

    return design;
  });

// ---------------------------------------------------------------------------
// Design listing / lifecycle
// ---------------------------------------------------------------------------

export const listDesigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    folder_id: z.string().uuid().nullish(),
    status: z.string().optional(),
    limit: z.number().int().positive().max(200).default(50),
  }).default({}).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("cs_designs").select("id, title, format, style, status, preview_url, folder_id, brand_kit_id, updated_at").eq("owner_id", context.userId);
    if (data.folder_id) q = q.eq("folder_id", data.folder_id);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q.order("updated_at", { ascending: false }).limit(data.limit);
    if (error) throw error;
    return rows ?? [];
  });

export const getDesign = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("cs_designs").select("*").eq("id", data.id).maybeSingle();
    if (error) throw error;
    return row;
  });

export const updateDesign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    id: z.string().uuid(),
    patch: z.record(z.string(), z.any()),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const allowed = ["title","status","layout","copy","palette","typography","preview_url","export_urls","locked_elements","metadata","folder_id","brand_kit_id"];
    const patch: Record<string, unknown> = {};
    for (const k of allowed) if (k in data.patch) patch[k] = (data.patch as any)[k];
    const { data: row, error } = await context.supabase.from("cs_designs")
      .update(patch).eq("id", data.id).eq("owner_id", context.userId).select("*").single();
    if (error) throw error;
    return row;
  });

export const duplicateDesign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: src, error } = await context.supabase.from("cs_designs").select("*").eq("id", data.id).single();
    if (error) throw error;
    const { id: _drop, created_at: _c, updated_at: _u, version: _v, ...clone } = src as any;
    const { data: dup, error: e2 } = await context.supabase.from("cs_designs").insert({
      ...clone,
      title: `${src.title} (Copy)`,
      owner_id: context.userId,
    }).select("*").single();
    if (e2) throw e2;
    return dup;
  });

export const deleteDesign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("cs_designs").delete()
      .eq("id", data.id).eq("owner_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

// ---------------------------------------------------------------------------
// Versions
// ---------------------------------------------------------------------------

export const saveDesignVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    design_id: z.string().uuid(),
    note: z.string().optional(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: design, error } = await context.supabase.from("cs_designs").select("*").eq("id", data.design_id).single();
    if (error) throw error;
    const nextVersion = (design.version ?? 1) + 1;
    const { data: row, error: e2 } = await context.supabase.from("cs_design_versions").insert({
      design_id: design.id,
      version: nextVersion,
      layout: design.layout,
      copy: design.copy,
      palette: design.palette,
      typography: design.typography,
      preview_url: design.preview_url,
      created_by: context.userId,
      note: data.note ?? null,
    }).select("*").single();
    if (e2) throw e2;
    await context.supabase.from("cs_designs").update({ version: nextVersion }).eq("id", design.id);
    return row;
  });

export const listDesignVersions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ design_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.from("cs_design_versions")
      .select("*").eq("design_id", data.design_id).order("version", { ascending: false });
    if (error) throw error;
    return rows ?? [];
  });

export const restoreDesignVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    design_id: z.string().uuid(),
    version_id: z.string().uuid(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: v, error } = await context.supabase.from("cs_design_versions").select("*").eq("id", data.version_id).single();
    if (error) throw error;
    const { data: row, error: e2 } = await context.supabase.from("cs_designs").update({
      layout: v.layout, copy: v.copy, palette: v.palette, typography: v.typography, preview_url: v.preview_url,
    }).eq("id", data.design_id).eq("owner_id", context.userId).select("*").single();
    if (e2) throw e2;
    return row;
  });

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------

export const listAssets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    kind: z.string().optional(),
    brand_kit_id: z.string().uuid().nullish(),
    limit: z.number().int().positive().max(200).default(60),
  }).default({}).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("cs_assets").select("*").eq("owner_id", context.userId);
    if (data.kind) q = q.eq("kind", data.kind);
    if (data.brand_kit_id) q = q.eq("brand_kit_id", data.brand_kit_id);
    const { data: rows, error } = await q.order("created_at", { ascending: false }).limit(data.limit);
    if (error) throw error;
    return rows ?? [];
  });

export const saveAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    kind: z.string(),
    name: z.string(),
    url: z.string().url(),
    brand_kit_id: z.string().uuid().nullish(),
    mime_type: z.string().nullish(),
    size_bytes: z.number().int().nullish(),
    width: z.number().int().nullish(),
    height: z.number().int().nullish(),
    source: z.string().default("upload"),
    ai_prompt: z.string().nullish(),
    tags: z.array(z.string()).default([]),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("cs_assets")
      .insert({ ...data, owner_id: context.userId }).select("*").single();
    if (error) throw error;
    return row;
  });

export const deleteAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("cs_assets").delete()
      .eq("id", data.id).eq("owner_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

// ---------------------------------------------------------------------------
// AI features
// ---------------------------------------------------------------------------

async function chatJSON(system: string, user: string, quality: "fast" | "balanced" | "premium" = "balanced") {
  const res = await aiChat({
    data: {
      profile: { quality },
      messages: [
        { role: "system", content: `${system}\nOutput STRICT JSON only. No prose. No markdown.` },
        { role: "user", content: user },
      ],
      temperature: 0.7,
      maxTokens: 700,
    },
  });
  return tryParseJson<any>(res.result?.content ?? "");
}

export const rewriteHeadline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    headline: z.string().min(1),
    tone: z.string().optional(),
    count: z.number().int().min(1).max(10).default(5),
  }).parse(input))
  .handler(async ({ data }) => {
    const parsed = await chatJSON(
      "You are a senior direct-response copywriter.",
      `Rewrite this headline into ${data.count} punchy variants${data.tone ? ` in a ${data.tone} tone` : ""}: "${data.headline}". Return {"variants":["",""]}`,
    );
    return { variants: Array.isArray(parsed?.variants) ? parsed.variants.map(String) : [] };
  });

export const generateVariations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    design_id: z.string().uuid(),
    count: z.number().int().min(1).max(5).default(3),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: design, error } = await context.supabase.from("cs_designs").select("*").eq("id", data.design_id).single();
    if (error) throw error;

    const variants = [];
    for (let i = 0; i < data.count; i++) {
      const { data: v, error: e2 } = await context.supabase.from("cs_designs").insert({
        owner_id: context.userId,
        folder_id: design.folder_id,
        brand_kit_id: design.brand_kit_id,
        title: `${design.title} — Variant ${i + 1}`,
        prompt: design.prompt,
        format: design.format,
        style: design.style,
        status: "generating",
        layout: design.layout,
        copy: design.copy,
        palette: design.palette,
        typography: design.typography,
        metadata: { ...(design.metadata ?? {}), variant_of: design.id },
      }).select("*").single();
      if (e2) throw e2;
      variants.push(v);
    }

    // Asynchronously kick a regen for each — fire-and-forget copy refresh
    for (const v of variants) {
      try {
        const { base, slidesCopy } = await generateCopyFromPrompt({
          prompt: design.prompt ?? design.title,
          format: design.format,
          style: design.style,
          brand: await loadBrandKit(context.supabase, design.brand_kit_id),
        });
        const brand = await loadBrandKit(context.supabase, design.brand_kit_id);
        const layout = buildLayout({
          format: design.format,
          style: design.style,
          copy: base,
          palette: design.palette,
          typography: design.typography,
          brand,
          slidesCopy,
        });
        await context.supabase.from("cs_designs").update({
          copy: base, layout, status: "ready",
        }).eq("id", v.id);
      } catch {
        await context.supabase.from("cs_designs").update({ status: "ready" }).eq("id", v.id);
      }
    }

    return { variants };
  });

export const generatePalette = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    mood: z.string().min(1),
  }).parse(input))
  .handler(async ({ data }) => {
    const parsed = await chatJSON(
      "You are a senior brand designer. Generate cohesive color palettes.",
      `Create a color palette for mood: "${data.mood}". Return {"primary":"#","secondary":"#","accent":"#","background":"#","foreground":"#","muted":"#"}`,
      "fast",
    );
    return (parsed ?? {}) as Partial<DesignPalette>;
  });

export const generateCTA = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    context: z.string().min(1),
    count: z.number().int().min(1).max(10).default(5),
  }).parse(input))
  .handler(async ({ data }) => {
    const parsed = await chatJSON(
      "You are a conversion copywriter.",
      `Write ${data.count} punchy CTAs (max 4 words each) for: "${data.context}". Return {"ctas":["",""]}`,
      "fast",
    );
    return { ctas: Array.isArray(parsed?.ctas) ? parsed.ctas.map(String) : [] };
  });

export const resizeDesign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    design_id: z.string().uuid(),
    format: FORMAT_ENUM,
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: design, error } = await context.supabase.from("cs_designs").select("*").eq("id", data.design_id).single();
    if (error) throw error;
    const brand = await loadBrandKit(context.supabase, design.brand_kit_id);
    const slidesCopy: DesignCopy[] = Array.isArray(design.layout?.slides)
      ? design.layout.slides.map(() => design.copy as DesignCopy)
      : [design.copy as DesignCopy];
    const layout = buildLayout({
      format: data.format,
      style: design.style,
      copy: design.copy,
      palette: design.palette,
      typography: design.typography,
      brand,
      slidesCopy,
    });
    const { data: dup, error: e2 } = await context.supabase.from("cs_designs").insert({
      owner_id: context.userId,
      folder_id: design.folder_id,
      brand_kit_id: design.brand_kit_id,
      title: `${design.title} — ${FORMAT_SPECS[data.format].label}`,
      prompt: design.prompt,
      format: data.format,
      style: design.style,
      status: "ready",
      layout,
      copy: design.copy,
      palette: design.palette,
      typography: design.typography,
      metadata: { ...(design.metadata ?? {}), resized_from: design.id },
    }).select("*").single();
    if (e2) throw e2;
    return dup;
  });

export const translateDesign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    design_id: z.string().uuid(),
    target_language: z.string().min(2),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: design, error } = await context.supabase.from("cs_designs").select("*").eq("id", data.design_id).single();
    if (error) throw error;

    const parsed = await chatJSON(
      `You are a professional marketing translator into ${data.target_language}.`,
      `Translate the following JSON design copy into ${data.target_language}. Preserve keys and structure exactly:\n${JSON.stringify(design.copy)}`,
    );
    const nextCopy = (parsed ?? design.copy) as DesignCopy;
    const brand = await loadBrandKit(context.supabase, design.brand_kit_id);
    const slidesCopy: DesignCopy[] = Array.isArray(design.layout?.slides) ? design.layout.slides.map(() => nextCopy) : [nextCopy];
    const layout = buildLayout({
      format: design.format,
      style: design.style,
      copy: nextCopy,
      palette: design.palette,
      typography: design.typography,
      brand,
      slidesCopy,
    });
    const { data: row, error: e2 } = await context.supabase.from("cs_designs")
      .update({ copy: nextCopy, layout, metadata: { ...(design.metadata ?? {}), language: data.target_language } })
      .eq("id", data.design_id).eq("owner_id", context.userId).select("*").single();
    if (e2) throw e2;
    return row;
  });

export const replaceBackground = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    design_id: z.string().uuid(),
    prompt: z.string().min(3),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: design, error } = await context.supabase.from("cs_designs").select("*").eq("id", data.design_id).single();
    if (error) throw error;
    const spec = FORMAT_SPECS[design.format as DesignFormat];
    let url: string | null = null;
    try {
      const img = await aiImage({
        data: {
          profile: { quality: "balanced" },
          prompt: `${data.prompt}. Clean background. No text. ${design.style} style.`,
          size: `${spec.width}x${spec.height}`,
          quality: "medium",
        },
      });
      url = (img as any)?.url ?? (img as any)?.data?.[0]?.url ?? null;
    } catch { url = null; }

    if (!url) return { ok: false, reason: "image_unavailable" };

    const layout = design.layout ?? {};
    if (Array.isArray(layout.slides)) {
      layout.slides = layout.slides.map((s: any) => ({ ...s, background: { kind: "image", value: url } }));
    }
    const { data: row, error: e2 } = await context.supabase.from("cs_designs").update({ layout, preview_url: url })
      .eq("id", data.design_id).eq("owner_id", context.userId).select("*").single();
    if (e2) throw e2;
    return { ok: true, design: row };
  });

export const suggestLayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ design_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: design, error } = await context.supabase.from("cs_designs").select("*").eq("id", data.design_id).single();
    if (error) throw error;
    const parsed = await chatJSON(
      "You are a senior visual designer. Suggest layout improvements.",
      `Given format ${design.format}, style ${design.style}, copy ${JSON.stringify(design.copy)}, suggest 3 concrete layout improvements. Return {"suggestions":["",""]}`,
    );
    return { suggestions: Array.isArray(parsed?.suggestions) ? parsed.suggestions.map(String) : [] };
  });

export const suggestTypography = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ mood: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const parsed = await chatJSON(
      "You are a typography specialist. Recommend Google Fonts pairings.",
      `Suggest 3 heading/body font pairings for mood: "${data.mood}". Return {"pairings":[{"heading":"","body":"","rationale":""}]}`,
      "fast",
    );
    return parsed ?? { pairings: [] };
  });

export const generateAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    prompt: z.string().min(3),
    kind: z.enum(["image","illustration","icon","background","logo"]).default("image"),
    size: z.string().optional(),
    brand_kit_id: z.string().uuid().nullish(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const img = await aiImage({
      data: {
        profile: { quality: "balanced" },
        prompt: data.prompt,
        size: data.size,
        quality: "medium",
      },
    });
    const url = (img as any)?.url ?? (img as any)?.data?.[0]?.url ?? null;
    if (!url) return { ok: false, reason: "image_unavailable" };

    const { data: asset, error } = await context.supabase.from("cs_assets").insert({
      owner_id: context.userId,
      brand_kit_id: data.brand_kit_id ?? null,
      kind: data.kind,
      name: data.prompt.slice(0, 80),
      url,
      source: "ai_generated",
      ai_prompt: data.prompt,
    }).select("*").single();
    if (error) throw error;
    return { ok: true, asset };
  });

// ---------------------------------------------------------------------------
// Collaboration
// ---------------------------------------------------------------------------

export const addComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    design_id: z.string().uuid(),
    body: z.string().min(1),
    status: z.string().optional(),
    anchor: z.record(z.string(), z.any()).optional(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("cs_design_comments").insert({
      design_id: data.design_id,
      author_id: context.userId,
      body: data.body,
      status: data.status ?? null,
      anchor: data.anchor ?? null,
    }).select("*").single();
    if (error) throw error;
    return row;
  });

export const listComments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ design_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.from("cs_design_comments")
      .select("*").eq("design_id", data.design_id).order("created_at", { ascending: false });
    if (error) throw error;
    return rows ?? [];
  });

// ---------------------------------------------------------------------------
// Analytics + export
// ---------------------------------------------------------------------------

export const trackDesignEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    design_id: z.string().uuid(),
    event: z.string(),
    payload: z.record(z.string(), z.any()).optional(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await context.supabase.from("cs_design_analytics").insert({
      design_id: data.design_id,
      event: data.event,
      actor_id: context.userId,
      payload: data.payload ?? {},
    });
    return { ok: true };
  });

export const designAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ design_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.from("cs_design_analytics")
      .select("event, created_at").eq("design_id", data.design_id);
    if (error) throw error;
    const totals: Record<string, number> = {};
    for (const r of rows ?? []) totals[r.event] = (totals[r.event] ?? 0) + 1;
    return { totals, total: rows?.length ?? 0 };
  });

export const exportDesign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    design_id: z.string().uuid(),
    format: z.enum(["png","jpeg","pdf","svg"]),
    url: z.string().url(),
    transparent: z.boolean().optional(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: design, error } = await context.supabase.from("cs_designs").select("export_urls").eq("id", data.design_id).single();
    if (error) throw error;
    const next = { ...(design.export_urls ?? {}), [data.format]: data.url };
    const { error: e2 } = await context.supabase.from("cs_designs").update({ export_urls: next }).eq("id", data.design_id).eq("owner_id", context.userId);
    if (e2) throw e2;
    await context.supabase.from("cs_design_analytics").insert({
      design_id: data.design_id,
      event: "export",
      actor_id: context.userId,
      payload: { format: data.format, transparent: !!data.transparent },
    });
    return { ok: true, export_urls: next };
  });
