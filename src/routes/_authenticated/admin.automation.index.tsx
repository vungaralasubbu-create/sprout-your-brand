import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AutomationHeader } from "@/components/automation/header";
import { analytics, listWorkflows, listRuns } from "@/lib/automation/store";
import type { Workflow, WorkflowRun } from "@/lib/automation/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle2, XCircle, Clock, Zap, Plus, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/automation/")({
  component: AutomationHome,
});

function Stat({ label, value, icon: Icon, tone = "default" }: any) {
  const tones: Record<string, string> = {
    default: "text-foreground",
    success: "text-emerald-600",
    danger: "text-rose-600",
    warn: "text-amber-600",
    primary: "text-primary",
  };
  return (
    <div className="rounded-lg border border-border/60 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className={`mt-2 text-2xl font-semibold ${tones[tone]}`}>{value}</p>
    </div>
  );
}

function AutomationHome() {
  const [wfs, setWfs] = useState<Workflow[]>([]);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [stats, setStats] = useState(() => ({ active: 0, draft: 0, scheduled: 0, total: 0, runs: 0, successCount: 0, failCount: 0, rate: 0, avgMs: 0, popular: [] as any[] }));

  useEffect(() => {
    setWfs(listWorkflows());
    setRuns(listRuns());
    setStats(analytics());
  }, []);

  const failed = runs.filter((r) => r.status === "failed").slice(0, 5);

  return (
    <div className="space-y-6">
      <AutomationHeader
        title="Automation Home"
        description="Automate onboarding, sales follow-ups, content publishing, payouts and support with a visual, no-code workflow builder."
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm"><Link to="/admin/workflows/templates">Browse Templates</Link></Button>
            <Button asChild size="sm"><Link to="/admin/workflows/new"><Plus className="size-3.5 mr-1" /> New Workflow</Link></Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Active" value={stats.active} icon={Zap} tone="primary" />
        <Stat label="Drafts" value={stats.draft} icon={Clock} />
        <Stat label="Scheduled" value={stats.scheduled} icon={Activity} />
        <Stat label="Success Rate" value={`${stats.rate}%`} icon={TrendingUp} tone="success" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="md:col-span-2 rounded-lg border border-border/60 bg-white">
          <div className="p-4 border-b border-border/60 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Popular Automations</h2>
            <Link to="/admin/workflows" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-border/60">
            {wfs.length === 0 && <div className="p-6 text-sm text-muted-foreground">No workflows yet. Start from a template.</div>}
            {wfs.slice(0, 6).map((wf) => (
              <Link key={wf.id} to="/admin/workflows/$id" params={{ id: wf.id }} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-neutral-50">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-sm font-medium truncate">{wf.name}</div>
                    <Badge variant={wf.status === "active" ? "default" : "muted"} className="text-[10px]">{wf.status}</Badge>
                    <span className="text-[11px] text-muted-foreground">v{wf.version}</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{wf.description}</div>
                </div>
                <div className="text-[11px] text-muted-foreground whitespace-nowrap">{wf.nodes.length} blocks</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-border/60 bg-white">
          <div className="p-4 border-b border-border/60"><h2 className="text-sm font-semibold">Execution Snapshot</h2></div>
          <div className="p-4 space-y-3 text-sm">
            <Row icon={CheckCircle2} tone="text-emerald-600" label="Successful runs" value={stats.successCount} />
            <Row icon={XCircle} tone="text-rose-600" label="Failed runs" value={stats.failCount} />
            <Row icon={Clock} tone="text-muted-foreground" label="Average runtime" value={`${stats.avgMs} ms`} />
            <Row icon={Activity} tone="text-muted-foreground" label="Total runs" value={stats.runs} />
          </div>
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-border/60 bg-white">
          <div className="p-4 border-b border-border/60 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Failed Runs</h2>
            <Link to="/admin/automation/history" className="text-xs text-primary hover:underline">All runs</Link>
          </div>
          <div className="divide-y divide-border/60">
            {failed.length === 0 && <div className="p-4 text-xs text-muted-foreground">No failures 🎉</div>}
            {failed.map((r) => (
              <div key={r.id} className="p-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium truncate">{r.workflowName}</span>
                  <span className="text-rose-600">failed</span>
                </div>
                <div className="mt-1 text-muted-foreground">{new Date(r.startedAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-lg border border-border/60 bg-white">
          <div className="p-4 border-b border-border/60"><h2 className="text-sm font-semibold">Most Used Actions</h2></div>
          <div className="p-4 space-y-2">
            {stats.popular.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between text-xs">
                <span className="truncate">{p.label}</span>
                <span className="tabular-nums font-medium">{p.count}</span>
              </div>
            ))}
            {stats.popular.length === 0 && <div className="text-xs text-muted-foreground">No data yet.</div>}
          </div>
        </section>
      </div>
    </div>
  );
}

function Row({ icon: Icon, tone, label, value }: any) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-muted-foreground"><Icon className={`size-4 ${tone}`} /> {label}</span>
      <span className="tabular-nums font-medium">{value}</span>
    </div>
  );
}
