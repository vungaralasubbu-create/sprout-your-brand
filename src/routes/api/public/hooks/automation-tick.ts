/**
 * Cron worker: /api/public/hooks/automation-tick
 * Roll events into profiles → refresh AI recommendations → advance waiting runs.
 * Called every 5 minutes by pg_cron using the Supabase anon key in `apikey`.
 */
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/api/public/hooks/automation-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
        if (!apikey || !expected || apikey !== expected) {
          return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !serviceKey) {
          return new Response(JSON.stringify({ ok: false, error: "missing_env" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
        const sb = createClient<Database>(supabaseUrl, serviceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const results: Record<string, number | string> = {};
        try {
          const { rollupActiveProfiles } = await import("@/lib/automation/profile.server");
          results.profiles = await rollupActiveProfiles(sb, 200);
        } catch (err) {
          results.profiles_error = err instanceof Error ? err.message : String(err);
        }

        try {
          const { decideForActiveUsers } = await import("@/lib/automation/decision.server");
          results.recommendations = await decideForActiveUsers(sb, 40);
        } catch (err) {
          results.recommendations_error = err instanceof Error ? err.message : String(err);
        }

        try {
          const { tickWaitingRuns } = await import("@/lib/automation/workflows.server");
          results.runs_advanced = await tickWaitingRuns(sb, 100);
        } catch (err) {
          results.runs_error = err instanceof Error ? err.message : String(err);
        }

        // Automation Engine: dispatch triggers → drain queue → clear stuck.
        try {
          const { requeueStuck } = await import("@/lib/automation/engine/queue.server");
          const { runOnce } = await import("@/lib/automation/engine/worker.server");
          const requeued = await requeueStuck();
          const drained = await runOnce(`tick:${Date.now()}`, 25);
          results.engine_requeued = requeued;
          results.engine_processed = drained.processed;
          results.engine_ok = drained.ok;
          results.engine_failed = drained.failed;
        } catch (err) {
          results.engine_error = err instanceof Error ? err.message : String(err);
        }

        return new Response(JSON.stringify({ ok: true, ...results }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
