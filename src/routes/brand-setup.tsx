import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Megaphone,
  MessageSquare,
  Rocket,
  Sparkles,
  Target,
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
import { useReveal } from "@/hooks/use-motion";

export const Route = createFileRoute("/brand-setup")({
  head: () => ({
    meta: [
      { title: "Brand Setup For Education Brands | Glintr" },
      {
        name: "description",
        content:
          "Explore brand positioning, audience direction and the student-facing experience for your education brand.",
      },
      { property: "og:title", content: "Brand Setup For Education Brands | Glintr" },
      {
        property: "og:description",
        content:
          "Build a clear foundation for your education brand with positioning, audience and communication direction.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://glintr.com/brand-setup" }],
  }),
  component: BrandSetupPage,
});

const DIRECTIONS = [
  {
    id: "career-growth",
    label: "Career Growth",
    icon: Target,
    audience: "Learners seeking practical skills and career direction.",
    focus: "Program clarity, outcome language and trustworthy guidance.",
  },
  {
    id: "campus",
    label: "Campus And Institution",
    icon: GraduationCap,
    audience: "Students, colleges and institutional stakeholders.",
    focus: "Structured learning, campus communication and Program relevance.",
  },
  {
    id: "professional",
    label: "Professional Upskilling",
    icon: Users,
    audience: "Working professionals and teams exploring practical upskilling.",
    focus: "Credibility, use-case language and clear learner pathways.",
  },
];

const SETUP_AREAS = [
  { icon: Users, title: "Audience", copy: "Define who the brand serves and what they need to understand first." },
  { icon: BookOpen, title: "Education Focus", copy: "Clarify the Program categories, learner outcomes and learning experience emphasis." },
  { icon: BadgeCheck, title: "Brand Positioning", copy: "Shape the brand promise without overclaiming outcomes or learner results." },
  { icon: MessageSquare, title: "Student Communication", copy: "Prepare student-facing language that is clear, safe and easy to act on." },
  { icon: Megaphone, title: "Program Presentation", copy: "Present Programs with fit, structure, eligibility and next steps in mind." },
];

const JOURNEY = [
  "Brand Direction",
  "Audience",
  "Education Focus",
  "Positioning",
  "Communication",
  "Program Presentation",
  "Readiness Review",
];

const READINESS = [
  "The audience is clearly described.",
  "The education focus is easy to explain.",
  "Program presentation avoids unsupported promises.",
  "Student communication has a clear next step.",
  "The brand can connect to white-label and LMS setup.",
];

const FAQS = [
  {
    q: "Is Brand Setup the same as launching the platform?",
    a: "No. Brand Setup clarifies positioning, audience and student communication. White Label EdTech and LMS setup connect that direction to the platform experience.",
  },
  {
    q: "Can I continue to the older interactive brand builder?",
    a: "Yes. This page is the public Brand Setup overview. The interactive builder remains available for detailed setup work.",
  },
  {
    q: "Do you create guaranteed marketing outcomes here?",
    a: "No. Brand Setup improves clarity and readiness. Enrollments, revenue or campaign results are not guaranteed.",
  },
  {
    q: "What if I need multiple services?",
    a: "Use Book Consultation and choose Multiple Services so Glintr can route the discussion correctly.",
  },
];

function BrandSetupPage() {
  const [activeDirection, setActiveDirection] = React.useState(DIRECTIONS[0].id);
  const [activeStage, setActiveStage] = React.useState(0);
  const reveal = useReveal<HTMLDivElement>();
  const selected = DIRECTIONS.find((item) => item.id === activeDirection) ?? DIRECTIONS[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <Section className="pt-16 pb-14 md:pt-20">
          <Container className="max-w-5xl text-center">
            <Badge variant="outline" className="mb-4 uppercase tracking-widest">
              BRAND SETUP
            </Badge>
            <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">
              Build A Clear Foundation For Your Education Brand.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Explore brand positioning, audience direction and the student-facing experience
              for your education brand.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Button variant="gradient" size="lg" asChild className="lift-card">
                <a href="#direction">
                  Start With Your Brand Direction <ArrowRight className="size-4" />
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild className="lift-card">
                <Link to="/book-consultation">Book Consultation</Link>
              </Button>
            </div>
          </Container>
        </Section>

        <Section id="direction" className="bg-muted/30 py-16">
          <Container className="max-w-6xl">
            <SectionHeader
              eyebrow="Start With Your Brand Direction"
              title="Choose the direction closest to what you want to build."
            />
            <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <div className="grid gap-3">
                {DIRECTIONS.map((item) => {
                  const active = item.id === activeDirection;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setActiveDirection(item.id)}
                      className={`lift-card flex items-center gap-3 rounded-xl border p-4 text-left ${active ? "lift-card-selected border-primary bg-primary-soft" : "border-border/60 bg-card"}`}
                    >
                      <span className={`grid size-10 place-items-center rounded-md ${active ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        <item.icon className="size-5" />
                      </span>
                      <span className="font-semibold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
              <Card className="border-border/60">
                <CardContent className="grid gap-5 p-6 md:p-8">
                  <h2 className="font-display text-2xl font-semibold">{selected.label}</h2>
                  <InfoRow label="Audience" value={selected.audience} />
                  <InfoRow label="Education Focus" value={selected.focus} />
                  <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                    Use this as a starting point, then refine the language and Program presentation
                    before connecting to the LMS and white-label launch path.
                  </p>
                </CardContent>
              </Card>
            </div>
          </Container>
        </Section>

        <Section className="py-16">
          <Container className="max-w-6xl">
            <SectionHeader
              eyebrow="Audience, Positioning And Student Communication"
              title="Build the public surface of the brand with care."
            />
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {SETUP_AREAS.map((area) => (
                <Card key={area.title} className="lift-card border-border/60">
                  <CardHeader>
                    <div className="grid size-10 place-items-center rounded-md bg-primary-soft text-primary">
                      <area.icon className="size-5" />
                    </div>
                    <CardTitle className="text-lg">{area.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{area.copy}</CardContent>
                </Card>
              ))}
            </div>
          </Container>
        </Section>

        <Section className="bg-muted/30 py-16">
          <Container className="max-w-6xl">
            <SectionHeader eyebrow="Brand Setup Journey" title="Move from idea to launch-ready direction." />
            <div
              ref={reveal.ref}
              data-visible={reveal.dataVisible}
              className="reveal mt-8 grid gap-3 md:grid-cols-7"
            >
              {JOURNEY.map((stage, index) => {
                const active = index === activeStage;
                return (
                  <button
                    key={stage}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setActiveStage(index)}
                    className={`lift-card rounded-lg border p-3 text-left text-xs ${active ? "lift-card-selected border-primary bg-primary-soft" : "border-border/60 bg-card"}`}
                  >
                    <div className="font-mono text-[10px] text-muted-foreground">{String(index + 1).padStart(2, "0")}</div>
                    <div className="mt-1 font-medium leading-tight">{stage}</div>
                  </button>
                );
              })}
            </div>
            <Card className="mt-4 border-border/60">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Current stage</p>
                <h3 className="mt-1 font-display text-xl font-semibold">{JOURNEY[activeStage]}</h3>
              </CardContent>
            </Card>
          </Container>
        </Section>

        <Section className="py-16">
          <Container className="max-w-5xl">
            <SectionHeader eyebrow="Launch Readiness" title="A practical checklist before the brand moves forward." />
            <div className="mt-8 grid gap-3 md:grid-cols-2">
              {READINESS.map((item) => (
                <Card key={item} className="lift-card border-border/60">
                  <CardContent className="flex items-start gap-3 p-4">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                    <span className="text-sm">{item}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Button variant="outline" asChild className="lift-card">
                <Link to="/white-label-edtech">Explore White Label EdTech</Link>
              </Button>
              <Button variant="ghost" asChild className="lift-card">
                <Link to="/lms">Explore LMS</Link>
              </Button>
            </div>
          </Container>
        </Section>

        <Section className="bg-muted/30 py-16">
          <Container className="max-w-3xl">
            <SectionHeader eyebrow="Frequently Asked Questions" title="Brand Setup FAQs" />
            <Accordion type="single" collapsible className="mt-6">
              {FAQS.map((faq, index) => (
                <AccordionItem key={faq.q} value={`faq-${index}`}>
                  <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                  <AccordionContent>{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Container>
        </Section>

        <Section className="py-20">
          <Container className="max-w-4xl text-center">
            <Sparkles className="mx-auto size-8 text-primary" />
            <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
              Turn Brand Direction Into A Launch-Ready Experience.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Connect your positioning to White Label EdTech, LMS capabilities and a consultation path.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Button variant="gradient" size="lg" asChild className="lift-card">
                <Link to="/book-consultation">Book Consultation</Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="lift-card">
                <Link to="/white-label-edtech">White Label EdTech</Link>
              </Button>
              <Button variant="ghost" size="lg" asChild className="lift-card">
                <Link to="/lms">LMS</Link>
              </Button>
            </div>
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
      <p className="mt-1 text-sm leading-relaxed">{value}</p>
    </div>
  );
}