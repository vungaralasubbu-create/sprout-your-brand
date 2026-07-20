// Marketing Analytics — server functions.
// Reuses publishing_jobs, approval_queue, platform_leads, enrollments, blog_posts,
// mkt_analytics, soc_analytics. Uses centralized AI router for insights/forecasts.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { aiChat } from "@/lib/ai/router.server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const RangeSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  platforms: z.array(z.string()).optional(),
  campaigns: z.array(z.string()).optional(),
});

function resolveRange(input: z.infer<typeof RangeSchema>) {
  const to = input.to ? new Date(input.to) : new Date();
  const from = input.from ? new Date(input.from) : new Date(to.getTime() - 30 * 24 * 3600 * 1000);
  return { from, to };
}

/* ---------------- KPIs ---------------- */

export const getAnalyticsKpis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => RangeSchema.parse(raw ?? {}))
  .handler(async ({ data, context }) => {
    const { from, to } = resolveRange(data);
    const { supabase, userId } = context;

    const [jobsRes, apprRes, leadsRes, enrollRes, eventsRes, socRes] = await Promise.all([
      supabase.from("publishing_jobs").select("id, status, platform, campaign, scheduled_at, published_at")
        .eq("owner_id", userId)
        .gte("scheduled_at", from.toISOString()).lte("scheduled_at", to.toISOString()),
      supabase.from("approval_queue").select("id, status, platform, campaign, created_at")
        .gte("created_at", from.toISOString()).lte("created_at", to.toISOString()),
      supabase.from("platform_leads").select("id, source, status, created_at")
        .gte("created_at", from.toISOString()).lte("created_at", to.toISOString()),
      supabase.from("enrollments").select("id, amount, status, created_at")
        .gte("created_at", from.toISOString()).lte("created_at", to.toISOString()),
      supabase.from("mkt_analytics_events").select("event_type, platform, value, occurred_at")
        .eq("owner_id", userId)
        .gte("occurred_at", from.toISOString()).lte("occurred_at", to.toISOString()),
      supabase.from("soc_analytics").select("*").limit(500),
    ]);

    const jobs = (jobsRes.data ?? []) as Any[];
    const leads = (leadsRes.data ?? []) as Any[];
    const enrollments = (enrollRes.data ?? []) as Any[];
    const events = (eventsRes.data ?? []) as Any[];
    const soc = (socRes.data ?? []) as Any[];

    const sum = (arr: Any[], k: string) => arr.reduce((s, r) => s + Number(r[k] ?? 0), 0);
    const impressions = sum(soc, "impressions");
    const reach = sum(soc, "reach");
    const engagements = sum(soc, "engagements") || sum(soc, "likes") + sum(soc, "comments") + sum(soc, "shares");
    const clicks = sum(soc, "clicks");
    const followers = sum(soc, "followers_delta");
    const websiteVisits = events.filter((e) => e.event_type === "click" || e.event_type === "website_visit").length;
    const revenue = enrollments.filter((e) => e.status === "completed" || e.status === "paid")
      .reduce((s, e) => s + Number(e.amount ?? 0), 0);
    const admissions = enrollments.filter((e) => e.status === "completed" || e.status === "paid").length;
    const publishedPosts = jobs.filter((j) => j.status === "published").length;
    const failedPosts = jobs.filter((j) => j.status === "failed").length;
    const conversions = admissions + leads.filter((l) => l.status === "converted").length;

    return {
      range: { from: from.toISOString(), to: to.toISOString() },
      cards: {
        totalReach: reach,
        totalImpressions: impressions,
        engagementRate: impressions ? Number(((engagements / impressions) * 100).toFixed(2)) : 0,
        followersGrowth: followers,
        websiteVisits,
        leadsGenerated: leads.length,
        admissions,
        revenue,
        ctr: impressions ? Number(((clicks / impressions) * 100).toFixed(2)) : 0,
        conversions,
        roi: 0,
        campaignPerformance: publishedPosts ? Number(((publishedPosts / Math.max(1, publishedPosts + failedPosts)) * 100).toFixed(1)) : 0,
      },
      volume: {
        publishedPosts,
        failedPosts,
        scheduledPosts: jobs.filter((j) => j.status === "queued").length,
        approvedItems: (apprRes.data ?? []).filter((a: Any) => a.status === "approved").length,
      },
    };
  });

/* ---------------- Platform Breakdown ---------------- */

export const getPlatformAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => RangeSchema.parse(raw ?? {}))
  .handler(async ({ data, context }) => {
    const { from, to } = resolveRange(data);
    const { supabase, userId } = context;
    const [jobsRes, socRes] = await Promise.all([
      supabase.from("publishing_jobs").select("platform, status")
        .eq("owner_id", userId)
        .gte("scheduled_at", from.toISOString()).lte("scheduled_at", to.toISOString()),
      supabase.from("soc_analytics").select("*").limit(1000),
    ]);
    const jobs = (jobsRes.data ?? []) as Any[];
    const soc = (socRes.data ?? []) as Any[];
    const platforms = ["instagram", "facebook", "linkedin", "x", "threads", "pinterest", "youtube", "tiktok", "blog"];
    const rows = platforms.map((p) => {
      const jp = jobs.filter((j) => (j.platform ?? "").toLowerCase() === p);
      const sp = soc.filter((s) => (s.platform ?? "").toLowerCase() === p);
      const sum = (k: string) => sp.reduce((a, r) => a + Number(r[k] ?? 0), 0);
      const impressions = sum("impressions");
      const clicks = sum("clicks");
      const likes = sum("likes"); const comments = sum("comments"); const shares = sum("shares");
      return {
        platform: p,
        postsPublished: jp.filter((j) => j.status === "published").length,
        reach: sum("reach"),
        impressions,
        likes, comments, shares,
        bookmarks: sum("bookmarks") || sum("saves"),
        clicks,
        followerGrowth: sum("followers_delta"),
        profileVisits: sum("profile_visits"),
        engagementRate: impressions ? Number((((likes + comments + shares) / impressions) * 100).toFixed(2)) : 0,
        ctr: impressions ? Number(((clicks / impressions) * 100).toFixed(2)) : 0,
        conversions: 0,
      };
    });
    return { rows };
  });

/* ---------------- Business Metrics ---------------- */

export const getBusinessMetrics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => RangeSchema.parse(raw ?? {}))
  .handler(async ({ data, context }) => {
    const { from, to } = resolveRange(data);
    const { supabase } = context;
    const [leadsRes, enrollRes, appRes, contactRes] = await Promise.all([
      supabase.from("platform_leads").select("id, status, source, created_at, converted_at")
        .gte("created_at", from.toISOString()).lte("created_at", to.toISOString()),
      supabase.from("enrollments").select("id, amount, status, created_at, course_id")
        .gte("created_at", from.toISOString()).lte("created_at", to.toISOString()),
      supabase.from("course_applications").select("id, status, created_at")
        .gte("created_at", from.toISOString()).lte("created_at", to.toISOString()),
      supabase.from("contact_enquiries").select("id, created_at")
        .gte("created_at", from.toISOString()).lte("created_at", to.toISOString()),
    ]);
    const leads = (leadsRes.data ?? []) as Any[];
    const enrollments = (enrollRes.data ?? []) as Any[];
    return {
      mql: leads.filter((l) => ["mql", "qualified", "converted"].includes((l.status ?? "").toLowerCase())).length,
      sql: leads.filter((l) => ["sql", "converted"].includes((l.status ?? "").toLowerCase())).length,
      admissions: enrollments.filter((e) => ["completed", "paid"].includes((e.status ?? "").toLowerCase())).length,
      applications: (appRes.data ?? []).length,
      revenue: enrollments.filter((e) => ["completed", "paid"].includes((e.status ?? "").toLowerCase()))
        .reduce((s, e) => s + Number(e.amount ?? 0), 0),
      coursePurchases: enrollments.length,
      newsletterSignups: 0,
      contactRequests: (contactRes.data ?? []).length,
      demoBookings: 0,
    };
  });

/* ---------------- Campaign Analytics ---------------- */

export const getCampaignAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => RangeSchema.parse(raw ?? {}))
  .handler(async ({ data, context }) => {
    const { from, to } = resolveRange(data);
    const { supabase, userId } = context;
    const { data: jobs } = await supabase.from("publishing_jobs")
      .select("campaign, platform, status")
      .eq("owner_id", userId)
      .gte("scheduled_at", from.toISOString()).lte("scheduled_at", to.toISOString());
    const byCampaign = new Map<string, Any>();
    for (const j of (jobs ?? []) as Any[]) {
      const c = j.campaign ?? "(no campaign)";
      const cur = byCampaign.get(c) ?? { campaign: c, total: 0, published: 0, failed: 0, platforms: new Set<string>() };
      cur.total += 1;
      if (j.status === "published") cur.published += 1;
      if (j.status === "failed") cur.failed += 1;
      cur.platforms.add(j.platform);
      byCampaign.set(c, cur);
    }
    return {
      campaigns: [...byCampaign.values()].map((c) => ({
        campaign: c.campaign, total: c.total, published: c.published, failed: c.failed,
        platforms: [...c.platforms], successRate: c.total ? Number(((c.published / c.total) * 100).toFixed(1)) : 0,
      })),
    };
  });

/* ---------------- Timeseries ---------------- */

export const getTimeseries = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => RangeSchema.parse(raw ?? {}))
  .handler(async ({ data, context }) => {
    const { from, to } = resolveRange(data);
    const { supabase, userId } = context;
    const [jobsRes, leadsRes, enrollRes] = await Promise.all([
      supabase.from("publishing_jobs").select("scheduled_at, status")
        .eq("owner_id", userId)
        .gte("scheduled_at", from.toISOString()).lte("scheduled_at", to.toISOString()),
      supabase.from("platform_leads").select("created_at")
        .gte("created_at", from.toISOString()).lte("created_at", to.toISOString()),
      supabase.from("enrollments").select("created_at, amount, status")
        .gte("created_at", from.toISOString()).lte("created_at", to.toISOString()),
    ]);
    const days: Record<string, Any> = {};
    const key = (d: Date) => d.toISOString().slice(0, 10);
    for (let d = new Date(from); d <= to; d = new Date(d.getTime() + 86400000)) {
      days[key(d)] = { date: key(d), posts: 0, leads: 0, admissions: 0, revenue: 0 };
    }
    for (const j of (jobsRes.data ?? []) as Any[]) {
      const k = key(new Date(j.scheduled_at));
      if (days[k] && j.status === "published") days[k].posts += 1;
    }
    for (const l of (leadsRes.data ?? []) as Any[]) {
      const k = key(new Date(l.created_at));
      if (days[k]) days[k].leads += 1;
    }
    for (const e of (enrollRes.data ?? []) as Any[]) {
      const k = key(new Date(e.created_at));
      if (days[k]) {
        days[k].admissions += (["completed", "paid"].includes((e.status ?? "").toLowerCase()) ? 1 : 0);
        days[k].revenue += Number(e.amount ?? 0);
      }
    }
    return { series: Object.values(days) };
  });

/* ---------------- Posting Heatmap ---------------- */

export const getPostingHeatmap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => RangeSchema.parse(raw ?? {}))
  .handler(async ({ data, context }) => {
    const { from, to } = resolveRange(data);
    const { supabase, userId } = context;
    const { data: jobs } = await supabase.from("publishing_jobs")
      .select("scheduled_at, status")
      .eq("owner_id", userId)
      .gte("scheduled_at", from.toISOString()).lte("scheduled_at", to.toISOString());
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    for (const j of (jobs ?? []) as Any[]) {
      const d = new Date(j.scheduled_at);
      grid[d.getDay()][d.getHours()] += 1;
    }
    // best day/hour
    let bestDay = 0, bestHour = 0, best = -1;
    for (let d = 0; d < 7; d++) for (let h = 0; h < 24; h++) {
      if (grid[d][h] > best) { best = grid[d][h]; bestDay = d; bestHour = h; }
    }
    return { grid, bestDay, bestHour };
  });

/* ---------------- AI Insights (via central router) ---------------- */

export const getAIInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => RangeSchema.parse(raw ?? {}))
  .handler(async ({ data, context }) => {
    // Aggregate lightweight snapshot then ask the router.
    const { from, to } = resolveRange(data);
    const { supabase, userId } = context;
    const [jobsRes, leadsRes, enrollRes] = await Promise.all([
      supabase.from("publishing_jobs").select("platform, status, campaign").eq("owner_id", userId)
        .gte("scheduled_at", from.toISOString()).lte("scheduled_at", to.toISOString()),
      supabase.from("platform_leads").select("source, status")
        .gte("created_at", from.toISOString()).lte("created_at", to.toISOString()),
      supabase.from("enrollments").select("amount, status, course_id")
        .gte("created_at", from.toISOString()).lte("created_at", to.toISOString()),
    ]);
    const snapshot = {
      window: `${from.toISOString().slice(0,10)} → ${to.toISOString().slice(0,10)}`,
      posts: (jobsRes.data ?? []).length,
      leads: (leadsRes.data ?? []).length,
      enrollments: (enrollRes.data ?? []).length,
      byPlatform: [...new Set((jobsRes.data ?? []).map((j: Any) => j.platform))].map((p) => ({
        platform: p, posts: (jobsRes.data ?? []).filter((j: Any) => j.platform === p).length,
      })),
      leadSources: [...new Set((leadsRes.data ?? []).map((l: Any) => l.source))].slice(0, 10),
    };
    const system = "You are an enterprise marketing analyst for an EdTech platform. Return concise, actionable JSON insights.";
    const prompt = `Given this marketing snapshot for the last window, answer:
- highestQualityLeadsPlatform
- highestRoiCampaign
- bestPostingTime (day + hour)
- topHashtags (guess reasonable ones for EdTech if data lacks)
- contentTypeDrivingAdmissions
- bestCta
- nextWeekRecommendation (single sentence)
Also return 5 bullet 'topInsights' strings, each ≤ 20 words.
Snapshot: ${JSON.stringify(snapshot)}
Respond as JSON with those keys.`;
    const result = (await aiChat({
      system,
      messages: [{ role: "user", content: prompt }],
      responseFormat: "json",
      temperature: 0.4,
      maxTokens: 800,
    })) as Record<string, unknown>;
    return { snapshot, insights: result as unknown as Record<string, string> };
  });

/* ---------------- Forecast (AI) ---------------- */

export const getForecast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => RangeSchema.parse(raw ?? {}))
  .handler(async ({ data, context }) => {
    const { from, to } = resolveRange(data);
    const { supabase, userId } = context;
    const [jobs, leads, enrolls] = await Promise.all([
      supabase.from("publishing_jobs").select("id", { count: "exact", head: true })
        .eq("owner_id", userId).gte("scheduled_at", from.toISOString()).lte("scheduled_at", to.toISOString()),
      supabase.from("platform_leads").select("id", { count: "exact", head: true })
        .gte("created_at", from.toISOString()).lte("created_at", to.toISOString()),
      supabase.from("enrollments").select("id, amount", { count: "exact" })
        .gte("created_at", from.toISOString()).lte("created_at", to.toISOString()),
    ]);
    const revenue = ((enrolls.data ?? []) as Any[]).reduce((s, e) => s + Number(e.amount ?? 0), 0);
    const snapshot = { posts: jobs.count ?? 0, leads: leads.count ?? 0, enrollments: enrolls.count ?? 0, revenue };
    const prompt = `Given this 30-day marketing snapshot, forecast the NEXT 30 days as JSON with numeric keys: expectedReach, expectedLeads, expectedRevenue, followerGrowth, campaignSuccessProbability (0-100), rationale (short string).
Snapshot: ${JSON.stringify(snapshot)}`;
    const result = (await aiChat({
      system: "You are a marketing forecasting model for EdTech. Be conservative and realistic.",
      messages: [{ role: "user", content: prompt }],
      responseFormat: "json", temperature: 0.3, maxTokens: 500,
    })) as Record<string, unknown>;
    return { snapshot, forecast: result };
  });

/* ---------------- Reports ---------------- */

const CreateReportSchema = z.object({
  name: z.string().min(1),
  kind: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly", "custom"]).default("custom"),
  range_from: z.string().datetime().optional(),
  range_to: z.string().datetime().optional(),
  filters: z.record(z.string(), z.unknown()).default({}),
  data: z.record(z.string(), z.unknown()).default({}),
  format: z.enum(["json", "csv", "excel", "pdf"]).default("json"),
});

export const createAnalyticsReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => CreateReportSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("mkt_analytics_reports")
      .insert({ ...data, owner_id: context.userId }).select("*").maybeSingle();
    if (error) throw new Error(error.message);
    return { report: row };
  });

export const listAnalyticsReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("mkt_analytics_reports")
      .select("*").eq("owner_id", context.userId).order("created_at", { ascending: false }).limit(100);
    if (error) throw new Error(error.message);
    return { reports: data ?? [] };
  });

export const deleteAnalyticsReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("mkt_analytics_reports").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------- Event tracking ---------------- */

const TrackEventSchema = z.object({
  event_type: z.string(),
  platform: z.string().optional(),
  campaign: z.string().optional(),
  entity_type: z.string().optional(),
  entity_id: z.string().uuid().optional(),
  value: z.number().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const trackAnalyticsEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => TrackEventSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("mkt_analytics_events").insert({
      owner_id: context.userId, ...data,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
