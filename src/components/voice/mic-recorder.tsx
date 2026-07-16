import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";

type Status = "idle" | "recording" | "transcribing" | "error";

export function MicRecorder({
  onTranscript,
  disabled,
  label = "Hold to speak",
}: {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  label?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (ctxRef.current && ctxRef.current.state !== "closed") ctxRef.current.close().catch(() => {});
    ctxRef.current = null;
    setLevel(0);
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const start = useCallback(async () => {
    if (status === "recording" || status === "transcribing" || disabled) return;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      streamRef.current = stream;
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        setLevel(Math.min(1, Math.sqrt(sum / buf.length) * 3));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();

      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.start();
      mediaRef.current = rec;
      setStatus("recording");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Microphone unavailable");
      setStatus("error");
      cleanup();
    }
  }, [status, disabled, cleanup]);

  const stop = useCallback(async () => {
    const rec = mediaRef.current;
    if (!rec || rec.state === "inactive") return;
    setStatus("transcribing");
    await new Promise<void>((resolve) => {
      rec.onstop = () => resolve();
      rec.stop();
    });
    cleanup();
    const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || "audio/webm" });
    if (blob.size < 1024) {
      setStatus("idle");
      setError("Recording too short.");
      return;
    }
    try {
      const fd = new FormData();
      fd.append("file", blob, `voice.${blob.type.includes("mp4") ? "mp4" : "webm"}`);
      const res = await fetch("/api/voice/transcribe", { method: "POST", body: fd });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      const { text } = (await res.json()) as { text?: string };
      const clean = String(text ?? "").trim();
      if (!clean) throw new Error("No speech detected");
      onTranscript(clean);
      setStatus("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transcription failed");
      setStatus("error");
    }
  }, [cleanup, onTranscript]);

  const isRec = status === "recording";
  const isBusy = status === "transcribing";

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        aria-label={isRec ? "Stop recording" : "Start recording"}
        aria-pressed={isRec}
        disabled={disabled || isBusy}
        onClick={isRec ? stop : start}
        className={`relative flex h-20 w-20 items-center justify-center rounded-full border transition-all sm:h-24 sm:w-24 ${
          isRec
            ? "border-rose-400/50 bg-rose-500/10 text-rose-600 shadow-[0_0_0_8px_oklch(0.72_0.19_25/0.15)]"
            : "border-border/70 bg-foreground text-background hover:scale-[1.03]"
        } disabled:opacity-60`}
      >
        {isBusy ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : isRec ? (
          <Square className="h-7 w-7" />
        ) : (
          <Mic className="h-8 w-8" />
        )}
        {isRec && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full border border-rose-400/40"
            style={{ transform: `scale(${1 + level * 0.4})`, transition: "transform 80ms linear" }}
          />
        )}
      </button>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {status === "recording"
          ? "Listening…"
          : status === "transcribing"
            ? "Transcribing…"
            : status === "error"
              ? error ?? "Something went wrong."
              : label}
      </p>
    </div>
  );
}
