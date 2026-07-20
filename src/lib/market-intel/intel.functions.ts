/**
 * Market Intelligence server functions.
 * All AI work routes through the central AI Router (`aiChat`); nothing calls providers directly.
 * Reuses existing signals: keyword_research_keywords, geo_questions, blog_topics, ai_seo_suggestions.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// ---------- Dashboard ----------
export const getIntelDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const s = context.supabase;
    const [trends, news, keywords, opps, alerts, kwSignals, geoQs] = await Promise.all([
      s.from("market_trends").select("id, opportunity_score, growth_rate, industry, topic, detected_at").order("detected_at", { ascending: false }).limit(200),
      s.from("industry_news").select("id, headline, industry, business_relevance, published_at").order("published_at", { ascending: false, nullsFirst: false }).limit(50),
      s.from("keyword_trends").select("id, keyword, direction, growth_percent, monthly_volume").order("growth_percent", { ascending: false }).limit(50),
      s.from("content_opportunities").select("id, title, type, priority_score, status").order("priority_score", { ascending: false }).limit(50),
      s.from("trend_alerts").select("id, alert_type, severity, is_read, created_at").order("created_at", { ascending: false }).limit(50),
      s.from("keyword_research_keywords").select("id", { count: "exact", head: true }),
      s.from("geo_questions").select("id", { count: "exact", head: true }),
    ]);
    const trendRows = trends.data ?? [];
    const opportunityRows = opps.data ?? [];
    const avgOpportunity = trendRows.length
      ? Math.round(trendRows.reduce((a, r) => a + (Number(r.opportunity_score) || 0), 0) / trendRows.length)
      : 0;
    return {
      trendingTopics: trendRows.length,
      trendingKeywords: (keywords.data ?? []).filter((k) => k.direction === "growing" || k.direction === "emerging").length,
      viralPosts: 0, // placeholder — feeds when social listening connectors ship
      competitorActivity: 0,
      industryNews: (news.data ?? []).length,
      searchGrowth: (keywords.data ?? []).reduce((a, k) => a + (Number(k.growth_percent) || 0), 0),
      contentOpportunities: opportunityRows.filter((o) => o.status === "suggested").length,
      contentGaps: 0,
      upcomingEvents: 0,
      marketScore: avgOpportunity,
      unreadAlerts: (alerts.data ?? []).filter((a) => !a.is_read).length,
      totalKeywordSignals: kwSignals.count ?? 0,
      totalGeoQuestions: geoQs.count ?? 0,
      recentTrends: trendRows.slice(0, 10),
      recentNews: news.data ?? [],
      topOpportunities: opportunityRows.slice(0, 8),
      alerts: alerts.data ?? [],
      growingKeywords: keywords.data ?? [],
    };
  });

// ---------- Trends ----------
export const listTrends = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("market_trends").select("*").order("opportunity_score", { ascending: false }).limit(200);
    return { trends: data ?? [] };
  });

export const listNews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("industry_news").select("*").order("published_at", { ascending: false, nullsFirst: false }).limit(100);
    return { news: data ?? [] };
  });

export const listKeywordTrends = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("keyword_trends").select("*").order("growth_percent", { ascending: false }).limit(200);
    return { keywords: data ?? [] };
  });

export const listOpportunities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("content_opportunities").select("*").order("priority_score", { ascending: false }).limit(200);
    return { opportunities: data ?? [] };
  });

export const listAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("trend_alerts").select("*").order("created_at", { ascending: false }).limit(200);
    return { alerts: data ?? [] };
  });

export const markAlertRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    await context.supabase.from("trend_alerts").update({ is_read: true }).eq("id", data.id);
    return { ok: true };
  });

// ---------- AI Discovery (routes through central AI Router) ----------
type AIJson = Record<string, unknown>;

async function ai(system: string, user: string): Promise<AIJson | AIJson[]> {
  const { aiChat } = await import("@/lib/ai/router.server");
  const out = await aiChat({
    system,
    messages: [{ role: "user", content: user }],
    responseFormat: "json",
  });
  return typeof out === "string" ? {} : (out as AIJson | AIJson[]);
}

function asArray(v: unknown): AIJson[] {
  if (Array.isArray(v)) return v as AIJson[];
  if (v && typeof v === "object") {
    const items = (v as Record<string, unknown>).items ?? (v as Record<string, unknown>).results ?? (v as Record<string, unknown>).data;
    if (Array.isArray(items)) return items as AIJson[];
  }
  return [];
}
const s = (r: AIJson, k: string): string => (typeof r[k] === "string" ? (r[k] as string) : "");
const n = (r: AIJson, k: string): number => (typeof r[k] === "number" ? (r[k] as number) : Number(r[k]) || 0);
const arr = (r: AIJson, k: string): string[] => (Array.isArray(r[k]) ? (r[k] as string[]).filter((x) => typeof x === "string") : []);

const INDUSTRIES = ["AI", "Education", "Technology", "Hiring", "Placements", "Admissions", "Cyber Security", "Cloud", "Robotics", "Finance", "Digital Marketing"];

export const discoverTrends = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({
    industry: z.string().optional(),
    timeframe: z.enum(["daily","weekly","monthly","yearly","seasonal","emerging","breaking","evergreen"]).default("weekly"),
    limit: z.number().min(1).max(20).default(10),
  }).parse(v ?? {}))
  .handler(async ({ data, context }) => {
    const industry = data.industry ?? "Education, AI, Hiring, Placements";
    const out = await ai(
      "You are Glintr's market intelligence engine. Discover trending topics for an EdTech platform training sales professionals to become entrepreneurs. Return strict JSON array `items` where each item has: topic (string), category (string), industry (string), source (string, e.g. 'search' | 'social' | 'news' | 'community'), popularity (0-100), growth_rate (0-100), velocity (0-100), competition (0-100), difficulty (0-100), business_relevance (0-100), opportunity_score (0-100), tags (string[]).",
      `Industry focus: ${industry}. Timeframe: ${data.timeframe}. Return the top ${data.limit} trends with realistic scores. Format: { "items": [ ... ] }`,
    );
    const items = asArray(out).slice(0, data.limit);
    if (items.length === 0) return { inserted: 0 };
    const rows = items.map((r) => ({
      owner_id: context.userId,
      topic: s(r, "topic") || "Untitled trend",
      category: s(r, "category") || null,
      industry: s(r, "industry") || industry,
      source: s(r, "source") || "ai",
      timeframe: data.timeframe,
      popularity: n(r, "popularity"),
      growth_rate: n(r, "growth_rate"),
      velocity: n(r, "velocity"),
      competition: n(r, "competition"),
      difficulty: n(r, "difficulty"),
      business_relevance: n(r, "business_relevance"),
      opportunity_score: n(r, "opportunity_score"),
      tags: arr(r, "tags"),
    }));
    const { data: inserted } = await context.supabase.from("market_trends").insert(rows).select("id, topic, opportunity_score, growth_rate");
    // Alert on high-growth trends
    const highGrowth = (inserted ?? []).filter((r) => Number(r.opportunity_score) >= 75);
    if (highGrowth.length) {
      await context.supabase.from("trend_alerts").insert(highGrowth.map((r) => ({
        owner_id: context.userId,
        alert_type: "high_growth",
        severity: "high",
        title: `High-growth trend: ${r.topic}`,
        description: `Opportunity score ${Math.round(Number(r.opportunity_score))} · growth ${Math.round(Number(r.growth_rate))}%`,
        source_trend_id: r.id,
      })));
    }
    return { inserted: rows.length };
  });

export const generateKeywordTrends = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({
    industry: z.string().optional(),
    limit: z.number().min(1).max(30).default(15),
  }).parse(v ?? {}))
  .handler(async ({ data, context }) => {
    const industry = data.industry ?? "Education, AI, Hiring";
    const out = await ai(
      "You are Glintr's SEO trend analyst. Return strict JSON `{ items: [] }`. Each item: keyword (string), category (string), monthly_volume (number), growth_percent (number, negative allowed), direction ('growing'|'declining'|'seasonal'|'emerging'|'long_tail'|'question'), intent ('Informational'|'Commercial'|'Navigational'|'Transactional'|'Career'), difficulty (0-100).",
      `Industry: ${industry}. Return ${data.limit} keyword trends mixing growing, emerging, long-tail, and question keywords relevant for an EdTech brand.`,
    );
    const items = asArray(out).slice(0, data.limit);
    if (items.length === 0) return { inserted: 0 };
    const rows = items.map((r) => ({
      owner_id: context.userId,
      keyword: s(r, "keyword") || "Untitled",
      category: s(r, "category") || null,
      industry,
      monthly_volume: Math.round(n(r, "monthly_volume")),
      growth_percent: n(r, "growth_percent"),
      direction: s(r, "direction") || "stable",
      intent: s(r, "intent") || null,
      difficulty: n(r, "difficulty"),
    }));
    await context.supabase.from("keyword_trends").insert(rows);
    return { inserted: rows.length };
  });

export const generateOpportunities = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({
    limit: z.number().min(1).max(20).default(10),
    focus: z.string().optional(),
  }).parse(v ?? {}))
  .handler(async ({ data, context }) => {
    const { data: topTrends } = await context.supabase
      .from("market_trends").select("topic, industry, opportunity_score")
      .order("opportunity_score", { ascending: false }).limit(15);
    const context_text = (topTrends ?? []).map((t) => `- ${t.topic} (${t.industry}, score ${t.opportunity_score})`).join("\n") || "No trend history yet.";
    const out = await ai(
      "You are Glintr's opportunity engine. Return strict JSON `{ items: [] }`. Each item: title (string), type ('blog'|'landing_page'|'course'|'campaign'|'social'|'email'|'video'|'webinar'), topic (string), industry (string), target_keyword (string), supporting_keywords (string[]), priority_score (0-100), estimated_reach (number), competition (0-100), rationale (string).",
      `Focus: ${data.focus ?? "growth for Glintr EdTech"}. Recent trends:\n${context_text}\nReturn ${data.limit} untapped/low-competition/high-conversion content opportunities.`,
    );
    const items = asArray(out).slice(0, data.limit);
    if (items.length === 0) return { inserted: 0 };
    const rows = items.map((r) => ({
      owner_id: context.userId,
      title: s(r, "title") || "Untitled opportunity",
      type: s(r, "type") || "blog",
      topic: s(r, "topic") || null,
      industry: s(r, "industry") || null,
      target_keyword: s(r, "target_keyword") || null,
      supporting_keywords: arr(r, "supporting_keywords"),
      priority_score: n(r, "priority_score"),
      estimated_reach: Math.round(n(r, "estimated_reach")),
      competition: n(r, "competition"),
      rationale: s(r, "rationale") || null,
      status: "suggested",
    }));
    await context.supabase.from("content_opportunities").insert(rows);
    return { inserted: rows.length };
  });

export const summarizeIndustryNews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({
    industry: z.string().optional(),
    limit: z.number().min(1).max(15).default(8),
  }).parse(v ?? {}))
  .handler(async ({ data, context }) => {
    const industry = data.industry ?? "AI, Education, Hiring, EdTech";
    const out = await ai(
      "You are Glintr's news intelligence agent. Return strict JSON `{ items: [] }`. Each item: headline (string), summary (string), source (string), industry (string), ai_summary (string), impact ('low'|'medium'|'high'), business_relevance (0-100), marketing_opportunities (string[]), recommended_actions (string[]), tags (string[]).",
      `Industry: ${industry}. Return ${data.limit} recent-style industry news headlines with AI summaries and marketing implications for an EdTech brand.`,
    );
    const items = asArray(out).slice(0, data.limit);
    if (items.length === 0) return { inserted: 0 };
    const now = new Date().toISOString();
    const rows = items.map((r) => ({
      owner_id: context.userId,
      headline: s(r, "headline") || "Untitled",
      summary: s(r, "summary") || null,
      source: s(r, "source") || "AI Synthesis",
      industry: s(r, "industry") || industry,
      published_at: now,
      ai_summary: s(r, "ai_summary") || null,
      impact: s(r, "impact") || "medium",
      business_relevance: n(r, "business_relevance"),
      marketing_opportunities: arr(r, "marketing_opportunities"),
      recommended_actions: arr(r, "recommended_actions"),
      tags: arr(r, "tags"),
    }));
    await context.supabase.from("industry_news").insert(rows);
    return { inserted: rows.length };
  });

// ---------- Report generator ----------
export const generateMarketReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({
    type: z.enum(["daily","weekly","monthly","quarterly","yearly"]),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const now = new Date();
    const daysBack = { daily: 1, weekly: 7, monthly: 30, quarterly: 90, yearly: 365 }[data.type];
    const start = new Date(now.getTime() - daysBack * 86400000);
    const [{ count: trendCount }, { count: newsCount }, { count: kwCount }, { count: oppCount }] = await Promise.all([
      context.supabase.from("market_trends").select("id", { count: "exact", head: true }).gte("detected_at", start.toISOString()),
      context.supabase.from("industry_news").select("id", { count: "exact", head: true }).gte("created_at", start.toISOString()),
      context.supabase.from("keyword_trends").select("id", { count: "exact", head: true }).gte("detected_at", start.toISOString()),
      context.supabase.from("content_opportunities").select("id", { count: "exact", head: true }).gte("created_at", start.toISOString()),
    ]);
    const { data: row } = await context.supabase.from("market_reports").insert({
      owner_id: context.userId,
      report_type: data.type,
      period_start: start.toISOString().slice(0, 10),
      period_end: now.toISOString().slice(0, 10),
      title: `${data.type[0].toUpperCase()}${data.type.slice(1)} Market Report`,
      metrics: { trends: trendCount ?? 0, news: newsCount ?? 0, keywords: kwCount ?? 0, opportunities: oppCount ?? 0 },
      highlights: [
        `${trendCount ?? 0} trends detected`,
        `${newsCount ?? 0} news items analyzed`,
        `${oppCount ?? 0} content opportunities suggested`,
      ],
      recommendations: [],
      generated_by: `market/${data.type}`,
      status: "ready",
    }).select("*").maybeSingle();
    return { report: row };
  });

// ---------- Industry seeds ----------
export const listIndustries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => ({ industries: INDUSTRIES }));
