import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BookMarked, Plus, Trash2 } from "lucide-react";
import { usePrompts, type PromptTemplate } from "@/lib/aios/storage";
import { AGENTS } from "@/lib/aios/agents";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/aios/prompts")({
  component: PromptsPage,
});

const CATEGORIES: PromptTemplate["category"][] = ["learning", "career", "sales", "marketing", "content", "support", "administration"];

function PromptsPage() {
  const { items, save, remove } = usePrompts();
  const [filter, setFilter] = useState<PromptTemplate["category"] | "all">("all");
  const [editing, setEditing] = useState<Partial<PromptTemplate> | null>(null);

  const filtered = filter === "all" ? items : items.filter((p) => p.category === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-primary flex items-center gap-1.5"><BookMarked className="size-3" /> Prompt Library</p>
          <h1 className="mt-1 text-2xl font-semibold">Reusable prompt templates</h1>
          <p className="mt-1 text-sm text-muted-foreground">Version-controlled prompts shared across every AIOS agent.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing({ title: "", body: "", category: "learning" })}
          className="inline-flex items-center gap-1 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background"
        ><Plus className="size-3.5" /> New template</button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", ...CATEGORIES] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setFilter(c)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs capitalize",
              filter === c ? "bg-foreground text-background border-foreground" : "border-border/60 text-muted-foreground hover:bg-muted",
            )}
          >{c}</button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((p) => (
          <div key={p.id} className="rounded-lg border border-border/60 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{p.title}</p>
                <p className="text-[11px] text-muted-foreground capitalize">{p.category} · v{p.version}{p.agentId ? ` · ${p.agentId}` : ""}</p>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setEditing(p)} className="text-xs text-primary hover:underline">Edit</button>
                <button type="button" onClick={() => remove(p.id)} className="rounded-full p-1 text-muted-foreground hover:text-red-500"><Trash2 className="size-3.5" /></button>
              </div>
            </div>
            <pre className="mt-2 whitespace-pre-wrap text-[12px] text-muted-foreground bg-muted/40 rounded p-2">{p.body}</pre>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">No prompt templates in this category yet.</p>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-lg rounded-lg bg-white p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-sm font-semibold">{editing.id ? "Edit template" : "New template"}</h2>
            <input
              value={editing.title ?? ""}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              placeholder="Title"
              className="w-full rounded border border-border/60 px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={editing.category ?? "learning"}
                onChange={(e) => setEditing({ ...editing, category: e.target.value as PromptTemplate["category"] })}
                className="rounded border border-border/60 px-3 py-2 text-sm capitalize"
              >
                {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
              <select
                value={editing.agentId ?? ""}
                onChange={(e) => setEditing({ ...editing, agentId: e.target.value || undefined })}
                className="rounded border border-border/60 px-3 py-2 text-sm"
              >
                <option value="">Any agent</option>
                {AGENTS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <textarea
              value={editing.body ?? ""}
              onChange={(e) => setEditing({ ...editing, body: e.target.value })}
              placeholder="Prompt body. Use {placeholders} for variables."
              className="w-full min-h-[160px] rounded border border-border/60 px-3 py-2 text-sm font-mono"
            />
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted">Cancel</button>
              <button
                type="button"
                onClick={() => {
                  if (!editing.title || !editing.body) return;
                  save({
                    id: editing.id,
                    title: editing.title,
                    body: editing.body,
                    category: (editing.category ?? "learning") as PromptTemplate["category"],
                    agentId: editing.agentId,
                  });
                  setEditing(null);
                }}
                className="rounded bg-foreground px-3 py-1.5 text-xs font-semibold text-background"
              >Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
