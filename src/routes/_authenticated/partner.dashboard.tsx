import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Users,
  CheckCircle2,
  Clock,
  Wallet,
  ArrowRight,
  Plus,
  Package,
  Link2,
  CalendarClock,
  Receipt,
  Info,
} from "lucide-react";
import {
  getDashboardStats,
  getPartnerContext,
} from "@/lib/partner/dashboard.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/programs";

export const Route = createFileRoute("/_authenticated/partner/dashboard")({
  component: PartnerDashboard,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function PartnerDashboard() {
  const fetchStats = useServerFn(getDashboardStats);
  const fetchCtx = useServerFn(getPartnerContext);
  const { data: ctx } = useQuery({
    queryKey: ["partner-context"],
    queryFn: () => fetchCtx(),
  });
  const { data: stats, isLoading } = useQuery({
    queryKey: ["partner-dashboard-stats"],
    queryFn: () => fetchStats(),
  });

  const partner = ctx?.partner;

  // No partner record yet — show apply CTA.
  if (ctx && !partner) {
    return (
      <div className="max-w-2xl mx-auto p-8 lg:p-16">
        <div className="rounded-2xl bg-white border p-8">
          <Badge variant="primary" className="mb-4">Not yet a partner</Badge>
          <h1 className="text-display-sm font-display font-semibold tracking-tight">
            Apply to become a Glintr Sales Partner.
          </h1>
          <p className="mt-3 text-body-lg text-muted-foreground">
            Complete the partner application to unlock your sales workspace,
            program marketplace, and revenue tracking.
          </p>
          <div className="mt-6 flex gap-3">
            <Button asChild variant="gradient" size="lg">
              <Link to="/partner/apply">
                Start Application <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/earn">Learn more</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const p = partner as (typeof partner & {
    onboarding_status?: string;
    onboarding_current_step?: number;
    sales_model_approval_status?: string;
    approved_sales_model?: string | null;
    payout_profile_status?: string;
    agreement_status?: string;
  }) | null | undefined;

  const onboardingComplete = p?.onboarding_status === "completed";
  const approvalStatus = p?.sales_model_approval_status ?? "selected";
  const activeModelKey =
    p?.approved_sales_model ??
    (approvalStatus === "approved" || approvalStatus === "partially_approved"
      ? p?.sales_model_selection
      : p?.sales_model_selection) ??
    null;

  const displayModel = activeModelKey;
  const modelLabel =
    displayModel === "own_leads" || displayModel === "own"
      ? "Own Leads"
      : displayModel === "supported_sales" || displayModel === "supported"
      ? "Supported Sales"
      : displayModel === "dual_model" || displayModel === "dual"
      ? "Dual — Own + Supported"
      : "Not selected";
  const modelRateLabel =
    displayModel === "dual_model" || displayModel === "dual"
      ? "Up to 70% (Own) · Up to 50% (Supported)"
      : displayModel === "supported_sales" || displayModel === "supported"
      ? "Up to 50%"
      : displayModel === "own_leads" || displayModel === "own"
      ? "Up to 70%"
      : "—";
  const approvalLabel = approvalStatus
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="p-6 lg:p-10 space-y-8">
      {/* Header */}
      <header>
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <div className="text-caption font-mono uppercase tracking-widest text-primary">
              {greeting()}
            </div>
            <h1 className="mt-1 text-heading-xl lg:text-display-sm font-display font-semibold tracking-tight">
              {partner?.first_name ?? partner?.display_name?.split(" ")[0] ?? "Partner"}
            </h1>
            <p className="mt-1 text-muted-foreground">
              Here's your sales and earnings workspace.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/partner/revenue-rules">
                <Info className="size-4" />
                Revenue Rules
              </Link>
            </Button>
            <Button asChild variant="gradient" size="sm">
              <Link to="/partner/leads">
                <Plus className="size-4" />
                Add Lead
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* KPI cards */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Users}
          label="Active Leads"
          value={isLoading ? "—" : String(stats?.activeLeads ?? 0)}
        />
        <KpiCard
          icon={CheckCircle2}
          label="Eligible Sales"
          value={isLoading ? "—" : String(stats?.eligibleSales ?? 0)}
        />
        <KpiCard
          icon={Clock}
          label="Pending Revenue Share"
          value={isLoading ? "—" : formatPrice(stats?.pendingRevenue ?? 0, "INR")}
          hint="Pending verification / calculation"
        />
        <KpiCard
          icon={Wallet}
          label="Available For Payout"
          value={isLoading ? "—" : formatPrice(stats?.availablePayout ?? 0, "INR")}
          highlight
        />
      </section>

      {/* Active model */}
      <section className="rounded-2xl border bg-gradient-to-br from-primary/[0.06] to-accent/[0.04] p-6 lg:p-8">
        <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <div className="text-caption font-mono uppercase tracking-widest text-primary">
              Your Active Model
            </div>
            <div className="mt-2 flex items-baseline gap-4 flex-wrap">
              <h2 className="text-display-sm font-display font-semibold tracking-tight">
                {modelLabel}
              </h2>
              <span className="text-body-lg text-muted-foreground">
                Eligible revenue share {modelRateLabel}
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
              Revenue share applies only to verified eligible collected revenue,
              at the applicable program rate. Refunds and reversals may adjust
              earnings.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/partner/revenue-rules">
              Understand Revenue Rules
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="text-heading-sm font-display font-semibold mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <QuickAction to="/partner/leads" icon={Plus} label="Add Lead" />
          <QuickAction to="/partner/programs" icon={Package} label="Browse Programs" />
          <QuickAction to="/partner/links" icon={Link2} label="Create Program Link" />
          <QuickAction to="/partner/assigned-leads" icon={Users} label="Assigned Leads" />
          <QuickAction to="/partner/follow-ups" icon={CalendarClock} label="Follow-Ups" />
          <QuickAction to="/partner/earnings" icon={Wallet} label="View Earnings" />
          <QuickAction to="/partner/payouts" icon={Receipt} label="Request Payout" />
          <QuickAction to="/launch-your-brand" icon={ArrowRight} label="Launch My Brand" />
        </div>
      </section>

      {/* Today's follow-ups */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-heading-sm font-display font-semibold">
            Today's Follow-Ups
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/partner/follow-ups">
              View all <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="rounded-2xl border bg-white overflow-hidden">
          {(stats?.todayFollowUps ?? []).length === 0 ? (
            <div className="p-8 text-center">
              <CalendarClock className="size-8 mx-auto text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                No follow-ups scheduled for today.
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {stats!.todayFollowUps.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-4 p-4"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {f.partner_leads?.full_name ?? "Lead"}
                    </div>
                    <div className="text-caption text-muted-foreground truncate">
                      {new Date(f.due_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      · {f.type} · {f.notes ?? "No notes"}
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link
                      to="/partner/leads/$leadId"
                      params={{ leadId: f.lead_id }}
                    >
                      Open
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <p className="text-caption text-muted-foreground max-w-3xl">
        Revenue share is not guaranteed income. Actual earnings depend on
        approved program rules, verified eligible sales, collected revenue,
        refund rules and applicable partner terms.
      </p>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        "rounded-2xl border bg-white p-5 " +
        (highlight ? "ring-1 ring-primary/30 shadow-sm" : "")
      }
    >
      <div className="flex items-center justify-between">
        <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-4 text-caption text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl lg:text-3xl font-display font-semibold tracking-tight tabular-nums">
        {value}
      </div>
      {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

function QuickAction({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      to={to as never}
      className="group flex items-center gap-3 rounded-xl border bg-white p-4 hover:border-primary/50 hover:shadow-sm transition-all"
    >
      <span className="inline-flex size-9 items-center justify-center rounded-lg bg-muted text-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
        <Icon className="size-4" />
      </span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
