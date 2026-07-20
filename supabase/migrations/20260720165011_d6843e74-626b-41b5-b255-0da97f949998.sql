
-- =========================================================
-- Enterprise Brand Kit
-- =========================================================

CREATE TABLE public.mkt_brand_kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id uuid REFERENCES public.mkt_brands(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text UNIQUE,
  is_default boolean NOT NULL DEFAULT false,

  -- Brand profile
  business_name text,
  tagline text,
  description text,
  mission text,
  vision text,
  core_values text[] NOT NULL DEFAULT '{}',
  industry text,
  website text,
  support_email text,
  phone text,
  address text,
  social_links jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Personality / voice / audience
  personality text[] NOT NULL DEFAULT '{}',           -- ["Professional","Bold",...]
  tone_of_voice text[] NOT NULL DEFAULT '{}',
  writing_style text[] NOT NULL DEFAULT '{}',
  reading_level text,                                  -- School | College | Professional | Executive
  target_audience jsonb NOT NULL DEFAULT '{}'::jsonb,  -- {segments:[], personas:[]}

  -- Visual identity
  colors jsonb NOT NULL DEFAULT '{}'::jsonb,           -- {primary,secondary,accent,success,warning,error,neutral,dark,light}
  typography jsonb NOT NULL DEFAULT '{}'::jsonb,       -- {primary,secondary,heading,body,button,fallback}
  logos jsonb NOT NULL DEFAULT '{}'::jsonb,            -- {primary,dark,light,icon,favicon,minSize,safeArea}

  -- Guidelines & rules
  guidelines jsonb NOT NULL DEFAULT '{}'::jsonb,       -- {logo_usage,spacing,color_usage,typography_rules,illustration_style,...}
  writing_rules jsonb NOT NULL DEFAULT '{}'::jsonb,    -- {preferred_words,avoid_words,mandatory_cta,mandatory_disclaimer,emoji_rules,capitalization,hashtag_rules}
  content_rules jsonb NOT NULL DEFAULT '{}'::jsonb,   -- {min_length,max_length,paragraph_length,sentence_length,cta_rules,hashtag_rules,seo_rules}
  compliance jsonb NOT NULL DEFAULT '{}'::jsonb,       -- {required_disclaimer,legal,privacy,education,financial,medical,custom}
  approval_policy jsonb NOT NULL DEFAULT '{}'::jsonb,  -- {brand_review,marketing_review,legal_review,auto_approval}

  -- AI + keywords
  ai_rules jsonb NOT NULL DEFAULT '{}'::jsonb,        -- {global_prompt,do_not_use,compliance_rules,extra_instructions}
  keywords jsonb NOT NULL DEFAULT '{}'::jsonb,        -- {primary,secondary,industry,seo,negative}

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mkt_brand_kits TO authenticated;
GRANT ALL ON public.mkt_brand_kits TO service_role;

CREATE INDEX mkt_brand_kits_owner_idx ON public.mkt_brand_kits(owner_id);
CREATE INDEX mkt_brand_kits_brand_idx ON public.mkt_brand_kits(brand_id);
CREATE UNIQUE INDEX mkt_brand_kits_owner_default_idx
  ON public.mkt_brand_kits(owner_id) WHERE is_default = true;

ALTER TABLE public.mkt_brand_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand_kits owner or staff read" ON public.mkt_brand_kits
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()));

CREATE POLICY "brand_kits owner or staff write" ON public.mkt_brand_kits
  FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))
  WITH CHECK (owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()));

-- =========================================================
-- Brand assets (media library)
-- =========================================================
CREATE TABLE public.mkt_brand_kit_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_kit_id uuid NOT NULL REFERENCES public.mkt_brand_kits(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder text NOT NULL DEFAULT 'general',          -- brand-images, product, course, team, illustrations, icons, videos, docs, etc.
  kind text NOT NULL,                              -- image | video | document | logo | icon | illustration
  title text,
  url text NOT NULL,
  thumbnail_url text,
  mime_type text,
  size_bytes bigint,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mkt_brand_kit_assets TO authenticated;
GRANT ALL ON public.mkt_brand_kit_assets TO service_role;

CREATE INDEX mkt_brand_kit_assets_kit_idx ON public.mkt_brand_kit_assets(brand_kit_id);
CREATE INDEX mkt_brand_kit_assets_folder_idx ON public.mkt_brand_kit_assets(brand_kit_id, folder);

ALTER TABLE public.mkt_brand_kit_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand_kit_assets owner or staff read" ON public.mkt_brand_kit_assets
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()));

CREATE POLICY "brand_kit_assets owner or staff write" ON public.mkt_brand_kit_assets
  FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))
  WITH CHECK (owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()));

-- =========================================================
-- Brand templates (per channel)
-- =========================================================
CREATE TABLE public.mkt_brand_kit_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_kit_id uuid NOT NULL REFERENCES public.mkt_brand_kits(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel text NOT NULL,      -- instagram | linkedin | facebook | thread | blog | email | landing | x | youtube | tiktok
  name text NOT NULL,
  body text NOT NULL,
  variables jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mkt_brand_kit_templates TO authenticated;
GRANT ALL ON public.mkt_brand_kit_templates TO service_role;

CREATE INDEX mkt_brand_kit_templates_kit_idx ON public.mkt_brand_kit_templates(brand_kit_id);
CREATE INDEX mkt_brand_kit_templates_channel_idx ON public.mkt_brand_kit_templates(brand_kit_id, channel);

ALTER TABLE public.mkt_brand_kit_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand_kit_templates owner or staff read" ON public.mkt_brand_kit_templates
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()));

CREATE POLICY "brand_kit_templates owner or staff write" ON public.mkt_brand_kit_templates
  FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))
  WITH CHECK (owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()));

-- =========================================================
-- Brand versions (history)
-- =========================================================
CREATE TABLE public.mkt_brand_kit_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_kit_id uuid NOT NULL REFERENCES public.mkt_brand_kits(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version int NOT NULL,
  snapshot jsonb NOT NULL,
  note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mkt_brand_kit_versions TO authenticated;
GRANT ALL ON public.mkt_brand_kit_versions TO service_role;

CREATE INDEX mkt_brand_kit_versions_kit_idx ON public.mkt_brand_kit_versions(brand_kit_id, version DESC);

ALTER TABLE public.mkt_brand_kit_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand_kit_versions owner or staff read" ON public.mkt_brand_kit_versions
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()));

CREATE POLICY "brand_kit_versions owner or staff write" ON public.mkt_brand_kit_versions
  FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))
  WITH CHECK (owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()));

-- =========================================================
-- updated_at triggers
-- =========================================================
CREATE OR REPLACE FUNCTION public.mkt_brand_kits_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER mkt_brand_kits_updated_at BEFORE UPDATE ON public.mkt_brand_kits
FOR EACH ROW EXECUTE FUNCTION public.mkt_brand_kits_touch_updated_at();

CREATE TRIGGER mkt_brand_kit_assets_updated_at BEFORE UPDATE ON public.mkt_brand_kit_assets
FOR EACH ROW EXECUTE FUNCTION public.mkt_brand_kits_touch_updated_at();

CREATE TRIGGER mkt_brand_kit_templates_updated_at BEFORE UPDATE ON public.mkt_brand_kit_templates
FOR EACH ROW EXECUTE FUNCTION public.mkt_brand_kits_touch_updated_at();
