import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { BrainCircuit, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Card, EmptyState, SectionHeader } from "@/components/workspace/hub-shell";
import { useHighlights, useNotes, pushActivity } from "@/lib/workspace/hub";
import { aiWorkspaceAction } from "@/lib/workspace/hub.functions";

export const Route = createFileRoute("/workspace/revision")({
  component: RevisionPage,
});

const MODES = [
  { id: "quick", label: "Quick revision", desc: "5–10 minute recap", target: "revision" as const, minutes: 10 },
  { id: "30", label: "30-minute review", desc: "Deeper structured recap", target: "revision" as const, minutes: 30 },
  { id: "week", label: "Weekly review", desc: "All highlights + notes this week", target: "revision" as const, minutes: 45 },
  { id: "month", label: "Monthly review", desc: "Everything from the last 30 days", target: "revision" as const, minutes: 60 },
];

function RevisionPage() {
  const { allNotes } = useNotes();
  const { allHighlights } = useHighlights();
  const [mode, setMode] = useState<string>("quick");
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);
  const runAi = useServerFn(aiWorkspaceAction);

  const source = useMemo(() => {
    const now = Date.now();
    const cut =
      mode === "week"
        ? now - 7 * 86_400_000
        : mode === "month"
          ? now - 30 * 86_400_000
          : mode === "30"
            ? now - 30 * 86_400_000
            : now - 7 * 86_400_000;

    const notes = allNotes
      .filter((n) => n.updatedAt >= cut)
      .slice(0, 20)
      .map((n) => `## ${n.title}\n${n.body.slice(0, 800)}`)
      .join("\n\n");
    const highlights = allHighlights
      .filter((h) => h.createdAt >= cut)
      .slice(0, 30)
      .map((h) => `- "${h.text}"${h.comment ? ` — ${h.comment}` : ""}`)
      .join("\n");
    return `NOTES:\n${notes || "(none)"}\n\nHIGHLIGHTS:\n${highlights || "(none)"}`;
  }, [mode, allNotes, allHighlights]);

  const empty = allNotes.length === 0 && allHighlights.length === 0;

  const run = async () => {
    setBusy(true);
    setErr(null);
    try {
      const meta = MODES.find((m) => m.id === mode)!;
      const out = await runAi({
        data: {
          mode: meta.target,
          title: meta.label,
          source: source || "The learner has not saved any material yet. Create a generic starter revision plan for a broad EdTech learner.",
        },
      });
      setOutput(out.reply || "");
      pushActivity({ kind: "revision", label: `Generated ${meta.label}` });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Revision Center"
        title="AI-powered revision"
        description="Generate revision material from everything you've saved — notes, highlights and bookmarks."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

      {empty ? (
        <EmptyState
          title="Add some material first"
          hint="Save a few notes or highlights so revision has something to work with."
        />
      ) : (
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BrainCircuit className="h-4 w-4 text-primary" aria-hidden />
              <span>Pulls from {allNotes.length} notes and {allHighlights.length} highlights</span>
            </div>
            <button
              type="button"
              onClick={run}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-40"
            >
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {busy ? "Generating…" : "Generate"}
            </button>
          </div>
          {err && <p className="mt-3 text-xs text-red-500">{err}</p>}
          {output && (
            <article className="prose prose-sm mt-4 max-w-none dark:prose-invert">
              <ReactMarkdown>{output}</ReactMarkdown>
            </article>
          )}
        </Card>
      )}
    </div>
  );
}
