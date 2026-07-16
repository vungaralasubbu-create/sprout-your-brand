import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Panel } from "@/components/workspace/panel";
import { GLOSSARY } from "@/data/glossary";
import { LEARNING_PATHS } from "@/data/learning-paths";
import { TOOLS } from "@/data/tools";
import { useBookmarks, useRecentlyViewed } from "@/lib/mentor/storage";
import { buildRecommendations } from "@/lib/workspace/recommendations";

export const Route = createFileRoute("/my/discover")({
  component: DiscoverPage,
});

function DiscoverPage() {
  const recent = useRecentlyViewed();
  const { items: bookmarks } = useBookmarks();
  const seen = useMemo(
    () => new Set([...recent.map((r) => r.href), ...bookmarks.map((b) => b.href)]),
    [recent, bookmarks],
  );
  const recs = useMemo(() => buildRecommendations(recent, bookmarks, seen), [recent, bookmarks, seen]);

  const featuredGlossary = GLOSSARY.slice(0, 6);
  const featuredPaths = LEARNING_PATHS.slice(0, 4);
  const featuredTools = TOOLS.slice(0, 6);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Discover
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Smart recommendations
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Personalized to what you've been exploring across Glintr.
        </p>
      </header>

      {recs.length > 0 && (
        <Panel eyebrow="For you" title="Handpicked next">
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {recs.map((r) => (
              <li key={r.href}>
                <Link
                  to={r.href}
                  className="flex h-full flex-col justify-between gap-2 rounded-xl border border-border/50 bg-card/50 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40"
                >
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-fit">
                    {r.kind}
                  </span>
                  <p className="text-sm font-semibold text-foreground">{r.label}</p>
                  <p className="text-[11px] text-muted-foreground">{r.reason}</p>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel eyebrow="Knowledge" title="Explore glossary">
          <ul className="grid gap-2 sm:grid-cols-2">
            {featuredGlossary.map((g) => (
              <li key={g.slug}>
                <Link
                  to={`/glossary/${g.slug}`}
                  className="block rounded-lg border border-border/50 bg-card/40 p-2.5 hover:border-primary/40"
                >
                  <p className="text-sm font-semibold text-foreground">{g.term}</p>
                  <p className="text-[11px] text-muted-foreground">{g.category}</p>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel eyebrow="Journeys" title="Trending learning paths">
          <ul className="space-y-2">
            {featuredPaths.map((p) => (
              <li key={p.slug}>
                <Link
                  to={`/learning-paths/${p.slug}`}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border/50 bg-card/40 p-3 hover:border-primary/40"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground">{p.title}</span>
                    <span className="line-clamp-1 block text-[11px] text-muted-foreground">{p.short}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {p.steps.length} steps
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel eyebrow="Practical" title="Featured tools">
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {featuredTools.map((t) => (
            <li key={t.slug}>
              <Link
                to={`/tools/${t.slug}`}
                className="block rounded-lg border border-border/50 bg-card/40 p-3 hover:border-primary/40"
              >
                <p className="text-sm font-semibold text-foreground">{t.title}</p>
                <p className="text-[11px] text-muted-foreground">{t.category}</p>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
