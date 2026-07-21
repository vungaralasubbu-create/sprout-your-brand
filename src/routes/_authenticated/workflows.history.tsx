import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listAudit, listWorkflows } from "@/lib/automation/store";
import type { AuditEntry, Workflow } from "@/lib/automation/types";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, History as HistoryIcon, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/workflows/history")({
  head: () => ({ meta: [{ title: "Workflow History — Workflow Studio" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [wfs, setWfs] = useState<Workflow[]>([]);
  const [q, setQ] = useState("");
  useEffect(() => { setAudit(listAudit()); setWfs(listWorkflows()); }, []);
  const filtered = audit.filter((a) => !q || a.workflowName.toLowerCase().includes(q.toLowerCase()) || a.event.includes(q.toLowerCase()));

  return (
    <div className="min-h-full bg-neutral-50">
      <div className="border-b border-border/60 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <Link to="/workflows" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" /> Back</Link>
          <h1 className="mt-3 flex items-center gap-2 text-3xl font-semibold tracking-tight"><HistoryIcon className="size-6 text-primary" /> Workflow History</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every version publish, rollback, edit, and deletion — with author, timestamp, and diff pointer.</p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8 space-y-4">
        <div className="relative w-72">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events, workflows…" className="h-9 pl-7 text-xs" />
        </div>

        <div className="rounded-xl border border-border/60 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2">When</th>
                <th className="text-left px-4 py-2">Actor</th>
                <th className="text-left px-4 py-2">Event</th>
                <th className="text-left px-4 py-2">Workflow</th>
                <th className="text-left px-4 py-2">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">No history yet.</td></tr>}
              {filtered.map((a) => {
                const wf = wfs.find((w) => w.id === a.workflowId);
                return (
                  <tr key={a.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(a.at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs">{a.actor}</td>
                    <td className="px-4 py-3"><Badge variant="muted" className="text-[10px] uppercase">{a.event.replace("_", " ")}</Badge></td>
                    <td className="px-4 py-3 text-sm">
                      {wf ? <Link to="/workflows/$id" params={{ id: wf.id }} className="hover:text-primary">{a.workflowName}</Link> : <span className="text-muted-foreground">{a.workflowName}</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{a.detail ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
