import { createFileRoute, Link } from "@tanstack/react-router";
import { VOICE_MODES } from "@/lib/voice/modes";
import { useVoiceSessions } from "@/lib/voice/store";
import { ArrowRight, Sparkles, Clock } from "lucide-react";

function VoiceHome() {
  const { sessions } = useVoiceSessions();
  const recent = sessions.slice(0, 3);
  const suggested = [
    "Explain Artificial Intelligence",
    "Teach Machine Learning basics",
    "Mock interview for AI Engineer",
    "Roleplay: skeptical sales lead",
    "Explain prompt engineering",
    "Behavioral interview practice",
  ];
  return (
    <div className="space-y-10">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-sky-500/10 via-cyan-400/5 to-emerald-400/10 p-6 sm:p-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Voice Companion
          </span>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
            Learn, revise, and rehearse — out loud.
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Ask a question, run a mock interview, or dictate a note. Everything stays in your workspace.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              to="/workspace/voice/session/$mode"
              params={{ mode: "learning-tutor" }}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90"
            >
              Start conversation <ArrowRight className="h-4 w-4" />
            </Link>
            {recent[0] && (
              <Link
                to="/workspace/voice/session/$mode"
                params={{ mode: recent[0].mode }}
                search={{ sessionId: recent[0].id }}
                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted/70"
              >
                <Clock className="h-4 w-4" /> Continue previous
              </Link>
            )}
          </div>
        </div>
        <div className="rounded-3xl border border-border/60 bg-card/70 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Suggested topics</p>
          <ul className="mt-4 grid gap-2">
            {suggested.map((s) => (
              <li key={s}>
                <Link
                  to="/workspace/voice/session/$mode"
                  params={{ mode: "learning-tutor" }}
                  search={{ q: s }}
                  className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/70"
                >
                  <span>{s}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold tracking-tight">Voice modes</h3>
        <p className="mt-1 text-sm text-muted-foreground">Pick a companion tuned for what you want to do right now.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VOICE_MODES.map((m) => (
            <Link
              key={m.id}
              to="/workspace/voice/session/$mode"
              params={{ mode: m.id }}
              className={`group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br ${m.accent} p-5 transition-transform hover:-translate-y-0.5`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{m.tagline}</p>
              <h4 className="mt-2 text-lg font-semibold text-foreground">{m.label}</h4>
              <p className="mt-2 text-sm text-muted-foreground">{m.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-foreground">
                Start <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {recent.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold tracking-tight">Recent sessions</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((s) => (
              <Link
                key={s.id}
                to="/workspace/voice/session/$mode"
                params={{ mode: s.mode }}
                search={{ sessionId: s.id }}
                className="rounded-2xl border border-border/60 bg-card/70 p-4 hover:bg-muted/60"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{s.mode.replace(/-/g, " ")}</p>
                <p className="mt-1 line-clamp-1 text-sm font-semibold">{s.title || "Untitled session"}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {s.turns.length} turns · {new Date(s.updatedAt).toLocaleString()}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export const Route = createFileRoute("/workspace/voice/")({
  component: VoiceHome,
});
