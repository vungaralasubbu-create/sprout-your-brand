// pg_cron target. Auth: Supabase anon key in `apikey` header (canonical pattern).
// Runs the publishing worker across all due jobs. No PII returned.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/publisher-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
        if (!apikey || !expected || apikey !== expected) {
          return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
        }
        const { runPublisherWorker } = await import("@/lib/marketing-os/publisher-worker.server");
        const res = await runPublisherWorker({ maxJobs: 25 });
        return Response.json({ ok: true, ...res });
      },
    },
  },
});
