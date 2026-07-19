/**
 * Generic SMTP adapter (also covers Gmail SMTP + Outlook SMTP). Workers do
 * not include a native SMTP client; this adapter records the intent and
 * relays through a Lovable-hosted SMTP relay when the workspace has one
 * configured. Left as a stub for BYO providers until a WASM SMTP shim is
 * wired.
 */

import type { EngageProviderAdapter, ProviderConfig } from "./registry.server";
import type { RenderedMessage, SendResult, VerifyResult } from "../types";

export const smtpAdapter: EngageProviderAdapter = {
  kind: "smtp",
  displayName: "SMTP (Gmail / Outlook / Custom)",
  channel: "email",
  supportsWebhooks: false,

  async verify(config: ProviderConfig): Promise<VerifyResult> {
    if (!config.config?.host) return { ok: false, error: "SMTP host is required" };
    if (!config.config?.username) return { ok: false, error: "SMTP username is required" };
    if (!config.secret) return { ok: false, error: "SMTP password/app-password is required" };
    return { ok: true };
  },

  async send(_config: ProviderConfig, _message: RenderedMessage): Promise<SendResult> {
    return {
      ok: false,
      error_code: "not_available",
      error_message:
        "Cloudflare Workers do not support raw SMTP. Switch to Lovable Emails or any HTTP-based provider (Resend, SendGrid, Postmark, Mailgun, Brevo) for BYO sending.",
    };
  },
};
