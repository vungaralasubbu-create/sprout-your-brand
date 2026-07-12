import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  GraduationCap, Users, UserCheck, Building2, Wallet, Receipt,
  Shield, Scale, ClipboardList, ArrowRight, CheckCircle2, Activity,
} from "lucide-react";
import { getAdminOverview, getAdminActivity } from "@/lib/admin/admin.functions";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  component: Dashboard,
});

function formatInr(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function KpiCard({ icon: Icon, label, value, to, tone }: any) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-border/70 bg-white p-5 hover:shadow-sm transition-shadow group"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
        <Icon className={cn("size-4", tone ?? "text-muted-foreground")} />
      </div>
      <div className="mt-3 text-3xl font-display font-semibold tracking-tight">{value}</div>
      <div className="mt-2 text-[11px] text-muted-foreground group-hover:text-primary flex items-center gap-1">
        View <ArrowRight className="size-3" />
      </div>
    </Link>
  );
}

function AttentionRow({ icon: Icon, label, count, to }: any) {
  const empty = !count;
  return (
    <Link
      to={to}
      className="flex items-center justify-between px-4 py-3 hover:bg-surface-1/50 rounded-md group border-b border-border/50 last:border-b-0"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn(
          "size-8 rounded-lg flex items-center justify-center shrink-0",
          empty ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-700",
        )}>
          {empty ? <CheckCircle2 className="size-4" /> : <Icon className="size-4" />}
        </div>
        <div className="text-sm font-medium truncate">{label}</div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={empty ? "outline" : "muted"} className={empty ? "text-muted-foreground" : "bg-amber-50 text-amber-800 border-amber-200"}>
          {count}
        </Badge>
        <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary" />
      </div>
    </Link>
  );
}

function Dashboard() {
  const overviewFn = useServerFn(getAdminOverview);
  const activityFn = useServerFn(getAdminActivity);
  const { data: overview } = useQuery({ queryKey: ["admin-overview"], queryFn: () => overviewFn() });
  const { data: activity = [] } = useQuery({ queryKey: ["admin-activity"], queryFn: () => activityFn() });

  const kpis = overview?.kpis;
  const attn = overview?.attention;

  return (
    <div className="space-y-8 max-w-[1400px]">
      <div>
        <h2 className="text-3xl font-display font-semibold tracking-tight">Overview</h2>
        <p className="text-muted-foreground mt-1 text-sm">Everything happening across Glintr right now.</p>
      </div>

      {/* KPI grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard icon={GraduationCap} label="Published Programs" value={kpis?.publishedPrograms ?? "—"} to="/admin/courses" tone="text-primary" />
        <KpiCard icon={Users} label="Active Partners" value={kpis?.activePartners ?? "—"} to="/admin/partners" tone="text-primary" />
        <KpiCard icon={UserCheck} label="Partner Applications" value={kpis?.partnerApplications ?? "—"} to="/admin/partner-applications" />
        <KpiCard icon={Building2} label="Brand Applications" value={kpis?.brandApplications ?? "—"} to="/admin/brand-applications" />
        <KpiCard icon={Wallet} label="Pending Revenue" value={kpis ? formatInr(kpis.pendingRevenue) : "—"} to="/admin/revenue" />
        <KpiCard icon={Receipt} label="Pending Payouts" value={kpis?.pendingPayouts ?? "—"} to="/admin/payouts" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Attention required */}
        <div className="lg:col-span-2 rounded-xl border border-border/70 bg-white">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/70">
            <div>
              <h3 className="font-display font-semibold">Attention Required</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Workflows waiting on Admin review.</p>
            </div>
          </div>
          <div className="p-2">
            <AttentionRow icon={UserCheck} label="Partner Applications Awaiting Review" count={attn?.partnerApplications ?? 0} to="/admin/partner-applications" />
            <AttentionRow icon={Shield} label="Partner Models Awaiting Approval" count={attn?.modelsAwaitingApproval ?? 0} to="/admin/model-approvals" />
            <AttentionRow icon={Scale} label="Lead Attribution Conflicts" count={attn?.attributionConflicts ?? 0} to="/admin/attribution-reviews" />
            <AttentionRow icon={Wallet} label="Revenue Awaiting Verification" count={attn?.revenueAwaitingVerification ?? 0} to="/admin/revenue" />
            <AttentionRow icon={Receipt} label="Payouts Awaiting Review" count={attn?.payoutsAwaitingReview ?? 0} to="/admin/payouts" />
            <AttentionRow icon={Building2} label="Brand Applications Awaiting Review" count={attn?.brandApplications ?? 0} to="/admin/brand-applications" />
            <AttentionRow icon={ClipboardList} label="Launch Tasks Overdue" count={attn?.overdueLaunchTasks ?? 0} to="/admin/brand-launch-tasks" />
          </div>
        </div>

        {/* Activity */}
        <div className="rounded-xl border border-border/70 bg-white">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/70">
            <div>
              <h3 className="font-display font-semibold">Recent Activity</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Latest platform events.</p>
            </div>
            <Activity className="size-4 text-muted-foreground" />
          </div>
          <div className="max-h-[520px] overflow-y-auto divide-y divide-border/50">
            {activity.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">No activity yet.</div>
            )}
            {activity.map((a: any) => (
              <div key={a.id} className="px-4 py-3">
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
    </div>
  );
}
