
-- Enums
DO $$ BEGIN
  CREATE TYPE public.ambassador_payout_profile_status AS ENUM (
    'not_added','incomplete','submitted','under_review','more_info_required','verified','update_required','rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ambassador_payout_method AS ENUM ('bank_account','upi');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ambassador_payout_status AS ENUM (
    'requested','under_review','approved','processing','paid','failed','on_hold','cancelled','reversed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ambassador_bank_account_type AS ENUM ('savings','current');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Sequences
CREATE SEQUENCE IF NOT EXISTS public.ambassador_payout_profile_code_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.ambassador_payout_code_seq START 1;

-- Masking helpers
CREATE OR REPLACE FUNCTION public.mask_account_number(_num text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN _num IS NULL OR length(_num) < 4 THEN NULL
    ELSE '••••' || right(_num, 4)
  END
$$;

CREATE OR REPLACE FUNCTION public.mask_upi_id(_upi text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN _upi IS NULL OR position('@' in _upi) < 3 THEN NULL
    ELSE substr(_upi, 1, 2) || '***' || substr(_upi, position('@' in _upi))
  END
$$;

-- ============================
-- ambassador_payout_profiles
-- ============================
CREATE TABLE IF NOT EXISTS public.ambassador_payout_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_code text UNIQUE,
  ambassador_id uuid NOT NULL UNIQUE REFERENCES public.campus_ambassador_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  status public.ambassador_payout_profile_status NOT NULL DEFAULT 'not_added',
  payout_method public.ambassador_payout_method,

  -- Bank fields
  account_holder_name text,
  bank_name text,
  account_number text,           -- stored server-side only; never returned to client
  account_number_masked text,
  ifsc_code text,
  account_type public.ambassador_bank_account_type,

  -- UPI fields
  upi_id text,                   -- stored server-side only
  upi_id_masked text,

  beneficiary_name text,
  admin_public_message text,     -- ambassador-visible reason
  verification_reference text,

  submitted_at timestamptz,
  verified_at timestamptz,
  rejected_at timestamptz,
  under_review_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.ambassador_payout_profiles TO authenticated;
GRANT ALL ON public.ambassador_payout_profiles TO service_role;
ALTER TABLE public.ambassador_payout_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ambassador reads own payout profile"
  ON public.ambassador_payout_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_admin_permission(auth.uid(),'campus_ambassador.review'));

CREATE POLICY "ambassador creates own payout profile"
  ON public.ambassador_payout_profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "ambassador updates own payout profile or admin"
  ON public.ambassador_payout_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_admin_permission(auth.uid(),'campus_ambassador.review'))
  WITH CHECK (user_id = auth.uid() OR public.has_admin_permission(auth.uid(),'campus_ambassador.review'));

-- Trigger: generate code, mask sensitive fields, restrict privileged status transitions
CREATE OR REPLACE FUNCTION public.tg_amb_payout_profile_defaults()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_admin_actor boolean := public.has_admin_permission(auth.uid(),'campus_ambassador.review');
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.profile_code IS NULL OR NEW.profile_code = '' THEN
      NEW.profile_code := 'GL-CA-PRO-' || to_char(now(),'YYYY') || '-' ||
        lpad(nextval('public.ambassador_payout_profile_code_seq')::text, 6, '0');
    END IF;
    -- Non-admins may only submit as 'submitted' or 'incomplete'
    IF NOT is_admin_actor AND NEW.status NOT IN ('incomplete','submitted') THEN
      NEW.status := 'submitted';
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' AND NOT is_admin_actor THEN
    -- Freeze privileged status transitions
    IF NEW.status NOT IN ('submitted','incomplete','update_required','more_info_required','rejected') THEN
      NEW.status := OLD.status;
    END IF;
    -- If moving out of a review state, force back to submitted
    IF OLD.status IN ('verified','under_review','rejected','more_info_required','update_required')
       AND NEW.status = OLD.status
       AND (
         NEW.payout_method IS DISTINCT FROM OLD.payout_method OR
         NEW.account_number IS DISTINCT FROM OLD.account_number OR
         NEW.ifsc_code IS DISTINCT FROM OLD.ifsc_code OR
         NEW.upi_id IS DISTINCT FROM OLD.upi_id OR
         NEW.account_holder_name IS DISTINCT FROM OLD.account_holder_name
       ) THEN
      NEW.status := 'submitted';
      NEW.verified_at := NULL;
    END IF;
    -- Admin-only fields cannot change
    NEW.verification_reference := OLD.verification_reference;
    NEW.admin_public_message := OLD.admin_public_message;
    NEW.verified_at := OLD.verified_at;
    NEW.rejected_at := OLD.rejected_at;
    NEW.under_review_at := OLD.under_review_at;
    NEW.profile_code := OLD.profile_code;
    NEW.ambassador_id := OLD.ambassador_id;
    NEW.user_id := OLD.user_id;
  END IF;

  -- Compute masks
  NEW.account_number_masked := public.mask_account_number(NEW.account_number);
  NEW.upi_id_masked := public.mask_upi_id(NEW.upi_id);

  -- Timestamps for status transitions
  IF TG_OP = 'INSERT' AND NEW.status = 'submitted' THEN
    NEW.submitted_at := COALESCE(NEW.submitted_at, now());
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.status = 'submitted' AND OLD.status <> 'submitted' THEN
    NEW.submitted_at := now();
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.status = 'verified' AND OLD.status <> 'verified' THEN
    NEW.verified_at := now();
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.status = 'rejected' AND OLD.status <> 'rejected' THEN
    NEW.rejected_at := now();
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.status = 'under_review' AND OLD.status <> 'under_review' THEN
    NEW.under_review_at := now();
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END $$;

CREATE TRIGGER tg_amb_payout_profile_defaults
BEFORE INSERT OR UPDATE ON public.ambassador_payout_profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_amb_payout_profile_defaults();

-- ============================
-- ambassador_payout_profile_versions
-- ============================
CREATE TABLE IF NOT EXISTS public.ambassador_payout_profile_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.ambassador_payout_profiles(id) ON DELETE CASCADE,
  ambassador_id uuid NOT NULL REFERENCES public.campus_ambassador_profiles(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  payout_method public.ambassador_payout_method,
  account_holder_name text,
  bank_name text,
  account_number_masked text,
  ifsc_code text,
  account_type public.ambassador_bank_account_type,
  upi_id_masked text,
  beneficiary_name text,
  status public.ambassador_payout_profile_status NOT NULL,
  submitted_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id, version_number)
);

GRANT SELECT ON public.ambassador_payout_profile_versions TO authenticated;
GRANT ALL ON public.ambassador_payout_profile_versions TO service_role;
ALTER TABLE public.ambassador_payout_profile_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ambassador reads own payout profile versions"
  ON public.ambassador_payout_profile_versions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campus_ambassador_profiles p
      WHERE p.id = ambassador_payout_profile_versions.ambassador_id AND p.user_id = auth.uid()
    )
    OR public.has_admin_permission(auth.uid(),'campus_ambassador.review')
  );

-- Trigger: auto-version on profile submission
CREATE OR REPLACE FUNCTION public.tg_amb_payout_profile_version()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  vnum int;
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'submitted')
     OR (TG_OP = 'UPDATE' AND NEW.status = 'submitted' AND OLD.status <> 'submitted')
     OR (TG_OP = 'UPDATE' AND NEW.status = 'verified' AND OLD.status <> 'verified') THEN
    SELECT COALESCE(MAX(version_number),0)+1 INTO vnum
      FROM public.ambassador_payout_profile_versions WHERE profile_id = NEW.id;
    INSERT INTO public.ambassador_payout_profile_versions
      (profile_id, ambassador_id, version_number, payout_method, account_holder_name,
       bank_name, account_number_masked, ifsc_code, account_type,
       upi_id_masked, beneficiary_name, status, submitted_at, verified_at)
    VALUES (NEW.id, NEW.ambassador_id, vnum, NEW.payout_method, NEW.account_holder_name,
       NEW.bank_name, NEW.account_number_masked, NEW.ifsc_code, NEW.account_type,
       NEW.upi_id_masked, NEW.beneficiary_name, NEW.status, NEW.submitted_at, NEW.verified_at);
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER tg_amb_payout_profile_version
AFTER INSERT OR UPDATE ON public.ambassador_payout_profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_amb_payout_profile_version();

-- ============================
-- ambassador_payouts
-- ============================
CREATE TABLE IF NOT EXISTS public.ambassador_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_code text UNIQUE,
  ambassador_id uuid NOT NULL REFERENCES public.campus_ambassador_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payout_profile_id uuid REFERENCES public.ambassador_payout_profiles(id) ON DELETE SET NULL,
  payout_profile_version_id uuid REFERENCES public.ambassador_payout_profile_versions(id) ON DELETE SET NULL,

  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'INR',
  payout_method public.ambassador_payout_method,
  masked_destination text,

  mode text NOT NULL DEFAULT 'request',   -- 'request' | 'automatic'
  status public.ambassador_payout_status NOT NULL DEFAULT 'requested',
  provider_reference text,
  public_failure_reason text,
  public_hold_reason text,
  public_reversal_reason text,

  idempotency_key text,

  requested_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  processing_at timestamptz,
  paid_at timestamptz,
  failed_at timestamptz,
  on_hold_at timestamptz,
  cancelled_at timestamptz,
  reversed_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(ambassador_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_amb_payouts_ambassador ON public.ambassador_payouts(ambassador_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_amb_payouts_status ON public.ambassador_payouts(status);

GRANT SELECT, INSERT, UPDATE ON public.ambassador_payouts TO authenticated;
GRANT ALL ON public.ambassador_payouts TO service_role;
ALTER TABLE public.ambassador_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ambassador reads own payouts"
  ON public.ambassador_payouts FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_admin_permission(auth.uid(),'campus_ambassador.review'));

CREATE POLICY "ambassador creates own payouts"
  ON public.ambassador_payouts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "ambassador limited update or admin"
  ON public.ambassador_payouts FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_admin_permission(auth.uid(),'campus_ambassador.review'))
  WITH CHECK (user_id = auth.uid() OR public.has_admin_permission(auth.uid(),'campus_ambassador.review'));

CREATE OR REPLACE FUNCTION public.tg_amb_payout_defaults()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_admin_actor boolean := public.has_admin_permission(auth.uid(),'campus_ambassador.review');
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.payout_code IS NULL OR NEW.payout_code = '' THEN
      NEW.payout_code := 'GL-CA-PAY-' || to_char(now(),'YYYY') || '-' ||
        lpad(nextval('public.ambassador_payout_code_seq')::text, 6, '0');
    END IF;
    -- Non-admins can only create in 'requested' status
    IF NOT is_admin_actor THEN
      NEW.status := 'requested';
      NEW.provider_reference := NULL;
      NEW.paid_at := NULL; NEW.failed_at := NULL; NEW.approved_at := NULL;
      NEW.processing_at := NULL; NEW.reversed_at := NULL; NEW.on_hold_at := NULL;
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' AND NOT is_admin_actor THEN
    -- Ambassador may only transition requested -> cancelled
    IF NOT (OLD.status = 'requested' AND NEW.status = 'cancelled') THEN
      NEW.status := OLD.status;
    END IF;
    NEW.provider_reference := OLD.provider_reference;
    NEW.public_failure_reason := OLD.public_failure_reason;
    NEW.public_hold_reason := OLD.public_hold_reason;
    NEW.public_reversal_reason := OLD.public_reversal_reason;
    NEW.amount := OLD.amount;
    NEW.payout_code := OLD.payout_code;
    NEW.paid_at := OLD.paid_at; NEW.failed_at := OLD.failed_at;
    NEW.approved_at := OLD.approved_at; NEW.processing_at := OLD.processing_at;
    NEW.reversed_at := OLD.reversed_at; NEW.on_hold_at := OLD.on_hold_at;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
    IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN NEW.cancelled_at := now(); END IF;
    IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN NEW.approved_at := now(); END IF;
    IF NEW.status = 'processing' AND OLD.status <> 'processing' THEN NEW.processing_at := now(); END IF;
    IF NEW.status = 'paid' AND OLD.status <> 'paid' THEN NEW.paid_at := now(); END IF;
    IF NEW.status = 'failed' AND OLD.status <> 'failed' THEN NEW.failed_at := now(); END IF;
    IF NEW.status = 'on_hold' AND OLD.status <> 'on_hold' THEN NEW.on_hold_at := now(); END IF;
    IF NEW.status = 'reversed' AND OLD.status <> 'reversed' THEN NEW.reversed_at := now(); END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END $$;

CREATE TRIGGER tg_amb_payout_defaults
BEFORE INSERT OR UPDATE ON public.ambassador_payouts
FOR EACH ROW EXECUTE FUNCTION public.tg_amb_payout_defaults();

-- ============================
-- ambassador_payout_allocations
-- ============================
CREATE TABLE IF NOT EXISTS public.ambassador_payout_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id uuid NOT NULL REFERENCES public.ambassador_payouts(id) ON DELETE CASCADE,
  commission_id uuid NOT NULL REFERENCES public.ambassador_commissions(id) ON DELETE RESTRICT,
  allocated_amount numeric(12,2) NOT NULL CHECK (allocated_amount > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_amb_alloc_payout ON public.ambassador_payout_allocations(payout_id);
CREATE INDEX IF NOT EXISTS idx_amb_alloc_commission ON public.ambassador_payout_allocations(commission_id);

GRANT SELECT, INSERT ON public.ambassador_payout_allocations TO authenticated;
GRANT ALL ON public.ambassador_payout_allocations TO service_role;
ALTER TABLE public.ambassador_payout_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ambassador reads own allocations"
  ON public.ambassador_payout_allocations FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.ambassador_payouts p WHERE p.id = ambassador_payout_allocations.payout_id AND p.user_id = auth.uid())
    OR public.has_admin_permission(auth.uid(),'campus_ambassador.review')
  );

CREATE POLICY "ambassador creates allocations for own payouts"
  ON public.ambassador_payout_allocations FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.ambassador_payouts p WHERE p.id = payout_id AND p.user_id = auth.uid())
  );

-- Guard: one active payout allocation per commission
CREATE OR REPLACE FUNCTION public.tg_amb_alloc_no_double()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  active_count int;
BEGIN
  SELECT COUNT(*) INTO active_count
  FROM public.ambassador_payout_allocations a
  JOIN public.ambassador_payouts p ON p.id = a.payout_id
  WHERE a.commission_id = NEW.commission_id
    AND p.status NOT IN ('failed','cancelled','reversed');
  IF active_count > 0 THEN
    RAISE EXCEPTION 'Commission % is already allocated to an active payout', NEW.commission_id;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER tg_amb_alloc_no_double
BEFORE INSERT ON public.ambassador_payout_allocations
FOR EACH ROW EXECUTE FUNCTION public.tg_amb_alloc_no_double();

-- When allocations are created for an active payout, mark commissions payout_processing
CREATE OR REPLACE FUNCTION public.tg_amb_alloc_mark_commission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.ambassador_commissions
    SET status = 'payout_processing', payout_processing_at = now(), payout_reference = NEW.payout_id::text
    WHERE id = NEW.commission_id AND status = 'available';
  RETURN NEW;
END $$;

CREATE TRIGGER tg_amb_alloc_mark_commission
AFTER INSERT ON public.ambassador_payout_allocations
FOR EACH ROW EXECUTE FUNCTION public.tg_amb_alloc_mark_commission();

-- When a payout terminal-status changes, cascade to allocated commissions
CREATE OR REPLACE FUNCTION public.tg_amb_payout_cascade_commissions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;

  IF NEW.status = 'paid' THEN
    UPDATE public.ambassador_commissions ac
      SET status = 'paid', paid_at = now()
      FROM public.ambassador_payout_allocations a
      WHERE a.payout_id = NEW.id AND a.commission_id = ac.id;
  ELSIF NEW.status IN ('failed','cancelled') THEN
    UPDATE public.ambassador_commissions ac
      SET status = 'available', payout_processing_at = NULL, payout_reference = NULL
      FROM public.ambassador_payout_allocations a
      WHERE a.payout_id = NEW.id AND a.commission_id = ac.id AND ac.status = 'payout_processing';
  ELSIF NEW.status = 'on_hold' THEN
    UPDATE public.ambassador_commissions ac
      SET status = 'on_hold'
      FROM public.ambassador_payout_allocations a
      WHERE a.payout_id = NEW.id AND a.commission_id = ac.id AND ac.status = 'payout_processing';
  ELSIF NEW.status = 'reversed' THEN
    UPDATE public.ambassador_commissions ac
      SET status = 'reversed', reversed_at = now()
      FROM public.ambassador_payout_allocations a
      WHERE a.payout_id = NEW.id AND a.commission_id = ac.id;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER tg_amb_payout_cascade_commissions
AFTER UPDATE ON public.ambassador_payouts
FOR EACH ROW EXECUTE FUNCTION public.tg_amb_payout_cascade_commissions();

-- ============================
-- ambassador_payout_activity
-- ============================
CREATE TABLE IF NOT EXISTS public.ambassador_payout_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id uuid NOT NULL REFERENCES public.campus_ambassador_profiles(id) ON DELETE CASCADE,
  payout_id uuid REFERENCES public.ambassador_payouts(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.ambassador_payout_profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  description text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_amb_payout_activity ON public.ambassador_payout_activity(ambassador_id, created_at DESC);

GRANT SELECT, INSERT ON public.ambassador_payout_activity TO authenticated;
GRANT ALL ON public.ambassador_payout_activity TO service_role;
ALTER TABLE public.ambassador_payout_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ambassador reads own payout activity"
  ON public.ambassador_payout_activity FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.campus_ambassador_profiles p WHERE p.id = ambassador_payout_activity.ambassador_id AND p.user_id = auth.uid())
    OR public.has_admin_permission(auth.uid(),'campus_ambassador.review')
  );

CREATE POLICY "authenticated may insert payout activity"
  ON public.ambassador_payout_activity FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.campus_ambassador_profiles p WHERE p.id = ambassador_id AND p.user_id = auth.uid())
    OR public.has_admin_permission(auth.uid(),'campus_ambassador.review')
  );

-- ============================
-- Platform payout policy defaults
-- ============================
INSERT INTO public.platform_settings (key, value)
VALUES
  ('campus_ambassador.payout.min_amount', to_jsonb(1000)::jsonb),
  ('campus_ambassador.payout.mode', to_jsonb('request'::text)),
  ('campus_ambassador.payout.partial_allowed', to_jsonb(true))
ON CONFLICT (key) DO NOTHING;
