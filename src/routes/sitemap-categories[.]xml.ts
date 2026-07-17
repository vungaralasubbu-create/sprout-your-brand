import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { renderUrlset, xmlResponse, getServerSupabase, type UrlEntry } from "@/lib/seo/sitemap-utils";

export const Route = createFileRoute("/sitemap-categories.xml")({
  server: {
    handlers: {
      GET: async () => {
        const sb = getServerSupabase();
        const entries: UrlEntry[] = [];
        if (sb) {
          const { data } = await sb
            .from("course_categories")
            .select("slug,updated_at")
            .eq("status", "published").eq("is_active", true);
          for (const c of (data ?? []) as any[]) {
            entries.push({
              path: `/programs/${c.slug}`, lastmod: c.updated_at ?? undefined,
              changefreq: "weekly", priority: "0.8",
            });
          }
        }
        return xmlResponse(renderUrlset(entries));
      },
    },
  },
});
