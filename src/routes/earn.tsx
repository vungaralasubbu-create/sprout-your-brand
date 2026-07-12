import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  Handshake,
  LineChart,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Wallet,
} from "lucide-react";

import { Section, Container, SectionHeader } from "@/components/shared/section";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";

export const Route = createFileRoute("/earn")({
  head: () => ({
    meta: [
      { title: "Earn With Glintr — Sales Partner & Revenue Sharing" },
      {
        name: "description",
        content:
          "Turn your sales skill into predictable income. Earn up to 70% revenue share as a Sales Partner or up to 50% selling with company leads. Weekly payouts, no cap.",
      },
      { property: "og:title", content: "Earn With Glintr — Up to 70% Revenue Share" },
      {
        property: "og:description",
        content:
          "Two proven models: sell using your own leads (up to 70%) or with company-supplied leads (up to 50%). Transparent payouts every week.",
      },
    ],
  }),
  component: EarnPage,
});

function EarnPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <EarnHero />
        <TwoModels />
        <EligibilitySection />
        <EarningsEstimator />
        <PayoutTimeline />
        <TransparencySection />
        <FinalCTA />
      </main>
      <SiteFooter />
    </div>
  );
}

/* ---------------- Hero ---------------- */

function EarnHero() {
  return (
    <Section padding="lg" tone="default" className="overflow-hidden">
      <Container size="xl">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="flex flex-col gap-6">
            <Badge variant="soft" className="w-fit">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Sales Partner Program
            </Badge>
            <h1 className="text-display text-balance">
              Sell career programs.{" "}
              <span className="bg-gradient-brand bg-clip-text text-transparent">
                Keep up to 70%.
              </span>
            </h1>
            <p className="text-subheading text-muted-foreground max-w-xl">
              Two clear ways to earn with Glintr. Choose leads you own or use
              company-supplied leads — both come with weekly payouts, transparent
              dashboards, and no earning cap.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" variant="gradient">
                <Link to="/partner/apply">
                  Apply as Sales Partner <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#estimator">See your earnings</a>
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-6 pt-6 border-t">
              <HeroStat value="₹4.2Cr+" label="Partner payouts" />
              <HeroStat value="1,200+" label="Active partners" />
              <HeroStat value="48h" label="Payout SLA" />
            </div>
          </div>
          <ModelHighlightCards />
        </div>
      </Container>
    </Section>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-2xl md:text-3xl font-semibold">{value}</div>
      <div className="text-caption text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function ModelHighlightCards() {
  return (
    <div className="grid gap-4">
      <div className="relative rounded-3xl border bg-card p-6 shadow-elevated overflow-hidden">
        <div className="absolute inset-0 bg-gradient-brand opacity-[0.06] pointer-events-none" />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-caption text-muted-foreground">
              <Handshake className="h-4 w-4" /> Model 01
            </div>
            <div className="mt-1 font-display text-xl font-semibold">Own Leads</div>
          </div>
          <div className="text-right">
            <div className="font-display text-4xl font-semibold text-primary">70%</div>
            <div className="text-caption text-muted-foreground">revenue share</div>
          </div>
        </div>
        <p className="relative text-sm text-muted-foreground mt-3">
          You bring the customer. We handle the delivery, LMS, and support. You
          keep the majority of the revenue on every sale.
        </p>
      </div>
      <div className="rounded-3xl border bg-card p-6 shadow-card">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-caption text-muted-foreground">
              <Users className="h-4 w-4" /> Model 02
            </div>
            <div className="mt-1 font-display text-xl font-semibold">Company Leads</div>
          </div>
          <div className="text-right">
            <div className="font-display text-4xl font-semibold">50%</div>
            <div className="text-caption text-muted-foreground">revenue share</div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          We supply verified inbound leads. You focus on closing. Great for
          full-time closers who want volume without prospecting.
        </p>
      </div>
    </div>
  );
}

/* ---------------- Two models deep-dive ---------------- */

const modelBenefits = {
  own: [
    { icon: Banknote, title: "Up to 70% share", copy: "Highest split in the industry for owned leads." },
    { icon: ShieldCheck, title: "No inventory risk", copy: "We deliver the program — you don't touch content or ops." },
    { icon: Clock, title: "Flexible hours", copy: "Sell part-time or full-time. Your schedule, your pace." },
    { icon: LineChart, title: "Live dashboard", copy: "Track leads, conversions, and payouts in real time." },
  ],
  supported: [
    { icon: Target, title: "Warm inbound leads", copy: "Marketing-qualified leads routed automatically." },
    { icon: Users, title: "Sales enablement", copy: "Scripts, objection handling, and coaching included." },
    { icon: Banknote, title: "Up to 50% share", copy: "No lead cost, no ad spend, no risk on your side." },
    { icon: BadgeCheck, title: "Certified programs", copy: "Sell only verified, high-conversion programs." },
  ],
};

function TwoModels() {
  return (
    <Section padding="md" tone="surface">
      <Container size="xl">
        <SectionHeader
          eyebrow="Two ways to earn"
          title="Pick the model that fits your strengths"
          description="Both models pay weekly, have no earning cap, and give you the same partner dashboard, CRM, and support."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <ModelCard
            variant="primary"
            eyebrow="Model 01 · Own Leads"
            title="Become a Sales Partner"
            share="70%"
            description="You own the customer relationship. We deliver the program. You keep the majority of every sale."
            perfectFor="Sales pros with a network, freelancers, ex-consultants."
            benefits={modelBenefits.own}
            cta="Apply as Sales Partner"
          />
          <ModelCard
            variant="secondary"
            eyebrow="Model 02 · Company Leads"
            title="Sell With Company Leads"
            share="50%"
            description="We provide the leads and enablement. You focus on what you do best — closing."
            perfectFor="Full-time closers who want steady inbound flow."
            benefits={modelBenefits.supported}
            cta="Apply to close leads"
          />
        </div>
      </Container>
    </Section>
  );
}

function ModelCard({
  variant,
  eyebrow,
  title,
  share,
  description,
  perfectFor,
  benefits,
  cta,
}: {
  variant: "primary" | "secondary";
  eyebrow: string;
  title: string;
  share: string;
  description: string;
  perfectFor: string;
  benefits: { icon: React.ComponentType<{ className?: string }>; title: string; copy: string }[];
  cta: string;
}) {
  const isPrimary = variant === "primary";
  return (
    <Card className={isPrimary ? "border-primary/40 shadow-elevated relative overflow-hidden" : ""}>
      {isPrimary && (
        <div className="absolute inset-0 bg-gradient-brand opacity-[0.04] pointer-events-none" />
      )}
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <Badge variant={isPrimary ? "certified" : "outline"}>{eyebrow}</Badge>
          <div className="text-right">
            <div
              className={
                "font-display text-4xl font-semibold " +
                (isPrimary ? "bg-gradient-brand bg-clip-text text-transparent" : "")
              }
            >
              {share}
            </div>
            <div className="text-caption text-muted-foreground">to partner</div>
          </div>
        </div>
        <CardTitle className="text-2xl mt-3">{title}</CardTitle>
        <p className="text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="relative space-y-6">
        <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Perfect for: </span>
          <span className="font-medium">{perfectFor}</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {benefits.map((b) => (
            <div key={b.title} className="flex gap-3">
              <div className="mt-0.5 h-8 w-8 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <b.icon className="h-4 w-4" />
              </div>
              <div>
                <div className="font-medium text-sm">{b.title}</div>
                <div className="text-caption text-muted-foreground">{b.copy}</div>
              </div>
            </div>
          ))}
        </div>
        <Button
          asChild
          size="lg"
          variant={isPrimary ? "gradient" : "default"}
          className="w-full"
        >
          <Link to="/partner/apply">
            {cta} <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/* ---------------- Eligibility ---------------- */

function EligibilitySection() {
  const requirements = [
    "1+ year of sales, business development, or consulting experience",
    "Comfortable talking to career-driven professionals",
    "Willing to complete Glintr's 2-hour onboarding & product training",
    "Access to phone, laptop, and a stable internet connection",
    "A network of leads OR willingness to close company-supplied leads",
  ];

  return (
    <Section padding="md">
      <Container size="lg">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeader
              align="left"
              eyebrow="Who this is for"
              title="You'll thrive on Glintr if…"
              description="We keep the bar high so every partner earns predictably. Here's what we look for."
            />
          </div>
          <ul className="space-y-3">
            {requirements.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 rounded-xl border bg-card p-4"
              >
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}

/* ---------------- Earnings estimator ---------------- */

function EarningsEstimator() {
  const [mode, setMode] = React.useState<"own" | "supported">("own");
  const [sales, setSales] = React.useState<number>(5);
  const [price, setPrice] = React.useState<number>(45000);

  const share = mode === "own" ? 0.7 : 0.5;
  const monthly = Math.round(sales * price * share);
  const yearly = monthly * 12;

  return (
    <Section padding="md" tone="surface" id="estimator">
      <Container size="xl">
        <SectionHeader
          eyebrow="Earnings estimator"
          title="See what a month with Glintr can look like"
          description="Adjust the numbers below. Real partners average 6–14 program sales per month once their pipeline warms up."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <Card>
            <CardContent className="p-6 space-y-6">
              <Tabs value={mode} onValueChange={(v) => setMode(v as "own" | "supported")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="own">Own leads · 70%</TabsTrigger>
                  <TabsTrigger value="supported">Company leads · 50%</TabsTrigger>
                </TabsList>
                <TabsContent value="own" className="text-caption text-muted-foreground pt-3">
                  You bring the customer. Highest split.
                </TabsContent>
                <TabsContent value="supported" className="text-caption text-muted-foreground pt-3">
                  We route inbound leads. You close.
                </TabsContent>
              </Tabs>

              <SliderRow
                label="Program sales per month"
                value={sales}
                min={1}
                max={30}
                step={1}
                onChange={setSales}
                display={`${sales} sales`}
              />
              <SliderRow
                label="Avg. program price"
                value={price}
                min={15000}
                max={150000}
                step={1000}
                onChange={setPrice}
                display={inr(price)}
              />
              <div className="text-caption text-muted-foreground">
                Example based on selected sales inputs. Real payouts follow the
                weekly commission workflow.
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-brand opacity-[0.05] pointer-events-none" />
            <CardContent className="relative p-6 md:p-8 space-y-6">
              <div>
                <div className="text-caption text-muted-foreground">Your monthly earning</div>
                <div className="font-display text-5xl md:text-6xl font-semibold bg-gradient-brand bg-clip-text text-transparent">
                  {inr(monthly)}
                </div>
                <div className="text-caption text-muted-foreground mt-1">
                  ~ {inr(yearly)} per year at this pace
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <MetricTile label="Revenue share" value={`${Math.round(share * 100)}%`} />
                <MetricTile label="Avg. sale" value={inr(price)} />
                <MetricTile label="Per-sale payout" value={inr(price * share)} />
                <MetricTile label="Monthly sales" value={String(sales)} />
              </div>

              <Button asChild size="lg" variant="gradient" className="w-full">
                <Link to="/partner/apply">
                  Apply and unlock your dashboard{" "}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Container>
    </Section>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className="font-display font-semibold">{display}</span>
      </div>
      <Slider
        className="mt-3"
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0] ?? min)}
      />
      <div className="mt-1 flex justify-between text-caption text-muted-foreground">
        <span>{typeof min === "number" && min > 1000 ? inr(min) : min}</span>
        <span>{typeof max === "number" && max > 1000 ? inr(max) : max}</span>
      </div>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="text-caption text-muted-foreground">{label}</div>
      <div className="font-display text-lg font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function inr(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

/* ---------------- Payout timeline ---------------- */

function PayoutTimeline() {
  const steps = [
    { icon: Handshake, title: "You close a sale", copy: "Enrollment is recorded in your dashboard instantly." },
    { icon: ShieldCheck, title: "Verification (T+3)", copy: "We verify enrollment, payment, and refund window." },
    { icon: CalendarClock, title: "Commission approved", copy: "Approved commissions are locked to your ledger." },
    { icon: Wallet, title: "Weekly payout (T+7)", copy: "Every Monday, we send approved commissions to your bank." },
  ];
  return (
    <Section padding="md">
      <Container size="xl">
        <SectionHeader
          eyebrow="How payouts work"
          title="Predictable, weekly, on the clock"
          description="No chasing invoices. Every approved commission is settled within seven days."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="relative rounded-2xl border bg-card p-5">
              <div className="absolute -top-3 left-5 text-caption font-mono bg-background border rounded-full px-2 py-0.5">
                Step {i + 1}
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mt-2">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="mt-4 font-display font-semibold">{s.title}</div>
              <p className="text-caption text-muted-foreground mt-1">{s.copy}</p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* ---------------- Transparency ---------------- */

function TransparencySection() {
  const rows = [
    { k: "Revenue share (own leads)", v: "Up to 70%" },
    { k: "Revenue share (company leads)", v: "Up to 50%" },
    { k: "Payout cycle", v: "Weekly, every Monday" },
    { k: "Verification window", v: "3 business days" },
    { k: "Refund clawback window", v: "7 days from enrollment" },
    { k: "Minimum payout", v: "₹500" },
    { k: "Onboarding time", v: "48 hours after approval" },
    { k: "Support", v: "Dedicated partner manager" },
  ];
  return (
    <Section padding="md" tone="surface">
      <Container size="lg">
        <SectionHeader
          eyebrow="Full transparency"
          title="No fine print. Just numbers."
          description="Every commission is calculated with a snapshot of the rule that applied at the moment of the sale. Nothing changes retroactively."
        />
        <div className="mt-10 rounded-2xl border bg-card divide-y">
          {rows.map((r) => (
            <div key={r.k} className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-muted-foreground">{r.k}</span>
              <span className="font-display font-semibold">{r.v}</span>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* ---------------- Final CTA ---------------- */

function FinalCTA() {
  return (
    <Section padding="lg" tone="inverse" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-brand opacity-20 pointer-events-none" />
      <Container size="lg" className="relative">
        <div className="text-center flex flex-col items-center gap-6">
          <Badge variant="soft" className="bg-white/10 text-white border-white/20">
            <Rocket className="mr-1.5 h-3.5 w-3.5" /> Ready when you are
          </Badge>
          <h2 className="text-hero text-balance text-white">
            Your next payslip could be a payout.
          </h2>
          <p className="text-subheading text-white/80 max-w-2xl">
            Apply in under 6 minutes. Our team reviews every application within
            48 hours. If approved, you'll be selling and earning by next week.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild size="xl" variant="gradient">
              <Link to="/partner/apply">
                Start my application <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="xl"
              variant="outline"
              className="bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white"
            >
              <Link to="/">
                <Building2 className="mr-2 h-4 w-4" /> Explore white-label brand
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
