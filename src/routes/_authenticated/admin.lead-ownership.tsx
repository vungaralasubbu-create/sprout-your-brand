import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  listOwnershipReviews,
  getOwnershipReview,
  decideOwnershipReview,
  getOwnershipHistory,
} from "@/lib/admin/lead-ownership.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/lead-ownership")({
  component: AdminLeadOwnership,
});

const FILTERS = [
  { key: "pending_review", label: "Pending Review" },
  { key: "possible_duplicate", label: "Possible Duplicate" },
  { key: "disputed", label: "Ownership Disputed" },
  { key: "resolved_partner_own", label: "Resolved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

const STATUS_LABELS: Record<string, string> = {
  pending_review: "Pending Review",
  under_review: "Under Review",
  possible_duplicate: "Possible Duplicate",
  disputed: "Ownership Disputed",
  resolved_partner_own: "Approved As Own Lead",
  resolved_glintr_provided: "Classified As Glintr Lead",
  resolved_keep_existing: "Existing Ownership Retained",
  resolved_merged: "Merged",
  rejected: "Rejected",
};

const ACTION_OPTIONS = [
  { key: "keep_existing", label: "Keep Existing Ownership" },
  { key: "approve_partner_own", label: "Approve As Sales Partner Own Lead" },
  { key: "mark_glintr_provided", label: "Mark As Glintr Provided Lead" },
  { key: "merge", label: "Merge Lead Records" },
  { key: "reject", label: "Reject Submission" },
] as const;

function AdminLeadOwnership() {
  const [filter, setFilter] = useState<FilterKey>("pending_review");
  const [openId, setOpenId] = useState<string | null>(null);

  const fetchList = useServerFn(listOwnershipReviews);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-lead-ownership", filter],
    queryFn: () => fetchList({ data: { status: filter } }),
  });

  const reviews = data?.reviews ?? [];
  const counts = data?.statusCounts ?? {};

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-caption font-mono uppercase tracking-widest text-primary">
            Sales Operations
          </div>
          <h1 className="mt-1 font-display text-2xl font-semibold">Lead Ownership Review</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Resolve duplicate mobile submissions from Sales Partners. Ownership decisions determine
            whether the eligible 70% own-lead share or 50% Glintr-provided share applies.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          ["pending_review", "Pending Review"],
          ["possible_duplicate", "Possible Duplicate"],
          ["disputed", "Disputed"],
          ["resolved_partner_own", "Approved Own"],
          ["resolved_glintr_provided", "Marked Glintr"],
        ].map(([k, lbl]) => (
          <Card key={k} className="p-4">
            <div className="text-caption uppercase text-muted-foreground">{lbl}</div>
            <div className="mt-1 font-display text-2xl font-semibold tabular-nums">
              {counts[k as string] ?? 0}
            </div>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              filter === f.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-white hover:bg-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Submitted Lead</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Submitted By</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Existing Ownership</TableHead>
              <TableHead>Existing Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No ownership reviews for this filter.
                </TableCell>
              </TableRow>
            ) : (
              reviews.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.submitted_name}</TableCell>
                  <TableCell className="font-mono text-xs">{r.submitted_mobile}</TableCell>
                  <TableCell>
                    <div className="text-sm">{r.claiming_partner_name}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {r.claiming_partner_code}
                    </div>
                  </TableCell>
                  <TableCell>{r.submitted_program}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {r.existing_ownership_type === "partner_own"
                        ? "Partner Own"
                        : r.existing_ownership_type === "glintr_provided"
                        ? "Glintr Provided"
                        : "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.existing_created_at ? new Date(r.existing_created_at).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="muted">{STATUS_LABELS[r.status] ?? r.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => setOpenId(r.id)}>
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {openId && <ReviewDialog id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function ReviewDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const fetchDetail = useServerFn(getOwnershipReview);
  const fetchHistory = useServerFn(getOwnershipHistory);
  const decideFn = useServerFn(decideOwnershipReview);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["owner-review", id],
    queryFn: () => fetchDetail({ data: { id } }),
  });

  const existingLeadId = (data as any)?.existing_lead?.id;
  const { data: history } = useQuery({
    queryKey: ["owner-history", existingLeadId],
    queryFn: () => fetchHistory({ data: { lead_id: existingLeadId as string } }),
    enabled: !!existingLeadId,
  });

  const [action, setAction] = useState<string>("keep_existing");
  const [reason, setReason] = useState("");

  const decide = useMutation({
    mutationFn: () => decideFn({ data: { id, action: action as any, reason } }),
    onSuccess: () => {
      toast.success("Ownership decision saved.");
      qc.invalidateQueries({ queryKey: ["admin-lead-ownership"] });
      onClose();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to save decision."),
  });

  const review = (data as any)?.review;
  const claiming = (data as any)?.claiming_partner;
  const submittedCourse = (data as any)?.submitted_course;
  const existing = (data as any)?.existing_lead;
  const existingAssigned = (data as any)?.existing_assigned_partner;
  const existingOwner = (data as any)?.existing_owner_partner;
  const paymentStatus = (data as any)?.existing_payment_status;
  const resolved = !!review?.decided_at;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lead Ownership Review</DialogTitle>
        </DialogHeader>

        {isLoading || !review ? (
          <div className="py-8 text-center text-muted-foreground">Loading…</div>
        ) : (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="text-caption font-mono uppercase tracking-widest text-primary">
                  New Submission
                </div>
                <dl className="mt-3 space-y-2 text-sm">
                  <Row label="Lead Name" value={review.submitted_full_name} />
                  <Row label="Mobile" value={review.submitted_mobile} mono />
                  <Row label="Submitted By" value={`${claiming?.display_name ?? "—"} (${claiming?.partner_code ?? "—"})`} />
                  <Row label="Partner ID" value={claiming?.id ?? "—"} mono />
                  <Row label="Submission Date" value={new Date(review.created_at).toLocaleString()} />
                  <Row label="Lead Source" value={review.submitted_source ?? "—"} />
                  <Row label="Program" value={submittedCourse?.name ?? review.submitted_program_interest ?? "—"} />
                  <Row label="Notes" value={review.submitted_notes ?? "—"} />
                </dl>
              </Card>
              <Card className="p-4">
                <div className="text-caption font-mono uppercase tracking-widest text-muted-foreground">
                  Existing Lead
                </div>
                {existing ? (
                  <dl className="mt-3 space-y-2 text-sm">
                    <Row label="Lead ID" value={existing.id} mono />
                    <Row label="Lead Name" value={existing.full_name} />
                    <Row label="Mobile" value={existing.mobile} mono />
                    <Row
                      label="Ownership Type"
                      value={existing.lead_ownership_type === "partner_own" ? "Partner Own" : "Glintr Provided"}
                    />
                    <Row label="Original Created" value={new Date(existing.created_at).toLocaleString()} />
                    <Row label="Original Source" value={existing.source ?? "—"} />
                    <Row
                      label="Assigned Partner"
                      value={
                        existingAssigned
                          ? `${existingAssigned.display_name} (${existingAssigned.partner_code})`
                          : existingOwner
                          ? `${existingOwner.display_name} (${existingOwner.partner_code})`
                          : "—"
                      }
                    />
                    <Row label="Lead Status" value={existing.status ?? "—"} />
                    <Row label="Payment Status" value={paymentStatus ?? "—"} />
                  </dl>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">Existing lead unavailable.</p>
                )}
              </Card>
            </div>

            {history && (history as any).history?.length > 0 && (
              <Card className="p-4">
                <div className="text-caption font-mono uppercase tracking-widest text-muted-foreground">
                  Ownership History
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  {(history as any).history.map((h: any) => (
                    <div key={h.id} className="flex items-start justify-between gap-3 border-b pb-2 last:border-0">
                      <div>
                        <Badge variant="outline" className="mr-2">
                          {h.ownership_type === "partner_own" ? "Partner Own" : "Glintr Provided"}
                        </Badge>
                        <span className="text-muted-foreground">
                          {h.partners?.display_name ? `${h.partners.display_name} (${h.partners.partner_code})` : ""}
                        </span>
                        {h.reason && <div className="text-xs text-muted-foreground mt-1">{h.reason}</div>}
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(h.started_at).toLocaleDateString()} →{" "}
                        {h.ended_at ? new Date(h.ended_at).toLocaleDateString() : "current"}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {resolved ? (
              <Card className="p-4 bg-muted/40">
                <div className="text-sm">
                  <div className="font-medium">
                    Resolved: {STATUS_LABELS[review.status] ?? review.status}
                  </div>
                  {review.admin_reason && (
                    <div className="text-muted-foreground mt-1">{review.admin_reason}</div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(review.decided_at).toLocaleString()}
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-4 space-y-3">
                <div className="text-caption font-mono uppercase tracking-widest text-primary">
                  Admin Decision
                </div>
                <Select value={action} onValueChange={setAction}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_OPTIONS.map((a) => (
                      <SelectItem key={a.key} value={a.key}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Reason for this decision (required)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
                <DialogFooter>
                  <Button variant="ghost" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => decide.mutate()}
                    disabled={reason.trim().length < 3 || decide.isPending}
                  >
                    {decide.isPending ? "Saving…" : "Save Decision"}
                  </Button>
                </DialogFooter>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={`text-right ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}
