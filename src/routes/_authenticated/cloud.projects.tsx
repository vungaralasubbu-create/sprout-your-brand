import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Clock, FolderKanban, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listMarketingProjects } from "@/lib/marketing-os/projects.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/cloud/projects")({
  component: Projects,
});

function Projects() {
  const listProjects = useServerFn(listMarketingProjects);
  const q = useQuery({ queryKey: ["mc-projects"], queryFn: () => listProjects({}) });
  const projects = q.data?.projects ?? [];
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 pb-24 sm:px-6 lg:px-10">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">Projects</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">All projects</h1>
        </div>
        <Link to="/cloud/dashboard">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New project
          </Button>
        </Link>
      </div>

      <div className="mt-8">
        {q.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl border bg-muted/40" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border bg-card p-16 text-center">
            <FolderKanban className="h-10 w-10 text-muted-foreground" />
            <div className="mt-4 text-lg font-medium">No projects yet</div>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Start by describing a campaign on your Home dashboard.
            </p>
            <Link to="/cloud/dashboard" className="mt-6">
              <Button>Go to Home</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p: any) => (
              <Link
                key={p.id}
                to="/cloud/project/$id"
                params={{ id: p.id } as any}
                className="group flex flex-col rounded-xl border bg-card p-4 transition hover:border-primary hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="line-clamp-2 font-medium">{p.name || "Untitled"}</div>
                  <StatusBadge status={p.status || "draft"} />
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${p.progress ?? 0}%` }} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {new Date(p.created_at).toLocaleDateString()}
                  </span>
                  <MoreHorizontal className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    running: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    complete: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    failed: "bg-red-500/15 text-red-600 dark:text-red-400",
    draft: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
        map[status] ?? map.draft,
      )}
    >
      {status}
    </span>
  );
}
