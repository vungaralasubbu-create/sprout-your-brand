import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { lazy, Suspense, useState } from "react";
import {
  ShoppingBag,
  IndianRupee,
  Wallet,
  Users,
  Target,
  CalendarClock,
  Plus,
  ListChecks,
  Link2,
  Upload,
  ArrowRight,
  Receipt,
  AlertTriangle,
  PhoneOff,
  CreditCard,
  ArrowUpRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { getOverviewStats, getPartnerContext } from "@/lib/partner/dashboard.functions";
import { getFollowUpCounts } from "@/lib/partner/follow-ups.functions";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/programs";
import { cn } from "@/lib/utils";
import { PaymentStatusPill } from "@/components/partner/status-badge";
import { EmptyState } from "@/components/partner/empty-state";
import { KpiSkeletonGrid, Skeleton } from "@/components/partner/skeletons";

export const Route = createFileRoute("/_authenticated/partner/dashboard")({
  component: PartnerDashboard,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function PartnerDashboard() {
  const fetchStats = useServerFn(getOverviewStats);
  const fetchCtx = useServerFn(getPartnerContext);
  const fetchFollowUps = useServerFn(getFollowUpCounts);
  const { data: ctx } = useQuery({
    queryKey: ["partner-context"],
    queryFn: () => fetchCtx(),
  });
  const { data: stats, isLoading } = useQuery({
    queryKey: ["partner-overview-stats"],
    queryFn: () => fetchStats(),
  });
  const { data: follow } = useQuery({
    queryKey: ["follow-up-counts"],
    queryFn: () => fetchFollowUps(),
    refetchInterval: 60_000,
  });
  const [range, setRange] = useState<"daily" | "monthly">("daily");

  const partner = ctx?.partner;
  const first = partner?.first_name ?? partner?.display_name?.split(" ")[0] ?? "Partner";

  const chartData =
    range === "daily"
      ? (stats?.daily ?? []).map((d) => ({
          label: new Date(d.date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          }),
          amount: d.amount,
          sales: d.sales,
        }))
      : (stats?.monthly ?? []).map((d) => {
          const [y, m] = d.month.split("-");
          const date = new Date(Number(y), Number(m) - 1, 1);
          return {
            label: date.toLocaleDateString("en-IN", {
              month: "short",
              year: "2-digit",
            }),
            amount: d.amount,
            sales: d.sales,
          };
        });

  const hasChartData = chartData.some((d) => d.amount > 0 || d.sales > 0);

  const leadsAssigned = stats?.leadsAssigned ?? 0;
  const verifiedSales = stats?.totalSales ?? 0;
  const conversionRate =
    leadsAssigned > 0 ? Math.round((verifiedSales / leadsAssigned) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6 lg:space-y-8 max-w-[1400px] animate-in fade-in duration-300">
      {/* Welcome header */}
      <header className="rounded-2xl border bg-gradient-to-br from-white via-white to-cyan-50/40 p-5 sm:p-6 lg:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-widest text-primary">
              {greeting()}
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-display font-semibold tracking-tight truncate">
              {first}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-lg">
              Here's your sales performance and priority work for today.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/partner/my-leads" search={{ filter: "today", index: 0 }}>
                <ListChecks className="size-4" />
                My Leads
              </Link>
            </Button>
            <Button asChild variant="gradient" size="sm">
              <Link to="/partner/add-leads">
                <Plus className="size-4" />
                Add Lead
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Priority work */}
      <PriorityWork follow={follow} />

      {/* KPI metrics */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-display font-semibold">Your Numbers</h2>
          <span className="text-[11px] text-muted-foreground">All-time performance</span>
        </div>
        {isLoading ? (
          <>
            <KpiSkeletonGrid count={4} />
            <div className="mt-3 lg:mt-4">
              <KpiSkeletonGrid count={2} />
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-4">
            <KpiCard
              icon={ShoppingBag}
              label="Verified Sales"
              value={String(verifiedSales)}
              tone="primary"
            />
            <KpiCard
              icon={IndianRupee}
              label="Verified Revenue"
              value={formatPrice(stats?.totalCollected ?? 0, "INR")}
              tone="primary"
              highlight
            />
            <KpiCard
              icon={Wallet}
              label="Approved Earnings"
              value={formatPrice(stats?.referralEarnings ?? 0, "INR")}
              tone="success"
              hint="Includes referral earnings"
            />
            <KpiCard
              icon={Users}
              label="Leads Assigned"
              value={String(leadsAssigned)}
            />
            <KpiCard
              icon={Target}
              label="Conversion Rate"
              value={leadsAssigned > 0 ? `${conversionRate}%` : "—"}
              tone={conversionRate >= 10 ? "success" : "neutral"}
              hint={leadsAssigned > 0 ? `${verifiedSales} of ${leadsAssigned} leads` : "No leads yet"}
            />
            <KpiCard
              icon={CalendarClock}
              label="Today's Follow-Ups"
              value={String(follow?.today ?? 0)}
              tone={(follow?.today ?? 0) > 0 ? "warning" : "neutral"}
            />
          </div>
        )}
      </section>

      {/* Chart */}
      <section className="rounded-2xl border bg-white p-5 lg:p-6 shadow-sm/50">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-display font-semibold">Sales Performance</h2>
            <p className="text-xs text-muted-foreground">
              {range === "daily" ? "Last 30 days" : "Last 6 months"} · Verified revenue trend
            </p>
          </div>
          <div className="inline-flex rounded-lg border p-0.5 bg-slate-50">
            {(["daily", "monthly"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all",
                  range === r
                    ? "bg-white shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : !hasChartData ? (
          <EmptyState
            icon={IndianRupee}
            title="No sales yet"
            description="Once your first payment is verified, your performance will appear here."
            className="h-64 flex flex-col items-center justify-center"
          />
        ) : (
          <div className="h-64 animate-in fade-in duration-500">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -8, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="amtGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.68 0.16 220)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.68 0.16 220)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 240)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  stroke="oklch(0.55 0 0)"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  stroke="oklch(0.55 0 0)"
                  tickFormatter={(v) =>
                    v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                  }
                />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name === "amount" ? [formatPrice(value, "INR"), "Collected"] : [value, "Sales"]
                  }
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid oklch(0.9 0.005 240)",
                    fontSize: 12,
                    boxShadow: "0 4px 20px -8px oklch(0.5 0 0 / 0.15)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="oklch(0.6 0.18 220)"
                  strokeWidth={2}
                  fill="url(#amtGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Recent Payments */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-display font-semibold">Recent Payments</h2>
            <p className="text-xs text-muted-foreground">Latest 5 transactions</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/partner/payment-verification">
              View all <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="rounded-2xl border bg-white overflow-hidden">
          {(stats?.recentPayments ?? []).length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No payments yet"
              description="Once your leads convert and submit payments, they'll appear here for tracking and verification."
              className="border-none"
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="text-left font-medium px-5 py-3">Student</th>
                      <th className="text-left font-medium px-5 py-3">Program</th>
                      <th className="text-right font-medium px-5 py-3">Amount</th>
                      <th className="text-left font-medium px-5 py-3">Status</th>
                      <th className="text-left font-medium px-5 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {stats!.recentPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3 font-medium">{p.student_name}</td>
                        <td className="px-5 py-3 text-muted-foreground">{p.program_title}</td>
                        <td className="px-5 py-3 text-right font-mono tabular-nums">
                          {formatPrice(p.amount, "INR")}
                        </td>
                        <td className="px-5 py-3">
                          <PaymentStatusPill status={p.status} />
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {new Date(p.enrolled_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards */}
              <div className="sm:hidden divide-y">
                {stats!.recentPayments.map((p) => (
                  <div key={p.id} className="p-4 space-y-1.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{p.student_name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {p.program_title}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono tabular-nums text-sm font-semibold">
                          {formatPrice(p.amount, "INR")}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {new Date(p.enrolled_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </div>
                      </div>
                    </div>
                    <PaymentStatusPill status={p.status} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-base font-display font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction to="/partner/add-leads" icon={Plus} label="Add Lead" />
          <QuickAction to="/partner/my-leads" icon={ListChecks} label="View My Leads" />
          <QuickAction to="/partner/payment-links" icon={Link2} label="Payment Links" />
          <QuickAction to="/partner/payment-verification" icon={Upload} label="Submit Proof" />
        </div>
      </section>

      <p className="text-[11px] text-muted-foreground max-w-3xl">
        Revenue share is calculated on verified eligible collected revenue per program rules.
        Refunds and reversals may adjust earnings.
      </p>
    </div>
  );
}

function PriorityWork({
  follow,
}: {
  follow:
    | {
        today: number;
        overdue: number;
        not_contacted: number;
        no_answer_retry: number;
        payment_follow_up: number;
      }
    | undefined;
}) {
  const items = [
    {
      key: "overdue",
      label: "Overdue",
      sub: "Follow-Ups",
      icon: AlertTriangle,
      tone: "text-red-600 bg-red-50 ring-red-100",
      count: follow?.overdue ?? 0,
      urgent: true,
    },
    {
      key: "today",
      label: "Today's",
      sub: "Follow-Ups",
      icon: CalendarClock,
      tone: "text-blue-600 bg-blue-50 ring-blue-100",
      count: follow?.today ?? 0,
    },
    {
      key: "no_answer_retry",
      label: "No Answer",
      sub: "Retry",
      icon: PhoneOff,
      tone: "text-amber-600 bg-amber-50 ring-amber-100",
      count: follow?.no_answer_retry ?? 0,
    },
    {
      key: "not_contacted",
      label: "Not",
      sub: "Contacted",
      icon: Users,
      tone: "text-slate-600 bg-slate-100 ring-slate-200",
      count: follow?.not_contacted ?? 0,
    },
    {
      key: "payment_follow_up",
      label: "Payment",
      sub: "Follow-Ups",
      icon: CreditCard,
      tone: "text-emerald-600 bg-emerald-50 ring-emerald-100",
      count: follow?.payment_follow_up ?? 0,
    },
  ] as Array<{
    key: string;
    label: string;
    sub: string;
    icon: React.ComponentType<{ className?: string }>;
    tone: string;
    count: number;
    urgent?: boolean;
  }>;

  const total = items.reduce((a, b) => a + b.count, 0);

  return (
    <section className="rounded-2xl border bg-white p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Target className="size-3.5" />
          </span>
          <div>
            <h2 className="text-base font-display font-semibold leading-tight">
              Needs Your Attention
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {total > 0 ? `${total} lead${total === 1 ? "" : "s"} waiting on you` : "You're all caught up"}
            </p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {items.map((it) => (
          <Link
            key={it.key}
            to="/partner/my-leads"
            search={{ filter: it.key, index: 0 }}
            className={cn(
              "group relative rounded-xl border bg-white p-3 transition-all duration-150",
              "hover:border-primary/40 hover:shadow-sm hover:-translate-y-0.5",
              it.urgent && it.count > 0 && "ring-1 ring-red-200/60",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span className={cn("inline-flex size-8 items-center justify-center rounded-lg ring-1 ring-inset", it.tone)}>
                <it.icon className="size-4" />
              </span>
              <ArrowUpRight className="size-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            </div>
            <div className="mt-2.5 text-[11px] text-muted-foreground leading-tight">
              {it.label} {it.sub}
            </div>
            <div className="mt-0.5 text-2xl font-display font-semibold tabular-nums">
              {it.count}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  tone = "neutral",
  highlight,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: "neutral" | "primary" | "success" | "warning";
  highlight?: boolean;
  hint?: string;
}) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : tone === "warning"
      ? "bg-amber-50 text-amber-700 ring-amber-100"
      : tone === "primary"
      ? "bg-primary/10 text-primary ring-primary/15"
      : "bg-slate-100 text-slate-700 ring-slate-200";
  return (
    <div
      className={cn(
        "group rounded-2xl border bg-white p-4 lg:p-5 transition-all duration-200",
        "hover:shadow-sm hover:border-primary/30",
        highlight && "bg-gradient-to-br from-primary/[0.04] via-white to-white ring-1 ring-primary/20 shadow-sm",
      )}
    >
      <span
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-lg ring-1 ring-inset",
          toneClass,
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="mt-3.5 text-[11px] text-muted-foreground leading-tight">
        {label}
      </div>
      <div className="mt-0.5 text-xl lg:text-2xl font-display font-semibold tracking-tight tabular-nums">
        {value}
      </div>
      {hint && (
        <div className="mt-1 text-[10px] text-muted-foreground/80 truncate">{hint}</div>
      )}
    </div>
  );
}

function QuickAction({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      to={to as never}
      className="group flex items-center gap-3 rounded-xl border bg-white p-4 hover:border-primary/40 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-150"
    >
      <span className="inline-flex size-10 items-center justify-center rounded-lg bg-slate-100 text-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
        <Icon className="size-4" />
      </span>
      <span className="text-sm font-medium flex-1">{label}</span>
      <ArrowRight className="size-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}
