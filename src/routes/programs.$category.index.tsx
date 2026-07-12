import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronRight } from "lucide-react";

import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container } from "@/components/shared/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCategoryBySlug, listCourses, formatPrice } from "@/lib/programs";

export const Route = createFileRoute("/programs/$category/")({
  head: ({ params }) => ({
    meta: [
      { title: `${prettify(params.category)} Programs — Glintr` },
      { name: "description", content: `Explore Glintr programs in ${prettify(params.category)}.` },
      { property: "og:title", content: `${prettify(params.category)} Programs — Glintr` },
    ],
  }),
  component: CategoryPage,
  notFoundComponent: () => <NotFoundState />,
  errorComponent: ({ error }) => <div className="p-10 text-center">Failed to load: {String(error)}</div>,
});

function prettify(slug: string) {
  return slug.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
}

function CategoryPage() {
  const { category: slug } = Route.useParams();
  const { data: category } = useQuery({ queryKey: ["category", slug], queryFn: () => getCategoryBySlug(slug) });
  const { data: courses = [] } = useQuery({
    queryKey: ["courses", "cat", category?.id ?? slug],
    queryFn: () => listCourses({ categoryId: category?.id }),
    enabled: Boolean(category),
  });

  if (category === null) return <NotFoundState />;

  return (
    <>
      <SiteHeader />
      <main>
        <Section className="pt-14 pb-10 bg-gradient-to-b from-primary/5 to-transparent">
          <Container>
            <nav className="text-caption mb-4 flex items-center gap-1.5">
              <Link to="/" className="hover:text-foreground">Home</Link>
              <ChevronRight className="size-3.5" />
              <Link to="/programs" className="hover:text-foreground">Programs</Link>
              <ChevronRight className="size-3.5" />
              <span className="text-foreground">{category?.name ?? prettify(slug)}</span>
            </nav>
            <div className="max-w-3xl">
              <Badge variant="outline" className="mb-4">Category</Badge>
              <h1 className="text-display-md font-display font-semibold tracking-tight text-balance">
                {category?.hero_title ?? category?.name ?? prettify(slug)}
              </h1>
              <p className="mt-4 text-body-lg text-muted-foreground">
                {category?.full_description ?? category?.short_description}
              </p>
            </div>
          </Container>
        </Section>

        <Section className="py-12">
          <Container>
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="text-heading-lg font-display font-semibold">All programs</h2>
              <span className="text-caption">{courses.length} programs</span>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((c: any) => (
                <Link
                  key={c.id}
                  to="/programs/$category/$course"
                  params={{ category: slug, course: c.slug }}
                  className="card-elevated hover:card-elevated-hover group p-6 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[11px]">{c.level}</Badge>
                    {c.is_featured ? <Badge variant="certified" className="text-[11px]">Featured</Badge> : null}
                  </div>
                  <h3 className="font-display text-lg font-semibold leading-snug">{c.name}</h3>
                  <p className="text-body text-muted-foreground line-clamp-2">{c.short_description}</p>
                  <div className="mt-auto pt-4 flex items-end justify-between border-t border-border">
                    <div>
                      <div className="text-caption">Starts from</div>
                      <div className="text-mono font-semibold">{formatPrice(c.offer_price ?? c.base_price, c.currency)}</div>
                    </div>
                    <span className="text-caption inline-flex items-center gap-1 group-hover:text-primary">View <ArrowRight className="size-3.5" /></span>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </Section>

        <Section className="py-16 bg-surface-2/40">
          <Container className="text-center max-w-2xl">
            <h2 className="text-heading-xl font-display font-semibold">Not sure where to start?</h2>
            <p className="mt-3 text-muted-foreground">Talk to a Glintr counsellor to pick the right program for your goals.</p>
            <div className="mt-6 flex justify-center gap-3">
              <Button asChild size="lg" variant="gradient"><Link to="/programs">Browse all programs</Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/earn">Earn with Glintr</Link></Button>
            </div>
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </>
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
