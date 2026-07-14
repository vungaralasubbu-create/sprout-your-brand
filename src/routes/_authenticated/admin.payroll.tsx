import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, PlayCircle, CheckCircle2, FileText, IndianRupee, XCircle } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  listPayrollRuns,
  preparePayrollRun,
  transitionPayroll,
} from "@/lib/admin/employment.functions";

export const Route = createFileRoute("/_authenticated/admin/payroll")({
  component: PayrollPage,
});

function PayrollPage() {
  const now = new Date();
  const [ym, setYm] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const qc = useQueryClient();
  const fetch = useServerFn(listPayrollRuns);
  const prepare = useServerFn(preparePayrollRun);
  const transition = useServerFn(transitionPayroll);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payroll", ym.year, ym.month],
    queryFn: () => fetch({ data: ym }),
  });

  const [payDialog, setPayDialog] = useState<{ id: string; net: number } | null>(null);
  const [payRef, setPayRef] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));

  async function onPrepare(employeeId: string) {
    try {
      await prepare({ data: { employee_id: employeeId, ...ym } });
      toast.success("Payroll prepared");
      qc.invalidateQueries({ queryKey: ["admin-payroll", ym.year, ym.month] });
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  }
  async function onAct(id: string, action: "approve" | "generate_slip" | "cancel") {
    try {
      await transition({ data: { id, action } });
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin-payroll", ym.year, ym.month] });
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  }
  async function markPaid() {
    if (!payDialog) return;
    try {
      await transition({
        data: {
          id: payDialog.id,
          action: "mark_paid",
          payment_reference: payRef,
          payment_date: payDate,
        },
      });
      toast.success("Marked paid");
      setPayDialog(null);
      setPayRef("");
      qc.invalidateQueries({ queryKey: ["admin-payroll", ym.year, ym.month] });
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Payroll</h1>
          <p className="text-sm text-muted-foreground">
            Prepare, approve and pay monthly salaries for Full-Time employees.
          </p>
        </div>
        <MonthYear value={ym} onChange={setYm} />
      </header>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </div>
        ) : (data ?? []).length === 0 ? (
          <div className="p-8 text-sm text-muted-foreground text-center">No active employees.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3">Employee</th>
                  <th>Payable Days</th>
                  <th>Gross</th>
                  <th>Deductions</th>
                  <th>Net Pay</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map((row: any) => {
                  const r = row.run;
                  const status = r?.status ?? "pending";
                  return (
                    <tr key={row.employee.id} className="border-t">
                      <td className="p-3">
                        <div className="font-medium">{row.partner?.display_name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {row.employee.employee_code}
                        </div>
                      </td>
                      <td>{r ? r.payable_days : "—"}</td>
                      <td>{r ? money(r.gross_earnings) : "—"}</td>
                      <td>{r ? money(r.total_deductions) : "—"}</td>
                      <td className="font-semibold">{r ? money(r.net_pay) : "—"}</td>
                      <td>
                        <Badge
                          variant={
                            status === "paid"
                              ? "success"
                              : status === "approved" || status === "slip_generated"
                                ? "info"
                                : status === "cancelled"
                                  ? "danger"
                                  : "warning"
                          }
                        >
                          {status}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1.5 justify-end p-2">
                          {!r || status === "pending" ? (
                            <Button size="sm" onClick={() => onPrepare(row.employee.id)}>
                              <PlayCircle className="size-4" /> Prepare
                            </Button>
                          ) : null}
                          {r && status === "prepared" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onPrepare(row.employee.id)}
                              >
                                Recompute
                              </Button>
                              <Button size="sm" onClick={() => onAct(r.id, "approve")}>
                                <CheckCircle2 className="size-4" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onAct(r.id, "cancel")}
                              >
                                <XCircle className="size-4" /> Cancel
                              </Button>
                            </>
                          )}
                          {r && status === "approved" && (
                            <>
                              <Button size="sm" onClick={() => onAct(r.id, "generate_slip")}>
                                <FileText className="size-4" /> Generate Slip
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setPayDialog({ id: r.id, net: Number(r.net_pay) })
                                }
                              >
                                <IndianRupee className="size-4" /> Mark Paid
                              </Button>
                            </>
                          )}
                          {r && status === "slip_generated" && (
                            <Button
                              size="sm"
                              onClick={() => setPayDialog({ id: r.id, net: Number(r.net_pay) })}
                            >
                              <IndianRupee className="size-4" /> Mark Paid
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog open={!!payDialog} onOpenChange={(v) => !v && setPayDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark payroll as paid</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md bg-slate-50 p-3 text-sm">
              Net Pay: <span className="font-semibold">{money(payDialog?.net ?? 0)}</span>
            </div>
            <div>
              <Label>Payment Reference (UTR / txn ID)</Label>
              <Input value={payRef} onChange={(e) => setPayRef(e.target.value)} />
            </div>
            <div>
              <Label>Payment Date</Label>
              <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPayDialog(null)}>Cancel</Button>
            <Button onClick={markPaid} disabled={!payRef}>Confirm Paid</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function money(v: number | string) {
  return `₹${Number(v).toLocaleString("en-IN")}`;
}
function MonthYear({
  value,
  onChange,
}: {
  value: { year: number; month: number };
  onChange: (v: { year: number; month: number }) => void;
}) {
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
  return (
    <div className="flex items-center gap-2">
      <Select
        value={String(value.month)}
        onValueChange={(v) => onChange({ ...value, month: Number(v) })}
      >
        <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          {months.map((m) => (
            <SelectItem key={m} value={String(m)}>
              {new Date(2000, m - 1, 1).toLocaleString("en-IN", { month: "long" })}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={String(value.year)}
        onValueChange={(v) => onChange({ ...value, year: Number(v) })}
      >
        <SelectTrigger className="h-9 w-[110px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
