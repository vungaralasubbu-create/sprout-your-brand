import { createFileRoute } from "@tanstack/react-router";
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
} from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Container, Section } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  listFaqCategories,
  listPopularFaqs,
  listFaqsByCategory,
  smartFaqSearch,
  type SmartFaqResult,
} from "@/lib/faqs/faqs.functions";

export const Route = createFileRoute("/faqs")({
  head: () => ({
    meta: [
      { title: "Glintr Smart FAQs — Ask A Question. Find The Right Answer." },
      {
        name: "description",
        content:
          "Ask questions in your own words and discover approved Glintr answers across programs, learning, payments, partnerships, campus opportunities and support.",
      },
      { property: "og:title", content: "Glintr Smart FAQs" },
      {
        property: "og:description",
        content:
          "Smart, AI-guided FAQ discovery across Glintr programs, partnerships, Campus Ambassador, payouts and support.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
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

function FaqsPage() {
  const listCats = useServerFn(listFaqCategories);
  const listPopular = useServerFn(listPopularFaqs);
  const listByCat = useServerFn(listFaqsByCategory);
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

  const [activeCat, setActiveCat] = React.useState<string | null>(null);
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

  const runQuery = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setInputValue(trimmed);
    search.mutate(trimmed);
    // Smooth scroll to result panel
    requestAnimationFrame(() => {
      document.getElementById("faq-answer")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const railRef = React.useRef<HTMLDivElement>(null);
  const scrollRail = (dir: 1 | -1) => {
    railRef.current?.scrollBy({ left: dir * 360, behavior: "smooth" });
  };

  return (
    <div className="bg-background">
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
            <p className="text-sm text-muted-foreground/80 max-w-xl">
              Glintr Smart FAQs checks approved Glintr information to help you find relevant
              answers faster.
            </p>

            {/* Smart Question Input */}
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

            {/* Popular Question Starters */}
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
      <div id="faq-answer" className="scroll-mt-24">
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
                  You can try your question again or browse Glintr help topics.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Button variant="gradient" onClick={() => runQuery(inputValue)}>
                    Try Again
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      document
                        .getElementById("help-topics")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    Browse Help Topics
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
                  requestAnimationFrame(() =>
                    document
                      .querySelector<HTMLInputElement>('input[aria-label="Ask a question about Glintr"]')
                      ?.focus(),
                  );
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

      {/* ---- HELP TOPICS ---- */}
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
                <div
                  key={i}
                  className="h-32 w-64 shrink-0 rounded-xl bg-muted/60 animate-pulse"
                />
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

          {/* Category FAQ list */}
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

      {/* ---- Trust strip ---- */}
      <Section className="py-14 border-t border-border/60 bg-muted/30">
        <Container>
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            <div className="flex gap-3">
              <ShieldCheck className="size-6 text-primary shrink-0 mt-1" />
              <div>
                <p className="font-medium">Grounded in approved information</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Smart FAQs only use published Glintr FAQs and public information.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <BookOpen className="size-6 text-primary shrink-0 mt-1" />
              <div>
                <p className="font-medium">Sources always shown</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Every answer links to the FAQs and official pages it drew from.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <MessageCircleQuestion className="size-6 text-primary shrink-0 mt-1" />
              <div>
                <p className="font-medium">Account questions stay safe</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Personal status like payments or payouts is handled by support, not Smart FAQs.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}

/* --------------------- Smart Answer Panel --------------------- */

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
  if (result.status === "clarify") {
    return (
      <Card className="max-w-3xl mx-auto p-8">
        <p className="text-label mb-2">Glintr Answer</p>
        <h2 className="font-display text-2xl md:text-3xl font-semibold">
          {result.headline}
        </h2>
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
          Try another question or explore a related Glintr help topic.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button variant="gradient" onClick={onAskAnother}>
            Ask Another Question
          </Button>
          <Button variant="outline" onClick={onBrowseTopics}>
            Browse Help Topics
          </Button>
        </div>
      </Card>
    );
  }

  if (result.status === "account_specific") {
    return (
      <Card className="max-w-3xl mx-auto p-8">
        <Badge variant="muted" className="mb-3">Account-specific question</Badge>
        <h2 className="font-display text-2xl md:text-3xl font-semibold">
          {result.headline}
        </h2>
        <p className="mt-3 text-muted-foreground text-pretty">{result.summary}</p>
        {result.answers_used.length > 0 && (
          <div className="mt-6">
            <p className="text-label mb-3">Related General Information</p>
            <AnswersUsedList answers={result.answers_used} />
          </div>
        )}
        <div className="mt-6 rounded-lg bg-muted/60 p-4 text-sm text-muted-foreground">
          For your specific status, Glintr support can look this up against your account.
        </div>
      </Card>
    );
  }

  // Answered
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
        <p className="mt-3 text-muted-foreground text-pretty leading-relaxed">
          {result.summary}
        </p>
        {result.policy_note && (
          <div className="mt-5 rounded-lg border border-primary/20 bg-primary-soft/40 p-4 text-sm">
            <p className="font-medium">Official Glintr Information</p>
            <p className="text-muted-foreground mt-1">{result.policy_note}</p>
          </div>
        )}
        {result.action_href && result.action_label && (
          <div className="mt-6">
            <Button asChild variant="gradient">
              <Link to={result.action_href as any}>
                {result.action_label}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        )}
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

function AnswersUsedList({ answers }: { answers: SmartFaqResult["answers_used"] }) {
  const [openId, setOpenId] = React.useState<string | null>(null);
  return (
    <div className="grid gap-3">
      {answers.map((a) => {
        const isOpen = openId === a.id;
        return (
          <div
            key={a.id}
            className="rounded-lg border border-border bg-card overflow-hidden"
          >
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
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {a.short_answer}
                </p>
              </div>
              <span className="text-xs text-primary shrink-0 mt-1 whitespace-nowrap">
                {isOpen ? "Hide" : "Read Full Answer"}
              </span>
            </button>
            {isOpen && (
              <div className="border-t border-border/60 p-4 text-sm text-muted-foreground leading-relaxed">
                {a.full_answer}
                {a.action_href && a.action_label && (
                  <div className="mt-4">
                    <Button asChild variant="outline" size="sm">
                      <Link to={a.action_href as any}>{a.action_label}</Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
