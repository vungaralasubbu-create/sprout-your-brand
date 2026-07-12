import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { Container, Section, SectionHeader } from "@/components/shared/section";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { EmptyState, LoadingSkeleton } from "@/components/shared/empty-state";
import { fetchPlatformStats } from "@/data/cms";

export function LiveStatsSection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["home", "stats"],
    queryFn: fetchPlatformStats,
  });

  return (
    <Section padding="md">
      <Container>
        <SectionHeader
          eyebrow="Live platform stats"
          title={
            <>
              Real numbers, <span className="text-gradient-brand">not marketing fluff.</span>
            </>
          }
          description="Metrics are pulled from verified CMS/database records. Unverified counters are hidden until an admin approves them."
        />

        {isLoading ? (
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <LoadingSkeleton key={i} />
            ))}
          </div>
        ) : error || !data || data.length === 0 ? (
          <div className="mt-12">
            <EmptyState
              title="Metrics pending admin approval"
              description="Verified platform metrics will surface here once an admin publishes them."
            />
          </div>
        ) : (
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {data.map((s) => (
              <li key={s.key} className="card-elevated p-6 text-center">
                <p className="font-display text-4xl md:text-5xl font-bold text-gradient-brand">
                  {s.prefix}
                  <AnimatedCounter value={s.value ?? 0} />
                  {s.suffix ?? "+"}
                </p>
                <p className="text-caption mt-2">{s.label}</p>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </Section>
  );
}
