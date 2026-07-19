import type { EngageProviderAdapter, ProviderConfig } from "./registry.server";
import type { RenderedMessage, SendResult, VerifyResult } from "../types";

export const sendgridAdapter: EngageProviderAdapter = {
  kind: "sendgrid",
  displayName: "SendGrid",
  channel: "email",
  supportsWebhooks: true,

  async verify(config: ProviderConfig): Promise<VerifyResult> {
    if (!config.secret) return { ok: false, error: "SendGrid API key required" };
    try {
      const res = await fetch("https://api.sendgrid.com/v3/user/profile", {
        headers: { Authorization: `Bearer ${config.secret}` },
      });
      return res.ok ? { ok: true } : { ok: false, error: `SendGrid HTTP ${res.status}` };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
  },

  async send(config: ProviderConfig, message: RenderedMessage): Promise<SendResult> {
    if (!config.secret) return { ok: false, error_code: "missing_key", error_message: "SendGrid key not set" };
    const fromEmail = message.from_email ?? config.from_email;
    if (!fromEmail) return { ok: false, error_code: "no_sender", error_message: "SendGrid needs from_email" };
    try {
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.secret}`,
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: message.recipient }] }],
          from: { email: fromEmail, name: message.from_name ?? config.from_name },
          reply_to: message.reply_to ? { email: message.reply_to } : undefined,
          subject: message.subject ?? "",
          content: [
            message.text ? { type: "text/plain", value: message.text } : null,
            message.html ? { type: "text/html", value: message.html } : null,
          ].filter(Boolean),
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, status: "failed", error_code: `http_${res.status}`, error_message: body.slice(0, 500) };
      }
      const msgId = res.headers.get("x-message-id") ?? undefined;
      return { ok: true, provider: "sendgrid", provider_message_id: msgId, status: "sent" };
    } catch (err) {
      return { ok: false, status: "failed", error_code: "network_error", error_message: err instanceof Error ? err.message : String(err) };
    }
  },
};
