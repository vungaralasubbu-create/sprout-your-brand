// Campaign Orchestrator background tick endpoint.
// Called by pg_cron; runs planning → generation → scheduling → publishing →
// analytics rollup → AI optimization for a bounded slice of work per call.
//
// Auth: apikey header (Supabase anon key) — /api/public/* bypasses auth at
// the edge, so we accept the anon key here for pg_cron parity, matching the
// pattern used by other Glintr cron routes.

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/campaign-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey") ?? "";
        const expected = process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY ?? "";
        if (!expected || apikey !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }
        try {
          const { runCampaignTick } = await import("@/lib/campaign-orchestrator/tick.server");
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const res = await runCampaignTick(supabaseAdmin);
          return Response.json({ ok: true, ...res });
        } catch (e) {
          return Response.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
        }
      },
    },
  },
});
