import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { FileText, Printer, Loader2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getMyMonthlyEarningsStatement } from "@/lib/partner/employment.functions";

export const Route = createFileRoute("/_authenticated/partner/earnings-statement")({
  component: EarningsStatementPage,
});

function EarningsStatementPage() {
  const now = new Date();
  const [ym, setYm] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const fetch = useServerFn(getMyMonthlyEarningsStatement);
  const { data, isLoading } = useQuery({
    queryKey: ["monthly-statement", ym.year, ym.month],
    queryFn: () => fetch({ data: ym }),
  });

  const monthLabel = new Date(2000, ym.month - 1, 1).toLocaleString("en-IN", { month: "long" });

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 space-y-6 max-w-4xl print:p-0">
      <header className="flex items-start justify-between gap-4 flex-wrap print:hidden">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Monthly Earnings Statement
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            For Flexible Sales Partners. This is a professional documentation of your monthly
            earnings — not a salary slip.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MonthYearPicker value={ym} onChange={setYm} />
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="size-4" /> Print / Save PDF
          </Button>
        </div>
      </header>

      <Card className="p-6 lg:p-10 space-y-6 print:shadow-none print:border-0">
        <header className="flex items-start justify-between gap-6 border-b pb-4">
          <div className="flex items-center gap-3">
            <FileText className="size-6 text-cyan-600" />
            <div>
              <div className="font-display text-lg font-semibold">Glintr</div>
              <div className="text-xs text-muted-foreground">
                Sales Partner · Monthly Earnings Statement
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Period</div>
            <div className="font-semibold">
              {monthLabel} {ym.year}
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Preparing statement…
          </div>
        ) : !data ? (
          <div className="text-sm text-muted-foreground">No earnings data available.</div>
        ) : (
          <>
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <Line label="Partner Name" value={data.partner.display_name ?? "—"} />
              <Line label="Partner Code" value={data.partner.partner_code ?? "—"} mono />
              <Line label="Work Model" value="Flexible Sales Partner" />
              <Line
                label="Period"
                value={`${monthLabel} ${ym.year}`}
              />
            </section>

            <section>
              <SectionTitle>Earnings Summary</SectionTitle>
              <table className="w-full text-sm mt-2">
                <tbody>
                  <Row label="Verified Sales (count)" value={data.verifiedSales.toString()} />
                  <Row label="Revenue Share Earned" value={data.revenueShare} money />
                  <Row label="Referral Bonus Earned" value={data.referralBonus} money />
                  <Row label="Payouts Paid" value={data.payoutsPaid} money />
                  <Row label="Payouts Pending" value={data.payoutsPending} money />
                </tbody>
              </table>
            </section>

            <section className="rounded-lg border-2 border-cyan-500 bg-cyan-50 p-4 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-cyan-800">
                  Total Earnings ({monthLabel} {ym.year})
                </div>
                <div className="text-2xl font-semibold tabular-nums">
                  ₹{Number(data.totalEarnings).toLocaleString("en-IN")}
                </div>
              </div>
              <div className="text-right text-xs text-slate-700 max-w-[220px]">
                Revenue share + referral bonus qualified in this month. Payout timing depends on
                admin-approved payout cycles.
              </div>
            </section>

            <p className="text-[11px] text-muted-foreground border-t pt-3">
              This statement is generated from verified sales and referrals in your account. It
              is intended as documentation for Flexible Sales Partners and does not constitute a
              salary slip. Values are read-only.
            </p>
          </>
        )}
      </Card>
    </div>
  );
}

function MonthYearPicker({
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
    <div className="flex items-center gap-2 print:hidden">
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
    <div className="text-[11px] font-mono uppercase tracking-widest text-cyan-700">
      {children}
    </div>
  );
}
function Row({ label, value, money }: { label: string; value: number | string; money?: boolean }) {
  return (
    <tr className="border-t">
      <td className="py-1.5 text-slate-700">{label}</td>
      <td className="py-1.5 text-right tabular-nums">
        {money ? `₹${Number(value).toLocaleString("en-IN")}` : value}
      </td>
    </tr>
  );
}
