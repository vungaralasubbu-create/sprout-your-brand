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

    // Resolve caller's ambassador id to mark "You"
    const { data: me } = await supabase
      .from("campus_ambassador_profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    const myId = (me as any)?.id ?? null;

    let badgesByAmb = new Map<string, { badge_id: string; name: string; icon: string | null }[]>();
    if (list.length > 0) {
      const ids = list.map((r) => r.ambassador_id);
      const { data: badges } = await supabase.rpc("ambassador_leaderboard_featured_badges", {
        _ids: ids,
      });
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
      college_display: r.college_display,
      photo_url: r.photo_url,
      level_name: r.level_name,
      level_icon: r.level_icon,
      verified_enrollments: Number(r.verified_enrollments),
      valid_referral_leads: Number(r.valid_referral_leads),
      conversion_rate: Number(r.conversion_rate),
      featured_badges: badgesByAmb.get(r.ambassador_id) || [],
      is_me: myId != null && r.ambassador_id === myId,
    }));

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
