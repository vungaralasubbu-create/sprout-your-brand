
-- ============================================================
-- AI Marketing Automation Platform
-- ============================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE public.mkt_channel_kind AS ENUM (
    'linkedin','instagram','facebook','twitter','threads',
    'youtube_community','telegram','whatsapp_channel','blog','email'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.mkt_content_type AS ENUM (
    'course_launch','career_tip','hiring_update','success_story','project_showcase',
    'tech_news','ai_news','learning_tip','certification_promo','webinar','event',
    'discount_campaign','internship','partner_announcement','custom'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.mkt_status AS ENUM ('draft','pending_review','approved','rejected','scheduled','publishing','published','failed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.mkt_approval_mode AS ENUM ('auto','manual','team_review');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.mkt_asset_kind AS ENUM (
    'square','portrait','landscape','carousel_slide','quote','infographic',
    'story','event_poster','course_poster','video','thumbnail'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Helper: updated_at trigger fn (reuse existing name if present)
CREATE OR REPLACE FUNCTION public.mkt_touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Helper: staff check (reuses has_role if present, otherwise falls back to false)
CREATE OR REPLACE FUNCTION public.mkt_is_staff(_uid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _uid
      AND ur.role::text = ANY (ARRAY['super_admin','admin','staff','marketing_admin'])
  );
$$;

-- ============================================================
-- mkt_brands
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mkt_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE,
  tone text,
  voice_notes text,
  primary_color text,
  accent_color text,
  logo_url text,
  default_timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  default_approval_mode public.mkt_approval_mode NOT NULL DEFAULT 'manual',
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mkt_brands TO authenticated;
GRANT ALL ON public.mkt_brands TO service_role;
ALTER TABLE public.mkt_brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brands owner or staff read" ON public.mkt_brands FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()));
CREATE POLICY "brands owner or staff write" ON public.mkt_brands FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))
  WITH CHECK (owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()));
CREATE TRIGGER mkt_brands_touch BEFORE UPDATE ON public.mkt_brands
  FOR EACH ROW EXECUTE FUNCTION public.mkt_touch_updated_at();
CREATE INDEX IF NOT EXISTS mkt_brands_owner_idx ON public.mkt_brands(owner_id);

-- ============================================================
-- mkt_channels
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mkt_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.mkt_brands(id) ON DELETE CASCADE,
  kind public.mkt_channel_kind NOT NULL,
  display_name text NOT NULL,
  handle text,
  credentials_ref text,           -- secret name / connection id (never raw creds)
  connector_id text,              -- linked connector, if any
  enabled boolean NOT NULL DEFAULT true,
  auto_publish boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_health text,
  last_health_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand_id, kind, handle)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mkt_channels TO authenticated;
GRANT ALL ON public.mkt_channels TO service_role;
ALTER TABLE public.mkt_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "channels via brand" ON public.mkt_channels FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mkt_brands b WHERE b.id = brand_id AND (b.owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.mkt_brands b WHERE b.id = brand_id AND (b.owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))));
CREATE TRIGGER mkt_channels_touch BEFORE UPDATE ON public.mkt_channels
  FOR EACH ROW EXECUTE FUNCTION public.mkt_touch_updated_at();
CREATE INDEX IF NOT EXISTS mkt_channels_brand_idx ON public.mkt_channels(brand_id);

-- ============================================================
-- mkt_campaigns
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mkt_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.mkt_brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  objective text,
  starts_at timestamptz,
  ends_at timestamptz,
  approval_mode public.mkt_approval_mode NOT NULL DEFAULT 'manual',
  budget_cents integer,
  status text NOT NULL DEFAULT 'active',
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mkt_campaigns TO authenticated;
GRANT ALL ON public.mkt_campaigns TO service_role;
ALTER TABLE public.mkt_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaigns via brand" ON public.mkt_campaigns FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mkt_brands b WHERE b.id = brand_id AND (b.owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.mkt_brands b WHERE b.id = brand_id AND (b.owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))));
CREATE TRIGGER mkt_campaigns_touch BEFORE UPDATE ON public.mkt_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.mkt_touch_updated_at();
CREATE INDEX IF NOT EXISTS mkt_campaigns_brand_idx ON public.mkt_campaigns(brand_id);

-- ============================================================
-- mkt_content_items
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mkt_content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.mkt_brands(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.mkt_campaigns(id) ON DELETE SET NULL,
  content_type public.mkt_content_type NOT NULL DEFAULT 'custom',
  title text,
  brief text,
  source_kind text,   -- 'course','blog','event','story','custom'
  source_ref text,    -- id/slug of source entity
  prompt text,
  language text DEFAULT 'en',
  status public.mkt_status NOT NULL DEFAULT 'draft',
  approval_mode public.mkt_approval_mode NOT NULL DEFAULT 'manual',
  created_by uuid REFERENCES auth.users(id),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mkt_content_items TO authenticated;
GRANT ALL ON public.mkt_content_items TO service_role;
ALTER TABLE public.mkt_content_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content via brand" ON public.mkt_content_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mkt_brands b WHERE b.id = brand_id AND (b.owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.mkt_brands b WHERE b.id = brand_id AND (b.owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))));
CREATE TRIGGER mkt_content_items_touch BEFORE UPDATE ON public.mkt_content_items
  FOR EACH ROW EXECUTE FUNCTION public.mkt_touch_updated_at();
CREATE INDEX IF NOT EXISTS mkt_content_items_brand_idx ON public.mkt_content_items(brand_id);
CREATE INDEX IF NOT EXISTS mkt_content_items_campaign_idx ON public.mkt_content_items(campaign_id);
CREATE INDEX IF NOT EXISTS mkt_content_items_status_idx ON public.mkt_content_items(status);

-- ============================================================
-- mkt_content_variants
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mkt_content_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES public.mkt_content_items(id) ON DELETE CASCADE,
  channel_kind public.mkt_channel_kind NOT NULL,
  variant_label text,           -- 'short','long','linkedin','instagram','email','blog','x','fb'
  headline text,
  caption text,
  body text,
  cta text,
  hashtags text[],
  seo_title text,
  seo_description text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mkt_content_variants TO authenticated;
GRANT ALL ON public.mkt_content_variants TO service_role;
ALTER TABLE public.mkt_content_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "variants via content" ON public.mkt_content_variants FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.mkt_content_items c
    JOIN public.mkt_brands b ON b.id = c.brand_id
    WHERE c.id = content_id AND (b.owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.mkt_content_items c
    JOIN public.mkt_brands b ON b.id = c.brand_id
    WHERE c.id = content_id AND (b.owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))));
CREATE TRIGGER mkt_content_variants_touch BEFORE UPDATE ON public.mkt_content_variants
  FOR EACH ROW EXECUTE FUNCTION public.mkt_touch_updated_at();
CREATE INDEX IF NOT EXISTS mkt_variants_content_idx ON public.mkt_content_variants(content_id);
CREATE INDEX IF NOT EXISTS mkt_variants_channel_idx ON public.mkt_content_variants(channel_kind);

-- ============================================================
-- mkt_assets
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mkt_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid REFERENCES public.mkt_content_items(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.mkt_content_variants(id) ON DELETE SET NULL,
  kind public.mkt_asset_kind NOT NULL,
  url text NOT NULL,
  width integer,
  height integer,
  prompt text,
  provider text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mkt_assets TO authenticated;
GRANT ALL ON public.mkt_assets TO service_role;
ALTER TABLE public.mkt_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assets via content" ON public.mkt_assets FOR ALL TO authenticated
  USING (content_id IS NULL OR EXISTS (
    SELECT 1 FROM public.mkt_content_items c JOIN public.mkt_brands b ON b.id = c.brand_id
    WHERE c.id = content_id AND (b.owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))))
  WITH CHECK (content_id IS NULL OR EXISTS (
    SELECT 1 FROM public.mkt_content_items c JOIN public.mkt_brands b ON b.id = c.brand_id
    WHERE c.id = content_id AND (b.owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))));
CREATE INDEX IF NOT EXISTS mkt_assets_content_idx ON public.mkt_assets(content_id);
CREATE INDEX IF NOT EXISTS mkt_assets_variant_idx ON public.mkt_assets(variant_id);

-- ============================================================
-- mkt_schedules
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mkt_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.mkt_brands(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.mkt_campaigns(id) ON DELETE SET NULL,
  content_id uuid REFERENCES public.mkt_content_items(id) ON DELETE CASCADE,
  mode text NOT NULL,                  -- 'immediate','once','daily','weekly','monthly','cron','campaign'
  run_at timestamptz,
  cron text,
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  channels public.mkt_channel_kind[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mkt_schedules TO authenticated;
GRANT ALL ON public.mkt_schedules TO service_role;
ALTER TABLE public.mkt_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schedules via brand" ON public.mkt_schedules FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mkt_brands b WHERE b.id = brand_id AND (b.owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.mkt_brands b WHERE b.id = brand_id AND (b.owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))));
CREATE TRIGGER mkt_schedules_touch BEFORE UPDATE ON public.mkt_schedules
  FOR EACH ROW EXECUTE FUNCTION public.mkt_touch_updated_at();
CREATE INDEX IF NOT EXISTS mkt_schedules_next_idx ON public.mkt_schedules(next_run_at) WHERE active;

-- ============================================================
-- mkt_posts (publishing queue)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mkt_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.mkt_brands(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.mkt_campaigns(id) ON DELETE SET NULL,
  content_id uuid NOT NULL REFERENCES public.mkt_content_items(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.mkt_content_variants(id) ON DELETE SET NULL,
  channel_id uuid REFERENCES public.mkt_channels(id) ON DELETE SET NULL,
  channel_kind public.mkt_channel_kind NOT NULL,
  status public.mkt_status NOT NULL DEFAULT 'scheduled',
  due_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  last_error text,
  external_id text,
  external_url text,
  provider_response jsonb,
  published_at timestamptz,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mkt_posts TO authenticated;
GRANT ALL ON public.mkt_posts TO service_role;
ALTER TABLE public.mkt_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts via brand" ON public.mkt_posts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mkt_brands b WHERE b.id = brand_id AND (b.owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.mkt_brands b WHERE b.id = brand_id AND (b.owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))));
CREATE TRIGGER mkt_posts_touch BEFORE UPDATE ON public.mkt_posts
  FOR EACH ROW EXECUTE FUNCTION public.mkt_touch_updated_at();
CREATE INDEX IF NOT EXISTS mkt_posts_due_idx ON public.mkt_posts(status, due_at);
CREATE INDEX IF NOT EXISTS mkt_posts_brand_idx ON public.mkt_posts(brand_id);
CREATE INDEX IF NOT EXISTS mkt_posts_channel_idx ON public.mkt_posts(channel_kind);

-- ============================================================
-- mkt_analytics
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mkt_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.mkt_brands(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.mkt_posts(id) ON DELETE CASCADE,
  channel_kind public.mkt_channel_kind NOT NULL,
  measured_at timestamptz NOT NULL DEFAULT now(),
  reach integer DEFAULT 0,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  likes integer DEFAULT 0,
  shares integer DEFAULT 0,
  comments integer DEFAULT 0,
  saves integer DEFAULT 0,
  followers_delta integer DEFAULT 0,
  ctr numeric(6,4) DEFAULT 0,
  engagement_rate numeric(6,4) DEFAULT 0,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mkt_analytics TO authenticated;
GRANT ALL ON public.mkt_analytics TO service_role;
ALTER TABLE public.mkt_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analytics via brand" ON public.mkt_analytics FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mkt_brands b WHERE b.id = brand_id AND (b.owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.mkt_brands b WHERE b.id = brand_id AND (b.owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))));
CREATE INDEX IF NOT EXISTS mkt_analytics_post_idx ON public.mkt_analytics(post_id);
CREATE INDEX IF NOT EXISTS mkt_analytics_brand_idx ON public.mkt_analytics(brand_id, measured_at DESC);

-- ============================================================
-- mkt_calendar_events
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mkt_calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES public.mkt_brands(id) ON DELETE CASCADE,
  event_date date NOT NULL,
  category text NOT NULL,           -- 'tech_day','festival','trend','launch','hiring_season','event'
  title text NOT NULL,
  description text,
  suggested_type public.mkt_content_type,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mkt_calendar_events TO authenticated;
GRANT ALL ON public.mkt_calendar_events TO service_role;
ALTER TABLE public.mkt_calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "calendar read all auth" ON public.mkt_calendar_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "calendar write staff or brand owner" ON public.mkt_calendar_events FOR ALL TO authenticated
  USING (brand_id IS NULL AND public.mkt_is_staff(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.mkt_brands b WHERE b.id = brand_id AND (b.owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))))
  WITH CHECK (brand_id IS NULL AND public.mkt_is_staff(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.mkt_brands b WHERE b.id = brand_id AND (b.owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))));
CREATE INDEX IF NOT EXISTS mkt_calendar_date_idx ON public.mkt_calendar_events(event_date);

-- ============================================================
-- mkt_approvals
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mkt_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES public.mkt_content_items(id) ON DELETE CASCADE,
  requested_by uuid REFERENCES auth.users(id),
  reviewer_id uuid REFERENCES auth.users(id),
  decision text NOT NULL DEFAULT 'pending', -- 'pending','approved','rejected'
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mkt_approvals TO authenticated;
GRANT ALL ON public.mkt_approvals TO service_role;
ALTER TABLE public.mkt_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approvals via content" ON public.mkt_approvals FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.mkt_content_items c JOIN public.mkt_brands b ON b.id = c.brand_id
    WHERE c.id = content_id AND (b.owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.mkt_content_items c JOIN public.mkt_brands b ON b.id = c.brand_id
    WHERE c.id = content_id AND (b.owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))));

-- ============================================================
-- mkt_learnings (AI optimization memory)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mkt_learnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.mkt_brands(id) ON DELETE CASCADE,
  channel_kind public.mkt_channel_kind NOT NULL,
  metric text NOT NULL,   -- 'best_hashtags','best_caption_len','best_time','best_style','top_topics'
  value jsonb NOT NULL,
  score numeric(8,4),
  sample_size integer DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand_id, channel_kind, metric)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mkt_learnings TO authenticated;
GRANT ALL ON public.mkt_learnings TO service_role;
ALTER TABLE public.mkt_learnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "learnings via brand" ON public.mkt_learnings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mkt_brands b WHERE b.id = brand_id AND (b.owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.mkt_brands b WHERE b.id = brand_id AND (b.owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))));
CREATE TRIGGER mkt_learnings_touch BEFORE UPDATE ON public.mkt_learnings
  FOR EACH ROW EXECUTE FUNCTION public.mkt_touch_updated_at();
