import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Briefcase, ArrowRight, GraduationCap, ListChecks, Award, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { listStudentInternships } from "@/lib/student/internship.functions";

export const Route = createFileRoute("/_authenticated/student/internship/")({
  head: () => ({
    meta: [
      { title: "Internship — Glintr" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InternshipIndex,
  errorComponent: () => (
    <div className="p-6">
      <EmptyState variant="error" title="Unable To Load Internship" description="Please retry in a moment." />
    </div>
  ),
  notFoundComponent: () => <div className="p-6">Not found.</div>,
});

const STATUS_STYLES: Record<string, string> = {
  eligible: "bg-emerald-50 text-emerald-700 border-emerald-200",
  active: "bg-sky-50 text-sky-700 border-sky-200",
  in_progress: "bg-sky-50 text-sky-700 border-sky-200",
  completion_review: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-primary-soft text-primary border-primary/20",
  locked: "bg-slate-100 text-slate-600 border-slate-200",
  suspended: "bg-rose-50 text-rose-700 border-rose-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};

function InternshipIndex() {
  const fetchFn = useServerFn(listStudentInternships);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["student-internships"],
    queryFn: () => fetchFn(),
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-56" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <EmptyState
          variant="error"
          title="Unable To Load Internship"
          description="Something went wrong loading your internship journeys."
          action={{ label: "Retry", onClick: () => refetch() }}
        />
      </div>
    );
  }

  const items = data?.internships ?? [];
  const s = data?.summary;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">Internship</h1>
          <p className="text-caption mt-1">Practical internship journeys connected to your enrolled programs.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <MetricCard icon={Briefcase} label="Active" value={s?.active ?? 0} />
        <MetricCard icon={GraduationCap} label="Total" value={s?.total ?? 0} />
        <MetricCard icon={ListChecks} label="Tasks Completed" value={s?.tasksCompleted ?? 0} />
        <MetricCard icon={ListChecks} label="Projects" value={s?.projectsCompleted ?? 0} />
        <MetricCard icon={Clock} label="Pending Review" value={s?.pendingReview ?? 0} />
        <MetricCard icon={Award} label="Completed" value={s?.completed ?? 0} />
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No Internship Journey Available Yet"
          description="Internship opportunities connected to your eligible programs will appear here."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((it: any) => (
            <InternshipCard key={it.internshipId} item={it} />
          ))}
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }: any) {
  return (
    <Card className="p-3 flex items-center gap-3">
      <div className="size-9 rounded-lg bg-primary-soft text-primary grid place-items-center">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <div className="text-lg font-semibold leading-tight">{value ?? 0}</div>
        <div className="text-xs text-muted-foreground truncate">{label}</div>
      </div>
    </Card>
  );
}

function InternshipCard({ item }: { item: any }) {
  const statusLabel = String(item.status).replace(/_/g, " ");
  return (
    <Card className="p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground truncate">{item.courseName}</div>
          <h3 className="font-display text-lg font-semibold leading-tight mt-1 truncate">
            {item.title || `${item.courseName} Internship`}
          </h3>
        </div>
        <Badge variant="outline" className={`capitalize ${STATUS_STYLES[item.status] ?? ""}`}>
          {statusLabel}
        </Badge>
      </div>

      {item.description ? (
        <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
      ) : null}

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{item.progressPercent ?? 0}%</span>
        </div>
        <Progress value={item.progressPercent ?? 0} />
      </div>

      <div className="grid grid-cols-3 gap-3 text-center text-xs">
        <div>
          <div className="font-semibold text-sm">{item.tasksCompleted}/{item.tasksTotal}</div>
          <div className="text-muted-foreground">Tasks</div>
        </div>
        <div>
          <div className="font-semibold text-sm">{item.projectsCompleted}/{item.projectsTotal}</div>
          <div className="text-muted-foreground">Projects</div>
        </div>
        <div>
          <div className="font-semibold text-sm">{item.durationWeeks ?? "—"}</div>
          <div className="text-muted-foreground">Weeks</div>
        </div>
      </div>

      <div className="pt-2">
        <Button asChild variant="gradient" className="w-full">
          <Link
            to="/student/internship/$id"
            params={{ id: item.internshipId }}
          >
            {item.status === "locked" ? "View Requirements" :
             item.status === "eligible" ? "Start Internship" :
             "Open Internship"}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
