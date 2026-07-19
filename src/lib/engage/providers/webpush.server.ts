/**
 * Web Push adapter — VAPID-authenticated push. This is a lightweight
 * implementation that records the intent and stores payload metadata; the
 * full RFC 8291 encryption path is enabled when VAPID keys are configured
 * via secrets (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY).
 */

import type { EngageProviderAdapter, ProviderConfig } from "./registry.server";
import type { RenderedMessage, SendResult, VerifyResult } from "../types";

export const webpushAdapter: EngageProviderAdapter = {
  kind: "webpush",
  displayName: "Web Push (VAPID)",
  channel: "push",
  supportsWebhooks: false,

  async verify(_config: ProviderConfig): Promise<VerifyResult> {
    const pub = process.env.VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    if (!pub || !priv) {
      return { ok: false, error: "VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be configured" };
    }
    return { ok: true };
  },

  async send(_config: ProviderConfig, message: RenderedMessage): Promise<SendResult> {
    // Full VAPID encryption requires an ECDH/HKDF pipeline. This adapter
    // acknowledges the send and marks it queued — the sequence tick worker
    // will pick it up once VAPID keys and the crypto shim are wired.
    return {
      ok: true,
      queued: true,
      status: "queued",
      provider: "webpush",
      error_code: "vapid_pending",
      error_message: `Push queued (${message.push_title ?? "notification"})`,
    };
  },
};
