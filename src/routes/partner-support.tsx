import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as React from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Send,
  Sparkles,
  ShieldCheck,
  MessageCircle,
  LogIn,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { z } from "zod";

import { Container, Section } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  sendPartnerSupportMessage,
  sendPartnerSupportMessageAuthed,
  getMyPartnerSupportSnapshot,
  partnerIntentLabel,
  type PartnerSupportIntent,
  type PartnerSnapshot,
} from "@/lib/partner-support/partner-support.functions";

const SearchSchema = z.object({
  intent: z.string().optional(),
  topic: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/partner-support")({
  head: () => ({
    meta: [
      { title: "Glintr Partner Support — Leads, Earnings & Payout Help" },
      {
        name: "description",
        content:
          "AI-assisted Glintr Partner Support for the 70% Revenue Model, 50% Supported Model, referrals, leads, verified enrollments, earnings and payouts.",
      },
      { property: "og:title", content: "Glintr Partner Support" },
      {
        property: "og:description",
        content:
          "Partner-focused help with Glintr partnership models, referrals, lead visibility, earnings and payout journeys.",
      },
      { property: "og:url", content: "https://glintr.com/partner-support" },
    ],
    links: [{ rel: "canonical", href: "https://glintr.com/partner-support" }],
  }),
  validateSearch: (raw) => SearchSchema.parse(raw ?? {}),
  component: PartnerSupportPage,
});

type ChatMsg = { role: "user" | "assistant"; content: string };

type TopicKey =
  | "partner_models"
  | "referrals"
  | "leads"
  | "lead_ownership"
  | "duplicate_leads"
  | "verified_enrollments"
  | "earnings"
  | "payouts"
  | "partner_application"
  | "partner_account";

type Topic = {
  key: TopicKey;
  label: string;
  intent: PartnerSupportIntent;
  starters: string[];
  blurb: string;
};

const TOPICS: Topic[] = [
  {
    key: "partner_models",
    label: "Partner Models",
    intent: "partner_model",
    blurb: "Understand the 70% Revenue Model and the 50% Supported Model.",
    starters: [
      "What is the 70% model?",
      "What is the 50% model?",
      "What is the difference between the 70% and 50% models?",
    ],
  },
  {
    key: "referrals",
    label: "Referrals",
    intent: "partner_referral",
    blurb: "How Glintr referrals are tracked and what they lead to.",
    starters: [
      "How are referrals tracked?",
      "Where is my referral link?",
      "Does every referral create earnings?",
    ],
  },
  {
    key: "leads",
    label: "Leads",
    intent: "lead_visibility",
    blurb: "Adding leads, seeing your leads, and understanding lead status.",
    starters: [
      "How do I add a lead?",
      "Where can I see my leads?",
      "Why is my lead missing?",
    ],
  },
  {
    key: "lead_ownership",
    label: "Lead Ownership",
    intent: "lead_ownership",
    blurb: "What Lead Ownership means and why it matters.",
    starters: [
      "What is Lead Ownership?",
      "Why does ownership matter?",
      "How is a lead assigned to a partner?",
    ],
  },
  {
    key: "duplicate_leads",
    label: "Duplicate Leads",
    intent: "duplicate_lead",
    blurb: "What duplicate leads mean and what happens during review.",
    starters: [
      "What does duplicate lead mean?",
      "Why was my lead marked duplicate?",
      "What happens during a duplicate review?",
    ],
  },
  {
    key: "verified_enrollments",
    label: "Verified Enrollments",
    intent: "verified_enrollment",
    blurb: "When and how an enrollment becomes verified.",
    starters: [
      "What is a Verified Enrollment?",
      "When does an enrollment become verified?",
      "Why is my referral not verified yet?",
    ],
  },
  {
    key: "earnings",
    label: "Earnings",
    intent: "partner_earnings",
    blurb: "Commission, eligible earnings and available earnings.",
    starters: [
      "How do Glintr partner earnings work?",
      "What are available earnings?",
      "Why is my commission missing?",
    ],
  },
  {
    key: "payouts",
    label: "Payouts",
    intent: "payout_status",
    blurb: "Requesting payouts and understanding payout status.",
    starters: [
      "How do payouts work?",
      "When can I request payout?",
      "Why is my payout pending?",
    ],
  },
  {
    key: "partner_application",
    label: "Partner Application",
    intent: "partner_application",
    blurb: "Applying to become a Glintr partner and application status.",
    starters: [
      "How do I become a Glintr partner?",
      "How do I apply to Glintr?",
      "What is my Partner Application status?",
    ],
  },
  {
    key: "partner_account",
    label: "Partner Account",
    intent: "partner_account",
    blurb: "Finding sections of your Partner Dashboard.",
    starters: [
      "Where can I see my leads?",
      "Where is my referral link?",
      "Where are my earnings?",
    ],
  },
];

const QUICK_STARTERS: { label: string; intent: PartnerSupportIntent; question: string }[] = [
  { label: "Partner Models", intent: "partner_model", question: "Explain the Glintr partner models." },
  { label: "My Referrals", intent: "partner_referral", question: "How do Glintr referrals work?" },
  { label: "Lead Questions", intent: "lead_visibility", question: "How do partner leads work?" },
  { label: "Verified Enrollments", intent: "verified_enrollment", question: "What is a Verified Enrollment?" },
  { label: "Earnings", intent: "partner_earnings", question: "How do partner earnings work?" },
  { label: "Payouts", intent: "payout_status", question: "How do partner payouts work?" },
  { label: "Partner Account", intent: "partner_account", question: "How do I navigate my Partner Dashboard?" },
  { label: "Something Else", intent: "unknown_partner", question: "I have a Glintr partner question." },
];

const INITIAL_GREETING =
  "Hi, I'm Glintr AI Partner Support.\n\nI can help you understand Glintr partner models, referrals, leads, verified enrollments, earnings, payouts and partner platform questions.\n\nWhat would you like help with?";

function useSignedIn() {
  const [signedIn, setSignedIn] = React.useState<boolean | null>(null);
  React.useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSignedIn(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (mounted) setSignedIn(!!session);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  return signedIn;
}

function PartnerSupportPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/partner-support" });
  const signedIn = useSignedIn();

  const [intent, setIntent] = React.useState<PartnerSupportIntent | null>(
    (search.intent as PartnerSupportIntent) ?? null,
  );
  const [topic, setTopic] = React.useState<TopicKey | null>(
    (search.topic as TopicKey) ?? null,
  );
  const [messages, setMessages] = React.useState<ChatMsg[]>([
    { role: "assistant", content: INITIAL_GREETING },
  ]);
  const [input, setInput] = React.useState(search.q ?? "");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const chatEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  React.useEffect(() => {
    if (search.q && messages.length === 1) {
      // auto-submit initial q from search params
      handleSubmit(search.q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendPublic = useServerFn(sendPartnerSupportMessage);
  const sendAuthed = useServerFn(sendPartnerSupportMessageAuthed);
  const getSnapshot = useServerFn(getMyPartnerSupportSnapshot);

  const snapshotQuery = useQuery({
    queryKey: ["partner-support-snapshot", signedIn],
    queryFn: () => getSnapshot(),
    enabled: signedIn === true,
    staleTime: 60_000,
  });

  const send = useMutation({
    mutationFn: async (userText: string) => {
      const next: ChatMsg[] = [...messages, { role: "user", content: userText }];
      setMessages(next);
      const handoff = {
        supportIntent: intent ?? undefined,
        originalQuestion: search.q ?? undefined,
        source: "partner_support",
        topic: topic ?? undefined,
      };
      if (signedIn) {
        return sendAuthed({ data: { messages: next, handoff } });
      }
      return sendPublic({ data: { messages: next, handoff } });
    },
    onSuccess: (res: { reply: string }) => {
      setMessages((cur) => [...cur, { role: "assistant", content: res.reply }]);
      setErrorMsg(null);
    },
    onError: (err: Error) => {
      setErrorMsg(err.message || "Glintr AI Partner Support is temporarily unavailable.");
    },
  });

  function handleSubmit(text: string) {
    const value = text.trim();
    if (!value) return;
    setInput("");
    setErrorMsg(null);
    send.mutate(value);
  }

  function handleStarter(next: { intent: PartnerSupportIntent; question: string }) {
    setIntent(next.intent);
    navigate({ search: (p) => ({ ...p, intent: next.intent }), replace: true });
    handleSubmit(next.question);
  }

  function handleTopicStarter(topicKey: TopicKey, next: PartnerSupportIntent, question: string) {
    setTopic(topicKey);
    setIntent(next);
    navigate({ search: (p) => ({ ...p, topic: topicKey, intent: next }), replace: true });
    handleSubmit(question);
    // scroll into chat
    setTimeout(() => {
      document.getElementById("partner-support-ai")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  const isLoading = send.isPending;
  const snapshot = snapshotQuery.data as PartnerSnapshot | undefined;

  return (
    <div className="min-h-screen bg-background">
      {/* ============= HERO ============= */}
      <Section size="lg" className="pt-16 pb-8">
        <Container>
          <div className="max-w-4xl">
            <Badge variant="outline" className="mb-4 uppercase tracking-widest text-[10px]">
              Glintr Partner Support
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-balance">
              Questions About Leads, Earnings Or Payouts?
            </h1>
            <p className="mt-5 text-lg text-muted-foreground text-pretty max-w-2xl">
              Get partner-focused help with Glintr partnership models, referrals, lead visibility,
              verified enrollments, earnings and payout journeys.
            </p>
            <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
              Start with AI-assisted Partner Support for faster guidance. Questions that need account
              or human review can continue through the authorised support process.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" />
                AI Partner Support
              </div>
              <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5 text-primary" />
                Read-only & account-safe
              </div>
              {signedIn === true && snapshot?.partnerRelationship === "approved_partner" && (
                <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary-soft/50 px-3 py-1.5 text-xs text-primary">
                  Signed in as an approved Glintr Partner
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={() => inputRef.current?.focus()}
              >
                Ask Glintr AI Partner Support <MessageCircle className="ml-2 size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() =>
                  document.getElementById("support-topics")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Explore Support Topics <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      {/* ============= AI SUPPORT EXPERIENCE ============= */}
      <Section size="md" className="pt-4">
        <Container>
          <Card
            id="partner-support-ai"
            className="overflow-hidden border-border"
          >
            <div className="border-b border-border bg-muted/40 px-5 py-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid place-items-center size-9 rounded-full bg-primary/10 text-primary">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <div className="font-medium leading-none">Glintr AI Partner Support</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {intent ? partnerIntentLabel(intent) : "Partner-aware AI support"}
                  </div>
                </div>
              </div>
              {intent && (
                <Badge variant="secondary" className="text-[10px] uppercase">
                  {partnerIntentLabel(intent)}
                </Badge>
              )}
            </div>

            <div className="p-5 space-y-4 max-h-[520px] overflow-y-auto bg-background">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-3",
                    m.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm",
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="size-3.5 animate-spin" />
                    {signedIn
                      ? "Checking your authorised partner information..."
                      : "Checking the relevant Glintr partner information..."}
                  </div>
                </div>
              )}
              {errorMsg && !isLoading && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">
                      {errorMsg.includes("busy")
                        ? "Unable To Send Your Partner Support Question"
                        : "AI Partner Support Is Temporarily Unavailable"}
                    </div>
                    <p className="mt-1 text-xs opacity-80">
                      You can still explore Partner Support topics and approved Glintr partner
                      information.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const last = [...messages].reverse().find((m) => m.role === "user");
                      if (last) {
                        // remove last assistant/user pair not needed; just retry last user
                        send.mutate(last.content);
                      }
                    }}
                  >
                    <RefreshCw className="mr-1.5 size-3.5" /> Try Again
                  </Button>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick starters (only before first user turn) */}
            {messages.filter((m) => m.role === "user").length === 0 && !isLoading && (
              <div className="border-t border-border bg-card px-5 py-4">
                <div className="text-xs font-medium text-muted-foreground mb-3">
                  QUICK PARTNER SUPPORT STARTERS
                </div>
                <div className="flex flex-wrap gap-2">
                  {QUICK_STARTERS.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => handleStarter(s)}
                      className="rounded-full border border-border bg-background hover:bg-primary-soft/40 hover:border-primary/40 px-3.5 py-1.5 text-xs transition"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sign-in prompt for account questions */}
            {signedIn === false && messages.length > 1 && (
              <div className="border-t border-border bg-primary-soft/30 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm">
                  <div className="font-medium">Sign In Required For Partner Account Information</div>
                  <p className="text-muted-foreground text-xs mt-1 max-w-2xl">
                    I can explain general Glintr partner information, but your specific lead,
                    earnings or payout status requires authorised account access.
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link to="/auth">
                    <LogIn className="mr-1.5 size-3.5" /> Sign In
                  </Link>
                </Button>
              </div>
            )}

            {/* Composer */}
            <div className="border-t border-border bg-card px-5 py-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit(input);
                }}
                className="flex items-end gap-3"
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(input);
                    }
                  }}
                  placeholder="Ask about your Glintr partner journey..."
                  rows={2}
                  className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading || !input.trim()}>
                  {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </Button>
              </form>
              <p className="mt-2 text-[11px] text-muted-foreground">
                AI-assisted responses grounded in approved Glintr partner information. Cannot change
                account records.
              </p>
            </div>
          </Card>
        </Container>
      </Section>

      {/* ============= TOPIC RAIL ============= */}
      <Section id="support-topics" size="md">
        <Container>
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Partner Support Topics
              </h2>
              <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                Explore Glintr's partner topics. Selecting a topic loads starter questions into AI
                Partner Support.
              </p>
            </div>
          </div>
          <TopicRail
            topics={TOPICS}
            activeTopic={topic}
            onSelect={(t) => setTopic(t.key)}
          />

          {topic && (
            <Card className="mt-6 p-5">
              {(() => {
                const t = TOPICS.find((x) => x.key === topic)!;
                return (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">{t.label}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{t.blurb}</p>
                      </div>
                      <Badge variant="outline">{partnerIntentLabel(t.intent)}</Badge>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {t.starters.map((q) => (
                        <button
                          key={q}
                          onClick={() => handleTopicStarter(t.key, t.intent, q)}
                          className="rounded-full border border-border bg-background hover:bg-primary-soft/40 hover:border-primary/40 px-3.5 py-1.5 text-xs transition"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </>
                );
              })()}
            </Card>
          )}
        </Container>
      </Section>

      {/* ============= AUTH-AWARE QUICK ACTIONS ============= */}
      <Section size="md">
        <Container>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Partner Quick Actions
          </h2>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
            Jump straight to the authorised Glintr workflow for your question.
          </p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {signedIn === true ? (
              <>
                <QuickAction to="/partner/dashboard" label="Open Partner Dashboard" />
                <QuickAction to="/partner/my-leads" label="View My Leads" />
                <QuickAction to="/partner/earnings" label="View Earnings" />
                <QuickAction to="/partner/analytics" label="View Referrals & Analytics" />
                <QuickAction to="/partner/account" label="View Payouts & Account" />
                <QuickAction to="/faqs?category=partner" label="Explore Partner FAQs" external />
              </>
            ) : (
              <>
                <QuickAction to="/auth" label="Sign In To Partner Account" />
                <QuickAction to="/partner-network" label="Explore Partner Network" />
                <QuickAction to="/earn" label="View Partner Models" />
                <QuickAction to="/partner/apply" label="Apply To Become A Partner" />
              </>
            )}
          </div>
        </Container>
      </Section>

      {/* ============= PARTNER MODEL SECTION ============= */}
      <Section size="lg" className="bg-muted/30">
        <Container>
          <div className="max-w-3xl mb-8">
            <Badge variant="outline" className="uppercase tracking-widest text-[10px]">
              Partner Models
            </Badge>
            <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">
              Understand Your Partner Model
            </h2>
            <p className="mt-3 text-muted-foreground text-pretty">
              Glintr offers two approved partner models. Both work through the same authorised
              partner platform — they differ in participation approach, lead source and support
              structure.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <ModelCard
              title="70% Revenue Model"
              subtitle="Own leads, higher revenue share"
              points={[
                "Partners bring their own leads through referrals or outreach.",
                "Higher revenue share on verified enrollments.",
                "Access to the Partner Dashboard, referral tools and earnings tracking.",
              ]}
              action={{ label: "Explore 70% Revenue Model", to: "/earn/your-leads" }}
              onAsk={() =>
                handleStarter({
                  intent: "seventy_percent_model",
                  question: "Explain the Glintr 70% Revenue Model.",
                })
              }
            />
            <ModelCard
              title="50% Supported Model"
              subtitle="Company-provided leads, supported selling"
              points={[
                "Partners work with company-provided leads.",
                "Supported by Glintr sales enablement and marketing.",
                "Revenue share on verified enrollments per approved terms.",
              ]}
              action={{ label: "Explore 50% Supported Model", to: "/earn/company-leads" }}
              onAsk={() =>
                handleStarter({
                  intent: "fifty_percent_model",
                  question: "Explain the Glintr 50% Supported Model.",
                })
              }
            />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() =>
                handleStarter({
                  intent: "partner_model",
                  question: "What is the difference between the 70% and 50% Glintr partner models?",
                })
              }
            >
              Compare Models <ArrowRight className="ml-2 size-4" />
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/earn">Income Calculator</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground max-w-3xl">
            Actual applicable commercial terms follow the Glintr Revenue Share Terms and Payout
            Policy. AI Partner Support cannot change your partner model or override commercial
            terms.
          </p>
        </Container>
      </Section>

      {/* ============= REFERRAL → EARNINGS FLOW ============= */}
      <Section size="lg">
        <Container>
          <div className="max-w-3xl mb-8">
            <Badge variant="outline" className="uppercase tracking-widest text-[10px]">
              Partner Flow
            </Badge>
            <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">
              From Referral To Earnings
            </h2>
            <p className="mt-3 text-muted-foreground text-pretty">
              An overview of the approved Glintr partner journey. Ask Glintr AI Partner Support
              about any stage.
            </p>
          </div>
          <FlowStages
            stages={[
              {
                title: "Referral",
                blurb: "A partner shares Glintr with a prospective learner.",
                intent: "partner_referral",
                question: "How are Glintr referrals tracked?",
              },
              {
                title: "Lead",
                blurb: "The referral becomes a Partner Lead in the authorised dashboard.",
                intent: "lead_creation",
                question: "How does a referral become a partner lead?",
              },
              {
                title: "Enrollment",
                blurb: "The lead enrolls in an approved Glintr program.",
                intent: "verified_enrollment",
                question: "How does enrollment work in Glintr?",
              },
              {
                title: "Verified Enrollment",
                blurb: "Enrollment is verified per approved Glintr verification rules.",
                intent: "verified_enrollment",
                question: "What is a Verified Enrollment?",
              },
              {
                title: "Eligible Earnings",
                blurb: "Commission is created per approved commission rules.",
                intent: "commission_explanation",
                question: "How is Glintr partner commission created?",
              },
              {
                title: "Available Earnings",
                blurb: "Approved earnings become available for payout.",
                intent: "available_earnings",
                question: "What are available earnings in Glintr?",
              },
              {
                title: "Payout",
                blurb: "Partner requests payout per the Glintr Payout Policy.",
                intent: "payout_request",
                question: "How do Glintr partner payouts work?",
              },
            ]}
            onAsk={(intent, question) => handleStarter({ intent, question })}
          />
        </Container>
      </Section>

      {/* ============= LEAD OWNERSHIP SECTION ============= */}
      <Section size="lg" className="bg-muted/30">
        <Container>
          <div className="grid lg:grid-cols-2 gap-10">
            <div>
              <Badge variant="outline" className="uppercase tracking-widest text-[10px]">
                Lead Ownership
              </Badge>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">
                Understanding Lead Ownership
              </h2>
              <p className="mt-3 text-muted-foreground text-pretty">
                Lead Ownership determines which partner a lead is attributed to for earnings
                purposes. It's designed to be fair, transparent and reviewable through the
                authorised support process.
              </p>
              <p className="mt-3 text-sm text-muted-foreground text-pretty">
                Ownership review details are private between the partner, Glintr and any relevant
                authorised reviewer. AI Partner Support cannot expose another partner's identity,
                internal review evidence or admin notes, and it cannot change ownership.
              </p>
            </div>
            <div className="space-y-2">
              {[
                { q: "What is Lead Ownership?", i: "lead_ownership" as PartnerSupportIntent },
                { q: "Why can ownership matter?", i: "lead_ownership" as PartnerSupportIntent },
                {
                  q: "What happens when a duplicate is detected?",
                  i: "duplicate_lead" as PartnerSupportIntent,
                },
                {
                  q: "How can I check my Partner-visible lead status?",
                  i: "lead_visibility" as PartnerSupportIntent,
                },
              ].map((row) => (
                <button
                  key={row.q}
                  onClick={() => handleStarter({ intent: row.i, question: row.q })}
                  className="w-full text-left rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary-soft/30 px-4 py-3 text-sm flex items-center justify-between gap-3 transition"
                >
                  <span>{row.q}</span>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* ============= EARNINGS & PAYOUT SECTION ============= */}
      <Section size="lg">
        <Container>
          <div className="max-w-3xl mb-8">
            <Badge variant="outline" className="uppercase tracking-widest text-[10px]">
              Earnings & Payouts
            </Badge>
            <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">
              From Earnings To Payout
            </h2>
            <p className="mt-3 text-muted-foreground text-pretty">
              Earnings and payouts follow the Glintr Revenue Share Terms and Payout Policy. AI
              Partner Support explains the general journey. Only authorised systems can create
              commission or release payouts.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "Eligible Earnings",
                blurb: "Commission created once verification conditions are met.",
                intent: "commission_explanation" as PartnerSupportIntent,
                question: "How does Glintr partner commission become eligible?",
              },
              {
                title: "Available Earnings",
                blurb: "Approved earnings that can be requested for payout.",
                intent: "available_earnings" as PartnerSupportIntent,
                question: "What are available earnings in Glintr?",
              },
              {
                title: "Payout Request",
                blurb: "Partner requests a payout through the Partner Dashboard.",
                intent: "payout_request" as PartnerSupportIntent,
                question: "How do I request a Glintr partner payout?",
              },
              {
                title: "Payout Status",
                blurb: "Partner-visible payout status per the Payout Policy.",
                intent: "payout_status" as PartnerSupportIntent,
                question: "How can I check my Glintr partner payout status?",
              },
            ].map((c) => (
              <Card key={c.title} className="p-5">
                <div className="font-medium">{c.title}</div>
                <p className="text-sm text-muted-foreground mt-1.5">{c.blurb}</p>
                <button
                  onClick={() => handleStarter({ intent: c.intent, question: c.question })}
                  className="mt-4 text-xs font-medium text-primary inline-flex items-center gap-1 hover:underline"
                >
                  Ask about this <ArrowRight className="size-3" />
                </button>
              </Card>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {signedIn === true ? (
              <>
                <Button
                  onClick={() =>
                    handleStarter({
                      intent: "partner_earnings",
                      question: "How much have I earned on Glintr?",
                    })
                  }
                >
                  Ask About My Earnings
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    handleStarter({
                      intent: "payout_status",
                      question: "What is my Glintr partner payout status?",
                    })
                  }
                >
                  Ask About My Payout
                </Button>
              </>
            ) : (
              <Button asChild>
                <Link to="/auth">
                  <LogIn className="mr-1.5 size-4" /> Sign In For Account Earnings
                </Link>
              </Button>
            )}
          </div>
          <p className="mt-4 text-xs text-muted-foreground max-w-3xl">
            Actual payout timelines and eligibility follow the current Glintr Payout Policy and
            Revenue Share Terms. AI Partner Support cannot approve, edit or release payouts.
          </p>
        </Container>
      </Section>
    </div>
  );
}

// ---- Sub-components ----

function TopicRail({
  topics,
  activeTopic,
  onSelect,
}: {
  topics: Topic[];
  activeTopic: TopicKey | null;
  onSelect: (t: Topic) => void;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  function scroll(dir: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  }
  return (
    <div className="relative">
      <div className="absolute right-0 -top-14 hidden md:flex gap-2">
        <button
          onClick={() => scroll("left")}
          aria-label="Scroll topics left"
          className="grid place-items-center size-9 rounded-full border border-border bg-card hover:bg-primary-soft/40 transition"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          onClick={() => scroll("right")}
          aria-label="Scroll topics right"
          className="grid place-items-center size-9 rounded-full border border-border bg-card hover:bg-primary-soft/40 transition"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1 snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: "thin" }}
      >
        {topics.map((t) => {
          const active = activeTopic === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onSelect(t)}
              className={cn(
                "shrink-0 snap-start rounded-xl border px-4 py-3 text-left min-w-[220px] transition",
                active
                  ? "border-primary bg-primary-soft/60 shadow-sm"
                  : "border-border bg-card hover:border-primary/40 hover:bg-primary-soft/30",
              )}
            >
              <div className="font-medium text-sm">{t.label}</div>
              <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{t.blurb}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ModelCard({
  title,
  subtitle,
  points,
  action,
  onAsk,
}: {
  title: string;
  subtitle: string;
  points: string[];
  action: { label: string; to: string };
  onAsk: () => void;
}) {
  return (
    <Card className="p-6 flex flex-col">
      <div>
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>
      <ul className="mt-5 space-y-2 text-sm">
        {points.map((p, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-1 inline-block size-1.5 rounded-full bg-primary shrink-0" />
            <span className="text-muted-foreground">{p}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <Link to={action.to}>
            {action.label} <ArrowRight className="ml-1.5 size-3.5" />
          </Link>
        </Button>
        <Button size="sm" variant="ghost" onClick={onAsk}>
          Ask About This Model
        </Button>
      </div>
    </Card>
  );
}

function FlowStages({
  stages,
  onAsk,
}: {
  stages: {
    title: string;
    blurb: string;
    intent: PartnerSupportIntent;
    question: string;
  }[];
  onAsk: (intent: PartnerSupportIntent, question: string) => void;
}) {
  const [active, setActive] = React.useState(0);
  return (
    <div>
      <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1 md:grid md:grid-cols-7 md:gap-3 md:overflow-visible">
        {stages.map((s, i) => (
          <button
            key={s.title}
            onClick={() => setActive(i)}
            className={cn(
              "shrink-0 md:shrink rounded-xl border px-3 py-3 text-left min-w-[140px] md:min-w-0 transition",
              i === active
                ? "border-primary bg-primary-soft/60"
                : "border-border bg-card hover:border-primary/40",
            )}
          >
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Stage {i + 1}
            </div>
            <div className="mt-1 font-medium text-sm">{s.title}</div>
          </button>
        ))}
      </div>
      <Card className="mt-4 p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Stage {active + 1}
            </div>
            <h3 className="mt-1 text-lg font-semibold">{stages[active].title}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{stages[active].blurb}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAsk(stages[active].intent, stages[active].question)}
          >
            Ask About This Stage <ArrowRight className="ml-1.5 size-3.5" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

function QuickAction({
  to,
  label,
  external,
}: {
  to: string;
  label: string;
  external?: boolean;
}) {
  return (
    <Link
      to={to}
      className="group rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary-soft/30 px-4 py-4 text-sm font-medium flex items-center justify-between gap-3 transition"
    >
      <span>{label}</span>
      {external ? (
        <ExternalLink className="size-4 text-muted-foreground group-hover:text-primary transition" />
      ) : (
        <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition" />
      )}
    </Link>
  );
}
