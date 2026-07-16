import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyCourses } from "@/lib/student/lms.functions";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/student/courses")({ component: Page });

function Page() {
  const fn = useServerFn(listMyCourses);
  const { data = [], isLoading } = useQuery({ queryKey: ["my-courses"], queryFn: () => fn() });

  return (
    <div className="p-6 lg:p-10 space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-3xl font-display font-semibold tracking-tight">My Courses</h1>
        <p className="mt-1 text-muted-foreground text-sm">Every course you're enrolled in.</p>
      </div>

      {isLoading ? <div className="text-muted-foreground">Loading…</div> : null}

      {!isLoading && data.length === 0 && (
        <Card className="p-10 text-center">
          <div className="font-display text-lg mb-1">No enrollments yet.</div>
          <div className="text-sm text-muted-foreground mb-4">Explore Glintr programs and get started.</div>
          <Button asChild><Link to="/student/programs">Browse Programs</Link></Button>
        </Card>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {data.map((c: any) => (
          <Card key={c.enrollmentId} className="p-0 overflow-hidden">
            <div className="aspect-video bg-surface-1 relative">
              {c.thumbnail && <img src={c.thumbnail} alt="" className="size-full object-cover" />}
              <Badge className="absolute top-3 left-3" variant={c.status === "completed" ? "success" : c.status === "paused" ? "muted" : "primary"}>{c.status}</Badge>
            </div>
            <div className="p-5">
              <div className="text-caption font-mono uppercase tracking-widest text-muted-foreground">{c.category ?? "Program"}</div>
              <div className="mt-1 font-display text-lg font-semibold leading-snug">{c.title}</div>
              {c.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{c.description}</p>}
              <div className="mt-4">
                <Progress value={c.progress} className="h-1.5" />
                <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                  <span>{c.progress}% complete</span>
                  <span>{c.completedLessons}/{c.totalLessons} lessons</span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>Enrolled {new Date(c.enrolledAt).toLocaleDateString()}</span>
                {c.slug && (
                  <Button asChild size="sm">
                    <Link to="/student/learn/$slug" params={{ slug: c.slug }}>Continue Learning</Link>
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
