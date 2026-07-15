import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as React from "react";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Loader2,
  LogIn,
  MessageCircle,
  PlayCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Wrench,
  Zap,
} from "lucide-react";
import { z } from "zod";

import { Container, Section } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  sendStudentSupportMessage,
  sendStudentSupportMessageAuthed,
  getMyStudentSupportSnapshot,
  studentIntentLabel,
  isAccountSpecificStudentIntent,
  type StudentSupportIntent,
  type StudentSnapshot,
} from "@/lib/student-support/student-support.functions";
import {
  LearningIssuesSection,
  type LearningIssueLaunch,
} from "@/components/student-support/learning-issues";

const SearchSchema = z.object({
  intent: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/student-support")({
  head: () => ({
    meta: [
      { title: "Glintr Student Support — Learning, Progress & Certificates" },
      {
        name: "description",
        content:
          "AI-assisted Glintr Student Support for program access, enrollment, modules, lessons, learning progress, assessments and certificates.",
      },
      { property: "og:title", content: "Glintr Student Support" },
      {
        property: "og:description",
        content:
          "Get learning-focused help with your Glintr program access, My Learning, assessments and certificates.",
      },
      { property: "og:url", content: "https://glintr.com/student-support" },
    ],
    links: [{ rel: "canonical", href: "https://glintr.com/student-support" }],
  }),
  validateSearch: (raw) => SearchSchema.parse(raw ?? {}),
  component: StudentSupportPage,
});

type ChatMsg = { role: "user" | "assistant"; content: string };

type QuickStarter = {
  label: string;
  intent: StudentSupportIntent;
  question: string;
  icon: React.ComponentType<{ className?: string }>;
};

const QUICK_STARTERS: QuickStarter[] = [
  {
    label: "Program Access",
    intent: "program_access",
    question: "Where is my program?",
    icon: BookOpen,
  },
  {
    label: "Enrollment",
    intent: "enrollment",
    question: "How can I check my enrollment?",
    icon: GraduationCap,
  },
  {
    label: "My Learning",
    intent: "my_learning_navigation",
    question: "How do I open My Learning?",
    icon: PlayCircle,
  },
  {
    label: "Modules & Lessons",
    intent: "module_access",
    question: "How do modules and lessons work?",
    icon: BookOpen,
  },
  {
    label: "Learning Progress",
    intent: "learning_progress",
    question: "How is my learning progress tracked?",
    icon: Target,
  },
  {
    label: "Assessments",
    intent: "assessment_information",
    question: "How do assessments work?",
    icon: Zap,
  },
  {
    label: "Certificates",
    intent: "certificate_information",
    question: "How do certificates work?",
    icon: Trophy,
  },
  {
    label: "Technical Issue",
    intent: "learning_technical",
    question: "I'm facing a technical issue while learning.",
    icon: Wrench,
  },
  {
    label: "Something Else",
    intent: "unknown_student",
    question: "I have a Glintr learning question.",
    icon: Sparkles,
  },
];

const INITIAL_GREETING =
  "Hi, I'm Glintr AI Student Support.\n\nI can help you understand program access, enrollment, My Learning, modules, lessons, progress, assessments, certificates and common learning platform questions.\n\nWhat would you like help with?";

// Very light intent normalisation from free-text so short/misspelled
// questions still land on the right support context. Backend AI does the
// final grounding; this is only a UI-side hint.
const INTENT_HINTS: { intent: StudentSupportIntent; patterns: RegExp[] }[] = [
  {
    intent: "program_access",
    patterns: [
      /course\s*missing/i,
      /program\s*missing/i,
      /can'?t\s*see\s*(course|program)/i,
      /where\s*is\s*my\s*(course|program)/i,
      /paid.*(course|program).*(not|no)\s*show/i,
      /payment\s*done.*(no|not).*(course|program)/i,
    ],
  },
  {
    intent: "locked_module",
    patterns: [/mod(u)?l(e)?\s*lock/i, /module\s*locked/i, /next\s*module\s*not\s*open/i],
  },
  {
    intent: "lesson_access",
    patterns: [/lesson\s*(not\s*open|stuck|issue)/i, /can'?t\s*open\s*lesson/i],
  },
  {
    intent: "video_playback",
    patterns: [/video\s*(not\s*playing|issue|stuck|error)/i, /playback/i],
  },
  {
    intent: "progress_not_updating",
    patterns: [
      /progress\s*(stuck|not\s*update|same|not\s*updating)/i,
      /percentage\s*same/i,
    ],
  },
  {
    intent: "assessment_access",
    patterns: [
      /ass?ess?ment\s*(not\s*open|locked|start)/i,
      /can'?t\s*start\s*(test|assessment)/i,
    ],
  },
  {
    intent: "assessment_result",
    patterns: [
      /assessment\s*result/i,
      /result\s*(missing|not\s*show)/i,
    ],
  },
  {
    intent: "certificate_missing",
    patterns: [
      /cert(i)?f?icate\s*(missing|not\s*show)/i,
      /where\s*is\s*(my\s*)?certificate/i,
    ],
  },
];

function guessIntent(text: string): StudentSupportIntent | null {
  for (const hint of INTENT_HINTS) {
    if (hint.patterns.some((r) => r.test(text))) return hint.intent;
  }
  return null;
}

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

function StudentSupportPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/student-support" });
  const signedIn = useSignedIn();

  const [intent, setIntent] = React.useState<StudentSupportIntent | null>(
    (search.intent as StudentSupportIntent) ?? null,
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

  const sendPublic = useServerFn(sendStudentSupportMessage);
  const sendAuthed = useServerFn(sendStudentSupportMessageAuthed);
  const getSnapshot = useServerFn(getMyStudentSupportSnapshot);

  const snapshotQuery = useQuery({
    queryKey: ["student-support-snapshot", signedIn],
    queryFn: () => getSnapshot(),
    enabled: signedIn === true,
    staleTime: 60_000,
  });
  const snapshot = snapshotQuery.data as StudentSnapshot | undefined;

  const send = useMutation({
    mutationFn: async ({
      history,
      nextIntent,
    }: {
      history: ChatMsg[];
      nextIntent: StudentSupportIntent | null;
    }) => {
      const handoff = {
        supportIntent: nextIntent ?? undefined,
        originalQuestion: search.q ?? undefined,
        source: "student_support",
      };
      if (signedIn) {
        return sendAuthed({ data: { messages: history, handoff } });
      }
      return sendPublic({ data: { messages: history, handoff } });
    },
    onSuccess: (res: { reply: string }) => {
      setMessages((cur) => [...cur, { role: "assistant", content: res.reply }]);
      setErrorMsg(null);
    },
    onError: (err: Error) => {
      setErrorMsg(err.message || "Glintr AI Student Support is temporarily unavailable.");
    },
  });

  const isLoading = send.isPending;

  function handleSubmit(text: string) {
    const value = text.trim();
    if (!value || isLoading) return;

    const guessed = guessIntent(value);
    const nextIntent = guessed ?? intent;
    if (guessed && guessed !== intent) {
      setIntent(guessed);
      navigate({
        search: (p: Record<string, unknown>) => ({ ...p, intent: guessed }),
        replace: true,
      });
    }

    const next: ChatMsg[] = [...messages, { role: "user", content: value }];
    setMessages(next);
    setInput("");
    setErrorMsg(null);
    send.mutate({ history: next, nextIntent });
  }

  function handleStarter(s: QuickStarter) {
    setIntent(s.intent);
    navigate({
      search: (p: Record<string, unknown>) => ({ ...p, intent: s.intent }),
      replace: true,
    });
    const next: ChatMsg[] = [...messages, { role: "user", content: s.question }];
    setMessages(next);
    setErrorMsg(null);
    send.mutate({ history: next, nextIntent: s.intent });
  }

  function retryLast() {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    setErrorMsg(null);
    send.mutate({ history: messages, nextIntent: intent });
    void lastUser;
  }

  const accountSpecific = isAccountSpecificStudentIntent(intent);
  const showSignInPrompt =
    signedIn === false && accountSpecific && messages.some((m) => m.role === "user");

  const relatedQuestions = getRelatedQuestions(intent);
  const relatedLinks = getRelatedLinks(intent, signedIn);

  return (
    <div className="min-h-screen bg-background">
      {/* ============= HERO ============= */}
      <Section padding="lg" className="pt-16 pb-8">
        <Container>
          <div className="max-w-4xl">
            <Badge variant="outline" className="mb-4 uppercase tracking-widest text-[10px]">
              Glintr Student Support
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-balance">
              Stuck Somewhere In Your Learning Journey?
            </h1>
            <p className="mt-5 text-lg text-muted-foreground text-pretty max-w-2xl">
              Get AI-assisted help with program access, enrollment, learning modules, lessons,
              progress, assessments, certificates and your Glintr learning experience.
            </p>
            <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
              Start with Glintr AI Student Support for faster guidance. Questions that need account
              or human review can continue through the authorised support process.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" />
                AI Student Support
              </div>
              <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5 text-primary" />
                Read-only & account-safe
              </div>
              {signedIn === true && snapshot && snapshot.enrollmentCount > 0 && (
                <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary-soft/50 px-3 py-1.5 text-xs text-primary">
                  Signed in as a Glintr student
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => inputRef.current?.focus()}>
                Ask Glintr AI Student Support <MessageCircle className="ml-2 size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() =>
                  document
                    .getElementById("student-support-ai")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Explore Student Support Topics <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      {/* ============= AI SUPPORT EXPERIENCE ============= */}
      <Section padding="md" className="pt-4">
        <Container>
          <Card id="student-support-ai" className="overflow-hidden border-border">
            <div className="border-b border-border bg-muted/40 px-5 py-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid place-items-center size-9 rounded-full bg-primary/10 text-primary">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <div className="font-medium leading-none">Glintr AI Student Support</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {intent ? studentIntentLabel(intent) : "Learning-focused AI support"}
                  </div>
                </div>
              </div>
              {intent && (
                <Badge variant="muted" className="text-[10px] uppercase">
                  {studentIntentLabel(intent)}
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
                      ? "Checking your authorised learning information..."
                      : "Checking the relevant Glintr learning information..."}
                  </div>
                </div>
              )}
              {errorMsg && !isLoading && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">
                      {errorMsg.includes("busy")
                        ? "Unable To Send Your Student Support Question"
                        : "AI Student Support Is Temporarily Unavailable"}
                    </div>
                    <p className="mt-1 text-xs opacity-80">
                      Your question has been kept. You can retry, or explore Glintr learning
                      information below.
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={retryLast}>
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
                  QUICK STUDENT SUPPORT STARTERS
                </div>
                <div className="flex flex-wrap gap-2">
                  {QUICK_STARTERS.map((s) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.label}
                        onClick={() => handleStarter(s)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background hover:bg-primary-soft/40 hover:border-primary/40 px-3.5 py-1.5 text-xs transition"
                      >
                        <Icon className="size-3.5 text-primary" />
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sign-in prompt for account-specific questions */}
            {showSignInPrompt && (
              <div className="border-t border-border bg-primary-soft/30 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm">
                  <div className="font-medium">
                    Sign In Required For Student Account Information
                  </div>
                  <p className="text-muted-foreground text-xs mt-1 max-w-2xl">
                    I can explain general Glintr learning information, but your specific program
                    access, progress, assessment or certificate status requires authorised account
                    access.
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
                  placeholder="Ask about your Glintr learning journey..."
                  rows={2}
                  className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </Button>
              </form>
              <p className="mt-2 text-[11px] text-muted-foreground">
                AI-assisted responses grounded in approved Glintr learning information. Cannot
                change account records. Do not share OTPs, passwords, or payment PINs.
              </p>
            </div>
          </Card>

          {/* ============= GUIDED LEARNING ISSUES ============= */}
          <div className="mt-8">
            <LearningIssuesSection
              signedIn={signedIn}
              snapshot={snapshot}
              onAskAI={(launch: LearningIssueLaunch) => {
                setIntent(launch.intent as StudentSupportIntent);
                navigate({
                  search: (p: Record<string, unknown>) => ({
                    ...p,
                    intent: launch.intent,
                  }),
                  replace: true,
                });
                const q = launch.courseName
                  ? `${launch.question} (Program: ${launch.courseName})`
                  : launch.question;
                const next: ChatMsg[] = [
                  ...messages,
                  { role: "user", content: q },
                ];
                setMessages(next);
                setErrorMsg(null);
                send.mutate({
                  history: next,
                  nextIntent: launch.intent as StudentSupportIntent,
                });
                document
                  .getElementById("student-support-ai")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            />
          </div>


          {/* Related Glintr information + related student questions */}
          {(relatedLinks.length > 0 || relatedQuestions.length > 0) &&
            messages.some((m) => m.role === "user") && (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {relatedLinks.length > 0 && (
                  <Card className="p-5">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                      Related Glintr Information
                    </div>
                    <ul className="mt-3 space-y-2 text-sm">
                      {relatedLinks.map((r) => (
                        <li key={r.href}>
                          <Link
                            to={r.href}
                            className="inline-flex items-center gap-1.5 text-primary hover:underline"
                          >
                            {r.label} <ArrowRight className="size-3.5" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
                {relatedQuestions.length > 0 && (
                  <Card className="p-5">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                      You May Also Want To Ask
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {relatedQuestions.map((q) => (
                        <button
                          key={q}
                          onClick={() => handleSubmit(q)}
                          className="rounded-full border border-border bg-background hover:bg-primary-soft/40 hover:border-primary/40 px-3.5 py-1.5 text-xs transition text-left"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}
        </Container>
      </Section>
    </div>
  );
}

// ---- Related-content helpers (extended in 9A-2 / 9A-3) ----

function getRelatedQuestions(intent: StudentSupportIntent | null): string[] {
  switch (intent) {
    case "program_access":
    case "payment_and_access":
      return [
        "Where is My Learning?",
        "What is my enrollment status?",
        "Why is my program missing?",
      ];
    case "learning_progress":
    case "progress_not_updating":
      return [
        "How is progress calculated?",
        "Why is my lesson not complete?",
        "When does the next module unlock?",
      ];
    case "certificate_information":
    case "certificate_missing":
    case "certificate_eligibility":
    case "certificate_access":
      return [
        "When am I eligible for a certificate?",
        "Where can I view my certificate?",
        "What if my certificate is missing?",
      ];
    case "assessment_information":
    case "assessment_access":
    case "assessment_result":
      return [
        "How are assessments graded?",
        "How many attempts do I get?",
        "Where can I view my assessment result?",
      ];
    case "module_access":
    case "locked_module":
    case "lesson_access":
      return [
        "Why is a module locked?",
        "How do I complete a lesson?",
        "How does module unlock work?",
      ];
    default:
      return [
        "How does enrollment work?",
        "Where is My Learning?",
        "How do assessments work?",
      ];
  }
}

function getRelatedLinks(
  intent: StudentSupportIntent | null,
  signedIn: boolean | null,
): { label: string; href: string }[] {
  const links: { label: string; href: string }[] = [];
  if (signedIn) {
    links.push({ label: "Open My Learning", href: "/student/programs" });
    links.push({ label: "Student Dashboard", href: "/student/dashboard" });
    if (
      intent === "certificate_information" ||
      intent === "certificate_missing" ||
      intent === "certificate_access" ||
      intent === "certificate_eligibility"
    ) {
      links.push({ label: "My Certificates", href: "/student/certificates" });
    }
    if (
      intent === "assessment_information" ||
      intent === "assessment_access" ||
      intent === "assessment_result"
    ) {
      links.push({ label: "My Assessments", href: "/student/assessments" });
    }
  } else {
    links.push({ label: "Explore Programs", href: "/programs" });
    links.push({ label: "Sign In To Your Student Account", href: "/auth" });
  }
  links.push({ label: "Glintr FAQs", href: "/faqs" });
  return links;
}

