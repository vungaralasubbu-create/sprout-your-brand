import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";

import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container } from "@/components/shared/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listCategories, listCourses } from "@/lib/programs";
import { CategoryVisual, slugToVariant, CATEGORY_THEME } from "@/components/programs/category-visuals";
import { ProgramCard } from "@/components/programs/program-card";
import { cn } from "@/lib/utils";

const SITE_URL = "https://glintr.com";

export const Route = createFileRoute("/programs/")({
  head: () => {
    const canonical = `${SITE_URL}/programs`;
    const title = "Program Universe | Glintr";
    const description =
      "Explore Glintr's career-focused programs across Computer Science, Electronics & Electrical, Mechanical Engineering, and Management.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonical },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  component: ProgramsIndex,
});

function ProgramsIndex() {
  const { data: categories = [], isLoading } = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const { data: allCourses = [] } = useQuery({ queryKey: ["courses", "all"], queryFn: () => listCourses({}) });

  const countByCat = React.useMemo(() => {
    const map = new Map<string, number>();
    allCourses.forEach((c: any) => {
      map.set(c.category.slug, (map.get(c.category.slug) ?? 0) + 1);
    });
    return map;
  }, [allCourses]);

  const featuredByCat = React.useMemo(() => {
    const map = new Map<string, any[]>();
    allCourses.forEach((c: any) => {
      const arr = map.get(c.category.slug) ?? [];
      if (arr.length < 3) arr.push(c);
      map.set(c.category.slug, arr);
    });
    return map;
  }, [allCourses]);

  const [hoveredIndex, setHoveredIndex] = React.useState<string | null>(null);

  // Rhythm mapping: large / medium / medium / large
  const rhythm = ["large", "medium", "medium", "large"] as const;

  return (
    <>
      <SiteHeader />
      <main>
        {/* Intro */}
        <Section className="pt-16 pb-10 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-brand-soft opacity-30" />
          <Container>
            <div className="max-w-3xl">
              <p className="text-[11px] uppercase tracking-[0.22em] font-medium text-primary mb-4 inline-flex items-center gap-2">
                <Sparkles className="size-3.5" /> Explore Glintr Programs
              </p>
              <h1 className="text-display-md font-display font-semibold tracking-tight text-balance">
                Choose the field you want to build in.
              </h1>
              <p className="mt-5 text-body-lg text-muted-foreground max-w-2xl">
                Explore focused learning paths across technology, engineering, and management —
                each with its own graphic language, curriculum depth, and career direction.
              </p>
            </div>
          </Container>
        </Section>

        {/* Category Index Bar */}
        <Section className="pt-2 pb-6">
          <Container>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {categories.map((cat, i) => {
                const active = hoveredIndex === cat.slug;
                const theme = CATEGORY_THEME[slugToVariant(cat.slug)];
                return (
                  <a
                    key={cat.slug}
                    href={`#cat-${cat.slug}`}
                    onMouseEnter={() => setHoveredIndex(cat.slug)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onFocus={() => setHoveredIndex(cat.slug)}
                    onBlur={() => setHoveredIndex(null)}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg border border-border/70 px-3 py-2.5 transition-all duration-300",
                      "hover:border-border-strong hover:-translate-y-[2px] hover:shadow-sm",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active && "border-border-strong shadow-sm",
                    )}
                  >
                    <span
                      className="text-mono text-xs text-muted-foreground shrink-0"
                      style={{ color: active ? theme.ring : undefined }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm font-medium truncate">{cat.name}</span>
                    <ArrowUpRight className="ml-auto size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                );
              })}
            </div>
          </Container>
        </Section>

        {/* Asymmetric Category Panels */}
        <Section className="pt-4 pb-20">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-5 md:gap-6 auto-rows-fr">
              {categories.map((cat, i) => {
                const size = rhythm[i % rhythm.length];
                const isFeatured = size === "large";
                const featured = featuredByCat.get(cat.slug) ?? [];
                const count = countByCat.get(cat.slug) ?? 0;
                const theme = CATEGORY_THEME[slugToVariant(cat.slug)];
                const active = hoveredIndex === cat.slug;
                return (
                  <Link
                    to="/programs/$category"
                    params={{ category: cat.slug }}
                    key={cat.slug}
                    id={`cat-${cat.slug}`}
                    onMouseEnter={() => setHoveredIndex(cat.slug)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onFocus={() => setHoveredIndex(cat.slug)}
                    onBlur={() => setHoveredIndex(null)}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl border border-border bg-card",
                      "transition-[transform,box-shadow,border-color] duration-500 ease-out",
                      "hover:-translate-y-[3px] hover:shadow-xl hover:border-border-strong",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      "active:translate-y-0",
                      isFeatured ? "lg:col-span-4" : "lg:col-span-2",
                      isFeatured ? "min-h-[440px]" : "min-h-[380px]",
                      active && "shadow-xl border-border-strong",
                    )}
                    style={{
                      boxShadow: active ? `0 20px 60px -30px ${theme.ring}` : undefined,
                    }}
                  >
                    {/* Visual layer */}
                    <CategoryVisual
                      slug={cat.slug}
                      className={cn(
                        "absolute inset-0 transition-opacity duration-500",
                        "opacity-90 group-hover:opacity-100",
                      )}
                    />
                    {/* Fade for legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/85 to-transparent" />

                    <div className="relative z-10 flex flex-col h-full p-6 md:p-8">
                      <div className="flex items-center gap-2 mb-auto">
                        <span
                          className="text-mono text-xs"
                          style={{ color: theme.ring }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                          {theme.label}
                        </Badge>
                        <span className="ml-auto text-caption">
                          {count} {count === 1 ? "Program" : "Programs"}
                        </span>
                      </div>

                      <div className="mt-8">
                        <h2 className={cn(
                          "font-display font-semibold tracking-tight",
                          isFeatured ? "text-3xl md:text-4xl" : "text-2xl md:text-3xl",
                        )}>
                          {cat.name}
                        </h2>
                        <p className="mt-3 text-body text-muted-foreground max-w-lg line-clamp-3">
                          {cat.short_description ?? cat.full_description}
                        </p>

                        {featured.length > 0 ? (
                          <ul className="mt-5 flex flex-wrap gap-1.5">
                            {featured.slice(0, isFeatured ? 3 : 2).map((c: any) => (
                              <li
                                key={c.id}
                                className="rounded-full border border-border/70 bg-card/80 px-3 py-1 text-caption backdrop-blur-sm"
                              >
                                {c.name}
                              </li>
                            ))}
                          </ul>
                        ) : null}

                        <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium">
                          <span>Explore {cat.name}</span>
                          <ArrowRight
                            className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
              {isLoading && categories.length === 0 ? (
                <div className="lg:col-span-6 h-64 rounded-2xl border border-border animate-pulse bg-surface-2/40" />
              ) : null}
            </div>
          </Container>
        </Section>

        {/* Discovery CTA */}
        <Section className="py-16 bg-surface-2/40 border-y border-border/60">
          <Container className="text-center max-w-2xl">
            <h2 className="text-heading-xl font-display font-semibold">Not sure which field fits you?</h2>
            <p className="mt-3 text-muted-foreground">
              Open any category to explore the Skill Path Explorer, compare directions, and
              discover programs matched to your interests — no login required.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="gradient">
                <Link to="/programs/$category" params={{ category: categories[0]?.slug ?? "computer-science" }}>
                  Start with a category
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/faqs">Read program FAQs</Link>
              </Button>
            </div>
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
