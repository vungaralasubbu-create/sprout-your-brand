import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getBillingOverview } from "@/lib/billing/billing.functions";
import { formatInr } from "@/components/billing/billing-shell";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertTriangle, ArrowUpRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/billing/")({
  component: BillingOverview,
});

function BillingOverview() {
  const get = useServerFn(getBillingOverview);
  const q = useQuery({ queryKey: ["billing-overview"], queryFn: () => get({}) });

  if (q.isLoading) return <div className="h-64 animate-pulse rounded-2xl bg-muted/40" />;
  const data = q.data;
  if (!data?.workspace) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center">
        <div className="text-lg font-semibold">No workspace yet</div>
        <p className="mt-1 text-sm text-muted-foreground">Create a workspace to start using AI credits.</p>
        <Button asChild className="mt-4"><Link to="/cloud/onboarding">Create workspace</Link></Button>
      </div>
    );
  }

  const sub = data.subscription as any;
  const usage = data.usage as any;
  const planName = sub?.bill_plans?.name ?? "Free";
  const status = sub?.status ?? "free";
  const limits = sub?.bill_plans?.limits ?? { ai_credits: 500, storage_gb: 1, team_members: 1, projects: 3 };
  const credits = usage?.credits_balance ?? 0;
  const consumed = usage?.credits_consumed_period ?? 0;
  const storageUsed = Number(usage?.storage_bytes_used ?? 0) / (1024 ** 3);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-gradient-to-br from-primary/10 to-transparent p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Current plan</div>
            <div className="mt-1 flex items-center gap-2">
              <div className="text-3xl font-semibold">{planName}</div>
              <StatusBadge status={status} />
            </div>
            {sub?.current_period_end && (
              <div className="mt-1 text-sm text-muted-foreground">
                {sub?.cancel_at_period_end ? "Ends" : "Renews"} on {new Date(sub.current_period_end).toLocaleDateString()}
              </div>
            )}
            {sub?.trial_end && status === "trialing" && (
              <div className="mt-1 text-sm text-amber-600">
                Trial ends {new Date(sub.trial_end).toLocaleDateString()}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link to="/billing/invoices">View invoices</Link></Button>
            <Button asChild><Link to="/billing/plans">Change plan <ArrowUpRight className="ml-1 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="AI credits remaining" value={credits.toLocaleString()} sub={`${consumed.toLocaleString()} used this period`} progress={progress(credits, limits.ai_credits)} />
        <StatCard label="Storage" value={`${storageUsed.toFixed(2)} GB`} sub={`Limit: ${limits.storage_gb === -1 ? "Unlimited" : `${limits.storage_gb} GB`}`} progress={limits.storage_gb === -1 ? 0 : progress(storageUsed, limits.storage_gb)} />
        <StatCard label="Projects" value={String(usage?.projects_created ?? 0)} sub={`Limit: ${limits.projects === -1 ? "Unlimited" : limits.projects}`} />
        <StatCard label="Team members" value={String(usage?.seats_used ?? 1)} sub={`Limit: ${limits.team_members === -1 ? "Unlimited" : limits.team_members}`} />
      </div>

      <div className="rounded-2xl border bg-card">
        <div className="flex items-center justify-between border-b p-5">
          <div className="text-sm font-semibold">Recent invoices</div>
          <Link to="/billing/invoices" className="text-xs font-medium text-primary hover:underline">View all →</Link>
        </div>
        {data.recentInvoices.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No invoices yet. They will appear here after your first payment.
          </div>
        ) : (
          <div className="divide-y">
            {data.recentInvoices.map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between p-4 text-sm">
                <div>
                  <div className="font-medium">{inv.invoice_number}</div>
                  <div className="text-xs text-muted-foreground">{new Date(inv.created_at).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium">{formatInr(inv.total_inr)}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase",
                    inv.status === "paid" ? "bg-emerald-500/10 text-emerald-600" :
                    inv.status === "open" ? "bg-amber-500/10 text-amber-600" :
                    "bg-muted text-muted-foreground")}>{inv.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {planName.toLowerCase() === "free" && (
        <div className="rounded-2xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary/10 p-3 text-primary"><Sparkles className="h-5 w-5" /></div>
            <div className="flex-1">
              <div className="font-semibold">Unlock the full platform</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Upgrade to Starter for 10,000 AI credits, unlimited projects, and priority processing.
              </p>
            </div>
            <Button asChild><Link to="/billing/plans">See plans</Link></Button>
          </div>
        </div>
      )}
    </div>
  );
}

function progress(used: number, limit: number | undefined) {
  if (!limit || limit < 0) return 0;
  return Math.min(100, Math.max(0, ((limit - used) / limit) * 100));
}

function StatCard({ label, value, sub, progress }: { label: string; value: string; sub: string; progress?: number }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>
      {progress !== undefined && progress > 0 && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: any }> = {
    active: { label: "Active", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: CheckCircle2 },
    trialing: { label: "Trial", cls: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Clock },
    past_due: { label: "Past due", cls: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: AlertTriangle },
    canceled: { label: "Canceled", cls: "bg-muted text-muted-foreground border-border", icon: AlertTriangle },
    free: { label: "Free", cls: "bg-muted text-muted-foreground border-border", icon: Sparkles },
  };
  const s = map[status] ?? map.free;
  const Icon = s.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase", s.cls)}>
      <Icon className="h-3 w-3" /> {s.label}
    </span>
  );
}
