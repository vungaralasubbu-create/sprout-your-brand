/**
 * Enterprise Campaign Manager — server functions.
 *
 * Reuses:
 *  - mkt_brands ownership + mkt_is_staff RLS.
 *  - Central AI Router (aiChat) with Brand Kit context via buildBrandSystemPrompt.
 *  - Marketing OS shell + existing Publisher/Calendar/Analytics wiring.
 *
 * NEVER duplicates prompt logic or bypasses the AI Router.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { aiChat } from "@/lib/ai/router.server";
import { buildBrandSystemPrompt, withBrand } from "@/lib/marketing-os/brand-context.server";

// ---------- Types ----------
export type Campaign = {
  id: string;
  brand_id: string;
  name: string;
  campaign_type: string | null;
  objective: string | null;
  description: string | null;
  goals: string[];
  priority: string;
  owner_id: string | null;
  business_unit: string | null;
  timeline_stage: string;
  template_key: string | null;
  color: string | null;
  tags: string[];
  target_audience: any;
  target_platforms: string[];
  budget_cents: number | null;
  expected_revenue_cents: number | null;
  actual_revenue_cents: number | null;
  expected_leads: number | null;
  actual_leads: number | null;
  actual_admissions: number | null;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  ai_strategy: any;
  archived_at: string | null;
  approval_mode: string;
  meta: any;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CampaignTask = {
  id: string;
  campaign_id: string;
  title: string;
  description: string | null;
  owner_id: string | null;
  priority: string;
  status: string;
  progress: number;
  deadline: string | null;
  checklist: any;
  depends_on: string[];
  stage: string | null;
  created_at: string;
  updated_at: string;
};

export type CampaignAsset = {
  id: string;
  campaign_id: string;
  asset_type: string;
  title: string;
  description: string | null;
  url: string | null;
  thumbnail_url: string | null;
  ref_table: string | null;
  ref_id: string | null;
  platform: string | null;
  status: string;
  meta: any;
  created_at: string;
};

export type CampaignMetricRow = {
  captured_on: string;
  platform: string | null;
  reach: number;
  impressions: number;
  clicks: number;
  ctr: number | null;
  engagement: number;
  leads: number;
  admissions: number;
  revenue_cents: number;
  spend_cents: number;
  conversions: number;
  followers_delta: number;
};

// ---------- listCampaigns ----------
export const listCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("mkt_campaigns")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { campaigns: (data ?? []) as Campaign[] };
  });

// ---------- getCampaign ----------
export const getCampaign = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const [campaignRes, tasksRes, assetsRes, membersRes, metricsRes, reportsRes] = await Promise.all([
      context.supabase.from("mkt_campaigns").select("*").eq("id", data.id).maybeSingle(),
      context.supabase.from("mkt_campaign_tasks").select("*").eq("campaign_id", data.id).order("created_at", { ascending: true }),
      context.supabase.from("mkt_campaign_assets").select("*").eq("campaign_id", data.id).order("created_at", { ascending: false }),
      context.supabase.from("mkt_campaign_members").select("*").eq("campaign_id", data.id),
      context.supabase.from("mkt_campaign_metrics").select("*").eq("campaign_id", data.id).order("captured_on", { ascending: false }).limit(180),
      context.supabase.from("mkt_campaign_reports").select("*").eq("campaign_id", data.id).order("created_at", { ascending: false }),
    ]);
    if (campaignRes.error) throw new Error(campaignRes.error.message);
    if (!campaignRes.data) throw new Error("Campaign not found");
    return {
      campaign: campaignRes.data as Campaign,
      tasks: (tasksRes.data ?? []) as CampaignTask[],
      assets: (assetsRes.data ?? []) as CampaignAsset[],
      members: (membersRes.data ?? []) as any[],
      metrics: (metricsRes.data ?? []) as CampaignMetricRow[],
      reports: (reportsRes.data ?? []) as any[],
    };
  });

// ---------- saveCampaign ----------
const CampaignInputSchema = z.object({
  id: z.string().uuid().optional(),
  brand_id: z.string().uuid(),
  name: z.string().min(1),
  campaign_type: z.string().optional().nullable(),
  objective: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  goals: z.array(z.string()).default([]),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  owner_id: z.string().uuid().optional().nullable(),
  business_unit: z.string().optional().nullable(),
  timeline_stage: z.enum([
    "planning",
    "preparation",
    "launch",
    "promotion",
    "closing",
    "analysis",
    "archive",
  ]).default("planning"),
  template_key: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  target_audience: z.any().optional(),
  target_platforms: z.array(z.string()).default([]),
  budget_cents: z.number().int().nonnegative().optional().nullable(),
  expected_revenue_cents: z.number().int().nonnegative().optional().nullable(),
  actual_revenue_cents: z.number().int().nonnegative().optional().nullable(),
  expected_leads: z.number().int().nonnegative().optional().nullable(),
  actual_leads: z.number().int().nonnegative().optional().nullable(),
  actual_admissions: z.number().int().nonnegative().optional().nullable(),
  status: z.enum(["draft", "planning", "ready", "active", "paused", "completed", "archived"]).default("draft"),
  starts_at: z.string().optional().nullable(),
  ends_at: z.string().optional().nullable(),
});

/**
 * Resolve a brand the caller can write to. If the supplied brand_id is not
 * accessible under RLS (missing row, foreign owner, or empty brand table for
 * this user), fall back to the caller's most-recent owned brand, and finally
 * auto-create a default "My Brand" row. This keeps campaign creation from
 * failing on `new row violates row-level security policy for table
 * mkt_campaigns` when no user-owned brand exists yet. Additive: existing
 * callers that pass a valid, owned brand_id keep the same behavior.
 */
async function resolveAccessibleBrandId(
  supabase: any,
  userId: string,
  preferredBrandId?: string | null,
): Promise<string> {
  if (preferredBrandId) {
    const { data } = await supabase
      .from("mkt_brands")
      .select("id")
      .eq("id", preferredBrandId)
      .maybeSingle();
    if (data?.id) return data.id as string;
  }
  const { data: own } = await supabase
    .from("mkt_brands")
    .select("id, updated_at")
    .eq("owner_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (own?.id) return own.id as string;

  const { data: created, error } = await supabase
    .from("mkt_brands")
    .insert({ owner_id: userId, name: "My Brand" })
    .select("id")
    .single();
  if (error || !created?.id) {
    throw new Error(
      `Unable to prepare a brand workspace for campaigns: ${error?.message ?? "unknown error"}`,
    );
  }
  return created.id as string;
}

export const saveCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => CampaignInputSchema.parse(v))
  .handler(async ({ data, context }) => {
    const payload = {
      ...data,
      target_audience: data.target_audience ?? {},
    };
    if (data.id) {
      const { data: updated, error } = await context.supabase
        .from("mkt_campaigns")
        .update(payload)
        .eq("id", data.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { campaign: updated as Campaign };
    }
    // Ensure the brand_id we insert is one the caller actually owns under RLS.
    const safeBrandId = await resolveAccessibleBrandId(
      context.supabase,
      context.userId,
      data.brand_id,
    );
    const { data: created, error } = await context.supabase
      .from("mkt_campaigns")
      .insert({ ...payload, brand_id: safeBrandId, created_by: context.userId })
      .select()
      .single();
    if (error) {
      throw new Error(
        `Failed to create campaign (${error.code ?? "db_error"}): ${error.message}`,
      );
    }
    return { campaign: created as Campaign };
  });

// ---------- setStatus / archive / duplicate ----------
export const setCampaignStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["draft", "planning", "ready", "active", "paused", "completed", "archived"]),
    }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const patch = { status: data.status, ...(data.status === "archived" ? { archived_at: new Date().toISOString() } : {}) };
    const { error } = await context.supabase.from("mkt_campaigns").update(patch as any).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const duplicateCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: src, error } = await context.supabase
      .from("mkt_campaigns")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!src) throw new Error("Campaign not found");
    const { id: _id, created_at: _c, updated_at: _u, ...rest } = src as any;
    const { data: dup, error: dupErr } = await context.supabase
      .from("mkt_campaigns")
      .insert({
        ...rest,
        name: `${rest.name} (Copy)`,
        status: "draft",
        archived_at: null,
        created_by: context.userId,
      })
      .select()
      .single();
    if (dupErr) throw new Error(dupErr.message);
    return { campaign: dup as Campaign };
  });

// ---------- Tasks ----------
const TaskInputSchema = z.object({
  id: z.string().uuid().optional(),
  campaign_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  owner_id: z.string().uuid().optional().nullable(),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  status: z.enum(["todo", "in_progress", "blocked", "review", "done"]).default("todo"),
  progress: z.number().int().min(0).max(100).default(0),
  deadline: z.string().optional().nullable(),
  checklist: z.any().optional(),
  depends_on: z.array(z.string().uuid()).default([]),
  stage: z.string().optional().nullable(),
});

export const saveCampaignTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => TaskInputSchema.parse(v))
  .handler(async ({ data, context }) => {
    const payload = { ...data, checklist: data.checklist ?? [] };
    if (data.id) {
      const { data: r, error } = await context.supabase
        .from("mkt_campaign_tasks")
        .update(payload)
        .eq("id", data.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { task: r as CampaignTask };
    }
    const { data: r, error } = await context.supabase
      .from("mkt_campaign_tasks")
      .insert({ ...payload, created_by: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { task: r as CampaignTask };
  });

export const deleteCampaignTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("mkt_campaign_tasks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Assets ----------
const AssetInputSchema = z.object({
  campaign_id: z.string().uuid(),
  asset_type: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  url: z.string().url().optional().nullable(),
  thumbnail_url: z.string().url().optional().nullable(),
  ref_table: z.string().optional().nullable(),
  ref_id: z.string().uuid().optional().nullable(),
  platform: z.string().optional().nullable(),
  status: z.string().default("draft"),
});

export const addCampaignAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => AssetInputSchema.parse(v))
  .handler(async ({ data, context }) => {
    const { data: r, error } = await context.supabase
      .from("mkt_campaign_assets")
      .insert({ ...data, created_by: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { asset: r as CampaignAsset };
  });

export const deleteCampaignAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("mkt_campaign_assets").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Dashboard ----------
export const getCampaignDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: campaigns } = await context.supabase.from("mkt_campaigns").select("*");
    const list = (campaigns ?? []) as Campaign[];
    const now = new Date();
    const counts = {
      active: 0,
      upcoming: 0,
      completed: 0,
      archived: 0,
      paused: 0,
      draft: 0,
    };
    let totalRevenue = 0;
    let totalExpectedRevenue = 0;
    let totalBudget = 0;
    let totalLeads = 0;
    let totalAdmissions = 0;
    for (const c of list) {
      if (c.status === "active") counts.active++;
      else if (c.status === "completed") counts.completed++;
      else if (c.status === "archived") counts.archived++;
      else if (c.status === "paused") counts.paused++;
      else if (c.status === "draft" || c.status === "planning" || c.status === "ready") counts.draft++;
      if (c.starts_at && new Date(c.starts_at) > now && c.status !== "archived") counts.upcoming++;
      totalRevenue += Number(c.actual_revenue_cents ?? 0);
      totalExpectedRevenue += Number(c.expected_revenue_cents ?? 0);
      totalBudget += Number(c.budget_cents ?? 0);
      totalLeads += Number(c.actual_leads ?? 0);
      totalAdmissions += Number(c.actual_admissions ?? 0);
    }
    const roi = totalBudget > 0 ? ((totalRevenue - totalBudget) / totalBudget) * 100 : 0;
    // Reach across all campaigns from mkt_campaign_metrics
    const { data: metricRows } = await context.supabase
      .from("mkt_campaign_metrics")
      .select("reach");
    const totalReach = (metricRows ?? []).reduce((s: number, r: any) => s + Number(r.reach ?? 0), 0);

    return {
      counts,
      totals: {
        revenueCents: totalRevenue,
        expectedRevenueCents: totalExpectedRevenue,
        budgetCents: totalBudget,
        reach: totalReach,
        leads: totalLeads,
        admissions: totalAdmissions,
        roi,
      },
      campaigns: list.slice(0, 10),
    };
  });

// ---------- AI Assistant ----------
const StrategyInputSchema = z.object({
  campaign_id: z.string().uuid(),
  mode: z.enum([
    "strategy",
    "timeline",
    "weekly_plan",
    "content_plan",
    "budget_allocation",
    "posting_frequency",
    "success_prediction",
    "roi_prediction",
    "improvements",
  ]),
});

const MODE_INSTRUCTIONS: Record<string, string> = {
  strategy: `Return a full campaign strategy with positioning, key messages, funnel stages, hero angles, KPI targets, and week-by-week focus.`,
  timeline: `Return a phased timeline: Planning, Preparation, Launch, Promotion, Closing, Analysis. Include duration in days and key deliverables per phase.`,
  weekly_plan: `Return a week-by-week execution plan across the campaign duration. Each week has theme, deliverables, channels, and success signals.`,
  content_plan: `Return a per-platform content plan (posts, blogs, emails, landing pages). Give post count, formats, hooks, and CTAs per platform.`,
  budget_allocation: `Return recommended budget allocation as percentages across platforms and cost categories (creative, media, tools, incentives).`,
  posting_frequency: `Return recommended posting frequency per platform per week, with peak times.`,
  success_prediction: `Return a probability-of-success rating with 3 strengths, 3 risks, and 3 mitigations.`,
  roi_prediction: `Return an expected ROI, expected leads, expected admissions, and expected revenue with an assumption block.`,
  improvements: `Return the top 8 actionable improvements ranked by impact, each with rationale and effort.`,
};

export const generateCampaignAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => StrategyInputSchema.parse(v))
  .handler(async ({ data, context }) => {
    const { data: campaign, error } = await context.supabase
      .from("mkt_campaigns")
      .select("*")
      .eq("id", data.campaign_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!campaign) throw new Error("Campaign not found");
    const c = campaign as Campaign;

    const brandBlock = await buildBrandSystemPrompt(context.supabase, context.userId);
    const system = withBrand(
      `You are Glintr's Enterprise Campaign AI. Return STRICT JSON only — no prose, no markdown, no code fences. Every field grounded in the campaign inputs.`,
      brandBlock,
    );

    const inputSummary = {
      name: c.name,
      type: c.campaign_type,
      objective: c.objective,
      description: c.description,
      goals: c.goals,
      priority: c.priority,
      timeline_stage: c.timeline_stage,
      starts_at: c.starts_at,
      ends_at: c.ends_at,
      budget_cents: c.budget_cents,
      expected_revenue_cents: c.expected_revenue_cents,
      expected_leads: c.expected_leads,
      target_audience: c.target_audience,
      target_platforms: c.target_platforms,
      tags: c.tags,
    };

    const userPrompt = `${MODE_INSTRUCTIONS[data.mode]}

CAMPAIGN INPUT:
${JSON.stringify(inputSummary, null, 2)}

Return a JSON object with a top-level "result" key holding the answer for mode "${data.mode}". Include a "notes" array with 3-5 short observations.`;

    const out = await aiChat({
      system,
      messages: [{ role: "user", content: userPrompt }],
      responseFormat: "json",
      temperature: 0.4,
      maxTokens: 2400,
    });

    const parsed = (typeof out === "string" ? {} : out) as Record<string, any>;
    // Persist under ai_strategy[mode]
    const nextStrategy = { ...(c.ai_strategy ?? {}), [data.mode]: { generated_at: new Date().toISOString(), payload: parsed } };
    await context.supabase.from("mkt_campaigns").update({ ai_strategy: nextStrategy }).eq("id", c.id);

    return { mode: data.mode as string, result: parsed as any };
  });

// ---------- Campaign Report ----------
export const generateCampaignReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({
      campaign_id: z.string().uuid(),
      report_type: z.enum([
        "summary",
        "performance",
        "roi",
        "revenue",
        "lead_funnel",
        "conversion_funnel",
        "platform_performance",
        "content_performance",
      ]),
    }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const [{ data: campaign }, { data: metrics }, { data: assets }] = await Promise.all([
      context.supabase.from("mkt_campaigns").select("*").eq("id", data.campaign_id).maybeSingle(),
      context.supabase.from("mkt_campaign_metrics").select("*").eq("campaign_id", data.campaign_id),
      context.supabase.from("mkt_campaign_assets").select("id,asset_type,platform,status").eq("campaign_id", data.campaign_id),
    ]);
    if (!campaign) throw new Error("Campaign not found");

    const brandBlock = await buildBrandSystemPrompt(context.supabase, context.userId);
    const system = withBrand(
      `You are Glintr's Campaign Analytics AI. Return STRICT JSON with keys: summary (string), highlights (array of 5), risks (array of 3), recommendations (array of 5), kpis (object). No markdown.`,
      brandBlock,
    );

    const insights = await aiChat({
      system,
      messages: [
        {
          role: "user",
          content: `Report type: ${data.report_type}
Campaign: ${JSON.stringify(campaign)}
Metrics (last rows): ${JSON.stringify((metrics ?? []).slice(0, 60))}
Assets: ${JSON.stringify(assets ?? [])}`,
        },
      ],
      responseFormat: "json",
      temperature: 0.3,
      maxTokens: 2000,
    });

    const { data: created, error } = await context.supabase
      .from("mkt_campaign_reports")
      .insert({
        campaign_id: data.campaign_id,
        report_type: data.report_type,
        title: `${data.report_type.replace(/_/g, " ")} report`,
        summary: typeof insights === "object" && insights && "summary" in insights ? String((insights as any).summary ?? "") : "",
        data: { metrics: metrics ?? [], assets: assets ?? [] },
        ai_insights: insights as any,
        format: "json",
        generated_by: context.userId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { report: created };
  });

// ---------- Templates (in-code catalog) ----------
export type CampaignTemplate = {
  key: string;
  name: string;
  campaign_type: string;
  objective: string;
  goals: string[];
  timeline_stage: string;
  target_platforms: string[];
  suggested_tasks: Array<{ title: string; stage: string; priority?: string }>;
};

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    key: "admissions",
    name: "Admissions Campaign",
    campaign_type: "Admissions",
    objective: "Fill the upcoming batch with qualified admissions.",
    goals: ["Admissions", "Lead Generation", "Revenue"],
    timeline_stage: "planning",
    target_platforms: ["Instagram", "LinkedIn", "Email", "Landing Pages"],
    suggested_tasks: [
      { title: "Define ICP + eligibility", stage: "planning", priority: "high" },
      { title: "Publish landing page", stage: "preparation", priority: "high" },
      { title: "Launch webinar", stage: "launch" },
      { title: "Drip email sequence", stage: "promotion" },
      { title: "Close waitlist + confirm seats", stage: "closing", priority: "critical" },
    ],
  },
  {
    key: "placement",
    name: "Placement Drive",
    campaign_type: "Hiring",
    objective: "Deliver hiring outcomes for the current cohort.",
    goals: ["Admissions", "Customer Retention"],
    timeline_stage: "planning",
    target_platforms: ["LinkedIn", "Email", "Blog"],
    suggested_tasks: [
      { title: "Recruiter outreach list", stage: "planning" },
      { title: "Portfolio review workshop", stage: "preparation" },
      { title: "Placement launch post", stage: "launch" },
      { title: "Success stories", stage: "promotion" },
    ],
  },
  {
    key: "hiring",
    name: "Hiring Campaign",
    campaign_type: "Hiring",
    objective: "Hire N specialists in target roles.",
    goals: ["Traffic", "Lead Generation"],
    timeline_stage: "planning",
    target_platforms: ["LinkedIn", "X", "Email"],
    suggested_tasks: [
      { title: "JD + rubric", stage: "planning" },
      { title: "Careers page update", stage: "preparation" },
      { title: "Launch on LinkedIn", stage: "launch" },
    ],
  },
  {
    key: "referral",
    name: "Referral Program",
    campaign_type: "Referral",
    objective: "Increase enrollment via ambassador and student referrals.",
    goals: ["Lead Generation", "Community Growth"],
    timeline_stage: "planning",
    target_platforms: ["Email", "Instagram", "Landing Pages"],
    suggested_tasks: [
      { title: "Design incentive tiers", stage: "planning" },
      { title: "Referral landing page", stage: "preparation" },
      { title: "Ambassador kickoff", stage: "launch" },
    ],
  },
  {
    key: "festival",
    name: "Festival Offer",
    campaign_type: "Festival",
    objective: "Drive festive-season enrollments with limited-time offer.",
    goals: ["Revenue", "Traffic"],
    timeline_stage: "planning",
    target_platforms: ["Instagram", "Facebook", "Email"],
    suggested_tasks: [
      { title: "Offer construction", stage: "planning" },
      { title: "Countdown creatives", stage: "preparation" },
      { title: "Launch burst", stage: "launch" },
      { title: "Final 48h push", stage: "closing" },
    ],
  },
  {
    key: "product_launch",
    name: "Product Launch",
    campaign_type: "Product Launch",
    objective: "Ship and market a new product with orchestrated day-1 attention.",
    goals: ["Brand Awareness", "Revenue"],
    timeline_stage: "planning",
    target_platforms: ["LinkedIn", "X", "YouTube", "Blog", "Email"],
    suggested_tasks: [
      { title: "Messaging + positioning", stage: "planning" },
      { title: "Teaser sequence", stage: "preparation" },
      { title: "Launch day war-room", stage: "launch", priority: "critical" },
      { title: "Post-launch amplification", stage: "promotion" },
    ],
  },
  {
    key: "course_launch",
    name: "Course Launch",
    campaign_type: "Course Launch",
    objective: "Launch a new course to a warm audience.",
    goals: ["Admissions", "Revenue"],
    timeline_stage: "planning",
    target_platforms: ["Instagram", "YouTube", "Email", "Landing Pages"],
    suggested_tasks: [
      { title: "Curriculum snapshot", stage: "planning" },
      { title: "Waitlist page", stage: "preparation" },
      { title: "Enrollment window opens", stage: "launch" },
      { title: "Close + confirm", stage: "closing" },
    ],
  },
  {
    key: "webinar",
    name: "Webinar",
    campaign_type: "Webinar",
    objective: "Convert registrants into applicants through a live session.",
    goals: ["Lead Generation", "Admissions"],
    timeline_stage: "planning",
    target_platforms: ["Instagram", "LinkedIn", "Email"],
    suggested_tasks: [
      { title: "Speaker + topic lock", stage: "planning" },
      { title: "Registration page live", stage: "preparation" },
      { title: "Reminder sequence", stage: "promotion" },
      { title: "Post-webinar follow-up", stage: "closing" },
    ],
  },
  {
    key: "workshop",
    name: "Workshop",
    campaign_type: "Workshop",
    objective: "Deliver a paid or free workshop that becomes a lead engine.",
    goals: ["Lead Generation", "Brand Awareness"],
    timeline_stage: "planning",
    target_platforms: ["Instagram", "Email"],
    suggested_tasks: [
      { title: "Outline + outcomes", stage: "planning" },
      { title: "Landing + registration", stage: "preparation" },
      { title: "Workshop delivery", stage: "launch" },
    ],
  },
  {
    key: "scholarship",
    name: "Scholarship Campaign",
    campaign_type: "Admissions",
    objective: "Attract high-intent applicants through a scholarship offer.",
    goals: ["Lead Generation", "Admissions", "Brand Awareness"],
    timeline_stage: "planning",
    target_platforms: ["LinkedIn", "Email", "Landing Pages"],
    suggested_tasks: [
      { title: "Rules + jury", stage: "planning" },
      { title: "Application form", stage: "preparation" },
      { title: "Announcement", stage: "launch" },
      { title: "Winners spotlight", stage: "closing" },
    ],
  },
];

export const getCampaignTemplates = createServerFn({ method: "GET" }).handler(async () => {
  return { templates: CAMPAIGN_TEMPLATES };
});

export const createFromTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({ brand_id: z.string().uuid(), template_key: z.string().min(1), name: z.string().min(1) }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const tpl = CAMPAIGN_TEMPLATES.find((t) => t.key === data.template_key);
    if (!tpl) throw new Error("Template not found");
    const { data: campaign, error } = await context.supabase
      .from("mkt_campaigns")
      .insert({
        brand_id: data.brand_id,
        name: data.name,
        campaign_type: tpl.campaign_type,
        objective: tpl.objective,
        goals: tpl.goals,
        timeline_stage: tpl.timeline_stage,
        target_platforms: tpl.target_platforms,
        template_key: tpl.key,
        status: "draft",
        created_by: context.userId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    const tasks = tpl.suggested_tasks.map((t) => ({
      campaign_id: campaign.id,
      title: t.title,
      stage: t.stage,
      priority: t.priority ?? "medium",
      status: "todo",
      created_by: context.userId,
    }));
    if (tasks.length) await context.supabase.from("mkt_campaign_tasks").insert(tasks);
    return { campaign: campaign as Campaign };
  });

// ---------- listBrandsForOwner ----------
export const listBrandsForCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("mkt_brands")
      .select("id,name,slug,primary_color")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { brands: data ?? [] };
  });
