import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { listGlossary } from "@/data/glossary";
import { listLearningPaths } from "@/data/learning-paths";
import { listComparisons } from "@/data/comparisons";
import { listCareerMaps } from "@/data/career-maps";
import { listTools } from "@/data/tools";
import { articles as learnArticles, collections as learnCollections, topics as learnTopics } from "@/data/learn";
import { AGENTS } from "@/lib/aios/agents";
import { listPillars, listAllClusters } from "@/data/topics";
import { listAuthors } from "@/data/authors";


const BASE_URL = "https://glintr.com";

const STATIC_PATHS: Array<{ path: string; changefreq?: string; priority?: string }> = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/programs", changefreq: "weekly", priority: "0.9" },
  { path: "/earn", changefreq: "weekly", priority: "0.8" },
  { path: "/70-revenue-model", changefreq: "monthly", priority: "0.8" },
  { path: "/50-supported-model", changefreq: "monthly", priority: "0.8" },
  { path: "/income-calculator", changefreq: "monthly", priority: "0.7" },
  { path: "/payout-system", changefreq: "monthly", priority: "0.6" },
  { path: "/sales-opportunity", changefreq: "weekly", priority: "0.8" },
  { path: "/partner-network", changefreq: "monthly", priority: "0.6" },
  { path: "/join", changefreq: "monthly", priority: "0.7" },
  { path: "/launch-your-brand", changefreq: "weekly", priority: "0.8" },
  { path: "/launch-your-brand/consultation", changefreq: "monthly", priority: "0.6" },
  { path: "/launch-your-brand/start", changefreq: "monthly", priority: "0.6" },
  { path: "/white-label-edtech", changefreq: "monthly", priority: "0.8" },
  { path: "/brand-setup", changefreq: "monthly", priority: "0.7" },
  { path: "/lms", changefreq: "monthly", priority: "0.7" },
  { path: "/marketing-support", changefreq: "monthly", priority: "0.7" },
  { path: "/book-consultation", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/learn", changefreq: "weekly", priority: "0.8" },
  { path: "/learn/paths", changefreq: "monthly", priority: "0.6" },
  { path: "/learn/topics", changefreq: "monthly", priority: "0.6" },
  { path: "/ai-agents", changefreq: "weekly", priority: "0.7" },
  { path: "/live", changefreq: "weekly", priority: "0.6" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/careers", changefreq: "weekly", priority: "0.5" },
  { path: "/success-stories", changefreq: "weekly", priority: "0.6" },
  { path: "/faqs", changefreq: "monthly", priority: "0.5" },
  { path: "/blog", changefreq: "daily", priority: "0.9" },
  { path: "/glossary", changefreq: "monthly", priority: "0.7" },
  { path: "/learning-paths", changefreq: "monthly", priority: "0.7" },
  { path: "/compare", changefreq: "monthly", priority: "0.7" },
  { path: "/career-maps", changefreq: "monthly", priority: "0.7" },
  { path: "/knowledge-graph", changefreq: "monthly", priority: "0.5" },
  { path: "/tools", changefreq: "weekly", priority: "0.8" },
  { path: "/find-your-program", changefreq: "monthly", priority: "0.7" },
  { path: "/privacy-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms-and-conditions", changefreq: "yearly", priority: "0.3" },
  { path: "/revenue-share-terms", changefreq: "yearly", priority: "0.3" },
  { path: "/payout-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/refund-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/cookie-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/topics", changefreq: "weekly", priority: "0.9" },
  { path: "/entities", changefreq: "weekly", priority: "0.8" },
];

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
        const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        type Entry = { path: string; lastmod?: string; changefreq?: string; priority?: string };
        const entries: Entry[] = [...STATIC_PATHS];

        for (const g of listGlossary()) {
          entries.push({
            path: `/glossary/${g.slug}`,
            changefreq: "monthly",
            priority: "0.5",
          });
          entries.push({
            path: `/entities/${g.slug}`,
            changefreq: "monthly",
            priority: "0.6",
          });
        }
        for (const p of listLearningPaths()) {
          entries.push({ path: `/learning-paths/${p.slug}`, changefreq: "monthly", priority: "0.6" });
        }
        for (const c of listComparisons()) {
          entries.push({ path: `/compare/${c.slug}`, changefreq: "monthly", priority: "0.6" });
        }
        for (const cm of listCareerMaps()) {
          entries.push({ path: `/career-maps/${cm.slug}`, changefreq: "monthly", priority: "0.5" });
        }
        for (const p of listPillars()) {
          entries.push({ path: `/topics/${p.slug}`, changefreq: "weekly", priority: "0.8" });
        }
        for (const c of listAllClusters()) {
          entries.push({
            path: `/topics/${c.pillarSlug}/${c.slug}`,
            lastmod: c.updatedAt,
            changefreq: "monthly",
            priority: "0.6",
          });
        }
        for (const t of listTools()) {
          entries.push({ path: `/tools/${t.slug}`, changefreq: "monthly", priority: "0.7" });
        }
        for (const a of learnArticles) {
          entries.push({
            path: `/learn/${a.slug}`,
            lastmod: (a as any).updatedAt ?? (a as any).publishedAt ?? undefined,
            changefreq: "monthly",
            priority: "0.6",
          });
        }
        for (const c of learnCollections) {
          entries.push({ path: `/learn/collections/${c.slug}`, changefreq: "monthly", priority: "0.5" });
        }
        for (const t of learnTopics) {
          entries.push({ path: `/learn/${t.slug}`, changefreq: "monthly", priority: "0.5" });
        }
        for (const ag of AGENTS) {
          entries.push({ path: `/ai-agents/${ag.id}`, changefreq: "monthly", priority: "0.5" });
        }

        if (url && key) {
          try {
            const sb = createClient(url, key, { auth: { persistSession: false } });
            const [{ data: cats }, { data: courses }, { data: posts }, { data: faqs }, { data: roles }] = await Promise.all([
              sb.from("course_categories").select("slug,updated_at").eq("status", "published").eq("is_active", true),
              sb
                .from("courses")
                .select("slug,updated_at,category:course_categories!inner(slug,status,is_active)")
                .eq("is_published", true)
                .eq("status", "published"),
              sb
                .from("blog_posts")
                .select("slug,updated_at,editorial_updated_at,published_at")
                .eq("is_published", true)
                .eq("status", "published"),
              sb.from("faqs").select("slug,updated_at").eq("is_published", true),
              sb.from("hiring_roles").select("slug,updated_at").eq("is_published", true),
            ]);

            for (const c of cats ?? []) {
              entries.push({
                path: `/programs/${c.slug}`,
                lastmod: c.updated_at ?? undefined,
                changefreq: "weekly",
                priority: "0.8",
              });
            }
            for (const c of (courses ?? []) as unknown as Array<{ slug: string; updated_at: string | null; category: { slug: string; status: string; is_active: boolean } | Array<{ slug: string; status: string; is_active: boolean }> }>) {
              const cat = Array.isArray(c.category) ? c.category[0] : c.category;
              if (!cat || cat.status !== "published" || !cat.is_active) continue;
              entries.push({
                path: `/programs/${cat.slug}/${c.slug}`,
                lastmod: c.updated_at ?? undefined,
                changefreq: "weekly",
                priority: "0.7",
              });
            }
            for (const p of (posts ?? []) as Array<{ slug: string; updated_at: string | null; editorial_updated_at: string | null; published_at: string | null }>) {
              entries.push({
                path: `/blog/${p.slug}`,
                lastmod: p.editorial_updated_at ?? p.updated_at ?? p.published_at ?? undefined,
                changefreq: "monthly",
                priority: "0.6",
              });
            }
            for (const f of (faqs ?? []) as Array<{ slug: string; updated_at: string | null }>) {
              entries.push({
                path: `/faqs/${f.slug}`,
                lastmod: f.updated_at ?? undefined,
                changefreq: "monthly",
                priority: "0.5",
              });
            }
            for (const r of (roles ?? []) as Array<{ slug: string; updated_at: string | null }>) {
              entries.push({
                path: `/careers/${r.slug}`,
                lastmod: r.updated_at ?? undefined,
                changefreq: "weekly",
                priority: "0.5",
              });
            }
          } catch (e) {
            console.error("[sitemap] failed to load CMS entries", e);
          }
        }

        // Dedupe by path (keep last)
        const seen = new Map<string, typeof entries[number]>();
        for (const e of entries) seen.set(e.path, e);
        const deduped = Array.from(seen.values());


        const urls = deduped.map((e) =>
          [
            "  <url>",
            `    <loc>${esc(BASE_URL + e.path)}</loc>`,
            e.lastmod ? `    <lastmod>${esc(e.lastmod)}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            "  </url>",
          ].filter(Boolean).join("\n"),
        );

        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...urls,
          "</urlset>",
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
