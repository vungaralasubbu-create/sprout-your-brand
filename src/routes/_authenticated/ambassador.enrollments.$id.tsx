import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft, AlertTriangle, ShieldAlert, ShieldCheck, ShieldQuestion,
  CircleDot, CheckCircle2, Clock, XCircle, Wallet, GraduationCap, ScrollText,
  Ban, Info, Lock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getEnrollmentDetails } from "@/lib/campus-ambassador/enrollments.functions";

export const Route = createFileRoute("/_authenticated/ambassador/enrollments/$id")({
  head: () => ({
    meta: [
      { title: "Enrollment Details — Glintr Campus Ambassador" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EnrollmentDetailsPage,
});

const PAYMENT_LABEL: Record<string, string> = {
  not_started: "Not Started",
  payment_pending: "Payment Pending",
  payment_submitted: "Payment Submitted",
  verification_pending: "Verification Pending",
  verified: "Payment Verified",
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
const ELIGIBILITY_LABEL: Record<string, string> = {
  not_started: "Not Started",
  pending_review: "Pending Review",
  eligible: "Eligible",
  ineligible: "Ineligible",
  on_hold: "On Hold",
};
function commissionTone(s: string | null | undefined): any {
  if (!s) return "muted";
  if (["paid", "available", "approved", "eligible"].includes(s)) return "success";
  if (["reversed", "ineligible"].includes(s)) return "danger";
  if (s === "on_hold") return "warning";
  return "info";
}
function inr(n: any) { return `₹${Number(n ?? 0).toLocaleString("en-IN")}`; }

function EnrollmentDetailsPage() {
  const { id } = Route.useParams();
  const detailsFn = useServerFn(getEnrollmentDetails);
  const q = useQuery({
    queryKey: ["amb-enr-details", id],
    queryFn: () => detailsFn({ data: { id } }),
    retry: false,
  });

  if (q.isLoading) return <DetailsSkeleton />;

  if (q.isError) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <Card className="p-6">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
          <div className="mt-2 font-display text-xl font-semibold">Unable To Load Enrollment Details</div>
          <Button size="sm" className="mt-3" onClick={() => q.refetch()}>Retry</Button>
        </Card>
      </div>
    );
  }

  const gate = q.data?.gate;
  if (gate === "restricted" || gate === "not_active") {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <Card className="p-6">
          <Lock className="h-6 w-6 text-slate-500" />
          <div className="mt-2 font-display text-xl font-semibold">Enrollment Access Restricted</div>
          <div className="text-sm text-slate-600 mt-1">
            You do not have access to view this enrollment.
          </div>
          <Button asChild size="sm" className="mt-4">
            <Link to="/ambassador/enrollments">Back To My Enrollments</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const enr: any = (q.data as any).enrollment;
  const lead: any = (q.data as any).lead;
  const com: any = (q.data as any).commission;
  const events: any[] = (q.data as any).events ?? [];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <Button asChild size="sm" variant="ghost">
        <Link to="/ambassador/enrollments"><ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back To My Enrollments</Link>
      </Button>

      <div>
        <div className="text-xs uppercase tracking-widest text-primary font-mono">Enrollment Details</div>
        <h1 className="mt-1 font-display text-3xl font-semibold">{enr.display_name}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="font-mono">{enr.enrollment_code}</span>
          {lead?.lead_code && (<><span>•</span><span className="font-mono">{lead.lead_code}</span></>)}
          <span>•</span>
          <span>Enrolled {new Date(enr.enrolled_at ?? enr.created_at).toLocaleString()}</span>
        </div>
      </div>

      {/* Cancellation / Refund banners */}
      {enr.enrollment_status === "cancelled" && (
        <Banner icon={Ban} tone="rose" title="Enrollment Cancelled"
          body="This enrollment was cancelled. Commission eligibility follows the Glintr commission workflow." />
      )}
      {enr.enrollment_status === "refunded" && (
        <Banner icon={Ban} tone="rose" title="Enrollment Refunded"
          body="A verified refund was confirmed for this enrollment. Commission eligibility follows the authorised reversal workflow." />
      )}
      {enr.payment_status === "reversed" && (
        <Banner icon={Ban} tone="rose" title="Payment Reversed"
          body="The learner's payment was reversed. Commission eligibility follows the authorised commission reversal workflow." />
      )}

      {/* Overview */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-widest text-slate-500">Program</div>
          <div className="mt-1 text-sm font-semibold">{enr.program_title ?? enr.program_id ?? "—"}</div>
          {lead?.pricing_plan && <div className="text-xs text-slate-500 mt-0.5">Plan: {lead.pricing_plan}</div>}
          {lead?.campaign_id && <div className="text-xs text-slate-500 mt-0.5">Campaign: {lead.campaign_id}</div>}
          {lead?.lead_source && <div className="text-xs text-slate-500 mt-0.5">Source: {lead.lead_source}</div>}
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-widest text-slate-500">Payment</div>
          <div className="mt-1"><Badge variant={paymentTone(enr.payment_status)}>{PAYMENT_LABEL[enr.payment_status] ?? enr.payment_status}</Badge></div>
          {enr.verified_at && (<div className="text-[11px] text-slate-500 mt-2">Verified {new Date(enr.verified_at).toLocaleString()}</div>)}
          {enr.payment_reference_masked && (
            <div className="text-[11px] text-slate-500 mt-1 font-mono">Ref: {enr.payment_reference_masked}</div>
          )}
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-widest text-slate-500">Enrollment</div>
          <div className="mt-1"><Badge variant={enrollTone(enr.enrollment_status)}>{ENROLL_LABEL[enr.enrollment_status] ?? enr.enrollment_status}</Badge></div>
          {enr.gross_revenue ? (
            <div className="text-xs text-slate-500 mt-2">Enrollment Value: <span className="tabular-nums">{inr(enr.gross_revenue)}</span></div>
          ) : null}
        </Card>
      </div>

      {/* Attribution + Referral link */}
      {lead ? (
        <AttributionBanner status={lead.attribution_status} reason={lead.attribution_public_reason} referralLeadId={lead.id} />
      ) : (
        <Banner icon={Info} tone="slate" title="Referral Attribution"
          body="This enrollment is connected to your Ambassador account. Referral lead details are unavailable." />
      )}

      {/* Payment Verification */}
      <Card className="p-5">
        <div className="text-xs uppercase tracking-widest text-primary font-mono">Payment Verification</div>
        <div className="mt-1 font-display text-xl font-semibold">Verification Status</div>
        <div className="mt-3 grid md:grid-cols-2 gap-3 text-sm">
          <VerificationRow label="Payment Verification Status" value={PAYMENT_LABEL[enr.payment_status] ?? enr.payment_status} tone={paymentTone(enr.payment_status)} />
          <VerificationRow label="Payment Reference" value={enr.payment_reference_masked ?? "—"} mono />
          <VerificationRow label="Payment Verified Date" value={enr.verified_at ? new Date(enr.verified_at).toLocaleString() : "—"} />
          <VerificationRow label="Last Updated" value={new Date(enr.updated_at).toLocaleString()} />
        </div>
        <div className="mt-4 text-[11px] text-slate-500 border-t pt-3 flex items-start gap-2">
          <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            Payment verification is performed only by authorised Glintr reviewers. Full UTR data, bank details, and payment screenshots are not visible to Campus Ambassadors.
          </span>
        </div>
      </Card>

      {/* Commission Eligibility */}
      <Card className="p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs uppercase tracking-widest text-primary font-mono">Commission Eligibility</div>
            <div className="mt-1 font-display text-xl font-semibold">Eligibility Check</div>
          </div>
          <div className="flex gap-2">
            <Badge variant={eligibilityTone(com?.eligibility_status)}>
              Eligibility: {ELIGIBILITY_LABEL[com?.eligibility_status ?? "not_started"] ?? "Not Started"}
            </Badge>
            <Badge variant={commissionTone(com?.status)}>
              Status: {com ? (COMMISSION_LABEL[com.status] ?? com.status) : "Not Yet Calculated"}
            </Badge>
          </div>
        </div>

        {!com ? (
          <div className="mt-4 text-sm text-slate-600 border rounded-md bg-slate-50/60 p-4">
            <div className="font-medium">Commission Not Yet Calculated</div>
            <p className="mt-1 text-xs text-slate-500">
              A commission transaction will be calculated once the enrollment payment is verified and the configured commission eligibility rules run.
            </p>
          </div>
        ) : com.eligibility_status === "eligible" ? (
          <div className="mt-4 grid md:grid-cols-3 gap-3">
            <StatCell label="Eligible Commission Base" value={inr(com.eligible_base_amount)} />
            <StatCell label="Commission Rate" value={`${Number(com.commission_percentage).toFixed(0)}%`} />
            <StatCell label="Calculated Commission" value={inr(com.calculated_commission)} tone="success" />
          </div>
        ) : com.eligibility_status === "ineligible" ? (
          <div className="mt-4 text-sm border rounded-md p-4 bg-rose-50/60 border-rose-100">
            <div className="font-medium text-rose-900">Not Eligible For Ambassador Commission</div>
            {com.eligibility_public_reason && (
              <p className="mt-1 text-xs text-rose-800">{com.eligibility_public_reason}</p>
            )}
          </div>
        ) : com.eligibility_status === "on_hold" ? (
          <div className="mt-4 text-sm border rounded-md p-4 bg-amber-50/60 border-amber-100">
            <div className="font-medium text-amber-900">Commission Review On Hold</div>
            <p className="mt-1 text-xs text-amber-800">
              This commission is temporarily on hold while the related enrollment or payment status is reviewed.
            </p>
          </div>
        ) : (
          <div className="mt-4 text-sm border rounded-md p-4 bg-slate-50/60">
            <div className="font-medium">Commission Eligibility Under Review</div>
            <p className="mt-1 text-xs text-slate-500">
              The Glintr commission workflow is currently evaluating eligibility for this enrollment.
            </p>
          </div>
        )}

        {com?.transaction_code && (
          <div className="mt-3 text-[11px] text-slate-500 font-mono">Transaction: {com.transaction_code}</div>
        )}
        {com?.eligibility_checked_at && (
          <div className="text-[11px] text-slate-500">Last checked {new Date(com.eligibility_checked_at).toLocaleString()}</div>
        )}
      </Card>

      {/* Timeline */}
      <Card className="p-5">
        <div className="text-xs uppercase tracking-widest text-primary font-mono">Enrollment Journey</div>
        <div className="mt-1 font-display text-xl font-semibold">Timeline</div>
        <Timeline events={events} />
      </Card>

      {lead && (
        <div className="pt-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/ambassador/referrals/$id" params={{ id: lead.id }}>
              <ScrollText className="h-3.5 w-3.5 mr-1" /> View Referral Details
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function eligibilityTone(s: string | null | undefined): any {
  if (!s) return "muted";
  if (s === "eligible") return "success";
  if (s === "ineligible") return "danger";
  if (s === "on_hold") return "warning";
  return "info";
}

function VerificationRow({ label, value, tone, mono }: any) {
  return (
    <div className="flex items-center justify-between gap-3 border-b last:border-b-0 py-2">
      <div className="text-xs text-slate-500">{label}</div>
      {tone ? (
        <Badge variant={tone}>{value}</Badge>
      ) : (
        <div className={`text-sm ${mono ? "font-mono" : ""}`}>{value}</div>
      )}
    </div>
  );
}

function StatCell({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className={`rounded-md border p-3 ${tone === "success" ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100"}`}>
      <div className="text-[10px] uppercase tracking-widest text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-display font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function Banner({ icon: Icon, title, body, tone }: any) {
  const toneMap: Record<string, string> = {
    rose: "bg-rose-50 border-rose-200 text-rose-900",
    amber: "bg-amber-50 border-amber-200 text-amber-900",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-900",
    slate: "bg-slate-50 border-slate-200 text-slate-800",
    blue: "bg-blue-50 border-blue-200 text-blue-900",
  };
  return (
    <Card className={`p-4 border ${toneMap[tone] ?? toneMap.slate}`}>
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 mt-0.5 shrink-0" />
        <div>
          <div className="font-semibold text-sm">{title}</div>
          <div className="text-xs mt-0.5 opacity-90">{body}</div>
        </div>
      </div>
    </Card>
  );
}

function AttributionBanner({ status, reason, referralLeadId }: any) {
  const map: Record<string, { icon: any; title: string; body: string; tone: string }> = {
    confirmed: { icon: ShieldCheck, title: "Referral Attribution Confirmed", body: "This enrollment is attributed to your Campus Ambassador referral.", tone: "emerald" },
    pending_review: { icon: ShieldQuestion, title: "Referral Attribution Under Review", body: "Glintr is reviewing the referral attribution for this enrollment.", tone: "amber" },
    conflict_review: { icon: ShieldQuestion, title: "Referral Attribution Review", body: "This referral has conflicting attribution signals and is being reviewed.", tone: "amber" },
    invalid: { icon: ShieldAlert, title: "Referral Not Eligible For Attribution", body: reason || "Referral attribution could not be confirmed.", tone: "rose" },
    expired: { icon: ShieldAlert, title: "Referral Attribution Expired", body: reason || "Referral attribution was outside the eligible referral period.", tone: "slate" },
    valid: { icon: ShieldCheck, title: "Referral Attribution Valid", body: "This referral is currently attributed to your Campus Ambassador account.", tone: "blue" },
  };
  const cfg = map[status] ?? map.valid;
  return <Banner icon={cfg.icon} title={cfg.title} body={cfg.body} tone={cfg.tone} />;
}

function timelineIcon(t: string) {
  if (t.startsWith("commission")) return Wallet;
  if (t.includes("verified") || t.includes("confirmed") || t.includes("approved")) return CheckCircle2;
  if (t.includes("cancel") || t.includes("refund") || t.includes("invalid") || t.includes("reversed") || t.includes("ineligible")) return XCircle;
  if (t.includes("pending") || t.includes("review") || t.includes("submitted") || t.includes("started")) return Clock;
  return CircleDot;
}

function Timeline({ events }: { events: any[] }) {
  if (!events || events.length === 0) {
    return (
      <div className="mt-4 text-sm text-slate-500 py-6 text-center border rounded-md bg-slate-50/50">
        No Events Yet
      </div>
    );
  }
  return (
    <ol className="mt-4 relative border-l-2 border-slate-100 space-y-4 pl-6">
      {events.map((e) => {
        const Icon = timelineIcon(e.event_type);
        return (
          <li key={e.id} className="relative">
            <div className="absolute -left-[34px] top-0 h-6 w-6 rounded-full bg-white border-2 border-primary/40 grid place-items-center">
              <Icon className="h-3 w-3 text-primary" />
            </div>
            <div className="text-sm font-medium">{e.event_label}</div>
            <div className="text-[11px] text-slate-500">
              {new Date(e.created_at).toLocaleString()}
              {e.event_source && e.event_source !== "system" && <> • {e.event_source}</>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function DetailsSkeleton() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-4">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-16 w-full rounded-xl" />
      <div className="grid md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-56 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
