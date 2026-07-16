-- Allow public read of pricing.* settings so front-end can render EMI/currency without auth
DROP POLICY IF EXISTS "Public can read pricing settings" ON public.platform_settings;
CREATE POLICY "Public can read pricing settings" ON public.platform_settings
  FOR SELECT USING (key LIKE 'pricing.%');
GRANT SELECT ON public.platform_settings TO anon;