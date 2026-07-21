
-- Additive: QR versioning + branding + snapshot fields on course_payments.

ALTER TABLE public.payment_settings
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS success_message text,
  ADD COLUMN IF NOT EXISTS is_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS maintenance_mode boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- Backfill version numbers by created_at order.
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM public.payment_settings
)
UPDATE public.payment_settings ps SET version = ranked.rn
FROM ranked WHERE ps.id = ranked.id;

CREATE INDEX IF NOT EXISTS payment_settings_active_version_idx
  ON public.payment_settings (is_active, version DESC);

ALTER TABLE public.course_payments
  ADD COLUMN IF NOT EXISTS settings_id uuid REFERENCES public.payment_settings(id),
  ADD COLUMN IF NOT EXISTS qr_version_used integer,
  ADD COLUMN IF NOT EXISTS upi_id_used text,
  ADD COLUMN IF NOT EXISTS merchant_name_used text;

-- Extend read policy: any authenticated user can read the currently-enabled active
-- settings (needed for students on the payment page). History rows remain admin-only.
DROP POLICY IF EXISTS "payment_settings_read_authenticated" ON public.payment_settings;
CREATE POLICY "payment_settings_read_authenticated"
  ON public.payment_settings FOR SELECT
  TO authenticated
  USING (
    (is_active = true AND is_enabled = true)
    OR has_role(auth.uid(), 'admin'::app_role)
  );
