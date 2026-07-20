/**
 * Cashfree adapter (initial provider).
 * Server-only. Reads credentials at call time from process.env.
 *
 * Required secrets (add via add_secret when going live):
 *   CASHFREE_APP_ID
 *   CASHFREE_SECRET_KEY
 *   CASHFREE_WEBHOOK_SECRET
 *   CASHFREE_MODE ("sandbox" | "production", default "sandbox")
 *
 * Docs: https://docs.cashfree.com/docs/pg-new-checkout
 */
import type {
  PaymentProvider,
  CheckoutRequest,
  CheckoutResponse,
  WebhookVerification,
  RefundRequest,
  RefundResponse,
} from "./types";

function baseUrl(): string {
  return (process.env.CASHFREE_MODE ?? "sandbox") === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";
}

function authHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-api-version": "2023-08-01",
    "x-client-id": process.env.CASHFREE_APP_ID ?? "",
    "x-client-secret": process.env.CASHFREE_SECRET_KEY ?? "",
  };
}

export const cashfree: PaymentProvider = {
  code: "cashfree",
  displayName: "Cashfree",

  isEnabled() {
    return Boolean(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY);
  },

  async createCheckout(req: CheckoutRequest): Promise<CheckoutResponse> {
    if (!cashfree.isEnabled()) {
      throw new Error("Cashfree is not configured. Add CASHFREE_APP_ID and CASHFREE_SECRET_KEY.");
    }
    const orderId = `glintr_${req.workspaceId.slice(0, 8)}_${Date.now()}`;
    const total = Math.max(0, req.amountInr + req.taxInr - req.discountInr);
    const res = await fetch(`${baseUrl()}/orders`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        order_id: orderId,
        order_amount: total,
        order_currency: "INR",
        customer_details: {
          customer_id: req.customer.id,
          customer_email: req.customer.email,
          customer_name: req.customer.name ?? req.customer.email,
          customer_phone: "0000000000",
        },
        order_meta: {
          return_url: `${req.successUrl}?order_id={order_id}`,
          notify_url: `${req.successUrl.replace(/\/[^/]*$/, "")}/api/public/billing/cashfree/webhook`,
        },
        order_note: `${req.planCode}/${req.billingCycle}`,
        order_tags: {
          workspace_id: req.workspaceId,
          plan_code: req.planCode,
          idempotency_key: req.idempotencyKey,
        },
      }),
    });
    const j = (await res.json()) as {
      order_id?: string;
      payment_session_id?: string;
      order_expiry_time?: string;
      message?: string;
    };
    if (!res.ok || !j.payment_session_id) {
      throw new Error(j.message ?? `Cashfree order failed (${res.status})`);
    }
    return {
      provider: "cashfree",
      orderId: j.order_id ?? orderId,
      paymentSessionId: j.payment_session_id,
      expiresAt: j.order_expiry_time,
    };
  },

  async verifyWebhook(rawBody, headers): Promise<WebhookVerification> {
    const secret = process.env.CASHFREE_WEBHOOK_SECRET;
    const signature = headers["x-webhook-signature"] ?? headers["X-Webhook-Signature"];
    const timestamp = headers["x-webhook-timestamp"] ?? headers["X-Webhook-Timestamp"];
    if (!secret || !signature || !timestamp) {
      return { ok: false, reason: "Missing signature/timestamp/secret" };
    }
    const { createHmac, timingSafeEqual } = await import("crypto");
    const expected = createHmac("sha256", secret).update(timestamp + rawBody).digest("base64");
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, reason: "Signature mismatch" };
    }
    try {
      const payload = JSON.parse(rawBody);
      return {
        ok: true,
        eventId: payload?.data?.payment?.cf_payment_id?.toString() ?? payload?.event_time,
        eventType: payload?.type ?? "unknown",
        payload,
      };
    } catch {
      return { ok: false, reason: "Invalid JSON" };
    }
  },

  async refundPayment(req: RefundRequest): Promise<RefundResponse> {
    if (!cashfree.isEnabled()) throw new Error("Cashfree not configured");
    const res = await fetch(`${baseUrl()}/orders/${req.providerPaymentId}/refunds`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        refund_amount: req.amountInr,
        refund_id: req.idempotencyKey,
        refund_note: req.reason ?? "Refund",
      }),
    });
    const j = (await res.json()) as { cf_refund_id?: string; refund_status?: string; message?: string };
    if (!res.ok) return { ok: false, status: "failed" };
    return {
      ok: true,
      providerRefundId: j.cf_refund_id,
      status: (j.refund_status?.toLowerCase() as RefundResponse["status"]) ?? "pending",
    };
  },
};
