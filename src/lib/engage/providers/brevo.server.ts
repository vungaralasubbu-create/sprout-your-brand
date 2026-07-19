import type { EngageProviderAdapter, ProviderConfig } from "./registry.server";
import type { RenderedMessage, SendResult, VerifyResult } from "../types";

export const brevoAdapter: EngageProviderAdapter = {
  kind: "brevo",
  displayName: "Brevo (Sendinblue)",
  channel: "email",
  supportsWebhooks: true,

  async verify(config: ProviderConfig): Promise<VerifyResult> {
    if (!config.secret) return { ok: false, error: "Brevo API key required" };
    try {
      const res = await fetch("https://api.brevo.com/v3/account", {
        headers: { Accept: "application/json", "api-key": config.secret },
      });
      return res.ok ? { ok: true } : { ok: false, error: `Brevo HTTP ${res.status}` };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Unknown" };
    }
  },

  async send(config: ProviderConfig, message: RenderedMessage): Promise<SendResult> {
    if (!config.secret) return { ok: false, error_code: "missing_key", error_message: "Brevo key not set" };
    const fromEmail = message.from_email ?? config.from_email;
    if (!fromEmail) return { ok: false, error_code: "no_sender", error_message: "Brevo needs from_email" };
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": config.secret,
        },
        body: JSON.stringify({
          sender: { name: message.from_name ?? config.from_name ?? "Glintr", email: fromEmail },
          to: [{ email: message.recipient }],
          replyTo: message.reply_to ? { email: message.reply_to } : undefined,
          subject: message.subject ?? "",
          htmlContent: message.html,
          textContent: message.text,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, status: "failed", error_code: `http_${res.status}`, error_message: body.slice(0, 500) };
      }
      const json = (await res.json().catch(() => ({}))) as { messageId?: string };
      return { ok: true, provider: "brevo", provider_message_id: json?.messageId, status: "sent" };
    } catch (err) {
      return { ok: false, status: "failed", error_code: "network_error", error_message: err instanceof Error ? err.message : String(err) };
    }
  },
};
