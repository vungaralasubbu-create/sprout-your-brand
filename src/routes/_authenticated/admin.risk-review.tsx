import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  getRiskSummary,
  listRiskFlags,
  getRiskSettings,
  updateRiskSettings,
  runReferralPatternScan,
} from "@/lib/admin/risk-review.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useAdminSession, hasPermission } from "@/hooks/use-admin-permissions";
import { ShieldAlert, Sliders, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/risk-review")({
  component: RiskReview,
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

function statusBadge(s: string) {
  const variant =
    s === "open" ? "warning"
    : s === "under_review" ? "info"
    : s === "needs_information" ? "muted"
    : s === "resolved" ? "success"
    : "outline";
  return <Badge variant={variant as any}>{STATUS_LABELS[s] ?? s}</Badge>;
}

function RiskReview() {
  const { data: session } = useAdminSession();
  const canReview = hasPermission(session, "risk_review.review");
  const isSuper = !!session?.isSuperAdmin;

  const [status, setStatus] = useState<string>("open");
  const [flagType, setFlagType] = useState<string>("all");
  const [q, setQ] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const summaryFn = useServerFn(getRiskSummary);
  const listFn = useServerFn(listRiskFlags);
  const scanFn = useServerFn(runReferralPatternScan);

  const summary = useQuery({ queryKey: ["risk", "summary"], queryFn: () => summaryFn() as any });
  const list = useQuery({
    queryKey: ["risk", "list", status, flagType],
    queryFn: () =>
      listFn({
        data: {
          status: status === "all" ? undefined : status,
          flag_type: flagType === "all" ? undefined : flagType,
        },
      }) as any,
  });

  const qc = useQueryClient();
  const scan = useMutation({
    mutationFn: () => scanFn() as any,
    onSuccess: (r: any) => {
      toast.success(`Referral scan complete — ${r?.created ?? 0} flags reviewed.`);
      qc.invalidateQueries({ queryKey: ["risk"] });
    },
    onError: (e: any) => toast.error(e.message || "Scan failed"),
  });

  const filtered = ((list.data as any[]) ?? []).filter((r) => {
    if (!q) return true;
    const t = q.toLowerCase();
    return (
      r.partners?.display_name?.toLowerCase().includes(t) ||
      r.partner_leads?.full_name?.toLowerCase().includes(t) ||
      r.partner_leads?.mobile?.includes(t) ||
      r.utr_normalized?.includes(t) ||
      r.id.startsWith(t)
    );
  });

  const s = summary.data as any;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-warning" />
            <h1 className="text-2xl font-semibold">Risk Review</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Manual review queue for unusual activity. Flags are informational only — no partner
            is auto-suspended and no payment, payout, or referral is auto-cancelled.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canReview && (
            <Button variant="outline" onClick={() => scan.mutate()} disabled={scan.isPending}>
              {scan.isPending ? "Scanning…" : "Scan Referral Patterns"}
            </Button>
          )}
          {isSuper && (
            <Button variant="outline" onClick={() => setSettingsOpen(true)}>
              <Sliders className="size-4 mr-1.5" /> Thresholds
            </Button>
          )}
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <SumTile label="Open Risk Flags" value={s?.open ?? "—"} highlight />
        <SumTile label="Duplicate UTR" value={s?.byType?.duplicate_utr ?? "—"} />
        <SumTile label="Payment Proof" value={s?.byType?.possible_duplicate_proof ?? "—"} />
        <SumTile label="Lead Conflicts" value={s?.byType?.lead_multi_partner ?? "—"} />
        <SumTile label="Amount Flags" value={s?.byType?.unexpected_payment_amount ?? "—"} />
        <SumTile label="Referral Patterns" value={s?.byType?.suspicious_referral_pattern ?? "—"} />
        <SumTile label="Resolved" value={s?.resolved ?? "—"} muted />
      </div>

      {/* Filters */}
      <Card className="p-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Flag Type</Label>
          <Select value={flagType} onValueChange={setFlagType}>
            <SelectTrigger className="w-72"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(FLAG_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-[220px]">
          <Label className="text-xs">Search</Label>
          <div className="relative">
            <Search className="size-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Partner, lead, mobile, UTR, flag ID…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Queue */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Flag</TableHead>
              <TableHead>Sales Partner</TableHead>
              <TableHead>Lead</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Detected</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isLoading && (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
            )}
            {!list.isLoading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No flags match this filter.</TableCell></TableRow>
            )}
            {filtered.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="font-medium text-sm">{FLAG_LABELS[r.flag_type] ?? r.flag_type}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1 max-w-sm">{r.reason}</div>
                </TableCell>
                <TableCell className="text-sm">
                  {r.partners ? (
                    <Link to="/admin/partners/$id" params={{ id: r.partners.id }} className="hover:underline">
                      {r.partners.display_name}
                    </Link>
                  ) : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-sm">
                  {r.partner_leads ? (
                    <div>
                      <div>{r.partner_leads.full_name}</div>
                      <div className="text-xs text-muted-foreground">{r.partner_leads.mobile}</div>
                    </div>
                  ) : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-sm">
                  {r.partner_payment_submissions ? (
                    <div>
                      <div>₹{Number(r.partner_payment_submissions.amount).toLocaleString("en-IN")}</div>
                      <div className="text-xs text-muted-foreground font-mono">{r.partner_payment_submissions.utr_reference}</div>
                    </div>
                  ) : r.utr_normalized ? (
                    <div className="text-xs font-mono text-muted-foreground">{r.utr_normalized}</div>
                  ) : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(r.detected_at ?? r.created_at).toLocaleString()}
                </TableCell>
                <TableCell>{statusBadge(r.status)}</TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/admin/risk-review/$id" params={{ id: r.id }}>Review</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {isSuper && (
        <RiskSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      )}
    </div>
  );
}

function SumTile({ label, value, highlight, muted }: { label: string; value: any; highlight?: boolean; muted?: boolean }) {
  return (
    <Card className={`p-4 ${highlight ? "border-warning/40 bg-warning/5" : ""}`}>
      <div className={`text-xs ${muted ? "text-muted-foreground" : "text-muted-foreground"}`}>{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${muted ? "text-muted-foreground" : ""}`}>{value}</div>
    </Card>
  );
}

function RiskSettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const getFn = useServerFn(getRiskSettings);
  const saveFn = useServerFn(updateRiskSettings);
  const { data } = useQuery({ queryKey: ["risk", "settings"], queryFn: () => getFn() as any, enabled: open });
  const [form, setForm] = useState<any>(null);
  const qc = useQueryClient();
  const save = useMutation({
    mutationFn: (v: any) => saveFn({ data: v }) as any,
    onSuccess: () => {
      toast.success("Thresholds updated.");
      qc.invalidateQueries({ queryKey: ["risk"] });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message || "Failed to save"),
  });
  const f = form ?? data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Risk Review Thresholds</DialogTitle></DialogHeader>
        {f && (
          <div className="space-y-3">
            {[
              ["submissions_per_hour_threshold", "High Payment Submissions Per Hour"],
              ["verified_sales_per_day_threshold", "High Verified Sales Per Day"],
              ["duplicate_utr_threshold", "Repeated Duplicate UTR Threshold"],
              ["duplicate_lead_upload_threshold", "Repeated Duplicate Lead Upload Threshold"],
              ["amount_delta_min", "Minimum Amount Difference To Flag (₹)"],
            ].map(([k, label]) => (
              <div key={k} className="grid gap-1">
                <Label className="text-xs">{label}</Label>
                <Input
                  type="number"
                  value={f[k]}
                  onChange={(e) => setForm({ ...f, [k]: Number(e.target.value) })}
                />
              </div>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() =>
              save.mutate({
                submissions_per_hour_threshold: Number(f.submissions_per_hour_threshold),
                verified_sales_per_day_threshold: Number(f.verified_sales_per_day_threshold),
                duplicate_utr_threshold: Number(f.duplicate_utr_threshold),
                duplicate_lead_upload_threshold: Number(f.duplicate_lead_upload_threshold),
                amount_delta_min: Number(f.amount_delta_min),
              })
            }
            disabled={save.isPending || !f}
          >
            Save Thresholds
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
