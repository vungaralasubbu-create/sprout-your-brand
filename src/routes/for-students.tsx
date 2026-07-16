import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import {
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  Code2,
  FileText,
  GraduationCap,
  Layers,
  Mic,
  Route as RouteIcon,
  Sparkles,
  Target,
} from "lucide-react";

import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { setJourney, useJourney } from "@/lib/visitor-journey";
import { track } from "@/lib/intent";

const SITE_URL = "https://glintr.com";

export const Route = createFileRoute("/for-students")({
  head: () => {
    const title = "Student Hub — Programs for Engineering & College Students | Glintr";
    const description =
      "A dedicated hub for college and engineering students: internships, projects, placement roadmaps, coding challenges and mock interviews — matched to your branch and year.";
    const canonical = `${SITE_URL}/for-students`;
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
  component: StudentHub,
});

const BRANCHES = [
  "Computer Science",
  "Electronics",
  "Electrical",
  "Mechanical",
  "Civil",
  "Artificial Intelligence",
  "Information Technology",
  "Management",
  "Commerce",
  "Arts",
  "Medical",
  "Law",
] as const;

const YEARS = [
  "First Year",
  "Second Year",
  "Third Year",
  "Final Year",
  "Graduate",
] as const;

interface Recommendation {
  key: string;
  title: string;
  copy: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
}

const BASE_RECS: Recommendation[] = [
  { key: "internships", title: "Internships", copy: "Paid and remote internships aligned to your branch.", icon: Briefcase, to: "/programs" },
  { key: "projects", title: "Industry Projects", copy: "Portfolio-grade projects reviewed by mentors.", icon: Layers, to: "/programs" },
  { key: "courses", title: "Courses", copy: "Applied programs designed for working portfolios.", icon: BookOpen, to: "/programs" },
  { key: "certificates", title: "Certificates", copy: "Verifiable certificates recognized by industry.", icon: Award, to: "/programs" },
  { key: "placement", title: "Placement Roadmap", copy: "A stage-wise plan from year 1 to job offer.", icon: RouteIcon, to: "/learning-paths" },
  { key: "resume", title: "Resume Builder", copy: "Craft an ATS-friendly resume in minutes.", icon: FileText, to: "/tools" },
  { key: "mock", title: "Mock Interviews", copy: "Practice real interview questions with AI feedback.", icon: Mic, to: "/tools" },
  { key: "coding", title: "Coding Challenges", copy: "Sharpen DSA & problem solving daily.", icon: Code2, to: "/tools" },
  { key: "career", title: "Career Paths", copy: "Explore where each branch leads.", icon: Target, to: "/learning-paths" },
  { key: "higher", title: "Higher Studies Guidance", copy: "GATE, GRE, MBA and specialization paths.", icon: GraduationCap, to: "/learning-paths" },
];

function StudentHub() {
  const journey = useJourney();
  const [branch, setBranch] = React.useState<string | null>(journey?.branch ?? null);
  const [year, setYear] = React.useState<string | null>(journey?.year ?? null);

  React.useEffect(() => {
    // Ensure this journey is remembered for AI personalization sitewide.
    if (!journey || journey.id !== "student") setJourney({ id: "student" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPickBranch = (b: string) => {
    setBranch(b);
    setJourney({ id: "student", branch: b });
    track("student_branch_selected", { branch: b });
  };
  const onPickYear = (y: string) => {
    setYear(y);
    setJourney({ id: "student", year: y });
    track("student_year_selected", { year: y });
  };

  const recs = React.useMemo(() => {
    // Same catalog; recommendations "unlock" only when both selections exist.
    if (!branch || !year) return BASE_RECS.slice(0, 4);
    return BASE_RECS;
  }, [branch, year]);

  return (
    <>
      <SiteHeader />
      <main>
        <Section className="pt-14 pb-6 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-brand-soft opacity-30" />
          <Container>
            <p className="text-[11px] uppercase tracking-[0.22em] font-medium text-primary mb-3 inline-flex items-center gap-2">
              <Sparkles className="size-3.5" /> Student Hub
            </p>
            <h1 className="text-display-md font-display font-semibold tracking-tight text-balance max-w-3xl">
              Learning built around your branch, year, and career goal.
            </h1>
            <p className="mt-4 text-body-lg text-muted-foreground max-w-2xl">
              Choose your branch and year — Glintr recommends internships,
              projects, certifications and a placement roadmap that fit where
              you are today.
            </p>
          </Container>
        </Section>

        {/* BRANCH SELECTION */}
        <Section className="py-8">
          <Container>
            <SectionHeading step="01" title="Choose your branch" />
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {BRANCHES.map((b) => (
                <PillButton key={b} active={branch === b} onClick={() => onPickBranch(b)}>
                  {b}
                </PillButton>
              ))}
            </div>
          </Container>
        </Section>

        {/* YEAR SELECTION */}
        <Section className="py-8">
          <Container>
            <SectionHeading step="02" title="Choose your year" />
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {YEARS.map((y) => (
                <PillButton key={y} active={year === y} onClick={() => onPickYear(y)}>
                  {y}
                </PillButton>
              ))}
            </div>
          </Container>
        </Section>

        {/* RECOMMENDATIONS */}
        <Section className="py-14 md:py-20 border-t border-border/60">
          <Container>
            <div className="flex items-end justify-between flex-wrap gap-3">
              <SectionHeading
                step="03"
                title={
                  branch && year
                    ? `Recommended for ${branch} · ${year}`
                    : "What you'll unlock"
                }
              />
              {branch && year ? (
                <p className="text-caption text-muted-foreground">
                  Personalized based on your selections — updates as you refine them.
                </p>
              ) : null}
            </div>

            <div className="mt-8 grid gap-4 md:gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recs.map((r) => {
                const Icon = r.icon;
                return (
                  <Link
                    key={r.key}
                    to={r.to}
                    className={cn(
                      "group rounded-2xl border border-border bg-card p-6 flex flex-col gap-3",
                      "transition-[transform,box-shadow,border-color] duration-300",
                      "hover:-translate-y-[3px] hover:shadow-lg hover:border-border-strong",
                    )}
                  >
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-foreground/[0.04] border border-border/70 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="font-display text-lg font-semibold">{r.title}</h3>
                    <p className="text-caption text-muted-foreground">{r.copy}</p>
                    <span className="mt-auto inline-flex items-center gap-1 text-sm text-primary">
                      Explore <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild variant="gradient" size="lg">
                <Link to="/programs">Browse all programs</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/book-consultation">Talk to a career advisor</Link>
              </Button>
            </div>
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}

function SectionHeading({ step, title }: { step: string; title: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-mono text-xs text-muted-foreground">{step}</span>
      <h2 className="text-heading-xl md:text-2xl font-display font-semibold">{title}</h2>
    </div>
  );
}

function PillButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-4 py-2 text-sm transition-all duration-200",
        active
          ? "border-primary bg-primary text-primary-foreground -translate-y-[1px] shadow-sm"
          : "border-border bg-card text-foreground hover:border-border-strong",
      )}
    >
      {children}
    </button>
  );
}
