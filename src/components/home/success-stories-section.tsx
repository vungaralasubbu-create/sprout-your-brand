import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Quote } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { EmptyState, LoadingSkeleton } from "@/components/shared/empty-state";
import { fetchSuccessStories, type SuccessStory } from "@/data/cms";

const typeLabel: Record<SuccessStory["type"], string> = {
  partner: "Sales Partner",
  student: "Student",
  brand_owner: "Brand Owner",
  career_transition: "Career Transition",
};

export function SuccessStoriesSection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["home", "stories"],
    queryFn: fetchSuccessStories,
  });

  return (
    <Section padding="md">
      <Container>
        <SectionHeader
          eyebrow="Success stories"
          title={
            <>
              Real journeys.{" "}
              <span className="text-gradient-brand">Verified in the CMS.</span>
            </>
          }
          description="Only stories marked verified by an admin appear on the live site. Development mode may show placeholder content."
        />

        {isLoading ? (
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <LoadingSkeleton key={i} />
            ))}
          </div>
        ) : error || !data || data.length === 0 ? (
          <div className="mt-12">
            <EmptyState
              title="No verified stories yet"
              description="Verified success stories will appear here as they're published."
            />
          </div>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {data.map((s) => (
              <article key={s.id} className="card-elevated hover-lift p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Badge variant="certified">{typeLabel[s.type]}</Badge>
                  {s.verified ? (
                    <span className="inline-flex items-center gap-1 text-caption text-brand-lime">
                      <BadgeCheck className="size-3.5" /> Verified
                    </span>
                  ) : null}
                </div>
                <Quote className="size-5 text-primary/60" />
                <p className="text-sm text-pretty">"{s.quote}"</p>
                <div className="mt-auto border-t border-border pt-4">
                  <p className="font-semibold text-sm">{s.name}</p>
                  <p className="text-caption">{s.role}</p>
                  <dl className="mt-3 grid gap-1 text-xs">
                    <div className="flex gap-2">
                      <dt className="text-muted-foreground min-w-16">Before:</dt>
                      <dd>{s.previous}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-brand-lime min-w-16">Now:</dt>
                      <dd className="text-foreground">{s.current}</dd>
                    </div>
                  </dl>
                </div>
              </article>
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}
