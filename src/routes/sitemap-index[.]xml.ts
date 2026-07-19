import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE = "https://glintr.com";
const NOW = () => new Date().toISOString();

export const Route = createFileRoute("/sitemap-index.xml")({
  server: {
    handlers: {
      GET: async () => {
        const now = NOW();
        const maps = [
          "/sitemap.xml",
          "/sitemap-courses.xml",
          "/sitemap-categories.xml",
          "/sitemap-blog.xml",
          "/sitemap-learning-paths.xml",
          "/sitemap-careers.xml",
          "/sitemap-success-stories.xml",
          "/sitemap-images.xml",
        ];
        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...maps.map((m) => `  <sitemap><loc>${BASE}${m}</loc><lastmod>${now}</lastmod></sitemap>`),
          `</sitemapindex>`,
        ].join("\n");
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
