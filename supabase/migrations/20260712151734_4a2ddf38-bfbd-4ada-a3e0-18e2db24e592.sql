
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('super_admin','admin','partner_manager','partner','wl_owner','student');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users read own roles" ON public.user_roles;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('super_admin','admin','partner_manager'));
$$;

CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DO $$ BEGIN
  CREATE TYPE public.application_status AS ENUM ('draft','submitted','under_review','more_info_required','approved','rejected','suspended');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.lead_model AS ENUM ('own_leads','supported','not_sure'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.working_pref AS ENUM ('part_time','full_time','freelance','launch_brand'); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.partner_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.application_status NOT NULL DEFAULT 'submitted',
  full_name text NOT NULL,
  email text NOT NULL,
  mobile text NOT NULL,
  city text, state text, country text,
  current_role_title text,
  industry text,
  years_experience text,
  current_monthly_target text,
  current_income_range text,
  previous_experience text,
  has_own_leads text,
  lead_sources text[],
  estimated_lead_count text,
  working_preference public.working_pref,
  hours_per_day text,
  preferred_days text[],
  preferred_categories text[],
  preferred_model public.lead_model,
  assigned_manager_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_notes text,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.partner_applications TO authenticated;
GRANT INSERT ON public.partner_applications TO anon;
GRANT ALL ON public.partner_applications TO service_role;
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone can submit application" ON public.partner_applications;
CREATE POLICY "anyone can submit application" ON public.partner_applications FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "applicant reads own" ON public.partner_applications;
CREATE POLICY "applicant reads own" ON public.partner_applications FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "admins manage applications" ON public.partner_applications;
CREATE POLICY "admins manage applications" ON public.partner_applications FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
DROP TRIGGER IF EXISTS trg_pa_updated_at ON public.partner_applications;
CREATE TRIGGER trg_pa_updated_at BEFORE UPDATE ON public.partner_applications FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

DO $$ BEGIN CREATE TYPE public.partner_status AS ENUM ('active','suspended','revoked'); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id uuid REFERENCES public.partner_applications(id) ON DELETE SET NULL,
  display_name text NOT NULL,
  email text NOT NULL,
  mobile text,
  partner_code text UNIQUE,
  status public.partner_status NOT NULL DEFAULT 'active',
  lead_model public.lead_model NOT NULL DEFAULT 'own_leads',
  default_revenue_share numeric(5,2) NOT NULL DEFAULT 70.00,
  manager_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  kyc_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.partners TO authenticated;
GRANT ALL ON public.partners TO service_role;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "partner reads self" ON public.partners;
CREATE POLICY "partner reads self" ON public.partners FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "admins write partners" ON public.partners;
CREATE POLICY "admins write partners" ON public.partners FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
DROP TRIGGER IF EXISTS trg_partners_updated_at ON public.partners;
CREATE TRIGGER trg_partners_updated_at BEFORE UPDATE ON public.partners FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.revenue_share_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  program_id text,
  category_slug text,
  partner_id uuid REFERENCES public.partners(id) ON DELETE CASCADE,
  partner_type public.lead_model,
  lead_source text,
  campaign text,
  share_percentage numeric(5,2) NOT NULL,
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz,
  priority int NOT NULL DEFAULT 100,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.revenue_share_rules TO authenticated;
GRANT ALL ON public.revenue_share_rules TO service_role;
ALTER TABLE public.revenue_share_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins manage rules" ON public.revenue_share_rules;
CREATE POLICY "admins manage rules" ON public.revenue_share_rules FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "authenticated read active rules" ON public.revenue_share_rules;
CREATE POLICY "authenticated read active rules" ON public.revenue_share_rules FOR SELECT TO authenticated USING (active = true);
DROP TRIGGER IF EXISTS trg_rsr_updated_at ON public.revenue_share_rules;
CREATE TRIGGER trg_rsr_updated_at BEFORE UPDATE ON public.revenue_share_rules FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

DO $$ BEGIN CREATE TYPE public.enrollment_status AS ENUM ('received','under_verification','verified','cancelled','refund_full','refund_partial','fraud_review','duplicate'); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  program_id text NOT NULL,
  program_title text NOT NULL,
  student_name text NOT NULL,
  student_email text,
  lead_source text,
  gross_revenue numeric(12,2) NOT NULL,
  eligible_revenue numeric(12,2) NOT NULL,
  status public.enrollment_status NOT NULL DEFAULT 'received',
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.enrollments TO authenticated;
GRANT ALL ON public.enrollments TO service_role;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "partner reads own enrollments" ON public.enrollments;
CREATE POLICY "partner reads own enrollments" ON public.enrollments FOR SELECT TO authenticated USING (public.is_admin(auth.uid()) OR partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "admins write enrollments" ON public.enrollments;
CREATE POLICY "admins write enrollments" ON public.enrollments FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
DROP TRIGGER IF EXISTS trg_enr_updated_at ON public.enrollments;
CREATE TRIGGER trg_enr_updated_at BEFORE UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

DO $$ BEGIN CREATE TYPE public.commission_status AS ENUM ('calculated','under_verification','approved','on_hold','payout_processing','paid','cancelled','refund_adjusted'); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE RESTRICT,
  enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE RESTRICT,
  program_id text NOT NULL,
  gross_revenue numeric(12,2) NOT NULL,
  eligible_revenue numeric(12,2) NOT NULL,
  lead_source text,
  revenue_share_rule_id uuid REFERENCES public.revenue_share_rules(id) ON DELETE SET NULL,
  revenue_share_pct numeric(5,2) NOT NULL,
  commission_amount numeric(12,2) NOT NULL,
  status public.commission_status NOT NULL DEFAULT 'calculated',
  refund_adjustment numeric(12,2) NOT NULL DEFAULT 0,
  admin_notes text,
  verified_at timestamptz,
  approved_at timestamptz,
  payout_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.commissions TO authenticated;
GRANT ALL ON public.commissions TO service_role;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "partner reads own commissions" ON public.commissions;
CREATE POLICY "partner reads own commissions" ON public.commissions FOR SELECT TO authenticated USING (public.is_admin(auth.uid()) OR partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "admins write commissions" ON public.commissions;
CREATE POLICY "admins write commissions" ON public.commissions FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
DROP TRIGGER IF EXISTS trg_comm_updated_at ON public.commissions;
CREATE TRIGGER trg_comm_updated_at BEFORE UPDATE ON public.commissions FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

DO $$ BEGIN CREATE TYPE public.payout_status AS ENUM ('queued','processing','paid','failed','on_hold','cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE RESTRICT,
  amount numeric(12,2) NOT NULL,
  status public.payout_status NOT NULL DEFAULT 'queued',
  reference text,
  scheduled_for timestamptz,
  processed_at timestamptz,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payouts TO authenticated;
GRANT ALL ON public.payouts TO service_role;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "partner reads own payouts" ON public.payouts;
CREATE POLICY "partner reads own payouts" ON public.payouts FOR SELECT TO authenticated USING (public.is_admin(auth.uid()) OR partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "admins write payouts" ON public.payouts;
CREATE POLICY "admins write payouts" ON public.payouts FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
DROP TRIGGER IF EXISTS trg_payouts_updated_at ON public.payouts;
CREATE TRIGGER trg_payouts_updated_at BEFORE UPDATE ON public.payouts FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.payout_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id uuid NOT NULL REFERENCES public.payouts(id) ON DELETE CASCADE,
  commission_id uuid NOT NULL REFERENCES public.commissions(id) ON DELETE RESTRICT,
  amount numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payout_items TO authenticated;
GRANT ALL ON public.payout_items TO service_role;
ALTER TABLE public.payout_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read payout items via payout" ON public.payout_items;
CREATE POLICY "read payout items via payout" ON public.payout_items FOR SELECT TO authenticated USING (public.is_admin(auth.uid()) OR payout_id IN (SELECT p.id FROM public.payouts p JOIN public.partners pa ON pa.id = p.partner_id WHERE pa.user_id = auth.uid()));
DROP POLICY IF EXISTS "admins write payout items" ON public.payout_items;
CREATE POLICY "admins write payout items" ON public.payout_items FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.refund_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id uuid NOT NULL REFERENCES public.commissions(id) ON DELETE RESTRICT,
  enrollment_id uuid REFERENCES public.enrollments(id) ON DELETE SET NULL,
  reason text NOT NULL,
  adjustment_amount numeric(12,2) NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.refund_adjustments TO authenticated;
GRANT ALL ON public.refund_adjustments TO service_role;
ALTER TABLE public.refund_adjustments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read refund adj via commission" ON public.refund_adjustments;
CREATE POLICY "read refund adj via commission" ON public.refund_adjustments FOR SELECT TO authenticated USING (public.is_admin(auth.uid()) OR commission_id IN (SELECT c.id FROM public.commissions c JOIN public.partners p ON p.id = c.partner_id WHERE p.user_id = auth.uid()));
DROP POLICY IF EXISTS "admins write refund adj" ON public.refund_adjustments;
CREATE POLICY "admins write refund adj" ON public.refund_adjustments FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.revenue_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  before jsonb,
  after jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.revenue_audit_logs TO authenticated;
GRANT ALL ON public.revenue_audit_logs TO service_role;
ALTER TABLE public.revenue_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins read audit" ON public.revenue_audit_logs;
CREATE POLICY "admins read audit" ON public.revenue_audit_logs FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

INSERT INTO public.revenue_share_rules (name, partner_type, share_percentage, priority, active)
SELECT 'Baseline — Own Leads', 'own_leads'::public.lead_model, 70.00, 1000, true
WHERE NOT EXISTS (SELECT 1 FROM public.revenue_share_rules WHERE name = 'Baseline — Own Leads');

INSERT INTO public.revenue_share_rules (name, partner_type, share_percentage, priority, active)
SELECT 'Baseline — Supported Sales', 'supported'::public.lead_model, 50.00, 1000, true
WHERE NOT EXISTS (SELECT 1 FROM public.revenue_share_rules WHERE name = 'Baseline — Supported Sales');
