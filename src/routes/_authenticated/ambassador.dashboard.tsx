import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { QRCodeCanvas } from "qrcode.react";
import {
  Compass, Copy, Share2, Download, Link2, IdCard, Sparkles, TrendingUp,
  Users, CheckCircle2, Clock, Wallet, PiggyBank, ArrowRight,
  AlertTriangle, XCircle, ShieldAlert, ChevronRight, QrCode as QrIcon,
} from "lucide-react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  getAmbassadorDashboard,
  getAmbassadorReferralTrend,
  getAmbassadorRecentActivity,
  getAmbassadorRecentEnrollments,
  getAmbassadorCommissionStructure,
  recordAmbassadorActivity,
} from "@/lib/campus-ambassador/dashboard.functions";

export const Route = createFileRoute("/_authenticated/ambassador/dashboard")({
  head: () => ({
    meta: [
      { title: "Ambassador Dashboard — Glintr" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

function inr(n: number | null | undefined) {
  return `₹${Number(n ?? 0).toLocaleString("en-IN")}`;
}
function formatCommissionStatus(s: string) {
  const map: Record<string, string> = {
    pending_verification: "Pending Verification",
    eligible: "Eligible",
    approved: "Approved",
    available: "Available",
    payout_processing: "Payout Processing",
    paid: "Paid",
    on_hold: "On Hold",
    reversed: "Reversed",
    ineligible: "Ineligible",
  };
  return map[s] ?? s;
}
function commissionTone(s: string): "info" | "success" | "warning" | "danger" | "muted" {
  if (s === "paid" || s === "available" || s === "approved") return "success";
  if (s === "reversed" || s === "ineligible") return "danger";
  if (s === "on_hold") return "warning";
  return "info";
}

function DashboardPage() {
  const dashFn = useServerFn(getAmbassadorDashboard);
  const trendFn = useServerFn(getAmbassadorReferralTrend);
  const actFn = useServerFn(getAmbassadorRecentActivity);
  const enrFn = useServerFn(getAmbassadorRecentEnrollments);
  const struFn = useServerFn(getAmbassadorCommissionStructure);
  const activityFn = useServerFn(recordAmbassadorActivity);

  const dashQ = useQuery({ queryKey: ["amb-dash"], queryFn: () => dashFn() });
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const canShow = dashQ.data?.gate === "active" || dashQ.data?.gate === "suspended";
  const trendQ = useQuery({
    queryKey: ["amb-trend", period],
    queryFn: () => trendFn({ data: { period } }),
    enabled: canShow,
  });
  const actQ = useQuery({ queryKey: ["amb-activity"], queryFn: () => actFn(), enabled: canShow });
  const enrQ = useQuery({ queryKey: ["amb-enr"], queryFn: () => enrFn(), enabled: canShow });
  const struQ = useQuery({ queryKey: ["amb-structure"], queryFn: () => struFn(), enabled: canShow });

  const openedRef = useRef(false);
  useEffect(() => {
    if (openedRef.current || !canShow) return;
    openedRef.current = true;
    activityFn({ data: { event: "ambassador_dashboard_opened" } }).catch(() => {});
  }, [canShow, activityFn]);

  if (dashQ.isLoading) return <DashboardSkeleton />;
  if (dashQ.isError) {
    return <ErrorPanel title="Unable To Load Ambassador Dashboard" onRetry={() => dashQ.refetch()} />;
  }

  const gate = dashQ.data?.gate;
  const profile = dashQ.data?.profile;

  if (!profile || gate === "not_approved") {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="p-6">
          <ShieldAlert className="h-6 w-6 text-slate-500" />
          <h1 className="mt-2 font-display text-2xl font-semibold">Ambassador Access Required</h1>
          <p className="mt-1 text-sm text-slate-600">
            This dashboard is available to approved Glintr Campus Ambassadors only.
          </p>
          <Button asChild className="mt-4">
            <Link to="/campus-ambassador">View Campus Ambassador Program</Link>
          </Button>
        </Card>
      </div>
    );
  }
  if (gate === "inactive" || gate === "terminated") {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="p-6">
          <XCircle className="h-6 w-6 text-rose-500" />
          <h1 className="mt-2 font-display text-2xl font-semibold">Ambassador Access Unavailable</h1>
          <p className="mt-1 text-sm text-slate-600">
            Your Campus Ambassador access is not currently active.
          </p>
        </Card>
      </div>
    );
  }

  const firstName = (profile.full_name || "Ambassador").split(" ")[0];
  const suspended = gate === "suspended";

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <Compass className="h-4 w-4" />
            <span className="text-xs font-mono uppercase tracking-widest">Campus Ambassador</span>
          </div>
          <h1 className="mt-1 font-display text-3xl md:text-4xl font-semibold">
            Welcome Back, {firstName}
          </h1>
          <p className="mt-1 text-slate-600">
            Track your referrals, verified enrollments and Campus Ambassador earnings.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1"><IdCard className="h-3.5 w-3.5" /> {profile.ambassador_code}</span>
            <span>{profile.college_name}</span>
            <span>{profile.campus_city}</span>
            <StatusPill status={profile.status ?? "active"} />
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/campus-ambassador/status">View Profile</Link>
        </Button>
      </div>

      {suspended && (
        <Card className="p-4 border-amber-300 bg-amber-50">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-700 mt-0.5" />
            <div>
              <div className="font-semibold text-sm text-amber-900">
                Campus Ambassador Access Temporarily Suspended
              </div>
              <div className="text-xs text-amber-800 mt-0.5">
                Your Ambassador referral and commission access is currently restricted.
                Active referral sharing is disabled until your access is restored.
              </div>
            </div>
          </div>
        </Card>
      )}

      {(() => {
        const metrics = dashQ.data!.metrics!;
        const earnings = dashQ.data!.earnings!;
        return (
          <>
      <MetricGrid metrics={metrics} earnings={earnings} />

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        <ReferralIdentityCard
          profile={profile}
          disabled={suspended}
          onActivity={(event) => activityFn({ data: { event } }).catch(() => {})}
        />
        <div className="space-y-4">
          <EarningsCard earnings={earnings} error={dashQ.isError} onRetry={() => dashQ.refetch()} />
          <UpTo40Card onView={() => activityFn({ data: { event: "commission_structure_viewed" } }).catch(() => {})} />
        </div>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-widest text-primary font-mono">Referral Performance</div>
            <div className="mt-1 font-display text-xl font-semibold">Your Referral Trend</div>
          </div>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
            <TabsList>
              <TabsTrigger value="7d">7D</TabsTrigger>
              <TabsTrigger value="30d">30D</TabsTrigger>
              <TabsTrigger value="90d">90D</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="mt-4 grid md:grid-cols-5 gap-3 text-sm">
          <MiniStat label="Referral Visits" value={metrics.totalVisits.toLocaleString()} />
          <MiniStat label="Referral Leads" value={metrics.totalReferrals.toLocaleString()} />
          <MiniStat label="Enrollments" value={(metrics.pendingEnrollments + metrics.verifiedEnrollments).toLocaleString()} />
          <MiniStat label="Verified Enrollments" value={metrics.verifiedEnrollments.toLocaleString()} />
          <MiniStat label="Conversion Rate" value={`${metrics.conversionRate}%`} />
        </div>
        <div className="mt-5 h-60">
          <TrendChart loading={trendQ.isLoading} points={trendQ.data?.points ?? []} />
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <RecentActivityCard loading={actQ.isLoading} items={actQ.data?.items ?? []} />
        <RecentEnrollmentsCard loading={enrQ.isLoading} items={enrQ.data?.items ?? []} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <CommissionStructureCard
          loading={struQ.isLoading}
          rules={struQ.data?.rules ?? []}
          onView={() => activityFn({ data: { event: "commission_structure_viewed" } }).catch(() => {})}
        />
        <CampusPerformanceCard metrics={dashQ.data!.metrics} earnings={dashQ.data!.earnings} />
        <TopProgramsCard enrollments={enrQ.data?.items ?? []} />
      </div>

      <ProfileCard profile={profile} />
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { tone: "success" | "warning" | "danger" | "muted"; label: string }> = {
    active: { tone: "success", label: "Active" },
    suspended: { tone: "warning", label: "Temporarily Suspended" },
    inactive: { tone: "muted", label: "Inactive" },
    terminated: { tone: "danger", label: "Terminated" },
  };
  const m = map[status] ?? map.active;
  return <Badge variant={m.tone}>{m.label}</Badge>;
}

function MetricGrid({ metrics, earnings }: any) {
  const cards = [
    { icon: Users, label: "Total Referrals", value: metrics.totalReferrals, accent: "from-cyan-500/10 to-blue-500/10 text-cyan-700" },
    { icon: Clock, label: "Pending Enrollments", value: metrics.pendingEnrollments, accent: "from-amber-500/10 to-yellow-500/10 text-amber-700" },
    { icon: CheckCircle2, label: "Verified Enrollments", value: metrics.verifiedEnrollments, accent: "from-emerald-500/10 to-green-500/10 text-emerald-700" },
    { icon: TrendingUp, label: "Commission Earned", value: inr(earnings.commissionEarned), accent: "from-blue-500/10 to-indigo-500/10 text-blue-700", money: true },
    { icon: Wallet, label: "Available Earnings", value: inr(earnings.availableEarnings), accent: "from-emerald-500/10 to-teal-500/10 text-emerald-700", money: true },
    { icon: Clock, label: "Pending Commission", value: inr(earnings.pendingCommission), accent: "from-amber-500/10 to-yellow-500/10 text-amber-700", money: true },
    { icon: PiggyBank, label: "Paid Earnings", value: inr(earnings.paidEarnings), accent: "from-slate-500/10 to-slate-500/10 text-slate-700", money: true },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {cards.map((c) => (
        <Card key={c.label} className="p-4">
          <div className={cn("h-8 w-8 rounded-lg bg-gradient-to-br grid place-items-center", c.accent)}>
            <c.icon className="h-4 w-4" />
          </div>
          <div className={cn("mt-3 font-semibold tabular-nums", c.money ? "text-lg" : "text-2xl")}>
            {c.value}
          </div>
          <div className="text-[11px] uppercase tracking-widest text-slate-500 mt-0.5">{c.label}</div>
        </Card>
      ))}
    </div>
  );
}

function ReferralIdentityCard({
  profile, disabled, onActivity,
}: { profile: any; disabled: boolean; onActivity: (event: any) => void }) {
  const link = profile.referral_link as string | null;
  const code = profile.referral_code as string | null;
  const [showQr, setShowQr] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  function copy(value: string, event: any, msg: string) {
    if (!navigator?.clipboard) {
      toast.error("Clipboard is not available in this browser");
      return;
    }
    navigator.clipboard.writeText(value).then(
      () => { toast.success(msg); onActivity(event); },
      () => toast.error("Copy failed"),
    );
  }
  async function share() {
    if (!link) return;
    const message = `Explore industry-focused learning programs from Glintr.\n\nView programs using my referral link:\n${link}`;
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: "Glintr", text: message, url: link });
        onActivity("referral_link_shared");
      } catch { /* cancelled */ }
    } else {
      copy(message, "referral_link_shared", "Referral message copied");
    }
  }
  function downloadQr() {
    const canvas = qrRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url; a.download = `glintr-ambassador-${code}.png`; a.click();
    onActivity("referral_qr_downloaded");
  }
  async function shareQr() {
    if (!link) return;
    const canvas = qrRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (canvas && typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        const blob: Blob = await new Promise((r) => canvas.toBlob((b) => r(b!), "image/png"));
        const file = new File([blob], `glintr-ambassador-${code}.png`, { type: "image/png" });
        if ((navigator as any).canShare?.({ files: [file] })) {
          await (navigator as any).share({ files: [file], title: "Glintr", text: link });
          onActivity("referral_qr_shared");
          return;
        }
      } catch { /* fall through */ }
    }
    copy(link, "referral_qr_shared", "Referral link copied");
  }

  return (
    <Card className="p-5 relative overflow-hidden">
      <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-gradient-to-br from-cyan-400/20 via-blue-400/20 to-emerald-400/20 blur-2xl pointer-events-none" />
      <div className="relative">
        <div className="text-xs uppercase tracking-widest text-primary font-mono">My Referral Identity</div>
        <div className="mt-1 font-display text-xl font-semibold">Share Glintr On Your Campus</div>

        <div className="mt-4 space-y-3">
          <div className="rounded-xl border bg-white p-3">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" /> My Referral Link
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <div className="font-mono text-sm break-all flex-1 min-w-0">{link ?? "—"}</div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={!link || disabled}
                  onClick={() => link && copy(link, "referral_link_copied", "Referral Link Copied")}>
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copy Link
                </Button>
                <Button size="sm" disabled={!link || disabled} onClick={share}>
                  <Share2 className="h-3.5 w-3.5 mr-1" /> Share Link
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-3">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> My Ambassador Code
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div className="font-mono text-lg font-semibold flex-1">{code ?? "—"}</div>
              <Button size="sm" variant="outline" disabled={!code || disabled}
                onClick={() => code && copy(code, "referral_code_copied", "Ambassador Code Copied")}>
                <Copy className="h-3.5 w-3.5 mr-1" /> Copy Code
              </Button>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Students can use your Ambassador Code where Glintr referral code entry is available.
            </div>
          </div>

          <div className="rounded-xl border bg-white p-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <QrIcon className="h-3.5 w-3.5" /> My Referral QR Code
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Scan opens your Glintr referral link.
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowQr((v) => !v)} disabled={!link}>
                {showQr ? "Hide" : "Show"} QR
              </Button>
            </div>
            {showQr && link && (
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <div ref={qrRef} className="rounded-lg bg-white p-2 border">
                  <QRCodeCanvas value={link} size={140} level="M" />
                </div>
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="outline" onClick={downloadQr} disabled={disabled}>
                    <Download className="h-3.5 w-3.5 mr-1" /> Download QR Code
                  </Button>
                  <Button size="sm" onClick={shareQr} disabled={disabled}>
                    <Share2 className="h-3.5 w-3.5 mr-1" /> Share QR Code
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function EarningsCard({ earnings, error, onRetry }: any) {
  if (error) {
    return (
      <Card className="p-5">
        <div className="font-semibold text-sm">Unable To Load Earnings</div>
        <Button size="sm" variant="outline" onClick={onRetry} className="mt-2">Retry</Button>
      </Card>
    );
  }
  return (
    <Card className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
      <div className="text-xs uppercase tracking-widest text-white/60 font-mono">Ambassador Earnings</div>
      <div className="mt-1 font-display text-xl font-semibold">Total Commission Earned</div>
      <div className="mt-1 text-3xl font-semibold tabular-nums">{inr(earnings.commissionEarned)}</div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
        <div><div className="text-white/60">Available</div><div className="mt-0.5 text-sm font-semibold tabular-nums">{inr(earnings.availableEarnings)}</div></div>
        <div><div className="text-white/60">Pending</div><div className="mt-0.5 text-sm font-semibold tabular-nums">{inr(earnings.pendingCommission)}</div></div>
        <div><div className="text-white/60">Paid</div><div className="mt-0.5 text-sm font-semibold tabular-nums">{inr(earnings.paidEarnings)}</div></div>
      </div>
    </Card>
  );
}

function UpTo40Card({ onView }: { onView: () => void }) {
  return (
    <Card className="p-5 border-primary/20 bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50">
      <Badge variant="success">Commission</Badge>
      <div className="mt-2 font-display text-xl font-semibold">Earn Up To 40% Commission</div>
      <div className="mt-1 text-xs text-slate-600">
        Commission rates may vary by eligible program, pricing plan or active Ambassador campaign.
      </div>
      <Button asChild size="sm" variant="outline" className="mt-3" onClick={onView}>
        <a href="#commission-structure">
          View Commission Structure <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </a>
      </Button>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function TrendChart({ loading, points }: { loading: boolean; points: any[] }) {
  if (loading) return <Skeleton className="w-full h-full rounded-md" />;
  if (!points || points.length === 0) {
    return (
      <div className="h-full grid place-items-center text-sm text-slate-500 border rounded-md bg-slate-50/40">
        No referral trend data yet.
      </div>
    );
  }
  return (
    <ResponsiveContainer>
      <AreaChart data={points}>
        <defs>
          <linearGradient id="v" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="oklch(0.75 0.14 220)" stopOpacity={0.4} />
            <stop offset="1" stopColor="oklch(0.75 0.14 220)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="e" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="oklch(0.72 0.18 150)" stopOpacity={0.45} />
            <stop offset="1" stopColor="oklch(0.72 0.18 150)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip />
        <Area type="monotone" dataKey="visits" stroke="oklch(0.65 0.16 220)" fill="url(#v)" name="Visits" />
        <Area type="monotone" dataKey="enrollments" stroke="oklch(0.58 0.18 150)" fill="url(#e)" name="Enrollments" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function RecentActivityCard({ loading, items }: { loading: boolean; items: any[] }) {
  return (
    <Card className="p-5">
      <div className="text-xs uppercase tracking-widest text-primary font-mono">Activity</div>
      <div className="mt-1 font-display text-xl font-semibold">Recent Referral Activity</div>
      <div className="mt-4 space-y-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-md" />)
        ) : items.length === 0 ? (
          <div className="text-sm text-slate-500 py-6 text-center border rounded-md bg-slate-50/50">
            No activity yet.
          </div>
        ) : (
          items.map((it) => (
            <div key={it.id} className="flex items-start gap-3 rounded-lg border p-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                {it.type === "commission" ? <Wallet className="h-4 w-4" /> : <Users className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{it.title}</div>
                <div className="text-xs text-slate-500 truncate">{it.subtitle}</div>
              </div>
              <div className="text-[11px] text-slate-400 shrink-0">
                {it.when ? new Date(it.when).toLocaleDateString() : ""}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function RecentEnrollmentsCard({ loading, items }: { loading: boolean; items: any[] }) {
  return (
    <Card className="p-5">
      <div className="text-xs uppercase tracking-widest text-primary font-mono">Enrollments</div>
      <div className="mt-1 font-display text-xl font-semibold">Recent Enrollments</div>
      <div className="mt-4 space-y-2">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-md" />)
        ) : items.length === 0 ? (
          <div className="text-sm text-slate-500 py-6 text-center border rounded-md bg-slate-50/50">
            No enrollments attributed yet.
          </div>
        ) : (
          items.map((e) => (
            <div key={e.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {e.program_title ?? e.program_id ?? "Program"}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {e.display_name} • {e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString() : "—"}
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={commissionTone(e.commission_status)}>{formatCommissionStatus(e.commission_status)}</Badge>
                  {e.commission_amount != null && (
                    <div className="text-xs text-slate-500 mt-1 tabular-nums">{inr(e.commission_amount)}</div>
                  )}
                </div>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">{e.payment_status}</div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function CommissionStructureCard({ loading, rules, onView }: { loading: boolean; rules: any[]; onView: () => void }) {
  const topRate = useMemo(
    () => rules.reduce((m, r) => Math.max(m, Number(r.commission_percentage ?? 0)), 0),
    [rules],
  );
  return (
    <Card className="p-5" id="commission-structure">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-primary font-mono">Commission Structure</div>
          <div className="mt-1 font-display text-xl font-semibold">Active Rates</div>
        </div>
        {rules.length > 0 && <Badge variant="info">Up to {topRate}%</Badge>}
      </div>
      <div className="mt-4 space-y-2">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-md" />)
        ) : rules.length === 0 ? (
          <div className="text-sm text-slate-500 py-4 text-center border rounded-md bg-slate-50/50">
            No active commission rules.
          </div>
        ) : (
          rules.slice(0, 6).map((r) => (
            <div key={r.id} className="flex items-center justify-between border rounded-lg p-3">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{r.name}</div>
                <div className="text-[11px] text-slate-500 truncate">
                  {[r.program_id ?? "All Programs", r.pricing_plan, r.campaign_id].filter(Boolean).join(" • ")}
                </div>
              </div>
              <div className="text-lg font-semibold tabular-nums">{Number(r.commission_percentage).toFixed(0)}%</div>
            </div>
          ))
        )}
      </div>
      <Button size="sm" variant="outline" className="mt-3" onClick={onView}>
        View Commission Structure <ChevronRight className="h-3.5 w-3.5 ml-1" />
      </Button>
    </Card>
  );
}

function CampusPerformanceCard({ metrics, earnings }: any) {
  const rows = [
    { label: "Referral Leads", value: metrics.totalReferrals.toLocaleString() },
    { label: "Verified Enrollments", value: metrics.verifiedEnrollments.toLocaleString() },
    { label: "Conversion Rate", value: `${metrics.conversionRate}%` },
    { label: "Commission Earned", value: inr(earnings.commissionEarned) },
  ];
  return (
    <Card className="p-5">
      <div className="text-xs uppercase tracking-widest text-primary font-mono">My Campus</div>
      <div className="mt-1 font-display text-xl font-semibold">My Campus Performance</div>
      <div className="mt-4 space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between items-center border rounded-lg p-3">
            <div className="text-sm text-slate-600">{r.label}</div>
            <div className="text-sm font-semibold tabular-nums">{r.value}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TopProgramsCard({ enrollments }: { enrollments: any[] }) {
  const top = useMemo(() => {
    const map = new Map<string, { title: string; leads: number; verified: number; commission: number }>();
    for (const e of enrollments) {
      const key = e.program_id ?? e.program_title ?? "Program";
      const row = map.get(key) ?? { title: e.program_title ?? key, leads: 0, verified: 0, commission: 0 };
      row.leads += 1;
      if (e.payment_status === "Payment Verified") row.verified += 1;
      if (e.commission_amount) row.commission += Number(e.commission_amount);
      map.set(key, row);
    }
    return Array.from(map.values()).slice(0, 5);
  }, [enrollments]);
  return (
    <Card className="p-5">
      <div className="text-xs uppercase tracking-widest text-primary font-mono">Top Programs</div>
      <div className="mt-1 font-display text-xl font-semibold">My Top Programs</div>
      <div className="mt-4 space-y-2">
        {top.length === 0 ? (
          <div className="text-sm text-slate-500 py-4 text-center border rounded-md bg-slate-50/50">
            No Program Performance Data Yet
          </div>
        ) : (
          top.map((r) => (
            <div key={r.title} className="border rounded-lg p-3">
              <div className="text-sm font-medium truncate">{r.title}</div>
              <div className="mt-1 grid grid-cols-3 text-xs text-slate-500">
                <span>{r.leads} leads</span>
                <span>{r.verified} verified</span>
                <span className="text-right tabular-nums">{inr(r.commission)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function ProfileCard({ profile }: { profile: any }) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-500 to-emerald-400 text-white grid place-items-center font-display text-lg font-semibold">
            {(profile.full_name || "A").slice(0, 1)}
          </div>
          <div>
            <div className="font-display text-lg font-semibold">{profile.full_name}</div>
            <div className="text-xs text-slate-500 font-mono">{profile.ambassador_code}</div>
            <div className="text-xs text-slate-500 mt-1">{profile.college_name} • {profile.campus_city}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Member Since {profile.approved_at
                ? new Date(profile.approved_at).toLocaleDateString()
                : new Date(profile.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill status={profile.status ?? "active"} />
          <Button asChild variant="outline" size="sm">
            <Link to="/campus-ambassador/status">View Ambassador Profile</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <Skeleton className="h-10 w-72" />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
      <Skeleton className="h-72 rounded-xl" />
      <div className="grid lg:grid-cols-2 gap-4">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}

function ErrorPanel({ title, onRetry }: { title: string; onRetry: () => void }) {
  return (
    <div className="p-8 max-w-lg mx-auto">
      <Card className="p-6">
        <AlertTriangle className="h-6 w-6 text-amber-600" />
        <h1 className="mt-2 font-display text-xl font-semibold">{title}</h1>
        <Button size="sm" className="mt-3" onClick={onRetry}>Retry</Button>
      </Card>
    </div>
  );
}
