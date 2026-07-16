import * as React from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container } from "@/components/shared/section";
import { Badge } from "@/components/ui/badge";
import {
  getGlossaryEntry,
  listGlossary,
  relatedGlossary,
} from "@/data/glossary";
import { BLOG_TITLES } from "@/data/program-editorial";
import { articles as learnArticles, topics as learnTopics } from "@/data/learn";
import { PeopleAlsoAsk } from "@/components/shared/geo";
import { EntityCard } from "@/components/shared/entity-card";
import { BookmarkToggle } from "@/components/mentor/ai-mentor";
import {
  ChevronLeft,
  Share2,
  Sparkles,
  Wand2,
  BookOpen,
  GitCompareArrows,
  ArrowRight,
} from "lucide-react";

const SITE_URL = "https://glintr.com";

export const Route = createFileRoute("/glossary/$slug")({
  loader: ({ params }) => {
    const entry = getGlossaryEntry(params.slug);
    if (!entry) throw notFound();
    return { entry };
  },
  head: ({ params, loaderData }) => {
    const entry = loaderData?.entry;
    const canonical = `${SITE_URL}/glossary/${params.slug}`;
    const title = entry
      ? `${entry.term} — Definition, Examples & Related Concepts | Glintr Glossary`
      : `Glossary | Glintr`;
    const description = entry?.short ?? "Glintr glossary entry.";
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: canonical },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ];
    const scripts: Array<{ type: string; children: string }> = [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Glossary", item: `${SITE_URL}/glossary` },
            { "@type": "ListItem", position: 3, name: entry?.term ?? params.slug, item: canonical },
          ],
        }),
      },
    ];
    if (entry) {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "DefinedTerm",
          "@id": canonical,
          name: entry.term,
          alternateName: entry.aliases,
          description: entry.overview,
          url: canonical,
          inDefinedTermSet: `${SITE_URL}/glossary`,
        }),
      });
      if (entry.faqs?.length) {
        scripts.push({
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: entry.faqs.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: { "@type": "Answer", text: f.answer },
            })),
          }),
        });
      }
    }
    return { meta, links: [{ rel: "canonical", href: canonical }], scripts };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Section className="py-24">
        <Container className="max-w-2xl text-center">
          <h1 className="font-display font-semibold text-3xl">Term Not Found</h1>
          <p className="mt-3 text-muted-foreground">
            The glossary entry you're looking for doesn't exist yet.
          </p>
          <Link to="/glossary" className="mt-6 inline-flex items-center gap-2 text-primary">
            <ChevronLeft className="size-4" /> Back to Glossary
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
  component: GlossaryDetail,
});

function toTitle(slug: string) {
  return slug.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
}

function useReadingProgress() {
  const [progress, setProgress] = React.useState(0);
  React.useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const height =
        document.documentElement.scrollHeight - window.innerHeight;
      setProgress(height > 0 ? Math.min(100, (scrollTop / height) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return progress;
}

function useRelatedLearn(entryCategory: string, entrySlug: string, slugs?: string[]) {
  return React.useMemo(() => {
    if (slugs?.length) {
      return learnArticles.filter((a) => slugs.includes(a.slug)).slice(0, 4);
    }
    const catKey = entryCategory.toLowerCase().split(" ")[0]!;
    return learnArticles
      .filter((a) => {
        if (a.relatedGlossary?.includes(entrySlug)) return true;
        const topics = a.topics
          .map((t) => learnTopics.find((x) => x.slug === t)?.name.toLowerCase() ?? "")
          .join(" ");
        return (
          a.title.toLowerCase().includes(catKey) ||
          topics.includes(catKey)
        );
      })
      .slice(0, 4);
  }, [entryCategory, entrySlug, slugs]);
}

function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = React.useState(false);
  const onShare = async () => {
    const nav = typeof navigator !== "undefined" ? navigator : null;
    if (nav && "share" in nav) {
      try {
        await nav.share({ title, url });
        return;
      } catch {
        /* user cancelled */
      }
    }
    if (nav?.clipboard) {
      await nav.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };
  return (
    <button
      type="button"
      onClick={onShare}
      className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
      aria-label="Share this glossary entry"
    >
      <Share2 className="size-3.5" />
      {copied ? "Link copied" : "Share"}
    </button>
  );
}

function GlossaryDetail() {
  const { entry } = Route.useLoaderData();
  const related = relatedGlossary(entry);
  const relatedLearn = useRelatedLearn(entry.category, entry.slug, entry.relatedLearn);
  const nextEntry = entry.nextTopic ? getGlossaryEntry(entry.nextTopic) : null;
  const continueList = listGlossary()
    .filter((g) => g.slug !== entry.slug && g.category !== entry.category)
    .slice(0, 6);
  const progress = useReadingProgress();
  const url = `${SITE_URL}/glossary/${entry.slug}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Reading progress */}
      <div
        className="fixed top-0 left-0 z-40 h-0.5 bg-primary transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
        aria-hidden
      />
      <SiteHeader />
      <main>
        <Section className="pt-14 pb-6">
          <Container className="max-w-3xl">
            <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground">Home</Link>
              <span className="mx-2">/</span>
              <Link to="/glossary" className="hover:text-foreground">Glossary</Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">{entry.term}</span>
            </nav>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="muted">{entry.category}</Badge>
              {entry.popular ? <Badge variant="muted">Popular</Badge> : null}
            </div>
            <h1 className="mt-4 font-display font-semibold tracking-[-0.02em] text-balance text-[clamp(2.2rem,4.6vw,3.4rem)] leading-[1.05]">
              {entry.term}
            </h1>
            {entry.aliases?.length ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Also known as: {entry.aliases.join(", ")}
              </p>
            ) : null}

            {/* Quick definition callout */}
            <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6">
              <div className="text-caption font-mono uppercase tracking-widest text-primary mb-2">
                Quick Definition
              </div>
              <p className="text-body-lg text-foreground/90 leading-relaxed">
                {entry.short}
              </p>
            </div>

            {/* Action bar */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <BookmarkToggle
                href={`/glossary/${entry.slug}`}
                label={entry.term}
                kind="glossary"
              />
              <ShareButton title={entry.term} url={url} />
            </div>
          </Container>
        </Section>

        <Section className="py-6">
          <Container className="max-w-3xl">
            <article
              itemScope
              itemType="https://schema.org/DefinedTerm"
              className="space-y-10"
            >
              <section>
                <h2 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">
                  Expanded Explanation
                </h2>
                <p
                  itemProp="description"
                  className="mt-3 text-body md:text-body-lg text-foreground/85 leading-relaxed"
                >
                  {entry.overview}
                </p>
              </section>

              {entry.simple ? (
                <section>
                  <h2 className="font-display font-semibold text-2xl tracking-tight">
                    Simple explanation
                  </h2>
                  <p className="mt-3 text-body md:text-body-lg text-foreground/85 leading-relaxed">
                    {entry.simple}
                  </p>
                </section>
              ) : null}

              {entry.technical ? (
                <section>
                  <h2 className="font-display font-semibold text-2xl tracking-tight">
                    Technical explanation
                  </h2>
                  <p className="mt-3 text-body md:text-body-lg text-foreground/85 leading-relaxed">
                    {entry.technical}
                  </p>
                </section>
              ) : null}

              {entry.examples?.length ? (
                <section>
                  <h2 className="font-display font-semibold text-2xl tracking-tight">
                    Simple Examples
                  </h2>
                  <ul className="mt-3 space-y-2 list-disc pl-5 text-body md:text-body-lg text-foreground/85 leading-relaxed">
                    {entry.examples.map((e: string, i: number) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {entry.applications?.length ? (
                <section>
                  <h2 className="font-display font-semibold text-2xl tracking-tight">
                    Real-world Applications
                  </h2>
                  <div className="mt-4 grid sm:grid-cols-2 gap-3">
                    {entry.applications.map((app, i) => (
                      <div
                        key={i}
                        className="rounded-xl border bg-card p-4 text-sm text-foreground/85 leading-relaxed"
                      >
                        {app}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {entry.advantages?.length || entry.limitations?.length ? (
                <section className="grid md:grid-cols-2 gap-4">
                  {entry.advantages?.length ? (
                    <div className="rounded-2xl border p-5 bg-card">
                      <div className="text-caption font-mono uppercase tracking-widest text-primary mb-3">
                        Advantages
                      </div>
                      <ul className="space-y-2 text-sm text-foreground/85 leading-relaxed list-disc pl-5">
                        {entry.advantages.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {entry.limitations?.length ? (
                    <div className="rounded-2xl border p-5 bg-card">
                      <div className="text-caption font-mono uppercase tracking-widest text-muted-foreground mb-3">
                        Limitations
                      </div>
                      <ul className="space-y-2 text-sm text-foreground/85 leading-relaxed list-disc pl-5">
                        {entry.limitations.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </section>
              ) : null}

              {entry.mistakes?.length ? (
                <section>
                  <h2 className="font-display font-semibold text-2xl tracking-tight">
                    Common mistakes
                  </h2>
                  <ul className="mt-3 space-y-2 list-disc pl-5 text-body md:text-body-lg text-foreground/85 leading-relaxed">
                    {entry.mistakes.map((e: string, i: number) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </article>
          </Container>
        </Section>

        {/* AI Mentor quick actions */}
        <Section className="py-8">
          <Container className="max-w-3xl">
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-6">
              <div className="flex items-center gap-2 text-caption font-mono uppercase tracking-widest text-primary mb-2">
                <Sparkles className="size-3.5" /> Ask Glintr AI Mentor
              </div>
              <h2 className="font-display font-semibold text-xl md:text-2xl tracking-tight">
                Go deeper on {entry.term}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Open the mentor from the floating button in the corner and pick a shortcut:
              </p>
              <div className="mt-4 grid sm:grid-cols-2 gap-2">
                <MentorHint icon={<Wand2 className="size-4" />} label={`Explain ${entry.term} simpler`} />
                <MentorHint icon={<BookOpen className="size-4" />} label={`Give me an example of ${entry.term}`} />
                <MentorHint icon={<GitCompareArrows className="size-4" />} label={`Compare ${entry.term} with related concepts`} />
                <MentorHint icon={<ArrowRight className="size-4" />} label={`Recommend the next topic after ${entry.term}`} />
              </div>
            </div>
          </Container>
        </Section>

        {entry.faqs?.length ? (
          <Section className="py-8">
            <Container className="max-w-3xl">
              <PeopleAlsoAsk items={entry.faqs} />
            </Container>
          </Section>
        ) : null}

        {(related.length || entry.relatedPrograms?.length || relatedLearn.length || entry.relatedBlogs?.length) ? (
          <Section className="py-10">
            <Container className="max-w-3xl space-y-10">
              {related.length ? (
                <section>
                  <div className="text-caption font-mono uppercase tracking-widest text-primary mb-3">
                    Related Concepts
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {related.map((r) => (
                      <EntityCard key={r.slug} entry={r} />
                    ))}
                  </div>
                </section>
              ) : null}

              {entry.relatedPrograms?.length ? (
                <section>
                  <div className="text-caption font-mono uppercase tracking-widest text-primary mb-3">
                    Related Programs
                  </div>
                  <ul className="space-y-2">
                    {entry.relatedPrograms.map((slug: string) => (
                      <li key={slug}>
                        <a href="/programs" className="text-primary hover:underline">
                          {toTitle(slug)} →
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {relatedLearn.length ? (
                <section>
                  <div className="text-caption font-mono uppercase tracking-widest text-primary mb-3">
                    Related Learn Guides
                  </div>
                  <ul className="space-y-2">
                    {relatedLearn.map((a) => (
                      <li key={a.slug}>
                        <Link
                          to="/learn/$slug"
                          params={{ slug: a.slug }}
                          className="text-primary hover:underline"
                        >
                          {a.title} →
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {entry.relatedBlogs?.length ? (
                <section>
                  <div className="text-caption font-mono uppercase tracking-widest text-primary mb-3">
                    Related Articles
                  </div>
                  <ul className="space-y-2">
                    {entry.relatedBlogs.map((slug: string) => (
                      <li key={slug}>
                        <Link
                          to="/blog/$slug"
                          params={{ slug }}
                          className="text-primary hover:underline"
                        >
                          {BLOG_TITLES[slug] ?? toTitle(slug)} →
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </Container>
          </Section>
        ) : null}

        {nextEntry ? (
          <Section className="py-6">
            <Container className="max-w-3xl">
              <Link
                to="/glossary/$slug"
                params={{ slug: nextEntry.slug }}
                className="group flex items-center justify-between rounded-2xl border bg-card p-6 hover:border-primary transition-colors"
              >
                <div>
                  <div className="text-caption font-mono uppercase tracking-widest text-primary mb-1">
                    Next recommended topic
                  </div>
                  <div className="font-display font-semibold text-xl">{nextEntry.term}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{nextEntry.short}</p>
                </div>
                <ArrowRight className="size-5 text-primary group-hover:translate-x-1 transition-transform" />
              </Link>
            </Container>
          </Section>
        ) : null}

        {continueList.length ? (
          <Section className="py-16">
            <Container className="max-w-5xl">
              <div className="text-caption font-mono uppercase tracking-widest text-primary mb-3">
                Continue exploring
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {continueList.map((g) => (
                  <EntityCard key={g.slug} entry={g} />
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

function MentorHint({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm text-foreground/85">
      <span className="text-primary">{icon}</span>
      <span className="truncate">{label}</span>
    </div>
  );
}
