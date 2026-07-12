import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listPayouts } from "@/lib/admin/finance.functions";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/payouts/")({ component: Page });

const STATUSES = ["requested","under_review","approved","processing","paid","failed","on_hold","rejected","reversed","queued","cancelled"];

function inr(n?: number | string | null) {
  return n == null ? "—" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n));
}

function Page() {
  const fn = useServerFn(listPayouts);
  const [f, setF] = useState<any>({});
  const { data: rows = [] } = useQuery({ queryKey: ["admin-payouts", f], queryFn: () => fn({ data: f }) });

  return (
    <div className="space-y-6 max-w-[1500px]">
      <div>
        <h2 className="text-2xl font-display font-semibold tracking-tight">Payouts</h2>
        <p className="text-sm text-muted-foreground mt-1">Review, approve, and mark partner payouts as paid.</p>
      </div>

      <div className="rounded-xl border border-border/70 bg-white p-4 grid gap-3 md:grid-cols-5">
        <Select onValueChange={(v) => setF({ ...f, status: v === "all" ? undefined : v })}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replaceAll("_"," ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="date" onChange={(e) => setF({ ...f, from: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
        <Input type="date" onChange={(e) => setF({ ...f, to: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
        <Input type="number" placeholder="Min amount" onChange={(e) => setF({ ...f, minAmount: e.target.value ? Number(e.target.value) : undefined })} />
        <Input type="number" placeholder="Max amount" onChange={(e) => setF({ ...f, maxAmount: e.target.value ? Number(e.target.value) : undefined })} />
      </div>

      <div className="rounded-xl border border-border/70 bg-white overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>ID</TableHead><TableHead>Partner</TableHead>
            <TableHead className="text-right">Requested</TableHead><TableHead className="text-right">Approved</TableHead>
            <TableHead>Method</TableHead><TableHead>Requested</TableHead>
            <TableHead>Status</TableHead><TableHead>Processed</TableHead><TableHead>Reference</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No payouts.</TableCell></TableRow>}
            {rows.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-[11px]">{r.id.slice(0,8)}</TableCell>
                <TableCell className="text-sm">{r.partner?.full_name ?? "—"}</TableCell>
                <TableCell className="text-right font-mono text-sm">{inr(r.requested_amount ?? r.amount)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{inr(r.approved_amount)}</TableCell>
                <TableCell className="text-xs">{r.payout_method ?? "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.requested_at ? new Date(r.requested_at).toLocaleDateString() : new Date(r.created_at).toLocaleDateString()}</TableCell>
                <TableCell><Badge variant={r.status === "paid" ? "success" : r.status === "rejected" || r.status === "failed" ? "danger" : "outline"}>{r.status}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.processed_at ? new Date(r.processed_at).toLocaleDateString() : "—"}</TableCell>
                <TableCell className="font-mono text-[11px]">{r.payment_reference ?? r.reference ?? "—"}</TableCell>
                <TableCell>
                  <Link to="/admin/payouts/$id" params={{ id: r.id }}>
                    <Button size="sm" variant="outline">Open</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
