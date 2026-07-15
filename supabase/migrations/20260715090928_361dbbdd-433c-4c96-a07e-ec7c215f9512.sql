
-- 1. Extend ambassador_commission_rules
ALTER TABLE public.ambassador_commission_rules
  ADD COLUMN IF NOT EXISTS commission_type text NOT NULL DEFAULT 'percentage'
    CHECK (commission_type IN ('percentage','fixed','bonus')),
  ADD COLUMN IF NOT EXISTS fixed_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS rule_priority integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS max_commission_pct numeric(5,2),
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'published'
    CHECK (visibility IN ('published','hidden')),
  ADD COLUMN IF NOT EXISTS eligibility_notes text,
  ADD COLUMN IF NOT EXISTS description text;

-- 2. Sequences and code trigger helpers
CREATE SEQUENCE IF NOT EXISTS public.ambassador_bonus_campaign_seq;
CREATE SEQUENCE IF NOT EXISTS public.ambassador_milestone_seq;

-- 3. Bonus Campaigns
CREATE TABLE IF NOT EXISTS public.ambassador_bonus_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_code text UNIQUE,
  name text NOT NULL,
  description text,
  campaign_type text NOT NULL CHECK (campaign_type IN (
    'percentage_bonus','fixed_bonus','milestone_bonus','program_specific','campus_specific','time_limited'
  )),
  program_id text,
  pricing_plan text,
  campus_scope text,
  bonus_percentage numeric(5,2),
  fixed_bonus_amount numeric(12,2),
  max_commission_pct numeric(5,2),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft','scheduled','active','paused','completed','cancelled'
  )),
  visibility text NOT NULL DEFAULT 'published' CHECK (visibility IN ('published','hidden')),
  banner_text text,
  terms text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ambassador_bonus_campaigns TO authenticated;
GRANT ALL ON public.ambassador_bonus_campaigns TO service_role;
ALTER TABLE public.ambassador_bonus_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_published_campaigns" ON public.ambassador_bonus_campaigns
  FOR SELECT TO authenticated
  USING (visibility = 'published' AND status IN ('scheduled','active','completed','paused')
    OR public.has_admin_permission(auth.uid(),'campus_ambassador.review'));

CREATE POLICY "admin_manage_campaigns" ON public.ambassador_bonus_campaigns
  FOR ALL TO authenticated
  USING (public.has_admin_permission(auth.uid(),'campus_ambassador.review'))
  WITH CHECK (public.has_admin_permission(auth.uid(),'campus_ambassador.review'));

CREATE OR REPLACE FUNCTION public.tg_amb_campaign_defaults()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.campaign_code IS NULL OR NEW.campaign_code = '' THEN
    NEW.campaign_code := 'GL-CA-CAMP-' || to_char(now(),'YYYY') || '-' ||
      lpad(nextval('public.ambassador_bonus_campaign_seq')::text, 6, '0');
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_amb_campaign_defaults ON public.ambassador_bonus_campaigns;
CREATE TRIGGER trg_amb_campaign_defaults
  BEFORE INSERT OR UPDATE ON public.ambassador_bonus_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.tg_amb_campaign_defaults();

-- 4. Milestones
CREATE TABLE IF NOT EXISTS public.ambassador_campaign_milestones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES public.ambassador_bonus_campaigns(id) ON DELETE CASCADE,
  milestone_code text UNIQUE,
  name text NOT NULL,
  description text,
  threshold_type text NOT NULL DEFAULT 'verified_enrollments'
    CHECK (threshold_type IN ('verified_enrollments','referral_leads','commission_earned')),
  threshold_value integer NOT NULL CHECK (threshold_value > 0),
  bonus_amount numeric(12,2) NOT NULL DEFAULT 0,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ambassador_campaign_milestones TO authenticated;
GRANT ALL ON public.ambassador_campaign_milestones TO service_role;
ALTER TABLE public.ambassador_campaign_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_milestones" ON public.ambassador_campaign_milestones
  FOR SELECT TO authenticated
  USING (is_active = true OR public.has_admin_permission(auth.uid(),'campus_ambassador.review'));

CREATE POLICY "admin_manage_milestones" ON public.ambassador_campaign_milestones
  FOR ALL TO authenticated
  USING (public.has_admin_permission(auth.uid(),'campus_ambassador.review'))
  WITH CHECK (public.has_admin_permission(auth.uid(),'campus_ambassador.review'));

CREATE OR REPLACE FUNCTION public.tg_amb_milestone_defaults()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.milestone_code IS NULL OR NEW.milestone_code = '' THEN
    NEW.milestone_code := 'GL-CA-MS-' || to_char(now(),'YYYY') || '-' ||
      lpad(nextval('public.ambassador_milestone_seq')::text, 6, '0');
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_amb_milestone_defaults ON public.ambassador_campaign_milestones;
CREATE TRIGGER trg_amb_milestone_defaults
  BEFORE INSERT OR UPDATE ON public.ambassador_campaign_milestones
  FOR EACH ROW EXECUTE FUNCTION public.tg_amb_milestone_defaults();

-- 5. Milestone Achievements
CREATE TABLE IF NOT EXISTS public.ambassador_campaign_milestone_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ambassador_id uuid NOT NULL REFERENCES public.campus_ambassador_profiles(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.ambassador_bonus_campaigns(id) ON DELETE CASCADE,
  milestone_id uuid NOT NULL REFERENCES public.ambassador_campaign_milestones(id) ON DELETE CASCADE,
  achieved_at timestamptz NOT NULL DEFAULT now(),
  eligibility_status text NOT NULL DEFAULT 'eligible'
    CHECK (eligibility_status IN ('eligible','pending_review','ineligible','fulfilled')),
  bonus_commission_id uuid REFERENCES public.ambassador_commissions(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ambassador_id, milestone_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ambassador_campaign_milestone_achievements TO authenticated;
GRANT ALL ON public.ambassador_campaign_milestone_achievements TO service_role;
ALTER TABLE public.ambassador_campaign_milestone_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ambassador_read_own_achievements"
  ON public.ambassador_campaign_milestone_achievements
  FOR SELECT TO authenticated
  USING (
    ambassador_id IN (SELECT id FROM public.campus_ambassador_profiles WHERE user_id = auth.uid())
    OR public.has_admin_permission(auth.uid(),'campus_ambassador.review')
  );

CREATE POLICY "admin_manage_achievements"
  ON public.ambassador_campaign_milestone_achievements
  FOR ALL TO authenticated
  USING (public.has_admin_permission(auth.uid(),'campus_ambassador.review'))
  WITH CHECK (public.has_admin_permission(auth.uid(),'campus_ambassador.review'));
