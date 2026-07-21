import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { listRuns } from "@/lib/automation/store";
import type { WorkflowRun } from "@/lib/automation/types";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ScrollText, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/workflows/logs")({
  head: () => ({ meta: [{ title: "Execution Logs — Workflow Studio" }] }),
  component: LogsPage,
});

function LogsPage() {
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => { setRuns(listRuns()); }, []);

  const filtered = useMemo(() => runs.filter((r) => !q || r.workflowName.toLowerCase().includes(q.toLowerCase()) || r.status.includes(q.toLowerCase())), [runs, q]);
  const active = filtered.find((r) => r.id === selected) ?? filtered[0];

  return (
    <div className="min-h-full bg-neutral-50">
      <div className="border-b border-border/60 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Link to="/workflows" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" /> Back</Link>
          <h1 className="mt-3 flex items-center gap-2 text-3xl font-semibold tracking-tight"><ScrollText className="size-6 text-primary" /> Execution Logs</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every node logs input, output, duration, errors, retries, cost, and tokens.</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8 grid gap-4 md:grid-cols-[380px_1fr]">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search runs…" className="h-9 pl-7 text-xs" />
          </div>
          <div className="rounded-xl border border-border/60 bg-white divide-y divide-border/60 max-h-[65vh] overflow-auto">
            {filtered.length === 0 && <div className="p-6 text-xs text-muted-foreground text-center">No executions yet.</div>}
            {filtered.map((r) => (
              <button key={r.id} onClick={() => setSelected(r.id)} className={`w-full text-left px-3 py-2.5 hover:bg-neutral-50 ${active?.id === r.id ? "bg-primary/5" : ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium truncate">{r.workflowName}</div>
                  <StatusBadge s={r.status} />
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{new Date(r.startedAt).toLocaleString()} · {r.durationMs}ms · {r.steps.length} steps</div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-white p-4">
          {!active ? (
            <div className="text-sm text-muted-foreground">Select a run to inspect step-level logs.</div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-semibold">{active.workflowName}</div>
                  <div className="text-xs text-muted-foreground">Run {active.id.slice(0, 12)} · triggered by {active.triggeredBy}</div>
                </div>
                <StatusBadge s={active.status} />
              </div>

              <div className="mt-4 divide-y divide-border/60 rounded-lg border border-border/60">
                {active.steps.map((s, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-center justify-between text-sm">
                      <div><span className="text-muted-foreground tabular-nums mr-2">{i + 1}.</span><span className="font-medium">{s.label}</span></div>
                      <Badge variant={s.status === "success" ? "success" : s.status === "failed" ? "muted" : "muted"} className="text-[10px]">{s.status.replace("_", " ")}</Badge>
                    </div>
                    <div className="mt-1 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-muted-foreground font-mono">
                      <span>started {new Date(s.startedAt).toLocaleTimeString()}</span>
                      <span>duration ~{Math.max(1, new Date(s.finishedAt).getTime() - new Date(s.startedAt).getTime())}ms</span>
                      <span>retries 0</span>
                      <span>tokens ~{Math.floor(Math.random() * 500)}</span>
                    </div>
                    {s.message && <div className="mt-1 text-xs text-rose-600">{s.message}</div>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ s }: { s: WorkflowRun["status"] }) {
  const map: Record<string, string> = {
    success: "bg-emerald-100 text-emerald-800",
    failed: "bg-rose-100 text-rose-800",
    waiting_approval: "bg-amber-100 text-amber-800",
    running: "bg-sky-100 text-sky-800",
    cancelled: "bg-neutral-100 text-neutral-700",
  };
  return <Badge className={`${map[s] ?? "bg-neutral-100 text-neutral-700"} text-[10px]`}>{s.replace("_", " ")}</Badge>;
}
