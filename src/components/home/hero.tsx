import * as React from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/shared/section";

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function HomeHero() {
  return (
    <Section tone="default" padding="sm" className="relative overflow-hidden">
      {/* Very soft brand wash — light-first, no crypto glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px] -z-10"
        style={{
          background:
            "radial-gradient(60% 60% at 15% 0%, oklch(0.78 0.16 175 / 0.10), transparent 60%), radial-gradient(60% 60% at 85% 10%, oklch(0.62 0.19 245 / 0.10), transparent 60%)",
        }}
      />
      <Container>
        <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-10">
          {/* Copy */}
          <div className="flex flex-col gap-5">
            <h1 className="text-hero text-balance">
              Your Sales Skills Deserve{" "}
              <span className="text-gradient-brand">Better Earnings.</span>
            </h1>
            <p className="text-subheading max-w-xl text-pretty">
              Earn up to 70% revenue share by selling career-focused programs
              — or launch your own EdTech brand.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button variant="gradient" size="lg" asChild>
                <a href="/#three-models">
                  Start Earning <ArrowRight className="size-4" />
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="/#programs">Explore Programs</a>
              </Button>
            </div>

            <ul className="flex flex-wrap gap-x-8 gap-y-2 pt-1 text-sm text-muted-foreground">
              <TrustPoint>Up to 70% Revenue Share</TrustPoint>
              <TrustPoint>48-Hour Payout Processing</TrustPoint>
              <TrustPoint>No Joining Fee</TrustPoint>
            </ul>
          </div>

          {/* Earnings card */}
          <EarningsCard />
        </div>
      </Container>
    </Section>
  );
}

function TrustPoint({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <span
        aria-hidden
        className="grid size-5 place-items-center rounded-full bg-primary-soft"
      >
        <svg
          viewBox="0 0 20 20"
          className="size-3 text-primary"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="font-medium text-foreground/85">{children}</span>
    </li>
  );
}

function EarningsCard() {
  const earnings = 105000;

  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-4 rounded-[28px] bg-gradient-brand opacity-[0.05] blur-2xl"
      />
      <article
        className="relative rounded-2xl border border-border bg-card p-4 md:p-5 shadow-sm"
        aria-label="Potential earnings preview"
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-label">Potential Earnings</span>
            <span className="text-caption mt-0.5">
              Example based on selected sales inputs
            </span>
          </div>
        </div>

        <p className="mt-3 font-display text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          {INR.format(earnings)}
        </p>

        <TrendSpark className="mt-4 h-10 w-full" />

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4 text-sm">
          <MetricCell label="Sales" value="5" />
          <MetricCell label="Avg. Program" value="₹30K" />
          <MetricCell label="Revenue Share" value="70%" accent />
        </div>

        <a
          href="/#calculator"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
        >
          Try the calculator <ArrowUpRight className="size-3.5" />
        </a>
      </article>
    </div>
  );
}

function MetricCell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span
        className={
          "text-sm font-semibold " +
          (accent ? "text-primary" : "text-foreground")
        }
      >
        {value}
      </span>
    </div>
  );
}

function TrendSpark({ className }: { className?: string }) {
  // Simple SVG upward trend — subtle, financial insight feel.
  return (
    <svg
      viewBox="0 0 400 120"
      className={className}
      preserveAspectRatio="none"
      role="img"
      aria-label="Upward earnings trend"
    >
      <defs>
        <linearGradient id="hero-spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.62 0.19 245)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="oklch(0.62 0.19 245)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hero-spark-stroke" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="oklch(0.78 0.16 175)" />
          <stop offset="100%" stopColor="oklch(0.55 0.24 265)" />
        </linearGradient>
      </defs>
      <path
        d="M0,100 L40,92 L80,86 L120,78 L160,74 L200,60 L240,52 L280,44 L320,32 L360,24 L400,12 L400,120 L0,120 Z"
        fill="url(#hero-spark-fill)"
      />
      <path
        d="M0,100 L40,92 L80,86 L120,78 L160,74 L200,60 L240,52 L280,44 L320,32 L360,24 L400,12"
        fill="none"
        stroke="url(#hero-spark-stroke)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
