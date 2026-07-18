import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Cashfree Payment Gateway webhook receiver.
 *
 * Register this endpoint in Cashfree Dashboard → Developers → Webhooks:
 *   Production:  https://glintr.com/api/public/webhooks/cashfree
 *   Preview:     https://project--84233618-ecae-483f-a5a7-f069293573cb-dev.lovable.app/api/public/webhooks/cashfree
 *
 * Cashfree signs each payload with HMAC-SHA256 using your webhook secret.
 * Signature scheme (PG v2023-08-01):
 *   signed_payload = `${timestamp}${rawBody}`
 *   signature      = base64( HMAC_SHA256(secret, signed_payload) )
 * Headers sent by Cashfree:
 *   x-webhook-signature : base64 HMAC
 *   x-webhook-timestamp : unix epoch seconds
 *   x-webhook-version   : e.g. "2023-08-01"
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, x-webhook-signature, x-webhook-timestamp, x-webhook-version",
} as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

function verifySignature(
  rawBody: string,
  timestamp: string,
  signature: string,
  secret: string,
): boolean {
  try {
    const computed = createHmac("sha256", secret)
      .update(timestamp + rawBody)
      .digest("base64");
    const a = Buffer.from(computed);
    const b = Buffer.from(signature);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/public/webhooks/cashfree")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, { status: 204, headers: CORS }),

      GET: async () =>
        json({ ok: true, endpoint: "cashfree-webhook", status: "ready" }),

      POST: async ({ request }) => {
        const secret = process.env.CASHFREE_WEBHOOK_SECRET;
        if (!secret) {
          console.error("[cashfree-webhook] CASHFREE_WEBHOOK_SECRET missing");
          return json({ error: "webhook_not_configured" }, 500);
        }

        const rawBody = await request.text();
        const signature = request.headers.get("x-webhook-signature") ?? "";
        const timestamp = request.headers.get("x-webhook-timestamp") ?? "";

        if (!signature || !timestamp) {
          return json({ error: "missing_signature_headers" }, 401);
        }
        if (!verifySignature(rawBody, timestamp, signature, secret)) {
          console.warn("[cashfree-webhook] invalid signature");
          return json({ error: "invalid_signature" }, 401);
        }

        let payload: any;
        try {
          payload = JSON.parse(rawBody);
        } catch {
          return json({ error: "invalid_json" }, 400);
        }

        const eventType: string = payload?.type ?? payload?.event ?? "unknown";
        const eventId: string =
          payload?.data?.payment?.cf_payment_id?.toString() ??
          payload?.data?.order?.order_id ??
          `${eventType}:${timestamp}`;

        // Persist raw event for idempotent processing (best-effort)
        try {
          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );
          await supabaseAdmin.from("payment_webhook_events").upsert(
            {
              provider: "cashfree",
              event_id: eventId,
              event_type: eventType,
              payload,
              received_at: new Date().toISOString(),
            },
            { onConflict: "provider,event_id", ignoreDuplicates: true },
          );
        } catch (err) {
          // Table may not exist yet — log and still ack so Cashfree doesn't retry storm.
          console.warn(
            "[cashfree-webhook] event persistence skipped:",
            (err as Error)?.message,
          );
        }

        console.log("[cashfree-webhook] received", { eventType, eventId });

        // Always ack quickly. Fulfilment runs async from the events table.
        return json({ received: true });
      },
    },
  },
});
