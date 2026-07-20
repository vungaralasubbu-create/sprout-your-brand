/**
 * Provider-agnostic payment adapter interface.
 * Each provider (Cashfree, Stripe, Paddle, Razorpay, LemonSqueezy) implements this contract.
 * New providers only require an adapter file — no changes to consumers.
 */

export type ProviderCode = "cashfree" | "stripe" | "paddle" | "razorpay" | "lemonsqueezy";

export interface CustomerRef {
  id: string;
  email: string;
  name?: string;
  workspaceId: string;
}

export interface CheckoutRequest {
  workspaceId: string;
  planCode: string;
  billingCycle: "monthly" | "yearly";
  amountInr: number;
  taxInr: number;
  discountInr: number;
  customer: CustomerRef;
  couponCode?: string;
  successUrl: string;
  cancelUrl: string;
  idempotencyKey: string;
}

export interface CheckoutResponse {
  provider: ProviderCode;
  orderId: string;
  paymentSessionId?: string;
  paymentUrl?: string;
  expiresAt?: string;
}

export interface WebhookVerification {
  ok: boolean;
  eventId?: string;
  eventType?: string;
  payload?: unknown;
  reason?: string;
}

export interface RefundRequest {
  providerPaymentId: string;
  amountInr: number;
  reason?: string;
  idempotencyKey: string;
}

export interface RefundResponse {
  ok: boolean;
  providerRefundId?: string;
  status: "pending" | "processed" | "failed";
}

export interface PaymentProvider {
  code: ProviderCode;
  displayName: string;
  isEnabled: () => boolean;
  createCheckout: (req: CheckoutRequest) => Promise<CheckoutResponse>;
  verifyWebhook: (rawBody: string, headers: Record<string, string>) => Promise<WebhookVerification>;
  refundPayment: (req: RefundRequest) => Promise<RefundResponse>;
}
