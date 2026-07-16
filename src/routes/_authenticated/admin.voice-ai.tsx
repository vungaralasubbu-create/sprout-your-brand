import { createFileRoute } from "@tanstack/react-router";
import { VOICE_MODES } from "@/lib/voice/modes";
import { Mic, Volume2, Shield, Sparkles } from "lucide-react";

function AdminVoicePage() {
  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <Mic className="h-3 w-3" /> Voice AI
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Voice AI Control Center</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Manage voice modes, models, and safety guardrails for Glintr's voice learning platform.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "STT model", value: "openai/gpt-4o-mini-transcribe", icon: Mic },
          { label: "TTS model", value: "openai/gpt-4o-mini-tts", icon: Volume2 },
          { label: "Chat model", value: "google/gemini-2.5-flash", icon: Sparkles },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-border/60 bg-card/70 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <c.icon className="h-3.5 w-3.5" /> {c.label}
            </div>
            <p className="mt-2 font-mono text-sm">{c.value}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Configured voice modes</h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Mode</th>
                <th className="px-4 py-2">Default voice</th>
                <th className="px-4 py-2">Starters</th>
              </tr>
            </thead>
            <tbody>
              {VOICE_MODES.map((m) => (
                <tr key={m.id} className="border-t border-border/50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{m.label}</div>
                    <div className="text-xs text-muted-foreground">{m.tagline}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{m.voice}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{m.starters.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card/70 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Shield className="h-4 w-4" /> Safety & privacy
        </div>
        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
          <li>• User voice sessions are stored locally in the learner's browser — never on Glintr servers.</li>
          <li>• Audio is streamed to the AI Gateway for transcription and speech synthesis, then discarded.</li>
          <li>• Prompt injection guard: user speech is wrapped in USER_INPUT markers before reaching the model.</li>
          <li>• Rate limits and credit exhaustion errors from the AI Gateway are surfaced to learners.</li>
        </ul>
      </section>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/admin/voice-ai")({
  component: AdminVoicePage,
});
