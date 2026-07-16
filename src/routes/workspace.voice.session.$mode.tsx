import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { getMode, type VoiceMode } from "@/lib/voice/modes";
import {
  createSession,
  getSession,
  saveSession,
  useVoiceSettings,
  type VoiceSession,
  type VoiceTurn,
} from "@/lib/voice/store";
import { voiceChat } from "@/lib/voice/voice.functions";
import { MicRecorder } from "@/components/voice/mic-recorder";
import { useTts } from "@/components/voice/tts-player";
import { ArrowLeft, Bookmark, BookmarkCheck, Pause, Play, Send, Sparkles, Square } from "lucide-react";

const searchSchema = z.object({
  sessionId: z.string().optional(),
  q: z.string().optional(),
});

function newId() {
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function VoiceSessionPage() {
  const { mode: modeId } = Route.useParams();
  const { sessionId, q } = Route.useSearch();
  const navigate = useNavigate();
  const mode = getMode(modeId) as VoiceMode | undefined;
  if (!mode) throw notFound();

  const { settings } = useVoiceSettings();
  const chat = useServerFn(voiceChat);
  const tts = useTts();
  const [session, setSession] = useState<VoiceSession | null>(null);
  const [input, setInput] = useState(q ?? "");
  const [busy, setBusy] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bootstrappedRef = useRef(false);

  // Bootstrap session
  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    const existing = sessionId ? getSession(sessionId) : undefined;
    if (existing && existing.mode === modeId) {
      setSession(existing);
    } else {
      const s = createSession(modeId as VoiceMode["id"], mode.label);
      setSession(s);
      navigate({
        to: "/workspace/voice/session/$mode",
        params: { mode: modeId },
        search: { sessionId: s.id, q },
        replace: true,
      });
    }
  }, [sessionId, modeId, mode.label, navigate, q]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [session?.turns.length]);

  const send = async (text: string) => {
    if (!session || busy || !text.trim()) return;
    setError(null);
    setInput("");
    const userTurn: VoiceTurn = { id: newId(), role: "user", text: text.trim(), ts: Date.now() };
    const nextTurns = [...session.turns, userTurn];
    const updated = { ...session, turns: nextTurns, title: session.turns.length === 0 ? text.slice(0, 60) : session.title };
    setSession(updated);
    saveSession(updated);
    setBusy(true);
    try {
      const messages = nextTurns.slice(-14).map((t) => ({ role: t.role, content: t.text }));
      const res = await chat({ data: { modeId, messages } });
      const asstTurn: VoiceTurn = { id: newId(), role: "assistant", text: res.reply, ts: Date.now() };
      const withReply = { ...updated, turns: [...nextTurns, asstTurn] };
      setSession(withReply);
      saveSession(withReply);
      if (autoSpeak && res.reply) {
        tts.speak(res.reply, { voice: settings.voice || mode.voice, speed: settings.speed });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Voice service error");
    } finally {
      setBusy(false);
    }
  };

  const toggleBookmark = (turnId: string) => {
    if (!session) return;
    const has = session.bookmarks.includes(turnId);
    const next = {
      ...session,
      bookmarks: has ? session.bookmarks.filter((b) => b !== turnId) : [...session.bookmarks, turnId],
    };
    setSession(next);
    saveSession(next);
  };

  const starters = useMemo(() => mode.starters, [mode]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="rounded-3xl border border-border/60 bg-card/70 p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/workspace/voice" className="rounded-full border border-border/60 p-2 hover:bg-muted/60" aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{mode.tagline}</p>
              <h2 className="text-lg font-semibold">{mode.label}</h2>
            </div>
          </div>
          <label className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs font-medium">
            <input type="checkbox" checked={autoSpeak} onChange={(e) => setAutoSpeak(e.target.checked)} className="h-3 w-3" />
            Auto play voice
          </label>
        </div>

        <div
          ref={scrollRef}
          className={`max-h-[54vh] min-h-[300px] overflow-y-auto rounded-2xl border border-border/50 bg-background/70 p-4 ${
            settings.subtitleSize === "lg" ? "text-lg" : settings.subtitleSize === "sm" ? "text-xs" : "text-sm"
          }`}
        >
          {(!session || session.turns.length === 0) && (
            <div className="py-8 text-center text-muted-foreground">
              <Sparkles className="mx-auto mb-2 h-5 w-5" />
              <p>Tap the mic and start talking, or pick a starter.</p>
            </div>
          )}
          <ul className="space-y-3">
            {session?.turns.map((t) => (
              <li key={t.id} className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`group max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    t.role === "user"
                      ? "bg-foreground text-background"
                      : "border border-border/60 bg-card text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{t.text}</p>
                  {t.role === "assistant" && (
                    <div className="mt-2 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => tts.speak(t.text, { voice: settings.voice || mode.voice, speed: settings.speed })}
                        className="rounded-full border border-border/60 p-1.5 hover:bg-muted/70"
                        aria-label="Replay"
                      >
                        <Play className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleBookmark(t.id)}
                        className="rounded-full border border-border/60 p-1.5 hover:bg-muted/70"
                        aria-label="Bookmark"
                      >
                        {session?.bookmarks.includes(t.id) ? <BookmarkCheck className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
            {busy && (
              <li className="flex justify-start">
                <div className="rounded-2xl border border-border/60 bg-card px-4 py-2 text-sm text-muted-foreground">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/60" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/60 [animation-delay:0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/60 [animation-delay:0.3s]" />
                  </span>
                </div>
              </li>
            )}
          </ul>
        </div>

        {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}

        <div className="mt-4 grid gap-3 sm:grid-cols-[auto_1fr_auto]">
          <MicRecorder onTranscript={(t) => send(t)} disabled={busy} />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="…or type your message"
              className="flex-1 rounded-full border border-border/60 bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/30"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background disabled:opacity-60"
            >
              <Send className="h-4 w-4" /> Send
            </button>
          </form>
          <div className="flex items-center gap-2">
            {tts.state === "playing" ? (
              <button type="button" onClick={tts.toggle} className="rounded-full border border-border/60 p-2 hover:bg-muted/70" aria-label="Pause">
                <Pause className="h-4 w-4" />
              </button>
            ) : tts.state === "paused" ? (
              <button type="button" onClick={tts.toggle} className="rounded-full border border-border/60 p-2 hover:bg-muted/70" aria-label="Resume">
                <Play className="h-4 w-4" />
              </button>
            ) : null}
            {(tts.state === "playing" || tts.state === "paused") && (
              <button type="button" onClick={tts.stop} className="rounded-full border border-border/60 p-2 hover:bg-muted/70" aria-label="Stop">
                <Square className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-3xl border border-border/60 bg-card/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">About this mode</p>
          <p className="mt-2 text-sm text-muted-foreground">{mode.description}</p>
        </div>
        <div className="rounded-3xl border border-border/60 bg-card/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Starters</p>
          <ul className="mt-3 grid gap-2">
            {starters.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => send(s)}
                  disabled={busy}
                  className="w-full rounded-2xl border border-border/60 bg-background px-3 py-2 text-left text-sm hover:bg-muted/70 disabled:opacity-60"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </div>
        {session && session.bookmarks.length > 0 && (
          <div className="rounded-3xl border border-border/60 bg-card/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Bookmarks</p>
            <ul className="mt-2 space-y-2 text-sm">
              {session.turns
                .filter((t) => session.bookmarks.includes(t.id))
                .map((t) => (
                  <li key={t.id} className="line-clamp-3 rounded-xl bg-background/70 p-2 text-muted-foreground">
                    {t.text}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}

export const Route = createFileRoute("/workspace/voice/session/$mode")({
  validateSearch: (s: Record<string, unknown>) => searchSchema.parse(s),
  component: VoiceSessionPage,
});
