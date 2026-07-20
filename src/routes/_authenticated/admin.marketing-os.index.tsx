import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Area, AreaChart,
} from "recharts";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Megaphone, CalendarDays, Users, TrendingUp, TrendingDown, ArrowUpRight,
  ChevronLeft, ChevronRight, Sparkles, Clock, ListTodo, Send,
  CheckCircle2, AlertCircle, Circle, MoreHorizontal, IndianRupee, Search, Filter,
  Plus, X, ArrowUpDown, Instagram, Facebook, Linkedin, Youtube, FileText, Mail, Twitter,
  Wand2, FolderOpen, PenLine, Globe, ClipboardList, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCampaignDashboard, listCampaigns, type Campaign } from "@/lib/marketing-os/campaigns.functions";
import { listPublishingJobs, getPublishingStats } from "@/lib/marketing-os/publisher.functions";
import { getTimeseries, getPlatformAnalytics } from "@/lib/marketing-os/analytics.functions";

export const Route = createFileRoute("/_authenticated/admin/marketing-os/")({
  component: MarketingDashboard,
});

/* ------------------------------ helpers ------------------------------ */
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

const PLATFORM_META: Record<string, { color: string; hex: string; icon: React.ComponentType<{ className?: string }>; label: string }> = {
  instagram: { color: "bg-pink-500", hex: "#ec4899", icon: Instagram, label: "Instagram" },
  facebook: { color: "bg-blue-600", hex: "#2563eb", icon: Facebook, label: "Facebook" },
  linkedin: { color: "bg-sky-700", hex: "#0369a1", icon: Linkedin, label: "LinkedIn" },
  x: { color: "bg-neutral-900", hex: "#0a0a0a", icon: Twitter, label: "X" },
  twitter: { color: "bg-neutral-900", hex: "#0a0a0a", icon: Twitter, label: "X" },
  youtube: { color: "bg-red-600", hex: "#dc2626", icon: Youtube, label: "YouTube" },
  blog: { color: "bg-violet-600", hex: "#7c3aed", icon: FileText, label: "Blog" },
  email: { color: "bg-emerald-600", hex: "#059669", icon: Mail, label: "Email" },
  threads: { color: "bg-neutral-700", hex: "#404040", icon: Twitter, label: "Threads" },
};
const CORE_PLATFORMS = ["instagram", "facebook", "linkedin", "x", "blog", "email"] as const;

/* ------------------------------ page ------------------------------ */
function MarketingDashboard() {
  const navigate = useNavigate();
  const dash = useServerFn(getCampaignDashboard);
  const list = useServerFn(listCampaigns);
  const listJobs = useServerFn(listPublishingJobs);
  const pubStats = useServerFn(getPublishingStats);
  const timeseries = useServerFn(getTimeseries);
  const platformAnalytics = useServerFn(getPlatformAnalytics);

  const { data: dashData } = useQuery({ queryKey: ["mkt-dashboard"], queryFn: () => dash() });
  const { data: campaignsData, isLoading: campaignsLoading } = useQuery({
    queryKey: ["mkt-campaigns-all"], queryFn: () => list(),
  });
  const { data: pubData } = useQuery({ queryKey: ["publisher-stats"], queryFn: () => pubStats() });

  const [monthCursor, setMonthCursor] = useState<Date>(() => startOfMonth(new Date()));
  const monthStart = startOfMonth(monthCursor);
  const monthEnd = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0, 23, 59, 59);

  const { data: jobsData } = useQuery({
    queryKey: ["publishing-jobs-month", monthCursor.toISOString()],
    queryFn: () => listJobs({
      data: { from: monthStart.toISOString(), to: monthEnd.toISOString(), limit: 400 },
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

  // Sparkline data — last 14 days
  const spark14 = useQuery({
    queryKey: ["mkt-spark-14"],
    queryFn: () => {
      const to = new Date();
      const from = new Date(to.getTime() - 13 * 86400000);
      return timeseries({ data: { from: from.toISOString(), to: to.toISOString() } });
    },
  });
  const sparkSeries = spark14.data?.series ?? [];

  const totalCampaigns = dashData?.campaigns?.length ?? campaignsData?.campaigns.length ?? 0;
  const activeCampaigns = dashData?.counts?.active ?? 0;
  const revenue = dashData?.totals?.revenueCents ?? 0;
  const leads = dashData?.totals?.leads ?? 0;
  const scheduled = pubData?.scheduled ?? 0;
  const upcomingWeek = pubData?.upcomingWeek ?? 0;
  const publishedWeek = pubData?.publishedThisWeek ?? 0;
  const failedWeek = pubData?.failedThisWeek ?? 0;

  const sparkPosts = sparkSeries.map((s: any) => ({ v: s.posts }));
  const sparkLeads = sparkSeries.map((s: any) => ({ v: s.leads }));
  const sparkRevenue = sparkSeries.map((s: any) => ({ v: s.revenue }));
  const sparkAdmissions = sparkSeries.map((s: any) => ({ v: s.admissions }));

  const kpis = [
    {
      label: "Campaigns", value: num(totalCampaigns), sub: `${activeCampaigns} active`,
      icon: Megaphone, tone: "from-primary/20 via-primary/5 to-transparent",
      trend: sparkPosts, color: "#6366f1", href: "/admin/marketing-os/campaigns",
    },
    {
      label: "Scheduled Posts", value: num(scheduled), sub: `${upcomingWeek} this week`,
      icon: Send, tone: "from-blue-500/20 via-blue-500/5 to-transparent",
      trend: sparkPosts, color: "#3b82f6", href: "/admin/marketing-os/publisher",
    },
    {
      label: "Leads Generated", value: num(leads), sub: "Last 30 days",
      icon: Users, tone: "from-emerald-500/20 via-emerald-500/5 to-transparent",
      trend: sparkLeads, color: "#10b981", href: "/admin/marketing-os/analytics",
    },
    {
      label: "Revenue", value: money(revenue), sub: "Attributed · MTD",
      icon: IndianRupee, tone: "from-amber-500/20 via-amber-500/5 to-transparent",
      trend: sparkRevenue, color: "#f59e0b", href: "/admin/marketing-os/analytics",
    },
  ];

  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-primary">Marketing OS</div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">One workspace to plan, publish, measure, and grow.</p>
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
          const trendSum = k.trend.reduce((a: number, b: any) => a + Number(b.v ?? 0), 0);
          const half = Math.floor(k.trend.length / 2) || 1;
          const first = k.trend.slice(0, half).reduce((a: number, b: any) => a + Number(b.v ?? 0), 0);
          const second = k.trend.slice(half).reduce((a: number, b: any) => a + Number(b.v ?? 0), 0);
          const delta = first === 0 ? (second > 0 ? 100 : 0) : Math.round(((second - first) / Math.max(1, first)) * 100);
          const positive = delta >= 0;
          return (
            <Link key={k.label} to={k.href as any} className="group">
              <Card className="p-5 relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 duration-300 h-full">
                <div className={cn("absolute inset-0 bg-gradient-to-br pointer-events-none opacity-70", k.tone)} />
                <div className="relative">
                  <div className="flex items-start justify-between">
                    <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground">{k.label}</div>
                    <div className="size-8 rounded-lg bg-background/80 backdrop-blur border border-border/60 grid place-items-center group-hover:scale-110 transition-transform">
                      <Icon className="size-4 text-foreground/80" />
                    </div>
                  </div>
                  <div className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{k.value}</div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      {trendSum > 0 && (
                        <span className={cn(
                          "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-medium",
                          positive ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-red-500/15 text-red-700 dark:text-red-400",
                        )}>
                          {positive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                          {Math.abs(delta)}%
                        </span>
                      )}
                      <span className="text-muted-foreground">{k.sub}</span>
                    </div>
                  </div>
                  {trendSum > 0 && (
                    <div className="mt-3 h-10 -mx-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={k.trend}>
                          <defs>
                            <linearGradient id={`g-${k.label}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={k.color} stopOpacity={0.35} />
                              <stop offset="100%" stopColor={k.color} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="v" stroke={k.color} strokeWidth={2} fill={`url(#g-${k.label})`} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Calendar (70%) + Right rail (30%) */}
      <div className="grid grid-cols-1 xl:grid-cols-10 gap-4">
        <Card className="xl:col-span-7 p-5">
          <CalendarMonth cursor={monthCursor} setCursor={setMonthCursor} jobsByDay={jobsByDay} />
        </Card>

        <div className="xl:col-span-3 space-y-4">
          <TodayActivity publishedWeek={publishedWeek} scheduled={scheduled} failedWeek={failedWeek} upcomingWeek={upcomingWeek} />
          <PublishingQueue jobs={jobs.filter((j: any) => new Date(j.scheduled_at) >= new Date()).slice(0, 5)} />
          <UpcomingDeadlines campaigns={campaignsData?.campaigns ?? []} />
        </div>
      </div>

      {/* Content Performance */}
      <ContentPerformance timeseries={timeseries} />

      {/* Platform Performance */}
      <PlatformPerformance fn={platformAnalytics} />

      {/* Campaign Table */}
      <CampaignTable
        campaigns={campaignsData?.campaigns ?? []}
        loading={campaignsLoading}
        onOpen={(c) => setSelectedCampaign(c)}
      />

      {/* Right drawer */}
      <CampaignDrawer campaign={selectedCampaign} onClose={() => setSelectedCampaign(null)} />

      {/* Floating Action */}
      <FloatingCreate onNavigate={(p) => navigate({ to: p as any })} />
    </div>
  );
}

/* ------------------------------ status badge ------------------------------ */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    completed: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
    paused: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    archived: "bg-muted text-muted-foreground",
    draft: "bg-neutral-500/10 text-neutral-700 dark:text-neutral-400 border-neutral-500/20",
    planning: "bg-neutral-500/10 text-neutral-700 dark:text-neutral-400 border-neutral-500/20",
    ready: "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30",
  };
  return (
    <Badge variant="outline" className={cn("border capitalize font-medium", map[status] ?? map.draft)}>
      {status}
    </Badge>
  );
}

/* ------------------------------ calendar ------------------------------ */
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
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="font-semibold text-lg">{monthLabel}</h3>
          <p className="text-xs text-muted-foreground">Marketing calendar — every scheduled asset across all platforms</p>
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

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-3 text-[11px] text-muted-foreground">
        {CORE_PLATFORMS.map((p) => (
          <div key={p} className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", PLATFORM_META[p].color)} />
            <span className="capitalize">{PLATFORM_META[p].label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-border/60 rounded-lg overflow-hidden border border-border/60">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
          <div key={d} className="bg-muted/50 px-2 py-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
            {d}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (!cell.date) return <div key={i} className="bg-muted/20 min-h-[96px]" />;
          const isToday = cell.date.getTime() === today.getTime();
          const daysJobs = jobsByDay.get(cell.date.toDateString()) ?? [];
          return (
            <div key={i} className="bg-background min-h-[96px] p-1.5 flex flex-col gap-1 hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-xs font-medium size-6 grid place-items-center rounded-full tabular-nums",
                  isToday ? "bg-primary text-primary-foreground" : "text-foreground",
                )}>
                  {cell.date.getDate()}
                </span>
                {daysJobs.length > 3 && (
                  <span className="text-[10px] text-muted-foreground font-medium">+{daysJobs.length - 3}</span>
                )}
              </div>
              <div className="space-y-0.5 overflow-hidden">
                {daysJobs.slice(0, 3).map((j) => {
                  const meta = PLATFORM_META[j.platform] ?? PLATFORM_META.blog;
                  return (
                    <div
                      key={j.id}
                      className="flex items-center gap-1 text-[10px] rounded px-1 py-0.5 bg-muted/60 truncate"
                      title={`${meta.label} — ${j.account_label ?? ""}`}
                    >
                      <span className={cn("size-1.5 rounded-full shrink-0", meta.color)} />
                      <span className="truncate">{meta.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------ right rail ------------------------------ */
function TodayActivity({ publishedWeek, scheduled, failedWeek, upcomingWeek }: {
  publishedWeek: number; scheduled: number; failedWeek: number; upcomingWeek: number;
}) {
  const items = [
    { label: "Published (7d)", value: publishedWeek, color: "text-emerald-600", icon: CheckCircle2 },
    { label: "Scheduled", value: scheduled, color: "text-blue-600", icon: Clock },
    { label: "Upcoming (7d)", value: upcomingWeek, color: "text-violet-600", icon: Send },
    { label: "Failed (7d)", value: failedWeek, color: "text-red-600", icon: AlertCircle },
  ];
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="size-4 text-primary" />
        <h3 className="font-medium">Today's Activity</h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <div key={it.label} className="rounded-lg bg-muted/40 p-2.5">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Icon className={cn("size-3", it.color)} />{it.label}
              </div>
              <div className="mt-0.5 text-xl font-semibold tabular-nums">{it.value}</div>
            </div>
          );
        })}
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
        <EmptyMini text="Nothing queued." action={{ label: "Schedule", to: "/admin/marketing-os/publisher" }} />
      ) : (
        <div className="space-y-2">
          {jobs.map((j) => {
            const meta = PLATFORM_META[j.platform] ?? PLATFORM_META.blog;
            return (
              <div key={j.id} className="flex items-center gap-2 text-sm">
                <span className={cn("size-2 rounded-full shrink-0", meta.color)} />
                <span className="flex-1 truncate">{j.account_label || meta.label}</span>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {new Date(j.scheduled_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
                {j.status === "failed" && <AlertCircle className="size-3.5 text-red-500" />}
                {j.status === "publishing" && <Circle className="size-3.5 text-amber-500 animate-pulse" />}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function UpcomingDeadlines({ campaigns }: { campaigns: Campaign[] }) {
  const now = Date.now();
  const upcoming = campaigns
    .filter((c) => c.ends_at && new Date(c.ends_at).getTime() > now && c.status !== "archived")
    .sort((a, b) => new Date(a.ends_at!).getTime() - new Date(b.ends_at!).getTime())
    .slice(0, 5);

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="size-4 text-primary" />
        <h3 className="font-medium">Upcoming Deadlines</h3>
      </div>
      {upcoming.length === 0 ? (
        <EmptyMini text="No campaign deadlines." action={{ label: "New campaign", to: "/admin/marketing-os/campaigns" }} />
      ) : (
        <div className="space-y-2">
          {upcoming.map((c) => {
            const days = Math.ceil((new Date(c.ends_at!).getTime() - now) / 86400000);
            const severity = days <= 3 ? "high" : days <= 7 ? "med" : "low";
            return (
              <Link
                key={c.id}
                to="/admin/marketing-os/campaigns/$id"
                params={{ id: c.id }}
                className="flex items-center gap-2 text-sm hover:bg-muted/40 -mx-1 px-1 py-1 rounded transition-colors"
              >
                <span className={cn(
                  "size-2 rounded-full shrink-0",
                  severity === "high" ? "bg-red-500" : severity === "med" ? "bg-amber-500" : "bg-emerald-500",
                )} />
                <span className="flex-1 truncate">{c.name}</span>
                <span className="text-[11px] text-muted-foreground shrink-0">in {days}d</span>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function EmptyMini({ text, action }: { text: string; action?: { label: string; to: string } }) {
  return (
    <div className="py-6 text-center">
      <div className="text-xs text-muted-foreground">{text}</div>
      {action && (
        <Button asChild variant="link" size="sm" className="h-6 text-xs mt-1">
          <Link to={action.to as any}>{action.label} <ArrowUpRight className="size-3 ml-0.5" /></Link>
        </Button>
      )}
    </div>
  );
}

/* ------------------------------ content performance ------------------------------ */
function ContentPerformance({ timeseries }: { timeseries: ReturnType<typeof useServerFn<typeof getTimeseries>> }) {
  const [range, setRange] = useState<"7" | "30" | "90" | "365">("30");
  const [metric, setMetric] = useState<"posts" | "leads" | "admissions" | "revenue">("leads");
  const { data, isLoading } = useQuery({
    queryKey: ["mkt-timeseries", range],
    queryFn: () => {
      const to = new Date();
      const from = new Date(to.getTime() - (Number(range) - 1) * 86400000);
      return timeseries({ data: { from: from.toISOString(), to: to.toISOString() } });
    },
  });

  const series = (data?.series ?? []).map((s: any) => ({
    date: s.date,
    label: new Date(s.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    posts: s.posts,
    leads: s.leads,
    admissions: s.admissions,
    revenue: s.revenue / 100,
  }));

  const metricMeta: Record<string, { color: string; label: string; fmt: (n: number) => string }> = {
    posts: { color: "#6366f1", label: "Reach (posts)", fmt: (n) => num(n) },
    leads: { color: "#10b981", label: "Leads", fmt: (n) => num(n) },
    admissions: { color: "#f59e0b", label: "Admissions", fmt: (n) => num(n) },
    revenue: { color: "#ec4899", label: "Revenue", fmt: (n) => `₹${num(n)}` },
  };
  const m = metricMeta[metric];

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h3 className="font-semibold">Content Performance</h3>
          <p className="text-xs text-muted-foreground">Trends across the selected window</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-lg border border-border/60 p-0.5 bg-muted/30">
            {(["posts","leads","admissions","revenue"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setMetric(k)}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-md transition-colors capitalize",
                  metric === k ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground",
                )}
              >{k}</button>
            ))}
          </div>
          <div className="inline-flex rounded-lg border border-border/60 p-0.5 bg-muted/30">
            {(["7","30","90","365"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-md transition-colors",
                  range === r ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground",
                )}
              >{r}d</button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-[280px]">
        {isLoading ? (
          <Skeleton className="w-full h-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="lineG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={m.color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={m.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} opacity={0.5} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} tickFormatter={(v) => m.fmt(Number(v))} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                formatter={(v: any) => [m.fmt(Number(v)), m.label]}
              />
              <Line type="monotone" dataKey={metric} stroke={m.color} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

/* ------------------------------ platform performance ------------------------------ */
function PlatformPerformance({ fn }: { fn: ReturnType<typeof useServerFn<typeof getPlatformAnalytics>> }) {
  const { data, isLoading } = useQuery({
    queryKey: ["mkt-platform-analytics"],
    queryFn: () => fn({ data: {} }),
  });
  const rows = (data?.rows ?? []).filter((r: any) => CORE_PLATFORMS.includes(r.platform));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold">Platform Performance</h3>
          <p className="text-xs text-muted-foreground">Last 30 days across connected channels</p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/marketing-os/analytics">All platforms <ArrowUpRight className="size-3.5 ml-1" /></Link>
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
          : CORE_PLATFORMS.map((p) => {
              const meta = PLATFORM_META[p];
              const Icon = meta.icon;
              const row = rows.find((r: any) => r.platform === p) ?? {
                platform: p, reach: 0, impressions: 0, likes: 0, comments: 0, shares: 0,
                followerGrowth: 0, engagementRate: 0, postsPublished: 0,
              };
              const engagement = row.likes + row.comments + row.shares;
              return (
                <Card key={p} className="p-4 hover:shadow-md transition-all hover:-translate-y-0.5 duration-300">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn("size-7 rounded-lg text-white grid place-items-center", meta.color)}>
                      <Icon className="size-3.5" />
                    </div>
                    <div className="text-sm font-medium">{meta.label}</div>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">Reach</span><span className="tabular-nums font-medium">{num(row.reach)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Engagement</span><span className="tabular-nums font-medium">{num(engagement)}</span></div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Growth</span>
                      <span className={cn("tabular-nums font-medium inline-flex items-center gap-0.5",
                        row.followerGrowth >= 0 ? "text-emerald-600" : "text-red-600")}>
                        {row.followerGrowth >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                        {num(Math.abs(row.followerGrowth))}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1.5 mt-1.5 border-t border-border/60"><span className="text-muted-foreground">Posts</span><span className="tabular-nums font-medium">{num(row.postsPublished)}</span></div>
                  </div>
                </Card>
              );
            })}
      </div>
    </div>
  );
}

/* ------------------------------ campaign table ------------------------------ */
type SortKey = "name" | "status" | "starts_at" | "ends_at" | "actual_leads" | "actual_revenue_cents" | "budget_cents";

function CampaignTable({
  campaigns, loading, onOpen,
}: {
  campaigns: Campaign[]; loading: boolean; onOpen: (c: Campaign) => void;
}) {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "starts_at", dir: "desc" });
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const pageSize = 10;

  const statuses = useMemo(() => [...new Set(campaigns.map((c) => c.status))], [campaigns]);

  const filtered = useMemo(() => {
    let rows = campaigns;
    if (q.trim()) {
      const t = q.toLowerCase();
      rows = rows.filter((c) =>
        c.name.toLowerCase().includes(t) ||
        (c.objective ?? "").toLowerCase().includes(t) ||
        (c.campaign_type ?? "").toLowerCase().includes(t),
      );
    }
    if (statusFilter.length) rows = rows.filter((c) => statusFilter.includes(c.status));
    rows = [...rows].sort((a, b) => {
      const av = (a[sort.key] ?? 0) as any;
      const bv = (b[sort.key] ?? 0) as any;
      if (typeof av === "string" && typeof bv === "string") {
        return sort.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sort.dir === "asc" ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });
    return rows;
  }, [campaigns, q, statusFilter, sort]);

  const paged = filtered.slice(page * pageSize, page * pageSize + pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }));
  }

  const roi = (c: Campaign) => {
    const spend = Number(c.budget_cents ?? 0);
    const rev = Number(c.actual_revenue_cents ?? 0);
    if (!spend) return null;
    return ((rev - spend) / spend) * 100;
  };
  const progress = (c: Campaign) => {
    if (!c.starts_at || !c.ends_at) return 0;
    const s = new Date(c.starts_at).getTime();
    const e = new Date(c.ends_at).getTime();
    const now = Date.now();
    if (now <= s) return 0;
    if (now >= e) return 100;
    return Math.round(((now - s) / (e - s)) * 100);
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-border/60 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Campaigns</h3>
          <Badge variant="outline" className="tabular-nums">{filtered.length}</Badge>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }}
              placeholder="Search campaigns…" className="pl-8 h-9 w-56" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="size-3.5 mr-1.5" /> Status
                {statusFilter.length > 0 && <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">{statusFilter.length}</Badge>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {statuses.map((s) => (
                <DropdownMenuCheckboxItem
                  key={s}
                  checked={statusFilter.includes(s)}
                  onCheckedChange={(v) => {
                    setStatusFilter((prev) => v ? [...prev, s] : prev.filter((x) => x !== s));
                    setPage(0);
                  }}
                  className="capitalize"
                >{s}</DropdownMenuCheckboxItem>
              ))}
              {statusFilter.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setStatusFilter([])}>
                    <X className="size-3.5 mr-1.5" /> Clear filters
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="sm" asChild className="h-9">
            <Link to="/admin/marketing-os/campaigns">Manage all <ArrowUpRight className="size-3.5 ml-1" /></Link>
          </Button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="px-4 py-2 bg-primary/5 border-b border-border/60 flex items-center gap-3 text-sm">
          <span className="font-medium">{selected.size} selected</span>
          <Button variant="outline" size="sm">Bulk action</Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted/40 backdrop-blur z-10">
            <tr className="text-left text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
              <th className="px-3 py-2.5 w-8">
                <Checkbox
                  checked={paged.length > 0 && paged.every((c) => selected.has(c.id))}
                  onCheckedChange={(v) => {
                    setSelected((prev) => {
                      const next = new Set(prev);
                      paged.forEach((c) => v ? next.add(c.id) : next.delete(c.id));
                      return next;
                    });
                  }}
                />
              </th>
              <SortableTh label="Campaign" active={sort.key === "name"} dir={sort.dir} onClick={() => toggleSort("name")} />
              <SortableTh label="Status" active={sort.key === "status"} dir={sort.dir} onClick={() => toggleSort("status")} />
              <th className="px-3 py-2.5 font-normal">Platforms</th>
              <SortableTh label="Budget" active={sort.key === "budget_cents"} dir={sort.dir} onClick={() => toggleSort("budget_cents")} align="right" />
              <SortableTh label="Revenue" active={sort.key === "actual_revenue_cents"} dir={sort.dir} onClick={() => toggleSort("actual_revenue_cents")} align="right" />
              <SortableTh label="Leads" active={sort.key === "actual_leads"} dir={sort.dir} onClick={() => toggleSort("actual_leads")} align="right" />
              <th className="px-3 py-2.5 font-normal text-right">ROI</th>
              <th className="px-3 py-2.5 font-normal">Progress</th>
              <SortableTh label="Timeline" active={sort.key === "starts_at"} dir={sort.dir} onClick={() => toggleSort("starts_at")} />
              <th className="px-3 py-2.5 font-normal w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={11} className="p-2"><Skeleton className="h-9 w-full" /></td></tr>
              ))
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-16 text-center">
                  <div className="mx-auto size-12 rounded-2xl bg-primary/10 grid place-items-center mb-3">
                    <Megaphone className="size-6 text-primary" />
                  </div>
                  <div className="font-medium">No campaigns found</div>
                  <div className="text-xs text-muted-foreground mb-3">
                    {q || statusFilter.length ? "Try adjusting your search or filters." : "Start planning your first marketing campaign."}
                  </div>
                  <Button asChild size="sm">
                    <Link to="/admin/marketing-os/campaigns"><Plus className="size-3.5 mr-1" /> New Campaign</Link>
                  </Button>
                </td>
              </tr>
            ) : (
              paged.map((c) => {
                const r = roi(c);
                const p = progress(c);
                return (
                  <tr
                    key={c.id}
                    className="hover:bg-muted/40 transition-colors cursor-pointer group"
                    onClick={() => onOpen(c)}
                  >
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selected.has(c.id)}
                        onCheckedChange={(v) => {
                          setSelected((prev) => {
                            const next = new Set(prev);
                            v ? next.add(c.id) : next.delete(c.id);
                            return next;
                          });
                        }}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium group-hover:text-primary transition-colors">{c.name}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[280px]">
                        {c.objective || c.campaign_type || "—"}
                      </div>
                    </td>
                    <td className="px-3 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-3 py-3">
                      <div className="flex -space-x-1">
                        {(c.target_platforms ?? []).slice(0, 4).map((p) => {
                          const meta = PLATFORM_META[p] ?? PLATFORM_META.blog;
                          const Icon = meta.icon;
                          return (
                            <div key={p} className={cn("size-6 rounded-full ring-2 ring-background grid place-items-center text-white", meta.color)} title={meta.label}>
                              <Icon className="size-3" />
                            </div>
                          );
                        })}
                        {(c.target_platforms ?? []).length > 4 && (
                          <div className="size-6 rounded-full ring-2 ring-background bg-muted grid place-items-center text-[10px] font-medium">
                            +{(c.target_platforms ?? []).length - 4}
                          </div>
                        )}
                        {(!c.target_platforms || c.target_platforms.length === 0) && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">{money(Number(c.budget_cents ?? 0))}</td>
                    <td className="px-3 py-3 text-right tabular-nums font-medium">{money(Number(c.actual_revenue_cents ?? 0))}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{num(Number(c.actual_leads ?? 0))}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {r === null ? <span className="text-muted-foreground">—</span> : (
                        <span className={cn("font-medium", r >= 0 ? "text-emerald-600" : "text-red-600")}>
                          {r >= 0 ? "+" : ""}{r.toFixed(0)}%
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 min-w-[100px]">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary transition-all" style={{ width: `${p}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground tabular-nums w-8">{p}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                      {c.starts_at ? new Date(c.starts_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—"}
                      {c.ends_at ? ` → ${new Date(c.ends_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : ""}
                    </td>
                    <td className="px-3 py-3">
                      <Button variant="ghost" size="icon" className="size-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); onOpen(c); }}>
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > pageSize && (
        <div className="px-4 py-2.5 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <div>Showing {page * pageSize + 1}–{Math.min(filtered.length, (page + 1) * pageSize)} of {filtered.length}</div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-7" disabled={page === 0} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="size-3.5" />
            </Button>
            <span className="tabular-nums px-2">Page {page + 1} / {totalPages}</span>
            <Button variant="outline" size="sm" className="h-7" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function SortableTh({ label, active, dir, onClick, align = "left" }: {
  label: string; active: boolean; dir: "asc" | "desc"; onClick: () => void; align?: "left" | "right";
}) {
  return (
    <th className={cn("px-3 py-2.5 font-normal cursor-pointer select-none", align === "right" && "text-right")} onClick={onClick}>
      <span className={cn("inline-flex items-center gap-1 hover:text-foreground transition-colors", active && "text-foreground")}>
        {label}
        <ArrowUpDown className={cn("size-3 opacity-50", active && "opacity-100")} />
        {active && <span className="text-[8px]">{dir === "asc" ? "↑" : "↓"}</span>}
      </span>
    </th>
  );
}

/* ------------------------------ campaign drawer ------------------------------ */
function CampaignDrawer({ campaign, onClose }: { campaign: Campaign | null; onClose: () => void }) {
  const open = Boolean(campaign);
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="sm:max-w-[540px] w-full overflow-y-auto">
        {campaign && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2 mb-1">
                <StatusBadge status={campaign.status} />
                {campaign.campaign_type && (
                  <Badge variant="outline" className="capitalize">{campaign.campaign_type.replace(/_/g, " ")}</Badge>
                )}
              </div>
              <SheetTitle className="text-xl">{campaign.name}</SheetTitle>
              <p className="text-sm text-muted-foreground">{campaign.objective || "No objective specified."}</p>
            </SheetHeader>

            <Tabs defaultValue="overview" className="mt-4">
              <TabsList className="w-full grid grid-cols-7">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="assets">Assets</TabsTrigger>
                <TabsTrigger value="automation">Auto</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <StatBox label="Budget" value={money(Number(campaign.budget_cents ?? 0))} />
                  <StatBox label="Revenue" value={money(Number(campaign.actual_revenue_cents ?? 0))} />
                  <StatBox label="Leads" value={num(Number(campaign.actual_leads ?? 0))} />
                  <StatBox label="Admissions" value={num(Number(campaign.actual_admissions ?? 0))} />
                </div>

                <div>
                  <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground mb-2">Timeline</div>
                  <div className="text-sm">
                    {campaign.starts_at ? new Date(campaign.starts_at).toLocaleDateString() : "—"}
                    {campaign.ends_at ? ` → ${new Date(campaign.ends_at).toLocaleDateString()}` : ""}
                  </div>
                </div>

                {campaign.target_platforms?.length > 0 && (
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground mb-2">Platforms</div>
                    <div className="flex flex-wrap gap-1.5">
                      {campaign.target_platforms.map((p) => {
                        const meta = PLATFORM_META[p] ?? PLATFORM_META.blog;
                        const Icon = meta.icon;
                        return (
                          <Badge key={p} variant="outline" className="gap-1 capitalize">
                            <Icon className="size-3" /> {meta.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {campaign.tags?.length > 0 && (
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground mb-2">Tags</div>
                    <div className="flex flex-wrap gap-1.5">
                      {campaign.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
                    </div>
                  </div>
                )}

                {campaign.description && (
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground mb-2">Description</div>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{campaign.description}</p>
                  </div>
                )}

                <div className="pt-3 border-t border-border/60 flex gap-2">
                  <Button asChild className="flex-1">
                    <Link to="/admin/marketing-os/campaigns/$id" params={{ id: campaign.id }}>
                      Open campaign <ArrowUpRight className="size-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="content" className="mt-4">
                <DrawerLink to={`/admin/marketing-os/campaigns/${campaign.id}`} label="Manage content" />
              </TabsContent>
              <TabsContent value="calendar" className="mt-4">
                <DrawerLink to="/admin/marketing-os/calendar" label="Open in calendar" />
              </TabsContent>
              <TabsContent value="analytics" className="mt-4">
                <DrawerLink to="/admin/marketing-os/analytics" label="View analytics" />
              </TabsContent>
              <TabsContent value="assets" className="mt-4">
                <DrawerLink to="/admin/marketing-os/media-library" label="Browse assets" />
              </TabsContent>
              <TabsContent value="automation" className="mt-4">
                <DrawerLink to="/admin/marketing-os/automation" label="Configure automation" />
              </TabsContent>
              <TabsContent value="settings" className="mt-4">
                <DrawerLink to={`/admin/marketing-os/campaigns/${campaign.id}`} label="Edit settings" />
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold tabular-nums mt-0.5">{value}</div>
    </div>
  );
}

function DrawerLink({ to, label }: { to: string; label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-8 text-center">
      <p className="text-sm text-muted-foreground mb-3">This view lives in its own workspace.</p>
      <Button asChild size="sm"><Link to={to as any}>{label} <ArrowUpRight className="size-3.5 ml-1" /></Link></Button>
    </div>
  );
}

/* ------------------------------ floating action ------------------------------ */
function FloatingCreate({ onNavigate }: { onNavigate: (p: string) => void }) {
  const items = [
    { icon: Megaphone, label: "Campaign", to: "/admin/marketing-os/campaigns" },
    { icon: PenLine, label: "Content", to: "/admin/marketing-os/content" },
    { icon: Globe, label: "Landing Page", to: "/admin/marketing-os/planner" },
    { icon: Mail, label: "Email", to: "/admin/marketing-os/email" },
    { icon: FileText, label: "Blog", to: "/admin/ai-content" },
    { icon: ClipboardList, label: "Form", to: "/admin/marketing-os/planner" },
    { icon: FolderOpen, label: "Asset", to: "/admin/marketing-os/media-library" },
    { icon: Wand2, label: "AI Plan", to: "/admin/marketing-os/planner" },
  ];
  return (
    <div className="fixed bottom-6 right-6 z-40">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="lg" className="rounded-full size-14 shadow-lg hover:shadow-xl hover:scale-105 transition-all p-0">
            <Plus className="size-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-56 mb-2">
          <DropdownMenuLabel>Quick create</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <DropdownMenuItem key={it.label} onClick={() => onNavigate(it.to)}>
                <Icon className="size-4 mr-2" /> {it.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
