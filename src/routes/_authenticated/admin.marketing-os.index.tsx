import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCampaignDashboard, listCampaigns } from "@/lib/marketing-os/campaigns.functions";
import { listPublishingJobs, getPublishingStats } from "@/lib/marketing-os/publisher.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Megaphone, CalendarDays, Users, TrendingUp, TrendingDown, ArrowUpRight,
  ChevronLeft, ChevronRight, Sparkles, Clock, ListTodo, Send,
  CheckCircle2, AlertCircle, Circle, MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/marketing-os/")({
  component: MarketingDashboard,
});

// ----- helpers -----
function money(cents: number) {
  const n = cents / 100;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
}
function num(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function daysInMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); }
function fmtDay(d: Date) { return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }); }

const PLATFORM_COLOR: Record<string, string> = {
  instagram: "bg-pink-500",
  facebook: "bg-blue-600",
  linkedin: "bg-sky-700",
  x: "bg-neutral-900",
  twitter: "bg-neutral-900",
  youtube: "bg-red-600",
  threads: "bg-neutral-700",
};

function MarketingDashboard() {
  const dash = useServerFn(getCampaignDashboard);
  const list = useServerFn(listCampaigns);
  const listJobs = useServerFn(listPublishingJobs);
  const pubStats = useServerFn(getPublishingStats);

  const { data: dashData } = useQuery({ queryKey: ["mkt-dashboard"], queryFn: () => dash() });
  const { data: campaignsData } = useQuery({ queryKey: ["mkt-campaigns-recent"], queryFn: () => list() });
  const { data: pubData } = useQuery({ queryKey: ["publisher-stats"], queryFn: () => pubStats() });

  // Month range for calendar
  const [monthCursor, setMonthCursor] = useState<Date>(() => startOfMonth(new Date()));
  const monthStart = startOfMonth(monthCursor);
  const monthEnd = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0, 23, 59, 59);

  const { data: jobsData } = useQuery({
    queryKey: ["publishing-jobs-month", monthCursor.toISOString()],
    queryFn: () =>
      listJobs({
        data: {
          from: monthStart.toISOString(),
          to: monthEnd.toISOString(),
          limit: 400,
        },
      }),
  });

  const jobs = jobsData?.jobs ?? [];
  const jobsByDay = useMemo(() => {
    const map = new Map<string, typeof jobs>();
    for (const j of jobs) {
      const key = new Date(j.scheduled_at).toDateString();
      const arr = map.get(key) ?? [];
      arr.push(j);
      map.set(key, arr);
    }
    return map;
  }, [jobs]);

  const totalCampaigns = dashData?.stats?.total ?? campaignsData?.campaigns.length ?? 0;
  const activeCampaigns = dashData?.stats?.active ?? 0;
  const revenue = dashData?.stats?.totalRevenueCents ?? 0;
  const leads = dashData?.stats?.totalLeads ?? 0;
  const scheduled = pubData?.scheduled ?? 0;
  const upcomingWeek = pubData?.upcomingWeek ?? 0;

  const kpis = [
    {
      label: "Campaigns", value: num(totalCampaigns), sub: `${activeCampaigns} active`,
      delta: 12, positive: true, icon: Megaphone, tone: "from-primary/20 to-primary/5",
    },
    {
      label: "Scheduled Posts", value: num(scheduled), sub: `${upcomingWeek} this week`,
      delta: 8, positive: true, icon: Send, tone: "from-blue-500/20 to-blue-500/5",
    },
    {
      label: "Leads", value: num(leads), sub: "Last 30 days",
      delta: 3, positive: false, icon: Users, tone: "from-emerald-500/20 to-emerald-500/5",
    },
    {
      label: "Revenue", value: money(revenue), sub: "Attributed",
      delta: 24, positive: true, icon: TrendingUp, tone: "from-amber-500/20 to-amber-500/5",
    },
  ];

  const recentCampaigns = (campaignsData?.campaigns ?? []).slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-primary">Marketing OS</div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Everything you need to plan, publish, and grow — in one workspace.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild size="sm">
            <Link to="/admin/marketing-os/analytics">View analytics</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/admin/marketing-os/planner"><Sparkles className="size-4 mr-1.5" />New AI Plan</Link>
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="p-5 relative overflow-hidden">
              <div className={cn("absolute inset-0 opacity-60 bg-gradient-to-br pointer-events-none", k.tone)} />
              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground">{k.label}</div>
                  <div className="size-8 rounded-lg bg-white/70 backdrop-blur border border-border/60 grid place-items-center">
                    <Icon className="size-4 text-foreground/80" />
                  </div>
                </div>
                <div className="mt-3 text-3xl font-semibold tracking-tight">{k.value}</div>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-medium",
                      k.positive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700",
                    )}
                  >
                    {k.positive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                    {k.delta}%
                  </span>
                  <span className="text-muted-foreground">{k.sub}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Calendar (70%) + Right rail (30%) */}
      <div className="grid grid-cols-1 xl:grid-cols-10 gap-4">
        <Card className="xl:col-span-7 p-5">
          <CalendarMonth
            cursor={monthCursor}
            setCursor={setMonthCursor}
            jobsByDay={jobsByDay}
          />
        </Card>

        <div className="xl:col-span-3 space-y-4">
          <AIRecommendations />
          <UpcomingDeadlines />
          <PublishingQueue jobs={jobs.slice(0, 5)} />
          <TodaysTasks />
        </div>
      </div>

      {/* Recent Campaigns Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border/60 flex items-center justify-between">
          <div>
            <h3 className="font-medium">Recent Campaigns</h3>
            <p className="text-xs text-muted-foreground">Latest campaigns across your workspaces</p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/marketing-os/campaigns">
              View all <ArrowUpRight className="size-3.5 ml-1" />
            </Link>
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground bg-muted/30">
                <th className="px-4 py-2.5 font-normal">Campaign</th>
                <th className="px-4 py-2.5 font-normal">Status</th>
                <th className="px-4 py-2.5 font-normal">Timeline</th>
                <th className="px-4 py-2.5 font-normal text-right">Leads</th>
                <th className="px-4 py-2.5 font-normal text-right">Revenue</th>
                <th className="px-4 py-2.5 font-normal text-right">Budget</th>
                <th className="px-4 py-2.5 font-normal w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {recentCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    No campaigns yet.{" "}
                    <Link to="/admin/marketing-os/campaigns" className="text-primary hover:underline">Create your first campaign</Link>
                  </td>
                </tr>
              ) : (
                recentCampaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        to="/admin/marketing-os/campaigns/$id"
                        params={{ id: c.id }}
                        className="font-medium hover:underline"
                      >
                        {c.name}
                      </Link>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[280px]">
                        {c.objective || c.campaign_type || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {c.starts_at ? new Date(c.starts_at).toLocaleDateString() : "—"}
                      {c.ends_at ? ` → ${new Date(c.ends_at).toLocaleDateString()}` : ""}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{num(Number(c.actual_leads ?? 0))}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{money(Number(c.actual_revenue_cents ?? 0))}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{money(Number(c.budget_cents ?? 0))}</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="icon" className="size-7"><MoreHorizontal className="size-4" /></Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700 border-emerald-200",
    completed: "bg-blue-100 text-blue-700 border-blue-200",
    paused: "bg-amber-100 text-amber-700 border-amber-200",
    archived: "bg-muted text-muted-foreground",
    draft: "bg-neutral-100 text-neutral-700 border-neutral-200",
    planning: "bg-neutral-100 text-neutral-700 border-neutral-200",
    ready: "bg-violet-100 text-violet-700 border-violet-200",
  };
  return (
    <Badge variant="outline" className={cn("border capitalize font-medium", map[status] ?? map.draft)}>
      {status}
    </Badge>
  );
}

// ---------- Calendar Month ----------
function CalendarMonth({
  cursor, setCursor, jobsByDay,
}: {
  cursor: Date;
  setCursor: (d: Date) => void;
  jobsByDay: Map<string, Array<{ id: string; platform: string; scheduled_at: string; status: string; account_label?: string | null }>>;
}) {
  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const firstDow = new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay();
  const total = daysInMonth(cursor);
  const cells: Array<{ date: Date | null }> = [];
  for (let i = 0; i < firstDow; i++) cells.push({ date: null });
  for (let d = 1; d <= total; d++) cells.push({ date: new Date(cursor.getFullYear(), cursor.getMonth(), d) });
  while (cells.length % 7 !== 0) cells.push({ date: null });
  const today = new Date(); today.setHours(0, 0, 0, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">{monthLabel}</h3>
          <p className="text-xs text-muted-foreground">Marketing calendar · scheduled across all platforms</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(startOfMonth(new Date()))}>Today</Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="outline" size="sm" asChild className="ml-2">
            <Link to="/admin/marketing-os/calendar">Full calendar</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border/60 rounded-lg overflow-hidden border border-border/60">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
          <div key={d} className="bg-muted/50 px-2 py-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
            {d}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (!cell.date) return <div key={i} className="bg-muted/20 min-h-[92px]" />;
          const isToday = cell.date.getTime() === today.getTime();
          const daysJobs = jobsByDay.get(cell.date.toDateString()) ?? [];
          return (
            <div key={i} className="bg-white min-h-[92px] p-1.5 flex flex-col gap-1 hover:bg-muted/20 transition-colors">
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-xs font-medium size-6 grid place-items-center rounded-full",
                  isToday ? "bg-primary text-primary-foreground" : "text-foreground",
                )}>
                  {cell.date.getDate()}
                </span>
                {daysJobs.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">+{daysJobs.length - 3}</span>
                )}
              </div>
              <div className="space-y-0.5 overflow-hidden">
                {daysJobs.slice(0, 3).map((j) => (
                  <div
                    key={j.id}
                    className="flex items-center gap-1 text-[10px] rounded px-1 py-0.5 bg-muted/60 truncate"
                    title={`${j.platform} — ${j.account_label ?? ""}`}
                  >
                    <span className={cn("size-1.5 rounded-full shrink-0", PLATFORM_COLOR[j.platform] ?? "bg-neutral-400")} />
                    <span className="truncate capitalize">{j.platform}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Right rail widgets ----------
function AIRecommendations() {
  const recs = [
    { title: "Post reels on Wed 6–8 PM", detail: "34% higher reach on your audience", tone: "text-emerald-600" },
    { title: "Rebalance ad spend to LinkedIn", detail: "ROAS ↑ 2.1× last 14 days", tone: "text-blue-600" },
    { title: "Warm-lead follow-up in CRM", detail: "82 leads awaiting nurture", tone: "text-amber-600" },
  ];
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="size-4 text-primary" />
        <h3 className="font-medium">AI Recommendations</h3>
      </div>
      <div className="space-y-2.5">
        {recs.map((r, i) => (
          <div key={i} className="p-2.5 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer">
            <div className="text-sm font-medium">{r.title}</div>
            <div className={cn("text-xs mt-0.5", r.tone)}>{r.detail}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function UpcomingDeadlines() {
  const items = [
    { label: "Diwali Campaign launch", when: "in 2 days", severity: "high" as const },
    { label: "Q3 report to leadership", when: "Fri 5 PM", severity: "med" as const },
    { label: "Brand kit v2 review", when: "next Mon", severity: "low" as const },
  ];
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="size-4 text-primary" />
        <h3 className="font-medium">Upcoming Deadlines</h3>
      </div>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className={cn(
              "size-2 rounded-full shrink-0",
              it.severity === "high" ? "bg-red-500" : it.severity === "med" ? "bg-amber-500" : "bg-emerald-500",
            )} />
            <span className="flex-1 truncate">{it.label}</span>
            <span className="text-xs text-muted-foreground">{it.when}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PublishingQueue({ jobs }: { jobs: Array<{ id: string; platform: string; status: string; scheduled_at: string; account_label?: string | null }> }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Send className="size-4 text-primary" />
          <h3 className="font-medium">Publishing Queue</h3>
        </div>
        <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
          <Link to="/admin/marketing-os/publisher">Open <ArrowUpRight className="size-3 ml-1" /></Link>
        </Button>
      </div>
      {jobs.length === 0 ? (
        <div className="text-xs text-muted-foreground py-4 text-center">Nothing queued.</div>
      ) : (
        <div className="space-y-2">
          {jobs.map((j) => (
            <div key={j.id} className="flex items-center gap-2 text-sm">
              <span className={cn("size-2 rounded-full shrink-0", PLATFORM_COLOR[j.platform] ?? "bg-neutral-400")} />
              <span className="flex-1 truncate capitalize">{j.account_label || j.platform}</span>
              <span className="text-[11px] text-muted-foreground">
                {new Date(j.scheduled_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
              {j.status === "failed" && <AlertCircle className="size-3.5 text-red-500" />}
              {j.status === "publishing" && <Circle className="size-3.5 text-amber-500 animate-pulse" />}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function TodaysTasks() {
  const tasks = [
    { label: "Approve 4 pending posts", done: false },
    { label: "Review Diwali creatives", done: false },
    { label: "Reply to comments queue", done: true },
    { label: "Sync CRM with lead intake", done: true },
  ];
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <ListTodo className="size-4 text-primary" />
        <h3 className="font-medium">Today's Tasks</h3>
      </div>
      <div className="space-y-1.5">
        {tasks.map((t, i) => (
          <label key={i} className="flex items-center gap-2 text-sm cursor-pointer">
            {t.done
              ? <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              : <Circle className="size-4 text-muted-foreground shrink-0" />}
            <span className={cn(t.done && "line-through text-muted-foreground")}>{t.label}</span>
          </label>
        ))}
      </div>
    </Card>
  );
}
