import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getIntelligenceDashboard } from "@/lib/admin/content-intelligence.functions";
import { Card } from "@/components/ui/card";
import { Brain, FileText, Clock, ShieldCheck, AlertTriangle, Copy, LinkIcon, ImageOff } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/content-intelligence/")({
  component: Dashboard,
});

function Dashboard() {
  const fn = useServerFn(getIntelligenceDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["ci-dashboard"], queryFn: () => fn(), staleTime: 30_000 });

  const h = data?.health;

  return (
    <div className="space-y-6 max-w-7xl">
      <header>
        <h1 className="font-display text-2xl font-semibold flex items-center gap-2"><Brain className="size-5 text-primary" /> Content Intelligence</h1>
        <p className="text-sm text-muted-foreground">A living view of what the knowledge library covers, what needs work, and what's next.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={FileText} label="Published" value={data?.published} loading={isLoading} />
        <Kpi icon={ShieldCheck} label="In review" value={data?.inReview} tone="warn" loading={isLoading} />
        <Kpi icon={Clock} label="Stale (180d+)" value={data?.staleCount} tone="warn" loading={isLoading} />
        <Kpi icon={AlertTriangle} label="Overall health" value={`${h?.overall ?? 0}/100`} tone="info" loading={isLoading} />
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold mb-4">Content health across dimensions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {h && Object.entries({
            Readability: h.readability, Structure: h.structure, SEO: h.seo, GEO: h.geo,
            "Internal links": h.linking, Accessibility: h.accessibility, Completeness: h.completeness,
            Media: h.media, Freshness: h.freshness,
          }).map(([k, v]) => <MiniBar key={k} label={k} value={v} />)}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <SignalCard icon={Copy} title="Duplicate title risk" value={data?.dupeTitles ?? 0} to="/admin/content-intelligence/gaps" />
        <SignalCard icon={LinkIcon} title="Potentially broken links" value={data?.brokenLinks ?? 0} to="/admin/content-intelligence/graph-health" />
        <SignalCard icon={ImageOff} title="Missing metadata" value={data?.missingMeta ?? 0} to="/admin/content-intelligence/tasks" />
        <SignalCard icon={Clock} title="Ready for refresh" value={data?.staleCount ?? 0} to="/admin/content-intelligence/freshness" />
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold mb-3">Knowledge coverage by content type</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          {data && Object.entries(data.typeCoverage).map(([k, v]) => (
            <div key={k} className="rounded border border-border/60 bg-surface-2/40 p-3">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</div>
              <div className="text-lg font-semibold">{v as number}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, tone, loading }: any) {
  const toneCls = tone === "warn" ? "text-amber-600" : tone === "info" ? "text-primary" : tone === "good" ? "text-emerald-600" : "text-foreground";
  return (
    <Card className="p-4">
      <div className={`flex items-center gap-1.5 text-[11px] uppercase tracking-wide ${toneCls}`}><Icon className="size-3.5" /> {label}</div>
      <div className="mt-1 text-2xl font-semibold">{loading ? "—" : (value ?? "—")}</div>
    </Card>
  );
}
function MiniBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1"><span className="text-muted-foreground">{label}</span><span className="font-mono">{value}</span></div>
      <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
        <div className={`h-full ${value >= 70 ? "bg-emerald-500" : value >= 40 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}
function SignalCard({ icon: Icon, title, value, to }: any) {
  return (
    <Link to={to as any} className="block">
      <Card className="p-4 hover:border-primary/40 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium"><Icon className="size-4 text-muted-foreground" /> {title}</div>
          <div className="text-2xl font-semibold">{value}</div>
        </div>
      </Card>
    </Link>
  );
}
