import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { TEMPLATES } from "@/lib/automation/templates";
import { createWorkflowFromTemplate } from "@/lib/automation/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Plus, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/workflows/templates")({
  head: () => ({ meta: [{ title: "Workflow Templates — Workflow Studio" }] }),
  component: TemplateLibrary,
});

function TemplateLibrary() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const cats = Array.from(new Set(TEMPLATES.map((t) => t.category))).sort();
  const [cat, setCat] = useState<string>("all");

  const filtered = TEMPLATES.filter((t) => {
    if (cat !== "all" && t.category !== cat) return false;
    if (q && !(t.name.toLowerCase().includes(q.toLowerCase()) || t.description.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });

  return (
    <div className="min-h-full bg-neutral-50">
      <div className="border-b border-border/60 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Link to="/workflows" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" /> Back to Workflow Studio</Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Workflow Templates</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">Production-ready automations for lead nurturing, admissions, launches, onboarding, cart recovery, invoicing, and social. Fork any template and customise on the canvas.</p>

          <div className="mt-6 flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search templates…" className="h-9 pl-7 w-72 text-xs" />
            </div>
            <div className="flex gap-1 rounded-md border border-border/60 bg-white p-1 flex-wrap">
              <button onClick={() => setCat("all")} className={`px-2 py-1 text-[11px] rounded ${cat === "all" ? "bg-primary text-primary-foreground" : "hover:bg-neutral-100"}`}>all</button>
              {cats.map((c) => (
                <button key={c} onClick={() => setCat(c)} className={`px-2 py-1 text-[11px] rounded ${cat === c ? "bg-primary text-primary-foreground" : "hover:bg-neutral-100"}`}>{c}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t) => (
            <div key={t.id} className="group rounded-xl border border-border/60 bg-white p-5 flex flex-col hover:border-primary/40 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <Badge variant="muted" className="text-[10px] uppercase">{t.category}</Badge>
                <span className="text-[10px] font-mono uppercase text-muted-foreground">{t.nodes.length} blocks</span>
              </div>
              <h3 className="mt-3 text-base font-semibold">{t.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground flex-1">{t.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground truncate">Trigger: {t.trigger.replace("trg.", "")}</span>
                <Button size="sm" onClick={() => { const wf = createWorkflowFromTemplate(t.id); nav({ to: "/workflows/$id", params: { id: wf.id } }); }}>
                  <Plus className="size-3.5 mr-1" /> Use <ArrowRight className="size-3.5 ml-1" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
