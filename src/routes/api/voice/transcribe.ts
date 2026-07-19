import { createFileRoute } from "@tanstack/react-router";
import { requireAuthedUser } from "@/lib/server/require-auth.server";

export const Route = createFileRoute("/api/voice/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await requireAuthedUser(request);
        if (!auth.ok) return auth.response;

        const key = process.env.OPENAI_API_KEY;
        if (!key) return new Response("Voice service not configured (OPENAI_API_KEY missing)", { status: 500 });

        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof Blob)) return new Response("Missing audio file", { status: 400 });
        if (file.size < 1024) return new Response("Recording too short. Please try again.", { status: 400 });
        if (file.size > 20 * 1024 * 1024) return new Response("Recording exceeds 20MB.", { status: 413 });

        const type = (file.type || "audio/webm").split(";")[0];
        const ext =
          ({ "audio/webm": "webm", "audio/mp4": "mp4", "audio/mpeg": "mp3", "audio/wav": "wav", "audio/ogg": "ogg" } as Record<string, string>)[type] ?? "webm";

        const upstream = new FormData();
        upstream.append("model", "gpt-4o-mini-transcribe");
        upstream.append("file", file, `recording.${ext}`);

        try {
          const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: { Authorization: `Bearer ${key}` },
            body: upstream,
          });
          if (!res.ok) {
            const t = await res.text().catch(() => "");
            return new Response(`Transcription failed: ${t.slice(0, 200)}`, { status: res.status });
          }
          const json = await res.json();
          return Response.json({ text: String(json?.text ?? "") });
        } catch (e) {
          return new Response(e instanceof Error ? e.message : "Transcription error", { status: 502 });
        }
      },
    },
  },
});
