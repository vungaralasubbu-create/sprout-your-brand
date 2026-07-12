import * as React from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  LineChart,
  ShoppingBag,
  Wallet,
  Clock,
  Activity,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/shared/section";

export function HomeHero() {
  return (
    <Section tone="default" padding="sm" className="relative overflow-hidden">
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
                <a href="/join">
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

const FLOW_STEPS = [
  { label: "Choose Programs", icon: BookOpen },
  { label: "Make Successful Sales", icon: ShoppingBag },
  { label: "Track Revenue", icon: LineChart },
  { label: "Earn Your Share", icon: Wallet },
];

const METRICS = [
  { label: "Flexible Selling", icon: Clock },
  { label: "Live Tracking", icon: Activity },
  { label: "Fast Payout Processing", icon: Zap },
];

function EarningsCard() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-4 rounded-[28px] bg-gradient-brand opacity-[0.05] blur-2xl"
      />
      <article
        className="relative rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm"
        aria-label="Earnings opportunity preview"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-wide text-muted-foreground">
              Earn Based On Your Sales
            </span>
            <span className="text-caption mt-0.5">
              Revenue share depends on the model you choose
            </span>
          </div>
          <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-md bg-primary-soft text-primary">
            Partner Model
          </span>
        </div>

        <div className="mt-5 flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            UP TO
          </span>
          <span className="font-display text-5xl md:text-6xl font-bold tracking-tight text-gradient-brand leading-none">
            70%
          </span>
        </div>
        <p className="mt-1 text-sm font-semibold text-foreground/85">
          Revenue Share
        </p>

        <ol className="mt-5 flex flex-col gap-2">
          {FLOW_STEPS.map((s, i) => (
            <li
              key={s.label}
              className="flex items-center gap-3 text-sm"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                <s.icon className="size-4" />
              </span>
              <span className="font-medium text-foreground/90">{s.label}</span>
              {i < FLOW_STEPS.length - 1 ? (
                <ChevronRight className="ml-auto size-4 text-muted-foreground/60" />
              ) : null}
            </li>
          ))}
        </ol>

        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-4">
          {METRICS.map((m) => (
            <div key={m.label} className="flex flex-col items-start gap-1">
              <m.icon className="size-4 text-primary" />
              <span className="text-[11px] font-semibold leading-tight text-foreground/85">
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}
