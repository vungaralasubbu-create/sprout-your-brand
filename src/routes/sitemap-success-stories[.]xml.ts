import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { renderUrlset, xmlResponse, getServerSupabase, type UrlEntry } from "@/lib/seo/sitemap-utils";

export const Route = createFileRoute("/sitemap-success-stories.xml")({
  server: {
    handlers: {
      GET: async () => {
        const sb = getServerSupabase();
        const entries: UrlEntry[] = [
          { path: "/success-stories", changefreq: "weekly", priority: "0.7" },
        ];
        if (sb) {
          const { data } = await sb
            .from("success_stories")
            .select("slug,updated_at,published_at,cover_image_url,student_name")
            .eq("is_published", true);
          for (const s of (data ?? []) as any[]) {
            if (!s.slug) continue;
            entries.push({
              path: `/success-stories/${s.slug}`,
              lastmod: s.updated_at ?? s.published_at ?? undefined,
              changefreq: "monthly",
              priority: "0.6",
              images: s.cover_image_url
                ? [{ loc: s.cover_image_url, title: s.student_name ?? undefined }]
                : undefined,
            });
          }
        }
        return xmlResponse(renderUrlset(entries));
      },
    },
  },
});
