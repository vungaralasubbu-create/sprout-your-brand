import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getMyProgramDetails, recordProgramActivity } from "@/lib/student/lms.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen, CheckCircle2, Circle, Clock, PlayCircle, Award, Lock,
  ChevronDown, ChevronRight, ArrowLeft, FileText, Layers, GraduationCap, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/student/programs/$slug")({ component: Page });

const STATUS_META: Record<string, { label: string; className: string }> = {
  not_started: { label: "Not Started", className: "bg-muted text-foreground/70 border-border" },
  in_progress: { label: "In Progress", className: "bg-primary/10 text-primary border-primary/20" },
  completed: { label: "Completed", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  access_suspended: { label: "Access Suspended", className: "bg-amber-50 text-amber-800 border-amber-200" },
  access_expired: { label: "Access Expired", className: "bg-rose-50 text-rose-700 border-rose-200" },
};

function LessonIcon({ status, locked }: { status: string; locked?: boolean }) {
  if (locked) return <Lock className="size-4 text-muted-foreground/60" />;
  if (status === "completed") return <CheckCircle2 className="size-4 text-emerald-600" />;
  if (status === "in_progress") return <PlayCircle className="size-4 text-primary" />;
  return <Circle className="size-4 text-muted-foreground/50" />;
}


function Page() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const getFn = useServerFn(getMyProgramDetails);
  const trackFn = useServerFn(recordProgramActivity);

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-program", slug],
    queryFn: () => getFn({ data: { slug } }),
    retry: false,
  });

  const track = useMutation({ mutationFn: (v: Parameters<typeof trackFn>[0]["data"]) => trackFn({ data: v }) });

  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (data?.modules?.length) {
      const currentIdx = data.modules.findIndex((m: any) => m.totalLessons > 0 && m.completedLessons < m.totalLessons);
      const target = currentIdx >= 0 ? data.modules[currentIdx] : data.modules[0];
      if (target) setOpenIds(new Set([target.id]));
    }
  }, [data?.program?.id]);

  useEffect(() => {
    if (data?.program?.id) {
      track.mutate({ courseId: data.program.id, activity: "program_opened", description: `Opened ${data.program.name}` });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.program?.id]);

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8 space-y-4 max-w-[1200px]">
        <div className="h-6 w-40 bg-surface-1 animate-pulse rounded" />
        <Card className="h-48 animate-pulse" />
        <Card className="h-64 animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-2xl">
        <Card className="p-8 text-center">
          <AlertTriangle className="size-8 text-amber-600 mx-auto mb-2" />
          <div className="font-display text-lg font-semibold">Program Unavailable</div>
          <div className="text-sm text-muted-foreground mt-1">
            {error instanceof Error ? error.message : "You may not have access to this program."}
          </div>
          <Button asChild className="mt-5" variant="outline">
            <Link to="/student/programs"><ArrowLeft className="size-4 mr-1" /> Back to My Programs</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const p = data.program;
  const statusMeta = STATUS_META[data.status] ?? STATUS_META.not_started;

  const startOrContinue = () => {
    if (data.accessBlocked) return;
    if (data.status === "not_started" && p.id) {
      track.mutate({ courseId: p.id, activity: "program_started", description: `Started ${p.name}` });
    }
    if (p.slug) navigate({ to: "/student/learn/$slug", params: { slug: p.slug } });
  };

  const ctaLabel =
    data.accessBlocked ? "Access Unavailable"
    : data.status === "completed" ? "Review Program"
    : data.status === "not_started" ? "Start Program"
    : "Continue Program";

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1200px]">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 text-muted-foreground">
          <Link to="/student/programs"><ArrowLeft className="size-4 mr-1" /> Back to My Programs</Link>
        </Button>
      </div>

      {/* Hero */}
      <Card className="p-0 overflow-hidden">
        <div className="grid md:grid-cols-[1fr_320px]">
          <div className="p-6 lg:p-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn("font-mono text-[10px] uppercase tracking-widest", statusMeta.className)}>
                {statusMeta.label}
              </Badge>
              {p.category && (
                <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{p.category}</span>
              )}
              {p.level && <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">· {p.level}</span>}
              {p.learningMode && <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">· {p.learningMode}</span>}
            </div>
            <h1 className="text-2xl lg:text-3xl font-display font-semibold tracking-tight">{p.name}</h1>
            {p.description && <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">{p.description}</p>}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <Stat icon={Layers} label="Modules" value={`${data.completedModules}/${data.totalModules}`} />
              <Stat icon={BookOpen} label="Lessons" value={`${data.completedLessons}/${data.totalLessons}`} />
              <Stat icon={FileText} label="Assignments" value={String(data.assignmentsCompleted)} />
              <Stat icon={Clock} label="Duration" value={p.duration ?? "—"} />
            </div>

            <div className="pt-2 max-w-md">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                <span>Overall progress</span>
                <span>{data.progress}%</span>
              </div>
              <Progress value={data.progress} className="h-2" />
            </div>

            <div className="flex flex-wrap gap-2 pt-3">
              <Button size="lg" onClick={startOrContinue} disabled={data.accessBlocked || !p.slug}>
                <PlayCircle className="size-4 mr-2" /> {ctaLabel}
              </Button>
              {data.certificate && (
                <Button asChild size="lg" variant="outline">
                  <Link to="/student/certificates"><Award className="size-4 mr-2" /> View Certificate</Link>
                </Button>
              )}
            </div>
          </div>

          <div className="hidden md:block bg-surface-1 relative">
            {p.thumbnail ? (
              <img src={p.thumbnail} alt={p.name} className="size-full object-cover" />
            ) : (
              <div className="size-full flex items-center justify-center">
                <GraduationCap className="size-14 text-primary/40" />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Curriculum */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold tracking-tight">Curriculum</h2>
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            {data.totalModules} Modules · {data.totalLessons} Lessons
          </span>
        </div>

        {data.modules.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">Curriculum will be published soon.</Card>
        ) : (
          <div className="space-y-2">
            {data.modules.map((m: any) => {
              const isOpen = openIds.has(m.id);
              const moduleDone = m.totalLessons > 0 && m.completedLessons === m.totalLessons;
              const modulePct = m.totalLessons ? Math.round((m.completedLessons / m.totalLessons) * 100) : 0;
              return (
                <Card key={m.id} className="p-0 overflow-hidden">
                  <button
                    onClick={() => {
                      setOpenIds((prev) => {
                        const next = new Set(prev);
                        next.has(m.id) ? next.delete(m.id) : next.add(m.id);
                        return next;
                      });
                      if (!isOpen && p.id) {
                        track.mutate({ courseId: p.id, activity: "module_opened", entityId: m.id, description: `Opened module ${m.name}` });
                      }
                    }}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface-1/50 transition-colors"
                  >
                    <div className={cn(
                      "size-9 rounded-lg flex items-center justify-center text-sm font-mono font-semibold shrink-0",
                      moduleDone ? "bg-emerald-50 text-emerald-700" : "bg-primary/10 text-primary",
                    )}>
                      {String(m.number).padStart(2, "0")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{m.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {m.completedLessons}/{m.totalLessons} lessons · {modulePct}% complete
                      </div>
                    </div>
                    {isOpen ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                  </button>
                  {isOpen && (
                    <div className="border-t divide-y">
                      {m.lessons.length === 0 ? (
                        <div className="p-4 text-xs text-muted-foreground">No lessons yet.</div>
                      ) : m.lessons.map((l: any) => (
                        <div key={l.id} className="flex items-center gap-3 px-4 py-2.5">
                          <LessonIcon status={l.status} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm truncate">{l.name}</div>
                            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-0.5">
                              {l.type ?? "Lesson"}{l.duration ? ` · ${l.duration}` : ""}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-surface-1/50 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        <Icon className="size-3" /> {label}
      </div>
      <div className="mt-1 font-display text-base font-semibold">{value}</div>
    </div>
  );
}
