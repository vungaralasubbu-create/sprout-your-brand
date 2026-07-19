import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAutomationWorkflows, listAutomationRuns } from "@/lib/automation/workflows.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Zap, TrendingUp, GitBranch, PlusCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/automation-hub/")({
  head: () => ({ meta: [{ title: "AI Marketing Automation · Glintr" }] }),
  loader: async ({ context }) => {
    const list = useServerFn(listAutomationWorkflows);
    await context.queryClient.ensureQueryData({
      queryKey: ["automation", "workflows"],
      queryFn: () => list({ data: {} }),
    });
    return null;
  },
  errorComponent: ({ error, reset }) => (
    <div className="p-8 text-sm">
      <p className="text-destructive">Failed to load automation hub: {String(error)}</p>
      <Button onClick={reset} className="mt-3">Retry</Button>
    </div>
  ),
  notFoundComponent: () => <div className="p-8">Not found.</div>,
  component: AutomationHubPage,
});

function AutomationHubPage() {
  const listWorkflows = useServerFn(listAutomationWorkflows);
  const listRuns = useServerFn(listAutomationRuns);

  const { data: wfData } = useSuspenseQuery({
    queryKey: ["automation", "workflows"],
    queryFn: () => listWorkflows({ data: {} }),
  });

  const { data: runData } = useQuery({
    queryKey: ["automation", "runs", "recent"],
    queryFn: () => listRuns({ data: {} }),
  });

  const workflows = wfData?.workflows ?? [];
  const active = workflows.filter((w) => w.status === "active").length;
  const draft = workflows.filter((w) => w.status === "draft").length;
  const runs = runData?.runs ?? [];
  const succeeded = runs.filter((r) => r.status === "completed" || r.status === "goal_met").length;
  const running = runs.filter((r) => r.status === "running").length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Glintr Engage · AI Automation</p>
            <h1 className="text-2xl font-semibold mt-1">AI Marketing Automation Engine</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Behavior-driven, multi-channel, AI-optimised. Track every event, let AI decide the next-best action,
              and orchestrate email + SMS + WhatsApp + push + in-app from one visual canvas.
            </p>
          </div>
          <Button asChild>
            <Link to="/admin/automation-hub/workflows/$id" params={{ id: "new" }}>
              <PlusCircle className="h-4 w-4 mr-2" /> New workflow
            </Link>
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={<GitBranch className="h-4 w-4" />} label="Workflows" value={workflows.length} sub={`${active} active · ${draft} draft`} />
          <StatCard icon={<Activity className="h-4 w-4" />} label="Runs" value={runs.length} sub={`${running} running`} />
          <StatCard icon={<Zap className="h-4 w-4" />} label="Successful" value={succeeded} sub="completed + goal met" />
          <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Success rate" value={`${runs.length ? Math.round((succeeded / runs.length) * 100) : 0}%`} sub="across recent runs" />
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Workflows</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/automation-hub/workflows">Manage all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {workflows.length === 0 ? (
              <div className="text-sm text-muted-foreground py-6 text-center">
                No workflows yet.{" "}
                <Link to="/admin/automation-hub/workflows/$id" params={{ id: "new" }} className="text-primary underline">
                  Create your first workflow
                </Link>
                .
              </div>
            ) : (
              <div className="space-y-2">
                {workflows.slice(0, 8).map((w) => (
                  <Link
                    key={w.id}
                    to="/admin/automation-hub/workflows/$id"
                    params={{ id: w.id }}
                    className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 hover:bg-neutral-50"
                  >
                    <div>
                      <p className="text-sm font-medium">{w.name}</p>
                      <p className="text-xs text-muted-foreground">{w.description ?? "—"}</p>
                    </div>
                    <Badge variant={w.status === "active" ? "success" : "muted"}>{w.status}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent runs</CardTitle></CardHeader>
          <CardContent>
            {runs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No runs yet.</p>
            ) : (
              <div className="space-y-1.5">
                {runs.slice(0, 10).map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-xs rounded-md border border-border/40 px-3 py-1.5">
                    <span className="font-mono text-[11px] text-muted-foreground">{r.id.slice(0, 8)}</span>
                    <span>{new Date(r.started_at).toLocaleString()}</span>
                    <Badge variant={r.status === "completed" || r.status === "goal_met" ? "success" : r.status === "running" ? "info" : "outline"}>
                      {r.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}<span>{label}</span></div>
        <p className="text-2xl font-semibold mt-1.5">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}
