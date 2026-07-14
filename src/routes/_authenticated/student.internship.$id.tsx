import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Lock,
  CheckCircle2,
  Clock,
  PlayCircle,
  Briefcase,
  FolderKanban,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getInternshipDetails,
  startInternship,
} from "@/lib/student/internship.functions";

export const Route = createFileRoute("/_authenticated/student/internship/$id")({
  head: () => ({
    meta: [
      { title: "Internship Journey — Glintr" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InternshipDetail,
  errorComponent: () => (
    <div className="p-6">
      <EmptyState variant="error" title="Unable To Load Internship" />
    </div>
  ),
  notFoundComponent: () => <div className="p-6">Internship not found.</div>,
});

const STAGE_STATUS_STYLES: Record<string, string> = {
  available: "bg-sky-50 text-sky-700 border-sky-200",
  in_progress: "bg-sky-50 text-sky-700 border-sky-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  locked: "bg-slate-100 text-slate-500 border-slate-200",
};

const TASK_STATUS_STYLES: Record<string, string> = {
  available: "bg-slate-50 text-slate-700 border-slate-200",
  in_progress: "bg-sky-50 text-sky-700 border-sky-200",
  submitted: "bg-indigo-50 text-indigo-700 border-indigo-200",
  under_review: "bg-amber-50 text-amber-700 border-amber-200",
  needs_revision: "bg-rose-50 text-rose-700 border-rose-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  locked: "bg-slate-100 text-slate-500 border-slate-200",
};

function InternshipDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchFn = useServerFn(getInternshipDetails);
  const startFn = useServerFn(startInternship);
  const [confirmStart, setConfirmStart] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["student-internship", id],
    queryFn: () => fetchFn({ data: { internshipId: id } }),
  });

  const startMut = useMutation({
    mutationFn: () => startFn({ data: { internshipId: id } }),
    onSuccess: () => {
      toast.success("Internship started");
      qc.invalidateQueries({ queryKey: ["student-internship", id] });
      qc.invalidateQueries({ queryKey: ["student-internships"] });
      setConfirmStart(false);
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to start internship");
      setConfirmStart(false);
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32" />
        <Skeleton className="h-56" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="p-6">
        <EmptyState
          variant="error"
          title="Unable To Load Internship"
          action={{ label: "Retry", onClick: () => refetch() }}
        />
      </div>
    );
  }

  const { internship, student, eligibility, stages, projects, requiredTasksCompleted, requiredTasksTotal } = data;
  const progressPercent = student?.progressPercent ?? 0;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/student/internship">
            <ArrowLeft className="size-4" /> Internships
          </Link>
        </Button>
      </div>

      {/* Header */}
      <Card className="p-6 space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">{internship.courseName}</div>
            <h1 className="font-display text-2xl md:text-3xl font-semibold mt-1">
              {internship.title || `${internship.courseName} Internship`}
            </h1>
            {internship.description ? (
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{internship.description}</p>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-2">
            {student ? (
              <Badge variant="outline" className="capitalize">{String(student.status).replace(/_/g, " ")}</Badge>
            ) : (
              <Badge variant="outline" className="capitalize">
                {eligibility?.eligible ? "eligible" : "locked"}
              </Badge>
            )}
            {internship.durationWeeks ? (
              <span className="text-xs text-muted-foreground">{internship.durationWeeks} weeks</span>
            ) : null}
          </div>
        </div>

        {student ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Internship Progress</span>
              <span>
                {requiredTasksCompleted}/{requiredTasksTotal} required tasks • {progressPercent}%
              </span>
            </div>
            <Progress value={progressPercent} />
          </div>
        ) : eligibility?.eligible ? (
          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-sm text-muted-foreground">Ready to begin your practical journey.</div>
            <Button variant="gradient" onClick={() => setConfirmStart(true)}>
              <PlayCircle className="size-4" /> Start Internship
            </Button>
          </div>
        ) : null}
      </Card>

      {/* Locked screen with eligibility progress */}
      {!student && !eligibility?.eligible ? (
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-slate-100 text-slate-500 grid place-items-center">
              <Lock className="size-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold">Internship Journey Locked</h2>
              <p className="text-sm text-muted-foreground">
                Complete the required learning milestones to unlock your program internship journey.
              </p>
            </div>
          </div>

          {eligibility?.progress ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <ProgressRow
                label="Learning Content"
                value={Math.round(Number(eligibility.progress.learningPercent ?? 0))}
                suffix="%"
              />
              <ProgressRow
                label="Required Modules"
                value={eligibility.progress.requiredModulesCompleted}
                total={eligibility.progress.requiredModulesTotal}
              />
              <ProgressRow
                label="Required Projects"
                value={eligibility.progress.projectsCompleted}
                total={eligibility.progress.projectsRequired}
              />
              <ProgressRow
                label="Assignments"
                value={eligibility.progress.assignmentsCompleted}
                total={eligibility.progress.assignmentsRequired}
              />
            </div>
          ) : null}
        </Card>
      ) : null}

      {/* Journey */}
      {stages.length > 0 ? (
        <Card className="p-6 space-y-5">
          <div>
            <h2 className="font-display text-xl font-semibold">Internship Journey</h2>
            <p className="text-sm text-muted-foreground">
              {internship.sequential ? "Stages unlock in order." : "Work through stages in any order."}
            </p>
          </div>

          <ol className="relative border-l border-border pl-6 space-y-6">
            {stages.map((stage: any, idx: number) => (
              <li key={stage.id} className="relative">
                <span
                  className={`absolute -left-[27px] top-0 size-8 rounded-full grid place-items-center border-2 ${
                    stage.status === "completed"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-600"
                      : stage.status === "in_progress"
                      ? "bg-sky-50 border-sky-500 text-sky-600"
                      : stage.status === "available"
                      ? "bg-white border-primary text-primary"
                      : "bg-slate-50 border-slate-300 text-slate-400"
                  }`}
                >
                  {stage.status === "completed" ? (
                    <CheckCircle2 className="size-4" />
                  ) : stage.status === "locked" ? (
                    <Lock className="size-3.5" />
                  ) : (
                    <span className="text-xs font-semibold">{idx + 1}</span>
                  )}
                </span>

                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">Stage {idx + 1}</div>
                      <h3 className="font-display text-lg font-semibold">{stage.name}</h3>
                      {stage.description ? (
                        <p className="text-sm text-muted-foreground mt-1">{stage.description}</p>
                      ) : null}
                    </div>
                    <Badge variant="outline" className={`capitalize ${STAGE_STATUS_STYLES[stage.status] ?? ""}`}>
                      {String(stage.status).replace(/_/g, " ")}
                    </Badge>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {stage.tasksCompleted}/{stage.tasksTotal} tasks completed
                  </div>

                  {stage.tasks.length > 0 && stage.status !== "locked" && student ? (
                    <div className="grid gap-2">
                      {stage.tasks.map((task: any) => (
                        <button
                          key={task.id}
                          onClick={() => {
                            if (task.status === "locked") return;
                            navigate({
                              to: "/student/internship/$id/tasks/$taskId",
                              params: { id, taskId: task.id },
                            });
                          }}
                          disabled={task.status === "locked"}
                          className="w-full text-left flex items-center gap-3 p-3 rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                        >
                          <div className="size-8 rounded-md bg-primary-soft text-primary grid place-items-center flex-shrink-0">
                            {task.status === "completed" ? (
                              <CheckCircle2 className="size-4" />
                            ) : task.status === "locked" ? (
                              <Lock className="size-4" />
                            ) : (
                              <Clock className="size-4" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">{task.title}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              <span className="capitalize">{String(task.taskType).replace(/_/g, " ")}</span>
                              {task.isRequired ? <span>• Required</span> : <span>• Optional</span>}
                              {task.estimatedHours ? <span>• {task.estimatedHours}h</span> : null}
                            </div>
                          </div>
                          <Badge variant="outline" className={`capitalize ${TASK_STATUS_STYLES[task.status] ?? ""}`}>
                            {String(task.status).replace(/_/g, " ")}
                          </Badge>
                          <ChevronRight className="size-4 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  ) : stage.tasks.length > 0 ? (
                    <div className="text-xs text-muted-foreground italic">
                      {student ? "Complete previous stage to unlock." : "Start the internship to unlock tasks."}
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </Card>
      ) : (
        <Card className="p-6">
          <EmptyState
            icon={Briefcase}
            title="Internship Content Coming Soon"
            description="Your program mentor will configure internship stages shortly."
          />
        </Card>
      )}

      {/* Projects */}
      {projects.length > 0 ? (
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <FolderKanban className="size-4 text-primary" />
            <h2 className="font-display text-xl font-semibold">Internship Projects</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {projects.map((p: any) => (
              <div key={p.id} className="p-4 rounded-lg border bg-white">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {String(p.projectType).replace(/_/g, " ")} {p.isFinal ? "• Final" : ""}
                    </div>
                    <h4 className="font-semibold mt-1">{p.title}</h4>
                  </div>
                  {p.isRequired ? <Badge variant="outline">Required</Badge> : null}
                </div>
                {p.description ? (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{p.description}</p>
                ) : null}
                {p.courseProjectTemplateId ? (
                  <div className="mt-3 text-xs text-muted-foreground">
                    Submitted via Projects workspace.
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {/* Completion Review banner */}
      {student?.status === "completion_review" ? (
        <Card className="p-6 border-amber-200 bg-amber-50/50">
          <h3 className="font-display text-lg font-semibold">Internship Completion Review</h3>
          <p className="text-sm text-muted-foreground mt-1">
            You have completed the required internship journey. Your completion status is under review.
          </p>
        </Card>
      ) : null}

      {student?.status === "completed" ? (
        <Card className="p-6 border-emerald-200 bg-emerald-50/50">
          <h3 className="font-display text-lg font-semibold">Internship Completed</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Congratulations on completing your {internship.courseName} internship journey.
          </p>
        </Card>
      ) : null}

      <AlertDialog open={confirmStart} onOpenChange={setConfirmStart}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Your {internship.courseName} Internship?</AlertDialogTitle>
            <AlertDialogDescription>
              Your internship progress and practical task journey will begin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={startMut.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => startMut.mutate()} disabled={startMut.isPending}>
              {startMut.isPending ? "Starting…" : "Start Internship"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  total,
  suffix,
}: {
  label: string;
  value: number;
  total?: number;
  suffix?: string;
}) {
  const pct = total && total > 0 ? Math.round((value / total) * 100) : suffix === "%" ? value : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {total !== undefined ? `${value} of ${total}` : `${value}${suffix ?? ""}`}
        </span>
      </div>
      <Progress value={pct} />
    </div>
  );
}
