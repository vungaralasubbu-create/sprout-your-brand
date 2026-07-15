
-- =========================================
-- 1. FINALISED LEADERBOARD SNAPSHOTS (monthly/college/program)
-- =========================================
CREATE TABLE IF NOT EXISTS public.ambassador_leaderboard_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  leaderboard_type TEXT NOT NULL CHECK (leaderboard_type IN ('monthly','college','program')),
  period_key TEXT NOT NULL,           -- e.g. "2026-07" for monthly, or "2026-07" per program/college
  program_id TEXT,                    -- for program snapshots
  college_key TEXT,                   -- verified college identifier for college snapshots
  ambassador_id UUID NOT NULL REFERENCES public.campus_ambassador_profiles(id) ON DELETE CASCADE,
  rank_position INTEGER NOT NULL CHECK (rank_position > 0),
  primary_metric TEXT NOT NULL,       -- e.g. 'verified_enrollments'
  metric_value NUMERIC NOT NULL DEFAULT 0,
  rule_id UUID REFERENCES public.ambassador_ranking_rules(id),
  rule_version INTEGER,
  finalised_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_amb_lb_snap_unique
  ON public.ambassador_leaderboard_snapshots(
    leaderboard_type, period_key,
    COALESCE(program_id,''), COALESCE(college_key,''),
    ambassador_id
  );
CREATE INDEX IF NOT EXISTS idx_amb_lb_snap_lookup
  ON public.ambassador_leaderboard_snapshots(leaderboard_type, period_key, rank_position);

GRANT SELECT ON public.ambassador_leaderboard_snapshots TO authenticated;
GRANT ALL ON public.ambassador_leaderboard_snapshots TO service_role;
ALTER TABLE public.ambassador_leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ambassadors read finalised snapshots"
  ON public.ambassador_leaderboard_snapshots FOR SELECT
  TO authenticated
  USING (true);

-- =========================================
-- 2. RECOGNITION RULES
-- =========================================
CREATE TABLE IF NOT EXISTS public.ambassador_recognition_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_code TEXT NOT NULL UNIQUE,
  recognition_name TEXT NOT NULL,
  recognition_type TEXT NOT NULL CHECK (recognition_type IN (
    'monthly_top','monthly_top3',
    'college_top','college_top3',
    'program_top','program_top3',
    'campaign_top','campaign_top3'
  )),
  leaderboard_type TEXT NOT NULL CHECK (leaderboard_type IN ('monthly','college','program','campaign')),
  eligible_positions INTEGER[] NOT NULL DEFAULT ARRAY[1],
  ranking_period_type TEXT NOT NULL CHECK (ranking_period_type IN ('monthly','campaign','rolling')),
  badge_id UUID REFERENCES public.ambassador_badges(id),
  recognition_title TEXT NOT NULL,
  recognition_description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','archived')),
  is_published BOOLEAN NOT NULL DEFAULT false,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_until TIMESTAMPTZ,
  rule_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ambassador_recognition_rules TO authenticated;
GRANT ALL ON public.ambassador_recognition_rules TO service_role;
ALTER TABLE public.ambassador_recognition_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ambassadors read published recognition rules"
  ON public.ambassador_recognition_rules FOR SELECT
  TO authenticated
  USING (is_published = true AND status = 'active');

-- =========================================
-- 3. RECOGNITION ACHIEVEMENTS
-- =========================================
CREATE TABLE IF NOT EXISTS public.ambassador_recognition_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ambassador_id UUID NOT NULL REFERENCES public.campus_ambassador_profiles(id) ON DELETE CASCADE,
  recognition_rule_id UUID NOT NULL REFERENCES public.ambassador_recognition_rules(id),
  recognition_rule_version INTEGER NOT NULL,
  ranking_period_key TEXT NOT NULL,
  leaderboard_snapshot_id UUID,             -- monthly/college/program snapshot
  campaign_snapshot_id UUID,                -- campaign snapshot
  campaign_id UUID REFERENCES public.ambassador_bonus_campaigns(id),
  program_id TEXT,
  college_key TEXT,
  final_rank INTEGER NOT NULL CHECK (final_rank > 0),
  recognition_title TEXT NOT NULL,
  recognition_description TEXT,
  badge_id UUID REFERENCES public.ambassador_badges(id),
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'awarded' CHECK (status IN ('awarded','revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_amb_recog_ach_unique
  ON public.ambassador_recognition_achievements(
    ambassador_id, recognition_rule_id, ranking_period_key,
    COALESCE(campaign_id::text,''), COALESCE(program_id,''), COALESCE(college_key,'')
  );
CREATE INDEX IF NOT EXISTS idx_amb_recog_ach_amb
  ON public.ambassador_recognition_achievements(ambassador_id, achieved_at DESC);

GRANT SELECT ON public.ambassador_recognition_achievements TO authenticated;
GRANT ALL ON public.ambassador_recognition_achievements TO service_role;
ALTER TABLE public.ambassador_recognition_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ambassadors read own recognition achievements"
  ON public.ambassador_recognition_achievements FOR SELECT
  TO authenticated
  USING (
    ambassador_id IN (
      SELECT id FROM public.campus_ambassador_profiles WHERE user_id = auth.uid()
    )
  );

-- =========================================
-- 4. HELPER: award a badge safely (idempotent)
-- =========================================
CREATE OR REPLACE FUNCTION public.ambassador_award_recognition_badge(
  _ambassador_id UUID,
  _badge_id UUID,
  _achievement_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _badge_id IS NULL THEN RETURN; END IF;

  INSERT INTO public.ambassador_badge_achievements(
    ambassador_id, badge_id, status, related_entity_type, related_entity_id, metadata
  )
  VALUES (
    _ambassador_id, _badge_id, 'awarded', 'recognition_achievement', _achievement_id, '{}'::jsonb
  )
  ON CONFLICT DO NOTHING;
EXCEPTION WHEN unique_violation THEN
  -- already exists via another path
  NULL;
END;
$$;

-- =========================================
-- 5. EVALUATE MONTHLY / COLLEGE / PROGRAM RECOGNITION
--    From FINALISED snapshots in ambassador_leaderboard_snapshots
-- =========================================
CREATE OR REPLACE FUNCTION public.ambassador_evaluate_period_recognition(
  _leaderboard_type TEXT,
  _period_key TEXT,
  _program_id TEXT DEFAULT NULL,
  _college_key TEXT DEFAULT NULL
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _awarded INTEGER := 0;
  _rule RECORD;
  _snap RECORD;
  _ach_id UUID;
BEGIN
  IF _leaderboard_type NOT IN ('monthly','college','program') THEN
    RAISE EXCEPTION 'invalid leaderboard_type %', _leaderboard_type;
  END IF;

  FOR _rule IN
    SELECT * FROM public.ambassador_recognition_rules
    WHERE is_published = true AND status = 'active'
      AND leaderboard_type = _leaderboard_type
      AND effective_from <= now()
      AND (effective_until IS NULL OR effective_until >= now())
  LOOP
    FOR _snap IN
      SELECT s.* FROM public.ambassador_leaderboard_snapshots s
      WHERE s.leaderboard_type = _leaderboard_type
        AND s.period_key = _period_key
        AND (_program_id IS NULL OR s.program_id = _program_id)
        AND (_college_key IS NULL OR s.college_key = _college_key)
        AND s.rank_position = ANY(_rule.eligible_positions)
    LOOP
      INSERT INTO public.ambassador_recognition_achievements(
        ambassador_id, recognition_rule_id, recognition_rule_version,
        ranking_period_key, leaderboard_snapshot_id,
        program_id, college_key,
        final_rank, recognition_title, recognition_description, badge_id
      ) VALUES (
        _snap.ambassador_id, _rule.id, _rule.rule_version,
        _snap.period_key, _snap.id,
        _snap.program_id, _snap.college_key,
        _snap.rank_position, _rule.recognition_title, _rule.recognition_description, _rule.badge_id
      )
      ON CONFLICT DO NOTHING
      RETURNING id INTO _ach_id;

      IF _ach_id IS NOT NULL THEN
        _awarded := _awarded + 1;
        PERFORM public.ambassador_award_recognition_badge(_snap.ambassador_id, _rule.badge_id, _ach_id);
        INSERT INTO public.ambassador_profile_activity(ambassador_id, event_type, description, metadata)
        VALUES (_snap.ambassador_id, 'recognition_awarded', _rule.recognition_title,
          jsonb_build_object('rule_id', _rule.id, 'period', _snap.period_key, 'rank', _snap.rank_position));
      END IF;
    END LOOP;
  END LOOP;

  RETURN _awarded;
END;
$$;

-- =========================================
-- 6. EVALUATE CAMPAIGN RECOGNITION
-- =========================================
CREATE OR REPLACE FUNCTION public.ambassador_evaluate_campaign_recognition(
  _campaign_id UUID
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _awarded INTEGER := 0;
  _rule RECORD;
  _snap RECORD;
  _ach_id UUID;
  _finalised BOOLEAN;
BEGIN
  SELECT (ranking_finalised_at IS NOT NULL) INTO _finalised
  FROM public.ambassador_bonus_campaigns WHERE id = _campaign_id;

  IF NOT COALESCE(_finalised, false) THEN
    RETURN 0;
  END IF;

  FOR _rule IN
    SELECT * FROM public.ambassador_recognition_rules
    WHERE is_published = true AND status = 'active'
      AND leaderboard_type = 'campaign'
      AND effective_from <= now()
      AND (effective_until IS NULL OR effective_until >= now())
  LOOP
    FOR _snap IN
      SELECT s.* FROM public.ambassador_campaign_leaderboard_snapshots s
      WHERE s.campaign_id = _campaign_id
        AND s.rank_position = ANY(_rule.eligible_positions)
        AND s.finalised_at IS NOT NULL
    LOOP
      INSERT INTO public.ambassador_recognition_achievements(
        ambassador_id, recognition_rule_id, recognition_rule_version,
        ranking_period_key, campaign_snapshot_id, campaign_id,
        final_rank, recognition_title, recognition_description, badge_id
      ) VALUES (
        _snap.ambassador_id, _rule.id, _rule.rule_version,
        'campaign:' || _campaign_id::text, _snap.id, _campaign_id,
        _snap.rank_position, _rule.recognition_title, _rule.recognition_description, _rule.badge_id
      )
      ON CONFLICT DO NOTHING
      RETURNING id INTO _ach_id;

      IF _ach_id IS NOT NULL THEN
        _awarded := _awarded + 1;
        PERFORM public.ambassador_award_recognition_badge(_snap.ambassador_id, _rule.badge_id, _ach_id);
        INSERT INTO public.ambassador_profile_activity(ambassador_id, event_type, description, metadata)
        VALUES (_snap.ambassador_id, 'recognition_awarded', _rule.recognition_title,
          jsonb_build_object('rule_id', _rule.id, 'campaign_id', _campaign_id, 'rank', _snap.rank_position));
      END IF;
    END LOOP;
  END LOOP;

  RETURN _awarded;
END;
$$;

-- =========================================
-- 7. READ HELPERS
-- =========================================

-- My Recognition list
CREATE OR REPLACE FUNCTION public.ambassador_my_recognitions()
RETURNS TABLE (
  id UUID,
  recognition_title TEXT,
  recognition_type TEXT,
  leaderboard_type TEXT,
  ranking_period_key TEXT,
  final_rank INTEGER,
  achieved_at TIMESTAMPTZ,
  badge_id UUID,
  badge_name TEXT,
  badge_icon TEXT,
  program_id TEXT,
  program_name TEXT,
  campaign_id UUID,
  campaign_name TEXT,
  college_key TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.id, a.recognition_title, r.recognition_type, r.leaderboard_type,
    a.ranking_period_key, a.final_rank, a.achieved_at,
    a.badge_id, b.name, b.icon,
    a.program_id, bp.program_title,
    a.campaign_id, c.name,
    a.college_key
  FROM public.ambassador_recognition_achievements a
  JOIN public.ambassador_recognition_rules r ON r.id = a.recognition_rule_id
  LEFT JOIN public.ambassador_badges b ON b.id = a.badge_id
  LEFT JOIN public.brand_programs bp ON bp.program_id = a.program_id
  LEFT JOIN public.ambassador_bonus_campaigns c ON c.id = a.campaign_id
  WHERE a.status = 'awarded'
    AND a.ambassador_id IN (
      SELECT id FROM public.campus_ambassador_profiles WHERE user_id = auth.uid()
    )
  ORDER BY a.achieved_at DESC;
$$;

-- My Rank History from finalised snapshots
CREATE OR REPLACE FUNCTION public.ambassador_my_rank_history(_type TEXT DEFAULT NULL)
RETURNS TABLE (
  leaderboard_type TEXT,
  period_key TEXT,
  program_id TEXT,
  program_name TEXT,
  campaign_id UUID,
  campaign_name TEXT,
  college_key TEXT,
  final_rank INTEGER,
  primary_metric TEXT,
  metric_value NUMERIC,
  finalised_at TIMESTAMPTZ,
  recognition_title TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT id FROM public.campus_ambassador_profiles WHERE user_id = auth.uid()
  ),
  gen AS (
    SELECT s.leaderboard_type, s.period_key, s.program_id,
           bp.program_title AS program_name,
           NULL::uuid AS campaign_id, NULL::text AS campaign_name,
           s.college_key,
           s.rank_position AS final_rank,
           s.primary_metric, s.metric_value, s.finalised_at
    FROM public.ambassador_leaderboard_snapshots s
    LEFT JOIN public.brand_programs bp ON bp.program_id = s.program_id
    WHERE s.ambassador_id = (SELECT id FROM me)
  ),
  camp AS (
    SELECT 'campaign'::text AS leaderboard_type,
           'campaign:' || cs.campaign_id::text AS period_key,
           NULL::text AS program_id, NULL::text AS program_name,
           cs.campaign_id, c.name AS campaign_name,
           NULL::text AS college_key,
           cs.rank_position AS final_rank,
           COALESCE(c.ranking_metric,'verified_enrollments') AS primary_metric,
           cs.metric_value, cs.finalised_at
    FROM public.ambassador_campaign_leaderboard_snapshots cs
    JOIN public.ambassador_bonus_campaigns c ON c.id = cs.campaign_id
    WHERE cs.ambassador_id = (SELECT id FROM me)
      AND cs.finalised_at IS NOT NULL
  ),
  all_rows AS ( SELECT * FROM gen UNION ALL SELECT * FROM camp )
  SELECT ar.leaderboard_type, ar.period_key, ar.program_id, ar.program_name,
         ar.campaign_id, ar.campaign_name, ar.college_key,
         ar.final_rank, ar.primary_metric, ar.metric_value, ar.finalised_at,
         (
           SELECT a.recognition_title
           FROM public.ambassador_recognition_achievements a
           WHERE a.ambassador_id = (SELECT id FROM me)
             AND a.ranking_period_key = ar.period_key
             AND a.status = 'awarded'
           ORDER BY a.final_rank ASC LIMIT 1
         ) AS recognition_title
  FROM all_rows ar
  WHERE (_type IS NULL OR _type = 'all' OR ar.leaderboard_type = _type)
  ORDER BY ar.finalised_at DESC;
$$;

-- Previous Monthly Leaders (Rank #1 winners of last N finalised months)
CREATE OR REPLACE FUNCTION public.ambassador_previous_monthly_leaders(_limit INTEGER DEFAULT 6)
RETURNS TABLE (
  period_key TEXT,
  ambassador_id UUID,
  display_identity TEXT,
  photo_url TEXT,
  college_display TEXT,
  level_name TEXT,
  level_icon TEXT,
  primary_metric TEXT,
  metric_value NUMERIC,
  finalised_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.period_key,
    s.ambassador_id,
    COALESCE(
      NULLIF(p.leaderboard_display_name,''),
      CASE WHEN p.leaderboard_show_first_name THEN
        COALESCE(NULLIF(p.display_name,''), p.first_name, split_part(p.full_name,' ',1))
      ELSE 'Campus Ambassador' END
    ) AS display_identity,
    CASE WHEN p.leaderboard_show_photo THEN p.profile_photo_url ELSE NULL END,
    CASE WHEN p.leaderboard_show_college THEN p.college_name ELSE NULL END,
    l.name, l.icon,
    s.primary_metric, s.metric_value, s.finalised_at
  FROM public.ambassador_leaderboard_snapshots s
  JOIN public.campus_ambassador_profiles p ON p.id = s.ambassador_id
  LEFT JOIN public.ambassador_levels l ON l.id = p.current_level_id
  WHERE s.leaderboard_type = 'monthly'
    AND s.program_id IS NULL AND s.college_key IS NULL
    AND s.rank_position = 1
  ORDER BY s.period_key DESC
  LIMIT GREATEST(1, LEAST(_limit, 12));
$$;

GRANT EXECUTE ON FUNCTION public.ambassador_my_recognitions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ambassador_my_rank_history(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ambassador_previous_monthly_leaders(INTEGER) TO authenticated;

-- =========================================
-- 8. SEED DEFAULT PUBLISHED RECOGNITION RULES
-- =========================================
INSERT INTO public.ambassador_recognition_rules
  (rule_code, recognition_name, recognition_type, leaderboard_type,
   eligible_positions, ranking_period_type, recognition_title, recognition_description, is_published)
VALUES
  ('REC-MTL-TOP','Monthly Top Ambassador','monthly_top','monthly',
    ARRAY[1],'monthly','Monthly Top Ambassador',
    'Recognised as the top-ranked Campus Ambassador for the month.', true),
  ('REC-MTL-TOP3','Monthly Top 3','monthly_top3','monthly',
    ARRAY[1,2,3],'monthly','Top 3 Campus Ambassador',
    'Recognised in the Top 3 Campus Ambassadors of the month.', true),
  ('REC-CLG-TOP','College Top Ambassador','college_top','college',
    ARRAY[1],'monthly','College Top Ambassador',
    'Top-ranked Campus Ambassador of the verified college.', true),
  ('REC-PRG-TOP','Program Top Ambassador','program_top','program',
    ARRAY[1],'monthly','Program Top Ambassador',
    'Top-ranked Campus Ambassador for the program.', true),
  ('REC-CMP-TOP','Campaign Top Performer','campaign_top','campaign',
    ARRAY[1],'campaign','Campaign Top Performer',
    'Recognised as the top performer of the campaign.', true)
ON CONFLICT (rule_code) DO NOTHING;

-- update trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_amb_rec_rules_upd ON public.ambassador_recognition_rules;
CREATE TRIGGER trg_amb_rec_rules_upd BEFORE UPDATE ON public.ambassador_recognition_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
