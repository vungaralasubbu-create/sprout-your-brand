import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { getWorkflow, saveWorkflow, publishWorkflow, rollbackWorkflow, testRunWorkflow } from "@/lib/automation/store";
import type { Workflow, WorkflowRun } from "@/lib/automation/types";
import { AutomationCanvas } from "@/components/automation/canvas";
import { BlockPalette } from "@/components/automation/block-palette";
import { NodeInspector } from "@/components/automation/inspector";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Save, Undo2, Redo2, GitBranch, Rocket, History, CheckCircle2, XCircle, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/workflows/$id")({
  component: WorkflowBuilder,
});

function WorkflowBuilder() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const [wf, setWf] = useState<Workflow | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<"builder" | "history" | "runs">("builder");
  const [lastRun, setLastRun] = useState<WorkflowRun | null>(null);
  const [saving, setSaving] = useState(false);

  const undoStack = useRef<Workflow[]>([]);
  const redoStack = useRef<Workflow[]>([]);

  useEffect(() => {
    const found = getWorkflow(id);
    if (!found) { nav({ to: "/admin/workflows" }); return; }
    setWf(found);
  }, [id, nav]);

  // Autosave (debounced)
  const autosaveTimer = useRef<any>(null);
  function updateWf(next: Workflow, pushUndo = true) {
    if (pushUndo && wf) { undoStack.current.push(wf); if (undoStack.current.length > 40) undoStack.current.shift(); redoStack.current = []; }
    setWf(next);
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => { saveWorkflow(next); }, 500);
  }
  function manualSave() { if (!wf) return; setSaving(true); saveWorkflow(wf); setTimeout(() => setSaving(false), 400); }
  function undo() { if (!wf || !undoStack.current.length) return; const prev = undoStack.current.pop()!; redoStack.current.push(wf); setWf(prev); saveWorkflow(prev); }
  function redo() { if (!wf || !redoStack.current.length) return; const nxt = redoStack.current.pop()!; undoStack.current.push(wf); setWf(nxt); saveWorkflow(nxt); }

  function testRun() { if (!wf) return; const run = testRunWorkflow(wf.id); setLastRun(run); setTab("runs"); }
  function publish() {
    if (!wf) return;
    const note = prompt("Publish note (optional):") ?? undefined;
    publishWorkflow(wf.id, note);
    const fresh = getWorkflow(wf.id); if (fresh) setWf(fresh);
  }
  function rollback(v: number) { if (!wf) return; rollbackWorkflow(wf.id, v); const fresh = getWorkflow(wf.id); if (fresh) setWf(fresh); }

  const validation = useMemo(() => {
    if (!wf) return { errors: [] as string[] };
    const errs: string[] = [];
    if (!wf.nodes.some((n) => n.kind === "trigger")) errs.push("Workflow must have a Trigger block.");
    if (!wf.nodes.some((n) => n.kind === "end")) errs.push("Workflow should end with an End block.");
    return { errors: errs };
  }, [wf]);

  if (!wf) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <header className="border-b border-border/60 bg-white px-4 py-2.5 flex items-center gap-3 flex-wrap">
        <Link to="/admin/workflows" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /></Link>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <input value={wf.name} onChange={(e) => updateWf({ ...wf, name: e.target.value })} className="text-sm font-semibold bg-transparent border-0 outline-none focus:ring-1 focus:ring-primary rounded px-1 -mx-1 min-w-[10rem]" />
            <Badge variant={wf.status === "active" ? "default" : "secondary"} className="text-[10px]">{wf.status}</Badge>
            <span className="text-[11px] text-muted-foreground">v{wf.version}</span>
            {saving && <span className="text-[11px] text-muted-foreground">saving…</span>}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <div className="flex gap-1 mr-2 border-r border-border/60 pr-2">
            <Button size="sm" variant="ghost" onClick={undo} disabled={!undoStack.current.length}><Undo2 className="size-3.5" /></Button>
            <Button size="sm" variant="ghost" onClick={redo} disabled={!redoStack.current.length}><Redo2 className="size-3.5" /></Button>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setTab("builder")} className={tab === "builder" ? "bg-neutral-100" : ""}><GitBranch className="size-3.5 mr-1" />Builder</Button>
          <Button size="sm" variant="ghost" onClick={() => setTab("history")} className={tab === "history" ? "bg-neutral-100" : ""}><History className="size-3.5 mr-1" />Versions</Button>
          <Button size="sm" variant="ghost" onClick={() => setTab("runs")} className={tab === "runs" ? "bg-neutral-100" : ""}><Clock className="size-3.5 mr-1" />Runs</Button>
          <Button size="sm" variant="outline" onClick={manualSave}><Save className="size-3.5 mr-1" />Save</Button>
          <Button size="sm" variant="outline" onClick={testRun}><Play className="size-3.5 mr-1" />Test Run</Button>
          <Button size="sm" onClick={publish} disabled={validation.errors.length > 0}><Rocket className="size-3.5 mr-1" />Publish</Button>
        </div>
      </header>

      {validation.errors.length > 0 && (
        <div className="border-b border-amber-200 bg-amber-50 text-amber-900 text-xs px-4 py-2">
          {validation.errors.join(" · ")}
        </div>
      )}

      {tab === "builder" && (
        <div className="flex-1 min-h-0 grid grid-cols-[220px_1fr_300px]">
          <aside className="border-r border-border/60 bg-white overflow-hidden"><BlockPalette /></aside>
          <div className="relative bg-neutral-50 overflow-hidden">
            <AutomationCanvas workflow={wf} onChange={(n) => updateWf(n)} selectedId={selected} onSelect={setSelected} />
          </div>
          <aside className="border-l border-border/60 bg-white overflow-y-auto"><NodeInspector workflow={wf} nodeId={selected} onChange={(n) => updateWf(n)} onSelect={setSelected} /></aside>
        </div>
      )}

      {tab === "history" && (
        <div className="flex-1 min-h-0 overflow-auto p-6 bg-neutral-50">
          <div className="max-w-3xl mx-auto rounded-lg border border-border/60 bg-white divide-y divide-border/60">
            {wf.history.slice().reverse().map((h) => (
              <div key={h.version} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <div className="text-sm font-medium">Version {h.version}{h.version === wf.version && <Badge className="ml-2 text-[10px]">current</Badge>}</div>
                  <div className="text-xs text-muted-foreground">{new Date(h.publishedAt).toLocaleString()} · {h.editor}{h.note ? ` · ${h.note}` : ""}</div>
                </div>
                {h.version !== wf.version && <Button size="sm" variant="outline" onClick={() => rollback(h.version)}>Rollback</Button>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "runs" && (
        <div className="flex-1 min-h-0 overflow-auto p-6 bg-neutral-50">
          <div className="max-w-3xl mx-auto space-y-3">
            {!lastRun && <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No test runs in this session. Click <b>Test Run</b> above to simulate.</div>}
            {lastRun && (
              <div className="rounded-lg border border-border/60 bg-white">
                <div className="p-4 border-b border-border/60 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">Latest Test Run</div>
                    <div className="text-xs text-muted-foreground">{new Date(lastRun.startedAt).toLocaleString()} · {lastRun.durationMs} ms</div>
                  </div>
                  {lastRun.status === "success" ? <Badge className="bg-emerald-100 text-emerald-800"><CheckCircle2 className="size-3 mr-1" />success</Badge>
                   : lastRun.status === "failed" ? <Badge className="bg-rose-100 text-rose-800"><XCircle className="size-3 mr-1" />failed</Badge>
                   : <Badge variant="muted">{lastRun.status.replace("_", " ")}</Badge>}
                </div>
                <div className="divide-y divide-border/60">
                  {lastRun.steps.map((s, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2 text-xs">
                      <div><span className="text-muted-foreground tabular-nums mr-2">{i + 1}.</span><span className="font-medium">{s.label}</span>{s.message && <span className="text-muted-foreground"> — {s.message}</span>}</div>
                      <Badge variant={s.status === "success" ? "default" : "secondary"} className="text-[10px]">{s.status.replace("_", " ")}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
