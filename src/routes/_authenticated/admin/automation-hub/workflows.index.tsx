import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAutomationWorkflows } from "@/lib/automation/workflows.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/automation-hub/workflows/")({
  head: () => ({ meta: [{ title: "Workflows · Glintr Automation" }] }),
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
      <p className="text-destructive">Failed: {String(error)}</p>
      <Button onClick={reset} className="mt-3">Retry</Button>
    </div>
  ),
  notFoundComponent: () => <div className="p-8">Not found.</div>,
  component: WorkflowsList,
});

function WorkflowsList() {
  const list = useServerFn(listAutomationWorkflows);
  const { data } = useSuspenseQuery({
    queryKey: ["automation", "workflows"],
    queryFn: () => list({ data: {} }),
  });
  const workflows = data?.workflows ?? [];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Automation</p>
          <h1 className="text-xl font-semibold mt-1">All workflows</h1>
        </div>
        <Button asChild>
          <Link to="/admin/automation-hub/workflows/$id" params={{ id: "new" }}>
            <PlusCircle className="h-4 w-4 mr-2" /> New workflow
          </Link>
        </Button>
      </header>

      <Card>
        <CardHeader><CardTitle className="text-base">{workflows.length} workflow{workflows.length === 1 ? "" : "s"}</CardTitle></CardHeader>
        <CardContent>
          {workflows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No workflows yet. Create one to start orchestrating multi-channel campaigns.
            </p>
          ) : (
            <div className="divide-y">
              {workflows.map((w) => (
                <Link
                  key={w.id}
                  to="/admin/automation-hub/workflows/$id"
                  params={{ id: w.id }}
                  className="flex items-center justify-between py-3 hover:bg-neutral-50 -mx-2 px-2 rounded"
                >
                  <div>
                    <p className="text-sm font-medium">{w.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{w.description ?? "—"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-muted-foreground font-mono">{(w.trigger as { event?: string })?.event ?? "—"}</span>
                    <Badge variant={w.status === "active" ? "success" : "muted"}>{w.status}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
