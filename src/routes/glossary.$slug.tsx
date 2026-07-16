import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container } from "@/components/shared/section";
import { Badge } from "@/components/ui/badge";
import {
  getGlossaryEntry,
  listGlossary,
  relatedGlossary,
} from "@/data/glossary";
import { BLOG_TITLES } from "@/data/program-editorial";
import { PeopleAlsoAsk } from "@/components/shared/geo";
import { EntityCard } from "@/components/shared/entity-card";
import { ChevronLeft } from "lucide-react";

const SITE_URL = "https://glintr.com";

export const Route = createFileRoute("/glossary/$slug")({
  loader: ({ params }) => {
    const entry = getGlossaryEntry(params.slug);
    if (!entry) throw notFound();
    return { entry };
  },
  head: ({ params, loaderData }) => {
    const entry = loaderData?.entry;
    const canonical = `${SITE_URL}/glossary/${params.slug}`;
    const title = entry
      ? `${entry.term} — Definition, Examples & Related Concepts | Glintr Glossary`
      : `Glossary | Glintr`;
    const description = entry?.short ?? "Glintr glossary entry.";
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: canonical },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    const scripts: Array<{ type: string; children: string }> = [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Glossary", item: `${SITE_URL}/glossary` },
            { "@type": "ListItem", position: 3, name: entry?.term ?? params.slug, item: canonical },
          ],
        }),
      },
    ];
    if (entry) {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "DefinedTerm",
          "@id": canonical,
          name: entry.term,
          alternateName: entry.aliases,
          description: entry.overview,
          url: canonical,
          inDefinedTermSet: `${SITE_URL}/glossary`,
        }),
      });
      if (entry.faqs?.length) {
        scripts.push({
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: entry.faqs.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: { "@type": "Answer", text: f.answer },
            })),
          }),
        });
      }
    }
    return { meta, links: [{ rel: "canonical", href: canonical }], scripts };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Section className="py-24">
        <Container className="max-w-2xl text-center">
          <h1 className="font-display font-semibold text-3xl">Term Not Found</h1>
          <p className="mt-3 text-muted-foreground">
            The glossary entry you're looking for doesn't exist yet.
          </p>
          <Link to="/glossary" className="mt-6 inline-flex items-center gap-2 text-primary">
            <ChevronLeft className="size-4" /> Back to Glossary
          </Link>
        </Container>
      </Section>
      <SiteFooter />
    </div>
  ),
  errorComponent: () => (
    <div className="min-h-screen grid place-items-center">
      <p className="text-muted-foreground">Something went wrong.</p>
    </div>
  ),
  component: GlossaryDetail,
});

function toTitle(slug: string) {
  return slug.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
}

function GlossaryDetail() {
  const { entry } = Route.useLoaderData();
  const related = relatedGlossary(entry);
  const continueList = listGlossary()
    .filter((g) => g.slug !== entry.slug && g.category !== entry.category)
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Section className="pt-14 pb-6">
          <Container className="max-w-3xl">
            <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground">Home</Link>
              <span className="mx-2">/</span>
              <Link to="/glossary" className="hover:text-foreground">Glossary</Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">{entry.term}</span>
            </nav>
            <Badge variant="muted">{entry.category}</Badge>
            <h1 className="mt-4 font-display font-semibold tracking-[-0.02em] text-balance text-[clamp(2.2rem,4.6vw,3.4rem)] leading-[1.05]">
              {entry.term}
            </h1>
            {entry.aliases?.length ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Also known as: {entry.aliases.join(", ")}
              </p>
            ) : null}
            <p className="mt-6 text-body-lg text-foreground/90 leading-relaxed">
              <strong className="font-semibold">{entry.short}</strong>
            </p>
          </Container>
        </Section>

        <Section className="py-6">
          <Container className="max-w-3xl">
            <article
              itemScope
              itemType="https://schema.org/DefinedTerm"
              className="space-y-10"
            >
              <section>
                <h2 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">
                  Overview
                </h2>
                <p
                  itemProp="description"
                  className="mt-3 text-body md:text-body-lg text-foreground/85 leading-relaxed"
                >
                  {entry.overview}
                </p>
              </section>

              {entry.simple ? (
                <section>
                  <h2 className="font-display font-semibold text-2xl tracking-tight">
                    Simple explanation
                  </h2>
                  <p className="mt-3 text-body md:text-body-lg text-foreground/85 leading-relaxed">
                    {entry.simple}
                  </p>
                </section>
              ) : null}

              {entry.technical ? (
                <section>
                  <h2 className="font-display font-semibold text-2xl tracking-tight">
                    Technical explanation
                  </h2>
                  <p className="mt-3 text-body md:text-body-lg text-foreground/85 leading-relaxed">
                    {entry.technical}
                  </p>
                </section>
              ) : null}

              {entry.examples?.length ? (
                <section>
                  <h2 className="font-display font-semibold text-2xl tracking-tight">
                    Examples
                  </h2>
                  <ul className="mt-3 space-y-2 list-disc pl-5 text-body md:text-body-lg text-foreground/85 leading-relaxed">
                    {entry.examples.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {entry.mistakes?.length ? (
                <section>
                  <h2 className="font-display font-semibold text-2xl tracking-tight">
                    Common mistakes
                  </h2>
                  <ul className="mt-3 space-y-2 list-disc pl-5 text-body md:text-body-lg text-foreground/85 leading-relaxed">
                    {entry.mistakes.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </article>
          </Container>
        </Section>

        {entry.faqs?.length ? (
          <Section className="py-8">
            <Container className="max-w-3xl">
              <PeopleAlsoAsk items={entry.faqs} />
            </Container>
          </Section>
        ) : null}

        {(related.length || entry.relatedPrograms?.length || entry.relatedBlogs?.length) ? (
          <Section className="py-10">
            <Container className="max-w-3xl space-y-10">
              {related.length ? (
                <section>
                  <div className="text-caption font-mono uppercase tracking-widest text-primary mb-3">
                    Related Concepts
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {related.map((r) => (
                      <EntityCard key={r.slug} entry={r} />
                    ))}
                  </div>
                </section>
              ) : null}

              {entry.relatedPrograms?.length ? (
                <section>
                  <div className="text-caption font-mono uppercase tracking-widest text-primary mb-3">
                    Related Programs
                  </div>
                  <ul className="space-y-2">
                    {entry.relatedPrograms.map((slug: string) => (
                      <li key={slug}>
                        <a href="/programs" className="text-primary hover:underline">
                          {toTitle(slug)} →
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {entry.relatedBlogs?.length ? (
                <section>
                  <div className="text-caption font-mono uppercase tracking-widest text-primary mb-3">
                    Related Articles
                  </div>
                  <ul className="space-y-2">
                    {entry.relatedBlogs.map((slug: string) => (
                      <li key={slug}>
                        <Link
                          to="/blog/$slug"
                          params={{ slug }}
                          className="text-primary hover:underline"
                        >
                          {BLOG_TITLES[slug] ?? toTitle(slug)} →
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </Container>
          </Section>
        ) : null}

        {continueList.length ? (
          <Section className="py-16">
            <Container className="max-w-5xl">
              <div className="text-caption font-mono uppercase tracking-widest text-primary mb-3">
                Continue exploring
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {continueList.map((g) => (
                  <EntityCard key={g.slug} entry={g} />
                ))}
              </div>
            </Container>
          </Section>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
