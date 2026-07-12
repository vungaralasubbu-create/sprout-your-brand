import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getStudentOverview } from "@/lib/student/lms.functions";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, GraduationCap, TrendingUp, Award, ArrowRight, CheckCircle2, FileText, ClipboardCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/dashboard")({ component: Page });

const ACTIVITY_ICON: Record<string, any> = {
  lesson_completed: CheckCircle2,
  assignment_submitted: FileText,
  assessment_completed: ClipboardCheck,
  course_completed: GraduationCap,
  certificate_issued: Award,
};

function Page() {
  const fn = useServerFn(getStudentOverview);
  const { data, isLoading } = useQuery({ queryKey: ["student-overview"], queryFn: () => fn() });

  if (isLoading) return <div className="p-10 text-muted-foreground">Loading…</div>;
  const k = data?.kpis ?? { active: 0, completed: 0, avgProgress: 0, certificates: 0 };

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-[1400px]">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight">Keep Learning.<br/>Keep Building.</h1>
          <p className="mt-2 text-muted-foreground">Your learning journey in one clean workspace.</p>
        </div>
        {data?.continueLearning ? (
          <Button asChild size="lg">
            <Link to="/student/learn/$slug" params={{ slug: data.continueLearning.slug! }}>
              Continue Learning <ArrowRight className="size-4 ml-1" />
            </Link>
          </Button>
        ) : (
          <Button asChild size="lg" variant="outline"><Link to="/programs">Browse Programs</Link></Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Kpi icon={BookOpen} label="Active Courses" value={k.active} />
        <Kpi icon={GraduationCap} label="Completed" value={k.completed} />
        <Kpi icon={TrendingUp} label="Learning Progress" value={`${k.avgProgress}%`} />
        <Kpi icon={Award} label="Certificates" value={k.certificates} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold">Your Courses</h2>
            <Button asChild variant="ghost" size="sm"><Link to="/student/courses">View all</Link></Button>
          </div>
          <div className="space-y-4">
            {(data?.enrollments ?? []).length === 0 && (
              <div className="text-sm text-muted-foreground">You are not enrolled in any course yet.</div>
            )}
            {(data?.enrollments ?? []).slice(0, 4).map((e: any) => (
              <div key={e.id} className="flex items-center gap-4 p-3 rounded-lg border bg-white">
                <div className="size-12 rounded-lg bg-surface-1 shrink-0 overflow-hidden">
                  {e.course?.thumbnail_url && <img src={e.course.thumbnail_url} alt="" className="size-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium truncate">{e.course?.name ?? e.program_title}</div>
                    <Badge variant={e.lms_status === "completed" ? "success" : e.lms_status === "paused" ? "muted" : "outline"}>{e.lms_status}</Badge>
                  </div>
                  <Progress value={e.progress} className="mt-2 h-1.5" />
                  <div className="mt-1 text-[11px] text-muted-foreground">{e.progress}% complete</div>
                </div>
                {e.course?.slug && (
                  <Button asChild size="sm" variant="outline">
                    <Link to="/student/learn/$slug" params={{ slug: e.course.slug }}>Open</Link>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {(data?.recentActivity ?? []).length === 0 && (
              <div className="text-sm text-muted-foreground">No recent activity yet.</div>
            )}
            {(data?.recentActivity ?? []).map((a: any) => {
              const Icon = ACTIVITY_ICON[a.activity_type] ?? CheckCircle2;
              return (
                <div key={a.id} className="flex items-start gap-3 text-sm">
                  <div className="mt-0.5 size-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="size-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{a.description}</div>
                    <div className="text-[11px] text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="text-caption font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
        <Icon className="size-4 text-primary" />
      </div>
      <div className="mt-2 font-display text-3xl font-semibold">{value}</div>
    </Card>
  );
}
