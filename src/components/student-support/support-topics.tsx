import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  LifeBuoy,
  Lock,
  MessageCircle,
  PlayCircle,
  Sparkles,
  Target,
  Trophy,
  UserCircle,
  Wrench,
  Zap,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StudentSupportIntent } from "@/lib/student-support/student-support.functions";

// ============================================================
// Explore Student Support Topics
// ============================================================
export type SupportTopicKey =
  | "program_access"
  | "enrollment"
  | "my_learning"
  | "modules_lessons"
  | "learning_progress"
  | "assessments"
  | "certificates"
  | "technical"
  | "account";

type Topic = {
  key: SupportTopicKey;
  label: string;
  intent: StudentSupportIntent;
  icon: React.ComponentType<{ className?: string }>;
  headline: string;
  copy: string;
  questions: string[];
  primaryQuestion: string;
};

const TOPICS: Topic[] = [
  {
    key: "program_access",
    label: "Program Access",
    intent: "program_access",
    icon: BookOpen,
    headline: "Program Access",
    copy: "Find a program you enrolled in, and understand payment-to-access flow.",
    questions: [
      "Where is my program?",
      "I paid but my program is missing.",
      "How do I open my program?",
    ],
    primaryQuestion: "Where is my program?",
  },
  {
    key: "enrollment",
    label: "Enrollment",
    intent: "enrollment",
    icon: GraduationCap,
    headline: "Enrollment",
    copy: "Understand your enrollment status and how enrollment appears in your account.",
    questions: [
      "What is my enrollment status?",
      "How does enrollment work?",
      "My enrollment is not showing.",
    ],
    primaryQuestion: "What is my enrollment status?",
  },
  {
    key: "my_learning",
    label: "My Learning",
    intent: "my_learning_navigation",
    icon: PlayCircle,
    headline: "My Learning",
    copy: "Navigate My Learning and continue where you left off.",
    questions: [
      "Where is My Learning?",
      "Which programs are in My Learning?",
      "How do I continue learning?",
    ],
    primaryQuestion: "Where is My Learning?",
  },
  {
    key: "modules_lessons",
    label: "Modules & Lessons",
    intent: "module_access",
    icon: Lock,
    headline: "Modules And Lessons",
    copy: "Understand module and lesson access and completion.",
    questions: [
      "Why is my module locked?",
      "I can't open a lesson.",
      "Why is my lesson incomplete?",
    ],
    primaryQuestion: "Why is my module locked?",
  },
  {
    key: "learning_progress",
    label: "Learning Progress",
    intent: "learning_progress",
    icon: Target,
    headline: "Learning Progress",
    copy: "See how the Glintr progress engine tracks your learning.",
    questions: [
      "How does progress work?",
      "What is my progress?",
      "Why is progress not updating?",
    ],
    primaryQuestion: "How does progress work?",
  },
  {
    key: "assessments",
    label: "Assessments",
    intent: "assessment_information",
    icon: Zap,
    headline: "Assessments",
    copy: "How assessments open, attempts, and where results appear.",
    questions: [
      "How do assessments work?",
      "Why can't I start my assessment?",
      "Where is my result?",
    ],
    primaryQuestion: "How do assessments work?",
  },
  {
    key: "certificates",
    label: "Certificates",
    intent: "certificate_information",
    icon: Trophy,
    headline: "Certificates",
    copy: "Certificate eligibility, access, and missing-certificate help.",
    questions: [
      "When do I get my certificate?",
      "Am I eligible for a certificate?",
      "Why is my certificate missing?",
    ],
    primaryQuestion: "When do I get my certificate?",
  },
  {
    key: "technical",
    label: "Technical Learning Issues",
    intent: "learning_technical",
    icon: Wrench,
    headline: "Technical Learning Issues",
    copy: "Video playback, page-not-opening, and safe technical troubleshooting.",
    questions: [
      "My video is not playing.",
      "Lesson page is not loading.",
      "Assessment page is not opening.",
    ],
    primaryQuestion: "My video is not playing.",
  },
  {
    key: "account",
    label: "Student Account",
    intent: "student_account",
    icon: UserCircle,
    headline: "Student Account",
    copy: "Sign-in, dashboard navigation, and where to find your learning.",
    questions: [
      "How do I sign in?",
      "Where is my Student Dashboard?",
      "How do I open My Learning?",
    ],
    primaryQuestion: "Where is my Student Dashboard?",
  },
];

export function StudentSupportTopics({
  onAsk,
}: {
  onAsk: (intent: StudentSupportIntent, question: string, topic: string) => void;
}) {
  const [activeIdx, setActiveIdx] = React.useState(0);
  const active = TOPICS[activeIdx];
  const Icon = active.icon;

  return (
    <Card className="p-5 lg:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
            Explore Student Support Topics
          </div>
          <h2 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight">
            Pick A Topic To Get Focused Help
          </h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Every topic maps to real Glintr learning systems and asks Glintr AI
            Student Support in the correct context.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="icon"
            variant="outline"
            aria-label="Previous topic"
            onClick={() => setActiveIdx((i) => (i - 1 + TOPICS.length) % TOPICS.length)}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            aria-label="Next topic"
            onClick={() => setActiveIdx((i) => (i + 1) % TOPICS.length)}
          >
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Student support topics">
        {TOPICS.map((t, i) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={i === activeIdx}
            onClick={() => setActiveIdx(i)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs transition",
              i === activeIdx
                ? "border-primary/60 bg-primary-soft text-primary font-medium"
                : "border-border bg-background hover:border-primary/40 hover:bg-primary-soft/30",
            )}
          >
            <t.icon className="size-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-[1.1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <div className="grid place-items-center size-10 rounded-lg bg-primary/10 text-primary">
              <Icon className="size-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                Support Topic
              </div>
              <div className="font-display text-lg font-semibold">{active.headline}</div>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{active.copy}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => onAsk(active.intent, active.primaryQuestion, active.label)}
            >
              <MessageCircle className="mr-1.5 size-3.5" /> Ask AI Student Support
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                document
                  .getElementById("student-support-guided")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              Try Guided Support
            </Button>
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            Common Questions
          </div>
          <div className="flex flex-col gap-2">
            {active.questions.map((q) => (
              <button
                key={q}
                onClick={() => onAsk(active.intent, q, active.label)}
                className="text-left rounded-lg border border-border bg-background hover:border-primary/40 hover:bg-primary-soft/30 transition px-4 py-2.5 text-sm"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ============================================================
// Your Glintr Learning Journey
// ============================================================
const JOURNEY_STAGES: {
  label: string;
  copy: string;
  where: string;
  support: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    label: "Discover",
    copy: "Explore Glintr programs and understand what you'll learn.",
    where: "Programs listing",
    support: "Program discovery and program information questions.",
    icon: Sparkles,
  },
  {
    label: "Enroll",
    copy: "Complete the enrollment flow for your chosen program.",
    where: "Program page → apply/enroll",
    support: "Enrollment and payment-and-access questions.",
    icon: GraduationCap,
  },
  {
    label: "Access",
    copy: "Your program appears in My Learning once access is granted.",
    where: "My Learning list",
    support: "Program access and 'paid but missing' help.",
    icon: BookOpen,
  },
  {
    label: "Learn",
    copy: "Move through modules and lessons in the learning player.",
    where: "Learn player",
    support: "Module access, locked modules, lesson access.",
    icon: PlayCircle,
  },
  {
    label: "Progress",
    copy: "The Glintr progress engine tracks your lesson completion.",
    where: "Program overview & My Learning",
    support: "Learning progress and 'not updating' help.",
    icon: Target,
  },
  {
    label: "Assess",
    copy: "Take published assessments to demonstrate learning.",
    where: "My Assessments",
    support: "Assessment access, attempts, and results.",
    icon: Zap,
  },
  {
    label: "Certificate",
    copy: "Eligible programs release a certificate through the authoritative certificate system.",
    where: "My Certificates",
    support: "Certificate eligibility, access, and missing-certificate help.",
    icon: Trophy,
  },
];

export function LearningJourneySection() {
  return (
    <Card className="p-5 lg:p-6">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
        Your Glintr Learning Journey
      </div>
      <h2 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight">
        From Program To Certificate
      </h2>
      <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
        Every learning question maps to a stage below. Understand where you are —
        and where Student Support can help — without leaving this page.
      </p>

      <ol className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {JOURNEY_STAGES.map((s, i) => {
          const Icon = s.icon;
          return (
            <li
              key={s.label}
              className="relative rounded-xl border border-border bg-background p-4"
            >
              <div className="flex items-start gap-3">
                <div className="grid place-items-center size-9 rounded-lg bg-primary/10 text-primary shrink-0">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Stage {i + 1}
                  </div>
                  <div className="font-medium">{s.label}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{s.copy}</p>
                  <div className="mt-2 text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground">Where:</span> {s.where}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground">Support:</span> {s.support}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

// ============================================================
// Support At Every Learning Stage
// ============================================================
export function SupportAtEveryStage({
  onAsk,
}: {
  onAsk: (intent: StudentSupportIntent, question: string, topic: string) => void;
}) {
  const rows: {
    q: string;
    intent: StudentSupportIntent;
    topic: string;
    ask: string;
  }[] = [
    { q: "Can't find your program?", intent: "program_access", topic: "Program Access", ask: "I can't find my program." },
    { q: "Module unavailable?", intent: "locked_module", topic: "Modules & Lessons", ask: "Why is my module locked?" },
    { q: "Progress not updating?", intent: "progress_not_updating", topic: "Progress", ask: "My progress is not updating." },
    { q: "Assessment question?", intent: "assessment_information", topic: "Assessments", ask: "How do assessments work?" },
    { q: "Certificate missing?", intent: "certificate_missing", topic: "Certificates", ask: "My certificate is missing." },
    { q: "Technical issue?", intent: "learning_technical", topic: "Technical", ask: "A learning page is not opening." },
  ];
  return (
    <Card className="p-5 lg:p-6">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
        Support At Every Learning Stage
      </div>
      <h2 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight">
        Every Learning Question Has A Safe Next Step
      </h2>
      <div className="mt-5 grid gap-2 md:grid-cols-2">
        {rows.map((r) => (
          <button
            key={r.q}
            onClick={() => onAsk(r.intent, r.ask, r.topic)}
            className="text-left rounded-lg border border-border bg-background hover:border-primary/40 hover:bg-primary-soft/30 transition px-4 py-3 flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="font-medium text-sm">{r.q}</div>
              <div className="text-xs text-muted-foreground truncate">Ask: “{r.ask}”</div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>
    </Card>
  );
}

// ============================================================
// Learning safety / privacy copy
// ============================================================
export function StudentSupportSafetyStrip() {
  const items = [
    { icon: LifeBuoy, title: "Read-Only Support", copy: "AI can't change enrollment, unlock modules, complete lessons, submit assessments, or issue certificates." },
    { icon: CheckCircle2, title: "Authoritative Systems", copy: "Progress, assessments, and certificates always come from the Glintr learning systems." },
    { icon: UserCircle, title: "Account-Safe", copy: "We never ask for OTPs, passwords, UPI PINs, CVV, or auth tokens." },
  ];
  return (
    <Card className="p-5 lg:p-6">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
        Student Learning Safety
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <div key={it.title} className="rounded-xl border border-border bg-background p-4">
              <div className="grid place-items-center size-9 rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" />
              </div>
              <div className="mt-3 font-medium">{it.title}</div>
              <p className="mt-1 text-xs text-muted-foreground">{it.copy}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ============================================================
// Final Student Support CTA
// ============================================================
export function StudentSupportFinalCTA({
  signedIn,
  onAskAI,
  onExplore,
}: {
  signedIn: boolean | null;
  onAskAI: () => void;
  onExplore: () => void;
}) {
  return (
    <Card className="p-6 lg:p-10 bg-primary-soft/40 border-primary/20">
      <div className="max-w-3xl">
        <Badge variant="outline" className="uppercase tracking-widest text-[10px]">
          Student Support
        </Badge>
        <h2 className="mt-3 text-2xl md:text-3xl font-display font-semibold tracking-tight">
          Continue With Your Learning Question
        </h2>
        <p className="mt-2 text-muted-foreground">
          Ask about program access, enrollment, My Learning, modules, lessons, progress,
          assessments, certificates, or technical learning issues.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button size="lg" onClick={onAskAI}>
            <MessageCircle className="mr-2 size-4" /> Ask AI Student Support
          </Button>
          <Button size="lg" variant="outline" onClick={onExplore}>
            Explore Support Topics
          </Button>
          {signedIn && (
            <Button size="lg" variant="ghost" asChild>
              <Link to="/student/programs">Open My Learning</Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
