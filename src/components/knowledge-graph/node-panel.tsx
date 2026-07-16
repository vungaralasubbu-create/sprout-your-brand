import { Link } from "@tanstack/react-router";
import { X, BookmarkPlus, BookmarkCheck, ExternalLink } from "lucide-react";
import { KNOWLEDGE_GRAPH, domainMeta, neighborsOf, type GraphNode } from "@/lib/knowledge-graph";
import { getLearningPath } from "@/data/learning-paths";
import { getCareerMap } from "@/data/career-maps";
import { cn } from "@/lib/utils";

export interface NodePanelProps {
  node: GraphNode;
  onClose: () => void;
  bookmarked: boolean;
  onToggleBookmark: () => void;
  onSelect: (id: string) => void;
  onSetRoadmap?: (ids: string[]) => void;
  onSetCareer?: (ids: string[]) => void;
}

function readingMinutes(node: GraphNode) {
  const overview = node.entry?.overview ?? node.short ?? "";
  const words = overview.split(/\s+/).length;
  return Math.max(2, Math.round(words / 220));
}

export function NodePanel({
  node,
  onClose,
  bookmarked,
  onToggleBookmark,
  onSelect,
  onSetRoadmap,
  onSetCareer,
}: NodePanelProps) {
  const dm = domainMeta(node.domain);
  const neighbors = neighborsOf(node.id);
  const relatedConcepts = neighbors.filter((n) => n.kind === "concept").slice(0, 12);
  const relatedPaths = neighbors.filter((n) => n.kind === "path");
  const relatedCareers = neighbors.filter((n) => n.kind === "career");
  const entry = node.entry;
  const mins = readingMinutes(node);

  const path = node.kind === "path" ? getLearningPath(node.slug) : null;
  const career = node.kind === "career" ? getCareerMap(node.slug) : null;

  const difficulty =
    node.level === "beginner" ? "Beginner" : node.level === "advanced" ? "Advanced" : "Intermediate";

  return (
    <aside
      className="rounded-3xl border bg-card overflow-hidden flex flex-col max-h-[680px]"
      aria-label={`${node.label} details`}
    >
      <div
        className="relative px-5 py-4 border-b"
        style={{
          background: `linear-gradient(135deg, ${dm.color} 0%, transparent 90%)`,
          backgroundColor: "oklch(0.98 0.01 260 / 0.5)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 rounded-full border bg-background/80 backdrop-blur size-8 grid place-items-center hover:bg-muted"
          aria-label="Close panel"
        >
          <X className="size-4" />
        </button>
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
          {node.kind === "concept" ? "Concept" : node.kind === "path" ? "Learning path" : "Career map"}
          {" · "}
          {node.category}
        </div>
        <h3 className="text-xl md:text-2xl font-display font-semibold tracking-tight pr-8">
          {node.label}
        </h3>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full bg-background/70 backdrop-blur border px-2 py-0.5 font-mono">
            {difficulty}
          </span>
          <span className="rounded-full bg-background/70 backdrop-blur border px-2 py-0.5 font-mono">
            ~{mins} min read
          </span>
          {node.popular && (
            <span className="rounded-full bg-background/70 backdrop-blur border px-2 py-0.5 font-mono">
              Popular
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 text-sm">
        <p className="text-body text-foreground">{entry?.short ?? node.short ?? path?.short ?? career?.short}</p>

        {entry?.simple && (
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
              In simple terms
            </div>
            <p className="text-muted-foreground">{entry.simple}</p>
          </div>
        )}

        {/* Path mode trigger */}
        {node.kind === "path" && path && onSetRoadmap && (
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Roadmap
            </div>
            <ol className="space-y-1.5">
              {path.steps.map((s, i) => (
                <li key={i} className="flex items-baseline gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground w-4">{i + 1}.</span>
                  <span className="text-foreground font-medium">{s.label}</span>
                  <span className="text-muted-foreground text-xs">{s.description}</span>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={() => {
                const ids = [`p:${path.slug}`];
                for (const s of path.steps) {
                  if (s.glossary && KNOWLEDGE_GRAPH.byId.has(`g:${s.glossary}`)) ids.push(`g:${s.glossary}`);
                }
                onSetRoadmap(ids);
              }}
              className="mt-3 rounded-full bg-foreground text-background px-3 py-1.5 text-xs font-mono uppercase tracking-wider hover:opacity-90"
            >
              Show as roadmap
            </button>
          </div>
        )}

        {/* Career mode trigger */}
        {node.kind === "career" && career && onSetCareer && (
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Foundations
            </div>
            <div className="flex flex-wrap gap-1.5">
              {career.foundations.map((f) => (
                <span key={f} className="rounded-full border bg-background px-2 py-0.5 text-xs">
                  {f}
                </span>
              ))}
            </div>
            <div className="mt-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Role families
            </div>
            <ul className="space-y-2">
              {career.roles.map((r) => (
                <li key={r.title} className="border rounded-xl p-3">
                  <div className="font-medium text-foreground">{r.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{r.description}</div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => {
                const ids = [`c:${career.slug}`];
                for (const gs of career.relatedGlossary ?? []) {
                  if (KNOWLEDGE_GRAPH.byId.has(`g:${gs}`)) ids.push(`g:${gs}`);
                }
                onSetCareer(ids);
              }}
              className="mt-3 rounded-full bg-foreground text-background px-3 py-1.5 text-xs font-mono uppercase tracking-wider hover:opacity-90"
            >
              Highlight career skills
            </button>
            <p className="mt-3 text-[11px] text-muted-foreground italic">{career.disclaimer}</p>
          </div>
        )}

        {/* Related concepts */}
        {relatedConcepts.length > 0 && (
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Related concepts
            </div>
            <div className="flex flex-wrap gap-1.5">
              {relatedConcepts.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onSelect(n.id)}
                  className="rounded-full border bg-background px-2.5 py-1 text-xs hover:bg-muted transition-colors"
                >
                  {n.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Related paths / careers */}
        {(relatedPaths.length > 0 || relatedCareers.length > 0) && node.kind === "concept" && (
          <div className="grid grid-cols-1 gap-3">
            {relatedPaths.length > 0 && (
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                  On these learning paths
                </div>
                <ul className="space-y-1">
                  {relatedPaths.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(n.id)}
                        className="text-primary hover:underline"
                      >
                        → {n.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {relatedCareers.length > 0 && (
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                  Career maps
                </div>
                <ul className="space-y-1">
                  {relatedCareers.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(n.id)}
                        className="text-primary hover:underline"
                      >
                        → {n.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Related programs */}
        {entry?.relatedPrograms && entry.relatedPrograms.length > 0 && (
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Related programs
            </div>
            <div className="flex flex-wrap gap-1.5">
              {entry.relatedPrograms.map((slug) => (
                <Link
                  key={slug}
                  to="/programs/$category"
                  params={{ category: "computer-science" }}
                  className="rounded-full border bg-background px-2.5 py-1 text-xs hover:bg-muted"
                >
                  {slug.replace(/-/g, " ")}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related learn */}
        {entry?.relatedLearn && entry.relatedLearn.length > 0 && (
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Learn guides
            </div>
            <ul className="space-y-1">
              {entry.relatedLearn.slice(0, 6).map((slug) => (
                <li key={slug}>
                  <Link
                    to="/learn/$slug"
                    params={{ slug }}
                    className="text-primary hover:underline text-sm"
                  >
                    → {slug.replace(/-/g, " ")}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="border-t px-5 py-3 flex items-center justify-between gap-2 bg-background/50">
        <button
          type="button"
          onClick={onToggleBookmark}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium",
            bookmarked ? "bg-foreground text-background" : "bg-background hover:bg-muted",
          )}
        >
          {bookmarked ? <BookmarkCheck className="size-3.5" /> : <BookmarkPlus className="size-3.5" />}
          {bookmarked ? "Saved" : "Save"}
        </button>
        {node.kind === "concept" && (
          <Link
            to="/glossary/$slug"
            params={{ slug: node.slug }}
            className="flex items-center gap-1.5 rounded-full bg-foreground text-background px-3 py-1.5 text-xs font-mono uppercase tracking-wider hover:opacity-90"
          >
            Open <ExternalLink className="size-3" />
          </Link>
        )}
        {node.kind === "path" && (
          <Link
            to="/learning-paths/$slug"
            params={{ slug: node.slug }}
            className="flex items-center gap-1.5 rounded-full bg-foreground text-background px-3 py-1.5 text-xs font-mono uppercase tracking-wider hover:opacity-90"
          >
            Full path <ExternalLink className="size-3" />
          </Link>
        )}
        {node.kind === "career" && (
          <Link
            to="/career-maps/$slug"
            params={{ slug: node.slug }}
            className="flex items-center gap-1.5 rounded-full bg-foreground text-background px-3 py-1.5 text-xs font-mono uppercase tracking-wider hover:opacity-90"
          >
            Career map <ExternalLink className="size-3" />
          </Link>
        )}
      </div>
    </aside>
  );
}
