import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { GraduationCap, Loader2, Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Card, Pill, SectionHeader } from "@/components/workspace/hub-shell";
import { aiWorkspaceAction } from "@/lib/workspace/hub.functions";
import { useFlashcards, useNotebooks } from "@/lib/workspace/hub";

export const Route = createFileRoute("/workspace/study")({
  component: StudyModePage,
});

const MODES = [
  { id: "study" as const, label: "Teach me this topic", desc: "Step-by-step tutor mode with examples and a mini-quiz" },
  { id: "eli5" as const, label: "Explain simply", desc: "Beginner-friendly explanation with analogies" },
  { id: "summary" as const, label: "Summarize", desc: "Concise structured summary" },
  { id: "concepts" as const, label: "Key concepts", desc: "The 6–10 most important ideas" },
  { id: "revision" as const, label: "Revision notes", desc: "Dense bullets with mnemonics and a self-check" },
  { id: "flashcards" as const, label: "Create flashcards", desc: "Add 8–12 cards straight to a notebook" },
];

function StudyModePage() {
  const [mode, setMode] = useState<(typeof MODES)[number]["id"]>("study");
  const [topic, setTopic] = useState("");
  const [source, setSource] = useState("");
  const [nb, setNb] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [output, setOutput] = useState<string>("");
  const [concepts, setConcepts] = useState<string[] | null>(null);
  const [flashOut, setFlashOut] = useState<{ front: string; back: string }[] | null>(null);

  const run = useServerFn(aiWorkspaceAction);
  const { addMany } = useFlashcards();
  const { notebooks } = useNotebooks();

  const execute = async () => {
    if (!topic.trim() && !source.trim()) {
      setErr("Enter a topic or paste some source material.");
      return;
    }
    setBusy(true);
    setErr(null);
    setOutput("");
    setConcepts(null);
    setFlashOut(null);
    try {
      const src = source.trim() || `Topic: ${topic}. Please generate content based on general knowledge for this learner.`;
      const out = await run({ data: { mode, title: topic || undefined, source: src } });
      setOutput(out.reply || "");
      if (out.concepts) setConcepts(out.concepts);
      if (out.flashcards) setFlashOut(out.flashcards);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const saveFlashcards = () => {
    if (!flashOut?.length) return;
    addMany(flashOut, { notebookId: nb || undefined });
    setFlashOut(null);
    alert(`Saved ${flashOut.length} flashcards${nb ? " to notebook" : ""}.`);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="AI Study Mode"
        title="One-click learning modes"
        description="Paste any material or type a topic. Get a tutor-style explanation, summary, key concepts, revision notes or flashcards."
        action={<GraduationCap className="h-6 w-6 text-primary" aria-hidden />}
      />

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={`rounded-2xl border p-4 text-left transition-colors ${
              mode === m.id ? "border-foreground bg-foreground text-background" : "border-border/60 bg-card hover:bg-muted"
            }`}
          >
            <p className="text-sm font-semibold">{m.label}</p>
            <p className={`mt-1 text-xs ${mode === m.id ? "text-background/70" : "text-muted-foreground"}`}>{m.desc}</p>
          </button>
        ))}
      </div>

      <Card>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Topic (optional)</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Transformer architecture"
              className="mt-1 w-full rounded-xl border border-border/60 bg-background p-2 text-sm"
            />
          </div>
          {mode === "flashcards" && (
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Save to notebook (optional)</label>
              <select
                value={nb}
                onChange={(e) => setNb(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border/60 bg-background p-2 text-sm"
              >
                <option value="">(unassigned)</option>
                {notebooks.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.emoji} {n.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="mt-3">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Source material (optional)</label>
          <textarea
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Paste an article, a chapter, your own notes, or leave empty and just enter a topic."
            className="mt-1 min-h-[140px] w-full rounded-xl border border-border/60 bg-background p-3 text-sm"
          />
        </div>
        <div className="mt-3 flex items-center justify-end gap-2">
          {err && <p className="mr-auto text-xs text-red-500">{err}</p>}
          <button
            type="button"
            onClick={execute}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {busy ? "Working…" : "Run"}
          </button>
        </div>
      </Card>

      {output && (
        <Card>
          <Pill tone="primary">Result</Pill>
          <article className="prose prose-sm mt-3 max-w-none dark:prose-invert">
            <ReactMarkdown>{output}</ReactMarkdown>
          </article>
        </Card>
      )}

      {concepts && concepts.length > 0 && (
        <Card>
          <Pill tone="primary">Key concepts</Pill>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {concepts.map((c, i) => (
              <li key={i} className="rounded-xl border border-border/60 bg-background/60 p-3 text-sm text-foreground">
                {c}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {flashOut && flashOut.length > 0 && (
        <Card>
          <div className="flex items-center justify-between">
            <Pill tone="primary">Flashcards</Pill>
            <button
              type="button"
              onClick={saveFlashcards}
              className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
            >
              Save {flashOut.length} cards
            </button>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {flashOut.map((c, i) => (
              <div key={i} className="rounded-xl border border-border/60 bg-background/60 p-3">
                <p className="text-sm font-medium text-foreground">{c.front}</p>
                <p className="mt-1 text-xs text-muted-foreground">{c.back}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
