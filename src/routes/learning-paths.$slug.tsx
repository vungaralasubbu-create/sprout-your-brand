import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container } from "@/components/shared/section";
import { Badge } from "@/components/ui/badge";
import { getLearningPath, listLearningPaths } from "@/data/learning-paths";
import { RelatedContent } from "@/components/shared/related-content";
import { getGlossaryEntry } from "@/data/glossary";
import { ChevronLeft, ArrowRight } from "lucide-react";

const SITE_URL = "https://glintr.com";

export const Route = createFileRoute("/learning-paths/$slug")({
  loader: ({ params }) => {
    const path = getLearningPath(params.slug);
    if (!path) throw notFound();
    return { path };
  },
  head: ({ params, loaderData }) => {
    const p = loaderData?.path;
    const canonical = `${SITE_URL}/learning-paths/${params.slug}`;
    const title = p ? `${p.title} — Glintr` : "Learning Path — Glintr";
    const description = p?.short ?? "Glintr learning path.";
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
      scripts: p
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "LearningResource",
                name: p.title,
                description: p.overview,
                url: canonical,
                educationalLevel: "beginner-to-advanced",
                learningResourceType: "Learning path",
              }),
            },
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
                  { "@type": "ListItem", position: 2, name: "Learning paths", item: `${SITE_URL}/learning-paths` },
                  { "@type": "ListItem", position: 3, name: p.title, item: canonical },
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
          <h1 className="font-display font-semibold text-3xl">Path not found</h1>
          <Link to="/learning-paths" className="mt-6 inline-flex items-center gap-2 text-primary">
            <ChevronLeft className="size-4" /> All learning paths
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
  component: LearningPathDetail,
});

function LearningPathDetail() {
  const { path: p } = Route.useLoaderData();
  const others = listLearningPaths().filter((x) => x.slug !== p.slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Section className="pt-14 pb-6">
          <Container className="max-w-3xl">
            <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground">Home</Link>
              <span className="mx-2">/</span>
              <Link to="/learning-paths" className="hover:text-foreground">Learning paths</Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">{p.title}</span>
            </nav>
            <Badge variant="muted">{p.domain}</Badge>
            <h1 className="mt-4 font-display font-semibold text-balance tracking-[-0.02em] text-[clamp(2.2rem,4.6vw,3.4rem)] leading-[1.05]">
              {p.title}
            </h1>
            <p className="mt-4 text-body-lg text-foreground/90 leading-relaxed">
              <strong>{p.short}</strong>
            </p>
            <p className="mt-4 text-body text-muted-foreground leading-relaxed">
              {p.overview}
            </p>
          </Container>
        </Section>

        <Section className="py-8">
          <Container className="max-w-3xl">
            <h2 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">
              The path
            </h2>
            <ol className="mt-6 space-y-3">
              {p.steps.map((step: any, i: number) => {
                const g = step.glossary ? getGlossaryEntry(step.glossary) : null;
                return (
                  <li
                    key={i}
                    className="relative rounded-xl border p-5 bg-card"
                  >
                    <div className="flex items-baseline gap-4">
                      <span className="font-mono text-sm text-primary/80 tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="font-display font-semibold">
                            {step.label}
                          </div>
                          {g ? (
                            <Link
                              to="/glossary/$slug"
                              params={{ slug: g.slug }}
                              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                            >
                              glossary <ArrowRight className="size-3" />
                            </Link>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Container>
        </Section>

        {p.outcomes.length ? (
          <Section className="py-8">
            <Container className="max-w-3xl">
              <h2 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">
                By the end you can
              </h2>
              <ul className="mt-4 space-y-2 list-disc pl-5 text-body md:text-body-lg text-foreground/85 leading-relaxed">
                {p.outcomes.map((o: string, i: number) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </Container>
          </Section>
        ) : null}

        <Section className="py-10">
          <Container className="max-w-3xl">
            <RelatedContent
              glossarySlugs={p.relatedGlossary}
              programSlugs={p.relatedPrograms}
            />
          </Container>
        </Section>

        {others.length ? (
          <Section className="py-16">
            <Container className="max-w-5xl">
              <div className="text-caption font-mono uppercase tracking-widest text-primary mb-4">
                Other paths
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                {others.map((o) => (
                  <Link
                    key={o.slug}
                    to="/learning-paths/$slug"
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
