import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { EmptyState, LoadingSkeleton } from "@/components/shared/empty-state";
import { fetchFeaturedCategories } from "@/data/cms";

export function CategoriesSection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["home", "categories"],
    queryFn: fetchFeaturedCategories,
  });

  return (
    <Section id="programs" padding="md">
      <Container>
        <SectionHeader
          eyebrow="Career-focused programs"
          title={
            <>
              Sell skills that <span className="text-gradient-brand">build careers.</span>
            </>
          }
          description="Explore programs across technology, engineering and management — all managed dynamically from the CMS."
        />

        {isLoading ? (
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <LoadingSkeleton />
            <LoadingSkeleton />
          </div>
        ) : error || !data || data.length === 0 ? (
          <div className="mt-12">
            <EmptyState
              title="No categories published yet"
              description="Approved categories will appear here as soon as they're published in the CMS."
            />
          </div>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {data.map((c) => (
              <article
                key={c.slug}
                className="card-elevated hover-lift p-6 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-12 place-items-center rounded-xl bg-primary-soft text-primary">
                      <c.icon className="size-5" />
                    </span>
                    <div>
                      <h3 className="font-display text-xl font-semibold">{c.name}</h3>
                      <p className="text-caption">{c.courseCount} programs</p>
                    </div>
                  </div>
                </div>
                <p className="text-caption text-pretty">{c.description}</p>
                <ul className="flex flex-wrap gap-2">
                  {c.topics.map((t) => (
                    <li
                      key={t}
                      className="text-xs px-2.5 py-1 rounded-full border border-border bg-surface-2/50 text-foreground/80"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-2">
                  <Button variant="outline" size="md" asChild className="w-full sm:w-auto">
                    <a href={`/programs/${c.slug}`}>
                      Explore {c.name} <ArrowRight className="size-4" />
                    </a>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}
