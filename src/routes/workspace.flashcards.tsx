import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Layers3, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Card, EmptyState, Pill, SectionHeader } from "@/components/workspace/hub-shell";
import { useFlashcards, useNotebooks } from "@/lib/workspace/hub";
import { aiWorkspaceAction } from "@/lib/workspace/hub.functions";

export const Route = createFileRoute("/workspace/flashcards")({
  component: FlashcardsPage,
});

function FlashcardsPage() {
  const { allFlashcards, addMany, remove, review } = useFlashcards();
  const { notebooks } = useNotebooks();
  const [studyIdx, setStudyIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [filterNb, setFilterNb] = useState<string | "all">("all");
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const runAi = useServerFn(aiWorkspaceAction);

  const cards = useMemo(() => (filterNb === "all" ? allFlashcards : allFlashcards.filter((c) => c.notebookId === filterNb)), [allFlashcards, filterNb]);
  const dueCards = useMemo(() => cards.filter((c) => !c.nextReviewAt || c.nextReviewAt <= Date.now()), [cards]);

  const current = dueCards[studyIdx];

  const generate = async () => {
    if (!topic.trim()) return;
    setBusy(true);
    try {
      const out = await runAi({
        data: { mode: "flashcards", source: `Generate flashcards about: ${topic}` },
      });
      if (out.flashcards?.length)
        addMany(out.flashcards, { notebookId: filterNb !== "all" ? filterNb : undefined });
      setTopic("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Study"
        title="Flashcards"
        description="Practice cards from your notebooks. Rate each card easy, medium or hard — hard cards return sooner."
      />

      <Card>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden />
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Generate with AI</p>
        </div>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Any topic — transformers, marketing funnels, VLSI CMOS…"
            className="flex-1 rounded-full border border-border/70 bg-background px-4 py-2 text-sm"
          />
          <button
            type="button"
            disabled={!topic.trim() || busy}
            onClick={generate}
            className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40"
          >
            {busy ? "Generating…" : "Generate"}
          </button>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Notebook:</span>
        <button
          type="button"
          onClick={() => {
            setFilterNb("all");
            setStudyIdx(0);
            setFlipped(false);
          }}
          className={`rounded-full border px-3 py-1 text-xs ${filterNb === "all" ? "border-foreground bg-foreground text-background" : "border-border/70 hover:bg-muted"}`}
        >
          All
        </button>
        {notebooks.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => {
              setFilterNb(n.id);
              setStudyIdx(0);
              setFlipped(false);
            }}
            className={`rounded-full border px-3 py-1 text-xs ${filterNb === n.id ? "border-foreground bg-foreground text-background" : "border-border/70 hover:bg-muted"}`}
          >
            {n.emoji} {n.name}
          </button>
        ))}
      </div>

      {cards.length === 0 ? (
        <EmptyState title="No flashcards" hint="Generate a set with AI or add them from any notebook." />
      ) : (
        <>
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Layers3 className="h-4 w-4" aria-hidden />
                <span>
                  {dueCards.length === 0
                    ? "You're all caught up — no cards due right now."
                    : `Card ${Math.min(studyIdx + 1, dueCards.length)} of ${dueCards.length} due`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStudyIdx(0);
                  setFlipped(false);
                }}
                className="inline-flex items-center gap-1 rounded-full border border-border/70 px-3 py-1 text-[11px] hover:bg-muted"
              >
                <RotateCcw className="h-3 w-3" /> Restart
              </button>
            </div>
            {current ? (
              <button
                type="button"
                onClick={() => setFlipped((f) => !f)}
                className="block w-full rounded-2xl border border-border/60 bg-background p-8 text-left shadow-inner focus:outline-none"
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {flipped ? "Answer" : "Question"}
                </p>
                <p className="mt-3 whitespace-pre-wrap text-lg font-semibold text-foreground">
                  {flipped ? current.back : current.front}
                </p>
                <p className="mt-6 text-[11px] text-muted-foreground">Click card to flip</p>
              </button>
            ) : (
              <p className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
                No cards due right now. Come back later or restart the deck.
              </p>
            )}
            {current && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {(["easy", "medium", "hard"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      review(current.id, d);
                      setFlipped(false);
                      setStudyIdx((i) => i + 1);
                    }}
                    className={`rounded-full px-5 py-2 text-xs font-semibold ${
                      d === "easy"
                        ? "bg-emerald-500 text-white"
                        : d === "medium"
                          ? "bg-amber-500 text-white"
                          : "bg-red-500 text-white"
                    }`}
                  >
                    {d.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </Card>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => (
              <Card key={c.id} className="!p-4">
                <p className="line-clamp-3 text-sm font-medium text-foreground">{c.front}</p>
                <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{c.back}</p>
                <div className="mt-3 flex items-center justify-between">
                  <Pill tone={c.difficulty === "easy" ? "success" : "muted"}>{c.difficulty}</Pill>
                  <button type="button" onClick={() => remove(c.id)} className="text-muted-foreground hover:text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
