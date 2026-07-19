// Enterprise AI Content Hub — server functions.
// Backend-only additive module. All AI text generation routes through the
// centralized AI Router (aiChat) which uses OpenAI natively. No Lovable AI.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { aiChat } from "@/lib/ai/router.server";
import { tryParseAiJson } from "@/lib/ai-json";
import { z } from "zod";
import {
  AI_ASSIST_ACTIONS,
  CONTENT_HUB_STATUSES,
  CONTENT_HUB_TYPES,
  RELATION_TARGETS,
  SUPPORTED_LANGUAGES,
  type AIAssistAction,
} from "./types";
import { buildPrompt, systemFor } from "./prompts.server";
import { rebuildRelationsForContent } from "./relationship-engine.server";

type Ctx = { supabase: any; userId: string };

async function ensureContentRole(ctx: Ctx) {
  const roles = ["admin", "super_admin", "editor"] as const;
  for (const role of roles) {
    const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: role });
    if (data === true) return true;
  }
  // Authors may still call some functions — throw only for restricted ones.
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Content Assistant
// ─────────────────────────────────────────────────────────────────────────────

export const runContentAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      action: z.enum(AI_ASSIST_ACTIONS),
      body: z.string().min(1).max(60_000),
      content_id: z.string().uuid().optional(),
      title: z.string().optional(),
      focus_keyword: z.string().optional(),
      secondary_keywords: z.array(z.string()).optional(),
      audience: z.string().optional(),
      temperature: z.number().min(0).max(1).optional(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as Ctx;
    const wantsJson: AIAssistAction[] = [
      "generate_faq",
      "generate_cta",
      "generate_internal_links",
      "generate_external_refs",
      "generate_meta",
      "generate_schema",
      "generate_image_prompt",
      "generate_video_topics",
    ];
    const jobInsert = await ctx.supabase.from("content_ai_assist_jobs").insert({
      content_id: data.content_id ?? null,
      requested_by: ctx.userId,
      action: data.action,
      input: { title: data.title, focus_keyword: data.focus_keyword, audience: data.audience, body_chars: data.body.length },
      status: "running",
    }).select("id").maybeSingle();
    const jobId = (jobInsert.data as { id?: string } | null)?.id;

    try {
      const prompt = buildPrompt(data.action, data.body, {
        title: data.title,
        focus_keyword: data.focus_keyword,
        secondary_keywords: data.secondary_keywords,
        audience: data.audience,
      });
      const useJson = wantsJson.includes(data.action);
      const result = await aiChat({
        system: systemFor(data.action),
        messages: [{ role: "user", content: prompt }],
        responseFormat: useJson ? "json" : "text",
        temperature: data.temperature ?? 0.6,
        maxTokens: 2000,
      });

      let output: Record<string, unknown>;
      if (useJson) {
        output = typeof result === "string" ? safeParseAiJson(result) as Record<string, unknown> : result;
      } else {
        output = { text: typeof result === "string" ? result : "" };
      }

      if (jobId) {
        await ctx.supabase.from("content_ai_assist_jobs").update({
          status: "succeeded",
          output,
          completed_at: new Date().toISOString(),
        }).eq("id", jobId);
      }
      return { ok: true as const, job_id: jobId, action: data.action, output };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (jobId) {
        await ctx.supabase.from("content_ai_assist_jobs").update({
          status: "failed",
          error: msg,
          completed_at: new Date().toISOString(),
        }).eq("id", jobId);
      }
      return { ok: false as const, error: msg, job_id: jobId };
    }
  });

// ─────────────────────────────────────────────────────────────────────────────
// Full-Text + Metadata Search
// ─────────────────────────────────────────────────────────────────────────────

export const searchContentHub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      q: z.string().optional(),
      type: z.enum(CONTENT_HUB_TYPES).optional(),
      status: z.enum(CONTENT_HUB_STATUSES).optional(),
      language: z.enum(SUPPORTED_LANGUAGES).optional(),
      category_id: z.string().uuid().optional(),
      tag: z.string().optional(),
      author_id: z.string().uuid().optional(),
      limit: z.number().int().min(1).max(100).default(24),
      offset: z.number().int().min(0).default(0),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as Ctx;
    let q = ctx.supabase
      .from("content_items")
      .select(
        "id, type, status, language, title, slug, summary, category_id, subcategory, tag_slugs, author_id, reviewer_id, difficulty, target_audience, reading_time_min, published_at, updated_at, featured_image, seo_score",
        { count: "exact" },
      )
      .order("updated_at", { ascending: false })
      .range(data.offset, data.offset + data.limit - 1);
    if (data.type) q = q.eq("type", data.type);
    if (data.status) q = q.eq("status", data.status);
    if (data.language) q = q.eq("language", data.language);
    if (data.category_id) q = q.eq("category_id", data.category_id);
    if (data.tag) q = q.contains("tag_slugs", [data.tag]);
    if (data.author_id) q = q.eq("author_id", data.author_id);
    if (data.q && data.q.trim()) {
      const term = data.q.trim().replace(/[^\w\s]/g, " ");
      q = q.textSearch("search_tsv", term.split(/\s+/).filter(Boolean).join(" & "), { config: "simple" });
    }
    const { data: rows, count, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], count: count ?? 0 };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Content Locking
// ─────────────────────────────────────────────────────────────────────────────

export const acquireContentLock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ content_id: z.string().uuid(), minutes: z.number().int().min(1).max(60).default(15) }).parse(i))
  .handler(async ({ data, context }) => {
    const ctx = context as Ctx;
    const expires = new Date(Date.now() + data.minutes * 60_000).toISOString();
    // Clean up expired lock
    await ctx.supabase.from("content_locks").delete().eq("content_id", data.content_id).lt("expires_at", new Date().toISOString());
    const { data: existing } = await ctx.supabase
      .from("content_locks")
      .select("*")
      .eq("content_id", data.content_id)
      .maybeSingle();
    if (existing && (existing as any).user_id !== ctx.userId) {
      return { ok: false as const, locked_by: (existing as any).user_id, expires_at: (existing as any).expires_at };
    }
    if (existing) {
      await ctx.supabase.from("content_locks").update({ expires_at: expires }).eq("content_id", data.content_id);
    } else {
      await ctx.supabase.from("content_locks").insert({ content_id: data.content_id, user_id: ctx.userId, expires_at: expires });
    }
    return { ok: true as const, expires_at: expires };
  });

export const releaseContentLock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ content_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const ctx = context as Ctx;
    await ctx.supabase.from("content_locks").delete().eq("content_id", data.content_id).eq("user_id", ctx.userId);
    return { ok: true };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Editorial Calendar
// ─────────────────────────────────────────────────────────────────────────────

const CalendarInput = z.object({
  id: z.string().uuid().optional(),
  content_id: z.string().uuid().nullable().optional(),
  kind: z.enum(["publish", "review", "refresh", "expiry", "editorial"]),
  title: z.string().optional(),
  notes: z.string().optional(),
  scheduled_for: z.string(),
  recurrence: z.enum(["once", "weekly", "monthly", "quarterly", "yearly"]).default("once"),
  assigned_to: z.string().uuid().nullable().optional(),
  status: z.enum(["pending", "done", "skipped"]).default("pending"),
  metadata: z.record(z.string(), z.any()).default({}),
});

export const upsertCalendarEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CalendarInput.parse(i))
  .handler(async ({ data, context }) => {
    const ctx = context as Ctx;
    if (data.id) {
      const { error } = await ctx.supabase.from("content_schedule").update({ ...data, id: undefined }).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }
    const { data: row, error } = await ctx.supabase.from("content_schedule")
      .insert({ ...data, created_by: ctx.userId })
      .select("id").maybeSingle();
    if (error) throw new Error(error.message);
    return { ok: true, id: (row as any)?.id };
  });

export const listCalendar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      from: z.string().optional(),
      to: z.string().optional(),
      kind: z.enum(["publish", "review", "refresh", "expiry", "editorial"]).optional(),
      assigned_to: z.string().uuid().optional(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as Ctx;
    let q = ctx.supabase.from("content_schedule").select("*").order("scheduled_for", { ascending: true }).limit(500);
    if (data.from) q = q.gte("scheduled_for", data.from);
    if (data.to) q = q.lte("scheduled_for", data.to);
    if (data.kind) q = q.eq("kind", data.kind);
    if (data.assigned_to) q = q.eq("assigned_to", data.assigned_to);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [] };
  });

export const deleteCalendarEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const ctx = context as Ctx;
    const { error } = await ctx.supabase.from("content_schedule").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Content Relations
// ─────────────────────────────────────────────────────────────────────────────

export const rebuildContentRelations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ content_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const ctx = context as Ctx;
    await ensureContentRole(ctx);
    return await rebuildRelationsForContent(ctx.supabase, data.content_id);
  });

export const addContentRelation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      source_id: z.string().uuid(),
      target_type: z.enum(RELATION_TARGETS),
      target_id: z.string().uuid().optional(),
      target_slug: z.string().optional(),
      relation: z.enum(["related", "prerequisite", "next", "referenced_in"]).default("related"),
      weight: z.number().min(0).max(10).default(1),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as Ctx;
    const { error } = await ctx.supabase.from("content_relations").insert({ ...data, auto_generated: false });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listContentRelations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ source_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const ctx = context as Ctx;
    const { data: rows, error } = await ctx.supabase.from("content_relations")
      .select("*").eq("source_id", data.source_id).order("weight", { ascending: false });
    if (error) throw new Error(error.message);
    return { rows: rows ?? [] };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Multi-Language Architecture (no auto-translate)
// ─────────────────────────────────────────────────────────────────────────────

export const registerTranslation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      content_id: z.string().uuid(),
      locale_group_id: z.string().uuid().optional(),
      language: z.enum(SUPPORTED_LANGUAGES),
      status: z.enum(["draft", "in_review", "approved", "published"]).default("draft"),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as Ctx;
    let group = data.locale_group_id;
    if (!group) {
      // Try to inherit from source content
      const { data: item } = await ctx.supabase.from("content_items").select("locale_group_id").eq("id", data.content_id).maybeSingle();
      group = (item as any)?.locale_group_id;
    }
    if (!group) {
      group = crypto.randomUUID();
      await ctx.supabase.from("content_items").update({ locale_group_id: group }).eq("id", data.content_id);
    }
    const { error } = await ctx.supabase.from("content_translations").upsert({
      content_id: data.content_id,
      locale_group_id: group,
      language: data.language,
      status: data.status,
    }, { onConflict: "locale_group_id,language" });
    if (error) throw new Error(error.message);
    await ctx.supabase.from("content_items").update({ language: data.language, locale_group_id: group }).eq("id", data.content_id);
    return { ok: true, locale_group_id: group };
  });

export const listTranslations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ locale_group_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const ctx = context as Ctx;
    const { data: rows, error } = await ctx.supabase.from("content_translations")
      .select("*, content_items!inner(id, title, slug, status, language)")
      .eq("locale_group_id", data.locale_group_id);
    if (error) throw new Error(error.message);
    return { rows: rows ?? [] };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Workflow transitions (status changes)
// ─────────────────────────────────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["in_review", "archived"],
  in_review: ["approved", "rejected", "draft"],
  approved: ["scheduled", "published", "draft"],
  scheduled: ["published", "draft", "archived"],
  published: ["archived", "draft"],
  rejected: ["draft", "archived"],
  archived: ["draft"],
};

export const transitionContentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      content_id: z.string().uuid(),
      to: z.enum(CONTENT_HUB_STATUSES),
      scheduled_for: z.string().optional(),
      rejection_reason: z.string().optional(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as Ctx;
    const { data: item } = await ctx.supabase.from("content_items").select("status, author_id, reviewer_id").eq("id", data.content_id).maybeSingle();
    if (!item) throw new Error("Content not found");
    const current = (item as any).status as string;
    const allowed = VALID_TRANSITIONS[current] ?? [];
    if (!allowed.includes(data.to)) {
      throw new Error(`Illegal transition ${current} → ${data.to}`);
    }
    const patch: Record<string, unknown> = { status: data.to, last_edited_by: ctx.userId };
    if (data.to === "published") patch.published_at = new Date().toISOString();
    if (data.to === "archived") patch.archived_at = new Date().toISOString();
    if (data.to === "scheduled" && data.scheduled_for) patch.scheduled_for = data.scheduled_for;
    if (data.to === "rejected") patch.rejection_reason = data.rejection_reason ?? null;
    const { error } = await ctx.supabase.from("content_items").update(patch).eq("id", data.content_id);
    if (error) throw new Error(error.message);
    return { ok: true, status: data.to };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Analytics event ingest (view / scroll / share / conversion)
// ─────────────────────────────────────────────────────────────────────────────

export const recordContentEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      content_id: z.string().uuid(),
      event: z.enum(["view", "scroll_25", "scroll_50", "scroll_75", "scroll_100", "share", "download", "cta_click", "course_click", "lead_submit"]),
      duration_ms: z.number().int().min(0).optional(),
      metadata: z.record(z.string(), z.any()).optional(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as Ctx;
    await ctx.supabase.from("content_analytics_events").insert({
      content_id: data.content_id,
      event: data.event,
      duration_ms: data.duration_ms ?? null,
      metadata: data.metadata ?? {},
      user_id: ctx.userId,
    });
    if (data.event === "view") {
      await ctx.supabase.rpc("increment_content_view", { _content_id: data.content_id }).then(() => null, () => null);
    }
    return { ok: true };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Author dashboard aggregate
// ─────────────────────────────────────────────────────────────────────────────

export const getAuthorDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ author_id: z.string().uuid().optional() }).parse(i))
  .handler(async ({ data, context }) => {
    const ctx = context as Ctx;
    const authorId = data.author_id ?? ctx.userId;
    const base = ctx.supabase.from("content_items").select("id, title, slug, type, status, view_count, seo_score, published_at, updated_at").eq("author_id", authorId);

    const [written, draftsRes, reviewRes, scheduledRes, publishedRes, top, aiUsage] = await Promise.all([
      base.order("updated_at", { ascending: false }).limit(50),
      ctx.supabase.from("content_items").select("id", { count: "exact", head: true }).eq("author_id", authorId).eq("status", "draft"),
      ctx.supabase.from("content_items").select("id", { count: "exact", head: true }).eq("author_id", authorId).eq("status", "in_review"),
      ctx.supabase.from("content_items").select("id", { count: "exact", head: true }).eq("author_id", authorId).eq("status", "scheduled"),
      ctx.supabase.from("content_items").select("id", { count: "exact", head: true }).eq("author_id", authorId).eq("status", "published"),
      ctx.supabase.from("content_items")
        .select("id, title, slug, view_count, seo_score, published_at")
        .eq("author_id", authorId).eq("status", "published")
        .order("view_count", { ascending: false }).limit(10),
      ctx.supabase.from("content_ai_assist_jobs").select("id", { count: "exact", head: true }).eq("requested_by", authorId),
    ]);

    return {
      author_id: authorId,
      recent: written.data ?? [],
      counts: {
        draft: draftsRes.count ?? 0,
        in_review: reviewRes.count ?? 0,
        scheduled: scheduledRes.count ?? 0,
        published: publishedRes.count ?? 0,
      },
      top: top.data ?? [],
      ai_assist_jobs: aiUsage.count ?? 0,
    };
  });
