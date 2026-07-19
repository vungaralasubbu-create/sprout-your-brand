/**
 * Email queue tick worker. Processes scheduled + retry rows in email_logs.
 * Trigger via pg_cron:
 *   SELECT net.http_post(
 *     url := 'https://project--{id}.lovable.app/api/public/email/tick',
 *     headers := '{"Content-Type": "application/json"}'::jsonb,
 *     body := '{}'::jsonb
 *   );
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/email/tick")({
  server: {
    handlers: {
      POST: async () => {
        const { processEmailQueue } = await import("@/lib/email/service.server");
        const summary = await processEmailQueue(50);
        return Response.json({ ok: true, ...summary });
      },
      GET: async () => {
        const { processEmailQueue } = await import("@/lib/email/service.server");
        const summary = await processEmailQueue(50);
        return Response.json({ ok: true, ...summary });
      },
    },
  },
});
