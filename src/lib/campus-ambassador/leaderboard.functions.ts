import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const listInput = z
  .object({
    search: z.string().trim().max(80).optional().nullable(),
    page: z.number().int().min(1).max(4000).optional(),
    pageSize: z.number().int().min(1).max(100).optional(),
  })
  .optional();

const monthlyInput = z.object({
  year: z.number().int().min(2024).max(2100),
  month: z.number().int().min(1).max(12),
  search: z.string().trim().max(80).optional().nullable(),
  page: z.number().int().min(1).max(4000).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
});

const monthlyRankInput = z.object({
  year: z.number().int().min(2024).max(2100),
  month: z.number().int().min(1).max(12),
});

export type LeaderboardRow = {
  ambassador_id: string;
  rank_position: number;
  display_identity: string;
  college_display: string | null;
  photo_url: string | null;
  level_name: string | null;
  level_icon: string | null;
  verified_enrollments: number;
  valid_referral_leads: number;
  conversion_rate: number;
  featured_badges: { badge_id: string; name: string; icon: string | null }[];
  is_me: boolean;
};

async function attachBadgesAndMe(
  supabase: any,
  userId: string,
  list: any[],
): Promise<{ results: LeaderboardRow[]; myId: string | null }> {
  const { data: me } = await supabase
    .from("campus_ambassador_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  const myId = (me as any)?.id ?? null;

  const badgesByAmb = new Map<
    string,
    { badge_id: string; name: string; icon: string | null }[]
  >();
  if (list.length > 0) {
    const ids = list.map((r) => r.ambassador_id);
    const { data: badges } = await supabase.rpc(
      "ambassador_leaderboard_featured_badges",
      { _ids: ids },
    );
    for (const b of (badges as any[]) || []) {
      const arr = badgesByAmb.get(b.ambassador_id) || [];
      arr.push({ badge_id: b.badge_id, name: b.badge_name, icon: b.badge_icon });
      badgesByAmb.set(b.ambassador_id, arr);
    }
  }

  const results: LeaderboardRow[] = list.map((r: any) => ({
    ambassador_id: r.ambassador_id,
    rank_position: Number(r.rank_position),
    display_identity: r.display_identity,
    college_display: r.college_display ?? null,
    photo_url: r.photo_url ?? null,
    level_name: r.level_name ?? null,
    level_icon: r.level_icon ?? null,
    verified_enrollments: Number(r.verified_enrollments),
    valid_referral_leads: Number(r.valid_referral_leads),
    conversion_rate: Number(r.conversion_rate),
    featured_badges: badgesByAmb.get(r.ambassador_id) || [],
    is_me: myId != null && r.ambassador_id === myId,
  }));

  return { results, myId };
}

export const listOverallLeaderboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => listInput.parse(input) ?? {})
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const page = data?.page ?? 1;
    const pageSize = data?.pageSize ?? 25;
    const search = (data?.search ?? "").trim();

    const { data: rows, error } = await supabase.rpc("ambassador_leaderboard_overall", {
      _search: search || undefined,
      _limit: pageSize,
      _offset: (page - 1) * pageSize,
    });
    if (error) throw new Error(error.message);

    const list = (rows as any[]) || [];
    const total = list[0]?.total_count ? Number(list[0].total_count) : 0;
    const { results } = await attachBadgesAndMe(supabase, userId, list);
    return { rows: results, total, page, pageSize };
  });

export const getMyLeaderboardRank = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase.rpc("ambassador_leaderboard_my_rank");
    if (error) throw new Error(error.message);
    const row = ((data as any[]) || [])[0];
    if (!row) return { present: false as const };
    return {
      present: true as const,
      ambassador_id: row.ambassador_id as string,
      ambassador_code: row.ambassador_code as string | null,
      rank_position: Number(row.rank_position),
      display_identity: row.display_identity as string,
      college_display: row.college_display as string | null,
      photo_url: row.photo_url as string | null,
      level_name: row.level_name as string | null,
      level_icon: row.level_icon as string | null,
      verified_enrollments: Number(row.verified_enrollments),
      valid_referral_leads: Number(row.valid_referral_leads),
      conversion_rate: Number(row.conversion_rate),
      total_active: Number(row.total_active),
    };
  });

// -------- Monthly --------
export const listMonthlyLeaderboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => monthlyInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const page = data.page ?? 1;
    const pageSize = data.pageSize ?? 25;
    const search = (data.search ?? "").trim();

    const { data: rows, error } = await supabase.rpc("ambassador_leaderboard_monthly", {
      _year: data.year,
      _month: data.month,
      _search: search || undefined,
      _limit: pageSize,
      _offset: (page - 1) * pageSize,
    });
    if (error) throw new Error(error.message);

    const list = (rows as any[]) || [];
    const total = list[0]?.total_count ? Number(list[0].total_count) : 0;
    const { results } = await attachBadgesAndMe(supabase, userId, list);
    return { rows: results, total, page, pageSize, year: data.year, month: data.month };
  });

export const getMyMonthlyRank = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => monthlyRankInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase.rpc(
      "ambassador_leaderboard_my_monthly_rank",
      { _year: data.year, _month: data.month },
    );
    if (error) throw new Error(error.message);
    const row = ((rows as any[]) || [])[0];
    if (!row) return { present: false as const, year: data.year, month: data.month };
    return {
      present: true as const,
      year: data.year,
      month: data.month,
      ambassador_id: row.ambassador_id as string,
      ambassador_code: row.ambassador_code as string | null,
      rank_position: Number(row.rank_position),
      display_identity: row.display_identity as string,
      college_display: row.college_display as string | null,
      photo_url: row.photo_url as string | null,
      level_name: row.level_name as string | null,
      level_icon: row.level_icon as string | null,
      verified_enrollments: Number(row.verified_enrollments),
      valid_referral_leads: Number(row.valid_referral_leads),
      conversion_rate: Number(row.conversion_rate),
      total_ranked: Number(row.total_ranked),
    };
  });

// -------- College --------
export const getMyCollegeContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase.rpc("ambassador_my_college_context");
    if (error) throw new Error(error.message);
    const row = ((data as any[]) || [])[0];
    if (!row) {
      return { has_college: false as const, college_name: null as string | null };
    }
    return {
      has_college: Boolean(row.has_college),
      college_name: (row.college_name as string) ?? null,
      ambassador_id: row.ambassador_id as string,
    };
  });

export const listCollegeLeaderboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => listInput.parse(input) ?? {})
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const page = data?.page ?? 1;
    const pageSize = data?.pageSize ?? 25;
    const search = (data?.search ?? "").trim();

    const { data: rows, error } = await supabase.rpc("ambassador_leaderboard_college", {
      _search: search || undefined,
      _limit: pageSize,
      _offset: (page - 1) * pageSize,
    });
    if (error) throw new Error(error.message);

    const list = (rows as any[]) || [];
    const total = list[0]?.total_count ? Number(list[0].total_count) : 0;
    const collegeName = (list[0]?.college_name as string) ?? null;
    const { results } = await attachBadgesAndMe(supabase, userId, list);
    return { rows: results, total, page, pageSize, college_name: collegeName };
  });

export const getMyCollegeRank = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase.rpc("ambassador_leaderboard_my_college_rank");
    if (error) throw new Error(error.message);
    const row = ((data as any[]) || [])[0];
    if (!row) return { present: false as const };
    return {
      present: true as const,
      ambassador_id: row.ambassador_id as string,
      ambassador_code: row.ambassador_code as string | null,
      rank_position: Number(row.rank_position),
      display_identity: row.display_identity as string,
      college_name: row.college_name as string | null,
      photo_url: row.photo_url as string | null,
      level_name: row.level_name as string | null,
      level_icon: row.level_icon as string | null,
      verified_enrollments: Number(row.verified_enrollments),
      valid_referral_leads: Number(row.valid_referral_leads),
      conversion_rate: Number(row.conversion_rate),
      total_ranked: Number(row.total_ranked),
    };
  });
