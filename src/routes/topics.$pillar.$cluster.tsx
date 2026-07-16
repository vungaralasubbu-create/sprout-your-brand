import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, BookOpen, ChevronRight, Clock } from "lucide-react";

import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { RelatedTopics } from "@/components/topics/related-topics";
import { TopicBreadcrumbs, TopicMeta } from "@/components/topics/topic-chrome";
import { getCluster, getPillar, listClusters } from "@/data/topics";
import { breadcrumbSchema, buildPageHead } from "@/lib/seo-head";

export const Route = createFileRoute("/topics/$pillar/$cluster")({
  loader: ({ params }) => {
    const pillar = getPillar(params.pillar);
    const cluster = getCluster(params.pillar, params.cluster);
    if (!pillar || !cluster) throw notFound();
    const siblings = listClusters(params.pillar).filter((c) => c.slug !== cluster.slug);
    return { pillar, cluster, siblings };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Guide not found — Glintr" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { pillar, cluster } = loaderData;
    const path = `/topics/${params.pillar}/${params.cluster}`;
    return buildPageHead({
      path,
      title: `${cluster.title} | Glintr`,
      description: cluster.description,
      type: "article",
      schema: [
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Topics", path: "/topics" },
          { name: pillar.name, path: `/topics/${pillar.slug}` },
          { name: cluster.title.split(":")[0], path },
        ]),
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: cluster.title,
          description: cluster.description,
          author: { "@type": "Organization", name: "Glintr" },
          publisher: {
            "@type": "Organization",
            name: "Glintr",
            logo: {
              "@type": "ImageObject",
              url: "https://glintr.com/__l5e/assets-v1/d12f985f-d4a9-44a8-ae66-6ea6d0a3b725/glintr-mark.png",
            },
          },
          datePublished: "2026-01-15",
          dateModified: cluster.updatedAt,
          mainEntityOfPage: `https://glintr.com${path}`,
          articleSection: pillar.name,
          keywords: [pillar.name, ...pillar.skills.slice(0, 5)].join(", "),
          about: {
            "@type": "Thing",
            name: pillar.name,
            url: `https://glintr.com/topics/${pillar.slug}`,
          },
          wordCount: (cluster.readingMinutes ?? 8) * 220,
          timeRequired: `PT${cluster.readingMinutes ?? 8}M`,
        },
        ...(cluster.faqs && cluster.faqs.length
          ? [
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: cluster.faqs.map((f) => ({
                  "@type": "Question",
                  name: f.q,
                  acceptedAnswer: { "@type": "Answer", text: f.a },
                })),
              },
            ]
          : []),
      ],
    });
  },
  component: ClusterPage,
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-page-title">Guide not found</h1>
        <p className="text-subheading mt-3">This guide isn't available. Explore all topics instead.</p>
        <Link to="/topics" className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground">
          All topics <ArrowRight className="h-4 w-4" />
        </Link>
      </main>
      <SiteFooter />
    </div>
  ),
});

function ClusterPage() {
  const { pillar, cluster, siblings } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="border-b border-border bg-gradient-to-b from-primary/5 via-background to-background py-14">
          <div className="mx-auto max-w-6xl px-4">
            <TopicBreadcrumbs
              items={[
                { name: "Home", href: "/" },
                { name: "Topics", href: "/topics" },
                { name: pillar.name, href: `/topics/${pillar.slug}` },
                { name: cluster.title.split(":")[0] },
              ]}
            />
            <p className="text-label mt-6 mb-3">{pillar.name}</p>
            <h1 className="text-page-title max-w-3xl">{cluster.title}</h1>
            <p className="text-subheading mt-3 max-w-3xl">{cluster.intro}</p>
            <TopicMeta
              updatedAt={cluster.updatedAt}
              readingMinutes={cluster.readingMinutes}
              difficulty={cluster.difficulty}
              category={pillar.category}
            />
          </div>
        </section>

        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 lg:grid-cols-[1fr_260px]">
          <article className="min-w-0 space-y-10">
            {cluster.sections.map((s, i) => (
              <section key={i}>
                <h2 className="text-heading mb-3">{s.heading}</h2>
                {s.body && <p className="text-muted-foreground">{s.body}</p>}
                {s.bullets && s.bullets.length > 0 && (
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {s.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm">
                        <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            {cluster.faqs && cluster.faqs.length > 0 && (
              <section>
                <h2 className="text-heading mb-4">FAQs</h2>
                <div className="divide-y divide-border rounded-2xl border border-border bg-card">
                  {cluster.faqs.map((f) => (
                    <details key={f.q} className="px-5 py-4">
                      <summary className="cursor-pointer list-none text-sm font-semibold marker:hidden">{f.q}</summary>
                      <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {/* Auto-links back to pillar and siblings */}
            <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
              <p className="text-label mb-2">Continue reading</p>
              <h2 className="text-heading mb-3">More on {pillar.name}</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                <Link
                  to="/topics/$pillar"
                  params={{ pillar: pillar.slug }}
                  className="group rounded-lg border border-border bg-background px-4 py-3 text-sm hover:border-primary/50"
                >
                  <div className="font-semibold group-hover:text-primary">
                    {pillar.name} — complete pillar guide
                  </div>
                  <div className="text-xs text-muted-foreground">The full overview, roadmap and career map.</div>
                </Link>
                {siblings.slice(0, 5).map((c) => (
                  <Link
                    key={c.slug}
                    to="/topics/$pillar/$cluster"
                    params={{ pillar: pillar.slug, cluster: c.slug }}
                    className="group rounded-lg border border-border bg-background px-4 py-3 text-sm hover:border-primary/50"
                  >
                    <div className="font-semibold group-hover:text-primary line-clamp-1">{c.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{c.description}</div>
                  </Link>
                ))}
              </div>
            </section>
          </article>

          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-label mb-3 flex items-center gap-2"><BookOpen className="h-4 w-4" /> In this pillar</p>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link
                      to="/topics/$pillar"
                      params={{ pillar: pillar.slug }}
                      className="font-semibold text-foreground hover:text-primary"
                    >
                      {pillar.name} pillar
                    </Link>
                  </li>
                  {siblings.slice(0, 8).map((c) => (
                    <li key={c.slug}>
                      <Link
                        to="/topics/$pillar/$cluster"
                        params={{ pillar: pillar.slug, cluster: c.slug }}
                        className="text-muted-foreground hover:text-foreground line-clamp-2"
                      >
                        {c.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-label mb-2 flex items-center gap-2"><Clock className="h-4 w-4" /> Learn faster</p>
                <p className="mb-3 text-xs text-muted-foreground">Structured program with mentors, projects and placement support.</p>
                <Link
                  to="/find-your-program"
                  className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                >
                  Find your program <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </aside>
        </div>

        <RelatedTopics currentPillarSlug={pillar.slug} currentClusterSlug={cluster.slug} context="cluster" />
      </main>
      <SiteFooter />
    </div>
  );
}
