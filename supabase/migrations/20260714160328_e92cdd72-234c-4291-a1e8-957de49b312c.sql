
-- 1) New enum for ownership type
DO $$ BEGIN
  CREATE TYPE public.lead_ownership_type AS ENUM ('partner_own', 'glintr_provided');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Add columns to partner_leads
ALTER TABLE public.partner_leads
  ADD COLUMN IF NOT EXISTS lead_ownership_type public.lead_ownership_type NOT NULL DEFAULT 'partner_own',
  ADD COLUMN IF NOT EXISTS campaign_source text,
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS assignment_method text,
  ADD COLUMN IF NOT EXISTS assigned_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_partner_leads_ownership ON public.partner_leads(lead_ownership_type);
CREATE INDEX IF NOT EXISTS idx_partner_leads_unassigned ON public.partner_leads(lead_ownership_type) WHERE assigned_partner_id IS NULL;

-- 3) Add "no_answer" status
DO $$ BEGIN
  ALTER TYPE public.partner_lead_status ADD VALUE IF NOT EXISTS 'no_answer';
EXCEPTION WHEN others THEN NULL; END $$;

-- 4) Extend assignment history: allow richer action list + method column
ALTER TABLE public.lead_assignment_history
  DROP CONSTRAINT IF EXISTS lead_assignment_history_action_check;
ALTER TABLE public.lead_assignment_history
  ADD CONSTRAINT lead_assignment_history_action_check
  CHECK (action IN ('assigned','reassigned','unassigned','hold','priority_changed','note','imported'));
ALTER TABLE public.lead_assignment_history
  ADD COLUMN IF NOT EXISTS method text;

-- 5) Round-robin settings singleton
CREATE TABLE IF NOT EXISTS public.round_robin_settings (
  id smallint PRIMARY KEY DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  eligible_work_models text[] NOT NULL DEFAULT ARRAY['flexible','full_time']::text[],
  require_verified_brand boolean NOT NULL DEFAULT false,
  selected_partner_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  last_partner_id uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.round_robin_settings TO authenticated;
GRANT ALL ON public.round_robin_settings TO service_role;

ALTER TABLE public.round_robin_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rrs_admin_all ON public.round_robin_settings;
CREATE POLICY rrs_admin_all ON public.round_robin_settings
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

INSERT INTO public.round_robin_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
