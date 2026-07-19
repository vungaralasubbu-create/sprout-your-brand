import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { renderUrlset, xmlResponse, getServerSupabase, type UrlEntry } from "@/lib/seo/sitemap-utils";

/** Segmented sitemap: geo-targeted /locations/:slug pages. */
export const Route = createFileRoute("/sitemap-locations.xml")({
  server: {
    handlers: {
      GET: async () => {
        const sb = getServerSupabase();
        const entries: UrlEntry[] = [];
        if (sb) {
          try {
            const { data } = await sb
              .from("seo_locations")
              .select("slug,updated_at,is_published")
              .eq("is_published", true);
            for (const l of (data ?? []) as Array<{ slug?: string; updated_at?: string }>) {
              if (!l.slug) continue;
              entries.push({
                path: `/locations/${l.slug}`,
                lastmod: l.updated_at ?? undefined,
                changefreq: "monthly",
                priority: "0.5",
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
