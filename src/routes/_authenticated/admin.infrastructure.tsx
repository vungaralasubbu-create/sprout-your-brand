import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity, Server, Database, HardDrive, Zap, Search, Cloud, Gauge, AlertTriangle,
  History, Save, Shield, Radio, ToggleLeft, Settings, GitBranch, Layers, Boxes,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  FEATURE_FLAGS, ENVIRONMENTS, SYSTEM_HEALTH, DEPLOYMENTS, JOB_QUEUES, CACHE_LAYERS,
  SEARCH_INDEXES, STORAGE_BUCKETS, CDN_METRICS, DB_METRICS, MONITORING, ERRORS,
  BACKUPS, SECURITY_METRICS, API_VERSIONS, SYSTEM_PROVIDERS,
  getFlags, setFlag, fmtRelative,
} from "@/lib/admin/infrastructure";

export const Route = createFileRoute("/_authenticated/admin/infrastructure")({
  component: InfrastructurePage,
});

type TabKey =
  | "overview" | "deployments" | "jobs" | "cache" | "search" | "storage" | "cdn"
  | "database" | "monitoring" | "errors" | "audit" | "backups" | "security"
  | "api" | "flags" | "settings";

const TABS: { key: TabKey; label: string; icon: typeof Activity }[] = [
  { key: "overview", label: "Overview", icon: Activity },
  { key: "deployments", label: "Deployments", icon: GitBranch },
  { key: "jobs", label: "Jobs", icon: Layers },
  { key: "cache", label: "Cache", icon: Zap },
  { key: "search", label: "Search", icon: Search },
  { key: "storage", label: "Storage", icon: HardDrive },
  { key: "cdn", label: "CDN", icon: Cloud },
  { key: "database", label: "Database", icon: Database },
  { key: "monitoring", label: "Monitoring", icon: Gauge },
  { key: "errors", label: "Errors", icon: AlertTriangle },
  { key: "audit", label: "Audit", icon: History },
  { key: "backups", label: "Backups", icon: Save },
  { key: "security", label: "Security", icon: Shield },
  { key: "api", label: "API Gateway", icon: Radio },
  { key: "flags", label: "Feature Flags", icon: ToggleLeft },
  { key: "settings", label: "System Settings", icon: Settings },
];

function InfrastructurePage() {
  const [tab, setTab] = useState<TabKey>("overview");
  const [env, setEnv] = useState<string>("production");

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Enterprise</div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Infrastructure</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Health, deployments, monitoring and controls. Values shown reflect live signals where available and
            placeholder telemetry where the backend integration is still pending.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">Environment</div>
          <div className="flex rounded-md border border-border/60 bg-white overflow-hidden">
            {ENVIRONMENTS.map((e) => (
              <button
                key={e.key}
                onClick={() => setEnv(e.key)}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-medium transition-colors",
                  env === e.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface-2/60",
                )}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <nav className="flex gap-1 overflow-x-auto scrollbar-thin border-b border-border/60 -mb-px">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium border-b-2 whitespace-nowrap transition-colors",
                active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" />
              {t.label}
            </button>
          );
        })}
      </nav>

      <div className="min-h-[420px]">
        {tab === "overview" && <OverviewTab />}
        {tab === "deployments" && <DeploymentsTab />}
        {tab === "jobs" && <JobsTab />}
        {tab === "cache" && <CacheTab />}
        {tab === "search" && <SearchTab />}
        {tab === "storage" && <StorageTab />}
        {tab === "cdn" && <CDNTab />}
        {tab === "database" && <DatabaseTab />}
        {tab === "monitoring" && <MonitoringTab />}
        {tab === "errors" && <ErrorsTab />}
        {tab === "audit" && <AuditTab />}
        {tab === "backups" && <BackupsTab />}
        {tab === "security" && <SecurityTab />}
        {tab === "api" && <ApiGatewayTab />}
        {tab === "flags" && <FeatureFlagsTab />}
        {tab === "settings" && <SystemSettingsTab />}
      </div>
    </div>
  );
}

// ─── Reusable primitives ───
function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
        <div className="mt-1 font-display text-xl font-semibold">{value}</div>
        {hint && <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "operational" ? "bg-emerald-500"
    : status === "degraded" || status === "warning" ? "bg-amber-500"
    : status === "down" || status === "critical" || status === "failed" ? "bg-rose-500"
    : status === "pending" || status === "planned" ? "bg-slate-400"
    : "bg-slate-400";
  return <span className={cn("inline-block size-2 rounded-full", color)} />;
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// ─── Overview ───
function OverviewTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Overall Status" value={<span className="flex items-center gap-2"><StatusDot status={SYSTEM_HEALTH.overall} /> {SYSTEM_HEALTH.overall}</span>} />
        <Stat label="Response Time (p50)" value={`${MONITORING.p50_ms}ms`} hint={`p95 ${MONITORING.p95_ms}ms`} />
        <Stat label="Error Rate" value={`${MONITORING.error_rate}%`} hint="last 5 min" />
        <Stat label="Active Users" value={MONITORING.active_users.toLocaleString()} hint={`${MONITORING.rpm.toLocaleString()} rpm`} />
      </div>

      <Section title="Application Status">
        <div className="divide-y divide-border/50">
          {SYSTEM_HEALTH.services.map((s) => (
            <div key={s.name} className="flex items-center justify-between py-2.5 text-sm">
              <div className="flex items-center gap-2.5">
                <StatusDot status={s.status} />
                <span className="font-medium">{s.name}</span>
                {(s as any).note && <span className="text-[11px] text-muted-foreground">{(s as any).note}</span>}
              </div>
              <div className="flex items-center gap-6 text-[12px] text-muted-foreground tabular-nums">
                <span>{s.latency_ms ? `${s.latency_ms}ms` : "-"}</span>
                <span>{s.uptime ? `${s.uptime}%` : "-"}</span>
                <Badge variant="secondary" className="text-[10px] font-mono uppercase">{s.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Latest Deployment">
          {DEPLOYMENTS[0] && (
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono font-semibold">{DEPLOYMENTS[0].version}</span>
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px] font-mono uppercase">{DEPLOYMENTS[0].status}</Badge>
              </div>
              <div className="text-[12px] text-muted-foreground">{fmtRelative(DEPLOYMENTS[0].at)} · {DEPLOYMENTS[0].changes} changes · {DEPLOYMENTS[0].env}</div>
            </div>
          )}
        </Section>
        <Section title="Storage · Backups">
          <div className="text-sm space-y-1.5">
            <div>Last backup <span className="font-medium">{fmtRelative(BACKUPS.last_backup)}</span> · {BACKUPS.size_gb} GB</div>
            <div>Next scheduled <span className="font-medium">{fmtRelative(BACKUPS.next_scheduled)}</span></div>
            <div className="text-[12px] text-muted-foreground">{BACKUPS.retention}</div>
          </div>
        </Section>
      </div>
    </div>
  );
}

// ─── Deployments ───
function DeploymentsTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Current Version" value={<span className="font-mono">{DEPLOYMENTS[0]?.version}</span>} hint="production" />
        <Stat label="Latest Release" value={fmtRelative(DEPLOYMENTS[0]?.at ?? "")} hint={DEPLOYMENTS[0]?.author} />
        <Stat label="Rollback Target" value={<span className="font-mono">{DEPLOYMENTS[1]?.version ?? "-"}</span>} hint="previous stable" />
        <Stat label="Deployments (7d)" value={DEPLOYMENTS.length} />
      </div>
      <Section title="Deployment History" action={<Button size="sm" variant="outline" disabled>Rollback (backend pending)</Button>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
              <tr className="border-b border-border/60"><th className="text-left py-2">Version</th><th className="text-left">Env</th><th className="text-left">Status</th><th className="text-left">Changes</th><th className="text-left">Author</th><th className="text-left">When</th></tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {DEPLOYMENTS.map((d) => (
                <tr key={d.id}>
                  <td className="py-2 font-mono">{d.version}</td>
                  <td className="capitalize">{d.env}</td>
                  <td><span className="inline-flex items-center gap-1.5"><StatusDot status={d.status === "success" ? "operational" : d.status === "rolled_back" ? "warning" : "failed"} /> <span className="capitalize">{d.status.replace("_", " ")}</span></span></td>
                  <td>{d.changes}</td>
                  <td className="text-muted-foreground">{d.author}</td>
                  <td className="text-muted-foreground">{fmtRelative(d.at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <Section title="Deployment Logs">
        <pre className="text-[11px] leading-relaxed bg-surface-2/40 rounded-md p-3 overflow-x-auto font-mono">
{`▸ ${DEPLOYMENTS[0]?.version} • Build succeeded • 2m 14s
▸ Uploading assets to CDN … OK (285 edge regions)
▸ Applying migrations … OK (0 pending)
▸ Health check … 200 OK in 74ms
▸ Traffic shifted to new revision at ${new Date(DEPLOYMENTS[0]?.at ?? Date.now()).toISOString()}`}
        </pre>
      </Section>
    </div>
  );
}

// ─── Jobs ───
function JobsTab() {
  return (
    <div className="space-y-4">
      <Section title="Background Job Queues">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
              <tr className="border-b border-border/60"><th className="text-left py-2">Queue</th><th className="text-right">Queued</th><th className="text-right">Running</th><th className="text-right">Completed</th><th className="text-right">Failed</th><th className="text-right">Avg</th><th className="text-right"></th></tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {JOB_QUEUES.map((q) => (
                <tr key={q.name}>
                  <td className="py-2 font-medium">{q.label}</td>
                  <td className="text-right tabular-nums">{q.queued}</td>
                  <td className="text-right tabular-nums">{q.running}</td>
                  <td className="text-right tabular-nums text-muted-foreground">{q.completed.toLocaleString()}</td>
                  <td className="text-right tabular-nums"><span className={q.failed > 0 ? "text-rose-600 font-medium" : "text-muted-foreground"}>{q.failed}</span></td>
                  <td className="text-right tabular-nums text-muted-foreground">{q.avg_ms}ms</td>
                  <td className="text-right"><Button size="sm" variant="ghost" disabled className="text-[11px]">Retry</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

// ─── Cache ───
function CacheTab() {
  return (
    <div className="space-y-4">
      <Section title="Cache Layers">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CACHE_LAYERS.map((c) => (
            <div key={c.name} className="border border-border/60 rounded-md p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">{c.name}</div>
                <Badge variant="secondary" className="text-[10px] font-mono uppercase"><StatusDot status={c.status === "active" ? "operational" : "pending"} /> <span className="ml-1">{c.status}</span></Badge>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">{c.provider}</div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-[12px]">
                <div><div className="text-muted-foreground">Hit rate</div><div className="font-mono">{c.hit_rate}%</div></div>
                <div><div className="text-muted-foreground">Size</div><div className="font-mono">{c.size_mb} MB</div></div>
                <div><div className="text-muted-foreground">Keys</div><div className="font-mono">{c.keys.toLocaleString()}</div></div>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ─── Search ───
function SearchTab() {
  return (
    <Section title="Search Indexes">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
            <tr className="border-b border-border/60"><th className="text-left py-2">Index</th><th className="text-left">Provider</th><th className="text-right">Docs</th><th className="text-left">Last indexed</th><th className="text-left">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {SEARCH_INDEXES.map((i) => (
              <tr key={i.name}>
                <td className="py-2 font-medium">{i.label}</td>
                <td className="text-muted-foreground">{i.provider}</td>
                <td className="text-right tabular-nums">{i.docs}</td>
                <td className="text-muted-foreground">{i.last_indexed === "-" ? "-" : fmtRelative(i.last_indexed)}</td>
                <td><span className="inline-flex items-center gap-1.5"><StatusDot status={i.status} /> <span className="capitalize">{i.status}</span></span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

// ─── Storage ───
function StorageTab() {
  const totalUsed = STORAGE_BUCKETS.reduce((a, b) => a + b.used_gb, 0);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Storage Used" value={`${totalUsed.toFixed(1)} GB`} hint={`${STORAGE_BUCKETS.reduce((a, b) => a + b.files, 0).toLocaleString()} files`} />
        <Stat label="Storage Available" value="1 TB" hint="pool quota" />
        <Stat label="Large Files (>100MB)" value="34" hint="mostly videos" />
        <Stat label="Failed Uploads (24h)" value="3" />
      </div>
      <Section title="Buckets">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {STORAGE_BUCKETS.map((b) => (
            <div key={b.bucket} className="border border-border/60 rounded-md p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{b.type}</span>
                <span className="text-[11px] font-mono text-muted-foreground">{b.bucket}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[12px] text-muted-foreground">
                <span>{b.used_gb} GB · {b.files.toLocaleString()} files</span>
                <span>{((b.used_gb / 1024) * 100).toFixed(2)}% of pool</span>
              </div>
              <Progress value={Math.min(100, (b.used_gb / 200) * 100)} className="h-1.5 mt-2" />
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ─── CDN ───
function CDNTab() {
  const cells = [
    { label: "Static Assets", value: CDN_METRICS.static_hit_ratio },
    { label: "Images", value: CDN_METRICS.image_hit_ratio },
    { label: "Videos", value: CDN_METRICS.video_hit_ratio },
    { label: "Documents", value: CDN_METRICS.document_hit_ratio },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cells.map((c) => (
          <Card key={c.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">{c.label}</div>
              <div className="mt-1 font-display text-xl font-semibold">{c.value}%</div>
              <Progress value={c.value} className="h-1.5 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Stat label="Bandwidth (24h)" value={`${CDN_METRICS.bandwidth_tb} TB`} />
        <Stat label="Edge Regions" value={CDN_METRICS.edge_regions} hint="Cloudflare" />
        <Stat label="Overall Hit Ratio" value={`${((CDN_METRICS.static_hit_ratio + CDN_METRICS.image_hit_ratio + CDN_METRICS.video_hit_ratio + CDN_METRICS.document_hit_ratio) / 4).toFixed(1)}%`} />
      </div>
    </div>
  );
}

// ─── Database ───
function DatabaseTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Connection Pool" value={`${DB_METRICS.pool_used}/${DB_METRICS.pool_max}`} hint={`${((DB_METRICS.pool_used / DB_METRICS.pool_max) * 100).toFixed(0)}% used`} />
        <Stat label="Queries / sec" value={DB_METRICS.qps.toLocaleString()} />
        <Stat label="Slow Queries" value={DB_METRICS.slow_queries} hint=">500ms" />
        <Stat label="Storage" value={`${DB_METRICS.storage_gb} GB`} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title="Indexes">
          <div className="text-sm">{DB_METRICS.index_count} indexes across public schema.</div>
        </Section>
        <Section title="Replication">
          <div className="text-sm">{DB_METRICS.replication}</div>
        </Section>
      </div>
    </div>
  );
}

// ─── Monitoring ───
function MonitoringTab() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <MetricBar label="CPU" value={MONITORING.cpu_pct} />
      <MetricBar label="Memory" value={MONITORING.memory_pct} />
      <MetricBar label="Disk" value={MONITORING.disk_pct} />
      <Stat label="p95 Response" value={`${MONITORING.p95_ms}ms`} />
      <Stat label="Error Rate" value={`${MONITORING.error_rate}%`} />
      <Stat label="Requests / min" value={MONITORING.rpm.toLocaleString()} />
      <Stat label="Active Users" value={MONITORING.active_users.toLocaleString()} />
      <Stat label="p50 Response" value={`${MONITORING.p50_ms}ms`} />
    </div>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
        <div className="mt-1 font-display text-xl font-semibold">{value}%</div>
        <Progress value={value} className="h-1.5 mt-2" />
      </CardContent>
    </Card>
  );
}

// ─── Errors ───
function ErrorsTab() {
  const [q, setQ] = useState("");
  const [level, setLevel] = useState<string>("all");
  const filtered = useMemo(() => ERRORS.filter((e) =>
    (level === "all" || e.severity === level) &&
    (q === "" || e.message.toLowerCase().includes(q.toLowerCase()))
  ), [q, level]);
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search errors…" className="max-w-sm" />
        <div className="flex gap-1">
          {["all", "critical", "warning", "api"].map((l) => (
            <button key={l} onClick={() => setLevel(l)} className={cn("px-2.5 py-1 rounded-md border text-[11px] font-mono uppercase", level === l ? "border-primary text-primary bg-primary/5" : "border-border/60 text-muted-foreground hover:text-foreground")}>{l}</button>
          ))}
        </div>
      </div>
      <Section title={`Errors (${filtered.length})`}>
        <div className="divide-y divide-border/50">
          {filtered.map((e) => (
            <div key={e.id} className="py-2.5 flex items-start justify-between gap-3 text-sm">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <StatusDot status={e.severity === "critical" ? "critical" : e.severity === "warning" ? "warning" : "pending"} />
                  <span className="font-medium truncate">{e.message}</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{e.source} · first seen {fmtRelative(e.first_seen)}</div>
              </div>
              <Badge variant="secondary" className="text-[10px] font-mono">×{e.count}</Badge>
            </div>
          ))}
          {filtered.length === 0 && <div className="py-6 text-center text-sm text-muted-foreground">No matches.</div>}
        </div>
      </Section>
    </div>
  );
}

// ─── Audit ───
function AuditTab() {
  const events = [
    { at: "2026-07-16T08:12:00Z", actor: "release-bot", action: "deploy.production", detail: "v1.42.0" },
    { at: "2026-07-16T07:44:00Z", actor: "priya@glintr.com", action: "config.update", detail: "AI Gateway model default → gemini-1.5-flash" },
    { at: "2026-07-15T21:04:00Z", actor: "arjun@glintr.com", action: "permission.grant", detail: "finance.view → ravi@glintr.com" },
    { at: "2026-07-15T13:22:00Z", actor: "release-bot", action: "deploy.staging", detail: "v1.41.2" },
    { at: "2026-07-14T00:12:00Z", actor: "system", action: "infra.tls-renew", detail: "glintr.com" },
  ];
  return (
    <Section title="Infrastructure Audit Log">
      <div className="divide-y divide-border/50 text-sm">
        {events.map((e, i) => (
          <div key={i} className="py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-[11px] font-mono text-muted-foreground w-28 shrink-0">{fmtRelative(e.at)}</span>
              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-surface-2/60">{e.action}</span>
              <span className="truncate">{e.detail}</span>
            </div>
            <span className="text-[11px] text-muted-foreground">{e.actor}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ─── Backups ───
function BackupsTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Last Backup" value={fmtRelative(BACKUPS.last_backup)} hint={`${BACKUPS.size_gb} GB`} />
        <Stat label="Next Scheduled" value={fmtRelative(BACKUPS.next_scheduled)} />
        <Stat label="Retention" value="30d / 12w / 24m / 7y" />
        <Stat label="Restores (all-time)" value={BACKUPS.restore_history.length} />
      </div>
      <Section title="Retention Policy"><div className="text-sm">{BACKUPS.retention}</div></Section>
      <Section title="Restore History">
        <div className="divide-y divide-border/50 text-sm">
          {BACKUPS.restore_history.map((r, i) => (
            <div key={i} className="py-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusDot status="operational" />
                <span>Restored to <span className="font-medium">{r.target}</span></span>
                <span className="text-[11px] text-muted-foreground">by {r.initiated_by}</span>
              </div>
              <span className="text-[11px] text-muted-foreground">{fmtRelative(r.at)} · {r.duration_min}m</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ─── Security ───
function SecurityTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Active Sessions" value={SECURITY_METRICS.active_sessions.toLocaleString()} />
        <Stat label="Failed Logins (24h)" value={SECURITY_METRICS.failed_logins_24h} />
        <Stat label="Rate-limit Events (24h)" value={SECURITY_METRICS.rate_limit_events_24h} />
        <Stat label="API Key Calls (24h)" value={SECURITY_METRICS.api_key_calls_24h.toLocaleString()} />
      </div>
      <Section title="Security Alerts">
        <div className="divide-y divide-border/50 text-sm">
          {SECURITY_METRICS.alerts.map((a, i) => (
            <div key={i} className="py-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <StatusDot status={a.level} /> <span className="truncate">{a.message}</span>
              </div>
              <span className="text-[11px] text-muted-foreground">{fmtRelative(a.at)}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ─── API Gateway ───
function ApiGatewayTab() {
  return (
    <Section title="API Versions">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
            <tr className="border-b border-border/60"><th className="text-left py-2">Version</th><th className="text-left">Status</th><th className="text-right">Requests (24h)</th><th className="text-right">p95</th><th className="text-right">Error %</th><th className="text-left">Rate Limit</th></tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {API_VERSIONS.map((v) => (
              <tr key={v.version}>
                <td className="py-2 font-mono font-semibold">{v.version}</td>
                <td><Badge variant="secondary" className="text-[10px] font-mono uppercase">{v.status}</Badge></td>
                <td className="text-right tabular-nums">{v.requests_24h.toLocaleString()}</td>
                <td className="text-right tabular-nums">{v.p95_ms}ms</td>
                <td className="text-right tabular-nums">{v.error_rate}%</td>
                <td className="text-muted-foreground">{v.rate_limit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

// ─── Feature Flags ───
function FeatureFlagsTab() {
  const [flags, setFlagsState] = useState<Record<string, boolean>>({});
  useEffect(() => { setFlagsState(getFlags()); }, []);
  const toggle = (key: string) => {
    const next = !flags[key];
    setFlag(key, next);
    setFlagsState((s) => ({ ...s, [key]: next }));
  };
  const grouped = useMemo(() => {
    const g: Record<string, typeof FEATURE_FLAGS> = { product: [], beta: [], experimental: [] };
    for (const f of FEATURE_FLAGS) g[f.category].push(f);
    return g;
  }, []);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground max-w-2xl">
        Toggle features live. Flags are stored per-browser today; wire to a `feature_flags` table in Part 8B-2 for
        multi-user rollouts, canaries and percentage-based rollouts.
      </p>
      {(["product", "beta", "experimental"] as const).map((cat) => (
        <Section key={cat} title={cat[0].toUpperCase() + cat.slice(1)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {grouped[cat].map((f) => (
              <div key={f.key} className="border border-border/60 rounded-md p-3 flex items-start gap-3">
                <button
                  onClick={() => toggle(f.key)}
                  role="switch"
                  aria-checked={!!flags[f.key]}
                  aria-label={`Toggle ${f.label}`}
                  className={cn(
                    "mt-0.5 w-9 h-5 rounded-full border transition-colors flex-shrink-0 relative",
                    flags[f.key] ? "bg-primary border-primary" : "bg-surface-2 border-border/60",
                  )}
                >
                  <span className={cn("absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-all", flags[f.key] ? "left-[18px]" : "left-0.5")} />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{f.label}</span>
                    <Badge variant="secondary" className="text-[9px] font-mono uppercase">{f.key}</Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{f.description}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      ))}
    </div>
  );
}

// ─── System Settings ───
function SystemSettingsTab() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground max-w-2xl">
        Provider bindings for the platform. Secret values are never rendered — connect and rotate credentials via
        Cloud → Secrets. Editing is disabled here and lives on each provider's settings page.
      </p>
      <Section title="Environment Variables">
        <div className="text-sm text-muted-foreground">
          Managed via Cloud → Secrets. Runtime secrets are injected into server functions at request time and are
          never exposed to the browser.
        </div>
      </Section>
      <Section title="Provider Bindings">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SYSTEM_PROVIDERS.map((p) => (
            <div key={p.key} className="border border-border/60 rounded-md p-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">{p.label}</div>
              <div className="mt-0.5 text-sm font-medium">{p.value}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
