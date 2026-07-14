
-- Enum
DO $$ BEGIN
  CREATE TYPE public.lead_ownership_review_status AS ENUM (
    'pending_review','under_review','possible_duplicate','disputed',
    'resolved_keep_existing','resolved_partner_own','resolved_glintr_provided','resolved_merged','rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Ownership review submissions (submission does NOT create a partner_leads row)
CREATE TABLE IF NOT EXISTS public.lead_ownership_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claiming_partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  submitted_full_name text NOT NULL,
  submitted_mobile text NOT NULL,
  submitted_mobile_normalized text NOT NULL,
  submitted_email text,
  submitted_program_interest text,
  submitted_course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  submitted_source text,
  submitted_notes text,
  existing_lead_id uuid REFERENCES public.partner_leads(id) ON DELETE SET NULL,
  status public.lead_ownership_review_status NOT NULL DEFAULT 'pending_review',
  admin_decision text,
  admin_reason text,
  decided_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at timestamptz,
  approved_lead_id uuid REFERENCES public.partner_leads(id) ON DELETE SET NULL,
  merged_into_lead_id uuid REFERENCES public.partner_leads(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lor_status ON public.lead_ownership_reviews(status);
CREATE INDEX IF NOT EXISTS idx_lor_partner ON public.lead_ownership_reviews(claiming_partner_id);
CREATE INDEX IF NOT EXISTS idx_lor_mobile ON public.lead_ownership_reviews(submitted_mobile_normalized);

GRANT SELECT, INSERT, UPDATE ON public.lead_ownership_reviews TO authenticated;
GRANT ALL ON public.lead_ownership_reviews TO service_role;
ALTER TABLE public.lead_ownership_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lor_partner_read_own" ON public.lead_ownership_reviews
  FOR SELECT TO authenticated
  USING (claiming_partner_id = public.partner_id_for(auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY "lor_partner_insert_own" ON public.lead_ownership_reviews
  FOR INSERT TO authenticated
  WITH CHECK (claiming_partner_id = public.partner_id_for(auth.uid()));

CREATE POLICY "lor_admin_update" ON public.lead_ownership_reviews
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "lor_admin_delete" ON public.lead_ownership_reviews
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE TRIGGER trg_lor_updated_at BEFORE UPDATE ON public.lead_ownership_reviews
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Ownership history (audit trail per lead)
CREATE TABLE IF NOT EXISTS public.lead_ownership_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.partner_leads(id) ON DELETE CASCADE,
  ownership_type public.lead_ownership_type NOT NULL,
  owner_partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_loh_lead ON public.lead_ownership_history(lead_id);

GRANT SELECT, INSERT, UPDATE ON public.lead_ownership_history TO authenticated;
GRANT ALL ON public.lead_ownership_history TO service_role;
ALTER TABLE public.lead_ownership_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "loh_read_admin_or_owner" ON public.lead_ownership_history
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR owner_partner_id = public.partner_id_for(auth.uid())
  );

CREATE POLICY "loh_admin_write" ON public.lead_ownership_history
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "loh_admin_update" ON public.lead_ownership_history
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Commission: hold earnings while ownership is being reviewed
ALTER TABLE public.commissions
  ADD COLUMN IF NOT EXISTS ownership_pending boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ownership_review_id uuid REFERENCES public.lead_ownership_reviews(id) ON DELETE SET NULL;
