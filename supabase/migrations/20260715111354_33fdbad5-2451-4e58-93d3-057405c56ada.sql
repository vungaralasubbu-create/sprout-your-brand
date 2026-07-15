
CREATE OR REPLACE FUNCTION public.ambassador_leaderboard_overall(
  _search text DEFAULT NULL,
  _limit int DEFAULT 25,
  _offset int DEFAULT 0
)
RETURNS TABLE (
  ambassador_id uuid,
  rank_position bigint,
  display_identity text,
  college_display text,
  photo_url text,
  level_name text,
  level_icon text,
  verified_enrollments bigint,
  valid_referral_leads bigint,
  conversion_rate numeric,
  total_count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH base AS (
    SELECT
      p.id,
      p.first_name, p.last_name,
      p.leaderboard_display_name,
      p.leaderboard_show_first_name,
      p.leaderboard_show_college,
      p.leaderboard_show_photo,
      p.profile_photo_url,
      p.college_name,
      p.current_level_id,
      COALESCE((SELECT COUNT(*) FROM ambassador_referral_leads l WHERE l.ambassador_id = p.id), 0)::bigint AS leads,
      COALESCE((SELECT COUNT(*) FROM ambassador_commissions c
        WHERE c.ambassador_id = p.id AND c.status IN ('approved','paid','available')), 0)::bigint AS verified
    FROM campus_ambassador_profiles p
    WHERE p.status = 'active'
  ),
  identified AS (
    SELECT b.*,
      COALESCE(
        NULLIF(TRIM(b.leaderboard_display_name), ''),
        CASE WHEN b.leaderboard_show_first_name AND b.first_name IS NOT NULL AND TRIM(b.first_name) <> ''
          THEN TRIM(b.first_name) || COALESCE(' ' || UPPER(LEFT(NULLIF(TRIM(b.last_name),''), 1)) || '.', '')
        END,
        'Ambassador ' || UPPER(SUBSTRING(b.id::text, 1, 4))
      ) AS ident,
      CASE WHEN b.leaderboard_show_college THEN b.college_name END AS coll,
      CASE WHEN b.leaderboard_show_photo THEN b.profile_photo_url END AS photo,
      CASE WHEN b.leads > 0 THEN (b.verified::numeric / b.leads * 100) ELSE 0 END AS conv
    FROM base b
  ),
  ranked AS (
    SELECT i.*,
      ROW_NUMBER() OVER (
        ORDER BY i.verified DESC, i.conv DESC, i.leads DESC, i.id
      ) AS rnk
    FROM identified i
  ),
  filtered AS (
    SELECT * FROM ranked r
    WHERE _search IS NULL OR _search = ''
      OR r.ident ILIKE '%' || _search || '%'
      OR (r.coll IS NOT NULL AND r.coll ILIKE '%' || _search || '%')
  )
  SELECT
    f.id,
    f.rnk,
    f.ident,
    f.coll,
    f.photo,
    lv.name,
    lv.icon,
    f.verified,
    f.leads,
    ROUND(f.conv, 2),
    (SELECT COUNT(*) FROM filtered)::bigint
  FROM filtered f
  LEFT JOIN ambassador_levels lv ON lv.id = f.current_level_id
  ORDER BY f.rnk
  LIMIT GREATEST(_limit, 1) OFFSET GREATEST(_offset, 0);
$$;

REVOKE ALL ON FUNCTION public.ambassador_leaderboard_overall(text, int, int) FROM public;
GRANT EXECUTE ON FUNCTION public.ambassador_leaderboard_overall(text, int, int) TO authenticated;

CREATE OR REPLACE FUNCTION public.ambassador_leaderboard_my_rank()
RETURNS TABLE (
  ambassador_id uuid,
  ambassador_code text,
  rank_position bigint,
  display_identity text,
  college_display text,
  photo_url text,
  level_name text,
  level_icon text,
  verified_enrollments bigint,
  valid_referral_leads bigint,
  conversion_rate numeric,
  total_active bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH me AS (
    SELECT id FROM campus_ambassador_profiles WHERE user_id = auth.uid() LIMIT 1
  ),
  base AS (
    SELECT
      p.id, p.ambassador_code, p.first_name, p.last_name, p.full_name,
      p.profile_photo_url, p.college_name, p.current_level_id,
      COALESCE((SELECT COUNT(*) FROM ambassador_referral_leads l WHERE l.ambassador_id = p.id), 0)::bigint AS leads,
      COALESCE((SELECT COUNT(*) FROM ambassador_commissions c
        WHERE c.ambassador_id = p.id AND c.status IN ('approved','paid','available')), 0)::bigint AS verified
    FROM campus_ambassador_profiles p
    WHERE p.status = 'active'
  ),
  ranked AS (
    SELECT b.*,
      CASE WHEN b.leads > 0 THEN (b.verified::numeric / b.leads * 100) ELSE 0 END AS conv,
      ROW_NUMBER() OVER (
        ORDER BY b.verified DESC,
          (CASE WHEN b.leads > 0 THEN (b.verified::numeric / b.leads) ELSE 0 END) DESC,
          b.leads DESC, b.id
      ) AS rnk
    FROM base b
  )
  SELECT
    r.id, r.ambassador_code, r.rnk,
    COALESCE(NULLIF(TRIM(COALESCE(r.first_name,'') || ' ' || COALESCE(r.last_name,'')),''), r.full_name),
    r.college_name, r.profile_photo_url,
    lv.name, lv.icon,
    r.verified, r.leads,
    ROUND(r.conv, 2),
    (SELECT COUNT(*) FROM base)::bigint
  FROM ranked r
  JOIN me ON me.id = r.id
  LEFT JOIN ambassador_levels lv ON lv.id = r.current_level_id
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.ambassador_leaderboard_my_rank() FROM public;
GRANT EXECUTE ON FUNCTION public.ambassador_leaderboard_my_rank() TO authenticated;

CREATE OR REPLACE FUNCTION public.ambassador_leaderboard_featured_badges(_ids uuid[])
RETURNS TABLE (
  ambassador_id uuid,
  badge_id uuid,
  badge_name text,
  badge_icon text,
  achieved_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT ambassador_id, badge_id, badge_name, badge_icon, achieved_at
  FROM (
    SELECT
      a.ambassador_id,
      a.badge_id,
      b.name AS badge_name,
      b.icon AS badge_icon,
      a.achieved_at,
      ROW_NUMBER() OVER (PARTITION BY a.ambassador_id ORDER BY a.achieved_at DESC) AS rn
    FROM ambassador_badge_achievements a
    JOIN ambassador_badges b ON b.id = a.badge_id
    WHERE a.ambassador_id = ANY(_ids)
      AND a.status = 'earned'
      AND b.is_published = true
  ) x
  WHERE rn <= 3;
$$;

REVOKE ALL ON FUNCTION public.ambassador_leaderboard_featured_badges(uuid[]) FROM public;
GRANT EXECUTE ON FUNCTION public.ambassador_leaderboard_featured_badges(uuid[]) TO authenticated;
