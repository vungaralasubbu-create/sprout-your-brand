/**
 * Lovable Emails adapter — the default provider. Sends through the Lovable
 * managed email API using LOVABLE_API_KEY. Requires no user-provided secret.
 * When the platform has no configured sender domain yet, the adapter
 * gracefully returns `queued` so the pipeline records the intent without
 * throwing.
 */

import type { EngageProviderAdapter, ProviderConfig } from "./registry.server";
import type { RenderedMessage, SendResult, VerifyResult, WebhookEvent } from "../types";

const LOVABLE_EMAIL_ENDPOINT = "https://email.gateway.lovable.dev/v1/messages";

export const lovableAdapter: EngageProviderAdapter = {
  kind: "lovable",
  displayName: "Lovable Emails (Managed)",
  channel: "email",
  supportsWebhooks: true,

  async verify(_config: ProviderConfig): Promise<VerifyResult> {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { ok: false, error: "LOVABLE_API_KEY not configured" };
    return { ok: true };
  },

  async send(config: ProviderConfig, message: RenderedMessage): Promise<SendResult> {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      return {
        ok: false,
        error_code: "missing_key",
        error_message: "LOVABLE_API_KEY is not configured on the server",
      };
    }

    const fromEmail = message.from_email ?? config.from_email;
    const fromName = message.from_name ?? config.from_name ?? "Glintr";

    if (!fromEmail) {
      // No verified sender yet — queue for later, don't fail.
      return {
        ok: true,
        queued: true,
        status: "queued",
        error_code: "no_sender",
        error_message: "No verified sender configured; message queued",
      };
    }

    try {
      const res = await fetch(LOVABLE_EMAIL_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": key,
        },
        body: JSON.stringify({
          from: { name: fromName, email: fromEmail },
          to: [{ email: message.recipient }],
          reply_to: message.reply_to ?? config.reply_to,
          subject: message.subject ?? "",
          html: message.html ?? "",
          text: message.text ?? "",
          headers: {
            "X-Glintr-Template": message.metadata?.template_key,
            "X-Glintr-Campaign": message.metadata?.campaign_id,
          },
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        return {
          ok: false,
          status: "failed",
          error_code: `http_${res.status}`,
          error_message: body.slice(0, 500),
        };
      }

      const json = (await res.json().catch(() => ({}))) as { id?: string };
      return {
        ok: true,
        provider: "lovable",
        provider_message_id: json?.id,
        status: "sent",
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        status: "failed",
        error_code: "network_error",
        error_message: message,
      };
    }
  },

  async parseWebhook(request: Request): Promise<WebhookEvent[]> {
    try {
      const body = (await request.json()) as {
        type?: string;
        data?: { message_id?: string; recipient?: string };
      };
      if (!body?.type) return [];
      const map: Record<string, WebhookEvent["event"]> = {
        "email.sent": "sent",
        "email.delivered": "delivered",
        "email.opened": "opened",
        "email.clicked": "clicked",
        "email.bounced": "bounced",
        "email.complained": "complained",
        "email.unsubscribed": "unsubscribed",
      };
      const event = map[body.type];
      if (!event) return [];
      return [{
        provider: "lovable",
        event,
        provider_message_id: body.data?.message_id,
        recipient: body.data?.recipient,
        timestamp: new Date().toISOString(),
      }];
    } catch {
      return [];
    }
  },
};
