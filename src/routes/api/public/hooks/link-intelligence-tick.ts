/**
 * Background sweep for the Internal Linking Intelligence Engine.
 * Called by pg_cron via the /api/public/ hook prefix (apikey-gated).
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/link-intelligence-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
        if (!apikey || !expected || apikey !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { rebuildGraphNodes, computePageRank } = await import(
          "@/lib/link-intelligence/graph.server");
        const { computeAllScores } = await import("@/lib/link-intelligence/scoring.server");
        const { detectOrphans } = await import("@/lib/link-intelligence/health-monitor.server");

        const started = Date.now();
        const graph = await rebuildGraphNodes().catch(() => ({ upserted: 0 }));
        await computePageRank().catch(() => {});
        const scored = await computeAllScores(300).catch(() => 0);
        const orphans = await detectOrphans(200).catch(() => 0);

        return new Response(JSON.stringify({
          ok: true,
          duration_ms: Date.now() - started,
          graph, scored, orphans,
        }), { headers: { "content-type": "application/json" } });
      },
    },
  },
});
