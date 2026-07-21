import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { listRuns, analytics } from "@/lib/automation/store";
import type { WorkflowRun } from "@/lib/automation/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Activity, CheckCircle2, XCircle, Clock, Pause, PlayCircle, Zap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/workflows/executions")({
  head: () => ({ meta: [{ title: "Workflow Executions — Workflow Studio" }] }),
  component: ExecutionsPage,
});

const STATUSES = ["all", "success", "running", "waiting_approval", "failed", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

function ExecutionsPage() {
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [status, setStatus] = useState<Status>("all");
  useEffect(() => { setRuns(listRuns()); }, []);
  const stats = useMemo(() => analytics(), [runs]);

  const filtered = runs.filter((r) => status === "all" ? true : r.status === status);

  return (
    <div className="min-h-full bg-neutral-50">
      <div className="border-b border-border/60 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Link to="/workflows" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" /> Back</Link>
          <h1 className="mt-3 flex items-center gap-2 text-3xl font-semibold tracking-tight"><Activity className="size-6 text-primary" /> Executions</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every workflow run — with status, duration, credits, API calls, and retries.</p>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { k: "Total runs", v: stats.runs, i: Activity },
              { k: "Success rate", v: `${stats.rate}%`, i: CheckCircle2 },
              { k: "Avg runtime", v: `${stats.avgMs}ms`, i: Clock },
              { k: "Active workflows", v: stats.active, i: Zap },
            ].map((s) => (
              <div key={s.k} className="rounded-xl border border-border/60 bg-white px-4 py-3">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground"><s.i className="size-3.5" /> {s.k}</div>
                <div className="mt-1 text-2xl font-semibold tabular-nums">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-4">
        <div className="flex gap-1 rounded-md border border-border/60 bg-white p-1 w-fit">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={`px-2.5 py-1 text-[11px] rounded ${status === s ? "bg-primary text-primary-foreground" : "hover:bg-neutral-100"}`}>{s.replace("_", " ")}</button>
          ))}
        </div>

        <div className="rounded-xl border border-border/60 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2">Workflow</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Started</th>
                <th className="text-left px-4 py-2">Duration</th>
                <th className="text-left px-4 py-2">Steps</th>
                <th className="text-left px-4 py-2">Trigger</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground text-sm">No executions match.</td></tr>}
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <Link to="/workflows/$id" params={{ id: r.workflowId }} className="font-medium hover:text-primary">{r.workflowName}</Link>
                  </td>
                  <td className="px-4 py-3"><StatusIcon s={r.status} /></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(r.startedAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs tabular-nums">{r.durationMs}ms</td>
                  <td className="px-4 py-3 text-xs tabular-nums">{r.steps.length}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{r.triggeredBy}</td>
                  <td className="px-4 py-3 text-right"><Button asChild size="sm" variant="ghost"><Link to="/workflows/logs">Logs</Link></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusIcon({ s }: { s: WorkflowRun["status"] }) {
  if (s === "success") return <Badge className="bg-emerald-100 text-emerald-800 text-[10px]"><CheckCircle2 className="size-3 mr-1" />success</Badge>;
  if (s === "failed") return <Badge className="bg-rose-100 text-rose-800 text-[10px]"><XCircle className="size-3 mr-1" />failed</Badge>;
  if (s === "waiting_approval") return <Badge className="bg-amber-100 text-amber-800 text-[10px]"><Pause className="size-3 mr-1" />waiting</Badge>;
  if (s === "running") return <Badge className="bg-sky-100 text-sky-800 text-[10px]"><PlayCircle className="size-3 mr-1" />running</Badge>;
  return <Badge variant="muted" className="text-[10px]">{s}</Badge>;
}
