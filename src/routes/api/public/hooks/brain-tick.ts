/**
 * Cron endpoint: /api/public/hooks/brain-tick
 *
 * Called every 5 minutes by pg_cron. Runs the AI Enrollment Brain
 * decision engine over active leads. Auth by Supabase anon `apikey`
 * header — the /api/public prefix bypasses site auth but we still
 * verify the caller here.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/brain-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        if (!apikey || !expected || apikey !== expected) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { runBrainTick } = await import("@/lib/enrollment-brain/brain.functions");
          const result = await runBrainTick(supabaseAdmin, { limit: 12 });
          return new Response(JSON.stringify({ ok: true, result }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("[brain-tick] failed", err);
          return new Response(
            JSON.stringify({ ok: false, error: (err as Error).message }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
