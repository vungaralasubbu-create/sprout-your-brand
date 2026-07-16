import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  BookmarkIcon,
  Highlighter,
  Layers3,
  NotebookPen,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Card, EmptyState, Pill, SectionHeader } from "@/components/workspace/hub-shell";
import {
  getNotebook,
  useFlashcards,
  useHighlights,
  useHubBookmarks,
  useNotebooks,
  useNotes,
  type NBNote,
} from "@/lib/workspace/hub";
import { useServerFn } from "@tanstack/react-start";
import { aiWorkspaceAction } from "@/lib/workspace/hub.functions";

export const Route = createFileRoute("/workspace/notebooks/$id")({
  component: NotebookDetail,
});

type Tab = "notes" | "highlights" | "bookmarks" | "flashcards";

function NotebookDetail() {
  const { id } = useParams({ from: "/workspace/notebooks/$id" });
  const { update, remove: removeNotebook } = useNotebooks();
  const [notebook, setNotebook] = useState(() => getNotebook(id));
  useEffect(() => setNotebook(getNotebook(id)), [id]);

  const [tab, setTab] = useState<Tab>("notes");

  if (!notebook) {
    return (
      <div className="space-y-4">
        <Link to="/workspace/notebooks" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to notebooks
        </Link>
        <EmptyState title="Notebook not found" hint="It may have been deleted from this device." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/workspace/notebooks" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" /> All notebooks
      </Link>

      <SectionHeader
        eyebrow="Notebook"
        title={`${notebook.emoji ?? "📘"} ${notebook.name}`}
        description={notebook.description || "Personal knowledge space for this topic."}
        action={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                const name = prompt("Rename notebook", notebook.name);
                if (name?.trim()) {
                  update(notebook.id, { name: name.trim() });
                  setNotebook({ ...notebook, name: name.trim() });
                }
              }}
              className="rounded-full border border-border/70 px-3 py-1.5 text-xs hover:bg-muted"
            >
              Rename
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete "${notebook.name}"?`)) {
                  removeNotebook(notebook.id);
                  window.history.back();
                }
              }}
              className="rounded-full border border-border/70 px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10"
            >
              Delete
            </button>
          </div>
        }
      />

      <div className="flex gap-1 overflow-x-auto rounded-full border border-border/60 bg-card p-1">
        {(
          [
            { id: "notes", label: "Notes", icon: NotebookPen },
            { id: "highlights", label: "Highlights", icon: Highlighter },
            { id: "bookmarks", label: "Bookmarks", icon: BookmarkIcon },
            { id: "flashcards", label: "Flashcards", icon: Layers3 },
          ] as { id: Tab; label: string; icon: typeof NotebookPen }[]
        ).map(({ id: t, label, icon: Icon }) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              tab === t ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
          </button>
        ))}
      </div>

      {tab === "notes" && <NotesTab notebookId={notebook.id} />}
      {tab === "highlights" && <HighlightsTab notebookId={notebook.id} />}
      {tab === "bookmarks" && <BookmarksTab notebookId={notebook.id} />}
      {tab === "flashcards" && <FlashcardsTab notebookId={notebook.id} notebookName={notebook.name} />}
    </div>
  );
}

/* ---------------- Notes tab ---------------- */
function NotesTab({ notebookId }: { notebookId: string }) {
  const { notes, upsert, remove } = useNotes(notebookId);
  const [editing, setEditing] = useState<NBNote | "new" | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (editing && editing !== "new") {
      setTitle(editing.title);
      setBody(editing.body);
    } else if (editing === "new") {
      setTitle("");
      setBody("");
    }
  }, [editing]);

  // autosave
  useEffect(() => {
    if (!editing || editing === "new") return;
    const t = setTimeout(() => {
      if (title !== editing.title || body !== editing.body) {
        upsert({ ...editing, title, body, notebookId });
      }
    }, 800);
    return () => clearTimeout(t);
  }, [title, body, editing, notebookId, upsert]);

  const save = () => {
    if (!title.trim()) return;
    if (editing === "new") upsert({ notebookId, title: title.trim(), body });
    else if (editing) upsert({ ...editing, notebookId, title: title.trim(), body });
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-1 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden /> New note
        </button>
      </div>

      {editing && (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title"
              className="flex-1 border-0 bg-transparent text-xl font-bold text-foreground focus:outline-none"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreview((p) => !p)}
                className="rounded-full border border-border/70 px-3 py-1 text-[11px] hover:bg-muted"
              >
                {preview ? "Edit" : "Preview"}
              </button>
              <button type="button" onClick={save} className="rounded-full bg-foreground px-3 py-1 text-[11px] text-background">
                <Save className="mr-1 inline h-3 w-3" /> Save
              </button>
              <button type="button" onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          {preview ? (
            <article className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{body || "*Nothing to preview yet.*"}</ReactMarkdown>
            </article>
          ) : (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`Write in Markdown…

# Heading
- bullet
**bold**  \`code\`

| A | B |
| - | - |
| 1 | 2 |`}
              className="min-h-[300px] w-full resize-y rounded-xl border border-border/60 bg-background p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          )}
          <p className="mt-2 text-[10px] text-muted-foreground">Auto-saves while you type. Supports Markdown, tables, and code blocks.</p>
        </Card>
      )}

      {notes.length === 0 && !editing ? (
        <EmptyState title="No notes in this notebook" hint="Click ‘New note’ to start capturing your thinking." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {notes.map((n) => (
            <Card key={n.id} className="!p-4">
              <div className="flex items-start justify-between gap-2">
                <button type="button" onClick={() => setEditing(n)} className="min-w-0 flex-1 text-left">
                  <p className="truncate font-semibold text-foreground">{n.title}</p>
                  <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{n.body}</p>
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    Updated {new Date(n.updatedAt).toLocaleString()}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Delete note?")) remove(n.id);
                  }}
                  className="text-muted-foreground hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Highlights tab ---------------- */
function HighlightsTab({ notebookId }: { notebookId: string }) {
  const { highlights, add, remove, update } = useHighlights(notebookId);
  const [text, setText] = useState("");
  const [comment, setComment] = useState("");
  const [srcTitle, setSrcTitle] = useState("");
  const [srcPath, setSrcPath] = useState("");

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add a highlight</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste highlighted text…"
          className="mt-2 min-h-[80px] w-full rounded-xl border border-border/60 bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Your comment (optional)"
          className="mt-2 w-full rounded-xl border border-border/60 bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <input
            value={srcTitle}
            onChange={(e) => setSrcTitle(e.target.value)}
            placeholder="Source title (e.g. ChatGPT Program)"
            className="rounded-xl border border-border/60 bg-background p-2 text-sm"
          />
          <input
            value={srcPath}
            onChange={(e) => setSrcPath(e.target.value)}
            placeholder="Source URL/path (e.g. /programs/ai/chatgpt)"
            className="rounded-xl border border-border/60 bg-background p-2 text-sm"
          />
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            disabled={!text.trim()}
            onClick={() => {
              add({
                notebookId,
                text: text.trim(),
                comment: comment.trim() || undefined,
                tags: [],
                source: { title: srcTitle || undefined, path: srcPath || undefined, kind: "other" },
              });
              setText("");
              setComment("");
              setSrcTitle("");
              setSrcPath("");
            }}
            className="rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-40"
          >
            Save highlight
          </button>
        </div>
      </Card>

      {highlights.length === 0 ? (
        <EmptyState title="No highlights yet" hint="Save quotes and important passages you want to revisit." />
      ) : (
        <div className="space-y-3">
          {highlights.map((h) => (
            <Card key={h.id} className="!p-4">
              <p className="border-l-4 border-primary/60 pl-3 text-sm text-foreground">"{h.text}"</p>
              {h.comment && <p className="mt-2 text-xs text-muted-foreground">💭 {h.comment}</p>}
              <div className="mt-2 flex items-center justify-between">
                <div className="text-[11px] text-muted-foreground">
                  {h.source.title && <span>{h.source.title}</span>}
                  {h.source.path && (
                    <>
                      {" • "}
                      <Link to={h.source.path} className="text-primary hover:underline">
                        Jump back
                      </Link>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remove(h.id)}
                  className="text-muted-foreground hover:text-red-500"
                  aria-label="Delete highlight"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Bookmarks tab ---------------- */
function BookmarksTab({ notebookId }: { notebookId: string }) {
  const { bookmarks, add, remove } = useHubBookmarks(notebookId);
  const [title, setTitle] = useState("");
  const [href, setHref] = useState("");
  const [folder, setFolder] = useState("");

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid gap-2 sm:grid-cols-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="rounded-xl border border-border/60 bg-background p-2 text-sm" />
          <input value={href} onChange={(e) => setHref(e.target.value)} placeholder="URL or /path" className="rounded-xl border border-border/60 bg-background p-2 text-sm" />
          <input value={folder} onChange={(e) => setFolder(e.target.value)} placeholder="Folder (optional)" className="rounded-xl border border-border/60 bg-background p-2 text-sm" />
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            disabled={!title.trim() || !href.trim()}
            onClick={() => {
              add({ notebookId, title: title.trim(), href: href.trim(), folder: folder.trim() || undefined, tags: [] });
              setTitle("");
              setHref("");
              setFolder("");
            }}
            className="rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-40"
          >
            Add bookmark
          </button>
        </div>
      </Card>

      {bookmarks.length === 0 ? (
        <EmptyState title="No bookmarks" hint="Save any Glintr page or external URL." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {bookmarks.map((b) => (
            <Card key={b.id} className="!p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  {b.folder && <Pill>{b.folder}</Pill>}
                  <a href={b.href} className="mt-2 block truncate font-semibold text-foreground hover:underline">
                    {b.title}
                  </a>
                  <p className="truncate text-[11px] text-muted-foreground">{b.href}</p>
                </div>
                <button type="button" onClick={() => remove(b.id)} className="text-muted-foreground hover:text-red-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Flashcards tab ---------------- */
function FlashcardsTab({ notebookId, notebookName }: { notebookId: string; notebookName: string }) {
  const { flashcards, addMany, remove, review } = useFlashcards(notebookId);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const runAi = useServerFn(aiWorkspaceAction);

  const generate = async () => {
    if (!aiTopic.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const out = await runAi({
        data: {
          mode: "flashcards",
          title: notebookName,
          source: `Generate flashcards about: ${aiTopic}. Notebook context: ${notebookName}.`,
        },
      });
      if (out.flashcards && out.flashcards.length) {
        addMany(out.flashcards, { notebookId });
        setAiTopic("");
      } else {
        setErr("The AI did not return any flashcards. Try a more specific topic.");
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add flashcard manually</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <textarea value={front} onChange={(e) => setFront(e.target.value)} placeholder="Front (question)" className="min-h-[80px] rounded-xl border border-border/60 bg-background p-2 text-sm" />
          <textarea value={back} onChange={(e) => setBack(e.target.value)} placeholder="Back (answer)" className="min-h-[80px] rounded-xl border border-border/60 bg-background p-2 text-sm" />
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            disabled={!front.trim() || !back.trim()}
            onClick={() => {
              addMany([{ front: front.trim(), back: back.trim() }], { notebookId });
              setFront("");
              setBack("");
            }}
            className="rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-40"
          >
            Add card
          </button>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden />
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Generate with AI</p>
        </div>
        <input
          value={aiTopic}
          onChange={(e) => setAiTopic(e.target.value)}
          placeholder="Topic (e.g. transformer architecture, RLHF, prompt chaining)"
          className="mt-2 w-full rounded-xl border border-border/60 bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {err && <p className="mt-2 text-xs text-red-500">{err}</p>}
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            disabled={busy || !aiTopic.trim()}
            onClick={generate}
            className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40"
          >
            {busy ? "Generating…" : "Generate 8–12 cards"}
          </button>
        </div>
      </Card>

      {flashcards.length === 0 ? (
        <EmptyState title="No flashcards yet" hint="Create them manually or generate with AI." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {flashcards.map((c) => (
            <Card key={c.id} className="!p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Question</p>
              <p className="mt-1 text-sm font-medium text-foreground">{c.front}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Answer</p>
              <p className="mt-1 text-sm text-muted-foreground">{c.back}</p>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex gap-1">
                  {(["easy", "medium", "hard"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => review(c.id, d)}
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        c.difficulty === d
                          ? d === "easy"
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-700"
                            : d === "medium"
                              ? "border-amber-500 bg-amber-500/10 text-amber-700"
                              : "border-red-500 bg-red-500/10 text-red-700"
                          : "border-border/60 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => remove(c.id)} className="text-muted-foreground hover:text-red-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
