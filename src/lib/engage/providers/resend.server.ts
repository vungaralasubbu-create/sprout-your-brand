import type { EngageProviderAdapter, ProviderConfig } from "./registry.server";
import type { RenderedMessage, SendResult, VerifyResult, WebhookEvent } from "../types";

export const resendAdapter: EngageProviderAdapter = {
  kind: "resend",
  displayName: "Resend",
  channel: "email",
  supportsWebhooks: true,

  async verify(config: ProviderConfig): Promise<VerifyResult> {
    if (!config.secret) return { ok: false, error: "Resend API key is required" };
    try {
      const res = await fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${config.secret}` },
      });
      if (!res.ok) return { ok: false, error: `Resend rejected the key (HTTP ${res.status})` };
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
  },

  async send(config: ProviderConfig, message: RenderedMessage): Promise<SendResult> {
    // Prefer env-based Resend config so every engage send goes through the
    // same centralized credentials as sendEmail().
    const apiKey = config.secret ?? process.env.RESEND_API_KEY;
    if (!apiKey) {
      return { ok: false, error_code: "missing_key", error_message: "RESEND_API_KEY not set" };
    }
    const fromEmail = message.from_email ?? config.from_email ?? process.env.FROM_EMAIL ?? "onboarding@resend.dev";
    const fromName = message.from_name ?? config.from_name ?? process.env.FROM_NAME ?? "Glintr";
    const replyTo = message.reply_to ?? config.reply_to ?? process.env.REPLY_TO ?? process.env.SUPPORT_EMAIL;
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: [message.recipient],
          subject: message.subject ?? "",
          html: message.html ?? "",
          text: message.text ?? "",
          reply_to: replyTo,
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
      return { ok: true, provider: "resend", provider_message_id: json?.id, status: "sent" };
    } catch (err) {
      return {
        ok: false,
        status: "failed",
        error_code: "network_error",
        error_message: err instanceof Error ? err.message : String(err),
      };
    }
  },

  async parseWebhook(request: Request): Promise<WebhookEvent[]> {
    try {
      // Resend uses Svix-signed webhooks. Require RESEND_WEBHOOK_SECRET and
      // verify svix-id / svix-timestamp / svix-signature before trusting.
      const secret = process.env.RESEND_WEBHOOK_SECRET;
      if (!secret) return [];
      const svixId = request.headers.get("svix-id");
      const svixTs = request.headers.get("svix-timestamp");
      const svixSig = request.headers.get("svix-signature");
      const raw = await request.text();
      if (!svixId || !svixTs || !svixSig) return [];
      // Reject replays older than 5 minutes.
      const tsSec = Number(svixTs);
      if (!Number.isFinite(tsSec) || Math.abs(Date.now() / 1000 - tsSec) > 300) return [];
      const { createHmac, timingSafeEqual } = await import("crypto");
      // Svix secrets are formatted `whsec_<base64>`; strip the prefix.
      const key = secret.startsWith("whsec_") ? secret.slice(6) : secret;
      const secretBuf = Buffer.from(key, "base64");
      const signed = `${svixId}.${svixTs}.${raw}`;
      const expected = createHmac("sha256", secretBuf).update(signed).digest("base64");
      const parts = svixSig.split(" ").map((p) => p.trim()).filter(Boolean);
      const ok = parts.some((p) => {
        const [, sig] = p.split(",");
        if (!sig || sig.length !== expected.length) return false;
        try { return timingSafeEqual(Buffer.from(sig), Buffer.from(expected)); } catch { return false; }
      });
      if (!ok) return [];

      const body = JSON.parse(raw) as {
        type?: string;
        data?: { email_id?: string; to?: string[] };
      };
      const map: Record<string, WebhookEvent["event"]> = {
        "email.sent": "sent",
        "email.delivered": "delivered",
        "email.opened": "opened",
        "email.clicked": "clicked",
        "email.bounced": "bounced",
        "email.complained": "complained",
        "email.unsubscribed": "unsubscribed",
      };
      const ev = map[body.type ?? ""];
      if (!ev) return [];
      return [{
        provider: "resend",
        event: ev,
        provider_message_id: body.data?.email_id,
        recipient: body.data?.to?.[0],
        timestamp: new Date().toISOString(),
      }];
    } catch {
      return [];
    }
  },

};
