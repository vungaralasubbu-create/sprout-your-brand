import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2, Printer } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlintrLogo } from "@/components/shared/logo";
import { getMySalarySlip } from "@/lib/partner/employment.functions";

export const Route = createFileRoute("/_authenticated/partner/employment/salary-slips/$id")({
  component: SalarySlipPage,
});

function SalarySlipPage() {
  const { id } = Route.useParams();
  const fetch = useServerFn(getMySalarySlip);
  const { data, isLoading, error } = useQuery({
    queryKey: ["my-salary-slip", id],
    queryFn: () => fetch({ data: { id } }),
  });

  if (isLoading) {
    return (
      <div className="p-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading salary slip…
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="p-8 space-y-3 max-w-xl">
        <p className="text-sm text-red-600">
          {(error as any)?.message ?? "Salary slip is not available."}
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to="/partner/employment">Back</Link>
        </Button>
      </div>
    );
  }
  const { slip, employee, partner, payout } = data;
  const monthLabel = new Date(2000, slip.payroll_month - 1, 1).toLocaleString("en-IN", {
    month: "long",
  });

  return (
    <div className="px-4 lg:px-8 py-6 max-w-4xl print:p-0">
      <div className="flex items-center justify-between mb-4 print:hidden">
        <Button asChild variant="ghost" size="sm">
          <Link to="/partner/employment">
            <ArrowLeft className="size-4" /> Back to Employment
          </Link>
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="size-4" /> Print / Save PDF
        </Button>
      </div>

      <Card className="p-6 lg:p-10 space-y-6 print:shadow-none print:border-0">
        <header className="flex items-start justify-between gap-6 border-b pb-4">
          <div className="flex items-center gap-3">
            <GlintrLogo className="h-9 w-auto" />
            <div>
              <div className="font-display text-lg font-semibold">Glintr</div>
              <div className="text-xs text-muted-foreground">Payroll · Salary Slip</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Salary Slip
            </div>
            <div className="font-semibold">
              {monthLabel} {slip.payroll_year}
            </div>
            <div className="mt-1">
              <Badge variant={slip.status === "paid" ? "success" : "info"}>
                {slip.status === "paid" ? "Paid" : "Generated"}
              </Badge>
            </div>
          </div>
        </header>

        {/* Employee */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Line label="Employee Name" value={partner?.display_name ?? "—"} />
          <Line label="Employee ID" value={employee.employee_code} mono />
          <Line label="Partner Code" value={partner?.partner_code ?? "—"} mono />
          <Line label="Work Model" value="Full-Time Sales Professional" />
          <Line label="Joining Date" value={fmt(employee.joining_date)} />
          <Line
            label="Pay Period"
            value={`${monthLabel} ${slip.payroll_year} (${slip.payable_days} payable days)`}
          />
          <Line label="Bank" value={payout?.bank_name ?? "—"} />
          <Line
            label="Account"
            value={payout?.account_last4 ? `••••${payout.account_last4}` : "—"}
            mono
          />
        </section>

        {/* Attendance summary */}
        <section>
          <SectionTitle>Attendance</SectionTitle>
          <div className="grid grid-cols-3 md:grid-cols-7 gap-2 mt-2 text-sm">
            <Att l="Present" v={slip.present_days} />
            <Att l="Late" v={slip.late_days} />
            <Att l="Half Day" v={slip.half_days} />
            <Att l="Absent" v={slip.absent_days} />
            <Att l="Leave" v={slip.leave_days} />
            <Att l="Weekly Off" v={slip.weekly_off_days} />
            <Att l="Holiday" v={slip.holiday_days} />
          </div>
        </section>

        {/* Earnings & Deductions */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <SectionTitle>Earnings</SectionTitle>
            <Table
              rows={[
                ["Basic", slip.basic],
                ["HRA", slip.hra],
                ["Special Allowance", slip.special_allowance],
                ["Performance Incentive", slip.performance_incentive],
                ["Other Earnings", slip.other_earnings],
              ]}
              total={["Gross Earnings", slip.gross_earnings]}
            />
          </div>
          <div>
            <SectionTitle>Deductions</SectionTitle>
            <Table
              rows={[
                ["Employee PF", slip.employee_pf],
                ["Professional Tax", slip.professional_tax],
                ["TDS", slip.tds],
                ["Other Deductions", slip.other_deductions],
              ]}
              total={["Total Deductions", slip.total_deductions]}
            />
          </div>
        </section>

        <section className="rounded-lg border-2 border-cyan-500 bg-cyan-50 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-cyan-800">Net Pay</div>
            <div className="text-2xl font-semibold tabular-nums">
              ₹{Number(slip.net_pay).toLocaleString("en-IN")}
            </div>
          </div>
          {slip.status === "paid" && (
            <div className="text-right text-xs text-slate-700">
              <div>Paid on {fmt(slip.payment_date)}</div>
              <div className="font-mono">Ref: {slip.payment_reference ?? "—"}</div>
            </div>
          )}
        </section>

        {slip.admin_notes && (
          <p className="text-xs text-muted-foreground">Note: {slip.admin_notes}</p>
        )}
        <p className="text-[11px] text-muted-foreground border-t pt-3">
          This is a computer-generated salary slip and does not require a signature. Values shown
          are read-only and derived from admin-approved payroll data.
        </p>
      </Card>
    </div>
  );
}

function Line({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={mono ? "font-mono font-medium" : "font-medium"}>{value}</div>
    </div>
  );
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-mono uppercase tracking-widest text-cyan-700">{children}</div>
  );
}
function Att({ l, v }: { l: string; v: number }) {
  return (
    <div className="rounded-md border p-2 text-center">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</div>
      <div className="font-semibold tabular-nums">{v ?? 0}</div>
    </div>
  );
}
function Table({
  rows,
  total,
}: {
  rows: Array<[string, number | string]>;
  total: [string, number | string];
}) {
  return (
    <table className="w-full text-sm mt-2">
      <tbody>
        {rows.map(([l, v]) => (
          <tr key={l} className="border-t">
            <td className="py-1.5 text-slate-700">{l}</td>
            <td className="py-1.5 text-right tabular-nums">
              ₹{Number(v).toLocaleString("en-IN")}
            </td>
          </tr>
        ))}
        <tr className="border-t border-slate-800">
          <td className="py-2 font-semibold">{total[0]}</td>
          <td className="py-2 text-right font-semibold tabular-nums">
            ₹{Number(total[1]).toLocaleString("en-IN")}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
function fmt(v: string | null | undefined) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
