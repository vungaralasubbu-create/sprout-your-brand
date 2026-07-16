/**
 * Premium program-detail sections — content-rich, conversion-focused blocks
 * that plug into the program detail route. Zero placeholder art: everything
 * renders from typographic + iconographic primitives so pages never feel empty.
 */

import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Award,
  Badge as BadgeIcon,
  BarChart3,
  BookOpenCheck,
  Brain,
  Briefcase,
  Building2,
  ChevronRight,
  Cloud,
  Code2,
  Cpu,
  FileText,
  Github,
  Globe,
  GraduationCap,
  Handshake,
  Layers,
  LineChart,
  Linkedin,
  MessageCircle,
  Mic,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Wrench,
  Zap,
} from "lucide-react";

import { Section, Container } from "@/components/shared/section";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { cn } from "@/lib/utils";
import { getJourney, type JourneyId } from "@/lib/visitor-journey";

// =====================================================================
// SECTION 1 — INDUSTRY HIRING PARTNERS
// =====================================================================

const HIRING_PARTNERS: Array<{ name: string; letter?: string }> = [
  { name: "Google" },
  { name: "Microsoft" },
  { name: "Amazon" },
  { name: "Adobe" },
  { name: "IBM" },
  { name: "Oracle" },
  { name: "Infosys" },
  { name: "Accenture" },
  { name: "TCS" },
  { name: "Capgemini" },
  { name: "Deloitte" },
  { name: "Intel" },
  { name: "NVIDIA" },
  { name: "Wipro" },
  { name: "Cognizant" },
  { name: "Meta" },
];

export function HiringPartners({ partners }: { partners?: string[] } = {}) {
  const list = partners && partners.length > 0 ? partners : HIRING_PARTNERS.map((p) => p.name);
  return (
    <Section className="py-14 lg:py-20 border-y bg-surface-1/40">
      <Container>
        <div className="max-w-2xl mb-10">
          <span className="text-caption font-mono uppercase tracking-widest text-primary">
            Industry Hiring Partners
          </span>
          <h2 className="mt-3 text-heading-xl lg:text-display-sm font-display font-semibold tracking-tight text-balance">
            Companies our learners have joined.
          </h2>
          <p className="mt-4 text-muted-foreground">
            From global technology leaders to India's largest firms — our graduates go on to build careers across a broad hiring ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {list.map((name) => (
            <div
              key={name}
              className="group flex items-center justify-center rounded-xl border border-border/60 bg-white px-3 py-4 shadow-sm hover:border-primary/40 hover:shadow-md transition-all"
            >
              <span className="font-display font-semibold text-sm lg:text-[15px] tracking-tight text-foreground/85 group-hover:text-primary transition-colors text-center">
                {name}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-6 text-caption text-muted-foreground">
          Hiring outcomes depend on individual performance, program terms, role availability and eligibility.
        </p>
      </Container>
    </Section>
  );
}

// =====================================================================
// SECTION 2 — TOOLS YOU'LL MASTER
// =====================================================================

const TOOL_CARDS: Array<{ name: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = [
  { name: "Python", icon: Code2, tone: "from-[oklch(0.75_0.18_240)] to-[oklch(0.6_0.16_210)]" },
  { name: "ChatGPT", icon: Sparkles, tone: "from-[oklch(0.7_0.16_160)] to-[oklch(0.55_0.14_200)]" },
  { name: "Claude", icon: Brain, tone: "from-[oklch(0.72_0.15_30)] to-[oklch(0.6_0.16_20)]" },
  { name: "Gemini", icon: Zap, tone: "from-[oklch(0.72_0.17_260)] to-[oklch(0.58_0.16_220)]" },
  { name: "Cursor AI", icon: Cpu, tone: "from-[oklch(0.7_0.13_280)] to-[oklch(0.58_0.14_240)]" },
  { name: "GitHub", icon: Github, tone: "from-[oklch(0.25_0.02_260)] to-[oklch(0.4_0.03_260)]" },
  { name: "VS Code", icon: Code2, tone: "from-[oklch(0.55_0.18_240)] to-[oklch(0.68_0.16_210)]" },
  { name: "Docker", icon: Layers, tone: "from-[oklch(0.6_0.14_230)] to-[oklch(0.5_0.15_220)]" },
  { name: "AWS", icon: Cloud, tone: "from-[oklch(0.7_0.14_60)] to-[oklch(0.55_0.15_40)]" },
  { name: "Power BI", icon: BarChart3, tone: "from-[oklch(0.75_0.15_80)] to-[oklch(0.6_0.16_60)]" },
  { name: "TensorFlow", icon: Brain, tone: "from-[oklch(0.7_0.16_60)] to-[oklch(0.55_0.17_45)]" },
  { name: "PyTorch", icon: Zap, tone: "from-[oklch(0.68_0.17_30)] to-[oklch(0.55_0.16_20)]" },
  { name: "Postman", icon: Rocket, tone: "from-[oklch(0.68_0.16_30)] to-[oklch(0.55_0.16_20)]" },
  { name: "MongoDB", icon: Layers, tone: "from-[oklch(0.65_0.15_150)] to-[oklch(0.5_0.14_160)]" },
  { name: "Figma", icon: Wrench, tone: "from-[oklch(0.7_0.17_320)] to-[oklch(0.6_0.16_280)]" },
  { name: "Notion", icon: BookOpenCheck, tone: "from-[oklch(0.4_0.02_260)] to-[oklch(0.55_0.02_260)]" },
];

const TOOL_TONES = [
  "from-[oklch(0.75_0.18_240)] to-[oklch(0.6_0.16_210)]",
  "from-[oklch(0.7_0.16_160)] to-[oklch(0.55_0.14_200)]",
  "from-[oklch(0.72_0.15_30)] to-[oklch(0.6_0.16_20)]",
  "from-[oklch(0.72_0.17_260)] to-[oklch(0.58_0.16_220)]",
  "from-[oklch(0.7_0.13_280)] to-[oklch(0.58_0.14_240)]",
  "from-[oklch(0.68_0.16_150)] to-[oklch(0.5_0.14_170)]",
  "from-[oklch(0.7_0.16_80)] to-[oklch(0.55_0.15_60)]",
  "from-[oklch(0.68_0.17_320)] to-[oklch(0.55_0.16_280)]",
];

type ToolItem = { name: string; icon: React.ComponentType<{ className?: string }> };

export function ToolsMaster({ tools }: { tools?: ToolItem[] } = {}) {
  const list: ToolItem[] =
    tools && tools.length > 0 ? tools : TOOL_CARDS.map((t) => ({ name: t.name, icon: t.icon }));

  return (
    <Section className="py-14 lg:py-20">
      <Container>
        <div className="max-w-2xl mb-10">
          <span className="text-caption font-mono uppercase tracking-widest text-primary">Your Toolkit</span>
          <h2 className="mt-3 text-heading-xl lg:text-display-sm font-display font-semibold tracking-tight text-balance">
            Tools You'll Master
          </h2>
          <p className="mt-4 text-muted-foreground">
            Hands-on with the exact stack today's teams ship with — every tool below is used in real projects.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3 lg:gap-4">
          {list.map((t, i) => {
            const Icon = t.icon;
            return (
              <div
                key={t.name}
                className="group relative rounded-2xl border border-border/60 bg-surface-1 p-4 flex flex-col items-center text-center hover:border-primary/40 hover:shadow-md transition-all"
              >
                <span
                  className={cn(
                    "inline-flex size-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
                    TOOL_TONES[i % TOOL_TONES.length],
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <div className="mt-3 text-[13px] font-semibold tracking-tight">{t.name}</div>
              </div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

// =====================================================================
// SECTION 3 — STUDENT LEARNING JOURNEY (8-stage horizontal)
// =====================================================================

const JOURNEY: Array<{ title: string; description: string; icon: React.ComponentType<{ className?: string }> }> = [
  { title: "Enroll", description: "Onboard, set goals & meet your mentor cohort.", icon: Rocket },
  { title: "Learn", description: "Live + on-demand sessions and structured tracks.", icon: BookOpenCheck },
  { title: "Assignments", description: "Weekly practice with mentor review.", icon: FileText },
  { title: "Projects", description: "Build portfolio-grade, industry-inspired projects.", icon: Layers },
  { title: "Certification", description: "Earn your program completion certificate.", icon: Award },
  { title: "Internship", description: "Applied internship track with a real brief.", icon: Briefcase },
  { title: "Placement Support", description: "Resume, mock interviews & referral network.", icon: Target },
  { title: "Career Growth", description: "Ongoing coaching for role & salary progression.", icon: TrendingUp },
];

export function StudentLearningJourney() {
  return (
    <Section className="py-14 lg:py-20 bg-surface-2/40 border-y">
      <Container>
        <div className="max-w-2xl mb-10">
          <span className="text-caption font-mono uppercase tracking-widest text-primary">The Path</span>
          <h2 className="mt-3 text-heading-xl lg:text-display-sm font-display font-semibold tracking-tight text-balance">
            Your Learning Journey
          </h2>
          <p className="mt-4 text-muted-foreground">
            Eight guided milestones — from enrolment to career growth. Structured, mentor-led, outcomes-focused.
          </p>
        </div>

        {/* Desktop horizontal timeline */}
        <div className="hidden lg:block">
          <div className="relative">
            <div
              aria-hidden
              className="absolute left-6 right-6 top-[26px] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
            />
            <ol className="relative grid grid-cols-8 gap-3">
              {JOURNEY.map((s, i) => {
                const Icon = s.icon;
                return (
                  <li key={s.title} className="flex flex-col items-center text-center">
                    <span className="relative inline-flex size-[54px] items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white shadow-md ring-4 ring-background">
                      <Icon className="size-5" />
                      <span className="absolute -top-1 -right-1 inline-flex size-5 items-center justify-center rounded-full bg-background border border-border font-mono text-[10px] font-semibold text-primary">
                        {i + 1}
                      </span>
                    </span>
                    <h3 className="mt-3 font-display font-semibold text-[13.5px] tracking-tight leading-tight">
                      {s.title}
                    </h3>
                    <p className="mt-1 text-[11.5px] text-muted-foreground leading-snug">{s.description}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        {/* Mobile vertical */}
        <ol className="lg:hidden relative pl-10">
          <span
            aria-hidden
            className="absolute left-[22px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/50 via-primary/30 to-transparent"
          />
          {JOURNEY.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.title} className="relative pb-6 last:pb-0">
                <span className="absolute -left-10 top-0 inline-flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white shadow-sm">
                  <Icon className="size-5" />
                </span>
                <div className="text-caption font-mono text-primary">{String(i + 1).padStart(2, "0")}</div>
                <h3 className="mt-1 font-display font-semibold text-base tracking-tight">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
              </li>
            );
          })}
        </ol>
      </Container>
    </Section>
  );
}

// =====================================================================
// SECTION 4 — PORTFOLIO PROJECTS
// =====================================================================

const PORTFOLIO: Array<{ name: string; blurb: string; tag: string }> = [
  { name: "AI Chatbot", blurb: "Context-aware assistant with RAG & tools.", tag: "GenAI" },
  { name: "Resume Analyzer", blurb: "NLP scoring against a target JD.", tag: "NLP" },
  { name: "Fraud Detection", blurb: "Classification pipeline on tx data.", tag: "ML" },
  { name: "Medical AI", blurb: "Image triage with fine-tuned CNN.", tag: "Vision" },
  { name: "Voice Assistant", blurb: "Whisper + LLM voice interface.", tag: "Voice" },
  { name: "Stock Prediction", blurb: "Time-series forecasting model.", tag: "Data" },
  { name: "Recommendation Engine", blurb: "Collaborative + content hybrid.", tag: "ML" },
  { name: "Image Classifier", blurb: "Transfer learning on custom data.", tag: "Vision" },
  { name: "Object Detection", blurb: "YOLO-based real-time detector.", tag: "Vision" },
  { name: "Sales Forecast Dashboard", blurb: "BI dashboard with predictions.", tag: "BI" },
  { name: "Customer Analytics", blurb: "Churn & LTV segmentation.", tag: "Analytics" },
  { name: "Chat Application", blurb: "Realtime messaging with presence.", tag: "Fullstack" },
  { name: "Weather App", blurb: "PWA with geolocation & offline cache.", tag: "Web" },
  { name: "E-commerce Website", blurb: "Storefront, cart & Stripe checkout.", tag: "Fullstack" },
  { name: "IoT Dashboard", blurb: "Sensor telemetry & alerts.", tag: "IoT" },
  { name: "Embedded System", blurb: "MCU-driven control system.", tag: "Embedded" },
  { name: "Drone Controller", blurb: "Flight logic + telemetry stream.", tag: "Robotics" },
  { name: "VLSI Simulation", blurb: "RTL to synthesis pipeline.", tag: "Hardware" },
  { name: "Financial Dashboard", blurb: "KPI, cohort & PnL views.", tag: "BI" },
  { name: "Marketing Analytics", blurb: "Attribution & campaign ROI.", tag: "Analytics" },
];

function projectGradient(i: number) {
  const palette = [
    "from-[oklch(0.7_0.16_240)] to-[oklch(0.55_0.15_220)]",
    "from-[oklch(0.72_0.16_180)] to-[oklch(0.58_0.15_200)]",
    "from-[oklch(0.72_0.16_320)] to-[oklch(0.58_0.15_280)]",
    "from-[oklch(0.72_0.16_30)] to-[oklch(0.58_0.15_20)]",
    "from-[oklch(0.72_0.16_150)] to-[oklch(0.55_0.15_170)]",
    "from-[oklch(0.72_0.16_80)] to-[oklch(0.58_0.15_60)]",
  ];
  return palette[i % palette.length];
}

export function PortfolioProjects() {
  return (
    <Section className="relative overflow-hidden py-16 lg:py-24 bg-[oklch(0.14_0.04_255)] text-white">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,oklch(0.55_0.18_220/0.28),transparent_55%)]"
      />
      <Container className="relative">
        <div className="max-w-2xl mb-10">
          <span className="text-caption font-mono uppercase tracking-widest text-[oklch(0.85_0.15_200)]">
            Portfolio Projects
          </span>
          <h2 className="mt-3 font-display font-semibold tracking-tight text-balance text-white text-[clamp(1.9rem,3.6vw,3rem)] leading-[1.05]">
            Build 20+ projects worth showing.
          </h2>
          <p className="mt-4 text-white/70 max-w-xl">
            A curated portfolio — not filler exercises. Each project mirrors a real problem employers and clients pay to solve.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
          {PORTFOLIO.map((p, i) => (
            <div
              key={p.name}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 lg:p-5 hover:border-[oklch(0.85_0.15_200)]/40 hover:bg-white/[0.06] transition-all"
            >
              <div
                className={cn(
                  "inline-flex size-9 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm mb-3",
                  projectGradient(i),
                )}
              >
                <Sparkles className="size-4 text-white" />
              </div>
              <div className="text-[10.5px] font-mono uppercase tracking-widest text-[oklch(0.85_0.15_200)]">
                {p.tag}
              </div>
              <h3 className="mt-1 font-display font-semibold text-[15px] leading-tight">{p.name}</h3>
              <p className="mt-1 text-[12px] text-white/60 leading-snug">{p.blurb}</p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

// =====================================================================
// SECTION 5 — CAREER ROADMAP
// =====================================================================

const CAREER_ROADMAP = [
  { title: "Beginner", note: "Start with fundamentals & mentor onboarding." },
  { title: "Intern", note: "Applied learning on a real brief." },
  { title: "Junior Engineer", note: "Ship features under senior review." },
  { title: "Software Engineer", note: "Own systems end-to-end." },
  { title: "AI Engineer", note: "Design ML systems & pipelines." },
  { title: "Senior Engineer", note: "Lead technical decisions." },
  { title: "Tech Lead", note: "Guide teams, mentor & set direction." },
  { title: "Architect", note: "Shape platform strategy & scale." },
];

export function CareerRoadmap() {
  return (
    <Section className="py-14 lg:py-20">
      <Container>
        <div className="max-w-2xl mb-10">
          <span className="text-caption font-mono uppercase tracking-widest text-primary">Career Roadmap</span>
          <h2 className="mt-3 text-heading-xl lg:text-display-sm font-display font-semibold tracking-tight text-balance">
            Where this program can take you.
          </h2>
          <p className="mt-4 text-muted-foreground">
            A realistic progression — every stage supported with mentorship, projects and industry exposure.
          </p>
        </div>

        <ol className="relative grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {CAREER_ROADMAP.map((r, i) => (
            <li
              key={r.title}
              className="relative rounded-2xl border border-border/60 bg-surface-1 p-5 hover:border-primary/40 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-semibold text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="font-display font-semibold text-[15px] tracking-tight">{r.title}</div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{r.note}</p>
              {i < CAREER_ROADMAP.length - 1 ? (
                <ChevronRight
                  className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 size-4 text-primary/50"
                  aria-hidden
                />
              ) : null}
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

// =====================================================================
// SECTION 6 — SALARY GROWTH
// =====================================================================

const SALARY_STAGES = [
  { stage: "Fresh Graduate", range: "₹4 – 6 LPA", low: 4, high: 6, note: "Foundational roles, apprentice tracks." },
  { stage: "Junior", range: "₹8 – 12 LPA", low: 8, high: 12, note: "1–2 years of applied experience." },
  { stage: "Mid Level", range: "₹15 – 22 LPA", low: 15, high: 22, note: "Owning modules & mentoring juniors." },
  { stage: "Senior", range: "₹25 – 40 LPA", low: 25, high: 40, note: "Technical depth & cross-team leadership." },
  { stage: "Leadership", range: "₹50L+", low: 50, high: 80, note: "Architect / Head-of roles & beyond." },
];

export function SalaryGrowth() {
  const max = 80;
  return (
    <Section className="py-14 lg:py-20 bg-surface-1/50 border-y">
      <Container>
        <div className="max-w-2xl mb-10">
          <span className="text-caption font-mono uppercase tracking-widest text-primary">Salary Growth</span>
          <h2 className="mt-3 text-heading-xl lg:text-display-sm font-display font-semibold tracking-tight text-balance">
            How compensation grows over your career.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Indicative ranges based on industry benchmarks in India. Actual offers depend on role, city, company and individual performance.
          </p>
        </div>

        <div className="space-y-3">
          {SALARY_STAGES.map((s, i) => {
            const widthPct = Math.max(12, Math.round(((s.high - s.low) / max) * 100) + 12);
            const startPct = Math.round((s.low / max) * 100);
            return (
              <div
                key={s.stage}
                className="grid grid-cols-1 md:grid-cols-[220px_1fr_140px] items-center gap-3 rounded-2xl border border-border/60 bg-white p-4 lg:p-5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="inline-flex size-9 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-semibold text-primary shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div className="font-display font-semibold text-[15px] tracking-tight truncate">{s.stage}</div>
                    <div className="text-caption text-muted-foreground truncate">{s.note}</div>
                  </div>
                </div>
                <div className="relative h-3 rounded-full bg-surface-2/70 overflow-hidden">
                  <div
                    className="absolute inset-y-0 rounded-full bg-gradient-to-r from-primary via-[oklch(0.65_0.16_200)] to-[oklch(0.7_0.16_170)]"
                    style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                  />
                </div>
                <div className="font-mono text-sm font-semibold text-foreground md:text-right">{s.range}</div>
              </div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

// =====================================================================
// SECTION 7 — CAREER SERVICES
// =====================================================================

const CAREER_SERVICES = [
  { title: "Resume Builder", icon: FileText, note: "ATS-friendly templates & mentor edits." },
  { title: "LinkedIn Optimization", icon: Linkedin, note: "Headline, banner & profile SEO." },
  { title: "Interview Preparation", icon: MessageCircle, note: "Structured DSA + system design tracks." },
  { title: "Mock Interviews", icon: Mic, note: "1:1 mocks with detailed rubric feedback." },
  { title: "Portfolio Review", icon: BookOpenCheck, note: "Curated projects, cleaned repos." },
  { title: "Career Counselling", icon: Users, note: "Role fit, salary bands, city choices." },
  { title: "Referral Network", icon: Handshake, note: "Warm introductions where possible." },
  { title: "Offer Negotiation", icon: TrendingUp, note: "Frameworks for comp & levelling." },
  { title: "AI Career Coach", icon: Sparkles, note: "24×7 guidance on your goals." },
];

export function CareerServices() {
  return (
    <Section className="py-14 lg:py-20">
      <Container>
        <div className="max-w-2xl mb-10">
          <span className="text-caption font-mono uppercase tracking-widest text-primary">Career Services</span>
          <h2 className="mt-3 text-heading-xl lg:text-display-sm font-display font-semibold tracking-tight text-balance">
            Full-stack career support.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Everything you need beyond the classroom — from a polished resume to a signed offer letter.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CAREER_SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.title}
                className="group flex gap-4 rounded-2xl border border-border/60 bg-surface-1 p-5 hover:border-primary/40 hover:shadow-md transition-all"
              >
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-[oklch(0.75_0.15_200)]/15 text-primary">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <div className="font-display font-semibold text-[15px] tracking-tight">{s.title}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{s.note}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

// =====================================================================
// SECTION 8 — CERTIFICATION BADGES
// =====================================================================

const CERT_ITEMS: Array<{ title: string; note: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = [
  { title: "Course Certificate", note: "Program completion, verifiable.", icon: Award, tone: "from-[oklch(0.7_0.16_240)] to-[oklch(0.55_0.15_220)]" },
  { title: "Internship Certificate", note: "Applied internship track completion.", icon: Briefcase, tone: "from-[oklch(0.72_0.16_180)] to-[oklch(0.55_0.15_160)]" },
  { title: "Project Completion", note: "Recognises capstone delivery.", icon: BookOpenCheck, tone: "from-[oklch(0.72_0.16_30)] to-[oklch(0.55_0.15_20)]" },
  { title: "Skill Assessment", note: "Score-based skill validation.", icon: ShieldCheck, tone: "from-[oklch(0.7_0.15_140)] to-[oklch(0.55_0.14_160)]" },
  { title: "Digital Badge", note: "Shareable on LinkedIn & sites.", icon: BadgeIcon, tone: "from-[oklch(0.72_0.16_320)] to-[oklch(0.55_0.15_280)]" },
  { title: "LinkedIn Share Badge", note: "One-click add to your profile.", icon: Linkedin, tone: "from-[oklch(0.6_0.14_240)] to-[oklch(0.45_0.15_220)]" },
];

export function CertificationBadges() {
  return (
    <Section className="py-14 lg:py-20 bg-surface-2/40 border-y">
      <Container>
        <div className="max-w-2xl mb-10">
          <span className="text-caption font-mono uppercase tracking-widest text-primary">Certifications</span>
          <h2 className="mt-3 text-heading-xl lg:text-display-sm font-display font-semibold tracking-tight text-balance">
            Six credentials, one career-ready profile.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every certificate is verifiable, shareable and issued only after evaluation — never for attendance alone.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CERT_ITEMS.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.title}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-white p-5 shadow-sm hover:shadow-md hover:border-primary/40 transition-all"
              >
                <div className={cn("inline-flex size-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm", c.tone)}>
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 font-display font-semibold text-[15px] tracking-tight">{c.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.note}</p>
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-dashed border-primary/30 px-2.5 py-0.5 text-[10.5px] font-mono uppercase tracking-widest text-primary">
                  <ShieldCheck className="size-3" /> Verified
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

// =====================================================================
// SECTION 9 — SUCCESS COUNTERS
// =====================================================================

const SUCCESS_STATS = [
  {
    icon: Users,
    value: 1000000,
    suffix: "+",
    label: "Paid Learners",
    format: (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n.toLocaleString()),
  },
  { icon: Building2, value: 5000, suffix: "+", label: "Hiring Partners" },
  { icon: GraduationCap, value: 120, suffix: "+", label: "Programs" },
  { icon: Trophy, value: 95, suffix: "%", label: "Completion Rate" },
  {
    icon: Star,
    value: 4.8,
    suffix: "★",
    label: "Average Rating",
    format: (n: number) => (n / 10).toFixed(1),
    scale: 10 as const,
  },
];

export function SuccessCounters() {
  return (
    <Section className="py-14 lg:py-20 border-y bg-gradient-to-b from-white to-surface-1/50">
      <Container>
        <div className="max-w-2xl mx-auto text-center mb-10 lg:mb-12">
          <span className="text-caption font-mono uppercase tracking-widest text-primary">Student Success</span>
          <h2 className="mt-3 text-heading-xl lg:text-display-sm font-display font-semibold tracking-tight text-balance">
            A learning community that shows up — and ships.
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-y-8 lg:gap-y-0 lg:divide-x lg:divide-border/70">
          {SUCCESS_STATS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex flex-col items-center text-center px-3 lg:px-4">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-[oklch(0.75_0.15_200)]/10 text-primary mb-3">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <div className="font-display font-semibold tracking-tight text-[clamp(1.6rem,3.2vw,2.5rem)] leading-none bg-gradient-to-r from-primary to-[oklch(0.6_0.16_200)] bg-clip-text text-transparent">
                  <AnimatedCounter
                    value={"scale" in s && s.scale ? s.value * s.scale : s.value}
                    suffix={s.suffix}
                    format={"format" in s ? s.format : undefined}
                  />
                </div>
                <div className="mt-2 text-sm font-medium text-muted-foreground">{s.label}</div>
              </div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

// =====================================================================
// SECTION 11 — AI TOOLS USAGE
// =====================================================================

const AI_TOOLS_USAGE: Array<{ name: string; use: string; icon: React.ComponentType<{ className?: string }> }> = [
  { name: "ChatGPT", use: "Break down concepts, generate practice problems and debug code faster.", icon: Sparkles },
  { name: "Claude", use: "Review long documents, refactor code and analyze research papers.", icon: Brain },
  { name: "Gemini", use: "Multimodal tasks — image, doc & code Q&A during projects.", icon: Zap },
  { name: "Cursor", use: "Pair-programming inside VS Code with in-context AI suggestions.", icon: Cpu },
  { name: "GitHub Copilot", use: "Autocomplete boilerplate and speed up test writing.", icon: Github },
  { name: "Perplexity", use: "Cited research for capstones and market analysis.", icon: Search },
  { name: "Notion AI", use: "Organise notes, summarise sessions and plan sprints.", icon: BookOpenCheck },
  { name: "Power BI AI", use: "Auto-insights and narrative summaries for dashboards.", icon: BarChart3 },
];

export function AIToolsUsage() {
  return (
    <Section className="py-14 lg:py-20">
      <Container>
        <div className="max-w-2xl mb-10">
          <span className="text-caption font-mono uppercase tracking-widest text-primary">AI in Your Workflow</span>
          <h2 className="mt-3 text-heading-xl lg:text-display-sm font-display font-semibold tracking-tight text-balance">
            How students use AI every week.
          </h2>
          <p className="mt-4 text-muted-foreground">
            You'll learn not just the tools — but where they fit in your daily learning, projects and career prep.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {AI_TOOLS_USAGE.map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.name}
                className="rounded-2xl border border-border/60 bg-surface-1 p-5 hover:border-primary/40 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-[oklch(0.75_0.15_200)]/15 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <div className="font-display font-semibold text-[14.5px] tracking-tight">{t.name}</div>
                </div>
                <p className="mt-2.5 text-[13px] text-muted-foreground leading-snug">{t.use}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

// =====================================================================
// SECTION — PROGRAM PERSONALIZATION (journey-aware banner)
// =====================================================================

type PersonaContent = {
  eyebrow: string;
  title: string;
  points: Array<{ label: string; note: string; icon: React.ComponentType<{ className?: string }> }>;
};

const PERSONA_CONTENT: Record<JourneyId, PersonaContent | null> = {
  student: {
    eyebrow: "For Engineering Students",
    title: "Built for projects, labs, internships & placements.",
    points: [
      { label: "Projects", note: "Semester-friendly capstones you can reuse in college submissions.", icon: Layers },
      { label: "Labs", note: "Hands-on labs mapped to your semester syllabus.", icon: Cpu },
      { label: "Internships", note: "Guided applied internship track with a real brief.", icon: Briefcase },
      { label: "Placements", note: "Mock interviews & referrals during placement season.", icon: Target },
      { label: "Hackathons", note: "Team practice for HackWithInfy, SIH & Flipkart Grid.", icon: Zap },
      { label: "Hands-on Learning", note: "Live labs, mentor code reviews, weekly assignments.", icon: BookOpenCheck },
    ],
  },
  professional: {
    eyebrow: "For Working Professionals",
    title: "Weekend-friendly. Career-switch ready.",
    points: [
      { label: "Career Switching", note: "Structured transitions into AI, Data & Engineering roles.", icon: TrendingUp },
      { label: "Weekend Learning", note: "Sessions built around a 9–6 work week.", icon: BookOpenCheck },
      { label: "Flexible Schedule", note: "Recorded + live — catch up whenever it fits.", icon: Users },
      { label: "Salary Growth", note: "Frameworks to negotiate & unlock next-band pay.", icon: LineChart },
      { label: "Leadership", note: "Move into senior IC or people-lead roles.", icon: Award },
      { label: "Real Projects", note: "Portfolio work you can showcase in interviews.", icon: Layers },
    ],
  },
  company: {
    eyebrow: "For Companies & Teams",
    title: "Upskill teams with measurable outcomes.",
    points: [
      { label: "Custom Cohorts", note: "Private batches shaped to your stack.", icon: Users },
      { label: "Manager Reporting", note: "Progress dashboards for L&D leaders.", icon: BarChart3 },
      { label: "Real Projects", note: "Learners ship company-relevant capstones.", icon: Layers },
      { label: "Mentor-led", note: "Practitioner-taught, not theory.", icon: GraduationCap },
      { label: "Certification", note: "Verifiable credentials per learner.", icon: Award },
      { label: "SSO & Analytics", note: "Enterprise-grade integrations.", icon: ShieldCheck },
    ],
  },
  partner: {
    eyebrow: "For Sales Partners",
    title: "Sell this program and earn with Glintr.",
    points: [
      { label: "70% Revenue", note: "Own your leads and keep the majority share.", icon: TrendingUp },
      { label: "50% Assisted", note: "Sell using company-generated leads.", icon: Handshake },
      { label: "Payout System", note: "Transparent, milestone-based commissions.", icon: LineChart },
      { label: "Ready Assets", note: "Decks, brochures & landing pages.", icon: FileText },
      { label: "Mentor Support", note: "Onboarding & partner enablement.", icon: Users },
      { label: "Referral Tracking", note: "Live dashboards for every click.", icon: BarChart3 },
    ],
  },
  academy: {
    eyebrow: "For Academy Partners",
    title: "Launch your own academy powered by this program.",
    points: [
      { label: "White-label", note: "Your brand on Glintr's managed infrastructure.", icon: Rocket },
      { label: "AI Studio", note: "Generate brand, site & marketing assets.", icon: Sparkles },
      { label: "Managed LMS", note: "Hosted platform — we run the tech.", icon: Layers },
      { label: "Marketing", note: "Playbooks, ads & content templates.", icon: Globe },
      { label: "Payouts", note: "Automated revenue sharing.", icon: LineChart },
      { label: "Support", note: "Dedicated academy success manager.", icon: Users },
    ],
  },
};

export function ProgramPersonalization() {
  const [persona, setPersona] = useState<JourneyId | null>(null);

  useEffect(() => {
    const j = getJourney();
    if (j?.id) setPersona(j.id);
  }, []);

  const content = useMemo(() => (persona ? PERSONA_CONTENT[persona] : null), [persona]);
  if (!content) return null;

  return (
    <Section className="py-14 lg:py-20 bg-gradient-to-b from-primary/[0.03] to-transparent">
      <Container>
        <div className="rounded-3xl border border-primary/25 bg-white shadow-sm overflow-hidden">
          <div className="grid gap-6 lg:gap-10 p-6 lg:p-10 lg:grid-cols-[1fr_1.4fr] items-start">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10.5px] font-mono uppercase tracking-widest text-primary">
                <Sparkles className="size-3" /> Personalised for you
              </div>
              <div className="mt-3 text-caption font-mono uppercase tracking-widest text-primary">
                {content.eyebrow}
              </div>
              <h2 className="mt-2 font-display font-semibold tracking-tight text-balance text-[clamp(1.5rem,2.8vw,2.25rem)] leading-[1.05]">
                {content.title}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                We've highlighted the parts of this program that matter most for your journey.
              </p>
              <Link
                to="/"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4"
              >
                Change journey
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              {content.points.map((p) => {
                const Icon = p.icon;
                return (
                  <div
                    key={p.label}
                    className="flex gap-3 rounded-2xl border border-border/60 bg-surface-1/60 p-4"
                  >
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="font-display font-semibold text-[14px] tracking-tight">{p.label}</div>
                      <p className="mt-0.5 text-[12.5px] text-muted-foreground leading-snug">{p.note}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
