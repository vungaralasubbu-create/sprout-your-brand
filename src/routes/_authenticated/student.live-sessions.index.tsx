import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Radio, CalendarClock, CheckCircle2, TrendingUp, Search, ArrowLeft } from "lucide-react";
import { listStudentLiveSessions } from "@/lib/student/live-sessions.functions";
import { LiveSessionCard, type LiveSessionCardData } from "@/components/student/live-session-card";

export const Route = createFileRoute("/_authenticated/student/live-sessions/")({
  component: Page,
});

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "live", label: "Live Now" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

function Page() {
  const listFn = useServerFn(listStudentLiveSessions);
  const [courseId, setCourseId] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["student-live-sessions", courseId],
    queryFn: () => listFn({ data: { courseId: courseId === "all" ? null : courseId } }),
  });

  const sessions = (data?.sessions ?? []) as LiveSessionCardData[];
  const summary = data?.summary ?? { upcoming: 0, today: 0, completed: 0, attended: 0 };

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (status === "upcoming" && !["scheduled", "starting_soon"].includes(s.displayStatus)) return false;
      if (status === "live" && s.displayStatus !== "live") return false;
      if (status === "completed" && s.displayStatus !== "completed") return false;
      if (status === "cancelled" && s.storedStatus !== "cancelled") return false;
      if (q.trim()) {
        const needle = q.toLowerCase();
        const hay = [s.title, s.course.name, s.mentor?.name ?? ""].join(" ").toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [sessions, status, q]);

  const grouped = useMemo(() => {
    const live = filtered.filter((s) => s.displayStatus === "live");
    const upcoming = filtered.filter((s) => ["scheduled", "starting_soon"].includes(s.displayStatus));
    const completed = filtered.filter((s) => s.displayStatus === "completed");
    const other = filtered.filter((s) => !["live", "scheduled", "starting_soon", "completed"].includes(s.displayStatus));
    return { live, upcoming, completed, other };
  }, [filtered]);

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1200px]">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 text-muted-foreground">
          <Link to="/student/dashboard"><ArrowLeft className="size-4 mr-1" /> Back to Dashboard</Link>
        </Button>
        <div className="mt-2 flex items-center gap-3">
          <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Radio className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-semibold tracking-tight">Live Sessions</h1>
            <p className="text-sm text-muted-foreground">Join mentor classes for the programs you're enrolled in.</p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Summary icon={CalendarClock} label="Upcoming" value={summary.upcoming} />
        <Summary icon={Radio} label="Today" value={summary.today} tone="rose" />
        <Summary icon={CheckCircle2} label="Completed" value={summary.completed} tone="emerald" />
        <Summary icon={TrendingUp} label="Attended" value={summary.attended} tone="primary" />
      </div>

      {/* Filters */}
      <Card className="p-3 flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by session, program or mentor"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto -mx-1 px-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatus(f.key)}
              className={
                "text-[11px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-md border shrink-0 " +
                (status === f.key
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border text-muted-foreground hover:text-foreground")
              }
            >
              {f.label}
            </button>
          ))}
        </div>
        {(data?.courses?.length ?? 0) > 1 && (
          <Select value={courseId} onValueChange={setCourseId}>
            <SelectTrigger className="w-full md:w-56"><SelectValue placeholder="All Programs" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {(data?.courses ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Card>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => <Card key={i} className="h-40 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <CalendarClock className="size-8 text-muted-foreground/60 mx-auto mb-2" />
          <div className="font-display text-base font-semibold">No sessions to show</div>
          <div className="text-sm text-muted-foreground mt-1">
            {sessions.length === 0
              ? "Live sessions for your enrolled programs will appear here."
              : "Try changing the filters or search."}
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <Group title="Live Now" items={grouped.live} />
          <Group title="Upcoming" items={grouped.upcoming} />
          <Group title="Completed" items={grouped.completed} />
          <Group title="Other" items={grouped.other} />
        </div>
      )}
    </div>
  );
}

function Group({ title, items }: { title: string; items: LiveSessionCardData[] }) {
  if (!items.length) return null;
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold tracking-tight">{title}</h2>
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{items.length}</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((s) => <LiveSessionCard key={s.id} session={s} />)}
      </div>
    </div>
  );
}

const TONE: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  emerald: "bg-emerald-50 text-emerald-700",
  rose: "bg-rose-50 text-rose-700",
  muted: "bg-surface-1 text-foreground/70",
};

function Summary({ icon: Icon, label, value, tone = "muted" }: { icon: any; label: string; value: number; tone?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className={"size-7 rounded-md flex items-center justify-center " + (TONE[tone] ?? TONE.muted)}>
          <Icon className="size-3.5" />
        </div>
      </div>
      <div className="mt-1 font-display text-2xl font-semibold">{value}</div>
    </Card>
  );
}
