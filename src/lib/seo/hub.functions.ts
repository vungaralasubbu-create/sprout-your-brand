/**
 * SEO Hub server functions.
 * Reuses existing tables (keyword_research_*, ai_seo_suggestions, tsh_*, geo_*, pseo_*,
 * blog_posts, content_items) and extends via seo_clusters / seo_pages / seo_reports /
 * seo_audits / seo_integrations. Never calls providers directly — AI work routes through
 * the central AI Router.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// ---------- Dashboard ----------
export const getSeoDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const s = context.supabase;
    const [
      keywords, clusters, pages, audits, reports, suggestions,
      tshPages, tshIssues, geoQuestions, pseoPages, blogs,
    ] = await Promise.all([
      s.from("keyword_research_keywords").select("id, monthly_volume, difficulty", { count: "exact", head: false }).limit(10000),
      s.from("seo_clusters").select("id, status", { count: "exact", head: false }),
      s.from("seo_pages").select("id, seo_score, content_score", { count: "exact", head: false }).limit(10000),
      s.from("seo_audits").select("id, status, score, started_at").order("started_at", { ascending: false }).limit(10),
      s.from("seo_reports").select("id, report_type").order("period_end", { ascending: false }).limit(1),
      s.from("ai_seo_suggestions").select("id, status", { count: "exact", head: true }),
      s.from("tsh_pages").select("id", { count: "exact", head: true }),
      s.from("tsh_issues").select("id, severity", { count: "exact", head: false }).eq("status", "open").limit(5000),
      s.from("geo_questions").select("id", { count: "exact", head: true }),
      s.from("pseo_pages").select("id", { count: "exact", head: true }),
      s.from("blog_posts").select("id, status", { count: "exact", head: false }).eq("status", "published").limit(5000),
    ]);

    const kwRows = keywords.data ?? [];
    const pageRows = pages.data ?? [];
    const tshIssueRows = tshIssues.data ?? [];
    const avgSeoScore = pageRows.length
      ? Math.round(pageRows.reduce((a, r) => a + (r.seo_score ?? 0), 0) / pageRows.length)
      : 0;
    const avgContentScore = pageRows.length
      ? Math.round(pageRows.reduce((a, r) => a + (r.content_score ?? 0), 0) / pageRows.length)
      : 0;
    const criticalIssues = tshIssueRows.filter((i) => i.severity === "critical" || i.severity === "high").length;

    return {
      organicTraffic: null as number | null, // pending Google Search Console integration
      indexedPages: pseoPages.count ?? 0,
      keywordRankings: kwRows.length,
      topKeywordsCount: kwRows.filter((k) => (k.monthly_volume ?? 0) > 1000).length,
      totalPages: pageRows.length,
      totalBlogs: blogs.count ?? 0,
      ctr: null as number | null,
      avgPosition: null as number | null,
      backlinks: null as number | null,
      technicalHealth: Math.max(0, 100 - criticalIssues * 5),
      contentScore: avgContentScore,
      seoScore: avgSeoScore,
      clusters: clusters.count ?? 0,
      suggestions: suggestions.count ?? 0,
      audits: audits.data ?? [],
      lastReport: reports.data?.[0] ?? null,
      geoQuestions: geoQuestions.count ?? 0,
      tshPagesCrawled: tshPages.count ?? 0,
      openIssues: tshIssueRows.length,
    };
  });

// ---------- Keyword groups ----------
export const listKeywordGroups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("keyword_research_keywords")
      .select("cluster, category, intent, keyword, monthly_volume, difficulty")
      .limit(2000);
    const groups = new Map<string, { name: string; keywords: number; totalVolume: number; avgDifficulty: number; intents: Set<string> }>();
    for (const r of data ?? []) {
      const key = (r.cluster || r.category || "Ungrouped") as string;
      const g = groups.get(key) ?? { name: key, keywords: 0, totalVolume: 0, avgDifficulty: 0, intents: new Set<string>() };
      g.keywords += 1;
      g.totalVolume += r.monthly_volume ?? 0;
      g.avgDifficulty = Math.round(((g.avgDifficulty * (g.keywords - 1)) + (r.difficulty ?? 0)) / g.keywords);
      if (r.intent) g.intents.add(r.intent);
      groups.set(key, g);
    }
    return {
      groups: [...groups.values()].map((g) => ({
        name: g.name,
        keywords: g.keywords,
        totalVolume: g.totalVolume,
        avgDifficulty: g.avgDifficulty,
        intents: [...g.intents],
      })).sort((a, b) => b.totalVolume - a.totalVolume),
    };
  });

// ---------- Clusters ----------
export const listClusters = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("seo_clusters")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(200);
    return { clusters: data ?? [] };
  });

export const upsertCluster = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1),
    category: z.string().optional(),
    pillar_title: z.string().optional(),
    pillar_url: z.string().optional(),
    target_keyword: z.string().optional(),
    supporting_keywords: z.array(z.string()).optional(),
    intent: z.string().optional(),
    status: z.string().optional(),
    description: z.string().optional(),
  }).parse(v))
  .handler(async ({ data, context }) => {
    if (data.id) {
      const { data: row } = await context.supabase.from("seo_clusters").update({
        name: data.name, category: data.category ?? null, pillar_title: data.pillar_title ?? null,
        pillar_url: data.pillar_url ?? null, target_keyword: data.target_keyword ?? null,
        supporting_keywords: data.supporting_keywords ?? [], intent: data.intent ?? null,
        status: data.status ?? "draft", description: data.description ?? null,
      }).eq("id", data.id).select("*").maybeSingle();
      return { cluster: row };
    }
    const { data: row } = await context.supabase.from("seo_clusters").insert({
      owner_id: context.userId, name: data.name, category: data.category ?? null,
      pillar_title: data.pillar_title ?? null, pillar_url: data.pillar_url ?? null,
      target_keyword: data.target_keyword ?? null, supporting_keywords: data.supporting_keywords ?? [],
      intent: data.intent ?? null, status: data.status ?? "draft", description: data.description ?? null,
    }).select("*").maybeSingle();
    return { cluster: row };
  });

export const deleteCluster = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    await context.supabase.from("seo_clusters").delete().eq("id", data.id);
    return { ok: true };
  });

// ---------- Pages ----------
export const listSeoPages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("seo_pages")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(500);
    return { pages: data ?? [] };
  });

// ---------- Reports ----------
export const listReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("seo_reports")
      .select("*")
      .order("period_end", { ascending: false })
      .limit(50);
    return { reports: data ?? [] };
  });

export const generateReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ type: z.enum(["daily","weekly","monthly","quarterly","yearly"]) }).parse(v))
  .handler(async ({ data, context }) => {
    const now = new Date();
    const end = now.toISOString().slice(0, 10);
    const daysBack = { daily: 1, weekly: 7, monthly: 30, quarterly: 90, yearly: 365 }[data.type];
    const start = new Date(now.getTime() - daysBack * 86400000).toISOString().slice(0, 10);

    const [{ count: kwCount }, { count: clusterCount }, { count: pageCount }, { data: issues }] = await Promise.all([
      context.supabase.from("keyword_research_keywords").select("id", { count: "exact", head: true }),
      context.supabase.from("seo_clusters").select("id", { count: "exact", head: true }),
      context.supabase.from("seo_pages").select("id", { count: "exact", head: true }),
      context.supabase.from("tsh_issues").select("severity").eq("status", "open"),
    ]);

    const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 } as Record<string, number>;
    for (const i of issues ?? []) if (i.severity && bySeverity[i.severity] !== undefined) bySeverity[i.severity]++;

    const { data: row } = await context.supabase.from("seo_reports").insert({
      owner_id: context.userId,
      report_type: data.type,
      period_start: start, period_end: end,
      metrics: { keywords: kwCount ?? 0, clusters: clusterCount ?? 0, pages: pageCount ?? 0, issues_by_severity: bySeverity },
      highlights: [`${kwCount ?? 0} keywords tracked`, `${clusterCount ?? 0} topic clusters`, `${pageCount ?? 0} pages`],
      recommendations: [],
      generated_by: `report/${data.type}`,
      status: "ready",
    }).select("*").maybeSingle();

    return { report: row };
  });

// ---------- Audits ----------
export const runQuickAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ target: z.string().optional() }).parse(v ?? {}))
  .handler(async ({ data, context }) => {
    const started = new Date().toISOString();
    const { data: issues } = await context.supabase
      .from("tsh_issues")
      .select("severity, category, title")
      .eq("status", "open")
      .limit(200);
    const summary = {
      total: issues?.length ?? 0,
      critical: (issues ?? []).filter((i) => i.severity === "critical").length,
      high: (issues ?? []).filter((i) => i.severity === "high").length,
      medium: (issues ?? []).filter((i) => i.severity === "medium").length,
      low: (issues ?? []).filter((i) => i.severity === "low").length,
    };
    const score = Math.max(0, 100 - summary.critical * 8 - summary.high * 4 - summary.medium * 2);
    const { data: row } = await context.supabase.from("seo_audits").insert({
      owner_id: context.userId,
      target_type: "site",
      target_ref: data.target ?? null,
      status: "completed",
      score,
      issues: (issues ?? []).slice(0, 100) as never,
      summary: summary as never,
      started_at: started,
      completed_at: new Date().toISOString(),
    }).select("*").maybeSingle();
    return { audit: row };
  });

// ---------- Integrations (placeholder architecture) ----------
export const listIntegrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("seo_integrations")
      .select("*")
      .order("provider", { ascending: true });
    const known = ["google_search_console", "google_analytics", "bing_webmaster", "ahrefs", "semrush", "moz"];
    const rows = data ?? [];
    const byProvider = new Map(rows.map((r) => [r.provider, r]));
    return {
      integrations: known.map((p) => byProvider.get(p) ?? {
        provider: p, status: "not_connected", config: {}, last_synced_at: null,
      }),
    };
  });

// ---------- AI: keyword expansion + topic cluster generation via central AI Router ----------
export const aiSuggestNextContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ topic: z.string().min(1) }).parse(v))
  .handler(async ({ data, context }) => {
    // Reuse existing ai-router — never call providers directly.
    const { aiChat } = await import("@/lib/ai/router.server");
    const out = await aiChat({
      system: "You are Glintr's SEO strategist. Return JSON: { next_blog, next_landing_page, next_keyword, next_campaign, next_faq, next_course_topic }. Each field is a single actionable string with strong search intent.",
      messages: [{ role: "user", content: `Topic: ${data.topic}\nSuggest the next content assets Glintr should publish.` }],
      responseFormat: "json",
    });
    return { suggestions: typeof out === "string" ? { text: out } : (out as Record<string, string>) };
  });
