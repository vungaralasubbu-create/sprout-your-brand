import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listMyMarketingPlans,
  archiveMarketingPlan,
  deleteMarketingPlan,
  duplicateMarketingPlan,
} from "@/lib/marketing-os/plans.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Copy, Archive, Trash2, FileDown, ExternalLink, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/marketing-os/")({
  component: Dashboard,
});

function Dashboard() {
  const list = useServerFn(listMyMarketingPlans);
  const dup = useServerFn(duplicateMarketingPlan);
  const arch = useServerFn(archiveMarketingPlan);
  const del = useServerFn(deleteMarketingPlan);
  const qc = useQueryClient();
  const nav = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["marketing-plans"],
    queryFn: () => list(),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["marketing-plans"] });

  const mDup = useMutation({
    mutationFn: (id: string) => dup({ data: { id } }),
    onSuccess: (r) => { toast.success("Plan duplicated"); nav({ to: "/admin/marketing-os/plans/$id", params: { id: r.id } }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const mArch = useMutation({
    mutationFn: (v: { id: string; archived: boolean }) => arch({ data: v }),
    onSuccess: () => { toast.success("Status updated"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const mDel = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Plan deleted"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const plans = data?.plans ?? [];
  const stats = {
    total: plans.length,
    active: plans.filter((p) => p.status === "active").length,
    archived: plans.filter((p) => p.status === "archived").length,
    draft: plans.filter((p) => p.status === "draft").length,
  };

  function exportJson(plan: { id: string; business_name: string }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${plan.business_name.replace(/\W+/g, "_")}-plan.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Content Plans</h2>
          <p className="text-sm text-muted-foreground">One-click AI content strategy generation. Planning only — no publishing.</p>
        </div>
        <Button asChild size="lg">
          <Link to="/admin/marketing-os/planner">
            <Plus className="size-4 mr-2" /> New Plan
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Plans", value: stats.total, tone: "text-foreground" },
          { label: "Active", value: stats.active, tone: "text-emerald-600" },
          { label: "Drafts", value: stats.draft, tone: "text-amber-600" },
          { label: "Archived", value: stats.archived, tone: "text-muted-foreground" },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground">{s.label}</div>
            <div className={`mt-2 text-3xl font-semibold ${s.tone}`}>{s.value}</div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border/60 flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h3 className="font-medium">All Plans</h3>
        </div>
        {isLoading ? (
          <div className="p-10 text-center text-muted-foreground">Loading…</div>
        ) : plans.length === 0 ? (
          <div className="p-14 text-center">
            <div className="mx-auto size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <Sparkles className="size-6 text-primary" />
            </div>
            <div className="font-medium">No plans yet</div>
            <p className="text-sm text-muted-foreground mt-1">Generate your first AI-powered content strategy.</p>
            <Button asChild className="mt-4">
              <Link to="/admin/marketing-os/planner">Create your first plan</Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {plans.map((p) => (
              <div key={p.id} className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium truncate">{p.business_name}</h4>
                    <span className={
                      "text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded " +
                      (p.status === "active" ? "bg-emerald-100 text-emerald-700"
                        : p.status === "archived" ? "bg-muted text-muted-foreground"
                        : "bg-amber-100 text-amber-700")
                    }>{p.status}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3">
                    <span>{p.industry || "—"}</span>
                    <span>· {p.planning_period.replace("_", " ")}</span>
                    <span>· {Array.isArray(p.platforms) ? p.platforms.length : 0} platforms</span>
                    <span>· {new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" asChild>
                    <Link to="/admin/marketing-os/plans/$id" params={{ id: p.id }}>
                      <ExternalLink className="size-4 mr-1" /> Open
                    </Link>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => exportJson(p)} title="Export JSON">
                    <FileDown className="size-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => mDup.mutate(p.id)} title="Duplicate">
                    <Copy className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => mArch.mutate({ id: p.id, archived: p.status !== "archived" })}
                    title={p.status === "archived" ? "Unarchive" : "Archive"}
                  >
                    <Archive className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { if (confirm("Delete this plan permanently?")) mDel.mutate(p.id); }}
                    title="Delete"
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
