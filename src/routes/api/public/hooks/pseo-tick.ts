// Cron tick for pSEO enterprise queue. Called by pg_cron. Secured by anon key.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/pseo-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey");
        if (!apikey || apikey !== process.env.SUPABASE_PUBLISHABLE_KEY) {
          return new Response("Unauthorized", { status: 401 });
        }
        let limit = 25;
        try {
          const body = await request.json().catch(() => ({}));
          const n = Number((body as { limit?: number }).limit ?? 25);
          if (Number.isFinite(n) && n > 0 && n <= 200) limit = Math.floor(n);
        } catch { /* ignore */ }
        const { processBatchQueue } = await import("@/lib/pseo/enterprise/bulk-orchestrator.server");
        const result = await processBatchQueue(limit);
        return new Response(JSON.stringify({ ok: true, ...result }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
