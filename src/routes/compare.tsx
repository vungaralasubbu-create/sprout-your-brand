import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container } from "@/components/shared/section";
import { listComparisons } from "@/data/comparisons";
import { ArrowRight } from "lucide-react";

const SITE_URL = "https://glintr.com";

export const Route = createFileRoute("/compare")({
  head: () => {
    const canonical = `${SITE_URL}/compare`;
    const title = "Comparison Hub — Side-by-side Explainers | Glintr";
    const description =
      "Clear side-by-side comparisons for commonly-confused topics — AI vs Machine Learning, ChatGPT vs Claude vs Gemini, Frontend vs Backend, VLSI vs Embedded, SEO vs SEM, Medical Coding vs Billing.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: canonical },
        { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  component: CompareIndex,
});

function CompareIndex() {
  const items = listComparisons();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Section className="pt-16 pb-10">
          <Container className="max-w-4xl">
            <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">Compare</span>
            </nav>
            <div className="text-caption font-mono uppercase tracking-widest text-primary mb-3">
              Comparison hub
            </div>
            <h1 className="font-display font-semibold text-balance tracking-[-0.02em] text-[clamp(2.2rem,4.6vw,3.6rem)] leading-[1.02]">
              Side-by-side, no marketing.
            </h1>
            <p className="mt-5 text-body-lg text-muted-foreground max-w-2xl">
              Concepts that get confused often — clarified with tables,
              differences and when to reach for each one.
            </p>
          </Container>
        </Section>

        <Section className="pb-24">
          <Container className="max-w-5xl">
            <div className="grid md:grid-cols-2 gap-4">
              {items.map((c) => (
                <Link
                  key={c.slug}
                  to="/compare/$slug"
                  params={{ slug: c.slug }}
                  className="group rounded-2xl border p-6 bg-card hover:border-primary transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-display font-semibold text-xl leading-snug">
                      {c.title}
                    </h2>
                    <ArrowRight className="size-4 mt-1 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{c.short}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {c.items.map((it, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border text-muted-foreground"
                      >
                        {it}
                      </span>
                    ))}
                  </div>
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
