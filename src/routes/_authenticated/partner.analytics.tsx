import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Users,
  UserCheck,
  PhoneCall,
  PhoneMissed,
  Clock,
  Sparkles,
  Link2,
  Receipt,
  BadgeCheck,
  Percent,
  BadgeIndianRupee,
  Wallet,
  ArrowRight,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getPartnerAnalytics } from "@/lib/partner/analytics.functions";

export const Route = createFileRoute("/_authenticated/partner/analytics")({
  component: AnalyticsPage,
});

type Preset = "today" | "last_7" | "last_30" | "this_month" | "last_month" | "custom";
type Grouping = "daily" | "weekly" | "monthly";

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function rangeFor(preset: Preset, custom: { start: string; end: string }) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(today);
  const start = new Date(today);
  if (preset === "today") {
    /* start=end=today */
  } else if (preset === "last_7") {
    start.setDate(today.getDate() - 6);
  } else if (preset === "last_30") {
    start.setDate(today.getDate() - 29);
  } else if (preset === "this_month") {
    start.setDate(1);
  } else if (preset === "last_month") {
    start.setMonth(today.getMonth() - 1, 1);
    end.setDate(0); // last day of prev month
  } else {
    return {
      start: custom.start || toISO(today),
      end: custom.end || toISO(today),
    };
  }
  return { start: toISO(start), end: toISO(end) };
}

const INR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);

const NUM = (n: number) => new Intl.NumberFormat("en-IN").format(n || 0);
const PCT = (n: number) => `${(n || 0).toFixed(1)}%`;

function AnalyticsPage() {
  const navigate = useNavigate();
  const fetchData = useServerFn(getPartnerAnalytics);

  const [preset, setPreset] = useState<Preset>("last_30");
  const [custom, setCustom] = useState({ start: "", end: "" });
  const [grouping, setGrouping] = useState<Grouping>("daily");

  const { start, end } = useMemo(() => rangeFor(preset, custom), [preset, custom]);

  const { data, isLoading } = useQuery({
    queryKey: ["partner-analytics", start, end, grouping],
    queryFn: () =>
      fetchData({ data: { startDate: start, endDate: end, grouping } }),
    placeholderData: (prev) => prev,
  });

  const s = data?.summary;

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 space-y-6 max-w-full overflow-x-hidden">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Deep-dive into your leads, sales, revenue, and earnings performance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={preset} onValueChange={(v) => setPreset(v as Preset)}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="last_7">Last 7 Days</SelectItem>
              <SelectItem value="last_30">Last 30 Days</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          {preset === "custom" && (
            <div className="flex items-center gap-1.5">
              <Input
                type="date"
                value={custom.start}
                onChange={(e) => setCustom((c) => ({ ...c, start: e.target.value }))}
                className="h-9 w-[140px]"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                type="date"
                value={custom.end}
                onChange={(e) => setCustom((c) => ({ ...c, end: e.target.value }))}
                className="h-9 w-[140px]"
              />
            </div>
          )}
        </div>
      </header>

      {/* SUMMARY METRICS */}
      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Metric icon={Users} label="Total Leads" value={NUM(s?.totalLeads ?? 0)} />
        <Metric icon={UserCheck} label="Leads Contacted" value={NUM(s?.leadsContacted ?? 0)} />
        <Metric icon={PhoneCall} label="Answered" value={NUM(s?.answeredLeads ?? 0)} />
        <Metric icon={PhoneMissed} label="No Answer" value={NUM(s?.noAnswerLeads ?? 0)} />
        <Metric icon={Clock} label="Follow-Up" value={NUM(s?.followUpLeads ?? 0)} />
        <Metric icon={Sparkles} label="Interested" value={NUM(s?.interestedLeads ?? 0)} />
        <Metric icon={Link2} label="Links Assigned" value={NUM(s?.paymentLinksAssigned ?? 0)} />
        <Metric icon={Receipt} label="Proofs Submitted" value={NUM(s?.paymentProofsSubmitted ?? 0)} />
        <Metric icon={BadgeCheck} label="Verified Sales" value={NUM(s?.verifiedSales ?? 0)} accent />
        <Metric icon={Percent} label="Conversion Rate" value={PCT(s?.conversionRate ?? 0)} />
        <Metric icon={BadgeIndianRupee} label="Verified Revenue" value={INR(s?.verifiedRevenue ?? 0)} accent />
        <Metric icon={Wallet} label="Total Earnings" value={INR(s?.totalEarnings ?? 0)} accent />
      </section>

      {/* SALES PERFORMANCE */}
      <Card className="p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Sales Performance
            </h2>
            <p className="text-xs text-muted-foreground">
              Verified sales & revenue only. Pending or rejected payments are excluded.
            </p>
          </div>
          <Select value={grouping} onValueChange={(v) => setGrouping(v as Grouping)}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="mt-4 h-64 w-full">
          {data?.salesSeries?.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.salesSeries}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="sls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v: number, name: string) =>
                    name === "revenue" ? [INR(v), "Revenue"] : [NUM(v), "Sales"]
                  }
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0EA5E9"
                  fill="url(#rev)"
                  strokeWidth={2}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="sales"
                  stroke="#2563EB"
                  fill="url(#sls)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={isLoading ? "Loading…" : "No verified sales in this period."} />
          )}
        </div>
      </Card>

      {/* LEAD STATUS + FUNNEL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Lead Status
          </h2>
          <p className="text-xs text-muted-foreground">
            Distribution of your leads by their current status.
          </p>
          <div className="mt-4 h-64">
            {data?.leadStatus?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.leadStatus} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={140}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="#06B6D4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState label="No lead data in this period." />
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Conversion Funnel
          </h2>
          <p className="text-xs text-muted-foreground">
            Stage-to-stage conversion. Percentages compare to the previous stage.
          </p>
          <div className="mt-4 space-y-2">
            {data?.funnel?.length ? (
              data.funnel.map((f, i) => {
                const first = data.funnel[0]?.count || 1;
                const width = Math.max(6, (f.count / first) * 100);
                return (
                  <div key={f.stage} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{f.stage}</span>
                      <span className="text-muted-foreground">
                        {NUM(f.count)}
                        {i > 0 && f.pct !== null ? (
                          <span className="ml-2 text-xs text-cyan-700">
                            {PCT(f.pct)}
                          </span>
                        ) : null}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-cyan-400"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState label="No funnel data yet." />
            )}
          </div>
        </Card>
      </div>

      {/* PROGRAM-WISE + LEAD SOURCE */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Program Performance
            </h2>
            <p className="text-xs text-muted-foreground">
              Verified sales and earnings by program.
            </p>
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <ProgramsTable rows={data?.programs ?? []} />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Lead Source Performance
        </h2>
        <p className="text-xs text-muted-foreground">
          Compare how your own leads perform vs Glintr-provided leads.
        </p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {(data?.leadSource ?? []).map((row) => (
            <div
              key={row.source}
              className="rounded-lg border bg-white p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">{row.label}</div>
                <Badge variant="muted" className="text-xs">
                  {row.source === "own_leads" ? "70% share" : "50% share"}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <Stat label="Total Leads" value={NUM(row.totalLeads)} />
                <Stat label="Contacted" value={NUM(row.contacted)} />
                <Stat label="Converted" value={NUM(row.converted)} />
                <Stat label="Conversion" value={PCT(row.conversionRate)} />
                <Stat label="Revenue" value={INR(row.verifiedRevenue)} />
                <Stat label="Earnings" value={INR(row.earnings)} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* PAYMENT LINK PERFORMANCE */}
      <Card className="p-5">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Payment Link Performance
        </h2>
        <p className="text-xs text-muted-foreground">
          Payment link assignments and verified conversions. Copying a link is not counted.
        </p>
        <div className="mt-3 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Program</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Assigned</TableHead>
                <TableHead className="text-right">Proofs</TableHead>
                <TableHead className="text-right">Verified</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.paymentLinks?.length ? (
                data.paymentLinks.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{r.program}</TableCell>
                    <TableCell className="capitalize">{r.plan.replace(/_/g, " ")}</TableCell>
                    <TableCell className="text-right">{INR(r.amount)}</TableCell>
                    <TableCell className="text-right">{NUM(r.linksAssigned)}</TableCell>
                    <TableCell className="text-right">{NUM(r.proofsSubmitted)}</TableCell>
                    <TableCell className="text-right">{NUM(r.verifiedPayments)}</TableCell>
                    <TableCell className="text-right">{INR(r.verifiedRevenue)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                    No payment link activity yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* ANSWERED VS NO ANSWER */}
      <Card className="p-5">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Answered vs No Answer
        </h2>
        <p className="text-xs text-muted-foreground">
          Reach rate across leads created in this period.
        </p>
        <AnsweredCompare
          answered={data?.answered.answered ?? 0}
          noAnswer={data?.answered.noAnswer ?? 0}
          onAnswered={() =>
            navigate({ to: "/partner/coming-soon", search: { filter: "answered" } as never })
          }
          onNoAnswer={() =>
            navigate({ to: "/partner/coming-soon", search: { filter: "no_answer" } as never })
          }
        />
      </Card>

      {/* EARNINGS TREND */}
      <Card className="p-5">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Earnings Trend
        </h2>
        <p className="text-xs text-muted-foreground">
          Approved, processing, and paid earnings. Rejected & cancelled are excluded.
        </p>
        <div className="mt-4 h-64">
          {data?.earningsTrend?.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.earningsTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => INR(v)} />
                <Legend />
                <Bar dataKey="approved" stackId="e" fill="#0EA5E9" name="Approved" />
                <Bar dataKey="processing" stackId="e" fill="#38BDF8" name="Processing" />
                <Bar dataKey="paid" stackId="e" fill="#0284C7" name="Paid" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label="No earnings recorded in this period." />
          )}
        </div>
      </Card>

      {/* RECENT ACTIVITY */}
      <Card className="p-5">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Recent Sales Activity
        </h2>
        <p className="text-xs text-muted-foreground">
          Latest 10 events across your leads, payments, and earnings.
        </p>
        <div className="mt-3 divide-y">
          {data?.recentActivity?.length ? (
            data.recentActivity.map((a) => (
              <div key={a.id} className="py-3 flex items-start gap-3 text-sm">
                <div className="mt-1 size-2 rounded-full bg-cyan-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{a.label}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {[a.program, a.lead].filter(Boolean).join(" · ") || "—"}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(a.at).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No recent activity in this period.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Card className={cn("p-3.5", accent && "bg-gradient-to-br from-sky-50 to-cyan-50 border-sky-100")}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className="mt-1.5 font-display text-lg font-semibold tracking-tight tabular-nums">
        {value}
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium tabular-nums text-sm">{value}</div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function ProgramsTable({
  rows,
}: {
  rows: {
    courseId: string;
    program: string;
    sales: number;
    revenue: number;
    avgSaleValue: number;
    earnings: number;
  }[];
}) {
  const [sort, setSort] = useState<"sales" | "revenue" | "earnings">("revenue");
  const sorted = useMemo(
    () => [...rows].sort((a, b) => (b[sort] as number) - (a[sort] as number)),
    [rows, sort],
  );
  return (
    <>
      <div className="flex items-center gap-2 pb-2 text-xs text-muted-foreground">
        Sort by:
        <SortChip active={sort === "sales"} onClick={() => setSort("sales")}>
          Highest Sales
        </SortChip>
        <SortChip active={sort === "revenue"} onClick={() => setSort("revenue")}>
          Highest Revenue
        </SortChip>
        <SortChip active={sort === "earnings"} onClick={() => setSort("earnings")}>
          Highest Earnings
        </SortChip>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Program</TableHead>
            <TableHead className="text-right">Verified Sales</TableHead>
            <TableHead className="text-right">Verified Revenue</TableHead>
            <TableHead className="text-right">Avg. Sale Value</TableHead>
            <TableHead className="text-right">Your Earnings</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length ? (
            sorted.map((r) => (
              <TableRow key={r.courseId}>
                <TableCell className="font-medium">{r.program}</TableCell>
                <TableCell className="text-right">{NUM(r.sales)}</TableCell>
                <TableCell className="text-right">{INR(r.revenue)}</TableCell>
                <TableCell className="text-right">{INR(r.avgSaleValue)}</TableCell>
                <TableCell className="text-right font-medium">{INR(r.earnings)}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                No program-level data yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
}

function SortChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded-full border text-xs transition",
        active
          ? "bg-cyan-50 text-cyan-800 border-cyan-200"
          : "bg-white text-muted-foreground border-slate-200 hover:bg-slate-50",
      )}
    >
      {children}
    </button>
  );
}

function AnsweredCompare({
  answered,
  noAnswer,
  onAnswered,
  onNoAnswer,
}: {
  answered: number;
  noAnswer: number;
  onAnswered: () => void;
  onNoAnswer: () => void;
}) {
  const total = answered + noAnswer;
  const aPct = total > 0 ? (answered / total) * 100 : 0;
  const nPct = total > 0 ? (noAnswer / total) * 100 : 0;
  return (
    <div className="mt-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Answered Leads</div>
              <div className="mt-1 font-display text-2xl font-semibold">
                {NUM(answered)}{" "}
                <span className="text-sm text-muted-foreground font-normal">
                  ({PCT(aPct)})
                </span>
              </div>
            </div>
            <PhoneCall className="size-6 text-cyan-600" />
          </div>
          <Button size="sm" variant="outline" className="mt-3" onClick={onAnswered}>
            View Answered Leads <ArrowRight className="ml-1 size-3.5" />
          </Button>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">No Answer Leads</div>
              <div className="mt-1 font-display text-2xl font-semibold">
                {NUM(noAnswer)}{" "}
                <span className="text-sm text-muted-foreground font-normal">
                  ({PCT(nPct)})
                </span>
              </div>
            </div>
            <PhoneMissed className="size-6 text-slate-500" />
          </div>
          <Button size="sm" variant="outline" className="mt-3" onClick={onNoAnswer}>
            View No Answer Leads <ArrowRight className="ml-1 size-3.5" />
          </Button>
        </div>
      </div>
      <div className="h-3 w-full rounded-full overflow-hidden bg-slate-100 flex">
        <div className="h-full bg-cyan-500" style={{ width: `${aPct}%` }} />
        <div className="h-full bg-slate-400" style={{ width: `${nPct}%` }} />
      </div>
    </div>
  );
}
