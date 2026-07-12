import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Clock, Layers, Star, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { EmptyState, LoadingSkeleton } from "@/components/shared/empty-state";
import { fetchFeaturedPrograms, type Program } from "@/data/cms";

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function FeaturedProgramsSection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["home", "featured-programs"],
    queryFn: fetchFeaturedPrograms,
  });

  return (
    <Section tone="surface" padding="md">
      <Container>
        <SectionHeader
          eyebrow="Featured programs"
          title={
            <>
              Programs students actually{" "}
              <span className="text-gradient-brand">pay to complete.</span>
            </>
          }
          description="Curated by our academic team, managed via the CMS, and eligible for the partner revenue-share model."
        />

        {isLoading ? (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <LoadingSkeleton key={i} />
            ))}
          </div>
        ) : error || !data || data.length === 0 ? (
          <div className="mt-12">
            <EmptyState
              title="No featured programs yet"
              description="Featured programs published in the CMS will appear here automatically."
            />
          </div>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((p) => (
              <ProgramCard key={p.id} program={p} />
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Button variant="outline" size="lg" asChild>
            <a href="/programs">
              Browse all programs <ArrowRight className="size-4" />
            </a>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

function ProgramCard({ program: p }: { program: Program }) {
  return (
    <article className="card-elevated hover:card-elevated-hover group overflow-hidden flex flex-col">
      <div className="relative aspect-video overflow-hidden bg-gradient-brand-soft">
        <div className="absolute inset-0 grid place-items-center">
          <Layers className="size-12 text-primary/50" />
        </div>
        <div className="absolute left-3 top-3 flex gap-2">
          {p.badge ? (
            <Badge variant={p.badge.variant as never}>{p.badge.label}</Badge>
          ) : null}
          <Badge variant="soft">{p.level}</Badge>
        </div>
      </div>
      <div className="p-5 flex flex-col gap-3 flex-1">
        <p className="text-label">{p.categoryName}</p>
        <h3 className="font-display text-lg font-semibold text-balance line-clamp-2">
          {p.title}
        </h3>
        <p className="text-caption text-pretty line-clamp-2">{p.shortDescription}</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-caption">
          <li className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            {p.duration}
          </li>
          <li className="inline-flex items-center gap-1">
            <Layers className="size-3.5" />
            {p.learningMode}
          </li>
          <li className="inline-flex items-center gap-1">
            <Star className="size-3.5 fill-warning text-warning" />
            {p.rating.toFixed(1)}
          </li>
          <li className="inline-flex items-center gap-1">
            <Users className="size-3.5" />
            {p.enrollments.toLocaleString("en-IN")}
          </li>
        </ul>
        <div className="mt-auto flex items-end justify-between border-t border-border pt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-mono text-lg font-semibold">
              {INR.format(p.offerPrice ?? p.price)}
            </span>
            {p.offerPrice ? (
              <span className="text-caption line-through">{INR.format(p.price)}</span>
            ) : null}
          </div>
          {p.emiAvailable ? (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-lime">
              EMI available
            </span>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`/programs/${p.slug}`}>View Program</a>
          </Button>
          <Button variant="gradient" size="sm" asChild>
            <a href={`/programs/${p.slug}/apply`}>Apply Now</a>
          </Button>
        </div>
      </div>
    </article>
  );
}
