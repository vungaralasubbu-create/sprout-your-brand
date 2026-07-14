import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ShieldCheck,
  Search,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Loader2,
  ExternalLink,
} from "lucide-react";

import {
  adminActOnPaymentSubmission,
  adminGetPaymentSubmission,
  adminListPaymentSubmissions,
  adminPaymentSummary,
} from "@/lib/admin/payment-verification.functions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/payment-verification")({
  component: AdminPaymentVerification,
});

type StatusFilter =
  | "all"
  | "pending_verification"
  | "under_review"
  | "verified"
  | "rejected"
  | "needs_more_info"
  | "duplicate_flagged";

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending_verification", label: "Pending" },
  { key: "under_review", label: "Under Review" },
  { key: "verified", label: "Verified" },
  { key: "rejected", label: "Rejected" },
  { key: "needs_more_info", label: "Needs Info" },
  { key: "duplicate_flagged", label: "Possible Duplicate" },
];

function fmtINR(n: number) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}
function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function statusTone(s: string): "default" | "warning" | "success" | "danger" | "info" {
  switch (s) {
    case "verified":
      return "success";
    case "rejected":
      return "danger";
    case "under_review":
      return "info";
    case "needs_more_info":
      return "warning";
    case "duplicate_flagged":
      return "warning";
    default:
      return "default";
  }
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const tone = statusTone(status);
  const cls =
    tone === "success"
      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
      : tone === "danger"
        ? "bg-rose-500/10 text-rose-700 border-rose-500/20"
        : tone === "warning"
          ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
          : tone === "info"
            ? "bg-sky-500/10 text-sky-700 border-sky-500/20"
            : "bg-muted text-foreground border-border";
  return <Badge variant="outline" className={cn("font-medium", cls)}>{label}</Badge>;
}

function AdminPaymentVerification() {
  const listFn = useServerFn(adminListPaymentSubmissions);
  const summaryFn = useServerFn(adminPaymentSummary);

  const [filter, setFilter] = useState<StatusFilter>("pending_verification");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const summary = useQuery({
    queryKey: ["admin-payment-summary"],
    queryFn: () => summaryFn(),
  });

  const list = useQuery({
    queryKey: ["admin-payment-submissions", filter, search],
    queryFn: () => listFn({ data: { status: filter, search: search || null } }),
  });

  const counts = summary.data ?? {
    pending_verification: 0,
    under_review: 0,
    verified: 0,
    rejected: 0,
    needs_more_info: 0,
    duplicate_flagged: 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
            Finance / Verification
          </div>
          <h1 className="font-display text-2xl font-semibold mt-1">Payment Verification</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Review payment proofs submitted by sales partners. Only admins can verify, reject, or
            request more information.
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <SummaryCard label="Pending Verification" value={counts.pending_verification} icon={Clock} tone="warning" />
        <SummaryCard label="Under Review" value={counts.under_review} icon={ShieldCheck} tone="info" />
        <SummaryCard label="Verified" value={counts.verified} icon={CheckCircle2} tone="success" />
        <SummaryCard label="Rejected" value={counts.rejected} icon={XCircle} tone="danger" />
        <SummaryCard label="Possible Duplicates" value={counts.duplicate_flagged} icon={AlertTriangle} tone="warning" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "h-8 px-3 rounded-md text-[13px] font-medium transition-colors border",
              filter === f.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-white border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
        <form
          className="ml-auto relative w-full sm:w-72"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput.trim());
          }}
        >
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search UTR, mobile, name, partner ID…"
            className="pl-9 h-9 bg-white"
          />
        </form>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5">Submitted</th>
                <th className="text-left px-4 py-2.5">Lead</th>
                <th className="text-left px-4 py-2.5">Program / Plan</th>
                <th className="text-left px-4 py-2.5">Amount</th>
                <th className="text-left px-4 py-2.5">UTR</th>
                <th className="text-left px-4 py-2.5">Partner</th>
                <th className="text-left px-4 py-2.5">Status</th>
                <th className="text-right px-4 py-2.5">Action</th>
              </tr>
            </thead>
            <tbody>
              {list.isLoading && (
                <tr>
                  <td colSpan={8} className="text-center text-muted-foreground py-8">
                    Loading…
                  </td>
                </tr>
              )}
              {!list.isLoading && (list.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-muted-foreground py-10">
                    No payment submissions match this view.
                  </td>
                </tr>
              )}
              {(list.data ?? []).map((r) => (
                <tr key={r.id} className="border-t border-border/70 hover:bg-muted/20">
                  <td className="px-4 py-2.5 text-[13px] whitespace-nowrap">{fmtDate(r.submitted_at)}</td>
                  <td className="px-4 py-2.5">
                    <div className="font-medium">{r.lead_name}</div>
                    <div className="text-[12px] text-muted-foreground">{r.lead_mobile}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-medium">{r.course_name}</div>
                    <div className="text-[12px] text-muted-foreground">{r.plan_label}</div>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[13px]">{fmtINR(r.amount)}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px]">{r.utr_reference}</td>
                  <td className="px-4 py-2.5">
                    <div className="font-medium">{r.partner_name}</div>
                    <div className="text-[12px] font-mono text-muted-foreground">{r.partner_code}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={r.status} label={r.status_label} />
                    {r.is_duplicate_flag && r.status !== "duplicate_flagged" && (
                      <div className="text-[11px] text-amber-700 mt-1">Duplicate UTR</div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Button size="sm" variant="outline" onClick={() => setOpenId(r.id)}>
                      Review
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ReviewDialog id={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: any;
  tone: "warning" | "info" | "success" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-600 bg-emerald-500/10"
      : tone === "danger"
        ? "text-rose-600 bg-rose-500/10"
        : tone === "info"
          ? "text-sky-600 bg-sky-500/10"
          : "text-amber-600 bg-amber-500/10";
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className={cn("size-7 rounded-md flex items-center justify-center", toneClass)}>
          <Icon className="size-4" />
        </div>
      </div>
      <div className="mt-2 font-display text-2xl font-semibold">{value}</div>
    </Card>
  );
}

function ReviewDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const getFn = useServerFn(adminGetPaymentSubmission);
  const actFn = useServerFn(adminActOnPaymentSubmission);
  const qc = useQueryClient();

  const detail = useQuery({
    queryKey: ["admin-payment-submission", id],
    queryFn: () => getFn({ data: { id: id as string } }),
    enabled: !!id,
  });

  const [confirmVerify, setConfirmVerify] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [pendingAction, setPendingAction] = useState<
    "verify" | "reject" | "request_info" | "mark_under_review" | null
  >(null);

  const mutation = useMutation({
    mutationFn: (vars: {
      action: "verify" | "reject" | "request_info" | "mark_under_review";
      message?: string;
    }) =>
      actFn({
        data: {
          id: id as string,
          action: vars.action,
          message: vars.message ?? null,
        },
      }),
    onSuccess: (_res, vars) => {
      toast.success(
        vars.action === "verify"
          ? "Payment verified"
          : vars.action === "reject"
            ? "Payment rejected"
            : vars.action === "request_info"
              ? "More information requested"
              : "Marked under review",
      );
      qc.invalidateQueries({ queryKey: ["admin-payment-submissions"] });
      qc.invalidateQueries({ queryKey: ["admin-payment-summary"] });
      qc.invalidateQueries({ queryKey: ["admin-payment-submission", id] });
      setConfirmVerify(false);
      setMessageText("");
      setPendingAction(null);
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Action failed");
    },
  });

  const d = detail.data;
  const open = !!id;
  const activeDuplicates = useMemo(() => (d?.duplicates ?? []).length > 0, [d]);

  function runQuick(action: "mark_under_review") {
    mutation.mutate({ action });
  }

  function runWithMessage(action: "reject" | "request_info") {
    if (!messageText.trim()) {
      toast.error(
        action === "reject" ? "Rejection reason is required." : "Admin message is required.",
      );
      return;
    }
    mutation.mutate({ action, message: messageText.trim() });
  }

  const isTerminal = d?.status === "verified" || d?.status === "rejected";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" /> Payment Submission
          </DialogTitle>
          <DialogDescription>
            Review the details, proof and history before taking action.
          </DialogDescription>
        </DialogHeader>

        {detail.isLoading || !d ? (
          <div className="py-8 text-center text-muted-foreground text-sm">Loading…</div>
        ) : (
          <div className="space-y-5">
            {/* Status */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <StatusBadge status={d.status} label={d.status_label} />
              <div className="text-[12px] text-muted-foreground">
                Submitted {fmtDate(d.submitted_at)}
              </div>
            </div>

            {/* Duplicate warning */}
            {activeDuplicates && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <div className="flex items-center gap-2 text-amber-700 font-medium text-sm">
                  <AlertTriangle className="size-4" /> Possible Duplicate Payment
                </div>
                <div className="text-[12px] text-amber-700/90 mt-1">
                  This UTR / transaction reference matches other submissions in the system.
                </div>
                <div className="mt-2 space-y-1">
                  {d.duplicates.map((dup) => (
                    <div
                      key={dup.id}
                      className="text-[12px] flex flex-wrap items-center gap-x-3 gap-y-1 bg-white/60 rounded px-2 py-1"
                    >
                      <span className="font-mono">{dup.partner_code}</span>
                      <span className="text-muted-foreground">·</span>
                      <span>{fmtINR(dup.amount)}</span>
                      <span className="text-muted-foreground">·</span>
                      <span>{fmtDate(dup.submitted_at)}</span>
                      <StatusBadge status={dup.status} label={dup.status_label} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Details grid */}
            <div className="grid md:grid-cols-2 gap-4">
              <FieldGrid
                title="Lead"
                rows={[
                  ["Lead Name", d.lead_name],
                  ["Mobile", d.lead_mobile],
                  ["Lead Status", d.lead_status || "—"],
                ]}
              />
              <FieldGrid
                title="Program"
                rows={[
                  ["Program", d.course_name],
                  ["Plan", d.plan_label],
                  ["Amount", fmtINR(d.amount)],
                ]}
              />
              <FieldGrid
                title="Payment"
                rows={[
                  ["Payment Date", d.payment_date],
                  ["Method", d.payment_method_label],
                  ["UTR / Ref", d.utr_reference],
                  ["Payment Link", d.payment_link_url ? "Used" : "—"],
                ]}
              />
              <FieldGrid
                title="Sales Partner"
                rows={[
                  ["Name", d.partner_name],
                  ["Partner ID", d.partner_code],
                  ["Email", d.partner_email || "—"],
                ]}
              />
            </div>

            {d.partner_notes && (
              <Card className="p-3">
                <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  Sales Partner Notes
                </div>
                <div className="text-sm mt-1 whitespace-pre-wrap">{d.partner_notes}</div>
              </Card>
            )}

            {/* Proof */}
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  Payment Proof
                </div>
                {d.proof_url && (
                  <a
                    href={d.proof_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[12px] text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <ExternalLink className="size-3.5" /> View Full Proof
                  </a>
                )}
              </div>
              <div className="mt-2 rounded-md border bg-muted/20 overflow-hidden">
                {d.proof_url && d.proof_mime?.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.proof_url}
                    alt="Payment proof"
                    className="w-full max-h-[420px] object-contain bg-white"
                  />
                ) : d.proof_url ? (
                  <div className="p-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                    <FileText className="size-6" />
                    Proof file available — open in new tab to view.
                  </div>
                ) : (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    Proof unavailable.
                  </div>
                )}
              </div>
            </Card>

            {/* Activity History */}
            <Card className="p-3">
              <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
                Activity History
              </div>
              <ol className="space-y-2">
                {d.history.map((h) => (
                  <li key={h.id} className="text-[13px] flex items-start gap-2">
                    <div className="mt-1.5 size-1.5 rounded-full bg-primary" />
                    <div>
                      <div>
                        <span className="font-medium capitalize">{h.action.replace(/_/g, " ")}</span>
                        {" — "}
                        <span className="text-muted-foreground">{h.to_status_label}</span>
                        <span className="text-muted-foreground text-[12px]">
                          {" "}· {h.actor_role} · {fmtDate(h.created_at)}
                        </span>
                      </div>
                      {h.message && (
                        <div className="text-[12px] text-muted-foreground mt-0.5 whitespace-pre-wrap">
                          {h.message}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </Card>

            {/* Actions */}
            {!isTerminal && (
              <div className="space-y-3 border-t pt-4">
                <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  Admin Actions
                </div>
                {pendingAction === "reject" || pendingAction === "request_info" ? (
                  <div className="space-y-2">
                    <Label>
                      {pendingAction === "reject" ? "Rejection reason" : "Message to Sales Partner"}
                    </Label>
                    <Textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      rows={3}
                      placeholder={
                        pendingAction === "reject"
                          ? "Explain why this payment is being rejected…"
                          : "What additional information is needed?"
                      }
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setPendingAction(null);
                          setMessageText("");
                        }}
                        disabled={mutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant={pendingAction === "reject" ? "destructive" : "default"}
                        onClick={() => runWithMessage(pendingAction)}
                        disabled={mutation.isPending}
                      >
                        {mutation.isPending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : pendingAction === "reject" ? (
                          "Confirm Rejection"
                        ) : (
                          "Send Request"
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 justify-end">
                    {d.status !== "under_review" && (
                      <Button
                        variant="outline"
                        onClick={() => runQuick("mark_under_review")}
                        disabled={mutation.isPending}
                      >
                        <Clock className="size-4 mr-1.5" /> Mark Under Review
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => setPendingAction("request_info")}
                      disabled={mutation.isPending}
                    >
                      <MessageSquare className="size-4 mr-1.5" /> Request More Info
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setPendingAction("reject")}
                      disabled={mutation.isPending}
                    >
                      <XCircle className="size-4 mr-1.5" /> Reject Payment
                    </Button>
                    <Button
                      onClick={() => setConfirmVerify(true)}
                      disabled={mutation.isPending}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <CheckCircle2 className="size-4 mr-1.5" /> Verify Payment
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Verify confirmation */}
        <Dialog open={confirmVerify} onOpenChange={setConfirmVerify}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Verification</DialogTitle>
              <DialogDescription>
                This will mark the payment as verified and the lead as converted. This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {d && (
              <div className="space-y-2 text-sm">
                <Row label="Lead" value={d.lead_name} />
                <Row label="Program" value={d.course_name} />
                <Row label="Plan" value={d.plan_label} />
                <Row label="Amount" value={fmtINR(d.amount)} />
                <Row label="UTR" value={d.utr_reference} mono />
                <Row label="Sales Partner" value={`${d.partner_name} · ${d.partner_code}`} />
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmVerify(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={() => mutation.mutate({ action: "verify" })}
                disabled={mutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Confirm Verification"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

function FieldGrid({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <Card className="p-3">
      <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
        {title}
      </div>
      <div className="space-y-1">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 text-[13px]">
            <div className="text-muted-foreground">{k}</div>
            <div className="font-medium text-right truncate max-w-[60%]">{v || "—"}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <div className="text-muted-foreground">{label}</div>
      <div className={cn("font-medium text-right", mono && "font-mono text-[12px]")}>{value}</div>
    </div>
  );
}
