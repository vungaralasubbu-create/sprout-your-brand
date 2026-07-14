import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  Wallet, TrendingUp, Clock, CheckCircle2, RotateCcw, Loader2,
  Sparkles, Download, ExternalLink, Info, ArrowRight, Search, RefreshCcw, Award,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AmbassadorShell } from "@/components/ambassador/ambassador-shell";
import { getEarningsOverview, listCommissions, exportCommissionsCsv } from "@/lib/campus-ambassador/earnings.functions";
import { AreaChart, Area, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/ambassador/earnings/")({
  head: () => ({
    meta: [
      { title: "Earnings — Glintr Campus Ambassador" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EarningsPage,
});

const inr = (n: number) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

const STATUS_LABEL: Record<string, string> = {
  pending_verification: "Pending Verification",
  eligible: "Eligible",
  approved: "Approved",
  available: "Available",
  payout_processing: "Payout Processing",
  paid: "Paid",
  on_hold: "On Hold",
  reversed: "Reversed",
  ineligible: "Ineligible",
};
const STATUS_COLOR: Record<string, string> = {
  pending_verification: "bg-amber-100 text-amber-800 border-amber-200",
  eligible: "bg-blue-100 text-blue-800 border-blue-200",
  approved: "bg-indigo-100 text-indigo-800 border-indigo-200",
  available: "bg-emerald-100 text-emerald-800 border-emerald-200",
  payout_processing: "bg-sky-100 text-sky-800 border-sky-200",
  paid: "bg-emerald-600 text-white border-transparent",
  on_hold: "bg-orange-100 text-orange-800 border-orange-200",
  reversed: "bg-rose-100 text-rose-800 border-rose-200",
  ineligible: "bg-slate-200 text-slate-700 border-slate-300",
};

const STATUS_FILTERS = [
  "all","pending_verification","eligible","approved","available","payout_processing","paid","on_hold","reversed","ineligible",
] as const;

const DATE_RANGES = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
];

function StatusChip({ s }: { s: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_COLOR[s] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
      {STATUS_LABEL[s] || s}
    </span>
  );
}

function EarningsPage() {
  const overviewFn = useServerFn(getEarningsOverview);
  const listFn = useServerFn(listCommissions);
  const exportFn = useServerFn(exportCommissionsCsv);

  const [trendRange, setTrendRange] = useState<"7d" | "30d" | "90d" | "6m" | "1y" | "all">("30d");
  const [status, setStatus] = useState<string>("all");
  const [programId, setProgramId] = useState<string>("all");
  const [range, setRange] = useState<string>("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "highest" | "lowest" | "recently_updated" | "program" | "status">("newest");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const pageSize = 20;

  const overviewQuery = useQuery({
    queryKey: ["ambassador", "earnings", "overview", trendRange],
    queryFn: () => overviewFn({ data: { trendRange } }),
  });
  const listQuery = useQuery({
    queryKey: ["ambassador", "earnings", "list", status, programId, range, sort, search, page],
    queryFn: () => listFn({ data: { status, programId, range, sort, search, page, pageSize } }),
  });

  const overview = overviewQuery.data;
  const summary = overview?.gate === "ok" ? overview.summary : null;
  const trend = overview?.gate === "ok" ? overview.trend : [];
  const programs = overview?.gate === "ok" ? overview.programs : [];
  const rates = overview?.gate === "ok" ? overview.rates : [];
  const months = overview?.gate === "ok" ? overview.months : [];

  const list = listQuery.data;
  const rows = list?.gate === "ok" ? list.rows : [];
  const filterPrograms = list?.gate === "ok" ? list.programs : [];
  const totalCount = list?.gate === "ok" ? list.total : 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  async function doExport() {
    const res = await exportFn({ data: { status, programId, range } });
    if (res.gate !== "ok" || !res.csv) return;
    const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `glintr-ambassador-commissions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AmbassadorShell>
      <div className="p-4 lg:p-8 max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-slate-500 font-medium">Campus Ambassador</div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold mt-1">My Earnings</h1>
            <p className="text-slate-600 mt-1 max-w-2xl">
              Track commission earned from eligible verified enrollments through your Campus Ambassador referral.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { overviewQuery.refetch(); listQuery.refetch(); }}>
              <RefreshCcw className="h-3.5 w-3.5 mr-1.5" /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={doExport}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV
            </Button>
            <Button asChild size="sm" className="bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 text-white">
              <Link to="/ambassador/payouts">
                <Wallet className="h-3.5 w-3.5 mr-1.5" /> Payouts
              </Link>
            </Button>
          </div>
        </div>

        {/* Info + gate handling */}
        {overview?.gate === "not_approved" && (
          <Card className="p-6 border-amber-200 bg-amber-50">
            <div className="font-semibold mb-1">Ambassador profile inactive</div>
            <p className="text-sm text-slate-600">Earnings are available once your Campus Ambassador profile is active.</p>
          </Card>
        )}

        {/* Summary metrics */}
        {overviewQuery.isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : overviewQuery.isError ? (
          <ErrorTile onRetry={() => overviewQuery.refetch()} label="Unable To Load Earnings" />
        ) : summary ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Metric label="Total Commission Earned" value={inr(summary.total_earned)} tone="brand" icon={TrendingUp} />
            <Metric label="Available Earnings" value={inr(summary.available)} tone="emerald" icon={CheckCircle2} />
            <Metric label="Pending Commission" value={inr(summary.pending)} tone="amber" icon={Clock} />
            <Metric label="Payout Processing" value={inr(summary.payout_processing)} tone="sky" icon={Loader2} />
            <Metric label="Paid Earnings" value={inr(summary.paid)} tone="emerald-solid" icon={CheckCircle2} />
            <Metric label="Reversed" value={inr(summary.reversed)} tone="rose" icon={RotateCcw} />
          </div>
        ) : null}

        {/* Wallet + Info card */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2 p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 text-white overflow-hidden relative">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
            <div className="absolute -left-16 -bottom-16 h-52 w-52 rounded-full bg-emerald-400/10 blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-cyan-200/90">
                <Wallet className="h-3.5 w-3.5" /> Commission Wallet
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <WalletCell label="Available" value={summary ? inr(summary.available) : "—"} accent />
                <WalletCell label="Pending" value={summary ? inr(summary.pending) : "—"} />
                <WalletCell label="Processing" value={summary ? inr(summary.payout_processing) : "—"} />
                <WalletCell label="Paid" value={summary ? inr(summary.paid) : "—"} />
              </div>
              <div className="mt-5 text-[11px] text-cyan-100/70 leading-relaxed max-w-xl">
                Internal commission accounting view. Values are calculated from Commission Transactions and Payout allocations — this is not a stored balance.
              </div>
            </div>
          </Card>

          <Card className="p-5 border-cyan-200 bg-gradient-to-br from-cyan-50 to-emerald-50">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/70 border border-cyan-200 px-2 py-0.5 text-[10px] uppercase tracking-widest text-cyan-800 font-medium">
              <Sparkles className="h-3 w-3" /> Earn Up To 40%
            </div>
            <div className="mt-3 font-display text-2xl font-semibold">Earn Up To 40% Commission</div>
            <p className="mt-2 text-sm text-slate-600">
              Your commission rate is determined by the eligible program, pricing plan or active Campus Ambassador campaign.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link to="/ambassador/commission-structure">
                View Commission Structure <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </Card>
        </div>

        {/* Pending breakdown */}
        {summary && summary.pending > 0 && (
          <Card className="p-4">
            <div className="text-sm font-medium mb-3">Pending Commission Breakdown</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <PendingCell label="Pending Verification" amount={summary.pending_breakdown.pending_verification} />
              <PendingCell label="Eligible" amount={summary.pending_breakdown.eligible} />
              <PendingCell label="Approved — Awaiting Availability" amount={summary.pending_breakdown.approved} />
              <PendingCell label="On Hold" amount={summary.pending_breakdown.on_hold} />
            </div>
            <div className="mt-3 text-[11px] text-slate-500 flex items-start gap-1.5">
              <Info className="h-3 w-3 mt-0.5" />
              On Hold commission is not guaranteed and may change during review.
            </div>
          </Card>
        )}

        {/* Trend */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-medium">Earnings Trend</div>
              <div className="text-xs text-slate-500">Commission earned by approved date</div>
            </div>
            <Select value={trendRange} onValueChange={(v) => setTrendRange(v as any)}>
              <SelectTrigger className="w-40 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
                <SelectItem value="6m">6 Months</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {overviewQuery.isLoading ? (
            <Skeleton className="h-56" />
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="grad-earn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                  <RTooltip formatter={(v: any) => inr(Number(v))} labelFormatter={(l) => `Date: ${l}`} />
                  <Area type="monotone" dataKey="amount" stroke="#06b6d4" fill="url(#grad-earn)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Programs + Rates */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-2">
            <div className="font-medium mb-3">Earnings By Program</div>
            {programs.length === 0 ? (
              <div className="text-sm text-slate-500 py-6 text-center">No program earnings yet.</div>
            ) : (
              <div className="divide-y">
                {programs.map((p) => (
                  <div key={p.program_id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{p.program_name}</div>
                      <div className="text-xs text-slate-500">{p.verified} verified · Paid {inr(p.paid)} · Available {inr(p.available)}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold">{inr(p.earned)}</div>
                      <div className="text-[11px] text-slate-500">Earned</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="font-medium mb-3 flex items-center gap-2"><Award className="h-4 w-4 text-cyan-600" /> Commission Rates Used</div>
            {rates.length === 0 ? (
              <div className="text-sm text-slate-500 py-6 text-center">No commissions yet.</div>
            ) : (
              <div className="space-y-2.5">
                {rates.map((r) => (
                  <div key={r.rate} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="font-semibold">{r.rate}%</div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{inr(r.total)}</div>
                      <div className="text-[10px] text-slate-500">{r.count} transactions</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Monthly Earnings */}
        {months.length > 0 && (
          <Card className="p-5">
            <div className="font-medium mb-3">Monthly Earnings</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-slate-500 border-b">
                  <tr><th className="py-2 pr-3">Month</th><th className="py-2 pr-3">Earned</th><th className="py-2 pr-3">Available</th><th className="py-2 pr-3">Paid</th><th className="py-2 pr-3">Reversed</th></tr>
                </thead>
                <tbody>
                  {months.map((m) => (
                    <tr key={m.month} className="border-b last:border-none">
                      <td className="py-2 pr-3 font-medium">{m.month}</td>
                      <td className="py-2 pr-3">{inr(m.earned)}</td>
                      <td className="py-2 pr-3">{inr(m.available)}</td>
                      <td className="py-2 pr-3">{inr(m.paid)}</td>
                      <td className="py-2 pr-3 text-rose-600">{inr(m.reversed)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Commission History */}
        <Card className="p-5">
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="font-medium">Commission History</div>
                <div className="text-xs text-slate-500">{totalCount} transactions</div>
              </div>
              <div className="flex-1 max-w-md relative">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                  placeholder="Search transaction, enrollment, learner or program"
                  className="pl-8 h-9"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Select value={status} onValueChange={(v) => { setPage(1); setStatus(v); }}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  {STATUS_FILTERS.map((s) => (
                    <SelectItem key={s} value={s}>{s === "all" ? "All Transactions" : STATUS_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={programId} onValueChange={(v) => { setPage(1); setProgramId(v); }}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Program" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {filterPrograms.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={range} onValueChange={(v) => { setPage(1); setRange(v); }}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Date range" /></SelectTrigger>
                <SelectContent>
                  {DATE_RANGES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={(v) => setSort(v as any)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Sort" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="highest">Highest Commission</SelectItem>
                  <SelectItem value="lowest">Lowest Commission</SelectItem>
                  <SelectItem value="recently_updated">Recently Updated</SelectItem>
                  <SelectItem value="program">Program</SelectItem>
                  <SelectItem value="status">Commission Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {listQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : listQuery.isError ? (
            <ErrorTile onRetry={() => listQuery.refetch()} label="Unable To Load Commission History" />
          ) : rows.length === 0 ? (
            <EmptyState hasFilters={status !== "all" || programId !== "all" || range !== "all" || search.length > 0} />
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-slate-500 border-b">
                    <tr>
                      <th className="py-2 pr-3">Transaction</th>
                      <th className="py-2 pr-3">Enrollment</th>
                      <th className="py-2 pr-3">Learner</th>
                      <th className="py-2 pr-3">Program</th>
                      <th className="py-2 pr-3">Base</th>
                      <th className="py-2 pr-3">Rate</th>
                      <th className="py-2 pr-3">Amount</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3">Created</th>
                      <th className="py-2 pr-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-b last:border-none hover:bg-slate-50">
                        <td className="py-2 pr-3 font-mono text-[11px]">{r.transaction_code || r.id.slice(0, 8)}</td>
                        <td className="py-2 pr-3 font-mono text-[11px]">{r.enrollment_code || "—"}</td>
                        <td className="py-2 pr-3">{r.student_display_name}</td>
                        <td className="py-2 pr-3">{r.program_name}</td>
                        <td className="py-2 pr-3">{inr(r.eligible_base_amount)}</td>
                        <td className="py-2 pr-3">{r.commission_percentage}%</td>
                        <td className="py-2 pr-3 font-semibold">{inr(r.calculated_commission)}</td>
                        <td className="py-2 pr-3"><StatusChip s={r.status} /></td>
                        <td className="py-2 pr-3 text-slate-500 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                        <td className="py-2 pr-3 text-right">
                          <Button asChild variant="ghost" size="sm">
                            <Link to="/ambassador/earnings/$id" params={{ id: r.id }}>
                              View <ExternalLink className="h-3 w-3 ml-1" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile */}
              <div className="lg:hidden space-y-2">
                {rows.map((r) => (
                  <Link key={r.id} to="/ambassador/earnings/$id" params={{ id: r.id }} className="block rounded-xl border p-3 bg-white">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-mono text-[11px] text-slate-500">{r.transaction_code || r.id.slice(0, 8)}</div>
                      <StatusChip s={r.status} />
                    </div>
                    <div className="mt-1 font-medium truncate">{r.program_name}</div>
                    <div className="text-xs text-slate-500">{r.student_display_name} · {r.commission_percentage}%</div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="font-semibold">{inr(r.calculated_commission)}</div>
                      <div className="text-[11px] text-slate-400">{new Date(r.created_at).toLocaleDateString()}</div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="text-slate-500 text-xs">Page {page} of {totalPages}</div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Payout profile entry point */}
        <Card className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="font-medium">Payout Profile</div>
            <div className="text-xs text-slate-500 mt-0.5">Add your verified bank or UPI details to receive commission payouts.</div>
            <div className="mt-2"><Badge variant="outline">Not Added</Badge></div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/ambassador/payouts">Manage Payout Profile</Link>
          </Button>
        </Card>
      </div>
    </AmbassadorShell>
  );
}

function Metric({
  label, value, tone, icon: Icon,
}: {
  label: string;
  value: string;
  tone: "brand" | "emerald" | "amber" | "sky" | "emerald-solid" | "rose";
  icon: any;
}) {
  const toneMap: Record<string, string> = {
    brand: "border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50 text-slate-900",
    emerald: "border-emerald-200 bg-emerald-50",
    amber: "border-amber-200 bg-amber-50",
    sky: "border-sky-200 bg-sky-50",
    "emerald-solid": "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-transparent",
    rose: "border-rose-200 bg-rose-50",
  };
  const iconTone: Record<string, string> = {
    brand: "text-cyan-700",
    emerald: "text-emerald-700",
    amber: "text-amber-700",
    sky: "text-sky-700",
    "emerald-solid": "text-emerald-100",
    rose: "text-rose-700",
  };
  return (
    <Card className={`p-3.5 border ${toneMap[tone]}`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-medium opacity-80">
        <Icon className={`h-3 w-3 ${iconTone[tone]}`} />
        {label}
      </div>
      <div className="mt-1.5 font-display text-xl md:text-2xl font-semibold">{value}</div>
    </Card>
  );
}

function WalletCell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-cyan-200/80">{label}</div>
      <div className={`mt-1 font-display font-semibold ${accent ? "text-2xl md:text-3xl" : "text-lg md:text-xl"}`}>{value}</div>
    </div>
  );
}

function PendingCell({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="mt-0.5 font-semibold">{inr(amount)}</div>
    </div>
  );
}

function ErrorTile({ onRetry, label }: { onRetry: () => void; label: string }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-center justify-between">
      <span>{label}</span>
      <Button variant="outline" size="sm" onClick={onRetry}>Retry</Button>
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  if (hasFilters) {
    return (
      <div className="text-center py-10">
        <div className="font-medium">No Commission Transactions Found</div>
        <div className="text-sm text-slate-500 mt-1">Try changing your filters or date range.</div>
      </div>
    );
  }
  return (
    <div className="text-center py-10 space-y-3">
      <div className="font-medium">No Commission Earnings Yet</div>
      <div className="text-sm text-slate-500">Eligible commission from verified enrollments through your Campus Ambassador referral will appear here.</div>
      <div className="flex flex-wrap gap-2 justify-center pt-2">
        <Button asChild variant="outline" size="sm"><Link to="/ambassador/referrals">View My Referrals</Link></Button>
        <Button asChild variant="outline" size="sm"><Link to="/ambassador/enrollments">View Enrollments</Link></Button>
      </div>
    </div>
  );
}
