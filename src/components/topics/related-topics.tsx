import { Link } from "@tanstack/react-router";
import { ArrowUpRight, BookOpen, GraduationCap, Briefcase, Wrench, Sparkles } from "lucide-react";

import type { Cluster, Pillar } from "@/data/topics";
import { listClusters, listPillars } from "@/data/topics";

type ContextKind = "pillar" | "cluster" | "blog" | "course" | "career";

interface RelatedTopicsProps {
  currentPillarSlug?: string;
  currentClusterSlug?: string;
  /** Optional keywords used to pick the most-related pillars. */
  keywords?: string[];
  /** Where this widget is rendered — affects the section headline. */
  context?: ContextKind;
  limit?: number;
}

/**
 * Auto-related-topics widget. Renders 3 rails:
 *  - Related pillars (2 nearest topical authorities)
 *  - Related clusters (5 sibling articles under the same pillar)
 *  - You may also like (cross-pillar picks)
 *
 * Works from any route — pass the current pillar/cluster or leave both
 * empty for a general "explore" widget on non-topic pages.
 */
export function RelatedTopics({
  currentPillarSlug,
  currentClusterSlug,
  keywords,
  context = "pillar",
  limit = 5,
}: RelatedTopicsProps) {
  const all = listPillars();
  const current = currentPillarSlug ? all.find((p) => p.slug === currentPillarSlug) : undefined;

  const relatedPillars = pickRelatedPillars(all, current, keywords, 4);
  const clusters = current
    ? // sibling clusters when we know the pillar
      require("@/data/topics").listClusters(current.slug).filter((c: Cluster) => c.slug !== currentClusterSlug).slice(0, limit)
    : [];
  const alsoLike = pickAlsoLike(all, current, 4);

  return (
    <section className="border-t border-border bg-card/40 py-16">
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-label mb-2">People also learn</p>
        <h2 className="text-page-title mb-8">Related learning across Glintr</h2>

        {clusters.length > 0 && (
          <div className="mb-10">
            <h3 className="text-heading mb-4 flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Continue in {current?.name}
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {clusters.map((c: Cluster) => (
                <Link
                  key={c.slug}
                  to="/topics/$pillar/$cluster"
                  params={{ pillar: c.pillarSlug, cluster: c.slug }}
                  className="group flex items-start justify-between gap-3 rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/50 hover:bg-accent/40"
                >
                  <div>
                    <div className="text-sm font-semibold text-foreground group-hover:text-primary">{c.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{c.description}</div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-heading mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Related topics
            </h3>
            <ul className="space-y-2">
              {relatedPillars.map((p) => (
                <li key={p.slug}>
                  <Link
                    to="/topics/$pillar"
                    params={{ pillar: p.slug }}
                    className="group flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 transition-colors hover:border-primary/50 hover:bg-accent/40"
                  >
                    <div>
                      <div className="text-sm font-semibold text-foreground group-hover:text-primary">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.tagline}</div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-heading mb-4 flex items-center gap-2">
              <GraduationCap className="h-4 w-4" /> You may also like
            </h3>
            <ul className="space-y-2">
              {alsoLike.map((p) => (
                <li key={p.slug}>
                  <Link
                    to="/topics/$pillar"
                    params={{ pillar: p.slug }}
                    className="group flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 transition-colors hover:border-primary/50 hover:bg-accent/40"
                  >
                    <div>
                      <div className="text-sm font-semibold text-foreground group-hover:text-primary">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.tagline}</div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/programs"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-accent"
          >
            <Briefcase className="h-4 w-4" /> Explore programs
          </Link>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-accent"
          >
            <BookOpen className="h-4 w-4" /> Read the blog
          </Link>
          <Link
            to="/tools"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-accent"
          >
            <Wrench className="h-4 w-4" /> Try tools
          </Link>
        </div>
      </div>
    </section>
  );
}

function pickRelatedPillars(all: Pillar[], current: Pillar | undefined, keywords: string[] | undefined, n: number): Pillar[] {
  if (current?.relatedPillarSlugs?.length) {
    const map = new Map(all.map((p) => [p.slug, p]));
    return current.relatedPillarSlugs.map((s) => map.get(s)).filter(Boolean).slice(0, n) as Pillar[];
  }
  if (keywords?.length) {
    const kws = keywords.map((k) => k.toLowerCase());
    const scored = all
      .filter((p) => p.slug !== current?.slug)
      .map((p) => ({ p, score: scorePillar(p, kws) }))
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, n).map((s) => s.p);
  }
  // Fallback: same-category first, then anything.
  const sameCat = current ? all.filter((p) => p.category === current.category && p.slug !== current.slug) : [];
  const rest = all.filter((p) => !sameCat.includes(p) && p.slug !== current?.slug);
  return [...sameCat, ...rest].slice(0, n);
}

function pickAlsoLike(all: Pillar[], current: Pillar | undefined, n: number): Pillar[] {
  // Prefer cross-category picks for serendipity.
  const cross = current ? all.filter((p) => p.category !== current.category) : all;
  return cross.slice(0, n);
}

function scorePillar(p: Pillar, kws: string[]): number {
  const bag = [p.name, p.tagline, p.overview, ...p.skills, ...p.tools, ...p.applications]
    .join(" ")
    .toLowerCase();
  return kws.reduce((sum, k) => sum + (bag.includes(k) ? 1 : 0), 0);
}
