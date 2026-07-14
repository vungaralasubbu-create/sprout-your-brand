import { Link } from "@tanstack/react-router";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";

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
  description: string;
  original: number;
  price: number;
  save: number;
  badge?: string;
  cta: string;
  features: string[];
  variant: "light" | "featured" | "advanced";
};

const PLANS: Plan[] = [
  {
    id: "self",
    name: "Glintr Self-Paced Edge",
    description: "Learn at your own pace. Build practical skills with guided support.",
    original: 6999,
    price: 3999,
    save: 3000,
    cta: "Start Self-Paced",
    variant: "light",
    features: [
      "Full self-paced curriculum access",
      "Practical, outcome-focused learning",
      "10 doubt-clearing support sessions",
      "Recorded learning content",
      "Hands-on assignments and exercises",
      "Industry-inspired practical projects",
      "Capstone project experience",
      "AI-assisted interview practice",
      "Resume preparation guidance",
      "Glintr Course Completion Certificate for eligible learners",
      "Portfolio-building support",
      "Lifetime curriculum updates",
    ],
  },
  {
    id: "launch",
    name: "Glintr Career Launch Program",
    description: "Learn. Build. Prepare for What's Next.",
    original: 7999,
    price: 5499,
    save: 2500,
    badge: "MOST POPULAR",
    cta: "Choose Career Launch",
    variant: "featured",
    features: [
      "30+ interactive and mentor-led sessions",
      "Live mentor learning experience",
      "Practical, outcome-focused curriculum",
      "15+ industry-inspired projects",
      "Hands-on capstone project based on practical scenarios",
      "Structured doubt-clearing support",
      "Guided learning throughout the program",
      "AI-assisted interview practice",
      "Resume preparation and career guidance",
      "Career and internship readiness support",
      "Glintr Course Completion Certificate for eligible learners",
      "Portfolio-building through practical project execution",
    ],
  },
  {
    id: "pro",
    name: "Glintr Career Pro Program",
    description: "Advanced learning. Industry exposure. Stronger career preparation.",
    original: 14999,
    price: 9999,
    save: 5000,
    badge: "ADVANCED",
    cta: "Go Career Pro",
    variant: "advanced",
    features: [
      "60+ live interactive and mentor-led sessions",
      "Advanced instructor-led learning",
      "Priority doubt-clearing support",
      "20+ industry-inspired practical projects",
      "Advanced capstone project",
      "Live project reviews and mentor feedback",
      "Advanced interview preparation",
      "AI-assisted mock interview practice",
      "Resume and LinkedIn profile guidance",
      "Career and internship readiness support",
      "Portfolio development assistance",
      "Certification opportunities from partnered companies/MNCs, where applicable and subject to partner eligibility",
      "Glintr Course Completion Certificate for eligible learners",
      "Priority career guidance support",
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
    <Section className="py-14 lg:py-20 bg-gradient-to-b from-background to-surface-1/40">
      <Container>
        <div className="max-w-2xl mx-auto text-center mb-10 lg:mb-14">
          <span className="text-caption font-mono uppercase tracking-widest text-primary">
            Choose Your Learning Path
          </span>
          <h2 className="mt-3 text-heading-xl lg:text-display-sm font-display font-semibold tracking-tight text-balance">
            Choose How You Want To Learn
          </h2>
          <p className="mt-4 text-muted-foreground text-balance">
            Flexible learning plans designed for different goals, schedules, and levels of career support.
          </p>
        </div>

        <div className="grid gap-6 lg:gap-7 lg:grid-cols-3 items-stretch">
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

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Prices in INR. Taxes as applicable. Plan availability may vary by course.
        </p>
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
        "relative flex flex-col rounded-3xl border p-7 lg:p-8 transition-all duration-300 lg:order-none",
        "hover:-translate-y-1.5 hover:shadow-2xl",
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
              "px-3 py-1 text-[11px] tracking-widest font-semibold shadow-md",
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
        <div className="min-h-[92px]">
          <h3 className="font-display font-semibold text-xl lg:text-[1.35rem] tracking-tight">
            {plan.name}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {plan.description}
          </p>
        </div>

        <div className="mt-5 pb-6 border-b border-border/60 min-h-[120px]">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-display font-semibold text-4xl lg:text-[2.75rem] tracking-tight leading-none">
              {inr(plan.price)}
            </span>
            <span className="text-sm text-muted-foreground line-through">
              {inr(plan.original)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center rounded-full bg-success/10 text-success text-[11px] font-semibold px-2 py-0.5 tracking-wide">
              SAVE {inr(plan.save)}
            </span>
            <span className="text-xs text-muted-foreground">One-time program fee</span>
          </div>
        </div>

        <ul className="mt-6 space-y-2.5 flex-1">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm leading-snug">
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

        <div className="mt-7 flex flex-col gap-2.5">
          <Button asChild size="lg" variant={featured ? "gradient" : advanced ? "primary" : "outline"}>
            <Link to="/programs/$category/$course/apply" params={applyTo} onClick={onApplyClick}>
              {plan.cta}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <CounsellorForm size="lg" variant="ghost" context={counsellorCtx} />
        </div>
      </div>
    </article>
  );
}
