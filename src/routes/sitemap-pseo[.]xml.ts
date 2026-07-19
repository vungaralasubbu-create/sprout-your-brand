/**
 * Segmented sitemap for programmatic SEO pages. Streams every published
 * pseo_pages row directly from Supabase, capped per fetch to stay under
 * the sitemap URL limit (50,000). At high scale, split by page_type or
 * by created_at bucket via query params.
 */
import { createFileRoute } from "@tanstack/react-router";
import { renderUrlset, xmlResponse, getServerSupabase } from "@/lib/seo/sitemap-utils";

export const Route = createFileRoute("/sitemap-pseo.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const sb = getServerSupabase();
        if (!sb) return xmlResponse(renderUrlset([]));
        const url = new URL(request.url);
        const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0", 10) || 0);
        const limit = Math.min(50000, parseInt(url.searchParams.get("limit") ?? "45000", 10) || 45000);

        const { data } = await sb
          .from("pseo_pages")
          .select("slug, updated_at, page_type")
          .eq("status", "published")
          .order("updated_at", { ascending: false })
          .range(offset, offset + limit - 1);

        const entries = (data ?? []).map((r) => ({
          path: `/p/${r.slug}`,
          lastmod: r.updated_at,
          changefreq: "weekly",
          priority: r.page_type === "by_city" || r.page_type === "by_state" ? "0.7" : "0.6",
        }));
        return xmlResponse(renderUrlset(entries));
      },
    },
  },
});
