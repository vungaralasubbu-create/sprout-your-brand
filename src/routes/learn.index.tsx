import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Clock,
  Flame,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { buildPageHead } from "@/lib/seo-head";
import { LearnSearch } from "@/components/learn/learn-shell";
import {
  articles,
  collections,
  editorsPicks,
  featuredArticles,
  paths,
  recentlyUpdated,
  topics,
  trendingArticles,
  type LearnArticle,
  type LearnTopic,
} from "@/data/learn";

export const Route = createFileRoute("/learn/")({
  head: () =>
    buildPageHead({
      path: "/learn",
      title: "Glintr Learn — Structured Knowledge for Modern Careers",
      description:
        "Learn technology through structured knowledge. Guides, comparisons, roadmaps and glossary across AI, engineering, business and healthcare — from Glintr.",
      type: "website",
    }),
  component: LearnHome,
});

function LearnHome() {
  const featured = featuredArticles();
  const trending = trendingArticles();
  const picks = editorsPicks();
  const recent = recentlyUpdated(6);

  return (
    <div className="pb-32">
      <Hero />
      <PopularTopics list={topics} />
      <FeaturedGuides guides={featured.slice(0, 6)} />
      <Collections />
      <TrendingBlock trending={trending} recent={recent} picks={picks} />
      <LearningPathsBlock />
      <LevelZones />
      <ExpertResources />
    </div>
  );
}

/* ------------------------------- Hero ------------------------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden border-b bg-surface">
      <div className="pointer-events-none absolute inset-0 bg-mesh opacity-40" aria-hidden />
      <div className="mx-auto max-w-4xl px-6 py-20 md:py-28">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground backdrop-blur">
          <BookOpen className="size-3.5" /> Glintr Learn · Knowledge Platform
        </div>
        <h1 className="text-balance text-4xl font-black tracking-tight md:text-6xl">
          Learn technology through structured knowledge.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
          Explore concepts, technologies, career paths, learning guides, comparisons and practical resources — organised the way documentation should be.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to="/learn/topics">
              Explore Topics <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/learn/paths">Browse Learning Paths</Link>
          </Button>
        </div>
        <div className="mt-10 max-w-2xl">
          <LearnSearch large />
        </div>
      </div>
    </section>
  );
}

/* --------------------------- Popular Topics --------------------------- */

function PopularTopics({ list }: { list: LearnTopic[] }) {
  return (
    <SectionBlock
      eyebrow="Popular Topics"
      title="Start with what people are learning right now"
      subtitle="Twenty living topics across AI, engineering, business and healthcare. Each opens into a curated hub of guides, glossary and programs."
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((t) => (
          <Link
            key={t.slug}
            to="/learn/topics"
            hash={t.slug}
            className="group relative flex flex-col gap-2 overflow-hidden rounded-2xl border bg-background p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
          >
            <div
              className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full opacity-30 blur-2xl transition-opacity group-hover:opacity-60"
              style={{ background: `oklch(0.85 0.14 ${t.accent})` }}
              aria-hidden
            />
            <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <t.icon className="size-5" />
            </div>
            <p className="text-sm font-semibold">{t.name}</p>
            <p className="line-clamp-2 text-xs text-muted-foreground">{t.tagline}</p>
            <div className="mt-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">
              <span>{t.level}</span>
              <span aria-hidden>·</span>
              <span className="text-primary/70 transition-transform group-hover:translate-x-0.5">
                Open
              </span>
            </div>
          </Link>
        ))}
      </div>
    </SectionBlock>
  );
}

/* --------------------------- Featured Guides --------------------------- */

function FeaturedGuides({ guides }: { guides: LearnArticle[] }) {
  return (
    <SectionBlock
      eyebrow="Featured Guides"
      title="Long-form guides, updated as the field moves"
      subtitle="Each guide is a structured explainer with a quick answer, key takeaways, FAQs and connected resources."
      tone="alt"
    >
      <div className="grid gap-6 md:grid-cols-2">
        {guides.map((g, i) => (
          <Link
            key={g.slug}
            to="/learn/$slug"
            params={{ slug: g.slug }}
            className={cn(
              "group relative flex flex-col overflow-hidden rounded-3xl border bg-background p-8 transition-all hover:-translate-y-0.5 hover:shadow-xl",
              i === 0 && "md:col-span-2",
            )}
          >
            <div className="mb-4 flex items-center gap-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <Badge variant="muted" className="rounded-full">
                {g.level}
              </Badge>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" />
                {g.readingMinutes} min read
              </span>
              <span aria-hidden>·</span>
              <span>Updated {formatDate(g.updated)}</span>
            </div>
            <h3 className={cn("font-black tracking-tight", i === 0 ? "text-3xl md:text-4xl" : "text-2xl")}>
              {g.title}
            </h3>
            <p className="mt-3 text-muted-foreground">{g.subtitle}</p>
            <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              Read guide
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </SectionBlock>
  );
}

/* --------------------------- Collections --------------------------- */

function Collections() {
  return (
    <SectionBlock
      eyebrow="Learning Collections"
      title="Five collections. One knowledge platform."
      subtitle="Each collection is a hub with dedicated guides, topics, and connected programs."
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {collections.map((c) => (
          <Link
            key={c.slug}
            to="/learn/collections/$slug"
            params={{ slug: c.slug }}
            className="group relative overflow-hidden rounded-3xl border bg-background p-8 transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            <div
              className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", c.color)}
              aria-hidden
            />
            <h3 className="text-xl font-black tracking-tight">{c.name}</h3>
            <p className="mt-3 text-sm text-muted-foreground">{c.description}</p>
            <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              Enter collection
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </SectionBlock>
  );
}

/* --------------------------- Trending / Recent / Picks --------------------------- */

function TrendingBlock({
  trending,
  recent,
  picks,
}: {
  trending: LearnArticle[];
  recent: LearnArticle[];
  picks: LearnArticle[];
}) {
  const columns: { title: string; icon: React.ComponentType<{ className?: string }>; items: LearnArticle[] }[] = [
    { title: "Trending Topics", icon: TrendingUp, items: trending },
    { title: "Recently Updated", icon: Sparkles, items: recent },
    { title: "Most Read", icon: Flame, items: trending.slice().reverse() },
    { title: "Editor's Picks", icon: Star, items: picks },
  ];
  return (
    <SectionBlock eyebrow="What's moving" title="Trending, recent, most read and editor's picks" tone="alt">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((col) => (
          <div key={col.title} className="rounded-2xl border bg-background p-5">
            <div className="mb-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <col.icon className="size-3.5" />
              {col.title}
            </div>
            <ol className="space-y-3">
              {col.items.slice(0, 5).map((a, i) => (
                <li key={a.slug}>
                  <Link
                    to="/learn/$slug"
                    params={{ slug: a.slug }}
                    className="group flex items-start gap-3 text-sm"
                  >
                    <span className="mt-0.5 min-w-[1.5rem] text-xs font-black text-primary/60">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 text-foreground/80 group-hover:text-foreground">
                      {a.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </SectionBlock>
  );
}

/* --------------------------- Learning Paths --------------------------- */

function LearningPathsBlock() {
  return (
    <SectionBlock
      eyebrow="Learning Paths"
      title="Structured pathways, not a pile of tutorials"
      subtitle="Each path shows the concepts in the order they build on each other. Every node opens a real page."
    >
      <div className="space-y-10">
        {paths.map((p) => (
          <div key={p.slug} className="rounded-3xl border bg-background p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h3 className="text-xl font-black tracking-tight">{p.name}</h3>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{p.description}</p>
              </div>
              <Link
                to="/learn/paths"
                className="text-sm font-semibold text-primary hover:underline"
              >
                All paths →
              </Link>
            </div>
            <ol className="mt-6 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
              {p.nodes.map((n, i) => (
                <li key={n.slug}>
                  <Link
                    to="/learn/$slug"
                    params={{ slug: n.slug }}
                    className="group flex h-full flex-col justify-between rounded-2xl border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Step {i + 1}
                    </div>
                    <div className="mt-2 text-sm font-bold">{n.label}</div>
                    <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {n.description}
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </SectionBlock>
  );
}

/* --------------------------- Level Zones --------------------------- */

function LevelZones() {
  const beginner = articles.filter((a) => a.level === "beginner");
  const intermediate = articles.filter((a) => a.level === "intermediate");
  const advanced = articles.filter((a) => a.level === "advanced");
  const groups = [
    {
      label: "Beginner Zone",
      subtitle: "Start here.",
      items: beginner,
    },
    { label: "Intermediate", subtitle: "Go deeper.", items: intermediate },
    { label: "Advanced", subtitle: "Specialist territory.", items: advanced },
  ];
  return (
    <SectionBlock
      eyebrow="Learn by level"
      title="Beginner, intermediate and advanced — clearly marked"
      tone="alt"
    >
      <div className="grid gap-6 md:grid-cols-3">
        {groups.map((g) => (
          <div key={g.label} className="rounded-3xl border bg-background p-6">
            <div className="mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {g.subtitle}
              </p>
              <h3 className="text-lg font-black tracking-tight">{g.label}</h3>
            </div>
            <ul className="space-y-2 text-sm">
              {g.items.slice(0, 6).map((a) => (
                <li key={a.slug}>
                  <Link
                    to="/learn/$slug"
                    params={{ slug: a.slug }}
                    className="text-foreground/75 hover:text-foreground hover:underline"
                  >
                    {a.title}
                  </Link>
                </li>
              ))}
              {g.items.length === 0 ? (
                <li className="text-xs text-muted-foreground">Coming soon.</li>
              ) : null}
            </ul>
          </div>
        ))}
      </div>
    </SectionBlock>
  );
}

/* --------------------------- Expert Resources --------------------------- */

function ExpertResources() {
  const rows = [
    { label: "Research Papers", desc: "Curated links to seminal papers per topic." },
    { label: "Industry Standards", desc: "IEEE, ISO and W3C references where relevant." },
    { label: "Documentation", desc: "Official docs from Google, OpenAI, Anthropic, Cadence." },
    { label: "Best Practices", desc: "Real-world patterns from Glintr partners and mentors." },
  ];
  return (
    <SectionBlock eyebrow="Expert Resources" title="Only linked where the depth is real">
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="rounded-2xl border bg-background p-6">
            <p className="text-sm font-semibold">{r.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{r.desc}</p>
          </div>
        ))}
      </div>
    </SectionBlock>
  );
}

/* --------------------------- Primitives --------------------------- */

function SectionBlock({
  eyebrow,
  title,
  subtitle,
  children,
  tone,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  tone?: "alt";
}) {
  return (
    <section className={cn("border-b", tone === "alt" && "bg-surface")}>
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            {eyebrow}
          </p>
          <h2 className="text-balance text-3xl font-black tracking-tight md:text-4xl">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-4 text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {children}
      </div>
    </section>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
