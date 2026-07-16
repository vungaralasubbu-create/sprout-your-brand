import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bookmark as BookmarkIcon, Trash2 } from "lucide-react";
import { Panel } from "@/components/workspace/panel";
import { useBookmarks } from "@/lib/mentor/storage";

export const Route = createFileRoute("/my/bookmarks")({
  component: BookmarksPage,
});

const CATS: Array<{ key: string; label: string; match: (k: string) => boolean }> = [
  { key: "all", label: "All", match: () => true },
  { key: "program", label: "Programs", match: (k) => k === "program" },
  { key: "blog", label: "Blogs", match: (k) => k === "blog" },
  { key: "glossary", label: "Glossary", match: (k) => k === "glossary" },
  { key: "path", label: "Paths", match: (k) => k === "path" },
  { key: "tool", label: "Tools", match: (k) => k === "tool" },
  { key: "compare", label: "Comparisons", match: (k) => k === "compare" },
];

function BookmarksPage() {
  const { items, remove } = useBookmarks();
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const catDef = CATS.find((c) => c.key === cat) ?? CATS[0];
    return items
      .filter((b) => catDef.match(b.kind))
      .filter((b) => (q ? b.label.toLowerCase().includes(q.toLowerCase()) : true))
      .sort((a, b) => b.addedAt - a.addedAt);
  }, [items, cat, q]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Bookmarks
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Saved for later
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Everything you bookmark across Glintr — programs, articles, glossary, paths, and tools — lives here.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1">
          {CATS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCat(c.key)}
              className={
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors " +
                (cat === c.key
                  ? "border-primary/40 bg-primary/10 text-foreground"
                  : "border-border/60 bg-card text-muted-foreground hover:text-foreground")
              }
            >
              {c.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Search bookmarks…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full rounded-full border border-border/60 bg-card px-4 py-2 text-sm outline-none focus:border-primary/50 sm:w-64"
          aria-label="Search bookmarks"
        />
      </div>

      <Panel>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {items.length === 0 ? (
              <>You have no bookmarks yet. Tap the bookmark icon on any page to save it here.</>
            ) : (
              <>No results for this filter.</>
            )}
          </p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {filtered.map((b) => (
              <li
                key={b.href}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-card/50 p-3"
              >
                <Link to={b.href} className="flex min-w-0 items-center gap-2">
                  <BookmarkIcon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {b.label}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      {b.kind} · saved {new Date(b.addedAt).toLocaleDateString()}
                    </span>
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => remove(b.href)}
                  className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Remove bookmark: ${b.label}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
