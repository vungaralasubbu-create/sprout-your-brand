import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles, Brain, Megaphone, Search, FileText, PenTool, Users, GraduationCap,
  Palette, Globe, Rocket, Activity, CheckCircle2, Clock, AlertCircle, Play,
  TrendingUp, Zap, Send, Calendar, Award, Image as ImageIcon, ArrowRight
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/partner/ai-os")({
  head: () => ({
    meta: [
      { title: "Glintr AI OS — Your AI Company" },
      { name: "description", content: "AI employees running your business 24/7 inside the partner dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AIOSPage,
});

type AgentStatus = "running" | "completed" | "waiting" | "approval";
type Agent = {
  slug: string;
  name: string;
  role: string;
  icon: React.ComponentType<{ className?: string }>;
  status: AgentStatus;
  task: string;
  progress: number;
  accent: string;
};

const AGENTS: Agent[] = [
  { slug: "ceo", name: "CEO Agent", role: "Business strategy & growth planning", icon: Brain, status: "running", task: "Drafting Q1 growth plan", progress: 62, accent: "from-violet-500/20 to-fuchsia-500/10" },
  { slug: "marketing", name: "Marketing Agent", role: "Campaigns, posters, email", icon: Megaphone, status: "running", task: "Building Diwali campaign", progress: 41, accent: "from-rose-500/20 to-orange-500/10" },
  { slug: "seo", name: "SEO Agent", role: "Keywords, meta, schema", icon: Search, status: "running", task: "Optimizing 14 landing pages", progress: 78, accent: "from-emerald-500/20 to-teal-500/10" },
  { slug: "blog", name: "Blog Agent", role: "Articles & topic clusters", icon: FileText, status: "approval", task: "3 articles awaiting review", progress: 100, accent: "from-sky-500/20 to-cyan-500/10" },
  { slug: "sales", name: "Sales Agent", role: "Lead replies & follow-ups", icon: PenTool, status: "running", task: "Replying to 8 WhatsApp leads", progress: 55, accent: "from-lime-500/20 to-emerald-500/10" },
  { slug: "social", name: "Social Media Agent", role: "IG, LinkedIn, FB posts", icon: Send, status: "completed", task: "Generated 8 Instagram posts", progress: 100, accent: "from-pink-500/20 to-rose-500/10" },
  { slug: "interview", name: "Interview Agent", role: "Interview prep & resume review", icon: Users, status: "waiting", task: "Idle — no requests", progress: 0, accent: "from-indigo-500/20 to-blue-500/10" },
  { slug: "course", name: "Course Agent", role: "Curriculum & projects", icon: GraduationCap, status: "running", task: "Building AI course v2", progress: 34, accent: "from-amber-500/20 to-yellow-500/10" },
  { slug: "design", name: "Design Agent", role: "Posters, certificates, ads", icon: Palette, status: "completed", task: "Created 6 posters", progress: 100, accent: "from-fuchsia-500/20 to-purple-500/10" },
  { slug: "website", name: "Website Agent", role: "UI fixes & responsiveness", icon: Globe, status: "approval", task: "Homepage revamp ready", progress: 100, accent: "from-cyan-500/20 to-sky-500/10" },
  { slug: "career", name: "Career Agent", role: "Internship pages & guidance", icon: Rocket, status: "running", task: "Creating internship page", progress: 22, accent: "from-orange-500/20 to-red-500/10" },
];

const ACTIVITY = [
  { t: "2 min ago", icon: Send, text: "Social Agent generated 8 Instagram posts" },
  { t: "8 min ago", icon: FileText, text: "Blog Agent published 3 articles" },
  { t: "14 min ago", icon: Search, text: "SEO Agent improved score from 72 → 88" },
  { t: "22 min ago", icon: Globe, text: "Website Agent generated 2 landing pages" },
  { t: "31 min ago", icon: Award, text: "Design Agent created internship certificate" },
  { t: "48 min ago", icon: AlertCircle, text: "SEO Agent found 4 broken links" },
  { t: "1 hr ago", icon: Globe, text: "Website Agent updated homepage hero" },
  { t: "2 hr ago", icon: GraduationCap, text: "Course Agent generated new AI course draft" },
];

const HEALTH = [
  { label: "Traffic", score: 82 }, { label: "SEO", score: 88 },
  { label: "Sales", score: 74 }, { label: "Brand", score: 79 },
  { label: "Students", score: 66 }, { label: "Reviews", score: 91 },
  { label: "Content", score: 84 }, { label: "Social Media", score: 71 },
  { label: "Certificates", score: 95 }, { label: "Website", score: 86 },
];

const AUTOMATIONS = [
  { id: "mon-blog", label: "Every Monday publish blog", desc: "Blog Agent writes and schedules a new article each Monday 9 AM.", defaultOn: true },
  { id: "daily-seo", label: "Daily SEO check", desc: "SEO Agent audits meta, schema and broken links every night.", defaultOn: true },
  { id: "weekly-ig", label: "Weekly Instagram posts", desc: "Social Agent generates 5 posts every Sunday.", defaultOn: false },
  { id: "monthly-brochure", label: "Monthly brochure update", desc: "Marketing Agent refreshes brochures the 1st of every month.", defaultOn: false },
  { id: "weekly-lp", label: "Weekly landing page optimization", desc: "Website + SEO Agents optimize top pages weekly.", defaultOn: true },
];

const QUICK_PROMPTS = [
  "Create 20 Instagram posts", "Build AI course", "Generate landing page",
  "Create brochure", "Run SEO audit", "Design posters", "Generate webinar",
  "Create WhatsApp campaign",
];

function statusMeta(s: AgentStatus) {
  switch (s) {
    case "running": return { label: "Running", dot: "bg-emerald-500 animate-pulse", chip: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" };
    case "completed": return { label: "Completed", dot: "bg-sky-500", chip: "bg-sky-500/10 text-sky-700 border-sky-500/20" };
    case "waiting": return { label: "Waiting", dot: "bg-slate-400", chip: "bg-slate-500/10 text-slate-600 border-slate-500/20" };
    case "approval": return { label: "Needs Approval", dot: "bg-amber-500 animate-pulse", chip: "bg-amber-500/10 text-amber-700 border-amber-500/20" };
  }
}

function AIOSPage() {
  const [prompt, setPrompt] = useState("");
  const [routed, setRouted] = useState<{ agent: string; task: string } | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3500);
    return () => clearInterval(id);
  }, []);

  const liveAgents = useMemo(() => {
    return AGENTS.map((a, i) => {
      if (a.status !== "running") return a;
      const delta = ((tick + i) % 5) - 2;
      const p = Math.max(5, Math.min(98, a.progress + delta));
      return { ...a, progress: p };
    });
  }, [tick]);

  const overallHealth = Math.round(HEALTH.reduce((s, h) => s + h.score, 0) / HEALTH.length);

  function routePrompt(text: string) {
    const t = text.toLowerCase();
    let agent = "CEO Agent";
    if (/instagram|post|social|reel|linkedin|facebook/.test(t)) agent = "Social Media Agent";
    else if (/blog|article|topic/.test(t)) agent = "Blog Agent";
    else if (/course|curriculum|module|lesson/.test(t)) agent = "Course Agent";
    else if (/landing|website|page|ui|homepage/.test(t)) agent = "Website Agent";
    else if (/brochure|poster|design|banner|thumbnail|ad|certificate/.test(t)) agent = "Design Agent";
    else if (/seo|keyword|meta|schema|rank/.test(t)) agent = "SEO Agent";
    else if (/lead|whatsapp|follow[- ]?up|reply|sales/.test(t)) agent = "Sales Agent";
    else if (/webinar|campaign|email|marketing/.test(t)) agent = "Marketing Agent";
    else if (/resume|interview|career|internship/.test(t)) agent = "Career Agent";
    setRouted({ agent, task: text });
    setPrompt("");
  }

  const counts = {
    running: liveAgents.filter((a) => a.status === "running").length,
    approval: liveAgents.filter((a) => a.status === "approval").length,
    completed: liveAgents.filter((a) => a.status === "completed").length,
  };

  return (
    <PartnerShell>
      <div className="space-y-8 pb-16">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-8 text-white">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-fuchsia-400/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <Badge className="mb-3 border-cyan-300/30 bg-cyan-400/10 text-cyan-200">Glintr AI OS</Badge>
              <h1 className="text-3xl font-semibold md:text-4xl">Your AI company is working right now.</h1>
              <p className="mt-2 max-w-2xl text-white/70">
                {counts.running} agents running · {counts.approval} awaiting your approval · {counts.completed} tasks completed today.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <StatChip label="Running" value={counts.running} accent="text-emerald-300" />
              <StatChip label="Approval" value={counts.approval} accent="text-amber-300" />
              <StatChip label="Health" value={`${overallHealth}%`} accent="text-cyan-300" />
            </div>
          </div>
        </section>

        {/* Ask AI */}
        <section>
          <Card className="border-slate-200/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-indigo-500" /> Ask your AI company
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && prompt.trim()) routePrompt(prompt.trim()); }}
                  placeholder="Tell your team what to do — e.g. Create 20 Instagram posts for our new AI course"
                  className="h-11"
                />
                <Button onClick={() => prompt.trim() && routePrompt(prompt.trim())} className="h-11 gap-2">
                  <Send className="h-4 w-4" /> Assign
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q}
                    onClick={() => routePrompt(q)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                  >{q}</button>
                ))}
              </div>
              {routed && (
                <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Routed to <strong>{routed.agent}</strong>: “{routed.task}”</span>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Command Center — Live Agents */}
        <section className="space-y-3">
          <SectionHeader icon={Activity} title="AI Command Center" subtitle="Live view of every AI worker in your company" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {liveAgents.map((a) => {
              const meta = statusMeta(a.status);
              const Icon = a.icon;
              return (
                <Card key={a.slug} className="relative overflow-hidden border-slate-200/60 transition hover:shadow-md">
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${a.accent} opacity-60`} />
                  <CardContent className="relative space-y-3 p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 shadow-sm ring-1 ring-slate-200">
                          <Icon className="h-5 w-5 text-slate-700" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{a.name}</div>
                          <div className="text-xs text-slate-600">{a.role}</div>
                        </div>
                      </div>
                      <Badge variant="outline" className={`gap-1.5 ${meta.chip}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />{meta.label}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-700">{a.task}</div>
                    {a.status === "running" && <Progress value={a.progress} className="h-1.5" />}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-slate-500">{a.status === "running" ? `${a.progress}%` : ""}</span>
                      <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs text-slate-700 hover:text-indigo-700">
                        {a.status === "approval" ? "Review" : a.status === "waiting" ? "Wake up" : "Open"} <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Daily report + Activity feed */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="border-slate-200/60 lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4 text-indigo-500" /> Today's Work
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Kpi label="Blogs Created" value="3" trend="+2" />
              <Kpi label="SEO Tasks" value="14" trend="+6" />
              <Kpi label="Leads Answered" value="28" trend="+11" />
              <Kpi label="Revenue" value="₹42,900" trend="+18%" />
              <Kpi label="New Visitors" value="1,204" trend="+9%" />
              <Kpi label="Social Posts" value="8" trend="ready" />
              <Kpi label="Pending Approvals" value="4" trend="review" />
              <Kpi label="Certificates" value="12" trend="issued" />
            </CardContent>
          </Card>

          <Card className="border-slate-200/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-4 w-4 text-amber-500" /> Live Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ACTIVITY.map((a, i) => {
                const Icon = a.icon;
                return (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <Icon className="h-3.5 w-3.5 text-slate-600" />
                    </div>
                    <div>
                      <div className="text-slate-800">{a.text}</div>
                      <div className="text-xs text-slate-500">{a.t}</div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>

        {/* Automations */}
        <section className="space-y-3">
          <SectionHeader icon={Play} title="One-click Automations" subtitle="Set it once — your AI employees keep running" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {AUTOMATIONS.map((a) => <AutomationRow key={a.id} item={a} />)}
          </div>
        </section>

        {/* Business Health */}
        <section className="space-y-3">
          <SectionHeader icon={TrendingUp} title="Business Health Score" subtitle={`Overall ${overallHealth}/100 — AI recommendations below`} />
          <Card className="border-slate-200/60">
            <CardContent className="p-6">
              <div className="mb-6 flex items-center gap-6">
                <div className="relative h-28 w-28 shrink-0">
                  <svg viewBox="0 0 36 36" className="h-28 w-28 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none" strokeWidth="3" strokeLinecap="round"
                      stroke="url(#g)" strokeDasharray={`${overallHealth}, 100`}
                    />
                    <defs>
                      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#a3e635" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-2xl font-semibold text-slate-900">{overallHealth}</div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">out of 100</div>
                  </div>
                </div>
                <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-5">
                  {HEALTH.map((h) => (
                    <div key={h.label}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">{h.label}</span>
                        <span className="font-medium text-slate-900">{h.score}</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-lime-400" style={{ width: `${h.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Separator className="mb-4" />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Recommendation icon={FileText} title="Publish 4 more blogs" desc="Content score is 84 — 4 more articles this month gets you to 92." />
                <Recommendation icon={Send} title="Grow Instagram presence" desc="Social score 71 — approve pending 8 posts to gain +12 points." />
                <Recommendation icon={Users} title="Boost student engagement" desc="Students score 66 — trigger the Career Agent's onboarding flow." />
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </PartnerShell>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ComponentType<{ className?: string }>; title: string; subtitle: string }) {
  return (
    <div className="flex items-end justify-between">
      <div>
        <div className="flex items-center gap-2 text-sm font-medium text-indigo-600">
          <Icon className="h-4 w-4" /> {title}
        </div>
        <div className="text-xs text-slate-500">{subtitle}</div>
      </div>
    </div>
  );
}

function StatChip({ label, value, accent }: { label: string; value: number | string; accent: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
      <div className={`text-xl font-semibold ${accent}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-white/60">{label}</div>
    </div>
  );
}

function Kpi({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-900">{value}</div>
      <div className="text-[10px] text-emerald-600">{trend}</div>
    </div>
  );
}

function AutomationRow({ item }: { item: { id: string; label: string; desc: string; defaultOn: boolean } }) {
  const [on, setOn] = useState(item.defaultOn);
  return (
    <Card className="border-slate-200/60">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div>
          <div className="flex items-center gap-2 font-medium text-slate-900">
            <Clock className="h-4 w-4 text-indigo-500" /> {item.label}
          </div>
          <div className="mt-1 text-sm text-slate-600">{item.desc}</div>
        </div>
        <Switch checked={on} onCheckedChange={setOn} />
      </CardContent>
    </Card>
  );
}

function Recommendation({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm">
        <Icon className="h-4 w-4 text-indigo-600" />
      </div>
      <div>
        <div className="text-sm font-medium text-slate-900">{title}</div>
        <div className="text-xs text-slate-600">{desc}</div>
      </div>
    </div>
  );
}
