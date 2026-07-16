import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";

import { Section, Container } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  clearJourney,
  setJourney,
  useJourney,
  type JourneyId,
  type JourneyProfile,
} from "@/lib/visitor-journey";
import { track } from "@/lib/intent";

/* ------------------------------------------------------------------ */
/* Card definitions                                                    */
/* ------------------------------------------------------------------ */

interface CardDef {
  id: JourneyId;
  emoji: string;
  title: string;
  description: string;
  cta: string;
  accent: string;
  hubHref: string;
  welcome: string;
}

const CARDS: CardDef[] = [
  {
    id: "student",
    emoji: "🎓",
    title: "I'm a Student",
    description:
      "I'm looking to build my skills, get internships, certifications and placements.",
    cta: "Explore Learning",
    accent: "#00E6FF",
    hubHref: "/for-students",
    welcome: "Continue your learning journey",
  },
  {
    id: "professional",
    emoji: "💼",
    title: "I'm a Working Professional",
    description:
      "I want to upskill, switch careers or grow my salary.",
    cta: "Advance My Career",
    accent: "#2E5CFF",
    hubHref: "/for-professionals",
    welcome: "Continue advancing your career",
  },
  {
    id: "partner",
    emoji: "💰",
    title: "I Want to Earn",
    description:
      "Earn by recommending Glintr programs. Choose the 70% Self-Sales or 50% Supported-Sales model.",
    cta: "Become a Sales Partner",
    accent: "#FFB020",
    hubHref: "/earn",
    welcome: "Continue as a Sales Partner",
  },
  {
    id: "academy",
    emoji: "🚀",
    title: "I Want to Launch My Academy",
    description:
      "Launch your education brand while Glintr manages technology, websites, LMS, SEO, blogs, marketing and operations.",
    cta: "Launch My Academy",
    accent: "#FF4D8D",
    hubHref: "/launch-your-brand",
    welcome: "Continue launching your academy",
  },
  {
    id: "company",
    emoji: "🏢",
    title: "Corporate Training",
    description:
      "Train your employees using AI-powered learning and analytics.",
    cta: "Explore Enterprise Solutions",
    accent: "#7CFF6B",
    hubHref: "/for-companies",
    welcome: "Continue with Enterprise Solutions",
  },
];

/* ------------------------------------------------------------------ */
/* Section                                                              */
/* ------------------------------------------------------------------ */

export function WhoAreYou() {
  const journey = useJourney();
  const [active, setActive] = React.useState<JourneyId | null>(null);
  const [dismissedWelcome, setDismissedWelcome] = React.useState(false);

  const activeCard = React.useMemo(
    () => CARDS.find((c) => c.id === active) ?? null,
    [active],
  );

  const savedCard = journey
    ? CARDS.find((c) => c.id === journey.id) ?? null
    : null;

  return (
    <Section className="relative py-16 md:py-24 border-t border-border/60">
      <Container>
        <div className="max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.22em] font-medium text-primary mb-3 inline-flex items-center gap-2">
            <Sparkles className="size-3.5" /> Personalize your experience
          </p>
          <h2 className="text-display-sm md:text-display-md font-display font-semibold tracking-tight text-balance">
            What brings you to Glintr today?
          </h2>
          <p className="mt-4 text-body-lg text-muted-foreground">
            Choose your journey and we'll personalize your experience.
          </p>
        </div>

        {savedCard && !active && !dismissedWelcome ? (
          <WelcomeBackBanner
            card={savedCard}
            journey={journey!}
            onContinue={() => setActive(savedCard.id)}
            onReset={() => {
              clearJourney();
              track("journey_reset");
              setDismissedWelcome(true);
            }}
            onDismiss={() => setDismissedWelcome(true)}
          />
        ) : null}

        <div className="mt-8 grid gap-4 md:gap-5 grid-cols-1 md:grid-cols-6">
          {CARDS.map((card, i) => (
            <JourneyTile
              key={card.id}
              card={card}
              index={i}
              active={active === card.id}
              anyActive={active !== null}
              onClick={() => {
                const next = active === card.id ? null : card.id;
                setActive(next);
                if (next) {
                  setJourney({ id: next });
                  setDismissedWelcome(true);
                }
              }}
            />
          ))}
        </div>

        {/* Inline expansion panel */}
        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity,margin] duration-500 ease-out",
            activeCard
              ? "mt-6 grid-rows-[1fr] opacity-100"
              : "mt-0 grid-rows-[0fr] opacity-0",
          )}
          aria-live="polite"
        >
          <div className="overflow-hidden">
            {activeCard ? (
              <FlowPanel
                key={activeCard.id}
                card={activeCard}
                onClose={() => setActive(null)}
              />
            ) : null}
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Welcome-back                                                        */
/* ------------------------------------------------------------------ */

function WelcomeBackBanner({
  card,
  journey,
  onContinue,
  onReset,
  onDismiss,
}: {
  card: CardDef;
  journey: JourneyProfile;
  onContinue: () => void;
  onReset: () => void;
  onDismiss: () => void;
}) {
  const summary = summarizeJourney(journey);
  return (
    <div
      className="mt-8 rounded-2xl border border-border bg-card/80 backdrop-blur-md p-5 md:p-6 flex flex-wrap items-center gap-4 animate-fade-in"
      style={{
        backgroundImage: `radial-gradient(circle at 100% 0%, ${card.accent}18, transparent 55%)`,
      }}
    >
      <span className="text-2xl" aria-hidden>
        {card.emoji}
      </span>
      <div className="flex-1 min-w-[220px]">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Welcome back
        </p>
        <p className="font-display text-lg font-semibold">
          {card.welcome}
        </p>
        {summary ? (
          <p className="text-caption text-muted-foreground mt-0.5">{summary}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <Button size="sm" variant="gradient" onClick={onContinue}>
          Continue <ArrowRight className="size-3.5" />
        </Button>
        <Button size="sm" variant="ghost" onClick={onReset}>
          <RotateCcw className="size-3.5" /> Change journey
        </Button>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] transition"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

function summarizeJourney(j: JourneyProfile): string {
  const bits: string[] = [];
  if (j.id === "student") {
    if (j.studentType) bits.push(j.studentType);
    if (j.branch) bits.push(j.branch);
    if (j.year) bits.push(j.year);
  } else if (j.id === "professional") {
    if (j.industry) bits.push(j.industry);
    if (j.currentExperience) bits.push(j.currentExperience);
    if (j.careerGoal) bits.push(j.careerGoal);
  } else if (j.id === "partner") {
    if (j.revenueModel) bits.push(`${j.revenueModel}% model`);
  }
  return bits.join(" · ");
}

/* ------------------------------------------------------------------ */
/* Card tile                                                           */
/* ------------------------------------------------------------------ */

function JourneyTile({
  card,
  index,
  active,
  anyActive,
  onClick,
}: {
  card: CardDef;
  index: number;
  active: boolean;
  anyActive: boolean;
  onClick: () => void;
}) {
  // Layout: first two cards span 3 cols (large), last three span 2 cols
  const col = index < 2 ? "md:col-span-3" : "md:col-span-2";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card/70 backdrop-blur-md text-left",
        "p-6 md:p-7 flex flex-col gap-4 min-h-[220px]",
        "transition-[transform,box-shadow,border-color,opacity] duration-300 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active
          ? "border-primary shadow-xl -translate-y-[3px]"
          : "border-border hover:-translate-y-[3px] hover:shadow-xl hover:border-border-strong",
        anyActive && !active ? "opacity-70" : "opacity-100",
        col,
      )}
      style={{
        backgroundImage: `radial-gradient(circle at 90% 0%, ${card.accent}18, transparent 55%)`,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-3xl" aria-hidden>
          {card.emoji}
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

      <div className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium">
        <span style={{ color: card.accent }}>{card.cta}</span>
        <ArrowRight
          className={cn(
            "size-4 transition-transform duration-300",
            active ? "translate-x-1" : "group-hover:translate-x-1",
          )}
          style={{ color: card.accent }}
        />
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Flow panel wrapper                                                  */
/* ------------------------------------------------------------------ */

function FlowPanel({
  card,
  onClose,
}: {
  card: CardDef;
  onClose: () => void;
}) {
  return (
    <div
      className="rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-6 md:p-8 animate-fade-in"
      style={{
        backgroundImage: `radial-gradient(circle at 0% 0%, ${card.accent}14, transparent 55%)`,
      }}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden>
            {card.emoji}
          </span>
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Personalizing
            </p>
            <h3 className="font-display text-xl md:text-2xl font-semibold">
              {card.title}
            </h3>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] transition"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-6">
        {card.id === "student" ? <StudentFlow card={card} /> : null}
        {card.id === "professional" ? <ProfessionalFlow card={card} /> : null}
        {card.id === "partner" ? <PartnerFlow card={card} /> : null}
        {card.id === "academy" ? <AcademyFlow card={card} /> : null}
        {card.id === "company" ? <CorporateFlow card={card} /> : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared primitives                                                   */
/* ------------------------------------------------------------------ */

function StepLabel({ step, title }: { step: string; title: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-mono text-[11px] text-muted-foreground">
        {step}
      </span>
      <h4 className="font-display text-base md:text-lg font-semibold">
        {title}
      </h4>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm transition-all duration-200",
        active
          ? "border-primary bg-primary text-primary-foreground -translate-y-[1px] shadow-sm"
          : "border-border bg-card text-foreground hover:border-border-strong",
      )}
    >
      {children}
    </button>
  );
}

function RecommendationGrid({
  title,
  items,
  accent,
}: {
  title: string;
  items: { label: string; to: string; hint?: string }[];
  accent: string;
}) {
  return (
    <div className="mt-6">
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
        {title}
      </p>
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <Link
            key={it.label}
            to={it.to}
            className="group rounded-xl border border-border bg-card/60 p-3.5 flex items-center gap-3 hover:border-border-strong hover:-translate-y-[2px] hover:shadow-md transition-all"
          >
            <span
              className="inline-flex size-2 rounded-full shrink-0"
              style={{ background: accent }}
              aria-hidden
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{it.label}</p>
              {it.hint ? (
                <p className="text-caption text-muted-foreground truncate">
                  {it.hint}
                </p>
              ) : null}
            </div>
            <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function HubCta({ card }: { card: CardDef }) {
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <Button asChild variant="gradient" size="lg">
        <Link to={card.hubHref}>
          {card.cta} <ArrowRight className="size-4" />
        </Link>
      </Button>
      <Button asChild variant="outline" size="lg">
        <Link to="/programs">Browse programs</Link>
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Student flow                                                        */
/* ------------------------------------------------------------------ */

const STUDENT_TYPES = [
  "Engineering Student",
  "Degree Student",
  "Diploma Student",
  "School Student",
  "Recent Graduate",
];

const ENG_BRANCHES = [
  "Computer Science",
  "Artificial Intelligence",
  "Information Technology",
  "Electronics",
  "Electrical",
  "Mechanical",
  "Civil",
  "Automobile",
  "Aerospace",
  "Biotechnology",
  "Chemical",
];

const STUDENT_YEARS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "Final Year",
  "Graduate",
];

function StudentFlow({ card }: { card: CardDef }) {
  const j = useJourney();
  const [type, setType] = React.useState(j?.studentType ?? "");
  const [branch, setBranch] = React.useState(j?.branch ?? "");
  const [year, setYear] = React.useState(j?.year ?? "");

  const showBranch = type === "Engineering Student";
  const canRecommend = !!type && (!showBranch || !!branch) && !!year;

  return (
    <div className="space-y-6">
      <div>
        <StepLabel step="01" title="Which type of student are you?" />
        <div className="mt-4 flex flex-wrap gap-2">
          {STUDENT_TYPES.map((t) => (
            <Chip
              key={t}
              active={type === t}
              onClick={() => {
                setType(t);
                if (t !== "Engineering Student") setBranch("");
                setJourney({ id: "student", studentType: t });
                track("student_type_selected", { type: t });
              }}
            >
              {t}
            </Chip>
          ))}
        </div>
      </div>

      {showBranch ? (
        <div className="animate-fade-in">
          <StepLabel step="02" title="Choose your branch" />
          <div className="mt-4 flex flex-wrap gap-2">
            {ENG_BRANCHES.map((b) => (
              <Chip
                key={b}
                active={branch === b}
                onClick={() => {
                  setBranch(b);
                  setJourney({ id: "student", branch: b });
                  track("student_branch_selected", { branch: b });
                }}
              >
                {b}
              </Chip>
            ))}
          </div>
        </div>
      ) : null}

      {type ? (
        <div className="animate-fade-in">
          <StepLabel
            step={showBranch ? "03" : "02"}
            title="Which year are you currently studying?"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {STUDENT_YEARS.map((y) => (
              <Chip
                key={y}
                active={year === y}
                onClick={() => {
                  setYear(y);
                  setJourney({ id: "student", year: y });
                  track("student_year_selected", { year: y });
                }}
              >
                {y}
              </Chip>
            ))}
          </div>
        </div>
      ) : null}

      {canRecommend ? (
        <div className="animate-fade-in">
          <RecommendationGrid
            title={`Recommended for you · ${[type, branch, year].filter(Boolean).join(" · ")}`}
            accent={card.accent}
            items={[
              { label: "Programs", to: "/programs", hint: "Curated for your branch" },
              { label: "Learning Paths", to: "/learning-paths" },
              { label: "Internships", to: "/programs", hint: "Paid & remote" },
              { label: "Projects", to: "/programs", hint: "Portfolio-ready" },
              { label: "Career Roadmaps", to: "/learning-paths" },
              { label: "Resume Builder", to: "/tools" },
              { label: "Mock Interviews", to: "/tools" },
              { label: "Blogs", to: "/blog" },
              { label: "AI Mentor", to: "/tools", hint: "Ask anything" },
            ]}
          />
          <HubCta card={card} />
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Professional flow                                                   */
/* ------------------------------------------------------------------ */

const PRO_INDUSTRIES = [
  "SaaS / Product",
  "IT Services",
  "BFSI",
  "Manufacturing",
  "Healthcare",
  "E-commerce",
  "Consulting",
  "Government / PSU",
];
const PRO_EXPERIENCE = ["0–2 years", "2–5 years", "5–10 years", "10+ years"];
const PRO_GOALS = [
  "Upskill in current role",
  "Switch to a new career",
  "Move into leadership",
  "Grow my salary",
  "Learn AI / GenAI",
];
const PRO_TARGET_ROLES = [
  "AI Engineer",
  "Data Scientist",
  "Product Manager",
  "Engineering Manager",
  "Cloud Engineer",
  "Marketing Lead",
  "Finance Manager",
];
const PRO_SCHEDULES = [
  "Weekends only",
  "3–5 hrs / week",
  "5–8 hrs / week",
  "Flexible",
];

function ProfessionalFlow({ card }: { card: CardDef }) {
  const j = useJourney();
  const [industry, setIndustry] = React.useState(j?.industry ?? "");
  const [experience, setExperience] = React.useState(j?.currentExperience ?? "");
  const [targetRole, setTargetRole] = React.useState(j?.desiredRole ?? "");
  const [goal, setGoal] = React.useState(j?.careerGoal ?? "");
  const [schedule, setSchedule] = React.useState(j?.learningSchedule ?? "");

  const save = (patch: Partial<JourneyProfile>) =>
    setJourney({ id: "professional", ...patch });

  const canRecommend = !!(industry && experience && goal);

  return (
    <div className="space-y-6">
      <FlowSection step="01" title="Current industry">
        <div className="flex flex-wrap gap-2">
          {PRO_INDUSTRIES.map((v) => (
            <Chip key={v} active={industry === v} onClick={() => { setIndustry(v); save({ industry: v }); }}>
              {v}
            </Chip>
          ))}
        </div>
      </FlowSection>

      <FlowSection step="02" title="Current experience">
        <div className="flex flex-wrap gap-2">
          {PRO_EXPERIENCE.map((v) => (
            <Chip key={v} active={experience === v} onClick={() => { setExperience(v); save({ currentExperience: v }); }}>
              {v}
            </Chip>
          ))}
        </div>
      </FlowSection>

      <FlowSection step="03" title="Target role">
        <div className="flex flex-wrap gap-2">
          {PRO_TARGET_ROLES.map((v) => (
            <Chip key={v} active={targetRole === v} onClick={() => { setTargetRole(v); save({ desiredRole: v }); }}>
              {v}
            </Chip>
          ))}
        </div>
      </FlowSection>

      <FlowSection step="04" title="Career goal">
        <div className="flex flex-wrap gap-2">
          {PRO_GOALS.map((v) => (
            <Chip
              key={v}
              active={goal === v}
              onClick={() => {
                setGoal(v);
                save({ careerGoal: v });
                track("professional_goal_selected", { goal: v });
              }}
            >
              {v}
            </Chip>
          ))}
        </div>
      </FlowSection>

      <FlowSection step="05" title="Preferred learning schedule">
        <div className="flex flex-wrap gap-2">
          {PRO_SCHEDULES.map((v) => (
            <Chip key={v} active={schedule === v} onClick={() => { setSchedule(v); save({ learningSchedule: v }); }}>
              {v}
            </Chip>
          ))}
        </div>
      </FlowSection>

      {canRecommend ? (
        <div className="animate-fade-in">
          <RecommendationGrid
            title={`Recommended for you · ${[industry, experience, goal].filter(Boolean).join(" · ")}`}
            accent={card.accent}
            items={[
              { label: "Weekend Programs", to: "/programs", hint: "For working professionals" },
              { label: "Executive Programs", to: "/programs/management" },
              { label: "AI Programs", to: "/programs/computer-science" },
              { label: "Leadership Programs", to: "/programs/management" },
              { label: "Career Switch Programs", to: "/programs" },
              { label: "Salary Roadmap", to: "/for-professionals" },
              { label: "Relevant Blogs", to: "/blog" },
              { label: "Industry Certifications", to: "/programs" },
            ]}
          />
          <HubCta card={card} />
        </div>
      ) : null}
    </div>
  );
}

function FlowSection({
  step,
  title,
  children,
}: {
  step: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <StepLabel step={step} title={title} />
      <div className="mt-4">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Partner flow                                                        */
/* ------------------------------------------------------------------ */

function PartnerFlow({ card }: { card: CardDef }) {
  const j = useJourney();
  const [model, setModel] = React.useState<"70" | "50" | "">(
    (j?.revenueModel as "70" | "50" | undefined) ?? "",
  );

  const pick = (m: "70" | "50") => {
    setModel(m);
    setJourney({ id: "partner", revenueModel: m });
    track("partner_model_selected", { model: m });
  };

  return (
    <div className="space-y-6">
      <StepLabel step="01" title="Choose your revenue model" />
      <div className="grid gap-4 md:grid-cols-2">
        <ModelCard
          active={model === "70"}
          onClick={() => pick("70")}
          badge="70% Revenue Share"
          title="Self-Sales Model"
          copy="I already have my own audience and want to keep more of the revenue."
          accent={card.accent}
        />
        <ModelCard
          active={model === "50"}
          onClick={() => pick("50")}
          badge="50% Revenue Share"
          title="Supported-Sales Model"
          copy="I want verified leads and full sales support from Glintr."
          accent={card.accent}
        />
      </div>

      {model ? (
        <div className="animate-fade-in">
          <RecommendationGrid
            title={`Partner tools · ${model}% model`}
            accent={card.accent}
            items={[
              { label: "Income Calculator", to: "/income-calculator", hint: "Project monthly earnings" },
              { label: "Success Stories", to: "/success-stories" },
              { label: "Weekly Payout Process", to: "/payout-system" },
              { label: "AI Sales Assistant", to: "/earn" },
              { label: model === "70" ? "70% Revenue Model" : "50% Supported Model", to: model === "70" ? "/revenue-70" : "/revenue-50" },
              { label: "Become a Partner", to: "/earn" },
            ]}
          />
          <HubCta card={card} />
        </div>
      ) : null}
    </div>
  );
}

function ModelCard({
  active,
  onClick,
  badge,
  title,
  copy,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  badge: string;
  title: string;
  copy: string;
  accent: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "text-left rounded-2xl border p-5 md:p-6 bg-card/70 backdrop-blur-md",
        "transition-[transform,border-color,box-shadow] duration-300",
        active
          ? "border-primary shadow-lg -translate-y-[2px]"
          : "border-border hover:border-border-strong hover:-translate-y-[2px] hover:shadow-md",
      )}
      style={{ backgroundImage: `radial-gradient(circle at 100% 0%, ${accent}14, transparent 55%)` }}
    >
      <p
        className="text-[11px] uppercase tracking-[0.22em] font-semibold"
        style={{ color: accent }}
      >
        {badge}
      </p>
      <h5 className="mt-1 font-display text-lg font-semibold">{title}</h5>
      <p className="mt-2 text-caption text-muted-foreground">{copy}</p>
      {active ? (
        <span className="mt-3 inline-flex items-center gap-1 text-xs text-primary">
          <Check className="size-3.5" /> Selected
        </span>
      ) : null}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Academy flow                                                        */
/* ------------------------------------------------------------------ */

const ACADEMY_TIMELINE = [
  "Idea",
  "Brand",
  "Logo",
  "Website",
  "Programs",
  "Courses",
  "Blogs",
  "SEO",
  "Marketing",
  "Student Portal",
  "Certificates",
  "Growth",
];

function AcademyFlow({ card }: { card: CardDef }) {
  React.useEffect(() => {
    setJourney({ id: "academy", academyInterest: true });
    track("academy_interest");
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <StepLabel step="01" title="Launch your education brand" />
        <p className="mt-3 text-muted-foreground max-w-2xl">
          Glintr manages the entire lifecycle so you can focus on teaching.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-5 md:p-6">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-4">
          Your journey
        </p>
        <ol className="flex flex-wrap gap-2 items-center">
          {ACADEMY_TIMELINE.map((step, i) => (
            <React.Fragment key={step}>
              <li
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm"
                style={{ boxShadow: `inset 0 0 0 1px ${card.accent}22` }}
              >
                <span
                  className="text-mono text-[10px]"
                  style={{ color: card.accent }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {step}
              </li>
              {i < ACADEMY_TIMELINE.length - 1 ? (
                <span className="text-muted-foreground/60" aria-hidden>
                  →
                </span>
              ) : null}
            </React.Fragment>
          ))}
        </ol>
        <p className="mt-5 text-body-sm text-muted-foreground">
          Everything except teaching and business decisions is managed by Glintr.
        </p>
      </div>

      <RecommendationGrid
        title="Ready when you are"
        accent={card.accent}
        items={[
          { label: "AI Brand Builder", to: "/launch-your-brand" },
          { label: "Marketing Support", to: "/marketing-support" },
          { label: "AI Employees", to: "/launch-your-brand" },
          { label: "LMS & Student Portal", to: "/lms" },
          { label: "Book Consultation", to: "/book-consultation" },
          { label: "Success Stories", to: "/success-stories" },
        ]}
      />
      <HubCta card={card} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Corporate flow                                                      */
/* ------------------------------------------------------------------ */

function CorporateFlow({ card }: { card: CardDef }) {
  React.useEffect(() => {
    setJourney({ id: "company", corporateInterest: true });
    track("corporate_interest");
  }, []);

  const services = [
    "Leadership",
    "AI Upskilling",
    "Compliance",
    "Technical Training",
    "Analytics Dashboard",
    "Dedicated Account Manager",
  ];

  return (
    <div className="space-y-6">
      <div>
        <StepLabel step="01" title="Corporate training built for teams" />
        <p className="mt-3 text-muted-foreground max-w-2xl">
          AI-powered learning, custom paths, dashboards and analytics — with a
          dedicated account manager for every engagement.
        </p>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <div
            key={s}
            className="rounded-xl border border-border bg-card/60 p-4 flex items-center gap-3"
          >
            <span
              className="inline-flex size-2 rounded-full shrink-0"
              style={{ background: card.accent }}
              aria-hidden
            />
            <span className="text-sm font-medium">{s}</span>
          </div>
        ))}
      </div>

      <RecommendationGrid
        title="Enterprise resources"
        accent={card.accent}
        items={[
          { label: "Enterprise Solutions", to: "/for-companies" },
          { label: "Case Studies", to: "/success-stories" },
          { label: "Schedule Demo", to: "/book-consultation" },
          { label: "Talk to Sales", to: "/contact" },
        ]}
      />
      <HubCta card={card} />
    </div>
  );
}
