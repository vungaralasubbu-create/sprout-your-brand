import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  ShieldCheck,
  Wallet,
  Workflow,
} from "lucide-react";

import { Section, Container, SectionHeader } from "@/components/shared/section";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/payout-system")({
  head: () => ({
    meta: [
      { title: "Glintr Payout System — From Eligible Revenue To Partner Payout" },
      {
        name: "description",
        content:
          "Understand how eligible Partner revenue moves through the Glintr revenue and payout process — attribution, verification, eligibility, and payout status.",
      },
      { property: "og:title", content: "Glintr Payout System" },
      {
        property: "og:description",
        content:
          "How eligible Partner revenue moves through Glintr's transparent revenue and payout process.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://glintr.com/payout-system" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://glintr.com/payout-system" }],
  }),
  component: PayoutSystemPage,
});

const JOURNEY = [
  {
    icon: FileSearch,
    title: "Eligible Revenue Identified",
    body: "Verified enrollments and payments contribute to eligible revenue based on program rules.",
  },
  {
    icon: BadgeCheck,
    title: "Partner Attribution Verified",
    body: "Each enrollment is attributed to the correct Partner using approved attribution rules.",
  },
  {
    icon: Workflow,
    title: "Revenue Share Calculated",
    body: "Your share is computed using your Partner model — 70% Revenue Model or 50% Supported Model.",
  },
  {
    icon: ClipboardCheck,
    title: "Applicable Adjustments Processed",
    body: "Refunds, chargebacks, and policy adjustments are applied where applicable before payout.",
  },
  {
    icon: CheckCircle2,
    title: "Payout Eligibility Confirmed",
    body: "Payout profile, KYC, and threshold checks are confirmed before a payout is scheduled.",
  },
  {
    icon: Workflow,
    title: "Payout Enters Approved Workflow",
    body: "Eligible payouts move into Glintr's approved payout workflow for processing.",
  },
  {
    icon: ClipboardCheck,
    title: "Payout Status Updated",
    body: "Your Partner Dashboard reflects the current payout status at each step.",
  },
  {
    icon: Wallet,
    title: "Partner Receives Applicable Payout",
    body: "Approved payouts are disbursed to your verified payout profile per applicable timelines.",
  },
];

const STATUSES: { label: string; body: string }[] = [
  { label: "Revenue Recorded", body: "Eligible revenue attributed to the Partner is recorded." },
  { label: "Under Review", body: "Attribution and eligibility checks are in progress." },
  { label: "Eligible For Payout", body: "Revenue has cleared review and is queued for payout." },
  { label: "Payout Processing", body: "Payout is moving through the approved workflow." },
  { label: "Paid", body: "Payout has been disbursed to the verified payout profile." },
  {
    label: "Adjustment Required",
    body: "A refund, chargeback, or policy adjustment applies and is being processed.",
  },
];

const FAQS = [
  {
    q: "When does revenue become eligible for payout?",
    a: "Revenue becomes eligible once the enrollment is verified, attribution is confirmed, and applicable review checks are complete.",
  },
  {
    q: "How do I see my payout status?",
    a: "Your Partner Dashboard shows the current status for each eligible revenue event and payout.",
  },
  {
    q: "Are payouts guaranteed on a specific day?",
    a: "Payouts follow Glintr's approved payout workflow. Timelines depend on verification, eligibility, and applicable policies.",
  },
  {
    q: "What can cause an adjustment?",
    a: "Refunds, chargebacks, cancellations, or policy adjustments applied to the underlying enrollment can result in an adjustment.",
  },
];

function PayoutSystemPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <Section >
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="muted" className="mb-4">
                Glintr Payout System
              </Badge>
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                From Eligible Revenue To Partner Payout
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Understand how eligible Partner revenue moves through the Glintr revenue and
                payout process.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button asChild>
                  <Link to="/earn">
                    Become A Partner <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/income-calculator">Income Calculator</Link>
                </Button>
              </div>
            </div>
          </Container>
        </Section>

        {/* How Payouts Work / Journey */}
        <Section >
          <Container>
            <SectionHeader
              eyebrow="How Payouts Work"
              title="Revenue To Payout Journey"
              description="Every eligible Partner payout moves through this transparent process."
              align="center"
            />
            <ol className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-2">
              {JOURNEY.map((step, i) => {
                const Icon = step.icon;
                return (
                  <li key={step.title}>
                    <Card className="h-full lift-card">
                      <CardContent className="flex gap-4 p-6">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" aria-hidden />
                        </div>
                        <div>
                          <div className="text-caption text-muted-foreground">
                            Step {i + 1}
                          </div>
                          <h3 className="text-lg font-semibold">{step.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                );
              })}
            </ol>
          </Container>
        </Section>

        {/* Payout Status Explanation */}
        <Section className="bg-muted/30">
          <Container>
            <SectionHeader
              eyebrow="Payout Status Explanation"
              title="What Each Status Means"
              description="A conceptual view of the states your eligible revenue moves through."
              align="center"
            />
            <div className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-2 lg:grid-cols-3">
              {STATUSES.map((s) => (
                <Card key={s.label}>
                  <CardContent className="p-6">
                    <div className="text-sm font-semibold">{s.label}</div>
                    <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Container>
        </Section>

        {/* Payout Safety */}
        <Section >
          <Container>
            <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
              <SafetyCard
                icon={ShieldCheck}
                title="Verified Attribution"
                body="Payouts are tied to verified enrollments and approved attribution rules."
              />
              <SafetyCard
                icon={ClipboardCheck}
                title="Reviewed Eligibility"
                body="Eligibility checks run before payouts enter the approved workflow."
              />
              <SafetyCard
                icon={Wallet}
                title="Secure Disbursement"
                body="Approved payouts are disbursed to your verified payout profile only."
              />
            </div>
          </Container>
        </Section>

        {/* Partner Dashboard Connection */}
        <Section className="bg-muted/30">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <SectionHeader
                eyebrow="Partner Dashboard"
                title="Track Your Payouts In One Place"
                description="Approved Partners see eligible revenue, payout status, and history inside the Partner Dashboard."
                align="center"
              />
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button asChild>
                  <Link to="/earn">
                    Become A Partner <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/70-revenue-model">70% Revenue Model</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/50-supported-model">50% Supported Model</Link>
                </Button>
              </div>
            </div>
          </Container>
        </Section>

        {/* FAQs */}
        <Section >
          <Container>
            <SectionHeader
              eyebrow="FAQs"
              title="Payout Questions"
              align="center"
            />
            <div className="mx-auto mt-10 max-w-3xl space-y-4">
              {FAQS.map((f) => (
                <Card key={f.q}>
                  <CardContent className="p-6">
                    <div className="font-semibold">{f.q}</div>
                    <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Container>
        </Section>

        {/* Final CTA */}
        <Section className="bg-muted/30">
          <Container>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight">
                Ready to earn with Glintr?
              </h2>
              <p className="mt-3 text-muted-foreground">
                Choose the model that fits how you sell and start your Partner journey.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button asChild>
                  <Link to="/earn">
                    Become A Partner <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/income-calculator">Income Calculator</Link>
                </Button>
              </div>
            </div>
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}

function SafetyCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <Card className="lift-card">
      <CardContent className="p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <h3 className="mt-4 text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}
