
-- Ambassador status enum for profile status checks (add missing values)
DO $$ BEGIN
  CREATE TYPE public.ambassador_profile_status AS ENUM ('active','suspended','inactive','terminated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Ensure campus_ambassador_profiles.status uses the new enum without breaking existing rows.
-- If it's already USER-DEFINED, we assume it already carries approved profiles as 'active'; skip alteration.
-- (No structural change: rely on existing values.)

-- 1. Ambassador Commission Rules -------------------------------------------
CREATE TABLE IF NOT EXISTS public.ambassador_commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_code TEXT UNIQUE,
  name TEXT NOT NULL,
  program_id TEXT, -- nullable = applies to all programs unless overridden
  pricing_plan TEXT,
  campaign_id TEXT,
  commission_percentage NUMERIC(5,2) NOT NULL CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  base_definition TEXT NOT NULL DEFAULT 'verified_program_selling_price',
  version INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ambassador_commission_rules TO authenticated;
GRANT ALL ON public.ambassador_commission_rules TO service_role;
ALTER TABLE public.ambassador_commission_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_read_rules" ON public.ambassador_commission_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_manage_rules" ON public.ambassador_commission_rules FOR ALL TO authenticated
  USING (public.has_admin_permission(auth.uid(),'campus_ambassador.review'))
  WITH CHECK (public.has_admin_permission(auth.uid(),'campus_ambassador.review'));
CREATE TRIGGER trg_amb_rules_updated BEFORE UPDATE ON public.ambassador_commission_rules
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Seed a default "Up to 40%" rule if none exists
INSERT INTO public.ambassador_commission_rules (rule_code, name, commission_percentage, base_definition, is_active)
SELECT 'GLCA-RULE-DEFAULT-1', 'Default Campus Ambassador Rate', 40.00, 'verified_program_selling_price', true
WHERE NOT EXISTS (SELECT 1 FROM public.ambassador_commission_rules);

-- 2. Enrollments: add ambassador attribution columns ------------------------
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS ambassador_id UUID REFERENCES public.campus_ambassador_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ambassador_referral_code TEXT,
  ADD COLUMN IF NOT EXISTS ambassador_session_id UUID;
CREATE INDEX IF NOT EXISTS idx_enrollments_ambassador_id ON public.enrollments(ambassador_id);

-- Owner-scope read policy for ambassadors on their enrollments
DROP POLICY IF EXISTS "ambassador_read_own_enrollments" ON public.enrollments;
CREATE POLICY "ambassador_read_own_enrollments" ON public.enrollments
  FOR SELECT TO authenticated
  USING (
    ambassador_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.campus_ambassador_profiles p
      WHERE p.id = public.enrollments.ambassador_id AND p.user_id = auth.uid()
    )
  );

-- 3. Ambassador Referral Sessions ------------------------------------------
CREATE TABLE IF NOT EXISTS public.ambassador_referral_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID NOT NULL REFERENCES public.campus_ambassador_profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  visitor_hash TEXT,
  landing_page TEXT,
  program_id TEXT,
  campaign_id TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_amb_sess_amb ON public.ambassador_referral_sessions(ambassador_id, created_at DESC);
GRANT SELECT ON public.ambassador_referral_sessions TO authenticated;
GRANT ALL ON public.ambassador_referral_sessions TO service_role;
ALTER TABLE public.ambassador_referral_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ambassador_read_own_sessions" ON public.ambassador_referral_sessions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.campus_ambassador_profiles p
    WHERE p.id = ambassador_referral_sessions.ambassador_id AND p.user_id = auth.uid()
  ));
CREATE POLICY "admin_read_sessions" ON public.ambassador_referral_sessions
  FOR SELECT TO authenticated
  USING (public.has_admin_permission(auth.uid(),'campus_ambassador.review'));

-- 4. Ambassador Referral Visits (click log) --------------------------------
CREATE TABLE IF NOT EXISTS public.ambassador_referral_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID NOT NULL REFERENCES public.campus_ambassador_profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  session_id UUID REFERENCES public.ambassador_referral_sessions(id) ON DELETE SET NULL,
  landing_page TEXT,
  program_id TEXT,
  campaign_id TEXT,
  visitor_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_amb_visits_amb ON public.ambassador_referral_visits(ambassador_id, created_at DESC);
GRANT SELECT ON public.ambassador_referral_visits TO authenticated;
GRANT ALL ON public.ambassador_referral_visits TO service_role;
ALTER TABLE public.ambassador_referral_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ambassador_read_own_visits" ON public.ambassador_referral_visits
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.campus_ambassador_profiles p
    WHERE p.id = ambassador_referral_visits.ambassador_id AND p.user_id = auth.uid()
  ));

-- 5. Ambassador Referral Leads --------------------------------------------
CREATE TABLE IF NOT EXISTS public.ambassador_referral_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID NOT NULL REFERENCES public.campus_ambassador_profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  session_id UUID REFERENCES public.ambassador_referral_sessions(id) ON DELETE SET NULL,
  lead_code TEXT UNIQUE,
  display_name TEXT,
  program_id TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_amb_leads_amb ON public.ambassador_referral_leads(ambassador_id, created_at DESC);
GRANT SELECT ON public.ambassador_referral_leads TO authenticated;
GRANT ALL ON public.ambassador_referral_leads TO service_role;
ALTER TABLE public.ambassador_referral_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ambassador_read_own_leads" ON public.ambassador_referral_leads
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.campus_ambassador_profiles p
    WHERE p.id = ambassador_referral_leads.ambassador_id AND p.user_id = auth.uid()
  ));
CREATE TRIGGER trg_amb_leads_updated BEFORE UPDATE ON public.ambassador_referral_leads
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 6. Ambassador Commissions -----------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.ambassador_commission_status AS ENUM (
    'pending_verification','eligible','approved','available','payout_processing','paid','on_hold','reversed','ineligible'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.ambassador_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_code TEXT UNIQUE,
  ambassador_id UUID NOT NULL REFERENCES public.campus_ambassador_profiles(id) ON DELETE RESTRICT,
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
  student_user_id UUID,
  program_id TEXT,
  pricing_plan TEXT,
  campaign_id TEXT,
  eligible_base_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (eligible_base_amount >= 0),
  commission_rule_id UUID REFERENCES public.ambassador_commission_rules(id),
  commission_rule_version INT,
  commission_percentage NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  calculated_commission NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (calculated_commission >= 0),
  status public.ambassador_commission_status NOT NULL DEFAULT 'pending_verification',
  reversal_reason TEXT,
  public_reason TEXT,
  reversal_reference TEXT,
  approved_at TIMESTAMPTZ,
  available_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  reversed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_amb_comm_amb_status ON public.ambassador_commissions(ambassador_id, status);
CREATE INDEX IF NOT EXISTS idx_amb_comm_amb_created ON public.ambassador_commissions(ambassador_id, created_at DESC);
GRANT SELECT ON public.ambassador_commissions TO authenticated;
GRANT ALL ON public.ambassador_commissions TO service_role;
ALTER TABLE public.ambassador_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ambassador_read_own_commissions" ON public.ambassador_commissions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.campus_ambassador_profiles p
    WHERE p.id = ambassador_commissions.ambassador_id AND p.user_id = auth.uid()
  ));
CREATE POLICY "admin_manage_commissions" ON public.ambassador_commissions
  FOR ALL TO authenticated
  USING (public.has_admin_permission(auth.uid(),'campus_ambassador.review'))
  WITH CHECK (public.has_admin_permission(auth.uid(),'campus_ambassador.review'));
CREATE TRIGGER trg_amb_commissions_updated BEFORE UPDATE ON public.ambassador_commissions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE SEQUENCE IF NOT EXISTS public.amb_commission_code_seq;
CREATE OR REPLACE FUNCTION public.tg_amb_commission_code()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.transaction_code IS NULL OR NEW.transaction_code = '' THEN
    NEW.transaction_code := 'GL-CAC-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.amb_commission_code_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_amb_commission_code ON public.ambassador_commissions;
CREATE TRIGGER trg_amb_commission_code BEFORE INSERT ON public.ambassador_commissions
  FOR EACH ROW EXECUTE FUNCTION public.tg_amb_commission_code();

-- 7. Platform settings: attribution duration -------------------------------
INSERT INTO public.platform_settings (key, value)
VALUES ('ambassador_referral_attribution_days', '30')
ON CONFLICT (key) DO NOTHING;
