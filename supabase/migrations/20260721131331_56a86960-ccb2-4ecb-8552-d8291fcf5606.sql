
-- Centralized course payment system (additive)

-- 1) payment_settings — singleton config
CREATE TABLE IF NOT EXISTS public.payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_image_url text,
  upi_id text,
  merchant_name text,
  support_email text,
  support_phone text,
  instructions text,
  is_active boolean NOT NULL DEFAULT true,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_settings TO authenticated;
GRANT ALL ON public.payment_settings TO service_role;

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_settings_read_authenticated"
  ON public.payment_settings FOR SELECT TO authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "payment_settings_admin_write"
  ON public.payment_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2) course_payments — one per checkout attempt
CREATE TABLE IF NOT EXISTS public.course_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  enrollment_id uuid REFERENCES public.enrollments(id) ON DELETE SET NULL,

  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  college text,
  degree text,
  graduation_year integer,
  city text,
  state text,
  country text,

  referral_code text,
  coupon_code text,

  base_amount_inr numeric(12,2) NOT NULL DEFAULT 0,
  discount_inr numeric(12,2) NOT NULL DEFAULT 0,
  final_amount_inr numeric(12,2) NOT NULL DEFAULT 0,

  utr_number text,
  screenshot_url text,

  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','submitted','verified','rejected','refunded')),
  rejection_reason text,
  info_request_note text,

  verified_by uuid,
  verified_at timestamptz,

  provider text NOT NULL DEFAULT 'upi_manual',
  provider_ref text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS course_payments_user_created_idx
  ON public.course_payments (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS course_payments_status_created_idx
  ON public.course_payments (status, created_at DESC);
CREATE INDEX IF NOT EXISTS course_payments_course_idx
  ON public.course_payments (course_id);
CREATE UNIQUE INDEX IF NOT EXISTS course_payments_utr_unique
  ON public.course_payments (utr_number)
  WHERE utr_number IS NOT NULL;

GRANT SELECT, INSERT, UPDATE ON public.course_payments TO authenticated;
GRANT ALL ON public.course_payments TO service_role;

ALTER TABLE public.course_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "course_payments_owner_select"
  ON public.course_payments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "course_payments_owner_insert"
  ON public.course_payments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "course_payments_owner_update_pending"
  ON public.course_payments FOR UPDATE TO authenticated
  USING (
    (user_id = auth.uid() AND status IN ('pending','submitted'))
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    (user_id = auth.uid() AND status IN ('pending','submitted'))
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "course_payments_admin_delete"
  ON public.course_payments FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3) course_payment_events — audit trail
CREATE TABLE IF NOT EXISTS public.course_payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES public.course_payments(id) ON DELETE CASCADE,
  type text NOT NULL,
  actor_user_id uuid,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS course_payment_events_payment_idx
  ON public.course_payment_events (payment_id, created_at DESC);

GRANT SELECT, INSERT ON public.course_payment_events TO authenticated;
GRANT ALL ON public.course_payment_events TO service_role;

ALTER TABLE public.course_payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "course_payment_events_admin_select"
  ON public.course_payment_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin')
         OR EXISTS (
           SELECT 1 FROM public.course_payments cp
           WHERE cp.id = payment_id AND cp.user_id = auth.uid()
         ));

CREATE POLICY "course_payment_events_insert_owner_or_admin"
  ON public.course_payment_events FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.course_payments cp
      WHERE cp.id = payment_id AND cp.user_id = auth.uid()
    )
  );

-- 4) updated_at triggers reuse the existing helper (public.update_updated_at_column)
--    Falls back if the helper name differs.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column' AND pronamespace = 'public'::regnamespace) THEN
    EXECUTE 'CREATE TRIGGER trg_payment_settings_updated_at BEFORE UPDATE ON public.payment_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
    EXECUTE 'CREATE TRIGGER trg_course_payments_updated_at BEFORE UPDATE ON public.course_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  ELSE
    CREATE OR REPLACE FUNCTION public._cp_touch_updated_at() RETURNS trigger AS $fn$
    BEGIN NEW.updated_at = now(); RETURN NEW; END;
    $fn$ LANGUAGE plpgsql SET search_path = public;
    EXECUTE 'CREATE TRIGGER trg_payment_settings_updated_at BEFORE UPDATE ON public.payment_settings FOR EACH ROW EXECUTE FUNCTION public._cp_touch_updated_at()';
    EXECUTE 'CREATE TRIGGER trg_course_payments_updated_at BEFORE UPDATE ON public.course_payments FOR EACH ROW EXECUTE FUNCTION public._cp_touch_updated_at()';
  END IF;
END $$;

-- 5) seed one payment_settings row so the payment page always has config to render
INSERT INTO public.payment_settings (upi_id, merchant_name, support_email, is_active, instructions)
SELECT 'payments@upi', 'Glintr', 'support@glintr.com', true,
       'Scan the QR code with any UPI app. After payment, enter the 12-digit UTR / reference number below.'
WHERE NOT EXISTS (SELECT 1 FROM public.payment_settings);
