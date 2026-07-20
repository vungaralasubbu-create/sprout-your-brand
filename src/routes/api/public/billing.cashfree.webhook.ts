/**
 * Cashfree webhook receiver.
 * URL: /api/public/billing/cashfree/webhook
 * Configure this in Cashfree dashboard → Developers → Webhooks.
 * All events are recorded in bill_events for idempotent replay.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/billing/cashfree/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const headers: Record<string, string> = {};
        request.headers.forEach((v, k) => (headers[k.toLowerCase()] = v));

        const { getProvider } = await import("@/lib/billing/providers/registry.server");
        const provider = getProvider("cashfree");
        const v = await provider.verifyWebhook(raw, headers);
        if (!v.ok) {
          return new Response(JSON.stringify({ error: v.reason ?? "Invalid signature" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const payload = v.payload as any;

        // Idempotent insert — UNIQUE(provider, provider_event_id) prevents duplicates.
        const { error: insertErr } = await supabaseAdmin.from("bill_events").insert({
          provider: "cashfree",
          provider_event_id: v.eventId ?? crypto.randomUUID(),
          event_type: v.eventType ?? "unknown",
          payload: payload ?? {},
          processed: false,
        });
        if (insertErr && !insertErr.message?.includes("duplicate")) {
          return new Response(JSON.stringify({ error: "Failed to record event" }), { status: 500 });
        }

        // Fast state transition for the common success case.
        try {
          const eventType = v.eventType ?? "";
          const orderId = payload?.data?.order?.order_id;
          const cfPaymentId = payload?.data?.payment?.cf_payment_id?.toString();
          const paymentStatus = (payload?.data?.payment?.payment_status ?? "").toLowerCase();

          if (orderId && eventType.includes("PAYMENT")) {
            const status =
              paymentStatus === "success" ? "succeeded" :
              paymentStatus === "failed" ? "failed" :
              paymentStatus === "user_dropped" || paymentStatus === "cancelled" ? "canceled" :
              "processing";

            await supabaseAdmin
              .from("bill_payments")
              .update({
                status,
                provider_payment_id: cfPaymentId ?? null,
                method_type: payload?.data?.payment?.payment_group ?? null,
                paid_at: status === "succeeded" ? new Date().toISOString() : null,
                failure_reason: status === "failed" ? payload?.data?.error_details?.error_description ?? null : null,
              })
              .eq("provider_order_id", orderId);
          }

          await supabaseAdmin
            .from("bill_events")
            .update({ processed: true })
            .eq("provider", "cashfree")
            .eq("provider_event_id", v.eventId ?? "");
        } catch (e) {
          // swallow — event is recorded; retry via reconciliation job.
        }

        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
