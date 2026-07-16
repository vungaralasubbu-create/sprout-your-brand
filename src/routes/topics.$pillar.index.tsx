import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  ChartBarIncreasing,
  CheckCircle2,
  Clock,
  Compass,
  Layers,
  Sparkles,
  TrendingUp,
  Wrench,
} from "lucide-react";

import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { RelatedTopics } from "@/components/topics/related-topics";
import { TopicBreadcrumbs, TopicMeta } from "@/components/topics/topic-chrome";
import { getPillarWithClusters, listClusters } from "@/data/topics";
import { breadcrumbSchema, buildPageHead } from "@/lib/seo-head";

export const Route = createFileRoute("/topics/$pillar/")({
  loader: ({ params }) => {
    const data = getPillarWithClusters(params.pillar);
    if (!data) throw notFound();
    return data;
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Topic not found — Glintr" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { pillar, clusters } = loaderData;
    const path = `/topics/${params.pillar}`;
    return buildPageHead({
      path,
      title: `${pillar.name} — Complete Guide, Career Roadmap & Salary 2026 | Glintr`,
      description:
        pillar.overview.length <= 158
          ? pillar.overview
          : pillar.overview.slice(0, 155) + "…",
      type: "article",
      schema: [
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Topics", path: "/topics" },
          { name: pillar.name, path },
        ]),
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `${pillar.name} — Complete Guide 2026`,
          description: pillar.overview,
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
          dateModified: "2026-01-15",
          mainEntityOfPage: `https://glintr.com${path}`,
          about: pillar.category,
          keywords: [pillar.name, ...pillar.skills, ...pillar.tools].join(", "),
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: pillar.faqs.map((f: { q: string; a: string }) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        },
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `${pillar.name} learning cluster`,
          itemListElement: clusters.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `https://glintr.com/topics/${pillar.slug}/${c.slug}`,
            name: c.title,
          })),
        },
      ],
    });
  },
  component: PillarPage,
  notFoundComponent: PillarNotFound,
});

function PillarNotFound() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-page-title">Topic not found</h1>
        <p className="text-subheading mt-3">This pillar isn't available. Explore all topics instead.</p>
        <Link
          to="/topics"
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground"
        >
          All topics <ArrowRight className="h-4 w-4" />
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}

function PillarPage() {
  const { pillar, clusters } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="border-b border-border bg-gradient-to-b from-primary/5 via-background to-background py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <TopicBreadcrumbs
              items={[
                { name: "Home", href: "/" },
                { name: "Topics", href: "/topics" },
                { name: pillar.name },
              ]}
            />
            <p className="text-label mt-6 mb-3 inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> {pillar.category}
            </p>
            <h1 className="text-display max-w-3xl text-gradient-brand">{pillar.name}</h1>
            <p className="text-subheading mt-3 max-w-3xl">{pillar.tagline}</p>
            <p className="mt-4 max-w-3xl text-muted-foreground">{pillar.overview}</p>
            <TopicMeta updatedAt="2026-01-15" readingMinutes={12} difficulty="Beginner → Advanced" category={pillar.category} />
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

        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-[1fr_260px]">
          <article className="min-w-0 space-y-16">
            {/* Overview */}
            {pillar.body && (
              <section>
                <h2 id="overview" className="text-heading mb-3">Overview</h2>
                <p className="text-muted-foreground">{pillar.body}</p>
              </section>
            )}

            {/* Applications */}
            <section>
              <h2 id="applications" className="text-heading mb-4 flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" /> Industry applications
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {pillar.applications.map((a: string) => (
                  <div key={a} className="flex items-start gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Careers */}
            <section>
              <h2 id="careers" className="text-heading mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" /> Career opportunities & salary
              </h2>
              <div className="overflow-hidden rounded-2xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Salary (India)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pillar.careers.map((c: { role: string; salaryInr: string }) => (
                      <tr key={c.role} className="border-t border-border">
                        <td className="px-4 py-3 font-medium">{c.role}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.salaryInr}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Skills */}
            <section>
              <h2 id="skills" className="text-heading mb-4">Skills roadmap</h2>
              <div className="flex flex-wrap gap-2">
                {pillar.skills.map((s: string) => (
                  <span key={s} className="rounded-full border border-border bg-card px-3 py-1 text-xs">{s}</span>
                ))}
              </div>
            </section>

            {/* Learning roadmap */}
            <section>
              <h2 id="roadmap" className="text-heading mb-4 flex items-center gap-2">
                <Compass className="h-5 w-5 text-primary" /> Learning roadmap
              </h2>
              <ol className="space-y-4">
                {pillar.roadmap.map((r: { phase: string; weeks?: string; items: string[] }, i: number) => (
                  <li key={r.phase} className="rounded-2xl border border-border bg-card p-5">
                    <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-primary">Phase {i + 1}</span>
                      {r.weeks && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> Weeks {r.weeks}</span>}
                    </div>
                    <div className="text-base font-semibold">{r.phase}</div>
                    <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                      {r.items.map((it: string) => (
                        <li key={it} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-primary" /> {it}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </section>

            {/* Trends */}
            <section>
              <h2 id="trends" className="text-heading mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" /> Latest trends (2026)
              </h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {pillar.trends.map((t: string) => (
                  <li key={t} className="flex items-start gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm">
                    <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Tools */}
            <section>
              <h2 id="tools" className="text-heading mb-4 flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" /> Tools used
              </h2>
              <div className="flex flex-wrap gap-2">
                {pillar.tools.map((t: string) => (
                  <span key={t} className="rounded-full border border-border bg-card px-3 py-1 text-xs">{t}</span>
                ))}
              </div>
            </section>

            {/* Cluster grid */}
            <section>
              <h2 id="deep-dives" className="text-heading mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" /> Deep dives
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">
                {clusters.length} in-depth {pillar.name} guides — from beginner concepts to career and interview prep.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {clusters.map((c: any) => (
                  <Link
                    key={c.slug}
                    to="/topics/$pillar/$cluster"
                    params={{ pillar: pillar.slug, cluster: c.slug }}
                    className="group rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-foreground group-hover:text-primary">{c.title}</div>
                        <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{c.description}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      {c.difficulty && <span className="rounded-full border border-border px-2 py-0.5">{c.difficulty}</span>}
                      {typeof c.readingMinutes === "number" && (
                        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {c.readingMinutes} min</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* FAQs */}
            <section>
              <h2 id="faqs" className="text-heading mb-4">Frequently asked questions</h2>
              <div className="divide-y divide-border rounded-2xl border border-border bg-card">
                {pillar.faqs.map((f: { q: string; a: string }) => (
                  <details key={f.q} className="group px-5 py-4">
                    <summary className="cursor-pointer list-none text-sm font-semibold marker:hidden">
                      {f.q}
                    </summary>
                    <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          </article>

          {/* TOC sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-border bg-card p-5">
              <p className="text-label mb-3">On this page</p>
              <ul className="space-y-2 text-sm">
                {[
                  ["overview", "Overview"],
                  ["applications", "Applications"],
                  ["careers", "Careers & salary"],
                  ["skills", "Skills"],
                  ["roadmap", "Learning roadmap"],
                  ["trends", "Trends 2026"],
                  ["tools", "Tools"],
                  ["deep-dives", "Deep dives"],
                  ["faqs", "FAQs"],
                ].map(([id, label]) => (
                  <li key={id}>
                    <a href={`#${id}`} className="text-muted-foreground hover:text-foreground">{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        <RelatedTopics currentPillarSlug={pillar.slug} context="pillar" />
      </main>
      <SiteFooter />
    </div>
  );
}
