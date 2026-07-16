import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, Square, Volume2 } from "lucide-react";

type State = "idle" | "loading" | "playing" | "paused" | "error";

export function useTts() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);

  const cleanup = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const speak = useCallback(
    async (text: string, opts?: { voice?: string; speed?: number }) => {
      if (!text.trim()) return;
      cleanup();
      setError(null);
      setState("loading");
      try {
        const res = await fetch("/api/voice/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice: opts?.voice, speed: opts?.speed }),
        });
        if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        const audio = audioRef.current ?? new Audio();
        audioRef.current = audio;
        audio.src = url;
        audio.playbackRate = opts?.speed ?? 1;
        audio.onended = () => setState("idle");
        audio.onpause = () => setState((s) => (s === "playing" ? "paused" : s));
        audio.onplay = () => setState("playing");
        await audio.play();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Playback error");
        setState("error");
      }
    },
    [cleanup],
  );

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  }, []);

  const stop = useCallback(() => {
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.currentTime = 0;
    }
    setState("idle");
  }, []);

  return { state, error, speak, toggle, stop };
}

export function TtsBar({
  text,
  voice,
  speed = 1,
  label = "Listen",
}: {
  text: string;
  voice?: string;
  speed?: number;
  label?: string;
}) {
  const { state, speak, toggle, stop, error } = useTts();
  const busy = state === "loading";
  return (
    <div className="flex flex-wrap items-center gap-2">
      {state === "idle" || state === "error" ? (
        <button
          type="button"
          onClick={() => speak(text, { voice, speed })}
          disabled={busy || !text.trim()}
          className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/70 disabled:opacity-60"
        >
          <Volume2 className="h-4 w-4" /> {label}
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={toggle}
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-4 py-2 text-sm font-medium hover:bg-muted/70"
          >
            {state === "playing" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {state === "playing" ? "Pause" : state === "loading" ? "Loading…" : "Resume"}
          </button>
          <button
            type="button"
            onClick={stop}
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-2 text-sm hover:bg-muted/70"
          >
            <Square className="h-4 w-4" /> Stop
          </button>
        </>
      )}
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </div>
  );
}
