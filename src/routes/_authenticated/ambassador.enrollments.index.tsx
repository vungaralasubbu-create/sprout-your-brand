import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  GraduationCap, Search, Filter, ChevronLeft, ChevronRight, AlertTriangle,
  Eye, Users, Copy, CheckCircle2, Clock, XCircle, CircleDot, Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  getEnrollmentSummary,
  getEnrollmentFunnel,
  getEnrolledPrograms,
  listEnrollments,
  listEnrollmentActivity,
} from "@/lib/campus-ambassador/enrollments.functions";

export const Route = createFileRoute("/_authenticated/ambassador/enrollments/")({
  head: () => ({
    meta: [
      { title: "My Enrollments — Glintr Campus Ambassador" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EnrollmentsPage,
});

function inr(n: any) { return `₹${Number(n ?? 0).toLocaleString("en-IN")}`; }

const PAYMENT_LABEL: Record<string, string> = {
  not_started: "Not Started",
  payment_pending: "Payment Pending",
  payment_submitted: "Payment Submitted",
  verification_pending: "Verification Pending",
  verified: "Verified",
  failed: "Failed",
  cancelled: "Cancelled",
  refunded: "Refunded",
  reversed: "Reversed",
};
function paymentTone(s: string): any {
  if (s === "verified") return "success";
  if (["failed", "cancelled", "refunded", "reversed"].includes(s)) return "danger";
  if (["verification_pending", "payment_pending", "payment_submitted"].includes(s)) return "warning";
  return "muted";
}

const ENROLL_LABEL: Record<string, string> = {
  enrollment_started: "Enrollment Started",
  enrollment_submitted: "Enrollment Submitted",
  payment_pending: "Payment Pending",
  payment_verification_pending: "Verification Pending",
  payment_verified: "Payment Verified",
  enrollment_confirmed: "Confirmed",
  cancelled: "Cancelled",
  refunded: "Refunded",
  reversed: "Reversed",
  ineligible: "Ineligible",
};
function enrollTone(s: string): any {
  if (s === "enrollment_confirmed" || s === "payment_verified") return "success";
  if (["cancelled", "refunded", "reversed", "ineligible"].includes(s)) return "danger";
  if (["payment_pending", "payment_verification_pending"].includes(s)) return "warning";
  return "info";
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
function commissionTone(s: string | null): any {
  if (!s) return "muted";
  if (["paid", "available", "approved", "eligible"].includes(s)) return "success";
  if (["reversed", "ineligible"].includes(s)) return "danger";
  if (s === "on_hold") return "warning";
  return "info";
}

function EnrollmentsPage() {
  const summaryFn = useServerFn(getEnrollmentSummary);
  const funnelFn = useServerFn(getEnrollmentFunnel);
  const programsFn = useServerFn(getEnrolledPrograms);
  const listFn = useServerFn(listEnrollments);
  const activityFn = useServerFn(listEnrollmentActivity);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("all");
  const [commissionStatus, setCommissionStatus] = useState<string>("all");
  const [program, setProgram] = useState<string>("all");
  const [range, setRange] = useState<string>("all");
  const [sort, setSort] = useState<string>("newest");
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [activityScope, setActivityScope] = useState<string>("all");

  const filters = useMemo(() => ({
    page, pageSize: 20,
    status: status === "all" ? undefined : status,
    commissionStatus: commissionStatus === "all" ? undefined : commissionStatus,
    program: program === "all" ? undefined : program,
    range: range as any,
    sort: sort as any,
    search: search || undefined,
  }), [page, status, commissionStatus, program, range, sort, search]);

  const summaryQ = useQuery({ queryKey: ["amb-enr-summary"], queryFn: () => summaryFn(), retry: false });
  const funnelQ = useQuery({ queryKey: ["amb-enr-funnel"], queryFn: () => funnelFn(), retry: false });
  const programsQ = useQuery({ queryKey: ["amb-enr-programs"], queryFn: () => programsFn(), retry: false });
  const listQ = useQuery({
    queryKey: ["amb-enr-list", filters],
    queryFn: () => listFn({ data: filters }),
    retry: false,
  });
  const activityQ = useQuery({
    queryKey: ["amb-enr-activity", activityScope],
    queryFn: () => activityFn({ data: { scope: activityScope as any, range: "90d", limit: 20 } }),
    retry: false,
  });

  const gate = summaryQ.data?.gate;
  if (gate === "not_active") {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <Card className="p-6">
          <AlertTriangle className="h-6 w-6 text-amber-500" />
          <div className="mt-2 font-display text-xl font-semibold">Ambassador Access Not Active</div>
          <div className="text-sm text-slate-600 mt-1">Your Campus Ambassador profile is not active. Please contact support.</div>
        </Card>
      </div>
    );
  }

  const summary = summaryQ.data && "summary" in summaryQ.data ? summaryQ.data.summary : null;
  const funnel = funnelQ.data && "funnel" in funnelQ.data ? funnelQ.data.funnel : null;
  const programs = programsQ.data?.programs ?? [];
  const rows = listQ.data?.rows ?? [];
  const total = listQ.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  const filterCount =
    (status !== "all" ? 1 : 0) + (commissionStatus !== "all" ? 1 : 0) +
    (program !== "all" ? 1 : 0) + (range !== "all" ? 1 : 0) + (search ? 1 : 0);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-primary font-mono">Campus Ambassador</div>
        <h1 className="mt-1 font-display text-3xl font-semibold">My Enrollments</h1>
        <p className="mt-1 text-sm text-slate-600 max-w-2xl">
          Track the enrollment, payment verification and commission eligibility status of learners connected to your Ambassador referral.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <SummaryCard label="Total Enrollments" value={summary?.total} loading={summaryQ.isLoading} icon={GraduationCap} />
        <SummaryCard label="Payment Pending" value={summary?.paymentPending} loading={summaryQ.isLoading} tone="warning" />
        <SummaryCard label="Verification Pending" value={summary?.verificationPending} loading={summaryQ.isLoading} tone="warning" />
        <SummaryCard label="Payment Verified" value={summary?.verified} loading={summaryQ.isLoading} tone="success" />
        <SummaryCard label="Confirmed" value={summary?.confirmed} loading={summaryQ.isLoading} tone="success" />
        <SummaryCard label="Commission Eligible" value={summary?.commissionEligible} loading={summaryQ.isLoading} tone="success" icon={Wallet} />
      </div>

      {/* Funnel */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-primary font-mono">Enrollment Journey</div>
            <div className="mt-1 font-display text-xl font-semibold">Funnel</div>
          </div>
        </div>
        {funnelQ.isLoading ? (
          <div className="mt-4 grid grid-cols-3 md:grid-cols-9 gap-2">
            {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-md" />)}
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-3 md:grid-cols-9 gap-2">
            <FunnelStep label="Started" value={funnel?.enrollmentStarted ?? 0} />
            <FunnelStep label="Submitted" value={funnel?.enrollmentSubmitted ?? 0} />
            <FunnelStep label="Pay Pending" value={funnel?.paymentPending ?? 0} />
            <FunnelStep label="Pay Submitted" value={funnel?.paymentSubmitted ?? 0} />
            <FunnelStep label="Verif Pending" value={funnel?.verificationPending ?? 0} />
            <FunnelStep label="Verified" value={funnel?.paymentVerified ?? 0} />
            <FunnelStep label="Confirmed" value={funnel?.enrollmentConfirmed ?? 0} tone="success" />
            <FunnelStep label="Elig Review" value={funnel?.eligibilityReview ?? 0} />
            <FunnelStep label="Elig" value={funnel?.commissionEligible ?? 0} tone="success" />
          </div>
        )}
      </Card>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search enrollments…"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { setSearch(searchDraft); setPage(1); } }}
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Enrollments</SelectItem>
              <SelectItem value="enrollment_started">Enrollment Started</SelectItem>
              <SelectItem value="enrollment_submitted">Enrollment Submitted</SelectItem>
              <SelectItem value="payment_pending">Payment Pending</SelectItem>
              <SelectItem value="verification_pending">Verification Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
              <SelectItem value="ineligible">Ineligible</SelectItem>
            </SelectContent>
          </Select>
          <Select value={commissionStatus} onValueChange={(v) => { setCommissionStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Commission" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Commission</SelectItem>
              <SelectItem value="not_calculated">Not Yet Calculated</SelectItem>
              <SelectItem value="pending_verification">Pending Verification</SelectItem>
              <SelectItem value="eligible">Eligible</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="payout_processing">Payout Processing</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="reversed">Reversed</SelectItem>
              <SelectItem value="ineligible">Ineligible</SelectItem>
            </SelectContent>
          </Select>
          <Select value={program} onValueChange={(v) => { setProgram(v); setPage(1); }}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Program" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {programs.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={range} onValueChange={(v) => { setRange(v); setPage(1); }}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Date range" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Sort" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="updated">Recently Updated</SelectItem>
              <SelectItem value="program">Program</SelectItem>
              <SelectItem value="payment">Payment Status</SelectItem>
              <SelectItem value="enrollment">Enrollment Status</SelectItem>
              <SelectItem value="commission">Commission Status</SelectItem>
            </SelectContent>
          </Select>
          {filterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => {
              setStatus("all"); setCommissionStatus("all"); setProgram("all");
              setRange("all"); setSearch(""); setSearchDraft(""); setPage(1);
            }}>Clear ({filterCount})</Button>
          )}
        </div>
      </Card>

      {/* List */}
      <Card className="overflow-hidden">
        {listQ.isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-md" />)}
          </div>
        ) : listQ.isError ? (
          <div className="p-8 text-center">
            <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto" />
            <div className="mt-2 font-display text-lg font-semibold">Unable To Load Enrollments</div>
            <Button size="sm" className="mt-3" onClick={() => listQ.refetch()}>Retry</Button>
          </div>
        ) : rows.length === 0 ? (
          filterCount > 0 ? (
            <div className="p-10 text-center">
              <Filter className="h-6 w-6 text-slate-400 mx-auto" />
              <div className="mt-2 font-display text-lg font-semibold">No Enrollments Found</div>
              <div className="text-sm text-slate-500 mt-1">Try changing your filters or date range.</div>
            </div>
          ) : (
            <EmptyState />
          )
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/70 text-slate-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium">Enrollment</th>
                    <th className="text-left px-4 py-2.5 font-medium">Student</th>
                    <th className="text-left px-4 py-2.5 font-medium">Program</th>
                    <th className="text-left px-4 py-2.5 font-medium">Plan</th>
                    <th className="text-left px-4 py-2.5 font-medium">Enrolled</th>
                    <th className="text-left px-4 py-2.5 font-medium">Payment</th>
                    <th className="text-left px-4 py-2.5 font-medium">Enrollment</th>
                    <th className="text-left px-4 py-2.5 font-medium">Commission</th>
                    <th className="text-right px-4 py-2.5 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs">{r.enrollment_code}</div>
                        {r.referral_lead_code && <div className="text-[10px] text-slate-400 font-mono">{r.referral_lead_code}</div>}
                      </td>
                      <td className="px-4 py-3 font-medium">{r.display_name}</td>
                      <td className="px-4 py-3 text-slate-700">{r.program_title}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{r.pricing_plan ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">
                        {new Date(r.enrolled_at ?? r.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3"><Badge variant={paymentTone(r.payment_status)}>{PAYMENT_LABEL[r.payment_status] ?? r.payment_status}</Badge></td>
                      <td className="px-4 py-3"><Badge variant={enrollTone(r.enrollment_status)}>{ENROLL_LABEL[r.enrollment_status] ?? r.enrollment_status}</Badge></td>
                      <td className="px-4 py-3">
                        <Badge variant={commissionTone(r.commission_status)}>
                          {r.commission_status ? (COMMISSION_LABEL[r.commission_status] ?? r.commission_status) : "Not Calculated"}
                        </Badge>
                        {r.commission_amount ? (
                          <div className="text-[11px] text-slate-500 tabular-nums mt-0.5">{inr(r.commission_amount)}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link to="/ambassador/enrollments/$id" params={{ id: r.id }}>
                            <Eye className="h-3.5 w-3.5 mr-1" /> View
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {rows.map((r: any) => (
                <div key={r.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono text-[11px] text-slate-500">{r.enrollment_code}</div>
                      <div className="font-medium">{r.display_name}</div>
                      <div className="text-xs text-slate-500">{r.program_title}</div>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/ambassador/enrollments/$id" params={{ id: r.id }}><Eye className="h-3.5 w-3.5" /></Link>
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant={paymentTone(r.payment_status)}>{PAYMENT_LABEL[r.payment_status] ?? r.payment_status}</Badge>
                    <Badge variant={enrollTone(r.enrollment_status)}>{ENROLL_LABEL[r.enrollment_status] ?? r.enrollment_status}</Badge>
                    <Badge variant={commissionTone(r.commission_status)}>
                      {r.commission_status ? (COMMISSION_LABEL[r.commission_status] ?? r.commission_status) : "Commission Not Calculated"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-3 border-t bg-slate-50/60">
              <div className="text-xs text-slate-500">
                Page {page} of {totalPages} • {total} enrollment{total === 1 ? "" : "s"}
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Activity */}
      <Card className="p-5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-widest text-primary font-mono">Enrollment Activity</div>
            <div className="mt-1 font-display text-xl font-semibold">Recent Events</div>
          </div>
          <Select value={activityScope} onValueChange={setActivityScope}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activity</SelectItem>
              <SelectItem value="enrollment">Enrollment</SelectItem>
              <SelectItem value="payment">Payment</SelectItem>
              <SelectItem value="verification">Verification</SelectItem>
              <SelectItem value="eligibility">Commission Eligibility</SelectItem>
              <SelectItem value="commission">Commission</SelectItem>
              <SelectItem value="cancellation">Cancellation / Refund</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {activityQ.isLoading ? (
          <div className="mt-4 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-md" />)}
          </div>
        ) : (activityQ.data?.items ?? []).length === 0 ? (
          <div className="mt-4 text-sm text-slate-500 py-6 text-center border rounded-md bg-slate-50/50">
            No Activity Yet
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {(activityQ.data?.items ?? []).map((e: any) => (
              <li key={e.id} className="py-2.5 flex items-start gap-3">
                <div className="h-7 w-7 rounded-full bg-primary/10 grid place-items-center shrink-0">
                  <CircleDot className="h-3 w-3 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm">{e.event_label}</div>
                  <div className="text-[11px] text-slate-500">{new Date(e.created_at).toLocaleString()}</div>
                </div>
                {e.enrollment_id && (
                  <Button asChild size="sm" variant="ghost">
                    <Link to="/ambassador/enrollments/$id" params={{ id: e.enrollment_id }}>View</Link>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function SummaryCard({ label, value, loading, tone, icon: Icon }: any) {
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-widest text-slate-500">{label}</div>
        {Icon && <Icon className="h-3.5 w-3.5 text-slate-400" />}
      </div>
      {loading ? (
        <Skeleton className="h-7 w-16 mt-1.5" />
      ) : (
        <div className={cn(
          "mt-1 text-2xl font-display font-semibold tabular-nums",
          tone === "success" && "text-emerald-600",
          tone === "warning" && "text-amber-600",
        )}>{Number(value ?? 0).toLocaleString("en-IN")}</div>
      )}
    </Card>
  );
}

function FunnelStep({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className={cn(
      "rounded-md border p-2 text-center",
      tone === "success" ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100"
    )}>
      <div className="text-[10px] uppercase tracking-widest text-slate-500 leading-tight">{label}</div>
      <div className="mt-1 text-lg font-display font-semibold tabular-nums">{value.toLocaleString("en-IN")}</div>
    </div>
  );
}

function EmptyState() {
  const copyLink = () => {
    // Best-effort: read profile from clipboard-less UI
    toast.message("Copy your referral link from the Dashboard");
  };
  return (
    <div className="p-10 text-center">
      <GraduationCap className="h-8 w-8 text-slate-300 mx-auto" />
      <div className="mt-3 font-display text-xl font-semibold">No Enrollments Yet</div>
      <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
        Learner enrollments connected to your confirmed Ambassador referrals will appear here.
      </p>
      <div className="mt-4 flex items-center justify-center gap-2">
        <Button asChild size="sm" variant="outline">
          <Link to="/ambassador/referrals"><Users className="h-3.5 w-3.5 mr-1" /> View My Referrals</Link>
        </Button>
        <Button asChild size="sm">
          <Link to="/ambassador/dashboard"><Copy className="h-3.5 w-3.5 mr-1" /> Copy Referral Link</Link>
        </Button>
      </div>
    </div>
  );
}
