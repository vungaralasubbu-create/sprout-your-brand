
-- Add leaderboard configuration to campaigns
ALTER TABLE public.ambassador_bonus_campaigns
  ADD COLUMN IF NOT EXISTS leaderboard_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ranking_metric text NOT NULL DEFAULT 'verified_enrollments',
  ADD COLUMN IF NOT EXISTS ranking_finalised_at timestamptz;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ambassador_bonus_campaigns_ranking_metric_check') THEN
    ALTER TABLE public.ambassador_bonus_campaigns
      ADD CONSTRAINT ambassador_bonus_campaigns_ranking_metric_check
      CHECK (ranking_metric IN (
        'verified_enrollments','valid_referral_leads','campaign_milestones',
        'program_enrollments','campaign_progress_score'
      ));
  END IF;
END $$;

-- Snapshot table for finalised rankings
CREATE TABLE IF NOT EXISTS public.ambassador_campaign_leaderboard_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.ambassador_bonus_campaigns(id) ON DELETE CASCADE,
  ambassador_id uuid NOT NULL REFERENCES public.campus_ambassador_profiles(id) ON DELETE CASCADE,
  rank_position int NOT NULL,
  metric_value numeric(14,4) NOT NULL DEFAULT 0,
  progress_pct numeric(6,2),
  finalised_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, ambassador_id)
);
GRANT SELECT ON public.ambassador_campaign_leaderboard_snapshots TO authenticated;
GRANT ALL ON public.ambassador_campaign_leaderboard_snapshots TO service_role;
ALTER TABLE public.ambassador_campaign_leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_read_snapshots" ON public.ambassador_campaign_leaderboard_snapshots;
CREATE POLICY "auth_read_snapshots" ON public.ambassador_campaign_leaderboard_snapshots
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.ambassador_bonus_campaigns c
      WHERE c.id = campaign_id AND c.leaderboard_enabled = true AND c.visibility = 'published'
    )
  );

DROP POLICY IF EXISTS "admin_manage_snapshots" ON public.ambassador_campaign_leaderboard_snapshots;
CREATE POLICY "admin_manage_snapshots" ON public.ambassador_campaign_leaderboard_snapshots
  FOR ALL TO authenticated
  USING (has_admin_permission(auth.uid(),'campus_ambassador.review'))
  WITH CHECK (has_admin_permission(auth.uid(),'campus_ambassador.review'));

-- ============ PROGRAM LEADERBOARD ============
CREATE OR REPLACE FUNCTION public.ambassador_leaderboard_program(
  _program_id text,
  _search text DEFAULT NULL,
  _limit int DEFAULT 25,
  _offset int DEFAULT 0
)
RETURNS TABLE(
  ambassador_id uuid, rank_position bigint, display_identity text,
  college_display text, photo_url text, level_name text, level_icon text,
  verified_enrollments bigint, valid_referral_leads bigint,
  conversion_rate numeric, total_count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH base AS (
    SELECT p.id,
      p.leaderboard_display_name, p.leaderboard_show_first_name,
      p.leaderboard_show_college, p.leaderboard_show_photo,
      p.first_name, p.last_name, p.profile_photo_url,
      p.college_name, p.current_level_id,
      COALESCE((SELECT COUNT(*) FROM ambassador_referral_leads l
        WHERE l.ambassador_id = p.id AND l.program_id = _program_id
          AND l.attribution_status = 'valid'),0)::bigint AS leads,
      COALESCE((SELECT COUNT(*) FROM ambassador_commissions c
        WHERE c.ambassador_id = p.id AND c.program_id = _program_id
          AND c.status IN ('approved','paid','available')),0)::bigint AS verified
    FROM campus_ambassador_profiles p
    WHERE p.status = 'active'
  ),
  eligible AS (
    SELECT * FROM base WHERE leads > 0 OR verified > 0
  ),
  identified AS (
    SELECT e.*,
      COALESCE(
        NULLIF(TRIM(e.leaderboard_display_name),''),
        CASE WHEN e.leaderboard_show_first_name AND e.first_name IS NOT NULL AND TRIM(e.first_name) <> ''
          THEN TRIM(e.first_name) || COALESCE(' ' || UPPER(LEFT(NULLIF(TRIM(e.last_name),''),1)) || '.', '')
        END,
        'Ambassador ' || UPPER(SUBSTRING(e.id::text,1,4))
      ) AS ident,
      CASE WHEN e.leaderboard_show_college THEN e.college_name END AS coll,
      CASE WHEN e.leaderboard_show_photo THEN e.profile_photo_url END AS photo,
      CASE WHEN e.leads > 0 THEN (e.verified::numeric / e.leads * 100) ELSE 0 END AS conv
    FROM eligible e
  ),
  ranked AS (
    SELECT i.*, ROW_NUMBER() OVER (ORDER BY i.verified DESC, i.conv DESC, i.leads DESC, i.id) AS rnk
    FROM identified i
  ),
  filtered AS (
    SELECT * FROM ranked r
    WHERE _search IS NULL OR _search = ''
      OR r.ident ILIKE '%' || _search || '%'
      OR (r.coll IS NOT NULL AND r.coll ILIKE '%' || _search || '%')
  )
  SELECT f.id, f.rnk, f.ident, f.coll, f.photo,
    lv.name, lv.icon, f.verified, f.leads, ROUND(f.conv, 2),
    (SELECT COUNT(*) FROM filtered)::bigint
  FROM filtered f
  LEFT JOIN ambassador_levels lv ON lv.id = f.current_level_id
  ORDER BY f.rnk
  LIMIT GREATEST(_limit,1) OFFSET GREATEST(_offset,0);
$$;

CREATE OR REPLACE FUNCTION public.ambassador_leaderboard_my_program_rank(_program_id text)
RETURNS TABLE(
  ambassador_id uuid, ambassador_code text, rank_position bigint,
  display_identity text, college_display text, photo_url text,
  level_name text, level_icon text,
  verified_enrollments bigint, valid_referral_leads bigint,
  conversion_rate numeric, total_ranked bigint
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT id FROM campus_ambassador_profiles WHERE user_id = auth.uid() LIMIT 1
  ),
  base AS (
    SELECT p.id, p.ambassador_code, p.first_name, p.last_name, p.full_name,
      p.profile_photo_url, p.college_name, p.current_level_id,
      COALESCE((SELECT COUNT(*) FROM ambassador_referral_leads l
        WHERE l.ambassador_id = p.id AND l.program_id = _program_id
          AND l.attribution_status = 'valid'),0)::bigint AS leads,
      COALESCE((SELECT COUNT(*) FROM ambassador_commissions c
        WHERE c.ambassador_id = p.id AND c.program_id = _program_id
          AND c.status IN ('approved','paid','available')),0)::bigint AS verified
    FROM campus_ambassador_profiles p
    WHERE p.status = 'active'
  ),
  eligible AS (
    SELECT * FROM base WHERE leads > 0 OR verified > 0
  ),
  ranked AS (
    SELECT e.*,
      CASE WHEN e.leads > 0 THEN (e.verified::numeric / e.leads * 100) ELSE 0 END AS conv,
      ROW_NUMBER() OVER (ORDER BY e.verified DESC,
        (CASE WHEN e.leads > 0 THEN (e.verified::numeric / e.leads) ELSE 0 END) DESC,
        e.leads DESC, e.id) AS rnk
    FROM eligible e
  )
  SELECT r.id, r.ambassador_code, r.rnk,
    COALESCE(NULLIF(TRIM(COALESCE(r.first_name,'')||' '||COALESCE(r.last_name,'')),''), r.full_name),
    r.college_name, r.profile_photo_url, lv.name, lv.icon,
    r.verified, r.leads, ROUND(r.conv,2), (SELECT COUNT(*) FROM eligible)::bigint
  FROM ranked r JOIN me ON me.id = r.id
  LEFT JOIN ambassador_levels lv ON lv.id = r.current_level_id
  LIMIT 1;
$$;

-- ============ CAMPAIGN LEADERBOARD ============
CREATE OR REPLACE FUNCTION public.ambassador_visible_campaigns()
RETURNS TABLE(
  id uuid, campaign_code text, name text, description text,
  campaign_type text, status text, program_id text, campus_scope text,
  ranking_metric text, starts_at timestamptz, ends_at timestamptz,
  ranking_finalised_at timestamptz, banner_text text, is_final boolean
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.campaign_code, c.name, c.description, c.campaign_type,
    c.status, c.program_id, c.campus_scope, c.ranking_metric,
    c.starts_at, c.ends_at, c.ranking_finalised_at, c.banner_text,
    (c.ranking_finalised_at IS NOT NULL) AS is_final
  FROM ambassador_bonus_campaigns c
  WHERE c.leaderboard_enabled = true
    AND c.visibility = 'published'
    AND c.status IN ('scheduled','active','paused','completed')
    AND (
      c.campus_scope IS NULL OR c.campus_scope = ''
      OR EXISTS (
        SELECT 1 FROM campus_ambassador_profiles p
        WHERE p.user_id = auth.uid()
          AND lower(TRIM(COALESCE(p.college_name,''))) = lower(TRIM(c.campus_scope))
      )
      OR has_admin_permission(auth.uid(),'campus_ambassador.review')
    )
  ORDER BY (c.status = 'active') DESC, c.starts_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.ambassador_leaderboard_campaign(
  _campaign_id uuid,
  _search text DEFAULT NULL,
  _limit int DEFAULT 25,
  _offset int DEFAULT 0
)
RETURNS TABLE(
  ambassador_id uuid, rank_position bigint,
  display_identity text, college_display text, photo_url text,
  level_name text, level_icon text,
  metric_value numeric, progress_pct numeric,
  total_count bigint, is_final boolean, ranking_metric text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  camp record;
  total_ms int;
  eligible_caller boolean;
BEGIN
  SELECT * INTO camp FROM ambassador_bonus_campaigns
   WHERE id = _campaign_id AND leaderboard_enabled = true AND visibility = 'published';
  IF NOT FOUND THEN RETURN; END IF;

  eligible_caller := TRUE;
  IF camp.campus_scope IS NOT NULL AND camp.campus_scope <> '' THEN
    eligible_caller := EXISTS (
      SELECT 1 FROM campus_ambassador_profiles p
      WHERE p.user_id = auth.uid()
        AND lower(TRIM(COALESCE(p.college_name,''))) = lower(TRIM(camp.campus_scope))
    ) OR has_admin_permission(auth.uid(),'campus_ambassador.review');
  END IF;
  IF NOT eligible_caller THEN RETURN; END IF;

  SELECT COUNT(*) INTO total_ms FROM ambassador_campaign_milestones
   WHERE campaign_id = _campaign_id AND is_active = true;

  IF camp.ranking_finalised_at IS NOT NULL THEN
    RETURN QUERY
    WITH snap AS (
      SELECT s.ambassador_id, s.rank_position::bigint AS rnk, s.metric_value, s.progress_pct
      FROM ambassador_campaign_leaderboard_snapshots s
      WHERE s.campaign_id = _campaign_id
    ),
    joined AS (
      SELECT s.*, p.first_name, p.last_name, p.full_name, p.current_level_id,
        p.leaderboard_display_name, p.leaderboard_show_first_name,
        p.leaderboard_show_college, p.leaderboard_show_photo,
        p.profile_photo_url, p.college_name
      FROM snap s JOIN campus_ambassador_profiles p ON p.id = s.ambassador_id
    ),
    identified AS (
      SELECT j.*,
        COALESCE(
          NULLIF(TRIM(j.leaderboard_display_name),''),
          CASE WHEN j.leaderboard_show_first_name AND j.first_name IS NOT NULL AND TRIM(j.first_name) <> ''
            THEN TRIM(j.first_name) || COALESCE(' ' || UPPER(LEFT(NULLIF(TRIM(j.last_name),''),1)) || '.', '')
          END,
          'Ambassador ' || UPPER(SUBSTRING(j.ambassador_id::text,1,4))
        ) AS ident,
        CASE WHEN j.leaderboard_show_college THEN j.college_name END AS coll,
        CASE WHEN j.leaderboard_show_photo THEN j.profile_photo_url END AS photo
      FROM joined j
    ),
    filtered AS (
      SELECT * FROM identified i
      WHERE _search IS NULL OR _search = ''
        OR i.ident ILIKE '%' || _search || '%'
        OR (i.coll IS NOT NULL AND i.coll ILIKE '%' || _search || '%')
    )
    SELECT f.ambassador_id, f.rnk, f.ident, f.coll, f.photo,
      lv.name, lv.icon, f.metric_value, f.progress_pct,
      (SELECT COUNT(*) FROM filtered)::bigint, true, camp.ranking_metric
    FROM filtered f
    LEFT JOIN ambassador_levels lv ON lv.id = f.current_level_id
    ORDER BY f.rnk
    LIMIT GREATEST(_limit,1) OFFSET GREATEST(_offset,0);
    RETURN;
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT p.id,
      p.leaderboard_display_name, p.leaderboard_show_first_name,
      p.leaderboard_show_college, p.leaderboard_show_photo,
      p.first_name, p.last_name, p.profile_photo_url,
      p.college_name, p.current_level_id,
      CASE
        WHEN camp.ranking_metric = 'valid_referral_leads' THEN
          (SELECT COUNT(*) FROM ambassador_referral_leads l
           WHERE l.ambassador_id = p.id
             AND l.attribution_status = 'valid'
             AND (camp.program_id IS NULL OR l.program_id = camp.program_id)
             AND l.created_at >= camp.starts_at
             AND l.created_at < COALESCE(camp.ends_at, now()))::numeric
        WHEN camp.ranking_metric = 'campaign_milestones' THEN
          (SELECT COUNT(*) FROM ambassador_campaign_milestone_achievements a
           WHERE a.ambassador_id = p.id AND a.campaign_id = _campaign_id
             AND a.eligibility_status IN ('eligible','fulfilled'))::numeric
        WHEN camp.ranking_metric = 'campaign_progress_score' THEN
          CASE WHEN total_ms = 0 THEN 0
          ELSE (SELECT COUNT(*)::numeric FROM ambassador_campaign_milestone_achievements a
                WHERE a.ambassador_id = p.id AND a.campaign_id = _campaign_id
                  AND a.eligibility_status IN ('eligible','fulfilled')) / total_ms * 100
          END
        ELSE
          (SELECT COUNT(*) FROM ambassador_commissions c
           WHERE c.ambassador_id = p.id
             AND c.status IN ('approved','paid','available')
             AND (camp.program_id IS NULL OR c.program_id = camp.program_id)
             AND COALESCE(c.approved_at, c.created_at) >= camp.starts_at
             AND COALESCE(c.approved_at, c.created_at) < COALESCE(camp.ends_at, now()))::numeric
      END AS mv
    FROM campus_ambassador_profiles p
    WHERE p.status = 'active'
      AND (camp.campus_scope IS NULL OR camp.campus_scope = ''
           OR lower(TRIM(COALESCE(p.college_name,''))) = lower(TRIM(camp.campus_scope)))
  ),
  eligible AS (
    SELECT * FROM base WHERE mv > 0
  ),
  identified AS (
    SELECT e.*,
      COALESCE(
        NULLIF(TRIM(e.leaderboard_display_name),''),
        CASE WHEN e.leaderboard_show_first_name AND e.first_name IS NOT NULL AND TRIM(e.first_name) <> ''
          THEN TRIM(e.first_name) || COALESCE(' ' || UPPER(LEFT(NULLIF(TRIM(e.last_name),''),1)) || '.', '')
        END,
        'Ambassador ' || UPPER(SUBSTRING(e.id::text,1,4))
      ) AS ident,
      CASE WHEN e.leaderboard_show_college THEN e.college_name END AS coll,
      CASE WHEN e.leaderboard_show_photo THEN e.profile_photo_url END AS photo
    FROM eligible e
  ),
  ranked AS (
    SELECT i.*, ROW_NUMBER() OVER (ORDER BY i.mv DESC, i.id) AS rnk FROM identified i
  ),
  filtered AS (
    SELECT * FROM ranked r
    WHERE _search IS NULL OR _search = ''
      OR r.ident ILIKE '%' || _search || '%'
      OR (r.coll IS NOT NULL AND r.coll ILIKE '%' || _search || '%')
  )
  SELECT f.id, f.rnk, f.ident, f.coll, f.photo,
    lv.name, lv.icon, f.mv,
    CASE
      WHEN camp.ranking_metric = 'campaign_progress_score' THEN LEAST(100::numeric, ROUND(f.mv, 2))
      WHEN camp.ranking_metric = 'campaign_milestones' AND total_ms > 0
        THEN LEAST(100::numeric, ROUND(f.mv / total_ms * 100, 2))
      ELSE NULL::numeric
    END,
    (SELECT COUNT(*) FROM filtered)::bigint, false, camp.ranking_metric
  FROM filtered f
  LEFT JOIN ambassador_levels lv ON lv.id = f.current_level_id
  ORDER BY f.rnk
  LIMIT GREATEST(_limit,1) OFFSET GREATEST(_offset,0);
END $$;

CREATE OR REPLACE FUNCTION public.ambassador_leaderboard_my_campaign_rank(_campaign_id uuid)
RETURNS TABLE(
  ambassador_id uuid, ambassador_code text, rank_position bigint,
  display_identity text, college_display text, photo_url text,
  level_name text, level_icon text,
  metric_value numeric, progress_pct numeric,
  total_ranked bigint, is_final boolean, ranking_metric text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  camp record;
  total_ms int;
BEGIN
  SELECT * INTO camp FROM ambassador_bonus_campaigns
   WHERE id = _campaign_id AND leaderboard_enabled = true AND visibility = 'published';
  IF NOT FOUND THEN RETURN; END IF;

  SELECT COUNT(*) INTO total_ms FROM ambassador_campaign_milestones
   WHERE campaign_id = _campaign_id AND is_active = true;

  IF camp.ranking_finalised_at IS NOT NULL THEN
    RETURN QUERY
    WITH me AS (SELECT id FROM campus_ambassador_profiles WHERE user_id = auth.uid() LIMIT 1),
    snap AS (SELECT * FROM ambassador_campaign_leaderboard_snapshots WHERE campaign_id = _campaign_id)
    SELECT p.id, p.ambassador_code, s.rank_position::bigint,
      COALESCE(NULLIF(TRIM(COALESCE(p.first_name,'')||' '||COALESCE(p.last_name,'')),''), p.full_name),
      p.college_name, p.profile_photo_url, lv.name, lv.icon,
      s.metric_value, s.progress_pct,
      (SELECT COUNT(*) FROM snap)::bigint, true, camp.ranking_metric
    FROM snap s
    JOIN campus_ambassador_profiles p ON p.id = s.ambassador_id
    JOIN me ON me.id = p.id
    LEFT JOIN ambassador_levels lv ON lv.id = p.current_level_id
    LIMIT 1;
    RETURN;
  END IF;

  RETURN QUERY
  WITH me AS (SELECT id FROM campus_ambassador_profiles WHERE user_id = auth.uid() LIMIT 1),
  base AS (
    SELECT p.id, p.ambassador_code, p.first_name, p.last_name, p.full_name,
      p.profile_photo_url, p.college_name, p.current_level_id,
      CASE
        WHEN camp.ranking_metric = 'valid_referral_leads' THEN
          (SELECT COUNT(*) FROM ambassador_referral_leads l
           WHERE l.ambassador_id = p.id AND l.attribution_status = 'valid'
             AND (camp.program_id IS NULL OR l.program_id = camp.program_id)
             AND l.created_at >= camp.starts_at
             AND l.created_at < COALESCE(camp.ends_at, now()))::numeric
        WHEN camp.ranking_metric = 'campaign_milestones' THEN
          (SELECT COUNT(*) FROM ambassador_campaign_milestone_achievements a
           WHERE a.ambassador_id = p.id AND a.campaign_id = _campaign_id
             AND a.eligibility_status IN ('eligible','fulfilled'))::numeric
        WHEN camp.ranking_metric = 'campaign_progress_score' THEN
          CASE WHEN total_ms = 0 THEN 0
          ELSE (SELECT COUNT(*)::numeric FROM ambassador_campaign_milestone_achievements a
                WHERE a.ambassador_id = p.id AND a.campaign_id = _campaign_id
                  AND a.eligibility_status IN ('eligible','fulfilled')) / total_ms * 100
          END
        ELSE
          (SELECT COUNT(*) FROM ambassador_commissions c
           WHERE c.ambassador_id = p.id AND c.status IN ('approved','paid','available')
             AND (camp.program_id IS NULL OR c.program_id = camp.program_id)
             AND COALESCE(c.approved_at, c.created_at) >= camp.starts_at
             AND COALESCE(c.approved_at, c.created_at) < COALESCE(camp.ends_at, now()))::numeric
      END AS mv
    FROM campus_ambassador_profiles p
    WHERE p.status = 'active'
      AND (camp.campus_scope IS NULL OR camp.campus_scope = ''
           OR lower(TRIM(COALESCE(p.college_name,''))) = lower(TRIM(camp.campus_scope)))
  ),
  eligible AS (SELECT * FROM base WHERE mv > 0),
  ranked AS (
    SELECT e.*, ROW_NUMBER() OVER (ORDER BY e.mv DESC, e.id) AS rnk FROM eligible e
  )
  SELECT r.id, r.ambassador_code, r.rnk,
    COALESCE(NULLIF(TRIM(COALESCE(r.first_name,'')||' '||COALESCE(r.last_name,'')),''), r.full_name),
    r.college_name, r.profile_photo_url, lv.name, lv.icon,
    r.mv,
    CASE
      WHEN camp.ranking_metric = 'campaign_progress_score' THEN LEAST(100::numeric, ROUND(r.mv, 2))
      WHEN camp.ranking_metric = 'campaign_milestones' AND total_ms > 0
        THEN LEAST(100::numeric, ROUND(r.mv / total_ms * 100, 2))
      ELSE NULL::numeric
    END,
    (SELECT COUNT(*) FROM eligible)::bigint, false, camp.ranking_metric
  FROM ranked r JOIN me ON me.id = r.id
  LEFT JOIN ambassador_levels lv ON lv.id = r.current_level_id
  LIMIT 1;
END $$;
