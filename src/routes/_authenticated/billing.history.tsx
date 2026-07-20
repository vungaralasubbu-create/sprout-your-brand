import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, XCircle, RotateCcw, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listPaymentHistory } from "@/lib/billing/billing.functions";
import { formatInr } from "@/components/billing/billing-shell";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/billing/history")({
  component: HistoryPage,
});

const FILTERS = ["all", "succeeded", "pending", "failed", "refunded"] as const;

function HistoryPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const get = useServerFn(listPaymentHistory);
  const q = useQuery({ queryKey: ["billing-history"], queryFn: () => get({}) });
  const all = q.data?.payments ?? [];
  const payments = filter === "all" ? all : all.filter((p: any) => p.status === filter || (filter === "refunded" && p.status.includes("refunded")));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium capitalize transition",
              filter === f ? "bg-primary text-primary-foreground" : "border text-muted-foreground hover:bg-muted",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        {q.isLoading ? (
          <div className="h-40 animate-pulse bg-muted/40" />
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Clock className="h-10 w-10 text-muted-foreground/40" />
            <div className="mt-3 font-medium">No payments yet</div>
            <p className="mt-1 text-sm text-muted-foreground">Your payment history will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Provider</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-muted/20">
                    <td className="p-4 text-muted-foreground">{new Date(p.created_at).toLocaleString()}</td>
                    <td className="p-4 font-medium">{formatInr(p.amount_inr)}</td>
                    <td className="p-4 capitalize text-muted-foreground">{p.method_type ?? "—"}</td>
                    <td className="p-4 capitalize text-muted-foreground">{p.provider}</td>
                    <td className="p-4"><StatusChip status={p.status} /></td>
                    <td className="p-4 text-right">
                      {p.status === "failed" ? (
                        <Button size="sm" variant="outline" onClick={() => toast.info("Retry starts a fresh checkout — head to Plans to try again.")}>
                          <RotateCcw className="mr-1 h-3 w-3" /> Retry
                        </Button>
                      ) : p.failure_reason ? (
                        <span className="text-xs text-muted-foreground" title={p.failure_reason}>{p.failure_reason.slice(0, 30)}…</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: any; label: string }> = {
    succeeded: { cls: "bg-emerald-500/10 text-emerald-600", icon: CheckCircle2, label: "Succeeded" },
    pending: { cls: "bg-amber-500/10 text-amber-600", icon: Clock, label: "Pending" },
    processing: { cls: "bg-blue-500/10 text-blue-600", icon: RefreshCw, label: "Processing" },
    failed: { cls: "bg-red-500/10 text-red-600", icon: XCircle, label: "Failed" },
    refunded: { cls: "bg-purple-500/10 text-purple-600", icon: RotateCcw, label: "Refunded" },
    partially_refunded: { cls: "bg-purple-500/10 text-purple-600", icon: RotateCcw, label: "Partial refund" },
    canceled: { cls: "bg-muted text-muted-foreground", icon: XCircle, label: "Canceled" },
  };
  const s = map[status] ?? map.pending;
  const Icon = s.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase", s.cls)}>
      <Icon className="h-3 w-3" /> {s.label}
    </span>
  );
}
