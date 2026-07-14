import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  MessageSquareText,
  RotateCcw,
  Sparkles,
  Target,
  ThumbsUp,
  TrendingUp,
} from "lucide-react";
import { getInterviewSession, logInterviewEvent } from "@/lib/student/interview.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/student/career/interview/$id/report")({
  head: () => ({ meta: [{ title: "Interview Report — Glintr LMS" }] }),
  component: ReportPage,
});

function ReportPage() {
  const { id } = Route.useParams();
  const getFn = useServerFn(getInterviewSession);
  const logFn = useServerFn(logInterviewEvent);
  const { data, isLoading } = useQuery({
    queryKey: ["interview-session-report", id],
    queryFn: () => getFn({ data: { id } }),
  });
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    logFn({ data: { session_id: id, event_type: "report_viewed" } }).catch(() => {});
  }, [id]);

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-96" />
      </div>
    );
  }
  const session: any = data?.session;
  const questions: any[] = (data?.questions ?? []) as any[];
  if (!session) return null;

  const answered = questions.filter((q) => q.answer && !q.answer.is_skipped);
  const skipped = questions.filter((q) => q.answer?.is_skipped);
  const scored = answered.filter((q) => q.answer?.practice_score != null);
  const avg =
    scored.length > 0
      ? Math.round(
          (scored.reduce((n, q) => n + Number(q.answer.practice_score), 0) / scored.length) * 10,
        ) / 10
      : null;

  // Aggregate category averages
  const catBuckets: Record<string, number[]> = {};
  for (const q of scored) {
    const scores = (q.answer?.category_scores ?? {}) as Record<string, number>;
    for (const [k, v] of Object.entries(scores)) {
      if (typeof v !== "number") continue;
      catBuckets[k] = catBuckets[k] ?? [];
      catBuckets[k].push(v);
    }
  }
  const categoryAvgs = Object.entries(catBuckets).map(([k, arr]) => ({
    name: k,
    score: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length),
  }));

  // Strengths + focus areas
  const strengths = new Map<string, number>();
  const improvements = new Map<string, number>();
  for (const q of answered) {
    const fb = (q.answer?.feedback ?? {}) as any;
    (fb.well ?? []).forEach((s: string) => strengths.set(s, (strengths.get(s) ?? 0) + 1));
    (fb.improve ?? []).forEach((s: string) =>
      improvements.set(s, (improvements.get(s) ?? 0) + 1),
    );
  }
  const topStrengths = Array.from(strengths.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map((e) => e[0]);
  const topImprovements = Array.from(improvements.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map((e) => e[0]);

  const active = questions[activeIdx];

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6 pb-24">
      <Button asChild variant="ghost" size="sm">
        <Link to="/student/career/interview">
          <ArrowLeft className="size-4 mr-1" /> Back to Interview Practice
        </Link>
      </Button>

      <header className="rounded-2xl border bg-gradient-to-br from-primary/5 to-transparent p-5 md:p-6">
        <div className="text-caption font-mono uppercase tracking-widest text-primary mb-1">
          Interview Report
        </div>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-semibold tracking-tight">
              {session.target_role ?? "Mock Interview"} — {session.difficulty}
            </h1>
            <div className="mt-1 text-sm text-muted-foreground">
              {new Date(session.started_at).toLocaleString()}
              {" · "}
              <span className="capitalize">{String(session.interview_type)}</span> · {session.mode}
              {session.program_title ? ` · ${session.program_title}` : ""}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Practice Score
            </div>
            <div className="text-4xl font-display font-semibold tracking-tight">
              {avg != null ? avg.toFixed(1) : "—"}
              {avg != null ? (
                <span className="text-lg text-muted-foreground ml-1">/100</span>
              ) : null}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {answered.length} answered · {skipped.length} skipped
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/student/career/interview/setup">
              <RotateCcw className="size-4 mr-1.5" /> Practice Again
            </Link>
          </Button>
        </div>
      </header>

      {/* Category Scores */}
      {categoryAvgs.length > 0 && (
        <section className="rounded-2xl border bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <TrendingUp className="size-4 text-primary" /> Category Performance
          </div>
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryAvgs.map((c) => (
              <div key={c.name}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{c.name}</span>
                  <span className="font-medium">{c.score}/100</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all",
                      c.score >= 75
                        ? "bg-emerald-500"
                        : c.score >= 50
                          ? "bg-amber-500"
                          : "bg-rose-500",
                    )}
                    style={{ width: `${c.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Strengths + Focus */}
      <section className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ThumbsUp className="size-4 text-emerald-600" /> Your Strengths
          </div>
          {topStrengths.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground italic">
              No highlighted strengths captured for this session.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {topStrengths.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Target className="size-4 text-primary" /> Focus Areas
          </div>
          {topImprovements.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground italic">
              No focus areas identified. Great work.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {topImprovements.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <ChevronRight className="size-4 text-primary shrink-0 mt-0.5" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Question Review */}
      <section className="rounded-2xl border bg-white overflow-hidden">
        <div className="p-5 border-b flex items-center gap-2">
          <BookOpen className="size-4 text-primary" />
          <div>
            <div className="text-sm font-semibold">Question Review</div>
            <div className="text-xs text-muted-foreground">
              Review each question, your answer, feedback and a suggested answer.
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-[minmax(0,240px)_1fr]">
          <ul className="border-r max-h-[520px] overflow-y-auto">
            {questions.map((q, i) => (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className={cn(
                    "w-full text-left p-3 border-b flex items-start gap-2 hover:bg-muted/50 transition",
                    activeIdx === i && "bg-primary/5",
                  )}
                >
                  <div className="text-xs font-mono text-muted-foreground min-w-[24px]">
                    Q{i + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{q.question_text}</div>
                    <div className="mt-1 flex items-center gap-1.5">
                      {q.answer?.is_skipped ? (
                        <Badge variant="muted" className="text-[10px]">
                          Skipped
                        </Badge>
                      ) : q.answer?.practice_score != null ? (
                        <Badge variant="outline" className="text-[10px]">
                          {q.answer.practice_score}/100
                        </Badge>
                      ) : q.answer ? (
                        <Badge variant="muted" className="text-[10px]">
                          Submitted
                        </Badge>
                      ) : (
                        <Badge variant="muted" className="text-[10px]">
                          Unanswered
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <div className="p-5 space-y-4">
            {active ? (
              <QuestionDetail q={active} />
            ) : (
              <p className="text-sm text-muted-foreground">Select a question to review.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function QuestionDetail({ q }: { q: any }) {
  const fb = (q.answer?.feedback ?? {}) as any;
  return (
    <>
      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {q.category ?? "Question"}
        </div>
        <h3 className="mt-1 font-display font-semibold text-lg leading-snug">
          {q.question_text}
        </h3>
      </div>

      {q.answer?.is_skipped ? (
        <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
          You skipped this question.
        </div>
      ) : q.answer ? (
        <div className="space-y-3">
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
              <MessageSquareText className="size-3.5" /> Your Answer
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
              {q.answer.answer_text || q.answer.transcript || "—"}
            </div>
            {q.answer.practice_score != null && (
              <div className="mt-2 text-xs text-muted-foreground">
                Practice score:{" "}
                <span className="font-semibold text-foreground">
                  {q.answer.practice_score}/100
                </span>
              </div>
            )}
          </div>

          {fb.well?.length ? (
            <FeedbackBlock title="What Went Well" items={fb.well} tone="good" />
          ) : null}
          {fb.improve?.length ? (
            <FeedbackBlock title="What To Improve" items={fb.improve} tone="warn" />
          ) : null}
          {fb.missed?.length ? (
            <FeedbackBlock title="Key Points Missed" items={fb.missed} tone="warn" />
          ) : null}
          {fb.structure ? (
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-1">
                Suggested Structure
              </div>
              <div className="text-sm text-foreground">{fb.structure}</div>
            </div>
          ) : null}
          {fb.example ? (
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                <Sparkles className="size-3.5 text-primary" /> Suggested Answer
              </div>
              <div className="rounded-lg border bg-primary/5 p-3 text-sm whitespace-pre-wrap">
                {fb.example}
              </div>
            </div>
          ) : null}
          {q.answer.evaluation_status === "no_ai" && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              AI evaluation was not configured for this session. Your answer is saved for review.
            </div>
          )}
          {q.answer.evaluation_status === "failed" && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
              We could not evaluate this answer. You can practice this question again.
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border p-3 text-sm text-muted-foreground">
          This question was not attempted.
        </div>
      )}
    </>
  );
}

function FeedbackBlock({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "good" | "warn";
}) {
  return (
    <div>
      <div className="text-xs font-semibold text-muted-foreground mb-1">{title}</div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm">
            <span
              className={cn(
                "mt-1.5 size-1.5 rounded-full shrink-0",
                tone === "good" ? "bg-emerald-500" : "bg-amber-500",
              )}
            />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
