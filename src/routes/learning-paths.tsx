import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container } from "@/components/shared/section";
import { listLearningPaths } from "@/data/learning-paths";
import { ArrowRight } from "lucide-react";

const SITE_URL = "https://glintr.com";

export const Route = createFileRoute("/learning-paths")({
  head: () => {
    const canonical = `${SITE_URL}/learning-paths`;
    const title = "Learning Paths — Structured Journeys | Glintr";
    const description =
      "Educational learning paths across AI, Software, Electronics, VLSI, Digital Marketing, Finance and Medical Coding. Each path connects glossary terms, programs and articles into a natural sequence.";
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
  component: LearningPathsIndex,
});

function LearningPathsIndex() {
  const paths = listLearningPaths();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Section className="pt-16 pb-10">
          <Container className="max-w-4xl">
            <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">Learning paths</span>
            </nav>
            <div className="text-caption font-mono uppercase tracking-widest text-primary mb-3">
              Learning paths
            </div>
            <h1 className="font-display font-semibold text-balance tracking-[-0.02em] text-[clamp(2.2rem,4.6vw,3.6rem)] leading-[1.02]">
              Follow a natural sequence, not a checklist.
            </h1>
            <p className="mt-5 text-body-lg text-muted-foreground max-w-2xl">
              Each learning path connects glossary concepts, programs and
              articles into an ordered journey. They are educational — pick the
              one closest to your goal and move at your own pace.
            </p>
          </Container>
        </Section>

        <Section className="pb-24">
          <Container className="max-w-5xl">
            <div className="grid md:grid-cols-2 gap-4">
              {paths.map((p) => (
                <Link
                  key={p.slug}
                  to="/learning-paths/$slug"
                  params={{ slug: p.slug }}
                  className="group rounded-2xl border p-6 bg-card hover:border-primary transition-colors"
                >
                  <div className="text-caption font-mono uppercase tracking-widest text-primary/80 mb-2">
                    {p.domain}
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-display font-semibold text-xl leading-snug">
                      {p.title}
                    </h2>
                    <ArrowRight className="size-4 mt-1 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{p.short}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {p.steps.slice(0, 5).map((s, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border text-muted-foreground"
                      >
                        {s.label}
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
