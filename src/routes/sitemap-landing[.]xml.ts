import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { renderUrlset, xmlResponse, type UrlEntry } from "@/lib/seo/sitemap-utils";

/** Segmented sitemap: evergreen marketing landing pages. */
export const Route = createFileRoute("/sitemap-landing.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: UrlEntry[] = [
          { path: "/", changefreq: "daily", priority: "1.0" },
          { path: "/earn", changefreq: "weekly", priority: "0.9" },
          { path: "/lms", changefreq: "weekly", priority: "0.8" },
          { path: "/marketing-support", changefreq: "weekly", priority: "0.7" },
          { path: "/70-revenue-model", changefreq: "monthly", priority: "0.7" },
          { path: "/50-supported-model", changefreq: "monthly", priority: "0.7" },
          { path: "/income-calculator", changefreq: "monthly", priority: "0.7" },
          { path: "/payout-system", changefreq: "monthly", priority: "0.6" },
          { path: "/about", changefreq: "monthly", priority: "0.6" },
          { path: "/contact", changefreq: "monthly", priority: "0.5" },
        ];
        return xmlResponse(renderUrlset(entries));
      },
    },
  },
});
