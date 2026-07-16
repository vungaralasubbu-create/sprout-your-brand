import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { Panel } from "@/components/workspace/panel";
import { GLOSSARY } from "@/data/glossary";
import { LEARNING_PATHS } from "@/data/learning-paths";
import { TOOLS } from "@/data/tools";
import { useBookmarks } from "@/lib/mentor/storage";
import { useNotes, useRoadmaps } from "@/lib/workspace/storage";

export const Route = createFileRoute("/my/search")({
  component: SearchPage,
});

interface Hit {
  href?: string;
  label: string;
  sub: string;
  kind: string;
}

function SearchPage() {
  const [q, setQ] = useState("");
  const { items: bookmarks } = useBookmarks();
  const { notes } = useNotes();
  const { roadmaps } = useRoadmaps();

  const hits: Hit[] = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    const all: Hit[] = [];

    for (const g of GLOSSARY) {
      if (`${g.term} ${g.category}`.toLowerCase().includes(t)) {
        all.push({ href: `/glossary/${g.slug}`, label: g.term, sub: g.category, kind: "glossary" });
      }
    }
    for (const p of LEARNING_PATHS) {
      if (`${p.title} ${p.short} ${p.domain}`.toLowerCase().includes(t)) {
        all.push({ href: `/learning-paths/${p.slug}`, label: p.title, sub: p.domain, kind: "path" });
      }
    }
    for (const tool of TOOLS) {
      if (`${tool.title} ${tool.category}`.toLowerCase().includes(t)) {
        all.push({ href: `/tools/${tool.slug}`, label: tool.title, sub: tool.category, kind: "tool" });
      }
    }
    for (const b of bookmarks) {
      if (b.label.toLowerCase().includes(t)) {
        all.push({ href: b.href, label: b.label, sub: "Bookmark", kind: "bookmark" });
      }
    }
    for (const n of notes) {
      if (`${n.title} ${n.body}`.toLowerCase().includes(t)) {
        all.push({ href: "/my/notes", label: n.title, sub: "Note", kind: "note" });
      }
    }
    for (const r of roadmaps) {
      if (r.title.toLowerCase().includes(t)) {
        all.push({ href: "/my/roadmaps", label: r.title, sub: `Roadmap · ${r.domain}`, kind: "roadmap" });
      }
    }
    return all.slice(0, 50);
  }, [q, bookmarks, notes, roadmaps]);

  const grouped = useMemo(() => {
    const m = new Map<string, Hit[]>();
    hits.forEach((h) => {
      const arr = m.get(h.kind) ?? [];
      arr.push(h);
      m.set(h.kind, arr);
    });
    return Array.from(m.entries());
  }, [hits]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Search
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Search everything
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Glossary, learning paths, tools, your bookmarks, notes, and saved roadmaps — all in one search.
        </p>
      </header>

      <div className="relative">
        <SearchIcon
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Try 'prompt engineering', 'vlsi', 'career'…"
          autoFocus
          className="w-full rounded-2xl border border-border/60 bg-card px-4 py-3.5 pl-11 text-sm outline-none focus:border-primary/50"
          aria-label="Search workspace"
        />
      </div>

      {q && (
        <Panel>
          {grouped.length === 0 ? (
            <p className="text-sm text-muted-foreground">No results for "{q}".</p>
          ) : (
            <div className="space-y-5">
              {grouped.map(([kind, items]) => (
                <div key={kind}>
                  <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {kind} · {items.length}
                  </h3>
                  <ul className="grid gap-2 md:grid-cols-2">
                    {items.map((h, i) => (
                      <li key={`${kind}-${i}`}>
                        {h.href ? (
                          <Link
                            to={h.href}
                            className="block rounded-lg border border-border/50 bg-card/50 p-3 hover:border-primary/40"
                          >
                            <p className="text-sm font-semibold text-foreground">{h.label}</p>
                            <p className="text-[11px] text-muted-foreground">{h.sub}</p>
                          </Link>
                        ) : (
                          <div className="rounded-lg border border-border/50 bg-card/50 p-3">
                            <p className="text-sm font-semibold text-foreground">{h.label}</p>
                            <p className="text-[11px] text-muted-foreground">{h.sub}</p>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
