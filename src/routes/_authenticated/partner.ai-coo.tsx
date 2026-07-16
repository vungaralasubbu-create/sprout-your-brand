import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  Circle,
  ArrowRight,
  Clock,
  Bell,
  Bot,
  TrendingUp,
  AlertTriangle,
  Rocket,
  RefreshCcw,
  FileText,
  ShieldCheck,
  Target,
  ThumbsUp,
} from "lucide-react";
import { AcademyGate } from "@/components/partner/academy-gate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  generateBriefing,
  readActionState,
  writeActionState,
  toneClass,
  statusDot,
  type ActionStatus,
  type CooBriefing,
  type Recommendation,
} from "@/lib/partner/ai-coo";

export const Route = createFileRoute("/_authenticated/partner/ai-coo")({
  head: () => ({
    meta: [
      { title: "AI COO — Command Center | Glintr" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AcademyGate>
      <AICooPage />
    </AcademyGate>
  ),
});

function AICooPage() {
  const [briefing, setBriefing] = useState<CooBriefing | null>(null);
  const [actions, setActions] = useState<Record<string, ActionStatus>>({});
  const [tab, setTab] = useState<"actions" | "website" | "seo" | "courses" | "marketing" | "leads" | "students" | "finance" | "reports" | "notifications">("actions");

  useEffect(() => {
    setBriefing(generateBriefing());
    setActions(readActionState());
  }, []);

  function setStatus(id: string, s: ActionStatus) {
    const next = { ...actions, [id]: s };
    setActions(next);
    writeActionState(next);
  }

  function refresh() {
    setBriefing(generateBriefing());
  }

  if (!briefing) {
    return (
      <div className="max-w-6xl mx-auto p-6 sm:p-10">
        <div className="animate-pulse rounded-3xl bg-muted h-64" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 space-y-8">
      <Header briefing={briefing} onRefresh={refresh} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ScoreCard briefing={briefing} />
        <PrioritiesCard briefing={briefing} actions={actions} setStatus={setStatus} />
      </div>

      <HealthGrid briefing={briefing} />

      <Tabs tab={tab} setTab={setTab} pending={Object.values(actions).filter(v => v === "pending").length} notif={briefing.notifications.length} />

      {tab === "actions" && <ActionCenter briefing={briefing} actions={actions} setStatus={setStatus} />}
      {tab === "website" && <ChecksList title="Website Analysis" items={briefing.websiteChecks} />}
      {tab === "seo" && <ChecksList title="SEO Analysis" items={briefing.seoChecks} />}
      {tab === "courses" && <CourseAnalysis briefing={briefing} />}
      {tab === "marketing" && <ChecksList title="Marketing Analysis" items={briefing.marketingChannels} />}
      {tab === "leads" && <LeadsPanel briefing={briefing} />}
      {tab === "students" && <StudentsPanel briefing={briefing} />}
      {tab === "finance" && <FinancePanel briefing={briefing} />}
      {tab === "reports" && <ReportsPanel briefing={briefing} />}
      {tab === "notifications" && <NotificationsPanel briefing={briefing} />}

      <Footer />
    </div>
  );
}

function Header({ briefing, onRefresh }: { briefing: CooBriefing; onRefresh: () => void }) {
  const time = new Date(briefing.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="rounded-3xl border bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="flex items-start gap-4">
          <div className="size-12 rounded-2xl bg-white/10 grid place-items-center">
            <Bot className="size-6 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-cyan-300/80 mb-1">
              <Sparkles className="size-3.5" /> AI COO · Command Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold">Good morning — here's what to work on today.</h1>
            <p className="text-white/70 mt-1 text-sm">Continuously analyzing <span className="text-white font-medium">{briefing.academyName}</span> · Last refreshed {time}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="muted" size="sm" onClick={onRefresh} className="bg-white/10 hover:bg-white/20 text-white border-0">
            <RefreshCcw className="size-4 mr-2" /> Refresh briefing
          </Button>
          <Link to="/partner/academy/workspace">
            <Button size="sm" className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
              Workspace <ArrowRight className="size-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ briefing }: { briefing: CooBriefing }) {
  const s = briefing.businessScore;
  const ring =
    s >= 88 ? "text-emerald-500" : s >= 75 ? "text-sky-500" : s >= 60 ? "text-amber-500" : "text-rose-500";
  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground mb-4">
        <ShieldCheck className="size-3.5" /> Business Health Score
      </div>
      <div className="flex items-center gap-6">
        <div className="relative">
          <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/30" />
            <circle
              cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round"
              className={ring}
              strokeDasharray={`${(s / 100) * 2 * Math.PI * 52} ${2 * Math.PI * 52}`}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="text-3xl font-bold">{s}</div>
              <div className="text-xs text-muted-foreground">/ 100</div>
            </div>
          </div>
        </div>
        <div className="flex-1">
          <Badge className="mb-2" variant="muted">{briefing.scoreLabel}</Badge>
          <p className="text-sm text-slate-700 leading-relaxed">{briefing.scoreNarrative}</p>
        </div>
      </div>
    </div>
  );
}

function PrioritiesCard({ briefing, actions, setStatus }: { briefing: CooBriefing; actions: Record<string, ActionStatus>; setStatus: (id: string, s: ActionStatus) => void }) {
  return (
    <div className="lg:col-span-2 rounded-3xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          <Target className="size-3.5" /> Today's Top 5 Priorities
        </div>
        <span className="text-xs text-muted-foreground">Est. total ≈ {briefing.priorities.reduce((s, p) => s + p.minutes, 0)} min</span>
      </div>
      <ul className="space-y-2.5">
        {briefing.priorities.map((p, i) => {
          const st = actions[p.id];
          const done = st === "approved";
          return (
            <li key={p.id} className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${done ? "bg-emerald-50/50 border-emerald-200" : "bg-slate-50 border-slate-200"}`}>
              <button onClick={() => setStatus(p.id, done ? "pending" : "approved")} className="mt-0.5 shrink-0" aria-label="Toggle done">
                {done ? <CheckCircle2 className="size-5 text-emerald-600" /> : <Circle className="size-5 text-slate-400" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${done ? "line-through text-slate-500" : "text-slate-900"}`}>{i + 1}. {p.title}</div>
                <div className="text-xs text-slate-600 mt-0.5">{p.detail}</div>
              </div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-1 shrink-0">
                <Clock className="size-3" /> {p.minutes}m
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function HealthGrid({ briefing }: { briefing: CooBriefing }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground mb-3">
        <TrendingUp className="size-3.5" /> Domain health · why each score exists · how to improve
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {briefing.cards.map((c) => (
          <div key={c.key} className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <c.icon className="size-4 text-slate-600" /> {c.label}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${toneClass(c.tone)}`}>{c.score}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-2">{c.why}</p>
            <details className="text-xs">
              <summary className="cursor-pointer text-slate-500 hover:text-slate-800">How to improve</summary>
              <ul className="mt-1.5 space-y-1 pl-4 list-disc text-slate-600">
                {c.improve.map((x, i) => <li key={i}>{x}</li>)}
              </ul>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}

function Tabs({ tab, setTab, pending, notif }: {
  tab: string;
  setTab: (t: "actions" | "website" | "seo" | "courses" | "marketing" | "leads" | "students" | "finance" | "reports" | "notifications") => void;
  pending: number;
  notif: number;
}) {
  const items: { key: Parameters<typeof setTab>[0]; label: string; badge?: number }[] = [
    { key: "actions", label: "AI Action Center", badge: pending || undefined },
    { key: "website", label: "Website" },
    { key: "seo", label: "SEO" },
    { key: "courses", label: "Courses" },
    { key: "marketing", label: "Marketing" },
    { key: "leads", label: "Leads" },
    { key: "students", label: "Students" },
    { key: "finance", label: "Finance" },
    { key: "reports", label: "Reports" },
    { key: "notifications", label: "Alerts", badge: notif || undefined },
  ];
  return (
    <div className="flex flex-wrap gap-1.5 border-b pb-2">
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => setTab(it.key)}
          className={`px-3 py-1.5 rounded-full text-sm border transition ${tab === it.key ? "bg-slate-900 text-white border-slate-900" : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"}`}
        >
          {it.label}{it.badge ? <span className="ml-1.5 text-[10px] bg-cyan-500/20 text-cyan-700 px-1.5 py-0.5 rounded-full">{it.badge}</span> : null}
        </button>
      ))}
    </div>
  );
}

function ActionCenter({ briefing, actions, setStatus }: { briefing: CooBriefing; actions: Record<string, ActionStatus>; setStatus: (id: string, s: ActionStatus) => void }) {
  const filtered = useMemo(() => briefing.recommendations, [briefing]);
  const impactTone = (i: Recommendation["impact"]) =>
    i === "High" ? "bg-rose-50 text-rose-700 border-rose-200" :
    i === "Medium" ? "bg-amber-50 text-amber-800 border-amber-200" :
    "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <Rocket className="size-3.5" /> AI Recommendations · nothing publishes without your approval
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((r) => {
          const st = actions[r.id] ?? "pending";
          return (
            <div key={r.id} className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900">{r.title}</div>
                  <div className="text-xs text-slate-600 mt-1 leading-relaxed">{r.rationale}</div>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full border shrink-0 ${impactTone(r.impact)}`}>{r.impact} impact</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="uppercase tracking-wider">{r.category}</span>
                  <span className="flex items-center gap-1"><Clock className="size-3" /> {r.minutes}m</span>
                </div>
                <div className="flex items-center gap-2">
                  {st === "approved" ? (
                    <Badge className="bg-emerald-100 text-emerald-800 border-0"><ThumbsUp className="size-3 mr-1" /> Approved</Badge>
                  ) : st === "dismissed" ? (
                    <Badge variant="muted">Dismissed</Badge>
                  ) : (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => setStatus(r.id, "dismissed")}>Skip</Button>
                      <Button size="sm" onClick={() => setStatus(r.id, "approved")} className="bg-slate-900 hover:bg-slate-800">Approve</Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChecksList({ title, items }: { title: string; items: { label: string; status: "ok" | "warn" | "risk"; note: string }[] }) {
  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <ul className="divide-y">
        {items.map((c, i) => (
          <li key={i} className="py-3 flex items-start gap-3">
            <span className={`mt-1.5 size-2.5 rounded-full ${statusDot(c.status)}`} />
            <div className="flex-1">
              <div className="text-sm font-medium">{c.label}</div>
              <div className="text-xs text-slate-600">{c.note}</div>
            </div>
            <Badge variant="outline" className="text-[10px] uppercase">
              {c.status === "ok" ? "Healthy" : c.status === "warn" ? "Watch" : "Fix"}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CourseAnalysis({ briefing }: { briefing: CooBriefing }) {
  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Course Analysis</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {briefing.courseChecks.map((c, i) => (
          <div key={i} className="rounded-2xl border p-4 bg-slate-50">
            <div className="text-xs text-slate-500">{c.label}</div>
            <div className="text-xl font-semibold text-slate-900 mt-1">{c.value}</div>
            <div className="text-[11px] text-slate-600 mt-1">{c.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeadsPanel({ briefing }: { briefing: CooBriefing }) {
  const l = briefing.leadsSnapshot;
  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm space-y-5">
      <h2 className="text-lg font-semibold">Lead Analysis</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Hot leads" value={String(l.hotLeads)} />
        <Stat label="Last follow-up" value={l.lastFollowUp} />
        <Stat label="Conversion" value={l.conversion} />
        <Stat label="Best call window" value={l.recommendedTime} />
      </div>
      <div className="rounded-2xl border bg-slate-50 p-4">
        <div className="text-xs uppercase tracking-widest text-slate-500 mb-1.5">Suggested follow-up message</div>
        <p className="text-sm text-slate-800 leading-relaxed">{l.suggestedMessage}</p>
      </div>
    </div>
  );
}

function StudentsPanel({ briefing }: { briefing: CooBriefing }) {
  const s = briefing.studentSuccess;
  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm space-y-5">
      <h2 className="text-lg font-semibold">Student Success</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Attendance" value={s.attendance} />
        <Stat label="Assignments" value={s.assignments} />
        <Stat label="Certificates" value={s.certificates} />
        <Stat label="Dropout risk" value={`${s.dropoutRisk}%`} tone={s.dropoutRisk > 15 ? "warn" : "ok"} />
      </div>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
        <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-900">
          Predictive model flags <b>12 students</b> at elevated dropout risk on Module 4. Recommend sending a targeted hint video and scheduling a live doubt-session within 48 hours.
        </p>
      </div>
    </div>
  );
}

function FinancePanel({ briefing }: { briefing: CooBriefing }) {
  const f = briefing.finance;
  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm space-y-5">
      <h2 className="text-lg font-semibold">Finance</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Revenue" value={f.revenue} />
        <Stat label="Expenses" value={f.expenses} />
        <Stat label="Refund rate" value={f.refunds} />
        <Stat label="Partner earnings" value={f.earnings} />
      </div>
      <div className="rounded-2xl border bg-slate-50 p-4">
        <div className="text-xs uppercase tracking-widest text-slate-500 mb-1.5">Forecast</div>
        <p className="text-sm text-slate-800">{f.forecast}</p>
      </div>
      <div>
        <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">Growth opportunities</div>
        <ul className="space-y-2">
          {f.opportunities.map((o, i) => (
            <li key={i} className="text-sm text-slate-800 flex items-start gap-2">
              <TrendingUp className="size-4 text-emerald-600 mt-0.5 shrink-0" /> {o}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ReportsPanel({ briefing }: { briefing: CooBriefing }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {briefing.reports.map((r) => (
        <div key={r.cadence} className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="size-4 text-slate-600" />
            <span className="text-xs uppercase tracking-widest text-slate-500">{r.cadence} report</span>
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-3">{r.headline}</h3>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {r.metrics.map((m, i) => (
              <div key={i} className="rounded-xl bg-slate-50 border p-3">
                <div className="text-[10px] uppercase tracking-widest text-slate-500">{m.label}</div>
                <div className="text-lg font-semibold">{m.value}</div>
                {m.delta && <div className="text-[11px] text-emerald-700">{m.delta}</div>}
              </div>
            ))}
          </div>
          <div className="text-xs uppercase tracking-widest text-slate-500 mb-1">Wins</div>
          <ul className="text-sm text-slate-700 list-disc pl-5 mb-3">{r.wins.map((w, i) => <li key={i}>{w}</li>)}</ul>
          <div className="text-xs uppercase tracking-widest text-slate-500 mb-1">Focus next</div>
          <ul className="text-sm text-slate-700 list-disc pl-5">{r.focus.map((w, i) => <li key={i}>{w}</li>)}</ul>
        </div>
      ))}
    </div>
  );
}

function NotificationsPanel({ briefing }: { briefing: CooBriefing }) {
  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="size-4 text-slate-700" />
        <h2 className="text-lg font-semibold">Alerts</h2>
      </div>
      <ul className="divide-y">
        {briefing.notifications.map((n) => (
          <li key={n.id} className="py-3 flex items-start gap-3">
            <span className={`mt-1.5 size-2.5 rounded-full ${n.severity === "risk" ? "bg-rose-500" : n.severity === "warn" ? "bg-amber-500" : "bg-sky-500"}`} />
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-900">{n.title}</div>
              <div className="text-xs text-slate-600">{n.detail}</div>
            </div>
            <Badge variant="outline" className="text-[10px] uppercase">{n.domain}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" }) {
  return (
    <div className={`rounded-2xl border p-4 ${tone === "warn" ? "bg-amber-50 border-amber-200" : "bg-slate-50"}`}>
      <div className="text-[11px] uppercase tracking-widest text-slate-500">{label}</div>
      <div className="text-lg font-semibold text-slate-900 mt-1">{value}</div>
    </div>
  );
}

function Footer() {
  return (
    <div className="rounded-2xl border bg-slate-50 p-4 text-xs text-slate-600 flex items-start gap-2">
      <ShieldCheck className="size-4 text-emerald-600 shrink-0 mt-0.5" />
      Your AI COO continuously monitors {`{`}website, SEO, courses, marketing, leads, students, finance, operations{`}`} and drafts recommendations. Nothing publishes or messages contacts without your explicit approval.
    </div>
  );
}
