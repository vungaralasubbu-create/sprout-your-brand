import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import {
  fetchFeaturedCategories,
  FALLBACK_CATEGORIES,
  type CourseCategory,
} from "@/data/cms";

export function CategoriesSection() {
  const categoriesQuery = useQuery({
    queryKey: ["home", "featured-categories"],
    queryFn: fetchFeaturedCategories,
    initialData: FALLBACK_CATEGORIES,
  });

  const categories = (categoriesQuery.data && categoriesQuery.data.length > 0
    ? categoriesQuery.data
    : FALLBACK_CATEGORIES
  ).slice(0, 4);

  return (
    <Section id="programs" tone="default" padding="lg">
      <Container>
        <SectionHeader
          eyebrow="Programs"
          title={<>Career Programs People Want To Learn</>}
          description="Focused, career-outcome programs across four core disciplines."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {categories.map((c) => (
            <CategoryCard key={c.slug} category={c} />
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Button variant="outline" size="lg" asChild>
            <a href="/categories">
              Explore All Programs <ArrowRight className="size-4" />
            </a>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

function CategoryCard({ category }: { category: CourseCategory }) {
  const Icon = category.icon;
  const sample = category.topics.slice(0, 3);
  return (
    <article className="group flex flex-col rounded-2xl border border-border bg-card p-7 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-12 place-items-center rounded-xl bg-primary-soft text-primary">
          <Icon className="size-5" />
        </span>
        <span className="text-caption">{category.courseCount} programs</span>
      </div>
      <h3 className="mt-5 font-display text-xl font-semibold tracking-tight text-foreground">
        {category.name}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {category.description}
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
