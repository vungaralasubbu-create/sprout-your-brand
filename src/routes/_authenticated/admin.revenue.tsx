import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listRevenueRecords } from "@/lib/admin/finance.functions";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/admin/revenue")({ component: Page });

const STATUSES = ["tracking","pending_verification","under_verification","calculated","eligible","approved","available_for_payout","on_hold","payout_processing","paid","reversed","rejected","refund_adjusted","cancelled"];

function inr(n: number | string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n));
}

function Page() {
  const fn = useServerFn(listRevenueRecords);
  const [f, setF] = useState<any>({});
  const { data: rows = [] } = useQuery({ queryKey: ["admin-revenue", f], queryFn: () => fn({ data: f }) });

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div>
        <h2 className="text-2xl font-display font-semibold tracking-tight">Revenue</h2>
        <p className="text-sm text-muted-foreground mt-1">All revenue records with the exact revenue-share rule applied.</p>
      </div>

      <div className="rounded-xl border border-border/70 bg-white p-4 grid gap-3 md:grid-cols-4">
        <Input placeholder="Search partner, program, ID" className="md:col-span-2" onChange={(e) => setF({ ...f, search: e.target.value })} />
        <Select onValueChange={(v) => setF({ ...f, status: v === "all" ? undefined : v })}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replaceAll("_"," ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border/70 bg-white overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Record</TableHead><TableHead>Partner</TableHead><TableHead>Program</TableHead>
            <TableHead>Model</TableHead><TableHead className="text-right">Gross</TableHead>
            <TableHead className="text-right">Eligible</TableHead><TableHead>Rate</TableHead>
            <TableHead className="text-right">Share</TableHead><TableHead>Rule Used</TableHead>
            <TableHead>Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No revenue records.</TableCell></TableRow>}
            {rows.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell><div className="font-mono text-[11px]">{r.id.slice(0,8)}</div>
                  <div className="text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</div></TableCell>
                <TableCell className="text-sm">{r.partner?.full_name ?? "—"}</TableCell>
                <TableCell className="text-sm">{r.enrollment?.program_title ?? r.program_id}</TableCell>
                <TableCell><Badge variant="muted">{r.rule?.partner_type ?? "—"}</Badge></TableCell>
                <TableCell className="text-right font-mono text-sm">{inr(r.gross_revenue)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{inr(r.eligible_revenue)}</TableCell>
                <TableCell className="font-mono text-sm">{Number(r.revenue_share_pct).toFixed(1)}%</TableCell>
                <TableCell className="text-right font-mono text-sm font-semibold">{inr(r.commission_amount)}</TableCell>
                <TableCell className="text-xs">
                  {r.rule ? (
                    <div>
                      <div className="font-medium">{r.rule.name}</div>
                      <div className="text-[10px] text-muted-foreground">{r.rule.partner_id ? "Partner rule" : r.rule.program_id ? "Program rule" : r.rule.campaign ? "Campaign rule" : "Default model rule"}</div>
                    </div>
                  ) : <span className="text-muted-foreground">Ad-hoc %</span>}
                </TableCell>
                <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
