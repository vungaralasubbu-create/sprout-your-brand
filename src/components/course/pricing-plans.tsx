import { Link } from "@tanstack/react-router";
import { CheckCircle2, ArrowRight, Sparkles, Minus, Check } from "lucide-react";

import { Section, Container } from "@/components/shared/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CounsellorForm } from "@/components/shared/counsellor-form";
import { cn } from "@/lib/utils";

export interface CoursePricingPlansProps {
  applyTo: { category: string; course: string };
  onApplyClick?: () => void;
  counsellorCtx?: Parameters<typeof CounsellorForm>[0]["context"];
}

type Plan = {
  id: "self" | "launch" | "pro";
  name: string;
  tagline: string;
  original: number;
  price: number;
  save: number;
  badge?: string;
  cta: string;
  features: string[]; // exactly 8 items — compact card
  variant: "light" | "featured" | "advanced";
};

const PLANS: Plan[] = [
  {
    id: "self",
    name: "Self Paced",
    tagline: "Learn on your schedule with a portfolio-first curriculum.",
    original: 6999,
    price: 3999,
    save: 3000,
    cta: "Start Self Paced",
    variant: "light",
    features: [
      "Recorded Learning",
      "Practical Projects",
      "Certification",
      "Portfolio Building",
      "Community Access",
      "AI Learning Assistant",
      "Lifetime Access",
      "Skill Assessments",
    ],
  },
  {
    id: "launch",
    name: "Career Launch",
    tagline: "Live mentor learning with internship & placement support.",
    original: 7999,
    price: 5499,
    save: 2500,
    badge: "MOST POPULAR",
    cta: "Choose Career Launch",
    variant: "featured",
    features: [
      "Live Mentor Classes",
      "Industry Projects",
      "Internship",
      "Placement Assistance",
      "Certification",
      "AI Interview Practice",
      "Resume & LinkedIn Review",
      "Community Access",
    ],
  },
  {
    id: "pro",
    name: "Career Pro",
    tagline: "Everything in Career Launch — plus dedicated 1:1 mentoring.",
    original: 14999,
    price: 9999,
    save: 5000,
    badge: "ADVANCED",
    cta: "Go Career Pro",
    variant: "advanced",
    features: [
      "Everything in Career Launch",
      "Dedicated Mentor",
      "Premium Projects",
      "Priority Support",
      "Mock Interviews",
      "Career Coaching",
      "Hiring Assistance",
      "Executive Certification",
    ],
  },
];

// Mobile order: Career Launch first, then Self-Paced, then Career Pro.
const MOBILE_ORDER: Plan["id"][] = ["launch", "self", "pro"];

function inr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function CoursePricingPlans({ applyTo, onApplyClick, counsellorCtx }: CoursePricingPlansProps) {
  return (
    <Section id="pricing" className="py-14 lg:py-20 bg-gradient-to-b from-background to-surface-1/40">
      <Container>
        <div className="max-w-2xl mx-auto text-center mb-10 lg:mb-14">
          <span className="text-caption font-mono uppercase tracking-widest text-primary">
            Choose Your Learning Path
          </span>
          <h2 className="mt-3 text-heading-xl lg:text-display-sm font-display font-semibold tracking-tight text-balance">
            Three plans. One outcome — a career you're proud of.
          </h2>
          <p className="mt-4 text-muted-foreground text-balance">
            Compact plans built around how much mentor support and career preparation you want.
          </p>
        </div>

        <div className="grid gap-5 lg:gap-6 lg:grid-cols-3 items-stretch">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              applyTo={applyTo}
              onApplyClick={onApplyClick}
              counsellorCtx={counsellorCtx}
              mobileOrder={MOBILE_ORDER.indexOf(plan.id)}
            />
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Prices in INR. Taxes as applicable. Plan availability may vary by course.
        </p>

        <FeatureComparisonTable />
      </Container>
    </Section>
  );
}

function PlanCard({
  plan,
  applyTo,
  onApplyClick,
  counsellorCtx,
  mobileOrder,
}: {
  plan: Plan;
  applyTo: CoursePricingPlansProps["applyTo"];
  onApplyClick?: () => void;
  counsellorCtx?: CoursePricingPlansProps["counsellorCtx"];
  mobileOrder: number;
}) {
  const featured = plan.variant === "featured";
  const advanced = plan.variant === "advanced";

  return (
    <article
      style={{ order: mobileOrder }}
      className={cn(
        "relative flex flex-col rounded-3xl border p-6 lg:p-7 transition-all duration-300 lg:order-none",
        "hover:-translate-y-1 hover:shadow-2xl",
        featured
          ? "border-primary/60 bg-white shadow-[0_20px_60px_-20px_oklch(0.6_0.18_240_/_0.35)] ring-1 ring-primary/30"
          : advanced
            ? "border-border/80 bg-gradient-to-b from-[oklch(0.97_0.02_240)] to-white shadow-md"
            : "border-border bg-white shadow-sm",
      )}
    >
      {featured ? (
        <div
          aria-hidden
          className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-[oklch(0.75_0.18_200)]/10 opacity-70 pointer-events-none"
        />
      ) : null}

      {plan.badge ? (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Badge
            className={cn(
              "px-3 py-1 text-[10.5px] tracking-widest font-semibold shadow-md",
              featured
                ? "bg-gradient-to-r from-primary to-[oklch(0.65_0.18_200)] text-white border-transparent"
                : "bg-foreground text-background border-transparent",
            )}
          >
            {featured ? <Sparkles className="size-3 mr-1" /> : null}
            {plan.badge}
          </Badge>
        </div>
      ) : null}

      <div className="relative flex flex-col flex-1">
        <div>
          <h3 className="font-display font-semibold text-xl tracking-tight">{plan.name}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{plan.tagline}</p>
        </div>

        <div className="mt-4 pb-4 border-b border-border/60">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-display font-semibold text-[2.25rem] lg:text-[2.5rem] tracking-tight leading-none">
              {inr(plan.price)}
            </span>
            <span className="text-sm text-muted-foreground line-through">{inr(plan.original)}</span>
          </div>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center rounded-full bg-success/10 text-success text-[10.5px] font-semibold px-2 py-0.5 tracking-wide">
              SAVE {inr(plan.save)}
            </span>
            <span className="text-xs text-muted-foreground">One-time program fee</span>
          </div>
        </div>

        <ul className="mt-4 space-y-2 flex-1">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-[13.5px] leading-snug">
              <CheckCircle2
                className={cn(
                  "size-4 shrink-0 mt-0.5",
                  featured ? "text-primary" : advanced ? "text-[oklch(0.55_0.18_240)]" : "text-success",
                )}
              />
              <span className="text-foreground/90">{f}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-col gap-2">
          <Button asChild size="lg" variant={featured ? "gradient" : advanced ? "primary" : "outline"}>
            <Link to="/programs/$category/$course/apply" params={applyTo} onClick={onApplyClick}>
              {plan.cta}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <CounsellorForm size="md" variant="ghost" context={counsellorCtx} />
        </div>
      </div>
    </article>
  );
}

// -------------------- FEATURE COMPARISON TABLE --------------------

type Availability = true | false | "premium";

const COMPARISON: Array<{ feature: string; self: Availability; launch: Availability; pro: Availability }> = [
  { feature: "Live Classes", self: false, launch: true, pro: true },
  { feature: "Mentor Support", self: false, launch: true, pro: "premium" },
  { feature: "Industry Projects", self: true, launch: true, pro: "premium" },
  { feature: "Internship", self: false, launch: true, pro: true },
  { feature: "Placement Assistance", self: false, launch: true, pro: true },
  { feature: "AI Learning Assistant", self: true, launch: true, pro: true },
  { feature: "Resume & LinkedIn Review", self: false, launch: true, pro: true },
  { feature: "Mock Interviews", self: false, launch: false, pro: true },
  { feature: "Career Coach (1:1)", self: false, launch: false, pro: true },
  { feature: "Certification", self: true, launch: true, pro: "premium" },
  { feature: "Community Access", self: true, launch: true, pro: true },
  { feature: "Portfolio Building", self: true, launch: true, pro: true },
];

function Cell({ value }: { value: Availability }) {
  if (value === true)
    return (
      <span className="inline-flex size-6 items-center justify-center rounded-full bg-success/12 text-success">
        <Check className="size-3.5" strokeWidth={2.5} />
      </span>
    );
  if (value === "premium")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10.5px] font-semibold tracking-wide text-primary">
        <Sparkles className="size-2.5" /> PREMIUM
      </span>
    );
  return (
    <span className="inline-flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground/60">
      <Minus className="size-3.5" />
    </span>
  );
}

function FeatureComparisonTable() {
  return (
    <div className="mt-16 lg:mt-20">
      <div className="max-w-2xl mx-auto text-center mb-8 lg:mb-10">
        <span className="text-caption font-mono uppercase tracking-widest text-primary">Compare Plans</span>
        <h3 className="mt-3 text-heading-lg lg:text-heading-xl font-display font-semibold tracking-tight text-balance">
          Feature-by-Feature Comparison
        </h3>
        <p className="mt-3 text-sm text-muted-foreground">
          See exactly what's included in each plan — no fine print.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border/70 bg-white shadow-sm">
        {/* Header row */}
        <div className="grid grid-cols-[minmax(140px,1.6fr)_repeat(3,minmax(90px,1fr))] items-center border-b border-border/60 bg-gradient-to-r from-surface-1/60 via-white to-surface-1/60 px-4 lg:px-6 py-4">
          <div className="text-caption font-mono uppercase tracking-widest text-muted-foreground">Feature</div>
          <div className="text-center">
            <div className="text-[13px] font-display font-semibold">Self Paced</div>
            <div className="text-[10.5px] text-muted-foreground mt-0.5 hidden sm:block">Learn on your own</div>
          </div>
          <div className="text-center relative">
            <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5">
              <Sparkles className="size-2.5 text-primary" />
              <span className="text-[9.5px] font-semibold tracking-widest text-primary">POPULAR</span>
            </div>
            <div className="mt-1 text-[13px] font-display font-semibold">Career Launch</div>
          </div>
          <div className="text-center">
            <div className="text-[13px] font-display font-semibold">Career Pro</div>
            <div className="text-[10.5px] text-muted-foreground mt-0.5 hidden sm:block">1:1 mentorship</div>
          </div>
        </div>

        {/* Body rows */}
        <ul className="divide-y divide-border/50">
          {COMPARISON.map((row, i) => (
            <li
              key={row.feature}
              className={cn(
                "grid grid-cols-[minmax(140px,1.6fr)_repeat(3,minmax(90px,1fr))] items-center px-4 lg:px-6 py-3.5 text-sm",
                i % 2 === 1 ? "bg-surface-1/30" : "bg-white",
              )}
            >
              <span className="font-medium text-foreground/90">{row.feature}</span>
              <span className="flex justify-center">
                <Cell value={row.self} />
              </span>
              <span className="flex justify-center bg-primary/[0.03] py-1 rounded-sm">
                <Cell value={row.launch} />
              </span>
              <span className="flex justify-center">
                <Cell value={row.pro} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
