import type { EngageProviderAdapter, ProviderConfig } from "./registry.server";
import type { RenderedMessage, SendResult, VerifyResult } from "../types";

export const mailgunAdapter: EngageProviderAdapter = {
  kind: "mailgun",
  displayName: "Mailgun",
  channel: "email",
  supportsWebhooks: true,

  async verify(config: ProviderConfig): Promise<VerifyResult> {
    if (!config.secret) return { ok: false, error: "Mailgun API key required" };
    return { ok: true };
  },

  async send(config: ProviderConfig, message: RenderedMessage): Promise<SendResult> {
    if (!config.secret) return { ok: false, error_code: "missing_key", error_message: "Mailgun key not set" };
    const domain = (config.config?.domain as string) ?? "";
    const region = (config.config?.region as string) ?? "us";
    if (!domain) return { ok: false, error_code: "no_domain", error_message: "Mailgun needs a verified domain" };
    const fromEmail = message.from_email ?? config.from_email;
    if (!fromEmail) return { ok: false, error_code: "no_sender", error_message: "Mailgun needs from_email" };

    const base = region === "eu" ? "https://api.eu.mailgun.net" : "https://api.mailgun.net";
    const auth = "Basic " + btoa(`api:${config.secret}`);
    const form = new URLSearchParams({
      from: message.from_name ? `${message.from_name} <${fromEmail}>` : fromEmail,
      to: message.recipient,
      subject: message.subject ?? "",
      html: message.html ?? "",
      text: message.text ?? "",
    });
    if (message.reply_to) form.set("h:Reply-To", message.reply_to);

    try {
      const res = await fetch(`${base}/v3/${encodeURIComponent(domain)}/messages`, {
        method: "POST",
        headers: {
          Authorization: auth,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      });
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, status: "failed", error_code: `http_${res.status}`, error_message: body.slice(0, 500) };
      }
      const json = (await res.json().catch(() => ({}))) as { id?: string };
      return { ok: true, provider: "mailgun", provider_message_id: json?.id, status: "sent" };
    } catch (err) {
      return { ok: false, status: "failed", error_code: "network_error", error_message: err instanceof Error ? err.message : String(err) };
    }
  },
};
