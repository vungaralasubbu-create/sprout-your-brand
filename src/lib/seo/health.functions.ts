/**
 * SEO Health Center — live URL crawler + database audit.
 *
 * Performs 15 SEO checks on a configurable URL set and returns
 * per-URL findings plus actionable recommendations.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type HealthSeverity = "critical" | "warning" | "info";

export interface HealthIssue {
  code: string;
  label: string;
  severity: HealthSeverity;
  detail?: string;
  recommendation: string;
}

export interface UrlHealth {
  url: string;
  status: number;
  ms: number;
  bytes: number;
  title: string | null;
  description: string | null;
  canonical: string | null;
  h1Count: number;
  wordCount: number;
  imageCount: number;
  imagesMissingAlt: number;
  largeImages: Array<{ src: string; note: string }>;
  hasJsonLd: boolean;
  hasSchemaOrg: boolean;
  hasRobotsMeta: boolean;
  robotsMeta: string | null;
  issues: HealthIssue[];
}

export interface HealthReport {
  generatedAt: string;
  base: string;
  scanned: number;
  totals: Record<HealthSeverity, number>;
  buckets: Record<string, number>;
  urls: UrlHealth[];
  brokenLinks: Array<{ from: string; to: string; status: number }>;
  redirectChains: Array<{ from: string; hops: string[]; final: string }>;
  duplicates: {
    titles: Array<{ value: string; urls: string[] }>;
    descriptions: Array<{ value: string; urls: string[] }>;
    canonicals: Array<{ value: string; urls: string[] }>;
  };
  sitemap: {
    ok: boolean;
    url: string;
    urlCount: number;
    missingFromSitemap: string[];
    extraInSitemap: string[];
    error?: string;
  };
  robots: {
    ok: boolean;
    url: string;
    hasSitemap: boolean;
    hasUserAgent: boolean;
    disallowsAll: boolean;
    error?: string;
  };
  recommendations: Array<{
    priority: "high" | "medium" | "low";
    title: string;
    detail: string;
    affected: number;
  }>;
}

const REC: Record<string, { severity: HealthSeverity; label: string; recommendation: string }> = {
  missing_title: { severity: "critical", label: "Missing title", recommendation: "Add a unique <title> in the route head() — 50–60 chars, front-loaded with the primary keyword." },
  missing_description: { severity: "critical", label: "Missing description", recommendation: "Add a meta description in the route head() — 140–160 chars, action-oriented, with the primary keyword." },
  missing_h1: { severity: "critical", label: "Missing H1", recommendation: "Render exactly one <h1> per page reflecting the primary intent — put it in the hero above the fold." },
  multiple_h1: { severity: "warning", label: "Multiple H1 tags", recommendation: "Keep one <h1>; demote extras to <h2>/<h3> so the outline is unambiguous for AI and search engines." },
  broken_link: { severity: "critical", label: "Broken link", recommendation: "Fix or remove links returning 4xx/5xx. Prefer permanent redirects for moved pages." },
  duplicate_title: { severity: "warning", label: "Duplicate title", recommendation: "Make titles unique per URL — include the entity (course, city, topic) that differentiates the page." },
  duplicate_description: { severity: "warning", label: "Duplicate description", recommendation: "Rewrite meta descriptions to reflect each page's unique value proposition." },
  duplicate_canonical: { severity: "warning", label: "Duplicate canonical", recommendation: "Canonicals must be self-referential on distinct pages; consolidate near-duplicates or diversify content." },
  thin_page: { severity: "warning", label: "Thin page", recommendation: "Expand to 400+ words of unique, useful content with subheadings, FAQ, and internal links." },
  missing_alt: { severity: "warning", label: "Missing image ALT text", recommendation: "Add descriptive alt text (5–12 words) — decorative images should use alt=\"\"." },
  missing_schema: { severity: "warning", label: "Missing schema", recommendation: "Add JSON-LD (Course, Article, FAQPage, BreadcrumbList) via route head().scripts." },
  slow_page: { severity: "warning", label: "Slow response", recommendation: "Server response over 1s. Cache the loader, defer non-critical data, or move heavy work off the request path." },
  large_image: { severity: "info", label: "Large image", recommendation: "Serve modern formats (AVIF/WebP), size responsively, and lazy-load below the fold." },
  missing_canonical: { severity: "warning", label: "Missing canonical", recommendation: "Add <link rel=\"canonical\"> in the leaf route head().links pointing at the self-URL." },
  redirect_chain: { severity: "warning", label: "Redirect chain", recommendation: "Collapse multi-hop redirects to a single 301 to the final destination." },
  missing_sitemap: { severity: "warning", label: "Missing from sitemap", recommendation: "Add the URL to /sitemap.xml so crawlers discover and prioritize it." },
  extra_sitemap: { severity: "info", label: "URL in sitemap but not crawled", recommendation: "Verify the URL still exists and is indexable; remove stale entries." },
  noindex: { severity: "info", label: "Page is noindex", recommendation: "Remove robots noindex if the page should rank; keep it on private/admin pages." },
  missing_robots: { severity: "critical", label: "robots.txt missing", recommendation: "Publish /robots.txt with User-agent and Sitemap directives." },
  robots_disallow_all: { severity: "critical", label: "robots.txt disallows all", recommendation: "Remove the site-wide Disallow: / — it blocks all crawlers." },
};

function abs(base: string, path: string): string {
  try { return new URL(path, base).toString(); } catch { return path; }
}

function stripTags(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchWithTimeout(url: string, ms: number, method: "GET" | "HEAD" = "GET", redirect: RequestRedirect = "manual"): Promise<Response> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    return await fetch(url, { method, redirect, signal: ac.signal, headers: { "User-Agent": "GlintrSEOBot/1.0 (+https://glintr.com)" } });
  } finally {
    clearTimeout(t);
  }
}

async function checkLink(url: string): Promise<number> {
  try {
    const res = await fetchWithTimeout(url, 8000, "HEAD", "follow");
    if (res.status === 405 || res.status === 501) {
      const g = await fetchWithTimeout(url, 8000, "GET", "follow");
      return g.status;
    }
    return res.status;
  } catch {
    return 0;
  }
}

async function traceRedirects(url: string, max = 6): Promise<{ hops: string[]; final: string; status: number }> {
  const hops: string[] = [];
  let current = url;
  let last = 200;
  for (let i = 0; i < max; i++) {
    let res: Response;
    try { res = await fetchWithTimeout(current, 8000, "HEAD", "manual"); }
    catch { break; }
    last = res.status;
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) break;
      hops.push(current);
      current = new URL(loc, current).toString();
      continue;
    }
    break;
  }
  return { hops, final: current, status: last };
}

interface ParsedPage {
  title: string | null;
  description: string | null;
  canonical: string | null;
  robots: string | null;
  h1Count: number;
  text: string;
  wordCount: number;
  images: Array<{ src: string; alt: string | null; width?: number; height?: number }>;
  links: string[];
  hasJsonLd: boolean;
  hasSchemaOrg: boolean;
}

function parseHtml(html: string): ParsedPage {
  const pick = (re: RegExp) => { const m = html.match(re); return m ? m[1].trim() : null; };
  const title = pick(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = pick(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i) ?? pick(/<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i);
  const canonical = pick(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
  const robots = pick(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']*)["']/i);
  const h1Count = (html.match(/<h1[\s>]/gi) ?? []).length;
  const text = stripTags(html);
  const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const images: ParsedPage["images"] = [];
  const imgRe = /<img\b([^>]*)>/gi;
  let m: RegExpExecArray | null;
  while ((m = imgRe.exec(html)) !== null) {
    const attrs = m[1];
    const src = /src=["']([^"']+)["']/i.exec(attrs)?.[1] ?? "";
    const altMatch = /\balt=["']([^"']*)["']/i.exec(attrs);
    const w = Number(/width=["']?(\d+)/i.exec(attrs)?.[1] ?? 0);
    const h = Number(/height=["']?(\d+)/i.exec(attrs)?.[1] ?? 0);
    images.push({ src, alt: altMatch ? altMatch[1] : null, width: w || undefined, height: h || undefined });
  }
  const links: string[] = [];
  const aRe = /<a\b[^>]*href=["']([^"'#]+)["'][^>]*>/gi;
  while ((m = aRe.exec(html)) !== null) links.push(m[1]);
  const hasJsonLd = /<script[^>]+type=["']application\/ld\+json["']/i.test(html);
  const hasSchemaOrg = hasJsonLd || /schema\.org/i.test(html);
  return { title, description, canonical, robots, h1Count, text, wordCount, images, links, hasJsonLd, hasSchemaOrg };
}

function issueFor(code: string, detail?: string): HealthIssue {
  const meta = REC[code] ?? { severity: "info" as HealthSeverity, label: code, recommendation: "" };
  return { code, label: meta.label, severity: meta.severity, detail, recommendation: meta.recommendation };
}

async function fetchSitemapUrls(base: string): Promise<{ ok: boolean; urls: string[]; error?: string }> {
  try {
    const res = await fetchWithTimeout(new URL("/sitemap.xml", base).toString(), 8000, "GET", "follow");
    if (!res.ok) return { ok: false, urls: [], error: `HTTP ${res.status}` };
    const xml = await res.text();
    const urls = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]);
    return { ok: true, urls };
  } catch (e: any) {
    return { ok: false, urls: [], error: String(e?.message ?? e) };
  }
}

async function fetchRobots(base: string) {
  try {
    const res = await fetchWithTimeout(new URL("/robots.txt", base).toString(), 8000, "GET", "follow");
    if (!res.ok) return { ok: false, hasSitemap: false, hasUserAgent: false, disallowsAll: false, error: `HTTP ${res.status}` };
    const txt = await res.text();
    const hasSitemap = /^\s*Sitemap:/im.test(txt);
    const hasUserAgent = /^\s*User-agent:/im.test(txt);
    const disallowsAll = /User-agent:\s*\*[\s\S]*?Disallow:\s*\/\s*(?:\n|$)/i.test(txt) && !/Allow:\s*\//i.test(txt);
    return { ok: true, hasSitemap, hasUserAgent, disallowsAll };
  } catch (e: any) {
    return { ok: false, hasSitemap: false, hasUserAgent: false, disallowsAll: false, error: String(e?.message ?? e) };
  }
}

async function analyzeUrl(url: string, base: string): Promise<{ page: UrlHealth; internalLinks: string[]; externalLinks: string[] }> {
  const started = Date.now();
  let status = 0; let bytes = 0; let html = "";
  try {
    const res = await fetchWithTimeout(url, 12000, "GET", "follow");
    status = res.status;
    html = await res.text();
    bytes = html.length;
  } catch {}
  const ms = Date.now() - started;
  const parsed: ParsedPage = html ? parseHtml(html) : {
    title: null, description: null, canonical: null, robots: null, h1Count: 0, text: "", wordCount: 0, images: [], links: [], hasJsonLd: false, hasSchemaOrg: false,
  };

  const issues: HealthIssue[] = [];
  if (status >= 400 || status === 0) issues.push(issueFor("broken_link", `HTTP ${status}`));
  if (!parsed.title) issues.push(issueFor("missing_title"));
  if (!parsed.description) issues.push(issueFor("missing_description"));
  if (parsed.h1Count === 0) issues.push(issueFor("missing_h1"));
  if (parsed.h1Count > 1) issues.push(issueFor("multiple_h1", `${parsed.h1Count} H1 tags`));
  if (!parsed.canonical) issues.push(issueFor("missing_canonical"));
  if (parsed.wordCount > 0 && parsed.wordCount < 250) issues.push(issueFor("thin_page", `${parsed.wordCount} words`));
  const imagesMissingAlt = parsed.images.filter((i) => i.alt === null || i.alt.trim() === "").length;
  if (imagesMissingAlt > 0) issues.push(issueFor("missing_alt", `${imagesMissingAlt}/${parsed.images.length} images`));
  if (!parsed.hasSchemaOrg) issues.push(issueFor("missing_schema"));
  if (ms > 1500) issues.push(issueFor("slow_page", `${ms}ms`));
  const largeImages: UrlHealth["largeImages"] = [];
  for (const img of parsed.images) {
    if ((img.width && img.width > 2000) || (img.height && img.height > 2000)) {
      largeImages.push({ src: img.src, note: `${img.width ?? "?"}×${img.height ?? "?"}` });
    }
  }
  if (largeImages.length) issues.push(issueFor("large_image", `${largeImages.length} oversized`));
  if (parsed.robots && /noindex/i.test(parsed.robots)) issues.push(issueFor("noindex", parsed.robots));

  const baseHost = new URL(base).host;
  const internalLinks: string[] = [];
  const externalLinks: string[] = [];
  for (const href of parsed.links) {
    if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) continue;
    const absUrl = abs(base, href);
    try {
      const u = new URL(absUrl);
      if (u.host === baseHost) internalLinks.push(absUrl);
      else externalLinks.push(absUrl);
    } catch {}
  }

  return {
    page: {
      url, status, ms, bytes,
      title: parsed.title, description: parsed.description, canonical: parsed.canonical,
      h1Count: parsed.h1Count, wordCount: parsed.wordCount,
      imageCount: parsed.images.length, imagesMissingAlt,
      largeImages,
      hasJsonLd: parsed.hasJsonLd, hasSchemaOrg: parsed.hasSchemaOrg,
      hasRobotsMeta: !!parsed.robots, robotsMeta: parsed.robots,
      issues,
    },
    internalLinks,
    externalLinks,
  };
}

export const runSeoHealthCenter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { base?: string; urls?: string[]; limit?: number; checkExternal?: boolean } = {}) => data)
  .handler(async ({ data }): Promise<HealthReport> => {
    const base = (data.base ?? "https://glintr.com").replace(/\/$/, "");
    const limit = Math.min(Math.max(data.limit ?? 30, 1), 60);

    // 1. Load sitemap
    const sitemap = await fetchSitemapUrls(base);
    const robots = await fetchRobots(base);

    // 2. Determine URL set
    let urls: string[] = [];
    if (data.urls && data.urls.length) urls = data.urls.map((u) => abs(base, u));
    else if (sitemap.urls.length) urls = sitemap.urls.slice(0, limit);
    else urls = [base + "/"];
    urls = [...new Set(urls)].slice(0, limit);

    // 3. Analyze each URL in parallel (batches of 6)
    const pages: UrlHealth[] = [];
    const linkGraph = new Map<string, string[]>();
    for (let i = 0; i < urls.length; i += 6) {
      const batch = urls.slice(i, i + 6);
      const results = await Promise.all(batch.map((u) => analyzeUrl(u, base)));
      for (const r of results) {
        pages.push(r.page);
        linkGraph.set(r.page.url, r.internalLinks);
      }
    }

    // 4. Duplicate detection
    const dup = (getter: (p: UrlHealth) => string | null | undefined) => {
      const map = new Map<string, string[]>();
      for (const p of pages) {
        const v = (getter(p) ?? "").trim().toLowerCase();
        if (!v) continue;
        map.set(v, [...(map.get(v) ?? []), p.url]);
      }
      return [...map.entries()].filter(([, v]) => v.length > 1).map(([value, urls]) => ({ value, urls }));
    };
    const dupTitles = dup((p) => p.title);
    const dupDescs = dup((p) => p.description);
    const dupCanon = dup((p) => p.canonical);
    for (const p of pages) {
      if (dupTitles.some((d) => d.urls.includes(p.url))) p.issues.push(issueFor("duplicate_title"));
      if (dupDescs.some((d) => d.urls.includes(p.url))) p.issues.push(issueFor("duplicate_description"));
      if (dupCanon.some((d) => d.urls.includes(p.url))) p.issues.push(issueFor("duplicate_canonical"));
    }

    // 5. Broken-link + redirect-chain sample (internal only, first 40 unique)
    const linkPool = new Set<string>();
    for (const arr of linkGraph.values()) for (const l of arr) linkPool.add(l);
    const sampled = [...linkPool].slice(0, 40);
    const brokenLinks: HealthReport["brokenLinks"] = [];
    const redirectChains: HealthReport["redirectChains"] = [];
    const linkStatuses = await Promise.all(sampled.map(async (l) => ({ url: l, trace: await traceRedirects(l) })));
    for (const { url, trace } of linkStatuses) {
      if (trace.status >= 400 || trace.status === 0) {
        const from = [...linkGraph.entries()].find(([, arr]) => arr.includes(url))?.[0] ?? base;
        brokenLinks.push({ from, to: url, status: trace.status });
      }
      if (trace.hops.length >= 2) redirectChains.push({ from: trace.hops[0], hops: trace.hops, final: trace.final });
    }
    if (brokenLinks.length) {
      for (const b of brokenLinks) {
        const page = pages.find((p) => p.url === b.from);
        if (page && !page.issues.some((i) => i.code === "broken_link")) {
          page.issues.push(issueFor("broken_link", `→ ${b.to} (HTTP ${b.status})`));
        }
      }
    }
    if (redirectChains.length) {
      for (const rc of redirectChains) {
        const page = pages.find((p) => p.url === rc.from);
        if (page) page.issues.push(issueFor("redirect_chain", `${rc.hops.length} hops → ${rc.final}`));
      }
    }

    // 6. Sitemap coverage
    const crawled = new Set(pages.map((p) => p.url.replace(/\/$/, "")));
    const smSet = new Set(sitemap.urls.map((u) => u.replace(/\/$/, "")));
    const missingFromSitemap = [...crawled].filter((u) => !smSet.has(u));
    const extraInSitemap = [...smSet].filter((u) => !crawled.has(u)).slice(0, 25);
    for (const p of pages) {
      if (missingFromSitemap.includes(p.url.replace(/\/$/, ""))) p.issues.push(issueFor("missing_sitemap"));
    }

    // 7. Robots
    if (!robots.ok) {
      pages[0]?.issues.push(issueFor("missing_robots", robots.error));
    } else if (robots.disallowsAll) {
      pages[0]?.issues.push(issueFor("robots_disallow_all"));
    }

    // 8. Buckets + totals
    const buckets: Record<string, number> = {};
    const totals = { critical: 0, warning: 0, info: 0 } as Record<HealthSeverity, number>;
    for (const p of pages) {
      for (const i of p.issues) {
        buckets[i.code] = (buckets[i.code] ?? 0) + 1;
        totals[i.severity] += 1;
      }
    }

    // 9. Recommendations
    const recommendations: HealthReport["recommendations"] = [];
    const rank = (code: string, priority: "high" | "medium" | "low", overrideTitle?: string) => {
      const n = buckets[code] ?? 0;
      if (!n) return;
      const meta = REC[code];
      recommendations.push({
        priority,
        title: overrideTitle ?? `${meta.label} on ${n} URL${n > 1 ? "s" : ""}`,
        detail: meta.recommendation,
        affected: n,
      });
    };
    rank("missing_title", "high");
    rank("missing_description", "high");
    rank("missing_h1", "high");
    rank("broken_link", "high");
    rank("robots_disallow_all", "high");
    rank("missing_robots", "high");
    rank("multiple_h1", "medium");
    rank("duplicate_title", "medium");
    rank("duplicate_description", "medium");
    rank("missing_canonical", "medium");
    rank("missing_schema", "medium");
    rank("missing_sitemap", "medium");
    rank("redirect_chain", "medium");
    rank("thin_page", "medium");
    rank("missing_alt", "medium");
    rank("slow_page", "low");
    rank("large_image", "low");
    rank("noindex", "low");

    recommendations.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 } as const;
      return order[a.priority] - order[b.priority] || b.affected - a.affected;
    });

    return {
      generatedAt: new Date().toISOString(),
      base,
      scanned: pages.length,
      totals,
      buckets,
      urls: pages,
      brokenLinks,
      redirectChains,
      duplicates: { titles: dupTitles, descriptions: dupDescs, canonicals: dupCanon },
      sitemap: {
        ok: sitemap.ok,
        url: `${base}/sitemap.xml`,
        urlCount: sitemap.urls.length,
        missingFromSitemap,
        extraInSitemap,
        error: sitemap.error,
      },
      robots: {
        ok: robots.ok,
        url: `${base}/robots.txt`,
        hasSitemap: robots.hasSitemap,
        hasUserAgent: robots.hasUserAgent,
        disallowsAll: robots.disallowsAll,
        error: robots.error,
      },
      recommendations,
    };
  });
