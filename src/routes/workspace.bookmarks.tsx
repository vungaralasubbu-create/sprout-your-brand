import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Card, EmptyState, Pill, SectionHeader } from "@/components/workspace/hub-shell";
import { useHubBookmarks } from "@/lib/workspace/hub";

export const Route = createFileRoute("/workspace/bookmarks")({
  component: BookmarksPage,
});

function BookmarksPage() {
  const { allBookmarks, remove, add } = useHubBookmarks();
  const [q, setQ] = useState("");
  const [folder, setFolder] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [href, setHref] = useState("");
  const [newFolder, setNewFolder] = useState("");

  const folders = useMemo(() => {
    const set = new Set<string>();
    allBookmarks.forEach((b) => b.folder && set.add(b.folder));
    return Array.from(set).sort();
  }, [allBookmarks]);

  const filtered = useMemo(() => {
    const t = q.toLowerCase();
    return allBookmarks.filter(
      (b) =>
        (folder ? b.folder === folder : true) &&
        (t ? `${b.title} ${b.href} ${b.note ?? ""}`.toLowerCase().includes(t) : true),
    );
  }, [allBookmarks, folder, q]);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Saved"
        title="Bookmarks"
        description="Organize saved pages into folders like AI, Programming, Interview Prep or Favorites."
      />

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add bookmark</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="rounded-xl border border-border/60 bg-background p-2 text-sm" />
          <input value={href} onChange={(e) => setHref(e.target.value)} placeholder="URL or /path" className="rounded-xl border border-border/60 bg-background p-2 text-sm" />
          <input value={newFolder} onChange={(e) => setNewFolder(e.target.value)} placeholder="Folder (optional)" className="rounded-xl border border-border/60 bg-background p-2 text-sm" />
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            disabled={!title.trim() || !href.trim()}
            onClick={() => {
              add({ title: title.trim(), href: href.trim(), folder: newFolder.trim() || undefined, tags: [] });
              setTitle("");
              setHref("");
              setNewFolder("");
            }}
            className="rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFolder(null)}
          className={`rounded-full border px-3 py-1 text-xs ${folder === null ? "border-foreground bg-foreground text-background" : "border-border/70 text-muted-foreground hover:bg-muted"}`}
        >
          All
        </button>
        {folders.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFolder(f)}
            className={`rounded-full border px-3 py-1 text-xs ${folder === f ? "border-foreground bg-foreground text-background" : "border-border/70 text-muted-foreground hover:bg-muted"}`}
          >
            {f}
          </button>
        ))}
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search bookmarks…"
        className="w-full rounded-full border border-border/70 bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      />

      {filtered.length === 0 ? (
        <EmptyState title="No bookmarks" hint="Save pages you want to return to quickly." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((b) => (
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
