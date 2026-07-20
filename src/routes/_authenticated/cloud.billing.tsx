import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getMyPrimaryWorkspace } from "@/lib/marketing-cloud/workspaces.functions";

export const Route = createFileRoute("/_authenticated/cloud/billing")({
  component: Billing,
});

const PLANS = [
  { name: "Free", monthly: 0, features: ["3 AI projects/mo", "Basic templates"] },
  { name: "Starter", monthly: 19, features: ["25 AI projects/mo", "All templates"] },
  {
    name: "Professional",
    monthly: 49,
    features: ["Unlimited projects", "Team roles", "Publishing"],
    featured: true,
  },
  { name: "Agency", monthly: 149, features: ["10 workspaces", "White-label"] },
];

function Billing() {
  const get = useServerFn(getMyPrimaryWorkspace);
  const q = useQuery({ queryKey: ["mc-primary"], queryFn: () => get({}) });
  const current = q.data?.workspace?.plan ?? "free";
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 pb-24 sm:px-6 lg:px-10">
      <div className="text-xs font-semibold uppercase tracking-widest text-primary">Billing</div>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Plans & usage</h1>

      <div className="mt-8 rounded-2xl border bg-card p-6">
        <div className="text-sm text-muted-foreground">Current plan</div>
        <div className="mt-1 text-2xl font-semibold capitalize">{current}</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <UsageRow label="AI projects this month" value="4 / ∞" />
          <UsageRow label="Team members" value="1 / 5" />
          <UsageRow label="Publish credits" value="18 / 100" />
        </div>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-4">
        {PLANS.map((p) => {
          const isCurrent = p.name.toLowerCase() === current.toLowerCase();
          return (
            <div
              key={p.name}
              className={cn(
                "flex flex-col rounded-2xl border bg-card p-6",
                p.featured && "border-primary shadow-xl shadow-primary/10",
              )}
            >
              {p.featured && (
                <div className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary">
                  <Sparkles className="h-3 w-3" /> Popular
                </div>
              )}
              <div className="text-sm font-semibold">{p.name}</div>
              <div className="mt-1 text-3xl font-semibold">${p.monthly}</div>
              <div className="text-xs text-muted-foreground">per month</div>
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-4 w-full"
                variant={isCurrent ? "outline" : p.featured ? "primary" : "outline"}
                disabled={isCurrent}
              >
                {isCurrent ? "Current" : "Upgrade"}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="mt-10">
        <div className="text-sm font-medium">Invoices</div>
        <div className="mt-3 rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          No invoices yet. Once you upgrade, invoices will appear here.
        </div>
      </div>
    </div>
  );
}

function UsageRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
