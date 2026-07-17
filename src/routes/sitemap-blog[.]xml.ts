import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { renderUrlset, xmlResponse, getServerSupabase, type UrlEntry } from "@/lib/seo/sitemap-utils";

export const Route = createFileRoute("/sitemap-blog.xml")({
  server: {
    handlers: {
      GET: async () => {
        const sb = getServerSupabase();
        const entries: UrlEntry[] = [];
        if (sb) {
          const { data } = await sb
            .from("blog_posts")
            .select("slug,updated_at,editorial_updated_at,published_at,cover_image_url,title")
            .eq("is_published", true).eq("status", "published");
          for (const p of (data ?? []) as any[]) {
            entries.push({
              path: `/blog/${p.slug}`,
              lastmod: p.editorial_updated_at ?? p.updated_at ?? p.published_at ?? undefined,
              changefreq: "monthly", priority: "0.7",
              images: p.cover_image_url ? [{ loc: p.cover_image_url, title: p.title }] : undefined,
            });
          }
        }
        return xmlResponse(renderUrlset(entries));
      },
    },
  },
});
