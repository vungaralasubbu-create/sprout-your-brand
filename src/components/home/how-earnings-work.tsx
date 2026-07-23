import * as React from "react";
import {
  BadgeCheck,
  Handshake,
  MousePointerClick,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { Timeline, type TimelineStep } from "@/components/shared/timeline";

const steps: TimelineStep[] = [
  {
    icon: Handshake,
    title: "Choose Programs",
    description: "Pick eligible programs from our catalogue that match your audience.",
  },
  {
    icon: MousePointerClick,
    title: "Share or Sell",
    description: "Use your links, calls, DMs or campaigns to bring in enrollments.",
  },
  {
    icon: BadgeCheck,
    title: "Student Completes Enrollment",
    description: "Student signs up and pays through our verified checkout.",
  },
  {
    icon: ShieldCheck,
    title: "Enrollment Is Verified",
    description: "Our team confirms the enrollment against attribution and refund rules.",
  },
  {
    icon: Wallet,
    title: "48-Hour Payout Processed",
    description: "Eligible partner earnings are released to your account within 48 hours.",
    meta: "SLA",
  },
];

export function HowEarningsWork() {
  return (
    <Section padding="md">
      <Container size="lg">
        <SectionHeader
          eyebrow="Payout workflow"
          title={
            <>
              From enrollment to <span className="text-gradient-brand">payout.</span>
            </>
          }
          description="Full visibility from the moment you share a program to the moment the payout hits your account."
        />
        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[1.1fr_1fr] items-start">
          <Timeline steps={steps} />
          <article className="card-elevated p-6 md:p-8">
            <h3 className="font-display text-xl font-semibold">
              Track everything from your dashboard
            </h3>
            <p className="text-caption mt-2 text-pretty">
              Partners can track eligible sales, verification status, commissions and payout
              history from their dashboard. Splits, taxes and refund adjustments are shown
              transparently.
            </p>
            <ul className="mt-5 grid gap-3 text-sm">
              {[
                "Live sales & attribution",
                "Verification & refund status",
                "Commission split snapshots",
                "Payout history + tax docs",
              ].map((x) => (
                <li key={x} className="flex items-center gap-2">
                  <BadgeCheck className="size-4 text-brand-lime" />
                  {x}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Button variant="gradient" size="md" asChild>
                <a href="/earn/payouts">Understand Revenue Sharing</a>
              </Button>
            </div>
          </article>
        </div>
      </Container>
    </Section>
  );
}
