import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { renderUrlset, xmlResponse, getServerSupabase, type UrlEntry } from "@/lib/seo/sitemap-utils";

/** Segmented sitemap: instructor / mentor profile pages. */
export const Route = createFileRoute("/sitemap-instructors.xml")({
  server: {
    handlers: {
      GET: async () => {
        const sb = getServerSupabase();
        const entries: UrlEntry[] = [];
        if (sb) {
          try {
            const { data } = await sb
              .from("instructors")
              .select("slug,updated_at,is_published")
              .eq("is_published", true);
            for (const i of (data ?? []) as Array<{ slug?: string; updated_at?: string }>) {
              if (!i.slug) continue;
              entries.push({
                path: `/instructors/${i.slug}`,
                lastmod: i.updated_at ?? undefined,
                changefreq: "monthly",
                priority: "0.6",
              });
            }
          } catch {
            /* Table not present — return empty set. */
          }
        }
        return xmlResponse(renderUrlset(entries));
      },
    },
  },
});
