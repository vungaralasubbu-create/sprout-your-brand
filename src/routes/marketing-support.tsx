import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Compass,
  LineChart,
  Megaphone,
  MessageSquare,
  Rocket,
  ShieldAlert,
  Sparkles,
  Target,
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

export const Route = createFileRoute("/marketing-support")({
  head: () => ({
    meta: [
      { title: "EdTech Marketing Support | Glintr" },
      {
        name: "description",
        content:
          "Explore approved Glintr marketing support areas — brand messaging, program positioning, campaign direction and performance learning for education brands.",
      },
      { property: "og:title", content: "EdTech Marketing Support | Glintr" },
      {
        property: "og:description",
        content:
          "Marketing support for education brands — clearer messaging, positioning and campaign learning.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { rel: "canonical", href: "https://glintr.com/marketing-support" } as never,
    ],
  }),
  component: MarketingSupportPage,
});

const AREAS = [
  { id: "brand-messaging", icon: MessageSquare, title: "Brand Messaging",
    means: "How your education brand speaks to the audience you want to reach.",
    matters: "Clear messaging helps the right learners recognise your brand quickly.",
    brand: "You own the voice, values and final approvals.",
    glintr: "Guidance on structure, clarity and audience alignment." },
  { id: "program-positioning", icon: Target, title: "Program Positioning",
    means: "How each Program is presented to the learner it serves.",
    matters: "Clear positioning reduces confusion and improves fit.",
    brand: "You own the Programs and the promise you make.",
    glintr: "Guidance on structure, clarity and audience fit." },
  { id: "campaign-direction", icon: Compass, title: "Campaign Direction",
    means: "A direction for campaigns before creative and spend are committed.",
    matters: "A clear direction reduces wasted campaign effort.",
    brand: "You own budget, channel choice and execution decisions.",
    glintr: "Guidance on angles, audiences and message alignment." },
  { id: "content-direction", icon: Megaphone, title: "Content Direction",
    means: "A shared direction for content across surfaces.",
    matters: "Consistent content builds recognition over time.",
    brand: "You own the content plan and publishing cadence.",
    glintr: "Guidance on themes, structure and audience alignment." },
  { id: "landing-experience", icon: Rocket, title: "Landing Experience",
    means: "How a campaign visitor experiences the landing surface.",
    matters: "A clear landing experience helps genuine enquiries.",
    brand: "You own the offer, promises and legal statements.",
    glintr: "Guidance on structure, clarity and student-facing flow." },
  { id: "student-communication", icon: MessageSquare, title: "Student Communication",
    means: "How your brand communicates with students and prospects.",
    matters: "Clear communication builds trust with the learner.",
    brand: "You own tone, approvals and the message you send.",
    glintr: "Guidance on structure, clarity and safe communication." },
  { id: "performance-review", icon: BarChart3, title: "Performance Review",
    means: "A structured look at what campaigns produced.",
    matters: "Reviewing performance turns activity into learning.",
    brand: "You own the campaigns and access to their data.",
    glintr: "Guidance on what to observe and how to read it." },
  { id: "growth-learning", icon: LineChart, title: "Growth Learning",
    means: "Turning performance signals into the next direction.",
    matters: "Consistent learning compounds over campaigns.",
    brand: "You own the decisions you make from what you learn.",
    glintr: "Guidance on patterns and structured next steps." },
] as const;

const GROWTH = {
  "Brand Awareness": ["Brand Messaging", "Content Direction", "Campaign Direction"],
  "Program Discovery": ["Program Positioning", "Landing Experience", "Content Direction"],
  "Student Enquiries": ["Program Positioning", "Landing Experience", "Student Communication", "Campaign Direction"],
  "Campaign Clarity": ["Campaign Direction", "Brand Messaging", "Content Direction"],
  "Landing Experience": ["Landing Experience", "Program Positioning", "Student Communication"],
  "Student Communication": ["Student Communication", "Brand Messaging", "Program Positioning"],
  "Marketing Performance Understanding": ["Performance Review", "Growth Learning", "Campaign Direction"],
} as const;

const JOURNEY = [
  "Goal", "Audience", "Message", "Program Positioning",
  "Campaign Direction", "Launch", "Observe Performance", "Learn", "Improve",
];

const WHO = [
  "Founders launching an education brand",
  "Institutions communicating structured Programs to learners",
  "Educators building consistent audience communication",
  "Teams looking for clearer growth direction",
];

const FAQS = [
  { q: "Do you guarantee leads or enrollments?", a: "No. Marketing support focuses on clearer messaging, positioning and campaign learning. Outcomes depend on audience, offer, execution and market conditions." },
  { q: "Do you run the campaigns for us?", a: "The brand owns budget, channel and execution. Glintr provides guidance on direction, structure and clarity within approved support areas." },
  { q: "Can we combine areas?", a: "Yes. Most brands work across positioning, landing experience and student communication together." },
  { q: "What is included at consultation stage?", a: "A conversation to understand your brand, audience and goals — and to align on which support areas are relevant." },
];

function useReveal<T extends HTMLElement>() {
  const ref = React.useRef<T | null>(null);
  const [shown, setShown] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, shown };
}

function MarketingSupportPage() {
  const [activeArea, setActiveArea] = React.useState<string>(AREAS[0].id);
  const [goal, setGoal] = React.useState<keyof typeof GROWTH>("Student Enquiries");
  const [stage, setStage] = React.useState(0);
  const area = AREAS.find((a) => a.id === activeArea)!;
  const revealJ = useReveal<HTMLDivElement>();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <Section className="pt-16 pb-14">
        <Container className="max-w-5xl text-center">
          <Badge variant="outline" className="mb-4">MARKETING SUPPORT</Badge>
          <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">
            Build A Clearer Growth Experience For Your Education Brand.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Explore approved marketing support areas designed to help education brands
            communicate clearly, structure campaigns and learn from performance.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button variant="gradient" size="lg" asChild>
              <a href="#areas">Explore Marketing Support <ArrowRight className="ml-1 size-4" /></a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="#explorer">Build A Growth Direction</a>
            </Button>
            <Button variant="ghost" size="lg" asChild>
              <Link to="/launch-your-brand/consultation">Book Consultation</Link>
            </Button>
          </div>
        </Container>
      </Section>

      {/* What it means */}
      <Section className="py-14">
        <Container className="max-w-4xl">
          <SectionHeader eyebrow="What Marketing Support Means" title="Guidance on direction, not guaranteed outcomes." />
          <p className="mt-4 text-muted-foreground">
            Marketing support helps education brands sharpen how they communicate, position
            Programs and structure campaigns. The brand owns decisions, execution and
            outcomes. Glintr provides guidance within approved support areas.
          </p>
        </Container>
      </Section>

      {/* Areas */}
      <Section id="areas" className="bg-muted/30 py-16">
        <Container className="max-w-6xl">
          <SectionHeader eyebrow="Support Areas" title="Explore Marketing Support Areas" />
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {AREAS.map((a) => {
                const active = a.id === activeArea;
                const Icon = a.icon;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setActiveArea(a.id)}
                    aria-pressed={active}
                    className={`lift-card flex items-center gap-3 rounded-xl border p-3 text-left ${active ? "lift-card-selected border-primary bg-primary-soft" : "border-border/60 bg-card"}`}
                  >
                    <span className={`grid size-9 place-items-center rounded-md ${active ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <Icon className="size-4" />
                    </span>
                    <span className="font-medium">{a.title}</span>
                  </button>
                );
              })}
            </div>
            <Card className="border-border/60">
              <CardContent className="grid gap-5 p-6 md:p-8">
                <h3 className="font-display text-2xl font-semibold">{area.title}</h3>
                <Row label="What It Means" value={area.means} />
                <Row label="Why It Matters" value={area.matters} />
                <Row label="What The Brand Owns" value={area.brand} />
                <Row label="What Glintr May Support" value={area.glintr} />
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>

      {/* Growth Explorer */}
      <Section id="explorer" className="py-16">
        <Container className="max-w-5xl">
          <SectionHeader eyebrow="Interactive Growth Explorer" title="What Are You Trying To Improve?" />
          <div className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(GROWTH) as (keyof typeof GROWTH)[]).map((g) => {
              const active = g === goal;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGoal(g)}
                  aria-pressed={active}
                  className={`lift-card rounded-lg border p-3 text-left text-sm ${active ? "lift-card-selected border-primary bg-primary-soft font-medium" : "border-border/60 bg-card"}`}
                >
                  {g}
                </button>
              );
            })}
          </div>
          <Card className="mt-6 border-border/60">
            <CardContent className="p-6">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Suggested support direction</div>
              <div className="mt-1 font-display text-xl font-semibold">{goal}</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {GROWTH[goal].map((s) => (
                  <Badge key={s} variant="muted" className="text-sm">{s}</Badge>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                This is guidance only. Enquiry and campaign outcomes are not guaranteed.
              </p>
            </CardContent>
          </Card>
        </Container>
      </Section>

      {/* Campaign Journey */}
      <Section className="bg-muted/30 py-16">
        <Container className="max-w-5xl">
          <SectionHeader eyebrow="Campaign Journey" title="From Growth Goal To Performance Learning" />
          <div ref={revealJ.ref} className={`mt-8 grid gap-3 ${revealJ.shown ? "reveal" : "opacity-0"}`}>
            <div className="hidden md:grid md:grid-cols-9 md:gap-2">
              {JOURNEY.map((s, i) => {
                const active = i === stage;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStage(i)}
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
                  <span className="mt-0.5 grid size-6 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">{i + 1}</span>
                  <span className="text-sm font-medium">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </Section>

      {/* Boundary */}
      <Section className="py-16">
        <Container className="max-w-4xl">
          <Card className="border-amber-300/60 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-500/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <ShieldAlert className="size-6 text-amber-600" />
                <CardTitle>Marketing Support Does Not Mean Guaranteed Results</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm text-muted-foreground">
              <p>Marketing outcomes can depend on audience, offer, positioning, execution, market conditions and other factors.</p>
              <ul className="mt-2 grid gap-1.5">
                {["Guaranteed leads", "Guaranteed enrollments", "Guaranteed ROAS", "Guaranteed revenue", "Guaranteed conversion rate"].map((x) => (
                  <li key={x} className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-amber-500" /> Not promised: {x}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </Container>
      </Section>

      {/* Who */}
      <Section className="bg-muted/30 py-16">
        <Container className="max-w-5xl">
          <SectionHeader eyebrow="Who It Is For" title="Education brands that want clearer growth direction" />
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
      <Section className="py-16">
        <Container className="max-w-3xl">
          <SectionHeader eyebrow="FAQs" title="Marketing support questions" />
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
            Explore A Clearer Growth Direction For Your Education Brand.
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button variant="gradient" size="lg" asChild>
              <Link to="/launch-your-brand/consultation">Book Consultation</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/launch-your-brand/start">Explore Brand Setup</Link>
            </Button>
            <Button variant="ghost" size="lg" asChild>
              <Link to="/launch-your-brand">Explore White Label EdTech</Link>
            </Button>
          </div>
        </Container>
      </Section>

      <SiteFooter />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-base">{value}</div>
    </div>
  );
}
