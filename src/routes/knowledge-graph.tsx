import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Filter, GitBranch, Users, GitCompare, X, Sparkles, Bookmark, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container } from "@/components/shared/section";
import { InteractiveGraph } from "@/components/knowledge-graph/interactive-graph";
import { NodePanel } from "@/components/knowledge-graph/node-panel";
import {
  KNOWLEDGE_GRAPH,
  DOMAINS,
  domainMeta,
  searchNodes,
  findComparison,
  type Domain,
  type Level,
  type GraphNode,
} from "@/lib/knowledge-graph";
import { LEARNING_PATHS } from "@/data/learning-paths";
import { CAREER_MAPS } from "@/data/career-maps";
import { cn } from "@/lib/utils";

const SITE_URL = "https://glintr.com";
const STORAGE_BOOKMARKS = "glintr:kg:bookmarks";
const STORAGE_RECENT = "glintr:kg:recent";

export const Route = createFileRoute("/knowledge-graph")({
  head: () => {
    const canonical = `${SITE_URL}/knowledge-graph`;
    const title = "Knowledge Graph — Explore How Every Topic Connects | Glintr";
    const description =
      "An interactive knowledge graph of AI, programming, engineering, business and healthcare — see how concepts, skills, careers and learning paths connect.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: canonical },
        { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  component: KnowledgeGraphPage,
});

type Mode = "explore" | "career" | "roadmap" | "compare";

function loadList(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
function saveList(key: string, list: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(list.slice(0, 24)));
  } catch {
    /* ignore */
  }
}

function KnowledgeGraphPage() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareId, setCompareId] = useState<string | null>(null);
  const [hiddenDomains, setHiddenDomains] = useState<Set<Domain>>(new Set());
  const [level, setLevel] = useState<Level | "all">("all");
  const [mode, setMode] = useState<Mode>("explore");
  const [roadmapIds, setRoadmapIds] = useState<string[]>([]);
  const [careerHighlightIds, setCareerHighlightIds] = useState<Set<string>>(new Set());
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setBookmarks(loadList(STORAGE_BOOKMARKS));
    setRecent(loadList(STORAGE_RECENT));
  }, []);

  const searchResults = useMemo(() => (query ? searchNodes(query, 8) : []), [query]);
  const searchMatchIds = useMemo(() => {
    if (!query) return null;
    const set = new Set(searchNodes(query, 40).map((n) => n.id));
    return set.size ? set : new Set<string>();
  }, [query]);

  const selectedNode: GraphNode | null = selectedId ? KNOWLEDGE_GRAPH.byId.get(selectedId) ?? null : null;
  const compareNode: GraphNode | null = compareId ? KNOWLEDGE_GRAPH.byId.get(compareId) ?? null : null;

  const chooseNode = (id: string | null) => {
    setSelectedId(id);
    if (id) {
      setRecent((prev) => {
        const next = [id, ...prev.filter((x) => x !== id)];
        saveList(STORAGE_RECENT, next);
        return next;
      });
    }
  };

  const handleCompare = (id: string) => {
    if (!selectedId) {
      chooseNode(id);
      return;
    }
    if (id === selectedId) return;
    setCompareId(id);
  };

  const toggleBookmark = (id: string) => {
    setBookmarks((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev];
      saveList(STORAGE_BOOKMARKS, next);
      return next;
    });
  };

  const toggleDomain = (d: Domain) => {
    setHiddenDomains((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  };

  const applyPathRoadmap = (slug: string) => {
    const p = LEARNING_PATHS.find((x) => x.slug === slug);
    if (!p) return;
    const ids = [`p:${p.slug}`];
    for (const s of p.steps) {
      if (s.glossary && KNOWLEDGE_GRAPH.byId.has(`g:${s.glossary}`)) ids.push(`g:${s.glossary}`);
    }
    setRoadmapIds(ids);
    setMode("roadmap");
  };
  const applyCareer = (slug: string) => {
    const c = CAREER_MAPS.find((x) => x.slug === slug);
    if (!c) return;
    const ids = new Set<string>([`c:${c.slug}`]);
    for (const gs of c.relatedGlossary ?? []) {
      if (KNOWLEDGE_GRAPH.byId.has(`g:${gs}`)) ids.add(`g:${gs}`);
    }
    setCareerHighlightIds(ids);
    setMode("career");
  };

  const comparison = compareNode && selectedNode ? findComparison(selectedNode.label, compareNode.label) : null;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        {/* Hero */}
        <Section className="pt-16 pb-8">
          <Container className="max-w-5xl">
            <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">Knowledge graph</span>
            </nav>
            <div className="text-caption font-mono uppercase tracking-widest text-primary mb-3">
              Knowledge graph
            </div>
            <h1 className="font-display font-semibold text-balance tracking-[-0.02em] text-[clamp(2.2rem,4.6vw,3.6rem)] leading-[1.02]">
              Explore the Glintr Knowledge Graph.
            </h1>
            <p className="mt-5 text-body-lg text-muted-foreground max-w-2xl">
              Discover how technologies, skills, careers and learning paths
              connect — from AI to VLSI, from marketing to medical coding.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  document.getElementById("graph-canvas")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-90 flex items-center gap-2"
              >
                Explore topics <ArrowRight className="size-4" />
              </button>
              <Link
                to="/learning-paths"
                className="rounded-full border bg-background px-5 py-2.5 text-sm font-medium hover:bg-muted"
              >
                Browse learning paths
              </Link>
            </div>
          </Container>
        </Section>

        {/* Search + Filters */}
        <Section className="pt-2 pb-6">
          <Container className="max-w-6xl">
            <div className="rounded-3xl border bg-card p-4 md:p-5 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search — AI, React, VLSI, Prompt Engineering, ChatGPT, Finance…"
                  className="w-full rounded-full border bg-background pl-11 pr-4 py-2.5 text-body outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  aria-label="Search knowledge graph"
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-20 mt-2 w-full max-w-xl rounded-2xl border bg-popover shadow-lg overflow-hidden">
                    {searchResults.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          chooseNode(n.id);
                          setQuery("");
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-muted flex items-center justify-between gap-3"
                      >
                        <span className="truncate">
                          <span className="font-medium">{n.label}</span>
                          <span className="text-muted-foreground text-xs ml-2">
                            {n.kind === "concept" ? n.category : n.kind === "path" ? "Learning path" : "Career map"}
                          </span>
                        </span>
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ background: domainMeta(n.domain).color }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Modes */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mr-1">
                  Mode
                </span>
                {(
                  [
                    { id: "explore", label: "Explore", icon: Sparkles },
                    { id: "roadmap", label: "Roadmap", icon: GitBranch },
                    { id: "career", label: "Career", icon: Users },
                    { id: "compare", label: "Compare", icon: GitCompare },
                  ] as const
                ).map((m) => {
                  const active = mode === m.id;
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setMode(m.id);
                        if (m.id !== "roadmap") setRoadmapIds([]);
                        if (m.id !== "career") setCareerHighlightIds(new Set());
                        if (m.id !== "compare") setCompareId(null);
                      }}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium border flex items-center gap-1.5 transition-colors",
                        active
                          ? "bg-foreground text-background border-foreground"
                          : "bg-background hover:bg-muted",
                      )}
                    >
                      <Icon className="size-3.5" /> {m.label}
                    </button>
                  );
                })}
              </div>

              {/* Roadmap picker */}
              {mode === "roadmap" && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mr-1 self-center">
                    Path
                  </span>
                  {LEARNING_PATHS.map((p) => (
                    <button
                      key={p.slug}
                      type="button"
                      onClick={() => applyPathRoadmap(p.slug)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs border",
                        roadmapIds[0] === `p:${p.slug}`
                          ? "bg-primary text-primary-foreground border-primary"
                          : "hover:bg-muted",
                      )}
                    >
                      {p.title.replace(" Learning Path", "")}
                    </button>
                  ))}
                </div>
              )}

              {/* Career picker */}
              {mode === "career" && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mr-1 self-center">
                    Career
                  </span>
                  {CAREER_MAPS.map((c) => (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() => applyCareer(c.slug)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs border",
                        careerHighlightIds.has(`c:${c.slug}`)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "hover:bg-muted",
                      )}
                    >
                      {c.title.replace(" Career Map", "")}
                    </button>
                  ))}
                </div>
              )}

              {mode === "compare" && (
                <div className="text-xs text-muted-foreground pt-1">
                  {!selectedNode
                    ? "Click a first node to begin the comparison."
                    : !compareNode
                      ? `Comparing with ${selectedNode.label}. Click a second node.`
                      : `Comparing ${selectedNode.label} vs ${compareNode.label}.`}
                </div>
              )}

              {/* Domain filters */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mr-1 self-center flex items-center gap-1">
                  <Filter className="size-3" /> Domains
                </span>
                {DOMAINS.map((d) => {
                  const on = !hiddenDomains.has(d.key);
                  return (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => toggleDomain(d.key)}
                      aria-pressed={on}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-medium flex items-center gap-1.5 transition-colors",
                        on ? "bg-background hover:bg-muted" : "opacity-40 bg-background",
                      )}
                    >
                      <span
                        className="inline-block size-2 rounded-full"
                        style={{ background: d.color }}
                      />
                      {d.label}
                    </button>
                  );
                })}
              </div>

              {/* Level */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mr-1 self-center">
                  Learning level
                </span>
                {(["all", "beginner", "intermediate", "advanced"] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLevel(l)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium capitalize",
                      level === l ? "bg-foreground text-background border-foreground" : "hover:bg-muted",
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </Container>
        </Section>

        {/* Graph + Panel */}
        <Section id="graph-canvas" className="pb-16">
          <Container className="max-w-7xl">
            <div className={cn("grid gap-5", selectedNode ? "lg:grid-cols-[1fr_380px]" : "")}>
              <InteractiveGraph
                selectedId={selectedId}
                compareId={compareId}
                onSelect={chooseNode}
                onCompare={handleCompare}
                compareMode={mode === "compare"}
                roadmapIds={roadmapIds}
                careerHighlightIds={careerHighlightIds}
                hiddenDomains={hiddenDomains}
                level={level}
                searchMatchIds={searchMatchIds}
              />
              {selectedNode && (
                <div className="space-y-4">
                  <NodePanel
                    node={selectedNode}
                    bookmarked={bookmarks.includes(selectedNode.id)}
                    onClose={() => {
                      setSelectedId(null);
                      setCompareId(null);
                    }}
                    onToggleBookmark={() => toggleBookmark(selectedNode.id)}
                    onSelect={(id) => chooseNode(id)}
                    onSetRoadmap={(ids) => {
                      setRoadmapIds(ids);
                      setMode("roadmap");
                    }}
                    onSetCareer={(ids) => {
                      setCareerHighlightIds(new Set(ids));
                      setMode("career");
                    }}
                  />
                  {compareNode && (
                    <CompareCard a={selectedNode} b={compareNode} comparison={comparison} onClose={() => setCompareId(null)} />
                  )}
                </div>
              )}
            </div>
          </Container>
        </Section>

        {/* Bookmarks + Recently viewed */}
        {(bookmarks.length > 0 || recent.length > 0) && (
          <Section className="pb-12">
            <Container className="max-w-7xl grid md:grid-cols-2 gap-6">
              {bookmarks.length > 0 && (
                <div className="rounded-3xl border bg-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Bookmark className="size-4" />
                    <h2 className="text-sm font-mono uppercase tracking-widest">Saved concepts</h2>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {bookmarks.map((id) => {
                      const n = KNOWLEDGE_GRAPH.byId.get(id);
                      if (!n) return null;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => chooseNode(id)}
                          className="rounded-full border bg-background px-3 py-1 text-xs hover:bg-muted"
                        >
                          {n.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {recent.length > 0 && (
                <div className="rounded-3xl border bg-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-sm font-mono uppercase tracking-widest">Recently explored</h2>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recent.slice(0, 12).map((id) => {
                      const n = KNOWLEDGE_GRAPH.byId.get(id);
                      if (!n) return null;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => chooseNode(id)}
                          className="rounded-full border bg-background px-3 py-1 text-xs hover:bg-muted"
                        >
                          {n.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </Container>
          </Section>
        )}

        {/* Crawlable index — SEO fallback (all concepts as HTML) */}
        <Section className="pb-24 border-t">
          <Container className="max-w-6xl">
            <div className="text-caption font-mono uppercase tracking-widest text-primary mb-3">
              Every concept, indexed
            </div>
            <h2 className="font-display text-2xl md:text-3xl tracking-tight">
              Browse the full knowledge base.
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl text-sm">
              The graph is an enhancement — every concept below is a
              standalone page. Search engines and screen readers can reach
              them without JavaScript.
            </p>
            <div className="mt-8 space-y-8">
              {DOMAINS.map((d) => {
                const items = KNOWLEDGE_GRAPH.nodes.filter(
                  (n) => n.domain === d.key && n.kind === "concept",
                );
                if (items.length === 0) return null;
                return (
                  <section key={d.key}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="size-2.5 rounded-full" style={{ background: d.color }} />
                      <h3 className="text-sm font-mono uppercase tracking-widest">{d.label}</h3>
                    </div>
                    <ul className="grid sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1.5">
                      {items.map((n) => (
                        <li key={n.id}>
                          <Link
                            to="/glossary/$slug"
                            params={{ slug: n.slug }}
                            className="text-sm text-foreground hover:text-primary hover:underline"
                          >
                            {n.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}

// ---- Compare card ----------------------------------------------------------

function CompareCard({
  a,
  b,
  comparison,
  onClose,
}: {
  a: GraphNode;
  b: GraphNode;
  comparison: ReturnType<typeof findComparison>;
  onClose: () => void;
}) {
  const sharedNeighbors = useMemo(() => {
    const aSet = KNOWLEDGE_GRAPH.neighbors.get(a.id) ?? new Set<string>();
    const bSet = KNOWLEDGE_GRAPH.neighbors.get(b.id) ?? new Set<string>();
    const shared: GraphNode[] = [];
    aSet.forEach((id) => {
      if (bSet.has(id)) {
        const n = KNOWLEDGE_GRAPH.byId.get(id);
        if (n) shared.push(n);
      }
    });
    return shared.slice(0, 8);
  }, [a, b]);

  return (
    <aside className="rounded-3xl border bg-card p-5 relative">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close comparison"
        className="absolute top-3 right-3 rounded-full border bg-background size-8 grid place-items-center hover:bg-muted"
      >
        <X className="size-4" />
      </button>
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
        Compare
      </div>
      <div className="text-base font-display font-semibold">
        {a.label} <span className="text-muted-foreground font-normal">vs</span> {b.label}
      </div>

      {comparison ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">{comparison.overview}</p>
          <div className="rounded-xl border overflow-hidden text-xs">
            <div className="grid grid-cols-3 bg-muted/50 font-mono uppercase tracking-widest text-[10px] px-3 py-2">
              <span>Dimension</span>
              <span>{comparison.items[0]}</span>
              <span>{comparison.items[1]}</span>
            </div>
            {comparison.rows.map((r, i) => (
              <div key={i} className="grid grid-cols-3 px-3 py-2 border-t text-sm">
                <span className="font-medium">{r.dimension}</span>
                <span className="text-muted-foreground">{r.a}</span>
                <span className="text-muted-foreground">{r.b}</span>
              </div>
            ))}
          </div>
          <Link
            to="/compare/$slug"
            params={{ slug: comparison.slug }}
            className="text-primary hover:underline text-xs font-mono uppercase tracking-wider"
          >
            Full comparison →
          </Link>
        </div>
      ) : (
        <div className="mt-4 space-y-3 text-sm">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
              {a.label}
            </div>
            <p className="text-muted-foreground">{a.short}</p>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
              {b.label}
            </div>
            <p className="text-muted-foreground">{b.short}</p>
          </div>
        </div>
      )}

      {sharedNeighbors.length > 0 && (
        <div className="mt-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
            Shared concepts
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sharedNeighbors.map((n) => (
              <span key={n.id} className="rounded-full border bg-background px-2.5 py-0.5 text-xs">
                {n.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
