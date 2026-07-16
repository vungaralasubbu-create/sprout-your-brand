import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Calculator,
  ChevronDown,
  Coins,
  LineChart,
  ListChecks,
  Scale,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  Workflow,
} from "lucide-react";

import { Section, Container, SectionHeader } from "@/components/shared/section";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FaqAccordion } from "@/components/shared/faq";
import { cn } from "@/lib/utils";
import { useCountUp, useReveal, usePrefersReducedMotion } from "@/hooks/use-motion";

export const Route = createFileRoute("/income-calculator")({
  head: () => ({
    meta: [
      { title: "Partner Income Calculator — Glintr" },
      {
        name: "description",
        content:
          "See what your Glintr Partner revenue share could look like. Choose the 70% Revenue Model or 50% Supported Model and explore eligible revenue, enrollment and monthly scenarios.",
      },
      { property: "og:title", content: "Partner Income Calculator — Glintr" },
      {
        property: "og:description",
        content:
          "Explore your Partner revenue share across the 70% Revenue Model and 50% Supported Model. Deterministic, illustrative calculations.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://glintr.com/income-calculator" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://glintr.com/income-calculator" }],
  }),
  component: IncomeCalculatorPage,
});

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const fmtINR = (n: number) => INR.format(Math.max(0, Math.round(n)));

type Model = "70" | "50";
const rateFor = (m: Model) => (m === "70" ? 0.7 : 0.5);

/** Animated INR value that count-ups smoothly and respects reduced motion. */
function AnimatedINR({ value, className }: { value: number; className?: string }) {
  const display = useCountUp(value, 700);
  return <span className={className}>{fmtINR(display)}</span>;
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function IncomeCalculatorPage() {
  const [model, setModel] = React.useState<Model>("70");
  const [revenue, setRevenue] = React.useState<number>(100000);

  const rate = rateFor(model);
  const partner = Math.round(revenue * rate);
  const glintr = Math.round(revenue * (1 - rate));

  const calcRef = React.useRef<HTMLDivElement>(null);
  const compareRef = React.useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <>
      <SiteHeader />
      <main>
        <IncomeHero
          onCalculate={() => scrollTo(calcRef)}
          onCompare={() => scrollTo(compareRef)}
        />

        <MainCalculator
          anchor={calcRef}
          model={model}
          setModel={setModel}
          revenue={revenue}
          setRevenue={setRevenue}
          partner={partner}
          glintr={glintr}
        />

        <LiveRevenueSplit model={model} revenue={revenue} />

        <QuickExamples
          model={model}
          revenue={revenue}
          onSelect={(v) => {
            setRevenue(v);
            scrollTo(calcRef);
          }}
        />

        <GrowthExplorer model={model} />

        <EnrollmentScenario />

        <CompareSection anchor={compareRef} />

        <MonthlyPlanner />

        <SupportedLeadModelExplainer />

        <RevenueEligibility />

        <RevenueToPayout />

        <UnderstandResults />

        <PartnerModelExplorer />

        <CalculatorFaqs />

        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* 14. Hero                                                            */
/* ------------------------------------------------------------------ */

function IncomeHero({
  onCalculate,
  onCompare,
}: {
  onCalculate: () => void;
  onCompare: () => void;
}) {
  return (
    <Section tone="mesh" padding="lg" className="overflow-hidden">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div className="flex flex-col gap-6 reveal" data-visible="true">
            <span className="text-label text-primary">
              Glintr Partner Income Calculator
            </span>
            <h1 className="text-hero text-balance">
              See What Your Revenue Share Could Look Like.
            </h1>
            <p className="text-subheading text-pretty">
              Choose a Glintr Partner model, enter eligible revenue and
              instantly understand your Partner revenue share.
            </p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <Button variant="gradient" size="lg" onClick={onCalculate} className="lift-card">
                Calculate My Revenue Share
                <Calculator className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" onClick={onCompare} className="lift-card">
                Compare 70% And 50%
                <Scale className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <HeroExample />
        </div>
      </Container>
    </Section>
  );
}

function HeroExample() {
  const { ref, dataVisible } = useReveal<HTMLDivElement>();
  const base = 100000;
  return (
    <div
      ref={ref}
      data-visible={dataVisible}
      className="reveal rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-7 md:p-9 shadow-lg"
    >
      <p className="text-label">Live Example</p>
      <p className="mt-2 font-display text-3xl md:text-4xl font-semibold text-foreground">
        ₹1,00,000 Eligible Revenue
      </p>
      <div className="mt-8 grid grid-cols-2 gap-4">
        <ExampleTile label="70% Model" value={base * 0.7} tone="primary" />
        <ExampleTile label="50% Model" value={base * 0.5} tone="secondary" />
      </div>
      <p className="mt-6 text-caption text-pretty">
        Illustrative. Actual payouts follow Glintr Partner attribution,
        verification and payout policies.
      </p>
    </div>
  );
}

function ExampleTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "primary" | "secondary";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 lift-card",
        tone === "primary"
          ? "border-primary/30 bg-primary-soft"
          : "border-border bg-surface",
      )}
    >
      <p className="text-label">{label}</p>
      <p className="mt-1 text-caption text-muted-foreground">Partner Share</p>
      <AnimatedINR
        value={value}
        className="mt-2 block text-mono text-2xl font-semibold text-foreground"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 15/16. Main Revenue Calculator                                      */
/* ------------------------------------------------------------------ */

function MainCalculator({
  anchor,
  model,
  setModel,
  revenue,
  setRevenue,
  partner,
  glintr,
}: {
  anchor: React.RefObject<HTMLDivElement | null>;
  model: Model;
  setModel: (m: Model) => void;
  revenue: number;
  setRevenue: (v: number) => void;
  partner: number;
  glintr: number;
}) {
  return (
    <Section tone="surface" padding="lg">
      <Container>
        <div ref={anchor} className="scroll-mt-24" />
        <SectionHeader
          eyebrow="Main Calculator"
          title="Calculate Your Revenue Share"
          description="Pick your Glintr Partner model and enter eligible revenue. Numbers are illustrative and deterministic — 70% means 70%, 50% means 50%."
        />

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-[1fr_1.1fr]">
          <Card className="lift-card">
            <CardContent className="p-6 md:p-8 flex flex-col gap-6">
              <div>
                <Label className="text-label">Select Model</Label>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <ModelCard
                    active={model === "70"}
                    onClick={() => setModel("70")}
                    title="70% Revenue Model"
                    meta="Own leads · 70% share"
                  />
                  <ModelCard
                    active={model === "50"}
                    onClick={() => setModel("50")}
                    title="50% Supported Model"
                    meta="Performance-based · 50% share"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="revenue" className="text-label">
                  Eligible Revenue (₹)
                </Label>
                <div className="mt-2 flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-muted-foreground" aria-hidden />
                  <Input
                    id="revenue"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1000}
                    value={Number.isFinite(revenue) ? revenue : 0}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setRevenue(Number.isFinite(n) && n >= 0 ? n : 0);
                    }}
                    className="text-mono"
                  />
                </div>
                <p className="mt-2 text-caption">
                  Enter any illustrative eligible revenue amount.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="lift-card">
            <CardContent className="p-6 md:p-8" aria-live="polite">
              <p className="text-label">Your Revenue Share</p>
              <AnimatedINR
                value={partner}
                className="mt-3 block font-display text-5xl md:text-6xl font-bold tracking-tight text-gradient-brand"
              />
              <p className="mt-3 text-sm text-muted-foreground">
                Based on {model === "70" ? "70%" : "50%"} of{" "}
                {fmtINR(revenue)} eligible revenue.
              </p>

              <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-border pt-6">
                <div>
                  <dt className="text-label">Eligible Revenue</dt>
                  <dd className="mt-1 text-mono text-lg font-semibold">
                    <AnimatedINR value={revenue} />
                  </dd>
                </div>
                <div>
                  <dt className="text-label">Glintr Share</dt>
                  <dd className="mt-1 text-mono text-lg font-semibold">
                    <AnimatedINR value={glintr} />
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </Container>
    </Section>
  );
}

function ModelCard({
  active,
  onClick,
  title,
  meta,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  meta: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "lift-card rounded-xl border p-4 text-left transition-all",
        active
          ? "border-primary bg-primary-soft ring-2 ring-primary/25 lift-card-selected"
          : "border-border hover:bg-accent",
      )}
    >
      <span className="text-sm font-semibold">{title}</span>
      <p className="text-caption mt-1">{meta}</p>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* 17. Live Revenue Split                                              */
/* ------------------------------------------------------------------ */

function LiveRevenueSplit({ model, revenue }: { model: Model; revenue: number }) {
  const rate = rateFor(model);
  const partner = revenue * rate;
  const glintr = revenue * (1 - rate);
  const partnerPct = Math.round(rate * 100);
  const glintrPct = 100 - partnerPct;

  return (
    <Section padding="lg">
      <Container>
        <SectionHeader
          eyebrow="Live Split"
          title="Watch Your Revenue Split Update"
          description="Your split percentage stays fixed by model. The monetary amounts respond to the eligible revenue you enter above."
        />
        <div className="mx-auto mt-12 max-w-4xl">
          <div className="rounded-2xl border border-border bg-card p-6 md:p-10 shadow-sm lift-card">
            <div
              className="relative h-8 overflow-hidden rounded-full bg-muted"
              role="img"
              aria-label={`Revenue split: ${partnerPct}% Partner, ${glintrPct}% Glintr`}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-brand transition-[width] duration-700 ease-out"
                style={{ width: `${partnerPct}%` }}
              />
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <SplitTile label="Partner Share" pct={partnerPct} value={partner} highlight />
              <SplitTile label="Glintr Share" pct={glintrPct} value={glintr} />
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function SplitTile({
  label,
  pct,
  value,
  highlight,
}: {
  label: string;
  pct: number;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-5 lift-card",
        highlight ? "border-primary/40 bg-primary-soft" : "border-border bg-surface",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-label">{label}</span>
        <span className="text-mono text-sm font-semibold text-primary">{pct}%</span>
      </div>
      <AnimatedINR
        value={value}
        className="mt-2 block text-mono text-2xl font-semibold"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 18. Quick Revenue Examples                                          */
/* ------------------------------------------------------------------ */

const QUICK_VALUES = [10000, 25000, 50000, 100000, 250000, 500000];

function QuickExamples({
  model,
  revenue,
  onSelect,
}: {
  model: Model;
  revenue: number;
  onSelect: (v: number) => void;
}) {
  const rate = rateFor(model);
  return (
    <Section tone="surface" padding="lg">
      <Container>
        <SectionHeader
          eyebrow="Quick Examples"
          title="Try A Revenue Example"
          description="Tap an example to load it into the calculator above."
        />
        <div className="mx-auto mt-10 grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-3">
          {QUICK_VALUES.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onSelect(v)}
              aria-pressed={revenue === v}
              className={cn(
                "lift-card rounded-xl border bg-card p-5 text-left",
                revenue === v
                  ? "border-primary ring-2 ring-primary/25 lift-card-selected"
                  : "border-border",
              )}
            >
              <p className="text-label">Eligible Revenue</p>
              <p className="mt-1 text-mono text-xl font-semibold">{fmtINR(v)}</p>
              <div className="mt-4 border-t border-border pt-3">
                <p className="text-caption">Partner Share · {model === "70" ? "70%" : "50%"}</p>
                <p className="mt-1 text-mono text-lg font-semibold text-primary">
                  {fmtINR(v * rate)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* 19. Revenue Growth Explorer                                         */
/* ------------------------------------------------------------------ */

function GrowthExplorer({ model }: { model: Model }) {
  const [amount, setAmount] = React.useState(200000);
  const rate = rateFor(model);
  const partner = amount * rate;
  const glintr = amount * (1 - rate);
  const pct = Math.min(100, (amount / 1000000) * 100);

  return (
    <Section padding="lg">
      <Container>
        <SectionHeader
          eyebrow="Growth Explorer"
          title="See How Revenue Share Grows"
          description="Slide the revenue and watch your Partner share update. Percentage stays fixed by your selected model."
        />
        <div className="mx-auto mt-12 max-w-4xl rounded-2xl border border-border bg-card p-6 md:p-10 shadow-sm">
          <div className="flex items-center justify-between">
            <Label htmlFor="growth">Eligible Revenue</Label>
            <span className="text-mono text-lg font-semibold">
              <AnimatedINR value={amount} />
            </span>
          </div>
          <input
            id="growth"
            type="range"
            min={0}
            max={1000000}
            step={5000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="mt-4 w-full accent-primary"
            aria-label="Eligible revenue slider"
          />
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-brand transition-[width] duration-300 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <MetricTile label="Your Model" value={model === "70" ? "70% Revenue" : "50% Supported"} />
            <MetricTile label="Your Revenue Share" value={fmtINR(partner)} highlight />
            <MetricTile label="Revenue Share %" value={`${Math.round(rate * 100)}%`} />
          </div>
          <p className="mt-6 text-caption">
            Glintr Share: <AnimatedINR value={glintr} className="text-mono" />. Illustrative only.
          </p>
        </div>
      </Container>
    </Section>
  );
}

function MetricTile({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        highlight ? "border-primary/40 bg-primary-soft" : "border-border bg-surface",
      )}
    >
      <p className="text-label">{label}</p>
      <p className="mt-1 text-mono text-lg font-semibold">{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 20/21. Enrollment Scenario                                          */
/* ------------------------------------------------------------------ */

function EnrollmentScenario() {
  const [avg, setAvg] = React.useState(10000);
  const [count, setCount] = React.useState(10);
  const [model, setModel] = React.useState<Model>("70");

  const total = Math.max(0, avg) * Math.max(0, count);
  const rate = rateFor(model);
  const partner = total * rate;
  const glintr = total * (1 - rate);
  const per = count > 0 ? partner / count : 0;

  return (
    <Section tone="surface" padding="lg">
      <Container>
        <SectionHeader
          eyebrow="Enrollment Scenario"
          title="Build An Enrollment Scenario"
          description="Combine average eligible revenue per enrollment with verified enrollments to explore an illustrative Partner share."
        />
        <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-[1fr_1.1fr]">
          <Card className="lift-card">
            <CardContent className="p-6 md:p-8 flex flex-col gap-5">
              <NumberField
                label="Average Eligible Revenue Per Enrollment (₹)"
                value={avg}
                onChange={setAvg}
              />
              <NumberField
                label="Verified Eligible Enrollments"
                value={count}
                onChange={setCount}
              />
              <div>
                <Label className="text-label">Partner Model</Label>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <ModelCard
                    active={model === "70"}
                    onClick={() => setModel("70")}
                    title="70% Revenue Model"
                    meta="Own leads · 70% share"
                  />
                  <ModelCard
                    active={model === "50"}
                    onClick={() => setModel("50")}
                    title="50% Supported Model"
                    meta="Performance-based · 50% share"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lift-card">
            <CardContent className="p-6 md:p-8" aria-live="polite">
              <p className="text-label">Total Illustrative Eligible Revenue</p>
              <AnimatedINR
                value={total}
                className="mt-3 block font-display text-4xl md:text-5xl font-bold text-gradient-brand"
              />
              <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-border pt-6">
                <div>
                  <dt className="text-label">Partner Revenue Share</dt>
                  <dd className="mt-1 text-mono text-lg font-semibold text-primary">
                    <AnimatedINR value={partner} />
                  </dd>
                </div>
                <div>
                  <dt className="text-label">Glintr Share</dt>
                  <dd className="mt-1 text-mono text-lg font-semibold">
                    <AnimatedINR value={glintr} />
                  </dd>
                </div>
                <div>
                  <dt className="text-label">Avg Partner Share Per Enrollment</dt>
                  <dd className="mt-1 text-mono text-lg font-semibold">
                    <AnimatedINR value={per} />
                  </dd>
                </div>
                <div>
                  <dt className="text-label">Model Rate</dt>
                  <dd className="mt-1 text-mono text-lg font-semibold">
                    {Math.round(rate * 100)}%
                  </dd>
                </div>
              </dl>
              <p className="mt-6 text-caption">
                Illustrative. Actual eligibility depends on verified enrollments,
                program rules and applicable Partner policies.
              </p>
            </CardContent>
          </Card>
        </div>
      </Container>
    </Section>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-label">{label}</Label>
      <Input
        type="number"
        min={0}
        inputMode="numeric"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => {
          const n = Number(e.target.value);
          onChange(Number.isFinite(n) && n >= 0 ? n : 0);
        }}
        className="text-mono"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 22/23. Compare 70% and 50%                                          */
/* ------------------------------------------------------------------ */

function CompareSection({ anchor }: { anchor: React.RefObject<HTMLDivElement | null> }) {
  const [rev, setRev] = React.useState(100000);
  const p70 = rev * 0.7;
  const g70 = rev * 0.3;
  const p50 = rev * 0.5;
  const g50 = rev * 0.5;
  const diff = p70 - p50;

  return (
    <Section padding="lg">
      <Container>
        <div ref={anchor} className="scroll-mt-24" />
        <SectionHeader
          eyebrow="Model Comparison"
          title="Compare Your Revenue Share"
          description="One eligible revenue, both models side by side."
        />

        <div className="mx-auto mt-10 max-w-2xl">
          <Card className="lift-card">
            <CardContent className="p-6 flex flex-col gap-3">
              <Label className="text-label">Eligible Revenue (₹)</Label>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                step={1000}
                value={rev}
                onChange={(e) => setRev(Math.max(0, Number(e.target.value) || 0))}
                className="text-mono"
              />
            </CardContent>
          </Card>
        </div>

        <div className="mx-auto mt-8 grid max-w-5xl gap-6 md:grid-cols-2">
          <CompareCard title="70% Revenue Model" tone="primary" partner={p70} glintr={g70} pct={70} />
          <CompareCard title="50% Supported Model" tone="secondary" partner={p50} glintr={g50} pct={50} />
        </div>

        <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-primary/30 bg-primary-soft p-6 text-center lift-card">
          <p className="text-label">Difference In Partner Revenue Share</p>
          <AnimatedINR
            value={diff}
            className="mt-2 block font-display text-3xl md:text-4xl font-bold text-primary"
          />
          <p className="mt-2 text-caption">
            The 70% Revenue Model yields a larger share; the 50% Supported Model
            includes access to performance-based Glintr lead assignment
            opportunities subject to qualification, performance and availability.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2">
          <WhyDifferent
            title="Why 70% Revenue Model"
            points={[
              "70% revenue share on eligible revenue.",
              "Greater Partner ownership of student acquisition.",
              "Partner builds and manages more of the acquisition strategy.",
            ]}
          />
          <WhyDifferent
            title="Why 50% Supported Model"
            points={[
              "50% revenue share on eligible revenue.",
              "Performance-based Glintr lead opportunities.",
              "Lead-selection qualifications, Partner performance and lead availability apply.",
            ]}
          />
        </div>
      </Container>
    </Section>
  );
}

function CompareCard({
  title,
  tone,
  partner,
  glintr,
  pct,
}: {
  title: string;
  tone: "primary" | "secondary";
  partner: number;
  glintr: number;
  pct: number;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-6 md:p-8 lift-card",
        tone === "primary"
          ? "border-primary/30 bg-primary-soft"
          : "border-border bg-card",
      )}
    >
      <p className="text-label">{title}</p>
      <p className="mt-2 text-mono text-sm text-muted-foreground">{pct}% Revenue Share</p>
      <AnimatedINR
        value={partner}
        className="mt-4 block font-display text-4xl font-bold text-gradient-brand"
      />
      <p className="mt-1 text-caption">Partner Share</p>
      <div className="mt-6 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-4 text-sm">
        Glintr Share:{" "}
        <span className="text-mono font-semibold">
          <AnimatedINR value={glintr} />
        </span>
      </p>
    </div>
  );
}

function WhyDifferent({ title, points }: { title: string; points: string[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 md:p-8 lift-card">
      <p className="font-semibold">{title}</p>
      <ul className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
        {points.map((p) => (
          <li key={p} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 24/25. Monthly Planner                                              */
/* ------------------------------------------------------------------ */

function MonthlyPlanner() {
  const [m1, setM1] = React.useState(80000);
  const [m2, setM2] = React.useState(120000);
  const [m3, setM3] = React.useState(150000);
  const [model, setModel] = React.useState<Model>("70");
  const rate = rateFor(model);

  const months = [
    { label: "Month 1", rev: m1, set: setM1 },
    { label: "Month 2", rev: m2, set: setM2 },
    { label: "Month 3", rev: m3, set: setM3 },
  ];
  const totalRev = m1 + m2 + m3;
  const totalPartner = totalRev * rate;
  const avg = totalPartner / 3;
  const maxRev = Math.max(m1, m2, m3, 1);

  return (
    <Section tone="surface" padding="lg">
      <Container>
        <SectionHeader
          eyebrow="Monthly Planner"
          title="Explore A Monthly Revenue Scenario"
          description="Illustrative only. This planner is not saved and does not create Partner revenue records."
        />

        <div className="mx-auto mt-10 max-w-4xl">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <ModelCard
              active={model === "70"}
              onClick={() => setModel("70")}
              title="70% Revenue Model"
              meta="70% share"
            />
            <ModelCard
              active={model === "50"}
              onClick={() => setModel("50")}
              title="50% Supported Model"
              meta="50% share"
            />
          </div>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-3">
          {months.map((m) => (
            <Card key={m.label} className="lift-card">
              <CardContent className="p-6">
                <p className="text-label">{m.label}</p>
                <NumberField
                  label="Eligible Revenue (₹)"
                  value={m.rev}
                  onChange={m.set}
                />
                <div className="mt-4">
                  <div className="h-24 flex items-end">
                    <div
                      className="w-full rounded-t-lg bg-gradient-brand transition-all duration-500"
                      style={{ height: `${(m.rev / maxRev) * 100}%` }}
                      aria-hidden
                    />
                  </div>
                  <p className="mt-3 text-caption">Partner Share</p>
                  <AnimatedINR
                    value={m.rev * rate}
                    className="text-mono text-lg font-semibold text-primary"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mx-auto mt-8 grid max-w-5xl gap-4 sm:grid-cols-3">
          <MetricTile label="Total Eligible Revenue" value={fmtINR(totalRev)} />
          <MetricTile label="Total Illustrative Partner Share" value={fmtINR(totalPartner)} highlight />
          <MetricTile label="Avg Monthly Partner Share" value={fmtINR(avg)} />
        </div>

        <p className="mx-auto mt-6 max-w-3xl text-center text-caption">
          Illustrative scenarios only. Not a guarantee of monthly income.
        </p>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* 26. Supported Model Lead Explainer                                  */
/* ------------------------------------------------------------------ */

function SupportedLeadModelExplainer() {
  return (
    <Section padding="lg">
      <Container>
        <SectionHeader
          eyebrow="50% Supported Model"
          title="How The 50% Supported Model Connects To Lead Opportunities"
          description="The 50% Supported Model includes access to performance-based lead assignment opportunities. The Income Calculator calculates revenue share only — it does not predict leads."
        />

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 lift-card">
            <p className="font-semibold">Lead Assignment Depends On</p>
            <ul className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
              {[
                "Partner performance",
                "Applicable lead-selection qualifications",
                "Partner eligibility",
                "Lead handling performance where measured",
                "Conversion performance where measured",
                "Lead availability",
                "Approved Glintr lead-selection rules",
              ].map((p) => (
                <li key={p} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-primary/30 bg-primary-soft p-6 md:p-8 lift-card">
            <p className="font-semibold">The Calculator Does Not Predict</p>
            <ul className="mt-4 flex flex-col gap-2 text-sm">
              {["Lead volume", "Lead assignment", "Conversion rate", "Future revenue"].map((p) => (
                <li key={p} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-caption">
              The Income Calculator calculates revenue share only.
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* 27. Revenue Eligibility                                             */
/* ------------------------------------------------------------------ */

const ELIGIBILITY_STEPS = [
  { icon: Users, title: "Student Acquisition Or Qualified Lead Handling" },
  { icon: ListChecks, title: "Valid Partner Attribution" },
  { icon: TrendingUp, title: "Enrollment Recorded" },
  { icon: Coins, title: "Applicable Revenue Identified" },
  { icon: Workflow, title: "Enrollment & Revenue Conditions Verified" },
  { icon: Sparkles, title: "Eligible Revenue Established" },
  { icon: Calculator, title: "Partner Share Calculated" },
  { icon: Wallet, title: "Payout Workflow" },
];

function RevenueEligibility() {
  return (
    <Section tone="surface" padding="lg">
      <Container>
        <SectionHeader
          eyebrow="Eligibility"
          title="A Calculator Result Is Not Yet A Payout"
          description="Entering ₹1,00,000 does not automatically release ₹70,000 or ₹50,000 to a Partner. Revenue must first become eligible under Glintr Partner policies."
        />
        <ol className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ELIGIBILITY_STEPS.map((s, i) => (
            <li
              key={s.title}
              className="rounded-xl border border-border bg-card p-5 lift-card"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-primary-soft text-primary text-mono text-sm font-semibold">
                  {i + 1}
                </span>
                <s.icon className="h-5 w-5 text-primary" aria-hidden />
              </div>
              <p className="mt-3 font-semibold text-sm">{s.title}</p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* 28. Revenue To Payout Journey                                       */
/* ------------------------------------------------------------------ */

const PAYOUT_STAGES = [
  "Eligible Revenue",
  "Attribution Verification",
  "Revenue Share Calculation",
  "Applicable Review",
  "Payout Eligibility",
  "Payout Processing",
  "Payout Status",
];

function RevenueToPayout() {
  const [active, setActive] = React.useState(0);
  return (
    <Section padding="lg">
      <Container>
        <SectionHeader
          eyebrow="Journey"
          title="From Eligible Revenue To Payout"
          description="A conceptual journey — each stage is defined by existing Glintr Partner architecture."
        />
        <div className="mx-auto mt-12 max-w-5xl">
          <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {PAYOUT_STAGES.map((s, i) => (
              <button
                key={s}
                type="button"
                onClick={() => setActive(i)}
                aria-pressed={active === i}
                className={cn(
                  "lift-card rounded-xl border p-4 text-left text-xs font-medium transition-all",
                  active === i
                    ? "border-primary bg-primary-soft ring-2 ring-primary/25 lift-card-selected"
                    : "border-border bg-card",
                )}
              >
                <span className="text-mono text-primary">{String(i + 1).padStart(2, "0")}</span>
                <p className="mt-2">{s}</p>
              </button>
            ))}
          </div>

          <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-brand transition-[width] duration-500 ease-out"
              style={{ width: `${((active + 1) / PAYOUT_STAGES.length) * 100}%` }}
            />
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Stage {active + 1} of {PAYOUT_STAGES.length}
            </p>
            <Button asChild variant="outline" className="lift-card">
              <Link to="/payout-system">
                Explore Payout System <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* 29. Understand Your Results                                         */
/* ------------------------------------------------------------------ */

const RESULT_CARDS = [
  {
    title: "Eligible Revenue",
    body: "The revenue base considered under Glintr Partner rules for the calculation.",
  },
  {
    title: "Partner Revenue Share",
    body: "The percentage-based Partner portion of eligible revenue under the selected Glintr Partner model.",
  },
  {
    title: "Glintr Share",
    body: "The portion of eligible revenue retained by Glintr under the selected Partner model.",
  },
  {
    title: "Verified Eligible Enrollments",
    body: "Enrollments that meet Partner attribution and program eligibility conditions.",
  },
  {
    title: "Illustrative Scenario",
    body: "A directional example based on the values you enter. Not a guarantee of earnings.",
  },
  {
    title: "Payout",
    body: "The final amount released after applicable review under Glintr's payout workflow.",
  },
];

function UnderstandResults() {
  const [i, setI] = React.useState(0);
  return (
    <Section tone="surface" padding="lg">
      <Container>
        <SectionHeader
          eyebrow="Result Guide"
          title="How To Read Your Calculator Results"
          description="Tap a card for a short explanation."
        />
        <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RESULT_CARDS.map((c, idx) => (
            <button
              key={c.title}
              type="button"
              onClick={() => setI(idx)}
              aria-pressed={i === idx}
              className={cn(
                "lift-card rounded-xl border p-5 text-left",
                i === idx
                  ? "border-primary bg-primary-soft lift-card-selected"
                  : "border-border bg-card",
              )}
            >
              <p className="font-semibold text-sm">{c.title}</p>
              <p
                className={cn(
                  "text-caption mt-2 transition-opacity",
                  i === idx ? "opacity-100" : "opacity-70",
                )}
              >
                {c.body}
              </p>
            </button>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* 30. Partner Model Explorer                                          */
/* ------------------------------------------------------------------ */

type Yn = "yes" | "no" | null;
const EXPLORER_QUESTIONS = [
  "Do you already generate your own student opportunities?",
  "Do you want greater ownership of student acquisition?",
  "Would you prefer performance-based Glintr lead opportunities?",
  "Are you ready to be evaluated through applicable lead-selection qualifications?",
] as const;

function PartnerModelExplorer() {
  const [answers, setAnswers] = React.useState<Yn[]>([null, null, null, null]);

  // Score toward 70 for Qs 0,1; toward 50 for Qs 2,3.
  const score70 = (answers[0] === "yes" ? 1 : 0) + (answers[1] === "yes" ? 1 : 0);
  const score50 = (answers[2] === "yes" ? 1 : 0) + (answers[3] === "yes" ? 1 : 0);
  const answered = answers.every((a) => a !== null);
  const recommend: Model | null = !answered ? null : score70 >= score50 ? "70" : "50";

  return (
    <Section padding="lg">
      <Container>
        <SectionHeader
          eyebrow="Model Explorer"
          title="Which Model Should You Explore?"
          description="Deterministic guidance only. This does not approve Partner eligibility."
        />

        <div className="mx-auto mt-10 max-w-3xl flex flex-col gap-4">
          {EXPLORER_QUESTIONS.map((q, i) => (
            <div
              key={q}
              className="rounded-xl border border-border bg-card p-5 lift-card"
            >
              <p className="text-sm font-medium">{q}</p>
              <div className="mt-3 flex gap-2">
                {(["yes", "no"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() =>
                      setAnswers((prev) => {
                        const next = [...prev];
                        next[i] = opt;
                        return next;
                      })
                    }
                    aria-pressed={answers[i] === opt}
                    className={cn(
                      "lift-card rounded-full border px-4 py-1.5 text-sm font-medium capitalize",
                      answers[i] === opt
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-surface",
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {recommend ? (
          <div
            className="mx-auto mt-8 max-w-3xl rounded-2xl border border-primary/30 bg-primary-soft p-6 text-center lift-card"
            aria-live="polite"
          >
            <p className="text-label">Guidance</p>
            <p className="mt-2 font-display text-2xl font-semibold">
              {recommend === "70"
                ? "Explore The 70% Revenue Model"
                : "Explore The 50% Supported Model"}
            </p>
            <p className="mt-2 text-caption">
              Guidance only. Final eligibility depends on Glintr Partner review.
            </p>
          </div>
        ) : null}

        <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-3">
          <Button asChild variant="outline" className="lift-card">
            <Link to="/70-revenue-model">Explore 70% Model</Link>
          </Button>
          <Button asChild variant="outline" className="lift-card">
            <Link to="/50-supported-model">Explore 50% Supported Model</Link>
          </Button>
          <Button asChild variant="gradient" className="lift-card">
            <Link to="/earn">
              Become A Partner <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* 31. FAQs                                                            */
/* ------------------------------------------------------------------ */

const FAQS = [
  {
    question: "Is the 70% revenue share exactly 70%?",
    answer:
      "Yes. The 70% Revenue Model calculates a 70% Partner share on eligible revenue under the applicable Glintr Partner revenue structure.",
  },
  {
    question: "Is the 50% revenue share exactly 50%?",
    answer:
      "Yes. The 50% Supported Model calculates a 50% Partner share on eligible revenue under the applicable Glintr Partner revenue structure.",
  },
  {
    question: "If eligible revenue is ₹1 lakh, what is the 70% Partner share?",
    answer: "₹70,000.",
  },
  {
    question: "If eligible revenue is ₹1 lakh, what is the 50% Partner share?",
    answer: "₹50,000.",
  },
  {
    question: "Does the calculator guarantee earnings?",
    answer:
      "No. The calculator provides illustrative revenue-share calculations based on entered eligible revenue.",
  },
  {
    question: "Does the calculator predict leads?",
    answer:
      "No. Performance-based lead assignment in the 50% Supported Model depends on applicable qualification, Partner performance and lead availability.",
  },
  {
    question: "Does the calculator create a payout?",
    answer:
      "No. Payouts follow Glintr's separate attribution, verification and payout workflow.",
  },
];

function CalculatorFaqs() {
  return (
    <Section tone="surface" padding="lg">
      <Container size="md">
        <SectionHeader eyebrow="FAQs" title="Income Calculator Questions" />
        <div className="mt-10">
          <FaqAccordion items={FAQS} />
        </div>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* 32. Final CTA                                                       */
/* ------------------------------------------------------------------ */

function FinalCta() {
  return (
    <Section tone="gradient" padding="lg" className="text-center">
      <Container size="md">
        <h2 className="text-section text-balance text-primary-foreground">
          Calculated Your Revenue Share. Ready To Explore A Partner Model?
        </h2>
        <p className="mt-4 text-subheading text-primary-foreground/80 text-pretty">
          Compare the 70% Revenue Model and 50% Supported Model, then explore
          the Partner journey that matches how you want to grow.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" variant="secondary" className="lift-card">
            <Link to="/earn">
              Become A Partner <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="lift-card bg-white/10 text-primary-foreground border-white/30 hover:bg-white/20">
            <Link to="/70-revenue-model">Explore 70% Revenue Model</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="lift-card bg-white/10 text-primary-foreground border-white/30 hover:bg-white/20">
            <Link to="/50-supported-model">Explore 50% Supported Model</Link>
          </Button>
        </div>
        <p className="mt-8 text-caption text-primary-foreground/70">
          Illustrative calculations only. Actual payouts are subject to verified
          enrollments, program eligibility and applicable Glintr policies.
        </p>
        <div className="mt-4 flex items-center justify-center gap-2 text-caption text-primary-foreground/60">
          <LineChart className="h-4 w-4" aria-hidden />
          <span>70% means 70%. 50% means 50%. No "up to".</span>
        </div>
        <ChevronDown className="mx-auto mt-8 h-5 w-5 text-primary-foreground/40" aria-hidden />
      </Container>
    </Section>
  );
}
