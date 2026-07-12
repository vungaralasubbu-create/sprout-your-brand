
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

GRANT SELECT ON public.platform_settings TO anon;
GRANT SELECT ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read analytics settings"
  ON public.platform_settings FOR SELECT
  USING (key LIKE 'analytics.%');

CREATE POLICY "Admins manage all settings"
  ON public.platform_settings FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

INSERT INTO public.platform_settings (key, value) VALUES
  ('analytics.ga4_id', NULL),
  ('analytics.gtm_id', NULL),
  ('analytics.meta_pixel_id', NULL),
  ('analytics.google_ads_id', NULL)
ON CONFLICT (key) DO NOTHING;
