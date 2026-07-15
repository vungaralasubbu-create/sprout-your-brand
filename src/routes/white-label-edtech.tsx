import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Layers,
  LayoutDashboard,
  MessageSquare,
  Rocket,
  ShieldCheck,
  Sparkles,
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

export const Route = createFileRoute("/white-label-edtech")({
  head: () => ({
    meta: [
      { title: "White Label EdTech Platform | Glintr" },
      {
        name: "description",
        content:
          "Explore a branded education experience built around Glintr's approved learning and platform capabilities.",
      },
      { property: "og:title", content: "White Label EdTech Platform | Glintr" },
      {
        property: "og:description",
        content:
          "Launch an education experience under your brand using approved learning, LMS and platform capabilities.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://glintr.com/white-label-edtech" }],
  }),
  component: WhiteLabelEdTechPage,
});

const MEANING = [
  {
    icon: Rocket,
    title: "Your Branded Education Surface",
    copy: "A student-facing education experience presented with your brand direction, positioning and learner communication.",
  },
  {
    icon: BookOpen,
    title: "Approved Learning Capabilities",
    copy: "Programs, lessons, progress, assessments and applicable certificate journeys stay aligned with Glintr's approved capabilities.",
  },
  {
    icon: ShieldCheck,
    title: "Shared Platform Governance",
    copy: "The platform foundation is structured for safer operations, review and consistent learner delivery.",
  },
];

const EXPERIENCE = [
  {
    id: "brand",
    title: "Brand Experience",
    icon: Sparkles,
    points: ["Brand positioning", "Student-facing language", "Program presentation", "Consultation-ready setup"],
  },
  {
    id: "learning",
    title: "Learning Experience",
    icon: GraduationCap,
    points: ["Programs", "Lessons", "Progress", "Assessments where applicable", "Certificate journeys where applicable"],
  },
  {
    id: "platform",
    title: "Platform Experience",
    icon: LayoutDashboard,
    points: ["LMS surface", "Lead and enquiry flow", "Admin-ready structure", "Support handoff paths"],
  },
];

const SETUP_STEPS = [
  "Clarify brand direction",
  "Define audience and education focus",
  "Select approved Program capabilities",
  "Shape student communication",
  "Prepare platform experience",
  "Review launch readiness",
];

const JOURNEY = [
  "Brand Direction",
  "Program Scope",
  "LMS Experience",
  "Student Communication",
  "Review",
  "Launch Readiness",
];

const FAQS = [
  {
    q: "Is this a separate company or a separate backend?",
    a: "This page describes the public white-label experience. The setup uses Glintr's approved platform capabilities rather than a separate unreviewed backend.",
  },
  {
    q: "Can the student experience carry my brand direction?",
    a: "Yes. Brand setup focuses on positioning, audience direction, student-facing language and Program presentation.",
  },
  {
    q: "Does every Program include certificates?",
    a: "Certificates apply where a Program is configured to support certificate journeys. The consultation clarifies what applies to your scope.",
  },
  {
    q: "Where should I start?",
    a: "Start with Brand Setup if your positioning is unclear, or book a consultation if you already know what you want to launch.",
  },
];

function WhiteLabelEdTechPage() {
  const [activeExperience, setActiveExperience] = React.useState(EXPERIENCE[0].id);
  const [activeJourney, setActiveJourney] = React.useState(0);
  const revealExperience = useReveal<HTMLDivElement>();
  const revealJourney = useReveal<HTMLDivElement>();
  const selected = EXPERIENCE.find((item) => item.id === activeExperience) ?? EXPERIENCE[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <Section className="pt-16 pb-14 md:pt-20 md:pb-18">
          <Container className="max-w-6xl">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
              <div>
                <Badge variant="outline" className="mb-4 uppercase tracking-widest">
                  WHITE LABEL EDTECH
                </Badge>
                <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">
                  Launch An Education Experience Under Your Brand.
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                  Explore a branded education experience built around Glintr's approved
                  learning and platform capabilities.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button variant="gradient" size="lg" asChild className="lift-card">
                    <a href="#experience">
                      Explore The Experience <ArrowRight className="size-4" />
                    </a>
                  </Button>
                  <Button variant="outline" size="lg" asChild className="lift-card">
                    <Link to="/book-consultation">Book Consultation</Link>
                  </Button>
                </div>
              </div>
              <Card className="lift-card border-border/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="size-5 text-primary" />
                    White-label foundation
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm text-muted-foreground">
                  {[
                    "Brand direction and learner communication",
                    "Programs, LMS, progress and applicable certificates",
                    "Consultation-led setup without fake calendar slots",
                  ].map((line) => (
                    <div key={line} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{line}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </Container>
        </Section>

        <Section className="bg-muted/30 py-16">
          <Container className="max-w-6xl">
            <SectionHeader
              eyebrow="What White Label EdTech Means"
              title="A branded education experience without rebuilding the platform from scratch."
              description="The focus is on brand clarity, learner experience and responsible use of approved platform capabilities."
            />
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {MEANING.map((item) => (
                <Card key={item.title} className="lift-card border-border/60">
                  <CardHeader>
                    <div className="grid size-10 place-items-center rounded-md bg-primary-soft text-primary">
                      <item.icon className="size-5" />
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{item.copy}</CardContent>
                </Card>
              ))}
            </div>
          </Container>
        </Section>

        <Section id="experience" className="py-16">
          <Container className="max-w-6xl">
            <SectionHeader
              eyebrow="Your Brand And Learning Experience"
              title="Explore the parts that make the experience feel complete."
            />
            <div
              ref={revealExperience.ref}
              data-visible={revealExperience.dataVisible}
              className="reveal mt-8 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]"
            >
              <div className="grid gap-2">
                {EXPERIENCE.map((item) => {
                  const active = item.id === activeExperience;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setActiveExperience(item.id)}
                      className={`lift-card flex items-center gap-3 rounded-xl border p-3 text-left ${active ? "lift-card-selected border-primary bg-primary-soft" : "border-border/60 bg-card"}`}
                    >
                      <span className={`grid size-9 place-items-center rounded-md ${active ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        <item.icon className="size-4" />
                      </span>
                      <span className="font-medium">{item.title}</span>
                    </button>
                  );
                })}
              </div>
              <Card className="border-border/60">
                <CardContent className="p-6 md:p-8">
                  <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Platform Experience
                  </div>
                  <h2 className="mt-2 font-display text-2xl font-semibold">{selected.title}</h2>
                  <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                    {selected.points.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </Container>
        </Section>

        <Section className="bg-muted/30 py-16">
          <Container className="max-w-6xl">
            <SectionHeader eyebrow="Student Journey" title="A learner path that stays clear from discovery to completion." />
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {[
                { icon: Users, title: "Discover", copy: "Students understand who the Program is for and what it helps them do." },
                { icon: Layers, title: "Enroll", copy: "The experience routes learners into the right Program and learning surface." },
                { icon: BookOpen, title: "Learn", copy: "Lessons, progress and assessments keep the journey structured." },
                { icon: GraduationCap, title: "Complete", copy: "Applicable results and certificate steps close the learning loop." },
              ].map((item) => (
                <Card key={item.title} className="lift-card border-border/60">
                  <CardContent className="p-5">
                    <item.icon className="size-6 text-primary" />
                    <h3 className="mt-4 font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{item.copy}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Container>
        </Section>

        <Section className="py-16">
          <Container className="max-w-6xl">
            <SectionHeader eyebrow="How Setup Works" title="A practical path from brand idea to launch readiness." />
            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {SETUP_STEPS.map((step, index) => (
                <Card key={step} className="lift-card border-border/60">
                  <CardContent className="p-5">
                    <div className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</div>
                    <div className="mt-2 font-semibold">{step}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button variant="outline" asChild className="lift-card">
                <Link to="/brand-setup">Explore Brand Setup</Link>
              </Button>
              <Button variant="ghost" asChild className="lift-card">
                <Link to="/lms">Explore LMS</Link>
              </Button>
            </div>
          </Container>
        </Section>

        <Section className="bg-muted/30 py-16">
          <Container className="max-w-6xl">
            <SectionHeader eyebrow="Launch Journey" title="Select the stage you want to understand." />
            <div
              ref={revealJourney.ref}
              data-visible={revealJourney.dataVisible}
              className="reveal mt-8 grid gap-3 md:grid-cols-6"
            >
              {JOURNEY.map((stage, index) => {
                const active = index === activeJourney;
                return (
                  <button
                    key={stage}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setActiveJourney(index)}
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
                <p className="text-sm text-muted-foreground">Selected stage</p>
                <h3 className="mt-1 font-display text-xl font-semibold">{JOURNEY[activeJourney]}</h3>
              </CardContent>
            </Card>
          </Container>
        </Section>

        <Section className="py-16">
          <Container className="max-w-3xl">
            <SectionHeader eyebrow="Frequently Asked Questions" title="White Label EdTech FAQs" />
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
              Build The Education Experience Around A Clear Brand.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Start with brand direction, explore the LMS, or share your launch goals with Glintr.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Button variant="gradient" size="lg" asChild className="lift-card">
                <Link to="/book-consultation">Book Consultation</Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="lift-card">
                <Link to="/brand-setup">Explore Brand Setup</Link>
              </Button>
              <Button variant="ghost" size="lg" asChild className="lift-card">
                <Link to="/lms">Explore LMS</Link>
              </Button>
            </div>
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}