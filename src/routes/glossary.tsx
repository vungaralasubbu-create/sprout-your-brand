import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container } from "@/components/shared/section";
import { listGlossary } from "@/data/glossary";
import { ArrowRight } from "lucide-react";

const SITE_URL = "https://glintr.com";

export const Route = createFileRoute("/glossary")({
  head: () => {
    const canonical = `${SITE_URL}/glossary`;
    const title = "Glintr Glossary — AI, Engineering & Business Terms Explained";
    const description =
      "Concise, factual definitions of the concepts Glintr teaches — Artificial Intelligence, Machine Learning, ChatGPT, Claude, Gemini, VLSI, Embedded Systems, IoT, Digital Marketing, Finance and more.";
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
  const items = listGlossary();
  const byCategory = items.reduce<Record<string, typeof items>>((acc, g) => {
    (acc[g.category] ||= []).push(g);
    return acc;
  }, {});
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Section className="pt-16 pb-10">
          <Container className="max-w-4xl">
            <div className="text-caption font-mono uppercase tracking-widest text-primary mb-3">
              Glossary
            </div>
            <h1 className="font-display font-semibold text-balance tracking-[-0.02em] text-[clamp(2.2rem,4.6vw,3.6rem)] leading-[1.02]">
              A Clear Vocabulary For Modern Learning.
            </h1>
            <p className="mt-5 text-body-lg text-muted-foreground max-w-2xl">
              Short, factual definitions of the concepts we teach — from
              Artificial Intelligence and Prompt Engineering to VLSI, Embedded
              Systems and Digital Marketing. Each entry links to related programs
              and articles so ideas stay connected.
            </p>
          </Container>
        </Section>

        <Section className="pb-24">
          <Container className="max-w-5xl space-y-14">
            {Object.entries(byCategory).map(([cat, entries]) => (
              <section key={cat}>
                <div className="text-caption font-mono uppercase tracking-widest text-primary mb-4">
                  {cat}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {entries.map((g) => (
                    <Link
                      key={g.slug}
                      to="/glossary/$slug"
                      params={{ slug: g.slug }}
                      className="group rounded-2xl border p-5 hover:border-primary transition-colors bg-card"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="font-display font-semibold text-lg">
                          {g.term}
                        </h2>
                        <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                        {g.short}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}
