
-- =========================================================
-- 1. Enums
-- =========================================================
DO $$ BEGIN
  CREATE TYPE public.amb_leaderboard_type AS ENUM
    ('overall','monthly','college','program','campaign');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.amb_ranking_metric AS ENUM
    ('verified_enrollments','valid_referral_leads','conversion_rate',
     'weighted_performance_score','campaign_milestone_progress',
     'program_verified_enrollments');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.amb_tie_breaker_type AS ENUM
    ('higher_verified_enrollments','higher_conversion_rate',
     'higher_valid_referral_leads','higher_campaign_milestones',
     'earlier_achievement_timestamp');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.amb_ranking_period_type AS ENUM
    ('lifetime','monthly','campaign_window','program_lifetime');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.amb_final_tie_policy AS ENUM
    ('shared_rank','stable_deterministic');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.amb_weighted_component AS ENUM
    ('valid_referral_leads','verified_enrollments','conversion_rate',
     'campaign_milestones','marketing_resource_usage');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================================
-- 2. Ranking rules (versioned)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.ambassador_ranking_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_code TEXT UNIQUE,
  rule_name TEXT NOT NULL,
  leaderboard_type public.amb_leaderboard_type NOT NULL,
  ranking_metric public.amb_ranking_metric NOT NULL,
  ranking_period_type public.amb_ranking_period_type NOT NULL DEFAULT 'lifetime',
  minimum_activity_metric public.amb_ranking_metric,
  minimum_activity_threshold INT NOT NULL DEFAULT 0,
  tie_breaker_1 public.amb_tie_breaker_type,
  tie_breaker_2 public.amb_tie_breaker_type,
  tie_breaker_3 public.amb_tie_breaker_type,
  final_tie_policy public.amb_final_tie_policy NOT NULL DEFAULT 'shared_rank',
  is_published BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft', -- draft | active | archived | invalid
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_until TIMESTAMPTZ,
  rule_version INT NOT NULL DEFAULT 1,
  parent_rule_id UUID REFERENCES public.ambassador_ranking_rules(id) ON DELETE SET NULL,
  ambassador_explanation TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_amb_ranking_rules_type
  ON public.ambassador_ranking_rules (leaderboard_type, is_published, effective_from DESC);

GRANT SELECT ON public.ambassador_ranking_rules TO authenticated;
GRANT SELECT ON public.ambassador_ranking_rules TO anon;
GRANT ALL ON public.ambassador_ranking_rules TO service_role;
ALTER TABLE public.ambassador_ranking_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read published ranking rules"
  ON public.ambassador_ranking_rules;
CREATE POLICY "Anyone can read published ranking rules"
  ON public.ambassador_ranking_rules FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Admins manage ranking rules"
  ON public.ambassador_ranking_rules;
CREATE POLICY "Admins manage ranking rules"
  ON public.ambassador_ranking_rules FOR ALL
  USING (public.has_admin_permission(auth.uid(),'campus_ambassador.review'))
  WITH CHECK (public.has_admin_permission(auth.uid(),'campus_ambassador.review'));

-- Rule code + updated_at
CREATE SEQUENCE IF NOT EXISTS public.amb_ranking_rule_code_seq START 1;

CREATE OR REPLACE FUNCTION public.tg_amb_ranking_rule_defaults()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND (NEW.rule_code IS NULL OR NEW.rule_code = '') THEN
    NEW.rule_code := 'GL-CA-RR-' || to_char(now(),'YYYY') || '-' ||
      lpad(nextval('public.amb_ranking_rule_code_seq')::text, 5, '0');
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tg_amb_ranking_rule_defaults_ins
  ON public.ambassador_ranking_rules;
CREATE TRIGGER tg_amb_ranking_rule_defaults_ins
  BEFORE INSERT OR UPDATE ON public.ambassador_ranking_rules
  FOR EACH ROW EXECUTE FUNCTION public.tg_amb_ranking_rule_defaults();

-- =========================================================
-- 3. Weighted components
-- =========================================================
CREATE TABLE IF NOT EXISTS public.ambassador_ranking_rule_components (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID NOT NULL REFERENCES public.ambassador_ranking_rules(id) ON DELETE CASCADE,
  component public.amb_weighted_component NOT NULL,
  weight_percentage NUMERIC(5,2) NOT NULL CHECK (weight_percentage >= 0 AND weight_percentage <= 100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (rule_id, component)
);
GRANT SELECT ON public.ambassador_ranking_rule_components TO authenticated;
GRANT SELECT ON public.ambassador_ranking_rule_components TO anon;
GRANT ALL ON public.ambassador_ranking_rule_components TO service_role;
ALTER TABLE public.ambassador_ranking_rule_components ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read components of published rules"
  ON public.ambassador_ranking_rule_components;
CREATE POLICY "Read components of published rules"
  ON public.ambassador_ranking_rule_components FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.ambassador_ranking_rules r
    WHERE r.id = rule_id AND r.is_published = true));

DROP POLICY IF EXISTS "Admins manage rule components"
  ON public.ambassador_ranking_rule_components;
CREATE POLICY "Admins manage rule components"
  ON public.ambassador_ranking_rule_components FOR ALL
  USING (public.has_admin_permission(auth.uid(),'campus_ambassador.review'))
  WITH CHECK (public.has_admin_permission(auth.uid(),'campus_ambassador.review'));

-- =========================================================
-- 4. Performance scores (authoritative backend calc)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.ambassador_performance_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ambassador_id UUID NOT NULL REFERENCES public.campus_ambassador_profiles(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES public.ambassador_ranking_rules(id) ON DELETE CASCADE,
  rule_version INT NOT NULL,
  period_key TEXT, -- e.g. "2026-07" for monthly
  program_id UUID,
  campaign_id UUID REFERENCES public.ambassador_bonus_campaigns(id) ON DELETE CASCADE,
  referral_lead_component NUMERIC(12,4) NOT NULL DEFAULT 0,
  verified_enrollment_component NUMERIC(12,4) NOT NULL DEFAULT 0,
  conversion_component NUMERIC(12,4) NOT NULL DEFAULT 0,
  campaign_component NUMERIC(12,4) NOT NULL DEFAULT 0,
  marketing_component NUMERIC(12,4) NOT NULL DEFAULT 0,
  final_score NUMERIC(12,4) NOT NULL DEFAULT 0,
  is_eligible BOOLEAN NOT NULL DEFAULT true,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_amb_perf_score_ctx
  ON public.ambassador_performance_scores
  (ambassador_id, rule_id, COALESCE(period_key,''), COALESCE(program_id,'00000000-0000-0000-0000-000000000000'),
   COALESCE(campaign_id,'00000000-0000-0000-0000-000000000000'));
CREATE INDEX IF NOT EXISTS idx_amb_perf_score_rule
  ON public.ambassador_performance_scores (rule_id, final_score DESC);

GRANT SELECT ON public.ambassador_performance_scores TO authenticated;
GRANT ALL ON public.ambassador_performance_scores TO service_role;
ALTER TABLE public.ambassador_performance_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ambassador reads own performance score"
  ON public.ambassador_performance_scores;
CREATE POLICY "Ambassador reads own performance score"
  ON public.ambassador_performance_scores FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.campus_ambassador_profiles p
    WHERE p.id = ambassador_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins read performance scores"
  ON public.ambassador_performance_scores;
CREATE POLICY "Admins read performance scores"
  ON public.ambassador_performance_scores FOR SELECT
  USING (public.has_admin_permission(auth.uid(),'campus_ambassador.review'));

DROP POLICY IF EXISTS "Admins write performance scores"
  ON public.ambassador_performance_scores;
CREATE POLICY "Admins write performance scores"
  ON public.ambassador_performance_scores FOR ALL
  USING (public.has_admin_permission(auth.uid(),'campus_ambassador.review'))
  WITH CHECK (public.has_admin_permission(auth.uid(),'campus_ambassador.review'));

-- =========================================================
-- 5. Rank movements
-- =========================================================
CREATE TABLE IF NOT EXISTS public.ambassador_rank_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ambassador_id UUID NOT NULL REFERENCES public.campus_ambassador_profiles(id) ON DELETE CASCADE,
  leaderboard_type public.amb_leaderboard_type NOT NULL,
  period_key TEXT,
  program_id UUID,
  campaign_id UUID REFERENCES public.ambassador_bonus_campaigns(id) ON DELETE CASCADE,
  previous_rank INT,
  current_rank INT NOT NULL,
  rank_difference INT,
  is_new BOOLEAN NOT NULL DEFAULT false,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_amb_rank_movement_ctx
  ON public.ambassador_rank_movements
  (ambassador_id, leaderboard_type, COALESCE(period_key,''),
   COALESCE(program_id,'00000000-0000-0000-0000-000000000000'),
   COALESCE(campaign_id,'00000000-0000-0000-0000-000000000000'));

GRANT SELECT ON public.ambassador_rank_movements TO authenticated;
GRANT ALL ON public.ambassador_rank_movements TO service_role;
ALTER TABLE public.ambassador_rank_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ambassador reads own rank movement"
  ON public.ambassador_rank_movements;
CREATE POLICY "Ambassador reads own rank movement"
  ON public.ambassador_rank_movements FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.campus_ambassador_profiles p
    WHERE p.id = ambassador_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins write rank movements"
  ON public.ambassador_rank_movements;
CREATE POLICY "Admins write rank movements"
  ON public.ambassador_rank_movements FOR ALL
  USING (public.has_admin_permission(auth.uid(),'campus_ambassador.review'))
  WITH CHECK (public.has_admin_permission(auth.uid(),'campus_ambassador.review'));

-- =========================================================
-- 6. Leaderboard corrections (reference foundation only)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.ambassador_leaderboard_corrections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  correction_code TEXT UNIQUE,
  leaderboard_type public.amb_leaderboard_type NOT NULL,
  period_key TEXT,
  program_id UUID,
  campaign_id UUID REFERENCES public.ambassador_bonus_campaigns(id) ON DELETE CASCADE,
  affected_ambassador_id UUID REFERENCES public.campus_ambassador_profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  reason_type TEXT NOT NULL, -- enrollment_reversed | duplicate_removed | referral_attribution_corrected | ranking_calculation_error
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_at TIMESTAMPTZ
);
GRANT SELECT ON public.ambassador_leaderboard_corrections TO authenticated;
GRANT ALL ON public.ambassador_leaderboard_corrections TO service_role;
ALTER TABLE public.ambassador_leaderboard_corrections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage leaderboard corrections"
  ON public.ambassador_leaderboard_corrections;
CREATE POLICY "Admins manage leaderboard corrections"
  ON public.ambassador_leaderboard_corrections FOR ALL
  USING (public.has_admin_permission(auth.uid(),'campus_ambassador.review'))
  WITH CHECK (public.has_admin_permission(auth.uid(),'campus_ambassador.review'));

-- =========================================================
-- 7. Helper functions
-- =========================================================

-- Validate that weighted rule components sum to 100 (only relevant for weighted_performance_score)
CREATE OR REPLACE FUNCTION public.ambassador_ranking_rule_is_valid(_rule_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  r public.ambassador_ranking_rules%ROWTYPE;
  total NUMERIC(6,2);
BEGIN
  SELECT * INTO r FROM public.ambassador_ranking_rules WHERE id = _rule_id;
  IF NOT FOUND THEN RETURN false; END IF;
  IF r.ranking_metric <> 'weighted_performance_score' THEN
    RETURN true;
  END IF;
  SELECT COALESCE(SUM(weight_percentage),0) INTO total
    FROM public.ambassador_ranking_rule_components
    WHERE rule_id = _rule_id AND is_active = true;
  RETURN ROUND(total,2) = 100.00;
END $$;

-- Resolve the currently active rule for a leaderboard type
CREATE OR REPLACE FUNCTION public.ambassador_active_ranking_rule(_type public.amb_leaderboard_type)
RETURNS TABLE(
  rule_id UUID, rule_code TEXT, rule_name TEXT,
  ranking_metric public.amb_ranking_metric,
  minimum_activity_metric public.amb_ranking_metric,
  minimum_activity_threshold INT,
  tie_breaker_1 public.amb_tie_breaker_type,
  tie_breaker_2 public.amb_tie_breaker_type,
  tie_breaker_3 public.amb_tie_breaker_type,
  final_tie_policy public.amb_final_tie_policy,
  rule_version INT,
  is_valid BOOLEAN,
  ambassador_explanation TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.id, r.rule_code, r.rule_name, r.ranking_metric,
    r.minimum_activity_metric, r.minimum_activity_threshold,
    r.tie_breaker_1, r.tie_breaker_2, r.tie_breaker_3,
    r.final_tie_policy, r.rule_version,
    public.ambassador_ranking_rule_is_valid(r.id) AS is_valid,
    r.ambassador_explanation
  FROM public.ambassador_ranking_rules r
  WHERE r.leaderboard_type = _type
    AND r.is_published = true
    AND r.status = 'active'
    AND r.effective_from <= now()
    AND (r.effective_until IS NULL OR r.effective_until > now())
  ORDER BY r.rule_version DESC, r.effective_from DESC
  LIMIT 1;
$$;

-- Ambassador-friendly explanation of the active rule
CREATE OR REPLACE FUNCTION public.ambassador_ranking_explanation(_type public.amb_leaderboard_type)
RETURNS TABLE(
  rule_name TEXT,
  primary_metric_label TEXT,
  minimum_activity_label TEXT,
  tie_breakers TEXT[],
  weighted_components JSONB,
  is_valid BOOLEAN,
  ambassador_explanation TEXT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r RECORD;
  metric_map JSONB := jsonb_build_object(
    'verified_enrollments','Verified Enrollments',
    'valid_referral_leads','Valid Referral Leads',
    'conversion_rate','Conversion Rate',
    'weighted_performance_score','Weighted Performance Score',
    'campaign_milestone_progress','Campaign Milestone Progress',
    'program_verified_enrollments','Program Verified Enrollments'
  );
  tb_map JSONB := jsonb_build_object(
    'higher_verified_enrollments','Higher Verified Enrollments',
    'higher_conversion_rate','Higher Conversion Rate',
    'higher_valid_referral_leads','Higher Valid Referral Leads',
    'higher_campaign_milestones','Higher Campaign Milestones',
    'earlier_achievement_timestamp','Earlier Achievement Timestamp'
  );
  comp_map JSONB := jsonb_build_object(
    'valid_referral_leads','Valid Referral Leads',
    'verified_enrollments','Verified Enrollments',
    'conversion_rate','Conversion Rate',
    'campaign_milestones','Campaign Milestones',
    'marketing_resource_usage','Marketing Resource Usage'
  );
  tbs TEXT[];
  comps JSONB;
BEGIN
  SELECT * INTO r FROM public.ambassador_active_ranking_rule(_type);
  IF NOT FOUND THEN
    RETURN;
  END IF;

  tbs := ARRAY[]::TEXT[];
  IF r.tie_breaker_1 IS NOT NULL THEN tbs := tbs || (tb_map->>(r.tie_breaker_1::text)); END IF;
  IF r.tie_breaker_2 IS NOT NULL THEN tbs := tbs || (tb_map->>(r.tie_breaker_2::text)); END IF;
  IF r.tie_breaker_3 IS NOT NULL THEN tbs := tbs || (tb_map->>(r.tie_breaker_3::text)); END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'component', comp_map->>(c.component::text),
    'weight', c.weight_percentage
  ) ORDER BY c.weight_percentage DESC), '[]'::jsonb) INTO comps
  FROM public.ambassador_ranking_rule_components c
  WHERE c.rule_id = r.rule_id AND c.is_active = true;

  RETURN QUERY SELECT
    r.rule_name,
    metric_map->>(r.ranking_metric::text),
    CASE
      WHEN r.minimum_activity_metric IS NOT NULL AND r.minimum_activity_threshold > 0
      THEN 'Minimum ' || r.minimum_activity_threshold || ' ' || (metric_map->>(r.minimum_activity_metric::text))
      ELSE NULL
    END,
    tbs, comps, r.is_valid, r.ambassador_explanation;
END $$;

-- Current Ambassador's rank movement for a given leaderboard context
CREATE OR REPLACE FUNCTION public.ambassador_my_rank_movement(
  _type public.amb_leaderboard_type,
  _period_key TEXT DEFAULT NULL,
  _program_id UUID DEFAULT NULL,
  _campaign_id UUID DEFAULT NULL
)
RETURNS TABLE(
  previous_rank INT,
  current_rank INT,
  rank_difference INT,
  is_new BOOLEAN,
  calculated_at TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.previous_rank, m.current_rank, m.rank_difference, m.is_new, m.calculated_at
  FROM public.ambassador_rank_movements m
  JOIN public.campus_ambassador_profiles p ON p.id = m.ambassador_id
  WHERE p.user_id = auth.uid()
    AND m.leaderboard_type = _type
    AND COALESCE(m.period_key,'') = COALESCE(_period_key,'')
    AND COALESCE(m.program_id,'00000000-0000-0000-0000-000000000000'::uuid)
        = COALESCE(_program_id,'00000000-0000-0000-0000-000000000000'::uuid)
    AND COALESCE(m.campaign_id,'00000000-0000-0000-0000-000000000000'::uuid)
        = COALESCE(_campaign_id,'00000000-0000-0000-0000-000000000000'::uuid)
  ORDER BY m.calculated_at DESC
  LIMIT 1;
$$;

-- =========================================================
-- 8. Seed default published rules (one per leaderboard type)
-- =========================================================
INSERT INTO public.ambassador_ranking_rules
  (rule_name, leaderboard_type, ranking_metric, ranking_period_type,
   minimum_activity_metric, minimum_activity_threshold,
   tie_breaker_1, tie_breaker_2, tie_breaker_3,
   final_tie_policy, is_published, status, rule_version, ambassador_explanation)
SELECT * FROM (VALUES
  ('Overall — Verified Enrollments (v1)'::text, 'overall'::public.amb_leaderboard_type,
   'verified_enrollments'::public.amb_ranking_metric, 'lifetime'::public.amb_ranking_period_type,
   NULL::public.amb_ranking_metric, 0::int,
   'higher_conversion_rate'::public.amb_tie_breaker_type,
   'higher_valid_referral_leads'::public.amb_tie_breaker_type,
   'earlier_achievement_timestamp'::public.amb_tie_breaker_type,
   'shared_rank'::public.amb_final_tie_policy, true::boolean, 'active'::text, 1::int,
   'This Leaderboard ranks eligible Campus Ambassadors primarily by Verified Enrollments. Conversion Rate and Valid Referral Leads are used as tie-breakers.'::text),
  ('Monthly — Verified Enrollments (v1)', 'monthly', 'verified_enrollments','monthly',
   NULL, 0,
   'higher_conversion_rate','higher_valid_referral_leads','earlier_achievement_timestamp',
   'shared_rank', true, 'active', 1,
   'This Leaderboard ranks eligible Campus Ambassadors this month primarily by Verified Enrollments. Conversion Rate and Valid Referral Leads are used as tie-breakers.'),
  ('College — Verified Enrollments (v1)', 'college','verified_enrollments','lifetime',
   NULL, 0,
   'higher_conversion_rate','higher_valid_referral_leads','earlier_achievement_timestamp',
   'shared_rank', true, 'active', 1,
   'This Leaderboard ranks eligible Campus Ambassadors from your college primarily by Verified Enrollments. Conversion Rate and Valid Referral Leads are used as tie-breakers.'),
  ('Program — Program Verified Enrollments (v1)', 'program','program_verified_enrollments','program_lifetime',
   NULL, 0,
   'higher_conversion_rate','higher_valid_referral_leads','earlier_achievement_timestamp',
   'shared_rank', true, 'active', 1,
   'This Leaderboard ranks eligible Campus Ambassadors for the selected program primarily by Verified Enrollments in that program. Conversion Rate and Valid Referral Leads are used as tie-breakers.'),
  ('Campaign — Campaign Metric (v1)', 'campaign','campaign_milestone_progress','campaign_window',
   NULL, 0,
   'higher_verified_enrollments','higher_valid_referral_leads','earlier_achievement_timestamp',
   'shared_rank', true, 'active', 1,
   'This Leaderboard ranks eligible Campus Ambassadors for the selected campaign primarily by the campaign''s configured metric. Higher Verified Enrollments and Higher Valid Referral Leads are used as tie-breakers.')
) AS v(rule_name, leaderboard_type, ranking_metric, ranking_period_type,
   minimum_activity_metric, minimum_activity_threshold,
   tie_breaker_1, tie_breaker_2, tie_breaker_3,
   final_tie_policy, is_published, status, rule_version, ambassador_explanation)
WHERE NOT EXISTS (
  SELECT 1 FROM public.ambassador_ranking_rules r
  WHERE r.leaderboard_type = v.leaderboard_type
    AND r.rule_version = v.rule_version
);
