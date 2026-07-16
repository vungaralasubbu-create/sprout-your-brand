import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  Check,
  ArrowRight,
  Palette,
  Globe,
  BookOpen,
  Megaphone,
  Search,
  ShieldCheck,
  Mail,
  Award,
  Users,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AcademyGate } from "@/components/partner/academy-gate";

export const Route = createFileRoute("/_authenticated/partner/academy/onboarding")({
  head: () => ({
    meta: [
      { title: "Launch My Academy — Glintr Managed" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AcademyGate>
      <OnboardingChat />
    </AcademyGate>
  ),
});

const STORAGE_KEY = "glintr.partner.academy.onboarding.v1";

type QKey =
  | "name"
  | "subjects"
  | "audience"
  | "country"
  | "hasContent"
  | "helpContent"
  | "helpMarketing"
  | "helpBlogs";

type Question = {
  key: QKey;
  prompt: string;
  placeholder?: string;
  quickReplies?: string[];
  type?: "text" | "choice";
};

const QUESTIONS: Question[] = [
  { key: "name", prompt: "First things first — what should your academy be called?", placeholder: "e.g. Northstar Sales Academy" },
  { key: "subjects", prompt: "What subjects will you teach? (You can list a few.)", placeholder: "e.g. B2B Sales, Prospecting, Negotiation" },
  { key: "audience", prompt: "Who are your ideal students?", placeholder: "e.g. Working sales professionals in India" },
  { key: "country", prompt: "Which country are you targeting first?", placeholder: "e.g. India, UAE, Global" },
  { key: "hasContent", prompt: "Do you already have course content ready?", type: "choice", quickReplies: ["Yes, some drafts", "No, starting fresh", "Just an outline"] },
  { key: "helpContent", prompt: "Would you like Glintr to help create your course materials?", type: "choice", quickReplies: ["Yes, please", "I'll write my own", "Mix — help me where needed"] },
  { key: "helpMarketing", prompt: "Would you like Glintr to manage your marketing?", type: "choice", quickReplies: ["Yes — run everything", "Just social", "I'll handle marketing"] },
  { key: "helpBlogs", prompt: "Would you like Glintr to publish blogs regularly?", type: "choice", quickReplies: ["Yes — weekly", "Occasionally", "Not yet"] },
];

type ChatMsg = { role: "ai" | "user"; text: string };
type Answers = Partial<Record<QKey, string>>;

const SILENT_TASKS = [
  { key: "brand", label: "Brand identity", icon: Palette },
  { key: "logo", label: "Logo studio", icon: Sparkles },
  { key: "website", label: "Website pages", icon: Globe },
  { key: "programs", label: "Program pages", icon: BookOpen },
  { key: "courses", label: "Course pages", icon: BookOpen },
  { key: "blogs", label: "Blog engine", icon: Megaphone },
  { key: "marketing", label: "Marketing assets", icon: Megaphone },
  { key: "seo", label: "SEO foundation", icon: Search },
  { key: "kb", label: "Knowledge base", icon: BookOpen },
  { key: "certs", label: "Certificates", icon: Award },
  { key: "portal", label: "Student portal", icon: Users },
  { key: "crm", label: "CRM & leads", icon: ShieldCheck },
  { key: "emails", label: "Email templates", icon: Mail },
  { key: "landing", label: "Landing pages", icon: Globe },
] as const;

type TaskStatus = "queued" | "working" | "ready";

function OnboardingChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "ai", text: "Welcome. I'm your Glintr onboarding lead — I'll get your academy live while you answer a few quick questions." },
    { role: "ai", text: QUESTIONS[0].prompt },
  ]);
  const [answers, setAnswers] = useState<Answers>({});
  const [step, setStep] = useState(0);
  const [input, setInput] = useState("");
  const [taskStatus, setTaskStatus] = useState<Record<string, TaskStatus>>(() =>
    Object.fromEntries(SILENT_TASKS.map((t) => [t.key, "queued"])),
  );
  const [done, setDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.done) setDone(true);
        if (parsed?.answers) setAnswers(parsed.answers);
      }
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const current = QUESTIONS[step];

  function markTaskProgress() {
    // Each answer flips 1–2 tasks from queued -> working, and previous working -> ready.
    setTaskStatus((prev) => {
      const next = { ...prev };
      // Advance any "working" to "ready".
      for (const k of Object.keys(next)) if (next[k] === "working") next[k] = "ready";
      // Kick off the next 2 queued tasks.
      const queued = SILENT_TASKS.map((t) => t.key).filter((k) => next[k] === "queued");
      queued.slice(0, 2).forEach((k) => (next[k] = "working"));
      return next;
    });
  }

  function handleSend(text: string) {
    if (!text.trim() || !current) return;
    const value = text.trim();
    setMessages((m) => [...m, { role: "user", text: value }]);
    const newAnswers = { ...answers, [current.key]: value };
    setAnswers(newAnswers);
    setInput("");
    markTaskProgress();

    const nextStep = step + 1;
    setTimeout(() => {
      if (nextStep >= QUESTIONS.length) {
        // Finish — flip remaining tasks to ready.
        setTaskStatus((prev) => Object.fromEntries(Object.keys(prev).map((k) => [k, "ready" as TaskStatus])));
        setMessages((m) => [
          ...m,
          { role: "ai", text: "That's everything I need. Your Glintr operations team is finishing the setup right now." },
          { role: "ai", text: "You'll find your live progress, drafts, and daily briefing in your Academy Workspace." },
        ]);
        setDone(true);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers: newAnswers, done: true, ts: Date.now() })); } catch { /* noop */ }
      } else {
        setStep(nextStep);
        setMessages((m) => [...m, { role: "ai", text: QUESTIONS[nextStep].prompt }]);
      }
    }, 500);
  }

  const progressPct = Math.round((Math.min(step, QUESTIONS.length) / QUESTIONS.length) * 100);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Chat column */}
        <div className="rounded-3xl border bg-white overflow-hidden flex flex-col min-h-[70vh]">
          <div className="px-5 sm:px-7 py-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="inline-flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </div>
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Glintr Onboarding</div>
                <div className="font-display font-semibold tracking-tight">Launch My Academy</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">{progressPct}%</div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 sm:px-7 py-6 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[80%] rounded-2xl rounded-br-md bg-primary text-primary-foreground px-4 py-2 text-sm"
                      : "max-w-[80%] rounded-2xl rounded-bl-md bg-slate-100 text-slate-900 px-4 py-2 text-sm"
                  }
                >
                  {m.text}
                </div>
              </div>
            ))}
            {done && (
              <div className="pt-4">
                <Button onClick={() => navigate({ to: "/partner/academy/workspace" })} className="gap-2">
                  Open my Academy Workspace <ArrowRight className="size-4" />
                </Button>
              </div>
            )}
          </div>

          {!done && current && (
            <div className="border-t px-5 sm:px-7 py-4 space-y-3">
              {current.quickReplies && (
                <div className="flex flex-wrap gap-2">
                  {current.quickReplies.map((qr) => (
                    <button
                      key={qr}
                      onClick={() => handleSend(qr)}
                      className="text-xs rounded-full border px-3 py-1.5 hover:bg-slate-50 transition"
                    >
                      {qr}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
                  placeholder={current.placeholder ?? "Type your answer…"}
                  className="flex-1 rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  autoFocus
                />
                <Button onClick={() => handleSend(input)} disabled={!input.trim()} className="gap-1.5">
                  <Send className="size-4" /> Send
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Silent AI workers column */}
        <aside className="space-y-4">
          <div className="rounded-2xl border bg-white p-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-2">Glintr AI is building</div>
            <div className="text-sm text-muted-foreground mb-4">
              Your operations team is provisioning everything in the background while you answer.
            </div>
            <ul className="space-y-2">
              {SILENT_TASKS.map((t) => {
                const s = taskStatus[t.key];
                return (
                  <li key={t.key} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <t.icon className="size-3.5 text-muted-foreground" />
                      <span>{t.label}</span>
                    </div>
                    <span className="text-xs">
                      {s === "ready" && <span className="inline-flex items-center gap-1 text-emerald-600"><Check className="size-3.5" /> Ready</span>}
                      {s === "working" && <span className="inline-flex items-center gap-1 text-primary"><Loader2 className="size-3.5 animate-spin" /> Building</span>}
                      {s === "queued" && <span className="text-muted-foreground">Queued</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="rounded-2xl border bg-gradient-to-br from-primary/5 to-emerald-50 p-5 text-sm">
            <div className="font-medium mb-1">Nothing goes live automatically</div>
            <p className="text-muted-foreground">
              Every asset stays in draft in your workspace. You (or a Glintr admin) approve before anything is published.
            </p>
          </div>
          {done && (
            <Link to="/partner/academy/workspace" className="block rounded-2xl border bg-white p-5 text-sm hover:border-primary/40">
              <div className="flex items-center gap-2 font-medium">
                <LayoutDashboard className="size-4" /> Go to workspace
              </div>
              <p className="text-muted-foreground mt-1">Review drafts, daily briefing, and Managed Services.</p>
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}
