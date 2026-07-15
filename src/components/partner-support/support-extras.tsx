import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  MessageCircleQuestion,
  Sparkles,
  Compass,
  LifeBuoy,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";

import { Container, Section } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Sensitive-information detection (best-effort, front-end only)
// ---------------------------------------------------------------------------

const SENSITIVE_PATTERNS: { key: string; label: string; test: RegExp }[] = [
  { key: "otp", label: "OTP", test: /\b(otp|one[- ]?time[- ]?password)\b[^0-9]{0,10}\d{4,8}/i },
  { key: "cvv", label: "card CVV", test: /\bcvv\b[^0-9]{0,6}\d{3,4}/i },
  {
    key: "upi_pin",
    label: "UPI PIN",
    test: /\b(upi[- ]?pin|m[- ]?pin|atm[- ]?pin)\b[^0-9]{0,8}\d{4,6}/i,
  },
  { key: "password", label: "password", test: /\b(password|pass ?word|passwd)\b\s*[:=-]?\s*\S{4,}/i },
  { key: "card", label: "card number", test: /\b(?:\d[ -]?){13,19}\b/ },
];

export function detectSensitive(text: string): string[] {
  const hits = new Set<string>();
  for (const p of SENSITIVE_PATTERNS) {
    if (p.test.test(text)) hits.add(p.label);
  }
  return Array.from(hits);
}

/** Best-effort redaction for support summaries. */
export function redactSensitive(text: string): string {
  let out = text;
  for (const p of SENSITIVE_PATTERNS) {
    out = out.replace(p.test, "[redacted]");
  }
  return out;
}

// ---------------------------------------------------------------------------
// Was This Helpful? feedback (subtle, idempotent, local-only)
// ---------------------------------------------------------------------------

export type FeedbackValue = "helpful" | "not_helpful" | null;

export function FeedbackControl({
  value,
  onSelect,
  onFollowUp,
  onGuided,
  onEscalate,
}: {
  value: FeedbackValue;
  onSelect: (v: "helpful" | "not_helpful") => void;
  onFollowUp: () => void;
  onGuided: () => void;
  onEscalate: () => void;
}) {
  const groupId = React.useId();
  if (value === "helpful") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1.5"
      >
        <CheckCircle2 className="size-3 text-emerald-600" aria-hidden />
        Thanks. Your feedback helps improve Partner Support.
      </div>
    );
  }
  if (value === "not_helpful") {
    return (
      <div className="mt-2 rounded-lg border border-border bg-card/60 p-2.5">
        <div className="text-[11px] font-medium">What would you like to do next?</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button
            onClick={onFollowUp}
            className="rounded-full border border-border bg-background hover:border-primary/40 px-2.5 py-1 text-[11px] transition"
          >
            Ask a follow-up
          </button>
          <button
            onClick={onGuided}
            className="rounded-full border border-border bg-background hover:border-primary/40 px-2.5 py-1 text-[11px] transition"
          >
            Try guided support
          </button>
          <button
            onClick={onEscalate}
            className="rounded-full border border-primary/40 bg-primary-soft/40 hover:bg-primary-soft/60 px-2.5 py-1 text-[11px] font-medium text-primary transition"
          >
            Create Partner Support Request
          </button>
        </div>
      </div>
    );
  }
  return (
    <div
      role="group"
      aria-labelledby={groupId}
      className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground"
    >
      <span id={groupId}>Was this helpful?</span>
      <button
        onClick={() => onSelect("helpful")}
        aria-label="Mark answer as helpful"
        className="inline-flex items-center gap-1 rounded-full border border-border bg-background hover:border-primary/40 hover:text-foreground px-2 py-0.5 transition"
      >
        <ThumbsUp className="size-3" aria-hidden /> Yes
      </button>
      <button
        onClick={() => onSelect("not_helpful")}
        aria-label="Mark answer as not helpful"
        className="inline-flex items-center gap-1 rounded-full border border-border bg-background hover:border-primary/40 hover:text-foreground px-2 py-0.5 transition"
      >
        <ThumbsDown className="size-3" aria-hidden /> Not really
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// How Glintr Partner Support Works — 4 stages
// ---------------------------------------------------------------------------

const HOW_STAGES = [
  {
    key: "ask",
    label: "Ask",
    icon: MessageCircleQuestion,
    blurb: "Tell Glintr AI Partner Support what you need help with in your own words.",
  },
  {
    key: "understand",
    label: "Understand",
    icon: Sparkles,
    blurb:
      "The support experience identifies the partner topic and checks relevant approved Glintr information.",
  },
  {
    key: "guide",
    label: "Guide",
    icon: Compass,
    blurb:
      "Receive partner-focused guidance and authorised account information where applicable.",
  },
  {
    key: "escalate",
    label: "Escalate",
    icon: LifeBuoy,
    blurb:
      "If the issue needs human review, submit a Partner Support Request with the issue context already summarised.",
  },
] as const;

export function HowSupportWorksSection() {
  const [active, setActive] = React.useState(0);
  return (
    <Section padding="lg" className="bg-muted/30">
      <Container>
        <div className="max-w-3xl mb-8">
          <Badge variant="outline" className="uppercase tracking-widest text-[10px]">
            Partner Support
          </Badge>
          <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">
            How Glintr Partner Support Works
          </h2>
          <p className="mt-3 text-muted-foreground text-pretty">
            Four connected stages — from a natural partner question to authorised human review when
            needed.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="How Partner Support works"
          className="grid grid-cols-1 md:grid-cols-4 gap-3"
        >
          {HOW_STAGES.map((s, i) => {
            const isActive = i === active;
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                role="tab"
                aria-selected={isActive}
                aria-controls={`how-panel-${s.key}`}
                id={`how-tab-${s.key}`}
                onClick={() => setActive(i)}
                className={cn(
                  "relative rounded-xl border p-4 text-left transition motion-reduce:transition-none",
                  isActive
                    ? "border-primary bg-primary-soft/50 shadow-sm"
                    : "border-border bg-card hover:border-primary/40",
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "grid place-items-center size-7 rounded-full text-[11px] font-mono font-medium",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <Icon
                    className={cn("size-4", isActive ? "text-primary" : "text-muted-foreground")}
                    aria-hidden
                  />
                  <span className="font-medium text-sm">{s.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        <Card
          role="tabpanel"
          id={`how-panel-${HOW_STAGES[active].key}`}
          aria-labelledby={`how-tab-${HOW_STAGES[active].key}`}
          className="mt-4 p-5"
        >
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Stage {active + 1} — {HOW_STAGES[active].label}
          </div>
          <p className="mt-2 text-sm text-foreground max-w-2xl">{HOW_STAGES[active].blurb}</p>
        </Card>
      </Container>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// From Partner Question To Support Review — vertical journey
// ---------------------------------------------------------------------------

const REVIEW_STAGES = [
  {
    label: "Question",
    blurb: "The partner explains the issue naturally.",
  },
  {
    label: "Context",
    blurb:
      "AI Partner Support identifies the partner topic and uses approved or authorised information.",
  },
  {
    label: "Guidance",
    blurb: "The partner receives a safe next step.",
  },
  {
    label: "Support Request",
    blurb:
      "If unresolved, the partner reviews an editable issue summary and submits a Support Request.",
  },
  {
    label: "Review",
    blurb: "The submitted issue enters the existing human Partner Support process.",
  },
];

export function SupportReviewJourney({ onAskAI }: { onAskAI: () => void }) {
  return (
    <Section padding="lg">
      <Container>
        <div className="max-w-3xl mb-8">
          <Badge variant="outline" className="uppercase tracking-widest text-[10px]">
            Support Journey
          </Badge>
          <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">
            From Partner Question To Support Review
          </h2>
          <p className="mt-3 text-muted-foreground text-pretty">
            AI Partner Support does not perform admin decisions. It routes your issue for authorised
            human review when needed.
          </p>
        </div>

        <ol
          className="relative border-l border-border/70 ml-3 space-y-6 md:space-y-8"
          aria-label="Support review stages"
        >
          {REVIEW_STAGES.map((s, i) => (
            <li key={s.label} className="pl-6 relative">
              <span
                aria-hidden
                className="absolute -left-[9px] top-1 grid place-items-center size-4 rounded-full bg-primary text-primary-foreground text-[10px] font-mono"
              >
                {i + 1}
              </span>
              <div className="font-medium text-sm">{s.label}</div>
              <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{s.blurb}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground max-w-3xl">
          <span className="font-medium text-foreground">Human review boundary.</span> Submitting a
          Partner Support Request sends your issue for review. Lead Ownership, Enrollment
          verification, earnings, payouts and Partner Application decisions continue through their
          authorised Glintr workflows.
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="outline" onClick={onAskAI}>
            Ask AI Partner Support <ArrowRight className="ml-2 size-4" />
          </Button>
        </div>
      </Container>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Human Review Explanation
// ---------------------------------------------------------------------------

const HUMAN_REVIEW_EXAMPLES = [
  "Lead visibility issue",
  "Lead status question",
  "Lead Ownership question",
  "Duplicate Lead question",
  "Verified Enrollment question",
  "Missing Commission concern",
  "Earnings question",
  "Payout status issue",
  "Partner Application question",
];

export function HumanReviewSection({
  onAskAI,
  onExplore,
}: {
  onAskAI: () => void;
  onExplore: () => void;
}) {
  return (
    <Section padding="lg">
      <Container>
        <div className="grid lg:grid-cols-2 gap-10">
          <div>
            <Badge variant="outline" className="uppercase tracking-widest text-[10px]">
              Human Review
            </Badge>
            <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">
              When A Partner Question Needs Human Review
            </h2>
            <p className="mt-3 text-muted-foreground text-pretty">
              Some partner questions may require human support review. Glintr AI Partner Support can
              help collect the relevant context so you do not need to explain the same issue from
              the beginning.
            </p>
            <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
              Your Support Context can move with you: only the relevant support context is included
              in the partner-reviewed issue summary. Internal AI instructions and hidden system
              information are not part of the Partner Support Request.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={onAskAI}>
                Ask AI Partner Support <ArrowRight className="ml-2 size-4" />
              </Button>
              <Button variant="outline" onClick={onExplore}>
                Explore Common Issues
              </Button>
            </div>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {HUMAN_REVIEW_EXAMPLES.map((ex) => (
              <li
                key={ex}
                className="rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground"
              >
                {ex}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Keep Your Partner Account Safe
// ---------------------------------------------------------------------------

const SAFETY_PRINCIPLES = [
  {
    key: "otp",
    title: "Never share your OTP",
    body: "An OTP can be used to authorise sensitive account actions. Glintr AI Partner Support does not need your OTP to explain a Partner Support question.",
  },
  {
    key: "upi",
    title: "Never share your UPI PIN",
    body: "Your UPI PIN is private payment authorisation information. Do not enter it in Partner Support chat or upload it in a screenshot.",
  },
  {
    key: "cvv",
    title: "Never share your card CVV",
    body: "Your card CVV is a payment authorisation code. Glintr Partner Support does not need it to explain payouts, commissions or partner records.",
  },
  {
    key: "password",
    title: "Never share your account password",
    body: "Your Glintr account password is private. Partner Support will never ask for your password to explain a partner issue.",
  },
  {
    key: "credentials",
    title: "Do not upload full payment credentials",
    body: "When attaching screenshots, cover or crop out full card numbers, CVVs, OTPs and net-banking credentials.",
  },
  {
    key: "relevant",
    title: "Only share information relevant to your issue",
    body: "Share the specific lead, referral, payment or payout context that helps Partner Support review the issue — no more.",
  },
];

export function AccountSafetySection() {
  const [open, setOpen] = React.useState<string | null>("otp");
  return (
    <Section padding="lg" className="bg-muted/30">
      <Container>
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" aria-hidden />
            Account Safety
          </div>
          <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">
            Keep Your Partner Account Safe
          </h2>
          <p className="mt-3 text-muted-foreground text-pretty">
            Glintr AI Partner Support will never ask for your OTP, UPI PIN, card CVV or account
            password. Follow these principles to keep your Partner account safe.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {SAFETY_PRINCIPLES.map((p) => {
            const isOpen = open === p.key;
            return (
              <div
                key={p.key}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : p.key)}
                  aria-expanded={isOpen}
                  aria-controls={`safety-${p.key}`}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-muted/40 transition"
                >
                  <span className="flex items-center gap-2 font-medium text-sm">
                    <ShieldCheck
                      className="size-4 text-primary shrink-0"
                      aria-hidden
                    />
                    {p.title}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-4 text-muted-foreground shrink-0 transition-transform motion-reduce:transition-none",
                      isOpen && "rotate-180",
                    )}
                    aria-hidden
                  />
                </button>
                {isOpen && (
                  <div
                    id={`safety-${p.key}`}
                    className="px-4 pb-4 pt-0 text-sm text-muted-foreground"
                  >
                    {p.body}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Final CTA
// ---------------------------------------------------------------------------

export function FinalSupportCTA({
  showMyRequests,
  onAskAI,
  onExplore,
}: {
  showMyRequests: boolean;
  onAskAI: () => void;
  onExplore: () => void;
}) {
  return (
    <Section padding="lg">
      <Container>
        <div className="rounded-3xl border border-border bg-gradient-to-br from-primary-soft/40 via-card to-card p-8 md:p-12">
          <div className="max-w-2xl">
            <div className="text-[10px] uppercase tracking-widest font-mono text-primary">
              Partner Support
            </div>
            <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">
              Start With Your Partner Question
            </h2>
            <p className="mt-4 text-muted-foreground text-pretty">
              Ask about partner models, referrals, leads, verified enrollments, earnings or payouts.
              If your question needs human review, your support context can move with you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={onAskAI}>
                Ask AI Partner Support <ArrowRight className="ml-2 size-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={onExplore}>
                Explore Common Issues
              </Button>
              {showMyRequests && (
                <Button size="lg" variant="ghost" asChild>
                  <Link to="/partner-support/requests">My Support Requests</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Small inline notice for sensitive input
// ---------------------------------------------------------------------------

export function SensitiveInputNotice({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div
      role="alert"
      className="mt-2 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-[11px] text-amber-900 dark:text-amber-200"
    >
      <ShieldAlert className="size-3.5 shrink-0 mt-0.5" aria-hidden />
      <span>
        Please do not share OTPs, UPI PINs, card CVVs or account passwords in Partner Support. We
        removed this from your message.
      </span>
    </div>
  );
}
