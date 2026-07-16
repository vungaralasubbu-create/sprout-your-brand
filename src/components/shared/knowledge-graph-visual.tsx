import * as React from "react";
import { Link } from "@tanstack/react-router";
import { GLOSSARY, type GlossaryEntry } from "@/data/glossary";
import { cn } from "@/lib/utils";

/**
 * Lightweight knowledge-graph visualization.
 *
 * Renders a circular / hub-and-spoke layout of the most connected
 * glossary entities as an SVG. Interactive without heavy 3D engines.
 * Mobile falls back to a stacked relationship explorer.
 */

interface Node {
  slug: string;
  term: string;
  category: string;
  x: number;
  y: number;
  degree: number;
}

function buildGraph(): { nodes: Node[]; edges: Array<[string, string]> } {
  const focus = GLOSSARY.filter((g) => g.popular || (g.related?.length ?? 0) >= 3);
  const slugs = new Set(focus.map((g) => g.slug));
  const edges: Array<[string, string]> = [];
  for (const g of focus) {
    for (const r of g.related ?? []) {
      if (slugs.has(r) && g.slug < r) edges.push([g.slug, r]);
    }
  }
  const degree: Record<string, number> = {};
  for (const [a, b] of edges) {
    degree[a] = (degree[a] ?? 0) + 1;
    degree[b] = (degree[b] ?? 0) + 1;
  }
  const R = 220;
  const cx = 280;
  const cy = 260;
  const nodes: Node[] = focus.map((g, i) => {
    const t = (i / focus.length) * Math.PI * 2;
    return {
      slug: g.slug,
      term: g.term,
      category: g.category,
      x: cx + Math.cos(t) * R,
      y: cy + Math.sin(t) * R,
      degree: degree[g.slug] ?? 0,
    };
  });
  return { nodes, edges };
}

export function KnowledgeGraphVisual({ className }: { className?: string }) {
  const { nodes, edges } = React.useMemo(buildGraph, []);
  const nodeBySlug = React.useMemo(
    () => Object.fromEntries(nodes.map((n) => [n.slug, n])),
    [nodes],
  );
  const [active, setActive] = React.useState<string | null>(null);

  const activeEntry: GlossaryEntry | undefined = React.useMemo(
    () => (active ? GLOSSARY.find((g) => g.slug === active) : undefined),
    [active],
  );

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop / tablet: interactive SVG graph */}
      <div className="hidden md:block relative rounded-2xl border bg-card/50 overflow-hidden">
        <svg viewBox="0 0 560 520" className="w-full h-auto" aria-label="Glintr knowledge graph">
          <g stroke="oklch(0.85 0.02 240)" strokeWidth="1" opacity="0.5">
            {edges.map(([a, b], i) => {
              const na = nodeBySlug[a];
              const nb = nodeBySlug[b];
              if (!na || !nb) return null;
              const isActive = active && (active === a || active === b);
              return (
                <line
                  key={i}
                  x1={na.x}
                  y1={na.y}
                  x2={nb.x}
                  y2={nb.y}
                  stroke={isActive ? "oklch(0.65 0.18 200)" : undefined}
                  strokeWidth={isActive ? 1.5 : 1}
                  opacity={active ? (isActive ? 1 : 0.15) : 0.55}
                />
              );
            })}
          </g>
          <g>
            {nodes.map((n) => {
              const isActive = active === n.slug;
              const r = 6 + Math.min(n.degree, 6) * 1.6;
              return (
                <g
                  key={n.slug}
                  transform={`translate(${n.x} ${n.y})`}
                  className="cursor-pointer"
                  onMouseEnter={() => setActive(n.slug)}
                  onFocus={() => setActive(n.slug)}
                  onMouseLeave={() => setActive((s) => (s === n.slug ? null : s))}
                  tabIndex={0}
                >
                  <circle
                    r={r}
                    fill={isActive ? "oklch(0.65 0.18 200)" : "oklch(0.98 0.005 240)"}
                    stroke="oklch(0.45 0.12 200)"
                    strokeWidth={isActive ? 2 : 1}
                  />
                  <text
                    y={r + 12}
                    textAnchor="middle"
                    className="fill-foreground"
                    style={{ fontSize: 10, fontWeight: 500 }}
                  >
                    {n.term}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
        {activeEntry ? (
          <div className="absolute bottom-4 left-4 right-4 rounded-xl border bg-background/95 backdrop-blur p-4 shadow-lg">
            <div className="text-[11px] font-mono uppercase tracking-widest text-primary/80">
              {activeEntry.category}
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-3">
              <div className="font-display font-semibold">{activeEntry.term}</div>
              <Link
                to="/glossary/$slug"
                params={{ slug: activeEntry.slug }}
                className="text-xs text-primary hover:underline"
              >
                Open →
              </Link>
            </div>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {activeEntry.short}
            </p>
          </div>
        ) : null}
      </div>

      {/* Mobile: stacked relationship explorer */}
      <div className="md:hidden space-y-4">
        {nodes.slice(0, 12).map((n) => {
          const entry = GLOSSARY.find((g) => g.slug === n.slug)!;
          return (
            <div key={n.slug} className="rounded-xl border bg-card p-4">
              <div className="text-[11px] font-mono uppercase tracking-widest text-primary/80">
                {entry.category}
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-3">
                <Link
                  to="/glossary/$slug"
                  params={{ slug: entry.slug }}
                  className="font-display font-semibold"
                >
                  {entry.term}
                </Link>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{entry.short}</p>
              {entry.related?.length ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {entry.related.slice(0, 4).map((r) => {
                    const rel = GLOSSARY.find((g) => g.slug === r);
                    if (!rel) return null;
                    return (
                      <Link
                        key={r}
                        to="/glossary/$slug"
                        params={{ slug: rel.slug }}
                        className="text-[11px] px-2 py-0.5 rounded-full border text-muted-foreground hover:text-primary hover:border-primary"
                      >
                        {rel.term}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
