import { ArrowDown } from "lucide-react";

/**
 * Editorial revenue example. Non-guaranteed. Uses INR formatting.
 * Shows: eligible sales -> share percentage -> illustrative payout.
 */
export function RevenueExample({
  eligibleSales = 100000,
  share = 70,
}: {
  eligibleSales?: number;
  share?: 70 | 50;
}) {
  const payout = Math.round((eligibleSales * share) / 100);
  const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");

  return (
    <div className="rounded-3xl border border-border bg-card/60 p-6">
      <p className="text-label">Illustrative example</p>
      <div className="mt-4 grid gap-3">
        <Row label="Eligible successful sales" value={fmt(eligibleSales)} />
        <div className="flex justify-center text-muted-foreground">
          <ArrowDown className="size-4" aria-hidden />
        </div>
        <Row label={`${share}% revenue share`} value={`${share}%`} muted />
        <div className="flex justify-center text-muted-foreground">
          <ArrowDown className="size-4" aria-hidden />
        </div>
        <Row label="Example payout" value={fmt(payout)} highlight />
      </div>
      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
        Example only. Actual payouts depend on verified enrollments, program eligibility, refund
        rules, TDS, and applicable revenue-share terms. No earnings are guaranteed.
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  highlight,
}: {
  label: string;
  value: string;
  muted?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        "flex items-center justify-between rounded-xl border px-4 py-3 " +
        (highlight
          ? "border-primary/30 bg-primary/5"
          : muted
            ? "border-dashed border-border bg-background"
            : "border-border bg-background")
      }
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={
          "text-base font-black " + (highlight ? "text-primary" : "text-foreground")
        }
      >
        {value}
      </p>
    </div>
  );
}
