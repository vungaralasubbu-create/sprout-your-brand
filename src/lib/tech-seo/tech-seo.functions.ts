// Enterprise Technical SEO & Site Health Center — admin-gated server functions.
// Purely additive. All AI generation flows through the centralized AI Router
// (OpenAI). No Lovable AI runtime or Lovable AI credits.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import {
  auditBatch,
  auditUrl,
  persistAuditResult,
} from "./auditor.server";
import {
  validateRobots,
  validateSitemap,
} from "./sitemap-validator.server";
import { generateReportSummary } from "./report-writer.server";
import { CWV_THRESHOLDS, TSH_ISSUE_CODES } from "./constants";

type Ctx = { supabase: any; userId: string };

async function requireAdmin(ctx: Ctx) {
  for (const role of ["super_admin", "admin"] as const) {
    const { data } = await ctx.supabase.rpc("has_role", {
      _user_id: ctx.userId,
      _role: role,
    });
    if (data === true) return true;
  }
  throw new Error("Forbidden: Technical SEO requires admin role");
}

async function getBaseUrl(sb: any): Promise<string> {
  const { data } = await sb
    .from("tsh_settings")
    .select("base_url")
    .limit(1)
    .maybeSingle();
  return (data?.base_url ?? "https://glintr.com").replace(/\/$/, "");
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit runs
// ─────────────────────────────────────────────────────────────────────────────

export const startAuditRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        kind: z.enum(["full", "sample", "urls", "sitemap", "robots"]),
        urls: z.array(z.string()).optional(),
        maxPages: z.number().min(1).max(2000).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as Ctx);
    const sb = (context as Ctx).supabase;
    const base = await getBaseUrl(sb);

    const { data: run, error } = await sb
      .from("tsh_audit_runs")
      .insert({
        kind: data.kind,
        status: "running",
        started_at: new Date().toISOString(),
        triggered_by: (context as Ctx).userId,
        config: { maxPages: data.maxPages ?? 100 },
      })
      .select("id")
      .maybeSingle();
    if (error) throw error;
    const runId = run!.id as string;

    let urls: string[] = [];
    if (data.kind === "urls" && data.urls?.length) {
      urls = data.urls;
    } else if (data.kind === "sample" || data.kind === "full") {
      const { data: pages } = await sb
        .from("tsh_pages")
        .select("url")
        .limit(data.maxPages ?? 100);
      urls = (pages ?? []).map((p: any) => p.url as string);
      if (!urls.length) {
        urls = [`${base}/`, `${base}/programs`, `${base}/blog`, `${base}/about`];
      }
    }

    let summary: any = { pagesScanned: 0, issuesFound: 0 };
    if (data.kind === "sitemap") {
      const results = await Promise.all([
        `${base}/sitemap.xml`,
        `${base}/sitemap-courses.xml`,
        `${base}/sitemap-blog.xml`,
      ].map((u) => validateSitemap(sb, u)));
      summary = { sitemaps: results };
    } else if (data.kind === "robots") {
      summary = { robots: await validateRobots(base) };
    } else if (urls.length) {
      summary = await auditBatch(sb, runId, urls);
    }

    await sb
      .from("tsh_audit_runs")
      .update({
        status: "completed",
        finished_at: new Date().toISOString(),
        pages_scanned: summary.pagesScanned ?? 0,
        issues_found: summary.issuesFound ?? 0,
      })
      .eq("id", runId);

    return { runId, summary };
  });

export const auditSingleUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ url: z.string().url() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as Ctx);
    const sb = (context as Ctx).supabase;
    const result = await auditUrl(data.url);
    await persistAuditResult(sb, null, result);
    return {
      status: result.status,
      responseTimeMs: result.responseTimeMs,
      overall: result.score.overall,
      issues: result.issues.length,
      score: result.score,
      topIssues: result.issues.slice(0, 20),
    };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Core Web Vitals ingest (PSI / RUM — external caller provides values)
// ─────────────────────────────────────────────────────────────────────────────

export const ingestCoreWebVitals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        url: z.string().url(),
        device: z.enum(["mobile", "desktop"]).default("mobile"),
        lcp: z.number().nullable().optional(),
        inp: z.number().nullable().optional(),
        cls: z.number().nullable().optional(),
        fcp: z.number().nullable().optional(),
        ttfb: z.number().nullable().optional(),
        tbt: z.number().nullable().optional(),
        speed_index: z.number().nullable().optional(),
        source: z.string().default("psi"),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as Ctx);
    const sb = (context as Ctx).supabase;
    await sb.from("tsh_core_web_vitals").insert({
      url: data.url,
      device: data.device,
      lcp: data.lcp ?? null,
      inp: data.inp ?? null,
      cls: data.cls ?? null,
      fcp: data.fcp ?? null,
      ttfb: data.ttfb ?? null,
      tbt: data.tbt ?? null,
      speed_index: data.speed_index ?? null,
      source: data.source,
    });

    // Fire issues for poor thresholds.
    const rows: any[] = [];
    if (data.lcp && data.lcp > CWV_THRESHOLDS.lcp.poor)
      rows.push({ url: data.url, category: "core_web_vitals", code: TSH_ISSUE_CODES.CWV_LCP_POOR, severity: "high", title: `Poor LCP (${data.lcp}ms)` });
    if (data.inp && data.inp > CWV_THRESHOLDS.inp.poor)
      rows.push({ url: data.url, category: "core_web_vitals", code: TSH_ISSUE_CODES.CWV_INP_POOR, severity: "high", title: `Poor INP (${data.inp}ms)` });
    if (data.cls && data.cls > CWV_THRESHOLDS.cls.poor)
      rows.push({ url: data.url, category: "core_web_vitals", code: TSH_ISSUE_CODES.CWV_CLS_POOR, severity: "high", title: `Poor CLS (${data.cls})` });
    if (rows.length) await sb.from("tsh_issues").insert(rows);
    return { ok: true, issues: rows.length };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Sitemap & robots
// ─────────────────────────────────────────────────────────────────────────────

export const validateAllSitemaps = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ sitemaps: z.array(z.string().url()).optional() }).parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as Ctx);
    const sb = (context as Ctx).supabase;
    const base = await getBaseUrl(sb);
    const defaults = [
      `${base}/sitemap.xml`,
      `${base}/sitemap-courses.xml`,
      `${base}/sitemap-blog.xml`,
      `${base}/sitemap-careers.xml`,
      `${base}/sitemap-projects.xml`,
      `${base}/sitemap-companies.xml`,
      `${base}/sitemap-interviews.xml`,
      `${base}/sitemap-locations.xml`,
    ];
    const list = data.sitemaps?.length ? data.sitemaps : defaults;
    const results = await Promise.all(list.map((u) => validateSitemap(sb, u)));
    return { results };
  });

export const validateRobotsTxt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context as Ctx);
    const sb = (context as Ctx).supabase;
    const base = await getBaseUrl(sb);
    return await validateRobots(base);
  });

// ─────────────────────────────────────────────────────────────────────────────
// Issues, alerts, review workflow
// ─────────────────────────────────────────────────────────────────────────────

export const listIssues = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        status: z.enum(["open", "resolved", "ignored"]).optional(),
        severity: z.enum(["low", "medium", "high", "critical"]).optional(),
        category: z.string().optional(),
        url: z.string().optional(),
        limit: z.number().min(1).max(500).optional(),
      })
      .parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as Ctx);
    let q = (context as Ctx).supabase
      .from("tsh_issues")
      .select("*")
      .order("last_seen_at", { ascending: false })
      .limit(data.limit ?? 100);
    if (data.status) q = q.eq("status", data.status);
    if (data.severity) q = q.eq("severity", data.severity);
    if (data.category) q = q.eq("category", data.category);
    if (data.url) q = q.eq("url", data.url);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const reviewIssue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        action: z.enum(["resolve", "ignore", "reopen"]),
        reason: z.string().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as Ctx);
    const sb = (context as Ctx).supabase;
    const status =
      data.action === "resolve"
        ? "resolved"
        : data.action === "ignore"
          ? "ignored"
          : "open";
    await sb
      .from("tsh_issues")
      .update({
        status,
        resolved_at: status === "resolved" ? new Date().toISOString() : null,
        ignored_reason: data.action === "ignore" ? data.reason ?? null : null,
        reviewed_by: (context as Ctx).userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    return { ok: true };
  });

export const acknowledgeAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context as Ctx);
    await (context as Ctx).supabase
      .from("tsh_alerts")
      .update({
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: (context as Ctx).userId,
      })
      .eq("id", data.id);
    return { ok: true };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Dashboards
// ─────────────────────────────────────────────────────────────────────────────

export const getSiteHealthDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context as Ctx);
    const sb = (context as Ctx).supabase;
    const [issuesAgg, scoresAgg, cwvRecent, runs, alerts] = await Promise.all([
      sb.from("tsh_issues").select("severity, status, category"),
      sb.from("tsh_page_scores").select("overall, technical, content_quality, metadata, performance, accessibility, internal_linking, schema_health, mobile, ai_readiness").limit(5000),
      sb.from("tsh_core_web_vitals").select("*").order("measured_at", { ascending: false }).limit(200),
      sb.from("tsh_audit_runs").select("*").order("created_at", { ascending: false }).limit(10),
      sb.from("tsh_alerts").select("*").is("acknowledged_at", null).order("created_at", { ascending: false }).limit(20),
    ]);
    const issues = issuesAgg.data ?? [];
    const openIssues = issues.filter((i: any) => i.status === "open");
    const byCategory: Record<string, number> = {};
    for (const i of openIssues) byCategory[i.category] = (byCategory[i.category] ?? 0) + 1;

    const scores: any[] = scoresAgg.data ?? [];
    const avg = (k: string) =>
      scores.length ? scores.reduce((s, r) => s + (Number(r[k]) || 0), 0) / scores.length : 0;

    return {
      totals: {
        pages_scored: scores.length,
        issues_open: openIssues.length,
        critical: openIssues.filter((i: any) => i.severity === "critical").length,
        high: openIssues.filter((i: any) => i.severity === "high").length,
        medium: openIssues.filter((i: any) => i.severity === "medium").length,
        low: openIssues.filter((i: any) => i.severity === "low").length,
        alerts_active: (alerts.data ?? []).length,
      },
      averages: {
        overall: avg("overall"),
        technical: avg("technical"),
        content_quality: avg("content_quality"),
        metadata: avg("metadata"),
        performance: avg("performance"),
        accessibility: avg("accessibility"),
        internal_linking: avg("internal_linking"),
        schema_health: avg("schema_health"),
        mobile: avg("mobile"),
        ai_readiness: avg("ai_readiness"),
      },
      byCategory,
      recentRuns: runs.data ?? [],
      recentCwv: cwvRecent.data ?? [],
      alerts: alerts.data ?? [],
    };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Automated reports
// ─────────────────────────────────────────────────────────────────────────────

export const generateReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        kind: z.enum([
          "daily",
          "weekly",
          "monthly",
          "critical",
          "trend",
          "content_quality",
        ]),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as Ctx);
    const sb = (context as Ctx).supabase;
    const [issues, scores] = await Promise.all([
      sb.from("tsh_issues").select("severity, status, code, category").eq("status", "open"),
      sb.from("tsh_page_scores").select("overall").limit(5000),
    ]);
    const open = issues.data ?? [];
    const counts: Record<string, { count: number; category: string }> = {};
    for (const r of open) {
      const k = r.code as string;
      counts[k] = counts[k] ?? { count: 0, category: r.category };
      counts[k].count += 1;
    }
    const topIssues = Object.entries(counts)
      .map(([code, v]) => ({ code, count: v.count, category: v.category }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    const avg = (scores.data ?? []).length
      ? (scores.data ?? []).reduce((s: number, r: any) => s + (Number(r.overall) || 0), 0) /
        (scores.data ?? []).length
      : 0;
    const totals = {
      pages: (scores.data ?? []).length,
      issues_open: open.length,
      critical: open.filter((i: any) => i.severity === "critical").length,
      high: open.filter((i: any) => i.severity === "high").length,
      medium: open.filter((i: any) => i.severity === "medium").length,
      low: open.filter((i: any) => i.severity === "low").length,
      avg_overall_score: avg,
    };
    const ai_summary = await generateReportSummary({ kind: data.kind, totals, topIssues });
    const { data: report } = await sb
      .from("tsh_reports")
      .insert({
        kind: data.kind,
        summary: { totals, topIssues },
        ai_summary,
        generated_by: (context as Ctx).userId,
      })
      .select("*")
      .maybeSingle();
    return report;
  });

export const listReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ limit: z.number().optional() }).parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as Ctx);
    const { data: rows } = await (context as Ctx).supabase
      .from("tsh_reports")
      .select("*")
      .order("generated_at", { ascending: false })
      .limit(data.limit ?? 50);
    return rows ?? [];
  });

// ─────────────────────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────────────────────

export const getTshSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context as Ctx);
    const { data } = await (context as Ctx).supabase
      .from("tsh_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    return data;
  });

export const updateTshSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        base_url: z.string().url().optional(),
        audit_frequency: z.enum(["hourly", "daily", "weekly"]).optional(),
        scoring_weights: z.record(z.number()).optional(),
        severity_rules: z.record(z.any()).optional(),
        ignored_urls: z.array(z.string()).optional(),
        ignored_file_types: z.array(z.string()).optional(),
        report_schedule: z.record(z.boolean()).optional(),
        notification_prefs: z.record(z.any()).optional(),
        psi_enabled: z.boolean().optional(),
        max_pages_per_run: z.number().min(1).max(10000).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as Ctx);
    const sb = (context as Ctx).supabase;
    const { data: existing } = await sb
      .from("tsh_settings")
      .select("id")
      .limit(1)
      .maybeSingle();
    const patch = {
      ...data,
      updated_at: new Date().toISOString(),
      updated_by: (context as Ctx).userId,
    };
    if (existing?.id) await sb.from("tsh_settings").update(patch).eq("id", existing.id);
    else await sb.from("tsh_settings").insert(patch);
    return { ok: true };
  });
