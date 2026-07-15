import * as React from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Share2, Copy, Check } from "lucide-react";

import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { THEMES } from "./success-stories";

export const Route = createFileRoute("/success-stories/$storySlug")({
  loader: ({ params }) => {
    const theme = THEMES.find((t) => t.slug === params.storySlug);
    if (!theme) throw notFound();
    return { theme };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Story Not Available | Glintr" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const t = loaderData.theme;
    const title = `${t.title} | Glintr Success Stories`;
    return {
      meta: [
        { title },
        { name: "description", content: t.summary },
        { property: "og:title", content: title },
        { property: "og:description", content: t.summary },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `https://glintr.com/success-stories/${t.slug}` },
      ],
      links: [{ rel: "canonical", href: `https://glintr.com/success-stories/${t.slug}` }],
    };
  },
  component: StoryDetail,
  notFoundComponent: StoryNotFound,
  errorComponent: ({ error, reset }) => (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <Section padding="lg">
        <Container>
          <h1 className="text-3xl font-semibold">Unable To Load Story</h1>
          <p className="mt-2 text-muted-foreground">{error.message}</p>
          <div className="mt-6 flex gap-3">
            <Button onClick={reset}>Retry</Button>
            <Button asChild variant="outline">
              <Link to="/success-stories">Back To Success Stories</Link>
            </Button>
          </div>
        </Container>
      </Section>
      <SiteFooter />
    </div>
  ),
});

function AbstractVisual({ accent, label }: { accent: string; label: string }) {
  const initials = label
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
  return (
    <div className={cn("relative w-full h-full overflow-hidden rounded-2xl bg-gradient-to-br", accent)}>
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_60%,white,transparent_45%)]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-7xl font-semibold tracking-tight text-foreground/70">{initials}</span>
      </div>
    </div>
  );
}

function StoryNotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <Section padding="lg">
        <Container>
          <h1 className="text-3xl font-semibold">Story Not Available</h1>
          <p className="mt-2 text-muted-foreground">
            This story is not published or has been removed.
          </p>
          <div className="mt-6">
            <Button asChild variant="gradient">
              <Link to="/success-stories">Back To Success Stories</Link>
            </Button>
          </div>
        </Container>
      </Section>
      <SiteFooter />
    </div>
  );
}

const SECTIONS = [
  { heading: "Where The Journey Started", body: "Every meaningful learning arc begins with a question. In this journey, curiosity about the domain came before any commitment to a specific tool, framework or role." },
  { heading: "What Sparked The Interest", body: "The moment of genuine interest often arrives quietly — a project seen at a distance, a conversation with someone in the field, or a small experiment that suddenly clicked." },
  { heading: "Exploring The Domain", body: "Structured exploration matters more than raw study time. Understanding the shape of a field — its sub-areas, its jargon, its typical problems — makes the learning that follows much more purposeful." },
  { heading: "The Learning Experience", body: "Structured programs work best when they leave room for messiness. Trying, failing, reworking and iterating are part of the actual learning, not obstacles to it." },
  { heading: "Building Understanding", body: "Real understanding shows up in small ways — being able to explain a concept simply, spotting a familiar pattern in a new problem, or making a design decision with reasons behind it." },
  { heading: "What Comes Next", body: "Learning is not a finish line. The end of one journey usually sets up the shape of the next — a deeper specialisation, an adjacent domain, or a chance to apply what was learned to something real." },
];

function StoryDetail() {
  const { theme } = Route.useLoaderData();
  const [progress, setProgress] = React.useState(0);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      setProgress(total > 0 ? Math.min(100, (h.scrollTop / total) * 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await (navigator as any).share({ title: theme.title, text: theme.summary, url });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const related = THEMES.filter(
    (t) => t.slug !== theme.slug && (t.programCategory === theme.programCategory || t.category === theme.category),
  ).slice(0, 4);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Reading progress */}
      <div className="fixed top-0 left-0 right-0 z-40 h-0.5 bg-transparent">
        <div className="h-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
      </div>

      {/* Hero */}
      <Section padding="md">
        <Container>
          <Link
            to="/success-stories"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back To Success Stories
          </Link>
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_1fr] items-center">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                {theme.category} • {theme.programLabel}
              </div>
              <h1 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
                {theme.title}
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">{theme.summary}</p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button variant="outline" size="sm" onClick={handleShare}>
                  {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
                  {copied ? "Link copied" : "Share Story"}
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <a href={theme.programHref}>
                    Explore Program <ArrowRight className="size-4" />
                  </a>
                </Button>
              </div>
            </div>
            <div className="aspect-[4/3] w-full">
              <AbstractVisual accent={theme.accent} label={theme.title} />
            </div>
          </div>
        </Container>
      </Section>

      {/* Content with sticky context */}
      <Section padding="md">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_260px]">
            <article className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="lead text-lg text-muted-foreground">{theme.intro}</p>
              {SECTIONS.map((s) => (
                <section key={s.heading} className="mt-10">
                  <h2 className="text-2xl font-semibold tracking-tight">{s.heading}</h2>
                  <p className="mt-3 text-muted-foreground">{s.body}</p>
                </section>
              ))}
              {theme.quote && (
                <blockquote className="mt-12 rounded-2xl border-l-4 border-primary bg-surface/40 p-6 text-xl font-medium not-italic">
                  "{theme.quote}"
                </blockquote>
              )}
            </article>

            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-2xl border border-border bg-surface/40 p-5">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Story Context</div>
                <div className="mt-3 text-sm font-medium">{theme.category}</div>
                <div className="mt-1 text-sm text-muted-foreground">{theme.programLabel}</div>
                <div className="mt-5 flex flex-col gap-2">
                  <Button asChild variant="gradient" size="sm">
                    <a href={theme.programHref}>Explore Program</a>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/success-stories">More Stories</Link>
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </Section>

      {/* Related program */}
      <Section padding="md" className="bg-surface/30">
        <Container>
          <div className="rounded-3xl border border-border bg-background p-8 md:p-10">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Explore The Program</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">{theme.programLabel}</h2>
            <p className="mt-2 text-muted-foreground max-w-2xl">
              Programs in this category help learners build practical understanding through structured
              learning experiences.
            </p>
            <div className="mt-6">
              <Button asChild variant="gradient">
                <a href={theme.programHref}>
                  Explore Program <ArrowRight className="size-4" />
                </a>
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      {/* Related stories */}
      {related.length > 0 && (
        <Section padding="md">
          <Container>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Continue Exploring Stories</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  to="/success-stories/$storySlug"
                  params={{ storySlug: r.slug }}
                  className="group rounded-2xl border border-border bg-background overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition"
                >
                  <div className="aspect-[4/3]">
                    <AbstractVisual accent={r.accent} label={r.title} />
                  </div>
                  <div className="p-4">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{r.category}</div>
                    <div className="mt-1.5 text-sm font-medium line-clamp-2">{r.title}</div>
                    <div className="mt-3 inline-flex items-center gap-1 text-xs text-primary">
                      Read Story <ArrowRight className="size-3 group-hover:translate-x-0.5 transition" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      )}

      <SiteFooter />
    </div>
  );
}
