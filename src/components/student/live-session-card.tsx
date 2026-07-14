import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Radio, Video, Clock, CalendarClock, ExternalLink, PlayCircle, User,
  CheckCircle2, XCircle, RotateCcw, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { joinLiveSession, recordSessionActivity, openSessionRecording } from "@/lib/student/live-sessions.functions";

const STATUS_META: Record<string, { label: string; className: string; Icon: any }> = {
  scheduled:      { label: "Scheduled",     className: "bg-muted text-foreground/70 border-border", Icon: CalendarClock },
  starting_soon:  { label: "Starting Soon", className: "bg-amber-50 text-amber-800 border-amber-200", Icon: Clock },
  live:           { label: "Live Now",      className: "bg-rose-50 text-rose-700 border-rose-200 animate-pulse", Icon: Radio },
  completed:      { label: "Completed",     className: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle2 },
  cancelled:      { label: "Cancelled",     className: "bg-rose-50 text-rose-700 border-rose-200", Icon: XCircle },
  rescheduled:    { label: "Rescheduled",   className: "bg-amber-50 text-amber-800 border-amber-200", Icon: RotateCcw },
};

function useCountdown(iso: string) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return null;
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `in ${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h < 24) return `in ${h}h ${m}m`;
  const d = Math.floor(h / 24);
  return `in ${d}d ${h % 24}h`;
}

export type LiveSessionCardData = {
  id: string;
  title: string;
  description?: string | null;
  scheduledAt: string;
  durationMinutes: number;
  displayStatus: string;
  storedStatus: string;
  canJoin: boolean;
  hasRecording: boolean;
  previousScheduledAt?: string | null;
  cancellationNote?: string | null;
  resourcesCount: number;
  course: { id: string; name: string; slug: string | null };
  module: { id: string; name: string | null } | null;
  mentor: { id: string; name: string; photoUrl: string | null; title: string | null } | null;
  attendance: { status: string; minutesAttended: number | null; confirmedAt: string | null } | null;
};

export function LiveSessionCard({ session, compact = false }: { session: LiveSessionCardData; compact?: boolean }) {
  const meta = STATUS_META[session.displayStatus] ?? STATUS_META.scheduled;
  const StatusIcon = meta.Icon;
  const countdown = useCountdown(session.scheduledAt);
  const joinFn = useServerFn(joinLiveSession);
  const recordFn = useServerFn(recordSessionActivity);
  const openRecFn = useServerFn(openSessionRecording);
  const [busy, setBusy] = useState<"join" | "recording" | null>(null);

  const start = new Date(session.scheduledAt);
  const dateStr = start.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  const timeStr = start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  const onJoin = async () => {
    try {
      setBusy("join");
      const res = await joinFn({ data: { sessionId: session.id } });
      window.open(res.meetingUrl, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast.error(e?.message ?? "Unable to join session");
    } finally {
      setBusy(null);
    }
  };

  const onOpenRecording = async () => {
    try {
      setBusy("recording");
      const res = await openRecFn({ data: { sessionId: session.id } });
      window.open(res.recordingUrl, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast.error(e?.message ?? "Recording unavailable");
    } finally {
      setBusy(null);
    }
  };

  const onDetailsOpen = () => {
    recordFn({ data: { sessionId: session.id, activity: "session_details_opened", description: `Opened ${session.title}` } })
      .catch(() => {});
  };

  return (
    <Card className={cn("p-0 overflow-hidden group hover:shadow-sm transition-shadow", compact && "border-border/70")}>
      <div className="p-4 lg:p-5 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={cn("font-mono text-[10px] uppercase tracking-widest inline-flex items-center gap-1", meta.className)}>
            <StatusIcon className="size-3" /> {meta.label}
          </Badge>
          {session.storedStatus !== "cancelled" && countdown && (session.displayStatus === "scheduled" || session.displayStatus === "starting_soon") && (
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Starts {countdown}</span>
          )}
          {session.attendance?.status && session.displayStatus === "completed" && (
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              · Attendance: {session.attendance.status.replace("_", " ")}
            </span>
          )}
        </div>

        <div>
          <Link
            to="/student/live-sessions/$id"
            params={{ id: session.id }}
            onClick={onDetailsOpen}
            className="font-display text-base lg:text-lg font-semibold tracking-tight hover:text-primary line-clamp-2"
          >
            {session.title}
          </Link>
          <div className="mt-1 text-[11px] text-muted-foreground truncate">
            {session.course.name}{session.module?.name ? ` · ${session.module.name}` : ""}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="inline-flex items-center gap-1"><CalendarClock className="size-3.5" /> {dateStr} · {timeStr}</div>
          <div className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {session.durationMinutes} min</div>
          {session.resourcesCount > 0 && (
            <div className="inline-flex items-center gap-1"><FileText className="size-3.5" /> {session.resourcesCount}</div>
          )}
        </div>

        {session.mentor && !compact && (
          <div className="flex items-center gap-2 pt-1">
            <div className="size-7 rounded-full bg-surface-1 overflow-hidden flex items-center justify-center">
              {session.mentor.photoUrl ? (
                <img src={session.mentor.photoUrl} alt={session.mentor.name} className="size-full object-cover" />
              ) : (
                <User className="size-3.5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium truncate">{session.mentor.name}</div>
              {session.mentor.title && <div className="text-[10px] text-muted-foreground truncate">{session.mentor.title}</div>}
            </div>
          </div>
        )}

        {session.storedStatus === "cancelled" && session.cancellationNote && (
          <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded p-2">
            {session.cancellationNote}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {session.canJoin && (
            <Button size="sm" onClick={onJoin} disabled={busy === "join"}>
              <Video className="size-4 mr-1.5" /> {busy === "join" ? "Opening…" : "Join Session"}
            </Button>
          )}
          {session.displayStatus === "completed" && session.hasRecording && (
            <Button size="sm" variant="outline" onClick={onOpenRecording} disabled={busy === "recording"}>
              <PlayCircle className="size-4 mr-1.5" /> Watch Recording <ExternalLink className="size-3 ml-1" />
            </Button>
          )}
          <Button asChild size="sm" variant="ghost" onClick={onDetailsOpen}>
            <Link to="/student/live-sessions/$id" params={{ id: session.id }}>Details</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
