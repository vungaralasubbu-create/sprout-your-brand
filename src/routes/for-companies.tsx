import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Building2,
  ClipboardCheck,
  FileBarChart,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  Users,
  UserCog,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { setJourney } from "@/lib/visitor-journey";

const SITE_URL = "https://glintr.com";

export const Route = createFileRoute("/for-companies")({
  head: () => {
    const title = "Corporate Learning for Companies & Teams | Glintr";
    const description =
      "Customized training, skill assessments, compliance and leadership programs for teams. Learning dashboards, analytics, custom paths and a dedicated account manager.";
    const canonical = `${SITE_URL}/for-companies`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonical },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  component: CorporatePage,
});

interface Capability {
  title: string;
  copy: string;
  icon: LucideIcon;
}

const CAPABILITIES: Capability[] = [
  { title: "Employee Training", copy: "Structured cohorts and self-paced tracks across AI, tech, product and leadership.", icon: GraduationCap },
  { title: "Skill Assessment", copy: "Benchmark team skills before and after every program.", icon: ClipboardCheck },
  { title: "Learning Dashboard", copy: "A single dashboard for all learners, cohorts and program progress.", icon: LayoutDashboard },
  { title: "Compliance Training", copy: "InfoSec, POSH, and regulatory modules with completion audits.", icon: ShieldCheck },
  { title: "Leadership Programs", copy: "Manager, senior manager and executive-tier development paths.", icon: UserCog },
  { title: "Custom Learning Paths", copy: "Role-based paths configured to your competency framework.", icon: BookOpen },
  { title: "Analytics", copy: "Engagement, completion, skill gain and business-impact analytics.", icon: BarChart3 },
  { title: "Progress Reports", copy: "Automated weekly and monthly reports to L&D and business leaders.", icon: FileBarChart },
  { title: "Dedicated Account Manager", copy: "A single point of contact for launch, scale and success reviews.", icon: Users },
];

function CorporatePage() {
  React.useEffect(() => {
    setJourney({ id: "company" });
  }, []);

  return (
    <>
      <SiteHeader />
      <main>
        <Section className="pt-14 pb-6 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-brand-soft opacity-30" />
          <Container>
            <p className="text-[11px] uppercase tracking-[0.22em] font-medium text-primary mb-3 inline-flex items-center gap-2">
              <Building2 className="size-3.5" /> Companies & Teams
            </p>
            <h1 className="text-display-md font-display font-semibold tracking-tight text-balance max-w-3xl">
              Upskill your workforce, measure the impact.
            </h1>
            <p className="mt-4 text-body-lg text-muted-foreground max-w-2xl">
              Glintr for Business delivers custom-built training, assessments,
              compliance and leadership programs — with dashboards and
              analytics your L&D team already expects.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="gradient" size="lg">
                <Link to="/contact">Talk to sales</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/book-consultation">Book a demo</Link>
              </Button>
            </div>
          </Container>
        </Section>

        <Section className="py-14 md:py-20">
          <Container>
            <div className="grid gap-4 md:gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {CAPABILITIES.map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.title} className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-3">
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-foreground/[0.04] border border-border/70 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="font-display text-lg font-semibold">{c.title}</h3>
                    <p className="text-caption text-muted-foreground">{c.copy}</p>
                  </div>
                );
              })}
            </div>
          </Container>
        </Section>

        <Section className="py-14 md:py-20 bg-surface-2/40 border-y border-border/60">
          <Container className="text-center max-w-2xl mx-auto">
            <h2 className="text-heading-xl md:text-3xl font-display font-semibold">
              Ready to build your team's learning stack?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Get a custom proposal within 48 hours — including pricing,
              proposed programs and rollout plan.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild variant="gradient" size="lg">
                <Link to="/contact">
                  Request a proposal <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
