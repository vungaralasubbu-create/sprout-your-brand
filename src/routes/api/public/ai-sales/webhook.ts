import { createFileRoute } from "@tanstack/react-router";

import { getChannelProvider } from "@/lib/sales-agent/channels";
import { startSalesConversation, sendSalesMessage } from "@/lib/sales-agent/chat.functions";

// Unified webhook endpoint for all channel providers.
// Provider is passed as a query string, e.g.
//   POST /api/public/ai-sales/webhook?provider=whatsapp_cloud
// Each provider parses its own payload / verifies its own signature.
export const Route = createFileRoute("/api/public/ai-sales/webhook")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Meta WhatsApp verification handshake.
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");
        if (mode === "subscribe" && token && challenge && token === process.env.META_WHATSAPP_VERIFY_TOKEN) {
          return new Response(challenge, { status: 200 });
        }
        return new Response("ok", { status: 200 });
      },
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const providerId = url.searchParams.get("provider") ?? "whatsapp_cloud";
        const provider = getChannelProvider(providerId);
        if (!provider) return Response.json({ ok: false, error: "unknown_provider" }, { status: 404 });

        const rawText = await request.text();
        const headers: Record<string, string> = {};
        request.headers.forEach((v, k) => (headers[k.toLowerCase()] = v));
        // Every non-web provider MUST implement verifySignature. The web
        // provider is a no-op sender used by the on-site widget which goes
        // through authenticated server functions, not this webhook.
        if (provider.id !== "web") {
          if (!provider.verifySignature || !provider.verifySignature(rawText, headers)) {
            return new Response("Invalid signature", { status: 401 });
          }
        }


        let payload: unknown;
        try {
          payload = JSON.parse(rawText);
        } catch {
          // form-encoded providers (e.g. Twilio)
          const params = new URLSearchParams(rawText);
          payload = Object.fromEntries(params.entries());
        }

        const inbound = await provider.parseWebhook(payload, headers);
        for (const msg of inbound) {
          const sessionToken = `${provider.id}:${msg.externalId}`;
          const { conversationId } = await startSalesConversation({
            data: {
              sessionToken,
              channel: msg.channel,
              provider: msg.provider,
              externalId: msg.externalId,
              language: msg.language,
            },
          });
          const reply = await sendSalesMessage({
            data: { conversationId, message: msg.text },
          });
          await provider.send(msg.externalId, { text: reply.reply, quickReplies: reply.quickReplies });
        }
        return Response.json({ ok: true, received: inbound.length });
      },
    },
  },
});
