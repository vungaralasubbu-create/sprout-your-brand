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
import { ArrowRight, ChevronLeft } from "lucide-react";

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
      ? `${entry.term} — Definition & Overview | Glintr Glossary`
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

function GlossaryDetail() {
  const { entry } = Route.useLoaderData();
  const related = relatedGlossary(entry);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Section className="pt-14 pb-8">
          <Container className="max-w-3xl">
            <Link
              to="/glossary"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-4" /> Glossary
            </Link>
            <Badge variant="secondary" className="mt-6">
              {entry.category}
            </Badge>
            <h1 className="mt-4 font-display font-semibold tracking-[-0.02em] text-balance text-[clamp(2.2rem,4.6vw,3.4rem)] leading-[1.05]">
              {entry.term}
            </h1>
            {entry.aliases?.length ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Also known as: {entry.aliases.join(", ")}
              </p>
            ) : null}
            <p className="mt-6 text-body-lg text-foreground/85 leading-relaxed">
              {entry.short}
            </p>
          </Container>
        </Section>

        <Section className="py-6">
          <Container className="max-w-3xl">
            <article
              itemScope
              itemType="https://schema.org/DefinedTerm"
              className="prose-editorial"
            >
              <h2 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">
                Overview
              </h2>
              <p
                itemProp="description"
                className="mt-3 text-body md:text-body-lg text-foreground/85 leading-relaxed"
              >
                {entry.overview}
              </p>
            </article>
          </Container>
        </Section>

        {entry.faqs?.length ? (
          <Section className="py-10">
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
                      <Link
                        key={r.slug}
                        to="/glossary/$slug"
                        params={{ slug: r.slug }}
                        className="group rounded-xl border p-4 hover:border-primary transition-colors bg-card"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium">{r.term}</span>
                          <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary" />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {r.short}
                        </p>
                      </Link>
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
                    {entry.relatedPrograms.map((slug) => (
                      <li key={slug}>
                        <a
                          href={`/programs`}
                          className="text-primary hover:underline"
                        >
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
                    {entry.relatedBlogs.map((slug) => (
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

        <Section className="py-16">
          <Container className="max-w-3xl">
            <div className="text-caption font-mono uppercase tracking-widest text-primary mb-3">
              Continue exploring
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {listGlossary()
                .filter((g) => g.slug !== entry.slug)
                .slice(0, 6)
                .map((g) => (
                  <Link
                    key={g.slug}
                    to="/glossary/$slug"
                    params={{ slug: g.slug }}
                    className="rounded-xl border p-4 hover:border-primary transition-colors bg-card"
                  >
                    <span className="font-medium">{g.term}</span>
                  </Link>
                ))}
            </div>
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}

function toTitle(slug: string) {
  return slug
    .split("-")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}
