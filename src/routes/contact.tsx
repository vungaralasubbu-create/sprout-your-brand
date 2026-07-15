import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import * as React from "react";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Compass,
  GraduationCap,
  Handshake,
  Loader2,
  Mail,
  MessageCircle,
  Newspaper,
  RotateCcw,
  School,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  Wand2,
} from "lucide-react";
import { z } from "zod";

import { Container, Section } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  CONTACT_INTENTS,
  CONTACT_INTENT_LABELS,
  normaliseContactIntent,
  prepareContactEnquiry,
  routeContactEnquiry,
  type ContactIntent,
} from "@/lib/contact/contact.functions";
import { submitContactEnquiry } from "@/lib/contact/contact-submit.functions";
import { toast } from "sonner";

// Legacy Smart-FAQ handoff params are preserved so existing links keep working.
const SearchSchema = z.object({
  intent: z.string().optional(),
  q: z.string().optional(),
  source: z.string().optional(),
  faq: z.array(z.string()).optional(),
});

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Glintr | Enquiries, Partnerships And Support Routing" },
      {
        name: "description",
        content:
          "Contact Glintr for general enquiries, partnerships, institution discussions, business and media enquiries, or find the right Student and Partner Support path.",
      },
      { property: "og:title", content: "Contact Glintr" },
      {
        property: "og:description",
        content:
          "Start with what you need. Glintr guides you to the right support or contact path.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://glintr.com/contact" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://glintr.com/contact" }],
  }),
  validateSearch: (raw) => SearchSchema.parse(raw ?? {}),
  component: ContactPage,
  errorComponent: () => (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Contact is momentarily unavailable</h1>
      <p className="mt-2 text-sm text-muted-foreground">Please try again in a moment.</p>
    </main>
  ),
  notFoundComponent: () => (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Page not found</h1>
    </main>
  ),
});

// =====================================================================
// Intent catalogue — visitor-facing labels + copy
// =====================================================================
type IntentCard = {
  intent: ContactIntent;
  label: string;
  short: string;
  headline: string;
  description: string;
  primaryLabel: string;
  primaryTo?: string;
  secondaryLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  common?: string[];
};

const INTENT_CARDS: IntentCard[] = [
  {
    intent: "student_support",
    label: "I Need Student Support",
    short: "Learning, Program, Enrollment, Assessment or Certificate help.",
    headline: "Student Support",
    description:
      "Get help with Program access, Enrollment, My Learning, Modules, Lessons, Progress, Assessments, Certificates or learning platform issues.",
    primaryLabel: "Open Student Support",
    primaryTo: "/student-support",
    secondaryLabel: "Ask AI Student Support",
    icon: GraduationCap,
    common: [
      "My Program is missing from My Learning.",
      "My Assessment result is not showing.",
      "My Certificate has not been issued.",
    ],
  },
  {
    intent: "partner_support",
    label: "I Need Partner Support",
    short: "Existing Sales Partner or Campus Ambassador account help.",
    headline: "Partner Support",
    description:
      "Get help with your Sales Partner or Campus Ambassador account — leads, enrollments, commissions, payouts and partner tooling.",
    primaryLabel: "Open Partner Support",
    primaryTo: "/partner-support",
    icon: Handshake,
    common: [
      "My lead is not showing.",
      "A commission is missing.",
      "My payout is not moving.",
    ],
  },
  {
    intent: "general",
    label: "I Have A General Enquiry",
    short: "A general question that is not account-specific.",
    headline: "General Enquiry",
    description:
      "Ask a general question about Glintr that is not related to an existing Student or Partner support issue.",
    primaryLabel: "Prepare General Enquiry",
    icon: MessageCircle,
    common: [
      "How does Glintr work?",
      "How do I decide which program suits me?",
      "Can I use Glintr from my city?",
    ],
  },
  {
    intent: "partnership",
    label: "I Want To Discuss A Partnership",
    short: "Collaboration, partnership or proposal.",
    headline: "Partnership Enquiry",
    description:
      "Tell Glintr about the organisation, opportunity or collaboration you would like to discuss.",
    primaryLabel: "Prepare Partnership Enquiry",
    icon: Users,
    common: [
      "Can our organisation partner with Glintr?",
      "How do collaboration discussions work?",
      "Where can I share a partnership proposal?",
    ],
  },
  {
    intent: "institution",
    label: "I Represent A College Or Institution",
    short: "Institutional learning, campus engagement or collaboration.",
    headline: "College And Institution Enquiry",
    description:
      "Connect with Glintr about institutional learning, student opportunities, campus engagement or relevant collaboration.",
    primaryLabel: "Prepare Institution Enquiry",
    icon: School,
    common: [
      "Can our college work with Glintr?",
      "Can Glintr support our students?",
      "How do we discuss a campus collaboration?",
    ],
  },
  {
    intent: "business",
    label: "I Have A Business Enquiry",
    short: "Commercial, service or B2B business discussion.",
    headline: "Business Enquiry",
    description: "Contact Glintr about a relevant commercial, service or business discussion.",
    primaryLabel: "Prepare Business Enquiry",
    icon: Building2,
    common: [
      "Do you offer a business plan?",
      "Can we discuss a service arrangement?",
      "How do I reach the right team?",
    ],
  },
  {
    intent: "media",
    label: "I Have A Media Enquiry",
    short: "Press, editorial or media enquiry.",
    headline: "Media Enquiry",
    description: "Send a relevant media, press or editorial enquiry to Glintr.",
    primaryLabel: "Prepare Media Enquiry",
    icon: Newspaper,
    common: [
      "I would like to feature Glintr.",
      "I am researching the EdTech space.",
      "I would like an editorial conversation.",
    ],
  },
  {
    intent: "careers",
    label: "I Am Interested In Careers",
    short: "Explore open roles at Glintr.",
    headline: "Careers",
    description:
      "Explore open roles and the way Glintr hires. Careers-specific applications go through the Careers experience.",
    primaryLabel: "Explore Careers",
    primaryTo: "/careers",
    secondaryLabel: "Send A General Career Enquiry",
    icon: Compass,
  },
  {
    intent: "other",
    label: "Something Else",
    short: "A different contact reason.",
    headline: "Other Enquiry",
    description:
      "Tell Glintr what you are trying to do so the enquiry can be prepared with the right context.",
    primaryLabel: "Prepare Enquiry",
    icon: Sparkles,
  },
];

const INTENT_MAP: Record<ContactIntent, IntentCard> = INTENT_CARDS.reduce(
  (acc, c) => {
    acc[c.intent] = c;
    return acc;
  },
  {} as Record<ContactIntent, IntentCard>,
);

// =====================================================================
// Component
// =====================================================================
function ContactPage() {
  const search = Route.useSearch();
  const legacyIntent = normaliseContactIntent(search.intent);
  const legacyQuery = (search.q ?? "").trim();

  const [selectedIntent, setSelectedIntent] = React.useState<ContactIntent>(legacyIntent);
  const [routerInput, setRouterInput] = React.useState("");
  const [routerResult, setRouterResult] = React.useState<
    | null
    | { intent: ContactIntent; reason: string; confident: boolean }
    | { error: string }
  >(null);

  const [prepInput, setPrepInput] = React.useState(legacyQuery);
  const [prepResult, setPrepResult] = React.useState<
    | null
    | {
        title: string;
        summary: string;
        intent: ContactIntent;
        studentIssue: boolean;
        partnerIssue: boolean;
      }
    | { error: string }
  >(null);
  const [continued, setContinued] = React.useState(false);
  const [carriedTitle, setCarriedTitle] = React.useState("");
  const [carriedSummary, setCarriedSummary] = React.useState("");

  // Section refs for accessible focus management on hero CTAs.
  const routerRef = React.useRef<HTMLDivElement>(null);
  const prepRef = React.useRef<HTMLDivElement>(null);
  const formRef = React.useRef<HTMLDivElement>(null);
  const enquirySectionRef = React.useRef<HTMLDivElement>(null);

  const scrollToRef = (r: React.RefObject<HTMLElement | null>) => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    r.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    r.current?.focus?.();
  };

  const runRouter = useServerFn(routeContactEnquiry);
  const runPrepare = useServerFn(prepareContactEnquiry);

  const routerMut = useMutation({
    mutationFn: async (text: string) => runRouter({ data: { description: text } }),
    onSuccess: (res) => {
      if (res.ok) {
        setRouterResult({
          intent: res.intent,
          reason: res.reason,
          confident: res.confident,
        });
        if (res.confident) setSelectedIntent(res.intent);
      } else {
        setRouterResult({ error: res.reason });
      }
    },
    onError: () => setRouterResult({ error: "Contact routing is temporarily unavailable." }),
  });

  const prepMut = useMutation({
    mutationFn: async (text: string) =>
      runPrepare({ data: { description: text, intent: selectedIntent } }),
    onSuccess: (res) => {
      if (res.ok) {
        setPrepResult({
          title: res.title,
          summary: res.summary,
          intent: res.intent,
          studentIssue: res.studentIssue,
          partnerIssue: res.partnerIssue,
        });
        setSelectedIntent(res.intent);
      } else {
        setPrepResult({ error: res.reason });
      }
    },
    onError: () => setPrepResult({ error: "Enquiry preparation is temporarily unavailable." }),
  });

  const selectedCard = INTENT_MAP[selectedIntent];

  const handleSelectIntent = (intent: ContactIntent) => {
    setSelectedIntent(intent);
    setContinued(false);
    // Scroll to selected detail below the intent grid
    enquirySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const handleContinue = () => {
    const draft = prepResult && "title" in prepResult ? prepResult : null;
    setCarriedTitle(draft?.title ?? "");
    setCarriedSummary(draft?.summary ?? prepInput.trim());
    setContinued(true);
    setTimeout(() => scrollToRef(formRef), 50);
  };

  const handleStartOver = () => {
    setRouterInput("");
    setRouterResult(null);
    setPrepInput("");
    setPrepResult(null);
    setContinued(false);
    setCarriedTitle("");
    setCarriedSummary("");
    setSelectedIntent("general");
  };

  return (
    <main className="bg-background">
      {/* HERO ============================================================ */}
      <Section className="pt-16 pb-10 md:pt-20 md:pb-12 border-b border-border/60">
        <Container size="lg">
          <div className="max-w-3xl">
            <Badge variant="muted" className="mb-4 uppercase tracking-widest text-[10px]">
              Contact Glintr
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05]">
              Start with what you need
            </h1>
            <p className="mt-4 text-muted-foreground md:text-lg max-w-2xl">
              Tell us what you are trying to do and Glintr will guide you to the right support
              or contact path.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => scrollToRef(routerRef)}>
                Find The Right Contact Path
                <ArrowRight className="size-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => scrollToRef(prepRef)}>
                Prepare An Enquiry
              </Button>
            </div>
            <p className="mt-5 text-xs text-muted-foreground max-w-xl">
              Student learning questions and account-specific support should use{" "}
              <Link to="/student-support" className="underline hover:text-foreground">
                Glintr Student Support
              </Link>
              . Existing Sales Partners and Campus Ambassadors should use{" "}
              <Link to="/partner-support" className="underline hover:text-foreground">
                Partner Support
              </Link>
              .
            </p>
          </div>
        </Container>
      </Section>

      {/* START WITH YOUR ENQUIRY (intents) ============================== */}
      <Section id="start" className="py-14 md:py-20">
        <Container size="lg">
          <SectionHeading
            eyebrow="01 · Start"
            title="Start with your enquiry"
            copy="Choose what best describes why you are contacting Glintr."
          />
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {INTENT_CARDS.map((c) => {
              const active = c.intent === selectedIntent;
              return (
                <button
                  key={c.intent}
                  type="button"
                  onClick={() => handleSelectIntent(c.intent)}
                  aria-pressed={active}
                  className={cn(
                    "text-left rounded-xl border p-4 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "border-primary bg-primary/[0.04] shadow-sm"
                      : "border-border bg-card hover:border-foreground/30",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg",
                        active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                      )}
                      aria-hidden="true"
                    >
                      <c.icon className="size-4" />
                    </span>
                    <div>
                      <div className="font-medium text-[15px] leading-tight">{c.label}</div>
                      <div className="mt-1 text-xs text-muted-foreground leading-snug">
                        {c.short}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected intent detail */}
          <div
            ref={enquirySectionRef}
            tabIndex={-1}
            className="mt-8 outline-none"
            aria-live="polite"
          >
            <SelectedIntentCard
              card={selectedCard}
              onPrepare={() => scrollToRef(prepRef)}
              onOther={() => setSelectedIntent("other")}
            />
          </div>
        </Container>
      </Section>

      {/* INTELLIGENT CONTACT ROUTER ===================================== */}
      <Section className="py-14 md:py-20 bg-muted/30 border-y border-border/60">
        <Container size="md">
          <div ref={routerRef} tabIndex={-1} className="outline-none">
            <SectionHeading
              eyebrow="02 · Route"
              title="Find the right contact path"
              copy="Not sure where to go? Briefly describe what you need and Glintr will recommend a contact path."
            />
          </div>
          <Card className="mt-8 p-5 md:p-6">
            <Label htmlFor="router-input" className="text-sm font-medium">
              What do you need help with?
            </Label>
            <Textarea
              id="router-input"
              rows={3}
              value={routerInput}
              onChange={(e) => setRouterInput(e.target.value)}
              placeholder="Briefly describe why you want to contact Glintr."
              className="mt-2"
              maxLength={1200}
            />
            <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-muted-foreground">
                This step is routing only. Nothing is submitted here.
              </p>
              <Button
                onClick={() => {
                  const v = routerInput.trim();
                  if (v.length < 3) return;
                  setRouterResult(null);
                  routerMut.mutate(v);
                }}
                disabled={routerMut.isPending || routerInput.trim().length < 3}
                aria-busy={routerMut.isPending}
              >
                {routerMut.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    <span>Finding the right contact path…</span>
                  </>
                ) : (
                  <>
                    <Compass className="size-4" aria-hidden="true" />
                    <span>Find My Contact Path</span>
                  </>
                )}
              </Button>
            </div>

            {routerResult && "error" in routerResult && (
              <RouterFailure onManual={() => scrollToRef(enquirySectionRef)} />
            )}

            {routerResult && "intent" in routerResult && (
              <RouterRecommendation
                intent={routerResult.intent}
                reason={routerResult.reason}
                confident={routerResult.confident}
                onOpenPrep={() => {
                  setPrepInput(routerInput);
                  scrollToRef(prepRef);
                }}
                onChoose={(next) => {
                  setSelectedIntent(next);
                  scrollToRef(enquirySectionRef);
                }}
              />
            )}
          </Card>
        </Container>
      </Section>

      {/* AI-ASSISTED ENQUIRY PREPARATION ================================= */}
      <Section className="py-14 md:py-20">
        <Container size="md">
          <div ref={prepRef} data-contact-anchor="prep" tabIndex={-1} className="outline-none">
            <SectionHeading
              eyebrow="03 · Prepare"
              title="Prepare your enquiry"
              copy="Describe what you want to discuss and Glintr can help organise it into a clear enquiry before you send it."
            />
          </div>
          <Card className="mt-8 p-5 md:p-6">
            <div className="flex items-start gap-3 mb-4">
              <Wand2 className="size-4 text-primary mt-0.5" aria-hidden="true" />
              <p className="text-xs text-muted-foreground">
                Do not include passwords, OTPs, UPI PINs, card CVVs or full payment credentials.
                This is a public enquiry surface and never checks account state.
              </p>
            </div>
            <Label htmlFor="prep-input" className="text-sm font-medium">
              Tell us what you want to discuss
            </Label>
            <Textarea
              id="prep-input"
              rows={6}
              value={prepInput}
              onChange={(e) => setPrepInput(e.target.value)}
              placeholder="Explain what you are contacting Glintr about, what you are trying to do and any relevant context."
              className="mt-2"
              maxLength={4000}
            />
            <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-muted-foreground">
                Prepared drafts are grounded only in what you write above.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={handleStartOver}
                  disabled={prepMut.isPending}
                  aria-label="Start over"
                >
                  <RotateCcw className="size-4" /> Start Over
                </Button>
                <Button
                  onClick={() => {
                    const v = prepInput.trim();
                    if (v.length < 3) return;
                    setPrepResult(null);
                    setContinued(false);
                    prepMut.mutate(v);
                  }}
                  disabled={prepMut.isPending || prepInput.trim().length < 3}
                  aria-busy={prepMut.isPending}
                >
                  {prepMut.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      <span>Preparing your enquiry…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" aria-hidden="true" />
                      <span>Prepare My Enquiry</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {prepResult && "error" in prepResult && (
              <PrepFailure
                onContinue={() => {
                  setCarriedTitle(prepInput.trim().split("\n")[0].slice(0, 90));
                  setCarriedSummary(prepInput.trim());
                  setContinued(true);
                  setTimeout(() => scrollToRef(formRef), 50);
                }}
              />
            )}

            {prepResult && "title" in prepResult && (
              <PreparedEnquiry
                title={prepResult.title}
                summary={prepResult.summary}
                intent={prepResult.intent}
                studentIssue={prepResult.studentIssue}
                partnerIssue={prepResult.partnerIssue}
                onTitleChange={(t) =>
                  setPrepResult((cur) =>
                    cur && "title" in cur ? { ...cur, title: t.slice(0, 120) } : cur,
                  )
                }
                onSummaryChange={(s) =>
                  setPrepResult((cur) =>
                    cur && "summary" in cur ? { ...cur, summary: s.slice(0, 2400) } : cur,
                  )
                }
                onIntentChange={(i) => {
                  setPrepResult((cur) => (cur && "intent" in cur ? { ...cur, intent: i } : cur));
                  setSelectedIntent(i);
                }}
                onContinue={handleContinue}
                onDifferent={() => scrollToRef(enquirySectionRef)}
                onStartOver={handleStartOver}
              />
            )}
          </Card>
        </Container>
      </Section>

      {/* CONTACT FORM FOUNDATION ======================================== */}
      <Section className="py-14 md:py-20 bg-muted/30 border-y border-border/60">
        <Container size="md">
          <div ref={formRef} tabIndex={-1} className="outline-none">
            <SectionHeading
              eyebrow="04 · Send"
              title="Review before sending"
              copy="Detailed submission opens after review. This is a preview of the fields your enquiry will use."
            />
          </div>
          <ContactFormFoundation
            intent={selectedIntent}
            initialTitle={carriedTitle}
            initialSummary={carriedSummary}
            enabled={continued}
            onIntentChange={setSelectedIntent}
          />
        </Container>
      </Section>

      {/* CONTACT TOPICS ================================================= */}
      <Section className="py-14 md:py-20">
        <Container size="lg">
          <SectionHeading
            eyebrow="05 · Topics"
            title="Explore contact topics"
            copy="Pick a topic to see the recommended Glintr path and common questions."
          />
          <ContactTopicsExplorer />
        </Container>
      </Section>

      {/* WAYS GLINTR CAN HELP =========================================== */}
      <Section className="py-14 md:py-20 bg-muted/30 border-y border-border/60">
        <Container size="lg">
          <SectionHeading
            eyebrow="06 · How we help"
            title="Ways Glintr can help"
            copy="Depending on what you need, one of these Glintr paths is usually the right destination."
          />
          <WaysGlintrCanHelp />
        </Container>
      </Section>

      {/* CONTACT BY RELATIONSHIP ======================================== */}
      <Section className="py-14 md:py-20">
        <Container size="lg">
          <SectionHeading
            eyebrow="07 · Relationship"
            title="Contact Glintr based on your relationship"
            copy="Choose the option that matches you to see the recommended contact path."
          />
          <ContactByRelationship />
        </Container>
      </Section>

      {/* BEFORE YOU SEND ================================================ */}
      <Section className="py-14 md:py-20 bg-muted/30 border-y border-border/60">
        <Container size="md">
          <SectionHeading
            eyebrow="08 · Before you send"
            title="Before you send a message"
            copy="A short checklist keeps enquiries fast and safe."
          />
          <ul className="mt-8 grid gap-3 md:grid-cols-2">
            {[
              "Choose the contact topic that best matches your enquiry.",
              "Explain what you are trying to do.",
              "Include only relevant context.",
              "Do not share passwords, OTPs, UPI PINs or card CVVs.",
              "Use Student Support for account-specific learning issues.",
              "Use Partner Support for existing Partner support issues.",
            ].map((line) => (
              <li
                key={line}
                className="rounded-lg border border-border bg-card p-4 text-sm text-foreground/90 flex items-start gap-3"
              >
                <ShieldCheck className="size-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* FINAL CTA ====================================================== */}
      <Section className="py-16 md:py-24">
        <Container size="md">
          <Card className="p-8 md:p-12 text-center">
            <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">
              Ready when you are
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Start with what you need and Glintr will guide you to the right support or contact
              path.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <Button onClick={() => scrollToRef(routerRef)}>Find The Right Contact Path</Button>
              <Button variant="outline" onClick={() => scrollToRef(prepRef)}>
                Prepare An Enquiry
              </Button>
            </div>
          </Card>
        </Container>
      </Section>
    </main>
  );
}

// =====================================================================
// Subcomponents
// =====================================================================

function SectionHeading({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="max-w-2xl">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{eyebrow}</div>
      <h2 className="mt-2 font-display text-2xl md:text-3xl font-semibold tracking-tight">
        {title}
      </h2>
      <p className="mt-3 text-muted-foreground">{copy}</p>
    </div>
  );
}

function SelectedIntentCard({
  card,
  onPrepare,
  onOther,
}: {
  card: IntentCard;
  onPrepare: () => void;
  onOther: () => void;
}) {
  const Icon = card.icon;
  return (
    <Card className="p-5 md:p-6">
      <div className="flex items-start gap-4">
        <span
          className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary"
          aria-hidden="true"
        >
          <Icon className="size-5" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-lg">{card.headline}</h3>
            <Badge variant="outline" className="text-[10px]">
              Selected topic
            </Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{card.description}</p>

          {card.common && (
            <ul className="mt-4 grid gap-1.5 text-xs text-muted-foreground">
              {card.common.map((c) => (
                <li key={c} className="flex gap-2">
                  <span className="text-primary" aria-hidden="true">
                    •
                  </span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {card.primaryTo ? (
              <Button asChild>
                <Link to={card.primaryTo as never}>
                  {card.primaryLabel}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <Button onClick={onPrepare}>
                {card.primaryLabel}
                <ArrowRight className="size-4" />
              </Button>
            )}
            {card.secondaryLabel && card.primaryTo ? (
              <Button variant="outline" onClick={onPrepare}>
                {card.secondaryLabel}
              </Button>
            ) : null}
            {card.intent !== "other" && (
              <Button variant="ghost" onClick={onOther}>
                Not any of these
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function RouterRecommendation({
  intent,
  reason,
  confident,
  onOpenPrep,
  onChoose,
}: {
  intent: ContactIntent;
  reason: string;
  confident: boolean;
  onOpenPrep: () => void;
  onChoose: (next: ContactIntent) => void;
}) {
  const card = INTENT_MAP[intent];
  return (
    <div className="mt-6 rounded-xl border border-border bg-card p-5" role="status">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        Recommended contact path
      </div>
      <div className="mt-1 flex items-center gap-2 flex-wrap">
        <div className="font-semibold text-lg">{card.headline}</div>
        {!confident && (
          <Badge variant="outline" className="text-[10px]">
            Best guess — please confirm
          </Badge>
        )}
      </div>
      {reason && <p className="mt-2 text-sm text-muted-foreground">{reason}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {card.primaryTo ? (
          <Button asChild>
            <Link to={card.primaryTo as never}>
              {card.primaryLabel}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        ) : (
          <Button onClick={onOpenPrep}>
            {card.primaryLabel}
            <ArrowRight className="size-4" />
          </Button>
        )}
        <ChoosePathMenu current={intent} onChoose={onChoose} />
      </div>
      {!confident && (
        <p className="mt-3 text-xs text-muted-foreground">
          AI routing is guidance, not a decision. Choose a different contact path if this does
          not match your enquiry.
        </p>
      )}
    </div>
  );
}

function ChoosePathMenu({
  current,
  onChoose,
}: {
  current: ContactIntent;
  onChoose: (next: ContactIntent) => void;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative">
      <Button variant="outline" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        Choose A Different Contact Path
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute z-10 mt-2 w-64 rounded-lg border border-border bg-popover p-1 shadow-lg"
        >
          {CONTACT_INTENTS.filter((i) => i !== current).map((i) => (
            <button
              key={i}
              type="button"
              role="menuitem"
              onClick={() => {
                onChoose(i);
                setOpen(false);
              }}
              className="w-full text-left rounded-md px-3 py-2 text-sm hover:bg-muted"
            >
              {CONTACT_INTENT_LABELS[i]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RouterFailure({ onManual }: { onManual: () => void }) {
  return (
    <div
      className="mt-6 rounded-xl border border-border bg-card p-5"
      role="status"
      aria-live="polite"
    >
      <div className="font-semibold">Choose a contact topic</div>
      <p className="mt-1 text-sm text-muted-foreground">
        Select the topic that best matches why you are contacting Glintr.
      </p>
      <Button className="mt-4" variant="outline" onClick={onManual}>
        Choose A Contact Topic
      </Button>
    </div>
  );
}

function PrepFailure({ onContinue }: { onContinue: () => void }) {
  return (
    <div
      className="mt-6 rounded-xl border border-border bg-card p-5"
      role="status"
      aria-live="polite"
    >
      <div className="font-semibold">Unable to prepare your enquiry</div>
      <p className="mt-1 text-sm text-muted-foreground">
        You can continue by writing your enquiry directly.
      </p>
      <Button className="mt-4" variant="outline" onClick={onContinue}>
        Continue Without AI
      </Button>
    </div>
  );
}

function PreparedEnquiry({
  title,
  summary,
  intent,
  studentIssue,
  partnerIssue,
  onTitleChange,
  onSummaryChange,
  onIntentChange,
  onContinue,
  onDifferent,
  onStartOver,
}: {
  title: string;
  summary: string;
  intent: ContactIntent;
  studentIssue: boolean;
  partnerIssue: boolean;
  onTitleChange: (v: string) => void;
  onSummaryChange: (v: string) => void;
  onIntentChange: (i: ContactIntent) => void;
  onContinue: () => void;
  onDifferent: () => void;
  onStartOver: () => void;
}) {
  const card = INTENT_MAP[intent];
  return (
    <div className="mt-6 space-y-5" aria-live="polite">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        Review your enquiry
      </div>

      {studentIssue && (
        <div className="rounded-xl border border-primary/30 bg-primary/[0.04] p-4">
          <div className="font-semibold text-sm">This looks like a Student Support question</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Glintr Student Support can check authorised learning context and guide unresolved
            issues through the Student Support Request process.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link to="/student-support">Open Student Support</Link>
            </Button>
            <Button size="sm" variant="outline" onClick={onDifferent}>
              Choose A Different Contact Path
            </Button>
          </div>
        </div>
      )}

      {partnerIssue && !studentIssue && (
        <div className="rounded-xl border border-primary/30 bg-primary/[0.04] p-4">
          <div className="font-semibold text-sm">This looks like a Partner Support question</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Existing Sales Partner and Campus Ambassador issues are handled through Partner
            Support.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link to="/partner-support">Open Partner Support</Link>
            </Button>
            <Button size="sm" variant="outline" onClick={onDifferent}>
              Choose A Different Contact Path
            </Button>
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="prep-path" className="text-sm font-medium">
          Suggested contact path
        </Label>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {card.headline}
          </Badge>
          <ChoosePathMenu current={intent} onChoose={onIntentChange} />
        </div>
      </div>

      <div>
        <Label htmlFor="prep-title" className="text-sm font-medium">
          Enquiry title
        </Label>
        <Input
          id="prep-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          maxLength={120}
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="prep-summary" className="text-sm font-medium">
          Enquiry summary
        </Label>
        <Textarea
          id="prep-summary"
          value={summary}
          onChange={(e) => onSummaryChange(e.target.value)}
          rows={6}
          maxLength={2400}
          className="mt-2"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Review and edit the enquiry before continuing. You control the final text.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={onContinue}>
          Continue With This Enquiry
          <ArrowRight className="size-4" />
        </Button>
        <Button variant="outline" onClick={onDifferent}>
          Choose A Different Contact Path
        </Button>
        <Button variant="ghost" onClick={onStartOver}>
          <RotateCcw className="size-4" />
          Start Over
        </Button>
      </div>
    </div>
  );
}

type FieldErrors = Partial<Record<
  "topic" | "name" | "email" | "organisation" | "title" | "summary",
  string
>>;

type SubmitState =
  | { kind: "idle" }
  | {
      kind: "success";
      reference: string;
      topic: ContactIntent;
      title: string;
      submittedAt: string;
    }
  | {
      kind: "duplicate_recent";
      reference: string;
      topic: ContactIntent;
      submittedAt: string;
      message: string;
    }
  | { kind: "redirect_student_support"; message: string }
  | { kind: "redirect_partner_support"; message: string }
  | { kind: "rate_limited"; message: string }
  | { kind: "validation"; fieldErrors: FieldErrors; message: string }
  | { kind: "error"; message: string };

function genIdempotencyKey(): string {
  // 128-bit-ish random identifier bound to this browser tab's form open.
  const arr = new Uint8Array(16);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

function ContactFormFoundation({
  intent,
  initialTitle,
  initialSummary,
  enabled,
  onIntentChange,
}: {
  intent: ContactIntent;
  initialTitle: string;
  initialSummary: string;
  enabled: boolean;
  onIntentChange: (i: ContactIntent) => void;
}) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [org, setOrg] = React.useState("");
  const [title, setTitle] = React.useState(initialTitle);
  const [summary, setSummary] = React.useState(initialSummary);
  const [website, setWebsite] = React.useState(""); // honeypot
  const [submitState, setSubmitState] = React.useState<SubmitState>({ kind: "idle" });
  const [copied, setCopied] = React.useState(false);

  // Idempotency + timing are stable per form session; regenerate on Start Over.
  const [idempotencyKey, setIdempotencyKey] = React.useState(() => genIdempotencyKey());
  const [formOpenedAt] = React.useState(() => Date.now());

  React.useEffect(() => {
    if (initialTitle) setTitle(initialTitle);
  }, [initialTitle]);
  React.useEffect(() => {
    if (initialSummary) setSummary(initialSummary);
  }, [initialSummary]);

  const nameRef = React.useRef<HTMLInputElement>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);
  const orgRef = React.useRef<HTMLInputElement>(null);
  const titleRef = React.useRef<HTMLInputElement>(null);
  const summaryRef = React.useRef<HTMLTextAreaElement>(null);
  const successRef = React.useRef<HTMLDivElement>(null);

  const submitFn = useServerFn(submitContactEnquiry);
  const submitMut = useMutation({
    mutationFn: async () =>
      submitFn({
        data: {
          topic: intent,
          name,
          email,
          organisation: org,
          title,
          summary,
          source: "contact_page",
          idempotencyKey,
          website,
          formOpenedAt,
        },
      }),
    onSuccess: (res) => {
      if (res.ok) {
        setSubmitState({
          kind: "success",
          reference: res.reference,
          topic: normaliseContactIntent(res.topic),
          title: res.title,
          submittedAt: res.submittedAt,
        });
        setTimeout(() => {
          successRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          successRef.current?.focus();
        }, 50);
        return;
      }
      switch (res.kind) {
        case "validation": {
          setSubmitState({
            kind: "validation",
            fieldErrors: res.fieldErrors as FieldErrors,
            message: res.message,
          });
          const order: (keyof FieldErrors)[] = [
            "topic",
            "name",
            "email",
            "organisation",
            "title",
            "summary",
          ];
          const first = order.find((k) => (res.fieldErrors as FieldErrors)[k]);
          if (first === "name") nameRef.current?.focus();
          else if (first === "email") emailRef.current?.focus();
          else if (first === "organisation") orgRef.current?.focus();
          else if (first === "title") titleRef.current?.focus();
          else if (first === "summary") summaryRef.current?.focus();
          break;
        }
        case "redirect_student_support":
          setSubmitState({ kind: "redirect_student_support", message: res.message });
          break;
        case "redirect_partner_support":
          setSubmitState({ kind: "redirect_partner_support", message: res.message });
          break;
        case "rate_limited":
          setSubmitState({ kind: "rate_limited", message: res.message });
          break;
        case "duplicate_recent":
          setSubmitState({
            kind: "duplicate_recent",
            reference: res.reference,
            topic: normaliseContactIntent(res.topic),
            submittedAt: res.submittedAt,
            message: res.message,
          });
          break;
        default:
          setSubmitState({ kind: "error", message: res.message });
      }
    },
    onError: () =>
      setSubmitState({
        kind: "error",
        message: "Your enquiry has not been confirmed as sent. Please try again.",
      }),
  });

  const isSending = submitMut.isPending;
  const showsOrgOptional =
    intent === "partnership" ||
    intent === "institution" ||
    intent === "business" ||
    intent === "media";
  const orgRequired = intent === "institution";

  const orgLabel =
    intent === "institution"
      ? "College or institution"
      : intent === "media"
        ? "Organisation or publication (if relevant)"
        : "Organisation (if relevant)";

  const disabled = !enabled || isSending;
  const fieldErrors = submitState.kind === "validation" ? submitState.fieldErrors : {};

  const handleStartOver = () => {
    setName("");
    setEmail("");
    setOrg("");
    setTitle("");
    setSummary("");
    setWebsite("");
    setIdempotencyKey(genIdempotencyKey());
    setSubmitState({ kind: "idle" });
  };

  const handleContinueAnyway = () => {
    // Fresh idempotency key for an explicit "new" submission after duplicate warning.
    setIdempotencyKey(genIdempotencyKey());
    setSubmitState({ kind: "idle" });
    submitMut.reset();
  };

  const handleCopyRef = async (reference: string) => {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      toast.success("Reference copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.message("Copy manually: " + reference);
    }
  };

  // Success state — dedicated confirmation card
  if (submitState.kind === "success") {
    const s = submitState;
    return (
      <Card
        ref={successRef}
        tabIndex={-1}
        className="mt-8 p-6 md:p-8 outline-none"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
            aria-hidden="true"
          >
            <CheckCircle2 className="size-5" />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-xl md:text-2xl font-semibold tracking-tight">
              Enquiry sent
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your enquiry has been submitted to Glintr.
            </p>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-widest text-muted-foreground">
              Contact reference
            </dt>
            <dd className="mt-1 flex items-center gap-2">
              <code className="rounded-md bg-muted px-2 py-1 text-sm font-medium tracking-wider">
                {s.reference}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopyRef(s.reference)}
                aria-label="Copy reference"
              >
                {copied ? (
                  <>
                    <Check className="size-4" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-4" /> Copy reference
                  </>
                )}
              </Button>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-widest text-muted-foreground">
              Contact topic
            </dt>
            <dd className="mt-1 text-sm">{CONTACT_INTENT_LABELS[s.topic]}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-widest text-muted-foreground">
              Enquiry title
            </dt>
            <dd className="mt-1 text-sm">{s.title}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-widest text-muted-foreground">
              Submitted
            </dt>
            <dd className="mt-1 text-sm">
              {new Date(s.submittedAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleStartOver}>
            Return To Contact
          </Button>
          <Button asChild variant="ghost">
            <Link to="/">Explore Glintr</Link>
          </Button>
        </div>

        <p className="mt-5 text-xs text-muted-foreground">
          The Contact Reference is a display value only. Keep it for your records.
        </p>
      </Card>
    );
  }

  return (
    <Card className={cn("mt-8 p-5 md:p-6", !enabled && !isSending && "opacity-70")}>
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="text-[10px] uppercase">
          Contact topic
        </Badge>
        <span className="text-sm font-medium">{CONTACT_INTENT_LABELS[intent]}</span>
        <ChoosePathMenu current={intent} onChoose={onIntentChange} />
      </div>

      {intent === "student_support" && (
        <div className="mt-5 rounded-xl border border-primary/30 bg-primary/[0.04] p-4 text-sm">
          Student learning issues are handled inside{" "}
          <Link to="/student-support" className="underline font-medium">
            Student Support
          </Link>{" "}
          so authorised learning context can be reviewed safely. Please use Student Support
          instead of this Contact form.
        </div>
      )}

      {intent === "partner_support" && (
        <div className="mt-5 rounded-xl border border-primary/30 bg-primary/[0.04] p-4 text-sm">
          Existing Partner issues are handled inside{" "}
          <Link to="/partner-support" className="underline font-medium">
            Partner Support
          </Link>
          .
        </div>
      )}

      {intent === "careers" && (
        <div className="mt-5 rounded-xl border border-primary/30 bg-primary/[0.04] p-4 text-sm">
          Explore roles and apply through{" "}
          <Link to="/careers" className="underline font-medium">
            Glintr Careers
          </Link>
          . You can still send a general career enquiry below — a Contact Enquiry is not a job
          application.
        </div>
      )}

      {/* Redirect / rate-limit / general error states */}
      {submitState.kind === "redirect_student_support" && (
        <StatusBanner
          tone="info"
          title="This enquiry is better handled by Student Support"
          message={submitState.message}
          primary={{ label: "Open Student Support", to: "/student-support" }}
          secondary={{ label: "Review Contact Topic", onClick: () => setSubmitState({ kind: "idle" }) }}
        />
      )}
      {submitState.kind === "redirect_partner_support" && (
        <StatusBanner
          tone="info"
          title="This enquiry is better handled by Partner Support"
          message={submitState.message}
          primary={{ label: "Open Partner Support", to: "/partner-support" }}
          secondary={{ label: "Review Contact Topic", onClick: () => setSubmitState({ kind: "idle" }) }}
        />
      )}
      {submitState.kind === "rate_limited" && (
        <StatusBanner
          tone="warn"
          title="Unable to send another enquiry right now"
          message={submitState.message}
          secondary={{
            label: "Return To Contact",
            onClick: () => setSubmitState({ kind: "idle" }),
          }}
        />
      )}
      {submitState.kind === "duplicate_recent" && (
        <StatusBanner
          tone="warn"
          title="A similar enquiry may already have been sent"
          message={`${submitState.message} Reference ${submitState.reference} on ${new Date(
            submitState.submittedAt,
          ).toLocaleDateString(undefined, { dateStyle: "medium" })}.`}
          primary={{
            label: "Return To Contact",
            onClick: () => setSubmitState({ kind: "idle" }),
          }}
          secondary={{ label: "Continue With New Enquiry", onClick: handleContinueAnyway }}
        />
      )}
      {submitState.kind === "error" && (
        <StatusBanner
          tone="error"
          title="Unable to send your enquiry"
          message={submitState.message}
          primary={{
            label: "Try Again",
            onClick: () => {
              setSubmitState({ kind: "idle" });
              submitMut.reset();
            },
          }}
        />
      )}

      <fieldset
        disabled={disabled}
        className="mt-6 grid gap-5 md:grid-cols-2"
        aria-describedby="contact-form-hint"
      >
        <div className="md:col-span-1">
          <Label htmlFor="c-name" className="text-sm font-medium">
            Name
          </Label>
          <Input
            id="c-name"
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2"
            autoComplete="name"
            maxLength={120}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? "c-name-err" : undefined}
          />
          {fieldErrors.name && (
            <p id="c-name-err" className="mt-1 text-xs text-destructive">
              {fieldErrors.name}
            </p>
          )}
        </div>
        <div className="md:col-span-1">
          <Label htmlFor="c-email" className="text-sm font-medium">
            Email
          </Label>
          <Input
            id="c-email"
            ref={emailRef}
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2"
            autoComplete="email"
            maxLength={254}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "c-email-err" : undefined}
          />
          {fieldErrors.email && (
            <p id="c-email-err" className="mt-1 text-xs text-destructive">
              {fieldErrors.email}
            </p>
          )}
        </div>
        {showsOrgOptional && (
          <div className="md:col-span-2">
            <Label htmlFor="c-org" className="text-sm font-medium">
              {orgLabel} {orgRequired && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="c-org"
              ref={orgRef}
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              className="mt-2"
              autoComplete="organization"
              maxLength={200}
              aria-invalid={Boolean(fieldErrors.organisation)}
              aria-describedby={fieldErrors.organisation ? "c-org-err" : undefined}
            />
            {fieldErrors.organisation && (
              <p id="c-org-err" className="mt-1 text-xs text-destructive">
                {fieldErrors.organisation}
              </p>
            )}
          </div>
        )}
        <div className="md:col-span-2">
          <Label htmlFor="c-title" className="text-sm font-medium">
            Enquiry title
          </Label>
          <Input
            id="c-title"
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            className="mt-2"
            aria-invalid={Boolean(fieldErrors.title)}
            aria-describedby={fieldErrors.title ? "c-title-err" : undefined}
          />
          {fieldErrors.title && (
            <p id="c-title-err" className="mt-1 text-xs text-destructive">
              {fieldErrors.title}
            </p>
          )}
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="c-summary" className="text-sm font-medium">
            Enquiry summary
          </Label>
          <Textarea
            id="c-summary"
            ref={summaryRef}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={6}
            maxLength={2400}
            className="mt-2"
            aria-invalid={Boolean(fieldErrors.summary)}
            aria-describedby={fieldErrors.summary ? "c-summary-err" : undefined}
          />
          {fieldErrors.summary && (
            <p id="c-summary-err" className="mt-1 text-xs text-destructive">
              {fieldErrors.summary}
            </p>
          )}
        </div>

        {/* Honeypot — visually hidden, non-tabbable, aria-hidden */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="c-website">
            Website
            <input
              id="c-website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </label>
        </div>
      </fieldset>

      <div
        id="contact-form-hint"
        className="mt-6 flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground"
      >
        <ShieldCheck className="size-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
        <p>
          Please do not include passwords, OTPs, UPI PINs, card CVVs or payment credentials. A
          Contact Enquiry is not a Support ticket and does not check any account state.
        </p>
      </div>

      {!enabled && submitState.kind === "idle" && (
        <p className="mt-4 text-xs text-muted-foreground">
          Prepare and review your enquiry above to activate these fields.
        </p>
      )}

      {/* Send action */}
      <div className="mt-6 flex flex-wrap gap-2 items-center">
        <Button
          onClick={() => {
            if (isSending) return;
            if (!enabled) return;
            if (intent === "student_support" || intent === "partner_support") {
              // Guard: these paths are not submittable from Contact.
              setSubmitState({
                kind: intent === "student_support"
                  ? "redirect_student_support"
                  : "redirect_partner_support",
                message:
                  intent === "student_support"
                    ? "Please use Student Support to file an account-specific student issue."
                    : "Please use Partner Support to file an existing partner issue.",
              });
              return;
            }
            setSubmitState({ kind: "idle" });
            submitMut.mutate();
          }}
          disabled={!enabled || isSending}
        >
          {isSending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Sending Your Enquiry…
            </>
          ) : (
            <>
              <Send className="size-4" />
              Send Enquiry
            </>
          )}
        </Button>
        <Button
          variant="outline"
          disabled={isSending}
          onClick={() => {
            // Return to review — scroll upward to the AI-preparation section.
            document
              .querySelector<HTMLElement>("[data-contact-anchor='prep']")
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          Back To Enquiry Review
        </Button>
        <Button variant="ghost" disabled={isSending} onClick={handleStartOver}>
          <RotateCcw className="size-4" />
          Start Over
        </Button>
      </div>

      {submitState.kind === "validation" && (
        <p className="mt-3 text-xs text-destructive" role="alert" aria-live="polite">
          {submitState.message}
        </p>
      )}
    </Card>
  );
}

function StatusBanner({
  tone,
  title,
  message,
  primary,
  secondary,
}: {
  tone: "info" | "warn" | "error";
  title: string;
  message: string;
  primary?: { label: string; onClick?: () => void; to?: string };
  secondary?: { label: string; onClick?: () => void; to?: string };
}) {
  const toneClass =
    tone === "error"
      ? "border-destructive/40 bg-destructive/[0.05]"
      : tone === "warn"
        ? "border-amber-400/40 bg-amber-50 dark:bg-amber-950/20"
        : "border-primary/30 bg-primary/[0.04]";
  const Icon = tone === "error" ? AlertTriangle : tone === "warn" ? AlertTriangle : Sparkles;
  return (
    <div
      className={cn("mt-5 rounded-xl border p-4", toneClass)}
      role={tone === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <Icon className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">{title}</div>
          <p className="mt-1 text-xs text-muted-foreground">{message}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {primary &&
              (primary.to ? (
                <Button asChild size="sm">
                  <Link to={primary.to as never}>{primary.label}</Link>
                </Button>
              ) : (
                <Button size="sm" onClick={primary.onClick}>
                  {primary.label}
                </Button>
              ))}
            {secondary &&
              (secondary.to ? (
                <Button asChild size="sm" variant="outline">
                  <Link to={secondary.to as never}>{secondary.label}</Link>
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={secondary.onClick}>
                  {secondary.label}
                </Button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------
// Contact topics explorer — interactive list, keyboard safe
// -----------------------------------------------------------
type Topic = {
  key: ContactIntent;
  title: string;
  copy: string;
  examples: string[];
  actionLabel: string;
  actionTo?: string;
};

const TOPICS: Topic[] = [
  {
    key: "student_support",
    title: "Student Support",
    copy: "Program access, Enrollment, My Learning, Modules, Lessons, Progress, Assessments and Certificates.",
    examples: [
      "My Program is missing.",
      "My Assessment result is not showing.",
      "My Certificate has not been issued.",
    ],
    actionLabel: "Open Student Support",
    actionTo: "/student-support",
  },
  {
    key: "partner_support",
    title: "Partner Support",
    copy: "Existing Sales Partner and Campus Ambassador issues — leads, commissions, payouts and account tooling.",
    examples: [
      "My lead is not appearing.",
      "A commission is missing.",
      "My payout is not moving.",
    ],
    actionLabel: "Open Partner Support",
    actionTo: "/partner-support",
  },
  {
    key: "general",
    title: "General Enquiries",
    copy: "General questions about Glintr that are not tied to a specific student or partner account.",
    examples: ["How does Glintr work?", "Which program suits me?"],
    actionLabel: "Prepare A General Enquiry",
  },
  {
    key: "partnership",
    title: "Partnerships",
    copy: "Collaboration, partnership and proposal discussions.",
    examples: ["Can our organisation partner with Glintr?", "How do partnership talks work?"],
    actionLabel: "Prepare A Partnership Enquiry",
  },
  {
    key: "institution",
    title: "Colleges and Institutions",
    copy: "Institutional learning, campus engagement and college collaboration.",
    examples: ["Can our college work with Glintr?", "Can Glintr support our students?"],
    actionLabel: "Prepare An Institution Enquiry",
  },
  {
    key: "business",
    title: "Business",
    copy: "Commercial, service and B2B business discussions.",
    examples: ["Do you offer a business arrangement?", "Can we discuss a service?"],
    actionLabel: "Prepare A Business Enquiry",
  },
  {
    key: "media",
    title: "Media",
    copy: "Press, editorial and media enquiries.",
    examples: ["I would like to feature Glintr.", "I am researching EdTech."],
    actionLabel: "Prepare A Media Enquiry",
  },
  {
    key: "careers",
    title: "Careers",
    copy: "Roles and hiring at Glintr.",
    examples: ["Are you hiring for my role?", "How do I apply?"],
    actionLabel: "Explore Careers",
    actionTo: "/careers",
  },
];

function ContactTopicsExplorer() {
  const [active, setActive] = React.useState<ContactIntent>("student_support");
  const activeTopic = TOPICS.find((t) => t.key === active) ?? TOPICS[0];
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
      <ul
        role="tablist"
        aria-orientation="vertical"
        className="flex flex-col gap-1"
        aria-label="Contact topics"
      >
        {TOPICS.map((t) => {
          const isActive = t.key === active;
          return (
            <li key={t.key}>
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(t.key)}
                className={cn(
                  "w-full text-left rounded-lg border px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "border-primary bg-primary/[0.06] font-medium"
                    : "border-border bg-card hover:border-foreground/30",
                )}
              >
                {t.title}
              </button>
            </li>
          );
        })}
      </ul>
      <Card className="p-5 md:p-6" role="tabpanel">
        <h3 className="font-semibold text-lg">{activeTopic.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{activeTopic.copy}</p>
        <div className="mt-4">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Common questions
          </div>
          <ul className="mt-2 grid gap-1.5 text-sm text-foreground/90">
            {activeTopic.examples.map((e) => (
              <li key={e} className="flex gap-2">
                <span className="text-primary" aria-hidden="true">
                  •
                </span>
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6">
          {activeTopic.actionTo ? (
            <Button asChild>
              <Link to={activeTopic.actionTo as never}>
                {activeTopic.actionLabel}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <a href="#start">
                {activeTopic.actionLabel}
                <ArrowRight className="size-4" />
              </a>
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

// -----------------------------------------------------------
// Ways Glintr can help — editorial layout variation
// -----------------------------------------------------------
function WaysGlintrCanHelp() {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-6">
      <Card className="p-6 md:col-span-4">
        <div className="flex items-start gap-3">
          <GraduationCap className="size-5 text-primary mt-0.5" aria-hidden="true" />
          <div>
            <h3 className="font-semibold">Learning Support</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Program access, Enrollment, My Learning, Modules, Lessons, Progress, Assessments
              and Certificates are handled through Student Support with authorised learning
              context.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link to="/student-support">Open Student Support</Link>
            </Button>
          </div>
        </div>
      </Card>
      <Card className="p-6 md:col-span-2">
        <div className="flex items-start gap-3">
          <Handshake className="size-5 text-primary mt-0.5" aria-hidden="true" />
          <div>
            <h3 className="font-semibold">Partner Support</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Leads, enrollments, commissions and payouts for existing Sales Partners and
              Campus Ambassadors.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link to="/partner-support">Open Partner Support</Link>
            </Button>
          </div>
        </div>
      </Card>
      <Card className="p-6 md:col-span-2">
        <School className="size-5 text-primary mb-2" aria-hidden="true" />
        <h3 className="font-semibold">Institution conversations</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Campus engagement, student opportunities and institutional collaboration.
        </p>
      </Card>
      <Card className="p-6 md:col-span-2">
        <Users className="size-5 text-primary mb-2" aria-hidden="true" />
        <h3 className="font-semibold">Partnership discussions</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Share a partnership proposal or explore how Glintr could work with your organisation.
        </p>
      </Card>
      <Card className="p-6 md:col-span-2">
        <Building2 className="size-5 text-primary mb-2" aria-hidden="true" />
        <h3 className="font-semibold">Business enquiries</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Commercial, service or business discussions with the right Glintr team.
        </p>
      </Card>
      <Card className="p-6 md:col-span-3">
        <Newspaper className="size-5 text-primary mb-2" aria-hidden="true" />
        <h3 className="font-semibold">Media</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Press, editorial and media enquiries. Share what you are covering and how Glintr can
          help.
        </p>
      </Card>
      <Card className="p-6 md:col-span-3">
        <Mail className="size-5 text-primary mb-2" aria-hidden="true" />
        <h3 className="font-semibold">General questions</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Not sure where to start? Use the intelligent Contact Router above or prepare a general
          enquiry.
        </p>
      </Card>
    </div>
  );
}

// -----------------------------------------------------------
// Contact by relationship
// -----------------------------------------------------------
type Relationship = {
  key: string;
  title: string;
  copy: string;
  actionLabel: string;
  actionTo?: string;
  intent?: ContactIntent;
};

const RELATIONSHIPS: Relationship[] = [
  {
    key: "student",
    title: "Student",
    copy: "For learning, Program, Enrollment, Assessment or Certificate questions, use Student Support.",
    actionLabel: "Open Student Support",
    actionTo: "/student-support",
  },
  {
    key: "partner",
    title: "Partner",
    copy: "Existing Sales Partners and Campus Ambassadors use Partner Support.",
    actionLabel: "Open Partner Support",
    actionTo: "/partner-support",
  },
  {
    key: "institution",
    title: "College or Institution",
    copy: "For institutional and campus discussions, prepare an institution enquiry.",
    actionLabel: "Prepare Institution Enquiry",
    intent: "institution",
  },
  {
    key: "business",
    title: "Business or Organisation",
    copy: "For commercial, service or business discussions, prepare a business enquiry.",
    actionLabel: "Prepare Business Enquiry",
    intent: "business",
  },
  {
    key: "media",
    title: "Media",
    copy: "For press, editorial or media enquiries, prepare a media enquiry.",
    actionLabel: "Prepare Media Enquiry",
    intent: "media",
  },
  {
    key: "visitor",
    title: "General Visitor",
    copy: "For general questions about Glintr, prepare a general enquiry.",
    actionLabel: "Prepare General Enquiry",
    intent: "general",
  },
];

function ContactByRelationship() {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {RELATIONSHIPS.map((r) => (
        <Card key={r.key} className="p-5">
          <h3 className="font-semibold">{r.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{r.copy}</p>
          <div className="mt-4">
            {r.actionTo ? (
              <Button asChild variant="outline">
                <Link to={r.actionTo as never}>
                  {r.actionLabel}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <a href="#start">
                  {r.actionLabel}
                  <ArrowRight className="size-4" />
                </a>
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
