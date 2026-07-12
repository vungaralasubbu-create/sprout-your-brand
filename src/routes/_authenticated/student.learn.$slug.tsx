import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getCoursePlayer, openLesson, completeLesson } from "@/lib/student/lms.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CheckCircle2, ChevronLeft, ChevronRight, Menu, Play, FileText, ExternalLink, Video, ClipboardList, GraduationCap, FolderKanban, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/student/learn/$slug")({ component: Page });

const TYPE_ICON: Record<string, any> = {
  video: Video, text: FileText, pdf: FileText, quiz: GraduationCap, assignment: ClipboardList,
  project: FolderKanban, live: CalendarClock, external: ExternalLink,
};

function Page() {
  const { slug } = Route.useParams();
  const qc = useQueryClient();
  const fetchFn = useServerFn(getCoursePlayer);
  const openFn = useServerFn(openLesson);
  const completeFn = useServerFn(completeLesson);
  const [lessonId, setLessonId] = useState<string | undefined>(undefined);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["player", slug, lessonId],
    queryFn: () => fetchFn({ data: { slug, lessonId } }),
  });

  useEffect(() => {
    if (data?.current && data.enrollmentId) {
      openFn({ data: { lessonId: data.current.id, courseId: data.course.id, enrollmentId: data.enrollmentId } }).catch(() => {});
    }
  }, [data?.current?.id]);

  if (isLoading) return <div className="p-10 text-muted-foreground">Loading…</div>;
  if (error) return (
    <div className="p-10">
      <div className="text-lg font-semibold">Can't open this course.</div>
      <div className="text-sm text-muted-foreground mt-1">{(error as any).message}</div>
      <Button asChild className="mt-4"><Link to="/student/courses">Back to My Courses</Link></Button>
    </div>
  );
  if (!data) return null;

  const current = data.current;

  async function markDone() {
    if (!current || !data) return;
    try {
      await completeFn({ data: { lessonId: current.id, courseId: data.course.id, enrollmentId: data.enrollmentId, lessonName: current.name } });
      toast.success("Lesson marked complete");
      qc.invalidateQueries({ queryKey: ["player"] });
      qc.invalidateQueries({ queryKey: ["student-overview"] });
      if (data.next) setLessonId(data.next.id);
    } catch (e: any) { toast.error(e.message); }
  }

  const Sidebar = (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      <div>
        <div className="text-caption font-mono uppercase tracking-widest text-muted-foreground">Course</div>
        <div className="font-display text-base font-semibold leading-snug mt-1">{data.course.name}</div>
        <Progress value={data.progressPct} className="mt-2 h-1.5" />
        <div className="mt-1 text-[11px] text-muted-foreground">{data.completedLessons}/{data.totalLessons} lessons · {data.progressPct}%</div>
      </div>
      <div className="space-y-4">
        {data.modules.map((m: any, mi: number) => (
          <div key={m.id}>
            <div className="text-xs font-semibold text-foreground/80 mb-1">Module {mi + 1} · {m.name}</div>
            {m.topics.map((t: any) => (
              <div key={t.id} className="mb-2">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">{t.name}</div>
                <div className="space-y-0.5">
                  {t.lessons.map((l: any) => {
                    const active = current?.id === l.id;
                    const Icon = TYPE_ICON[l.type] ?? Play;
                    return (
                      <button
                        key={l.id}
                        onClick={() => { setLessonId(l.id); setSidebarOpen(false); }}
                        className={cn(
                          "w-full text-left flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
                          active ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted",
                        )}
                      >
                        {l.status === "completed"
                          ? <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                          : <Icon className="size-3.5 shrink-0" />}
                        <span className="flex-1 truncate">{l.name}</span>
                        {l.duration && <span className="text-[10px] text-muted-foreground">{l.duration}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="lg:grid lg:grid-cols-[320px_1fr] min-h-screen">
      <aside className="hidden lg:block border-r bg-white sticky top-0 h-screen overflow-hidden">{Sidebar}</aside>

      <div className="p-4 lg:p-8 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-4">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden"><Menu className="size-4" /> Curriculum</Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80">{Sidebar}</SheetContent>
          </Sheet>
          <Link to="/student/courses" className="text-xs text-muted-foreground hover:text-primary hidden lg:inline">
            ← Back to My Courses
          </Link>
        </div>

        {current ? (
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{data.course.name}</span>
              <span>·</span>
              <span>{current.moduleName}</span>
            </div>
            <h1 className="mt-1 text-2xl lg:text-3xl font-display font-semibold tracking-tight">{current.name}</h1>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="muted">{current.type}</Badge>
              {current.duration && <span className="text-xs text-muted-foreground">{current.duration}</span>}
              {current.status === "completed" && <Badge variant="success">Completed</Badge>}
            </div>

            <div className="mt-6 rounded-xl border bg-white p-6">
              <LessonBody lesson={current as any} />
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-between">
              <Button variant="outline" disabled={!data.prev} onClick={() => data.prev && setLessonId(data.prev.id)}>
                <ChevronLeft className="size-4" /> Previous
              </Button>
              <div className="flex gap-3">
                {current.status !== "completed" && <Button onClick={markDone}>Mark as Complete</Button>}
                <Button variant={current.status === "completed" ? "primary" : "outline"} disabled={!data.next} onClick={() => data.next && setLessonId(data.next.id)}>
                  Next <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground">No lessons available in this course yet.</div>
        )}
      </div>
    </div>
  );
}

function LessonBody({ lesson }: { lesson: { type: string; resource_url: string | null; name: string } }) {
  const { type, resource_url } = lesson;
  if (type === "video") {
    if (resource_url) return (
      <div className="aspect-video rounded-md overflow-hidden bg-black">
        <iframe src={resource_url} title={lesson.name} className="size-full" allow="fullscreen; encrypted-media" />
      </div>
    );
    return <Empty msg="Video will be available shortly." />;
  }
  if (type === "pdf") return resource_url
    ? <div className="aspect-[4/5] rounded-md overflow-hidden border"><iframe src={resource_url} title={lesson.name} className="size-full" /></div>
    : <Empty msg="Reading material will be uploaded soon." />;
  if (type === "external") return resource_url
    ? <a href={resource_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary font-medium hover:underline">Open external resource <ExternalLink className="size-4" /></a>
    : <Empty msg="External link coming soon." />;
  if (type === "live") return <div className="text-sm">
    <div>Live session lesson.</div>
    {resource_url && <a href={resource_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-primary hover:underline">Join session <ExternalLink className="size-4" /></a>}
  </div>;
  if (type === "quiz") return <div className="text-sm">
    <div className="mb-3">This lesson is an assessment. Head over to Assessments to take it.</div>
    <Button asChild size="sm"><Link to="/student/assessments">Open Assessments</Link></Button>
  </div>;
  if (type === "assignment") return <div className="text-sm">
    <div className="mb-3">This lesson is an assignment. Open the Assignments workspace to submit.</div>
    <Button asChild size="sm"><Link to="/student/assignments">Open Assignments</Link></Button>
  </div>;
  if (type === "project") return <div className="text-sm">
    <div className="mb-1 font-medium">Project brief</div>
    <div className="text-muted-foreground">Instructions for your project will appear here.</div>
  </div>;
  // text or fallback
  return <div className="prose prose-sm max-w-none">
    <p>{lesson.name}</p>
    <p className="text-muted-foreground">Lesson content will be published by the course team.</p>
  </div>;
}

function Empty({ msg }: { msg: string }) {
  return <div className="rounded-md bg-surface-1 text-sm text-muted-foreground p-6 text-center">{msg}</div>;
}
