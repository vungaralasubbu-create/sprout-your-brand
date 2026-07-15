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

// ============ PROGRAM LEADERBOARD ============
const programListInput = z.object({
  programId: z.string().uuid(),
  search: z.string().trim().max(80).optional().nullable(),
  page: z.number().int().min(1).max(4000).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
});

const programOnlyInput = z.object({
  programId: z.string().uuid(),
});

export type ProgramLeaderboardRow = LeaderboardRow;

export const listLeaderboardPrograms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("courses")
      .select("id, name, slug, category_id, course_categories(name)")
      .eq("is_published", true)
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return ((data as any[]) ?? []).map((c) => ({
      id: c.id as string,
      name: c.name as string,
      slug: c.slug as string,
      category_name: (c.course_categories as any)?.name ?? null,
    }));
  });

export const listProgramLeaderboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => programListInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const page = data.page ?? 1;
    const pageSize = data.pageSize ?? 25;
    const search = (data.search ?? "").trim();
    const { data: rows, error } = await supabase.rpc("ambassador_leaderboard_program", {
      _program_id: data.programId,
      _search: search || undefined,
      _limit: pageSize,
      _offset: (page - 1) * pageSize,
    });
    if (error) throw new Error(error.message);
    const list = (rows as any[]) || [];
    const total = list[0]?.total_count ? Number(list[0].total_count) : 0;
    const { results } = await attachBadgesAndMe(supabase, userId, list);
    return { rows: results, total, page, pageSize, programId: data.programId };
  });

export const getMyProgramRank = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => programOnlyInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase.rpc(
      "ambassador_leaderboard_my_program_rank",
      { _program_id: data.programId },
    );
    if (error) throw new Error(error.message);
    const row = ((rows as any[]) || [])[0];
    if (!row) return { present: false as const, programId: data.programId };
    return {
      present: true as const,
      programId: data.programId,
      ambassador_id: row.ambassador_id as string,
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

// ============ CAMPAIGN LEADERBOARD ============
const campaignListInput = z.object({
  campaignId: z.string().uuid(),
  search: z.string().trim().max(80).optional().nullable(),
  page: z.number().int().min(1).max(4000).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
});

const campaignOnlyInput = z.object({
  campaignId: z.string().uuid(),
});

export type CampaignLeaderboardRow = {
  ambassador_id: string;
  rank_position: number;
  display_identity: string;
  college_display: string | null;
  photo_url: string | null;
  level_name: string | null;
  level_icon: string | null;
  metric_value: number;
  progress_pct: number | null;
  featured_badges: { badge_id: string; name: string; icon: string | null }[];
  is_me: boolean;
};

export const listVisibleCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase.rpc("ambassador_visible_campaigns");
    if (error) throw new Error(error.message);
    return ((data as any[]) ?? []).map((c) => ({
      id: c.id as string,
      campaign_code: (c.campaign_code as string) ?? null,
      name: c.name as string,
      description: (c.description as string) ?? null,
      campaign_type: c.campaign_type as string,
      status: c.status as string,
      program_id: (c.program_id as string) ?? null,
      campus_scope: (c.campus_scope as string) ?? null,
      ranking_metric: c.ranking_metric as string,
      starts_at: c.starts_at as string,
      ends_at: (c.ends_at as string) ?? null,
      ranking_finalised_at: (c.ranking_finalised_at as string) ?? null,
      banner_text: (c.banner_text as string) ?? null,
      is_final: Boolean(c.is_final),
    }));
  });

export const listCampaignLeaderboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => campaignListInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const page = data.page ?? 1;
    const pageSize = data.pageSize ?? 25;
    const search = (data.search ?? "").trim();
    const { data: rows, error } = await supabase.rpc("ambassador_leaderboard_campaign", {
      _campaign_id: data.campaignId,
      _search: search || undefined,
      _limit: pageSize,
      _offset: (page - 1) * pageSize,
    });
    if (error) throw new Error(error.message);
    const list = (rows as any[]) || [];
    const total = list[0]?.total_count ? Number(list[0].total_count) : 0;
    const isFinal = list[0]?.is_final ? Boolean(list[0].is_final) : false;
    const metric = (list[0]?.ranking_metric as string) ?? "verified_enrollments";

    // Fetch "me" + featured badges (reuse pattern)
    const { data: me } = await supabase
      .from("campus_ambassador_profiles")
      .select("id").eq("user_id", userId).maybeSingle();
    const myId = (me as any)?.id ?? null;
    const badgesByAmb = new Map<string, { badge_id: string; name: string; icon: string | null }[]>();
    if (list.length > 0) {
      const ids = list.map((r) => r.ambassador_id);
      const { data: badges } = await supabase.rpc("ambassador_leaderboard_featured_badges", { _ids: ids });
      for (const b of (badges as any[]) || []) {
        const arr = badgesByAmb.get(b.ambassador_id) || [];
        arr.push({ badge_id: b.badge_id, name: b.badge_name, icon: b.badge_icon });
        badgesByAmb.set(b.ambassador_id, arr);
      }
    }
    const results: CampaignLeaderboardRow[] = list.map((r: any) => ({
      ambassador_id: r.ambassador_id,
      rank_position: Number(r.rank_position),
      display_identity: r.display_identity,
      college_display: r.college_display ?? null,
      photo_url: r.photo_url ?? null,
      level_name: r.level_name ?? null,
      level_icon: r.level_icon ?? null,
      metric_value: Number(r.metric_value ?? 0),
      progress_pct: r.progress_pct != null ? Number(r.progress_pct) : null,
      featured_badges: badgesByAmb.get(r.ambassador_id) || [],
      is_me: myId != null && r.ambassador_id === myId,
    }));
    return {
      rows: results, total, page, pageSize,
      campaignId: data.campaignId,
      is_final: isFinal, ranking_metric: metric,
    };
  });

export const getMyCampaignRank = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => campaignOnlyInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase.rpc(
      "ambassador_leaderboard_my_campaign_rank",
      { _campaign_id: data.campaignId },
    );
    if (error) throw new Error(error.message);
    const row = ((rows as any[]) || [])[0];
    if (!row) return { present: false as const, campaignId: data.campaignId };
    return {
      present: true as const,
      campaignId: data.campaignId,
      ambassador_id: row.ambassador_id as string,
      ambassador_code: (row.ambassador_code as string) ?? null,
      rank_position: Number(row.rank_position),
      display_identity: row.display_identity as string,
      college_display: (row.college_display as string) ?? null,
      photo_url: (row.photo_url as string) ?? null,
      level_name: (row.level_name as string) ?? null,
      level_icon: (row.level_icon as string) ?? null,
      metric_value: Number(row.metric_value ?? 0),
      progress_pct: row.progress_pct != null ? Number(row.progress_pct) : null,
      total_ranked: Number(row.total_ranked),
      is_final: Boolean(row.is_final),
      ranking_metric: row.ranking_metric as string,
    };
  });
