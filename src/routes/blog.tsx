import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { z } from "zod";

import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container, SectionHeader } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  listTopics,
  listCategories,
  listPosts,
  getFeaturedPost,
  listTrendingPosts,
  formatPublished,
  type BlogPost,
  type BlogTopic,
  type BlogCategory,
} from "@/lib/blog";
import { listCategories as listProgramCategories, listCourses, type DbCategory, type DbCourse } from "@/lib/programs";

const searchSchema = z.object({
  topic: z.string().optional(),
  category: z.string().optional(),
  q: z.string().optional(),
});
type BlogSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/blog")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Glintr Insights | Technology, Skills And Career Ideas" },
      {
        name: "description",
        content:
          "Explore Glintr Insights for ideas across technology, engineering, management, learning and emerging career skill domains.",
      },
      { property: "og:title", content: "Glintr Insights | Technology, Skills And Career Ideas" },
      {
        property: "og:description",
        content:
          "Ideas, skills and perspectives for a changing world — the Glintr editorial content hub.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://glintr.com/blog" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://glintr.com/blog" }],
  }),
  component: BlogIndexPage,
  errorComponent: BlogErrorState,
});

const PAGE_SIZE = 9;

function BlogIndexPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const [featured, setFeatured] = React.useState<BlogPost | null>(null);
  const [trending, setTrending] = React.useState<BlogPost[]>([]);
  const [topics, setTopics] = React.useState<BlogTopic[]>([]);
  const [categories, setCategories] = React.useState<BlogCategory[]>([]);
  const [programCategories, setProgramCategories] = React.useState<DbCategory[]>([]);
  const [programs, setPrograms] = React.useState<(DbCourse & { category: { slug: string; name: string } })[]>([]);
  const [posts, setPosts] = React.useState<BlogPost[]>([]);
  const [visible, setVisible] = React.useState(PAGE_SIZE);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState(search.q ?? "");
  const [activeTopic, setActiveTopic] = React.useState<string | null>(search.topic ?? null);

  // debounce search input -> url
  React.useEffect(() => {
    const id = setTimeout(() => {
      const next = searchTerm.trim();
      if ((next || "") !== (search.q ?? "")) {
        navigate({ search: (prev: BlogSearch) => ({ ...prev, q: next || undefined }), replace: true });
      }
    }, 300);
    return () => clearTimeout(id);
  }, [searchTerm, search.q, navigate]);

  React.useEffect(() => {
    setActiveTopic(search.topic ?? null);
  }, [search.topic]);

  // initial static loads
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [f, tr, tps, cats, pc, pgs] = await Promise.all([
          getFeaturedPost(),
          listTrendingPosts(8),
          listTopics(),
          listCategories(),
          listProgramCategories(),
          listCourses({ featured: true }),
        ]);
        if (!alive) return;
        setFeatured(f);
        setTrending(tr);
        setTopics(tps);
        setCategories(cats);
        setProgramCategories(pc);
        setPrograms(pgs.slice(0, 8));
      } catch {
        if (alive) setLoadError("Unable to load insights.");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // filter-driven list
  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const list = await listPosts({
          topic: search.topic,
          category: search.category,
          search: search.q,
        });
        if (!alive) return;
        setPosts(list);
        setVisible(PAGE_SIZE);
        setLoading(false);
      } catch {
        if (alive) {
          setLoadError("Unable to load insights.");
          setLoading(false);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [search.topic, search.category, search.q]);

  const hasAnyPosts = posts.length > 0 || featured != null;
  const filtered = posts;
  const visiblePosts = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;
  const isFiltering = Boolean(search.topic || search.category || search.q);

  function updateFilter(next: { topic?: string; category?: string; q?: string }) {
    navigate({
      search: (prev: BlogSearch) => ({
        ...prev,
        ...next,
      }),
    });
  }
  function clearAll() {
    setSearchTerm("");
    navigate({ search: () => ({}) });
  }

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* ================= HERO ================= */}
      <Section tone="surface" padding="lg" className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 pointer-events-none opacity-60 bg-mesh" />
        <Container className="relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              <Badge variant="primary" className="mb-4 uppercase tracking-wider">
                <Sparkles className="size-3 mr-1" /> Glintr Insights
              </Badge>
              <h1 className="text-hero text-balance">
                Ideas, Skills And Perspectives For A Changing World
              </h1>
              <p className="text-subheading text-muted-foreground text-pretty mt-5">
                Explore ideas across technology, engineering, management, learning and emerging career domains.
              </p>
              <p className="text-body text-muted-foreground mt-4">
                From understanding growing technologies to exploring how industries and skills are evolving,
                Glintr Insights is built for curious learners.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" onClick={() => scrollTo("latest-insights")}>
                  Explore Latest Insights <ArrowRight className="ml-2 size-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => scrollTo("explore-topics")}>
                  Browse Topics
                </Button>
              </div>
            </div>
            <TopicCollage topics={topics} onSelect={(slug) => updateFilter({ topic: slug })} />
          </div>

          <button
            type="button"
            onClick={() => scrollTo("featured-insight")}
            className="mt-14 mx-auto flex flex-col items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition"
            aria-label="Scroll to featured insight"
          >
            <span className="uppercase tracking-widest">Explore Insights</span>
            <span className="h-8 w-px bg-border animate-pulse" aria-hidden />
            <ChevronDown className="size-4" aria-hidden />
          </button>
        </Container>
      </Section>

      {/* ================= FEATURED ================= */}
      <Section id="featured-insight" padding="lg">
        <Container>
          {loading && !featured ? (
            <FeaturedSkeleton />
          ) : featured ? (
            <FeaturedInsight post={featured} />
          ) : null}
        </Container>
      </Section>

      {/* ================= TRENDING ================= */}
      {trending.length > 0 ? (
        <Section tone="surface" padding="lg">
          <Container>
            <div className="flex items-end justify-between gap-6 flex-wrap mb-8">
              <SectionHeader
                align="left"
                eyebrow="Trending"
                title="Trending Insights"
                description="What Glintr readers are following right now."
              />
            </div>
            <TrendingRail posts={trending} />
          </Container>
        </Section>
      ) : null}

      {/* ================= TOPIC EXPLORER ================= */}
      <Section id="explore-topics" padding="lg">
        <Container>
          <SectionHeader
            align="left"
            eyebrow="Explore By Topic"
            title="Follow The Ideas You Care About"
            description="Follow the ideas and learning domains that interest you."
          />
          <div className="mt-8">
            <TopicExplorer
              topics={topics}
              active={activeTopic}
              onSelect={(slug) => {
                if (activeTopic === slug) updateFilter({ topic: undefined });
                else updateFilter({ topic: slug });
              }}
            />
            {activeTopic ? (
              <TopicPreview
                topic={topics.find((t) => t.slug === activeTopic) ?? null}
                posts={posts.filter((p) => p.topic?.slug === activeTopic).slice(0, 3)}
                onClear={() => updateFilter({ topic: undefined })}
              />
            ) : null}
          </div>
        </Container>
      </Section>

      {/* ================= LEARNING TIMELINE ================= */}
      <Section tone="surface" padding="lg">
        <Container size="lg">
          <SectionHeader
            align="center"
            eyebrow="From Curiosity To Understanding"
            title="How Curious Learners Grow"
            description="Editorial ideas move at the pace of curiosity — not academic progress. This is how exploration usually unfolds."
          />
          <LearningTimeline />
        </Container>
      </Section>

      {/* ================= SEARCH + LATEST ================= */}
      <Section id="latest-insights" padding="lg">
        <Container>
          <SectionHeader
            align="left"
            eyebrow="Latest Insights"
            title="Latest Insights"
            description="Newest ideas across technology, engineering, management and career domains."
          />

          <div className="mt-8 flex flex-col gap-5">
            <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
              <label className="relative w-full md:max-w-md">
                <span className="sr-only">Search insights</span>
                <Search
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
                />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search topics, skills or articles"
                  className="pl-9"
                  aria-label="Search insights"
                />
                {searchTerm ? (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-muted"
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
              </label>
              <div className="text-xs text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? "Insight" : "Insights"}
              </div>
            </div>

            <CategoryFilterRow
              categories={categories}
              active={search.category ?? null}
              onSelect={(slug) => updateFilter({ category: slug || undefined })}
            />
          </div>

          <div className="mt-10">
            {loading ? (
              <LatestSkeleton />
            ) : filtered.length === 0 ? (
              hasAnyPosts ? (
                <SearchEmptyState onClear={clearAll} />
              ) : (
                <BlogEmptyState />
              )
            ) : (
              <EditorialFeed posts={visiblePosts} programCategories={programCategories} />
            )}

            {!loading && hasMore ? (
              <div className="mt-12 flex justify-center">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                >
                  Load More Insights
                </Button>
              </div>
            ) : null}
          </div>

          {loadError && !loading ? (
            <div className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-center">
              <div className="font-semibold">Unable To Load Insights</div>
              <p className="text-sm text-muted-foreground mt-1">
                We couldn't load Glintr Insights right now.
              </p>
              <Button className="mt-4" variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          ) : null}
        </Container>
      </Section>

      {/* ================= DOMAIN STRIP ================= */}
      {programCategories.length > 0 ? (
        <Section tone="surface" padding="lg">
          <Container>
            <SectionHeader
              align="left"
              eyebrow="Explore Learning Domains"
              title="Explore Learning Domains"
              description="Follow curiosity into a broader learning domain."
            />
            <DomainStrip categories={programCategories} />
          </Container>
        </Section>
      ) : null}

      {/* ================= PROGRAM DISCOVERY ================= */}
      {programs.length > 0 ? (
        <Section padding="lg">
          <Container>
            <SectionHeader
              align="left"
              eyebrow="Turn Curiosity Into Learning"
              title="Turn Curiosity Into Learning"
              description="Explore Glintr programs across technology, engineering, management and emerging career domains."
            />
            <ProgramRail programs={programs} />
          </Container>
        </Section>
      ) : null}

      {/* ================= FINAL CTA ================= */}
      <Section tone="gradient" padding="lg">
        <Container size="md" className="text-center">
          <div className="text-label mb-4 text-primary-foreground/80">KEEP EXPLORING</div>
          <h2 className="text-section text-primary-foreground text-balance">
            One Idea Can Open A New Learning Direction
          </h2>
          <p className="text-subheading text-primary-foreground/85 mt-4 max-w-2xl mx-auto">
            Explore more insights or discover Glintr programs across growing technology, engineering, management and career domains.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="soft">
              <Link to="/programs">Explore Programs</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground/40 hover:bg-primary-foreground/10">
              <Link to="/about">About Glintr</Link>
            </Button>
            <button
              type="button"
              className="story-link text-primary-foreground/80 hover:text-primary-foreground text-sm"
              onClick={() => scrollTo("latest-insights")}
            >
              View Latest Insights
            </button>
          </div>
        </Container>
      </Section>

      <SiteFooter />
    </div>
  );
}

/* =====================================================
 *  HERO TOPIC COLLAGE
 * ===================================================== */

function TopicCollage({ topics, onSelect }: { topics: BlogTopic[]; onSelect: (slug: string) => void }) {
  const items = topics.slice(0, 6);
  return (
    <div className="relative">
      {/* Mobile: swipeable rail */}
      <div className="lg:hidden -mx-6 px-6 overflow-x-auto no-scrollbar">
        <div className="flex gap-3 min-w-max pb-2">
          {items.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelect(t.slug)}
              className="min-w-[220px] rounded-2xl border bg-card p-4 text-left hover:border-primary/40 transition"
            >
              <TopicGlyph style={t.visual_style} />
              <div className="mt-3 text-sm font-semibold">{t.name}</div>
              <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{t.short_description}</div>
            </button>
          ))}
        </div>
      </div>
      {/* Desktop: layered collage */}
      <div className="hidden lg:block relative h-[420px]">
        {items.map((t, i) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.slug)}
            className={cn(
              "group absolute rounded-2xl border bg-card p-5 shadow-sm text-left transition-transform duration-300 hover:-translate-y-1 hover:shadow-md motion-reduce:transform-none",
              positions[i % positions.length],
            )}
            style={{ animation: `blogFloat ${6 + i}s ease-in-out ${i * 0.3}s infinite` }}
          >
            <TopicGlyph style={t.visual_style} />
            <div className="mt-3 text-sm font-semibold">{t.name}</div>
            <div className="text-xs text-muted-foreground max-w-[200px] line-clamp-2 mt-1">{t.short_description}</div>
            <div className="text-xs text-primary inline-flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition">
              Explore <ArrowUpRight className="size-3.5" />
            </div>
          </button>
        ))}
      </div>
      <style>{`
        @keyframes blogFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @media (prefers-reduced-motion: reduce) {
          [style*="blogFloat"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

const positions = [
  "left-0 top-4 w-[260px]",
  "left-[220px] top-24 w-[260px]",
  "left-[40px] top-[220px] w-[240px]",
  "left-[280px] top-[240px] w-[240px]",
  "left-[80px] top-[360px] w-[220px]",
  "left-[300px] top-[80px] w-[240px]",
];

function TopicGlyph({ style }: { style: string | null }) {
  const s = style ?? "grid";
  const base = "size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center";
  return (
    <div className={base} aria-hidden>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {s === "nodes" && <><circle cx="6" cy="6" r="2" /><circle cx="18" cy="6" r="2" /><circle cx="12" cy="18" r="2" /><path d="M8 6h8M7 8l4 8M17 8l-4 8" /></>}
        {s === "grid" && <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>}
        {s === "network" && <><circle cx="12" cy="12" r="3" /><path d="M12 3v6M12 15v6M3 12h6M15 12h6" /></>}
        {s === "motion" && <><path d="M4 12h16M4 6h10M4 18h10" /><circle cx="20" cy="6" r="1.5" /><circle cx="20" cy="18" r="1.5" /></>}
        {s === "circuit" && <><path d="M4 12h4v-4h4v8h4v-4h4" /><circle cx="20" cy="8" r="1.5" /></>}
        {s === "flow" && <><path d="M4 6h10a4 4 0 010 8H4" /><path d="M14 14h6" /></>}
        {s === "structure" && <><path d="M4 20V4l8 6 8-6v16" /></>}
        {s === "path" && <><path d="M4 20c4 0 4-16 8-16s4 16 8 16" /></>}
      </svg>
    </div>
  );
}

/* =====================================================
 *  FEATURED
 * ===================================================== */

function FeaturedInsight({ post }: { post: BlogPost }) {
  return (
    <div className="rounded-3xl border overflow-hidden bg-card grid md:grid-cols-2">
      <Link
        to="/blog/$slug"
        params={{ slug: post.slug }}
        className="group relative bg-gradient-brand-soft aspect-[4/3] md:aspect-auto overflow-hidden"
        aria-label={`Read ${post.title}`}
      >
        {post.featured_image_url ? (
          <img
            src={post.featured_image_url}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
          />
        ) : (
          <div className="size-full flex items-center justify-center">
            <TopicGlyph style={post.topic?.visual_style ?? "grid"} />
          </div>
        )}
      </Link>
      <div className="p-8 md:p-12 flex flex-col justify-center gap-4">
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="primary" className="uppercase tracking-wider">Featured Insight</Badge>
          {post.topic ? <span className="text-muted-foreground">{post.topic.name}</span> : null}
        </div>
        <h2 className="text-3xl md:text-4xl font-display font-semibold text-balance leading-tight">
          <Link to="/blog/$slug" params={{ slug: post.slug }} className="hover:text-primary transition-colors">
            {post.title}
          </Link>
        </h2>
        {post.subtitle ? <p className="text-subheading text-muted-foreground">{post.subtitle}</p> : null}
        <p className="text-body text-muted-foreground text-pretty line-clamp-3">{post.short_summary}</p>
        <div className="mt-2 flex items-center gap-4 text-caption">
          <span>{formatPublished(post.published_at)}</span>
          {post.reading_time_minutes ? (
            <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {post.reading_time_minutes} min read</span>
          ) : null}
        </div>
        <div className="mt-4">
          <Button asChild size="lg">
            <Link to="/blog/$slug" params={{ slug: post.slug }}>Read Article <ArrowRight className="ml-2 size-4" /></Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function FeaturedSkeleton() {
  return (
    <div className="rounded-3xl border overflow-hidden bg-card grid md:grid-cols-2">
      <Skeleton className="aspect-[4/3] md:aspect-auto md:min-h-[420px]" />
      <div className="p-10 space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-10 w-40 mt-4" />
      </div>
    </div>
  );
}

/* =====================================================
 *  TRENDING RAIL
 * ===================================================== */

function TrendingRail({ posts }: { posts: BlogPost[] }) {
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  function scrollBy(dir: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  }
  return (
    <div className="relative">
      <div className="absolute -top-14 right-0 hidden md:flex gap-2">
        <Button variant="outline" size="icon" onClick={() => scrollBy(-1)} aria-label="Previous trending insights">
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => scrollBy(1)} aria-label="Next trending insights">
          <ChevronRight className="size-4" />
        </Button>
      </div>
      <div
        ref={scrollerRef}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar -mx-6 px-6 md:mx-0 md:px-0"
      >
        {posts.map((p) => (
          <Link
            key={p.id}
            to="/blog/$slug"
            params={{ slug: p.slug }}
            className="group snap-start shrink-0 w-[80vw] sm:w-[380px] rounded-2xl border bg-card overflow-hidden hover:border-primary/40 transition"
          >
            <div className="aspect-[16/10] bg-gradient-brand-soft overflow-hidden">
              {p.featured_image_url ? (
                <img
                  src={p.featured_image_url}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
                />
              ) : (
                <div className="size-full flex items-center justify-center">
                  <TopicGlyph style={p.topic?.visual_style ?? "grid"} />
                </div>
              )}
            </div>
            <div className="p-5">
              <div className="text-xs text-muted-foreground">{p.topic?.name ?? "Insights"}</div>
              <div className="font-display font-semibold text-lg leading-snug mt-1 line-clamp-2">{p.title}</div>
              <div className="mt-3 flex items-center gap-3 text-caption">
                <span>{formatPublished(p.published_at)}</span>
                {p.reading_time_minutes ? (
                  <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {p.reading_time_minutes} min</span>
                ) : null}
              </div>
              <div className="mt-3 text-sm text-primary inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                Read Insight <ArrowRight className="size-3.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* =====================================================
 *  TOPIC EXPLORER
 * ===================================================== */

function TopicExplorer({
  topics,
  active,
  onSelect,
}: {
  topics: BlogTopic[];
  active: string | null;
  onSelect: (slug: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 md:gap-3">
      {topics.map((t) => {
        const on = active === t.slug;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.slug)}
            aria-pressed={on}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm transition",
              on
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card hover:border-primary/40",
            )}
          >
            <TopicGlyph style={t.visual_style} />
            <span>{t.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function TopicPreview({
  topic,
  posts,
  onClear,
}: {
  topic: BlogTopic | null;
  posts: BlogPost[];
  onClear: () => void;
}) {
  if (!topic) return null;
  return (
    <div className="mt-8 rounded-2xl border bg-card p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Selected Topic</div>
          <div className="font-display text-2xl font-semibold mt-1">{topic.name}</div>
          {topic.short_description ? (
            <p className="text-sm text-muted-foreground max-w-2xl mt-2">{topic.short_description}</p>
          ) : null}
        </div>
        <Button variant="ghost" size="sm" onClick={onClear}>Clear Topic</Button>
      </div>
      {posts.length > 0 ? (
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {posts.map((p) => (
            <CompactCard key={p.id} post={p} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mt-4">
          More insights on {topic.name} are on the way.
        </p>
      )}
    </div>
  );
}

/* =====================================================
 *  CATEGORY FILTERS
 * ===================================================== */

function CategoryFilterRow({
  categories,
  active,
  onSelect,
}: {
  categories: BlogCategory[];
  active: string | null;
  onSelect: (slug: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-6 px-6 md:mx-0 md:px-0">
      <button
        type="button"
        onClick={() => onSelect("")}
        className={cn(
          "px-4 py-1.5 rounded-full text-sm border transition shrink-0",
          !active ? "bg-foreground text-background border-foreground" : "bg-card hover:border-primary/40",
        )}
      >
        All Insights
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onSelect(c.slug)}
          className={cn(
            "px-4 py-1.5 rounded-full text-sm border transition shrink-0",
            active === c.slug ? "bg-foreground text-background border-foreground" : "bg-card hover:border-primary/40",
          )}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}

/* =====================================================
 *  EDITORIAL FEED
 * ===================================================== */

function EditorialFeed({
  posts,
  programCategories,
}: {
  posts: BlogPost[];
  programCategories: DbCategory[];
}) {
  const chunks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < posts.length) {
    const large = posts[i];
    const c1 = posts[i + 1];
    const c2 = posts[i + 2];
    const wide = posts[i + 3];
    const row = posts.slice(i + 4, i + 7);
    if (large) {
      chunks.push(<LargeCard key={`L-${key++}`} post={large} flip={key % 2 === 0} />);
    }
    if (c1 || c2) {
      chunks.push(
        <div key={`C-${key++}`} className="grid md:grid-cols-2 gap-6">
          {c1 ? <CompactCard post={c1} /> : null}
          {c2 ? <CompactCard post={c2} /> : null}
        </div>,
      );
    }
    if (wide) {
      chunks.push(<WideCard key={`W-${key++}`} post={wide} />);
    }
    if (row.length > 0) {
      chunks.push(
        <div key={`R-${key++}`} className="grid md:grid-cols-3 gap-6">
          {row.map((p) => <CompactCard key={p.id} post={p} />)}
        </div>,
      );
    }
    i += 7;
    // Editorial break using topic of next post
    if (i < posts.length && programCategories.length > 0) {
      const cat = programCategories[key % programCategories.length];
      chunks.push(<EditorialBreak key={`B-${key++}`} category={cat} />);
    }
  }
  return <div className="space-y-10">{chunks}</div>;
}

function LargeCard({ post, flip }: { post: BlogPost; flip: boolean }) {
  return (
    <article className={cn("grid md:grid-cols-5 gap-6 items-center rounded-3xl border bg-card overflow-hidden", flip && "md:[direction:rtl]")}>
      <Link
        to="/blog/$slug"
        params={{ slug: post.slug }}
        className="md:col-span-3 group aspect-[16/10] md:aspect-auto md:min-h-[320px] bg-gradient-brand-soft overflow-hidden [direction:ltr]"
      >
        {post.featured_image_url ? (
          <img src={post.featured_image_url} alt="" loading="lazy" decoding="async" width="1200" height="750" className="size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none" />
        ) : (
          <div className="size-full flex items-center justify-center"><TopicGlyph style={post.topic?.visual_style ?? "grid"} /></div>
        )}
      </Link>
      <div className="md:col-span-2 p-6 md:p-10 [direction:ltr]">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{post.topic?.name ?? "Insights"}</div>
        <h3 className="font-display text-2xl md:text-3xl font-semibold mt-3 leading-tight">
          <Link to="/blog/$slug" params={{ slug: post.slug }} className="hover:text-primary transition-colors">
            {post.title}
          </Link>
        </h3>
        <p className="text-muted-foreground mt-3 line-clamp-3">{post.short_summary}</p>
        <div className="mt-4 flex items-center gap-3 text-caption">
          <span>{formatPublished(post.published_at)}</span>
          {post.reading_time_minutes ? (
            <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {post.reading_time_minutes} min read</span>
          ) : null}
        </div>
        <Link
          to="/blog/$slug"
          params={{ slug: post.slug }}
          className="mt-5 inline-flex items-center gap-1 text-primary font-semibold text-sm"
        >
          Read Article <ArrowRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}

function WideCard({ post }: { post: BlogPost }) {
  return (
    <article className="rounded-3xl border bg-card overflow-hidden">
      <Link to="/blog/$slug" params={{ slug: post.slug }} className="group block aspect-[21/9] bg-gradient-brand-soft overflow-hidden">
        {post.featured_image_url ? (
          <img src={post.featured_image_url} alt="" loading="lazy" decoding="async" width="1200" height="750" className="size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none" />
        ) : (
          <div className="size-full flex items-center justify-center"><TopicGlyph style={post.topic?.visual_style ?? "grid"} /></div>
        )}
      </Link>
      <div className="p-6 md:p-10">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{post.topic?.name ?? "Insights"}</div>
        <h3 className="font-display text-2xl md:text-3xl font-semibold mt-3 max-w-3xl">
          <Link to="/blog/$slug" params={{ slug: post.slug }} className="hover:text-primary transition-colors">{post.title}</Link>
        </h3>
        <p className="text-muted-foreground mt-3 max-w-2xl line-clamp-2">{post.short_summary}</p>
        <div className="mt-5 flex items-center gap-4 text-caption">
          <span>{formatPublished(post.published_at)}</span>
          {post.reading_time_minutes ? (
            <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {post.reading_time_minutes} min read</span>
          ) : null}
          <Link to="/blog/$slug" params={{ slug: post.slug }} className="ml-auto inline-flex items-center gap-1 text-primary font-semibold">
            Read Insight <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function CompactCard({ post }: { post: BlogPost }) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className="group flex flex-col rounded-2xl border bg-card overflow-hidden hover:border-primary/40 transition h-full"
    >
      <div className="aspect-[16/10] bg-gradient-brand-soft overflow-hidden">
        {post.featured_image_url ? (
          <img src={post.featured_image_url} alt="" loading="lazy" decoding="async" width="1200" height="750" className="size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none" />
        ) : (
          <div className="size-full flex items-center justify-center"><TopicGlyph style={post.topic?.visual_style ?? "grid"} /></div>
        )}
      </div>
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="text-xs text-muted-foreground">{post.topic?.name ?? "Insights"}</div>
        <h3 className="font-display font-semibold text-lg leading-snug line-clamp-2">{post.title}</h3>
        <div className="mt-auto flex items-center justify-between text-caption pt-2">
          <span>{formatPublished(post.published_at)}</span>
          {post.reading_time_minutes ? (
            <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {post.reading_time_minutes} min</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

function EditorialBreak({ category }: { category: DbCategory }) {
  return (
    <div className="rounded-3xl bg-secondary text-secondary-foreground p-8 md:p-12">
      <div className="text-label mb-3 opacity-80">Understand The Domain</div>
      <h3 className="text-2xl md:text-3xl font-display font-semibold text-balance max-w-2xl">
        Explore More Ideas Across {category.name}
      </h3>
      <p className="opacity-80 mt-3 max-w-2xl">
        {category.short_description ?? `Discover Glintr programs and insights across the ${category.name} learning domain.`}
      </p>
      <div className="mt-5">
        <Button asChild variant="soft">
          <Link to="/programs/$categorySlug" params={{ categorySlug: category.slug }}>
            Explore {category.name} <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

/* =====================================================
 *  DOMAIN STRIP + PROGRAM RAIL + TIMELINE + STATES
 * ===================================================== */

function DomainStrip({ categories }: { categories: DbCategory[] }) {
  return (
    <div className="mt-8 -mx-6 px-6 md:mx-0 md:px-0 overflow-x-auto no-scrollbar">
      <div className="flex gap-4 min-w-max pb-2">
        {categories.map((c) => (
          <Link
            key={c.id}
            to="/programs/$categorySlug"
            params={{ categorySlug: c.slug }}
            className="group min-w-[240px] rounded-2xl border bg-card p-5 hover:border-primary/40 transition"
          >
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Compass className="size-5" />
            </div>
            <div className="mt-3 font-display font-semibold text-lg">{c.name}</div>
            <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {c.short_description ?? `Explore ${c.name} learning insights.`}
            </div>
            <div className="mt-3 text-sm text-primary inline-flex items-center gap-1 group-hover:gap-2 transition-all">
              Explore Insights <ArrowRight className="size-3.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ProgramRail({ programs }: { programs: (DbCourse & { category: { slug: string; name: string } })[] }) {
  return (
    <div className="mt-8 -mx-6 px-6 md:mx-0 md:px-0 overflow-x-auto no-scrollbar">
      <div className="flex gap-4 min-w-max pb-2">
        {programs.map((p) => (
          <Link
            key={p.id}
            to="/programs/$categorySlug/$courseSlug"
            params={{ categorySlug: p.category.slug, courseSlug: p.slug }}
            className="group min-w-[300px] max-w-[320px] rounded-2xl border bg-card p-5 hover:border-primary/40 transition"
          >
            <div className="text-xs text-muted-foreground">{p.category.name}</div>
            <div className="mt-2 font-display font-semibold text-lg leading-snug line-clamp-2">{p.name}</div>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{p.short_description ?? ""}</p>
            <div className="mt-4 text-sm text-primary inline-flex items-center gap-1 group-hover:gap-2 transition-all">
              Explore Program <ArrowRight className="size-3.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

const timelineStages = [
  { label: "Notice", body: "A new technology, field or career area catches your attention." },
  { label: "Explore", body: "You begin understanding what the domain actually involves." },
  { label: "Learn", body: "You build foundational knowledge around concepts and tools." },
  { label: "Connect", body: "You start seeing how ideas relate to industries, projects or career paths." },
  { label: "Go Deeper", body: "You choose the next skill, program or learning direction to explore." },
];

function LearningTimeline() {
  const [active, setActive] = React.useState(0);
  const refs = React.useRef<(HTMLDivElement | null)[]>([]);
  React.useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const i = Number((e.target as HTMLElement).dataset.idx ?? 0);
            setActive(i);
          }
        });
      },
      { rootMargin: "-40% 0px -50% 0px" },
    );
    refs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);
  return (
    <div className="mt-10 grid md:grid-cols-[220px_1fr] gap-10">
      <div className="hidden md:block">
        <div className="sticky top-24 space-y-2">
          {timelineStages.map((s, i) => (
            <div
              key={s.label}
              className={cn(
                "flex items-center gap-3 py-2 transition-colors",
                active === i ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "size-2 rounded-full",
                  active === i ? "bg-primary" : "bg-border",
                )}
              />
              <span className="text-sm font-medium">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-8">
        {timelineStages.map((s, i) => (
          <div
            key={s.label}
            ref={(el) => { refs.current[i] = el; }}
            data-idx={i}
            className={cn(
              "rounded-2xl border bg-card p-6 md:p-8 transition-all",
              active === i && "border-primary/50 shadow-sm",
            )}
          >
            <div className="text-xs uppercase tracking-widest text-primary">{`Stage ${i + 1}`}</div>
            <h3 className="font-display text-2xl font-semibold mt-2">{s.label}</h3>
            <p className="text-muted-foreground mt-2">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LatestSkeleton() {
  return (
    <div className="space-y-10">
      <Skeleton className="h-72 w-full rounded-3xl" />
      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
      <Skeleton className="h-60 rounded-3xl" />
      <div className="grid md:grid-cols-3 gap-6">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}

function BlogEmptyState() {
  return (
    <div className="rounded-3xl border bg-card p-10 md:p-16 text-center">
      <h3 className="text-section">Insights Are Coming Soon</h3>
      <p className="text-muted-foreground max-w-xl mx-auto mt-3">
        We're preparing ideas and learning perspectives across technology, engineering, management and emerging skill domains.
      </p>
      <div className="mt-6">
        <Button asChild size="lg">
          <Link to="/programs">Explore Programs</Link>
        </Button>
      </div>
    </div>
  );
}

function SearchEmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="rounded-3xl border bg-card p-10 md:p-14 text-center">
      <h3 className="text-2xl font-display font-semibold">No Insights Found</h3>
      <p className="text-muted-foreground max-w-md mx-auto mt-2">
        Try another topic, keyword or category.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button variant="outline" onClick={onClear}>Clear Search</Button>
        <Button asChild variant="outline"><Link to="/blog">View All Insights</Link></Button>
        <Button asChild><Link to="/programs">Explore Programs</Link></Button>
      </div>
    </div>
  );
}

function BlogErrorState() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <Section padding="lg">
        <Container size="md" className="text-center">
          <h1 className="text-hero">Unable To Load Insights</h1>
          <p className="text-muted-foreground mt-3">We couldn't load Glintr Insights right now.</p>
          <Button className="mt-6" onClick={() => window.location.reload()}>Retry</Button>
        </Container>
      </Section>
      <SiteFooter />
    </div>
  );
}
