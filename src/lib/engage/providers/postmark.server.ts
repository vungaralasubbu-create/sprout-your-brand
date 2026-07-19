import type { EngageProviderAdapter, ProviderConfig } from "./registry.server";
import type { RenderedMessage, SendResult, VerifyResult } from "../types";

export const postmarkAdapter: EngageProviderAdapter = {
  kind: "postmark",
  displayName: "Postmark",
  channel: "email",
  supportsWebhooks: true,

  async verify(config: ProviderConfig): Promise<VerifyResult> {
    if (!config.secret) return { ok: false, error: "Postmark server token required" };
    try {
      const res = await fetch("https://api.postmarkapp.com/server", {
        headers: { Accept: "application/json", "X-Postmark-Server-Token": config.secret },
      });
      return res.ok ? { ok: true } : { ok: false, error: `Postmark HTTP ${res.status}` };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Unknown" };
    }
  },

  async send(config: ProviderConfig, message: RenderedMessage): Promise<SendResult> {
    if (!config.secret) return { ok: false, error_code: "missing_key", error_message: "Postmark token not set" };
    const fromEmail = message.from_email ?? config.from_email;
    if (!fromEmail) return { ok: false, error_code: "no_sender", error_message: "Postmark needs from_email" };
    try {
      const res = await fetch("https://api.postmarkapp.com/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Postmark-Server-Token": config.secret,
        },
        body: JSON.stringify({
          From: message.from_name ? `${message.from_name} <${fromEmail}>` : fromEmail,
          To: message.recipient,
          Subject: message.subject ?? "",
          HtmlBody: message.html,
          TextBody: message.text,
          ReplyTo: message.reply_to ?? config.reply_to,
          MessageStream: (config.config?.stream as string) ?? "outbound",
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, status: "failed", error_code: `http_${res.status}`, error_message: body.slice(0, 500) };
      }
      const json = (await res.json().catch(() => ({}))) as { MessageID?: string };
      return { ok: true, provider: "postmark", provider_message_id: json?.MessageID, status: "sent" };
    } catch (err) {
      return { ok: false, status: "failed", error_code: "network_error", error_message: err instanceof Error ? err.message : String(err) };
    }
  },
};
