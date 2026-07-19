import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { renderUrlset, xmlResponse, getServerSupabase, type UrlEntry } from "@/lib/seo/sitemap-utils";

/** Segmented sitemap: partner-owned academy / brand storefronts. */
export const Route = createFileRoute("/sitemap-brands.xml")({
  server: {
    handlers: {
      GET: async () => {
        const sb = getServerSupabase();
        const entries: UrlEntry[] = [];
        if (sb) {
          try {
            const { data } = await sb
              .from("partner_brand_profiles")
              .select("slug,updated_at,is_public")
              .eq("is_public", true);
            for (const b of (data ?? []) as Array<{ slug?: string; updated_at?: string }>) {
              if (!b.slug) continue;
              entries.push({
                path: `/academy/${b.slug}`,
                lastmod: b.updated_at ?? undefined,
                changefreq: "weekly",
                priority: "0.7",
              });
            }
          } catch {
            /* No brands table — return empty urlset. */
          }
        }
        return xmlResponse(renderUrlset(entries));
      },
    },
  },
});
