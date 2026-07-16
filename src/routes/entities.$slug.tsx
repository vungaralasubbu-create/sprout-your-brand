import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container } from "@/components/shared/section";
import {
  getGlossaryEntry,
  listGlossary,
  relatedGlossary,
} from "@/data/glossary";
import {
  QuickAnswer,
  KeyTakeaways,
  PeopleAlsoAsk,
} from "@/components/shared/geo";
import {
  AiCitationBlock,
  KnowledgeBlocks,
  EntityGraph,
  AuthorMeta,
  faqJsonLd,
  definedTermJsonLd,
} from "@/components/shared/geo-extras";
import { ArrowRight } from "lucide-react";

const SITE_URL = "https://glintr.com";

export const Route = createFileRoute("/entities/$slug")({
  loader: ({ params }) => {
    const entry = getGlossaryEntry(params.slug);
    if (!entry) throw notFound();
    return { entry };
  },
  head: ({ params, loaderData }) => {
    const entry = loaderData?.entry;
    const canonical = `${SITE_URL}/entities/${params.slug}`;
    const title = entry
      ? `${entry.term} — Definition, Examples, Applications & Careers | Glintr`
      : "Entity | Glintr";
    const description = entry?.short ?? "Glintr entity page.";
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: canonical },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "index, follow" },
    ];
    const scripts: Array<{ type: string; children: string }> = [];
    if (entry) {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify(
          definedTermJsonLd({
            name: entry.term,
            description: entry.short,
            url: canonical,
          }),
        ),
      });
      if (entry.faqs?.length) {
        scripts.push({
          type: "application/ld+json",
          children: JSON.stringify(faqJsonLd(entry.faqs)),
        });
      }
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            {
              "@type": "ListItem",
              position: 2,
              name: "Entities",
              item: `${SITE_URL}/entities`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: entry.term,
              item: canonical,
            },
          ],
        }),
      });
    }
    return {
      meta,
      links: [{ rel: "canonical", href: canonical }],
      scripts,
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center">
        <p className="text-muted-foreground">Entity not found.</p>
        <Link to="/entities" className="text-primary underline mt-2 inline-block">
          Back to directory
        </Link>
      </div>
    </div>
  ),
  errorComponent: () => (
    <div className="min-h-screen grid place-items-center">
      <p className="text-muted-foreground">Something went wrong loading this entity.</p>
    </div>
  ),
  component: EntityDetail,
});

function EntityDetail() {
  const { entry } = Route.useLoaderData();
  const related = relatedGlossary(entry);
  const all = listGlossary();
  const bySlug = new Map(all.map((g) => [g.slug, g]));

  // Build a 3-hop entity chain: parents/self/children
  const chain = [
    { label: entry.category, hint: "Category" },
    { label: entry.term, hint: "You are here" },
    ...(entry.related ?? [])
      .slice(0, 3)
      .map((s: string) => {
        const g = bySlug.get(s);
        return g
          ? { label: g.term, href: `/entities/${g.slug}`, hint: g.short }
          : null;
      })
      .filter(Boolean) as { label: string; href?: string; hint?: string }[],
  ];

  const knowledge = [
    entry.overview
      ? { heading: "Definition", body: entry.overview }
      : null,
    entry.technical
      ? { heading: "In technical terms", body: entry.technical }
      : null,
    entry.applications?.length
      ? { heading: "Applications", bullets: entry.applications }
      : null,
    entry.examples?.length
      ? { heading: "Real-world examples", bullets: entry.examples }
      : null,
    entry.advantages?.length
      ? { heading: "Advantages", bullets: entry.advantages }
      : null,
    entry.limitations?.length
      ? { heading: "Limitations", bullets: entry.limitations }
      : null,
    entry.mistakes?.length
      ? { heading: "Common mistakes", bullets: entry.mistakes }
      : null,
  ].filter(Boolean) as {
    heading: string;
    body?: string;
    bullets?: string[];
  }[];

  const citationRows = [
    { label: "Definition", value: entry.short },
    { label: "Category", value: entry.category },
    entry.aliases?.length
      ? { label: "Also known as", value: entry.aliases.join(", ") }
      : null,
    entry.related?.length
      ? { label: "Related concepts", value: entry.related.slice(0, 5).join(", ") }
      : null,
    entry.relatedPrograms?.length
      ? {
          label: "Career relevance",
          value: entry.relatedPrograms.slice(0, 3).join(", "),
        }
      : null,
    { label: "Reading time", value: "5 min" },
    { label: "Difficulty", value: entry.technical ? "Intermediate" : "Beginner" },
  ].filter(Boolean) as { label: string; value: string }[];

  const takeaways: string[] = [
    entry.short,
    entry.applications?.[0]
      ? `Used in: ${entry.applications.slice(0, 3).join(", ")}.`
      : null,
    entry.related?.length
      ? `Connects to ${entry.related.slice(0, 3).map((s) => bySlug.get(s)?.term ?? s).join(", ")}.`
      : null,
    entry.relatedPrograms?.length
      ? `Careers: ${entry.relatedPrograms.slice(0, 3).join(", ")}.`
      : null,
  ].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <Section className="pt-28 md:pt-32 pb-8">
        <Container>
          <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/entities" className="hover:text-foreground">Entities</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{entry.term}</span>
          </nav>

          <p className="text-caption font-mono uppercase tracking-widest text-primary">
            {entry.category}
          </p>
          <h1 className="font-display font-semibold text-4xl md:text-6xl tracking-tight mt-3 max-w-4xl">
            {entry.term}
          </h1>
          {entry.aliases?.length ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Also known as: {entry.aliases.join(", ")}
            </p>
          ) : null}

          <div className="mt-6">
            <AuthorMeta
              author="Glintr Editorial Team"
              reviewer="Glintr Learn Reviewers"
              updated={new Date().toISOString().slice(0, 10)}
              readingTimeMin={5}
              expertise={entry.category}
            />
          </div>
        </Container>
      </Section>

      <Section className="pb-12">
        <Container className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-10">
          <div className="space-y-10 min-w-0">
            <QuickAnswer term={entry.term} answer={entry.short} />

            {takeaways.length ? <KeyTakeaways items={takeaways} /> : null}

            <EntityGraph chain={chain} />

            {knowledge.length ? <KnowledgeBlocks blocks={knowledge} /> : null}

            {entry.faqs?.length ? (
              <PeopleAlsoAsk items={entry.faqs} title="Frequently Asked Questions" />
            ) : null}

            {related.length ? (
              <section aria-label="Related concepts">
                <div className="text-caption font-mono uppercase tracking-widest text-primary mb-3">
                  Related Concepts
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {related.slice(0, 8).map((r) => (
                    <li key={r.slug}>
                      <Link
                        to="/entities/$slug"
                        params={{ slug: r.slug }}
                        className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 hover:border-primary/60 hover:bg-primary/5 transition-colors"
                      >
                        <span>
                          <span className="block font-display font-semibold">{r.term}</span>
                          <span className="block text-xs text-muted-foreground line-clamp-1">
                            {r.short}
                          </span>
                        </span>
                        <ArrowRight className="size-4 text-muted-foreground shrink-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 self-start">
            <AiCitationBlock rows={citationRows} />

            {entry.relatedPrograms?.length ? (
              <section className="rounded-2xl border bg-card p-5">
                <div className="text-caption font-mono uppercase tracking-widest text-primary mb-2">
                  Related Programs
                </div>
                <ul className="space-y-1.5 text-sm">
                  {entry.relatedPrograms.slice(0, 6).map((p) => (
                    <li key={p}>
                      <a
                        href={`/programs?q=${encodeURIComponent(p)}`}
                        className="hover:text-primary"
                      >
                        {p.replace(/-/g, " ")}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="rounded-2xl border bg-card p-5">
              <div className="text-caption font-mono uppercase tracking-widest text-primary mb-2">
                Also see
              </div>
              <ul className="space-y-1.5 text-sm">
                <li>
                  <Link to="/glossary/$slug" params={{ slug: entry.slug }} className="hover:text-primary">
                    Glossary entry
                  </Link>
                </li>
                <li>
                  <Link to="/entities" className="hover:text-primary">
                    Entity directory
                  </Link>
                </li>
                <li>
                  <Link to="/knowledge-graph" className="hover:text-primary">
                    Knowledge graph
                  </Link>
                </li>
              </ul>
            </section>
          </aside>
        </Container>
      </Section>

      <SiteFooter />
    </div>
  );
}
