import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, Filter } from "lucide-react";

import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/section";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listCategories, listCourses, formatPrice } from "@/lib/programs";

export const Route = createFileRoute("/programs/")({
  head: () => ({
    meta: [
      { title: "Career Programs — Glintr" },
      { name: "description", content: "Explore Glintr's premium career programs across Computer Science, Electronics, Mechanical, and Management. Search, filter, and apply." },
      { property: "og:title", content: "Career Programs — Glintr" },
      { property: "og:description", content: "Discover future-ready programs designed to launch, sell, and grow your career." },
    ],
  }),
  component: ProgramsIndex,
});

function ProgramsIndex() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [level, setLevel] = useState<string>("all");

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const { data: courses = [] } = useQuery({
    queryKey: ["courses", { category, level, search }],
    queryFn: () =>
      listCourses({
        category: category === "all" ? undefined : category,
        level: level === "all" ? undefined : level,
        search: search || undefined,
      }),
  });

  const filtered = useMemo(() => courses, [courses]);

  return (
    <>
      <SiteHeader />
      <main>
        <Section className="pt-16 pb-8 bg-gradient-to-b from-primary/5 to-transparent">
          <Container>
            <div className="max-w-3xl">
              <Badge variant="outline" className="mb-4">Programs</Badge>
              <h1 className="text-display-md font-display font-semibold tracking-tight text-balance">
                Career programs built to launch, sell, and grow.
              </h1>
              <p className="mt-4 text-body-lg text-muted-foreground">
                Explore future-ready programs across technology, engineering, and business. Learn practical skills, earn as a partner, or launch your own brand.
              </p>
            </div>
          </Container>
        </Section>

        <Section className="py-8 border-y border-border/50 bg-surface-2/30">
          <Container>
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by program, skill, or role"
                  className="pl-10 h-11"
                />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="md:w-56 h-11">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="md:w-44 h-11">
                  <SelectValue placeholder="Any level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any level</SelectItem>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Container>
        </Section>

        <Section className="py-12">
          <Container>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-caption">{filtered.length} program{filtered.length === 1 ? "" : "s"}</p>
              <div className="flex items-center gap-2 text-caption">
                <Filter className="size-3.5" /> Sorted by featured
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c: any) => (
                <Link
                  key={c.id}
                  to="/programs/$category/$course"
                  params={{ category: c.category.slug, course: c.slug }}
                  className="card-elevated hover:card-elevated-hover group p-6 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[11px]">{c.category.name}</Badge>
                    {c.is_featured ? <Badge variant="certified" className="text-[11px]">Featured</Badge> : null}
                  </div>
                  <h3 className="font-display text-lg font-semibold leading-snug">{c.name}</h3>
                  <p className="text-body text-muted-foreground line-clamp-2">{c.short_description}</p>
                  <div className="mt-auto pt-4 flex items-end justify-between border-t border-border">
                    <div>
                      <div className="text-caption">Starts from</div>
                      <div className="text-mono font-semibold text-foreground">{formatPrice(c.offer_price ?? c.base_price, c.currency)}</div>
                    </div>
                    <div className="text-right text-caption">
                      <div>{c.duration}</div>
                      <div>{c.level}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
