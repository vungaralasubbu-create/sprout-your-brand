import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listAdjustments, decideAdjustment } from "@/lib/admin/finance.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/adjustments")({ component: Page });

const TYPES = ["full_refund","partial_refund","chargeback","cancelled_enrollment","failed_payment","duplicate_enrollment","fraud_review","manual_adjustment"];
const STATUSES = ["pending","approved","rejected","applied","reversed"];

function inr(n?: number | string | null) {
  return n == null ? "—" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n));
}

function Page() {
  const listFn = useServerFn(listAdjustments);
  const decideFn = useServerFn(decideAdjustment);
  const qc = useQueryClient();
  const [f, setF] = useState<any>({});
  const { data: rows = [] } = useQuery({ queryKey: ["adjustments", f], queryFn: () => listFn({ data: f }) });

  const [active, setActive] = useState<any>(null);
  const [decision, setDecision] = useState<"approved"|"rejected">("approved");
  const [notes, setNotes] = useState("");

  async function submit() {
    try {
      await decideFn({ data: { adjustmentId: active.id, decision, notes } });
      toast.success("Adjustment updated");
      setActive(null); setNotes("");
      qc.invalidateQueries({ queryKey: ["adjustments"] });
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-6 max-w-[1500px]">
      <div>
        <h2 className="text-2xl font-display font-semibold tracking-tight">Refunds & Adjustments</h2>
        <p className="text-sm text-muted-foreground mt-1">Original revenue records are preserved. Approved adjustments reduce commission and create an audit record.</p>
      </div>

      <div className="rounded-xl border bg-white p-4 grid gap-3 md:grid-cols-4">
        <Select onValueChange={(v) => setF({ ...f, status: v === "all" ? undefined : v })}>
          <SelectTrigger><SelectValue placeholder="Approval status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select onValueChange={(v) => setF({ ...f, type: v === "all" ? undefined : v })}>
          <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {TYPES.map((s) => <SelectItem key={s} value={s}>{s.replaceAll("_"," ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-white overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>ID</TableHead><TableHead>Revenue Record</TableHead>
            <TableHead>Type</TableHead><TableHead className="text-right">Original</TableHead>
            <TableHead className="text-right">Adjustment</TableHead><TableHead>Reason</TableHead>
            <TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No adjustments.</TableCell></TableRow>}
            {rows.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-[11px]">{r.id.slice(0,8)}</TableCell>
                <TableCell className="font-mono text-[11px]">{r.commission_id.slice(0,8)}</TableCell>
                <TableCell><Badge variant="muted">{r.adjustment_type?.replaceAll("_"," ")}</Badge></TableCell>
                <TableCell className="text-right font-mono">{inr(r.original_amount)}</TableCell>
                <TableCell className="text-right font-mono">{inr(r.adjustment_amount)}</TableCell>
                <TableCell className="text-xs max-w-xs truncate">{r.reason}</TableCell>
                <TableCell><Badge variant={r.approval_status === "applied" || r.approval_status === "approved" ? "success" : r.approval_status === "rejected" ? "danger" : "warning"}>{r.approval_status}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  {r.approval_status === "pending" && (
                    <Button size="sm" onClick={() => { setActive(r); setDecision("approved"); setNotes(""); }}>Review</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Review Adjustment</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="text-xs bg-surface-1 rounded p-2">
              <div>Type: <b>{active?.adjustment_type?.replaceAll("_"," ")}</b></div>
              <div>Amount: <b>{inr(active?.adjustment_amount)}</b> against {inr(active?.original_amount)}</div>
              <div className="mt-1 text-muted-foreground">Reason: {active?.reason}</div>
            </div>
            <Select value={decision} onValueChange={(v) => setDecision(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Approve (applies to commission)</SelectItem>
                <SelectItem value="rejected">Reject</SelectItem>
              </SelectContent>
            </Select>
            <Textarea placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setActive(null)}>Cancel</Button>
            <Button onClick={submit}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
