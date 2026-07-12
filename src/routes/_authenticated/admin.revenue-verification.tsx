import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listRevenueRecords, setRevenueStatus, createAdjustment } from "@/lib/admin/finance.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/revenue-verification")({ component: Page });

function inr(n: number | string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n));
}

function Page() {
  const listFn = useServerFn(listRevenueRecords);
  const decideFn = useServerFn(setRevenueStatus);
  const adjustFn = useServerFn(createAdjustment);
  const qc = useQueryClient();

  const { data: rows = [] } = useQuery({
    queryKey: ["revenue-verify"], queryFn: () => listFn({ data: { verifyOnly: true } }),
  });

  const [active, setActive] = useState<any>(null);
  const [action, setAction] = useState<"approve"|"hold"|"reject"|"request_review"|"mark_eligible"|"mark_available"|"adjust"|null>(null);
  const [reason, setReason] = useState("");
  const [adjType, setAdjType] = useState<any>("partial_refund");
  const [adjAmount, setAdjAmount] = useState<string>("");

  async function submit() {
    if (!active || !action) return;
    try {
      if (action === "adjust") {
        if (!adjAmount || Number(adjAmount) <= 0) return toast.error("Amount required");
        if (!reason.trim()) return toast.error("Reason required");
        await adjustFn({ data: { commissionId: active.id, adjustmentType: adjType, adjustmentAmount: Number(adjAmount), reason } });
      } else {
        if ((action === "reject" || action === "hold") && !reason.trim()) return toast.error("Reason required");
        await decideFn({ data: { commissionId: active.id, action, reason } });
      }
      toast.success("Updated");
      setActive(null); setAction(null); setReason(""); setAdjAmount("");
      qc.invalidateQueries({ queryKey: ["revenue-verify"] });
      qc.invalidateQueries({ queryKey: ["admin-revenue"] });
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div>
        <h2 className="text-2xl font-display font-semibold tracking-tight">Revenue Verification</h2>
        <p className="text-sm text-muted-foreground mt-1">Verify payment, enrollment, attribution, rule and refund status before approving revenue.</p>
      </div>

      <div className="rounded-xl border border-border/70 bg-white overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Record</TableHead><TableHead>Partner</TableHead><TableHead>Program</TableHead>
            <TableHead>Enrollment</TableHead><TableHead className="text-right">Gross</TableHead>
            <TableHead className="text-right">Share</TableHead><TableHead>Rule</TableHead>
            <TableHead>Status</TableHead><TableHead>Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No records awaiting verification.</TableCell></TableRow>}
            {rows.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-[11px]">{r.id.slice(0,8)}</TableCell>
                <TableCell className="text-sm">{r.partner?.full_name ?? "—"}</TableCell>
                <TableCell className="text-sm">{r.enrollment?.program_title ?? r.program_id}</TableCell>
                <TableCell className="text-xs">
                  <div>{r.enrollment?.student_name ?? "—"}</div>
                  <Badge variant="outline" className="mt-1">{r.enrollment?.status ?? "—"}</Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">{inr(r.gross_revenue)}</TableCell>
                <TableCell className="text-right font-mono text-sm font-semibold">{inr(r.commission_amount)} <span className="text-[10px] text-muted-foreground">({Number(r.revenue_share_pct).toFixed(1)}%)</span></TableCell>
                <TableCell className="text-xs">
                  {r.rule ? <><div className="font-medium">{r.rule.name}</div><div className="text-[10px] text-muted-foreground">{r.rule.partner_type}</div></> : <span className="text-muted-foreground">Ad-hoc</span>}
                </TableCell>
                <TableCell><Badge variant="warning">{r.status}</Badge></TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    <Button size="sm" onClick={() => { setActive(r); setAction("approve"); }}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => { setActive(r); setAction("hold"); }}>Hold</Button>
                    <Button size="sm" variant="outline" onClick={() => { setActive(r); setAction("reject"); }}>Reject</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setActive(r); setAction("adjust"); }}>Adjustment</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && (setActive(null), setAction(null))}>
        <DialogContent>
          <DialogHeader><DialogTitle>{action?.replaceAll("_"," ").toUpperCase()} — {active?.enrollment?.program_title ?? active?.program_id}</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><div className="text-muted-foreground">Partner</div><div>{active?.partner?.full_name}</div></div>
              <div><div className="text-muted-foreground">Share</div><div className="font-mono">{active && inr(active.commission_amount)} · {active && Number(active.revenue_share_pct).toFixed(1)}%</div></div>
              <div className="col-span-2"><div className="text-muted-foreground">Rule applied</div><div>{active?.rule?.name ?? "Ad-hoc percentage"}</div></div>
            </div>
            {action === "adjust" && (
              <>
                <Select value={adjType} onValueChange={setAdjType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["full_refund","partial_refund","chargeback","cancelled_enrollment","failed_payment","duplicate_enrollment","fraud_review","manual_adjustment"].map((t) =>
                      <SelectItem key={t} value={t}>{t.replaceAll("_"," ")}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="number" placeholder="Adjustment amount" value={adjAmount} onChange={(e) => setAdjAmount(e.target.value)} />
              </>
            )}
            <Textarea placeholder={action === "reject" || action === "hold" || action === "adjust" ? "Reason (required)" : "Notes"} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setActive(null); setAction(null); }}>Cancel</Button>
            <Button onClick={submit}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
