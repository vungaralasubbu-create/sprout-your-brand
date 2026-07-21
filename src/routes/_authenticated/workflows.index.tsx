import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  listWorkflows, deleteWorkflow, duplicateWorkflow, createWorkflowFromTemplate, analytics,
} from "@/lib/automation/store";
import type { Workflow } from "@/lib/automation/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sparkles, Plus, Search, Copy, Trash2, Workflow as WorkflowIcon,
  Wand2, LibraryBig, Activity, History, Zap, ArrowRight, PlayCircle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/workflows/")({
  head: () => ({ meta: [
    { title: "Workflow Studio — Automate Your Business with AI" },
    { name: "description", content: "Design visual workflows or generate them with AI. Automate marketing, sales, support, and operations across every integration." },
  ]}),
  component: WorkflowsHome,
});

function WorkflowsHome() {
  const nav = useNavigate();
  const [wfs, setWfs] = useState<Workflow[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | Workflow["status"]>("all");
  const [aiPrompt, setAiPrompt] = useState("");
  const [genBusy, setGenBusy] = useState(false);

  function refresh() { setWfs(listWorkflows()); }
  useEffect(() => { refresh(); }, []);

  const stats = useMemo(() => analytics(), [wfs]);

  const filtered = wfs.filter((w) => {
    if (filter !== "all" && w.status !== filter) return false;
    if (q && !(w.name.toLowerCase().includes(q.toLowerCase()) || w.description.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });

  function newBlank() {
    const wf = createWorkflowFromTemplate("__blank__");
    nav({ to: "/workflows/$id", params: { id: wf.id } });
  }

  function generateFromPrompt() {
    if (!aiPrompt.trim()) return;
    setGenBusy(true);
    // Reuse blank; drop prompt into name+description so the builder can consume it.
    setTimeout(() => {
      const wf = createWorkflowFromTemplate("__blank__");
      wf.name = aiPrompt.trim().slice(0, 60);
      wf.description = aiPrompt.trim();
      wf.tags = ["ai-generated"];
      // Persist tweaked metadata
      import("@/lib/automation/store").then((s) => {
        s.saveWorkflow(wf);
        nav({ to: "/workflows/$id", params: { id: wf.id }, search: { generated: 1 } as never });
      });
    }, 300);
  }

  return (
    <div className="min-h-full bg-neutral-50">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-white via-white to-primary/5">
        <div className="pointer-events-none absolute -top-32 -right-32 size-96 rounded-full bg-gradient-to-br from-primary/30 via-fuchsia-400/20 to-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 size-96 rounded-full bg-gradient-to-tr from-emerald-400/20 via-cyan-400/20 to-primary/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6 py-14 md:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white/70 px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-muted-foreground backdrop-blur">
            <Sparkles className="size-3.5 text-primary" /> Workflow Studio
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl md:text-6xl font-semibold tracking-tight">
            Automate Your <span className="bg-gradient-to-r from-primary via-fuchsia-500 to-cyan-500 bg-clip-text text-transparent">Business with AI</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base md:text-lg text-muted-foreground">
            Create workflows visually or describe them in plain English. Every trigger, every action, every integration — orchestrated on one canvas.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={newBlank}><Plus className="size-4 mr-2" /> Create Workflow</Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById("ai-gen")?.focus()}><Wand2 className="size-4 mr-2" /> Generate with AI</Button>
            <Button size="lg" variant="outline" asChild><Link to="/workflows/templates"><LibraryBig className="size-4 mr-2" /> Browse Templates</Link></Button>
          </div>

          {/* AI prompt bar */}
          <div className="mt-8 rounded-2xl border border-border/60 bg-white/80 p-2 shadow-lg backdrop-blur">
            <div className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3">
              <Wand2 className="size-4 text-primary shrink-0" />
              <Input
                id="ai-gen"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") generateFromPrompt(); }}
                placeholder='e.g. "When a lead form is submitted, generate a personalized email, create a CRM lead, notify Slack, and schedule a follow-up after 3 days."'
                className="h-12 border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
              />
              <Button onClick={generateFromPrompt} disabled={!aiPrompt.trim() || genBusy}>
                {genBusy ? "Generating…" : (<>Generate <ArrowRight className="size-4 ml-1" /></>)}
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5 px-3 pb-2">
              {[
                "Lead nurture in 7 days",
                "Abandoned cart recovery",
                "Course admissions follow-up",
                "Weekly campaign report",
                "Notify Slack on payment received",
              ].map((s) => (
                <button key={s} onClick={() => setAiPrompt(s)} className="rounded-full border border-border/60 bg-white px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/40">
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* stat strip */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { k: "Active", v: stats.active, i: Zap, c: "text-emerald-600" },
              { k: "Runs", v: stats.runs, i: Activity, c: "text-sky-600" },
              { k: "Success", v: `${stats.rate}%`, i: PlayCircle, c: "text-violet-600" },
              { k: "Avg runtime", v: `${stats.avgMs}ms`, i: History, c: "text-amber-600" },
            ].map((s) => (
              <div key={s.k} className="rounded-xl border border-border/60 bg-white/80 backdrop-blur px-4 py-3">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground"><s.i className={`size-3.5 ${s.c}`} /> {s.k}</div>
                <div className="mt-1 text-2xl font-semibold tabular-nums">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflows list */}
      <section className="mx-auto max-w-6xl px-6 py-10 space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">Your workflows</h2>
          <span className="text-xs text-muted-foreground">({filtered.length})</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="h-9 pl-7 w-64 text-xs" />
            </div>
            <div className="flex gap-1 rounded-md border border-border/60 bg-white p-1">
              {(["all","active","draft","scheduled","paused"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`px-2 py-1 text-[11px] rounded ${filter === f ? "bg-primary text-primary-foreground" : "hover:bg-neutral-100"}`}>{f}</button>
              ))}
            </div>
            <Button asChild variant="outline" size="sm"><Link to="/workflows/executions">Executions</Link></Button>
            <Button asChild variant="outline" size="sm"><Link to="/workflows/logs">Logs</Link></Button>
            <Button size="sm" onClick={newBlank}><Plus className="size-3.5 mr-1" /> New</Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-white p-10 text-center">
            <WorkflowIcon className="mx-auto size-8 text-muted-foreground" />
            <div className="mt-3 text-sm font-medium">No workflows yet</div>
            <p className="text-xs text-muted-foreground">Start from a template, or describe what you want above.</p>
            <div className="mt-4 flex justify-center gap-2">
              <Button size="sm" onClick={newBlank}><Plus className="size-3.5 mr-1" /> Blank</Button>
              <Button asChild size="sm" variant="outline"><Link to="/workflows/templates">Templates</Link></Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((w) => (
              <div key={w.id} className="group relative rounded-xl border border-border/60 bg-white p-4 hover:border-primary/40 hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <Badge variant={w.status === "active" ? "default" : "muted"} className="text-[10px] uppercase">{w.status}</Badge>
                  <span className="text-[10px] font-mono text-muted-foreground">v{w.version} · {w.nodes.length} blocks</span>
                </div>
                <Link to="/workflows/$id" params={{ id: w.id }} className="mt-3 block">
                  <div className="text-base font-semibold group-hover:text-primary">{w.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{w.description || "No description"}</div>
                </Link>
                <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Updated {new Date(w.updatedAt).toLocaleDateString()}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <Button size="sm" variant="ghost" onClick={() => { duplicateWorkflow(w.id); refresh(); }} title="Duplicate"><Copy className="size-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => { if (confirm(`Delete "${w.name}"?`)) { deleteWorkflow(w.id); refresh(); } }} title="Delete"><Trash2 className="size-3.5" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
