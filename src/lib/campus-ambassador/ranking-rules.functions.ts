import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type LeaderboardType = "overall" | "monthly" | "college" | "program" | "campaign";

export type RankingExplanation = {
  rule_name: string;
  primary_metric_label: string;
  minimum_activity_label: string | null;
  tie_breakers: string[];
  weighted_components: { component: string; weight: number }[];
  is_valid: boolean;
  ambassador_explanation: string | null;
};

export type RankMovement = {
  previous_rank: number | null;
  current_rank: number;
  rank_difference: number | null;
  is_new: boolean;
  calculated_at: string;
} | null;

/** Fetch the Ambassador-friendly explanation of the currently active ranking rule. */
export const getRankingExplanation = createServerFn({ method: "GET" })
  .inputValidator((data: { leaderboardType: LeaderboardType }) =>
    z.object({
      leaderboardType: z.enum(["overall","monthly","college","program","campaign"]),
    }).parse(data),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<RankingExplanation | null> => {
    const { data: rows, error } = await context.supabase
      .rpc("ambassador_ranking_explanation", { _type: data.leaderboardType });
    if (error) throw error;
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row) return null;
    return {
      rule_name: row.rule_name,
      primary_metric_label: row.primary_metric_label,
      minimum_activity_label: row.minimum_activity_label ?? null,
      tie_breakers: (row.tie_breakers ?? []) as string[],
      weighted_components: (row.weighted_components ?? []) as { component: string; weight: number }[],
      is_valid: Boolean(row.is_valid),
      ambassador_explanation: row.ambassador_explanation ?? null,
    };
  });

/** Fetch the current Ambassador's rank movement for a specific leaderboard context. */
export const getMyRankMovement = createServerFn({ method: "GET" })
  .inputValidator((data: {
    leaderboardType: LeaderboardType;
    periodKey?: string | null;
    programId?: string | null;
    campaignId?: string | null;
  }) =>
    z.object({
      leaderboardType: z.enum(["overall","monthly","college","program","campaign"]),
      periodKey: z.string().max(32).optional().nullable(),
      programId: z.string().uuid().optional().nullable(),
      campaignId: z.string().uuid().optional().nullable(),
    }).parse(data),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<RankMovement> => {
    const { data: rows, error } = await context.supabase
      .rpc("ambassador_my_rank_movement", {
        _type: data.leaderboardType,
        _period_key: data.periodKey ?? null,
        _program_id: data.programId ?? null,
        _campaign_id: data.campaignId ?? null,
      });
    if (error) throw error;
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row) return null;
    return {
      previous_rank: row.previous_rank ?? null,
      current_rank: row.current_rank,
      rank_difference: row.rank_difference ?? null,
      is_new: Boolean(row.is_new),
      calculated_at: row.calculated_at,
    };
  });
