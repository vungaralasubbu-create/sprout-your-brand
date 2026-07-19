
-- Global partner/tech logos library + per-brand branding overrides for emails.

CREATE TABLE IF NOT EXISTS public.email_partner_logos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID NULL REFERENCES public.partner_brand_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  logo_url_dark TEXT NULL,
  link_url TEXT NULL,
  category TEXT NOT NULL DEFAULT 'partner',
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_partner_logos_brand_idx ON public.email_partner_logos(brand_id, enabled, sort_order);
CREATE INDEX IF NOT EXISTS email_partner_logos_category_idx ON public.email_partner_logos(category);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_partner_logos TO authenticated;
GRANT ALL ON public.email_partner_logos TO service_role;

ALTER TABLE public.email_partner_logos ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read enabled logos (used to render email previews).
CREATE POLICY "Read enabled email logos"
  ON public.email_partner_logos FOR SELECT
  TO authenticated
  USING (true);

-- Super admins manage global logos (brand_id IS NULL) and any brand-scoped logos.
CREATE POLICY "Super admins manage all email logos"
  ON public.email_partner_logos FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Brand owners manage their own brand-scoped logos.
CREATE POLICY "Brand owners manage their brand logos"
  ON public.email_partner_logos FOR ALL
  TO authenticated
  USING (
    brand_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.partner_brand_profiles p
      WHERE p.id = brand_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    brand_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.partner_brand_profiles p
      WHERE p.id = brand_id AND p.user_id = auth.uid()
    )
  );

CREATE TRIGGER update_email_partner_logos_updated_at
  BEFORE UPDATE ON public.email_partner_logos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Per-brand email branding (colors, logo, footer copy, socials, contact).
CREATE TABLE IF NOT EXISTS public.email_brand_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID NULL UNIQUE REFERENCES public.partner_brand_profiles(id) ON DELETE CASCADE,
  is_platform BOOLEAN NOT NULL DEFAULT false,
  brand_name TEXT NULL,
  logo_url TEXT NULL,
  logo_url_dark TEXT NULL,
  favicon_url TEXT NULL,
  primary_color TEXT NULL,
  accent_color TEXT NULL,
  header_background TEXT NULL,
  footer_background TEXT NULL,
  website_url TEXT NULL,
  support_email TEXT NULL,
  support_phone TEXT NULL,
  address TEXT NULL,
  footer_tagline TEXT NULL,
  social_twitter TEXT NULL,
  social_linkedin TEXT NULL,
  social_instagram TEXT NULL,
  social_facebook TEXT NULL,
  social_youtube TEXT NULL,
  show_partner_logos BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS email_brand_settings_platform_uidx
  ON public.email_brand_settings(is_platform) WHERE is_platform = true;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_brand_settings TO authenticated;
GRANT ALL ON public.email_brand_settings TO service_role;

ALTER TABLE public.email_brand_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read email brand settings"
  ON public.email_brand_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins manage all email brand settings"
  ON public.email_brand_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Brand owners manage their brand settings"
  ON public.email_brand_settings FOR ALL
  TO authenticated
  USING (
    brand_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.partner_brand_profiles p
      WHERE p.id = brand_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    brand_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.partner_brand_profiles p
      WHERE p.id = brand_id AND p.user_id = auth.uid()
    )
  );

CREATE TRIGGER update_email_brand_settings_updated_at
  BEFORE UPDATE ON public.email_brand_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the platform-level defaults + curated tech partner logos.
INSERT INTO public.email_brand_settings (
  is_platform, brand_name, primary_color, accent_color, header_background, footer_background,
  website_url, support_email, footer_tagline
) VALUES (
  true, 'Glintr', '#0891b2', '#84cc16', '#0f172a', '#0f172a',
  'https://glintr.com', 'support@glintr.com', 'Launch. Sell. Grow.'
) ON CONFLICT DO NOTHING;

INSERT INTO public.email_partner_logos (brand_id, name, logo_url, link_url, category, sort_order) VALUES
  (NULL, 'Microsoft', 'https://cdn.simpleicons.org/microsoft/ffffff', 'https://microsoft.com', 'tech', 10),
  (NULL, 'Google', 'https://cdn.simpleicons.org/google/ffffff', 'https://google.com', 'tech', 20),
  (NULL, 'Amazon Web Services', 'https://cdn.simpleicons.org/amazonwebservices/ffffff', 'https://aws.amazon.com', 'cloud', 30),
  (NULL, 'Oracle', 'https://cdn.simpleicons.org/oracle/ffffff', 'https://oracle.com', 'tech', 40),
  (NULL, 'IBM', 'https://cdn.simpleicons.org/ibm/ffffff', 'https://ibm.com', 'tech', 50),
  (NULL, 'Adobe', 'https://cdn.simpleicons.org/adobe/ffffff', 'https://adobe.com', 'tech', 60),
  (NULL, 'Meta', 'https://cdn.simpleicons.org/meta/ffffff', 'https://about.meta.com', 'tech', 70),
  (NULL, 'Cisco', 'https://cdn.simpleicons.org/cisco/ffffff', 'https://cisco.com', 'tech', 80),
  (NULL, 'Intel', 'https://cdn.simpleicons.org/intel/ffffff', 'https://intel.com', 'tech', 90),
  (NULL, 'Salesforce', 'https://cdn.simpleicons.org/salesforce/ffffff', 'https://salesforce.com', 'tech', 100),
  (NULL, 'NVIDIA', 'https://cdn.simpleicons.org/nvidia/ffffff', 'https://nvidia.com', 'tech', 110),
  (NULL, 'GitHub', 'https://cdn.simpleicons.org/github/ffffff', 'https://github.com', 'tech', 120),
  (NULL, 'Docker', 'https://cdn.simpleicons.org/docker/ffffff', 'https://docker.com', 'tech', 130),
  (NULL, 'Kubernetes', 'https://cdn.simpleicons.org/kubernetes/ffffff', 'https://kubernetes.io', 'tech', 140),
  (NULL, 'MongoDB', 'https://cdn.simpleicons.org/mongodb/ffffff', 'https://mongodb.com', 'tech', 150),
  (NULL, 'MySQL', 'https://cdn.simpleicons.org/mysql/ffffff', 'https://mysql.com', 'tech', 160),
  (NULL, 'PostgreSQL', 'https://cdn.simpleicons.org/postgresql/ffffff', 'https://postgresql.org', 'tech', 170),
  (NULL, 'Linux Foundation', 'https://cdn.simpleicons.org/linuxfoundation/ffffff', 'https://linuxfoundation.org', 'certification', 180),
  (NULL, 'CompTIA', 'https://cdn.simpleicons.org/comptia/ffffff', 'https://comptia.org', 'certification', 190),
  (NULL, 'EC-Council', 'https://eccouncil.org/wp-content/uploads/2020/04/EC-Council-Logo.png', 'https://eccouncil.org', 'certification', 200),
  (NULL, 'ISC²', 'https://www.isc2.org/-/media/ISC2/Logos/isc2-primary-logo.svg', 'https://isc2.org', 'certification', 210)
ON CONFLICT DO NOTHING;
