import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { Panel } from "@/components/workspace/panel";
import { trackActivity, useNotes, unlockAchievement, type Note } from "@/lib/workspace/storage";

export const Route = createFileRoute("/my/notes")({
  component: NotesPage,
});

function NotesPage() {
  const { notes, upsert, remove } = useNotes();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Note | "new" | null>(null);

  const filtered = useMemo(() => {
    const t = q.toLowerCase();
    return notes
      .filter((n) => (t ? `${n.title} ${n.body}`.toLowerCase().includes(t) : true))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, q]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Notes
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">My notes</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Personal notes with Markdown support. Attach them to programs, articles, or glossary entries.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 self-start rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background transition-transform hover:-translate-y-0.5"
        >
          <Plus className="h-3.5 w-3.5" /> New note
        </button>
      </header>

      <input
        type="search"
        placeholder="Search notes…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full rounded-full border border-border/60 bg-card px-4 py-2 text-sm outline-none focus:border-primary/50 sm:max-w-md"
        aria-label="Search notes"
      />

      {editing && (
        <NoteEditor
          initial={editing === "new" ? undefined : editing}
          onSave={(n) => {
            upsert(n);
            trackActivity({ kind: "note", label: `Saved note: ${n.title}` });
            unlockAchievement("first-note");
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      <Panel>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {notes.length === 0
              ? "No notes yet. Capture your first thought — write a summary, a question, or a plan."
              : "No matching notes."}
          </p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((n) => (
              <li
                key={n.id}
                className="group flex flex-col gap-2 rounded-xl border border-border/50 bg-card/60 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{n.title}</h3>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => setEditing(n)}
                      className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                      aria-label={`Edit ${n.title}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(n.id)}
                      className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Delete ${n.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="prose prose-sm prose-neutral dark:prose-invert line-clamp-6 max-w-none text-xs text-muted-foreground">
                  <ReactMarkdown>{n.body || "_Empty note_"}</ReactMarkdown>
                </div>
                <p className="mt-auto text-[10px] text-muted-foreground">
                  Updated {new Date(n.updatedAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function NoteEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Note;
  onSave: (n: { id?: string; title: string; body: string }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  return (
    <Panel eyebrow={initial ? "Edit note" : "New note"} title={title || "Untitled"}>
      <div className="grid gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
          autoFocus
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write in Markdown… # Heading, **bold**, - list"
          rows={8}
          className="rounded-lg border border-border/60 bg-background px-3 py-2 font-mono text-xs outline-none focus:border-primary/50"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => title.trim() && onSave({ id: initial?.id, title: title.trim(), body })}
            disabled={!title.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-40"
          >
            <Save className="h-3.5 w-3.5" /> Save note
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 text-xs font-semibold text-foreground"
          >
            <X className="h-3.5 w-3.5" /> Cancel
          </button>
        </div>
      </div>
    </Panel>
  );
}
