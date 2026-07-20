// Marketing OS — Content Planner server functions.
// This module only PLANS content. It never generates images/videos or publishes.
// All AI calls route through the centralized AI Router (via ai-gateway.server).
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callLovableAiJson } from "@/lib/ai-gateway.server";
import { z } from "zod";

const PlanInputSchema = z.object({
  business_name: z.string().min(1),
  industry: z.string().optional().default(""),
  goals: z.array(z.string()).default([]),
  target_audience: z.array(z.string()).default([]),
  countries: z.array(z.string()).default([]),
  primary_language: z.string().default("English"),
  secondary_languages: z.array(z.string()).default([]),
  brand_tone: z.string().default(""),
  brand_personality: z.string().default(""),
  brand_keywords: z.array(z.string()).default([]),
  competitors: z.array(z.string()).default([]),
  products: z.array(z.string()).default([]),
  courses: z.array(z.string()).default([]),
  services: z.array(z.string()).default([]),
  cta_preference: z.string().default(""),
  platforms: z.array(z.string()).default([]),
  planning_period: z.enum(["1_week", "2_weeks", "1_month", "3_months", "6_months", "1_year"]).default("1_month"),
  content_types: z.array(z.string()).default([]),
  content_mix: z.record(z.string(), z.number()).default({}),
  posting_frequency: z.record(z.string(), z.record(z.string(), z.number())).default({}),
  campaigns: z.array(z.string()).default([]),
});

export type PlanInput = z.infer<typeof PlanInputSchema>;

const SYSTEM_PROMPT = `You are Glintr's Enterprise AI Content Strategist.
Generate a rigorous, publish-ready multi-platform CONTENT PLAN (planning only — no image or video generation, no publishing).
Return STRICT JSON matching the requested schema. No prose, no markdown, no code fences.
Every string must be specific, grounded in the provided inputs, and immediately usable by a marketing team.
Never duplicate identical copy across platforms — tailor angle, hook, and format to each channel's native strengths.`;

function schemaHint(): string {
  return `{
  "summary": string,
  "strategy": {
    "positioning": string,
    "value_proposition": string,
    "north_star_metric": string,
    "kpis": [{ "name": string, "target": string }]
  },
  "audience_segments": [{ "name": string, "persona": string, "pain_points": string[], "channels": string[] }],
  "platform_strategy": {
    "<platform>": {
      "role": string,
      "content_pillars": string[],
      "formats": string[],
      "tone": string,
      "cadence": string,
      "posting_times": string[],
      "hashtags": string[],
      "cta_style": string
    }
  },
  "content_calendar": [{
    "date": "YYYY-MM-DD",
    "week": number,
    "platform": string,
    "format": string,
    "content_type": string,
    "pillar": string,
    "title": string,
    "hook": string,
    "brief": string,
    "cta": string,
    "hashtags": string[],
    "campaign": string | null
  }],
  "campaign_plan": [{
    "name": string,
    "objective": string,
    "start_date": "YYYY-MM-DD",
    "end_date": "YYYY-MM-DD",
    "phases": [{ "phase": string, "days": string, "channels": string[], "themes": string[] }]
  }],
  "seo_plan": {
    "primary_keywords": [{ "keyword": string, "intent": string, "monthly_volume_estimate": string }],
    "topic_clusters": [{ "pillar": string, "supporting_articles": string[] }],
    "blog_calendar": [{ "week": number, "title": string, "target_keyword": string, "outline": string[] }],
    "internal_linking": [{ "from": string, "to": string, "anchor": string }]
  },
  "trend_plan": {
    "trending_topics": string[],
    "seasonal_topics": string[],
    "festivals": string[],
    "industry_events": string[],
    "hiring_season": string[],
    "admissions_season": string[]
  },
  "posting_schedule": [{ "platform": string, "times": string[], "days": string[] }],
  "content_mix_summary": { "<category>": number },
  "risks_and_notes": string[]
}`;
}

function periodDurationLabel(p: string): string {
  switch (p) {
    case "1_week": return "7 days";
    case "2_weeks": return "14 days";
    case "1_month": return "30 days";
    case "3_months": return "90 days";
    case "6_months": return "180 days";
    case "1_year": return "365 days";
    default: return "30 days";
  }
}

/** Generate a content plan via AI Router and persist it. Owner-scoped. */
export const generateMarketingPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => PlanInputSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const period = periodDurationLabel(data.planning_period);
    const platforms = data.platforms.length ? data.platforms : ["Instagram", "LinkedIn", "Blog"];

    const userPrompt = `Design a ${period} multi-platform content plan.

BUSINESS: ${data.business_name}
INDUSTRY: ${data.industry || "(unspecified)"}
GOALS: ${data.goals.join(", ") || "(none)"}
TARGET AUDIENCE: ${data.target_audience.join(", ") || "(none)"}
COUNTRIES: ${data.countries.join(", ") || "Global"}
PRIMARY LANGUAGE: ${data.primary_language}
SECONDARY LANGUAGES: ${data.secondary_languages.join(", ") || "(none)"}
BRAND TONE: ${data.brand_tone || "(unspecified)"}
BRAND PERSONALITY: ${data.brand_personality || "(unspecified)"}
BRAND KEYWORDS: ${data.brand_keywords.join(", ") || "(none)"}
COMPETITORS: ${data.competitors.join(", ") || "(none)"}
PRODUCTS: ${data.products.join(", ") || "(none)"}
COURSES: ${data.courses.join(", ") || "(none)"}
SERVICES: ${data.services.join(", ") || "(none)"}
CTA PREFERENCE: ${data.cta_preference || "(none)"}
PLATFORMS: ${platforms.join(", ")}
CONTENT TYPES: ${data.content_types.join(", ") || "(auto)"}
CONTENT MIX %: ${JSON.stringify(data.content_mix)}
POSTING FREQUENCY: ${JSON.stringify(data.posting_frequency)}
CAMPAIGNS TO PLAN: ${data.campaigns.join(", ") || "(auto)"}

Rules:
- Generate DIFFERENT strategy per platform. Never duplicate identical content across channels.
- Populate content_calendar with dated entries covering the full ${period}. For long periods (>=90 days) provide at least 2–3 representative posts per active week per platform (not every single day).
- Every date must be a realistic future ISO date starting today.
- Fill seo_plan.blog_calendar with weekly blog topics + target keywords.
- Include trend_plan hooks (seasonal, festivals, industry events, admissions season, hiring season, exam season).
- Only plan — no image or video URLs, no publishing steps.

Return JSON matching this schema exactly (no prose, no fences):
${schemaHint()}`;

    let plannerJson: Record<string, unknown> = {};
    try {
      plannerJson = await callLovableAiJson<Record<string, unknown>>({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.5,
      });
    } catch (err) {
      throw new Error(`AI plan generation failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    const insertRow = {
      owner_id: userId,
      business_name: data.business_name,
      industry: data.industry,
      goals: data.goals,
      target_audience: data.target_audience,
      countries: data.countries,
      primary_language: data.primary_language,
      secondary_languages: data.secondary_languages,
      brand_tone: data.brand_tone,
      brand_personality: data.brand_personality,
      brand_keywords: data.brand_keywords,
      competitors: data.competitors,
      products: data.products,
      courses: data.courses,
      services: data.services,
      cta_preference: data.cta_preference,
      platforms: data.platforms,
      planning_period: data.planning_period,
      content_types: data.content_types,
      content_mix: data.content_mix,
      posting_frequency: data.posting_frequency,
      campaigns: data.campaigns,
      planner_json: plannerJson as unknown as Record<string, unknown> as never,
      status: "active" as const,
    };

    const { data: inserted, error } = await supabase
      .from("marketing_plans")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(insertRow as any)
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    // snapshot v1
    await supabase.from("marketing_plan_versions").insert({
      plan_id: inserted.id,
      owner_id: userId,
      version: 1,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      snapshot: inserted as any,
      
      note: "Initial plan",
    });

    return { plan: inserted };
  });

export const listMyMarketingPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("marketing_plans")
      .select("id, business_name, industry, planning_period, platforms, goals, status, created_at, updated_at, version")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { plans: data ?? [] };
  });

export const getMarketingPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { data: plan, error } = await context.supabase
      .from("marketing_plans").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!plan) throw new Error("Plan not found");
    const { data: versions } = await context.supabase
      .from("marketing_plan_versions")
      .select("id, version, note, created_at")
      .eq("plan_id", data.id)
      .order("version", { ascending: false });
    return { plan, versions: versions ?? [] };
  });

export const duplicateMarketingPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { data: src, error } = await supabase.from("marketing_plans").select("*").eq("id", data.id).maybeSingle();
    if (error || !src) throw new Error(error?.message ?? "Plan not found");
    const { id: _id, created_at: _c, updated_at: _u, ...rest } = src as Record<string, unknown>;
    void _id; void _c; void _u;
    const { data: copy, error: e2 } = await supabase
      .from("marketing_plans")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({
        ...rest,
        owner_id: userId,
        parent_plan_id: src.id,
        version: 1,
        status: "draft",
        business_name: `${src.business_name} (copy)`,
      } as any)
      .select("id")
      .single();
    if (e2) throw new Error(e2.message);
    return { id: copy.id };
  });

export const archiveMarketingPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid(), archived: z.boolean().default(true) }).parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("marketing_plans")
      .update({ status: data.archived ? "archived" : "active" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMarketingPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("marketing_plans").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
