/**
 * AI SEO Engine — server functions
 * ---------------------------------
 * Generates reviewable SEO suggestions using the centralized AI platform
 * (routed via `aiChat`) and persists them into `ai_seo_suggestions`.
 *
 * Every generator produces a `pending` row that admins can approve,
 * reject, or publish from the review UI at `/admin/ai-seo`.
 *
 * Kinds:
 *   title, meta_description, faq_schema, internal_links, breadcrumbs,
 *   structured_data, keyword_opportunities, duplicate_content,
 *   content_improvements, heading_hierarchy, missing_pages, image_alt
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { aiChat } from "@/lib/ai/ai-platform.functions";

export const AI_SEO_KINDS = [
  "title",
  "meta_description",
  "faq_schema",
  "internal_links",
  "breadcrumbs",
  "structured_data",
  "keyword_opportunities",
  "duplicate_content",
  "content_improvements",
  "heading_hierarchy",
  "missing_pages",
  "image_alt",
] as const;
export type AiSeoKind = (typeof AI_SEO_KINDS)[number];

// ---------- Prompt templates ----------

const SYSTEM = `You are Glintr's Enterprise SEO Engine. You produce
production-grade, on-brand SEO artifacts for a B2B EdTech marketplace.
Rules:
- Always return STRICT JSON that matches the requested schema. No prose.
- Titles ≤ 60 chars, meta descriptions 140–160 chars.
- Prefer intent-rich, natural phrasing over keyword stuffing.
- Never invent facts about the page; work only from the provided input.`;

function userPromptFor(kind: AiSeoKind, input: Record<string, unknown>): string {
  const ctx = JSON.stringify(input, null, 2);
  switch (kind) {
    case "title":
      return `Generate 3 SEO title candidates for the page below.\nReturn JSON: {"candidates":[{"title":string,"length":number,"rationale":string}]}.\n\nPAGE:\n${ctx}`;
    case "meta_description":
      return `Write 3 meta description candidates (140–160 chars each) with a clear benefit + soft CTA.\nReturn JSON: {"candidates":[{"description":string,"length":number,"rationale":string}]}.\n\nPAGE:\n${ctx}`;
    case "faq_schema":
      return `Generate 5–8 high-intent FAQs and matching FAQPage JSON-LD.\nReturn JSON: {"faqs":[{"q":string,"a":string}],"jsonld":object}.\n\nPAGE:\n${ctx}`;
    case "internal_links":
      return `Suggest 5–10 internal links that would help this page rank and help the reader.\nEach link needs a target slug (from provided candidates only), anchor text, and reason.\nReturn JSON: {"links":[{"target_slug":string,"anchor":string,"reason":string,"relevance":number}]}.\n\nPAGE:\n${ctx}`;
    case "breadcrumbs":
      return `Propose a breadcrumb trail (2–5 items) and BreadcrumbList JSON-LD for this page.\nReturn JSON: {"trail":[{"name":string,"url":string}],"jsonld":object}.\n\nPAGE:\n${ctx}`;
    case "structured_data":
      return `Choose the most appropriate schema.org type(s) for this page and emit valid JSON-LD.\nReturn JSON: {"types":[string],"jsonld":object,"rationale":string}.\n\nPAGE:\n${ctx}`;
    case "keyword_opportunities":
      return `Suggest 10 new keyword opportunities the site should target, ranked by opportunity.\nReturn JSON: {"keywords":[{"keyword":string,"intent":"informational"|"commercial"|"transactional"|"navigational","difficulty":"low"|"medium"|"high","cluster":string,"reason":string}]}.\n\nCONTEXT:\n${ctx}`;
    case "duplicate_content":
      return `Compare the two content blobs and identify duplicated or near-duplicated passages.\nReturn JSON: {"similarity":number,"is_duplicate":boolean,"segments":[{"a":string,"b":string,"note":string}],"recommendation":string}.\n\nINPUT:\n${ctx}`;
    case "content_improvements":
      return `Audit the content and recommend concrete, prioritized improvements (clarity, depth, E-E-A-T, structure, CTAs).\nReturn JSON: {"score":number,"improvements":[{"area":string,"issue":string,"suggestion":string,"priority":"low"|"medium"|"high"}]}.\n\nPAGE:\n${ctx}`;
    case "heading_hierarchy":
      return `Analyze the heading outline. Flag skipped levels, weak H1s, missing H2s.\nReturn JSON: {"issues":[{"level":number,"text":string,"issue":string,"fix":string}],"proposed_outline":[{"level":number,"text":string}]}.\n\nHEADINGS:\n${ctx}`;
    case "missing_pages":
      return `Given the site's existing pages and topics, recommend missing pages we should build for topical authority.\nReturn JSON: {"pages":[{"title":string,"slug":string,"type":string,"target_keyword":string,"outline":[string],"priority":"low"|"medium"|"high"}]}.\n\nCONTEXT:\n${ctx}`;
    case "image_alt":
      return `Generate accessible, descriptive ALT text for each image (≤ 125 chars, no "image of").\nReturn JSON: {"alts":[{"src":string,"alt":string}]}.\n\nIMAGES:\n${ctx}`;
  }
}

// ---------- Generate ----------

const GenerateInput = z.object({
  kind: z.enum(AI_SEO_KINDS),
  input: z.record(z.string(), z.any()).default({}),
  target: z
    .object({
      type: z.string().optional(),
      id: z.string().optional(),
      url: z.string().optional(),
    })
    .optional(),
  priority: z.number().int().min(0).max(10).optional(),
});

export const generateSeoSuggestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenerateInput.parse(input))
  .handler(async ({ data, context }) => {
    const { kind, input, target, priority } = data;

    const chat = await aiChat({
      data: {
        profile: { quality: "balanced", needsStructured: true },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPromptFor(kind, input) },
        ],
        temperature: 0.4,
        maxTokens: 2000,
      },
    });

    if (!chat.ok || !chat.result) {
      const errMsg = typeof chat.error === "string" ? chat.error : chat.error?.message ?? "AI generation failed";
      throw new Error(errMsg);
    }

    // Prefer structured payload, fall back to parsing JSON from content.
    let suggestion: Record<string, unknown> = {};

    if (chat.result.structuredJson) {
      try {
        suggestion = JSON.parse(chat.result.structuredJson);
      } catch {
        suggestion = chat.result.structuredJson;
      }
    }
    if (suggestion == null) {
      const raw = chat.result.content ?? "";
      const match = raw.match(/\{[\s\S]*\}$/m) ?? raw.match(/\{[\s\S]*\}/);
      try {
        suggestion = match ? JSON.parse(match[0]) : { raw };
      } catch {
        suggestion = { raw };
      }
    }

    const { data: row, error } = await context.supabase
      .from("ai_seo_suggestions")
      .insert({
        kind,
        target_type: target?.type ?? null,
        target_id: target?.id ?? null,
        target_url: target?.url ?? null,
        input_snapshot: input as never,
        suggestion: suggestion as never,
        rationale: null,
        model: chat.chosen ? `${chat.chosen.provider}:${chat.chosen.model}` : null,
        priority: priority ?? 0,
        status: "pending",
        created_by: context.userId,
      })
      .select("*")
      .single();

    if (error) throw error;
    return { id: row.id, suggestion, model: row.model };
  });

// ---------- Review queue ----------

const ListInput = z.object({
  status: z.enum(["pending", "approved", "rejected", "published", "all"]).default("pending"),
  kind: z.enum(AI_SEO_KINDS).optional(),
  limit: z.number().int().min(1).max(200).default(50),
});

export const listSeoSuggestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ListInput.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("ai_seo_suggestions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.status !== "all") q = q.eq("status", data.status);
    if (data.kind) q = q.eq("kind", data.kind);
    const { data: rows, error } = await q;
    if (error) throw error;
    return { rows: rows ?? [] };
  });

const ReviewInput = z.object({
  id: z.string().uuid(),
  action: z.enum(["approve", "reject", "publish"]),
  notes: z.string().max(2000).optional(),
});

export const reviewSeoSuggestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ReviewInput.parse(input))
  .handler(async ({ data, context }) => {
    const status =
      data.action === "approve" ? "approved" : data.action === "reject" ? "rejected" : "published";
    const patch: Record<string, unknown> = {
      status,
      reviewer_id: context.userId,
      review_notes: data.notes ?? null,
    };
    if (status === "published") patch.applied_at = new Date().toISOString();

    const { data: row, error } = await context.supabase
      .from("ai_seo_suggestions")
      .update(patch as never)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw error;
    return { row };
  });

const DeleteInput = z.object({ id: z.string().uuid() });

export const deleteSeoSuggestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DeleteInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("ai_seo_suggestions")
      .delete()
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const seoSuggestionStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("ai_seo_suggestions")
      .select("status, kind");
    if (error) throw error;
    const byStatus: Record<string, number> = {};
    const byKind: Record<string, number> = {};
    for (const r of data ?? []) {
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
      byKind[r.kind] = (byKind[r.kind] ?? 0) + 1;
    }
    return { byStatus, byKind, total: (data ?? []).length };
  });
