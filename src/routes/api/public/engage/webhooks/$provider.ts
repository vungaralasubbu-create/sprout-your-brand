/**
 * Provider webhook receiver. Delegates to the matching adapter's parseWebhook
 * (when defined) and updates engage_messages rows for delivery, opens,
 * clicks, bounces, complaints, and unsubscribes.
 *
 * Signature verification is done inside each adapter. Adapters that don't
 * implement parseWebhook are skipped.
 */

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/engage/webhooks/$provider")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const { getProvider } = await import("../../../../../lib/engage/providers/registry.server");
        const adapter = getProvider(params.provider as never);
        if (!adapter || !adapter.parseWebhook) {
          return Response.json({ ok: false, error: "provider not supported" }, { status: 404 });
        }
        const events = await adapter.parseWebhook(request);
        if (events.length === 0) return Response.json({ ok: true, applied: 0 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        let applied = 0;
        for (const ev of events) {
          if (!ev.provider_message_id) continue;
          const patch: Record<string, unknown> = { status: ev.event };
          if (ev.event === "delivered") patch.delivered_at = new Date().toISOString();
          if (ev.event === "opened") patch.opened_at = new Date().toISOString();
          if (ev.event === "clicked") patch.clicked_at = new Date().toISOString();
          if (ev.event === "bounced") patch.bounced_at = new Date().toISOString();
          if (ev.event === "complained") patch.complained_at = new Date().toISOString();
          if (ev.event === "unsubscribed") patch.unsubscribed_at = new Date().toISOString();
          const { error } = await supabaseAdmin
            .from("engage_messages")
            .update(patch)
            .eq("provider_message_id", ev.provider_message_id);
          if (!error) applied++;
        }
        return Response.json({ ok: true, applied });
      },
    },
  },
});
