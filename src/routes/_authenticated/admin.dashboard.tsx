import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  GraduationCap, Users, UserCheck, Building2, Wallet, Receipt,
  Shield, Scale, ClipboardList, ArrowRight, CheckCircle2, Activity,
  ShieldCheck, Bell, Target, Timer,
} from "lucide-react";
import { getAdminOverview, getAdminActivity } from "@/lib/admin/admin.functions";
import { getCommandTopMetrics } from "@/lib/admin/sales-command.functions";
import { useAdminSession } from "@/hooks/use-admin-permissions";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  component: Dashboard,
});

function formatInr(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function KpiCard({ icon: Icon, label, value, to, tone }: any) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-border/60 bg-white p-4 hover:border-primary/40 hover:shadow-sm transition-all group"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
        <Icon className={cn("size-4", tone ?? "text-muted-foreground")} />
      </div>
      <div className="mt-2 text-2xl font-display font-semibold tracking-tight">{value}</div>
      <div className="mt-1.5 text-[11px] text-muted-foreground group-hover:text-primary flex items-center gap-1">
        View <ArrowRight className="size-3" />
      </div>
    </Link>
  );
}

function AttentionTile({ icon: Icon, label, count, to }: any) {
  const n = Number(count ?? 0);
  const empty = !n;
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 hover:shadow-sm transition-all group",
        empty ? "border-border/60" : "border-amber-200/70 bg-gradient-to-br from-amber-50/60 to-white",
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn(
          "size-9 rounded-lg flex items-center justify-center shrink-0",
          empty ? "bg-emerald-50 text-emerald-600" : "bg-amber-100 text-amber-700",
        )}>
          {empty ? <CheckCircle2 className="size-4" /> : <Icon className="size-4" />}
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-medium truncate">{label}</div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">
            {empty ? "All clear" : "Needs review"}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge
          variant="outline"
          className={cn(
            "font-mono text-[11px]",
            empty ? "text-muted-foreground border-border" : "bg-amber-100 text-amber-800 border-amber-200",
          )}
        >
          {n}
        </Badge>
        <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </Link>
  );
}

function Dashboard() {
  const overviewFn = useServerFn(getAdminOverview);
  const activityFn = useServerFn(getAdminActivity);
  const commandFn = useServerFn(getCommandTopMetrics);
  const { data: session } = useAdminSession();
  const { data: overview } = useQuery({ queryKey: ["admin-overview"], queryFn: () => overviewFn() });
  const { data: command } = useQuery({ queryKey: ["admin-command-top"], queryFn: () => commandFn() });
  const { data: activity = [] } = useQuery({ queryKey: ["admin-activity"], queryFn: () => activityFn() });

  const kpis = overview?.kpis;
  const attn = overview?.attention;

  const name = session?.adminUser?.full_name?.split(" ")[0] ?? "Admin";

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Greeting */}
      <div>
        <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
          {greeting()}
        </div>
        <h2 className="text-2xl lg:text-3xl font-display font-semibold tracking-tight mt-1">
          {name}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Here's what needs your attention across Glintr sales operations.
        </p>
      </div>

      {/* Attention grid */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="font-display font-semibold text-[15px]">Needs your attention</h3>
          <Link
            to="/admin/sales-command"
            className="text-[11px] font-mono uppercase tracking-widest text-primary hover:underline"
          >
            Open Command Center
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <AttentionTile
            icon={ShieldCheck}
            label="Pending Payment Verification"
            count={command?.pendingVerification ?? 0}
            to="/admin/payment-verification"
          />
          <AttentionTile
            icon={Scale}
            label="Ownership Reviews Pending"
            count={command?.pendingOwnershipReviews ?? 0}
            to="/admin/lead-ownership"
          />
          <AttentionTile
            icon={Wallet}
            label="Payouts Due"
            count={command?.approvedPayoutsCount ?? 0}
            to="/admin/partner-payouts"
          />
          <AttentionTile
            icon={Bell}
            label="Open Support Tickets"
            count={command?.openSupportTickets ?? 0}
            to="/admin/support"
          />
          <AttentionTile
            icon={Shield}
            label="Open Risk Flags"
            count={command?.underReview ?? 0}
            to="/admin/risk-review"
          />
          <AttentionTile
            icon={Target}
            label="Unassigned Leads"
            count={command?.leadsNotContacted ?? 0}
            to="/admin/lead-management"
          />
          <AttentionTile
            icon={Timer}
            label="Overdue Follow-Ups"
            count={command?.overdueFollowUps ?? 0}
            to="/admin/lead-management"
          />
          <AttentionTile
            icon={UserCheck}
            label="Pending Partner Applications"
            count={attn?.partnerApplications ?? 0}
            to="/admin/partner-applications"
          />
        </div>
      </div>

      {/* KPI overview */}
      <div>
        <h3 className="font-display font-semibold text-[15px] mb-2.5">Platform overview</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <KpiCard icon={GraduationCap} label="Published Programs" value={kpis?.publishedPrograms ?? "—"} to="/admin/courses" tone="text-primary" />
          <KpiCard icon={Users} label="Active Partners" value={kpis?.activePartners ?? "—"} to="/admin/partners" tone="text-primary" />
          <KpiCard icon={UserCheck} label="Partner Applications" value={kpis?.partnerApplications ?? "—"} to="/admin/partner-applications" />
          <KpiCard icon={Building2} label="Brand Applications" value={kpis?.brandApplications ?? "—"} to="/admin/partner-brands" />
          <KpiCard icon={Wallet} label="Pending Revenue" value={kpis ? formatInr(kpis.pendingRevenue) : "—"} to="/admin/partner-payouts" />
          <KpiCard icon={Receipt} label="Pending Payouts" value={kpis?.pendingPayouts ?? "—"} to="/admin/partner-payouts" />
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-xl border border-border/60 bg-white">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60">
          <div>
            <h3 className="font-display font-semibold text-[15px]">Recent activity</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Latest platform events.</p>
          </div>
          <Activity className="size-4 text-muted-foreground" />
        </div>
        <div className="max-h-[420px] overflow-y-auto divide-y divide-border/50">
          {activity.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">No activity yet.</div>
          )}
          {activity.map((a: any) => (
            <div key={a.id} className="px-5 py-3">
              <div className="text-[13px] font-medium truncate">{a.title}</div>
              {a.summary && <div className="text-[12px] text-muted-foreground truncate">{a.summary}</div>}
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70 mt-1">
                {new Date(a.at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
