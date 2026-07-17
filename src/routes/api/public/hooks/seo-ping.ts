/**
 * Public auto-indexing hook. Pings Google + Bing with the sitemap-index URL.
 * Called by the admin publish flow or scheduled cron. No PII.
 */
import { createFileRoute } from "@tanstack/react-router";

const SITEMAP = "https://glintr.com/sitemap-index.xml";

async function ping(target: string) {
  try {
    const res = await fetch(target, { method: "GET" });
    return { target, ok: res.ok, status: res.status };
  } catch (e: any) {
    return { target, ok: false, error: String(e?.message ?? e) };
  }
}

export const Route = createFileRoute("/api/public/hooks/seo-ping")({
  server: {
    handlers: {
      POST: async () => {
        const results = await Promise.all([
          ping(`https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP)}`),
          ping(`https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP)}`),
        ]);
        return Response.json({ ok: true, pingedAt: new Date().toISOString(), results });
      },
      GET: async () => Response.json({ ok: true, sitemap: SITEMAP }),
    },
  },
});
