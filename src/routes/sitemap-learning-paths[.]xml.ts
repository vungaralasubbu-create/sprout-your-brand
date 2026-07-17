import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { listLearningPaths } from "@/data/learning-paths";
import { renderUrlset, xmlResponse, type UrlEntry } from "@/lib/seo/sitemap-utils";

export const Route = createFileRoute("/sitemap-learning-paths.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: UrlEntry[] = [
          { path: "/learning-paths", changefreq: "weekly", priority: "0.7" },
          ...listLearningPaths().map((p) => ({
            path: `/learning-paths/${p.slug}`,
            changefreq: "monthly",
            priority: "0.6",
          })),
        ];
        return xmlResponse(renderUrlset(entries));
      },
    },
  },
});
