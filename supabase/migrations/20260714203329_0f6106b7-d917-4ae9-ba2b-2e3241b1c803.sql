
-- Stable public enrollment reference (GL-ENR-YYYY-######)
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS enrollment_code TEXT UNIQUE;
CREATE SEQUENCE IF NOT EXISTS public.enrollment_code_seq;

CREATE OR REPLACE FUNCTION public.tg_enrollment_code()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.enrollment_code IS NULL OR NEW.enrollment_code = '' THEN
    NEW.enrollment_code := 'GL-ENR-' || to_char(now(),'YYYY') || '-' ||
      lpad(nextval('public.enrollment_code_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_enrollment_code ON public.enrollments;
CREATE TRIGGER trg_enrollment_code BEFORE INSERT ON public.enrollments
FOR EACH ROW EXECUTE FUNCTION public.tg_enrollment_code();

-- Backfill existing rows lacking a code
UPDATE public.enrollments
SET enrollment_code = 'GL-ENR-' || to_char(COALESCE(created_at, now()),'YYYY') || '-' ||
  lpad(nextval('public.enrollment_code_seq')::text, 6, '0')
WHERE enrollment_code IS NULL;

-- Separate commission eligibility state from commission workflow status
ALTER TABLE public.ambassador_commissions
  ADD COLUMN IF NOT EXISTS eligibility_status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (eligibility_status IN ('not_started','pending_review','eligible','ineligible','on_hold')),
  ADD COLUMN IF NOT EXISTS eligibility_checked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS eligibility_public_reason TEXT,
  ADD COLUMN IF NOT EXISTS eligibility_rule_version INTEGER;

CREATE INDEX IF NOT EXISTS idx_amb_comm_eligibility
  ON public.ambassador_commissions (ambassador_id, eligibility_status);
