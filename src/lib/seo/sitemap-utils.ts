/**
 * Shared XML helpers for segmented sitemap routes.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const SITE_BASE = "https://glintr.com";

export function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export interface UrlEntry {
  path: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
  images?: Array<{ loc: string; title?: string; caption?: string }>;
}

export function renderUrlset(entries: UrlEntry[]): string {
  const hasImages = entries.some((e) => e.images && e.images.length);
  const nsImage = hasImages ? ` xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"` : "";
  const body = entries.map((e) => {
    const imgs = (e.images ?? [])
      .map((i) =>
        `    <image:image><image:loc>${esc(i.loc)}</image:loc>${i.title ? `<image:title>${esc(i.title)}</image:title>` : ""}${i.caption ? `<image:caption>${esc(i.caption)}</image:caption>` : ""}</image:image>`,
      )
      .join("\n");
    return [
      `  <url>`,
      `    <loc>${SITE_BASE}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      imgs || null,
      `  </url>`,
    ].filter(Boolean).join("\n");
  }).join("\n");
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${nsImage}>`,
    body,
    `</urlset>`,
  ].join("\n");
}

export function xmlResponse(xml: string): Response {
  return new Response(xml, {
    headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
  });
}

export function getServerSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
