// Channel abstraction for the AI Sales Agent.
// All business logic goes through this interface so we can plug in
// Meta WhatsApp Cloud API, Twilio, Gupshup, Interakt, AiSensy, Instagram,
// Messenger, SMS, Telegram, etc. without rewriting the app.

export type ChannelId =
  | "web"
  | "whatsapp"
  | "instagram"
  | "messenger"
  | "sms"
  | "telegram"
  | "other";

export type OutboundMessage = {
  text: string;
  quickReplies?: string[];
  cards?: Array<{
    title: string;
    subtitle?: string;
    imageUrl?: string;
    href?: string;
    price?: string;
  }>;
  media?: Array<{ type: "image" | "video" | "document"; url: string; caption?: string }>;
};

export type InboundMessage = {
  externalId: string; // provider-side conversation/thread id (phone number, thread id)
  provider: string;
  channel: ChannelId;
  from: { name?: string; phone?: string; email?: string };
  text: string;
  language?: string;
  raw?: unknown;
};

export interface ChannelProvider {
  readonly id: string;
  readonly channel: ChannelId;
  send(to: string, message: OutboundMessage): Promise<{ ok: boolean; providerMessageId?: string; error?: string }>;
  parseWebhook(payload: unknown, headers: Record<string, string>): Promise<InboundMessage[]>;
  verifySignature?(payload: string, headers: Record<string, string>): boolean;
}

// Registry — providers register themselves at module import time.
const registry = new Map<string, ChannelProvider>();

export function registerChannelProvider(provider: ChannelProvider) {
  registry.set(provider.id, provider);
}

export function getChannelProvider(id: string): ChannelProvider | undefined {
  return registry.get(id);
}

export function listChannelProviders(): ChannelProvider[] {
  return Array.from(registry.values());
}

// Web (built-in) provider — no-op sender; the widget renders replies directly.
class WebChannelProvider implements ChannelProvider {
  readonly id = "web";
  readonly channel: ChannelId = "web";
  async send() {
    return { ok: true };
  }
  async parseWebhook() {
    return [];
  }
}
registerChannelProvider(new WebChannelProvider());

// Stub providers — return "not configured" so the webhook is idempotent
// once real credentials are added. Each provider is a self-contained class
// that reads its own secrets inside methods.

class WhatsAppCloudProvider implements ChannelProvider {
  readonly id = "whatsapp_cloud";
  readonly channel: ChannelId = "whatsapp";
  verifySignature(payload: string, headers: Record<string, string>): boolean {
    const appSecret = process.env.META_WHATSAPP_APP_SECRET;
    if (!appSecret) return false; // require configured secret before trusting webhook
    const sig = headers["x-hub-signature-256"] || headers["X-Hub-Signature-256"];
    if (!sig || !sig.startsWith("sha256=")) return false;
    try {
      const { createHmac, timingSafeEqual } = require("crypto") as typeof import("crypto");
      const expected = createHmac("sha256", appSecret).update(payload, "utf8").digest("hex");
      const provided = sig.slice(7);
      if (provided.length !== expected.length) return false;
      return timingSafeEqual(Buffer.from(provided, "hex"), Buffer.from(expected, "hex"));
    } catch {
      return false;
    }
  }
  async send(to: string, message: OutboundMessage) {
    const token = process.env.META_WHATSAPP_TOKEN;
    const phoneId = process.env.META_WHATSAPP_PHONE_ID;
    if (!token || !phoneId) return { ok: false, error: "WhatsApp Cloud not configured" };
    try {
      const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: message.text.slice(0, 4096) },
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, error: `WhatsApp ${res.status}: ${JSON.stringify(body).slice(0, 200)}` };
      const id = (body as { messages?: Array<{ id?: string }> })?.messages?.[0]?.id;
      return { ok: true, providerMessageId: id };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "send failed" };
    }
  }
  async parseWebhook(payload: unknown): Promise<InboundMessage[]> {
    const body = payload as {
      entry?: Array<{
        changes?: Array<{
          value?: {
            messages?: Array<{ from?: string; text?: { body?: string }; id?: string }>;
            contacts?: Array<{ profile?: { name?: string } }>;
          };
        }>;
      }>;
    };
    const out: InboundMessage[] = [];
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const val = change.value;
        if (!val) continue;
        const name = val.contacts?.[0]?.profile?.name;
        for (const msg of val.messages ?? []) {
          if (!msg.from || !msg.text?.body) continue;
          out.push({
            externalId: msg.from,
            provider: "whatsapp_cloud",
            channel: "whatsapp",
            from: { phone: msg.from, name },
            text: msg.text.body,
            raw: msg,
          });
        }
      }
    }
    return out;
  }
}
registerChannelProvider(new WhatsAppCloudProvider());

class TwilioProvider implements ChannelProvider {
  readonly id = "twilio";
  readonly channel: ChannelId = "whatsapp";
  verifySignature(payload: string, headers: Record<string, string>): boolean {
    // Twilio signs the concatenation of the full URL + sorted form params.
    // Webhook body is form-encoded; we reconstruct signing string from the raw payload.
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const webhookUrl = process.env.TWILIO_WEBHOOK_URL; // must be set to the exact URL Twilio calls
    const provided = headers["x-twilio-signature"] || headers["X-Twilio-Signature"];
    if (!authToken || !webhookUrl || !provided) return false;
    try {
      const { createHmac, timingSafeEqual } = require("crypto") as typeof import("crypto");
      const params = new URLSearchParams(payload);
      const sorted = Array.from(params.keys()).sort();
      let data = webhookUrl;
      for (const k of sorted) data += k + (params.get(k) ?? "");
      const expected = createHmac("sha1", authToken).update(data, "utf8").digest("base64");
      const a = Buffer.from(provided);
      const b = Buffer.from(expected);
      if (a.length !== b.length) return false;
      return timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }
  async send(to: string, message: OutboundMessage) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_FROM;
    if (!sid || !token || !from) return { ok: false, error: "Twilio not configured" };
    const form = new URLSearchParams({
      From: from,
      To: to.startsWith("whatsapp:") ? to : `whatsapp:${to}`,
      Body: message.text.slice(0, 1500),
    });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: `Twilio ${res.status}` };
    return { ok: true, providerMessageId: (body as { sid?: string })?.sid };
  }
  async parseWebhook(payload: unknown): Promise<InboundMessage[]> {
    const p = payload as { From?: string; Body?: string; ProfileName?: string };
    if (!p.From || !p.Body) return [];
    return [{
      externalId: p.From,
      provider: "twilio",
      channel: "whatsapp",
      from: { phone: p.From.replace(/^whatsapp:/, ""), name: p.ProfileName },
      text: p.Body,
      raw: p,
    }];
  }
}
registerChannelProvider(new TwilioProvider());


// Gupshup, Interakt, AiSensy stubs — normalized shape, ready for wiring
class GupshupProvider implements ChannelProvider {
  readonly id = "gupshup";
  readonly channel: ChannelId = "whatsapp";
  async send() { return { ok: false, error: "Gupshup not configured" }; }
  async parseWebhook() { return []; }
}
registerChannelProvider(new GupshupProvider());

class InteraktProvider implements ChannelProvider {
  readonly id = "interakt";
  readonly channel: ChannelId = "whatsapp";
  async send() { return { ok: false, error: "Interakt not configured" }; }
  async parseWebhook() { return []; }
}
registerChannelProvider(new InteraktProvider());

class AiSensyProvider implements ChannelProvider {
  readonly id = "aisensy";
  readonly channel: ChannelId = "whatsapp";
  async send() { return { ok: false, error: "AiSensy not configured" }; }
  async parseWebhook() { return []; }
}
registerChannelProvider(new AiSensyProvider());
