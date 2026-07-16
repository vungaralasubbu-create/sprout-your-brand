import * as React from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, Clock, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { buildPageHead, SITE_ORIGIN } from "@/lib/seo-head";
import {
  ArticleMarkdown,
  extractHeadings,
  type Heading,
} from "@/components/shared/article-markdown";
import { KeyTakeaways, PeopleAlsoAsk, QuickAnswer } from "@/components/shared/geo";
import { LearnToc, LearnReadingProgress } from "@/components/learn/learn-toc";
import {
  articles,
  getArticle,
  getCollection,
  getTopic,
} from "@/data/learn";
import {
  getLearnBookmarks,
  toggleLearnBookmark,
  trackLearnRecent,
} from "@/components/learn/learn-shell";

export const Route = createFileRoute("/learn/$slug")({
  head: ({ params }) => {
    const a = articles.find((x) => x.slug === params.slug);
    if (!a) {
      return buildPageHead({
        path: `/learn/${params.slug}`,
        title: "Guide not found | Glintr Learn",
        description: "This Glintr Learn guide could not be found.",
        noindex: true,
      });
    }
    return buildPageHead({
      path: `/learn/${a.slug}`,
      title: `${a.title} | Glintr Learn`,
      description: a.quickAnswer,
      type: "article",
      schema: [
        {
          "@context": "https://schema.org",
          "@type": "TechArticle",
          headline: a.title,
          description: a.quickAnswer,
          datePublished: a.updated,
          dateModified: a.updated,
          author: { "@type": "Organization", name: "Glintr" },
          publisher: { "@type": "Organization", name: "Glintr" },
          mainEntityOfPage: `${SITE_ORIGIN}/learn/${a.slug}`,
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: a.faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_ORIGIN },
            { "@type": "ListItem", position: 2, name: "Learn", item: `${SITE_ORIGIN}/learn` },
            {
              "@type": "ListItem",
              position: 3,
              name: a.title,
              item: `${SITE_ORIGIN}/learn/${a.slug}`,
            },
          ],
        },
      ],
    });
  },
  component: LearnArticlePage,
});

function LearnArticlePage() {
  const { slug } = Route.useParams();
  const article = getArticle(slug);
  if (!article) throw notFound();

  const [bookmarked, setBookmarked] = React.useState(false);
  const articleRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    trackLearnRecent(slug);
    setBookmarked(getLearnBookmarks().includes(slug));
  }, [slug]);

  const headings: Heading[] = React.useMemo(
    () => extractHeadings(article.content),
    [article.content],
  );

  const collection = getCollection(article.collection);
  const related = articles
    .filter((a) => a.slug !== slug && a.collection === article.collection)
    .slice(0, 4);
  const next = article.nextRecommended ? getArticle(article.nextRecommended) : null;

  return (
    <>
      <LearnReadingProgress target={articleRef as React.RefObject<HTMLElement>} />
      <article
        ref={(el) => {
          articleRef.current = el;
        }}
        className="mx-auto grid max-w-[1200px] grid-cols-1 gap-12 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_240px] lg:px-10 lg:py-16"
      >
        <div className="min-w-0">
          {/* breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted-foreground">
            <Link to="/learn" className="hover:text-foreground">
              Learn
            </Link>
            <span className="mx-2">/</span>
            {collection ? (
              <>
                <Link
                  to="/learn/collections/$slug"
                  params={{ slug: collection.slug }}
                  className="hover:text-foreground"
                >
                  {collection.name}
                </Link>
                <span className="mx-2">/</span>
              </>
            ) : null}
            <span className="text-foreground/80">{article.title}</span>
          </nav>

          {/* header */}
          <header className="mb-10">
            <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <Badge variant="muted" className="rounded-full uppercase tracking-wider">
                {article.level}
              </Badge>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" />
                {article.readingMinutes} min read
              </span>
              <span>Updated {formatDate(article.updated)}</span>
              <span>By {article.author}</span>
            </div>
            <h1 className="text-balance text-4xl font-black tracking-tight md:text-5xl">
              {article.title}
            </h1>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">{article.subtitle}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                variant={bookmarked ? "primary" : "outline"}
                size="sm"
                onClick={() => {
                  const list = toggleLearnBookmark(slug);
                  setBookmarked(list.includes(slug));
                }}
              >
                {bookmarked ? (
                  <>
                    <BookmarkCheck className="mr-2 size-4" /> Bookmarked
                  </>
                ) : (
                  <>
                    <Bookmark className="mr-2 size-4" /> Bookmark
                  </>
                )}
              </Button>
              {article.topics.map((t) => {
                const topic = getTopic(t);
                if (!topic) return null;
                return (
                  <Link
                    key={t}
                    to="/learn/topics"
                    hash={t}
                    className="inline-flex items-center rounded-full border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {topic.name}
                  </Link>
                );
              })}
            </div>
          </header>

          {/* Quick answer */}
          <QuickAnswer
            term={article.title}
            question={`What is ${article.title.replace(/^Complete |^Ultimate /, "").replace(/ Guide$/, "")}?`}
            answer={article.quickAnswer}
            className="mb-10"
          />

          {/* Mobile TOC */}
          <details className="mb-8 rounded-2xl border bg-surface p-4 lg:hidden">
            <summary className="cursor-pointer text-sm font-semibold">Table of contents</summary>
            <div className="mt-3">
              <LearnToc headings={headings} />
            </div>
          </details>

          {/* Body */}
          <div className="prose-learn">
            <ArticleMarkdown markdown={article.content} />
          </div>

          {/* Key takeaways */}
          <KeyTakeaways items={article.keyTakeaways} className="mt-12" />

          {/* AI mentor */}
          <AiMentorCard title={article.title} />

          {/* FAQ */}
          <PeopleAlsoAsk
            items={article.faq.map((f) => ({ question: f.q, answer: f.a }))}
            className="mt-12"
          />

          {/* Related */}
          <RelatedBlock related={related} next={next ?? undefined} article={article} />

          <div className="mt-16 flex items-center justify-between border-t pt-8">
            <Button asChild variant="ghost" size="sm">
              <Link to="/learn">
                <ArrowLeft className="mr-2 size-4" /> All Learn
              </Link>
            </Button>
            {next ? (
              <Button asChild size="sm">
                <Link to="/learn/$slug" params={{ slug: next.slug }}>
                  Next: {next.title} <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            ) : null}
          </div>
        </div>

        {/* Sticky TOC (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-40">
            <LearnToc headings={headings} />
          </div>
        </aside>
      </article>
    </>
  );
}

function AiMentorCard({ title }: { title: string }) {
  return (
    <div className="mt-12 rounded-2xl border bg-gradient-to-br from-primary/8 via-background to-background p-6">
      <div className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
        <Sparkles className="size-3.5" /> Ask Glintr AI
      </div>
      <p className="text-sm text-muted-foreground">
        The Glintr AI Mentor is aware of this page. Ask it to explain a concept, summarise this guide, or recommend what to learn next.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {[
          `Explain the core idea of "${title}" in simple language`,
          "Summarise this page in 5 bullets",
          "What should I learn next?",
        ].map((q) => (
          <span
            key={q}
            className="inline-flex items-center rounded-full border bg-background/70 px-3 py-1 text-xs text-foreground/80"
          >
            {q}
          </span>
        ))}
      </div>
    </div>
  );
}

function RelatedBlock({
  related,
  next,
  article,
}: {
  related: ReturnType<typeof getArticle>[];
  next?: ReturnType<typeof getArticle>;
  article: NonNullable<ReturnType<typeof getArticle>>;
}) {
  return (
    <section className="mt-16 border-t pt-10">
      <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Related on Glintr
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {related.map((r) =>
          r ? (
            <Link
              key={r.slug}
              to="/learn/$slug"
              params={{ slug: r.slug }}
              className="group rounded-2xl border bg-background p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                {r.level}
              </p>
              <p className="mt-1 font-bold group-hover:underline">{r.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.subtitle}</p>
            </Link>
          ) : null,
        )}
      </div>

      {article.relatedPrograms?.length ? (
        <div className="mt-6 rounded-2xl border bg-surface p-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Related programs
          </p>
          <div className="flex flex-wrap gap-2">
            {article.relatedPrograms.map((p) => (
              <a
                key={`${p.category}-${p.course}`}
                href={`/programs/${p.category}/${p.course}`}
                className="inline-flex items-center gap-1 rounded-full border bg-background px-3 py-1 text-xs hover:border-primary/40 hover:text-primary"
              >
                {p.course.replace(/-/g, " ")}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {article.relatedGlossary?.length ? (
        <div className="mt-4 rounded-2xl border bg-surface p-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Glossary
          </p>
          <div className="flex flex-wrap gap-2">
            {article.relatedGlossary.map((g) => (
              <a
                key={g}
                href={`/glossary/${g}`}
                className="inline-flex items-center gap-1 rounded-full border bg-background px-3 py-1 text-xs hover:border-primary/40 hover:text-primary"
              >
                {g.replace(/-/g, " ")}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
