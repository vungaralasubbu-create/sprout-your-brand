import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { renderUrlset, xmlResponse, getServerSupabase, type UrlEntry } from "@/lib/seo/sitemap-utils";

/** Segmented sitemap: public partner profile pages. */
export const Route = createFileRoute("/sitemap-partners.xml")({
  server: {
    handlers: {
      GET: async () => {
        const sb = getServerSupabase();
        const entries: UrlEntry[] = [
          { path: "/become-a-partner", changefreq: "weekly", priority: "0.9" },
          { path: "/earn", changefreq: "weekly", priority: "0.9" },
          { path: "/income-calculator", changefreq: "monthly", priority: "0.7" },
          { path: "/payout-system", changefreq: "monthly", priority: "0.6" },
        ];
        if (sb) {
          try {
            const { data } = await sb
              .from("partner_brand_profiles")
              .select("slug,updated_at,is_public")
              .eq("is_public", true);
            for (const p of (data ?? []) as Array<{ slug?: string; updated_at?: string }>) {
              if (!p.slug) continue;
              entries.push({
                path: `/partners/${p.slug}`,
                lastmod: p.updated_at ?? undefined,
                changefreq: "weekly",
                priority: "0.6",
              });
            }
          } catch {
            /* Table may not exist yet — keep static entries. */
          }
        }
        return xmlResponse(renderUrlset(entries));
      },
    },
  },
});
