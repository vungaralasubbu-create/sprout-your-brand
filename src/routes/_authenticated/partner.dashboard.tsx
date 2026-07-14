import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  ShoppingBag,
  IndianRupee,
  Clock,
  CheckCircle2,
  Users,
  PhoneCall,
  PhoneOff,
  Gift,
  Plus,
  ListChecks,
  Link2,
  Upload,
  ArrowRight,
  Receipt,
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
import { AlertTriangle, CalendarClock, PhoneOff, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/programs";

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
  const { data: ctx } = useQuery({
    queryKey: ["partner-context"],
    queryFn: () => fetchCtx(),
  });
  const { data: stats, isLoading } = useQuery({
    queryKey: ["partner-overview-stats"],
    queryFn: () => fetchStats(),
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

  return (
    <div className="p-6 lg:p-10 space-y-8">
      {/* Header */}
      <header className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <div className="text-caption font-mono uppercase tracking-widest text-primary">
            {greeting()}
          </div>
          <h1 className="mt-1 text-heading-xl lg:text-display-sm font-display font-semibold tracking-tight">
            {first}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Your sales performance at a glance.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/partner/my-leads" search={{ filter: "today", index: 0 }}>
              <ListChecks className="size-4" />
              View My Leads
            </Link>
          </Button>
          <Button asChild variant="gradient" size="sm">
            <Link to="/partner/add-leads">
              <Plus className="size-4" />
              Add Lead
            </Link>
          </Button>
        </div>
      </header>

      <NeedsAttention />


      {/* Row 1: sales & payments KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard
          icon={ShoppingBag}
          label="Total Sales"
          value={isLoading ? "—" : String(stats?.totalSales ?? 0)}
          tone="primary"
        />
        <KpiCard
          icon={IndianRupee}
          label="Total Collected Amount"
          value={isLoading ? "—" : formatPrice(stats?.totalCollected ?? 0, "INR")}
          tone="primary"
          highlight
        />
        <KpiCard
          icon={Clock}
          label="Payments Pending Verification"
          value={isLoading ? "—" : String(stats?.pendingVerification ?? 0)}
          tone="warning"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Verified Payments"
          value={isLoading ? "—" : String(stats?.verifiedPayments ?? 0)}
          tone="success"
        />
      </section>

      {/* Row 2: leads & referral KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard
          icon={Users}
          label="Total Leads Assigned"
          value={isLoading ? "—" : String(stats?.leadsAssigned ?? 0)}
        />
        <KpiCard
          icon={PhoneCall}
          label="Leads Contacted"
          value={isLoading ? "—" : String(stats?.leadsContacted ?? 0)}
          tone="success"
        />
        <KpiCard
          icon={PhoneOff}
          label="Leads Not Answered"
          value={isLoading ? "—" : String(stats?.leadsNotAnswered ?? 0)}
          tone="warning"
        />
        <KpiCard
          icon={Gift}
          label="Referral Earnings"
          value={isLoading ? "—" : formatPrice(stats?.referralEarnings ?? 0, "INR")}
          tone="primary"
        />
      </section>

      {/* Chart */}
      <section className="rounded-2xl border bg-white p-5 lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-heading-sm font-display font-semibold">
              Sales Performance
            </h2>
            <p className="text-sm text-muted-foreground">
              {range === "daily" ? "Last 30 days" : "Last 6 months"} · Collected revenue &amp; verified sales
            </p>
          </div>
          <div className="inline-flex rounded-lg border p-0.5 bg-muted/40">
            {(["daily", "monthly"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={
                  "px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors " +
                  (range === r
                    ? "bg-white shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {!hasChartData ? (
          <div className="h-64 flex flex-col items-center justify-center text-center rounded-xl bg-muted/30 border border-dashed">
            <IndianRupee className="size-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              No sales yet. Once your first payment is verified, your performance
              will appear here.
            </p>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -8, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="amtGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.68 0.16 220)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="oklch(0.68 0.16 220)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.005 240)" />
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-heading-sm font-display font-semibold">
              Recent Payments
            </h2>
            <p className="text-sm text-muted-foreground">Latest 5 transactions</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/partner/coming-soon">
              View all <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="rounded-2xl border bg-white overflow-hidden">
          {(stats?.recentPayments ?? []).length === 0 ? (
            <div className="p-10 text-center">
              <Receipt className="size-8 mx-auto text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">No payments yet</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                Once your leads convert and submit payments, they'll appear here
                for tracking and verification.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-caption uppercase tracking-wider text-muted-foreground">
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
                    <tr key={p.id} className="hover:bg-muted/20">
                      <td className="px-5 py-3 font-medium">{p.student_name}</td>
                      <td className="px-5 py-3 text-muted-foreground">{p.program_title}</td>
                      <td className="px-5 py-3 text-right font-mono tabular-nums">
                        {formatPrice(p.amount, "INR")}
                      </td>
                      <td className="px-5 py-3">
                        <PaymentBadge status={p.status} />
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
          )}
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-heading-sm font-display font-semibold mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction to="/partner/coming-soon" icon={Plus} label="Add Lead" />
          <QuickAction to="/partner/coming-soon" icon={ListChecks} label="View My Leads" />
          <QuickAction to="/partner/coming-soon" icon={Link2} label="Create Payment Link" />
          <QuickAction to="/partner/coming-soon" icon={Upload} label="Submit Payment Proof" />
        </div>
      </section>

      <p className="text-caption text-muted-foreground max-w-3xl">
        Revenue share is calculated on verified eligible collected revenue per
        program rules. Refunds and reversals may adjust earnings.
      </p>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  tone = "neutral",
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: "neutral" | "primary" | "success" | "warning";
  highlight?: boolean;
}) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "warning"
      ? "bg-amber-50 text-amber-700"
      : tone === "primary"
      ? "bg-primary/10 text-primary"
      : "bg-muted text-foreground";
  return (
    <div
      className={
        "rounded-2xl border bg-white p-4 lg:p-5 " +
        (highlight ? "ring-1 ring-primary/30 shadow-sm" : "")
      }
    >
      <span
        className={`inline-flex size-9 items-center justify-center rounded-lg ${toneClass}`}
      >
        <Icon className="size-4" />
      </span>
      <div className="mt-4 text-caption text-muted-foreground leading-tight">
        {label}
      </div>
      <div className="mt-1 text-xl lg:text-2xl font-display font-semibold tracking-tight tabular-nums">
        {value}
      </div>
    </div>
  );
}

function PaymentBadge({ status }: { status: "pending" | "verified" | "rejected" }) {
  if (status === "verified")
    return <Badge variant="success">Verified</Badge>;
  if (status === "rejected") return <Badge variant="danger">Rejected</Badge>;
  return <Badge variant="warning">Pending Verification</Badge>;
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
      className="group flex items-center gap-3 rounded-xl border bg-white p-4 hover:border-primary/50 hover:shadow-sm transition-all"
    >
      <span className="inline-flex size-10 items-center justify-center rounded-lg bg-muted text-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
        <Icon className="size-4" />
      </span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
