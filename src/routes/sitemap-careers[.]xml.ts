import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { listCareerMaps } from "@/data/career-maps";
import { renderUrlset, xmlResponse, getServerSupabase, type UrlEntry } from "@/lib/seo/sitemap-utils";

export const Route = createFileRoute("/sitemap-careers.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: UrlEntry[] = [
          { path: "/careers", changefreq: "weekly", priority: "0.7" },
          { path: "/career-maps", changefreq: "monthly", priority: "0.6" },
          ...listCareerMaps().map((c) => ({
            path: `/career-maps/${c.slug}`, changefreq: "monthly", priority: "0.5",
          })),
        ];
        const sb = getServerSupabase();
        if (sb) {
          const { data } = await sb.from("hiring_roles").select("slug,updated_at").eq("is_published", true);
          for (const r of (data ?? []) as any[]) {
            entries.push({ path: `/careers/${r.slug}`, lastmod: r.updated_at ?? undefined, changefreq: "monthly", priority: "0.6" });
          }
        }
        return xmlResponse(renderUrlset(entries));
      },
    },
  },
});
