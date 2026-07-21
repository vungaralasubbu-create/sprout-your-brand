
-- =========================================================
-- payment_accounts
-- =========================================================
CREATE TABLE IF NOT EXISTS public.payment_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name TEXT NOT NULL,
  merchant_name TEXT NOT NULL,
  upi_id TEXT NOT NULL,
  qr_image_url TEXT,
  bank_name TEXT,
  account_holder TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','inactive','maintenance','archived')),
  priority INTEGER NOT NULL DEFAULT 100,
  weight INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payment_accounts_status ON public.payment_accounts(status);
CREATE INDEX IF NOT EXISTS idx_payment_accounts_priority ON public.payment_accounts(priority);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_accounts TO authenticated;
GRANT ALL ON public.payment_accounts TO service_role;
ALTER TABLE public.payment_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_accounts admin all"
  ON public.payment_accounts FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_payment_accounts_updated_at
  BEFORE UPDATE ON public.payment_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- payment_account_versions
-- =========================================================
CREATE TABLE IF NOT EXISTS public.payment_account_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.payment_accounts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  previous_qr_url TEXT,
  qr_image_url TEXT,
  upi_id TEXT,
  merchant_name TEXT,
  reason TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (account_id, version_number)
);
CREATE INDEX IF NOT EXISTS idx_payment_account_versions_account
  ON public.payment_account_versions(account_id, version_number DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_account_versions TO authenticated;
GRANT ALL ON public.payment_account_versions TO service_role;
ALTER TABLE public.payment_account_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_account_versions admin all"
  ON public.payment_account_versions FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =========================================================
-- payment_gateway_settings (singleton)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.payment_gateway_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton BOOLEAN NOT NULL DEFAULT true UNIQUE,
  routing_mode TEXT NOT NULL DEFAULT 'manual'
    CHECK (routing_mode IN ('manual','round_robin','weighted','course_specific')),
  active_account_id UUID REFERENCES public.payment_accounts(id) ON DELETE SET NULL,
  round_robin_cursor INTEGER NOT NULL DEFAULT 0,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_gateway_settings TO authenticated;
GRANT ALL ON public.payment_gateway_settings TO service_role;
ALTER TABLE public.payment_gateway_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_gateway_settings admin all"
  ON public.payment_gateway_settings FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_payment_gateway_settings_updated_at
  BEFORE UPDATE ON public.payment_gateway_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed singleton
INSERT INTO public.payment_gateway_settings (singleton, routing_mode)
VALUES (true, 'manual')
ON CONFLICT (singleton) DO NOTHING;

-- =========================================================
-- payment_account_course_assignments
-- =========================================================
CREATE TABLE IF NOT EXISTS public.payment_account_course_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.payment_accounts(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id)
);
CREATE INDEX IF NOT EXISTS idx_payment_account_course_assignments_account
  ON public.payment_account_course_assignments(account_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_account_course_assignments TO authenticated;
GRANT ALL ON public.payment_account_course_assignments TO service_role;
ALTER TABLE public.payment_account_course_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_account_course_assignments admin all"
  ON public.payment_account_course_assignments FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =========================================================
-- course_payments: snapshot new gateway fields (additive)
-- =========================================================
ALTER TABLE public.course_payments
  ADD COLUMN IF NOT EXISTS payment_account_id UUID REFERENCES public.payment_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS account_version_used INTEGER;
CREATE INDEX IF NOT EXISTS idx_course_payments_account
  ON public.course_payments(payment_account_id);
