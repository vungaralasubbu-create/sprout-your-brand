import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft, CheckCircle2, XCircle, PauseCircle, RefreshCw, Clock,
  CreditCard, Loader2, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { AmbassadorShell } from "@/components/ambassador/ambassador-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPayoutDetails, cancelPayoutRequest } from "@/lib/campus-ambassador/payouts.functions";

export const Route = createFileRoute("/_authenticated/ambassador/payouts/$id")({
  head: () => ({
    meta: [
      { title: "Payout Details — Glintr Campus Ambassador" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PayoutDetailsPage,
});

const money = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const fmtDateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

const STATUS_META: Record<string, { label: string; tone: string; banner?: string }> = {
  requested: { label: "Requested", tone: "bg-blue-50 text-blue-700 border border-blue-200", banner: "Your payout request has been submitted." },
  under_review: { label: "Under Review", tone: "bg-blue-50 text-blue-700 border border-blue-200", banner: "Your payout is being reviewed." },
  approved: { label: "Approved", tone: "bg-indigo-50 text-indigo-700 border border-indigo-200", banner: "Your payout has been approved and is queued for processing." },
  processing: { label: "Processing", tone: "bg-cyan-50 text-cyan-700 border border-cyan-200", banner: "Your payout is being processed by the payout provider." },
  paid: { label: "Paid", tone: "bg-emerald-50 text-emerald-700 border border-emerald-200", banner: "Payout has been successfully completed." },
  failed: { label: "Failed", tone: "bg-rose-50 text-rose-700 border border-rose-200", banner: "Payout failed. Allocated commission has been returned to available." },
  on_hold: { label: "On Hold", tone: "bg-amber-50 text-amber-700 border border-amber-200", banner: "This payout is temporarily on hold while payout information or related account details are reviewed." },
  cancelled: { label: "Cancelled", tone: "bg-slate-100 text-slate-700 border", banner: "This payout was cancelled." },
  reversed: { label: "Reversed", tone: "bg-rose-50 text-rose-700 border border-rose-200", banner: "This payout was reversed." },
};

const TIMELINE_ORDER: { key: string; label: string; timeKey: keyof any }[] = [
  { key: "requested", label: "Payout Requested", timeKey: "requested_at" },
  { key: "approved", label: "Payout Approved", timeKey: "approved_at" },
  { key: "processing", label: "Payout Processing", timeKey: "processing_at" },
  { key: "paid", label: "Payout Paid", timeKey: "paid_at" },
];

function PayoutDetailsPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const get = useServerFn(getPayoutDetails);
  const cancel = useServerFn(cancelPayoutRequest);
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["amb-payout-details", id],
    queryFn: () => get({ data: { id } }),
  });

  const cancelMut = useMutation({
    mutationFn: () => cancel({ data: { id } }),
    onSuccess: (res: any) => {
      if (res?.gate === "ok") {
        toast.success("Payout request cancelled");
        qc.invalidateQueries({ queryKey: ["amb-payout-details", id] });
        qc.invalidateQueries({ queryKey: ["amb-payouts-overview"] });
      } else {
        toast.error("Could not cancel this payout");
      }
    },
  });

  if (q.isLoading) {
    return (
      <AmbassadorShell>
        <div className="p-8 max-w-4xl mx-auto space-y-3">
          <div className="h-8 w-40 bg-slate-100 rounded animate-pulse" />
          <div className="h-32 bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      </AmbassadorShell>
    );
  }

  if (q.isError) {
    return (
      <AmbassadorShell>
        <div className="p-8 max-w-md mx-auto">
          <Card className="p-6 text-center">
            <XCircle className="h-8 w-8 text-rose-500 mx-auto mb-2" />
            <div className="font-medium">Unable To Load Payout Details</div>
            <Button size="sm" className="mt-3" onClick={() => q.refetch()}>Retry</Button>
          </Card>
        </div>
      </AmbassadorShell>
    );
  }

  const d = q.data;
  if (!d || d.gate === "not_approved") {
    return (
      <AmbassadorShell>
        <div className="p-8 max-w-md mx-auto">
          <Card className="p-6 text-center">
            <div className="font-medium">Payouts are available for approved Campus Ambassadors.</div>
          </Card>
        </div>
      </AmbassadorShell>
    );
  }

  if (d.gate === "forbidden") {
    return (
      <AmbassadorShell>
        <div className="p-8 max-w-md mx-auto">
          <Card className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
            <div className="font-medium">Payout Access Restricted</div>
            <div className="text-sm text-slate-600 mt-1">You do not have access to this payout.</div>
            <Button asChild size="sm" className="mt-3">
              <Link to="/ambassador/payouts">Back to Payouts</Link>
            </Button>
          </Card>
        </div>
      </AmbassadorShell>
    );
  }

  if (d.gate === "not_found") {
    return (
      <AmbassadorShell>
        <div className="p-8 max-w-md mx-auto">
          <Card className="p-6 text-center">
            <div className="font-medium">Payout not found</div>
            <Button asChild size="sm" className="mt-3">
              <Link to="/ambassador/payouts">Back to Payouts</Link>
            </Button>
          </Card>
        </div>
      </AmbassadorShell>
    );
  }

  const p = (d as any).payout;
  const allocs = (d as any).allocations as any[];
  const meta = STATUS_META[p.status] || STATUS_META.requested;

  return (
    <AmbassadorShell>
      <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-5">
        <Button asChild variant="ghost" size="sm">
          <Link to="/ambassador/payouts"><ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Payouts</Link>
        </Button>

        {/* Header */}
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-slate-500 font-mono">{p.payout_code}</div>
              <div className="mt-1 font-display text-2xl font-semibold">{money(p.amount)}</div>
              <div className="text-xs text-slate-500 mt-1">
                Requested {fmtDateTime(p.requested_at)}
              </div>
            </div>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${meta.tone}`}>
              {meta.label}
            </span>
          </div>

          {meta.banner && (
            <div className={`mt-3 rounded-lg border px-3 py-2 text-sm ${meta.tone}`}>
              {meta.banner}
            </div>
          )}

          {p.public_failure_reason && p.status === "failed" && (
            <div className="mt-3 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-800">
              <div className="font-medium">Reason</div>
              <div className="text-xs mt-0.5">{p.public_failure_reason}</div>
            </div>
          )}
          {p.public_hold_reason && p.status === "on_hold" && (
            <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
              {p.public_hold_reason}
            </div>
          )}
          {p.public_reversal_reason && p.status === "reversed" && (
            <div className="mt-3 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-800">
              {p.public_reversal_reason}
            </div>
          )}

          {p.status === "requested" && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => cancelMut.mutate()}
                disabled={cancelMut.isPending}
              >
                {cancelMut.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Cancel Payout Request
              </Button>
            </div>
          )}
        </Card>

        {/* Details grid */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-5">
            <div className="text-[11px] uppercase tracking-widest text-slate-500 mb-3">Payout Details</div>
            <dl className="text-sm space-y-2">
              <Row k="Payout ID" v={p.payout_code} />
              <Row k="Amount" v={money(p.amount)} />
              <Row k="Method" v={p.payout_method === "bank_account" ? "Bank Account" : p.payout_method === "upi" ? "UPI" : "—"} />
              <Row k="Destination" v={p.masked_destination || "—"} />
              <Row k="Mode" v={p.mode === "automatic" ? "Automatic" : "Ambassador Request"} />
              {p.provider_reference && <Row k="Provider Reference" v={p.provider_reference} />}
            </dl>
          </Card>

          {/* Journey */}
          <Card className="p-5">
            <div className="text-[11px] uppercase tracking-widest text-slate-500 mb-3">Payout Journey</div>
            <ol className="relative border-l ml-2 space-y-4">
              {TIMELINE_ORDER.map((step) => {
                const done = !!p[step.timeKey];
                return (
                  <li key={step.key} className="pl-4">
                    <span className={`absolute -left-[7px] flex items-center justify-center h-3.5 w-3.5 rounded-full ${done ? "bg-emerald-500" : "bg-slate-300"}`}>
                      {done && <CheckCircle2 className="h-3 w-3 text-white" />}
                    </span>
                    <div className={`text-sm ${done ? "font-medium" : "text-slate-500"}`}>{step.label}</div>
                    <div className="text-xs text-slate-500">{fmtDateTime(p[step.timeKey]) || "—"}</div>
                  </li>
                );
              })}
              {p.status === "failed" && (
                <li className="pl-4">
                  <span className="absolute -left-[7px] flex items-center justify-center h-3.5 w-3.5 rounded-full bg-rose-500">
                    <XCircle className="h-3 w-3 text-white" />
                  </span>
                  <div className="text-sm font-medium">Payout Failed</div>
                  <div className="text-xs text-slate-500">{fmtDateTime(p.failed_at)}</div>
                </li>
              )}
              {p.status === "on_hold" && (
                <li className="pl-4">
                  <span className="absolute -left-[7px] flex items-center justify-center h-3.5 w-3.5 rounded-full bg-amber-500">
                    <PauseCircle className="h-3 w-3 text-white" />
                  </span>
                  <div className="text-sm font-medium">Payout On Hold</div>
                  <div className="text-xs text-slate-500">{fmtDateTime(p.on_hold_at)}</div>
                </li>
              )}
              {p.status === "cancelled" && (
                <li className="pl-4">
                  <span className="absolute -left-[7px] flex items-center justify-center h-3.5 w-3.5 rounded-full bg-slate-400">
                    <XCircle className="h-3 w-3 text-white" />
                  </span>
                  <div className="text-sm font-medium">Payout Cancelled</div>
                  <div className="text-xs text-slate-500">{fmtDateTime(p.cancelled_at)}</div>
                </li>
              )}
              {p.status === "reversed" && (
                <li className="pl-4">
                  <span className="absolute -left-[7px] flex items-center justify-center h-3.5 w-3.5 rounded-full bg-rose-500">
                    <RefreshCw className="h-3 w-3 text-white" />
                  </span>
                  <div className="text-sm font-medium">Payout Reversed</div>
                  <div className="text-xs text-slate-500">{fmtDateTime(p.reversed_at)}</div>
                </li>
              )}
            </ol>
          </Card>
        </div>

        {/* Commissions included */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="h-4 w-4 text-slate-500" />
            <div className="text-[11px] uppercase tracking-widest text-slate-500">Commission Included</div>
          </div>
          {allocs.length === 0 ? (
            <div className="text-sm text-slate-500">No commission entries linked to this payout.</div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-3 py-2">Commission ID</th>
                    <th className="text-left px-3 py-2">Enrollment</th>
                    <th className="text-left px-3 py-2">Program</th>
                    <th className="text-right px-3 py-2">Commission</th>
                    <th className="text-right px-3 py-2">Allocated</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {allocs.map((a) => (
                    <tr key={a.allocation_id}>
                      <td className="px-3 py-2 font-mono text-xs">{a.transaction_code}</td>
                      <td className="px-3 py-2 text-xs">{a.enrollment_code || "—"}</td>
                      <td className="px-3 py-2 text-xs">{a.program_name}</td>
                      <td className="px-3 py-2 text-right">{money(a.commission_amount)}</td>
                      <td className="px-3 py-2 text-right font-medium">{money(a.allocated_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Activity */}
        {(d as any).activity?.length > 0 && (
          <Card className="p-5">
            <div className="text-[11px] uppercase tracking-widest text-slate-500 mb-3">Activity</div>
            <ul className="space-y-2 text-sm">
              {(d as any).activity.map((a: any) => (
                <li key={a.id} className="flex items-start gap-2">
                  <Clock className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium text-xs">{a.description || a.event_type}</div>
                    <div className="text-[11px] text-slate-500">{fmtDateTime(a.created_at)}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </AmbassadorShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b pb-1.5 last:border-0">
      <span className="text-xs text-slate-500">{k}</span>
      <span className="text-sm font-medium text-right">{v}</span>
    </div>
  );
}
