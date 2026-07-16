import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container } from "@/components/shared/section";
import { Badge } from "@/components/ui/badge";
import { getCareerMap, listCareerMaps } from "@/data/career-maps";
import { RelatedContent } from "@/components/shared/related-content";
import { getGlossaryEntry } from "@/data/glossary";
import { ChevronLeft } from "lucide-react";

const SITE_URL = "https://glintr.com";

export const Route = createFileRoute("/career-maps/$slug")({
  loader: ({ params }) => {
    const map = getCareerMap(params.slug);
    if (!map) throw notFound();
    return { map };
  },
  head: ({ params, loaderData }) => {
    const m = loaderData?.map;
    const canonical = `${SITE_URL}/career-maps/${params.slug}`;
    const title = m ? `${m.title} — Glintr` : "Career Map — Glintr";
    const description = m?.short ?? "Glintr career map.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: canonical },
        { property: "og:type", content: "article" },
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts: m
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
                  { "@type": "ListItem", position: 2, name: "Career maps", item: `${SITE_URL}/career-maps` },
                  { "@type": "ListItem", position: 3, name: m.title, item: canonical },
                ],
              }),
            },
          ]
        : undefined,
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Section className="py-24">
        <Container className="max-w-2xl text-center">
          <h1 className="font-display font-semibold text-3xl">Map not found</h1>
          <Link to="/career-maps" className="mt-6 inline-flex items-center gap-2 text-primary">
            <ChevronLeft className="size-4" /> All career maps
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
  component: CareerMapDetail,
});

function CareerMapDetail() {
  const { map: m } = Route.useLoaderData();
  const others = listCareerMaps().filter((x) => x.slug !== m.slug).slice(0, 3);
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Section className="pt-14 pb-6">
          <Container className="max-w-3xl">
            <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground">Home</Link>
              <span className="mx-2">/</span>
              <Link to="/career-maps" className="hover:text-foreground">Career maps</Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">{m.title}</span>
            </nav>
            <Badge variant="muted">{m.domain}</Badge>
            <h1 className="mt-4 font-display font-semibold text-balance tracking-[-0.02em] text-[clamp(2.2rem,4.6vw,3.4rem)] leading-[1.05]">
              {m.title}
            </h1>
            <p className="mt-4 text-body-lg text-foreground/90 leading-relaxed">
              <strong>{m.short}</strong>
            </p>
            <p className="mt-4 text-body text-muted-foreground leading-relaxed">
              {m.overview}
            </p>
            <div className="mt-6 rounded-xl border bg-muted/30 p-4 text-xs text-muted-foreground leading-relaxed">
              {m.disclaimer}
            </div>
          </Container>
        </Section>

        {m.foundations.length ? (
          <Section className="py-6">
            <Container className="max-w-3xl">
              <h2 className="font-display font-semibold text-2xl tracking-tight">
                Foundations
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {m.foundations.map((f: string) => (
                  <span
                    key={f}
                    className="text-xs font-mono uppercase tracking-wider px-3 py-1 rounded-full border text-muted-foreground"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </Container>
          </Section>
        ) : null}

        <Section className="py-8">
          <Container className="max-w-4xl">
            <h2 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">
              Role families
            </h2>
            <div className="mt-6 grid md:grid-cols-2 gap-3">
              {m.roles.map((r: any) => (
                <div key={r.title} className="rounded-2xl border p-5 bg-card">
                  <div className="font-display font-semibold">{r.title}</div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {r.description}
                  </p>
                  {r.glossary?.length ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {r.glossary.map((slug: string) => {
                        const g = getGlossaryEntry(slug);
                        if (!g) return null;
                        return (
                          <Link
                            key={slug}
                            to="/glossary/$slug"
                            params={{ slug }}
                            className="text-[11px] px-2 py-0.5 rounded-full border text-muted-foreground hover:text-primary hover:border-primary"
                          >
                            {g.term}
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                  {r.path ? (
                    <Link
                      to="/learning-paths/$slug"
                      params={{ slug: r.path }}
                      className="mt-3 inline-block text-xs text-primary hover:underline"
                    >
                      Suggested learning path →
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          </Container>
        </Section>

        <Section className="py-10">
          <Container className="max-w-3xl">
            <RelatedContent
              glossarySlugs={m.relatedGlossary}
              programSlugs={m.relatedPrograms}
              pathSlugs={m.relatedPaths}
            />
          </Container>
        </Section>

        {others.length ? (
          <Section className="py-16">
            <Container className="max-w-5xl">
              <div className="text-caption font-mono uppercase tracking-widest text-primary mb-4">
                Other career maps
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                {others.map((o) => (
                  <Link
                    key={o.slug}
                    to="/career-maps/$slug"
                    params={{ slug: o.slug }}
                    className="rounded-2xl border p-5 bg-card hover:border-primary transition-colors"
                  >
                    <div className="text-caption font-mono uppercase tracking-widest text-primary/80 mb-1">
                      {o.domain}
                    </div>
                    <div className="font-display font-semibold">{o.title}</div>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {o.short}
                    </p>
                  </Link>
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
