// pg_cron target. Auth: server-only CRON_SECRET in the `x-cron-secret` header.
// Runs the publishing worker across all due jobs. No PII returned.
import { createFileRoute } from "@tanstack/react-router";
import { verifyCronRequest, cronUnauthorizedResponse } from "@/lib/security/cron-auth.server";

export const Route = createFileRoute("/api/public/hooks/publisher-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!verifyCronRequest(request)) return cronUnauthorizedResponse();
        const { runPublisherWorker } = await import("@/lib/marketing-os/publisher-worker.server");
        const res = await runPublisherWorker({ maxJobs: 25 });
        return Response.json({ ok: true, ...res });
      },
    },
  },
});

