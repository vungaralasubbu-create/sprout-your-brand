import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  getRiskFlag,
  updateRiskFlagStatus,
  addRiskFlagNote,
} from "@/lib/admin/risk-review.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAdminSession, hasPermission } from "@/hooks/use-admin-permissions";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/risk-review/$id")({
  component: RiskFlagDetail,
});

const FLAG_LABELS: Record<string, string> = {
  duplicate_utr: "Duplicate UTR",
  possible_duplicate_proof: "Possible Duplicate Payment Proof",
  unexpected_payment_amount: "Unexpected Payment Amount",
  lead_multi_partner: "Lead Linked To Multiple Partners",
  lead_ownership_conflict: "Lead Ownership Conflict",
  repeated_payment_submission: "Repeated Payment Submission",
  unusual_sales_activity: "Unusual Sales Submission Activity",
  suspicious_referral_pattern: "Suspicious Referral Pattern",
  repeated_duplicate_lead_uploads: "Repeated Duplicate Lead Uploads",
  other: "Other Review Required",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  under_review: "Under Review",
  needs_information: "Needs Information",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

function RiskFlagDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: session } = useAdminSession();
  const canReview = hasPermission(session, "risk_review.review");
  const canResolve = hasPermission(session, "risk_review.resolve");
  const canDismiss = hasPermission(session, "risk_review.dismiss");

  const getFn = useServerFn(getRiskFlag);
  const updFn = useServerFn(updateRiskFlagStatus);
  const noteFn = useServerFn(addRiskFlagNote);

  const q = useQuery({
    queryKey: ["risk", "flag", id],
    queryFn: () => getFn({ data: { id } }) as any,
  });

  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["risk", "flag", id] });
    qc.invalidateQueries({ queryKey: ["risk"] });
  };

  const [note, setNote] = useState("");
  const [decisionNote, setDecisionNote] = useState("");

  const setStatus = useMutation({
    mutationFn: (v: { status: string; note?: string }) =>
      updFn({ data: { id, status: v.status, note: v.note } }) as any,
    onSuccess: () => { toast.success("Flag updated"); setDecisionNote(""); invalidate(); },
    onError: (e: any) => toast.error(e.message || "Failed"),
  });

  const addNote = useMutation({
    mutationFn: () => noteFn({ data: { id, note } }) as any,
    onSuccess: () => { toast.success("Note added"); setNote(""); invalidate(); },
    onError: (e: any) => toast.error(e.message || "Failed"),
  });

  if (q.isLoading) return <div className="p-6 text-muted-foreground">Loading…</div>;
  if (q.isError) return <div className="p-6 text-destructive">Failed to load flag.</div>;

  const { flag, related, notes, activity } = q.data as any;
  const partner = flag.partners;
  const lead = flag.partner_leads;
  const sub = flag.partner_payment_submissions;
  const ref = flag.partner_referrals;

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link to="/admin/risk-review"><ArrowLeft className="size-4 mr-1" />Back to Risk Review</Link>
        </Button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-5 text-warning" />
              <h1 className="text-2xl font-semibold">
                {FLAG_LABELS[flag.flag_type] ?? flag.flag_type}
              </h1>
              <Badge variant="outline">{STATUS_LABELS[flag.status]}</Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-1 font-mono">Flag ID: {flag.id}</div>
            <p className="text-sm mt-2 max-w-2xl">{flag.reason}</p>
          </div>
          {canReview && flag.status === "open" && (
            <Button variant="outline" onClick={() => setStatus.mutate({ status: "under_review" })}>
              Mark Under Review
            </Button>
          )}
        </div>
      </div>

      {/* Connected records */}
      <div className="grid md:grid-cols-2 gap-4">
        {partner && (
          <Card className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Sales Partner</div>
            <div className="font-medium mt-1">{partner.display_name}</div>
            <div className="text-xs text-muted-foreground">{partner.email} · {partner.mobile}</div>
            <Button asChild size="sm" variant="link" className="px-0 mt-1">
              <Link to="/admin/partners/$id" params={{ id: partner.id }}>Open Partner Profile →</Link>
            </Button>
          </Card>
        )}
        {lead && (
          <Card className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Lead</div>
            <div className="font-medium mt-1">{lead.full_name}</div>
            <div className="text-xs text-muted-foreground">{lead.mobile}{lead.email ? ` · ${lead.email}` : ""}</div>
            <div className="text-xs text-muted-foreground mt-1">Status: {lead.status}</div>
          </Card>
        )}
        {sub && (
          <Card className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Payment Submission</div>
            <div className="font-medium mt-1">₹{Number(sub.amount).toLocaleString("en-IN")} · {sub.plan}</div>
            <div className="text-xs text-muted-foreground font-mono">UTR {sub.utr_reference}</div>
            <div className="text-xs text-muted-foreground">Date {sub.payment_date} · Status {sub.status}</div>
            <Button asChild size="sm" variant="link" className="px-0 mt-1">
              <Link to="/admin/payment-verification">Open Payment Verification →</Link>
            </Button>
          </Card>
        )}
        {flag.flag_type === "unexpected_payment_amount" && (
          <Card className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Amount Difference</div>
            <div className="text-sm mt-1">Expected: ₹{Number(flag.amount_expected).toLocaleString("en-IN")}</div>
            <div className="text-sm">Submitted: ₹{Number(flag.amount_submitted).toLocaleString("en-IN")}</div>
            <div className="text-sm text-warning font-medium">Δ ₹{Number(flag.amount_delta).toLocaleString("en-IN")}</div>
          </Card>
        )}
        {ref && (
          <Card className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Referral</div>
            <div className="font-medium mt-1 font-mono">{ref.referral_code}</div>
            <div className="text-xs text-muted-foreground">Status {ref.status}</div>
          </Card>
        )}
      </div>

      {/* Related duplicates */}
      {related?.length > 1 && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b text-sm font-medium">Related Payment Records ({related.length})</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>UTR</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {related.map((r: any) => (
                <TableRow key={r.id} className={r.id === sub?.id ? "bg-warning/5" : ""}>
                  <TableCell className="text-xs">{r.payment_date}</TableCell>
                  <TableCell>₹{Number(r.amount).toLocaleString("en-IN")}</TableCell>
                  <TableCell className="text-xs">{r.plan}</TableCell>
                  <TableCell className="text-xs font-mono">{r.utr_reference}</TableCell>
                  <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Review actions */}
      {canReview && (flag.status === "open" || flag.status === "under_review" || flag.status === "needs_information") && (
        <Card className="p-4 space-y-3">
          <div className="text-sm font-medium">Review Decision</div>
          <p className="text-xs text-muted-foreground">
            A review note is required to resolve or dismiss. This action does not automatically
            change payment, payout, referral, or partner status — use the linked workflow for that.
          </p>
          <Textarea
            placeholder="Review note (required for Resolve/Dismiss)…"
            value={decisionNote}
            onChange={(e) => setDecisionNote(e.target.value)}
            rows={3}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setStatus.mutate({ status: "needs_information", note: decisionNote || undefined })}
              disabled={setStatus.isPending}
            >
              Request Information
            </Button>
            {canResolve && (
              <Button
                onClick={() => setStatus.mutate({ status: "resolved", note: decisionNote })}
                disabled={setStatus.isPending || !decisionNote.trim()}
              >
                Resolve Flag
              </Button>
            )}
            {canDismiss && (
              <Button
                variant="ghost"
                onClick={() => setStatus.mutate({ status: "dismissed", note: decisionNote })}
                disabled={setStatus.isPending || !decisionNote.trim()}
              >
                Dismiss Flag
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Internal notes */}
      <Card className="p-4 space-y-3">
        <div className="text-sm font-medium">Internal Notes <span className="text-xs text-muted-foreground">(admin-only)</span></div>
        {canReview && (
          <div className="flex gap-2">
            <Textarea
              rows={2}
              placeholder="Add internal note…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Button onClick={() => addNote.mutate()} disabled={!note.trim() || addNote.isPending}>Add</Button>
          </div>
        )}
        <div className="space-y-2">
          {notes.length === 0 && <div className="text-xs text-muted-foreground">No notes yet.</div>}
          {notes.map((n: any) => (
            <div key={n.id} className="border rounded-md p-2 text-sm">
              <div className="whitespace-pre-wrap">{n.note}</div>
              <div className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Activity log */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b text-sm font-medium">Activity Timeline</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activity.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No activity yet.</TableCell></TableRow>
            )}
            {activity.map((a: any) => (
              <TableRow key={a.id}>
                <TableCell className="text-sm">{a.action}</TableCell>
                <TableCell className="text-xs">{a.from_status ?? "—"}</TableCell>
                <TableCell className="text-xs">{a.to_status ?? "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
