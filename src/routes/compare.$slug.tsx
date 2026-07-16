import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container } from "@/components/shared/section";
import { getComparison, listComparisons } from "@/data/comparisons";
import { RelatedContent } from "@/components/shared/related-content";
import { PeopleAlsoAsk } from "@/components/shared/geo";
import { ChevronLeft } from "lucide-react";

const SITE_URL = "https://glintr.com";

export const Route = createFileRoute("/compare/$slug")({
  loader: ({ params }) => {
    const cmp = getComparison(params.slug);
    if (!cmp) throw notFound();
    return { cmp };
  },
  head: ({ params, loaderData }) => {
    const c = loaderData?.cmp;
    const canonical = `${SITE_URL}/compare/${params.slug}`;
    const title = c ? `${c.title} — Glintr Comparison` : "Compare — Glintr";
    const description = c?.short ?? "Glintr comparison.";
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
      scripts: c
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
                  { "@type": "ListItem", position: 2, name: "Compare", item: `${SITE_URL}/compare` },
                  { "@type": "ListItem", position: 3, name: c.title, item: canonical },
                ],
              }),
            },
            ...(c.faqs?.length
              ? [
                  {
                    type: "application/ld+json",
                    children: JSON.stringify({
                      "@context": "https://schema.org",
                      "@type": "FAQPage",
                      mainEntity: c.faqs.map((f) => ({
                        "@type": "Question",
                        name: f.question,
                        acceptedAnswer: { "@type": "Answer", text: f.answer },
                      })),
                    }),
                  },
                ]
              : []),
          ]
        : undefined,
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Section className="py-24">
        <Container className="max-w-2xl text-center">
          <h1 className="font-display font-semibold text-3xl">Comparison not found</h1>
          <Link to="/compare" className="mt-6 inline-flex items-center gap-2 text-primary">
            <ChevronLeft className="size-4" /> All comparisons
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
  component: CompareDetail,
});

function CompareDetail() {
  const { cmp: c } = Route.useLoaderData();
  const others = listComparisons().filter((x) => x.slug !== c.slug).slice(0, 3);
  const cols = c.items.length;
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Section className="pt-14 pb-6">
          <Container className="max-w-3xl">
            <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground">Home</Link>
              <span className="mx-2">/</span>
              <Link to="/compare" className="hover:text-foreground">Compare</Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">{c.title}</span>
            </nav>
            <h1 className="mt-2 font-display font-semibold text-balance tracking-[-0.02em] text-[clamp(2.2rem,4.6vw,3.4rem)] leading-[1.05]">
              {c.title}
            </h1>
            <p className="mt-4 text-body-lg text-foreground/90 leading-relaxed">
              <strong>{c.short}</strong>
            </p>
            <p className="mt-4 text-body text-muted-foreground leading-relaxed">
              {c.overview}
            </p>
          </Container>
        </Section>

        <Section className="py-8">
          <Container className="max-w-4xl">
            <div className="overflow-x-auto rounded-2xl border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left font-mono uppercase tracking-widest text-[11px] text-muted-foreground px-4 py-3">
                      Dimension
                    </th>
                    {c.items.map((it: string) => (
                      <th
                        key={it}
                        className="text-left font-display font-semibold px-4 py-3"
                      >
                        {it}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {c.rows.map((r: any, i: number) => (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-3 font-medium">{r.dimension}</td>
                      <td className="px-4 py-3 text-foreground/85">{r.a}</td>
                      <td className="px-4 py-3 text-foreground/85">{r.b}</td>
                      {cols === 3 ? (
                        <td className="px-4 py-3 text-foreground/85">{r.c}</td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Container>
        </Section>

        <Section className="py-8">
          <Container className="max-w-3xl">
            <h2 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">
              Key differences
            </h2>
            <ul className="mt-4 space-y-2 list-disc pl-5 text-body md:text-body-lg text-foreground/85 leading-relaxed">
              {c.differences.map((d: string, i: number) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </Container>
        </Section>

        <Section className="py-8">
          <Container className="max-w-3xl">
            <h2 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">
              When to reach for each
            </h2>
            <div className="mt-4 grid md:grid-cols-3 gap-3">
              <div className="rounded-xl border p-5 bg-card">
                <div className="font-display font-semibold">{c.items[0]}</div>
                <p className="mt-2 text-sm text-muted-foreground">{c.whenA}</p>
              </div>
              <div className="rounded-xl border p-5 bg-card">
                <div className="font-display font-semibold">{c.items[1]}</div>
                <p className="mt-2 text-sm text-muted-foreground">{c.whenB}</p>
              </div>
              {c.items[2] && c.whenC ? (
                <div className="rounded-xl border p-5 bg-card">
                  <div className="font-display font-semibold">{c.items[2]}</div>
                  <p className="mt-2 text-sm text-muted-foreground">{c.whenC}</p>
                </div>
              ) : null}
            </div>
          </Container>
        </Section>

        {c.faqs?.length ? (
          <Section className="py-8">
            <Container className="max-w-3xl">
              <PeopleAlsoAsk items={c.faqs} />
            </Container>
          </Section>
        ) : null}

        <Section className="py-10">
          <Container className="max-w-3xl">
            <RelatedContent
              glossarySlugs={c.relatedGlossary}
              programSlugs={c.relatedPrograms}
              pathSlugs={c.relatedPaths}
            />
          </Container>
        </Section>

        {others.length ? (
          <Section className="py-16">
            <Container className="max-w-5xl">
              <div className="text-caption font-mono uppercase tracking-widest text-primary mb-4">
                More comparisons
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                {others.map((o) => (
                  <Link
                    key={o.slug}
                    to="/compare/$slug"
                    params={{ slug: o.slug }}
                    className="rounded-2xl border p-5 bg-card hover:border-primary transition-colors"
                  >
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
