import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Calculator,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Users,
  Wallet,
  Route as RouteIcon,
} from "lucide-react";

import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Container, Section } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/70-revenue-model")({
  head: () => ({
    meta: [
      { title: "70% Revenue Model — Earn 70% Revenue Share | Glintr" },
      {
        name: "description",
        content:
          "Earn 70% revenue share as a Glintr Partner. Percentage-based, no artificial earnings cap. ₹1,00,000 eligible revenue = ₹70,000 Partner share.",
      },
      { property: "og:title", content: "Glintr 70% Revenue Model" },
      {
        property: "og:description",
        content:
          "Take ownership of student acquisition and earn 70% of eligible attributed revenue.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://glintr.com/70-revenue-model" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://glintr.com/70-revenue-model" }],
  }),
  component: SeventyPercentPage,
});

// ── formatting ────────────────────────────────────────────────────────────
const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(n)));

const partnerShare = (rev: number) => rev * 0.7;
const glintrShare = (rev: number) => rev * 0.3;

// deterministic revenue examples
const EXAMPLES = [10_000, 25_000, 50_000, 1_00_000, 2_00_000, 2_50_000, 5_00_000];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

function scrollToId(id: string, reduced: boolean) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
}

function SeventyPercentPage() {
  const reduced = usePrefersReducedMotion();
  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <SiteHeader />
      <main id="main" className="flex-1">
        <Hero reduced={reduced} />
        <RevenueSplit />
        <HowItWorks />
        <Calculator70 />
        <NoCap />
        <WhyPartners />
        <Responsibilities />
        <RevenueGeneration />
        <GrowthJourney />
        <RevenueExamples />
        <PayoutFlow />
        <FiftyPreview />
        <FAQs />
        <FinalCTA />
      </main>
      <SiteFooter />
    </div>
  );
}

// ── 1. Hero ───────────────────────────────────────────────────────────────
function Hero({ reduced }: { reduced: boolean }) {
  return (
    <Section id="hero" className="pt-16 md:pt-24 pb-12 md:pb-20 relative overflow-hidden">
      <Container>
        <div className="max-w-4xl">
          <Badge variant="primary" className="mb-5 tracking-wider">
            70% REVENUE MODEL
          </Badge>
          <h1 className="font-display text-4xl md:text-6xl font-semibold leading-tight text-foreground">
            Earn 70% Revenue Share.
            <br />
            Build Without An Earnings Cap.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl">
            Take greater ownership of student acquisition and earn 70% of eligible revenue
            generated through your verified Glintr Partner attribution.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              variant="gradient"
              size="lg"
              onClick={() => scrollToId("revenue-split", reduced)}
            >
              See How 70% Works <ArrowRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => scrollToId("calculator", reduced)}
            >
              <Calculator className="size-4" /> Calculate My Earnings
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link to="/partner/apply">Become A Partner</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">₹1,00,000</span> in eligible revenue
            = <span className="font-medium text-primary">₹70,000</span> Partner share.
          </p>
        </div>
      </Container>
    </Section>
  );
}

// ── 2. Revenue Split ──────────────────────────────────────────────────────
function RevenueSplit() {
  return (
    <Section id="revenue-split" className="py-16 md:py-24 bg-surface border-y border-border">
      <Container>
        <div className="max-w-3xl">
          <h2 className="font-display text-3xl md:text-5xl font-semibold">
            You Earn 70%. Glintr Receives 30%.
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            A direct percentage split on eligible attributed revenue — verified through the
            Glintr Partner attribution and revenue architecture.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-[7fr_3fr]">
          <div className="rounded-2xl border border-border bg-background p-8 md:p-10">
            <div className="flex items-baseline justify-between">
              <p className="text-label text-primary">PARTNER</p>
              <p className="font-display text-5xl md:text-7xl font-bold text-primary">70%</p>
            </div>
            <p className="mt-3 text-muted-foreground">Your revenue share on eligible revenue.</p>
          </div>
          <div className="rounded-2xl border border-border bg-background p-8 md:p-10">
            <div className="flex items-baseline justify-between">
              <p className="text-label">GLINTR</p>
              <p className="font-display text-5xl md:text-7xl font-bold text-foreground">30%</p>
            </div>
            <p className="mt-3 text-muted-foreground">Platform, program & payout operations.</p>
          </div>
        </div>

        {/* split bar */}
        <div
          className="mt-8 h-6 w-full rounded-full overflow-hidden border border-border flex"
          role="img"
          aria-label="Revenue split: Partner 70 percent, Glintr 30 percent"
        >
          <div
            className="h-full bg-primary flex items-center justify-center text-xs font-semibold text-primary-foreground"
            style={{ width: "70%" }}
          >
            Partner · 70%
          </div>
          <div className="h-full bg-foreground/80 flex items-center justify-center text-xs font-semibold text-background" style={{ width: "30%" }}>
            Glintr · 30%
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <SplitCard label="Eligible Revenue" value="₹1,00,000" />
          <SplitCard label="Your 70% Share" value="₹70,000" accent />
          <SplitCard label="Glintr 30% Share" value="₹30,000" />
        </div>
      </Container>
    </Section>
  );
}

function SplitCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-6 ${accent ? "border-primary/50 bg-primary/5" : "border-border bg-background"}`}>
      <p className="text-label">{label}</p>
      <p className={`mt-2 font-display text-3xl md:text-4xl font-semibold ${accent ? "text-primary" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

// ── 3. How It Works (interactive stepper) ────────────────────────────────
const STEPS = [
  "Become A Glintr Partner",
  "Complete Approved Onboarding",
  "Access Eligible Programs",
  "Build Your Student Acquisition Strategy",
  "Use Valid Partner Attribution",
  "Student Enrollment Is Recorded",
  "Enrollment And Revenue Eligibility Are Verified",
  "70% Partner Share Is Calculated",
  "Revenue Moves Through The Payout Process",
];

function HowItWorks() {
  const [idx, setIdx] = React.useState(0);
  return (
    <Section id="how" className="py-16 md:py-24">
      <Container>
        <h2 className="font-display text-3xl md:text-5xl font-semibold max-w-3xl">
          How The 70% Model Works
        </h2>
        <p className="mt-4 text-muted-foreground max-w-2xl">
          One step at a time — from Partner activation to verified 70% revenue share.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_2fr]">
          <ol className="space-y-2" aria-label="70% model steps">
            {STEPS.map((s, i) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => setIdx(i)}
                  aria-current={idx === i ? "step" : undefined}
                  className={`w-full text-left rounded-lg border px-4 py-3 transition ${
                    idx === i
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="text-xs font-semibold tabular-nums mr-2">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {s}
                </button>
              </li>
            ))}
          </ol>
          <div className="rounded-2xl border border-border bg-surface p-8 md:p-10">
            <p className="text-label text-primary">Step {idx + 1} of {STEPS.length}</p>
            <h3 className="mt-2 font-display text-2xl md:text-3xl font-semibold">
              {STEPS[idx]}
            </h3>
            <p className="mt-4 text-muted-foreground">
              Each step is executed through the existing verified Glintr Partner, attribution,
              revenue and payout architecture. Partner revenue share is calculated only on
              eligible attributed revenue under applicable policies.
            </p>
            <div className="mt-8 flex gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={() => setIdx((i) => Math.max(0, i - 1))}
                disabled={idx === 0}
              >
                <ChevronLeft className="size-4" /> Previous
              </Button>
              <Button
                variant="gradient"
                size="md"
                onClick={() => setIdx((i) => Math.min(STEPS.length - 1, i + 1))}
                disabled={idx === STEPS.length - 1}
              >
                Next <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

// ── 4. Calculator ────────────────────────────────────────────────────────
function Calculator70() {
  const [value, setValue] = React.useState<string>("100000");
  const rev = Math.max(0, Number(value.replace(/[^0-9]/g, "")) || 0);
  const you = partnerShare(rev);
  const glintr = glintrShare(rev);

  return (
    <Section id="calculator" className="py-16 md:py-24 bg-surface border-y border-border">
      <Container>
        <div className="max-w-3xl">
          <h2 className="font-display text-3xl md:text-5xl font-semibold">
            Calculate Your 70% Share
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Enter an eligible revenue amount. The calculator instantly shows your 70% Partner
            share and the 30% Glintr share.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-background p-8">
            <Label htmlFor="rev-input" className="text-label">Eligible Revenue (INR)</Label>
            <Input
              id="rev-input"
              inputMode="numeric"
              pattern="[0-9]*"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="mt-2 text-2xl md:text-3xl font-display font-semibold h-14"
              aria-describedby="rev-hint"
            />
            <p id="rev-hint" className="mt-2 text-xs text-muted-foreground">
              Illustrative only. Actual revenue and payouts follow the verified Glintr
              attribution and revenue architecture.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {[10_000, 50_000, 1_00_000, 5_00_000].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setValue(String(n))}
                  className="rounded-full border border-border px-3 py-1 text-xs hover:border-primary hover:text-primary"
                >
                  {inr(n)}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-primary/40 bg-primary/5 p-8" aria-live="polite">
            <div className="flex items-baseline justify-between">
              <p className="text-label">Eligible Revenue</p>
              <p className="font-display text-2xl font-semibold">{inr(rev)}</p>
            </div>
            <div className="mt-6 h-3 w-full rounded-full overflow-hidden bg-background flex" aria-hidden>
              <div className="h-full bg-primary" style={{ width: "70%" }} />
              <div className="h-full bg-foreground/70" style={{ width: "30%" }} />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-label text-primary">Your 70% Share</p>
                <p className="mt-1 font-display text-3xl md:text-4xl font-bold text-primary">
                  {inr(you)}
                </p>
              </div>
              <div>
                <p className="text-label">Glintr 30% Share</p>
                <p className="mt-1 font-display text-3xl md:text-4xl font-semibold">
                  {inr(glintr)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

// ── 5. No Cap ────────────────────────────────────────────────────────────
function NoCap() {
  const [sel, setSel] = React.useState(2);
  const rows = [10_000, 50_000, 1_00_000, 2_00_000, 5_00_000];
  return (
    <Section id="no-cap" className="py-16 md:py-24">
      <Container>
        <div className="max-w-3xl">
          <h2 className="font-display text-3xl md:text-5xl font-semibold">
            Your Revenue Share Grows With Your Eligible Revenue
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            The 70% model is percentage-based. The page does not impose an artificial earnings
            ceiling — as eligible attributed revenue increases, your 70% share increases
            proportionally.
          </p>
        </div>
        <div className="mt-10 grid gap-3">
          {rows.map((r, i) => {
            const active = i === sel;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setSel(i)}
                aria-pressed={active}
                className={`w-full rounded-xl border p-5 md:p-6 text-left transition ${
                  active
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background hover:border-primary/60"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-4">
                  <div>
                    <p className="text-label">Eligible Revenue</p>
                    <p className="font-display text-2xl md:text-3xl font-semibold">{inr(r)}</p>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ArrowRight className="size-4" />
                  </div>
                  <div className="text-right">
                    <p className="text-label text-primary">Partner 70% Share</p>
                    <p className="font-display text-2xl md:text-3xl font-bold text-primary">
                      {inr(partnerShare(r))}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Illustrative revenue-share calculation. Actual earnings depend on verified enrollments,
          program eligibility and applicable Glintr Partner policies.
        </p>
      </Container>
    </Section>
  );
}

// ── 6. Why Partners Choose 70% ───────────────────────────────────────────
function WhyPartners() {
  const items = [
    { icon: TrendingUp, title: "70% Revenue Share", copy: "Direct percentage on eligible attributed revenue." },
    { icon: Sparkles, title: "Percentage-Based Growth", copy: "Higher eligible revenue means a higher Partner share." },
    { icon: ShieldCheck, title: "No Artificial Cap", copy: "The model presentation does not impose an earnings ceiling." },
    { icon: Users, title: "Partner-Led Acquisition", copy: "Greater ownership of student acquisition strategy." },
    { icon: RouteIcon, title: "Glintr Learning Ecosystem", copy: "Access eligible Glintr programs and materials." },
    { icon: CheckCircle2, title: "Partner Attribution", copy: "Verified attribution across the Partner architecture." },
    { icon: TrendingUp, title: "Revenue Visibility", copy: "Track eligible revenue through your Partner dashboard." },
    { icon: Wallet, title: "Payout Workflow", copy: "Revenue follows the existing Glintr payout process." },
  ];
  return (
    <Section id="why" className="py-16 md:py-24 bg-surface border-y border-border">
      <Container>
        <div className="max-w-3xl">
          <h2 className="font-display text-3xl md:text-5xl font-semibold">
            Built For Partners Ready To Take Greater Ownership
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            The 70% Revenue Model rewards Partners who lead their own student acquisition.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, title, copy }) => (
            <div key={title} className="rounded-2xl border border-border bg-background p-6">
              <Icon className="size-5 text-primary" />
              <p className="mt-3 font-semibold">{title}</p>
              <p className="mt-1.5 text-sm text-muted-foreground">{copy}</p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

// ── 7. Responsibilities ──────────────────────────────────────────────────
function Responsibilities() {
  const items = [
    "Student acquisition",
    "Approved Program promotion",
    "Accurate Program communication",
    "Valid Partner attribution",
    "Responsible student communication",
    "Following Glintr Partner policies",
    "Following approved brand guidelines",
  ];
  return (
    <Section id="responsibilities" className="py-16 md:py-24">
      <Container>
        <div className="max-w-3xl">
          <h2 className="font-display text-3xl md:text-5xl font-semibold">
            What You Take Ownership Of
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            The 70% model gives you greater ownership — and greater responsibility across the
            Partner architecture.
          </p>
        </div>
        <ul className="mt-10 grid gap-3 md:grid-cols-2">
          {items.map((i) => (
            <li key={i} className="rounded-xl border border-border bg-surface px-5 py-4 flex items-start gap-3">
              <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" aria-hidden />
              <span>{i}</span>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

// ── 8. Revenue Generation ────────────────────────────────────────────────
function RevenueGeneration() {
  const flow = [
    "Partner Reaches Student",
    "Student Explores Eligible Program",
    "Valid Partner Attribution",
    "Enrollment Recorded",
    "Applicable Revenue Verified",
    "Partner Revenue Share Calculated",
    "70% Partner Share",
    "Payout Process",
  ];
  return (
    <Section id="revgen" className="py-16 md:py-24 bg-surface border-y border-border">
      <Container>
        <h2 className="font-display text-3xl md:text-5xl font-semibold max-w-3xl">
          From Student Acquisition To Revenue Share
        </h2>
        <ol className="mt-10 grid gap-3 md:grid-cols-4">
          {flow.map((f, i) => (
            <li
              key={f}
              className="rounded-xl border border-border bg-background p-5"
            >
              <p className="text-label text-primary">Step {String(i + 1).padStart(2, "0")}</p>
              <p className="mt-2 font-semibold">{f}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-sm text-muted-foreground max-w-3xl">
          Only verified enrollments through valid Partner attribution generate eligible revenue
          and Partner revenue share. Clicks, unverified leads and pending enrollments do not
          create revenue records.
        </p>
      </Container>
    </Section>
  );
}

// ── 9. Growth Journey ────────────────────────────────────────────────────
const JOURNEY = [
  "Start",
  "Onboard",
  "Activate",
  "Build Reach",
  "Acquire Students",
  "Generate Valid Attribution",
  "Grow Verified Enrollments",
  "Grow Eligible Revenue",
  "Earn 70% Revenue Share",
  "Payout",
];

function GrowthJourney() {
  const [stage, setStage] = React.useState(4);
  return (
    <Section id="journey" className="py-16 md:py-24">
      <Container>
        <div className="max-w-3xl">
          <h2 className="font-display text-3xl md:text-5xl font-semibold">
            Your 70% Partner Growth Journey
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Move through each stage as your verified attribution and eligible revenue grow.
          </p>
        </div>

        {/* Desktop rail */}
        <div className="mt-10 hidden md:block">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {JOURNEY.map((s, i) => (
              <button
                key={s}
                type="button"
                onClick={() => setStage(i)}
                aria-pressed={stage === i}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm ${
                  stage === i
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {i + 1}. {s}
              </button>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-border bg-surface p-8">
            <p className="text-label text-primary">Stage {stage + 1}</p>
            <h3 className="mt-2 font-display text-2xl font-semibold">{JOURNEY[stage]}</h3>
          </div>
        </div>

        {/* Mobile vertical */}
        <ol className="mt-8 md:hidden space-y-2">
          {JOURNEY.map((s, i) => (
            <li
              key={s}
              className={`rounded-lg border p-3 ${
                stage === i ? "border-primary bg-primary/5" : "border-border bg-background"
              }`}
            >
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setStage(i)}
                aria-pressed={stage === i}
              >
                <span className="text-xs font-semibold tabular-nums mr-2">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {s}
              </button>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

// ── 10. Revenue Examples (interactive) ───────────────────────────────────
function RevenueExamples() {
  const [sel, setSel] = React.useState(3);
  const rev = EXAMPLES[sel];
  return (
    <Section id="examples" className="py-16 md:py-24 bg-surface border-y border-border">
      <Container>
        <div className="max-w-3xl">
          <h2 className="font-display text-3xl md:text-5xl font-semibold">
            See The 70% Model At Different Revenue Levels
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Select an eligible revenue level to see the corresponding 70% Partner share.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-2">
          {EXAMPLES.map((n, i) => (
            <button
              key={n}
              type="button"
              onClick={() => setSel(i)}
              aria-pressed={sel === i}
              className={`rounded-full border px-4 py-2 text-sm ${
                sel === i
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:border-primary/60"
              }`}
            >
              {inr(n)}
            </button>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-background p-8 md:p-10">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-label">Eligible Revenue</p>
              <p className="mt-2 font-display text-3xl md:text-4xl font-semibold">{inr(rev)}</p>
            </div>
            <div>
              <p className="text-label text-primary">Partner Share (70%)</p>
              <p className="mt-2 font-display text-3xl md:text-4xl font-bold text-primary">
                {inr(partnerShare(rev))}
              </p>
            </div>
            <div>
              <p className="text-label">Glintr Share (30%)</p>
              <p className="mt-2 font-display text-3xl md:text-4xl font-semibold">
                {inr(glintrShare(rev))}
              </p>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

// ── 11. Payout Flow ──────────────────────────────────────────────────────
function PayoutFlow() {
  const steps = [
    "Eligible revenue is identified.",
    "Partner attribution is validated.",
    "Applicable revenue share is calculated.",
    "Partner revenue records follow the authorised revenue workflow.",
    "Payout follows the existing Glintr payout process.",
  ];
  return (
    <Section id="payout" className="py-16 md:py-24">
      <Container>
        <div className="max-w-3xl">
          <h2 className="font-display text-3xl md:text-5xl font-semibold">
            How Your Revenue Moves To Payout
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            The 70% Partner share flows through the existing verified Glintr payout system.
          </p>
        </div>
        <ol className="mt-10 grid gap-3 md:grid-cols-5">
          {steps.map((s, i) => (
            <li key={s} className="rounded-xl border border-border bg-surface p-5">
              <p className="text-label text-primary">{String(i + 1).padStart(2, "0")}</p>
              <p className="mt-2 text-sm">{s}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8">
          <Button asChild variant="outline" size="lg">
            <Link to="/partner-support">Explore Payout System</Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

// ── 12. 50% Preview ──────────────────────────────────────────────────────
function FiftyPreview() {
  return (
    <Section id="fifty" className="py-16 md:py-24 bg-surface border-y border-border">
      <Container>
        <div className="rounded-2xl border border-border bg-background p-8 md:p-12">
          <Badge variant="outline" className="mb-4">50% SUPPORTED MODEL</Badge>
          <h2 className="font-display text-3xl md:text-4xl font-semibold max-w-3xl">
            Want Glintr-Supported Lead Opportunities?
          </h2>
          <p className="mt-4 text-muted-foreground max-w-3xl">
            The 50% Supported Model combines a 50% revenue share with performance-based lead
            assignment opportunities. Lead allocation depends on Partner performance and Glintr
            lead-selection qualification rules — not every Partner automatically receives leads.
          </p>
          <div className="mt-6">
            <Button asChild variant="outline" size="lg">
              <Link to="/earn">Explore 50% Supported Model <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}

// ── 13. FAQs ─────────────────────────────────────────────────────────────
function FAQs() {
  const faqs = [
    {
      q: "Is the revenue share 70% or up to 70%?",
      a: "The model uses a 70% Partner revenue share on eligible revenue under the applicable Glintr Partner revenue structure.",
    },
    {
      q: "If eligible revenue is ₹1 lakh, how much is my share?",
      a: "₹70,000. The 70% Partner share is calculated directly on eligible attributed revenue.",
    },
    {
      q: "Is there an earnings cap?",
      a: "The revenue-share calculation is percentage-based and the page does not impose an artificial earnings cap. Eligible revenue and payout still follow applicable verification and Partner policies.",
    },
    {
      q: "Does Glintr provide leads in this model?",
      a: "The 70% model is focused on greater Partner ownership of student acquisition. Performance-based lead assignment is part of the 50% Supported Model where applicable.",
    },
    {
      q: "How is revenue attributed?",
      a: "Revenue attribution runs through the existing verified Glintr Partner attribution architecture — Partner links, tracked enrollments, and program eligibility checks determine attributed revenue.",
    },
    {
      q: "How do payouts work?",
      a: "Once eligible revenue is verified and the 70% Partner share is calculated, payouts follow the existing Glintr payout process. See the Payout System section above.",
    },
  ];
  return (
    <Section id="faq" className="py-16 md:py-24">
      <Container>
        <h2 className="font-display text-3xl md:text-5xl font-semibold max-w-3xl">
          70% Model FAQs
        </h2>
        <div className="mt-8 max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem key={f.q} value={`f-${i}`}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Container>
    </Section>
  );
}

// ── 14. Final CTA ────────────────────────────────────────────────────────
function FinalCTA() {
  const reduced = usePrefersReducedMotion();
  return (
    <Section id="final-cta" className="py-20 md:py-28">
      <Container>
        <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-surface to-background p-10 md:p-16 text-center">
          <h2 className="font-display text-3xl md:text-5xl font-semibold max-w-3xl mx-auto">
            Ready To Earn 70% Revenue Share?
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
            Build student acquisition through the Glintr Partner ecosystem and earn 70% of
            eligible attributed revenue.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild variant="gradient" size="lg">
              <Link to="/partner/apply">Become A Partner</Link>
            </Button>
            <Button variant="outline" size="lg" onClick={() => scrollToId("calculator", reduced)}>
              Calculate My Earnings
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link to="/earn">Explore 50% Supported Model</Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
