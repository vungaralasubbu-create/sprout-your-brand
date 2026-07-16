// Drop-in workspace actions for any content page (Learn / Blog / Program).
// Renders: Summarize • Key concepts • Explain simply • Revision notes • Flashcards
// Plus quick actions: highlight this page, bookmark, add to notebook.
import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link, useLocation } from "@tanstack/react-router";
import {
  BookmarkPlus,
  Highlighter,
  Loader2,
  NotebookPen,
  Sparkles,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { aiWorkspaceAction } from "@/lib/workspace/hub.functions";
import {
  pushActivity,
  useFlashcards,
  useHighlights,
  useHubBookmarks,
  useNotebooks,
  type SourceRef,
} from "@/lib/workspace/hub";

type Mode = "summary" | "concepts" | "eli5" | "revision" | "flashcards";

const MODES: { id: Mode; label: string }[] = [
  { id: "summary", label: "Summarize page" },
  { id: "concepts", label: "Key concepts" },
  { id: "eli5", label: "Explain simply" },
  { id: "revision", label: "Revision notes" },
  { id: "flashcards", label: "Flashcards" },
];

export function PageWorkspaceActions({
  title,
  source,
  kind = "learn",
  className = "",
}: {
  title: string;
  source: string;
  kind?: "learn" | "blog" | "program" | "glossary" | "other";
  className?: string;
}) {
  const { pathname } = useLocation();
  const src: SourceRef = useMemo(() => ({ path: pathname, title, kind }), [pathname, title, kind]);

  const [mode, setMode] = useState<Mode>("summary");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [output, setOutput] = useState<string>("");
  const [concepts, setConcepts] = useState<string[] | null>(null);
  const [flashOut, setFlashOut] = useState<{ front: string; back: string }[] | null>(null);
  const [selection, setSelection] = useState("");

  const run = useServerFn(aiWorkspaceAction);
  const { notebooks, create } = useNotebooks();
  const { add: addHighlight } = useHighlights();
  const { add: addBookmark } = useHubBookmarks();
  const { addMany: addCards } = useFlashcards();
  const [notebookId, setNotebookId] = useState<string>("");

  // Track page view once (for Continue Learning)
  useEffect(() => {
    if (!pathname.startsWith("/workspace")) {
      pushActivity({ kind: "view", label: title, href: pathname });
    }
  }, [pathname, title]);

  const execute = async () => {
    setBusy(true);
    setErr(null);
    setOutput("");
    setConcepts(null);
    setFlashOut(null);
    try {
      const out = await run({ data: { mode, title, source, path: pathname } });
      setOutput(out.reply || "");
      if (out.concepts) setConcepts(out.concepts);
      if (out.flashcards) setFlashOut(out.flashcards);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const ensureNb = (): string | undefined => {
    if (notebookId) return notebookId;
    if (notebooks.length === 0) {
      const nb = create({ name: title.slice(0, 40) || "My notebook" });
      setNotebookId(nb.id);
      return nb.id;
    }
    setNotebookId(notebooks[0].id);
    return notebooks[0].id;
  };

  const saveFlashcards = () => {
    if (!flashOut?.length) return;
    const nb = ensureNb();
    addCards(flashOut, { notebookId: nb, source: src });
    setFlashOut(null);
    alert(`Saved ${flashOut.length} flashcards to your workspace.`);
  };

  const saveHighlight = () => {
    const text = (selection || window.getSelection()?.toString() || "").trim();
    if (!text) {
      alert("Select some text on the page first, or paste it into the box below.");
      return;
    }
    addHighlight({ notebookId: ensureNb(), text, tags: [], source: src });
    setSelection("");
    alert("Highlight saved to your workspace.");
  };

  const saveBookmark = () => {
    addBookmark({ notebookId: ensureNb(), title, href: pathname, tags: [], folder: kind });
    alert("Bookmarked to your workspace.");
  };

  return (
    <aside
      className={
        "rounded-2xl border border-border/70 bg-gradient-to-br from-primary/5 via-background to-background p-5 sm:p-6 " +
        className
      }
      aria-labelledby="ws-actions-heading"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Workspace</p>
          <h2 id="ws-actions-heading" className="mt-1 text-lg font-semibold text-foreground">
            Study this page
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Summarize, generate flashcards, save highlights — everything lands in your{" "}
            <Link to="/workspace" className="text-primary hover:underline">
              workspace
            </Link>
            .
          </p>
        </div>
        <Sparkles className="h-5 w-5 shrink-0 text-primary" aria-hidden />
      </div>

      <div className="mt-4 flex flex-wrap gap-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
              mode === m.id
                ? "border-foreground bg-foreground text-background"
                : "border-border/70 text-muted-foreground hover:bg-muted"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        {notebooks.length > 0 && (
          <select
            value={notebookId}
            onChange={(e) => setNotebookId(e.target.value)}
            className="rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs"
            aria-label="Save to notebook"
          >
            <option value="">Choose notebook…</option>
            {notebooks.map((n) => (
              <option key={n.id} value={n.id}>
                {n.emoji} {n.name}
              </option>
            ))}
          </select>
        )}
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

      {err && <p className="mt-3 text-xs text-red-500">{err}</p>}

      {output && (
        <div className="mt-4 rounded-xl border border-border/60 bg-card/70 p-4">
          <article className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{output}</ReactMarkdown>
          </article>
        </div>
      )}

      {concepts && concepts.length > 0 && (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {concepts.map((c, i) => (
            <li key={i} className="rounded-xl border border-border/60 bg-card/70 p-3 text-xs text-foreground">
              {c}
            </li>
          ))}
        </ul>
      )}

      {flashOut && flashOut.length > 0 && (
        <div className="mt-4 rounded-xl border border-border/60 bg-card/70 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Flashcards</p>
            <button
              type="button"
              onClick={saveFlashcards}
              className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground"
            >
              Save {flashOut.length} cards
            </button>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {flashOut.map((c, i) => (
              <div key={i} className="rounded-xl bg-background/60 p-3">
                <p className="text-xs font-medium text-foreground">{c.front}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{c.back}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="mt-5 border-t border-border/60 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Quick save</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div>
            <textarea
              value={selection}
              onChange={(e) => setSelection(e.target.value)}
              placeholder="Select text on the page, or paste it here…"
              className="min-h-[60px] w-full rounded-xl border border-border/60 bg-background p-2 text-xs"
            />
            <button
              type="button"
              onClick={saveHighlight}
              className="mt-2 inline-flex items-center gap-1 rounded-full border border-border/70 px-3 py-1.5 text-[11px] font-semibold hover:bg-muted"
            >
              <Highlighter className="h-3 w-3" /> Save highlight
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={saveBookmark}
              className="inline-flex items-center gap-1 rounded-full border border-border/70 px-3 py-1.5 text-[11px] font-semibold hover:bg-muted"
            >
              <BookmarkPlus className="h-3 w-3" /> Bookmark this page
            </button>
            <Link
              to="/workspace/notebooks"
              className="inline-flex items-center gap-1 rounded-full border border-border/70 px-3 py-1.5 text-[11px] font-semibold hover:bg-muted"
            >
              <NotebookPen className="h-3 w-3" /> Open notebooks
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
