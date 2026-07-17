import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { renderUrlset, xmlResponse, getServerSupabase, type UrlEntry } from "@/lib/seo/sitemap-utils";

export const Route = createFileRoute("/sitemap-courses.xml")({
  server: {
    handlers: {
      GET: async () => {
        const sb = getServerSupabase();
        const entries: UrlEntry[] = [];
        if (sb) {
          const { data } = await sb
            .from("courses")
            .select("slug,updated_at,category:course_categories!inner(slug,status,is_active)")
            .eq("is_published", true).eq("status", "published");
          for (const c of (data ?? []) as any[]) {
            const cat = Array.isArray(c.category) ? c.category[0] : c.category;
            if (!cat || cat.status !== "published" || !cat.is_active) continue;
            entries.push({
              path: `/programs/${cat.slug}/${c.slug}`,
              lastmod: c.updated_at ?? undefined,
              changefreq: "weekly", priority: "0.8",
            });
          }
        }
        return xmlResponse(renderUrlset(entries));
      },
    },
  },
});
