import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft, AlertTriangle, ShieldAlert, ShieldCheck, ShieldQuestion,
  CircleDot, CheckCircle2, Clock, XCircle, Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getReferralDetails } from "@/lib/campus-ambassador/referrals.functions";

export const Route = createFileRoute("/_authenticated/ambassador/referrals/$id")({
  head: () => ({
    meta: [
      { title: "Referral Details — Glintr Campus Ambassador" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReferralDetailsPage,
});

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
function statusTone(s: string): any {
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
function commissionTone(s: string | null | undefined): any {
  if (!s) return "muted";
  if (["paid", "available", "approved", "eligible"].includes(s)) return "success";
  if (["reversed", "ineligible"].includes(s)) return "danger";
  if (s === "on_hold") return "warning";
  return "info";
}

function inr(n: any) { return `₹${Number(n ?? 0).toLocaleString("en-IN")}`; }

function ReferralDetailsPage() {
  const { id } = Route.useParams();
  const detailsFn = useServerFn(getReferralDetails);
  const q = useQuery({
    queryKey: ["amb-ref-details", id],
    queryFn: () => detailsFn({ data: { id } }),
    retry: false,
  });

  if (q.isLoading) return <DetailsSkeleton />;

  if (q.isError) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <Card className="p-6">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
          <div className="mt-2 font-display text-xl font-semibold">Unable To Load Referral Details</div>
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
          <ShieldAlert className="h-6 w-6 text-slate-500" />
          <div className="mt-2 font-display text-xl font-semibold">Referral Access Restricted</div>
          <div className="text-sm text-slate-600 mt-1">
            You do not have access to view this referral.
          </div>
          <Button asChild size="sm" className="mt-4">
            <Link to="/ambassador/referrals">Back To My Referrals</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const { lead, enrollment, commission, events } = q.data!;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <Button asChild size="sm" variant="ghost">
        <Link to="/ambassador/referrals"><ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back To My Referrals</Link>
      </Button>

      <div>
        <div className="text-xs uppercase tracking-widest text-primary font-mono">Referral Details</div>
        <h1 className="mt-1 font-display text-3xl font-semibold">{lead!.display_name}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="font-mono">{lead!.lead_code}</span>
          <span>•</span>
          <span>Referred {new Date(lead!.created_at).toLocaleString()}</span>
          {lead!.lead_source && (<><span>•</span><span>Source: {lead!.lead_source}</span></>)}
        </div>
      </div>

      <AttributionBanner status={lead!.attribution_status} reason={lead!.attribution_public_reason} />

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-widest text-slate-500">Program</div>
          <div className="mt-1 text-sm font-semibold">{enrollment?.program_title ?? lead!.program_id ?? "—"}</div>
          {lead!.pricing_plan && <div className="text-xs text-slate-500 mt-0.5">Plan: {lead!.pricing_plan}</div>}
          {lead!.campaign_id && <div className="text-xs text-slate-500 mt-0.5">Campaign: {lead!.campaign_id}</div>}
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-widest text-slate-500">Current Status</div>
          <div className="mt-1"><Badge variant={statusTone(lead!.status)}>{STATUS_LABEL[lead!.status] ?? lead!.status}</Badge></div>
          {enrollment && (
            <div className="text-xs text-slate-500 mt-2">
              Enrollment {enrollment.status}
              {enrollment.verified_at && <> • Verified {new Date(enrollment.verified_at).toLocaleDateString()}</>}
            </div>
          )}
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-widest text-slate-500">Commission</div>
          {commission ? (
            <>
              <div className="mt-1"><Badge variant={commissionTone(commission.status)}>{COMMISSION_LABEL[commission.status] ?? commission.status}</Badge></div>
              <div className="mt-2 text-lg font-semibold tabular-nums">{inr(commission.calculated_commission)}</div>
              <div className="text-[11px] text-slate-500">
                {Number(commission.commission_percentage).toFixed(0)}% of {inr(commission.eligible_base_amount)}
              </div>
              {commission.public_reason && (
                <div className="text-xs text-slate-500 mt-1">{commission.public_reason}</div>
              )}
            </>
          ) : (
            <div className="mt-1 text-sm text-slate-500">Not Yet Calculated</div>
          )}
        </Card>
      </div>

      {/* Timeline */}
      <Card className="p-5">
        <div className="text-xs uppercase tracking-widest text-primary font-mono">Referral Journey</div>
        <div className="mt-1 font-display text-xl font-semibold">Timeline</div>
        <Timeline events={events ?? []} />
      </Card>
    </div>
  );
}

function AttributionBanner({ status, reason }: { status: string; reason?: string | null }) {
  const map: Record<string, { icon: any; title: string; body: string; tone: string }> = {
    confirmed: {
      icon: ShieldCheck,
      title: "Referral Attribution Confirmed",
      body: "This enrollment is attributed to your Campus Ambassador referral. Commission eligibility remains dependent on payment verification and configured commission rules.",
      tone: "bg-emerald-50 border-emerald-200 text-emerald-900",
    },
    pending_review: {
      icon: ShieldQuestion,
      title: "Referral Attribution Under Review",
      body: "Glintr is reviewing the referral attribution for this enrollment.",
      tone: "bg-amber-50 border-amber-200 text-amber-900",
    },
    conflict_review: {
      icon: ShieldQuestion,
      title: "Referral Attribution Review",
      body: "This referral has multiple or conflicting attribution signals and is being reviewed.",
      tone: "bg-amber-50 border-amber-200 text-amber-900",
    },
    invalid: {
      icon: ShieldAlert,
      title: "Referral Not Eligible For Attribution",
      body: reason || "Referral attribution could not be confirmed.",
      tone: "bg-rose-50 border-rose-200 text-rose-900",
    },
    expired: {
      icon: ShieldAlert,
      title: "Referral Attribution Expired",
      body: reason || "Referral attribution was outside the eligible referral period.",
      tone: "bg-slate-100 border-slate-200 text-slate-800",
    },
    valid: {
      icon: ShieldCheck,
      title: "Referral Attribution Valid",
      body: "This referral is currently attributed to your Campus Ambassador account.",
      tone: "bg-blue-50 border-blue-200 text-blue-900",
    },
  };
  const cfg = map[status] ?? map.valid;
  const Icon = cfg.icon;
  return (
    <Card className={`p-4 border ${cfg.tone}`}>
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 mt-0.5 shrink-0" />
        <div>
          <div className="font-semibold text-sm">{cfg.title}</div>
          <div className="text-xs mt-0.5 opacity-90">{cfg.body}</div>
        </div>
      </div>
    </Card>
  );
}

function timelineIcon(t: string) {
  if (t.startsWith("commission")) return Wallet;
  if (t.includes("verified") || t.includes("confirmed") || t.includes("approved")) return CheckCircle2;
  if (t.includes("cancel") || t.includes("refund") || t.includes("invalid") || t.includes("reversed")) return XCircle;
  if (t.includes("pending") || t.includes("review") || t.includes("submitted")) return Clock;
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
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}
