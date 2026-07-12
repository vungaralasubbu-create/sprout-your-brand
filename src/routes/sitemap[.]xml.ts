import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://glintr.com";

const STATIC_PATHS: Array<{ path: string; changefreq?: string; priority?: string }> = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/programs", changefreq: "weekly", priority: "0.9" },
  { path: "/earn", changefreq: "weekly", priority: "0.8" },
  { path: "/sales-opportunity", changefreq: "weekly", priority: "0.8" },
  { path: "/join", changefreq: "monthly", priority: "0.7" },
  { path: "/launch-your-brand", changefreq: "weekly", priority: "0.8" },
  { path: "/launch-your-brand/consultation", changefreq: "monthly", priority: "0.6" },
  { path: "/launch-your-brand/start", changefreq: "monthly", priority: "0.6" },
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

        if (url && key) {
          try {
            const sb = createClient(url, key, { auth: { persistSession: false } });
            const [{ data: cats }, { data: courses }] = await Promise.all([
              sb.from("course_categories").select("slug,updated_at").eq("status", "published").eq("is_active", true),
              sb
                .from("courses")
                .select("slug,updated_at,category:course_categories!inner(slug,status,is_active)")
                .eq("is_published", true)
                .eq("status", "published"),
            ]);

            for (const c of cats ?? []) {
              entries.push({
                path: `/programs/${c.slug}`,
                lastmod: c.updated_at ?? undefined,
                changefreq: "weekly",
                priority: "0.8",
              });
            }
            for (const c of (courses ?? []) as Array<{ slug: string; updated_at: string | null; category: { slug: string; status: string; is_active: boolean } }>) {
              if (!c.category || c.category.status !== "published" || !c.category.is_active) continue;
              entries.push({
                path: `/programs/${c.category.slug}/${c.slug}`,
                lastmod: c.updated_at ?? undefined,
                changefreq: "weekly",
                priority: "0.7",
              });
            }
          } catch (e) {
            console.error("[sitemap] failed to load CMS entries", e);
          }
        }

        const urls = entries.map((e) =>
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
