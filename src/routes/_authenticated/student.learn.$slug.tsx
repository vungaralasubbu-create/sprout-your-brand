import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getCoursePlayer,
  openLesson,
  completeLesson,
  saveVideoProgress,
  getLessonNotes,
  saveLessonNotes,
  logLessonEvent,
} from "@/lib/student/lms.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  CheckCircle2, ChevronLeft, ChevronRight, Menu, Play, FileText, ExternalLink,
  Video, Lock, PlayCircle, BookOpen, ArrowLeft, StickyNote, Download, Link2,
  AlertTriangle, GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/student/learn/$slug")({ component: Page });

const TYPE_ICON: Record<string, any> = {
  video: Video, text: FileText, reading: BookOpen, pdf: FileText, external: ExternalLink,
};

function formatTime(seconds: number) {
  if (!seconds || !Number.isFinite(seconds)) return "0:00";
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
}

/* ---------- Video player with progress + resume ---------- */

function VideoLessonPlayer({
  lesson, courseId, enrollmentId, thresholdPct, onReachedCompletion,
}: {
  lesson: any; courseId: string; enrollmentId: string; thresholdPct: number;
  onReachedCompletion?: () => void;
}) {
  const saveFn = useServerFn(saveVideoProgress);
  const logFn = useServerFn(logLessonEvent);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(lesson.last_position_seconds ?? 0);
  const [pct, setPct] = useState(lesson.video_progress_pct ?? 0);
  const [resumed, setResumed] = useState(false);
  const [showResume, setShowResume] = useState((lesson.last_position_seconds ?? 0) > 5 && (lesson.video_progress_pct ?? 0) < 95);
  const [videoStarted, setVideoStarted] = useState(false);
  const lastSavedRef = useRef({ pct: pct, at: 0 });
  const reachedRef = useRef(false);

  const src = lesson.resource_url as string | null;
  const isEmbed = !!src && !/\.(mp4|webm|ogg|m4v|mov)(\?.*)?$/i.test(src);

  useEffect(() => {
    // Reset local state when lesson changes
    setDuration(0);
    setCurrent(lesson.last_position_seconds ?? 0);
    setPct(lesson.video_progress_pct ?? 0);
    setResumed(false);
    setShowResume((lesson.last_position_seconds ?? 0) > 5 && (lesson.video_progress_pct ?? 0) < 95);
    setVideoStarted(false);
    lastSavedRef.current = { pct: lesson.video_progress_pct ?? 0, at: 0 };
    reachedRef.current = (lesson.video_progress_pct ?? 0) >= thresholdPct;
  }, [lesson.id]);

  function persist(nextPct: number, position: number, force = false) {
    const now = Date.now();
    const delta = Math.abs(nextPct - lastSavedRef.current.pct);
    if (!force && delta < 5 && now - lastSavedRef.current.at < 15_000) return;
    lastSavedRef.current = { pct: nextPct, at: now };
    saveFn({
      data: {
        lessonId: lesson.id, courseId, enrollmentId,
        positionSeconds: position, progressPct: nextPct,
      },
    }).catch(() => {});
  }

  function onTimeUpdate() {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const pos = v.currentTime;
    setCurrent(pos);
    const p = Math.min(100, Math.round((pos / v.duration) * 100));
    if (p > pct) setPct(p);
    if (!reachedRef.current && p >= thresholdPct) {
      reachedRef.current = true;
      onReachedCompletion?.();
    }
    persist(Math.max(p, pct), pos);
  }

  async function onPlay() {
    if (!videoStarted) {
      setVideoStarted(true);
      logFn({ data: { courseId, lessonId: lesson.id, event: "video_started", description: "Video started" } }).catch(() => {});
    }
    // Auto-resume from saved position
    if (!resumed && showResume && videoRef.current && lesson.last_position_seconds > 5) {
      videoRef.current.currentTime = Number(lesson.last_position_seconds);
      setResumed(true);
      setShowResume(false);
    }
  }

  function onLoadedMetadata() {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration || 0);
  }

  function onPause() {
    const v = videoRef.current;
    if (!v) return;
    persist(pct, v.currentTime, true);
  }

  function onEnded() {
    const v = videoRef.current;
    if (!v) return;
    persist(100, v.duration, true);
    setPct(100);
    if (!reachedRef.current) { reachedRef.current = true; onReachedCompletion?.(); }
  }

  if (!src) {
    return (
      <div className="aspect-video rounded-xl border bg-gradient-to-br from-surface-1 to-white flex flex-col items-center justify-center text-center p-6">
        <Video className="size-8 text-muted-foreground/50 mb-2" />
        <div className="font-medium">Video Not Available Yet</div>
        <div className="text-sm text-muted-foreground mt-1">The instructor hasn't uploaded a video for this lesson.</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
        {isEmbed ? (
          <iframe
            src={src}
            title={lesson.name}
            className="size-full"
            allow="fullscreen; encrypted-media; picture-in-picture; autoplay"
            allowFullScreen
            onLoad={() => {
              if (!videoStarted) {
                setVideoStarted(true);
                logFn({ data: { courseId, lessonId: lesson.id, event: "video_started", description: "Video opened" } }).catch(() => {});
              }
            }}
          />
        ) : (
          <video
            ref={videoRef}
            src={src}
            controls
            playsInline
            className="size-full"
            onPlay={onPlay}
            onLoadedMetadata={onLoadedMetadata}
            onTimeUpdate={onTimeUpdate}
            onPause={onPause}
            onEnded={onEnded}
          />
        )}
      </div>

      {/* Native video: resume banner + progress line */}
      {!isEmbed && (
        <>
          {showResume && lesson.last_position_seconds > 5 && (
            <div className="flex items-center gap-3 rounded-lg border bg-primary/5 border-primary/20 px-3 py-2 text-sm">
              <PlayCircle className="size-4 text-primary" />
              <div className="flex-1">
                Resume from <span className="font-medium">{formatTime(lesson.last_position_seconds)}</span>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  const v = videoRef.current;
                  if (v) { v.currentTime = Number(lesson.last_position_seconds); v.play().catch(() => {}); }
                  setResumed(true); setShowResume(false);
                }}
              >
                Continue
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowResume(false)}>Start over</Button>
            </div>
          )}
          <div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
              <span>{formatTime(current)} / {formatTime(duration)}</span>
              <span>{pct}% watched · complete at {thresholdPct}%</span>
            </div>
            <Progress value={pct} className="h-1.5" />
          </div>
        </>
      )}
      {isEmbed && (
        <div className="text-[11px] text-muted-foreground">
          Playback is delivered via an embedded player. Watch through and mark complete when you're done.
        </div>
      )}
    </div>
  );
}

/* ---------- Lesson body dispatcher ---------- */

function LessonBody({
  lesson, courseId, enrollmentId, thresholdPct, onReachedCompletion,
}: {
  lesson: any; courseId: string; enrollmentId: string; thresholdPct: number;
  onReachedCompletion?: () => void;
}) {
  if (lesson.type === "video") {
    return (
      <VideoLessonPlayer
        lesson={lesson} courseId={courseId} enrollmentId={enrollmentId}
        thresholdPct={thresholdPct} onReachedCompletion={onReachedCompletion}
      />
    );
  }

  if (lesson.type === "pdf") {
    return lesson.resource_url ? (
      <div className="rounded-xl overflow-hidden border bg-white">
        <iframe src={lesson.resource_url} title={lesson.name} className="w-full h-[70vh]" />
      </div>
    ) : (
      <EmptyBlock msg="PDF material will be uploaded soon." />
    );
  }

  if (lesson.type === "external") {
    return lesson.resource_url ? (
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <ExternalLink className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium">{lesson.name}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Open the external learning resource in a new tab, then return here to mark the lesson complete.
            </div>
            <Button asChild size="sm" className="mt-3">
              <a href={lesson.resource_url} target="_blank" rel="noreferrer">
                Open Resource <ExternalLink className="size-4 ml-1" />
              </a>
            </Button>
          </div>
        </div>
      </Card>
    ) : (
      <EmptyBlock msg="External learning link will be added soon." />
    );
  }

  // Text / reading / fallback
  const body = lesson.content ?? lesson.description ?? null;
  if (!body) return <EmptyBlock msg="Lesson content will be published by the course team." />;
  return (
    <Card className="p-6">
      <article className="prose prose-sm max-w-none whitespace-pre-wrap leading-relaxed">
        {body}
      </article>
    </Card>
  );
}

function EmptyBlock({ msg }: { msg: string }) {
  return (
    <Card className="p-8 text-center text-sm text-muted-foreground">{msg}</Card>
  );
}

/* ---------- Notes ---------- */

function NotesPanel({ lessonId, courseId }: { lessonId: string; courseId: string }) {
  const getFn = useServerFn(getLessonNotes);
  const saveFn = useServerFn(saveLessonNotes);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["lesson-notes", lessonId],
    queryFn: () => getFn({ data: { lessonId } }),
  });
  const [value, setValue] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => { setValue(data?.notes ?? ""); setDirty(false); }, [data?.notes, lessonId]);

  const save = useMutation({
    mutationFn: () => saveFn({ data: { lessonId, courseId, notes: value } }),
    onSuccess: () => {
      setDirty(false);
      toast.success("Notes saved");
      qc.invalidateQueries({ queryKey: ["lesson-notes", lessonId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Couldn't save notes"),
  });

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <StickyNote className="size-4 text-primary" />
        <div className="font-medium text-sm">My Notes</div>
        <span className="text-[10px] text-muted-foreground ml-auto">Private to you</span>
      </div>
      <Textarea
        value={value}
        placeholder="Write your notes for this lesson…"
        rows={5}
        disabled={isLoading}
        onChange={(e) => { setValue(e.target.value); setDirty(true); }}
        className="text-sm resize-y"
      />
      <div className="flex items-center justify-between mt-2">
        <div className="text-[11px] text-muted-foreground">
          {data?.updated_at ? `Last saved ${new Date(data.updated_at).toLocaleString()}` : "Not saved yet"}
        </div>
        <Button size="sm" onClick={() => save.mutate()} disabled={!dirty || save.isPending}>
          {save.isPending ? "Saving…" : "Save Notes"}
        </Button>
      </div>
    </Card>
  );
}

/* ---------- Resources ---------- */

function ResourcesPanel({
  lesson, courseId,
}: { lesson: any; courseId: string }) {
  const logFn = useServerFn(logLessonEvent);
  // If the primary resource is not the video/pdf primary render, expose it as a resource.
  const hasSecondary =
    !!lesson.resource_url && (lesson.type === "text" || lesson.type === "reading");
  if (!hasSecondary) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Link2 className="size-4 text-primary" />
          <div className="font-medium text-sm">Lesson Resources</div>
        </div>
        <div className="text-xs text-muted-foreground">
          No additional resources attached to this lesson.
        </div>
      </Card>
    );
  }
  const isDownload = /\.(pdf|docx?|xlsx?|csv|zip|txt)(\?.*)?$/i.test(lesson.resource_url ?? "");
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <Link2 className="size-4 text-primary" />
        <div className="font-medium text-sm">Lesson Resources</div>
      </div>
      <a
        href={lesson.resource_url}
        target="_blank"
        rel="noreferrer"
        onClick={() => logFn({ data: { courseId, lessonId: lesson.id, event: "resource_opened", description: "Opened lesson resource" } }).catch(() => {})}
        className="flex items-center gap-3 rounded-lg border p-3 hover:bg-surface-1 transition-colors"
      >
        <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
          {isDownload ? <Download className="size-4" /> : <ExternalLink className="size-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{lesson.name}</div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {isDownload ? "Download resource" : "External link"}
          </div>
        </div>
        <ChevronRight className="size-4 text-muted-foreground" />
      </a>
    </Card>
  );
}

/* ---------- Curriculum sidebar ---------- */

function CurriculumSidebar({
  data, currentId, onSelect,
}: { data: any; currentId: string | null; onSelect: (id: string) => void }) {
  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      <div>
        <Link to="/student/programs" className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-primary inline-flex items-center gap-1">
          <ArrowLeft className="size-3" /> Back to My Programs
        </Link>
        <div className="mt-2 font-display text-base font-semibold leading-snug">{data.course.name}</div>
        <Progress value={data.progressPct} className="mt-2 h-1.5" />
        <div className="mt-1 text-[11px] text-muted-foreground">
          {data.completedLessons}/{data.totalLessons} lessons · {data.progressPct}%
        </div>
      </div>
      <div className="space-y-4">
        {data.modules.map((m: any) => (
          <div key={m.id}>
            <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
              Module {String(m.number).padStart(2, "0")} · {m.name}
            </div>
            <div className="space-y-2">
              {m.topics.map((t: any) => (
                <div key={t.id}>
                  {t.name && (
                    <div className="text-[10px] font-medium text-foreground/60 px-1 pb-0.5">{t.name}</div>
                  )}
                  <div className="space-y-0.5">
                    {t.lessons.map((l: any) => {
                      const active = currentId === l.id;
                      const Icon = TYPE_ICON[l.type] ?? Play;
                      return (
                        <button
                          key={l.id}
                          onClick={() => onSelect(l.id)}
                          className={cn(
                            "w-full text-left flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
                            active ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted",
                          )}
                        >
                          {l.status === "completed" ? (
                            <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                          ) : l.status === "in_progress" ? (
                            <PlayCircle className="size-3.5 text-primary shrink-0" />
                          ) : (
                            <Icon className="size-3.5 text-muted-foreground shrink-0" />
                          )}
                          <span className="flex-1 truncate">{l.name}</span>
                          {l.duration && <span className="text-[10px] text-muted-foreground">{l.duration}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Page ---------- */

function Page() {
  const { slug } = Route.useParams();
  const qc = useQueryClient();
  const fetchFn = useServerFn(getCoursePlayer);
  const openFn = useServerFn(openLesson);
  const completeFn = useServerFn(completeLesson);
  const logFn = useServerFn(logLessonEvent);

  const [lessonId, setLessonId] = useState<string | undefined>(undefined);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reachedThreshold, setReachedThreshold] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["player", slug, lessonId],
    queryFn: () => fetchFn({ data: { slug, lessonId } }),
    retry: false,
  });

  const current = data?.current;

  useEffect(() => {
    if (!current || !data?.enrollmentId) return;
    openFn({ data: { lessonId: current.id, courseId: data.course.id, enrollmentId: data.enrollmentId } }).catch(() => {});
    logFn({ data: { courseId: data.course.id, lessonId: current.id, event: "lesson_opened", description: `Opened ${current.name}` } }).catch(() => {});
    setReachedThreshold((current.video_progress_pct ?? 0) >= (data.videoCompletionThresholdPct ?? 90));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  const canComplete = useMemo(() => {
    if (!current) return false;
    if (current.status === "completed") return false;
    if (current.type === "video") {
      return reachedThreshold || (current.video_progress_pct ?? 0) >= (data?.videoCompletionThresholdPct ?? 90);
    }
    return true;
  }, [current, reachedThreshold, data?.videoCompletionThresholdPct]);

  async function markDone() {
    if (!current || !data) return;
    try {
      await completeFn({ data: { lessonId: current.id, courseId: data.course.id, enrollmentId: data.enrollmentId, lessonName: current.name } });
      toast.success("Lesson marked complete");
      qc.invalidateQueries({ queryKey: ["player"] });
      qc.invalidateQueries({ queryKey: ["student-overview"] });
      qc.invalidateQueries({ queryKey: ["my-programs"] });
      if (data.next) setLessonId(data.next.id);
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't mark complete");
    }
  }

  /* ---- Loading state ---- */
  if (isLoading) {
    return (
      <div className="lg:grid lg:grid-cols-[320px_1fr] min-h-screen">
        <aside className="hidden lg:block border-r bg-white p-4 space-y-3">
          <div className="h-4 w-32 bg-surface-1 rounded animate-pulse" />
          <div className="h-3 w-40 bg-surface-1 rounded animate-pulse" />
          <div className="h-1.5 w-full bg-surface-1 rounded animate-pulse" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-7 bg-surface-1 rounded animate-pulse" />
          ))}
        </aside>
        <div className="p-4 lg:p-8 max-w-4xl mx-auto w-full space-y-4">
          <div className="h-4 w-40 bg-surface-1 rounded animate-pulse" />
          <div className="h-8 w-2/3 bg-surface-1 rounded animate-pulse" />
          <div className="aspect-video bg-surface-1 rounded-xl animate-pulse" />
          <div className="h-24 bg-surface-1 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  /* ---- Error / access-restricted state ---- */
  if (error || !data) {
    const msg = (error as any)?.message ?? "";
    const restricted = /not enrolled|not found|unauth|permission/i.test(msg);
    return (
      <div className="p-8 max-w-xl">
        <Card className="p-8 text-center">
          {restricted ? (
            <>
              <Lock className="size-8 text-amber-600 mx-auto mb-2" />
              <div className="font-display text-lg font-semibold">Lesson Access Restricted</div>
              <div className="text-sm text-muted-foreground mt-1">
                You don't have access to this program yet.
              </div>
            </>
          ) : (
            <>
              <AlertTriangle className="size-8 text-rose-600 mx-auto mb-2" />
              <div className="font-display text-lg font-semibold">Unable To Load Lesson</div>
              <div className="text-sm text-muted-foreground mt-1">Please try again in a moment.</div>
              <Button className="mt-4" onClick={() => refetch()}>Retry</Button>
            </>
          )}
          <div className="mt-5">
            <Button asChild variant="outline">
              <Link to="/student/programs">
                <ArrowLeft className="size-4 mr-1" /> Back to My Programs
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="p-8">
        <Card className="p-8 text-center">
          <GraduationCap className="size-8 text-primary/60 mx-auto mb-2" />
          <div className="font-display text-lg font-semibold">No Lessons Yet</div>
          <div className="text-sm text-muted-foreground mt-1">Curriculum for this program will be published soon.</div>
          <Button asChild className="mt-4" variant="outline">
            <Link to="/student/programs">Back to My Programs</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const nextLocked = false; // access rules are enforced server-side; every lesson listed here is authorized
  const positionLabel = `Lesson ${current.position} of ${data.totalLessons}`;

  return (
    <div className="lg:grid lg:grid-cols-[320px_1fr] min-h-screen bg-[oklch(0.98_0.005_240)]">
      <aside className="hidden lg:block border-r bg-white sticky top-0 h-screen overflow-hidden">
        <CurriculumSidebar data={data} currentId={current.id} onSelect={(id) => setLessonId(id)} />
      </aside>

      <div className="w-full">
        <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 border-b bg-white">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Menu className="size-4 mr-1" /> Curriculum
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[85vw] max-w-sm">
              <SheetTitle className="sr-only">Curriculum</SheetTitle>
              <CurriculumSidebar
                data={data}
                currentId={current.id}
                onSelect={(id) => { setLessonId(id); setSidebarOpen(false); }}
              />
            </SheetContent>
          </Sheet>
          <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground truncate">
            {positionLabel}
          </div>
        </div>

        <div className="p-4 lg:p-8 max-w-5xl mx-auto w-full space-y-5">
          {/* Breadcrumb + header */}
          <div>
            <div className="flex items-center flex-wrap gap-1 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              <span>{data.course.name}</span>
              <span>·</span>
              <span>Module {String(current.moduleNumber).padStart(2, "0")}</span>
              <span>·</span>
              <span>{current.moduleName}</span>
              <span>·</span>
              <span>{positionLabel}</span>
            </div>
            <h1 className="mt-1 text-2xl lg:text-3xl font-display font-semibold tracking-tight">
              {current.name}
            </h1>
            <div className="mt-2 flex items-center flex-wrap gap-2">
              <Badge variant="muted" className="capitalize">{current.type}</Badge>
              {current.duration && <span className="text-xs text-muted-foreground">{current.duration}</span>}
              {current.status === "completed" ? (
                <Badge variant="success"><CheckCircle2 className="size-3 mr-1" /> Completed</Badge>
              ) : current.status === "in_progress" ? (
                <Badge variant="info">In Progress</Badge>
              ) : (
                <Badge variant="muted">Not Started</Badge>
              )}
            </div>
          </div>

          {/* Two-column body (main + right side) */}
          <div className="grid lg:grid-cols-[1fr_320px] gap-5">
            <div className="min-w-0 space-y-4">
              <LessonBody
                lesson={current}
                courseId={data.course.id}
                enrollmentId={data.enrollmentId}
                thresholdPct={data.videoCompletionThresholdPct}
                onReachedCompletion={() => setReachedThreshold(true)}
              />

              {current.description && current.type === "video" && (
                <Card className="p-4">
                  <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
                    About this lesson
                  </div>
                  <div className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                    {current.description}
                  </div>
                </Card>
              )}

              {/* Nav */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between pt-2">
                <Button
                  variant="outline"
                  disabled={!data.prev}
                  onClick={() => data.prev && setLessonId(data.prev.id)}
                >
                  <ChevronLeft className="size-4 mr-1" /> Previous Lesson
                </Button>
                <div className="flex flex-col sm:flex-row gap-2">
                  {current.status !== "completed" && (
                    <Button onClick={markDone} disabled={!canComplete}>
                      <CheckCircle2 className="size-4 mr-1" />
                      {canComplete
                        ? "Mark Lesson Complete"
                        : current.type === "video"
                          ? `Watch ${data.videoCompletionThresholdPct}% to complete`
                          : "Mark Lesson Complete"}
                    </Button>
                  )}
                  <Button
                    variant={current.status === "completed" ? "primary" : "outline"}
                    disabled={!data.next || nextLocked}
                    onClick={() => data.next && setLessonId(data.next.id)}
                  >
                    {!data.next ? "Last Lesson" : nextLocked ? (<><Lock className="size-4 mr-1" /> Next Lesson Locked</>) : (<>Next Lesson <ChevronRight className="size-4 ml-1" /></>)}
                  </Button>
                </div>
              </div>

              {/* Notes below on desktop-narrow / mobile; right column on desktop-wide */}
              <div className="lg:hidden space-y-4">
                <ResourcesPanel lesson={current} courseId={data.course.id} />
                <NotesPanel lessonId={current.id} courseId={data.course.id} />
              </div>
            </div>

            <div className="hidden lg:block space-y-4">
              <ResourcesPanel lesson={current} courseId={data.course.id} />
              <NotesPanel lessonId={current.id} courseId={data.course.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
