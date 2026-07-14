import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPartnerEarnings } from "@/lib/partner/earnings.functions";
import { PartnerShell } from "@/components/partner/partner-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Clock,
  CheckCircle2,
  Loader2,
  BadgeIndianRupee,
  Gift,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/partner/earnings")({
  component: EarningsPage,
});

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n || 0);
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function EarningsPage() {
  const fetchData = useServerFn(getPartnerEarnings);
  const { data, isLoading } = useQuery({
    queryKey: ["partner-earnings"],
    queryFn: () => fetchData(),
  });

  return (
    <PartnerShell>
      <div className="px-4 lg:px-8 py-6 lg:py-8 space-y-6">
        <header>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Earnings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Revenue share is calculated only after Admin verifies a payment. 70% on
            your own leads · 50% on Glintr-provided leads.
          </p>
        </header>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <SummaryCard
            label="Total Earnings"
            value={formatINR(data?.summary.totalEarnings ?? 0)}
            icon={<BadgeIndianRupee className="size-4" />}
            highlight
          />
          <SummaryCard
            label="Pending Verification"
            value={formatINR(data?.summary.pendingVerification ?? 0)}
            icon={<Clock className="size-4" />}
            hint="Estimate — not counted as approved"
          />
          <SummaryCard
            label="Approved Earnings"
            value={formatINR(data?.summary.approvedEarnings ?? 0)}
            icon={<CheckCircle2 className="size-4" />}
          />
          <SummaryCard
            label="Payout Processing"
            value={formatINR(data?.summary.payoutProcessing ?? 0)}
            icon={<Loader2 className="size-4" />}
          />
          <SummaryCard
            label="Paid Earnings"
            value={formatINR(data?.summary.paidEarnings ?? 0)}
            icon={<Wallet className="size-4" />}
          />
          <SummaryCard
            label="Referral Bonus"
            value={formatINR(data?.summary.referralBonus ?? 0)}
            icon={<Gift className="size-4" />}
            hint="Coming soon"
          />
        </div>

        {/* Earnings history */}
        <Card className="p-0 overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div>
              <h2 className="font-medium">Earnings History</h2>
              <p className="text-xs text-muted-foreground">
                Verified sales only. Payout target = 2 days after payment
                verification.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <Th>Lead / Program</Th>
                  <Th>Plan</Th>
                  <Th>Sale</Th>
                  <Th>Lead Type</Th>
                  <Th>Share %</Th>
                  <Th>You Earn</Th>
                  <Th>Verified</Th>
                  <Th>Payout Target</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center text-muted-foreground">
                      Loading…
                    </td>
                  </tr>
                ) : (data?.earnings ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-14 text-center text-muted-foreground">
                      No earnings yet. Earnings appear here after Admin verifies a payment.
                    </td>
                  </tr>
                ) : (
                  data!.earnings.map((r) => (
                    <tr key={r.id} className="border-t align-top">
                      <Td>
                        <div className="font-medium">{r.lead_name}</div>
                        <div className="text-xs text-muted-foreground">{r.program_name}</div>
                      </Td>
                      <Td>{r.plan_label}</Td>
                      <Td>{formatINR(r.sale_amount)}</Td>
                      <Td>
                        {r.lead_type === "own" ? (
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                            Own Lead
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-sky-100 text-sky-800 hover:bg-sky-100">
                            Glintr Provided
                          </Badge>
                        )}
                      </Td>
                      <Td>{r.revenue_share_pct}%</Td>
                      <Td className="font-semibold">{formatINR(r.commission_amount)}</Td>
                      <Td>{formatDate(r.verified_at)}</Td>
                      <Td>
                        {r.status === "paid" ? (
                          <span className="text-xs text-muted-foreground">
                            Paid {formatDate(r.paid_at)}
                          </span>
                        ) : r.status === "approved" && r.payout_target_at ? (
                          <div>
                            <div>{formatDate(r.payout_target_at)}</div>
                            <div className="text-xs text-muted-foreground">
                              Expected within 2 days
                            </div>
                          </div>
                        ) : (
                          "—"
                        )}
                      </Td>
                      <Td>
                        <StatusPill status={r.status} />
                        {r.hold_reason ? (
                          <div className="mt-1 text-xs text-amber-700">
                            Hold: {r.hold_reason}
                          </div>
                        ) : null}
                        {r.payout_reference ? (
                          <div className="mt-1 text-xs text-muted-foreground font-mono">
                            {r.payout_reference}
                          </div>
                        ) : null}
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Pending verification (informational) */}
        {(data?.pending ?? []).length > 0 ? (
          <Card className="p-0 overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h2 className="font-medium">Awaiting Admin Verification</h2>
              <p className="text-xs text-muted-foreground">
                These payments are not yet approved. Earnings will be created once
                admin verifies each payment.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <Th>Lead / Program</Th>
                    <Th>Plan</Th>
                    <Th>Sale</Th>
                    <Th>Submitted</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {data!.pending.map((r) => (
                    <tr key={r.id} className="border-t">
                      <Td>
                        <div className="font-medium">{r.lead_name}</div>
                        <div className="text-xs text-muted-foreground">{r.program_name}</div>
                      </Td>
                      <Td>{r.plan_label}</Td>
                      <Td>{formatINR(r.sale_amount)}</Td>
                      <Td>{formatDate(r.submitted_at)}</Td>
                      <Td>
                        <Badge variant="outline">
                          {r.status.replace(/_/g, " ")}
                        </Badge>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : null}
      </div>
    </PartnerShell>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  highlight,
  hint,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
  hint?: string;
}) {
  return (
    <Card
      className={
        "p-4 " +
        (highlight ? "bg-primary text-primary-foreground border-primary" : "")
      }
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-80">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold tabular-nums">{value}</div>
      {hint ? (
        <div className={"mt-1 text-[11px] " + (highlight ? "opacity-80" : "text-muted-foreground")}>
          {hint}
        </div>
      ) : null}
    </Card>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-5 py-3 font-medium">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={"px-5 py-3 " + className}>{children}</td>;
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: "bg-emerald-100 text-emerald-800",
    payout_processing: "bg-sky-100 text-sky-800",
    paid: "bg-primary/10 text-primary",
    on_hold: "bg-amber-100 text-amber-800",
    cancelled: "bg-rose-100 text-rose-800",
    pending_verification: "bg-muted text-muted-foreground",
  };
  const label: Record<string, string> = {
    approved: "Approved",
    payout_processing: "Payout Processing",
    paid: "Paid",
    on_hold: "On Hold",
    cancelled: "Cancelled",
    pending_verification: "Pending Verification",
  };
  return (
    <span
      className={
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium " +
        (map[status] ?? "bg-muted text-muted-foreground")
      }
    >
      {label[status] ?? status}
    </span>
  );
}
