import * as React from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  Clock,
  Download,
  GraduationCap,
  List,
  MessageSquare,
  Printer,
  Sparkles,
} from "lucide-react";

import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  getPostBySlug,
  listRelatedPosts,
  formatPublished,
  type BlogPost,
} from "@/lib/blog";
import { getCourseBySlug } from "@/lib/programs";
import {
  ArticleMarkdown,
  extractHeadings,
  type Heading,
} from "@/components/shared/article-markdown";
import { PageWorkspaceActions } from "@/components/workspace/page-workspace-actions";
import { BlogCover } from "@/components/shared/blog-cover";
import { useBookmark } from "@/components/shared/blog-card";
import { ShareBar } from "@/components/blog/share-bar";
import { AiAssistantFab } from "@/components/blog/ai-assistant-fab";
import { ReadingMilestones } from "@/components/blog/reading-milestones";


const SITE_URL = "https://glintr.com";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = await getPostBySlug(params.slug);
    if (!post) throw notFound();
    const [related, course] = await Promise.all([
      listRelatedPosts(post, 6),
      post.related_course_slug && post.related_course_category_slug
        ? getCourseBySlug(post.related_course_category_slug, post.related_course_slug)
        : Promise.resolve(null),
    ]);
    const relatedCourse = course
      ? {
          slug: course.slug,
          category_slug: course.category.slug,
          name: course.name,
          category_name: course.category.name,
          short_description: course.short_description,
        }
      : null;
    return { post, related, relatedCourse };
  },
  head: ({ params, loaderData }) => {
    const post = loaderData?.post ?? null;
    const canonical = `${SITE_URL}/blog/${params.slug}`;
    const title = post?.seo_title ?? (post ? `${post.title} | Glintr Insights` : `${toTitleGuess(params.slug)} | Glintr Insights`);
    const description =
      post?.seo_description ??
      post?.short_summary ??
      "Ideas, skills and perspectives from Glintr — technology, AI, engineering and modern learning.";
    const image =
      post?.social_image_url ??
      post?.hero_image_url ??
      post?.featured_image_url ??
      post?.thumbnail_url ??
      undefined;
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: canonical },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ];
    if (image) {
      meta.push({ property: "og:image", content: image });
      meta.push({ name: "twitter:image", content: image });
    }
    if (post?.published_at) meta.push({ property: "article:published_time", content: post.published_at });
    if (post?.editorial_updated_at) meta.push({ property: "article:modified_time", content: post.editorial_updated_at });

    const scripts: Array<{ type: string; children: string }> = [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
            { "@type": "ListItem", position: 3, name: post?.title ?? toTitleGuess(params.slug), item: canonical },
          ],
        }),
      },
    ];
    if (post) {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.short_summary,
          ...(image ? { image } : {}),
          datePublished: post.published_at ?? undefined,
          dateModified: post.editorial_updated_at ?? post.published_at ?? undefined,
          author: { "@type": "Person", name: post.author_display_name },
          ...(post.reviewer_display_name
            ? { reviewedBy: { "@type": "Person", name: post.reviewer_display_name } }
            : {}),
          publisher: {
            "@type": "Organization",
            name: "Glintr",
            logo: { "@type": "ImageObject", url: `${SITE_URL}/__l5e/assets-v1/d12f985f-d4a9-44a8-ae66-6ea6d0a3b725/glintr-mark.png` },
          },
          mainEntityOfPage: canonical,
          url: canonical,
        }),
      });
      if (Array.isArray(post.faqs) && post.faqs.length > 0) {
        scripts.push({
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: post.faqs.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: { "@type": "Answer", text: f.answer },
            })),
          }),
        });
      }
    }
    return {
      meta,
      links: [{ rel: "canonical", href: canonical }],
      scripts,
    };
  },
  component: BlogDetailPage,
  notFoundComponent: BlogNotFound,
  errorComponent: () => <BlogDetailError />,
});

function toTitleGuess(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function MetaBlock({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string | null;
}) {
  return (
    <div className="rounded-xl border bg-card/40 px-3.5 py-2.5">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-foreground line-clamp-1">{value}</div>
      {sub ? <div className="text-xs text-muted-foreground line-clamp-1">{sub}</div> : null}
    </div>
  );
}


function BlogDetailPage() {
  const { slug } = Route.useParams();
  const loaderData = Route.useLoaderData() as {
    post: BlogPost;
    related: BlogPost[];
    relatedCourse: {
      slug: string;
      category_slug: string;
      name: string;
      category_name: string;
      short_description: string | null;
    } | null;
  };
  const { post, related, relatedCourse } = loaderData;
  const [progress, setProgress] = React.useState(0);
  const [copied, setCopied] = React.useState(false);
  const [subscribed, setSubscribed] = React.useState(false);
  const [copyFailed, setCopyFailed] = React.useState(false);
  const [tocOpen, setTocOpen] = React.useState(false);
  const [activeHeading, setActiveHeading] = React.useState<string | null>(null);
  const articleRef = React.useRef<HTMLDivElement | null>(null);

  // Reset transient UI state on slug change so switching articles feels fresh.
  React.useEffect(() => {
    setProgress(0);
    setActiveHeading(null);
    setTocOpen(false);
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }, [slug]);

  // reading progress
  React.useEffect(() => {
    const onScroll = () => {
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      setProgress(Math.min(100, (scrolled / Math.max(total, 1)) * 100));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [post.id]);

  const headings: Heading[] = React.useMemo(
    () => extractHeadings(post.content_markdown),
    [post],
  );

  // active heading tracking
  React.useEffect(() => {
    if (!headings.length) return;
    if (typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) {
          setActiveHeading((visible[0].target as HTMLElement).id);
        }
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [headings]);

  async function onShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({ title: post?.title, text: post?.short_summary, url });
        return;
      } catch {
        // fall through to copy
      }
    }
    await copyLink();
  }

  async function copyLink() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setCopyFailed(false);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 2500);
    }
  }

  // post is guaranteed by the loader (throws notFound on miss).



  const showToc = headings.length >= 2;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Reading progress */}
      <div className="sticky top-16 z-30 h-1 bg-transparent" aria-hidden>
        <div
          className="h-full bg-gradient-brand transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* HERO */}
      <Section tone="surface" padding="lg">
        <Container size="md">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-5">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
              </li>
              <li aria-hidden><ChevronRight className="size-3" /></li>
              <li>
                <Link to="/blog" className="hover:text-foreground transition-colors">Insights</Link>
              </li>
              {post.topic ? (
                <>
                  <li aria-hidden><ChevronRight className="size-3" /></li>
                  <li>
                    <Link
                      to="/blog"
                      search={{ topic: post.topic.slug }}
                      className="hover:text-foreground transition-colors"
                    >
                      {post.topic.name}
                    </Link>
                  </li>
                </>
              ) : null}
              <li aria-hidden><ChevronRight className="size-3" /></li>
              <li className="text-foreground/80 line-clamp-1 max-w-[60ch]">
                {post.title}
              </li>
            </ol>
          </nav>

          <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2">
            <Link to="/blog">
              <ArrowLeft className="size-4 mr-2" />
              Back To Insights
            </Link>
          </Button>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {post.topic ? (
                <Badge variant="primary" className="uppercase tracking-wider">
                  {post.topic.name}
                </Badge>
              ) : null}
              {post.skill_level ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  <GraduationCap className="size-3.5" /> {post.skill_level}
                </span>
              ) : null}
            </div>
            <h1 className="text-hero text-balance">{post.title}</h1>
            {post.subtitle ? (
              <p className="text-subheading text-muted-foreground text-pretty">{post.subtitle}</p>
            ) : null}
            <p className="text-body text-muted-foreground">{post.short_summary}</p>

            {/* Meta strip */}
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-caption">
              <MetaBlock label="Written By" value={post.author_display_name} sub={post.author_display_role} />
              {post.reviewer_display_name ? (
                <MetaBlock
                  label="Reviewed By"
                  value={post.reviewer_display_name}
                  sub={post.reviewer_display_role}
                />
              ) : null}
              <MetaBlock
                label="Published"
                value={formatPublished(post.published_at) || "—"}
                sub={
                  post.editorial_updated_at &&
                  post.published_at &&
                  new Date(post.editorial_updated_at).getTime() >
                    new Date(post.published_at).getTime() + 24 * 3600 * 1000
                    ? `Updated ${formatPublished(post.editorial_updated_at)}`
                    : null
                }
              />
              {post.reading_time_minutes ? (
                <MetaBlock
                  label="Reading Time"
                  value={`${post.reading_time_minutes} min read`}
                  sub={null}
                />
              ) : null}
            </div>
          </div>
        </Container>
      </Section>

      {/* FEATURED VISUAL — always render (image or generated cover) */}
      <Section padding="none" className="py-6 md:py-10">
        <Container size="md">
          <div className="relative rounded-3xl overflow-hidden border aspect-[16/9]">
            <BlogCover post={post} variant="hero" eager />
          </div>
        </Container>
      </Section>

      {/* BODY */}
      <Section padding="lg">
        <Container size="lg">
          <div className={cn("grid gap-10", showToc ? "lg:grid-cols-[220px_minmax(0,1fr)]" : "")}>
            {showToc ? (
              <aside className="hidden lg:block">
                <div className="sticky top-28">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                    In This Article
                  </div>
                  <nav aria-label="Article contents">
                    <ol className="space-y-1.5 text-sm">
                      {headings.map((h) => (
                        <li key={h.id} className={cn(h.level === 3 && "pl-3")}>
                          <a
                            href={`#${h.id}`}
                            className={cn(
                              "block py-1 border-l-2 pl-3 transition-colors",
                              activeHeading === h.id
                                ? "border-primary text-foreground font-medium"
                                : "border-transparent text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {h.text}
                          </a>
                        </li>
                      ))}
                    </ol>
                  </nav>
                </div>
              </aside>
            ) : null}

            <div>
              {showToc ? (
                <details className="lg:hidden mb-6 rounded-2xl border bg-card">
                  <summary
                    className="flex items-center justify-between p-4 cursor-pointer list-none"
                    onClick={() => setTocOpen((o) => !o)}
                  >
                    <span className="text-sm font-medium inline-flex items-center gap-2">
                      <List className="size-4" /> In This Article
                    </span>
                    <ArrowRight
                      className={cn("size-4 transition-transform", tocOpen && "rotate-90")}
                    />
                  </summary>
                  <ol className="px-4 pb-4 space-y-1.5 text-sm">
                    {headings.map((h) => (
                      <li key={h.id} className={cn(h.level === 3 && "pl-3")}>
                        <a href={`#${h.id}`} className="text-muted-foreground hover:text-foreground">
                          {h.text}
                        </a>
                      </li>
                    ))}
                  </ol>
                </details>
              ) : null}

              <div ref={articleRef}>
                {post.short_summary ? (
                  <aside
                    aria-label="TL;DR — Quick summary"
                    className="mb-8 rounded-2xl border bg-surface-1/60 p-5 md:p-6"
                  >
                    <div className="text-caption font-mono uppercase tracking-widest text-primary mb-2">
                      TL;DR
                    </div>
                    <p className="text-body text-foreground/85 leading-relaxed">
                      {post.short_summary}
                    </p>
                  </aside>
                ) : null}
                {post.intro ? (
                  <p className="text-xl md:text-2xl font-display text-foreground/90 leading-relaxed mb-8">
                    {post.intro}
                  </p>
                ) : null}
                <ArticleMarkdown markdown={post.content_markdown} />
              </div>

              {/* Workspace: summarize, flashcards, highlights */}
              <PageWorkspaceActions
                className="mt-12"
                title={post.title}
                source={post.content_markdown}
                kind="blog"
              />

              {/* SHARE */}
              <div className="mt-14 rounded-2xl border bg-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold">Share Insight</div>
                  <div className="text-xs text-muted-foreground">
                    {copied
                      ? "Link Copied"
                      : copyFailed
                        ? "Copy failed. Please copy the address manually."
                        : "Copy this insight or share via your device."}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={copyLink}>
                    {copied ? (
                      <>
                        <Check className="size-4 mr-1.5" /> Link Copied
                      </>
                    ) : (
                      <>
                        <Copy className="size-4 mr-1.5" /> Copy Link
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={onShare}>
                    <Share2 className="size-4 mr-1.5" /> Share
                  </Button>
                </div>
              </div>

              {/* AUTHOR */}
              <div className="mt-8 rounded-2xl border bg-card p-6">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Written By</div>
                <div className="mt-2 flex items-start gap-4">
                  <div className="size-12 rounded-full bg-gradient-brand shrink-0" aria-hidden />
                  <div>
                    <div className="font-semibold">{post.author_display_name}</div>
                    {post.author_display_role ? (
                      <div className="text-sm text-muted-foreground">{post.author_display_role}</div>
                    ) : null}
                    {post.author_bio ? (
                      <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{post.author_bio}</p>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* RELATED PROGRAM */}
              {relatedCourse ? (
                <div className="mt-8 rounded-3xl border bg-card p-6 md:p-8">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">
                    Explore The Related Program
                  </div>
                  <h3 className="font-display text-2xl font-semibold mt-2">{relatedCourse.name}</h3>
                  <div className="text-sm text-muted-foreground mt-1">{relatedCourse.category_name}</div>
                  {relatedCourse.short_description ? (
                    <p className="text-body text-muted-foreground mt-3">
                      {relatedCourse.short_description}
                    </p>
                  ) : null}
                  <div className="mt-5">
                    <Button asChild>
                      <Link
                        to="/programs/$categorySlug/$courseSlug"
                        params={{ categorySlug: relatedCourse.category_slug, courseSlug: relatedCourse.slug }}
                      >
                        Explore Program <ArrowRight className="ml-2 size-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      {Array.isArray(post.faqs) && post.faqs.length > 0 ? (
        <Section padding="lg" tone="surface">
          <Container size="md">
            <div className="mb-8">
              <div className="text-xs uppercase tracking-widest text-primary">Frequently Asked</div>
              <h2 className="text-section mt-2">Questions About This Topic</h2>
            </div>
            <div className="divide-y rounded-2xl border bg-card">
              {post.faqs.map((faq, i) => (
                <details key={i} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 md:p-6">
                    <span className="font-medium text-foreground">{faq.question}</span>
                    <ChevronRight className="size-4 shrink-0 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="px-5 md:px-6 pb-6 text-body text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {/* NEWSLETTER */}
      <Section padding="lg">
        <Container size="md">
          <div className="relative overflow-hidden rounded-3xl border bg-gradient-brand-soft p-8 md:p-12">
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-primary">
                  <Sparkles className="size-3.5" /> The Glintr Dispatch
                </div>
                <h2 className="mt-3 text-section">Insights Like This, Weekly.</h2>
                <p className="mt-2 text-body text-muted-foreground">
                  Get one carefully edited briefing every week — no spam, unsubscribe anytime.
                </p>
              </div>
              <form
                className="flex w-full max-w-md flex-col gap-2 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  const email = new FormData(e.currentTarget).get("email");
                  if (typeof email === "string" && email.includes("@")) {
                    (e.currentTarget as HTMLFormElement).reset();
                    setSubscribed(true);
                  }
                }}
              >
                <Input
                  type="email"
                  name="email"
                  required
                  placeholder="you@work.com"
                  aria-label="Email address"
                  className="flex-1"
                />
                <Button type="submit" size="lg">
                  {subscribed ? "Subscribed" : "Subscribe"}
                </Button>
              </form>
            </div>
          </div>
        </Container>
      </Section>

      {/* COMMENTS PLACEHOLDER */}
      <Section padding="lg" tone="surface">
        <Container size="md">
          <div className="rounded-2xl border bg-card p-6 md:p-8 text-center">
            <MessageSquare className="mx-auto size-6 text-muted-foreground" />
            <h2 className="mt-3 font-display text-xl font-semibold">Join The Conversation</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Comments open soon. In the meantime, share your thoughts with our editors.
            </p>
            <div className="mt-4">
              <Button variant="outline" asChild>
                <Link to="/contact">Reach The Editors</Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>


      {/* RELATED ARTICLES */}
      {related.length > 0 ? (
        <Section tone="surface" padding="lg">
          <Container>
            <h2 className="text-section mb-8">
              {post.topic ? `Keep Exploring ${post.topic.name}` : "Continue Reading"}
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {related.slice(0, 6).map((r) => (
                <Link
                  key={r.id}
                  to="/blog/$slug"
                  params={{ slug: r.slug }}
                  className="group flex flex-col rounded-2xl border bg-card overflow-hidden hover:border-primary/40 transition h-full"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <BlogCover post={r} />
                  </div>
                  <div className="p-5 flex flex-col gap-3 flex-1">
                    <div className="text-xs text-muted-foreground">{r.topic?.name ?? "Insights"}</div>
                    <h3 className="font-display font-semibold text-lg leading-snug line-clamp-2">
                      {r.title}
                    </h3>
                    <div className="mt-auto text-caption inline-flex items-center gap-3">
                      <span>{formatPublished(r.published_at)}</span>
                      {r.reading_time_minutes ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3.5" /> {r.reading_time_minutes} min
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {/* CTA */}
      <Section tone="gradient" padding="lg">
        <Container size="md" className="text-center">
          <h2 className="text-section text-primary-foreground">Keep Exploring Glintr</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="soft">
              <Link to="/blog">More Insights <ArrowRight className="ml-2 size-4" /></Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="bg-transparent text-primary-foreground border-primary-foreground/40 hover:bg-primary-foreground/10"
            >
              <Link to="/programs">Explore Programs</Link>
            </Button>
          </div>
        </Container>
      </Section>

      <SiteFooter />
    </div>
  );
}

function ArticleSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <Section padding="lg" tone="surface">
        <Container size="md">
          <Skeleton className="h-6 w-32 mb-6" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-6" />
          <Skeleton className="h-4 w-64" />
        </Container>
      </Section>
      <Section padding="lg">
        <Container size="md" className="space-y-4">
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-11/12" />
          <Skeleton className="h-6 w-10/12" />
          <Skeleton className="h-6 w-full" />
        </Container>
      </Section>
      <SiteFooter />
    </div>
  );
}

function BlogNotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <Section padding="lg">
        <Container size="md" className="text-center">
          <h1 className="text-hero">Insight Not Available</h1>
          <p className="text-muted-foreground mt-3">
            This article may have been unpublished or moved.
          </p>
          <Button className="mt-6" asChild>
            <Link to="/blog">Back To Insights</Link>
          </Button>
        </Container>
      </Section>
      <SiteFooter />
    </div>
  );
}

function BlogDetailError() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <Section padding="lg">
        <Container size="md" className="text-center">
          <h1 className="text-hero">Insight Not Available</h1>
          <p className="text-muted-foreground mt-3">We couldn't load this insight right now.</p>
          <Button className="mt-6" asChild>
            <Link to="/blog">Back To Insights</Link>
          </Button>
        </Container>
      </Section>
      <SiteFooter />
    </div>
  );
}
