import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Briefcase,
  Building2,
  GraduationCap,
  Rocket,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Section, Container } from "@/components/shared/section";
import { cn } from "@/lib/utils";
import { setJourney, type JourneyId } from "@/lib/visitor-journey";

interface JourneyCard {
  id: JourneyId;
  title: string;
  icon: LucideIcon;
  description: string;
  cta: string;
  to: string;
  accent: string; // hex used for the icon glow
  size: "lg" | "md";
}

const CARDS: JourneyCard[] = [
  {
    id: "student",
    title: "Engineering Students",
    icon: GraduationCap,
    description:
      "Internships, industry projects, certifications and placement-focused learning while completing your degree.",
    cta: "Explore Student Programs",
    to: "/for-students",
    accent: "#00E6FF",
    size: "lg",
  },
  {
    id: "professional",
    title: "Working Professionals",
    icon: Briefcase,
    description:
      "Upskill, switch careers, learn AI and earn promotions with flexible industry-ready programs.",
    cta: "Advance Your Career",
    to: "/for-professionals",
    accent: "#2E5CFF",
    size: "lg",
  },
  {
    id: "company",
    title: "Companies & Teams",
    icon: Building2,
    description:
      "Upskill your workforce with customized training programs, assessments and analytics.",
    cta: "Corporate Learning",
    to: "/for-companies",
    accent: "#7CFF6B",
    size: "md",
  },
  {
    id: "partner",
    title: "Sales Partners",
    icon: TrendingUp,
    description:
      "Earn by recommending programs. Choose the 70% self-sales model or 50% supported-sales model.",
    cta: "Start Earning",
    to: "/earn",
    accent: "#FFB020",
    size: "md",
  },
  {
    id: "academy",
    title: "Launch Your Own Academy",
    icon: Rocket,
    description:
      "Build your own education brand while Glintr manages technology, websites, LMS, content, operations, marketing and support.",
    cta: "Launch My Academy",
    to: "/launch-your-brand",
    accent: "#FF4D8D",
    size: "md",
  },
];

export function WhoAreYou() {
  return (
    <Section className="relative py-16 md:py-24 border-t border-border/60">
      <Container>
        <div className="max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.22em] font-medium text-primary mb-3">
            Start Here
          </p>
          <h2 className="text-display-sm md:text-display-md font-display font-semibold tracking-tight text-balance">
            Who are you?
          </h2>
          <p className="mt-4 text-body-lg text-muted-foreground">
            Choose the journey that best matches your goals — Glintr tailors
            programs, recommendations and pathways around it.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:gap-5 grid-cols-1 md:grid-cols-6">
          {CARDS.map((card, i) => (
            <JourneyCardTile key={card.id} card={card} index={i} />
          ))}
        </div>
      </Container>
    </Section>
  );
}

function JourneyCardTile({ card, index }: { card: JourneyCard; index: number }) {
  const Icon = card.icon;
  const col =
    card.size === "lg" ? "md:col-span-3" : "md:col-span-2";
  return (
    <Link
      to={card.to}
      onClick={() => setJourney({ id: card.id })}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card",
        "p-6 md:p-7 flex flex-col gap-5 min-h-[240px]",
        "transition-[transform,box-shadow,border-color] duration-300 ease-out",
        "hover:-translate-y-[3px] hover:shadow-xl hover:border-border-strong",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        col,
      )}
      style={{
        // Subtle top-right radial tint using the card's accent
        backgroundImage: `radial-gradient(circle at 90% 0%, ${card.accent}18, transparent 55%)`,
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="inline-flex size-12 items-center justify-center rounded-xl bg-foreground/[0.04] border border-border/70 transition-colors group-hover:border-border-strong"
          style={{ color: card.accent }}
          aria-hidden
        >
          <Icon className="size-6" strokeWidth={1.8} />
        </span>
        <span className="text-mono text-[11px] text-muted-foreground">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="font-display text-xl md:text-2xl font-semibold tracking-tight">
          {card.title}
        </h3>
        <p className="text-body text-muted-foreground line-clamp-3">
          {card.description}
        </p>
      </div>

      <div className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
        <span>{card.cta}</span>
        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
