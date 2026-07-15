
-- =========================================================
-- Monthly leaderboard: overall ranking within a calendar month
-- Timezone: Asia/Kolkata (Glintr business timezone)
-- =========================================================
CREATE OR REPLACE FUNCTION public.ambassador_leaderboard_monthly(
  _year int,
  _month int,
  _search text DEFAULT NULL,
  _limit int DEFAULT 25,
  _offset int DEFAULT 0
)
RETURNS TABLE(
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
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH bounds AS (
    SELECT
      (make_timestamptz(_year, _month, 1, 0, 0, 0, 'Asia/Kolkata')) AS period_start,
      (make_timestamptz(_year, _month, 1, 0, 0, 0, 'Asia/Kolkata') + interval '1 month') AS period_end
  ),
  base AS (
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
      COALESCE((
        SELECT COUNT(*) FROM ambassador_referral_leads l, bounds b
        WHERE l.ambassador_id = p.id
          AND l.created_at >= b.period_start
          AND l.created_at < b.period_end
      ), 0)::bigint AS leads,
      COALESCE((
        SELECT COUNT(*) FROM ambassador_commissions c, bounds b
        WHERE c.ambassador_id = p.id
          AND c.status IN ('approved','paid','available')
          AND COALESCE(c.approved_at, c.created_at) >= b.period_start
          AND COALESCE(c.approved_at, c.created_at) < b.period_end
      ), 0)::bigint AS verified
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
    WHERE b.leads > 0 OR b.verified > 0
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
    f.id, f.rnk, f.ident, f.coll, f.photo,
    lv.name, lv.icon,
    f.verified, f.leads, ROUND(f.conv, 2),
    (SELECT COUNT(*) FROM filtered)::bigint
  FROM filtered f
  LEFT JOIN ambassador_levels lv ON lv.id = f.current_level_id
  ORDER BY f.rnk
  LIMIT GREATEST(_limit, 1) OFFSET GREATEST(_offset, 0);
$$;

-- =========================================================
-- My Monthly Rank
-- =========================================================
CREATE OR REPLACE FUNCTION public.ambassador_leaderboard_my_monthly_rank(
  _year int,
  _month int
)
RETURNS TABLE(
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
  total_ranked bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH me AS (
    SELECT id FROM campus_ambassador_profiles WHERE user_id = auth.uid() LIMIT 1
  ),
  bounds AS (
    SELECT
      (make_timestamptz(_year, _month, 1, 0, 0, 0, 'Asia/Kolkata')) AS period_start,
      (make_timestamptz(_year, _month, 1, 0, 0, 0, 'Asia/Kolkata') + interval '1 month') AS period_end
  ),
  base AS (
    SELECT
      p.id, p.ambassador_code, p.first_name, p.last_name, p.full_name,
      p.profile_photo_url, p.college_name, p.current_level_id,
      COALESCE((SELECT COUNT(*) FROM ambassador_referral_leads l, bounds b
        WHERE l.ambassador_id = p.id
          AND l.created_at >= b.period_start AND l.created_at < b.period_end
      ),0)::bigint AS leads,
      COALESCE((SELECT COUNT(*) FROM ambassador_commissions c, bounds b
        WHERE c.ambassador_id = p.id
          AND c.status IN ('approved','paid','available')
          AND COALESCE(c.approved_at, c.created_at) >= b.period_start
          AND COALESCE(c.approved_at, c.created_at) < b.period_end
      ),0)::bigint AS verified
    FROM campus_ambassador_profiles p
    WHERE p.status = 'active'
  ),
  active AS (
    SELECT b.*,
      CASE WHEN b.leads > 0 THEN (b.verified::numeric / b.leads * 100) ELSE 0 END AS conv
    FROM base b
    WHERE b.leads > 0 OR b.verified > 0
  ),
  ranked AS (
    SELECT a.*,
      ROW_NUMBER() OVER (
        ORDER BY a.verified DESC, a.conv DESC, a.leads DESC, a.id
      ) AS rnk
    FROM active a
  )
  SELECT
    r.id, r.ambassador_code, r.rnk,
    COALESCE(NULLIF(TRIM(COALESCE(r.first_name,'') || ' ' || COALESCE(r.last_name,'')),''), r.full_name),
    r.college_name, r.profile_photo_url,
    lv.name, lv.icon,
    r.verified, r.leads, ROUND(r.conv, 2),
    (SELECT COUNT(*) FROM active)::bigint
  FROM ranked r
  JOIN me ON me.id = r.id
  LEFT JOIN ambassador_levels lv ON lv.id = r.current_level_id
  LIMIT 1;
$$;

-- =========================================================
-- My College context (for leaderboard header + gating)
-- =========================================================
CREATE OR REPLACE FUNCTION public.ambassador_my_college_context()
RETURNS TABLE(
  ambassador_id uuid,
  college_name text,
  college_key text,
  has_college boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    p.id,
    NULLIF(TRIM(p.college_name), '') AS college_name,
    lower(NULLIF(TRIM(p.college_name), '')) AS college_key,
    (NULLIF(TRIM(p.college_name), '') IS NOT NULL) AS has_college
  FROM campus_ambassador_profiles p
  WHERE p.user_id = auth.uid()
  LIMIT 1;
$$;

-- =========================================================
-- My College Leaderboard: only active ambassadors in caller's college
-- =========================================================
CREATE OR REPLACE FUNCTION public.ambassador_leaderboard_college(
  _search text DEFAULT NULL,
  _limit int DEFAULT 25,
  _offset int DEFAULT 0
)
RETURNS TABLE(
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
  total_count bigint,
  college_name text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH me AS (
    SELECT id, lower(NULLIF(TRIM(college_name),'')) AS ckey,
           NULLIF(TRIM(college_name),'') AS cname
    FROM campus_ambassador_profiles WHERE user_id = auth.uid() LIMIT 1
  ),
  base AS (
    SELECT
      p.id,
      p.first_name, p.last_name,
      p.leaderboard_display_name,
      p.leaderboard_show_first_name,
      p.leaderboard_show_photo,
      p.profile_photo_url,
      p.college_name,
      p.current_level_id,
      COALESCE((SELECT COUNT(*) FROM ambassador_referral_leads l WHERE l.ambassador_id = p.id), 0)::bigint AS leads,
      COALESCE((SELECT COUNT(*) FROM ambassador_commissions c
        WHERE c.ambassador_id = p.id AND c.status IN ('approved','paid','available')),0)::bigint AS verified
    FROM campus_ambassador_profiles p, me
    WHERE p.status = 'active'
      AND me.ckey IS NOT NULL
      AND lower(TRIM(p.college_name)) = me.ckey
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
    WHERE _search IS NULL OR _search = '' OR r.ident ILIKE '%' || _search || '%'
  )
  SELECT
    f.id, f.rnk, f.ident, f.college_name, f.photo,
    lv.name, lv.icon,
    f.verified, f.leads, ROUND(f.conv, 2),
    (SELECT COUNT(*) FROM filtered)::bigint,
    (SELECT cname FROM me)
  FROM filtered f
  LEFT JOIN ambassador_levels lv ON lv.id = f.current_level_id
  ORDER BY f.rnk
  LIMIT GREATEST(_limit, 1) OFFSET GREATEST(_offset, 0);
$$;

-- =========================================================
-- My Campus Rank
-- =========================================================
CREATE OR REPLACE FUNCTION public.ambassador_leaderboard_my_college_rank()
RETURNS TABLE(
  ambassador_id uuid,
  ambassador_code text,
  rank_position bigint,
  display_identity text,
  college_name text,
  photo_url text,
  level_name text,
  level_icon text,
  verified_enrollments bigint,
  valid_referral_leads bigint,
  conversion_rate numeric,
  total_ranked bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH me AS (
    SELECT id, lower(NULLIF(TRIM(college_name),'')) AS ckey, NULLIF(TRIM(college_name),'') AS cname
    FROM campus_ambassador_profiles WHERE user_id = auth.uid() LIMIT 1
  ),
  base AS (
    SELECT
      p.id, p.ambassador_code, p.first_name, p.last_name, p.full_name,
      p.profile_photo_url, p.college_name, p.current_level_id,
      COALESCE((SELECT COUNT(*) FROM ambassador_referral_leads l WHERE l.ambassador_id = p.id),0)::bigint AS leads,
      COALESCE((SELECT COUNT(*) FROM ambassador_commissions c
        WHERE c.ambassador_id = p.id AND c.status IN ('approved','paid','available')),0)::bigint AS verified
    FROM campus_ambassador_profiles p, me
    WHERE p.status = 'active'
      AND me.ckey IS NOT NULL
      AND lower(TRIM(p.college_name)) = me.ckey
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
    (SELECT cname FROM me),
    r.profile_photo_url,
    lv.name, lv.icon,
    r.verified, r.leads, ROUND(r.conv, 2),
    (SELECT COUNT(*) FROM base)::bigint
  FROM ranked r
  JOIN me ON me.id = r.id
  LEFT JOIN ambassador_levels lv ON lv.id = r.current_level_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.ambassador_leaderboard_monthly(int, int, text, int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ambassador_leaderboard_my_monthly_rank(int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ambassador_my_college_context() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ambassador_leaderboard_college(text, int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ambassador_leaderboard_my_college_rank() TO authenticated;
