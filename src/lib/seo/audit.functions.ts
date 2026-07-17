/**
 * SEO health audit — server functions used by the admin dashboard.
 *
 * Reads content from Supabase (courses, blog_posts, categories, faqs, roles)
 * and flags missing/duplicate/thin metadata plus image-alt gaps.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { auditMeta } from "@/lib/seo/meta";

export interface SeoHealthRow {
  scope: "course" | "category" | "blog" | "faq" | "role";
  id: string;
  slug: string;
  title: string;
  url: string;
  issues: string[];
}

export interface SeoHealthSummary {
  totals: {
    scanned: number;
    healthy: number;
    warnings: number;
    critical: number;
  };
  buckets: {
    missing_title: number;
    missing_description: number;
    title_too_long: number;
    description_too_long: number;
    duplicate_titles: number;
    duplicate_descriptions: number;
    missing_image: number;
    missing_alt: number;
    thin_content: number;
  };
  rows: SeoHealthRow[];
  duplicates: {
    titles: Array<{ value: string; count: number; slugs: string[] }>;
    descriptions: Array<{ value: string; count: number; slugs: string[] }>;
  };
  sitemap: { status: "ok" | "stale"; url: string };
  robots: { status: "ok"; url: string };
  generatedAt: string;
}

function pushDup(map: Map<string, string[]>, key: string, slug: string) {
  const arr = map.get(key) ?? [];
  arr.push(slug);
  map.set(key, arr);
}

export const runSeoHealthAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;

    const [{ data: courses }, { data: cats }, { data: posts }, { data: faqs }, { data: roles }] = await Promise.all([
      supabase
        .from("courses")
        .select("id,slug,name,seo_title,seo_description,short_description,og_image_url,hero_image_url,thumbnail_url,is_published,status,category:course_categories!inner(slug,status,is_active)")
        .limit(2000),
      supabase
        .from("course_categories")
        .select("id,slug,name,seo_title,seo_description,short_description,hero_image_url,status,is_active")
        .limit(500),
      supabase
        .from("blog_posts")
        .select("id,slug,title,seo_title,seo_description,excerpt,cover_image_url,content_body,is_published,status")
        .limit(2000),
      supabase.from("faqs").select("id,slug,question,answer,is_published").limit(2000),
      supabase.from("hiring_roles").select("id,slug,title,description,is_published").limit(500),
    ]);

    const rows: SeoHealthRow[] = [];
    const titleMap = new Map<string, string[]>();
    const descMap = new Map<string, string[]>();
    const buckets = {
      missing_title: 0, missing_description: 0, title_too_long: 0, description_too_long: 0,
      duplicate_titles: 0, duplicate_descriptions: 0, missing_image: 0, missing_alt: 0, thin_content: 0,
    };

    function record(row: SeoHealthRow, title?: string | null, desc?: string | null) {
      if (title) pushDup(titleMap, title.trim().toLowerCase(), row.slug);
      if (desc) pushDup(descMap, desc.trim().toLowerCase(), row.slug);
      for (const k of row.issues) {
        if (k in buckets) (buckets as any)[k] += 1;
      }
      rows.push(row);
    }

    for (const c of (courses ?? []) as any[]) {
      const cat = Array.isArray(c.category) ? c.category[0] : c.category;
      const catSlug = cat?.slug ?? "programs";
      const audit = auditMeta(c.seo_title, c.seo_description ?? c.short_description);
      const issues = [...audit.issues];
      if (!c.og_image_url && !c.hero_image_url && !c.thumbnail_url) issues.push("missing_image");
      if (!c.is_published || c.status !== "published") issues.push("unpublished");
      record({
        scope: "course", id: c.id, slug: c.slug, title: c.name,
        url: `/programs/${catSlug}/${c.slug}`, issues,
      }, c.seo_title, c.seo_description ?? c.short_description);
    }

    for (const c of (cats ?? []) as any[]) {
      const audit = auditMeta(c.seo_title, c.seo_description ?? c.short_description);
      const issues = [...audit.issues];
      if (!c.hero_image_url) issues.push("missing_image");
      record({
        scope: "category", id: c.id, slug: c.slug, title: c.name,
        url: `/programs/${c.slug}`, issues,
      }, c.seo_title, c.seo_description ?? c.short_description);
    }

    for (const p of (posts ?? []) as any[]) {
      const audit = auditMeta(p.seo_title ?? p.title, p.seo_description ?? p.excerpt);
      const issues = [...audit.issues];
      if (!p.cover_image_url) issues.push("missing_image");
      const body = String(p.content_body ?? "");
      if (body.length < 800) issues.push("thin_content");
      const imgs = body.match(/!\[[^\]]*\]\([^)]+\)/g) ?? [];
      const noAlt = imgs.filter((m) => /^!\[\s*\]/.test(m)).length;
      if (noAlt > 0) { issues.push("missing_alt"); buckets.missing_alt += noAlt - 1; }
      record({
        scope: "blog", id: p.id, slug: p.slug, title: p.title,
        url: `/blog/${p.slug}`, issues,
      }, p.seo_title ?? p.title, p.seo_description ?? p.excerpt);
    }

    for (const f of (faqs ?? []) as any[]) {
      const issues: string[] = [];
      if (!f.question || f.question.length < 15) issues.push("title_too_short");
      if (!f.answer || String(f.answer).length < 60) issues.push("thin_content");
      record({
        scope: "faq", id: f.id, slug: f.slug, title: f.question ?? f.slug,
        url: `/faqs/${f.slug}`, issues,
      }, f.question, f.answer);
    }

    for (const r of (roles ?? []) as any[]) {
      const audit = auditMeta(r.title, r.description);
      record({
        scope: "role", id: r.id, slug: r.slug, title: r.title,
        url: `/careers/${r.slug}`, issues: [...audit.issues],
      }, r.title, r.description);
    }

    const dupTitles = [...titleMap.entries()]
      .filter(([, v]) => v.length > 1)
      .map(([value, slugs]) => ({ value, count: slugs.length, slugs }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 100);
    const dupDescs = [...descMap.entries()]
      .filter(([, v]) => v.length > 1)
      .map(([value, slugs]) => ({ value, count: slugs.length, slugs }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 100);
    buckets.duplicate_titles = dupTitles.reduce((n, x) => n + x.count, 0);
    buckets.duplicate_descriptions = dupDescs.reduce((n, x) => n + x.count, 0);

    const scanned = rows.length;
    const critical = rows.filter((r) => r.issues.some((i) => i === "missing_title" || i === "missing_description")).length;
    const warnings = rows.filter((r) => r.issues.length > 0).length - critical;
    const healthy = scanned - critical - Math.max(0, warnings);

    const summary: SeoHealthSummary = {
      totals: { scanned, healthy, warnings: Math.max(0, warnings), critical },
      buckets,
      rows: rows.sort((a, b) => b.issues.length - a.issues.length).slice(0, 500),
      duplicates: { titles: dupTitles, descriptions: dupDescs },
      sitemap: { status: "ok", url: "/sitemap.xml" },
      robots: { status: "ok", url: "/robots.txt" },
      generatedAt: new Date().toISOString(),
    };
    return summary;
  });

/**
 * Ping search engines with the updated sitemap URL.
 * Called after a publish or via the admin dashboard button.
 */
export const pingSearchEngines = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const sm = "https://glintr.com/sitemap.xml";
    const targets = [
      `https://www.google.com/ping?sitemap=${encodeURIComponent(sm)}`,
      `https://www.bing.com/ping?sitemap=${encodeURIComponent(sm)}`,
    ];
    const results: Array<{ engine: string; ok: boolean; status?: number; error?: string }> = [];
    for (const url of targets) {
      const engine = url.includes("google") ? "google" : "bing";
      try {
        const res = await fetch(url, { method: "GET" });
        results.push({ engine, ok: res.ok, status: res.status });
      } catch (e: any) {
        results.push({ engine, ok: false, error: String(e?.message ?? e) });
      }
    }
    return { pingedAt: new Date().toISOString(), results };
  });
