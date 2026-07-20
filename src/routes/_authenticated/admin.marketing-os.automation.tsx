import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getAutomationStats,
  listWorkflows,
  listTemplates,
  createWorkflow,
  runWorkflow,
} from "@/lib/automation/workflows.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Workflow, Play, Pause, CheckCircle2, XCircle, Clock,
  Timer, TrendingUp, LayoutTemplate, Plus, Sparkles, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/marketing-os/automation")({
  head: () => ({
    meta: [
      { title: "Automation — Glintr Marketing OS" },
      { name: "description", content: "Enterprise visual workflow automation across every module of Glintr." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AutomationDashboard,
});

function AutomationDashboard() {
  const qc = useQueryClient();
  const statsFn = useServerFn(getAutomationStats);
  const listFn = useServerFn(listWorkflows);
  const templatesFn = useServerFn(listTemplates);
  const createFn = useServerFn(createWorkflow);
  const runFn = useServerFn(runWorkflow);

  const { data: stats } = useQuery({ queryKey: ["auto-stats"], queryFn: () => statsFn() });
  const { data: wfData } = useQuery({ queryKey: ["auto-wfs"], queryFn: () => listFn() });
  const { data: tplData } = useQuery({ queryKey: ["auto-templates"], queryFn: () => templatesFn() });

  const [category, setCategory] = useState<string>("all");

  const workflows = wfData?.workflows ?? [];
  const templates = tplData?.templates ?? [];

  const filteredTemplates = useMemo(
    () => (category === "all" ? templates : templates.filter((t) => t.category === category)),
    [templates, category],
  );

  const useTemplate = useMutation({
    mutationFn: async (key: string) => createFn({ data: { name: "New automation", templateKey: key } }),
    onSuccess: (res) => {
      toast.success("Workflow created from template");
      qc.invalidateQueries({ queryKey: ["auto-wfs"] });
      window.location.href = `/admin/marketing-os/automation/${res.id}`;
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const runNow = useMutation({
    mutationFn: async (id: string) => runFn({ data: { id, source: "manual" } }),
    onSuccess: () => {
      toast.success("Workflow run started");
      qc.invalidateQueries({ queryKey: ["auto-stats"] });
      qc.invalidateQueries({ queryKey: ["auto-wfs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const kpis = [
    { label: "Active", value: stats?.activeWorkflows ?? 0, icon: Workflow },
    { label: "Completed today", value: stats?.completedToday ?? 0, icon: CheckCircle2, tone: "text-emerald-600" },
    { label: "Running", value: stats?.running ?? 0, icon: Play, tone: "text-amber-600" },
    { label: "Failed", value: stats?.failed ?? 0, icon: XCircle, tone: "text-red-600" },
    { label: "Paused", value: stats?.pausedWorkflows ?? 0, icon: Pause },
    { label: "Waiting", value: stats?.waiting ?? 0, icon: Timer },
    { label: "Avg runtime", value: `${Math.round((stats?.avgRuntimeMs ?? 0) / 1000)}s`, icon: Clock },
    { label: "Success rate", value: `${stats?.successRate ?? 100}%`, icon: TrendingUp, tone: "text-emerald-600" },
  ];

  const categories = ["all", ...Array.from(new Set(templates.map((t) => t.category)))];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-primary">Automation OS</div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Sparkles className="size-6 text-primary" />
            Workflow Automation
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Visual, drag-and-drop workflows that connect every module — Marketing OS, Generation Engine, Publisher, CRM, LMS. No code required.
          </p>
        </div>
        <Button asChild>
          <Link to={"/admin/marketing-os/automation/new" as never}>
            <Plus className="size-4 mr-1.5" /> New workflow
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">{k.label}</div>
              <k.icon className="size-4 text-muted-foreground" />
            </div>
            <div className={cn("mt-2 text-xl font-semibold tracking-tight", k.tone)}>{k.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium flex items-center gap-2"><Workflow className="size-4" /> Your workflows</h3>
            <span className="text-xs text-muted-foreground">{workflows.length}</span>
          </div>
          {workflows.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No workflows yet. Start from a template on the right, or create a blank one.
            </div>
          ) : (
            <div className="divide-y divide-border/60 -mx-2">
              {workflows.map((w) => (
                <div key={w.id} className="flex items-center gap-3 px-2 py-2.5 hover:bg-muted/30 rounded-lg">
                  <StatusDot status={w.status} />
                  <Link
                    to={"/admin/marketing-os/automation/$id" as never}
                    params={{ id: w.id } as never}
                    className="flex-1 min-w-0"
                  >
                    <div className="text-sm font-medium truncate">{w.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {w.description || w.category || "—"}
                      {w.last_run_at ? ` · last run ${new Date(w.last_run_at).toLocaleString()}` : ""}
                    </div>
                  </Link>
                  <div className="hidden sm:flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>{w.run_count ?? 0} runs</span>
                    <span className="text-emerald-600">{w.success_count ?? 0} ✓</span>
                    <span className="text-red-500">{w.failure_count ?? 0} ✕</span>
                  </div>
                  <Badge variant="outline" className="capitalize text-[10px]">{w.status}</Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => runNow.mutate(w.id)}
                    disabled={runNow.isPending || w.status === "paused"}
                  >
                    <Zap className="size-3.5 mr-1" /> Run
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium flex items-center gap-2"><LayoutTemplate className="size-4" /> Templates</h3>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "text-[11px] px-2 py-0.5 rounded-full capitalize border transition-colors",
                  category === c ? "bg-primary text-primary-foreground border-primary" : "border-border/60 hover:bg-muted",
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {filteredTemplates.map((t) => (
              <button
                key={t.key}
                onClick={() => useTemplate.mutate(t.key)}
                disabled={useTemplate.isPending}
                className="w-full text-left p-3 rounded-lg border border-border/60 hover:border-primary/60 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium">{t.name}</div>
                  <Badge variant="outline" className="capitalize text-[10px] ml-auto">{t.category}</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</div>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "size-2 rounded-full shrink-0",
        status === "active" ? "bg-emerald-500" :
        status === "paused" ? "bg-amber-500" :
        status === "draft"  ? "bg-neutral-400" : "bg-red-500",
      )}
    />
  );
}
