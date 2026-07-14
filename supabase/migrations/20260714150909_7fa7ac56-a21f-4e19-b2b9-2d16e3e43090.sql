
-- Status enum
DO $$ BEGIN
  CREATE TYPE public.payment_submission_status AS ENUM (
    'pending_verification','under_review','verified','rejected','needs_more_info','duplicate_flagged'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_method AS ENUM ('upi','bank_transfer','payment_gateway','card','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.partner_payment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.partner_leads(id) ON DELETE RESTRICT,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  plan public.payment_plan NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  payment_date date NOT NULL,
  payment_method public.payment_method NOT NULL,
  utr_reference text NOT NULL,
  utr_normalized text GENERATED ALWAYS AS (lower(regexp_replace(coalesce(utr_reference,''), '\s+', '', 'g'))) STORED,
  payment_link_id uuid REFERENCES public.payment_links(id) ON DELETE SET NULL,
  lead_payment_link_id uuid REFERENCES public.partner_lead_payment_links(id) ON DELETE SET NULL,
  partner_notes text,
  proof_bucket text NOT NULL DEFAULT 'payment-proofs',
  proof_path text NOT NULL,
  proof_mime text,
  proof_size_bytes integer,
  status public.payment_submission_status NOT NULL DEFAULT 'pending_verification',
  is_duplicate_flag boolean NOT NULL DEFAULT false,
  admin_notes text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pps_partner ON public.partner_payment_submissions(partner_id);
CREATE INDEX IF NOT EXISTS idx_pps_lead ON public.partner_payment_submissions(lead_id);
CREATE INDEX IF NOT EXISTS idx_pps_utr ON public.partner_payment_submissions(utr_normalized);
CREATE INDEX IF NOT EXISTS idx_pps_status ON public.partner_payment_submissions(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_payment_submissions TO authenticated;
GRANT ALL ON public.partner_payment_submissions TO service_role;

ALTER TABLE public.partner_payment_submissions ENABLE ROW LEVEL SECURITY;

-- Partner sees only their own submissions; admins see all
CREATE POLICY "pps_partner_select_own"
ON public.partner_payment_submissions FOR SELECT
TO authenticated
USING (partner_id = partner_id_for(auth.uid()) OR is_admin(auth.uid()));

-- Partners can create only for their own leads; status must be pending_verification or duplicate_flagged
CREATE POLICY "pps_partner_insert_own"
ON public.partner_payment_submissions FOR INSERT
TO authenticated
WITH CHECK (
  partner_id = partner_id_for(auth.uid())
  AND status IN ('pending_verification','duplicate_flagged')
  AND EXISTS (
    SELECT 1 FROM public.partner_leads l
    WHERE l.id = lead_id
      AND (l.owner_partner_id = partner_id_for(auth.uid()) OR l.assigned_partner_id = partner_id_for(auth.uid()))
  )
);

-- Only admins can update/delete (verify/reject)
CREATE POLICY "pps_admin_all"
ON public.partner_payment_submissions FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE TRIGGER trg_pps_updated_at
BEFORE UPDATE ON public.partner_payment_submissions
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Storage RLS: payment-proofs bucket, per-partner folder prefix "<partner_id>/..."
CREATE POLICY "payment_proofs_partner_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND (storage.foldername(name))[1] = partner_id_for(auth.uid())::text
);

CREATE POLICY "payment_proofs_partner_select_own"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND (
    (storage.foldername(name))[1] = partner_id_for(auth.uid())::text
    OR is_admin(auth.uid())
  )
);

CREATE POLICY "payment_proofs_admin_all"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'payment-proofs' AND is_admin(auth.uid()))
WITH CHECK (bucket_id = 'payment-proofs' AND is_admin(auth.uid()));
