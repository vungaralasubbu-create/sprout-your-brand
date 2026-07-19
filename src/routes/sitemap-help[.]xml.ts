import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { renderUrlset, xmlResponse, getServerSupabase, type UrlEntry } from "@/lib/seo/sitemap-utils";

export const Route = createFileRoute("/sitemap-help.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: UrlEntry[] = [
          { path: "/help", changefreq: "weekly", priority: "0.8" },
        ];
        const sb = getServerSupabase();
        if (sb) {
          const { data: cats } = await sb.from("kb_categories").select("slug,updated_at").eq("published", true);
          for (const c of (cats ?? []) as any[]) {
            entries.push({ path: `/help/c/${c.slug}`, lastmod: c.updated_at ?? undefined, changefreq: "weekly", priority: "0.6" });
          }
          const { data: arts } = await sb.from("kb_articles").select("slug,updated_at").eq("published", true).limit(10000);
          for (const a of (arts ?? []) as any[]) {
            entries.push({ path: `/help/${a.slug}`, lastmod: a.updated_at ?? undefined, changefreq: "monthly", priority: "0.6" });
          }
        }
        return xmlResponse(renderUrlset(entries));
      },
    },
  },
});
