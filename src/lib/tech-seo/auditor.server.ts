// Site auditor — orchestrates page fetch, analysis, issue detection, scoring.
// Pure Web-standard APIs (fetch, Blob) — safe for Cloudflare Workers.

import { analyzeHtml, headingIssues, readabilityScore } from "./analyzer.server";
import { computeSiteHealthScore, DEFAULT_TSH_WEIGHTS } from "./scoring.server";
import { TSH_ISSUE_CODES } from "./constants";

type Sb = { from: (t: string) => any };

export type AuditPageResult = {
  url: string;
  status: number;
  responseTimeMs: number;
  issues: AuditIssue[];
  score: ReturnType<typeof computeSiteHealthScore>;
  pageId?: string;
};

export type AuditIssue = {
  category: string;
  code: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  detail?: string;
  recommendation?: string;
  evidence?: any;
};

async function fetchPage(url: string, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: {
        "User-Agent": "GlintrTechSEO/1.0 (+https://glintr.com)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
    });
    const status = res.status;
    const location = res.headers.get("location");
    let html = "";
    if (status >= 200 && status < 300) {
      html = await res.text();
    }
    return {
      status,
      html,
      location,
      responseTimeMs: Date.now() - started,
      contentType: res.headers.get("content-type"),
    };
  } catch (err) {
    return {
      status: 0,
      html: "",
      location: null,
      responseTimeMs: Date.now() - started,
      contentType: null,
      error: (err as Error).message,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function followRedirectChain(startUrl: string, max = 5) {
  const chain: Array<{ url: string; status: number; location: string | null }> = [];
  let current = startUrl;
  for (let i = 0; i < max; i++) {
    const r = await fetchPage(current);
    chain.push({ url: current, status: r.status, location: r.location });
    if (r.status >= 300 && r.status < 400 && r.location) {
      current = new URL(r.location, current).toString();
      continue;
    }
    return { chain, final: r };
  }
  return { chain, final: null };
}

function detectIssues(url: string, signals: ReturnType<typeof analyzeHtml>, statusCode: number, responseTimeMs: number, htmlBytes: number): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const push = (i: AuditIssue) => issues.push(i);

  if (statusCode >= 500) {
    push({ category: "crawl", code: TSH_ISSUE_CODES.SERVER_5XX, severity: "critical", title: `Server error ${statusCode}` });
    return issues;
  }
  if (statusCode === 404) {
    push({ category: "crawl", code: TSH_ISSUE_CODES.PAGE_404, severity: "high", title: "Page returns 404" });
    return issues;
  }
  if (statusCode < 200 || statusCode >= 400) {
    push({ category: "crawl", code: "http_bad_status", severity: "high", title: `HTTP ${statusCode}` });
  }

  // Title
  if (!signals.title) push({ category: "title_meta", code: TSH_ISSUE_CODES.TITLE_MISSING, severity: "high", title: "Missing <title>" });
  else {
    if (signals.title.length < 20) push({ category: "title_meta", code: TSH_ISSUE_CODES.TITLE_TOO_SHORT, severity: "medium", title: `Title too short (${signals.title.length} chars)` });
    if (signals.title.length > 70) push({ category: "title_meta", code: TSH_ISSUE_CODES.TITLE_TOO_LONG, severity: "medium", title: `Title too long (${signals.title.length} chars)` });
  }
  if (!signals.metaDescription) push({ category: "title_meta", code: TSH_ISSUE_CODES.META_MISSING, severity: "high", title: "Missing meta description" });
  else if (signals.metaDescription.length < 50) push({ category: "title_meta", code: TSH_ISSUE_CODES.META_WEAK, severity: "medium", title: "Meta description too short" });

  if (!signals.ogTitle) push({ category: "title_meta", code: TSH_ISSUE_CODES.OG_MISSING, severity: "low", title: "Missing Open Graph tags" });
  if (!signals.twitterCard) push({ category: "title_meta", code: TSH_ISSUE_CODES.TWITTER_MISSING, severity: "low", title: "Missing Twitter Card" });

  // Canonical & robots
  if (!signals.canonical) push({ category: "canonical", code: TSH_ISSUE_CODES.CANONICAL_MISSING, severity: "medium", title: "Missing canonical link" });
  if (signals.robots && /noindex/i.test(signals.robots)) {
    push({ category: "indexing", code: TSH_ISSUE_CODES.NOINDEX_ON_INDEXABLE, severity: "medium", title: "Page has noindex", detail: signals.robots });
  }

  // Headings
  if (signals.h1Count === 0) push({ category: "content", code: TSH_ISSUE_CODES.H1_MISSING, severity: "high", title: "Missing H1" });
  if (signals.h1Count > 1) push({ category: "content", code: TSH_ISSUE_CODES.HEADING_STRUCTURE, severity: "medium", title: `Multiple H1 tags (${signals.h1Count})` });
  const headProblems = headingIssues(signals.headingsOrder);
  if (headProblems.length) push({ category: "content", code: TSH_ISSUE_CODES.HEADING_STRUCTURE, severity: "low", title: "Heading structure issues", evidence: headProblems });

  // Content
  if (signals.wordCount < 200) push({ category: "content", code: TSH_ISSUE_CODES.THIN_CONTENT, severity: "high", title: `Thin content (${signals.wordCount} words)` });
  else if (signals.wordCount < 400) push({ category: "content", code: TSH_ISSUE_CODES.LOW_WORD_COUNT, severity: "low", title: `Low word count (${signals.wordCount} words)` });

  const readability = readabilityScore(signals.text);
  if (readability < 30 && signals.wordCount > 300) push({ category: "content", code: TSH_ISSUE_CODES.LOW_READABILITY, severity: "medium", title: `Low readability (Flesch ${readability})` });

  // Images
  for (const img of signals.images) {
    if (!img.alt) push({ category: "image", code: TSH_ISSUE_CODES.IMG_ALT_MISSING, severity: "medium", title: "Image missing alt", detail: img.src.slice(0, 200) });
    if (!img.width || !img.height) push({ category: "image", code: TSH_ISSUE_CODES.IMG_DIMENSIONS_MISSING, severity: "low", title: "Image missing dimensions", detail: img.src.slice(0, 200) });
    if (img.format && !["webp", "avif", "svg"].includes(img.format)) push({ category: "image", code: TSH_ISSUE_CODES.IMG_FORMAT_LEGACY, severity: "low", title: `Legacy image format ${img.format}`, detail: img.src.slice(0, 200) });
    if (!img.loading) push({ category: "image", code: TSH_ISSUE_CODES.IMG_LAZY_MISSING, severity: "low", title: "Image missing loading=lazy", detail: img.src.slice(0, 200) });
  }

  // Mobile
  if (!signals.viewport) push({ category: "mobile", code: TSH_ISSUE_CODES.MOBILE_VIEWPORT_MISSING, severity: "high", title: "Missing viewport meta" });

  // Security signals inferred from HTML
  if (signals.hasHttpsMixed) push({ category: "security", code: TSH_ISSUE_CODES.SEC_MIXED_CONTENT, severity: "high", title: "Mixed HTTP/HTTPS content" });

  // Performance / size
  if (htmlBytes > 400_000) push({ category: "performance", code: TSH_ISSUE_CODES.LARGE_PAGE, severity: "medium", title: `Large HTML payload (${Math.round(htmlBytes / 1024)} KB)` });
  if (responseTimeMs > 1500) push({ category: "performance", code: TSH_ISSUE_CODES.SLOW_PAGE, severity: "medium", title: `Slow response (${responseTimeMs} ms)` });

  // Schema
  if (signals.jsonLd.length === 0) push({ category: "schema", code: TSH_ISSUE_CODES.SCHEMA_MISSING_FIELDS, severity: "low", title: "No JSON-LD structured data found" });
  for (const s of signals.jsonLd) {
    if (s && s["@type"] === "Article" && !s.headline) push({ category: "schema", code: TSH_ISSUE_CODES.SCHEMA_MISSING_FIELDS, severity: "medium", title: "Article schema missing headline" });
    if (s && s["@type"] === "Course" && !s.provider) push({ category: "schema", code: TSH_ISSUE_CODES.SCHEMA_MISSING_FIELDS, severity: "medium", title: "Course schema missing provider" });
  }

  return issues;
}

export async function auditUrl(url: string): Promise<AuditPageResult> {
  const redirect = await followRedirectChain(url);
  const finalR = redirect.final;
  const chainLen = redirect.chain.length;

  const status = finalR?.status ?? redirect.chain[redirect.chain.length - 1]?.status ?? 0;
  const html = finalR?.html ?? "";
  const responseTimeMs = finalR?.responseTimeMs ?? 0;

  const signals = analyzeHtml(html);
  const issues = detectIssues(url, signals, status, responseTimeMs, signals.htmlBytes);

  if (chainLen > 2) {
    issues.unshift({
      category: "redirects",
      code: TSH_ISSUE_CODES.REDIRECT_CHAIN,
      severity: "medium",
      title: `Redirect chain (${chainLen} hops)`,
      evidence: redirect.chain,
    });
  }
  const seen = new Set<string>();
  for (const c of redirect.chain) {
    if (seen.has(c.url)) {
      issues.unshift({
        category: "redirects",
        code: TSH_ISSUE_CODES.REDIRECT_LOOP,
        severity: "critical",
        title: "Redirect loop detected",
        evidence: redirect.chain,
      });
      break;
    }
    seen.add(c.url);
  }

  const score = computeSiteHealthScore({
    signals,
    statusCode: status,
    responseTimeMs,
    isIndexable: !(signals.robots && /noindex/i.test(signals.robots)),
    isCanonicalOk: !!signals.canonical,
    hasBrokenLinks: false,
    hasSchema: signals.jsonLd.length > 0,
  }, DEFAULT_TSH_WEIGHTS);

  return { url, status, responseTimeMs, issues, score };
}

/** Persist audit result: upsert tsh_pages, insert issues, upsert score. */
export async function persistAuditResult(sb: Sb, runId: string | null, result: AuditPageResult) {
  const path = new URL(result.url).pathname;
  const { data: pageRow, error: pageErr } = await sb
    .from("tsh_pages")
    .upsert(
      {
        url: result.url,
        path,
        status_code: result.status,
        response_time_ms: result.responseTimeMs,
        last_crawled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "url" },
    )
    .select("id")
    .maybeSingle();
  if (pageErr) throw pageErr;

  const pageId = pageRow?.id ?? null;

  if (result.issues.length) {
    const rows = result.issues.map((i) => ({
      run_id: runId,
      page_id: pageId,
      url: result.url,
      category: i.category,
      code: i.code,
      severity: i.severity,
      title: i.title,
      detail: i.detail ?? null,
      recommendation: i.recommendation ?? null,
      evidence: i.evidence ?? {},
      status: "open",
      last_seen_at: new Date().toISOString(),
    }));
    // upsert-like: bump last_seen for open dupes via UNIQUE(page_id,code) WHERE status='open'
    for (const row of rows) {
      const { error } = await sb
        .from("tsh_issues")
        .upsert(row, {
          onConflict: "page_id,code",
          ignoreDuplicates: false,
        });
      if (error) {
        // fallback: just insert
        await sb.from("tsh_issues").insert(row);
      }
    }
  }

  await sb.from("tsh_page_scores").upsert(
    {
      page_id: pageId,
      url: result.url,
      technical: result.score.technical,
      content_quality: result.score.content_quality,
      metadata: result.score.metadata,
      performance: result.score.performance,
      accessibility: result.score.accessibility,
      internal_linking: result.score.internal_linking,
      schema_health: result.score.schema_health,
      mobile: result.score.mobile,
      ai_readiness: result.score.ai_readiness,
      overall: result.score.overall,
      breakdown: result.score.breakdown,
      computed_at: new Date().toISOString(),
    },
    { onConflict: "url" },
  );

  return { pageId, issues: result.issues.length };
}

/** Audit a batch of URLs sequentially (bounded concurrency). */
export async function auditBatch(sb: Sb, runId: string, urls: string[], concurrency = 3) {
  let totalIssues = 0;
  const queue = [...urls];
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length) {
      const u = queue.shift();
      if (!u) break;
      try {
        const r = await auditUrl(u);
        const persisted = await persistAuditResult(sb, runId, r);
        totalIssues += persisted.issues;
      } catch (err) {
        await sb.from("tsh_issues").insert({
          run_id: runId,
          url: u,
          category: "crawl",
          code: "audit_error",
          severity: "medium",
          title: "Audit crawl error",
          detail: (err as Error).message.slice(0, 400),
        });
      }
    }
  });
  await Promise.all(workers);
  return { pagesScanned: urls.length, issuesFound: totalIssues };
}
