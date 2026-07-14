
-- 1. Partners: account + work model columns
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS profile_photo_url text,
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS work_model text NOT NULL DEFAULT 'flexible',
  ADD COLUMN IF NOT EXISTS work_model_status text NOT NULL DEFAULT 'flexible_active',
  ADD COLUMN IF NOT EXISTS work_model_selected_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS work_model_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS work_model_approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'partners_account_status_check'
  ) THEN
    ALTER TABLE public.partners
      ADD CONSTRAINT partners_account_status_check
      CHECK (account_status IN ('active','under_review','suspended','inactive'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'partners_work_model_check'
  ) THEN
    ALTER TABLE public.partners
      ADD CONSTRAINT partners_work_model_check
      CHECK (work_model IN ('flexible','full_time'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'partners_work_model_status_check'
  ) THEN
    ALTER TABLE public.partners
      ADD CONSTRAINT partners_work_model_status_check
      CHECK (work_model_status IN ('flexible_active','full_time_pending','full_time_active','change_under_review'));
  END IF;
END $$;

-- Seed account_status from existing partner_status enum
UPDATE public.partners
   SET account_status = CASE
     WHEN status::text = 'suspended' THEN 'suspended'
     WHEN status::text = 'revoked' THEN 'inactive'
     ELSE 'active'
   END
 WHERE account_status = 'active';

-- 2. Payout details: extra columns + masked cache
ALTER TABLE public.partner_payout_details
  ADD COLUMN IF NOT EXISTS account_type text,
  ADD COLUMN IF NOT EXISTS gstin text,
  ADD COLUMN IF NOT EXISTS account_last4 text,
  ADD COLUMN IF NOT EXISTS pan_masked text,
  ADD COLUMN IF NOT EXISTS bank_details_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pan_details_completed boolean NOT NULL DEFAULT false;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payout_details_account_type_check'
  ) THEN
    ALTER TABLE public.partner_payout_details
      ADD CONSTRAINT payout_details_account_type_check
      CHECK (account_type IS NULL OR account_type IN ('savings','current'));
  END IF;
END $$;

-- 3. Full-time applications table
CREATE TABLE IF NOT EXISTS public.partner_full_time_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','more_info')),
  applied_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_notes text,
  applicant_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.partner_full_time_applications TO authenticated;
GRANT ALL ON public.partner_full_time_applications TO service_role;

ALTER TABLE public.partner_full_time_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ftapp_partner_read_own" ON public.partner_full_time_applications;
DROP POLICY IF EXISTS "ftapp_partner_insert_own" ON public.partner_full_time_applications;
DROP POLICY IF EXISTS "ftapp_admin_all" ON public.partner_full_time_applications;

CREATE POLICY "ftapp_partner_read_own"
  ON public.partner_full_time_applications FOR SELECT TO authenticated
  USING (partner_id = partner_id_for(auth.uid()));

CREATE POLICY "ftapp_partner_insert_own"
  ON public.partner_full_time_applications FOR INSERT TO authenticated
  WITH CHECK (partner_id = partner_id_for(auth.uid()));

CREATE POLICY "ftapp_admin_all"
  ON public.partner_full_time_applications FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

DROP TRIGGER IF EXISTS trg_ftapp_updated ON public.partner_full_time_applications;
CREATE TRIGGER trg_ftapp_updated
  BEFORE UPDATE ON public.partner_full_time_applications
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 4. Protect privileged partner columns from non-admin edits
CREATE OR REPLACE FUNCTION public.tg_partners_protect_privileged()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;
  NEW.status := OLD.status;
  NEW.account_status := OLD.account_status;
  NEW.work_model := OLD.work_model;
  NEW.work_model_status := OLD.work_model_status;
  NEW.work_model_approved_at := OLD.work_model_approved_at;
  NEW.work_model_approved_by := OLD.work_model_approved_by;
  NEW.default_revenue_share := OLD.default_revenue_share;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_partners_protect_privileged ON public.partners;
CREATE TRIGGER trg_partners_protect_privileged
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.tg_partners_protect_privileged();

-- 5. Payout details completion + masking trigger
CREATE OR REPLACE FUNCTION public.tg_payout_completion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.bank_details_completed := (
    COALESCE(NEW.account_holder_name,'') <> '' AND
    COALESCE(NEW.bank_account_number,'') <> '' AND
    COALESCE(NEW.ifsc_code,'') <> '' AND
    COALESCE(NEW.bank_name,'') <> ''
  );
  NEW.pan_details_completed := (
    COALESCE(NEW.pan,'') <> '' AND COALESCE(NEW.legal_name,'') <> ''
  );
  IF NEW.bank_account_number IS NOT NULL AND length(NEW.bank_account_number) >= 4 THEN
    NEW.account_last4 := right(NEW.bank_account_number, 4);
  ELSE
    NEW.account_last4 := NULL;
  END IF;
  IF NEW.pan IS NOT NULL AND length(NEW.pan) = 10 THEN
    NEW.pan_masked := substring(NEW.pan, 1, 5) || '****' || substring(NEW.pan, 10, 1);
  ELSE
    NEW.pan_masked := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payout_completion ON public.partner_payout_details;
CREATE TRIGGER trg_payout_completion
  BEFORE INSERT OR UPDATE ON public.partner_payout_details
  FOR EACH ROW EXECUTE FUNCTION public.tg_payout_completion();
