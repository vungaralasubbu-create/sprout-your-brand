/**
 * Cron endpoint: dispatches due marketing posts.
 * Called by pg_cron every minute. Public route — protected by the anon apikey
 * header (the /api/public/* prefix bypasses auth so the handler owns security).
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/mkt-publish")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("apikey") ?? request.headers.get("authorization")?.replace("Bearer ", "");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
        if (expected && auth !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }
        try {
          const { runPublishWorker } = await import("@/lib/marketing/worker.server");
          const result = await runPublishWorker(50);
          return Response.json({ ok: true, ...result });
        } catch (err) {
          return Response.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
        }
      },
      GET: async () => Response.json({ ok: true, hint: "POST to run the worker" }),
    },
  },
});
