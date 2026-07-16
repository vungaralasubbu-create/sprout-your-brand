import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Layers, Sparkles } from "lucide-react";

import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { TopicBreadcrumbs } from "@/components/topics/topic-chrome";
import { listPillars, listPillarsByCategory } from "@/data/topics";
import { buildPageHead, breadcrumbSchema } from "@/lib/seo-head";

export const Route = createFileRoute("/topics/")({
  head: () => {
    const pillars = listPillars();
    return buildPageHead({
      path: "/topics",
      title: "Learn AI, Technology, Engineering & Business Careers | Glintr Topics",
      description:
        "Glintr Topics is your knowledge hub for AI, technology, engineering, finance and career growth. 38 pillar topics, 450+ guides, career roadmaps and salary insights.",
      type: "website",
      schema: [
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Topics", path: "/topics" },
        ]),
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Glintr Topics",
          url: "https://glintr.com/topics",
          description:
            "Pillar topics across AI, technology, engineering, business and career development.",
          hasPart: pillars.map((p) => ({
            "@type": "WebPage",
            name: p.name,
            url: `https://glintr.com/topics/${p.slug}`,
          })),
        },
      ],
    });
  },
  component: TopicsIndex,
});

function TopicsIndex() {
  const groups = listPillarsByCategory();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="border-b border-border bg-gradient-to-b from-primary/5 via-background to-background py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <TopicBreadcrumbs items={[{ name: "Home", href: "/" }, { name: "Topics" }]} />
            <p className="text-label mt-6 mb-3 inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Glintr Topics
            </p>
            <h1 className="text-display max-w-3xl text-gradient-brand">
              Learn AI, technology, engineering and business careers
            </h1>
            <p className="text-subheading mt-4 max-w-2xl">
              A structured knowledge hub with 38 pillar topics and 450+ deep-dive guides — career roadmaps, salary
              insights, learning paths, interview prep and industry trends for 2026.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/programs"
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-gradient-brand px-5 text-sm font-semibold text-primary-foreground shadow-lg hover:-translate-y-0.5 transition-transform"
              >
                <BookOpen className="h-4 w-4" /> Explore programs
              </Link>
              <Link
                to="/find-your-program"
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-card px-5 text-sm font-semibold hover:bg-accent"
              >
                Find your program <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-10">
              {groups.map((g) => (
                <div key={g.category}>
                  <div className="mb-4 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    <h2 className="text-heading">{g.category}</h2>
                    <span className="text-xs text-muted-foreground">({g.items.length})</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {g.items.map((p) => (
                      <Link
                        key={p.slug}
                        to="/topics/$pillar"
                        params={{ pillar: p.slug }}
                        className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50 hover:bg-accent/40"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-foreground group-hover:text-primary">
                              {p.name}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{p.tagline}</div>
                          </div>
                          <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
