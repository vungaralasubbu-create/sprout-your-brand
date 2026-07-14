import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Radio, ArrowLeft, CalendarClock, Clock, Video, PlayCircle, ExternalLink,
  User, FileText, Link2, CheckCircle2, XCircle, RotateCcw, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getLiveSessionDetails, joinLiveSession, openSessionRecording, recordSessionActivity,
} from "@/lib/student/live-sessions.functions";

export const Route = createFileRoute("/_authenticated/student/live-sessions/$id")({
  component: Page,
});

const STATUS_META: Record<string, { label: string; className: string; Icon: any }> = {
  scheduled:     { label: "Scheduled",     className: "bg-muted text-foreground/70 border-border", Icon: CalendarClock },
  starting_soon: { label: "Starting Soon", className: "bg-amber-50 text-amber-800 border-amber-200", Icon: Clock },
  live:          { label: "Live Now",      className: "bg-rose-50 text-rose-700 border-rose-200 animate-pulse", Icon: Radio },
  completed:     { label: "Completed",     className: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle2 },
  cancelled:     { label: "Cancelled",     className: "bg-rose-50 text-rose-700 border-rose-200", Icon: XCircle },
  rescheduled:   { label: "Rescheduled",   className: "bg-amber-50 text-amber-800 border-amber-200", Icon: RotateCcw },
};

const RESOURCE_ICON: Record<string, any> = {
  pdf: FileText, presentation: FileText, slides: FileText, document: FileText,
  link: Link2, reference: Link2, video: PlayCircle,
};

function Page() {
  const { id } = Route.useParams();
  const getFn = useServerFn(getLiveSessionDetails);
  const joinFn = useServerFn(joinLiveSession);
  const recFn = useServerFn(openSessionRecording);
  const trackFn = useServerFn(recordSessionActivity);
  const [busy, setBusy] = useState<"join" | "recording" | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["live-session", id],
    queryFn: () => getFn({ data: { sessionId: id } }),
    retry: false,
  });

  useEffect(() => {
    if (data?.id) {
      trackFn({ data: { sessionId: data.id, activity: "session_details_opened", description: `Opened ${data.title}` } }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.id]);

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8 space-y-4 max-w-[1100px]">
        <div className="h-6 w-40 bg-surface-1 animate-pulse rounded" />
        <Card className="h-56 animate-pulse" />
        <Card className="h-40 animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-2xl">
        <Card className="p-8 text-center">
          <AlertTriangle className="size-8 text-amber-600 mx-auto mb-2" />
          <div className="font-display text-lg font-semibold">Session Unavailable</div>
          <div className="text-sm text-muted-foreground mt-1">
            {error instanceof Error ? error.message : "You may not have access to this session."}
          </div>
          <Button asChild className="mt-5" variant="outline">
            <Link to="/student/live-sessions"><ArrowLeft className="size-4 mr-1" /> Back to Live Sessions</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const meta = STATUS_META[data.displayStatus] ?? STATUS_META.scheduled;
  const StatusIcon = meta.Icon;
  const start = new Date(data.scheduledAt);
  const dateStr = start.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeStr = start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  const onJoin = async () => {
    try {
      setBusy("join");
      const res = await joinFn({ data: { sessionId: data.id } });
      window.open(res.meetingUrl, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast.error(e?.message ?? "Unable to join session");
    } finally {
      setBusy(null);
    }
  };

  const onRecording = async () => {
    try {
      setBusy("recording");
      const res = await recFn({ data: { sessionId: data.id } });
      window.open(res.recordingUrl, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast.error(e?.message ?? "Recording unavailable");
    } finally {
      setBusy(null);
    }
  };

  const onOpenResource = (resourceId: string, url: string) => {
    trackFn({ data: { sessionId: data.id, activity: "session_resource_opened", description: `Opened resource for ${data.title}` } })
      .catch(() => {});
    window.open(url, "_blank", "noopener,noreferrer");
    void resourceId;
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1100px]">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 text-muted-foreground">
          <Link to="/student/live-sessions"><ArrowLeft className="size-4 mr-1" /> Back to Live Sessions</Link>
        </Button>
      </div>

      <Card className="p-6 lg:p-8 space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={cn("font-mono text-[10px] uppercase tracking-widest inline-flex items-center gap-1", meta.className)}>
            <StatusIcon className="size-3" /> {meta.label}
          </Badge>
          {data.course?.slug ? (
            <Link
              to="/student/programs/$slug"
              params={{ slug: data.course.slug }}
              className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-primary"
            >
              {data.course.name}
            </Link>
          ) : (
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{data.course.name}</span>
          )}
          {data.module?.name && (
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">· {data.module.name}</span>
          )}
        </div>

        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-semibold tracking-tight">{data.title}</h1>
          {data.description && (
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-3xl whitespace-pre-line">{data.description}</p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3 pt-1">
          <Stat icon={CalendarClock} label="Scheduled" value={`${dateStr}`} sub={timeStr} />
          <Stat icon={Clock} label="Duration" value={`${data.durationMinutes} min`} sub={`Join opens ${data.joinWindowMinutes} min before`} />
          <Stat
            icon={Radio}
            label="Attendance"
            value={data.attendance?.status ? data.attendance.status.replace("_", " ") : "Pending"}
            sub={data.attendance?.minutesAttended ? `${data.attendance.minutesAttended} min tracked` : undefined}
          />
        </div>

        {data.storedStatus === "cancelled" && (
          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-3">
            {data.cancellationNote ?? "This session has been cancelled."}
          </div>
        )}
        {data.previousScheduledAt && data.storedStatus !== "cancelled" && (
          <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-3">
            Rescheduled from {new Date(data.previousScheduledAt).toLocaleString()}.
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {data.canJoin && (
            <Button size="lg" onClick={onJoin} disabled={busy === "join"}>
              <Video className="size-4 mr-2" /> {busy === "join" ? "Opening…" : "Join Session"}
            </Button>
          )}
          {data.displayStatus === "completed" && data.hasRecording && (
            <Button size="lg" variant="outline" onClick={onRecording} disabled={busy === "recording"}>
              <PlayCircle className="size-4 mr-2" /> Watch Recording <ExternalLink className="size-3 ml-1" />
            </Button>
          )}
        </div>

        {data.learningTopics && data.learningTopics.length > 0 && (
          <div className="pt-3 border-t">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">What you'll learn</div>
            <div className="flex flex-wrap gap-1.5">
              {data.learningTopics.map((t, i) => (
                <span key={i} className="text-xs bg-surface-1 border border-border rounded-md px-2 py-1">{t}</span>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold tracking-tight">Resources</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Files and references shared for this session.
          </p>
          {data.resources.length === 0 ? (
            <div className="text-sm text-muted-foreground">No resources have been added yet.</div>
          ) : (
            <div className="divide-y border rounded-lg">
              {data.resources.map((r) => {
                const Icon = RESOURCE_ICON[r.type] ?? FileText;
                return (
                  <button
                    key={r.id}
                    onClick={() => onOpenResource(r.id, r.url)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-surface-1/50 transition-colors"
                  >
                    <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{r.name}</div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{r.type}</div>
                    </div>
                    <ExternalLink className="size-3.5 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold tracking-tight">Mentor</h2>
          {data.mentorProfile ? (
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-full bg-surface-1 overflow-hidden flex items-center justify-center">
                  {data.mentorProfile.photoUrl ? (
                    <img src={data.mentorProfile.photoUrl} alt={data.mentorProfile.name} className="size-full object-cover" />
                  ) : (
                    <User className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-medium">{data.mentorProfile.name}</div>
                  {data.mentorProfile.title && (
                    <div className="text-[11px] text-muted-foreground truncate">{data.mentorProfile.title}</div>
                  )}
                </div>
              </div>
              {data.mentorProfile.bio && (
                <p className="text-xs text-muted-foreground leading-relaxed">{data.mentorProfile.bio}</p>
              )}
              {data.mentorProfile.expertise && data.mentorProfile.expertise.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {data.mentorProfile.expertise.map((e, i) => (
                    <span key={i} className="text-[10px] font-mono uppercase tracking-widest bg-primary/5 text-primary border border-primary/10 rounded px-1.5 py-0.5">{e}</span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-3 text-sm text-muted-foreground">A mentor will be assigned soon.</div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-surface-1/50 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        <Icon className="size-3" /> {label}
      </div>
      <div className="mt-1 font-display text-sm font-semibold capitalize">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}
