import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  LayoutGrid,
  ListChecks,
  PlayCircle,
  ScrollText,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

import { Container, Section, SectionHeader } from "@/components/shared/section";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/lms")({
  head: () => ({
    meta: [
      { title: "Learning Management System | Glintr LMS Experience" },
      {
        name: "description",
        content:
          "Explore the Glintr LMS experience — Programs, lessons, progress, assessments and applicable certificate journeys built around the student.",
      },
      { property: "og:title", content: "Learning Management System | Glintr" },
      {
        property: "og:description",
        content:
          "A modern LMS experience for structured Programs, learning progress, assessments and certificates.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { rel: "canonical", href: "https://glintr.com/lms" } as never,
    ],
  }),
  component: LmsPage,
});

const EXPLORER = [
  {
    id: "programs",
    icon: LayoutGrid,
    title: "Programs",
    supports: "Structured Programs organised by category, level and outcome.",
    student: "Students see enrolled Programs, next lesson and clear progress.",
    connects: "Programs anchor lessons, assessments and certificate eligibility.",
  },
  {
    id: "lessons",
    icon: PlayCircle,
    title: "Lessons",
    supports: "Modular lessons that build the Program experience step by step.",
    student: "Students open one lesson at a time and continue where they left off.",
    connects: "Lessons feed progress tracking and unlock the next step.",
  },
  {
    id: "progress",
    icon: ListChecks,
    title: "Learning Progress",
    supports: "Progress across lessons, modules and the overall Program.",
    student: "Students see completion states, streaks and what to do next.",
    connects: "Progress unlocks assessments and applicable certificate steps.",
  },
  {
    id: "assessments",
    icon: ScrollText,
    title: "Assessments",
    supports: "Assessments configured where the Program requires them.",
    student: "Students attempt assessments once the required learning is complete.",
    connects: "Assessment outcomes drive results and certificate eligibility.",
  },
  {
    id: "results",
    icon: Trophy,
    title: "Results",
    supports: "Result summaries for completed assessments.",
    student: "Students view their outcome and the next step in the journey.",
    connects: "Results feed the certificate step where applicable.",
  },
  {
    id: "certificates",
    icon: GraduationCap,
    title: "Certificates",
    supports: "Certificate journeys for Programs that support them.",
    student: "Students access an issued certificate once eligibility is met.",
    connects: "Closes the learning loop for supported Programs.",
  },
  {
    id: "experience",
    icon: Users,
    title: "Student Experience",
    supports: "A calm, focused student surface across the learning journey.",
    student: "Students find continue, progress, assessments and certificates in one place.",
    connects: "Shared shell across every learning step.",
  },
] as const;

const JOURNEY = [
  "Program Access",
  "Start Learning",
  "Open Lesson",
  "Continue Learning",
  "Track Progress",
  "Complete Required Learning",
  "Take Assessment Where Applicable",
  "View Result",
  "Certificate Eligibility Where Applicable",
];

const PREVIEW_NAV = [
  { id: "my", label: "My Programs", body: "A clear list of enrolled Programs with a continue action on each." },
  { id: "continue", label: "Continue Learning", body: "The next lesson surfaces at the top so students never search for where they left off." },
  { id: "progress", label: "Progress", body: "Progress across lessons and modules, with what is complete and what is next." },
  { id: "assessment", label: "Assessment", body: "Assessments open when the required learning is complete for that Program." },
  { id: "certificate", label: "Certificate", body: "Certificate access appears once eligibility is met for supported Programs." },
];

const WHO = [
  "Founders building an education experience under their own brand",
  "Institutions delivering structured Programs to their learners",
  "Educators who want lessons, progress and assessments in one place",
  "Teams delivering internal upskilling with a shared learning journey",
];

const FAQS = [
  {
    q: "Is this a separate LMS backend?",
    a: "No. The LMS experience is built on the existing Glintr learning architecture — Programs, lessons, progress and applicable assessments and certificates.",
  },
  {
    q: "Do all Programs include assessments and certificates?",
    a: "Assessments and certificates apply where the Program is configured to support them. Not every Program will include both.",
  },
  {
    q: "Can I preview the student surface?",
    a: "The preview on this page is a public capability demonstration. It does not fetch real student data.",
  },
  {
    q: "How is progress tracked?",
    a: "Progress is derived from lesson completion within a Program and unlocks the next step in the learning journey.",
  },
];

function useReveal<T extends HTMLElement>() {
  const ref = React.useRef<T | null>(null);
  const [shown, setShown] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, shown };
}

function LmsPage() {
  const [activeExplorer, setActiveExplorer] = React.useState<string>(EXPLORER[0].id);
  const [activeStage, setActiveStage] = React.useState<number>(0);
  const [activePreview, setActivePreview] = React.useState<string>(PREVIEW_NAV[0].id);
  const explorer = EXPLORER.find((e) => e.id === activeExplorer)!;
  const preview = PREVIEW_NAV.find((p) => p.id === activePreview)!;
  const reveal1 = useReveal<HTMLDivElement>();
  const reveal2 = useReveal<HTMLDivElement>();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <Section className="pt-16 pb-14">
        <Container className="max-w-5xl text-center">
          <Badge variant="outline" className="mb-4">LEARNING MANAGEMENT SYSTEM</Badge>
          <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">
            Deliver Structured Learning Through A Modern LMS Experience.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Explore an organised learning experience for Programs, lessons, progress,
            Assessments and applicable Certificate journeys.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button variant="gradient" size="lg" asChild>
              <a href="#explorer">Explore LMS Capabilities <ArrowRight className="ml-1 size-4" /></a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="#journey">See The Student Journey</a>
            </Button>
            <Button variant="ghost" size="lg" asChild>
              <Link to="/book-consultation">Book Consultation</Link>
            </Button>
          </div>
        </Container>
      </Section>

      {/* What it supports */}
      <Section className="py-16">
        <Container className="max-w-5xl">
          <SectionHeader
            eyebrow="What The LMS Experience Supports"
            title="A learning experience organised around the student."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { icon: BookOpen, t: "Programs & Lessons", d: "Structured Programs with modular lessons students move through step by step." },
              { icon: ListChecks, t: "Progress & Assessments", d: "Clear progress tracking with assessments where the Program supports them." },
              { icon: GraduationCap, t: "Certificate Journeys", d: "Certificate steps for Programs configured to support certification." },
            ].map((c) => (
              <Card key={c.t} className="lift-card border-border/60">
                <CardHeader>
                  <div className="grid size-10 place-items-center rounded-md bg-primary-soft text-primary">
                    <c.icon className="size-5" />
                  </div>
                  <CardTitle className="mt-3">{c.t}</CardTitle>
                </CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">{c.d}</p></CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* Interactive Explorer */}
      <Section id="explorer" className="bg-muted/30 py-16">
        <Container className="max-w-6xl">
          <SectionHeader
            eyebrow="Interactive LMS Explorer"
            title="Explore The Learning Experience"
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {EXPLORER.map((e) => {
                const active = e.id === activeExplorer;
                const Icon = e.icon;
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setActiveExplorer(e.id)}
                    aria-pressed={active}
                    className={`lift-card flex items-center gap-3 rounded-xl border p-3 text-left transition ${active ? "lift-card-selected border-primary bg-primary-soft" : "border-border/60 bg-card"}`}
                  >
                    <span className={`grid size-9 place-items-center rounded-md ${active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                      <Icon className="size-4" />
                    </span>
                    <span className="font-medium">{e.title}</span>
                  </button>
                );
              })}
            </div>
            <Card className="border-border/60">
              <CardContent className="grid gap-5 p-6 md:p-8">
                <h3 className="font-display text-2xl font-semibold">{explorer.title}</h3>
                <ExplorerRow label="What It Supports" value={explorer.supports} />
                <ExplorerRow label="How The Student Experiences It" value={explorer.student} />
                <ExplorerRow label="How It Connects To The Journey" value={explorer.connects} />
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>

      {/* Student Journey */}
      <Section id="journey" className="py-16">
        <Container className="max-w-5xl">
          <SectionHeader
            eyebrow="Student Learning Journey"
            title="From Program Access To Certificate Eligibility"
          />
          <div ref={reveal1.ref} className={`mt-8 grid gap-3 ${reveal1.shown ? "reveal" : "opacity-0"}`}>
            <div className="hidden md:grid md:grid-cols-9 md:gap-2">
              {JOURNEY.map((s, i) => {
                const active = i === activeStage;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setActiveStage(i)}
                    className={`lift-card rounded-lg border p-3 text-left text-xs ${active ? "lift-card-selected border-primary bg-primary-soft" : "border-border/60 bg-card"}`}
                  >
                    <div className="font-mono text-[10px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</div>
                    <div className="mt-1 font-medium leading-tight">{s}</div>
                  </button>
                );
              })}
            </div>
            <ol className="grid gap-2 md:hidden">
              {JOURNEY.map((s, i) => (
                <li key={s} className="lift-card flex items-start gap-3 rounded-lg border border-border/60 bg-card p-3">
                  <span className="mt-0.5 grid size-6 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium">{s}</span>
                </li>
              ))}
            </ol>
            <Card className="mt-2 border-border/60">
              <CardContent className="p-5">
                <div className="text-sm text-muted-foreground">
                  Stage {activeStage + 1} of {JOURNEY.length}
                </div>
                <div className="mt-1 font-display text-xl font-semibold">{JOURNEY[activeStage]}</div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>

      {/* Preview */}
      <Section className="bg-muted/30 py-16">
        <Container className="max-w-5xl">
          <SectionHeader
            eyebrow="LMS Experience Preview"
            title="A public capability demonstration"
            description="This preview is illustrative and does not fetch real student data."
          />
          <div ref={reveal2.ref} className={`mt-8 grid gap-6 md:grid-cols-[220px_minmax(0,1fr)] ${reveal2.shown ? "reveal" : "opacity-0"}`}>
            <div className="grid gap-2">
              {PREVIEW_NAV.map((p) => {
                const active = p.id === activePreview;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActivePreview(p.id)}
                    aria-pressed={active}
                    className={`lift-card rounded-lg border px-3 py-2 text-left text-sm ${active ? "lift-card-selected border-primary bg-primary-soft font-medium" : "border-border/60 bg-card"}`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <Card className="border-border/60">
              <CardContent className="p-6">
                <div className="font-display text-xl font-semibold">{preview.label}</div>
                <p className="mt-2 text-muted-foreground">{preview.body}</p>
                <div className="mt-5 rounded-md border border-dashed border-border p-4 text-xs text-muted-foreground">
                  Public preview only. Real student data is not loaded on this page.
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>

      {/* Who it is for */}
      <Section className="py-16">
        <Container className="max-w-5xl">
          <SectionHeader eyebrow="Who It Is For" title="Built for education brands and structured learning" />
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {WHO.map((w) => (
              <Card key={w} className="lift-card border-border/60">
                <CardContent className="flex items-start gap-3 p-4">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                  <p className="text-sm">{w}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* FAQs */}
      <Section className="bg-muted/30 py-16">
        <Container className="max-w-3xl">
          <SectionHeader eyebrow="FAQs" title="Common questions about the LMS experience" />
          <Accordion type="single" collapsible className="mt-6">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`f${i}`}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent>{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Container>
      </Section>

      {/* Final CTA */}
      <Section className="py-20">
        <Container className="max-w-4xl text-center">
          <Sparkles className="mx-auto size-8 text-primary" />
          <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
            Explore An LMS Experience Built Around The Learning Journey.
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button variant="gradient" size="lg" asChild>
              <Link to="/book-consultation">Book Consultation</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/white-label-edtech">Explore White Label EdTech</Link>
            </Button>
            <Button variant="ghost" size="lg" asChild>
              <Link to="/brand-setup">Explore Brand Setup</Link>
            </Button>
          </div>
        </Container>
      </Section>

      <SiteFooter />
    </div>
  );
}

function ExplorerRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-base">{value}</div>
    </div>
  );
}
