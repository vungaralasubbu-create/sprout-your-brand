import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { HelpCircle, TrendingUp, TrendingDown, Minus, Sparkles, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getRankingExplanation,
  getMyRankMovement,
  type LeaderboardType,
} from "@/lib/campus-ambassador/ranking-rules.functions";
import { cn } from "@/lib/utils";

/**
 * Ambassador-friendly "How Rankings Work" panel.
 * Reads the currently active Ranking Rule from the backend — never
 * hardcodes metric names, weights, or tie-breakers.
 */
export function HowRankingsWork({
  leaderboardType,
  className,
}: {
  leaderboardType: LeaderboardType;
  className?: string;
}) {
  const fn = useServerFn(getRankingExplanation);
  const q = useQuery({
    queryKey: ["ambassador-ranking-explanation", leaderboardType],
    queryFn: () => fn({ data: { leaderboardType } }),
    staleTime: 5 * 60_000,
  });

  if (q.isLoading) {
    return <Skeleton className={cn("h-24 w-full rounded-2xl", className)} />;
  }

  if (q.isError || !q.data) {
    return (
      <Card className={cn("p-5 border border-slate-200 bg-slate-50", className)}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-slate-900">
              Leaderboard Temporarily Unavailable
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              Unable to load ranking explanation.
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={() => q.refetch()} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      </Card>
    );
  }

  const r = q.data;

  if (!r.is_valid) {
    return (
      <Card className={cn("p-5 border border-amber-200 bg-amber-50", className)}>
        <div className="text-sm font-semibold text-amber-900">
          Leaderboard Temporarily Unavailable
        </div>
        <div className="text-xs text-amber-800 mt-1">
          The ranking calculation is being updated. Please check back soon.
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("p-5 border border-slate-200 bg-white", className)}>
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-cyan-50 ring-1 ring-cyan-100 flex items-center justify-center flex-shrink-0">
          <HelpCircle className="h-4 w-4 text-cyan-700" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <div className="text-[11px] uppercase tracking-wider font-medium text-slate-500">
              How rankings work
            </div>
            <div className="text-sm font-semibold text-slate-900">{r.rule_name}</div>
          </div>

          {r.ambassador_explanation && (
            <p className="text-xs text-slate-600 leading-relaxed">{r.ambassador_explanation}</p>
          )}

          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-slate-500">Primary metric:</span>
            <Badge variant="info" className="gap-1">
              <Sparkles className="h-2.5 w-2.5" /> {r.primary_metric_label}
            </Badge>
          </div>

          {r.minimum_activity_label && (
            <div className="text-[11px] text-slate-600">
              <span className="text-slate-500">Eligibility:</span>{" "}
              <span className="font-medium">{r.minimum_activity_label}</span>
            </div>
          )}

          {r.weighted_components.length > 0 && (
            <div className="mt-1">
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1">
                Score components
              </div>
              <div className="flex flex-wrap gap-1.5">
                {r.weighted_components.map((c) => (
                  <span
                    key={c.component}
                    className="text-[11px] rounded-full bg-slate-100 px-2 py-0.5 text-slate-700"
                  >
                    {c.component} · {Number(c.weight).toFixed(0)}%
                  </span>
                ))}
              </div>
            </div>
          )}

          {r.tie_breakers.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1">
                Tie-breakers
              </div>
              <ol className="text-[11px] text-slate-700 space-y-0.5 list-decimal list-inside">
                {r.tie_breakers.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/**
 * Small inline chip showing rank movement (↑ 2, ↓ 1, —, or New)
 * for the current Ambassador on a specific leaderboard context.
 * Never renders "↑ 0"; shows nothing when data isn't available.
 */
export function MyRankMovementChip({
  leaderboardType,
  periodKey,
  programId,
  campaignId,
  className,
}: {
  leaderboardType: LeaderboardType;
  periodKey?: string | null;
  programId?: string | null;
  campaignId?: string | null;
  className?: string;
}) {
  const fn = useServerFn(getMyRankMovement);
  const q = useQuery({
    queryKey: [
      "ambassador-rank-movement",
      leaderboardType,
      periodKey ?? null,
      programId ?? null,
      campaignId ?? null,
    ],
    queryFn: () =>
      fn({
        data: {
          leaderboardType,
          periodKey: periodKey ?? undefined,
          programId: programId ?? undefined,
          campaignId: campaignId ?? undefined,
        },
      }),
    staleTime: 30_000,
  });

  if (q.isLoading || q.isError || !q.data) return null;

  const m = q.data;

  if (m.is_new || m.previous_rank == null) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-medium text-cyan-700 ring-1 ring-cyan-100",
          className,
        )}
      >
        <Sparkles className="h-2.5 w-2.5" /> New
      </span>
    );
  }

  const diff = m.rank_difference ?? 0;

  if (diff === 0) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600",
          className,
        )}
        aria-label="No change from previous rank"
      >
        <Minus className="h-2.5 w-2.5" /> —
      </span>
    );
  }

  // Lower current_rank number = improvement. rank_difference stored as
  // (previous_rank - current_rank), so a positive diff = moved up.
  const up = diff > 0;
  const magnitude = Math.abs(diff);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
        up
          ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
          : "bg-rose-50 text-rose-700 ring-rose-100",
        className,
      )}
      aria-label={up ? `Moved up ${magnitude}` : `Moved down ${magnitude}`}
    >
      {up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
      {magnitude}
    </span>
  );
}
