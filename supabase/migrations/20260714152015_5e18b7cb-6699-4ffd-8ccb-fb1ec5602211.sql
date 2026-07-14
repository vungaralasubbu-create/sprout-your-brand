
ALTER TABLE public.commissions ALTER COLUMN enrollment_id DROP NOT NULL;

ALTER TABLE public.commissions
  ADD COLUMN IF NOT EXISTS submission_id uuid REFERENCES public.partner_payment_submissions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.partner_leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS plan text,
  ADD COLUMN IF NOT EXISTS lead_type text CHECK (lead_type IN ('own','glintr_provided')),
  ADD COLUMN IF NOT EXISTS payout_target_at timestamptz,
  ADD COLUMN IF NOT EXISTS payout_reference text,
  ADD COLUMN IF NOT EXISTS paid_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hold_reason text;

CREATE UNIQUE INDEX IF NOT EXISTS commissions_submission_unique
  ON public.commissions(submission_id)
  WHERE submission_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS commissions_partner_status_idx
  ON public.commissions(partner_id, status);
