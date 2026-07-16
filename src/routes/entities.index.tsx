import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container } from "@/components/shared/section";
import { glossaryByCategory, listGlossary } from "@/data/glossary";

const SITE_URL = "https://glintr.com";

export const Route = createFileRoute("/entities/")({
  head: () => {
    const canonical = `${SITE_URL}/entities`;
    const title = "Entity Directory — AI, Engineering, Finance & More | Glintr";
    const description =
      "Structured directory of every major concept covered on Glintr — AI, Machine Learning, VLSI, Embedded Systems, Cloud, Finance and more. Built for humans and AI search.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: canonical },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "robots", content: "index, follow" },
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "DefinedTermSet",
            "@id": canonical,
            name: "Glintr Entity Directory",
            url: canonical,
            hasDefinedTerm: listGlossary().map((g) => ({
              "@type": "DefinedTerm",
              name: g.term,
              url: `${SITE_URL}/entities/${g.slug}`,
              description: g.short,
            })),
          }),
        },
      ],
    };
  },
  component: EntityDirectory,
});

function EntityDirectory() {
  const grouped = glossaryByCategory();
  const total = listGlossary().length;
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Section className="pt-28 md:pt-32 pb-16">
        <Container>
          <p className="text-caption font-mono uppercase tracking-widest text-primary">
            Entity Directory
          </p>
          <h1 className="font-display font-semibold text-4xl md:text-6xl tracking-tight mt-3 max-w-4xl">
            Every concept Glintr covers, in one structured index.
          </h1>
          <p className="mt-4 text-body-lg text-foreground/70 max-w-3xl">
            {total} concepts across AI, engineering, cloud, finance and more —
            each with a canonical page for AI systems and search engines to cite.
          </p>
        </Container>
      </Section>

      <Section className="pb-24">
        <Container>
          <div className="space-y-12">
            {grouped.map(([category, entries]) => (
              <section key={category} aria-label={category}>
                <div className="flex items-baseline justify-between mb-4">
                  <h2 className="font-display font-semibold text-2xl tracking-tight">
                    {category}
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    {entries.length} entities
                  </span>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {entries.map((e) => (
                    <li key={e.slug}>
                      <Link
                        to="/entities/$slug"
                        params={{ slug: e.slug }}
                        className="block h-full rounded-xl border bg-card p-4 hover:border-primary/60 hover:bg-primary/5 transition-colors"
                      >
                        <div className="font-display font-semibold text-base leading-tight">
                          {e.term}
                        </div>
                        <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                          {e.short}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </Container>
      </Section>
      <SiteFooter />
    </div>
  );
}
