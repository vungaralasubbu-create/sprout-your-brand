import { createFileRoute } from "@tanstack/react-router";

/**
 * Public health endpoint. Aggregates every registered service probe
 * (AI providers, DB, cache, queue, workflow engine) and returns a
 * bounded JSON snapshot. Safe for uptime monitors and autoscalers.
 */
export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () => {
        const { runAllHealthProbes, overallStatus } = await import("@/lib/perf/health-registry.server");
        const { allCacheStats } = await import("@/lib/perf/cache.server");
        const { allSemaphoreStats } = await import("@/lib/perf/concurrency.server");
        const probes = await runAllHealthProbes();
        const status = overallStatus(probes);
        const body = {
          status,
          time: new Date().toISOString(),
          probes,
          caches: allCacheStats(),
          semaphores: allSemaphoreStats(),
        };
        return new Response(JSON.stringify(body), {
          status: status === "unhealthy" ? 503 : 200,
          headers: {
            "content-type": "application/json",
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
