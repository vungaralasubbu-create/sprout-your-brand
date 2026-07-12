import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getStudentOverview } from "@/lib/student/lms.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/student/learn/")({ component: Page });

function Page() {
  const fn = useServerFn(getStudentOverview);
  const { data } = useQuery({ queryKey: ["student-overview"], queryFn: () => fn() });
  const cont = data?.continueLearning;
  return (
    <div className="p-6 lg:p-10">
      <h1 className="text-3xl font-display font-semibold tracking-tight">Learn</h1>
      <p className="mt-1 text-muted-foreground text-sm">Jump back into your active course.</p>
      <Card className="mt-6 p-6">
        {cont ? (
          <>
            <div className="text-caption font-mono uppercase tracking-widest text-muted-foreground">Continue Learning</div>
            <div className="mt-1 font-display text-xl font-semibold">{cont.name}</div>
            <Button asChild className="mt-4">
              <Link to="/student/learn/$slug" params={{ slug: cont.slug! }}>Open course player</Link>
            </Button>
          </>
        ) : (
          <>
            <div className="text-sm text-muted-foreground">No active course to continue.</div>
            <Button asChild variant="outline" className="mt-4"><Link to="/student/courses">Go to My Courses</Link></Button>
          </>
        )}
      </Card>
    </div>
  );
}
