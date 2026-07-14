import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  Activity, ArrowRight, BadgeCheck, BadgePercent, Banknote, Building2, CalendarDays,
  ChevronRight, Clock, FileSignature, FileText, Flame, Handshake, LineChart, ListChecks,
  Radar, RefreshCw, Shield, Target, Timer, TrendingUp, Upload, UserCheck, Users, Wallet,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  getCommandTopMetrics, getCommandAnalytics, getCommandOperational,
  getSalesWorkMonitoring, getRecentSalesActivity,
} from "@/lib/admin/sales-command.functions";

export const Route = createFileRoute("/_authenticated/admin/sales-command")({
  component: SalesCommandCenter,
});

// ------------- helpers -------------
const fmtInr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
const fmtInt = (n: number) => new Intl.NumberFormat("en-IN").format(n || 0);
const fmtPct = (n: number) => `${(n || 0).toFixed(1)}%`;
const fmtRelative = (iso?: string | null) => {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
};

type Preset = "today" | "yesterday" | "7d" | "30d" | "month" | "last_month" | "custom";

function rangeFor(preset: Preset, custom?: { from: Date; to: Date }) {
  const now = new Date();
  const start = new Date(now); start.setUTCHours(0, 0, 0, 0);
  if (preset === "today") return { from: start, to: now };
  if (preset === "yesterday") {
    const y = new Date(start); y.setUTCDate(y.getUTCDate() - 1);
    const end = new Date(start); end.setUTCMilliseconds(-1);
    return { from: y, to: end };
  }
  if (preset === "7d") { const s = new Date(start); s.setUTCDate(s.getUTCDate() - 6); return { from: s, to: now }; }
  if (preset === "30d") { const s = new Date(start); s.setUTCDate(s.getUTCDate() - 29); return { from: s, to: now }; }
  if (preset === "month") { const s = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)); return { from: s, to: now }; }
  if (preset === "last_month") {
    const s = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const e = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)); e.setUTCMilliseconds(-1);
    return { from: s, to: e };
  }
  if (preset === "custom" && custom) return { from: custom.from, to: custom.to };
  return { from: start, to: now };
}

function Section({ title, subtitle, icon: Icon, action, children }: any) {
  return (
    <section className="rounded-2xl border border-border/70 bg-white overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className="size-4 text-primary" />}
          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em]">{title}</h3>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function StatCard({ label, value, icon: Icon, tone, hint, to }: any) {
  const inner = (
    <div className="rounded-xl border border-border/70 bg-white p-4 hover:shadow-sm transition-shadow h-full">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
        {Icon && <Icon className={cn("size-3.5", tone ?? "text-primary")} />}
      </div>
      <div className="mt-2 text-2xl font-display font-semibold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
  return to ? <Link to={to} className="block">{inner}</Link> : inner;
}

// ------------- component -------------
function SalesCommandCenter() {
  const [preset, setPreset] = useState<Preset>("30d");
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>({});

  const { from, to } = useMemo(() => {
    if (preset === "custom" && customRange.from && customRange.to)
      return rangeFor("custom", { from: customRange.from, to: customRange.to });
    return rangeFor(preset);
  }, [preset, customRange]);

  const topFn = useServerFn(getCommandTopMetrics);
  const analyticsFn = useServerFn(getCommandAnalytics);
  const opsFn = useServerFn(getCommandOperational);
  const monitorFn = useServerFn(getSalesWorkMonitoring);
  const activityFn = useServerFn(getRecentSalesActivity);

  const top = useQuery({
    queryKey: ["command-top"],
    queryFn: () => topFn(),
    refetchInterval: 60_000,
  });
  const analytics = useQuery({
    queryKey: ["command-analytics", from.toISOString(), to.toISOString(), groupBy],
    queryFn: () => analyticsFn({ data: { from: from.toISOString(), to: to.toISOString(), groupBy } }),
  });
  const ops = useQuery({
    queryKey: ["command-ops"],
    queryFn: () => opsFn(),
    refetchInterval: 60_000,
  });
  const monitor = useQuery({
    queryKey: ["command-monitor"],
    queryFn: () => monitorFn(),
    refetchInterval: 120_000,
  });
  const activity = useQuery({
    queryKey: ["command-activity"],
    queryFn: () => activityFn(),
    refetchInterval: 45_000,
  });

  const t = top.data;
  const a = analytics.data;
  const o = ops.data;
  const funnelMax = Math.max(1, ...(a?.funnel ?? []).map((f: any) => f.count));

  return (
    <div className="space-y-6 max-w-[1500px]">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-mono uppercase tracking-[0.14em]">
            <Radar className="size-3.5" /> Sales Command Center
          </div>
          <h1 className="text-3xl font-display font-semibold tracking-tight mt-2">Company Sales Operations</h1>
          <p className="text-sm text-muted-foreground mt-1">Live view of every sale, payment, payout and partner across Glintr.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={preset} onValueChange={(v) => setPreset(v as Preset)}>
            <SelectTrigger className="w-[170px]"><CalendarDays className="size-3.5 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="month">This month</SelectItem>
              <SelectItem value="last_month">Last month</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          {preset === "custom" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  {customRange.from ? customRange.from.toLocaleDateString() : "Start"} –{" "}
                  {customRange.to ? customRange.to.toLocaleDateString() : "End"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={{ from: customRange.from, to: customRange.to } as any}
                  onSelect={(r: any) => setCustomRange({ from: r?.from, to: r?.to })}
                  numberOfMonths={2}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          )}
          <Button variant="ghost" size="sm" onClick={() => { top.refetch(); analytics.refetch(); ops.refetch(); monitor.refetch(); activity.refetch(); }}>
            <RefreshCw className="size-3.5 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* 1. Top metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Today Verified Sales" value={fmtInt(t?.todayVerifiedSales ?? 0)} icon={BadgeCheck} to="/admin/payment-verification" />
        <StatCard label="Today Revenue" value={fmtInr(t?.todayVerifiedRevenue ?? 0)} icon={TrendingUp} />
        <StatCard label="Month Revenue" value={fmtInr(t?.monthVerifiedRevenue ?? 0)} icon={LineChart} />
        <StatCard label="Pending Verification" value={fmtInt(t?.pendingVerification ?? 0)} icon={Clock} to="/admin/payment-verification" tone="text-amber-600" />
        <StatCard label="Under Review" value={fmtInt(t?.underReview ?? 0)} icon={Shield} to="/admin/payment-verification" tone="text-amber-600" />
        <StatCard label="Active Sales Partners" value={fmtInt(t?.activePartners ?? 0)} icon={Users} to="/admin/partners" />
        <StatCard label="Leads Assigned Today" value={fmtInt(t?.leadsAssignedToday ?? 0)} icon={Target} to="/admin/lead-management" />
        <StatCard label="Leads Not Contacted" value={fmtInt(t?.leadsNotContacted ?? 0)} icon={Timer} to="/admin/lead-monitoring" tone="text-rose-600" />
        <StatCard label="Overdue Follow-Ups" value={fmtInt(t?.overdueFollowUps ?? 0)} icon={Flame} to="/admin/lead-monitoring" tone="text-rose-600" />
        <StatCard label="Approved Payouts Due" value={fmtInr(t?.approvedPayoutsDue ?? 0)} icon={Wallet} to="/admin/partner-payouts" tone="text-primary" />
        <StatCard label="Ownership Reviews Pending" value={fmtInt(t?.pendingOwnershipReviews ?? 0)} icon={Shield} to="/admin/lead-ownership" tone="text-amber-600" />
      </div>

      {/* 3. Company sales performance */}
      <Section
        title="Company Sales Performance"
        subtitle={`Verified sales & revenue · ${from.toLocaleDateString()} – ${to.toLocaleDateString()}`}
        icon={TrendingUp}
        action={
          <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as any)}>
            <TabsList className="h-8">
              <TabsTrigger value="day" className="text-xs">Daily</TabsTrigger>
              <TabsTrigger value="week" className="text-xs">Weekly</TabsTrigger>
              <TabsTrigger value="month" className="text-xs">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      >
        <div className="grid lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1 space-y-3">
            <div className="rounded-xl border border-border/70 bg-surface-1/40 p-4">
              <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">Verified Sales</div>
              <div className="text-3xl font-display font-semibold mt-1">{fmtInt(a?.totalVerifiedSales ?? 0)}</div>
            </div>
            <div className="rounded-xl border border-border/70 bg-surface-1/40 p-4">
              <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">Verified Revenue</div>
              <div className="text-3xl font-display font-semibold mt-1">{fmtInr(a?.totalVerifiedRevenue ?? 0)}</div>
            </div>
          </div>
          <div className="lg:col-span-3 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={a?.salesSeries ?? []}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0891b2" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0891b2" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="sal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="bucket" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="left" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="right" orientation="right" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <Tooltip formatter={(v: any, k: any) => (k === "revenue" ? fmtInr(Number(v)) : fmtInt(Number(v)))} />
                <Legend />
                <Area yAxisId="right" type="monotone" dataKey="revenue" stroke="#0891b2" strokeWidth={2} fill="url(#rev)" />
                <Area yAxisId="left" type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} fill="url(#sal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Section>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 4. Top Sales Partners */}
        <div className="lg:col-span-2">
          <Section title="Top Sales Partners" subtitle="By verified revenue in selected range" icon={Users}>
            {(a?.topPartners ?? []).length === 0 ? (
              <div className="text-sm text-muted-foreground py-6 text-center">No verified sales in this range.</div>
            ) : (
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground border-b border-border/60">
                      <th className="py-2 pr-3">#</th>
                      <th className="py-2 pr-3">Partner</th>
                      <th className="py-2 pr-3 text-right">Sales</th>
                      <th className="py-2 pr-3 text-right">Revenue</th>
                      <th className="py-2 pr-3 text-right">Conv %</th>
                      <th className="py-2 pr-3 text-right">Earnings</th>
                      <th className="py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(a?.topPartners ?? []).map((p: any, i: number) => (
                      <tr key={p.partnerId} className="border-b border-border/40 last:border-b-0">
                        <td className="py-2.5 pr-3 text-muted-foreground">{i + 1}</td>
                        <td className="py-2.5 pr-3">
                          <div className="font-medium">{p.name}</div>
                          <div className="text-[11px] font-mono text-muted-foreground">{p.partnerCode}</div>
                        </td>
                        <td className="py-2.5 pr-3 text-right tabular-nums">{fmtInt(p.sales)}</td>
                        <td className="py-2.5 pr-3 text-right tabular-nums font-medium">{fmtInr(p.revenue)}</td>
                        <td className="py-2.5 pr-3 text-right tabular-nums">{fmtPct(p.conversionRate)}</td>
                        <td className="py-2.5 pr-3 text-right tabular-nums">{fmtInr(p.earnings)}</td>
                        <td className="py-2.5">
                          <Link to="/admin/partners/$id" params={{ id: p.partnerId }} className="text-primary text-xs inline-flex items-center gap-1 hover:underline">
                            View <ChevronRight className="size-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </div>

        {/* 12. Sales Team status */}
        <Section title="Sales Team Status" subtitle="Real-time roster" icon={Activity}>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Active Now" value={fmtInt(o?.team.activeNow ?? 0)} icon={BadgeCheck} tone="text-emerald-600" />
            <StatCard label="Active Today" value={fmtInt(o?.team.activeToday ?? 0)} icon={Activity} tone="text-primary" />
            <StatCard label="No Activity Today" value={fmtInt(o?.team.noActivityToday ?? 0)} icon={Timer} tone="text-amber-600" />
            <StatCard label="Suspended" value={fmtInt(o?.team.suspended ?? 0)} icon={Shield} tone="text-rose-600" />
            <StatCard label="Flexible" value={fmtInt(o?.team.flexible ?? 0)} icon={Users} />
            <StatCard label="Full-Time" value={fmtInt(o?.team.fullTime ?? 0)} icon={UserCheck} />
          </div>
        </Section>
      </div>

      {/* 5. Program-wise sales */}
      <Section title="Program Performance" subtitle="Verified sales by program" icon={LineChart}>
        {(a?.programPerformance ?? []).length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center">No verified sales for any program in this range.</div>
        ) : (
          <ProgramTable rows={a?.programPerformance ?? []} />
        )}
      </Section>

      {/* 6. Lead source performance */}
      <Section title="Lead Source Performance" subtitle="Sales Partner own leads vs Glintr-provided leads" icon={Handshake}>
        <div className="grid md:grid-cols-2 gap-4">
          {(a?.leadSourcePerformance ?? []).map((s: any) => {
            const convPct = s.total ? (s.converted / s.total) * 100 : 0;
            return (
              <div key={s.key} className="rounded-xl border border-border/70 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{s.label}</div>
                  <Badge variant="outline" className="text-[10px] font-mono">{s.sharePct}% partner share</Badge>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
                  <MicroStat label="Total Leads" v={fmtInt(s.total)} />
                  <MicroStat label="Contacted" v={fmtInt(s.contacted)} />
                  <MicroStat label="Answered" v={fmtInt(s.answered)} />
                  <MicroStat label="Interested" v={fmtInt(s.interested)} />
                  <MicroStat label="Converted" v={fmtInt(s.converted)} />
                  <MicroStat label="Conversion" v={fmtPct(convPct)} />
                  <MicroStat label="Revenue" v={fmtInr(s.revenue)} />
                  <MicroStat label="Partner Earnings" v={fmtInr(s.earnings)} />
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* 7. Payment verification queue */}
        <Section
          title="Payment Verification Queue"
          subtitle="Latest submissions needing attention"
          icon={ListChecks}
          action={<Link to="/admin/payment-verification" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">Open queue <ArrowRight className="size-3" /></Link>}
        >
          <div className="grid grid-cols-4 gap-2 mb-4">
            <QueuePill label="Pending" value={o?.queueCounts.pending_verification ?? 0} tone="text-amber-600" />
            <QueuePill label="Under Review" value={o?.queueCounts.under_review ?? 0} tone="text-primary" />
            <QueuePill label="Duplicates" value={o?.queueCounts.duplicate_flagged ?? 0} tone="text-rose-600" />
            <QueuePill label="Needs Info" value={o?.queueCounts.needs_more_info ?? 0} tone="text-amber-600" />
          </div>
          <ul className="divide-y divide-border/60 -mx-2">
            {(o?.queue ?? []).map((r: any) => (
              <li key={r.id} className="flex items-center gap-3 px-2 py-2.5 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{r.partnerName} · {r.leadName}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{r.courseName} · {fmtRelative(r.submittedAt)}</div>
                </div>
                <div className="text-right text-xs tabular-nums whitespace-nowrap">
                  <div className="font-medium">{fmtInr(r.amount)}</div>
                  <Badge variant="outline" className="mt-1 capitalize text-[10px]">{String(r.status).replace(/_/g, " ")}</Badge>
                </div>
                <Link to="/admin/payment-verification" className="text-primary text-xs whitespace-nowrap hover:underline">Review</Link>
              </li>
            ))}
            {!(o?.queue ?? []).length && <li className="text-sm text-muted-foreground py-4 text-center">Queue is clear.</li>}
          </ul>
        </Section>

        {/* 8. Payout attention */}
        <Section
          title="Payout Attention"
          subtitle="Approved payouts requiring processing"
          icon={Wallet}
          action={<Link to="/admin/partner-payouts" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">Manage payouts <ArrowRight className="size-3" /></Link>}
        >
          <div className="grid grid-cols-4 gap-2 mb-4">
            <QueuePill label="Due Today" value={o?.payoutCounts.dueToday ?? 0} tone="text-primary" />
            <QueuePill label="Due Soon" value={o?.payoutCounts.dueSoon ?? 0} tone="text-amber-600" />
            <QueuePill label="Overdue" value={o?.payoutCounts.overdue ?? 0} tone="text-rose-600" />
            <QueuePill label="On Hold" value={o?.payoutCounts.onHold ?? 0} tone="text-amber-600" />
          </div>
          <ul className="divide-y divide-border/60 -mx-2">
            {(o?.payouts ?? []).map((r: any) => (
              <li key={r.id} className="flex items-center gap-3 px-2 py-2.5 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{r.partnerName}</div>
                  <div className="text-[11px] text-muted-foreground truncate">Target: {r.target ? new Date(r.target).toLocaleDateString() : "—"}</div>
                </div>
                <div className="text-right text-xs tabular-nums whitespace-nowrap">
                  <div className="font-medium">{fmtInr(r.amount)}</div>
                  <Badge variant="outline" className="mt-1 capitalize text-[10px]">{String(r.status).replace(/_/g, " ")}</Badge>
                </div>
                <Link to="/admin/partner-payouts" className="text-primary text-xs whitespace-nowrap hover:underline">Manage</Link>
              </li>
            ))}
            {!(o?.payouts ?? []).length && <li className="text-sm text-muted-foreground py-4 text-center">No payouts pending action.</li>}
          </ul>
        </Section>
      </div>

      {/* 9. Sales Work Monitoring */}
      <Section title="Sales Work Monitoring" subtitle="Partner-level lead work & follow-up posture" icon={Radar}>
        <MonitoringTable rows={monitor.data ?? []} />
      </Section>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 10. Funnel */}
        <div className="lg:col-span-2">
          <Section title="Company Sales Funnel" subtitle="Stage-by-stage conversion" icon={BadgePercent}>
            <div className="space-y-2">
              {(a?.funnel ?? []).map((f: any, i: number) => {
                const pct = (f.count / funnelMax) * 100;
                const prev = a?.funnel?.[i - 1]?.count ?? 0;
                const stageConv = i === 0 ? 100 : prev ? (f.count / prev) * 100 : 0;
                return (
                  <div key={f.stage}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium">{f.stage}</span>
                      <span className="tabular-nums text-muted-foreground">{fmtInt(f.count)} · {fmtPct(stageConv)}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-surface-1 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-cyan-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        </div>

        {/* 13. Revenue breakdown */}
        <Section title="Revenue Breakdown" subtitle="Verified in selected range" icon={Banknote}>
          <ul className="space-y-2 text-sm">
            <RB label="Total Verified Revenue" v={fmtInr(a?.revenueBreakdown.totalVerifiedRevenue ?? 0)} strong />
            <RB label="Own Lead Revenue" v={fmtInr(a?.revenueBreakdown.ownLeadRevenue ?? 0)} />
            <RB label="Glintr Provided Revenue" v={fmtInr(a?.revenueBreakdown.glintrLeadRevenue ?? 0)} />
            <RB label="70% Partner Earnings" v={fmtInr(a?.revenueBreakdown.earnings70 ?? 0)} />
            <RB label="50% Partner Earnings" v={fmtInr(a?.revenueBreakdown.earnings50 ?? 0)} />
            <RB label="Referral Bonuses Approved" v={fmtInr(o?.referralBonusesApproved ?? 0)} />
            <RB label="Paid Partner Earnings" v={fmtInr(a?.revenueBreakdown.paidEarnings ?? 0)} />
            <RB label="Pending Partner Payouts" v={fmtInr(a?.revenueBreakdown.pendingPayouts ?? 0)} />
          </ul>
        </Section>
      </div>

      {/* 11. Live Sales Activity */}
      <Section title="Live Sales Activity" subtitle="Latest 15 sales events (auto-refresh)" icon={Activity}>
        <ul className="divide-y divide-border/60 -mx-2">
          {(activity.data ?? []).map((e: any) => (
            <li key={e.id} className="flex items-start gap-3 px-2 py-2.5 text-sm">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Activity className="size-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm">{e.title}</div>
                {e.partner && <div className="text-[11px] text-muted-foreground">{e.partner}</div>}
              </div>
              <div className="text-[11px] text-muted-foreground whitespace-nowrap">{fmtRelative(e.at)}</div>
            </li>
          ))}
          {!(activity.data ?? []).length && <li className="text-sm text-muted-foreground py-4 text-center">No recent activity.</li>}
        </ul>
      </Section>

      {/* 14. Quick actions */}
      <Section title="Quick Admin Actions" icon={Flame}>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          <QuickAction icon={Upload} label="Upload Leads" to="/admin/lead-management" />
          <QuickAction icon={Target} label="Assign Leads" to="/admin/lead-management" />
          <QuickAction icon={ListChecks} label="Review Payments" to="/admin/payment-verification" />
          <QuickAction icon={Wallet} label="Manage Payouts" to="/admin/partner-payouts" />
          <QuickAction icon={Users} label="View Partners" to="/admin/partners" />
          <QuickAction icon={Handshake} label="Referrals" to="/admin/referral-management" />
          <QuickAction icon={Building2} label="Brand Mgmt" to="/admin/partner-brands" />
          <QuickAction icon={FileSignature} label="Open Payroll" to="/admin/payroll" />
        </div>
      </Section>
    </div>
  );
}

// ------------- sub-components -------------
function MicroStat({ label, v }: any) {
  return (
    <div className="rounded-lg border border-border/60 p-2.5">
      <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold tabular-nums mt-0.5">{v}</div>
    </div>
  );
}

function QueuePill({ label, value, tone }: any) {
  return (
    <div className="rounded-lg border border-border/70 bg-surface-1/40 p-2.5">
      <div className={cn("text-lg font-semibold tabular-nums", tone)}>{fmtInt(value)}</div>
      <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
    </div>
  );
}

function RB({ label, v, strong }: any) {
  return (
    <li className={cn("flex items-center justify-between", strong && "font-semibold border-b border-border/70 pb-2")}>
      <span className={cn("text-muted-foreground", strong && "text-foreground")}>{label}</span>
      <span className="tabular-nums">{v}</span>
    </li>
  );
}

function QuickAction({ icon: Icon, label, to }: any) {
  return (
    <Link to={to} className="rounded-lg border border-border/70 bg-white p-3 hover:bg-primary/5 hover:border-primary/40 transition-colors group">
      <Icon className="size-4 text-primary mb-2" />
      <div className="text-xs font-medium leading-tight">{label}</div>
    </Link>
  );
}

function ProgramTable({ rows }: { rows: any[] }) {
  const [sort, setSort] = useState<"revenue" | "sales" | "conv">("revenue");
  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) =>
      sort === "revenue" ? b.revenue - a.revenue :
      sort === "sales" ? b.sales - a.sales :
      b.conversionRate - a.conversionRate,
    );
    return copy;
  }, [rows, sort]);

  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-muted-foreground">Sort by:</span>
        <Tabs value={sort} onValueChange={(v) => setSort(v as any)}>
          <TabsList className="h-7">
            <TabsTrigger value="revenue" className="text-xs">Highest revenue</TabsTrigger>
            <TabsTrigger value="sales" className="text-xs">Highest sales</TabsTrigger>
            <TabsTrigger value="conv" className="text-xs">Highest conversion</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground border-b border-border/60">
              <th className="py-2 pr-3">Program</th>
              <th className="py-2 pr-3 text-right">Sales</th>
              <th className="py-2 pr-3 text-right">Revenue</th>
              <th className="py-2 pr-3 text-right">Avg Sale</th>
              <th className="py-2 pr-3 text-right">Links Assigned</th>
              <th className="py-2 pr-3 text-right">Conv %</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={p.courseId} className="border-b border-border/40 last:border-b-0">
                <td className="py-2.5 pr-3 font-medium">{p.name}</td>
                <td className="py-2.5 pr-3 text-right tabular-nums">{fmtInt(p.sales)}</td>
                <td className="py-2.5 pr-3 text-right tabular-nums font-medium">{fmtInr(p.revenue)}</td>
                <td className="py-2.5 pr-3 text-right tabular-nums">{fmtInr(p.avgSaleValue)}</td>
                <td className="py-2.5 pr-3 text-right tabular-nums">{fmtInt(p.linksAssigned)}</td>
                <td className="py-2.5 pr-3 text-right tabular-nums">{fmtPct(p.conversionRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function MonitoringTable({ rows }: { rows: any[] }) {
  const [filter, setFilter] = useState<"all" | "no_activity" | "high_overdue" | "not_contacted" | "missed_followups">("all");
  const filtered = useMemo(() => {
    const now = Date.now();
    return rows.filter((r) => {
      if (filter === "no_activity") return !r.lastActivity || (now - new Date(r.lastActivity).getTime() > 86_400_000);
      if (filter === "high_overdue") return r.overdueFollowUps >= 5;
      if (filter === "not_contacted") return r.notContacted >= 3;
      if (filter === "missed_followups") return r.overdueFollowUps > 0;
      return true;
    });
  }, [rows, filter]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-xs text-muted-foreground">Filter:</span>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList className="h-7">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="no_activity" className="text-xs">No activity today</TabsTrigger>
            <TabsTrigger value="high_overdue" className="text-xs">High overdue</TabsTrigger>
            <TabsTrigger value="not_contacted" className="text-xs">Leads not contacted</TabsTrigger>
            <TabsTrigger value="missed_followups" className="text-xs">Missed follow-ups</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground border-b border-border/60">
              <th className="py-2 pr-3">Partner</th>
              <th className="py-2 pr-3 text-right">Assigned</th>
              <th className="py-2 pr-3 text-right">Not Contacted</th>
              <th className="py-2 pr-3 text-right">Today FUs</th>
              <th className="py-2 pr-3 text-right">Overdue</th>
              <th className="py-2 pr-3 text-right">No Answer</th>
              <th className="py-2 pr-3">Last Activity</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 30).map((r) => (
              <tr key={r.partnerId} className="border-b border-border/40 last:border-b-0">
                <td className="py-2.5 pr-3">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-[11px] font-mono text-muted-foreground">{r.partnerCode}</div>
                </td>
                <td className="py-2.5 pr-3 text-right tabular-nums">{fmtInt(r.assigned)}</td>
                <td className={cn("py-2.5 pr-3 text-right tabular-nums", r.notContacted >= 3 && "text-rose-600 font-semibold")}>{fmtInt(r.notContacted)}</td>
                <td className="py-2.5 pr-3 text-right tabular-nums">{fmtInt(r.todayFollowUps)}</td>
                <td className={cn("py-2.5 pr-3 text-right tabular-nums", r.overdueFollowUps > 0 && "text-rose-600 font-semibold")}>{fmtInt(r.overdueFollowUps)}</td>
                <td className="py-2.5 pr-3 text-right tabular-nums">{fmtInt(r.noAnswer)}</td>
                <td className="py-2.5 pr-3 text-muted-foreground">{fmtRelative(r.lastActivity)}</td>
                <td className="py-2.5">
                  <Link to="/admin/partners/$id" params={{ id: r.partnerId }} className="text-primary text-xs inline-flex items-center gap-1 hover:underline">
                    View <ChevronRight className="size-3" />
                  </Link>
                </td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={8} className="text-sm text-muted-foreground py-6 text-center">No partners match this filter.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
