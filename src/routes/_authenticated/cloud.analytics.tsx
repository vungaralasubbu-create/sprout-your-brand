import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, TrendingUp, MousePointerClick, Send } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cloud/analytics")({
  component: Analytics,
});

const KPIS = [
  { label: "Total reach", value: "128.4K", delta: "+18%", icon: BarChart3 },
  { label: "Engagement", value: "5.2%", delta: "+0.4pt", icon: TrendingUp },
  { label: "CTR", value: "2.8%", delta: "+0.6pt", icon: MousePointerClick },
  { label: "Emails sent", value: "12.1K", delta: "+22%", icon: Send },
];

function Analytics() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 pb-24 sm:px-6 lg:px-10">
      <div className="text-xs font-semibold uppercase tracking-widest text-primary">Analytics</div>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Cross-project analytics</h1>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">{k.label}</div>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-2 text-2xl font-semibold">{k.value}</div>
              <div className="mt-1 text-xs text-emerald-500">{k.delta} vs last month</div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 rounded-2xl border bg-card p-6">
        <div className="text-sm font-medium">Reach by channel</div>
        <div className="mt-6 flex h-40 items-end gap-2">
          {[
            { l: "Instagram", v: 55 },
            { l: "LinkedIn", v: 82 },
            { l: "X", v: 34 },
            { l: "Facebook", v: 61 },
            { l: "Email", v: 92 },
          ].map((c) => (
            <div key={c.l} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-primary/80 to-primary"
                style={{ height: `${c.v}%` }}
              />
              <div className="text-xs text-muted-foreground">{c.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
