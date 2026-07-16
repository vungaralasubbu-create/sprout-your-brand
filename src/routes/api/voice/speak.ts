import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/voice/speak")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Voice service not configured", { status: 500 });

        let body: { text?: string; voice?: string; speed?: number };
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        const text = String(body.text ?? "").trim();
        if (!text) return new Response("Missing text", { status: 400 });
        if (text.length > 4000) return new Response("Text too long", { status: 413 });

        const voice = String(body.voice ?? "alloy");
        const speed = Math.max(0.5, Math.min(2, Number(body.speed ?? 1)));

        try {
          const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "openai/gpt-4o-mini-tts",
              input: text,
              voice,
              speed,
              response_format: "mp3",
            }),
          });
          if (!res.ok) {
            const t = await res.text().catch(() => "");
            return new Response(`Speech failed: ${t.slice(0, 200)}`, { status: res.status });
          }
          return new Response(res.body, {
            status: 200,
            headers: {
              "Content-Type": "audio/mpeg",
              "Cache-Control": "no-store",
            },
          });
        } catch (e) {
          return new Response(e instanceof Error ? e.message : "Speech error", { status: 502 });
        }
      },
    },
  },
});
