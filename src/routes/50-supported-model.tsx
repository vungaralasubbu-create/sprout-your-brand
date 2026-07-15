import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Calculator,
  CheckCircle2,
  Info,
  Users,
  ShieldCheck,
  TrendingUp,
  Wallet,
  Route as RouteIcon,
  Sparkles,
} from "lucide-react";

import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Container, Section } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/50-supported-model")({
  head: () => ({
    meta: [
      { title: "50% Supported Model — Performance-Based Lead Opportunities | Glintr" },
      {
        name: "description",
        content:
          "Earn 50% revenue share and unlock performance-based lead opportunities. Lead assignment depends on Partner performance, qualification and availability.",
      },
      { property: "og:title", content: "Glintr 50% Supported Model" },
      {
        property: "og:description",
        content:
          "50% revenue share with performance-based, qualified lead assignment through the Glintr Partner ecosystem.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://glintr.com/50-supported-model" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://glintr.com/50-supported-model" }],
  }),
  component: FiftySupportedPage,
});

// ── formatting ────────────────────────────────────────────────────────────
const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(n)));

const half = (rev: number) => rev * 0.5;
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

function FiftySupportedPage() {
  const reduced = usePrefersReducedMotion();
  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <SiteHeader />
      <main id="main" className="flex-1">
        <Hero reduced={reduced} />
        <RevenueSplit />
        <WhatSupportedMeans />
        <LeadAssignment />
        <NotAutomatic />
        <QualificationExplorer />
        <PerformanceSelection />
        <LeadStatesInfo />
        <ProfilesExplorer />
        <Calculator50 />
        <RevenueProgression />
        <LeadJourney />
        <ImproveEligibility />
        <Responsibilities />
        <GlintrRole />
        <PerformanceJourney />
        <Compare5070 />
        <FitExplorer />
        <FAQs />
        <FinalCTA reduced={reduced} />
      </main>
      <SiteFooter />
    </div>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────
function Hero({ reduced }: { reduced: boolean }) {
  return (
    <Section id="hero" className="pt-16 md:pt-24 pb-12 md:pb-20 relative overflow-hidden">
      <Container>
        <div className="max-w-4xl">
          <Badge variant="primary" className="mb-5 tracking-wider">
            50% SUPPORTED MODEL
          </Badge>
          <h1 className="font-display text-4xl md:text-6xl font-semibold leading-tight text-foreground">
            Earn 50% Revenue Share.
            <br />
            Unlock Performance-Based Lead Opportunities.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl">
            Build with Glintr through a supported Partner model where qualified Partners can
            receive lead opportunities based on performance and lead-selection criteria.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="gradient" size="lg" onClick={() => scrollToId("supported", reduced)}>
              Explore The Supported Model <ArrowRight className="size-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => scrollToId("lead-assignment", reduced)}>
              How Lead Assignment Works
            </Button>
            <Button variant="secondary" size="lg" onClick={() => scrollToId("calculator", reduced)}>
              <Calculator className="size-4" /> Calculate My 50% Share
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">₹1,00,000</span> in eligible revenue
            = <span className="font-medium text-primary">₹50,000</span> Partner share.
          </p>
          <p className="mt-2 text-xs text-muted-foreground max-w-2xl">
            Lead assignment depends on Partner performance, qualification and lead availability.
          </p>
        </div>
      </Container>
    </Section>
  );
}

// ── Split ────────────────────────────────────────────────────────────────
function RevenueSplit() {
  return (
    <Section id="split" className="py-16 md:py-24 bg-surface border-y border-border">
      <Container>
        <div className="max-w-3xl">
          <h2 className="font-display text-3xl md:text-5xl font-semibold">
            You Earn 50%. Glintr Receives 50%.
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            A balanced revenue share on eligible attributed revenue — supported by the Glintr
            lead-opportunity architecture.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-primary/40 bg-primary/5 p-8 md:p-10">
            <div className="flex items-baseline justify-between">
              <p className="text-label text-primary">PARTNER</p>
              <p className="font-display text-5xl md:text-7xl font-bold text-primary">50%</p>
            </div>
            <p className="mt-3 text-muted-foreground">Your revenue share on eligible revenue.</p>
          </div>
          <div className="rounded-2xl border border-border bg-background p-8 md:p-10">
            <div className="flex items-baseline justify-between">
              <p className="text-label">GLINTR</p>
              <p className="font-display text-5xl md:text-7xl font-bold text-foreground">50%</p>
            </div>
            <p className="mt-3 text-muted-foreground">
              Platform, lead opportunities, operations & payout.
            </p>
          </div>
        </div>

        <div
          className="mt-8 h-6 w-full rounded-full overflow-hidden border border-border flex"
          role="img"
          aria-label="Revenue split: Partner 50 percent, Glintr 50 percent"
        >
          <div
            className="h-full bg-primary flex items-center justify-center text-xs font-semibold text-primary-foreground"
            style={{ width: "50%" }}
          >
            Partner · 50%
          </div>
          <div
            className="h-full bg-foreground/80 flex items-center justify-center text-xs font-semibold text-background"
            style={{ width: "50%" }}
          >
            Glintr · 50%
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <StatCard label="Eligible Revenue" value="₹1,00,000" />
          <StatCard label="Your 50% Share" value="₹50,000" accent />
          <StatCard label="Glintr 50% Share" value="₹50,000" />
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Revenue eligibility still follows the existing Glintr Enrollment, attribution, revenue
          and payout architecture.
        </p>
      </Container>
    </Section>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-6 ${
        accent ? "border-primary/50 bg-primary/5" : "border-border bg-background"
      }`}
    >
      <p className="text-label">{label}</p>
      <p
        className={`mt-2 font-display text-3xl md:text-4xl font-semibold ${
          accent ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

// ── What Supported Means ─────────────────────────────────────────────────
function WhatSupportedMeans() {
  return (
    <Section id="supported" className="py-16 md:py-24">
      <Container>
        <div className="max-w-3xl">
          <h2 className="font-display text-3xl md:text-5xl font-semibold">
            More Than Revenue Share. A Performance-Based Growth Model.
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            The 50% Supported Model combines a 50% Partner revenue share with access to
            Glintr-supported lead opportunities. Qualified Partners may be selected for lead
            assignment based on performance and applicable lead-selection qualifications — lead
            assignment is not automatic.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            { icon: Wallet, title: "50% Revenue Share", copy: "Direct percentage on eligible attributed revenue." },
            { icon: Users, title: "Lead Opportunities", copy: "Access to the Glintr lead-opportunity architecture." },
            { icon: ShieldCheck, title: "Qualified Selection", copy: "Selection through the approved lead-assignment process." },
          ].map(({ icon: Icon, title, copy }) => (
            <div key={title} className="rounded-2xl border border-border bg-surface p-6">
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

// ── Lead Assignment (interactive stepper) ────────────────────────────────
const LEAD_STEPS = [
  "Lead Opportunity Becomes Available",
  "Lead Enters The Approved Glintr Lead Process",
  "Eligible Partners Are Evaluated",
  "Partner Performance Is Reviewed",
  "Lead-Selection Qualifications Are Checked",
  "Qualified Partner Is Selected",
  "Lead Is Assigned",
  "Partner Handles The Lead",
  "Outcome Is Recorded",
  "Performance Is Updated",
  "Future Lead Selection Uses Applicable Performance Signals",
];

function LeadAssignment() {
  const [idx, setIdx] = React.useState(0);
  return (
    <Section id="lead-assignment" className="py-16 md:py-24 bg-surface border-y border-border">
      <Container>
        <h2 className="font-display text-3xl md:text-5xl font-semibold max-w-3xl">
          How Glintr Lead Assignment Works
        </h2>
        <p className="mt-4 text-muted-foreground max-w-2xl">
          A supported process — one stage at a time — through the authorised Glintr Lead
          architecture.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_2fr]">
          <ol className="space-y-2" aria-label="Lead assignment stages">
            {LEAD_STEPS.map((s, i) => (
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
          <div className="rounded-2xl border border-border bg-background p-8 md:p-10">
            <p className="text-label text-primary">
              Stage {idx + 1} of {LEAD_STEPS.length}
            </p>
            <h3 className="mt-2 font-display text-2xl md:text-3xl font-semibold">
              {LEAD_STEPS[idx]}
            </h3>
            <p className="mt-4 text-muted-foreground">
              Lead assignment runs through the authorised Glintr Lead architecture. Selection is
              based on eligibility, applicable performance and available lead opportunities.
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
                onClick={() => setIdx((i) => Math.min(LEAD_STEPS.length - 1, i + 1))}
                disabled={idx === LEAD_STEPS.length - 1}
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

// ── Not Automatic ────────────────────────────────────────────────────────
function NotAutomatic() {
  return (
    <Section id="not-automatic" className="py-16 md:py-24">
      <Container>
        <div className="rounded-3xl border border-primary/40 bg-primary/5 p-10 md:p-14">
          <Badge variant="outline" className="mb-4">IMPORTANT</Badge>
          <h2 className="font-display text-3xl md:text-4xl font-semibold max-w-3xl">
            Leads Are Earned Through Performance. Not Automatically Distributed.
          </h2>
          <p className="mt-5 text-muted-foreground text-lg max-w-3xl">
            Joining the 50% Supported Model does not automatically guarantee lead assignment.
            Glintr evaluates applicable Partner performance and lead-selection qualifications
            before assigning available leads. Lead availability may also affect assignment.
          </p>
        </div>
      </Container>
    </Section>
  );
}

// ── Qualification Explorer ───────────────────────────────────────────────
const FACTORS: {
  key: string;
  title: string;
  why: string;
  affect: string;
  improve: string;
}[] = [
  {
    key: "active",
    title: "Partner Active Status",
    why: "Active Partners are considered when qualified Partners are evaluated for lead assignment.",
    affect: "Inactive Partners may not be prioritised during lead-selection evaluation.",
    improve: "Keep your Partner account active and complete required onboarding steps.",
  },
  {
    key: "onboarding",
    title: "Onboarding Completion",
    why: "Completed onboarding may be a baseline for lead-selection eligibility.",
    affect: "Incomplete onboarding may exclude a Partner from lead-selection evaluation.",
    improve: "Finish every required onboarding step in your Partner Dashboard.",
  },
  {
    key: "activity",
    title: "Recent Partner Activity",
    why: "Recent activity indicates a Partner is ready to act on assigned leads.",
    affect: "Extended inactivity may reduce lead-selection eligibility where applicable.",
    improve: "Stay active on your Partner Dashboard and engage with your assigned work.",
  },
  {
    key: "response",
    title: "Lead Response Performance",
    why: "Available leads may require timely Partner engagement.",
    affect: "Applicable response performance can be considered when qualified Partners are evaluated for lead assignment.",
    improve: "Review assigned leads promptly and follow the approved lead-handling process.",
  },
  {
    key: "handling",
    title: "Lead Handling Quality",
    why: "Quality Partner communication supports a strong learner experience.",
    affect: "Recorded lead handling may be considered during future lead-selection evaluation.",
    improve: "Communicate clearly and follow approved lead-handling standards.",
  },
  {
    key: "followup",
    title: "Follow-Up Discipline",
    why: "Consistent follow-up supports outcomes across the Partner ecosystem.",
    affect: "Follow-up patterns may be considered where the architecture supports it.",
    improve: "Follow up on your assigned leads consistently and within approved processes.",
  },
  {
    key: "conversion",
    title: "Conversion Performance",
    why: "Recorded outcomes on assigned leads may reflect Partner effectiveness.",
    affect: "Recorded conversion performance may be considered in applicable lead-selection evaluation.",
    improve: "Focus on quality communication that supports informed learner decisions.",
  },
  {
    key: "quality",
    title: "Enrollment Quality",
    why: "Verified enrollments through valid attribution matter for the ecosystem.",
    affect: "Enrollment quality may be considered during applicable lead-selection review.",
    improve: "Ensure learners receive accurate Program information before enrolling.",
  },
  {
    key: "policy",
    title: "Policy Compliance",
    why: "Partner policies protect learners and the Glintr Partner ecosystem.",
    affect: "Non-compliance may reduce future lead-selection eligibility where applicable.",
    improve: "Follow Glintr Partner policies and approved brand guidelines.",
  },
  {
    key: "outcomes",
    title: "Previous Lead Outcomes",
    why: "Recorded outcomes provide signal for future lead-selection evaluation.",
    affect: "Previous recorded outcomes may be considered during evaluation.",
    improve: "Record required outcomes correctly using the approved workflow.",
  },
  {
    key: "capacity",
    title: "Current Lead Capacity",
    why: "Partners already handling active leads may be at capacity.",
    affect: "Current capacity may be considered before additional leads are assigned where the Lead architecture supports capacity evaluation.",
    improve: "Progress your active leads through the approved workflow before requesting more.",
  },
];

function QualificationExplorer() {
  const [key, setKey] = React.useState(FACTORS[3].key);
  const active = FACTORS.find((f) => f.key === key) ?? FACTORS[0];
  return (
    <Section id="qualification" className="py-16 md:py-24 bg-surface border-y border-border">
      <Container>
        <div className="max-w-3xl">
          <h2 className="font-display text-3xl md:text-5xl font-semibold">
            What Can Affect Lead Selection?
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            A conceptual explorer of applicable factors. Internal scoring weights are not shown.
          </p>
        </div>
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_2fr]">
          <div className="flex flex-wrap gap-2 lg:flex-col" role="tablist" aria-label="Qualification factors">
            {FACTORS.map((f) => {
              const on = f.key === key;
              return (
                <button
                  key={f.key}
                  role="tab"
                  aria-selected={on}
                  type="button"
                  onClick={() => setKey(f.key)}
                  className={`rounded-lg border px-4 py-2 text-sm text-left transition ${
                    on
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.title}
                </button>
              );
            })}
          </div>
          <div className="rounded-2xl border border-border bg-background p-8" role="tabpanel" aria-live="polite">
            <h3 className="font-display text-2xl md:text-3xl font-semibold">{active.title}</h3>
            <div className="mt-6 grid gap-5">
              <FactorRow label="Why It Matters" text={active.why} />
              <FactorRow label="How It May Affect Lead Selection" text={active.affect} />
              <FactorRow label="What You Can Improve" text={active.improve} />
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Internal scoring weights and fraud/risk signals are not disclosed.
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function FactorRow({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-label text-primary">{label}</p>
      <p className="mt-1.5 text-muted-foreground">{text}</p>
    </div>
  );
}

// ── Performance Selection ────────────────────────────────────────────────
function PerformanceSelection() {
  const positive = [
    "Strong Lead Handling",
    "Consistent Follow-Up",
    "Quality Student Communication",
    "Better Recorded Outcomes",
    "Maintained Partner Eligibility",
  ];
  return (
    <Section id="perf-selection" className="py-16 md:py-24">
      <Container>
        <div className="max-w-3xl">
          <h2 className="font-display text-3xl md:text-5xl font-semibold">
            Your Performance Can Influence Future Lead Opportunities
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            The signals below can positively contribute to future lead-selection evaluation where
            applicable. Poor performance may reduce future lead-selection eligibility where
            supported by the actual architecture.
          </p>
        </div>
        <div className="mt-10 grid gap-3 md:grid-cols-2">
          {positive.map((p) => (
            <div key={p} className="rounded-xl border border-border bg-surface p-5 flex items-start gap-3">
              <TrendingUp className="size-5 text-primary shrink-0 mt-0.5" aria-hidden />
              <span>{p}</span>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted-foreground max-w-3xl">
          Performance does not guarantee the next lead. Lead availability and qualification also
          apply.
        </p>
      </Container>
    </Section>
  );
}

// ── Lead States (conceptual) ─────────────────────────────────────────────
function LeadStatesInfo() {
  const states = [
    { s: "Building Performance", d: "Partner is building activity and outcomes." },
    { s: "Eligible For Lead Evaluation", d: "Partner may be reviewed during lead-selection." },
    { s: "Selected For Lead Assignment", d: "Partner has been selected through the process." },
    { s: "Lead Assigned", d: "A lead has been assigned to the Partner." },
    { s: "Lead In Progress", d: "Partner is handling the assigned lead." },
    { s: "Lead Outcome Recorded", d: "Outcome recorded through the approved workflow." },
  ];
  return (
    <Section id="lead-states" className="py-16 md:py-24 bg-surface border-y border-border">
      <Container>
        <div className="max-w-3xl">
          <h2 className="font-display text-3xl md:text-5xl font-semibold">
            Understand Lead Selection States
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            A conceptual overview. Real lead state changes remain in the authorised backend Lead
            architecture.
          </p>
        </div>
        <ol className="mt-10 grid gap-3 md:grid-cols-3">
          {states.map((x, i) => (
            <li key={x.s} className="rounded-xl border border-border bg-background p-5">
              <p className="text-label text-primary">{String(i + 1).padStart(2, "0")}</p>
              <p className="mt-1.5 font-semibold">{x.s}</p>
              <p className="mt-1 text-sm text-muted-foreground">{x.d}</p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

// ── Illustrative Profiles ────────────────────────────────────────────────
function ProfilesExplorer() {
  const profiles = [
    {
      k: "A",
      title: "Recently Onboarded",
      lines: ["Recently onboarded", "Limited recorded performance", "No recent lead outcomes"],
      note: "May continue building Partner performance before being prioritised for available lead opportunities.",
    },
    {
      k: "B",
      title: "Active Performer",
      lines: [
        "Active Partner",
        "Consistent lead response",
        "Good follow-up history",
        "Recorded lead outcomes",
      ],
      note: "May be considered during applicable performance-based lead selection.",
    },
    {
      k: "C",
      title: "At Capacity",
      lines: ["Lead capacity currently full", "Multiple active assigned leads"],
      note: "Current capacity may be considered before additional leads are assigned where the Lead architecture supports capacity evaluation.",
    },
  ];
  return (
    <Section id="profiles" className="py-16 md:py-24">
      <Container>
        <div className="max-w-3xl">
          <p className="text-label">Illustrative Partner Profiles</p>
          <h2 className="mt-2 font-display text-3xl md:text-5xl font-semibold">
            See How Partner Profiles May Differ
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Fictional educational profiles. No real Partner data is displayed.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {profiles.map((p) => (
            <article key={p.k} className="rounded-2xl border border-border bg-surface p-6">
              <div className="flex items-center gap-3">
                <span className="size-9 rounded-full bg-primary/10 text-primary grid place-items-center font-semibold">
                  {p.k}
                </span>
                <p className="font-semibold">{p.title}</p>
              </div>
              <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                {p.lines.map((l) => (
                  <li key={l} className="flex gap-2">
                    <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
                    {l}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm border-t border-border pt-4">
                <span className="font-medium">Possible explanation:</span> {p.note}
              </p>
            </article>
          ))}
        </div>
      </Container>
    </Section>
  );
}

// ── Calculator ───────────────────────────────────────────────────────────
function Calculator50() {
  const [value, setValue] = React.useState<string>("100000");
  const rev = Math.max(0, Number(value.replace(/[^0-9]/g, "")) || 0);
  const you = half(rev);
  const glintr = half(rev);
  return (
    <Section id="calculator" className="py-16 md:py-24 bg-surface border-y border-border">
      <Container>
        <div className="max-w-3xl">
          <h2 className="font-display text-3xl md:text-5xl font-semibold">
            Calculate Your 50% Revenue Share
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Enter an eligible revenue amount. The calculator instantly shows your 50% Partner
            share and the 50% Glintr share.
          </p>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-background p-8">
            <Label htmlFor="rev-input-50" className="text-label">Eligible Revenue (INR)</Label>
            <Input
              id="rev-input-50"
              inputMode="numeric"
              pattern="[0-9]*"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="mt-2 text-2xl md:text-3xl font-display font-semibold h-14"
              aria-describedby="rev-hint-50"
            />
            <p id="rev-hint-50" className="mt-2 text-xs text-muted-foreground">
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
              <div className="h-full bg-primary" style={{ width: "50%" }} />
              <div className="h-full bg-foreground/70" style={{ width: "50%" }} />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-label text-primary">Your 50% Share</p>
                <p className="mt-1 font-display text-3xl md:text-4xl font-bold text-primary">
                  {inr(you)}
                </p>
              </div>
              <div>
                <p className="text-label">Glintr 50% Share</p>
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

// ── Revenue Progression ──────────────────────────────────────────────────
function RevenueProgression() {
  const [sel, setSel] = React.useState(3);
  const rev = EXAMPLES[sel];
  return (
    <Section id="progression" className="py-16 md:py-24">
      <Container>
        <div className="max-w-3xl">
          <h2 className="font-display text-3xl md:text-5xl font-semibold">
            See The 50% Model At Different Revenue Levels
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Select an eligible revenue level to see the corresponding 50% Partner share.
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
        <div className="mt-8 rounded-2xl border border-border bg-surface p-8 md:p-10">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-label">Eligible Revenue</p>
              <p className="mt-2 font-display text-3xl md:text-4xl font-semibold">{inr(rev)}</p>
            </div>
            <div>
              <p className="text-label text-primary">Partner Share (50%)</p>
              <p className="mt-2 font-display text-3xl md:text-4xl font-bold text-primary">
                {inr(half(rev))}
              </p>
            </div>
            <div>
              <p className="text-label">Glintr Share (50%)</p>
              <p className="mt-2 font-display text-3xl md:text-4xl font-semibold">
                {inr(half(rev))}
              </p>
            </div>
          </div>
          <div className="mt-6 h-3 w-full rounded-full overflow-hidden bg-background flex" aria-hidden>
            <div className="h-full bg-primary" style={{ width: "50%" }} />
            <div className="h-full bg-foreground/70" style={{ width: "50%" }} />
          </div>
        </div>
      </Container>
    </Section>
  );
}

// ── Lead Journey ─────────────────────────────────────────────────────────
const LEAD_JOURNEY = [
  "Lead Available",
  "Eligibility Evaluation",
  "Performance Review",
  "Qualification Review",
  "Partner Selection",
  "Lead Assignment",
  "Partner Response",
  "Lead Follow-Up",
  "Outcome",
  "Performance Update",
];

function LeadJourney() {
  const [stage, setStage] = React.useState(3);
  return (
    <Section id="lead-journey" className="py-16 md:py-24 bg-surface border-y border-border">
      <Container>
        <div className="max-w-3xl">
          <h2 className="font-display text-3xl md:text-5xl font-semibold">
            From Lead Availability To Partner Assignment
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Every stage runs through the authorised Glintr Lead architecture.
          </p>
        </div>
        {/* Desktop rail */}
        <div className="mt-10 hidden md:block">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {LEAD_JOURNEY.map((s, i) => (
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
          <div className="mt-6 rounded-2xl border border-border bg-background p-8">
            <p className="text-label text-primary">Stage {stage + 1}</p>
            <h3 className="mt-2 font-display text-2xl font-semibold">{LEAD_JOURNEY[stage]}</h3>
          </div>
        </div>
        {/* Mobile */}
        <ol className="mt-8 md:hidden space-y-2">
          {LEAD_JOURNEY.map((s, i) => (
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

// ── Improve Eligibility ──────────────────────────────────────────────────
function ImproveEligibility() {
  const items = [
    "Complete Partner onboarding",
    "Remain active",
    "Respond to assigned leads appropriately",
    "Follow approved lead processes",
    "Maintain accurate communication",
    "Record lead outcomes where required",
    "Follow up consistently",
    "Avoid misleading Program claims",
    "Follow Partner policies",
    "Maintain available lead capacity where applicable",
  ];
  return (
    <Section id="improve" className="py-16 md:py-24">
      <Container>
        <div className="max-w-3xl">
          <h2 className="font-display text-3xl md:text-5xl font-semibold">
            Build A Stronger Partner Performance Profile
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Practical, approved behaviours Partners can focus on.
          </p>
        </div>
        <ul className="mt-10 grid gap-3 md:grid-cols-2">
          {items.map((i) => (
            <li key={i} className="rounded-xl border border-border bg-surface px-5 py-4 flex items-start gap-3">
              <Sparkles className="size-5 text-primary shrink-0 mt-0.5" aria-hidden />
              <span>{i}</span>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

// ── Responsibilities ─────────────────────────────────────────────────────
function Responsibilities() {
  const items = [
    "Lead response",
    "Lead follow-up",
    "Student communication",
    "Accurate Program information",
    "Approved lead handling",
    "Recording required outcomes",
    "Valid Enrollment attribution",
    "Policy compliance",
  ];
  return (
    <Section id="responsibilities" className="py-16 md:py-24 bg-surface border-y border-border">
      <Container>
        <div className="max-w-3xl">
          <h2 className="font-display text-3xl md:text-5xl font-semibold">What The Partner Owns</h2>
        </div>
        <ul className="mt-10 grid gap-3 md:grid-cols-2">
          {items.map((i) => (
            <li key={i} className="rounded-xl border border-border bg-background px-5 py-4 flex items-start gap-3">
              <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" aria-hidden />
              <span>{i}</span>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

// ── Glintr Role ──────────────────────────────────────────────────────────
function GlintrRole() {
  const items = [
    { icon: RouteIcon, t: "Eligible Glintr Programs" },
    { icon: Sparkles, t: "Learning Platform" },
    { icon: Users, t: "Partner Dashboard" },
    { icon: TrendingUp, t: "Partner Performance Visibility" },
    { icon: Users, t: "Lead Opportunity Architecture" },
    { icon: ShieldCheck, t: "Performance-Based Lead Selection" },
    { icon: CheckCircle2, t: "Qualified Lead Assignment" },
    { icon: CheckCircle2, t: "Enrollment Attribution" },
    { icon: TrendingUp, t: "Revenue Tracking" },
    { icon: Wallet, t: "Payout Workflow" },
    { icon: Info, t: "Partner Support" },
  ];
  return (
    <Section id="glintr-role" className="py-16 md:py-24">
      <Container>
        <div className="max-w-3xl">
          <h2 className="font-display text-3xl md:text-5xl font-semibold">
            What Glintr Provides In The Supported Model
          </h2>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, t }) => (
            <div key={t} className="rounded-xl border border-border bg-surface p-5 flex items-start gap-3">
              <Icon className="size-5 text-primary shrink-0 mt-0.5" aria-hidden />
              <span>{t}</span>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

// ── Performance Journey ──────────────────────────────────────────────────
const PERF_JOURNEY = [
  "Join",
  "Onboard",
  "Activate",
  "Build Activity",
  "Enter Lead Evaluation",
  "Receive Lead Opportunity Where Selected",
  "Respond",
  "Follow Up",
  "Record Outcome",
  "Build Performance History",
  "Continue Lead Evaluation",
];

function PerformanceJourney() {
  const [stage, setStage] = React.useState(4);
  return (
    <Section id="perf-journey" className="py-16 md:py-24 bg-surface border-y border-border">
      <Container>
        <div className="max-w-3xl">
          <h2 className="font-display text-3xl md:text-5xl font-semibold">
            Build Performance. Become More Competitive For Lead Selection.
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Lead selection remains subject to qualification, performance and available lead
            opportunities.
          </p>
        </div>
        <div className="mt-10 hidden md:block">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {PERF_JOURNEY.map((s, i) => (
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
          <div className="mt-6 rounded-2xl border border-border bg-background p-8">
            <p className="text-label text-primary">Stage {stage + 1}</p>
            <h3 className="mt-2 font-display text-2xl font-semibold">{PERF_JOURNEY[stage]}</h3>
          </div>
        </div>
        <ol className="mt-8 md:hidden space-y-2">
          {PERF_JOURNEY.map((s, i) => (
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

// ── 50 vs 70 Compare ─────────────────────────────────────────────────────
function Compare5070() {
  const cols = [
    {
      title: "70% Revenue Model",
      href: "/70-revenue-model",
      bullets: [
        "70% revenue share",
        "Greater Partner ownership of student acquisition",
        "Partner builds acquisition strategy",
        "No performance-based Glintr lead assignment promise",
      ],
    },
    {
      title: "50% Supported Model",
      bullets: [
        "50% revenue share",
        "Performance-based lead opportunities",
        "Lead-selection qualification",
        "Qualified lead assignment",
        "Partner performance can affect future selection",
        "Lead availability applies",
      ],
      current: true,
    },
  ] as const;

  return (
    <Section id="compare" className="py-16 md:py-24">
      <Container>
        <div className="max-w-3xl">
          <h2 className="font-display text-3xl md:text-5xl font-semibold">
            Choose The Partner Model That Matches How You Want To Grow
          </h2>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {cols.map((c) => (
            <div
              key={c.title}
              className={`rounded-2xl border p-8 ${
                c.current ? "border-primary/50 bg-primary/5" : "border-border bg-surface"
              }`}
            >
              <p className="text-label">{c.current ? "You Are Viewing" : "Other Model"}</p>
              <h3 className="mt-2 font-display text-2xl md:text-3xl font-semibold">{c.title}</h3>
              <ul className="mt-4 space-y-2 text-sm">
                {c.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <CheckCircle2 className="size-4 text-primary shrink-0 mt-1" aria-hidden />
                    {b}
                  </li>
                ))}
              </ul>
              {!c.current && "href" in c && c.href ? (
                <Button asChild variant="outline" size="md" className="mt-6">
                  <Link to={c.href}>Explore 70% Revenue Model <ArrowRight className="size-4" /></Link>
                </Button>
              ) : null}
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Button asChild variant="gradient" size="lg">
            <Link to="/partner/apply">Become A Partner</Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

// ── Fit Explorer ─────────────────────────────────────────────────────────
const FIT_CHOICES = [
  { key: "leads", label: "I Want Glintr Lead Opportunities" },
  { key: "perf", label: "I Am Ready To Be Evaluated On Performance" },
  { key: "respond", label: "I Can Respond To Assigned Leads" },
  { key: "followup", label: "I Can Follow Up Consistently" },
  { key: "history", label: "I Want To Build A Performance History" },
  { key: "own", label: "I Already Generate My Own Student Leads" },
];

function FitExplorer() {
  const [sel, setSel] = React.useState<Record<string, boolean>>({});
  const own = !!sel["own"];
  const supportedCount = ["leads", "perf", "respond", "followup", "history"].filter(
    (k) => sel[k],
  ).length;

  let guidance: React.ReactNode = (
    <p className="text-muted-foreground">
      Select what matches you above. Guidance appears here — this is information only and does
      not approve model eligibility.
    </p>
  );
  if (own) {
    guidance = (
      <div>
        <p className="font-semibold">You may also want to explore the 70% Revenue Model.</p>
        <p className="mt-2 text-muted-foreground">
          If you already generate your own student leads, the 70% Revenue Model may be a strong
          fit — greater Partner ownership of student acquisition with a 70% revenue share.
        </p>
        <div className="mt-4">
          <Button asChild variant="outline" size="md">
            <Link to="/70-revenue-model">Explore 70% Revenue Model <ArrowRight className="size-4" /></Link>
          </Button>
        </div>
      </div>
    );
  } else if (supportedCount >= 2) {
    guidance = (
      <p className="text-muted-foreground">
        The 50% Supported Model may match your intent. Lead assignment remains subject to
        performance, applicable qualifications and lead availability.
      </p>
    );
  }

  return (
    <Section id="fit" className="py-16 md:py-24 bg-surface border-y border-border">
      <Container>
        <div className="max-w-3xl">
          <h2 className="font-display text-3xl md:text-5xl font-semibold">
            Is The 50% Supported Model Right For You?
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Select what matches you. This explorer offers guidance only.
          </p>
        </div>
        <div className="mt-10 grid gap-8 lg:grid-cols-[3fr_2fr]">
          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="sr-only">Model fit choices</legend>
            {FIT_CHOICES.map((c) => {
              const on = !!sel[c.key];
              return (
                <label
                  key={c.key}
                  className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer ${
                    on ? "border-primary bg-primary/5" : "border-border bg-background"
                  }`}
                >
                  <Checkbox
                    checked={on}
                    onCheckedChange={(v) => setSel((s) => ({ ...s, [c.key]: !!v }))}
                    aria-label={c.label}
                  />
                  <span className="text-sm">{c.label}</span>
                </label>
              );
            })}
          </fieldset>
          <div className="rounded-2xl border border-border bg-background p-6" aria-live="polite">
            <p className="text-label text-primary">Guidance</p>
            <div className="mt-3">{guidance}</div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

// ── FAQs ─────────────────────────────────────────────────────────────────
function FAQs() {
  const faqs = [
    {
      q: "Is the Partner revenue share 50%?",
      a: "Yes. The 50% Supported Model uses a 50% Partner revenue share on eligible revenue under the applicable Glintr Partner revenue structure.",
    },
    {
      q: "If eligible revenue is ₹1 lakh, how much is my share?",
      a: "₹50,000. The 50% Partner share is calculated directly on eligible attributed revenue.",
    },
    {
      q: "Does every Partner receive leads?",
      a: "No. Lead assignment is based on applicable Partner performance, lead-selection qualifications, eligibility and lead availability.",
    },
    {
      q: "How does Glintr select Partners for leads?",
      a: "Applicable performance and qualification signals are evaluated through the approved lead-selection process. Internal scoring weights are not disclosed.",
    },
    {
      q: "Does good performance guarantee leads?",
      a: "No. Performance may influence lead-selection evaluation, but lead assignment also depends on qualification and available lead opportunities.",
    },
    {
      q: "Can poor lead handling affect future lead opportunities?",
      a: "Recorded Partner performance may be considered in future lead-selection evaluation where applicable.",
    },
    {
      q: "Can I choose the 70% model instead?",
      a: "Yes. The 70% Revenue Model is a separate Partner model focused on greater Partner ownership of student acquisition with a 70% revenue share.",
    },
  ];
  return (
    <Section id="faq" className="py-16 md:py-24">
      <Container>
        <h2 className="font-display text-3xl md:text-5xl font-semibold max-w-3xl">
          50% Supported Model FAQs
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

// ── Final CTA ────────────────────────────────────────────────────────────
function FinalCTA({ reduced }: { reduced: boolean }) {
  return (
    <Section id="final-cta" className="py-20 md:py-28">
      <Container>
        <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-surface to-background p-10 md:p-16 text-center">
          <h2 className="font-display text-3xl md:text-5xl font-semibold max-w-3xl mx-auto">
            Ready To Build Your Performance And Earn 50% Revenue Share?
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
            Join the Glintr Partner ecosystem, build a strong Partner performance profile and
            become eligible for performance-based lead selection.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild variant="gradient" size="lg">
              <Link to="/partner/apply">Become A Partner</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/70-revenue-model">Explore 70% Revenue Model</Link>
            </Button>
            <Button variant="secondary" size="lg" onClick={() => scrollToId("calculator", reduced)}>
              Calculate My 50% Share
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
