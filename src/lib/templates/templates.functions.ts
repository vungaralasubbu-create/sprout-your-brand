/**
 * Template Marketplace server functions.
 * Reuses createMarketingProject for generation — no duplicate orchestration.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { createMarketingProject } from "@/lib/marketing-os/projects.functions";

// -------- Public (no auth) --------
export const listTemplates = createServerFn({ method: "GET" })
  .inputValidator((v) =>
    z
      .object({
        q: z.string().max(200).optional(),
        industry: z.string().max(64).optional(),
        goal: z.string().max(64).optional(),
        channel: z.string().max(64).optional(),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        sort: z.enum(["popular", "newest", "highest_rated", "most_used", "trending"]).default("popular"),
        limit: z.number().int().min(1).max(60).default(24),
        cursor: z.number().int().min(0).default(0),
      })
      .parse(v ?? {}),
  )
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const c = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    let q = c
      .from("tpl_templates")
      .select("id,slug,title,tagline,cover_image_url,industry,goals,channels,ai_agents,difficulty,estimated_time_minutes,estimated_credits,included_assets,tags,rating_avg,rating_count,downloads_count,usage_count,is_featured,is_trending,is_editors_choice,is_agency_pick,is_enterprise_ready,is_verified,author_display_name,created_at")
      .eq("status", "approved")
      .eq("visibility", "public");

    if (data.q) q = q.ilike("title", `%${data.q}%`);
    if (data.industry) q = q.contains("industry", [data.industry]);
    if (data.goal) q = q.contains("goals", [data.goal]);
    if (data.channel) q = q.contains("channels", [data.channel]);
    if (data.difficulty) q = q.eq("difficulty", data.difficulty);

    const order: Record<string, [string, boolean]> = {
      popular: ["downloads_count", false],
      newest: ["created_at", false],
      highest_rated: ["rating_avg", false],
      most_used: ["usage_count", false],
      trending: ["usage_count", false],
    };
    const [col, asc] = order[data.sort];
    q = q.order(col, { ascending: asc }).range(data.cursor, data.cursor + data.limit - 1);

    const { data: rows } = await q;
    return { templates: rows ?? [] };
  });

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const c = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const { data } = await c.from("tpl_categories").select("*").eq("is_active", true).order("sort_order");
  return { categories: data ?? [] };
});

export const getTemplate = createServerFn({ method: "GET" })
  .inputValidator((v) => z.object({ slug: z.string().min(1).max(160) }).parse(v))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const c = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { data: t } = await c.from("tpl_templates").select("*").eq("slug", data.slug).maybeSingle();
    if (!t) return { template: null, reviews: [] };
    const { data: rv } = await c
      .from("tpl_reviews")
      .select("id,rating,title,body,is_verified,helpful_votes,created_at,user_id")
      .eq("template_id", (t as any).id)
      .order("created_at", { ascending: false })
      .limit(20);
    return { template: t, reviews: rv ?? [] };
  });

// -------- Authenticated --------
export const listMyTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [created, favorited, used] = await Promise.all([
      supabase.from("tpl_templates").select("*").eq("author_id", userId).order("updated_at", { ascending: false }),
      supabase
        .from("tpl_favorites")
        .select("template_id,created_at,tpl_templates(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("tpl_usage")
        .select("template_id,project_id,created_at,tpl_templates(id,slug,title,cover_image_url)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    return { created: created.data ?? [], favorited: favorited.data ?? [], used: used.data ?? [] };
  });

export const toggleFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ templateId: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("tpl_favorites")
      .select("user_id")
      .eq("user_id", userId)
      .eq("template_id", data.templateId)
      .maybeSingle();
    if (existing) {
      await supabase.from("tpl_favorites").delete().eq("user_id", userId).eq("template_id", data.templateId);
      return { favorited: false };
    }
    await supabase.from("tpl_favorites").insert({ user_id: userId, template_id: data.templateId });
    return { favorited: true };
  });

export const submitReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        templateId: z.string().uuid(),
        rating: z.number().int().min(1).max(5),
        title: z.string().trim().max(120).optional(),
        body: z.string().trim().max(2000).optional(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Verified if user has actually used the template
    const { count } = await supabase
      .from("tpl_usage")
      .select("id", { count: "exact", head: true })
      .eq("template_id", data.templateId)
      .eq("user_id", userId);
    const isVerified = (count ?? 0) > 0;
    const { error } = await supabase.from("tpl_reviews").upsert(
      {
        template_id: data.templateId,
        user_id: userId,
        rating: data.rating,
        title: data.title ?? null,
        body: data.body ?? null,
        is_verified: isVerified,
      },
      { onConflict: "template_id,user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Use template: composes a prompt from variables and hands off to
 * createMarketingProject. No duplicate generation logic.
 */
export const useTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        templateId: z.string().uuid(),
        values: z.record(z.string(), z.any()).default({}),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: tpl } = await supabase.from("tpl_templates").select("*").eq("id", data.templateId).maybeSingle();
    if (!tpl) throw new Error("Template not found");

    // Interpolate {{variables}} across all prompts
    const values: Record<string, string> = {};
    Object.entries(data.values).forEach(([k, v]) => (values[k] = String(v ?? "")));
    const interpolate = (s: string) => s.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => values[k] ?? `[${k}]`);

    const p = (tpl as any).prompts ?? {};
    const sections: string[] = [];
    sections.push(`Template: ${(tpl as any).title}`);
    if ((tpl as any).tagline) sections.push((tpl as any).tagline);
    if (Object.keys(values).length) {
      sections.push("Business context:");
      Object.entries(values).forEach(([k, v]) => v && sections.push(`- ${k}: ${v}`));
    }
    (["strategy", "content", "image", "video", "email", "landing", "workflow", "analytics"] as const).forEach((key) => {
      if (p[key]) sections.push(`\n[${key.toUpperCase()}]\n${interpolate(p[key])}`);
    });
    const composedPrompt = sections.join("\n").slice(0, 1900);

    // Hand off to existing orchestrator
    const { project } = await createMarketingProject({ data: { prompt: composedPrompt } });

    // Log usage + increment counters (best-effort)
    await Promise.all([
      supabase.from("tpl_usage").insert({
        template_id: data.templateId,
        user_id: userId,
        project_id: (project as any).id,
        variables: data.values,
      }),
      supabase.from("tpl_downloads").insert({
        template_id: data.templateId,
        user_id: userId,
        action: "use",
        project_id: (project as any).id,
      }),
      supabase.rpc("tpl_increment_use" as any, { _id: data.templateId }).then(async () => {
        // fallback increment
        await supabase
          .from("tpl_templates")
          .update({ usage_count: (tpl as any).usage_count + 1, downloads_count: (tpl as any).downloads_count + 1 })
          .eq("id", data.templateId);
      }),
    ]);

    return { projectId: (project as any).id };
  });

/**
 * Create a template (author flow).
 */
export const upsertTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        id: z.string().uuid().optional(),
        slug: z.string().min(3).max(160).regex(/^[a-z0-9-]+$/),
        title: z.string().min(3).max(160),
        tagline: z.string().max(200).optional(),
        description: z.string().max(4000).optional(),
        cover_image_url: z.string().url().optional().nullable(),
        industry: z.array(z.string()).default([]),
        goals: z.array(z.string()).default([]),
        channels: z.array(z.string()).default([]),
        ai_agents: z.array(z.string()).default([]),
        included_assets: z.array(z.string()).default([]),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
        estimated_time_minutes: z.number().int().min(1).max(240).default(5),
        estimated_credits: z.number().int().min(0).max(10000).default(500),
        campaign_length_days: z.number().int().optional(),
        tags: z.array(z.string()).default([]),
        prompts: z.record(z.string(), z.string()).default({}),
        variables: z.array(z.any()).default([]),
        submit_for_review: z.boolean().default(false),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    const payload: any = {
      slug: data.slug,
      title: data.title,
      tagline: data.tagline ?? null,
      description: data.description ?? null,
      cover_image_url: data.cover_image_url ?? null,
      industry: data.industry,
      goals: data.goals,
      channels: data.channels,
      ai_agents: data.ai_agents,
      included_assets: data.included_assets,
      difficulty: data.difficulty,
      estimated_time_minutes: data.estimated_time_minutes,
      estimated_credits: data.estimated_credits,
      campaign_length_days: data.campaign_length_days ?? null,
      tags: data.tags,
      prompts: data.prompts,
      variables: data.variables,
      author_id: userId,
      author_display_name: (claims as any)?.user_metadata?.name ?? (claims as any)?.email ?? "Creator",
      status: data.submit_for_review ? "pending_review" : "draft",
      submitted_at: data.submit_for_review ? new Date().toISOString() : null,
    };
    if (data.id) {
      const { data: row, error } = await supabase
        .from("tpl_templates")
        .update(payload)
        .eq("id", data.id)
        .eq("author_id", userId)
        .select()
        .maybeSingle();
      if (error) throw new Error(error.message);
      return { template: row };
    }
    const { data: row, error } = await supabase.from("tpl_templates").insert(payload).select().maybeSingle();
    if (error) throw new Error(error.message);
    return { template: row };
  });
