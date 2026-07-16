import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import {
  ArrowRight, ChevronRight, Search, LayoutGrid, Rows3, X, Sparkles,
  Compass, Users, Wrench, ChevronDown, BookOpen, GitCompare, Network, Layers,
} from "lucide-react";

import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container } from "@/components/shared/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCategoryBySlug, listCategories, listCourses, formatPrice } from "@/lib/programs";
import { getCategorySeo } from "@/lib/seo";
import { CategoryVisual, slugToVariant, CATEGORY_THEME } from "@/components/programs/category-visuals";
import { ProgramCard, type ProgramCardData } from "@/components/programs/program-card";
import { getCategoryEditorial, type CategoryEditorial } from "@/data/category-editorial";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const SITE_URL = "https://glintr.com";

export const Route = createFileRoute("/programs/$category/")({
  loader: async ({ params }) => ({ seo: await getCategorySeo(params.category) }),
  head: ({ params, loaderData }) => {
    const seo = loaderData?.seo;
    const editorial = getCategoryEditorial(params.category);
    const canonical = `${SITE_URL}/programs/${params.category}`;
    const name = seo?.name ?? prettify(params.category);
    const title = editorial?.seoTitle ?? seo?.seo_title ?? `${name} Programs | Glintr`;
    const description =
      editorial?.seoDescription ??
      seo?.seo_description ??
      seo?.short_description ??
      `Explore ${name} career programs on Glintr — practical, mentor-led courses.`;
    const image = seo?.hero_image_url ?? undefined;
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: canonical },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ];
    if (image) {
      meta.push({ property: "og:image", content: image });
      meta.push({ name: "twitter:image", content: image });
    }
    const breadcrumbs = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Programs", item: `${SITE_URL}/programs` },
        { "@type": "ListItem", position: 3, name, item: canonical },
      ],
    };
    const scripts: Array<{ type: string; children: string }> = [
      { type: "application/ld+json", children: JSON.stringify(breadcrumbs) },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: title,
          description,
          url: canonical,
        }),
      },
    ];
    if (editorial?.faqs?.length) {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: editorial.faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      });
    }
    return {
      meta,
      links: [{ rel: "canonical", href: canonical }],
      scripts,
    };
  },
  component: CategoryPage,
  notFoundComponent: () => <NotFoundState />,
  errorComponent: ({ error }) => (
    <div className="p-10 text-center">Failed to load: {String(error)}</div>
  ),
});

function prettify(slug: string) {
  return slug.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
}

function CategoryPage() {
  const { category: slug } = Route.useParams();
  const theme = CATEGORY_THEME[slugToVariant(slug)];

  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ["category", slug],
    queryFn: () => getCategoryBySlug(slug),
  });
  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["courses", "cat", category?.id ?? slug],
    queryFn: () => listCourses({ categoryId: category?.id }),
    enabled: Boolean(category),
  });
  const { data: allCategories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
  });
  const editorial = getCategoryEditorial(slug);
  const { data: blogPosts = [] } = useQuery({
    queryKey: ["cat-blogs", slug],
    enabled: Boolean(editorial?.featuredBlogSlugs?.length),
    queryFn: async () => {
      const slugs = editorial?.featuredBlogSlugs ?? [];
      if (!slugs.length) return [] as Array<{ slug: string; title: string; excerpt: string | null }>;
      const { data } = await supabase
        .from("blog_posts")
        .select("slug,title,short_summary")
        .in("slug", slugs)
        .eq("is_published", true);
      return ((data ?? []) as Array<{ slug: string; title: string; short_summary: string | null }>).map(
        (r) => ({ slug: r.slug, title: r.title, excerpt: r.short_summary }),
      );
    },
  });

  if (category === null) return <NotFoundState />;

  const list = (courses as unknown as ProgramCardData[]) ?? [];
  const featured = list.filter((c) => c.is_featured).slice(0, 3);
  const isLoading = categoryLoading || coursesLoading;

  return (
    <>
      <SiteHeader />
      <main>
        {/* HERO — immersive split */}
        <Section className="relative overflow-hidden pt-10 pb-16 md:pt-14 md:pb-24">
          <div
            className="absolute inset-0 -z-10"
            style={{
              background: `radial-gradient(80% 60% at 90% 20%, ${theme.from}, transparent 60%), radial-gradient(60% 60% at 10% 90%, ${theme.to}, transparent 60%)`,
            }}
          />
          <Container>
            <nav className="text-caption mb-6 flex items-center gap-1.5 flex-wrap">
              <Link to="/" className="hover:text-foreground">Home</Link>
              <ChevronRight className="size-3.5" />
              <Link to="/programs" className="hover:text-foreground">Programs</Link>
              <ChevronRight className="size-3.5" />
              <span className="text-foreground">{category?.name ?? prettify(slug)}</span>
            </nav>

            <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14 items-center">
              <div>
                <div className="inline-flex items-center gap-2 mb-5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: theme.ring }}
                  />
                  <span className="text-[11px] uppercase tracking-[0.22em] font-medium text-muted-foreground">
                    Program Category · {theme.label}
                  </span>
                </div>
                <h1 className="text-display-md md:text-display-lg font-display font-semibold tracking-tight text-balance">
                  {editorial?.headline ?? category?.hero_title ?? category?.name ?? prettify(slug)}
                </h1>
                <p className="mt-5 text-body-lg text-muted-foreground max-w-xl">
                  {editorial?.subheadline ?? category?.full_description ?? category?.short_description}
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Button size="lg" variant="gradient" asChild>
                    <a href="#all-programs">
                      Explore Programs
                      <ArrowRight className="size-4 ml-2" />
                    </a>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <a href="#skill-path">Find my learning path</a>
                  </Button>
                </div>
                <div className="mt-8 inline-flex items-center gap-2 text-caption">
                  <span
                    className="text-mono text-2xl font-semibold"
                    style={{ color: theme.ring }}
                  >
                    {isLoading ? "…" : list.length}
                  </span>
                  <span className="uppercase tracking-wider">
                    {list.length === 1 ? "Program" : "Programs"} in this field
                  </span>
                </div>
              </div>

              <CategoryVisual
                slug={slug}
                className="relative aspect-[4/3] w-full rounded-2xl border border-border/70 shadow-xl"
              />
            </div>
          </Container>
        </Section>

        {/* FEATURED */}
        {featured.length > 0 ? (
          <Section className="py-14 md:py-20 border-t border-border/60">
            <Container>
              <SectionIntro
                eyebrow="Featured Directions"
                title="Programs to start exploring"
                copy="Editorial picks from the current catalogue — chosen for practical depth and career direction."
              />
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((c, i) => (
                  <ProgramCard key={c.id} course={c} index={i} />
                ))}
              </div>
            </Container>
          </Section>
        ) : null}

        {/* SKILL PATH EXPLORER */}
        <Section id="skill-path" className="py-14 md:py-20 bg-surface-2/40 border-y border-border/60">
          <Container>
            <SectionIntro
              eyebrow="Guided Discovery"
              title="Find a direction that interests you"
              copy="A quick, deterministic guide — pick what sounds most interesting and see a suggested program from this category."
            />
            <SkillPathExplorer courses={list} categoryTheme={theme} />
          </Container>
        </Section>

        {/* ALL PROGRAMS */}
        <Section id="all-programs" className="py-14 md:py-20">
          <Container>
            <AllPrograms courses={list} isLoading={isLoading} />
          </Container>
        </Section>

        {/* COMPARISON */}
        {list.length >= 2 ? (
          <Section className="py-14 md:py-20 bg-surface-2/40 border-y border-border/60">
            <Container>
              <SectionIntro
                eyebrow="Side by Side"
                title="Compare program directions"
                copy="Select up to three programs from this category to compare focus, level, and starting price."
              />
              <ComparisonExplorer courses={list} categoryTheme={theme} />
            </Container>
          </Section>
        ) : null}

        {/* LEARNING JOURNEY */}
        <Section className="py-14 md:py-20">
          <Container>
            <SectionIntro
              eyebrow="From Interest to Direction"
              title="How discovery works on Glintr"
              copy="A calm, seven-stage flow — from choosing a field to starting the applicable enrollment journey."
            />
            <LearningJourney theme={theme} />
          </Container>
        </Section>

        {/* WHO THIS IS FOR */}
        <Section className="py-14 md:py-20 bg-surface-2/40 border-y border-border/60">
          <Container>
            <SectionIntro
              eyebrow="Explore Based on Where You Are"
              title="Who this category is for"
              copy="Neutral educational guidance — pick the profile closest to you to see where to start."
            />
            <WhoItIsFor categoryName={category?.name ?? prettify(slug)} courses={list} />
          </Container>
        </Section>

        {/* FAQ */}
        <Section className="py-14 md:py-20">
          <Container className="max-w-3xl">
            <SectionIntro
              eyebrow="Common Questions"
              title="Category FAQs"
              copy="Quick answers on how to explore, compare, and choose programs in this category."
              center
            />
            <CategoryFAQ categoryName={category?.name ?? prettify(slug)} />
          </Container>
        </Section>

        {/* EXPLORE ANOTHER FIELD */}
        <Section className="py-14 md:py-20 bg-surface-2/40 border-t border-border/60">
          <Container>
            <SectionIntro
              eyebrow="Keep Exploring"
              title="Explore another field"
              copy="Every category has its own visual world and program direction."
            />
            <div className="mt-8 space-y-3">
              {allCategories.map((cat, i) => {
                const isCurrent = cat.slug === slug;
                const t = CATEGORY_THEME[slugToVariant(cat.slug)];
                return (
                  <Link
                    key={cat.slug}
                    to="/programs/$category"
                    params={{ category: cat.slug }}
                    className={cn(
                      "group relative flex items-center gap-4 md:gap-6 overflow-hidden rounded-xl border border-border bg-card",
                      "p-4 md:p-5 transition-all duration-300",
                      "hover:-translate-y-[3px] hover:shadow-md hover:border-border-strong",
                      isCurrent && "opacity-60 pointer-events-none",
                    )}
                    aria-current={isCurrent ? "page" : undefined}
                  >
                    <div className="relative h-16 w-24 md:h-20 md:w-40 shrink-0 overflow-hidden rounded-lg border border-border/60">
                      <CategoryVisual slug={cat.slug} compact className="absolute inset-0" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-mono text-xs" style={{ color: t.ring }}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <h3 className="font-display text-lg font-semibold truncate">{cat.name}</h3>
                        {isCurrent ? (
                          <Badge variant="outline" className="text-[10px]">Current</Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-caption text-muted-foreground line-clamp-1">
                        {cat.short_description}
                      </p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </Link>
                );
              })}
            </div>
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}

/* ----------------- helpers & subcomponents ----------------- */

function SectionIntro({
  eyebrow,
  title,
  copy,
  center = false,
}: {
  eyebrow: string;
  title: string;
  copy?: string;
  center?: boolean;
}) {
  return (
    <div className={cn("max-w-2xl", center && "mx-auto text-center")}>
      <p className="text-[11px] uppercase tracking-[0.22em] font-medium text-primary mb-3">
        {eyebrow}
      </p>
      <h2 className="text-heading-xl md:text-3xl font-display font-semibold tracking-tight">
        {title}
      </h2>
      {copy ? <p className="mt-3 text-muted-foreground">{copy}</p> : null}
    </div>
  );
}

/* --- Skill Path Explorer --- */
const INTEREST_OPTIONS = [
  { key: "build-intelligent", label: "Building intelligent systems", match: ["ai", "machine", "intellig", "ml"] },
  { key: "build-web", label: "Creating websites", match: ["web"] },
  { key: "build-app", label: "Building mobile experiences", match: ["app", "mobile", "android", "ios"] },
  { key: "work-data", label: "Working with data", match: ["data", "analyt"] },
  { key: "work-infra", label: "Understanding connected infrastructure", match: ["cloud", "iot", "network", "embed"] },
  { key: "work-security", label: "Exploring digital security", match: ["cyber", "security"] },
  { key: "hardware", label: "Working with hardware & chips", match: ["vlsi", "embed", "electron", "circuit"] },
  { key: "systems", label: "Designing mechanical systems", match: ["mech", "cad", "design"] },
  { key: "strategy", label: "Leading teams & strategy", match: ["manag", "business", "leader", "mba"] },
] as const;

const LEVEL_OPTIONS = ["Starting Out", "Some Experience", "Ready To Go Deeper"] as const;

function SkillPathExplorer({
  courses,
  categoryTheme,
}: {
  courses: ProgramCardData[];
  categoryTheme: (typeof CATEGORY_THEME)[keyof typeof CATEGORY_THEME];
}) {
  const [interest, setInterest] = React.useState<string | null>(null);
  const [level, setLevel] = React.useState<string | null>(null);

  const suggestion = React.useMemo(() => {
    if (!interest) return null;
    const opt = INTEREST_OPTIONS.find((o) => o.key === interest);
    if (!opt) return null;
    const matched = courses
      .filter((c) => {
        const hay = `${c.name} ${c.short_description ?? ""}`.toLowerCase();
        return opt.match.some((m) => hay.includes(m));
      })
      .slice(0, 3);
    return matched.length ? matched : courses.slice(0, 2);
  }, [interest, courses]);

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
        <div className="mb-5">
          <p className="text-caption uppercase tracking-wider">Step 01</p>
          <h3 className="mt-1 font-display text-lg font-semibold">What sounds most interesting?</h3>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {INTEREST_OPTIONS.map((opt) => {
            const active = interest === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setInterest(opt.key)}
                className={cn(
                  "text-left rounded-lg border px-4 py-3 text-sm transition-all duration-200",
                  "hover:-translate-y-[2px] hover:shadow-sm",
                  active
                    ? "border-transparent bg-primary/5 text-foreground shadow-sm"
                    : "border-border text-muted-foreground",
                )}
                style={active ? { borderColor: categoryTheme.ring } : undefined}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          <p className="text-caption uppercase tracking-wider">Step 02</p>
          <h3 className="mt-1 font-display text-lg font-semibold">How would you describe your level?</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {LEVEL_OPTIONS.map((lv) => (
              <button
                key={lv}
                type="button"
                onClick={() => setLevel(lv)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition-all",
                  level === lv
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-border-strong",
                )}
              >
                {lv}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        className="relative overflow-hidden rounded-2xl border border-border p-6 md:p-8"
        style={{
          background: `radial-gradient(80% 80% at 100% 0%, ${categoryTheme.from}, transparent 60%), var(--card)`,
        }}
      >
        <div className="flex items-center gap-2">
          <Compass className="size-4" style={{ color: categoryTheme.ring }} />
          <p className="text-caption uppercase tracking-wider">Suggested direction</p>
        </div>

        {!suggestion || !interest ? (
          <div className="mt-6 py-16 text-center text-muted-foreground text-sm">
            Select an interest to see a suggested program direction.
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              Based on <span className="text-foreground font-medium">
                {INTEREST_OPTIONS.find((o) => o.key === interest)?.label}
              </span>
              {level ? <> · <span className="text-foreground">{level}</span></> : null}
            </p>
            <ul className="mt-5 space-y-3">
              {suggestion.map((c, i) => (
                <li key={c.id}>
                  <Link
                    to="/programs/$category/$course"
                    params={{ category: c.category.slug, course: c.slug }}
                    className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-all hover:-translate-y-[2px] hover:shadow-md hover:border-border-strong"
                  >
                    <span
                      className="grid size-8 place-items-center rounded-full text-mono text-xs font-semibold shrink-0"
                      style={{ backgroundColor: `${categoryTheme.ring}`, color: "white" }}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{c.name}</div>
                      <div className="text-caption text-muted-foreground truncate">
                        {c.level ?? "All levels"} · {c.offer_price != null || c.base_price != null ? `From ${formatPrice(c.offer_price ?? c.base_price ?? 0, c.currency ?? "INR")}` : "See details"}
                      </div>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-caption text-muted-foreground">
              This is educational guidance, not a career guarantee. Results are not saved.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* --- All Programs (filter + search + view) --- */
function AllPrograms({ courses, isLoading }: { courses: ProgramCardData[]; isLoading: boolean }) {
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | "Beginner" | "Intermediate" | "Advanced" | "featured">("all");
  const [view, setView] = React.useState<"grid" | "compact">("grid");

  const filtered = React.useMemo(() => {
    const query = q.trim().toLowerCase();
    return courses.filter((c) => {
      if (filter === "featured" && !c.is_featured) return false;
      if (filter !== "all" && filter !== "featured" && c.level !== filter) return false;
      if (query) {
        const hay = `${c.name} ${c.short_description ?? ""}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [courses, q, filter]);

  const filters: Array<{ key: typeof filter; label: string }> = [
    { key: "all", label: "All" },
    { key: "Beginner", label: "Beginner" },
    { key: "Intermediate", label: "Intermediate" },
    { key: "Advanced", label: "Advanced" },
    { key: "featured", label: "Featured" },
  ];

  return (
    <>
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-heading-xl md:text-3xl font-display font-semibold">All Programs</h2>
          <p className="mt-2 text-caption">
            {isLoading ? "Loading programs…" : `${filtered.length} of ${courses.length} program${courses.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-border p-1 bg-card">
          <button
            type="button"
            aria-label="Grid view"
            onClick={() => setView("grid")}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Compact view"
            onClick={() => setView("compact")}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              view === "compact" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            <Rows3 className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search programs in this category"
            className="pl-10 h-11"
            aria-label="Search programs"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm transition-all duration-200",
                filter === f.key
                  ? "border-primary bg-primary text-primary-foreground -translate-y-[1px] shadow-sm"
                  : "border-border text-muted-foreground hover:border-border-strong",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div
        key={`${filter}-${q}-${view}`}
        className={cn(
          "mt-8 grid gap-5 transition-opacity duration-300 animate-fade-in",
          view === "grid"
            ? "sm:grid-cols-2 lg:grid-cols-3"
            : "sm:grid-cols-2 lg:grid-cols-4",
        )}
      >
        {filtered.map((c, i) => (
          <ProgramCard key={c.id} course={c} index={i} compact={view === "compact"} />
        ))}
      </div>
      {!isLoading && filtered.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
          No programs match those filters. Try clearing the search.
        </div>
      ) : null}
    </>
  );
}

/* --- Comparison Explorer --- */
function ComparisonExplorer({
  courses,
  categoryTheme,
}: {
  courses: ProgramCardData[];
  categoryTheme: (typeof CATEGORY_THEME)[keyof typeof CATEGORY_THEME];
}) {
  const [selected, setSelected] = React.useState<string[]>([]);
  const toggle = (id: string) => {
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : s.length >= 3 ? s : [...s, id],
    );
  };
  const clear = () => setSelected([]);
  const items = selected.map((id) => courses.find((c) => c.id === id)).filter(Boolean) as ProgramCardData[];

  return (
    <div className="mt-8">
      <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
        <p className="text-caption uppercase tracking-wider">Pick up to three programs</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {courses.map((c) => {
            const active = selected.includes(c.id);
            const disabled = !active && selected.length >= 3;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggle(c.id)}
                disabled={disabled}
                aria-pressed={active}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm transition-all",
                  active
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-border-strong disabled:opacity-40",
                )}
                style={active ? { backgroundColor: categoryTheme.ring, color: "white" } : undefined}
              >
                {c.name}
              </button>
            );
          })}
        </div>
        {selected.length > 0 ? (
          <button
            type="button"
            onClick={clear}
            className="mt-3 inline-flex items-center gap-1 text-caption text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" /> Clear comparison
          </button>
        ) : null}
      </div>

      {items.length > 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => {
            const price = c.offer_price ?? c.base_price;
            return (
              <div key={c.id} className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-display text-base font-semibold leading-snug">{c.name}</h4>
                  <button
                    type="button"
                    onClick={() => toggle(c.id)}
                    aria-label={`Remove ${c.name}`}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <dl className="text-sm space-y-2">
                  <Row label="Level" value={c.level ?? "—"} />
                  <Row label="Focus" value={c.short_description ?? "—"} clamp />
                  <Row
                    label="Starting price"
                    value={price != null ? formatPrice(price, c.currency ?? "INR") : "—"}
                  />
                  <Row label="Featured" value={c.is_featured ? "Yes" : "No"} />
                </dl>
                <Button asChild variant="outline" size="sm" className="mt-auto">
                  <Link to="/programs/$category/$course" params={{ category: c.category.slug, course: c.slug }}>
                    View program
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, value, clamp = false }: { label: string; value: string; clamp?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-caption text-muted-foreground shrink-0">{label}</dt>
      <dd className={cn("text-right", clamp && "line-clamp-2")}>{value}</dd>
    </div>
  );
}

/* --- Learning Journey --- */
const JOURNEY_STAGES = [
  "Choose a field",
  "Explore program areas",
  "Understand program focus",
  "Compare directions",
  "Select a program",
  "Explore program details",
  "Start the enrollment journey",
];

function LearningJourney({ theme }: { theme: (typeof CATEGORY_THEME)[keyof typeof CATEGORY_THEME] }) {
  return (
    <ol className="mt-8 relative grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {JOURNEY_STAGES.map((stage, i) => (
        <li
          key={stage}
          className="relative rounded-xl border border-border bg-card p-5 transition-transform hover:-translate-y-[2px]"
        >
          <span
            className="text-mono text-xs font-semibold"
            style={{ color: theme.ring }}
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <p className="mt-2 font-display text-base font-semibold leading-snug">{stage}</p>
        </li>
      ))}
    </ol>
  );
}

/* --- Who is this for --- */
const AUDIENCE = [
  { label: "I am starting out", icon: Sparkles, note: "Explore Beginner programs and the guided Skill Path Explorer." },
  { label: "I am a college student", icon: Users, note: "Compare directions and pick programs that build practical portfolios." },
  { label: "I want to build practical skills", icon: Wrench, note: "Start with Intermediate programs that emphasize applied work." },
  { label: "I want to explore a new area", icon: Compass, note: "Preview each program's focus before starting an enrollment journey." },
];

function WhoItIsFor({ categoryName, courses }: { categoryName: string; courses: ProgramCardData[] }) {
  const [active, setActive] = React.useState<number | null>(null);
  const suggestion = active != null
    ? active === 0
      ? courses.find((c) => c.level === "Beginner") ?? courses[0]
      : active === 2
      ? courses.find((c) => c.level === "Intermediate") ?? courses[0]
      : courses[0]
    : null;

  return (
    <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      {AUDIENCE.map((a, i) => {
        const isActive = active === i;
        const Icon = a.icon;
        return (
          <button
            key={a.label}
            type="button"
            onClick={() => setActive(isActive ? null : i)}
            aria-pressed={isActive}
            className={cn(
              "text-left rounded-2xl border p-5 transition-all duration-300 group",
              "hover:-translate-y-[3px] hover:shadow-md",
              isActive ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card",
            )}
          >
            <Icon className="size-5 text-primary" />
            <p className="mt-3 font-display text-base font-semibold leading-snug">{a.label}</p>
            <p className="mt-2 text-caption text-muted-foreground">{a.note}</p>
            {isActive && suggestion ? (
              <div className="mt-4 pt-4 border-t border-border/70">
                <p className="text-caption uppercase tracking-wider">Try exploring</p>
                <p className="mt-1 text-sm font-medium">{suggestion.name}</p>
                <Link
                  to="/programs/$category/$course"
                  params={{ category: suggestion.category.slug, course: suggestion.slug }}
                  className="mt-2 inline-flex items-center gap-1 text-sm text-primary"
                >
                  Open program <ArrowRight className="size-3.5" />
                </Link>
              </div>
            ) : null}
          </button>
        );
      })}
      <p className="sr-only">Exploring {categoryName}</p>
    </div>
  );
}

/* --- FAQ --- */
function CategoryFAQ({ categoryName }: { categoryName: string }) {
  const faqs = [
    { q: `Which ${categoryName} program should I explore first?`, a: `Start with the featured programs above, or use the Skill Path Explorer to see a suggested direction based on what interests you.` },
    { q: "How do I compare Glintr programs?", a: "Use the Compare Program Directions section on this page. Pick up to three programs from this category to see their level, focus, and starting price side by side." },
    { q: "Can I view program details before starting an enrollment journey?", a: "Yes. Every program has its own detail page with modules, projects, skills, and pricing. You can also request a counsellor if you need help choosing." },
    { q: "Do you save what I explore?", a: "The Skill Path Explorer and Comparison Explorer are entirely session-based. Nothing is stored to your account when you're just exploring." },
    { q: "Are prices shown on Glintr accurate?", a: "Yes — the price on each program card reflects the current offer price for that program. Any EMI or scholarship information is shown on the program's detail page." },
  ];
  const [open, setOpen] = React.useState<number | null>(0);
  return (
    <ul className="mt-8 space-y-3">
      {faqs.map((f, i) => {
        const active = open === i;
        return (
          <li key={f.q}>
            <button
              type="button"
              onClick={() => setOpen(active ? null : i)}
              aria-expanded={active}
              className={cn(
                "w-full text-left rounded-xl border border-border bg-card px-5 py-4 transition-all",
                "hover:border-border-strong",
                active && "-translate-y-[2px] shadow-sm border-border-strong",
              )}
            >
              <div className="flex items-center justify-between gap-4">
                <span className="font-medium">{f.q}</span>
                <ChevronDown className={cn("size-4 shrink-0 transition-transform", active && "rotate-180")} />
              </div>
              <div
                className={cn(
                  "grid transition-[grid-template-rows] duration-300 ease-out",
                  active ? "grid-rows-[1fr] mt-3" : "grid-rows-[0fr]",
                )}
              >
                <div className="overflow-hidden text-sm text-muted-foreground">
                  {f.a}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function NotFoundState() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-[60vh] grid place-items-center">
        <div className="text-center max-w-md">
          <h1 className="text-heading-xl font-display font-semibold">Category not found</h1>
          <p className="mt-3 text-muted-foreground">This category isn't published yet.</p>
          <Button asChild className="mt-6"><Link to="/programs">Back to programs</Link></Button>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
