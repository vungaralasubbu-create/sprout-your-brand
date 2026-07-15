import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type MyRecognition = {
  id: string;
  recognition_title: string;
  recognition_type: string;
  leaderboard_type: string;
  ranking_period_key: string;
  final_rank: number;
  achieved_at: string;
  badge_id: string | null;
  badge_name: string | null;
  badge_icon: string | null;
  program_id: string | null;
  program_name: string | null;
  campaign_id: string | null;
  campaign_name: string | null;
  college_key: string | null;
};

export type RankHistoryItem = {
  leaderboard_type: "monthly" | "college" | "program" | "campaign";
  period_key: string;
  program_id: string | null;
  program_name: string | null;
  campaign_id: string | null;
  campaign_name: string | null;
  college_key: string | null;
  final_rank: number;
  primary_metric: string;
  metric_value: number;
  finalised_at: string;
  recognition_title: string | null;
};

export type MonthlyLeader = {
  period_key: string;
  ambassador_id: string;
  display_identity: string;
  photo_url: string | null;
  college_display: string | null;
  level_name: string | null;
  level_icon: string | null;
  primary_metric: string;
  metric_value: number;
  finalised_at: string;
};

export const listMyRecognitions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyRecognition[]> => {
    const { data, error } = await context.supabase.rpc("ambassador_my_recognitions");
    if (error) throw error;
    return (data ?? []) as MyRecognition[];
  });

export const listMyRankHistory = createServerFn({ method: "GET" })
  .inputValidator((d: { type?: string | null }) =>
    z.object({ type: z.string().max(20).optional().nullable() }).parse(d ?? {}),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<RankHistoryItem[]> => {
    const t = data?.type && data.type !== "all" ? data.type : null;
    const { data: rows, error } = await context.supabase.rpc("ambassador_my_rank_history", {
      _type: t,
    });
    if (error) throw error;
    return (rows ?? []) as RankHistoryItem[];
  });

export const listPreviousMonthlyLeaders = createServerFn({ method: "GET" })
  .inputValidator((d: { limit?: number }) =>
    z.object({ limit: z.number().int().min(1).max(12).optional() }).parse(d ?? {}),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<MonthlyLeader[]> => {
    const { data: rows, error } = await context.supabase.rpc(
      "ambassador_previous_monthly_leaders",
      { _limit: data?.limit ?? 6 },
    );
    if (error) throw error;
    return (rows ?? []) as MonthlyLeader[];
  });
