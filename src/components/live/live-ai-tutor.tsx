import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { liveTutorAsk, type LiveTutorResponse } from "@/lib/live/live.functions";
import { Sparkles, Loader2 } from "lucide-react";

export function LiveAiTutor({
  classTitle,
  agenda,
  program,
  onCreateRevisionNote,
}: {
  classTitle: string;
  agenda: string[];
  program: string;
  onCreateRevisionNote?: (text: string) => void;
}) {
  const ask = useServerFn(liveTutorAsk);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [answers, setAnswers] = useState<{ q: string; a: LiveTutorResponse }[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function submit(q?: string) {
    const query = (q ?? question).trim();
    if (!query || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await ask({ data: { question: query, classTitle, agenda, program } });
      setAnswers((a) => [{ q: query, a: res }, ...a]);
      setQuestion("");
    } catch {
      setError("The AI Tutor could not respond right now.");
    } finally {
      setBusy(false);
    }
  }

  const quick = [
    "Summarize the current slide",
    "Explain this like I'm new to it",
    "Give me a real-world example",
    "Recommend related lessons",
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3 text-sm font-semibold">
        <Sparkles className="h-4 w-4 text-primary" /> AI Tutor
        <span className="ml-auto text-[10px] font-normal uppercase tracking-wider text-muted-foreground">
          Uses lesson context
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 border-b border-border/40 px-3 py-2">
        {quick.map((q) => (
          <button
            key={q}
            onClick={() => submit(q)}
            className="rounded-full border border-border/60 bg-card/60 px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted"
          >
            {q}
          </button>
        ))}
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 text-sm">
        {answers.length === 0 && !busy ? (
          <p className="text-xs text-muted-foreground">
            Ask a question, summarize a concept, or request a revision note. The tutor uses this class's agenda as context.
          </p>
        ) : null}
        {busy ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
          </div>
        ) : null}
        {error ? <p className="text-xs text-rose-500">{error}</p> : null}
        {answers.map((row, i) => (
          <div key={i} className="rounded-xl border border-border/60 bg-card/70 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">You asked</p>
            <p className="mt-1 text-sm">{row.q}</p>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tutor</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{row.a.answer}</p>
            {row.a.keyPoints.length ? (
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {row.a.keyPoints.map((k, j) => (
                  <li key={j}>• {k}</li>
                ))}
              </ul>
            ) : null}
            {row.a.follow_ups.length ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {row.a.follow_ups.map((f) => (
                  <button
                    key={f}
                    onClick={() => submit(f)}
                    className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] hover:bg-muted"
                  >
                    {f}
                  </button>
                ))}
              </div>
            ) : null}
            {onCreateRevisionNote ? (
              <button
                onClick={() => onCreateRevisionNote(`${row.q}\n\n${row.a.answer}`)}
                className="mt-3 text-[11px] font-medium text-primary hover:underline"
              >
                Save as revision note →
              </button>
            ) : null}
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="border-t border-border/50 px-3 py-3"
      >
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background px-3 py-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask the AI Tutor…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            disabled={busy}
          />
          <button
            type="submit"
            disabled={busy || !question.trim()}
            className="rounded-lg bg-foreground px-3 py-1 text-xs text-background disabled:opacity-40"
          >
            Ask
          </button>
        </div>
      </form>
    </div>
  );
}
