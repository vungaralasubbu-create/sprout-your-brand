import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Sparkles, TrendingUp, Star } from "lucide-react";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container } from "@/components/shared/section";
import { Input } from "@/components/ui/input";
import { buildPageHead, breadcrumbSchema } from "@/lib/seo-head";
import {
  listTools,
  toolsByCategory,
  TOOL_CATEGORIES,
  type ToolEntry,
} from "@/data/tools";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tools")({
  head: () => {
    const all = listTools();
    return buildPageHead({
      path: "/tools",
      title: "Glintr Tools — AI, Career, Learning & Revenue Utilities",
      description:
        "The Glintr Tools ecosystem — an AI career finder, learning roadmap generator, skill gap analyzer, prompt builder, study planner, revenue share calculator, resume analyzer and more. Free, educational and mobile-friendly.",
      schema: [
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Tools", path: "/tools" },
        ]),
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Glintr Tools",
          itemListElement: all.map((t, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `https://glintr.com/tools/${t.slug}`,
            name: t.title,
          })),
        },
      ],
    });
  },
  component: ToolsHub,
});

function ToolsHub() {
  const [query, setQuery] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState<string>("All");
  const all = React.useMemo(() => listTools(), []);
  const byCategory = React.useMemo(() => toolsByCategory(), []);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((t) => {
      const inCat = activeCategory === "All" || t.category === activeCategory;
      if (!inCat) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.short.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.includes(q))
      );
    });
  }, [all, query, activeCategory]);

  const featured = all.filter((t) => t.featured);
  const popular = all.filter((t) => t.popular);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <Section tone="mesh" padding="xl">
        <Container>
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-1 text-caption">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Glintr Tools
            </span>
            <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
              AI Learning, Career, Business &{" "}
              <span className="bg-gradient-to-br from-[#00E6FF] via-[#2E5CFF] to-[#7CFF6B] bg-clip-text text-transparent">
                Revenue Tools
              </span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground md:text-xl">
              Interactive utilities that turn learning intent into a real plan —
              career finders, roadmap generators, skill gap analyzers, prompt
              builders and revenue calculators. Every tool is free, educational
              and mobile-friendly.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-caption text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> {all.length} tools</span>
              <span>·</span>
              <span>AI-assisted where useful</span>
              <span>·</span>
              <span>No account required</span>
            </div>
          </div>
        </Container>
      </Section>

      {/* Search + category filter */}
      <Section padding="md">
        <Container>
          <div className="rounded-3xl border border-border bg-surface p-4 md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tools — AI, career, roadmap, revenue, resume…"
                  aria-label="Search tools"
                  className="pl-9"
                />
              </div>
              <div className="text-caption text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? "tool" : "tools"} shown
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {["All", ...TOOL_CATEGORIES].map((cat) => {
                const count = cat === "All" ? all.length : (byCategory[cat as keyof typeof byCategory]?.length ?? 0);
                if (cat !== "All" && count === 0) return null;
                const active = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm transition",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                    aria-pressed={active}
                  >
                    {cat} <span className="text-xs opacity-60">· {count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </Container>
      </Section>

      {/* Featured (only when no query/filter) */}
      {query === "" && activeCategory === "All" ? (
        <Section padding="md">
          <Container>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Featured tools</h2>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((t) => (
                <ToolCard key={t.slug} tool={t} featured />
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {/* All / filtered */}
      <Section padding="lg">
        <Container>
          <h2 className="text-2xl font-bold">
            {activeCategory === "All" ? "All tools" : activeCategory}
          </h2>
          {filtered.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-border bg-surface p-8 text-center text-muted-foreground">
              No tools match this search yet. Try a different keyword or clear the filter.
            </p>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((t) => (
                <ToolCard key={t.slug} tool={t} />
              ))}
            </div>
          )}
        </Container>
      </Section>

      {/* Popular strip */}
      {query === "" && activeCategory === "All" ? (
        <Section tone="surface" padding="md">
          <Container>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Popular right now</h2>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {popular.map((t) => (
                <Link
                  key={t.slug}
                  to="/tools/$slug"
                  params={{ slug: t.slug }}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-sm hover:border-primary hover:text-primary"
                >
                  {t.title}
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      <SiteFooter />
    </div>
  );
}

function ToolCard({ tool, featured = false }: { tool: ToolEntry; featured?: boolean }) {
  return (
    <Link
      to="/tools/$slug"
      params={{ slug: tool.slug }}
      className={cn(
        "group relative flex flex-col rounded-2xl border border-border bg-surface p-6 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg",
        featured && "ring-1 ring-primary/20",
      )}
    >
      <div
        className={cn(
          "inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white",
          tool.accent,
        )}
        aria-hidden
      >
        <Sparkles className="h-5 w-5" />
      </div>
      <div className="mt-4">
        <div className="text-caption text-muted-foreground">{tool.category}</div>
        <h3 className="mt-1 text-lg font-bold">{tool.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{tool.short}</p>
      </div>
      <div className="mt-5 flex flex-wrap gap-1.5">
        {tool.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
            #{tag}
          </span>
        ))}
      </div>
      <div className="mt-auto pt-5 text-sm font-semibold text-primary group-hover:underline">
        Open tool →
      </div>
    </Link>
  );
}
