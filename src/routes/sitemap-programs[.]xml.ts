import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { renderUrlset, xmlResponse, getServerSupabase, type UrlEntry } from "@/lib/seo/sitemap-utils";

/** Segmented sitemap: category + subcategory landing pages under /programs. */
export const Route = createFileRoute("/sitemap-programs.xml")({
  server: {
    handlers: {
      GET: async () => {
        const sb = getServerSupabase();
        const entries: UrlEntry[] = [
          { path: "/programs", changefreq: "daily", priority: "0.9" },
        ];
        if (sb) {
          const { data } = await sb
            .from("course_categories")
            .select("slug,updated_at,status,is_active")
            .eq("status", "published")
            .eq("is_active", true);
          for (const cat of (data ?? []) as Array<{ slug: string; updated_at?: string }>) {
            entries.push({
              path: `/programs/${cat.slug}`,
              lastmod: cat.updated_at ?? undefined,
              changefreq: "weekly",
              priority: "0.8",
            });
          }
        }
        return xmlResponse(renderUrlset(entries));
      },
    },
  },
});
