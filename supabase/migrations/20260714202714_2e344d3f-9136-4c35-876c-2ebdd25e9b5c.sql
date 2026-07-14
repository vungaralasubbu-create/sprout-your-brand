
-- Enum for attribution status
DO $$ BEGIN
  CREATE TYPE public.ambassador_attribution_status AS ENUM
    ('valid','pending_review','conflict_review','confirmed','invalid','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Extend referral leads
ALTER TABLE public.ambassador_referral_leads
  ADD COLUMN IF NOT EXISTS pricing_plan text,
  ADD COLUMN IF NOT EXISTS campaign_id text,
  ADD COLUMN IF NOT EXISTS lead_source text,
  ADD COLUMN IF NOT EXISTS student_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS attribution_status public.ambassador_attribution_status NOT NULL DEFAULT 'valid',
  ADD COLUMN IF NOT EXISTS attribution_model text NOT NULL DEFAULT 'first_valid_referral',
  ADD COLUMN IF NOT EXISTS attribution_public_reason text,
  ADD COLUMN IF NOT EXISTS lead_reference text;

-- Stable lead code sequence
CREATE SEQUENCE IF NOT EXISTS public.ambassador_referral_lead_code_seq;

CREATE OR REPLACE FUNCTION public.tg_amb_referral_lead_defaults()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.lead_code IS NULL OR NEW.lead_code = '' THEN
    NEW.lead_code := 'GL-RF-' || to_char(now(), 'YYYY') || '-' ||
      lpad(nextval('public.ambassador_referral_lead_code_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_amb_lead_defaults ON public.ambassador_referral_leads;
CREATE TRIGGER trg_amb_lead_defaults
  BEFORE INSERT ON public.ambassador_referral_leads
  FOR EACH ROW EXECUTE FUNCTION public.tg_amb_referral_lead_defaults();

-- Backfill missing lead codes
UPDATE public.ambassador_referral_leads
SET lead_code = 'GL-RF-' || to_char(created_at, 'YYYY') || '-' ||
  lpad(nextval('public.ambassador_referral_lead_code_seq')::text, 6, '0')
WHERE lead_code IS NULL OR lead_code = '';

-- Referral journey events
CREATE TABLE IF NOT EXISTS public.ambassador_referral_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id uuid NOT NULL REFERENCES public.campus_ambassador_profiles(id) ON DELETE CASCADE,
  referral_lead_id uuid REFERENCES public.ambassador_referral_leads(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES public.enrollments(id) ON DELETE SET NULL,
  commission_id uuid REFERENCES public.ambassador_commissions(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  event_label text NOT NULL,
  related_entity_type text,
  related_entity_id text,
  event_source text NOT NULL DEFAULT 'system',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ambassador_referral_events TO authenticated;
GRANT ALL ON public.ambassador_referral_events TO service_role;

CREATE INDEX IF NOT EXISTS idx_amb_ref_events_amb ON public.ambassador_referral_events (ambassador_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_amb_ref_events_lead ON public.ambassador_referral_events (referral_lead_id, created_at DESC);

ALTER TABLE public.ambassador_referral_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ambassador_read_own_events ON public.ambassador_referral_events;
CREATE POLICY ambassador_read_own_events ON public.ambassador_referral_events
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.campus_ambassador_profiles p
    WHERE p.id = ambassador_referral_events.ambassador_id
      AND p.user_id = auth.uid()
      AND p.status = 'active'
  ));

DROP POLICY IF EXISTS admin_read_events ON public.ambassador_referral_events;
CREATE POLICY admin_read_events ON public.ambassador_referral_events
  FOR SELECT TO authenticated
  USING (public.has_admin_permission(auth.uid(), 'campus_ambassador.review'));

-- Helpful additional index on leads for filters
CREATE INDEX IF NOT EXISTS idx_amb_leads_status ON public.ambassador_referral_leads (ambassador_id, status);
CREATE INDEX IF NOT EXISTS idx_amb_leads_attrib ON public.ambassador_referral_leads (ambassador_id, attribution_status);
CREATE INDEX IF NOT EXISTS idx_amb_leads_program ON public.ambassador_referral_leads (ambassador_id, program_id);
