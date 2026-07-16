import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import {
  ArrowRight,
  Award,
  BarChart3,
  Briefcase,
  Calendar,
  Cloud,
  Code2,
  Cpu,
  DollarSign,
  LineChart,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { setJourney, useJourney } from "@/lib/visitor-journey";
import { track } from "@/lib/intent";

const SITE_URL = "https://glintr.com";

export const Route = createFileRoute("/for-professionals")({
  head: () => {
    const title = "For Working Professionals — Upskill, Switch, Grow | Glintr";
    const description =
      "AI, cloud, product, data and leadership programs for working professionals. Get a personalized career switch plan, promotion timeline and weekend learning schedule.";
    const canonical = `${SITE_URL}/for-professionals`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonical },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  component: ProfessionalHub,
});

const EXPERIENCE_BANDS = [
  "0–2 years",
  "2–5 years",
  "5–10 years",
  "10+ years",
];

const TARGET_SALARY = [
  "Under ₹12 LPA",
  "₹12–24 LPA",
  "₹24–48 LPA",
  "₹48 LPA+",
];

const LEARNING_TIME = [
  "3–5 hrs / week",
  "5–8 hrs / week",
  "Weekends only",
  "Flexible",
];

const INDUSTRIES = [
  "SaaS / Product",
  "IT Services",
  "BFSI",
  "Manufacturing",
  "Healthcare",
  "E-commerce / Consumer",
  "Consulting",
  "Government / PSU",
];

interface Track {
  key: string;
  title: string;
  copy: string;
  icon: LucideIcon;
  to: string;
}

const TRACKS: Track[] = [
  { key: "career-switch", title: "Career Switch Programs", copy: "Structured switch plans with mentorship and portfolio projects.", icon: TrendingUp, to: "/programs" },
  { key: "ai", title: "AI Programs", copy: "ChatGPT, Claude, Gemini, prompt engineering and applied AI.", icon: Sparkles, to: "/programs/computer-science" },
  { key: "leadership", title: "Leadership Programs", copy: "Management, executive presence and team leadership.", icon: Users, to: "/programs/management" },
  { key: "cloud", title: "Cloud", copy: "AWS, Azure and modern infrastructure fundamentals.", icon: Cloud, to: "/programs/computer-science" },
  { key: "cyber", title: "Cyber Security", copy: "SOC, cloud security and offensive security tracks.", icon: Cpu, to: "/programs/computer-science" },
  { key: "product", title: "Product Management", copy: "Product thinking, roadmaps, discovery and delivery.", icon: LineChart, to: "/programs/management" },
  { key: "analytics", title: "Business Analytics", copy: "SQL, dashboards and analytical decision-making.", icon: BarChart3, to: "/programs/management" },
  { key: "data", title: "Data Science", copy: "Applied ML, data wrangling and portfolio projects.", icon: Code2, to: "/programs/computer-science" },
  { key: "marketing", title: "Digital Marketing", copy: "Performance, content and growth marketing tracks.", icon: TrendingUp, to: "/programs/management" },
  { key: "finance", title: "Finance", copy: "Corporate finance, FP&A and financial modeling.", icon: DollarSign, to: "/programs/management" },
  { key: "ib", title: "Investment Banking", copy: "Valuation, M&A and pitchbook fundamentals.", icon: DollarSign, to: "/programs/management" },
  { key: "hr", title: "HR", copy: "Modern HRBP, talent and org design.", icon: Users, to: "/programs/management" },
  { key: "pm", title: "Project Management", copy: "Agile, Scrum, PMP-aligned fundamentals.", icon: Briefcase, to: "/programs/management" },
];

function ProfessionalHub() {
  const journey = useJourney();
  const [currentRole, setCurrentRole] = React.useState(journey?.currentRole ?? "");
  const [experience, setExperience] = React.useState(journey?.currentExperience ?? "");
  const [desiredRole, setDesiredRole] = React.useState(journey?.desiredRole ?? "");
  const [targetSalary, setTargetSalary] = React.useState(journey?.targetSalary ?? "");
  const [learningTime, setLearningTime] = React.useState(journey?.learningTime ?? "");
  const [industry, setIndustry] = React.useState(journey?.industry ?? "");

  React.useEffect(() => {
    if (!journey || journey.id !== "professional") setJourney({ id: "professional" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const savePlan = () => {
    setJourney({
      id: "professional",
      currentRole,
      currentExperience: experience,
      desiredRole,
      targetSalary,
      learningTime,
      industry,
    });
    track("professional_intake_saved", {
      hasRole: !!currentRole,
      hasDesired: !!desiredRole,
    });
  };

  const hasIntake = !!(currentRole && experience && desiredRole);

  return (
    <>
      <SiteHeader />
      <main>
        <Section className="pt-14 pb-6 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-brand-soft opacity-30" />
          <Container>
            <p className="text-[11px] uppercase tracking-[0.22em] font-medium text-primary mb-3 inline-flex items-center gap-2">
              <Sparkles className="size-3.5" /> Working Professionals
            </p>
            <h1 className="text-display-md font-display font-semibold tracking-tight text-balance max-w-3xl">
              Grow, switch, or lead — with a plan built around your career.
            </h1>
            <p className="mt-4 text-body-lg text-muted-foreground max-w-2xl">
              Tell Glintr where you are and where you want to be. We'll match
              programs, certifications, a promotion timeline and a weekend
              schedule to your goal.
            </p>
          </Container>
        </Section>

        {/* INTAKE */}
        <Section className="py-8">
          <Container>
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <h2 className="font-display text-heading-xl md:text-2xl font-semibold">
                Build my career plan
              </h2>
              <p className="mt-2 text-caption">Takes under a minute. Nothing leaves your device unless you enroll.</p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Field label="Current role">
                  <Input
                    value={currentRole}
                    onChange={(e) => setCurrentRole(e.target.value)}
                    placeholder="e.g. Software Engineer"
                  />
                </Field>
                <Field label="Current experience">
                  <ChipGroup options={EXPERIENCE_BANDS} value={experience} onChange={setExperience} />
                </Field>
                <Field label="Desired role">
                  <Input
                    value={desiredRole}
                    onChange={(e) => setDesiredRole(e.target.value)}
                    placeholder="e.g. AI Engineer or Product Manager"
                  />
                </Field>
                <Field label="Target salary">
                  <ChipGroup options={TARGET_SALARY} value={targetSalary} onChange={setTargetSalary} />
                </Field>
                <Field label="Preferred learning time">
                  <ChipGroup options={LEARNING_TIME} value={learningTime} onChange={setLearningTime} />
                </Field>
                <Field label="Industry">
                  <ChipGroup options={INDUSTRIES} value={industry} onChange={setIndustry} />
                </Field>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="gradient" size="lg" onClick={savePlan}>
                  Save & personalize <ArrowRight className="size-4" />
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/book-consultation">Book a free advisor call</Link>
                </Button>
              </div>
            </div>
          </Container>
        </Section>

        {/* RECOMMENDED TRACKS */}
        <Section className="py-12 md:py-16 border-t border-border/60">
          <Container>
            <div className="flex items-end justify-between flex-wrap gap-3">
              <div>
                <p className="text-mono text-xs text-muted-foreground">Tracks</p>
                <h2 className="mt-1 text-heading-xl md:text-2xl font-display font-semibold">
                  {hasIntake ? `Curated for a ${currentRole} → ${desiredRole} switch` : "Programs professionals reach for most"}
                </h2>
              </div>
            </div>
            <div className="mt-8 grid gap-4 md:gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {TRACKS.map((t) => {
                const Icon = t.icon;
                return (
                  <Link
                    key={t.key}
                    to={t.to}
                    className={cn(
                      "group rounded-2xl border border-border bg-card p-6 flex flex-col gap-3",
                      "transition-[transform,box-shadow,border-color] duration-300",
                      "hover:-translate-y-[3px] hover:shadow-lg hover:border-border-strong",
                    )}
                  >
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-foreground/[0.04] border border-border/70 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="font-display text-lg font-semibold">{t.title}</h3>
                    <p className="text-caption text-muted-foreground">{t.copy}</p>
                    <span className="mt-auto inline-flex items-center gap-1 text-sm text-primary">
                      Explore <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </Container>
        </Section>

        {/* GROWTH ARTIFACTS */}
        <Section className="py-14 md:py-20 bg-surface-2/40 border-y border-border/60">
          <Container>
            <div className="grid gap-5 md:grid-cols-3">
              <MetricCard icon={DollarSign} label="Salary Growth" copy="Realistic salary bands mapped to your target role and industry." />
              <MetricCard icon={LineChart} label="Career Roadmap" copy="A step-by-step plan from your current role to your desired one." />
              <MetricCard icon={Calendar} label="Promotion Timeline" copy="Milestones for the next 12, 24 and 36 months." />
              <MetricCard icon={Award} label="Industry Certifications" copy="Certificates that hiring managers actually recognize." />
              <MetricCard icon={Calendar} label="Weekend Learning" copy="Sessions and projects designed for full-time workers." />
              <MetricCard icon={Calendar} label="Flexible Schedule" copy="Learn at your own pace with async and cohort options." />
            </div>
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          aria-pressed={value === opt}
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm transition-all",
            value === opt
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground hover:border-border-strong",
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  copy,
}: {
  icon: LucideIcon;
  label: string;
  copy: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-3">
      <span className="inline-flex size-10 items-center justify-center rounded-xl bg-foreground/[0.04] border border-border/70 text-primary">
        <Icon className="size-5" />
      </span>
      <h3 className="font-display text-lg font-semibold">{label}</h3>
      <p className="text-caption text-muted-foreground">{copy}</p>
    </div>
  );
}
