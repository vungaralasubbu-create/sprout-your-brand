import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  MessageSquare,
  ArrowLeft,
  Play,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  CheckCircle2,
  Circle,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getInterviewOverview } from "@/lib/student/interview.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/student/career/interview")({
  head: () => ({ meta: [{ title: "Interview Practice — Glintr LMS" }] }),
  component: InterviewPracticePage,
});

const TYPE_LABEL: Record<string, string> = {
  technical: "Technical",
  hr: "HR",
  behavioural: "Behavioural",
  project: "Project",
  internship: "Internship",
  mixed: "Mixed",
};

function InterviewPracticePage() {
  const fn = useServerFn(getInterviewOverview);
  const { data, isLoading } = useQuery({
    queryKey: ["interview-overview"],
    queryFn: () => fn(),
  });

  if (isLoading) return <InterviewSkeleton />;

  const metrics = data?.metrics;
  const trend = data?.trend;
  const history = data?.history ?? [];
  const hasSessions = history.length > 0;

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6 pb-24">
      <Button asChild variant="ghost" size="sm">
        <Link to="/student/career">
          <ArrowLeft className="size-4 mr-1" /> Back to Career Center
        </Link>
      </Button>

      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-caption font-mono uppercase tracking-widest text-primary mb-1">
            Career Center
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-semibold tracking-tight">
            Interview Practice
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Practice interview questions based on your learning, skills and career goals.
          </p>
        </div>
        <Button asChild size="lg">
          <Link to="/student/career/interview/setup">
            <Play className="size-4 mr-1.5" /> Start Mock Interview
          </Link>
        </Button>
      </header>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Metric label="Practice Sessions" value={metrics?.totalSessions ?? 0} />
        <Metric label="Completed" value={metrics?.completedSessions ?? 0} />
        <Metric label="Questions Practiced" value={metrics?.questionsPracticed ?? 0} />
        <Metric
          label="Average Score"
          value={metrics?.avgPracticeScore ?? "—"}
          suffix={metrics?.avgPracticeScore != null ? "/100" : ""}
        />
        <Metric
          label="Latest Score"
          value={metrics?.latestScore ?? "—"}
          suffix={metrics?.latestScore != null ? "/100" : ""}
        />
        <TrendMetric trend={trend} />
      </div>

      {/* History */}
      <section className="rounded-2xl border bg-white">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <div className="text-sm font-semibold">Interview History</div>
            <div className="text-xs text-muted-foreground">
              Your practice sessions and reports.
            </div>
          </div>
        </div>
        {!hasSessions ? (
          <EmptyHistory />
        ) : (
          <ul className="divide-y">
            {history.map((s: any) => (
              <li
                key={s.id}
                className="p-4 lg:p-5 flex items-center justify-between gap-4 flex-wrap hover:bg-muted/30 transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="capitalize">
                      {TYPE_LABEL[s.interview_type] ?? s.interview_type}
                    </Badge>
                    <Badge variant="muted" className="capitalize">
                      {s.difficulty}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {s.mode}
                    </Badge>
                    <StatusPill status={s.status} />
                  </div>
                  <div className="mt-1 text-sm font-medium">
                    {s.target_role ?? "General role"}
                    {s.program ? (
                      <span className="text-muted-foreground"> · {s.program}</span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(s.started_at).toLocaleString()} · {s.answered_count}/
                    {s.question_count} answered
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {s.avg_practice_score != null ? (
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Practice Score
                      </div>
                      <div className="text-xl font-display font-semibold tracking-tight">
                        {Number(s.avg_practice_score).toFixed(1)}
                      </div>
                    </div>
                  ) : null}
                  <Button asChild variant="outline" size="sm">
                    <Link
                      to="/student/career/interview/$id"
                      params={{ id: s.id }}
                    >
                      {s.status === "in_progress" ? "Resume" : "View Report"}
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  suffix,
}: {
  label: string;
  value: React.ReactNode;
  suffix?: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-display font-semibold tracking-tight">
        {value}
        {suffix ? <span className="text-xs text-muted-foreground ml-1">{suffix}</span> : null}
      </div>
    </div>
  );
}

function TrendMetric({ trend }: { trend: any }) {
  if (!trend) {
    return (
      <div className="rounded-xl border bg-white p-3">
        <div className="text-xs text-muted-foreground">Improvement</div>
        <div className="mt-1 text-sm text-muted-foreground">Not enough data</div>
      </div>
    );
  }
  const Icon =
    trend.direction === "up"
      ? TrendingUp
      : trend.direction === "down"
        ? TrendingDown
        : Minus;
  const color =
    trend.direction === "up"
      ? "text-emerald-600"
      : trend.direction === "down"
        ? "text-rose-600"
        : "text-muted-foreground";
  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="text-xs text-muted-foreground">Improvement</div>
      <div className={cn("mt-1 flex items-center gap-1 text-lg font-display font-semibold", color)}>
        <Icon className="size-4" />
        {trend.delta > 0 ? `+${trend.delta}` : trend.delta}
      </div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
        Similar sessions
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string; icon: any }> = {
    in_progress: {
      label: "In Progress",
      className: "bg-amber-100 text-amber-900 border-amber-200",
      icon: Clock,
    },
    completed: {
      label: "Completed",
      className: "bg-emerald-100 text-emerald-900 border-emerald-200",
      icon: CheckCircle2,
    },
    incomplete: {
      label: "Incomplete",
      className: "bg-muted text-muted-foreground",
      icon: Circle,
    },
  };
  const cfg = map[status] ?? map.incomplete;
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
        cfg.className,
      )}
    >
      <Icon className="size-3" /> {cfg.label}
    </span>
  );
}

function EmptyHistory() {
  return (
    <div className="p-10 text-center">
      <div className="mx-auto size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
        <MessageSquare className="size-7" />
      </div>
      <h3 className="text-lg font-semibold">No Practice Sessions Yet</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
        Start your first mock interview to practice questions tailored to your
        program, skills and target role.
      </p>
      <div className="mt-4">
        <Button asChild>
          <Link to="/student/career/interview/setup">
            <Sparkles className="size-4 mr-1.5" /> Start Mock Interview
          </Link>
        </Button>
      </div>
    </div>
  );
}

function InterviewSkeleton() {
  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      <Skeleton className="h-16 w-full" />
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
