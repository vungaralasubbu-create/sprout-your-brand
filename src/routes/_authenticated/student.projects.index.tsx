import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Briefcase, Search, Lock, Play, Clock, CheckCircle2, AlertCircle,
  Send, Eye, Star, ArrowRight, Layers,
} from "lucide-react";
import { listStudentProjects } from "@/lib/student/projects.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/student/projects/")({
  head: () => ({ meta: [{ title: "My Projects — Glintr LMS" }] }),
  component: ProjectsIndex,
});

const FILTERS = [
  { id: "all", label: "All" },
  { id: "available", label: "Available" },
  { id: "in_progress", label: "In Progress" },
  { id: "submitted", label: "Submitted" },
  { id: "under_review", label: "Under Review" },
  { id: "needs_revision", label: "Needs Revision" },
  { id: "completed", label: "Completed" },
  { id: "locked", label: "Locked" },
] as const;

function statusMeta(status: string) {
  switch (status) {
    case "available": return { label: "Not Started", cls: "bg-slate-100 text-slate-700 border-slate-200", Icon: Play };
    case "in_progress": return { label: "In Progress", cls: "bg-amber-50 text-amber-700 border-amber-200", Icon: Clock };
    case "submitted": return { label: "Submitted", cls: "bg-blue-50 text-blue-700 border-blue-200", Icon: Send };
    case "under_review": return { label: "Under Review", cls: "bg-violet-50 text-violet-700 border-violet-200", Icon: Eye };
    case "needs_revision": return { label: "Needs Revision", cls: "bg-orange-50 text-orange-700 border-orange-200", Icon: AlertCircle };
    case "completed": return { label: "Completed", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle2 };
    case "locked":
    default: return { label: "Locked", cls: "bg-slate-100 text-slate-500 border-slate-200", Icon: Lock };
  }
}

function ProjectsIndex() {
  const fetchList = useServerFn(listStudentProjects);
  const { data, isLoading } = useQuery({
    queryKey: ["student-projects"],
    queryFn: () => fetchList(),
  });

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const items = data?.projects ?? [];
    return items.filter((p: any) => {
      if (filter !== "all" && p.status !== filter) return false;
      if (q.trim()) {
        const term = q.trim().toLowerCase();
        if (
          !p.project.name.toLowerCase().includes(term)
          && !p.course.name.toLowerCase().includes(term)
        ) return false;
      }
      return true;
    });
  }, [data, q, filter]);

  const s = data?.summary;

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 text-caption text-muted-foreground uppercase tracking-widest font-mono">
        <Briefcase className="size-3.5" /> My Projects
      </div>
      <h1 className="mt-2 text-3xl lg:text-4xl font-display font-semibold tracking-tight">
        Projects & Portfolio
      </h1>
      <p className="mt-2 text-muted-foreground max-w-2xl">
        Apply what you have learned. Ship real assignments, get reviewer feedback, and build a portfolio you can show recruiters.
      </p>

      {/* Summary */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total", value: s?.total ?? 0 },
          { label: "Not Started", value: s?.notStarted ?? 0 },
          { label: "In Progress", value: s?.inProgress ?? 0 },
          { label: "Submitted", value: (s?.submitted ?? 0) + (s?.underReview ?? 0) },
          { label: "Needs Revision", value: s?.needsRevision ?? 0 },
          { label: "Completed", value: s?.completed ?? 0 },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border bg-white p-4">
            <div className="text-caption uppercase tracking-wider text-muted-foreground">{k.label}</div>
            <div className="mt-1 text-2xl font-display font-semibold">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mt-8 flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search project or program"
            className="pl-9 h-10"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                filter === f.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white text-muted-foreground border-border hover:text-foreground",
              )}
            >{f.label}</button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="mt-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border bg-white p-10 text-center">
            <Layers className="size-8 text-muted-foreground mx-auto" />
            <h3 className="mt-3 font-semibold">No projects match your filters</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {(data?.projects ?? []).length === 0
                ? "You are not enrolled in a program with projects yet."
                : "Try clearing the search or a different status."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((p: any) => {
              const meta = statusMeta(p.status);
              const locked = p.status === "locked";
              return (
                <div
                  key={p.link_id}
                  className={cn(
                    "rounded-2xl border bg-white p-5 flex flex-col transition-shadow",
                    !locked && "hover:shadow-md",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-caption uppercase tracking-wider text-muted-foreground truncate">
                        {p.course.name}
                      </div>
                      <h3 className="mt-1 font-display text-lg font-semibold leading-snug line-clamp-2">
                        {p.project.name}
                      </h3>
                    </div>
                    <Badge className={cn("border shrink-0", meta.cls)}>
                      <meta.Icon className="size-3 mr-1" />{meta.label}
                    </Badge>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {p.project.difficulty && <span className="capitalize">{p.project.difficulty}</span>}
                    {p.project.difficulty && p.project.duration && <span>·</span>}
                    {p.project.duration && <span>{p.project.duration}</span>}
                    {p.project.portfolio_eligible && (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1 text-amber-700">
                          <Star className="size-3" /> Portfolio
                        </span>
                      </>
                    )}
                  </div>

                  {p.project.objective ? (
                    <p className="mt-3 text-sm text-muted-foreground line-clamp-3">
                      {p.project.objective}
                    </p>
                  ) : p.project.description ? (
                    <p className="mt-3 text-sm text-muted-foreground line-clamp-3">
                      {p.project.description}
                    </p>
                  ) : null}

                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {locked ? p.unlock_reason : p.due_at ? `Due ${new Date(p.due_at).toLocaleDateString()}` : "No due date"}
                    </div>
                    {locked ? (
                      <Button size="sm" variant="outline" disabled className="gap-1.5">
                        <Lock className="size-3.5" /> Locked
                      </Button>
                    ) : (
                      <Button size="sm" asChild className="gap-1.5">
                        <Link
                          to="/student/projects/$id"
                          params={{ id: p.link_id }}
                        >
                          {p.status === "available" ? "Start" : "Open"} <ArrowRight className="size-3.5" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
