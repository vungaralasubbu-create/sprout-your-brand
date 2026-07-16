import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AutomationHeader } from "@/components/automation/header";
import { listRuns } from "@/lib/automation/store";
import type { WorkflowRun } from "@/lib/automation/types";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/automation/history")({
  component: History,
});

function statusBadge(status: WorkflowRun["status"]) {
  if (status === "success") return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200"><CheckCircle2 className="size-3 mr-1" />success</Badge>;
  if (status === "failed") return <Badge className="bg-rose-100 text-rose-800 border-rose-200"><XCircle className="size-3 mr-1" />failed</Badge>;
  if (status === "waiting_approval") return <Badge className="bg-amber-100 text-amber-800 border-amber-200">approval</Badge>;
  return <Badge variant="muted"><Clock className="size-3 mr-1" />{status}</Badge>;
}

function History() {
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "success" | "failed" | "waiting_approval">("all");

  useEffect(() => { setRuns(listRuns()); }, []);

  const filtered = runs.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (q && !r.workflowName.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <AutomationHeader title="Execution History" description="Every workflow run, step-by-step, with retries and failures." />
      <div className="flex gap-2 flex-wrap">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search workflows…" className="max-w-xs h-8 text-xs" />
        <div className="flex gap-1 rounded-md border border-border/60 bg-white p-1">
          {(["all", "success", "failed", "waiting_approval"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-2 py-1 text-[11px] rounded ${filter === f ? "bg-primary text-primary-foreground" : "hover:bg-neutral-100"}`}>{f.replace("_", " ")}</button>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-border/60 bg-white divide-y divide-border/60">
        {filtered.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No runs match your filters.</div>}
        {filtered.map((r) => (
          <details key={r.id} className="group">
            <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 hover:bg-neutral-50">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium truncate">{r.workflowName}</span>
                  {statusBadge(r.status)}
                </div>
                <div className="text-xs text-muted-foreground">{new Date(r.startedAt).toLocaleString()} · triggered by {r.triggeredBy}</div>
              </div>
              <div className="text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">{r.durationMs ?? "-"} ms · {r.steps.length} steps</div>
            </summary>
            <div className="px-4 pb-4">
              <div className="mt-2 rounded-md border border-border/60 bg-neutral-50">
                {r.steps.map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 px-3 py-2 border-b border-border/60 last:border-0 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground tabular-nums">{i + 1}.</span>
                      <span className="font-medium">{s.label}</span>
                      {s.message && <span className="text-muted-foreground">— {s.message}</span>}
                    </div>
                    {statusBadge(s.status as any)}
                  </div>
                ))}
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
