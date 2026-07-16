import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, RefreshCw, Sparkles } from "lucide-react";

import { Container, Section } from "@/components/shared/section";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { track } from "@/lib/intent";
import { buildPageHead } from "@/lib/seo-head";
import { cn } from "@/lib/utils";

interface Choice {
  id: string;
  label: string;
  tags: string[];
}

interface Question {
  id: string;
  question: string;
  choices: Choice[];
}

const QUESTIONS: Question[] = [
  {
    id: "who",
    question: "Which best describes you today?",
    choices: [
      { id: "student", label: "Student", tags: ["student"] },
      { id: "working", label: "Working professional", tags: ["working"] },
      { id: "business", label: "Business owner", tags: ["business", "wl"] },
      { id: "sales", label: "Sales partner / freelancer", tags: ["sales"] },
    ],
  },
  {
    id: "field",
    question: "Which field interests you most?",
    choices: [
      { id: "ai", label: "AI & Technology", tags: ["ai", "cs"] },
      { id: "engineering", label: "Engineering", tags: ["engineering"] },
      { id: "healthcare", label: "Healthcare", tags: ["healthcare"] },
      { id: "management", label: "Management & Business", tags: ["management"] },
      { id: "marketing", label: "Marketing & Digital", tags: ["marketing"] },
    ],
  },
  {
    id: "goal",
    question: "What is your primary goal?",
    choices: [
      { id: "upskill", label: "Upskill in my current role", tags: ["upskill"] },
      { id: "switch", label: "Switch careers", tags: ["switch"] },
      { id: "grow", label: "Grow my business", tags: ["business", "wl"] },
      { id: "earn", label: "Earn as a sales partner", tags: ["sales"] },
      { id: "launch", label: "Launch my own brand", tags: ["wl"] },
    ],
  },
  {
    id: "time",
    question: "How much time can you invest weekly?",
    choices: [
      { id: "casual", label: "Under 3 hours", tags: ["casual"] },
      { id: "focused", label: "3–6 hours", tags: ["focused"] },
      { id: "serious", label: "6+ hours", tags: ["serious"] },
    ],
  },
  {
    id: "style",
    question: "How do you like to learn?",
    choices: [
      { id: "hands", label: "Hands-on projects", tags: ["hands"] },
      { id: "guided", label: "Structured mentor-led", tags: ["guided"] },
      { id: "self", label: "Self-paced with community", tags: ["self"] },
    ],
  },
  {
    id: "budget",
    question: "What is your investment style?",
    choices: [
      { id: "explore", label: "Just exploring", tags: ["explore"] },
      { id: "committed", label: "Ready to enroll", tags: ["committed"] },
      { id: "brand", label: "Investing in a brand launch", tags: ["wl"] },
    ],
  },
];

interface Recommendation {
  primary: { label: string; to: string; reason: string };
  extras: { label: string; to: string }[];
  paths: { label: string; to: string }[];
  blogs: { label: string; to: string }[];
  glossary: { label: string; to: string }[];
}

function recommend(tags: Set<string>): Recommendation {
  const has = (t: string) => tags.has(t);

  // Sales / WL routes short-circuit.
  if (has("sales")) {
    return {
      primary: {
        label: "Become a Sales Partner",
        to: "/earn",
        reason: "You're looking to earn from selling structured programs. Start with the partner model overview.",
      },
      extras: [
        { label: "70% Revenue Model", to: "/70-revenue-model" },
        { label: "50% Supported Model", to: "/50-supported-model" },
        { label: "Income Calculator", to: "/income-calculator" },
      ],
      paths: [{ label: "How the payout system works", to: "/payout-system" }],
      blogs: [{ label: "How Glintr partners earn", to: "/blog" }],
      glossary: [{ label: "Sales fundamentals", to: "/glossary" }],
    };
  }
  if (has("wl") || has("business")) {
    return {
      primary: {
        label: "Launch a White-Label EdTech Brand",
        to: "/launch-your-brand",
        reason: "You want to build a business around education. Start with the White-Label overview.",
      },
      extras: [
        { label: "Brand Setup", to: "/brand-setup" },
        { label: "LMS", to: "/lms" },
        { label: "Marketing Support", to: "/marketing-support" },
      ],
      paths: [{ label: "Book a brand consultation", to: "/book-consultation" }],
      blogs: [{ label: "White-Label playbook", to: "/blog" }],
      glossary: [{ label: "White-Label EdTech basics", to: "/glossary/white-label-edtech" }],
    };
  }

  if (has("ai") || has("cs")) {
    return {
      primary: {
        label: "AI & Generative AI Program",
        to: "/programs/computer-science/artificial-intelligence",
        reason: "You're drawn to AI. Start with the foundations program — it builds on ChatGPT, Claude and Gemini workflows.",
      },
      extras: [
        { label: "ChatGPT for Professionals", to: "/programs/computer-science/chatgpt" },
        { label: "Claude AI", to: "/programs/computer-science/claude-ai" },
        { label: "Gemini AI", to: "/programs/computer-science/gemini-ai" },
      ],
      paths: [{ label: "AI Foundations path", to: "/learning-paths" }],
      blogs: [{ label: "Reading list: AI careers", to: "/blog" }],
      glossary: [
        { label: "Artificial Intelligence", to: "/glossary/artificial-intelligence" },
        { label: "Generative AI", to: "/glossary/generative-ai" },
      ],
    };
  }
  if (has("engineering")) {
    return {
      primary: {
        label: "Engineering Programs",
        to: "/programs/electronics-electrical",
        reason: "You lean towards engineering. Explore VLSI, Embedded and Mechanical tracks.",
      },
      extras: [
        { label: "VLSI", to: "/programs/electronics-electrical" },
        { label: "Embedded Systems", to: "/programs/electronics-electrical" },
        { label: "Mechanical Engineering", to: "/programs/mechanical-engineering" },
      ],
      paths: [{ label: "VLSI learning path", to: "/learning-paths" }],
      blogs: [{ label: "Engineering guides", to: "/blog" }],
      glossary: [{ label: "VLSI", to: "/glossary/vlsi" }],
    };
  }
  if (has("healthcare")) {
    return {
      primary: {
        label: "Medical Coding",
        to: "/programs/management/medical-coding",
        reason: "Healthcare interest maps best to our Medical Coding program.",
      },
      extras: [{ label: "Related management tracks", to: "/programs/management" }],
      paths: [{ label: "Medical Coding path", to: "/learning-paths" }],
      blogs: [{ label: "Healthcare careers", to: "/blog" }],
      glossary: [{ label: "Medical Coding", to: "/glossary/medical-coding" }],
    };
  }
  if (has("marketing")) {
    return {
      primary: {
        label: "Digital Marketing",
        to: "/programs/management/digital-marketing",
        reason: "You want to build modern marketing skills — start with the Digital Marketing program.",
      },
      extras: [{ label: "Other management programs", to: "/programs/management" }],
      paths: [{ label: "Marketing path", to: "/learning-paths" }],
      blogs: [{ label: "Marketing guides", to: "/blog" }],
      glossary: [{ label: "Digital Marketing", to: "/glossary/digital-marketing" }],
    };
  }
  if (has("management")) {
    return {
      primary: {
        label: "Management Programs",
        to: "/programs/management",
        reason: "Explore the full Management program family.",
      },
      extras: [
        { label: "Finance", to: "/programs/management" },
        { label: "HR", to: "/programs/management" },
        { label: "Investment Banking", to: "/programs/management" },
      ],
      paths: [{ label: "Management pathways", to: "/learning-paths" }],
      blogs: [{ label: "Management guides", to: "/blog" }],
      glossary: [{ label: "Finance", to: "/glossary" }],
    };
  }

  return {
    primary: {
      label: "Browse all programs",
      to: "/programs",
      reason: "Start with the full program catalog. You can always come back and refine.",
    },
    extras: [{ label: "Talk to an advisor", to: "/book-consultation" }],
    paths: [{ label: "Learning paths", to: "/learning-paths" }],
    blogs: [{ label: "Glintr blog", to: "/blog" }],
    glossary: [{ label: "Glossary", to: "/glossary" }],
  };
}

export const Route = createFileRoute("/find-your-program")({
  head: () =>
    buildPageHead({
      title: "Find Your Best Program — Glintr",
      description:
        "A short guided quiz that recommends the right Glintr program, learning path, or partner opportunity based on your goals.",
      path: "/find-your-program",
      noindex: true,
    }),
  component: FindYourProgramPage,
});

function FindYourProgramPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const started = Object.keys(answers).length > 0;

  const tags = useMemo(() => {
    const s = new Set<string>();
    for (const q of QUESTIONS) {
      const chosen = answers[q.id];
      const c = q.choices.find((x) => x.id === chosen);
      c?.tags.forEach((t) => s.add(t));
    }
    return s;
  }, [answers]);

  const rec = useMemo(() => recommend(tags), [tags]);
  const q = QUESTIONS[step];
  const progress = Math.round(((step + (done ? 1 : 0)) / (QUESTIONS.length + 1)) * 100);

  function pick(choiceId: string) {
    if (!started) track("quiz_started");
    const next = { ...answers, [q.id]: choiceId };
    setAnswers(next);
    if (step + 1 < QUESTIONS.length) {
      setStep(step + 1);
    } else {
      setDone(true);
      track("quiz_completed", { answers: Object.values(next).join(",") });
      track("program_recommended", { to: recommend(new Set(Object.values(next).flatMap((v) => QUESTIONS.flatMap((qq) => qq.choices.find((c) => c.id === v)?.tags ?? [])))).primary.to });
    }
  }

  function reset() {
    setAnswers({});
    setStep(0);
    setDone(false);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <Section>
          <Container className="max-w-3xl">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Sparkles className="size-3 text-primary" /> Guided • ~60 seconds
              </span>
              <h1 className="mt-4 text-3xl font-black text-foreground md:text-5xl">
                Find your best program
              </h1>
              <p className="mt-3 text-sm text-muted-foreground md:text-base">
                Six short questions. We'll suggest a program, learning path, or partner track that
                fits your goals. No signup, no email required.
              </p>
            </div>

            <div className="mt-8 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
              <div
                className="h-full bg-gradient-brand transition-all duration-300"
                style={{ width: `${progress}%` }}
                aria-hidden
              />
            </div>

            {!done ? (
              <div className="mt-8 rounded-3xl border border-border bg-card p-6 md:p-8">
                <p className="text-label">
                  Question {step + 1} of {QUESTIONS.length}
                </p>
                <h2 className="mt-2 text-xl font-black text-foreground md:text-2xl">
                  {q.question}
                </h2>
                <div className="mt-6 grid gap-2">
                  {q.choices.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => pick(c.id)}
                      className={cn(
                        "flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition-colors",
                        answers[q.id] === c.id
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background hover:border-primary/40",
                      )}
                    >
                      <span className="text-sm font-semibold text-foreground">{c.label}</span>
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
                {step > 0 && (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="mt-6 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="size-3.5" /> Back
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-8 space-y-6">
                <div className="rounded-3xl border border-border bg-card p-6 md:p-8">
                  <p className="text-label">Recommended for you</p>
                  <h2 className="mt-2 text-2xl font-black text-foreground md:text-3xl">
                    {rec.primary.label}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">{rec.primary.reason}</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      to={rec.primary.to}
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-3 text-sm font-semibold text-primary-foreground"
                    >
                      Explore {rec.primary.label} <ArrowRight className="size-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={reset}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-3 text-xs font-semibold text-foreground hover:bg-accent"
                    >
                      <RefreshCw className="size-3.5" /> Restart
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <RecList title="Related programs" items={rec.extras} />
                  <RecList title="Learning paths" items={rec.paths} />
                  <RecList title="Reading" items={rec.blogs} />
                  <RecList title="Glossary" items={rec.glossary} />
                </div>

                <p className="text-center text-[11px] text-muted-foreground">
                  Recommendations are informational. Outcomes depend on your effort, program
                  eligibility and applicable terms.
                </p>
              </div>
            )}
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}

function RecList({ title, items }: { title: string; items: { label: string; to: string }[] }) {
  if (!items.length) return null;
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5">
      <p className="text-label">{title}</p>
      <ul className="mt-3 space-y-2">
        {items.map((i) => (
          <li key={i.label}>
            <Link
              to={i.to}
              className="inline-flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary"
            >
              {i.label} <ArrowRight className="size-3.5" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
