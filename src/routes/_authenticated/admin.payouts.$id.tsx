import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getPayoutDetail, setPayoutStatus } from "@/lib/admin/finance.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/payouts/$id")({ component: Page });

function inr(n?: number | string | null) {
  return n == null ? "—" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n));
}

function Page() {
  const { id } = Route.useParams();
  const detailFn = useServerFn(getPayoutDetail);
  const setStatus = useServerFn(setPayoutStatus);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["payout", id], queryFn: () => detailFn({ data: { payoutId: id } }) });
  const [action, setAction] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [approvedAmount, setApprovedAmount] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [processedAt, setProcessedAt] = useState(new Date().toISOString().slice(0,10));

  async function submit() {
    try {
      await setStatus({ data: {
        payoutId: id, action,
        approvedAmount: approvedAmount ? Number(approvedAmount) : undefined,
        paymentReference: paymentRef || undefined,
        paymentMethod: paymentMethod || undefined,
        processedAt: action === "paid" ? new Date(processedAt).toISOString() : undefined,
        reason: reason || undefined,
      }});
      toast.success("Payout updated");
      setAction(null); setReason(""); setApprovedAmount(""); setPaymentRef("");
      qc.invalidateQueries({ queryKey: ["payout", id] });
      qc.invalidateQueries({ queryKey: ["admin-payouts"] });
    } catch (e: any) { toast.error(e.message); }
  }

  if (!data) return <div className="text-muted-foreground">Loading…</div>;
  const p = data.payout;

  return (
    <div className="space-y-6 max-w-[1200px]">
      <Link to="/admin/payouts" className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"><ArrowLeft className="size-3" /> Back to payouts</Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold tracking-tight">Payout · {p.id.slice(0,8)}</h2>
          <p className="text-sm text-muted-foreground mt-1">Partner: {data.partner?.full_name} · {data.partner?.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setAction("start_review")}>Start Review</Button>
          <Button size="sm" onClick={() => { setAction("approve"); setApprovedAmount(String(p.approved_amount ?? p.amount)); }}>Approve</Button>
          <Button size="sm" variant="outline" onClick={() => setAction("hold")}>Hold</Button>
          <Button size="sm" variant="outline" onClick={() => setAction("processing")}>Processing</Button>
          <Button size="sm" variant="primary" onClick={() => setAction("paid")}>Mark Paid</Button>
          <Button size="sm" variant="outline" onClick={() => setAction("failed")}>Failed</Button>
          <Button size="sm" variant="outline" onClick={() => setAction("reject")}>Reject</Button>
          <Button size="sm" variant="ghost" onClick={() => setAction("reverse")}>Reverse</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white p-5 space-y-2">
          <div className="text-[11px] font-mono uppercase text-muted-foreground">Amounts</div>
          <div className="flex justify-between text-sm"><span>Requested</span><span className="font-mono">{inr(p.requested_amount ?? p.amount)}</span></div>
          <div className="flex justify-between text-sm"><span>Approved</span><span className="font-mono">{inr(p.approved_amount)}</span></div>
          <div className="flex justify-between text-sm"><span>Status</span><Badge variant="outline">{p.status}</Badge></div>
          <div className="flex justify-between text-sm"><span>Method</span><span>{p.payout_method ?? "—"}</span></div>
          <div className="flex justify-between text-sm"><span>Reference</span><span className="font-mono text-xs">{p.payment_reference ?? p.reference ?? "—"}</span></div>
        </div>
        <div className="rounded-xl border bg-white p-5 space-y-2">
          <div className="text-[11px] font-mono uppercase text-muted-foreground">Partner Verification</div>
          <div className="flex justify-between text-sm"><span>Status</span><Badge variant="muted">{data.partner?.status}</Badge></div>
          <div className="flex justify-between text-sm"><span>KYC</span><Badge variant="muted">{data.partner?.kyc_status ?? "—"}</Badge></div>
          <div className="flex justify-between text-sm"><span>Model Approval</span><Badge variant="muted">{data.partner?.sales_model_approval_status ?? "—"}</Badge></div>
        </div>
        <div className="rounded-xl border bg-white p-5 space-y-2">
          <div className="text-[11px] font-mono uppercase text-muted-foreground">Bank (masked)</div>
          {data.bank ? (
            <>
              <div className="flex justify-between text-sm"><span>Holder</span><span>{data.bank.account_holder_name ?? "—"}</span></div>
              <div className="flex justify-between text-sm"><span>Bank</span><span>{data.bank.bank_name ?? "—"}</span></div>
              <div className="flex justify-between text-sm"><span>A/c</span><span className="font-mono text-xs">{data.bank.bank_account_number_masked ?? "—"}</span></div>
              <div className="flex justify-between text-sm"><span>IFSC</span><span className="font-mono text-xs">{data.bank.ifsc_code ?? "—"}</span></div>
              <div className="flex justify-between text-sm"><span>UPI</span><span className="font-mono text-xs">{data.bank.upi_id ?? "—"}</span></div>
              <div className="flex justify-between text-sm"><span>PAN</span><span className="font-mono text-xs">{data.bank.pan_masked ?? "—"}</span></div>
            </>
          ) : <div className="text-sm text-muted-foreground">No payout details on file.</div>}
        </div>
      </div>

      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-5 py-3 border-b text-sm font-medium">Included Revenue Records</div>
        <Table>
          <TableHeader><TableRow>
            <TableHead>Commission</TableHead><TableHead>Program</TableHead>
            <TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {data.items.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No items linked.</TableCell></TableRow>}
            {data.items.map((i: any) => (
              <TableRow key={i.id}>
                <TableCell className="font-mono text-[11px]">{i.commission_id.slice(0,8)}</TableCell>
                <TableCell className="text-sm">{i.commission?.program_id ?? "—"}</TableCell>
                <TableCell className="text-right font-mono">{inr(i.amount)}</TableCell>
                <TableCell><Badge variant="outline">{i.commission?.status ?? "—"}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-5 py-3 border-b text-sm font-medium">Timeline</div>
        <div className="divide-y divide-border/50">
          {data.history.length === 0 && <div className="p-6 text-sm text-muted-foreground text-center">No admin actions yet.</div>}
          {data.history.map((h: any) => (
            <div key={h.id} className="px-5 py-3 text-sm flex items-center justify-between">
              <div><Badge variant="outline">{h.action}</Badge> {h.reason && <span className="text-muted-foreground ml-2 text-xs">{h.reason}</span>}</div>
              <div className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!action} onOpenChange={(o) => !o && setAction(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{String(action).replaceAll("_"," ").toUpperCase()} Payout</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {action === "approve" && <Input type="number" placeholder="Approved amount" value={approvedAmount} onChange={(e) => setApprovedAmount(e.target.value)} />}
            {action === "paid" && (
              <>
                <Input placeholder="Payment reference (required)" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} />
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="neft">NEFT</SelectItem>
                    <SelectItem value="rtgs">RTGS</SelectItem>
                    <SelectItem value="imps">IMPS</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="date" value={processedAt} onChange={(e) => setProcessedAt(e.target.value)} />
              </>
            )}
            <Textarea placeholder={action === "reject" || action === "hold" ? "Reason (required)" : "Notes"} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAction(null)}>Cancel</Button>
            <Button onClick={submit}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
