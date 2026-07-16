import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { Card, EmptyState, Pill, SectionHeader } from "@/components/workspace/hub-shell";
import { useHubSearch, type SearchResult } from "@/lib/workspace/hub";

export const Route = createFileRoute("/workspace/search")({
  component: SearchPage,
});

const KIND_LABEL: Record<SearchResult["kind"], string> = {
  note: "Note",
  highlight: "Highlight",
  bookmark: "Bookmark",
  flashcard: "Flashcard",
  notebook: "Notebook",
  event: "Event",
  chat: "AI chat",
};

function SearchPage() {
  const [q, setQ] = useState("");
  const [kindFilter, setKindFilter] = useState<SearchResult["kind"] | "all">("all");
  const results = useHubSearch(q);
  const filtered = useMemo(() => (kindFilter === "all" ? results : results.filter((r) => r.kind === kindFilter)), [results, kindFilter]);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Search"
        title="Smart search"
        description="Instantly find anything you've saved — notes, highlights, bookmarks, flashcards, events and AI chats."
      />

      <Card>
        <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background px-4 py-2">
          <SearchIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search across your workspace…"
            className="flex-1 border-0 bg-transparent text-sm focus:outline-none"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {(["all", ...Object.keys(KIND_LABEL)] as (SearchResult["kind"] | "all")[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKindFilter(k)}
              className={`rounded-full border px-3 py-1 text-[11px] ${
                kindFilter === k ? "border-foreground bg-foreground text-background" : "border-border/70 text-muted-foreground hover:bg-muted"
              }`}
            >
              {k === "all" ? "All" : KIND_LABEL[k]}
            </button>
          ))}
        </div>
      </Card>

      {!q ? (
        <EmptyState title="Start typing" hint="Search your notebooks, notes, highlights, flashcards and more." />
      ) : filtered.length === 0 ? (
        <EmptyState title="No matches" hint="Try a different keyword." />
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => {
            const content = (
              <Card key={r.id} className="!p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{r.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.snippet}</p>
                  </div>
                  <Pill>{KIND_LABEL[r.kind]}</Pill>
                </div>
              </Card>
            );
            return r.href ? (
              <Link key={r.id} to={r.href} className="block">
                {content}
              </Link>
            ) : (
              content
            );
          })}
        </div>
      )}
    </div>
  );
}
