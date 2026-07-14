import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft, Wallet, GraduationCap, CircleDot, CheckCircle2, Clock, XCircle,
  Info, Ban, RotateCcw, ScrollText, ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AmbassadorShell } from "@/components/ambassador/ambassador-shell";
import { getCommissionDetails } from "@/lib/campus-ambassador/earnings.functions";

export const Route = createFileRoute("/_authenticated/ambassador/earnings/$id")({
  head: () => ({
    meta: [
      { title: "Commission Details — Glintr Campus Ambassador" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DetailsPage,
});

const inr = (n: number | null | undefined) =>
  n == null ? "—" : "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });

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

const TXN_TYPE_LABEL: Record<string, string> = {
  enrollment_commission: "Enrollment Commission",
  bonus_commission: "Bonus Commission",
  positive_adjustment: "Positive Adjustment",
  negative_adjustment: "Negative Adjustment",
  recovery: "Recovery",
  correction: "Correction",
};

function fmtDate(d?: string | null) {
  if (!d) return null;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : dt.toLocaleString();
}

function DetailsPage() {
  const { id } = Route.useParams();
  const fn = useServerFn(getCommissionDetails);
  const query = useQuery({
    queryKey: ["ambassador", "commission", "details", id],
    queryFn: () => fn({ data: { id } }),
  });

  const d = query.data;

  return (
    <AmbassadorShell>
      <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-5">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2">
            <Link to="/ambassador/earnings"><ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Earnings</Link>
          </Button>
          <h1 className="font-display text-3xl font-semibold">Commission Details</h1>
        </div>

        {query.isLoading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </>
        ) : query.isError ? (
          <Card className="p-6 border-rose-200 bg-rose-50 flex items-center justify-between">
            <div className="text-rose-800 text-sm">Unable To Load Commission Details</div>
            <Button variant="outline" size="sm" onClick={() => query.refetch()}>Retry</Button>
          </Card>
        ) : d?.gate === "forbidden" ? (
          <Card className="p-6 border-slate-200 bg-slate-50">
            <div className="font-medium">Commission Access Restricted</div>
            <div className="text-sm text-slate-500 mt-1">You do not have permission to view this commission.</div>
          </Card>
        ) : d?.gate === "not_found" ? (
          <Card className="p-6"><div className="font-medium">Commission not found.</div></Card>
        ) : d?.gate === "ok" ? (
          <>
            <StatusBanner status={d.commission.status} publicReason={d.commission.public_reason} adjustmentNote={d.commission.adjustment_public_note} availableAt={d.commission.available_at} />

            {/* Top summary */}
            <Card className="p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-slate-500">Commission Transaction</div>
                  <div className="font-mono text-sm mt-0.5">{d.commission.transaction_code || d.commission.id.slice(0, 8)}</div>
                  <div className="mt-2 text-xs text-slate-500">{TXN_TYPE_LABEL[d.commission.transaction_type] || d.commission.transaction_type}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-widest text-slate-500">Amount</div>
                  <div className="font-display text-3xl font-semibold">{inr(d.commission.calculated_commission)}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Status: {STATUS_LABEL[d.commission.status]}</div>
                </div>
              </div>
            </Card>

            {/* Calculation */}
            <Card className="p-5">
              <div className="text-sm font-medium mb-3">Commission Calculation</div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center gap-4 text-lg">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-500">Eligible Base</div>
                    <div className="font-display font-semibold">{inr(d.commission.eligible_base_amount)}</div>
                  </div>
                  <div className="text-slate-400">×</div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-500">Rate</div>
                    <div className="font-display font-semibold">{d.commission.commission_percentage}%</div>
                  </div>
                  <div className="text-slate-400">=</div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-500">Calculated Commission</div>
                    <div className="font-display font-semibold text-cyan-700">{inr(d.commission.calculated_commission)}</div>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-[11px] text-slate-500 flex items-start gap-1.5">
                <Info className="h-3 w-3 mt-0.5" />
                Marketing rate is "up to 40%". Actual stored rate for this transaction is {d.commission.commission_percentage}%.
              </div>
              <div className="mt-3">
                <Button asChild variant="outline" size="sm">
                  <Link to="/ambassador/commission-structure">
                    <ScrollText className="h-3.5 w-3.5 mr-1" /> View Commission Structure
                  </Link>
                </Button>
              </div>
            </Card>

            {/* Enrollment link */}
            {d.enrollment && (
              <Card className="p-5">
                <div className="text-sm font-medium mb-3 flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Related Enrollment</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><div className="text-[10px] uppercase tracking-widest text-slate-500">Enrollment</div><div className="font-mono">{d.enrollment.enrollment_code}</div></div>
                  <div><div className="text-[10px] uppercase tracking-widest text-slate-500">Learner</div><div>{d.enrollment.student_display_name}</div></div>
                  <div><div className="text-[10px] uppercase tracking-widest text-slate-500">Program</div><div>{d.program?.name ?? "—"}</div></div>
                  <div><div className="text-[10px] uppercase tracking-widest text-slate-500">Pricing Plan</div><div>{d.commission.pricing_plan || "—"}</div></div>
                  <div><div className="text-[10px] uppercase tracking-widest text-slate-500">Enrolled</div><div>{fmtDate(d.enrollment.enrolled_at) || fmtDate(d.commission.created_at) || "—"}</div></div>
                  <div><div className="text-[10px] uppercase tracking-widest text-slate-500">Payment Verified</div><div>{fmtDate(d.enrollment.verified_at) || "—"}</div></div>
                  <div><div className="text-[10px] uppercase tracking-widest text-slate-500">Eligibility</div><div>{d.commission.eligibility_status || "—"}</div></div>
                </div>
                <div className="mt-3">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/ambassador/enrollments/$id" params={{ id: d.enrollment.id }}>
                      View Enrollment <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  </Button>
                </div>
              </Card>
            )}

            {/* Payout state */}
            {(d.commission.status === "payout_processing" || d.commission.status === "paid") && (
              <Card className="p-5">
                <div className="text-sm font-medium mb-3 flex items-center gap-2"><Wallet className="h-4 w-4" /> Payout</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div><div className="text-[10px] uppercase tracking-widest text-slate-500">Payout Reference</div><div className="font-mono">{d.commission.payout_reference || "—"}</div></div>
                  <div><div className="text-[10px] uppercase tracking-widest text-slate-500">Processing Started</div><div>{fmtDate(d.commission.payout_processing_at) || "—"}</div></div>
                  <div><div className="text-[10px] uppercase tracking-widest text-slate-500">Paid Date</div><div>{fmtDate(d.commission.paid_at) || "—"}</div></div>
                </div>
              </Card>
            )}

            {/* Journey */}
            <Card className="p-5">
              <div className="text-sm font-medium mb-3">Commission Journey</div>
              {d.history.length === 0 ? (
                <div className="text-sm text-slate-500">No events yet.</div>
              ) : (
                <ol className="relative border-l border-slate-200 pl-5 space-y-4">
                  {d.history.map((h) => (
                    <li key={h.id} className="relative">
                      <span className="absolute -left-[27px] top-1 h-4 w-4 rounded-full bg-white border-2 border-cyan-500 grid place-items-center">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                      </span>
                      <div className="text-sm font-medium">
                        {STATUS_LABEL[h.to_status] || h.to_status}
                      </div>
                      <div className="text-xs text-slate-500">{fmtDate(h.created_at)}</div>
                      {h.public_note && <div className="text-xs text-slate-600 mt-0.5">{h.public_note}</div>}
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </>
        ) : null}
      </div>
    </AmbassadorShell>
  );
}

function StatusBanner({
  status, publicReason, adjustmentNote, availableAt,
}: {
  status: string;
  publicReason?: string | null;
  adjustmentNote?: string | null;
  availableAt?: string | null;
}) {
  const CFG: Record<string, { icon: any; title: string; body: string; tone: string }> = {
    pending_verification: { icon: Clock, title: "Commission Verification Pending", body: "The related enrollment and commission eligibility are being verified.", tone: "border-amber-200 bg-amber-50 text-amber-900" },
    eligible: { icon: CircleDot, title: "Commission Eligible", body: "The enrollment has met the configured Ambassador commission eligibility requirements. The commission is waiting for the authorised approval workflow.", tone: "border-blue-200 bg-blue-50 text-blue-900" },
    approved: { icon: CheckCircle2, title: "Commission Approved", body: availableAt ? `Expected availability: ${new Date(availableAt).toLocaleDateString()}` : "Awaiting hold or availability window before payout.", tone: "border-indigo-200 bg-indigo-50 text-indigo-900" },
    available: { icon: CheckCircle2, title: "Available For Payout", body: "This commission is currently eligible to enter the payout process.", tone: "border-emerald-200 bg-emerald-50 text-emerald-900" },
    payout_processing: { icon: Wallet, title: "Payout Processing", body: "Your commission is included in an active payout workflow.", tone: "border-sky-200 bg-sky-50 text-sky-900" },
    paid: { icon: CheckCircle2, title: "Commission Paid", body: "Payment has been successfully included in a completed payout.", tone: "border-emerald-200 bg-emerald-100 text-emerald-900" },
    on_hold: { icon: Info, title: "Commission On Hold", body: publicReason || "This commission is temporarily on hold while the related enrollment, payment or commission status is reviewed.", tone: "border-orange-200 bg-orange-50 text-orange-900" },
    reversed: { icon: RotateCcw, title: "Commission Reversed", body: publicReason || "This commission has been reversed.", tone: "border-rose-200 bg-rose-50 text-rose-900" },
    ineligible: { icon: Ban, title: "Not Eligible For Commission", body: publicReason || "This transaction does not qualify for commission.", tone: "border-slate-200 bg-slate-50 text-slate-900" },
  };
  const c = CFG[status] || { icon: XCircle, title: STATUS_LABEL[status] || status, body: "", tone: "border-slate-200 bg-slate-50" };
  const Icon = c.icon;
  return (
    <Card className={`p-4 border ${c.tone}`}>
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 mt-0.5 shrink-0" />
        <div>
          <div className="font-semibold">{c.title}</div>
          <div className="text-sm mt-0.5 opacity-90">{c.body}</div>
          {adjustmentNote && <div className="text-xs mt-2 opacity-80">Note: {adjustmentNote}</div>}
        </div>
      </div>
    </Card>
  );
}
