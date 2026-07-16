import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AutomationHeader } from "@/components/automation/header";
import { listWorkflows, deleteWorkflow, duplicateWorkflow, createWorkflowFromTemplate } from "@/lib/automation/store";
import type { Workflow } from "@/lib/automation/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Copy, Trash2, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/workflows/")({
  component: WorkflowsList,
});

function WorkflowsList() {
  const nav = useNavigate();
  const [wfs, setWfs] = useState<Workflow[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | Workflow["status"]>("all");

  function refresh() { setWfs(listWorkflows()); }
  useEffect(() => { refresh(); }, []);

  const filtered = wfs.filter((w) => {
    if (filter !== "all" && w.status !== filter) return false;
    if (q && !(w.name.toLowerCase().includes(q.toLowerCase()) || w.description.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <AutomationHeader
        title="Workflows"
        description="Design, test and version every automation. Drag blocks, connect steps, publish."
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm"><Link to="/admin/workflows/templates">Templates</Link></Button>
            <Button size="sm" onClick={() => { const wf = createWorkflowFromTemplate("__blank__"); nav({ to: "/admin/workflows/$id", params: { id: wf.id } }); }}>
              <Plus className="size-3.5 mr-1" /> New Workflow
            </Button>
          </div>
        }
      />
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search workflows, triggers, actions…" className="h-8 pl-7 w-80 text-xs" />
        </div>
        <div className="flex gap-1 rounded-md border border-border/60 bg-white p-1">
          {(["all", "active", "draft", "scheduled", "paused"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-2 py-1 text-[11px] rounded ${filter === f ? "bg-primary text-primary-foreground" : "hover:bg-neutral-100"}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2">Name</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Trigger</th>
              <th className="text-left px-4 py-2">Blocks</th>
              <th className="text-left px-4 py-2">Version</th>
              <th className="text-left px-4 py-2">Updated</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground text-sm">No workflows match. <Link className="text-primary hover:underline" to="/admin/workflows/templates">Start from a template</Link>.</td></tr>
            )}
            {filtered.map((w) => (
              <tr key={w.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <Link to="/admin/workflows/$id" params={{ id: w.id }} className="font-medium hover:text-primary">{w.name}</Link>
                  <div className="text-xs text-muted-foreground line-clamp-1">{w.description}</div>
                </td>
                <td className="px-4 py-3"><Badge variant={w.status === "active" ? "default" : "muted"} className="text-[10px]">{w.status}</Badge></td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{w.trigger}</td>
                <td className="px-4 py-3 text-xs tabular-nums">{w.nodes.length}</td>
                <td className="px-4 py-3 text-xs tabular-nums">v{w.version}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(w.updatedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { duplicateWorkflow(w.id); refresh(); }}><Copy className="size-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => { if (confirm(`Delete "${w.name}"?`)) { deleteWorkflow(w.id); refresh(); } }}><Trash2 className="size-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
