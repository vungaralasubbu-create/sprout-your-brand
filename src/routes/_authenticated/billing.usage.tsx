import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getUsageDetail } from "@/lib/billing/billing.functions";
import { CREDIT_COSTS } from "@/lib/billing/credit-costs";

export const Route = createFileRoute("/_authenticated/billing/usage")({
  component: UsagePage,
});

function UsagePage() {
  const get = useServerFn(getUsageDetail);
  const q = useQuery({ queryKey: ["billing-usage"], queryFn: () => get({}) });
  const tx = q.data?.transactions ?? [];
  const usage = q.data?.usage as any;

  // Aggregate daily spend for the past 14 days
  const daily = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      days[d.toISOString().slice(0, 10)] = 0;
    }
    tx.forEach((t: any) => {
      if (t.delta >= 0) return;
      const k = new Date(t.created_at).toISOString().slice(0, 10);
      if (k in days) days[k] += Math.abs(t.delta);
    });
    return Object.entries(days).map(([date, value]) => ({ date, value }));
  }, [tx]);

  const max = Math.max(1, ...daily.map((d) => d.value));

  return (
    <div className="space-y-6">
      {/* Summary tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Credits balance" value={(usage?.credits_balance ?? 0).toLocaleString()} />
        <Tile label="Consumed this period" value={(usage?.credits_consumed_period ?? 0).toLocaleString()} />
        <Tile label="Images generated" value={String(usage?.images_generated ?? 0)} />
        <Tile label="Videos generated" value={String(usage?.videos_generated ?? 0)} />
      </div>

      {/* Bar chart */}
      <div className="rounded-2xl border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-semibold">Daily credit consumption</div>
          <div className="text-xs text-muted-foreground">Last 14 days</div>
        </div>
        <div className="flex h-40 items-end gap-1.5">
          {daily.map((d) => (
            <div key={d.date} className="group relative flex-1">
              <div
                className="rounded-t bg-gradient-to-t from-primary to-primary/60 transition hover:from-primary hover:to-primary"
                style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 2 : 0 }}
              />
              <div className="absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-[11px] shadow group-hover:block">
                {d.date}: {d.value.toLocaleString()} credits
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
          <span>{daily[0]?.date}</span><span>Today</span>
        </div>
      </div>

      {/* Cost reference */}
      <div className="rounded-2xl border bg-card p-6">
        <div className="mb-4 text-sm font-semibold">Credit cost per operation</div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(CREDIT_COSTS).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between rounded-lg border bg-background px-4 py-2 text-sm">
              <span className="capitalize text-muted-foreground">{k.replace(/_/g, " ")}</span>
              <span className="font-semibold">{v} credits</span>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction log */}
      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="border-b p-5 text-sm font-semibold">Recent activity</div>
        {tx.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No credit activity yet.</div>
        ) : (
          <div className="max-h-96 overflow-y-auto divide-y">
            {tx.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <div className="font-medium capitalize">{t.reason.replace(/_/g, " ")}</div>
                  <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div className={t.delta < 0 ? "font-semibold text-red-500" : "font-semibold text-emerald-600"}>
                    {t.delta > 0 ? "+" : ""}{Number(t.delta).toLocaleString()}
                  </div>
                  <div className="w-20 text-xs text-muted-foreground">Bal: {Number(t.balance_after).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
