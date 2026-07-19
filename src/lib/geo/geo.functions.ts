// Enterprise GEO Platform — server functions (admin-gated).
// Purely additive. All AI text generation flows through the centralized
// AI Router (aiChat → OpenAI). No Lovable AI runtime and no Lovable AI credits.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import {
  GEO_CONTENT_TYPES,
  GEO_PROMPT_VERSION,
  GEO_RECOMMENDATION_CATEGORIES,
} from "./constants";
import {
  computeScore,
  DEFAULT_SCORING_WEIGHTS,
  type ScoringInput,
  type ScoringWeights,
} from "./scoring.server";
import { extractEntities, slugifyEntity } from "./entity-extractor.server";
import { generateQuestions } from "./question-engine.server";
import { generateRecommendations } from "./recommendation-engine.server";
import { recommendSchemas } from "./schema-recommender.server";
import { detectSignals } from "./freshness.server";
import { upsertRelationships } from "./semantic-graph.server";

type Ctx = { supabase: any; userId: string };

async function requireAdmin(ctx: Ctx) {
  for (const role of ["super_admin", "admin"] as const) {
    const { data } = await ctx.supabase.rpc("has_role", {
      _user_id: ctx.userId,
      _role: role,
    });
    if (data === true) return true;
  }
  throw new Error("Forbidden: GEO platform requires admin role");
}

const ContentRef = z.object({
  contentType: z.enum(GEO_CONTENT_TYPES as unknown as [string, ...string[]]),
  contentId: z.string().min(1),
});

const ScoringInputSchema = ContentRef.extend({
  url: z.string().optional(),
  title: z.string().optional().nullable(),
  body: z.string().optional().nullable(),
  html: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  updatedAt: z.union([z.string(), z.date()]).optional().nullable(),
  publishedAt: z.union([z.string(), z.date()]).optional().nullable(),
  entityCount: z.number().optional(),
  questionCount: z.number().optional(),
  answeredQuestionCount: z.number().optional(),
  faqCount: z.number().optional(),
  sectionCount: z.number().optional(),
  citationCount: z.number().optional(),
  outboundLinks: z.number().optional(),
  inboundLinks: z.number().optional(),
  authorAuthority: z.number().optional(),
});

async function loadWeights(sb: any): Promise<ScoringWeights> {
  const { data } = await sb
    .from("geo_settings")
    .select("scoring_weights")
    .limit(1)
    .maybeSingle();
  return { ...DEFAULT_SCORING_WEIGHTS, ...(data?.scoring_weights ?? {}) };
}

// ─────────────────────────────────────────────────────────────────────────────
// Scoring
// ─────────────────────────────────────────────────────────────────────────────

export const scorePage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ScoringInputSchema.parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context as Ctx);
    const weights = await loadWeights((context as Ctx).supabase);
    const breakdown = computeScore(data as ScoringInput, weights);
    const row = {
      content_type: data.contentType,
      content_id: data.contentId,
      url: data.url ?? null,
      ai_readiness: breakdown.ai_readiness,
      semantic_coverage: breakdown.semantic_coverage,
      entity_coverage: breakdown.entity_coverage,
      question_coverage: breakdown.question_coverage,
      answer_coverage: breakdown.answer_coverage,
      evidence_coverage: breakdown.evidence_coverage,
      citation_readiness: breakdown.citation_readiness,
      freshness: breakdown.freshness,
      authority: breakdown.authority,
      trust: breakdown.trust,
      breakdown: breakdown.details,
      computed_at: new Date().toISOString(),
    };
    const { error } = await (context as Ctx).supabase
      .from("geo_page_scores")
      .upsert(row, { onConflict: "content_type,content_id" });
    if (error) throw error;
    return breakdown;
  });

// ─────────────────────────────────────────────────────────────────────────────
// Entity extraction + entity map
// ─────────────────────────────────────────────────────────────────────────────

export const extractPageEntities = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    ContentRef.extend({
      title: z.string().optional(),
      body: z.string().min(20),
      maxEntities: z.number().min(1).max(80).optional(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as Ctx);
    const sb = (context as Ctx).supabase;
    const extracted = await extractEntities({
      title: data.title,
      body: data.body,
      maxEntities: data.maxEntities,
    });
    const entityIds: Array<{ id: string; salience: number }> = [];
    for (const e of extracted) {
      const slug = slugifyEntity(e.name);
      const { data: upserted, error } = await sb
        .from("geo_entities")
        .upsert(
          {
            name: e.name,
            slug,
            entity_type: e.type,
            aliases: e.aliases,
            description: e.description ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "entity_type,slug" },
        )
        .select("id")
        .maybeSingle();
      if (error || !upserted) continue;
      await sb.from("geo_entity_mentions").upsert(
        {
          entity_id: upserted.id,
          content_type: data.contentType,
          content_id: data.contentId,
          salience: e.salience,
          confidence: e.confidence,
          extracted_by: "geo.ai",
        },
        { onConflict: "entity_id,content_type,content_id" },
      );
      entityIds.push({ id: upserted.id, salience: e.salience });
    }
    if (entityIds.length) {
      await upsertRelationships(
        sb,
        entityIds.map((e) => ({
          from_type: "content",
          from_id: `${data.contentType}:${data.contentId}`,
          to_type: "entity",
          to_id: e.id,
          relation: "mentions",
          weight: e.salience,
        })),
      );
    }
    return { count: extracted.length, entities: extracted };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Question intelligence
// ─────────────────────────────────────────────────────────────────────────────

export const generatePageQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    ContentRef.extend({
      title: z.string().optional(),
      body: z.string().min(20),
      max: z.number().min(1).max(30).optional(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as Ctx);
    const sb = (context as Ctx).supabase;
    const questions = await generateQuestions({
      title: data.title,
      body: data.body,
      max: data.max,
    });
    if (questions.length) {
      const rows = questions.map((q) => ({
        content_type: data.contentType,
        content_id: data.contentId,
        question: q.question,
        question_type: q.type ?? "what",
        intent: q.intent ?? null,
        short_answer: q.short_answer,
        standard_answer: q.standard_answer,
        detailed_answer: q.detailed_answer ?? null,
        status: "pending",
        ai_prompt_version: GEO_PROMPT_VERSION,
      }));
      const { error } = await sb.from("geo_questions").insert(rows);
      if (error) throw error;
    }
    return { count: questions.length, questions };
  });

// ─────────────────────────────────────────────────────────────────────────────
// AI page enrichment recommendations
// ─────────────────────────────────────────────────────────────────────────────

export const generatePageRecommendations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    ContentRef.extend({
      title: z.string().optional(),
      body: z.string().min(20),
      gaps: z.array(z.string()).optional(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as Ctx);
    const sb = (context as Ctx).supabase;
    const recs = await generateRecommendations({
      title: data.title,
      body: data.body,
      gaps: data.gaps,
    });
    if (recs.length) {
      const rows = recs.map((r) => ({
        content_type: data.contentType,
        content_id: data.contentId,
        category: r.category,
        kind: r.kind,
        title: r.title,
        body: r.body,
        payload: r.payload ?? {},
        priority: r.priority,
        impact: r.impact,
        status: "pending",
        ai_prompt_version: GEO_PROMPT_VERSION,
      }));
      const { error } = await sb.from("geo_recommendations").insert(rows);
      if (error) throw error;
    }
    return { count: recs.length, recommendations: recs };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Schema recommendations
// ─────────────────────────────────────────────────────────────────────────────

export const generatePageSchemas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    ContentRef.extend({
      title: z.string().optional(),
      body: z.string().min(20),
      url: z.string().optional(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as Ctx);
    const sb = (context as Ctx).supabase;
    const suggestions = await recommendSchemas({
      contentType: data.contentType,
      title: data.title,
      body: data.body,
      url: data.url,
    });
    if (suggestions.length) {
      const rows = suggestions.map((s) => ({
        content_type: data.contentType,
        content_id: data.contentId,
        schema_type: s.schema_type,
        json_ld: s.json_ld,
        status: "pending",
        ai_prompt_version: GEO_PROMPT_VERSION,
      }));
      await sb.from("geo_schema_suggestions").insert(rows);
    }
    return { count: suggestions.length, suggestions };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Freshness signals
// ─────────────────────────────────────────────────────────────────────────────

export const scanPageFreshness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    ContentRef.extend({ body: z.string().min(20) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as Ctx);
    const sb = (context as Ctx).supabase;
    const signals = await detectSignals(data.body);
    if (signals.length) {
      await sb.from("geo_freshness_signals").insert(
        signals.map((s) => ({
          content_type: data.contentType,
          content_id: data.contentId,
          signal: s.signal,
          severity: s.severity,
          detail: s.detail,
        })),
      );
    }
    return { count: signals.length, signals };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Full analysis pipeline
// ─────────────────────────────────────────────────────────────────────────────

export const analyzePage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    ContentRef.extend({
      title: z.string().optional(),
      body: z.string().min(20),
      html: z.string().optional(),
      url: z.string().optional(),
      updatedAt: z.string().optional(),
      publishedAt: z.string().optional(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as Ctx);
    const sb = (context as Ctx).supabase;
    const weights = await loadWeights(sb);

    const [entities, questions, recommendations, schemas, signals] =
      await Promise.all([
        extractEntities({ title: data.title, body: data.body }),
        generateQuestions({ title: data.title, body: data.body }),
        generateRecommendations({ title: data.title, body: data.body }),
        recommendSchemas({
          contentType: data.contentType,
          title: data.title,
          body: data.body,
          url: data.url,
        }),
        detectSignals(data.body),
      ]);

    const breakdown = computeScore(
      {
        contentType: data.contentType,
        contentId: data.contentId,
        title: data.title ?? null,
        body: data.body,
        html: data.html ?? null,
        updatedAt: data.updatedAt,
        publishedAt: data.publishedAt,
        entityCount: entities.length,
        questionCount: questions.length,
        answeredQuestionCount: questions.filter((q) => q.short_answer).length,
        faqCount: questions.length,
        sectionCount: (data.body.match(/\n#{1,3}\s/g) ?? []).length,
        citationCount: (data.body.match(/https?:\/\//g) ?? []).length,
      },
      weights,
    );

    await sb.from("geo_page_scores").upsert(
      {
        content_type: data.contentType,
        content_id: data.contentId,
        url: data.url ?? null,
        ai_readiness: breakdown.ai_readiness,
        semantic_coverage: breakdown.semantic_coverage,
        entity_coverage: breakdown.entity_coverage,
        question_coverage: breakdown.question_coverage,
        answer_coverage: breakdown.answer_coverage,
        evidence_coverage: breakdown.evidence_coverage,
        citation_readiness: breakdown.citation_readiness,
        freshness: breakdown.freshness,
        authority: breakdown.authority,
        trust: breakdown.trust,
        breakdown: breakdown.details,
        computed_at: new Date().toISOString(),
      },
      { onConflict: "content_type,content_id" },
    );

    return {
      breakdown,
      counts: {
        entities: entities.length,
        questions: questions.length,
        recommendations: recommendations.length,
        schemas: schemas.length,
        signals: signals.length,
      },
    };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Editor Assistant — Content Hub gap analysis
// ─────────────────────────────────────────────────────────────────────────────

export const editorGapAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    ContentRef.extend({
      title: z.string().optional(),
      body: z.string().min(20),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as Ctx);
    const body = data.body;
    const gaps: string[] = [];
    if (!/faq/i.test(body)) gaps.push("faqs");
    if (!/(tl;dr|summary)/i.test(body)) gaps.push("tldr");
    if (!/definition|what is/i.test(body)) gaps.push("definitions");
    if (!/(compare|vs\.?)/i.test(body)) gaps.push("comparison_table");
    if (!/(step[- ]by[- ]step|how to)/i.test(body)) gaps.push("step_by_step");
    if (!/(salary|payscale|compensation)/i.test(body)) gaps.push("salary");
    if (!/(roadmap|learning path)/i.test(body)) gaps.push("roadmap");
    if (!/(prerequisite|requirement)/i.test(body)) gaps.push("prerequisites");
    if (!/(mistake|pitfall)/i.test(body)) gaps.push("common_mistakes");
    return { gaps, allCategories: GEO_RECOMMENDATION_CATEGORIES };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Review workflow
// ─────────────────────────────────────────────────────────────────────────────

export const reviewRecommendation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        action: z.enum(["approve", "reject"]),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as Ctx);
    const sb = (context as Ctx).supabase;
    const { error } = await sb
      .from("geo_recommendations")
      .update({
        status: data.action === "approve" ? "approved" : "rejected",
        reviewed_by: (context as Ctx).userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const reviewQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        action: z.enum(["approve", "reject"]),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as Ctx);
    const sb = (context as Ctx).supabase;
    await sb
      .from("geo_questions")
      .update({
        status: data.action === "approve" ? "approved" : "rejected",
        reviewed_by: (context as Ctx).userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    return { ok: true };
  });

export const reviewSchema = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        action: z.enum(["approve", "reject"]),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as Ctx);
    const sb = (context as Ctx).supabase;
    await sb
      .from("geo_schema_suggestions")
      .update({
        status: data.action === "approve" ? "approved" : "rejected",
        reviewed_by: (context as Ctx).userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    return { ok: true };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard + analytics
// ─────────────────────────────────────────────────────────────────────────────

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context as Ctx);
    const sb = (context as Ctx).supabase;
    const [entities, relationships, recs, questions, scores, trends] =
      await Promise.all([
        sb.from("geo_entities").select("*", { count: "exact", head: true }),
        sb.from("geo_relationships").select("*", { count: "exact", head: true }),
        sb.from("geo_recommendations").select("status", { count: "exact" }),
        sb.from("geo_questions").select("status", { count: "exact" }),
        sb
          .from("geo_page_scores")
          .select(
            "ai_readiness, entity_coverage, question_coverage, freshness, citation_readiness, authority",
          )
          .limit(2000),
        sb
          .from("geo_analytics_daily")
          .select("*")
          .order("day", { ascending: false })
          .limit(60),
      ]);
    const rows = scores.data ?? [];
    const avg = (k: keyof (typeof rows)[number]) =>
      rows.length
        ? rows.reduce((s, r) => s + (Number(r[k]) || 0), 0) / rows.length
        : 0;
    return {
      totals: {
        entities: entities.count ?? 0,
        relationships: relationships.count ?? 0,
        recommendations_pending:
          (recs.data ?? []).filter((r: any) => r.status === "pending").length,
        recommendations_total: recs.count ?? 0,
        questions_pending:
          (questions.data ?? []).filter((r: any) => r.status === "pending").length,
        pages_scored: rows.length,
      },
      averages: {
        ai_readiness: avg("ai_readiness"),
        entity_coverage: avg("entity_coverage"),
        question_coverage: avg("question_coverage"),
        freshness: avg("freshness"),
        citation_readiness: avg("citation_readiness"),
        authority: avg("authority"),
      },
      trends: trends.data ?? [],
    };
  });

export const listRecommendations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        contentType: z.string().optional(),
        contentId: z.string().optional(),
        status: z.enum(["pending", "approved", "rejected"]).optional(),
        limit: z.number().min(1).max(200).optional(),
      })
      .parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as Ctx);
    let q = (context as Ctx).supabase
      .from("geo_recommendations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 50);
    if (data.contentType) q = q.eq("content_type", data.contentType);
    if (data.contentId) q = q.eq("content_id", data.contentId);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

// ─────────────────────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────────────────────

export const getSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context as Ctx);
    const { data } = await (context as Ctx).supabase
      .from("geo_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    return data;
  });

export const updateSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        scoring_weights: z.record(z.number()).optional(),
        entity_rules: z.record(z.any()).optional(),
        question_rules: z.record(z.any()).optional(),
        schema_recommendations: z.record(z.any()).optional(),
        quality_thresholds: z.record(z.number()).optional(),
        ai_prompt_version: z.string().optional(),
        require_approval: z.boolean().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as Ctx);
    const sb = (context as Ctx).supabase;
    const { data: existing } = await sb
      .from("geo_settings")
      .select("id")
      .limit(1)
      .maybeSingle();
    const patch = {
      ...data,
      updated_at: new Date().toISOString(),
      updated_by: (context as Ctx).userId,
    };
    if (existing?.id) {
      await sb.from("geo_settings").update(patch).eq("id", existing.id);
    } else {
      await sb.from("geo_settings").insert(patch);
    }
    return { ok: true };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Analytics snapshot
// ─────────────────────────────────────────────────────────────────────────────

export const snapshotAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context as Ctx);
    const sb = (context as Ctx).supabase;
    const [entities, rels, recs, scores] = await Promise.all([
      sb.from("geo_entities").select("*", { count: "exact", head: true }),
      sb.from("geo_relationships").select("*", { count: "exact", head: true }),
      sb.from("geo_recommendations").select("status"),
      sb
        .from("geo_page_scores")
        .select(
          "ai_readiness, entity_coverage, question_coverage, freshness, citation_readiness",
        )
        .limit(5000),
    ]);
    const rows = scores.data ?? [];
    const avg = (k: string) =>
      rows.length
        ? rows.reduce((s, r: any) => s + (Number(r[k]) || 0), 0) / rows.length
        : 0;
    const day = new Date().toISOString().slice(0, 10);
    const recsList = recs.data ?? [];
    await sb.from("geo_analytics_daily").upsert(
      {
        day,
        avg_ai_readiness: avg("ai_readiness"),
        avg_entity_coverage: avg("entity_coverage"),
        avg_question_coverage: avg("question_coverage"),
        avg_freshness: avg("freshness"),
        avg_citation_readiness: avg("citation_readiness"),
        entity_count: entities.count ?? 0,
        relationship_count: rels.count ?? 0,
        recommendation_pending: recsList.filter(
          (r: any) => r.status === "pending",
        ).length,
        recommendation_accepted: recsList.filter(
          (r: any) => r.status === "approved",
        ).length,
      },
      { onConflict: "day" },
    );
    return { ok: true, day };
  });
