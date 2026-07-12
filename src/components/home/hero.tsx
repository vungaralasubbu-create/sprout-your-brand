import * as React from "react";
import {
  ArrowRight,
  BadgeCheck,
  Calculator,
  Clock,
  Rocket,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container, Section } from "@/components/shared/section";

const trustPoints = [
  { icon: TrendingUp, label: "Up to 70% Revenue Share" },
  { icon: Wallet, label: "48-Hour Payouts" },
  { icon: BadgeCheck, label: "No Joining Fee" },
  { icon: Clock, label: "Part-Time or Full-Time" },
  { icon: Rocket, label: "Own Brand Option" },
];

export function HomeHero() {
  return (
    <Section tone="mesh" padding="lg" className="overflow-hidden">
      <Container className="grid gap-12 lg:grid-cols-[1.05fr_1fr] items-center">
        <div className="flex flex-col gap-6 animate-fade-in">
          <Badge variant="soft" className="w-fit">
            <Sparkles className="size-3.5" />
            For sales professionals, freelancers & entrepreneurs
          </Badge>
          <h1 className="text-hero text-balance">
            Stop chasing impossible targets.{" "}
            <span className="text-gradient-brand">Start building your own income.</span>
          </h1>
          <p className="text-subheading text-pretty max-w-xl">
            Turn your sales skills into your biggest asset. Sell career-focused programs,
            earn up to <strong className="text-foreground">70% revenue share</strong>, receive
            payouts within <strong className="text-foreground">48 hours</strong>, or launch
            your own EdTech brand in less than 24 hours.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="gradient" size="lg" asChild>
              <a href="#income-calculator">
                <Calculator className="size-4" />
                Calculate My Earnings
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="#programs">Explore Programs</a>
            </Button>
            <Button variant="ghost" size="lg" asChild>
              <a href="#launch-brand" className="inline-flex items-center gap-2">
                Launch My Own Brand <ArrowRight className="size-4" />
              </a>
            </Button>
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 pt-2">
            {trustPoints.map((t) => (
              <li key={t.label} className="inline-flex items-center gap-2 text-caption">
                <t.icon className="size-4 text-brand-lime" />
                <span className="text-foreground/85">{t.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <HeroTransform />
      </Container>
    </Section>
  );
}

function HeroTransform() {
  return (
    <div className="relative animate-slide-left">
      <div
        aria-hidden
        className="absolute -inset-8 bg-gradient-brand opacity-20 blur-3xl rounded-[3rem]"
      />
      <div className="relative grid gap-4">
        {/* Before */}
        <article className="card-elevated p-5 border-danger/20">
          <div className="flex items-center justify-between">
            <span className="text-label text-danger">Current Job</span>
            <span className="text-caption">Employee mindset</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Metric label="Salary" value="₹18,000" tone="muted" />
            <Metric label="Monthly Target" value="₹1,00,000" tone="muted" />
            <Metric label="Pressure" value="High" tone="muted" />
            <Metric label="Incentives" value="Limited" tone="muted" />
          </div>
        </article>

        <div className="flex items-center justify-center">
          <div className="size-10 grid place-items-center rounded-full bg-gradient-brand text-primary-foreground shadow-lg animate-pulse-ring">
            <ArrowRight className="size-5 rotate-90" />
          </div>
        </div>

        {/* After */}
        <article className="card-elevated p-5 relative overflow-hidden ring-brand">
          <div
            aria-hidden
            className="absolute -top-16 -right-16 size-40 rounded-full bg-gradient-brand opacity-25 blur-2xl"
          />
          <div className="flex items-center justify-between relative">
            <span className="text-label text-primary">Your Sales. Your Income.</span>
            <Badge variant="certified">Partner</Badge>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 relative">
            <Metric label="Revenue Share" value="Up to 70%" tone="brand" />
            <Metric label="Payout" value="48 hours" tone="brand" />
            <Metric label="Work Style" value="Flexible" tone="brand" />
            <Metric label="Option" value="Own Brand" tone="brand" />
          </div>
        </article>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "muted",
}: {
  label: string;
  value: string;
  tone?: "muted" | "brand";
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-2/40 p-3">
      <p className="text-caption">{label}</p>
      <p
        className={
          tone === "brand"
            ? "text-mono text-lg font-semibold text-gradient-brand"
            : "text-mono text-lg font-semibold text-foreground/70"
        }
      >
        {value}
      </p>
    </div>
  );
}
