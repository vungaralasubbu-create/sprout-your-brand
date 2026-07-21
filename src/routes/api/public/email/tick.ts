/**
 * Email queue tick worker. Processes scheduled + retry rows in email_logs.
 * Requires server-only CRON_SECRET in the `x-cron-secret` header — never
 * accept the public anon key here.
 */
import { createFileRoute } from "@tanstack/react-router";
import { verifyCronRequest, cronUnauthorizedResponse } from "@/lib/security/cron-auth.server";

async function handle(request: Request) {
  if (!verifyCronRequest(request)) return cronUnauthorizedResponse();
  const { processEmailQueue } = await import("@/lib/email/service.server");
  const summary = await processEmailQueue(50);
  return Response.json({ ok: true, ...summary });
}

export const Route = createFileRoute("/api/public/email/tick")({
  server: {
    handlers: {
      POST: async ({ request }) => handle(request),
      GET: async ({ request }) => handle(request),
    },
  },
});
