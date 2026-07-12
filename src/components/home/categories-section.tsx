import { ArrowRight, ArrowUpRight, BrainCircuit, Briefcase, Cog, Cpu } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { listCategories, listCourses, type DbCategory, type DbCourse } from "@/lib/programs";

export function CategoriesSection() {
  const { data: categories = [] } = useQuery({
    queryKey: ["home", "program-categories"],
    queryFn: listCategories,
  });
  const { data: courses = [] } = useQuery({
    queryKey: ["home", "published-programs"],
    queryFn: () => listCourses(),
  });
  const visibleCategories = categories.slice(0, 4);

  return (
    <Section id="programs" tone="default" padding="lg">
      <Container>
        <SectionHeader
          eyebrow="Programs"
          title={<>Career Programs People Want To Learn</>}
          description="Focused, career-outcome programs across four core disciplines."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {visibleCategories.map((c) => (
            <CategoryCard
              key={c.slug}
              category={c}
              courses={courses.filter((course) => course.category_id === c.id)}
            />
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Button variant="outline" size="lg" asChild>
            <a href="/programs">
              Explore All Programs <ArrowRight className="size-4" />
            </a>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

function CategoryCard({
  category,
  courses,
}: {
  category: DbCategory;
  courses: Array<DbCourse & { category: { slug: string; name: string } }>;
}) {
  const Icon = CATEGORY_ICONS[category.slug] ?? BrainCircuit;
  const sample = courses.slice(0, 3).map((course) => course.name);
  return (
    <article className="group flex flex-col rounded-2xl border border-border bg-card p-7 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-12 place-items-center rounded-xl bg-primary-soft text-primary">
          <Icon className="size-5" />
        </span>
        <span className="text-caption">{courses.length} programs</span>
      </div>
      <h3 className="mt-5 font-display text-xl font-semibold tracking-tight text-foreground">
        {category.name}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {category.short_description}
      </p>

      <ul className="mt-5 flex flex-col gap-2">
        {sample.map((t) => (
          <li key={t} className="flex items-center gap-2 text-sm">
            <span aria-hidden className="size-1.5 rounded-full bg-primary/70" />
            <span className="text-foreground/85">{t}</span>
          </li>
        ))}
      </ul>

      <a
        href={`/programs/${category.slug}`}
        className="mt-6 inline-flex w-fit items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
      >
        Explore Category <ArrowUpRight className="size-3.5" />
      </a>
    </article>
  );
}

const CATEGORY_ICONS: Record<string, typeof BrainCircuit> = {
  "computer-science": BrainCircuit,
  "electronics-electrical": Cpu,
  "mechanical-engineering": Cog,
  management: Briefcase,
};
