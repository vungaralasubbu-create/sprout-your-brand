
-- Referral system for Sales Partners referring new Sales Partners

-- 1. Referral code on partners (auto-generated)
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

CREATE OR REPLACE FUNCTION public.generate_partner_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base TEXT;
  suffix TEXT;
  candidate TEXT;
  exists_count INT;
  tries INT := 0;
BEGIN
  IF NEW.referral_code IS NOT NULL THEN RETURN NEW; END IF;
  base := upper(regexp_replace(split_part(COALESCE(NEW.display_name, 'PARTNER'), ' ', 1), '[^A-Za-z0-9]', '', 'g'));
  IF base = '' OR base IS NULL THEN base := 'PARTNER'; END IF;
  base := substr(base, 1, 10);
  LOOP
    suffix := lpad((floor(random() * 10000))::int::text, 4, '0');
    candidate := 'GLINTR-' || base || '-' || suffix;
    SELECT COUNT(*) INTO exists_count FROM public.partners WHERE referral_code = candidate;
    EXIT WHEN exists_count = 0 OR tries > 8;
    tries := tries + 1;
  END LOOP;
  NEW.referral_code := candidate;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_partners_referral_code ON public.partners;
CREATE TRIGGER trg_partners_referral_code
BEFORE INSERT ON public.partners
FOR EACH ROW EXECUTE FUNCTION public.generate_partner_referral_code();

-- Backfill existing partners
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id, display_name FROM public.partners WHERE referral_code IS NULL LOOP
    UPDATE public.partners SET referral_code = 'GLINTR-' ||
      COALESCE(NULLIF(upper(substr(regexp_replace(split_part(r.display_name,' ',1), '[^A-Za-z0-9]', '', 'g'),1,10)), ''), 'PARTNER') ||
      '-' || lpad((floor(random()*10000))::int::text, 4, '0')
    WHERE id = r.id;
  END LOOP;
END $$;

-- 2. Referral code captured on application
ALTER TABLE public.partner_applications ADD COLUMN IF NOT EXISTS referred_by_code TEXT;

-- 3. Referral program settings (singleton row id=1)
CREATE TABLE IF NOT EXISTS public.referral_program_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  is_active BOOLEAN NOT NULL DEFAULT true,
  bonus_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  min_verified_sales INT NOT NULL DEFAULT 3,
  min_revenue_generated NUMERIC(12,2) NOT NULL DEFAULT 0,
  qualification_period_days INT NOT NULL DEFAULT 30,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

GRANT SELECT ON public.referral_program_settings TO authenticated;
GRANT ALL ON public.referral_program_settings TO service_role;
ALTER TABLE public.referral_program_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_read_authenticated" ON public.referral_program_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings_admin_write" ON public.referral_program_settings
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

INSERT INTO public.referral_program_settings (id, is_active, bonus_amount, min_verified_sales, qualification_period_days)
VALUES (1, true, 0, 3, 30)
ON CONFLICT (id) DO NOTHING;

-- 4. Partner referrals table
CREATE TABLE IF NOT EXISTS public.partner_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  referred_partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  referred_application_id UUID REFERENCES public.partner_applications(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'signed_up' CHECK (status IN (
    'signed_up','active','qualification_pending','qualified',
    'bonus_pending_approval','bonus_approved','bonus_paid','rejected'
  )),
  qualification_deadline TIMESTAMPTZ,
  qualified_at TIMESTAMPTZ,
  bonus_amount NUMERIC(12,2),
  bonus_approved_at TIMESTAMPTZ,
  bonus_approved_by UUID,
  bonus_paid_at TIMESTAMPTZ,
  bonus_paid_by UUID,
  payout_reference TEXT,
  admin_note TEXT,
  rejection_reason TEXT,
  signed_up_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (referrer_partner_id, referred_partner_id),
  UNIQUE (referrer_partner_id, referred_application_id),
  CHECK (referrer_partner_id <> referred_partner_id)
);

CREATE INDEX IF NOT EXISTS idx_partner_referrals_referrer ON public.partner_referrals(referrer_partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_referrals_referred ON public.partner_referrals(referred_partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_referrals_status ON public.partner_referrals(status);

GRANT SELECT ON public.partner_referrals TO authenticated;
GRANT ALL ON public.partner_referrals TO service_role;
ALTER TABLE public.partner_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referrals_referrer_read" ON public.partner_referrals
  FOR SELECT TO authenticated
  USING (
    referrer_partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "referrals_admin_all" ON public.partner_referrals
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_partner_referrals_updated_at
BEFORE UPDATE ON public.partner_referrals
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 5. Qualification check trigger on commissions
CREATE OR REPLACE FUNCTION public.check_referral_qualification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref_row public.partner_referrals%ROWTYPE;
  settings public.referral_program_settings%ROWTYPE;
  verified_count INT;
  revenue_sum NUMERIC;
BEGIN
  SELECT * INTO ref_row FROM public.partner_referrals
    WHERE referred_partner_id = NEW.partner_id
      AND status IN ('signed_up','active','qualification_pending')
    LIMIT 1;
  IF NOT FOUND THEN RETURN NEW; END IF;

  SELECT * INTO settings FROM public.referral_program_settings WHERE id = 1;
  IF NOT FOUND OR NOT settings.is_active THEN RETURN NEW; END IF;

  SELECT COUNT(*), COALESCE(SUM(gross_revenue),0)
    INTO verified_count, revenue_sum
    FROM public.commissions
    WHERE partner_id = NEW.partner_id
      AND status IN ('approved','paid');

  IF verified_count >= settings.min_verified_sales
     AND revenue_sum >= settings.min_revenue_generated
     AND (ref_row.qualification_deadline IS NULL OR now() <= ref_row.qualification_deadline) THEN
    UPDATE public.partner_referrals
      SET status = 'bonus_pending_approval',
          qualified_at = now(),
          bonus_amount = settings.bonus_amount
      WHERE id = ref_row.id;
  ELSIF ref_row.status = 'signed_up' THEN
    UPDATE public.partner_referrals SET status = 'qualification_pending' WHERE id = ref_row.id;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_check_referral_qualification ON public.commissions;
CREATE TRIGGER trg_check_referral_qualification
AFTER INSERT OR UPDATE OF status ON public.commissions
FOR EACH ROW EXECUTE FUNCTION public.check_referral_qualification();
