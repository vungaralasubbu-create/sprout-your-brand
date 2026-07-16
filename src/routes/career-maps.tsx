import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container } from "@/components/shared/section";
import { listCareerMaps } from "@/data/career-maps";
import { ArrowRight } from "lucide-react";

const SITE_URL = "https://glintr.com";

export const Route = createFileRoute("/career-maps")({
  head: () => {
    const canonical = `${SITE_URL}/career-maps`;
    const title = "Career Maps — How Roles Connect | Glintr";
    const description =
      "Educational career maps across AI, Digital Marketing, VLSI, Embedded Systems, Finance and Medical Coding. Understand how the roles in a field relate — no salary promises, no hiring guarantees.";
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
  component: CareerMapsIndex,
});

function CareerMapsIndex() {
  const maps = listCareerMaps();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Section className="pt-16 pb-10">
          <Container className="max-w-4xl">
            <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">Career maps</span>
            </nav>
            <div className="text-caption font-mono uppercase tracking-widest text-primary mb-3">
              Career maps
            </div>
            <h1 className="font-display font-semibold text-balance tracking-[-0.02em] text-[clamp(2.2rem,4.6vw,3.6rem)] leading-[1.02]">
              See how roles connect in each field.
            </h1>
            <p className="mt-5 text-body-lg text-muted-foreground max-w-2xl">
              Educational maps of the role families in AI, marketing, VLSI,
              embedded, finance and healthcare. Not a hiring guarantee — a way
              to orient yourself before choosing a direction.
            </p>
          </Container>
        </Section>

        <Section className="pb-24">
          <Container className="max-w-5xl">
            <div className="grid md:grid-cols-2 gap-4">
              {maps.map((m) => (
                <Link
                  key={m.slug}
                  to="/career-maps/$slug"
                  params={{ slug: m.slug }}
                  className="group rounded-2xl border p-6 bg-card hover:border-primary transition-colors"
                >
                  <div className="text-caption font-mono uppercase tracking-widest text-primary/80 mb-2">
                    {m.domain}
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-display font-semibold text-xl leading-snug">
                      {m.title}
                    </h2>
                    <ArrowRight className="size-4 mt-1 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{m.short}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {m.roles.slice(0, 4).map((r, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border text-muted-foreground"
                      >
                        {r.title}
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
