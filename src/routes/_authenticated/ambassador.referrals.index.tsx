import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Users, Search, Filter, ChevronLeft, ChevronRight, AlertTriangle,
  Compass, Copy, QrCode, Eye, CircleDot, Clock, CheckCircle2, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  getReferralSummary,
  getReferredPrograms,
  listReferrals,
  listReferralActivity,
} from "@/lib/campus-ambassador/referrals.functions";

export const Route = createFileRoute("/_authenticated/ambassador/referrals/")({
  head: () => ({
    meta: [
      { title: "My Referrals — Glintr Campus Ambassador" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyReferralsPage,
});

function inr(n: any) { return `₹${Number(n ?? 0).toLocaleString("en-IN")}`; }

const STATUS_LABEL: Record<string, string> = {
  new: "New Referral",
  interested: "Interested",
  enrollment_started: "Enrollment Started",
  enrollment_submitted: "Enrollment Submitted",
  payment_pending: "Payment Pending",
  payment_verification_pending: "Verification Pending",
  payment_verified: "Payment Verified",
  enrollment_confirmed: "Enrollment Confirmed",
  cancelled: "Cancelled",
  refunded: "Refunded",
  reversed: "Reversed",
  ineligible: "Ineligible",
};

function statusTone(s: string): "info" | "success" | "warning" | "danger" | "muted" {
  if (["payment_verified", "enrollment_confirmed"].includes(s)) return "success";
  if (["cancelled", "refunded", "reversed", "ineligible"].includes(s)) return "danger";
  if (["payment_pending", "payment_verification_pending"].includes(s)) return "warning";
  if (s === "new") return "info";
  return "muted";
}

const COMMISSION_LABEL: Record<string, string> = {
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
function commissionTone(s: string | null): "info" | "success" | "warning" | "danger" | "muted" {
  if (!s) return "muted";
  if (["paid", "available", "approved", "eligible"].includes(s)) return "success";
  if (["reversed", "ineligible"].includes(s)) return "danger";
  if (s === "on_hold") return "warning";
  return "info";
}

const ATTRIBUTION_LABEL: Record<string, string> = {
  valid: "Valid",
  pending_review: "Pending Review",
  conflict_review: "Under Review",
  confirmed: "Confirmed",
  invalid: "Not Eligible",
  expired: "Expired",
};

function MyReferralsPage() {
  const summaryFn = useServerFn(getReferralSummary);
  const programsFn = useServerFn(getReferredPrograms);
  const listFn = useServerFn(listReferrals);
  const activityFn = useServerFn(listReferralActivity);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [status, setStatus] = useState<string>("all");
  const [program, setProgram] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "updated" | "program" | "status">("newest");
  const [range, setRange] = useState<"today" | "7d" | "30d" | "90d" | "all" | "custom">("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [activityScope, setActivityScope] = useState<"all" | "referrals" | "enrollments" | "verification" | "attribution" | "commission">("all");

  const summaryQ = useQuery({ queryKey: ["amb-ref-summary"], queryFn: () => summaryFn() });
  const programsQ = useQuery({ queryKey: ["amb-ref-programs"], queryFn: () => programsFn() });

  const listQ = useQuery({
    queryKey: ["amb-ref-list", page, pageSize, status, program, search, sort, range, customFrom, customTo],
    queryFn: () => listFn({
      data: {
        page,
        pageSize,
        status: status === "all" ? undefined : status,
        program: program === "all" ? undefined : program,
        search: search || undefined,
        sort,
        range,
        fromDate: range === "custom" ? customFrom : undefined,
        toDate: range === "custom" ? customTo : undefined,
      },
    }),
  });

  const activityQ = useQuery({
    queryKey: ["amb-ref-activity", activityScope, range, customFrom, customTo],
    queryFn: () => activityFn({
      data: {
        scope: activityScope, range,
        fromDate: range === "custom" ? customFrom : undefined,
        toDate: range === "custom" ? customTo : undefined,
      },
    }),
  });

  const gate = summaryQ.data?.gate;
  if (summaryQ.isLoading) return <PageSkeleton />;

  if (gate === "not_active") {
    return (
      <div className="max-w-lg mx-auto p-6">
        <Card className="p-6">
          <AlertTriangle className="h-6 w-6 text-slate-500" />
          <h1 className="mt-2 font-display text-2xl font-semibold">Ambassador Access Required</h1>
          <p className="mt-1 text-sm text-slate-600">
            My Referrals is available to approved Campus Ambassadors only.
          </p>
          <Button asChild className="mt-4">
            <Link to="/campus-ambassador">View Program</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const s = summaryQ.data!.summary!;
  const f = summaryQ.data!.funnel!;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <Compass className="h-4 w-4" />
            <span className="text-xs font-mono uppercase tracking-widest">Campus Ambassador</span>
          </div>
          <h1 className="mt-1 font-display text-3xl md:text-4xl font-semibold">My Referrals</h1>
          <p className="mt-1 text-slate-600 max-w-2xl">
            Track learners connected to your Campus Ambassador referral and follow their enrollment journey.
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <MetricCard label="Total Referral Leads" value={s.total} tone="info" icon={Users} />
        <MetricCard label="New Referrals" value={s.newReferrals} tone="info" icon={CircleDot} />
        <MetricCard label="Enrollment Started" value={s.enrollmentStarted} tone="info" icon={CircleDot} />
        <MetricCard label="Payment Pending" value={s.paymentPending} tone="warning" icon={Clock} />
        <MetricCard label="Verification Pending" value={s.verificationPending} tone="warning" icon={Clock} />
        <MetricCard label="Verified Enrollments" value={s.verified} tone="success" icon={CheckCircle2} />
        <MetricCard label="Cancelled / Ineligible" value={s.cancelled + s.ineligible} tone="muted" icon={XCircle} />
      </div>

      {/* Funnel */}
      <Card className="p-5">
        <div className="text-xs uppercase tracking-widest text-primary font-mono">Referral Journey</div>
        <div className="mt-1 font-display text-xl font-semibold">Your Referral Funnel</div>
        <FunnelStages funnel={f} />
      </Card>

      {/* Filters */}
      <Card className="p-4 md:p-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search Referrals — ID, Name, Program"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { setSearch(searchDraft); setPage(1); }
              }}
              className="pl-8 h-9"
            />
          </div>
          <Select value={program} onValueChange={(v) => { setProgram(v); setPage(1); }}>
            <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="Program" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {(programsQ.data?.programs ?? []).map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={range} onValueChange={(v: any) => { setRange(v); setPage(1); }}>
            <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v: any) => setSort(v)}>
            <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="updated">Recently Updated</SelectItem>
              <SelectItem value="program">Program</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {range === "custom" && (
          <div className="flex flex-wrap items-center gap-2">
            <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="w-[170px] h-9" />
            <span className="text-xs text-slate-500">to</span>
            <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="w-[170px] h-9" />
          </div>
        )}
        <Tabs value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="new">New</TabsTrigger>
            <TabsTrigger value="enrollment_started">Enrollment Started</TabsTrigger>
            <TabsTrigger value="payment_pending">Payment Pending</TabsTrigger>
            <TabsTrigger value="payment_verification_pending">Verification Pending</TabsTrigger>
            <TabsTrigger value="verified">Verified</TabsTrigger>
            <TabsTrigger value="cancelled_group">Cancelled</TabsTrigger>
            <TabsTrigger value="refunded">Refunded</TabsTrigger>
            <TabsTrigger value="ineligible">Ineligible</TabsTrigger>
          </TabsList>
        </Tabs>
      </Card>

      {/* Referral list */}
      <ReferralList
        loading={listQ.isLoading}
        error={listQ.isError}
        onRetry={() => listQ.refetch()}
        data={listQ.data}
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        filtersActive={status !== "all" || program !== "all" || range !== "all" || !!search}
      />

      {/* Activity */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-widest text-primary font-mono">Activity</div>
            <div className="mt-1 font-display text-xl font-semibold">Referral Activity</div>
          </div>
          <Tabs value={activityScope} onValueChange={(v: any) => setActivityScope(v)}>
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="referrals">Referrals</TabsTrigger>
              <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
              <TabsTrigger value="verification">Verification</TabsTrigger>
              <TabsTrigger value="attribution">Attribution</TabsTrigger>
              <TabsTrigger value="commission">Commission</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="mt-4 space-y-2">
          {activityQ.isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-md" />)
          ) : (activityQ.data?.items ?? []).length === 0 ? (
            <div className="text-sm text-slate-500 py-6 text-center border rounded-md bg-slate-50/50">
              No Activity Yet
            </div>
          ) : (
            (activityQ.data?.items ?? []).map((it: any) => (
              <div key={it.id} className="rounded-lg border p-3 flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                  <CircleDot className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{it.event_label}</div>
                  <div className="text-[11px] text-slate-500">
                    {new Date(it.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function MetricCard({ label, value, tone, icon: Icon }: any) {
  const bg: Record<string, string> = {
    info: "bg-blue-50 text-blue-700",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    muted: "bg-slate-50 text-slate-600",
  };
  return (
    <Card className="p-4">
      <div className={cn("h-8 w-8 rounded-lg grid place-items-center", bg[tone])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-3 text-2xl font-semibold tabular-nums">{value.toLocaleString()}</div>
      <div className="text-[11px] uppercase tracking-widest text-slate-500 mt-0.5">{label}</div>
    </Card>
  );
}

function FunnelStages({ funnel }: { funnel: any }) {
  const stages = [
    { key: "visits", label: "Referral Visits", value: funnel.visits },
    { key: "leads", label: "Referral Leads", value: funnel.leads },
    { key: "enrollmentStarted", label: "Enrollment Started", value: funnel.enrollmentStarted },
    { key: "paymentSubmitted", label: "Payment Submitted", value: funnel.paymentSubmitted },
    { key: "paymentVerified", label: "Payment Verified", value: funnel.paymentVerified },
    { key: "enrollmentConfirmed", label: "Enrollment Confirmed", value: funnel.enrollmentConfirmed },
    { key: "commissionEligible", label: "Commission Eligible", value: funnel.commissionEligible },
  ];
  const max = Math.max(1, ...stages.map((s) => s.value));
  return (
    <div className="mt-4 space-y-2">
      {stages.map((st, i) => (
        <div key={st.key} className="grid grid-cols-[1fr_auto] items-center gap-3">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-600">
                <span className="text-[10px] font-mono text-slate-400 mr-2">STAGE {i + 1}</span>
                {st.label}
              </span>
              <span className="tabular-nums font-semibold text-slate-900">{st.value.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 transition-all"
                style={{ width: `${Math.max(2, (st.value / max) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReferralList({ loading, error, onRetry, data, page, setPage, pageSize, filtersActive }: any) {
  if (loading) {
    return (
      <Card className="p-4 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-md" />)}
      </Card>
    );
  }
  if (error) {
    return (
      <Card className="p-6 text-center">
        <div className="font-semibold">Unable To Load Referrals</div>
        <Button size="sm" className="mt-3" onClick={onRetry}>Retry</Button>
      </Card>
    );
  }
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  if (rows.length === 0) {
    return filtersActive ? (
      <Card className="p-8 text-center">
        <div className="font-display text-lg font-semibold">No Referrals Found</div>
        <div className="text-sm text-slate-600 mt-1">
          Try changing your filters or date range.
        </div>
      </Card>
    ) : (
      <Card className="p-8 text-center">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 mx-auto grid place-items-center">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div className="mt-3 font-display text-lg font-semibold">No Referral Leads Yet</div>
        <div className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
          Share your Ambassador referral link or QR code. Eligible learner activity connected to your referral will appear here.
        </div>
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          <Button asChild size="sm" variant="outline">
            <Link to="/ambassador/dashboard"><Copy className="h-3.5 w-3.5 mr-1" /> Copy Referral Link</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/ambassador/dashboard"><QrCode className="h-3.5 w-3.5 mr-1" /> View QR Code</Link>
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:block">
        <div className="grid grid-cols-[130px_1.2fr_1.2fr_100px_130px_130px_130px_100px] gap-3 px-4 py-2 text-[11px] uppercase tracking-widest text-slate-500 border-b bg-slate-50">
          <div>Referral ID</div>
          <div>Student</div>
          <div>Program</div>
          <div>Plan</div>
          <div>Date</div>
          <div>Status</div>
          <div>Commission</div>
          <div className="text-right">Action</div>
        </div>
        {rows.map((r: any) => (
          <div key={r.id} className="grid grid-cols-[130px_1.2fr_1.2fr_100px_130px_130px_130px_100px] gap-3 px-4 py-3 border-b items-center hover:bg-slate-50/60">
            <div className="font-mono text-xs">{r.lead_code}</div>
            <div className="text-sm font-medium truncate">{r.display_name}</div>
            <div className="text-sm truncate">{r.program_title}</div>
            <div className="text-xs text-slate-500 truncate">{r.pricing_plan ?? "—"}</div>
            <div className="text-xs text-slate-500">{new Date(r.created_at).toLocaleDateString()}</div>
            <div><Badge variant={statusTone(r.status)}>{STATUS_LABEL[r.status] ?? r.status}</Badge></div>
            <div>
              {r.commission_status ? (
                <Badge variant={commissionTone(r.commission_status)}>{COMMISSION_LABEL[r.commission_status] ?? r.commission_status}</Badge>
              ) : (
                <span className="text-xs text-slate-400">Not Yet Calculated</span>
              )}
            </div>
            <div className="text-right">
              <Button asChild size="sm" variant="outline">
                <Link to="/ambassador/referrals/$id" params={{ id: r.id }}>
                  <Eye className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y">
        {rows.map((r: any) => (
          <div key={r.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-mono text-[11px] text-slate-500">{r.lead_code}</div>
                <div className="text-sm font-semibold truncate">{r.display_name}</div>
                <div className="text-xs text-slate-600 truncate">{r.program_title}</div>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to="/ambassador/referrals/$id" params={{ id: r.id }}>View</Link>
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant={statusTone(r.status)}>{STATUS_LABEL[r.status] ?? r.status}</Badge>
              {r.commission_status && (
                <Badge variant={commissionTone(r.commission_status)}>{COMMISSION_LABEL[r.commission_status] ?? r.commission_status}</Badge>
              )}
              <span className="text-[11px] text-slate-500 ml-auto">{new Date(r.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between p-3 bg-slate-50 border-t text-xs">
        <div className="text-slate-500">
          Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <div className="text-slate-600 px-2">Page {page} of {pageCount}</div>
          <Button size="sm" variant="outline" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function PageSkeleton() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <Skeleton className="h-12 w-64" />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}
