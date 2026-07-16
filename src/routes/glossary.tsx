import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container } from "@/components/shared/section";
import {
  glossaryByCategory,
  glossaryByLetter,
  listGlossary,
  popularGlossary,
} from "@/data/glossary";
import { EntityCard } from "@/components/shared/entity-card";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const SITE_URL = "https://glintr.com";

export const Route = createFileRoute("/glossary")({
  head: () => {
    const canonical = `${SITE_URL}/glossary`;
    const title =
      "Glossary — AI, Engineering, Marketing & Finance Terms | Glintr";
    const description =
      "The Glintr Glossary explains every concept we teach — AI, Machine Learning, Prompt Engineering, VLSI, Embedded Systems, IoT, Digital Marketing, Finance, Medical Coding and more. Each term links to related programs, blogs and learning paths.";
    const items = listGlossary();
    const collection = {
      "@context": "https://schema.org",
      "@type": "DefinedTermSet",
      name: "Glintr Glossary",
      url: canonical,
      hasDefinedTerm: items.map((g) => ({
        "@type": "DefinedTerm",
        "@id": `${SITE_URL}/glossary/${g.slug}`,
        name: g.term,
        description: g.short,
        url: `${SITE_URL}/glossary/${g.slug}`,
      })),
    };
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: canonical },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(collection) },
      ],
    };
  },
  component: GlossaryIndex,
});

function GlossaryIndex() {
  const all = React.useMemo(() => listGlossary(), []);
  const [query, setQuery] = React.useState("");
  const [activeLetter, setActiveLetter] = React.useState<string | null>(null);
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q && !activeLetter && !activeCategory) return all;
    return all.filter((g) => {
      const inLetter = activeLetter ? g.term[0]!.toUpperCase() === activeLetter : true;
      const inCategory = activeCategory ? g.category === activeCategory : true;
      const inQuery = q
        ? g.term.toLowerCase().includes(q) ||
          g.short.toLowerCase().includes(q) ||
          (g.aliases ?? []).some((a) => a.toLowerCase().includes(q)) ||
          g.category.toLowerCase().includes(q)
        : true;
      return inLetter && inCategory && inQuery;
    });
  }, [all, query, activeLetter, activeCategory]);

  const letters = React.useMemo(() => glossaryByLetter(), []);
  const byCategory = React.useMemo(() => glossaryByCategory(), []);
  const popular = React.useMemo(() => popularGlossary(), []);
  const categories = React.useMemo(
    () => Array.from(new Set(all.map((g) => g.category))).sort(),
    [all],
  );
  const isFiltering =
    query.trim().length > 0 || activeLetter !== null || activeCategory !== null;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Section className="pt-16 pb-8">
          <Container className="max-w-4xl">
            <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">Glossary</span>
            </nav>
            <div className="text-caption font-mono uppercase tracking-widest text-primary mb-3">
              Glossary
            </div>
            <h1 className="font-display font-semibold text-balance tracking-[-0.02em] text-[clamp(2.2rem,4.6vw,3.6rem)] leading-[1.02]">
              Technology &amp; Career Glossary
            </h1>
            <p className="mt-5 text-body-lg text-muted-foreground max-w-2xl">
              Understand important concepts across AI, Programming, Engineering,
              Business and Healthcare. Every entry links to related programs,
              guides and articles.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <a
                href="#browse"
                className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Browse Terms
              </a>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("glossary-search");
                  el?.focus();
                }}
                className="inline-flex items-center gap-1.5 rounded-full border bg-card px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
              >
                Search Glossary
              </button>
            </div>

            <div className="mt-8 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search terms — AI, RTL, SEO, Firmware, Prompt, API…"
                className="w-full rounded-full border bg-card pl-11 pr-4 py-3 text-body outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                aria-label="Search glossary"
              />
            </div>

            {/* Alphabet nav — desktop sticky, mobile horizontal scroll */}
            <div className="mt-6 -mx-4 md:mx-0 md:sticky md:top-16 md:z-10 md:bg-background/80 md:backdrop-blur md:py-2">
              <div className="flex md:flex-wrap gap-1 overflow-x-auto no-scrollbar px-4 md:px-0">
                <button
                  type="button"
                  onClick={() => setActiveLetter(null)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-xs font-mono uppercase tracking-wider border transition-colors",
                    activeLetter === null
                      ? "bg-primary text-primary-foreground border-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  All
                </button>
                {letters.map(([letter]) => (
                  <button
                    key={letter}
                    type="button"
                    onClick={() =>
                      setActiveLetter((cur) => (cur === letter ? null : letter))
                    }
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1 text-xs font-mono uppercase tracking-wider border transition-colors",
                      activeLetter === letter
                        ? "bg-primary text-primary-foreground border-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>
          </Container>
        </Section>

        {isFiltering ? (
          <Section className="pb-24">
            <Container className="max-w-5xl">
              <div className="text-caption font-mono uppercase tracking-widest text-muted-foreground mb-4">
                {filtered.length} result{filtered.length === 1 ? "" : "s"}
              </div>
              {filtered.length ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filtered.map((g) => (
                    <EntityCard key={g.slug} entry={g} />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No terms match “{query}”. Try a broader search.
                </p>
              )}
            </Container>
          </Section>
        ) : (
          <>
            {popular.length ? (
              <Section className="pb-10">
                <Container className="max-w-5xl">
                  <h2 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">
                    Popular terms
                  </h2>
                  <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {popular.map((g) => (
                      <EntityCard key={g.slug} entry={g} />
                    ))}
                  </div>
                </Container>
              </Section>
            ) : null}

            <Section className="pb-10">
              <Container className="max-w-5xl">
                <h2 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">
                  Explore the ecosystem
                </h2>
                <div className="mt-5 grid sm:grid-cols-3 gap-3">
                  <Link
                    to="/learning-paths"
                    className="rounded-2xl border p-5 bg-card hover:border-primary transition-colors"
                  >
                    <div className="text-caption font-mono uppercase tracking-widest text-primary mb-1">
                      Learning paths
                    </div>
                    <div className="font-display font-semibold">Follow a sequence</div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Ordered journeys from fundamentals to specialisation.
                    </p>
                  </Link>
                  <Link
                    to="/compare"
                    className="rounded-2xl border p-5 bg-card hover:border-primary transition-colors"
                  >
                    <div className="text-caption font-mono uppercase tracking-widest text-primary mb-1">
                      Compare
                    </div>
                    <div className="font-display font-semibold">Side-by-side explainers</div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      AI vs ML, ChatGPT vs Claude vs Gemini, VLSI vs Embedded and more.
                    </p>
                  </Link>
                  <Link
                    to="/career-maps"
                    className="rounded-2xl border p-5 bg-card hover:border-primary transition-colors"
                  >
                    <div className="text-caption font-mono uppercase tracking-widest text-primary mb-1">
                      Career maps
                    </div>
                    <div className="font-display font-semibold">See how roles connect</div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Educational maps across AI, Marketing, VLSI, Finance and more.
                    </p>
                  </Link>
                </div>
              </Container>
            </Section>

            <Section className="pb-24">
              <Container className="max-w-5xl space-y-14">
                {byCategory.map(([cat, entries]) => (
                  <section key={cat} id={cat.replace(/\s+/g, "-").toLowerCase()}>
                    <div className="text-caption font-mono uppercase tracking-widest text-primary mb-4">
                      {cat}
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {entries.map((g) => (
                        <EntityCard key={g.slug} entry={g} />
                      ))}
                    </div>
                  </section>
                ))}
              </Container>
            </Section>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
