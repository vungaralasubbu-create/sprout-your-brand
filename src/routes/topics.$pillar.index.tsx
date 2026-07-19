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
  GraduationCap,
  Rocket,
  Hammer,
  MessageSquare,
  IndianRupee,
  Award,
  Map as MapIcon,
  Newspaper,
  HelpCircle,
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

        {/* Topic Hub — 8 spokes linking to existing content surfaces */}
        <section aria-labelledby="topic-hub" className="border-b border-border bg-card/40">
          <div className="mx-auto max-w-6xl px-4 py-10">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-label flex items-center gap-2"><Compass className="h-4 w-4" /> Topic hub</p>
                <h2 id="topic-hub" className="text-heading mt-1">Everything on {pillar.name}</h2>
              </div>
              <p className="hidden max-w-sm text-xs text-muted-foreground sm:block">
                Nine curated surfaces — courses, internships, projects, career prep and more — pulling from the live catalog.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {[
                { icon: GraduationCap, label: `${pillar.name} Courses`, sub: "Full curriculum & cohorts", href: `/programs/${pillar.slug}` },
                { icon: Rocket, label: `${pillar.name} Internship`, sub: "Hands-on real projects", href: `/programs/${pillar.slug}?track=internship` },
                { icon: Hammer, label: `${pillar.name} Projects`, sub: "Portfolio-ready builds", href: `/programs/${pillar.slug}?tab=projects` },
                { icon: MessageSquare, label: `${pillar.name} Interview Questions`, sub: "Curated Q&A bank", href: `/career-hub/interview?topic=${pillar.slug}` },
                { icon: IndianRupee, label: `${pillar.name} Salary`, sub: "India pay benchmarks", href: `/career-hub/salary?topic=${pillar.slug}` },
                { icon: Award, label: `${pillar.name} Certifications`, sub: "Industry-recognised", href: `/programs/${pillar.slug}?tab=certifications` },
                { icon: MapIcon, label: `${pillar.name} Career Roadmap`, sub: "Beginner → expert path", href: `/career-hub/roadmap?topic=${pillar.slug}` },
                { icon: Newspaper, label: `${pillar.name} Blogs`, sub: "Guides & deep dives", href: `/blog?topic=${pillar.slug}` },
                { icon: HelpCircle, label: `${pillar.name} FAQs`, sub: "Fast answers", href: "#faqs" },
              ].map(({ icon: Icon, label, sub, href }) => (
                <a
                  key={label}
                  href={href}
                  className="group flex flex-col rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-accent/40"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="mt-3 text-sm font-semibold leading-tight text-foreground group-hover:text-primary">
                    {label}
                  </span>
                  <span className="mt-1 text-xs text-muted-foreground">{sub}</span>
                  <ArrowRight className="mt-3 h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                </a>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-[1fr_260px]">
          <article className="min-w-0 space-y-16">
            {/* QuickAnswer / TL;DR — optimized for AI extractive answers */}
            <section
              aria-labelledby="quick-answer"
              itemScope
              itemType="https://schema.org/Question"
              className="rounded-2xl border border-primary/30 bg-primary/5 p-5"
            >
              <h2 id="quick-answer" className="text-label mb-2 flex items-center gap-2" itemProp="name">
                <Sparkles className="h-4 w-4 text-primary" /> What is {pillar.name}?
              </h2>
              <div
                itemProp="acceptedAnswer"
                itemScope
                itemType="https://schema.org/Answer"
              >
                <p className="text-sm leading-relaxed text-foreground" itemProp="text">
                  {pillar.overview}
                </p>
              </div>
              <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">Category</dt>
                  <dd className="mt-0.5 font-semibold">{pillar.category}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Top roles</dt>
                  <dd className="mt-0.5 font-semibold">
                    {pillar.careers.slice(0, 2).map((c: { role: string }) => c.role).join(", ")}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Core skills</dt>
                  <dd className="mt-0.5 font-semibold">
                    {pillar.skills.slice(0, 3).join(", ")}
                  </dd>
                </div>
              </dl>
            </section>

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
