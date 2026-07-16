import { useMemo, useState, useEffect, useCallback } from "react";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock,
  Command,
  Crown,
  ListTodo,
  Play,
  RefreshCw,
  Send,
  Sparkles,
  TrendingUp,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DIGITAL_EMPLOYEES,
  COLLABORATION_WORKFLOWS,
  findDigitalEmployee,
  loadStore,
  approveTask,
  completeTask,
  createTask,
  delegateFromCOO,
  generateWeeklyBriefing,
  rejectTask,
  resetStore,
  runAutomation,
  runCommand,
  runWorkflow,
  startTask,
  toggleAutoApprove,
  toggleAutomation,
  type EmployeeSlug,
  type EmployeeState,
  type EmployeeTask,
  type ActivityEvent,
  type AutomationRule,
  type Department,
} from "@/lib/partner/digital-employees";

/* ---------------- Small helpers ---------------- */

const STATUS_STYLES: Record<EmployeeState["status"], string> = {
  working: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  waiting: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  scheduled: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  idle: "bg-white/5 text-white/50 border-white/10",
};

const STATUS_LABEL: Record<EmployeeState["status"], string> = {
  working: "Working",
  waiting: "Waiting approval",
  scheduled: "Scheduled",
  idle: "Idle",
};

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  return `${d}d ago`;
}

function priorityBadge(p: EmployeeTask["priority"]) {
  const styles: Record<EmployeeTask["priority"], string> = {
    low: "bg-white/5 text-white/60",
    medium: "bg-sky-500/15 text-sky-200",
    high: "bg-amber-500/15 text-amber-200",
    urgent: "bg-rose-500/20 text-rose-200",
  };
  return <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide", styles[p])}>{p}</span>;
}

/* ---------------- Hub ---------------- */

type TabKey = "overview" | "org" | "tasks" | "workflows" | "automations" | "coo" | "activity";

export function DigitalEmployeesHub() {
  const [, force] = useState(0);
  const rerender = useCallback(() => force((n) => n + 1), []);
  const [tab, setTab] = useState<TabKey>("overview");
  const [selected, setSelected] = useState<EmployeeSlug | null>(null);

  const store = useMemo(() => loadStore(), []);
  // Re-read after any mutation
  const s = useMemo(() => loadStore(), [tab, selected]);

  // Force a fresh read whenever we mutate
  const refresh = useCallback(() => {
    rerender();
  }, [rerender]);

  useEffect(() => {
    // ensure seeded
    loadStore();
  }, []);

  const totals = useMemo(() => {
    const completed = s.tasks.filter((t) => t.status === "completed").length;
    const active = s.tasks.filter((t) => t.status === "working" || t.status === "queued").length;
    const waiting = s.tasks.filter((t) => t.status === "waiting_approval").length;
    const hoursSaved = Math.round(
      s.tasks.filter((t) => t.status === "completed").reduce((sum, t) => sum + t.hoursSaved, 0),
    );
    const automations = s.automations.filter((a) => a.enabled).length;
    const runs = s.automations.reduce((sum, a) => sum + a.runsCount, 0);
    return { completed, active, waiting, hoursSaved, automations, runs };
  }, [s]);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#0a0e1a] text-white">
      <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-8">
        {/* Header */}
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/50">
              <Bot className="h-3.5 w-3.5" /> Digital Employees · Academy OS
            </div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Your AI-first executive team
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              13 specialists working under an AI COO. Delegate tasks, chain workflows, and let approved automations
              run themselves — always with you in control.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
              onClick={() => {
                resetStore();
                refresh();
              }}
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Reset demo
            </Button>
          </div>
        </header>

        {/* Command bar */}
        <CommandBar onRun={refresh} />

        {/* KPI strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-6">
          <Kpi label="Tasks Completed" value={totals.completed} icon={CheckCircle2} tone="emerald" />
          <Kpi label="In Progress" value={totals.active} icon={Play} tone="sky" />
          <Kpi label="Awaiting Approval" value={totals.waiting} icon={Clock} tone="amber" />
          <Kpi label="Hours Saved" value={`${totals.hoursSaved}h`} icon={TrendingUp} tone="lime" />
          <Kpi label="Automations On" value={totals.automations} icon={Zap} tone="violet" />
          <Kpi label="Auto Runs" value={totals.runs} icon={Sparkles} tone="rose" />
        </div>

        {/* Tabs */}
        <nav className="mt-8 flex flex-wrap gap-1 border-b border-white/10">
          {(
            [
              { k: "overview", label: "Overview" },
              { k: "org", label: "Org Chart" },
              { k: "tasks", label: "Task Board" },
              { k: "workflows", label: "Workflows" },
              { k: "automations", label: "Automations" },
              { k: "coo", label: "AI COO" },
              { k: "activity", label: "Activity Feed" },
            ] as { k: TabKey; label: string }[]
          ).map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={cn(
                "border-b-2 px-4 py-2.5 text-sm transition-colors",
                tab === t.k
                  ? "border-cyan-400 text-white"
                  : "border-transparent text-white/50 hover:text-white/80",
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="mt-6">
          {tab === "overview" && (
            <OverviewTab s={s} onSelect={(slug) => { setSelected(slug); setTab("org"); }} refresh={refresh} />
          )}
          {tab === "org" && <OrgChartTab s={s} selected={selected} onSelect={setSelected} refresh={refresh} />}
          {tab === "tasks" && <TaskBoardTab s={s} refresh={refresh} />}
          {tab === "workflows" && <WorkflowsTab refresh={refresh} />}
          {tab === "automations" && <AutomationsTab s={s} refresh={refresh} />}
          {tab === "coo" && <CooTab s={s} refresh={refresh} />}
          {tab === "activity" && <ActivityTab s={s} />}
        </div>
      </div>
    </div>
  );
}

/* ---------------- KPIs ---------------- */

function Kpi({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "emerald" | "sky" | "amber" | "lime" | "violet" | "rose";
}) {
  const tones: Record<string, string> = {
    emerald: "text-emerald-300",
    sky: "text-sky-300",
    amber: "text-amber-300",
    lime: "text-lime-300",
    violet: "text-violet-300",
    rose: "text-rose-300",
  };
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-white/50">
        <span>{label}</span>
        <Icon className={cn("h-3.5 w-3.5", tones[tone])} />
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

/* ---------------- Command bar ---------------- */

function CommandBar({ onRun }: { onRun: () => void }) {
  const [text, setText] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const examples = [
    "Generate 3 blog ideas on AI careers",
    "Follow up all idle enquiries older than 24 hours",
    "Design social banner for the Prompt Engineering course",
    "Create weekly business briefing",
  ];

  function submit(v?: string) {
    const q = (v ?? text).trim();
    if (!q) return;
    const r = runCommand(q);
    setReply(r.reply);
    setText("");
    onRun();
  }

  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-white/[0.03] to-transparent p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-cyan-200/80">
        <Command className="h-3.5 w-3.5" /> AI Command Bar
      </div>
      <div className="mt-3 flex flex-col gap-2 md:flex-row">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder='Ask your team: "Draft a blog on Prompt Engineering" or "Follow up idle enquiries"'
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-cyan-400/50 focus:outline-none"
        />
        <Button onClick={() => submit()} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400">
          <Send className="mr-1.5 h-3.5 w-3.5" /> Delegate
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {examples.map((ex) => (
          <button
            key={ex}
            onClick={() => submit(ex)}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 hover:bg-white/10"
          >
            {ex}
          </button>
        ))}
      </div>
      {reply && (
        <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
          {reply}
        </div>
      )}
    </div>
  );
}

/* ---------------- Overview ---------------- */

function OverviewTab({ s, onSelect, refresh }: { s: ReturnType<typeof loadStore>; onSelect: (slug: EmployeeSlug) => void; refresh: () => void; }) {
  const briefing = useMemo(() => generateWeeklyBriefing(), []);
  const productivity = useMemo(() => {
    return Object.values(s.employees)
      .map((e) => ({ ...e, meta: findDigitalEmployee(e.slug)! }))
      .sort((a, b) => b.productivity - a.productivity)
      .slice(0, 6);
  }, [s]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <section className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-5">
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wide text-amber-200/80">
            <Crown className="h-3.5 w-3.5" /> AI COO — Weekly Briefing
          </div>
          <p className="text-sm text-white/80">{briefing.summary}</p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-2 text-xs uppercase tracking-wide text-white/50">Top priorities</div>
              <ul className="space-y-1.5 text-sm text-white/80">
                {briefing.priorities.map((p) => (
                  <li key={p} className="flex gap-2"><ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300" />{p}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-2 text-xs uppercase tracking-wide text-white/50">Risks to address</div>
              <ul className="space-y-1.5 text-sm text-white/80">
                {briefing.risks.map((r) => (
                  <li key={r} className="flex gap-2"><ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-300" />{r}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              className="bg-amber-400 text-slate-950 hover:bg-amber-300"
              onClick={() => {
                delegateFromCOO("marketing", "Launch October promo push", briefing.priorities[0]);
                delegateFromCOO("content", "Draft the 3 priority blogs", briefing.priorities[0]);
                delegateFromCOO("student-success", "Kick-off at-risk intervention", briefing.priorities[3] ?? "");
                refresh();
              }}
            >
              Accept & delegate to team
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-white/50">Top performers</div>
              <h3 className="mt-1 text-lg font-semibold">Productivity Leaderboard</h3>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {productivity.map((e) => {
              const Icon = e.meta.icon;
              return (
                <button
                  key={e.slug}
                  onClick={() => onSelect(e.slug)}
                  className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left transition-colors hover:border-white/20 hover:bg-white/[0.05]"
                >
                  <div className={cn("grid h-10 w-10 place-items-center rounded-lg border", e.meta.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-sm font-medium">{e.meta.name} · {e.meta.role}</div>
                      <span className="text-xs text-white/60">{e.productivity}</span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${e.productivity}%` }} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-3 text-xs uppercase tracking-wide text-white/50">Approval Queue</div>
          <ApprovalQueue s={s} refresh={refresh} />
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wide text-white/50">
            <Sparkles className="h-3.5 w-3.5" /> Live Activity
          </div>
          <ul className="space-y-3">
            {s.activity.slice(0, 8).map((a) => (
              <ActivityRow key={a.id} a={a} />
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function ApprovalQueue({ s, refresh }: { s: ReturnType<typeof loadStore>; refresh: () => void }) {
  const queue = s.tasks.filter((t) => t.status === "waiting_approval").slice(0, 5);
  if (queue.length === 0) {
    return <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 text-sm text-white/50">Nothing awaiting your approval. 🎉</div>;
  }
  return (
    <ul className="space-y-2">
      {queue.map((t) => {
        const e = findDigitalEmployee(t.employee)!;
        return (
          <li key={t.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-white/50">{e.role}</div>
                <div className="mt-0.5 text-sm font-medium">{t.title}</div>
              </div>
              {priorityBadge(t.priority)}
            </div>
            {t.output && <p className="mt-2 text-xs text-white/60">{t.output}</p>}
            <div className="mt-2 flex gap-2">
              <Button size="sm" className="h-7 bg-emerald-500 text-slate-950 hover:bg-emerald-400" onClick={() => { approveTask(t.id); refresh(); }}>Approve</Button>
              <Button size="sm" variant="outline" className="h-7 border-white/10 bg-transparent text-white/70 hover:bg-white/10" onClick={() => { rejectTask(t.id); refresh(); }}>Reject</Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------------- Org Chart ---------------- */

function OrgChartTab({
  s,
  selected,
  onSelect,
  refresh,
}: {
  s: ReturnType<typeof loadStore>;
  selected: EmployeeSlug | null;
  onSelect: (slug: EmployeeSlug) => void;
  refresh: () => void;
}) {
  const departments: Department[] = ["Marketing", "Sales", "Academics", "Operations", "Support", "Finance", "HR"];
  const grouped: Record<Department, typeof DIGITAL_EMPLOYEES> = departments.reduce((acc, d) => {
    acc[d] = DIGITAL_EMPLOYEES.filter((e) => e.department === d);
    return acc;
  }, {} as Record<Department, typeof DIGITAL_EMPLOYEES>);
  const coo = findDigitalEmployee("coo")!;
  const cooState = s.employees.coo;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        {/* Founder → COO */}
        <div className="flex flex-col items-center">
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-wide text-white/60">You · Founder</div>
          <div className="my-3 h-6 w-px bg-white/10" />
          <button
            onClick={() => onSelect("coo")}
            className={cn(
              "group flex w-full max-w-md items-center gap-3 rounded-2xl border p-4 text-left transition-all",
              "border-amber-500/40 bg-gradient-to-br from-amber-500/20 to-amber-500/5 hover:from-amber-500/30",
            )}
          >
            <div className="grid h-12 w-12 place-items-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200">
              <Crown className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{coo.name} · {coo.role}</div>
                <Badge variant="outline" className={cn("text-[10px]", STATUS_STYLES[cooState.status])}>{STATUS_LABEL[cooState.status]}</Badge>
              </div>
              <div className="text-xs text-white/60">{coo.tagline}</div>
              <div className="mt-2 flex gap-4 text-[11px] text-white/50">
                <span>Productivity {cooState.productivity}</span>
                <span>Active {cooState.tasksActive}</span>
                <span>Done {cooState.tasksCompleted}</span>
              </div>
            </div>
          </button>
        </div>

        {/* Department columns */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {departments.map((dept) => (
            <div key={dept} className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
              <div className="mb-2 flex items-center justify-between px-1">
                <div className="text-[11px] uppercase tracking-wider text-white/50">{dept}</div>
                <div className="text-[10px] text-white/40">{grouped[dept].length}</div>
              </div>
              <div className="space-y-2">
                {grouped[dept].map((e) => {
                  const st = s.employees[e.slug];
                  const Icon = e.icon;
                  const isActive = selected === e.slug;
                  return (
                    <button
                      key={e.slug}
                      onClick={() => onSelect(e.slug)}
                      className={cn(
                        "group flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all",
                        isActive ? "border-cyan-400/40 bg-cyan-400/10" : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]",
                      )}
                    >
                      <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg border", e.color)}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{e.name}</div>
                        <div className="truncate text-[11px] text-white/50">{e.role.replace("AI ", "")}</div>
                      </div>
                      <span className={cn("h-2 w-2 rounded-full", st.status === "working" ? "bg-emerald-400 animate-pulse" : st.status === "waiting" ? "bg-amber-400" : "bg-white/20")} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <EmployeePanel s={s} slug={selected ?? "coo"} refresh={refresh} />
    </div>
  );
}

function EmployeePanel({ s, slug, refresh }: { s: ReturnType<typeof loadStore>; slug: EmployeeSlug; refresh: () => void }) {
  const e = findDigitalEmployee(slug)!;
  const st = s.employees[slug];
  const Icon = e.icon;
  const own = s.tasks.filter((t) => t.employee === slug);
  const active = own.filter((t) => t.status === "working" || t.status === "queued");
  const done = own.filter((t) => t.status === "completed");
  const [title, setTitle] = useState("");

  return (
    <aside className="sticky top-4 h-fit rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center gap-3">
        <div className={cn("grid h-14 w-14 place-items-center rounded-xl border", e.color)}>
          <Icon className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-wide text-white/50">{e.department}</div>
          <div className="text-lg font-semibold">{e.name}</div>
          <div className="text-sm text-white/70">{e.role}</div>
        </div>
        <Badge variant="outline" className={cn("text-[10px]", STATUS_STYLES[st.status])}>{STATUS_LABEL[st.status]}</Badge>
      </div>
      <p className="mt-3 text-sm text-white/70">{e.tagline}</p>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <StatCell label="Prod." value={st.productivity} />
        <StatCell label="Active" value={st.tasksActive} />
        <StatCell label="Done" value={st.tasksCompleted} />
      </div>

      <div className="mt-4">
        <div className="text-[11px] uppercase tracking-wide text-white/50">Responsibilities</div>
        <ul className="mt-2 space-y-1 text-xs text-white/70">
          {e.responsibilities.map((r) => (
            <li key={r} className="flex gap-1.5"><ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-cyan-300" />{r}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <div className="text-[11px] uppercase tracking-wide text-white/50">Key KPIs</div>
        <ul className="mt-2 space-y-1 text-xs text-white/70">
          {e.kpis.map((k) => (
            <li key={k.label} className="flex justify-between"><span>{k.label}</span><span className="text-white/50">{k.target}</span></li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <div className="text-[11px] uppercase tracking-wide text-white/50">Assign task</div>
        <div className="mt-2 flex gap-1.5">
          <input
            value={title}
            onChange={(ev) => setTitle(ev.target.value)}
            placeholder={`e.g. ${e.outputs[0]}`}
            className="flex-1 rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-cyan-400/40 focus:outline-none"
          />
          <Button
            size="sm"
            className="h-8 bg-cyan-500 px-2.5 text-slate-950 hover:bg-cyan-400"
            onClick={() => {
              if (!title.trim()) return;
              createTask({ employee: slug, title: title.trim(), description: title.trim(), priority: "high" });
              setTitle("");
              refresh();
            }}
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {active.length > 0 && (
        <div className="mt-4">
          <div className="text-[11px] uppercase tracking-wide text-white/50">Working on</div>
          <ul className="mt-2 space-y-1 text-xs text-white/70">
            {active.slice(0, 4).map((t) => (<li key={t.id} className="truncate">· {t.title}</li>))}
          </ul>
        </div>
      )}

      {done.length > 0 && (
        <div className="mt-4">
          <div className="text-[11px] uppercase tracking-wide text-white/50">Recently completed</div>
          <ul className="mt-2 space-y-1 text-xs text-white/50">
            {done.slice(0, 3).map((t) => (<li key={t.id} className="truncate">✓ {t.title}</li>))}
          </ul>
        </div>
      )}
    </aside>
  );
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2">
      <div className="text-lg font-semibold text-white">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-white/50">{label}</div>
    </div>
  );
}

/* ---------------- Task Board ---------------- */

function TaskBoardTab({ s, refresh }: { s: ReturnType<typeof loadStore>; refresh: () => void }) {
  const columns: { key: EmployeeTask["status"]; label: string; tone: string }[] = [
    { key: "queued", label: "Queued", tone: "text-white/60" },
    { key: "working", label: "Working", tone: "text-sky-300" },
    { key: "waiting_approval", label: "Awaiting Approval", tone: "text-amber-300" },
    { key: "completed", label: "Completed", tone: "text-emerald-300" },
    { key: "blocked", label: "Blocked", tone: "text-rose-300" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {columns.map((col) => {
        const items = s.tasks.filter((t) => t.status === col.key);
        return (
          <div key={col.key} className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
            <div className="mb-3 flex items-center justify-between">
              <div className={cn("text-xs uppercase tracking-wider", col.tone)}>{col.label}</div>
              <div className="text-xs text-white/40">{items.length}</div>
            </div>
            <div className="space-y-2">
              {items.slice(0, 12).map((t) => {
                const e = findDigitalEmployee(t.employee)!;
                const Icon = e.icon;
                return (
                  <div key={t.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="flex items-center gap-2 text-[11px] text-white/50">
                      <Icon className="h-3 w-3" /> {e.name}
                    </div>
                    <div className="mt-1 text-sm font-medium text-white">{t.title}</div>
                    <div className="mt-1 line-clamp-2 text-xs text-white/50">{t.description}</div>
                    <div className="mt-2 flex items-center justify-between">
                      {priorityBadge(t.priority)}
                      <span className="text-[10px] text-white/40">{formatRelative(t.updatedAt)}</span>
                    </div>
                    <div className="mt-2 flex gap-1.5">
                      {t.status === "queued" && (
                        <Button size="sm" className="h-6 bg-cyan-500 px-2 text-[11px] text-slate-950 hover:bg-cyan-400" onClick={() => { startTask(t.id); refresh(); }}>Start</Button>
                      )}
                      {t.status === "working" && (
                        <Button size="sm" className="h-6 bg-emerald-500 px-2 text-[11px] text-slate-950 hover:bg-emerald-400" onClick={() => { completeTask(t.id); refresh(); }}>Complete</Button>
                      )}
                      {t.status === "waiting_approval" && (
                        <>
                          <Button size="sm" className="h-6 bg-emerald-500 px-2 text-[11px] text-slate-950 hover:bg-emerald-400" onClick={() => { approveTask(t.id); refresh(); }}>Approve</Button>
                          <Button size="sm" variant="outline" className="h-6 border-white/10 bg-transparent px-2 text-[11px] text-white/70 hover:bg-white/10" onClick={() => { rejectTask(t.id); refresh(); }}>Reject</Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              {items.length === 0 && <div className="rounded-lg border border-dashed border-white/10 p-3 text-[11px] text-white/40">Nothing here.</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Workflows ---------------- */

function WorkflowsTab({ refresh }: { refresh: () => void }) {
  const [prompt, setPrompt] = useState("");
  const [confirm, setConfirm] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      {COLLABORATION_WORKFLOWS.map((wf) => (
        <section key={wf.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-cyan-300"><Workflow className="h-3.5 w-3.5" /> Workflow</div>
              <h3 className="mt-1 text-lg font-semibold">{wf.label}</h3>
              <p className="mt-1 max-w-2xl text-sm text-white/60">{wf.description}</p>
            </div>
            <Button
              size="sm"
              className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"
              onClick={() => {
                runWorkflow(wf.id, prompt);
                setConfirm(wf.id);
                setPrompt("");
                refresh();
              }}
            >
              <Play className="mr-1.5 h-3.5 w-3.5" /> Run workflow
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap items-stretch gap-2">
            {wf.steps.map((s, i) => {
              const e = findDigitalEmployee(s.employee)!;
              const Icon = e.icon;
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className={cn("flex items-center gap-2 rounded-lg border px-3 py-2", e.color)}>
                    <Icon className="h-4 w-4" />
                    <div>
                      <div className="text-xs font-medium">{e.name}</div>
                      <div className="text-[10px] text-white/60">{s.action}</div>
                    </div>
                  </div>
                  {i < wf.steps.length - 1 && <ArrowRight className="h-4 w-4 text-white/30" />}
                </div>
              );
            })}
          </div>
          {confirm === wf.id && (
            <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
              Workflow queued — tasks assigned to each team member. Check the Task Board.
            </div>
          )}
        </section>
      ))}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div className="text-xs uppercase tracking-wide text-white/50">Custom workflow prompt</div>
        <p className="mt-1 text-xs text-white/50">Add an optional brief that all steps will inherit.</p>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Focus on Prompt Engineering keyword for October"
          className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-400/40 focus:outline-none"
        />
      </section>
    </div>
  );
}

/* ---------------- Automations ---------------- */

function AutomationsTab({ s, refresh }: { s: ReturnType<typeof loadStore>; refresh: () => void }) {
  return (
    <div className="space-y-3">
      <p className="max-w-3xl text-sm text-white/60">
        Automations execute on their own cadence. Enable auto-approve only for task types you're comfortable letting the team ship without review.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {s.automations.map((rule) => {
          const e = findDigitalEmployee(rule.employee)!;
          const Icon = e.icon;
          return (
            <div key={rule.id} className={cn("rounded-2xl border p-4", rule.enabled ? "border-emerald-500/20 bg-emerald-500/[0.03]" : "border-white/10 bg-white/[0.02]")}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg border", e.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-white/50">{e.role}</div>
                    <div className="text-sm font-medium">{rule.label}</div>
                    <div className="mt-1 text-xs text-white/60">{rule.description}</div>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-white/60">{rule.cadence}</span>
                      <span className={cn("rounded-full px-2 py-0.5", rule.autoApprove ? "bg-emerald-500/20 text-emerald-200" : "bg-amber-500/15 text-amber-200")}>{rule.autoApprove ? "Auto-approve on" : "Requires approval"}</span>
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-white/60">Runs · {rule.runsCount}</span>
                    </div>
                  </div>
                </div>
                <ToggleSwitch checked={rule.enabled} onChange={() => { toggleAutomation(rule.id); refresh(); }} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="h-7 border-white/10 bg-transparent text-xs text-white/70 hover:bg-white/10" onClick={() => { toggleAutoApprove(rule.id); refresh(); }}>
                  {rule.autoApprove ? "Require approval" : "Auto-approve"}
                </Button>
                <Button size="sm" className="h-7 bg-cyan-500 px-2 text-xs text-slate-950 hover:bg-cyan-400" onClick={() => { runAutomation(rule.id); refresh(); }}>
                  <Play className="mr-1 h-3 w-3" /> Run now
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={cn(
        "relative h-5 w-9 rounded-full border transition-colors",
        checked ? "border-emerald-400 bg-emerald-500/40" : "border-white/15 bg-white/10",
      )}
    >
      <span className={cn("absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-all", checked ? "left-4" : "left-0.5")} />
    </button>
  );
}

/* ---------------- COO ---------------- */

function CooTab({ s, refresh }: { s: ReturnType<typeof loadStore>; refresh: () => void }) {
  const briefing = useMemo(() => generateWeeklyBriefing(), []);
  const coo = findDigitalEmployee("coo")!;
  const kpis = coo.kpis;

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <section className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200">
            <Crown className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-amber-200/70">Chief Operating Officer</div>
            <h2 className="text-xl font-semibold">Aria · AI COO Command Center</h2>
          </div>
        </div>

        <div className="mt-5">
          <div className="text-xs uppercase tracking-wide text-white/50">Weekly summary</div>
          <p className="mt-1 text-sm text-white/80">{briefing.summary}</p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-wide text-white/50">Priorities</div>
            <ol className="mt-2 space-y-2 text-sm text-white/80">
              {briefing.priorities.map((p, i) => (
                <li key={p} className="flex gap-2"><span className="text-cyan-300">{i + 1}.</span>{p}</li>
              ))}
            </ol>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-white/50">Risks &amp; alerts</div>
            <ul className="mt-2 space-y-2 text-sm text-white/80">
              {briefing.risks.map((r) => (
                <li key={r} className="flex gap-2"><span className="text-rose-300">!</span>{r}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button size="sm" className="bg-amber-400 text-slate-950 hover:bg-amber-300" onClick={() => {
            delegateFromCOO("marketing", "Ship this week's campaign", briefing.priorities[0]);
            delegateFromCOO("content", "Priority blog batch", briefing.priorities[1] ?? "");
            delegateFromCOO("student-success", "At-risk intervention plan", briefing.priorities[3] ?? "");
            refresh();
          }}>Delegate all priorities</Button>
          <Button size="sm" variant="outline" className="border-white/10 bg-transparent text-white/80 hover:bg-white/10" onClick={() => { refresh(); }}>Regenerate briefing</Button>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-xs uppercase tracking-wide text-white/50">COO KPIs</div>
          <ul className="mt-2 space-y-2 text-sm text-white/80">
            {kpis.map((k) => (
              <li key={k.label} className="flex justify-between"><span>{k.label}</span><span className="text-white/50">{k.target}</span></li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-xs uppercase tracking-wide text-white/50">Recent delegations</div>
          <ul className="mt-2 space-y-2">
            {s.tasks.filter((t) => t.origin === "coo").slice(0, 6).map((t) => {
              const e = findDigitalEmployee(t.employee)!;
              return (
                <li key={t.id} className="flex items-start gap-2 text-xs text-white/70">
                  <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-amber-300" />
                  <span><span className="text-white/50">→ {e.role}:</span> {t.title}</span>
                </li>
              );
            })}
            {s.tasks.filter((t) => t.origin === "coo").length === 0 && (
              <li className="text-xs text-white/40">No delegations yet.</li>
            )}
          </ul>
        </div>
      </aside>
    </div>
  );
}

/* ---------------- Activity ---------------- */

function ActivityTab({ s }: { s: ReturnType<typeof loadStore> }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/50">
        <ListTodo className="h-3.5 w-3.5" /> Live activity timeline
      </div>
      <ul className="mt-4 space-y-3">
        {s.activity.slice(0, 80).map((a) => (
          <ActivityRow key={a.id} a={a} />
        ))}
        {s.activity.length === 0 && <li className="text-sm text-white/40">No activity yet.</li>}
      </ul>
    </div>
  );
}

function ActivityRow({ a }: { a: ActivityEvent }) {
  const e = findDigitalEmployee(a.employee)!;
  const Icon = e.icon;
  const kindTone: Record<ActivityEvent["kind"], string> = {
    task_created: "text-white/70",
    task_started: "text-sky-300",
    task_completed: "text-emerald-300",
    task_handoff: "text-cyan-300",
    task_approved: "text-emerald-300",
    recommendation: "text-violet-300",
    automation_run: "text-fuchsia-300",
    briefing: "text-amber-300",
  };
  return (
    <li className="flex items-start gap-3">
      <div className={cn("mt-0.5 grid h-7 w-7 place-items-center rounded-lg border", e.color)}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className={cn("text-sm", kindTone[a.kind])}>{a.message}</div>
        <div className="text-[11px] text-white/40">{formatRelative(a.timestamp)}</div>
      </div>
    </li>
  );
}
