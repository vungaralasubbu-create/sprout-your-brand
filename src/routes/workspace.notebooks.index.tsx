import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Trash2, Archive } from "lucide-react";
import { Card, EmptyState, Pill, SectionHeader } from "@/components/workspace/hub-shell";
import { useNotebooks } from "@/lib/workspace/hub";

export const Route = createFileRoute("/workspace/notebooks/")({
  component: NotebooksList,
});

const PRESETS = [
  { name: "Artificial Intelligence", emoji: "🤖", color: "#22d3ee" },
  { name: "Machine Learning", emoji: "🧠", color: "#a78bfa" },
  { name: "Prompt Engineering", emoji: "✍️", color: "#fbbf24" },
  { name: "VLSI", emoji: "🔬", color: "#34d399" },
  { name: "Embedded Systems", emoji: "🔌", color: "#f472b6" },
  { name: "Marketing", emoji: "📈", color: "#60a5fa" },
  { name: "Finance", emoji: "💹", color: "#84cc16" },
  { name: "Medical Coding", emoji: "🩺", color: "#f87171" },
];

function NotebooksList() {
  const { notebooks, create, remove, update } = useNotebooks();
  const [name, setName] = useState("");

  const active = useMemo(() => notebooks.filter((n) => !n.archived), [notebooks]);
  const archived = useMemo(() => notebooks.filter((n) => n.archived), [notebooks]);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Learning notebooks"
        title="Notebooks"
        description="Organize notes, highlights, bookmarks and flashcards by topic. Each notebook is your workspace for a subject."
      />

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New notebook name (e.g. Prompt Engineering)"
            className="flex-1 rounded-full border border-border/70 bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            type="button"
            onClick={() => {
              if (!name.trim()) return;
              create({ name: name.trim() });
              setName("");
            }}
            className="inline-flex items-center gap-2 self-start rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden /> Create notebook
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {PRESETS.filter((p) => !notebooks.some((n) => n.name.toLowerCase() === p.name.toLowerCase())).map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => create({ name: p.name, emoji: p.emoji, color: p.color })}
              className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
            >
              <span aria-hidden>{p.emoji}</span> {p.name}
            </button>
          ))}
        </div>
      </Card>

      {active.length === 0 ? (
        <EmptyState title="No notebooks yet" hint="Pick a preset above or create your own to get started." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((n) => (
            <Card key={n.id} className="!p-0 overflow-hidden">
              <Link to="/workspace/notebooks/$id" params={{ id: n.id }} className="block p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                    style={{ background: (n.color ?? "#22d3ee") + "22", color: n.color ?? "#22d3ee" }}
                  >
                    <span aria-hidden>{n.emoji ?? "📘"}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-foreground">{n.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Updated {new Date(n.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {n.description && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{n.description}</p>}
              </Link>
              <div className="flex items-center justify-between border-t border-border/60 bg-muted/30 px-4 py-2">
                <Pill>Notebook</Pill>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => update(n.id, { archived: true })}
                    className="text-[11px] text-muted-foreground hover:text-foreground"
                    aria-label="Archive"
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete "${n.name}"? Notes inside will remain but be unlinked.`)) remove(n.id);
                    }}
                    className="text-[11px] text-muted-foreground hover:text-red-500"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {archived.length > 0 && (
        <Card>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Archived</p>
          <ul className="space-y-1">
            {archived.map((n) => (
              <li key={n.id} className="flex items-center justify-between text-sm">
                <span className="text-foreground">
                  <span aria-hidden>{n.emoji ?? "📘"}</span> {n.name}
                </span>
                <button
                  type="button"
                  onClick={() => update(n.id, { archived: false })}
                  className="text-xs text-primary hover:underline"
                >
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
