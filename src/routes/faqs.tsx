import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Search,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ShieldCheck,
  MessageCircleQuestion,
  Loader2,
  GraduationCap,
  ClipboardList,
  CreditCard,
  Undo2,
  LifeBuoy,
  Handshake,
  Layers,
  Wallet,
  Users,
  Briefcase,
  Settings,
  Info,
  Plus,
  Minus,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Compass,
  ChevronDown,
} from "lucide-react";
import { z } from "zod";

import { Container, Section } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  listFaqCategories,
  listPopularFaqs,
  listFaqsByCategory,
  listAllPublishedFaqs,
  smartFaqSearch,
  submitFaqFeedback,
  type SmartFaqResult,
  type FaqAnswer,
} from "@/lib/faqs/faqs.functions";

const SearchSchema = z.object({
  category: z.string().optional(),
  topic: z.string().optional(),
});

export const Route = createFileRoute("/faqs")({
  head: () => ({
    meta: [
      { title: "Glintr FAQs | Smart Answers And AI Support" },
      {
        name: "description",
        content:
          "Ask questions and discover answers about Glintr programs, learning, payments, partnerships, payouts, campus opportunities and platform support.",
      },
      { property: "og:title", content: "Glintr Smart FAQs" },
      {
        property: "og:description",
        content:
          "Smart AI-guided FAQ discovery across Glintr programs, partnerships, Campus Ambassador, payouts and support.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://glintr.com/faqs" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://glintr.com/faqs" }],
  }),
  validateSearch: (raw) => SearchSchema.parse(raw ?? {}),
  component: FaqsPage,
});

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  GraduationCap,
  ClipboardList,
  CreditCard,
  Undo2,
  LifeBuoy,
  Handshake,
  Layers,
  Wallet,
  Users,
  Briefcase,
  Settings,
  Info,
};

// Support topics for "Find Help By Topic" — mapped to intents + related FAQ category slug
const SUPPORT_TOPICS: Array<{
  key: string;
  title: string;
  description: string;
  intent: string;
  categorySlug?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}> = [
  {
    key: "programs",
    title: "Programs And Learning",
    description: "Explore Glintr programs, enrollment and student learning.",
    intent: "program_discovery",
    icon: GraduationCap,
    accent: "from-primary/15 to-accent/10",
  },
  {
    key: "payments",
    title: "Payments And Refunds",
    description: "Payment journeys, program access after payment and refund information.",
    intent: "payment_support",
    icon: CreditCard,
    accent: "from-accent/15 to-primary/10",
  },
  {
    key: "student",
    title: "Student Support",
    description: "Learning access, sessions and program experience.",
    intent: "general",
    icon: LifeBuoy,
    accent: "from-primary/10 to-primary-soft/40",
  },
  {
    key: "partners",
    title: "Partners And Referrals",
    description: "Sales Partner network, revenue models and referral flow.",
    intent: "partner_support",
    icon: Handshake,
    accent: "from-primary/15 to-accent/15",
  },
  {
    key: "payouts",
    title: "Earnings And Payouts",
    description: "How Glintr earnings and payouts work.",
    intent: "payout_support",
    icon: Wallet,
    accent: "from-accent/20 to-primary/10",
  },
  {
    key: "campus",
    title: "Campus Ambassador",
    description: "Application, commission, referrals and campus growth.",
    intent: "campus_ambassador",
    icon: Users,
    accent: "from-primary-soft/60 to-primary/10",
  },
  {
    key: "careers",
    title: "Careers",
    description: "Working at Glintr and open roles.",
    intent: "general",
    icon: Briefcase,
    accent: "from-primary/10 to-accent/10",
  },
  {
    key: "account",
    title: "Account And Platform",
    description: "Sign in, account access and platform basics.",
    intent: "account_specific",
    icon: Settings,
    accent: "from-muted/60 to-primary-soft/40",
  },
];

const JOURNEY_BRANCHES: Record<string, { title: string; options: Array<{ label: string; intent: string; hint?: string; category?: string }> }> = {
  learning: {
    title: "What would you like to explore?",
    options: [
      { label: "Finding A Program", intent: "program_discovery", hint: "Get help choosing a Glintr program", category: "programs" },
      { label: "Program Information", intent: "program_discovery", category: "programs" },
      { label: "Enrollment", intent: "general", category: "enrollment" },
      { label: "Learning Access", intent: "account_specific_payment", hint: "Access issues after payment" },
      { label: "Student Support", intent: "general", category: "student-support" },
    ],
  },
  payment: {
    title: "What is your question about?",
    options: [
      { label: "Making A Payment", intent: "payment_support", category: "payments" },
      { label: "Payment Completed", intent: "payment_support", category: "payments" },
      { label: "Payment Status", intent: "account_specific_payment", hint: "Account-specific — needs support" },
      { label: "Program Access After Payment", intent: "account_specific_payment" },
      { label: "Something Else", intent: "general" },
    ],
  },
  refund: {
    title: "What would you like to understand?",
    options: [
      { label: "Refund Policy", intent: "refund_policy", category: "refunds" },
      { label: "Refund Eligibility", intent: "refund_policy", category: "refunds" },
      { label: "Refund Status", intent: "account_specific", hint: "Account-specific — needs support" },
      { label: "Other Refund Question", intent: "refund_policy" },
    ],
  },
  partner: {
    title: "What do you need help with?",
    options: [
      { label: "Becoming A Partner", intent: "partner_support", category: "partner-network" },
      { label: "70% Revenue Model", intent: "partner_support", category: "partner-models" },
      { label: "50% Supported Model", intent: "partner_support", category: "partner-models" },
      { label: "Partner Referrals", intent: "partner_support", category: "referrals" },
      { label: "Partner Earnings", intent: "payout_support", category: "earnings-payouts" },
      { label: "Partner Payouts", intent: "payout_support", category: "earnings-payouts" },
      { label: "Partner Support", intent: "partner_support" },
    ],
  },
  campus: {
    title: "What would you like to know?",
    options: [
      { label: "About The Program", intent: "campus_ambassador", category: "campus-ambassador" },
      { label: "Who Can Apply", intent: "campus_ambassador", category: "campus-ambassador" },
      { label: "How To Apply", intent: "campus_ambassador", category: "campus-ambassador" },
      { label: "Commission", intent: "campus_ambassador", category: "campus-ambassador" },
      { label: "Referrals", intent: "campus_ambassador", category: "campus-ambassador" },
      { label: "Earnings And Payouts", intent: "payout_support", category: "earnings-payouts" },
      { label: "Application Question", intent: "campus_ambassador", hint: "Continue with AI Support" },
    ],
  },
  account: {
    title: "What do you need help with?",
    options: [
      { label: "Program Access", intent: "account_specific_payment", hint: "Account-specific" },
      { label: "Payment Status", intent: "account_specific_payment", hint: "Account-specific" },
      { label: "Earnings", intent: "account_specific", hint: "Account-specific" },
      { label: "Payout Status", intent: "account_specific", hint: "Account-specific" },
      { label: "Application Status", intent: "account_specific", hint: "Account-specific" },
      { label: "Sign-In Help", intent: "general" },
    ],
  },
  other: {
    title: "Continue with GlintrAI Support",
    options: [{ label: "Ask GlintrAI Support", intent: "general" }],
  },
};

// Intents that should show "Continue With GlintrAI Support" prominently
function intentActionLabel(intent: string | null | undefined): string {
  switch (intent) {
    case "program_discovery":
      return "Find a program with GlintrAI";
    case "payment_support":
    case "account_specific_payment":
      return "Get Help With This Payment";
    case "refund_policy":
      return "Ask About My Refund Situation";
    case "payout_support":
      return "Ask About My Payout";
    case "account_specific":
    case "status_lookup":
      return "Continue With GlintrAI Support";
    default:
      return "Continue With GlintrAI Support";
  }
}

function buildHandoffSearch(opts: {
  intent?: string | null;
  q?: string | null;
  faqSlugs?: string[];
}) {
  return {
    intent: opts.intent || "general",
    q: opts.q?.slice(0, 240) || undefined,
    source: "faqs",
    faq: opts.faqSlugs && opts.faqSlugs.length > 0 ? opts.faqSlugs : undefined,
  } as const;
}

function FaqsPage() {
  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();

  const listCats = useServerFn(listFaqCategories);
  const listPopular = useServerFn(listPopularFaqs);
  const listByCat = useServerFn(listFaqsByCategory);
  const listAll = useServerFn(listAllPublishedFaqs);
  const smartSearch = useServerFn(smartFaqSearch);

  const categoriesQuery = useQuery({
    queryKey: ["faq-categories"],
    queryFn: () => listCats(),
    staleTime: 5 * 60_000,
  });
  const popularQuery = useQuery({
    queryKey: ["faq-popular"],
    queryFn: () => listPopular(),
    staleTime: 5 * 60_000,
  });
  const allFaqsQuery = useQuery({
    queryKey: ["faq-all"],
    queryFn: () => listAll(),
    staleTime: 5 * 60_000,
  });

  const activeCat = searchParams.category ?? null;
  const setActiveCat = (slug: string | null) => {
    navigate({
      search: (prev: any) => ({ ...prev, category: slug ?? undefined }),
      replace: false,
    });
  };

  const catFaqs = useQuery({
    queryKey: ["faq-by-category", activeCat],
    queryFn: () => listByCat({ data: { categorySlug: activeCat! } }),
    enabled: !!activeCat,
    staleTime: 60_000,
  });

  const [inputValue, setInputValue] = React.useState("");
  const search = useMutation({
    mutationFn: (q: string) => smartSearch({ data: { query: q } }),
  });

  const runQuery = React.useCallback((q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setInputValue(trimmed);
    search.mutate(trimmed);
    requestAnimationFrame(() => {
      document.getElementById("faq-answer")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [search]);

  const focusInput = React.useCallback(() => {
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLInputElement>('input[aria-label="Ask a question about Glintr"]');
      el?.focus();
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, []);

  const railRef = React.useRef<HTMLDivElement>(null);
  const scrollRail = (dir: 1 | -1) => {
    railRef.current?.scrollBy({ left: dir * 360, behavior: "smooth" });
  };

  // JSON-LD structured data: only actual published FAQs shown on page
  const structuredData = React.useMemo(() => {
    const items = (allFaqsQuery.data ?? [])
      .flatMap((g) => g.items)
      .slice(0, 30)
      .map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.full_answer || f.short_answer },
      }));
    if (items.length === 0) return null;
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: items,
    };
  }, [allFaqsQuery.data]);

  return (
    <div className="bg-background">
      {structuredData && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}

      {/* ---- HERO ---- */}
      <Section className="pt-16 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary-soft/40 via-background to-background" />
        <div
          className="absolute inset-x-0 top-0 -z-10 h-[340px] opacity-60 blur-3xl"
          aria-hidden
          style={{
            background:
              "radial-gradient(60% 60% at 50% 0%, hsl(var(--primary) / 0.18) 0%, transparent 70%)",
          }}
        />
        <Container>
          <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-6">
            <Badge variant="muted" className="gap-1.5">
              <Sparkles className="size-3.5" />
              GLINTR HELP
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-balance">
              Questions Are Easier When You Know Where To Look
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl text-pretty">
              Ask a question in your own words and discover answers across Glintr programs,
              learning, payments, partnerships, campus opportunities and platform support.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                runQuery(inputValue);
              }}
              className="w-full max-w-2xl mt-2"
            >
              <div className="relative rounded-2xl border border-border bg-card shadow-lg shadow-primary/5 focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/10 transition-all">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask a question about Glintr..."
                  className="w-full bg-transparent pl-14 pr-36 py-5 text-base outline-none placeholder:text-muted-foreground"
                  aria-label="Ask a question about Glintr"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <Button
                    type="submit"
                    variant="gradient"
                    size="md"
                    disabled={search.isPending || !inputValue.trim()}
                  >
                    {search.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <>
                        Search Answers
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>

            <div className="w-full max-w-2xl mt-4">
              <p className="text-label text-left mb-3">Popular Questions</p>
              {popularQuery.isLoading ? (
                <div className="grid gap-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-11 rounded-lg bg-muted/60 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-2">
                  {(popularQuery.data ?? []).map((q) => (
                    <button
                      key={q.slug}
                      type="button"
                      onClick={() => runQuery(q.question)}
                      className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left text-sm hover:border-primary/40 hover:bg-primary-soft/30 transition-colors"
                    >
                      <span className="flex items-center gap-2.5">
                        <MessageCircleQuestion className="size-4 text-primary shrink-0" />
                        <span className="font-medium">{q.question}</span>
                      </span>
                      <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Container>
      </Section>

      {/* ---- SMART ANSWER RESULT ---- */}
      <div id="faq-answer" className="scroll-mt-24" aria-live="polite">
        {search.isPending && (
          <Section className="py-8">
            <Container>
              <Card className="p-8 max-w-3xl mx-auto flex items-center gap-4">
                <Loader2 className="size-5 animate-spin text-primary" />
                <p className="text-muted-foreground">
                  Finding the most relevant Glintr answers...
                </p>
              </Card>
            </Container>
          </Section>
        )}
        {search.isError && !search.isPending && (
          <Section className="py-8">
            <Container>
              <Card className="p-8 max-w-3xl mx-auto text-center">
                <h2 className="font-display text-2xl font-semibold">
                  Smart Answer Search Is Temporarily Unavailable
                </h2>
                <p className="mt-2 text-muted-foreground">
                  You can try your question again or continue with GlintrAI Support.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Button variant="gradient" onClick={() => runQuery(inputValue)}>
                    Try Again
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/contact" search={{ intent: "general", q: inputValue, source: "faqs_error" }}>
                      Ask GlintrAI Support
                    </Link>
                  </Button>
                </div>
              </Card>
            </Container>
          </Section>
        )}
        {search.data && !search.isPending && (
          <Section className="py-10">
            <Container>
              <SmartAnswer
                result={search.data}
                onAskAnother={() => {
                  setInputValue("");
                  focusInput();
                }}
                onRunQuery={runQuery}
                onBrowseTopics={() =>
                  document.getElementById("help-topics")?.scrollIntoView({ behavior: "smooth" })
                }
              />
            </Container>
          </Section>
        )}
      </div>

      {/* ---- EXPLORE HELP TOPICS (category rail) ---- */}
      <Section id="help-topics" className="py-16 border-t border-border/60">
        <Container>
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-label mb-2">Explore Help Topics</p>
              <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
                Browse By Category
              </h2>
            </div>
            <div className="hidden md:flex gap-2">
              <Button variant="outline" size="icon" onClick={() => scrollRail(-1)} aria-label="Scroll left">
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => scrollRail(1)} aria-label="Scroll right">
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          <div
            ref={railRef}
            className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {categoriesQuery.isLoading &&
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-32 w-64 shrink-0 rounded-xl bg-muted/60 animate-pulse" />
              ))}
            {(categoriesQuery.data ?? []).map((c) => {
              const Icon = c.icon ? ICON_MAP[c.icon] ?? Info : Info;
              const isActive = activeCat === c.slug;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveCat(isActive ? null : c.slug)}
                  className={cn(
                    "group snap-start shrink-0 w-64 text-left rounded-xl border p-5 transition-all",
                    isActive
                      ? "border-primary bg-primary-soft/60 ring-2 ring-primary/30 shadow-md"
                      : "border-border bg-card hover:border-primary/40 hover:bg-primary-soft/20",
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={cn(
                        "grid size-10 place-items-center rounded-lg",
                        isActive ? "bg-primary text-primary-foreground" : "bg-muted text-primary",
                      )}
                    >
                      <Icon className="size-5" />
                    </div>
                    {c.count > 0 && (
                      <Badge variant="muted" className="text-[11px]">
                        {c.count}
                      </Badge>
                    )}
                  </div>
                  <p className="font-medium text-sm">{c.name}</p>
                  {c.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {c.description}
                    </p>
                  )}
                  {isActive && (
                    <p className="mt-3 text-[11px] font-medium text-primary uppercase tracking-wide">
                      Showing questions ↓
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {activeCat && (
            <div className="mt-8 grid gap-3 max-w-3xl">
              {catFaqs.isLoading && (
                <>
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-16 rounded-lg bg-muted/60 animate-pulse" />
                  ))}
                </>
              )}
              {catFaqs.data?.items.map((f) => (
                <button
                  key={f.slug}
                  onClick={() => runQuery(f.question)}
                  className="group flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-4 text-left hover:border-primary/40 hover:bg-primary-soft/20 transition-colors"
                >
                  <div>
                    <p className="font-medium">{f.question}</p>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {f.short_answer}
                    </p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground mt-1 shrink-0 group-hover:text-primary" />
                </button>
              ))}
              {catFaqs.data && catFaqs.data.items.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No published questions in this category yet.
                </p>
              )}
            </div>
          )}
        </Container>
      </Section>

      {/* ---- FREQUENTLY EXPLORED QUESTIONS ---- */}
      <Section className="py-14 border-t border-border/60 bg-muted/30">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-8">
            <p className="text-label mb-2">Frequently Explored Questions</p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
              What people are asking about most
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2 max-w-4xl mx-auto">
            {(popularQuery.data ?? []).slice(0, 6).map((q) => (
              <button
                key={q.slug}
                type="button"
                onClick={() => runQuery(q.question)}
                className="text-left rounded-lg border border-border bg-card p-4 hover:border-primary/40 hover:bg-primary-soft/20 transition-colors"
              >
                <p className="font-medium">{q.question}</p>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{q.short_answer}</p>
              </button>
            ))}
          </div>
        </Container>
      </Section>

      {/* ---- FIND HELP BY TOPIC ---- */}
      <Section className="py-16 border-t border-border/60">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-10">
            <p className="text-label mb-2">Find Help By Topic</p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
              Pick a topic. Get to the right answer.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {SUPPORT_TOPICS.map((t) => {
              const Icon = t.icon;
              return (
                <div
                  key={t.key}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border border-border bg-card p-6 flex flex-col gap-4 hover:border-primary/40 transition-colors",
                  )}
                >
                  <div
                    className={cn(
                      "absolute inset-0 -z-10 opacity-60 bg-gradient-to-br",
                      t.accent,
                    )}
                    aria-hidden
                  />
                  <div className="grid size-11 place-items-center rounded-xl bg-background/70 backdrop-blur border border-border/60 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium">{t.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2">
                    {t.categorySlug && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveCat(t.categorySlug!)}
                      >
                        View Questions
                      </Button>
                    )}
                    <Button asChild size="sm" variant="ghost">
                      <Link to="/contact" search={{ intent: t.intent, source: `topic_${t.key}` }}>
                        Ask GlintrAI
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* ---- INTERACTIVE HELP JOURNEY ---- */}
      <HelpJourneySection onRunQuery={runQuery} />

      {/* ---- BROWSE ALL QUESTIONS ---- */}
      <BrowseAllSection groups={allFaqsQuery.data} isLoading={allFaqsQuery.isLoading} isError={allFaqsQuery.isError} />

      {/* ---- FROM QUESTION TO NEXT STEP ---- */}
      <Section className="py-16 border-t border-border/60 bg-muted/20">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-10">
            <p className="text-label mb-2">Your help journey</p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
              From Question To Next Step
            </h2>
          </div>
          <ol className="grid gap-4 md:grid-cols-5 max-w-6xl mx-auto">
            {[
              { title: "Ask", body: "Type your question naturally." },
              { title: "Find", body: "Smart FAQ discovery checks approved Glintr information." },
              { title: "Understand", body: "Review a concise answer and the source FAQs." },
              { title: "Explore", body: "Open related questions, policies or Glintr pages." },
              { title: "Continue", body: "Move to GlintrAI Support when more context is needed." },
            ].map((s, i) => (
              <li key={s.title} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 text-primary text-xs font-medium">
                  STEP {i + 1}
                </div>
                <p className="mt-2 font-medium">{s.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* ---- AI SUPPORT CONNECTION ---- */}
      <Section className="py-20 border-t border-border/60">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 items-center max-w-6xl mx-auto">
            <div>
              <p className="text-label mb-2">Need More Than An FAQ?</p>
              <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-balance">
                Continue The Conversation With GlintrAI Support
              </h2>
              <p className="mt-4 text-muted-foreground text-pretty">
                Some questions need context. GlintrAI Support can continue from your FAQ question,
                understand follow-ups and help move unresolved issues to the support team.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild variant="gradient" size="lg">
                  <Link to="/contact" search={{ intent: "general", q: inputValue || undefined, source: "faqs_connect" }}>
                    Ask GlintrAI Support
                  </Link>
                </Button>
                <Button variant="outline" size="lg" onClick={focusInput}>
                  Ask A Question Instead
                </Button>
              </div>
            </div>
            <Card className="p-6 bg-gradient-to-br from-primary-soft/40 to-background">
              <div className="flex flex-col gap-3">
                <ConceptualBubble role="user" text="I completed payment but my program is not visible." />
                <ConceptualBubble
                  role="assistant"
                  text="I can help you understand the next support step. If account-specific review is needed, I'll guide you through the authorised support process."
                />
                <ConceptualBubble role="user" text="When can I request a payout?" />
                <ConceptualBubble
                  role="assistant"
                  text="I'll share Glintr's approved payout timing. For your specific payout status, we'll continue through authorised support."
                />
                <p className="text-[11px] text-muted-foreground mt-2">
                  Illustrative preview — not a real conversation.
                </p>
              </div>
            </Card>
          </div>
        </Container>
      </Section>

      {/* ---- TRUST STRIP ---- */}
      <Section className="py-14 border-t border-border/60 bg-muted/30">
        <Container>
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            <TrustCard icon={ShieldCheck} title="Grounded in approved information" body="Smart FAQs only use published Glintr FAQs and public information." />
            <TrustCard icon={BookOpen} title="Sources always shown" body="Every answer links to the FAQs and official pages it drew from." />
            <TrustCard icon={MessageCircleQuestion} title="Account questions stay safe" body="Personal status like payments or payouts is handled by support, not Smart FAQs." />
          </div>
        </Container>
      </Section>

      {/* ---- FINAL CTA ---- */}
      <Section className="py-20 border-t border-border/60">
        <Container>
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-label mb-3">FIND YOUR ANSWER</p>
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-balance">
              Start With A Question
            </h2>
            <p className="mt-4 text-muted-foreground text-pretty">
              Ask naturally, explore approved Glintr answers and continue with AI Support when you
              need more help.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button variant="gradient" size="lg" onClick={focusInput}>
                Ask A Question
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/contact" search={{ intent: "general", source: "faqs_final_cta" }}>
                  GlintrAI Support
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}

/* ---------------- Smart Answer Panel ---------------- */

function SmartAnswer({
  result,
  onAskAnother,
  onRunQuery,
  onBrowseTopics,
}: {
  result: SmartFaqResult;
  onAskAnother: () => void;
  onRunQuery: (q: string) => void;
  onBrowseTopics: () => void;
}) {
  const handoffSearch = buildHandoffSearch({
    intent: result.intent,
    q: result.query,
    faqSlugs: result.answers_used.map((a) => a.slug),
  });
  const handoffLabel = intentActionLabel(result.intent);

  if (result.status === "clarify") {
    return (
      <Card className="max-w-3xl mx-auto p-8">
        <p className="text-label mb-2">Glintr Answer</p>
        <h2 className="font-display text-2xl md:text-3xl font-semibold">{result.headline}</h2>
        <p className="mt-2 text-muted-foreground">{result.summary}</p>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {result.clarify_options?.map((o) => (
            <button
              key={o.label}
              onClick={() => onRunQuery(o.label)}
              className="text-left rounded-lg border border-border bg-card p-4 hover:border-primary/40 hover:bg-primary-soft/20 transition-colors"
            >
              <p className="font-medium">{o.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{o.hint}</p>
            </button>
          ))}
        </div>
        <div className="mt-6">
          <Button asChild variant="outline" size="sm">
            <Link to="/contact" search={handoffSearch}>
              Continue With GlintrAI Support
            </Link>
          </Button>
        </div>
      </Card>
    );
  }

  if (result.status === "no_match") {
    return (
      <Card className="max-w-3xl mx-auto p-8 text-center">
        <h2 className="font-display text-2xl md:text-3xl font-semibold">
          We Couldn't Find A Clear FAQ Answer
        </h2>
        <p className="mt-2 text-muted-foreground">
          Try another question, browse a related Glintr help topic, or continue with Glintr AI
          Support.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button variant="gradient" onClick={onAskAnother}>
            Ask Another Question
          </Button>
          <Button variant="outline" onClick={onBrowseTopics}>
            Browse Help Topics
          </Button>
          <Button asChild variant="ghost">
            <Link to="/contact" search={handoffSearch}>
              Continue With GlintrAI Support
            </Link>
          </Button>
        </div>
      </Card>
    );
  }

  if (result.status === "account_specific") {
    return (
      <Card className="max-w-3xl mx-auto p-8">
        <Badge variant="muted" className="mb-3">
          This Question Needs Account Information
        </Badge>
        <h2 className="font-display text-2xl md:text-3xl font-semibold">{result.headline}</h2>
        <p className="mt-3 text-muted-foreground text-pretty">{result.summary}</p>
        {result.answers_used.length > 0 && (
          <div className="mt-6">
            <p className="text-label mb-3">Related General Information</p>
            <AnswersUsedList answers={result.answers_used} />
          </div>
        )}
        <div className="mt-6 rounded-lg bg-muted/60 p-4 text-sm text-muted-foreground">
          Smart FAQs can explain general Glintr information, but your specific status requires
          authorised account access.
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild variant="gradient">
            <Link to="/contact" search={handoffSearch}>
              {handoffLabel}
            </Link>
          </Button>
          <Button variant="outline" onClick={onAskAnother}>
            Ask A Different Question
          </Button>
        </div>
      </Card>
    );
  }

  // Answered
  const showHandoff =
    result.needs_official ||
    result.intent === "program_discovery" ||
    (result.programs && result.programs.length > 0) ||
    (result.related.length === 0 && result.answers_used.length <= 1);

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <Card className="p-8">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="size-4 text-primary" />
          <p className="text-label">Glintr Answer</p>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          You asked: <span className="font-medium text-foreground">"{result.query}"</span>
        </p>
        <h2 className="font-display text-2xl md:text-3xl font-semibold text-balance">
          {result.headline}
        </h2>
        <p className="mt-3 text-muted-foreground text-pretty leading-relaxed">{result.summary}</p>
        {result.policy_note && (
          <div className="mt-5 rounded-lg border border-primary/20 bg-primary-soft/40 p-4 text-sm">
            <p className="font-medium">Official Glintr Information</p>
            <p className="text-muted-foreground mt-1">{result.policy_note}</p>
          </div>
        )}
        <div className="mt-6 flex flex-wrap gap-2">
          {result.action_href && result.action_label && (
            <Button asChild variant="gradient">
              <Link to={result.action_href as any}>
                {result.action_label}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          )}
          {showHandoff && (
            <Button asChild variant={result.action_href ? "outline" : "gradient"}>
              <Link to="/contact" search={handoffSearch}>
                {handoffLabel}
              </Link>
            </Button>
          )}
        </div>
        <SmartAnswerFeedback onRunQuery={onRunQuery} onBrowseTopics={onBrowseTopics} handoffSearch={handoffSearch} />
      </Card>

      {result.programs && result.programs.length > 0 && (
        <Card className="p-6">
          <p className="text-label mb-4">Matching Glintr Programs</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {result.programs.map((p) => (
              <Link
                key={p.slug}
                to={p.href as any}
                className="group rounded-lg border border-border bg-card p-4 hover:border-primary/40 hover:bg-primary-soft/20 transition-colors"
              >
                {p.category_name && (
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {p.category_name}
                  </p>
                )}
                <p className="font-medium mt-1">{p.name}</p>
                {p.short_description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {p.short_description}
                  </p>
                )}
                <span className="mt-3 inline-flex items-center gap-1 text-sm text-primary">
                  Explore Program <ArrowRight className="size-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {result.answers_used.length > 0 && (
        <Card className="p-6">
          <p className="text-label mb-4">Answers Used</p>
          <AnswersUsedList answers={result.answers_used} />
        </Card>
      )}

      {result.related.length > 0 && (
        <Card className="p-6">
          <p className="text-label mb-4">You May Also Want To Ask</p>
          <div className="grid gap-2">
            {result.related.map((r) => (
              <button
                key={r.slug}
                onClick={() => onRunQuery(r.question)}
                className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left text-sm hover:border-primary/40 hover:bg-primary-soft/20 transition-colors"
              >
                <span className="font-medium">{r.question}</span>
                <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary" />
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function SmartAnswerFeedback({
  onRunQuery,
  onBrowseTopics,
  handoffSearch,
}: {
  onRunQuery: (q: string) => void;
  onBrowseTopics: () => void;
  handoffSearch: { intent: string; q?: string; source: string; faq?: string[] };
}) {
  const submit = useServerFn(submitFaqFeedback);
  const [choice, setChoice] = React.useState<null | "yes" | "no">(null);
  return (
    <div className="mt-6 pt-6 border-t border-border/60">
      {!choice && (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-muted-foreground">Did this answer your question?</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setChoice("yes");
              submit({ data: { scope: "smart_answer", helpful: true } }).catch(() => {});
            }}
          >
            <ThumbsUp className="size-3.5" /> Yes
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setChoice("no");
              submit({ data: { scope: "smart_answer", helpful: false } }).catch(() => {});
            }}
          >
            <ThumbsDown className="size-3.5" /> I need more help
          </Button>
        </div>
      )}
      {choice === "yes" && (
        <div className="text-sm text-muted-foreground">
          Thanks for the signal. Explore <button className="text-primary underline" onClick={onBrowseTopics}>related help topics</button>.
        </div>
      )}
      {choice === "no" && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Would you like to continue?</span>
          <Button asChild size="sm" variant="gradient">
            <Link to="/contact" search={handoffSearch}>
              Continue With GlintrAI Support
            </Link>
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onRunQuery("")}>
            Ask A Related Question
          </Button>
        </div>
      )}
    </div>
  );
}

function AnswersUsedList({ answers }: { answers: SmartFaqResult["answers_used"] }) {
  const [openId, setOpenId] = React.useState<string | null>(null);
  return (
    <div className="grid gap-3">
      {answers.map((a) => {
        const isOpen = openId === a.id;
        return (
          <div key={a.id} className="rounded-lg border border-border bg-card overflow-hidden">
            <button
              onClick={() => setOpenId(isOpen ? null : a.id)}
              className="w-full text-left p-4 flex items-start justify-between gap-3"
              aria-expanded={isOpen}
            >
              <div>
                {a.category_name && (
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                    {a.category_name}
                  </p>
                )}
                <p className="font-medium">{a.question}</p>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{a.short_answer}</p>
              </div>
              <span className="text-xs text-primary shrink-0 mt-1 whitespace-nowrap">
                {isOpen ? "Hide" : "Read Full Answer"}
              </span>
            </button>
            {isOpen && (
              <div className="border-t border-border/60 p-4 text-sm text-muted-foreground leading-relaxed">
                <p className="whitespace-pre-line">{a.full_answer}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {a.action_href && a.action_label && (
                    <Button asChild variant="outline" size="sm">
                      <Link to={a.action_href as any}>{a.action_label}</Link>
                    </Button>
                  )}
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/faqs/$slug" params={{ slug: a.slug }}>
                      Open Full Answer
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Browse All Questions ---------------- */

function BrowseAllSection({
  groups,
  isLoading,
  isError,
}: {
  groups: Array<{ category: { id: string; slug: string; name: string; description: string | null; icon: string | null; count: number }; items: FaqAnswer[] }> | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  const [active, setActive] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!active && groups && groups.length > 0) setActive(groups[0].category.slug);
  }, [active, groups]);
  const activeGroup = groups?.find((g) => g.category.slug === active) ?? groups?.[0];

  return (
    <Section id="browse-all" className="py-16 border-t border-border/60">
      <Container>
        <div className="max-w-3xl mb-10">
          <p className="text-label mb-2">Browse All Questions</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
            Every approved Glintr answer, organised by category
          </h2>
          <p className="mt-3 text-muted-foreground">
            Prefer to explore manually? Pick a category and expand any question.
          </p>
        </div>

        {isLoading && (
          <div className="grid gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-muted/60 animate-pulse" />
            ))}
          </div>
        )}
        {isError && (
          <Card className="p-8 text-center">
            <p className="font-medium">Unable To Load Help Answers</p>
            <p className="text-sm text-muted-foreground mt-1">Please retry in a moment.</p>
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
              <Button asChild variant="gradient">
                <Link to="/contact" search={{ intent: "general", source: "browse_error" }}>
                  Ask GlintrAI Support
                </Link>
              </Button>
            </div>
          </Card>
        )}
        {groups && groups.length > 0 && (
          <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
            {/* Mobile chips */}
            <div className="lg:hidden -mx-4 px-4 overflow-x-auto flex gap-2 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {groups.map((g) => (
                <button
                  key={g.category.slug}
                  onClick={() => setActive(g.category.slug)}
                  className={cn(
                    "shrink-0 rounded-full border px-4 py-2 text-sm whitespace-nowrap transition-colors",
                    active === g.category.slug
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:border-primary/40",
                  )}
                >
                  {g.category.name}
                </button>
              ))}
            </div>
            {/* Desktop sticky nav */}
            <nav className="hidden lg:block sticky top-24 self-start" aria-label="FAQ categories">
              <ul className="flex flex-col gap-1">
                {groups.map((g) => (
                  <li key={g.category.slug}>
                    <button
                      onClick={() => setActive(g.category.slug)}
                      className={cn(
                        "w-full text-left rounded-lg px-3 py-2 text-sm flex items-center justify-between transition-colors",
                        active === g.category.slug
                          ? "bg-primary-soft/60 text-primary font-medium"
                          : "hover:bg-muted",
                      )}
                    >
                      <span>{g.category.name}</span>
                      <span className="text-[11px] text-muted-foreground">{g.items.length}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            <div>
              {activeGroup && (
                <>
                  <div className="mb-6">
                    <h3 className="font-display text-2xl font-semibold">
                      {activeGroup.category.name}
                    </h3>
                    {activeGroup.category.description && (
                      <p className="mt-1 text-muted-foreground">
                        {activeGroup.category.description}
                      </p>
                    )}
                  </div>
                  <FaqAccordionList items={activeGroup.items} />
                </>
              )}
            </div>
          </div>
        )}
      </Container>
    </Section>
  );
}

function FaqAccordionList({ items }: { items: FaqAnswer[] }) {
  const [openSet, setOpenSet] = React.useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const submit = useServerFn(submitFaqFeedback);

  return (
    <div className="grid gap-3">
      {items.map((f) => {
        const isOpen = openSet.has(f.id);
        return (
          <div
            key={f.id}
            className={cn(
              "rounded-xl border overflow-hidden transition-colors",
              isOpen ? "border-primary/40 bg-primary-soft/20" : "border-border bg-card",
            )}
          >
            <button
              onClick={() => toggle(f.id)}
              className="w-full flex items-center justify-between gap-4 text-left px-5 py-4"
              aria-expanded={isOpen}
              aria-controls={`faq-${f.id}`}
            >
              <span className="font-medium">{f.question}</span>
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-full shrink-0 transition-colors",
                  isOpen ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
                aria-hidden
              >
                {isOpen ? <Minus className="size-3.5" /> : <Plus className="size-3.5" />}
              </span>
            </button>
            {isOpen && (
              <div id={`faq-${f.id}`} className="border-t border-border/60 px-5 py-5">
                <p className="text-sm text-foreground/90 mb-3">{f.short_answer}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {f.full_answer}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {f.action_href && f.action_label && (
                    <Button asChild variant="outline" size="sm">
                      <Link to={f.action_href as any}>{f.action_label}</Link>
                    </Button>
                  )}
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/faqs/$slug" params={{ slug: f.slug }}>
                      Open Answer
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link
                      to="/contact"
                      search={{
                        intent: "general",
                        q: f.question,
                        source: "faq_accordion",
                        faq: [f.slug],
                      }}
                    >
                      Ask GlintrAI Support
                    </Link>
                  </Button>
                </div>
                <FaqRowFeedback faqSlug={f.slug} onSubmit={(helpful) => submit({ data: { scope: "faq", faqSlug: f.slug, helpful } }).catch(() => {})} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FaqRowFeedback({
  faqSlug,
  onSubmit,
}: {
  faqSlug: string;
  onSubmit: (helpful: boolean) => void;
}) {
  const [state, setState] = React.useState<null | "yes" | "no">(null);
  return (
    <div className="mt-4 pt-4 border-t border-border/60 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      {!state && (
        <>
          <span>Was this answer helpful?</span>
          <button
            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 hover:border-primary/40 transition-colors"
            onClick={() => {
              setState("yes");
              onSubmit(true);
            }}
          >
            <ThumbsUp className="size-3" /> Yes
          </button>
          <button
            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 hover:border-primary/40 transition-colors"
            onClick={() => {
              setState("no");
              onSubmit(false);
            }}
          >
            <ThumbsDown className="size-3" /> Not really
          </button>
        </>
      )}
      {state === "yes" && <span className="text-primary">Thanks for the signal.</span>}
      {state === "no" && (
        <>
          <span>Sorry to hear that.</span>
          <Link
            to="/contact"
            search={{ intent: "general", source: "faq_feedback_no", faq: [faqSlug] }}
            className="text-primary underline"
          >
            Continue With GlintrAI Support
          </Link>
        </>
      )}
    </div>
  );
}

/* ---------------- Interactive Help Journey ---------------- */

const JOURNEY_ROOT: Array<{ key: keyof typeof JOURNEY_BRANCHES; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: "learning", label: "Learning", icon: GraduationCap },
  { key: "payment", label: "A Payment", icon: CreditCard },
  { key: "refund", label: "A Refund", icon: Undo2 },
  { key: "partner", label: "Partnering With Glintr", icon: Handshake },
  { key: "campus", label: "Campus Ambassador", icon: Users },
  { key: "account", label: "My Account", icon: Settings },
  { key: "other", label: "Something Else", icon: MessageSquare },
];

function HelpJourneySection({ onRunQuery }: { onRunQuery: (q: string) => void }) {
  const [branch, setBranch] = React.useState<keyof typeof JOURNEY_BRANCHES | null>(null);
  const active = branch ? JOURNEY_BRANCHES[branch] : null;

  return (
    <Section className="py-16 border-t border-border/60 bg-muted/20">
      <Container>
        <div className="max-w-3xl mx-auto text-center mb-10">
          <div className="inline-flex items-center gap-2 text-primary">
            <Compass className="size-5" />
            <p className="text-label">Not Sure Where To Start?</p>
          </div>
          <h2 className="mt-3 font-display text-3xl md:text-4xl font-semibold tracking-tight">
            What do you need help with?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Answer one or two questions and we'll guide you to the right Glintr next step.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4 max-w-5xl mx-auto">
          {JOURNEY_ROOT.map((r) => {
            const Icon = r.icon;
            const isActive = branch === r.key;
            return (
              <button
                key={r.key}
                onClick={() => setBranch(isActive ? null : r.key)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-4 text-left transition-all",
                  isActive
                    ? "border-primary bg-primary-soft/50 ring-2 ring-primary/30"
                    : "border-border bg-card hover:border-primary/40 hover:bg-primary-soft/20",
                )}
                aria-pressed={isActive}
              >
                <div
                  className={cn(
                    "grid size-9 place-items-center rounded-lg shrink-0",
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted text-primary",
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <span className="font-medium text-sm">{r.label}</span>
                <ChevronDown
                  className={cn(
                    "size-4 ml-auto text-muted-foreground transition-transform",
                    isActive && "rotate-180",
                  )}
                />
              </button>
            );
          })}
        </div>

        {active && (
          <Card className="mt-8 p-6 max-w-4xl mx-auto">
            <p className="text-label mb-3">{active.title}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {active.options.map((o) => (
                <div
                  key={o.label}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-4"
                >
                  <div>
                    <p className="font-medium">{o.label}</p>
                    {o.hint && <p className="text-xs text-muted-foreground mt-0.5">{o.hint}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => onRunQuery(o.label)}>
                      Find Answer
                    </Button>
                    <Button asChild size="sm" variant="ghost">
                      <Link
                        to="/contact"
                        search={{
                          intent: o.intent,
                          q: o.label,
                          source: `journey_${branch}`,
                        }}
                      >
                        Ask AI Support
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </Container>
    </Section>
  );
}

/* ---------------- Small building blocks ---------------- */

function ConceptualBubble({ role, text }: { role: "user" | "assistant"; text: string }) {
  const isUser = role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed border",
          isUser
            ? "bg-primary text-primary-foreground border-primary rounded-br-md"
            : "bg-card border-border rounded-bl-md",
        )}
      >
        {text}
      </div>
    </div>
  );
}

function TrustCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="size-6 text-primary shrink-0 mt-1" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground mt-1">{body}</p>
      </div>
    </div>
  );
}
