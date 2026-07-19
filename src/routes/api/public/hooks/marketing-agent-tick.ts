// Cron endpoint for the Enterprise Autonomous Marketing Agent. Runs one
// bounded pass across all due agents. Authenticated with the Supabase anon
// key (apikey header) — matches other Glintr pg_cron hooks.

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/marketing-agent-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey") ?? "";
        const expected = process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY ?? "";
        if (!expected || apikey !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }
        try {
          const { runMarketingAgentTick } = await import("@/lib/marketing-agent/tick.server");
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const res = await runMarketingAgentTick(supabaseAdmin);
          return Response.json({ ok: true, ...res });
        } catch (e) {
          return Response.json(
            { ok: false, error: e instanceof Error ? e.message : String(e) },
            { status: 500 },
          );
        }
      },
    },
  },
});
