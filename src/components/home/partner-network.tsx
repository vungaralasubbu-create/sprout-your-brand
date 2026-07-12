import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { Container, Section, SectionHeader } from "@/components/shared/section";
import { EmptyState, LoadingSkeleton } from "@/components/shared/empty-state";
import { fetchPartnerNetwork } from "@/data/cms";

export function PartnerNetworkSection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["home", "partner-network"],
    queryFn: fetchPartnerNetwork,
  });

  return (
    <Section tone="surface" padding="md">
      <Container>
        <SectionHeader
          eyebrow="Partner network"
          title={
            <>
              One partner account.{" "}
              <span className="text-gradient-brand">Multiple opportunities.</span>
            </>
          }
          description="Sell across program sources approved in the CMS — from our core catalogue to partner institution, corporate and white-label programs."
        />

        {isLoading ? (
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3].map((i) => (
              <LoadingSkeleton key={i} />
            ))}
          </div>
        ) : error || !data || data.length === 0 ? (
          <div className="mt-12">
            <EmptyState
              title="Partner sources coming online"
              description="Approved partner sources appear here as they're activated in the CMS."
            />
          </div>
        ) : (
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((it) => (
              <li
                key={it.id}
                className="card-elevated hover-lift p-5 flex items-start gap-4"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                  <it.icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-base font-semibold">{it.title}</h3>
                  <p className="text-caption mt-1 text-pretty">{it.description}</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="text-caption text-center max-w-2xl mx-auto mt-6">
          We only display programs and partners that are active and approved in the CMS. No
          unverified institutional or accreditation claims.
        </p>
      </Container>
    </Section>
  );
}
