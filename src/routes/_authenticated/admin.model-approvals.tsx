import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { listModelApprovals, approvePartnerModel } from "@/lib/admin/admin.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/admin/model-approvals")({
  component: ModelApprovals,
});

function label(m?: string | null) {
  if (!m) return "—";
  if (m === "own_leads") return "Own Leads";
  if (m === "supported_sales") return "Supported";
  if (m === "dual_model") return "Dual";
  return m;
}

const STATUS_COLOR: Record<string, string> = {
  under_review: "bg-amber-50 text-amber-800 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  partially_approved: "bg-sky-50 text-sky-700 border-sky-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  information_required: "bg-amber-50 text-amber-800 border-amber-200",
  suspended: "bg-slate-100 text-slate-700 border-slate-200",
  selected: "bg-neutral-100 text-neutral-700 border-neutral-200",
};

function ModelApprovals() {
  const listFn = useServerFn(listModelApprovals);
  const approveFn = useServerFn(approvePartnerModel);
  const qc = useQueryClient();
  const [status, setStatus] = useState("under_review");
  const [openId, setOpenId] = useState<string | null>(null);
  const [openPartner, setOpenPartner] = useState<any>(null);
  const [decision, setDecision] = useState<"approved" | "partially_approved" | "information_required" | "rejected" | "suspended">("approved");
  const [approvedModel, setApprovedModel] = useState<"own_leads" | "supported_sales" | "dual_model">("own_leads");
  const [reason, setReason] = useState("");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-model-approvals", status],
    queryFn: () => listFn({ data: { status } }),
  });

  const approve = useMutation({
    mutationFn: () => approveFn({ data: { partner_id: openId!, decision, approved_model: approvedModel, reason } }),
    onSuccess: () => {
      toast.success("Decision saved");
      setOpenId(null); setReason("");
      qc.invalidateQueries({ queryKey: ["admin-model-approvals"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  return (
    <div className="space-y-6 max-w-[1300px]">
      <div>
        <h2 className="text-2xl font-display font-semibold">Sales Model Approvals</h2>
        <p className="text-muted-foreground text-sm">Approve partner-selected sales models. Selections are separate from approvals.</p>
      </div>

      <div className="rounded-xl border border-border/70 bg-white p-3 flex items-center gap-2">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="partially_approved">Partially Approved</SelectItem>
            <SelectItem value="information_required">Information Required</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border/70 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-1/60 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Partner</th>
                <th className="text-left px-3 py-3">Selected</th>
                <th className="text-left px-3 py-3">Approved</th>
                <th className="text-left px-3 py-3">Status</th>
                <th className="text-left px-3 py-3">Requested</th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>}
              {!isLoading && rows.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Nothing to review.</td></tr>
              )}
              {rows.map((p: any) => (
                <tr key={p.id} className="border-t border-border/40 hover:bg-surface-1/40">
                  <td className="px-4 py-3">
                    <Link to="/admin/partners/$id" params={{ id: p.id }} className="font-medium hover:text-primary">{p.display_name ?? "Partner"}</Link>
                    <div className="text-[11px] text-muted-foreground font-mono">{p.partner_code}</div>
                  </td>
                  <td className="px-3 py-3">{label(p.sales_model_selection)}</td>
                  <td className="px-3 py-3">{label(p.approved_sales_model)}</td>
                  <td className="px-3 py-3">
                    <Badge variant="outline" className={STATUS_COLOR[p.sales_model_approval_status ?? "selected"] ?? ""}>
                      {(p.sales_model_approval_status ?? "selected").replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-[12px] text-muted-foreground">
                    {p.sales_model_selected_at ? new Date(p.sales_model_selected_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => {
                      setOpenId(p.id); setOpenPartner(p);
                      setApprovedModel((p.sales_model_selection as any) ?? "own_leads");
                      setDecision("approved"); setReason("");
                    }}>Review</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Review Sales Model</DialogTitle></DialogHeader>
          {openPartner && (
            <div className="space-y-4">
              <div className="text-sm">
                <div className="font-medium">{openPartner.display_name}</div>
                <div className="text-muted-foreground">Selected: <span className="font-medium">{label(openPartner.sales_model_selection)}</span></div>
              </div>
              <div>
                <Label>Decision</Label>
                <Select value={decision} onValueChange={(v: any) => setDecision(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approve as selected</SelectItem>
                    <SelectItem value="partially_approved">Partially approve</SelectItem>
                    <SelectItem value="information_required">Request information</SelectItem>
                    <SelectItem value="rejected">Reject</SelectItem>
                    <SelectItem value="suspended">Suspend model access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(decision === "approved" || decision === "partially_approved") && (
                <div>
                  <Label>Approved model</Label>
                  <Select value={approvedModel} onValueChange={(v: any) => setApprovedModel(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="own_leads">Own Leads only</SelectItem>
                      <SelectItem value="supported_sales">Supported Sales only</SelectItem>
                      <SelectItem value="dual_model">Dual (Own + Supported)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>Reason / internal notes</Label>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenId(null)}>Cancel</Button>
            <Button onClick={() => approve.mutate()} disabled={approve.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
