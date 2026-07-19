
-- =========================================================================
-- Campaign Orchestrator schema
-- All AI generation flows through the centralized AI Router (OpenAI native),
-- never through Lovable AI. Providers for image/video/voice are pluggable.
-- =========================================================================

DO $$ BEGIN
  CREATE TYPE public.co_campaign_kind AS ENUM (
    'course_launch','admissions','internship','hiring','scholarship',
    'live_class','masterclass','discount','festival','referral',
    'certification','partner_announcement','placement_drive','brand_awareness',
    'email_campaign','webinar','bootcamp','ai_news','tech_update','success_story',
    'custom'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.co_campaign_status AS ENUM (
    'draft','planning','generating','review','approved','scheduled',
    'publishing','running','paused','completed','archived','failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.co_task_kind AS ENUM (
    'landing_page','blog','seo_meta','linkedin_post','linkedin_carousel',
    'instagram_post','instagram_carousel','instagram_story','facebook_post',
    'telegram_message','whatsapp_message','x_post','threads_post',
    'youtube_community','email_welcome','email_campaign','email_reminder',
    'email_last_chance','email_certificate','email_enrollment','newsletter',
    'push_notification','video_reel','video_short','video_promo','video_explainer',
    'video_ad','video_story','video_intro','voice_narration','poster','banner',
    'carousel_slide','story_creative','course_cover','thumbnail','infographic',
    'certificate_promo','faq'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.co_task_status AS ENUM (
    'queued','generating','ready','failed','approved','rejected','scheduled','published'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.co_approval_stage AS ENUM (
    'marketing','seo','brand','final'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.co_approval_state AS ENUM ('pending','approved','rejected','changes_requested');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Master campaign record --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.co_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT,
  kind public.co_campaign_kind NOT NULL DEFAULT 'custom',
  status public.co_campaign_status NOT NULL DEFAULT 'draft',
  priority SMALLINT NOT NULL DEFAULT 3,
  objective TEXT,
  prompt TEXT,
  audience JSONB NOT NULL DEFAULT '{}'::jsonb,
  geo JSONB NOT NULL DEFAULT '{}'::jsonb,
  language TEXT DEFAULT 'en',
  budget NUMERIC(12,2),
  currency TEXT DEFAULT 'INR',
  platforms TEXT[] NOT NULL DEFAULT '{}',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  duration_days INTEGER,
  brand_kit_id UUID,
  primary_cta TEXT,
  secondary_cta TEXT,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  landing_goal TEXT,
  offer JSONB NOT NULL DEFAULT '{}'::jsonb,
  coupon_code TEXT,
  plan JSONB NOT NULL DEFAULT '{}'::jsonb,
  kpis JSONB NOT NULL DEFAULT '{}'::jsonb,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_co_campaigns_owner ON public.co_campaigns(owner_id);
CREATE INDEX IF NOT EXISTS idx_co_campaigns_status ON public.co_campaigns(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_co_campaigns_kind ON public.co_campaigns(kind);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.co_campaigns TO authenticated;
GRANT ALL ON public.co_campaigns TO service_role;
ALTER TABLE public.co_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "co_campaigns_owner_rw" ON public.co_campaigns
  FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- Individual generation task per content piece ----------------------------
CREATE TABLE IF NOT EXISTS public.co_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.co_campaigns(id) ON DELETE CASCADE,
  kind public.co_task_kind NOT NULL,
  channel TEXT,
  status public.co_task_status NOT NULL DEFAULT 'queued',
  brief JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB NOT NULL DEFAULT '{}'::jsonb,
  asset_id UUID,
  retries INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  error TEXT,
  provider TEXT,
  model TEXT,
  cost_estimate NUMERIC(10,4),
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_co_tasks_campaign ON public.co_tasks(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_co_tasks_status ON public.co_tasks(status, scheduled_at NULLS LAST);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.co_tasks TO authenticated;
GRANT ALL ON public.co_tasks TO service_role;
ALTER TABLE public.co_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "co_tasks_via_campaign" ON public.co_tasks
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.co_campaigns c WHERE c.id = campaign_id AND (c.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.co_campaigns c WHERE c.id = campaign_id AND (c.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))));

-- Generated assets (text / image / video / voice / landing) --------------
CREATE TABLE IF NOT EXISTS public.co_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.co_campaigns(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.co_tasks(id) ON DELETE SET NULL,
  asset_type TEXT NOT NULL,
  format TEXT,
  channel TEXT,
  brand_kit_id UUID,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  storage_url TEXT,
  preview_url TEXT,
  moderation_status TEXT NOT NULL DEFAULT 'unreviewed',
  variant_of UUID REFERENCES public.co_assets(id) ON DELETE SET NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_co_assets_campaign ON public.co_assets(campaign_id, asset_type);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.co_assets TO authenticated;
GRANT ALL ON public.co_assets TO service_role;
ALTER TABLE public.co_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "co_assets_via_campaign" ON public.co_assets
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.co_campaigns c WHERE c.id = campaign_id AND (c.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.co_campaigns c WHERE c.id = campaign_id AND (c.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))));

-- Schedule entries -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.co_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.co_campaigns(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.co_tasks(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.co_assets(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  publish_status TEXT NOT NULL DEFAULT 'pending',
  external_id TEXT,
  external_url TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_co_schedule_campaign ON public.co_schedule(campaign_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_co_schedule_pending ON public.co_schedule(publish_status, scheduled_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.co_schedule TO authenticated;
GRANT ALL ON public.co_schedule TO service_role;
ALTER TABLE public.co_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "co_schedule_via_campaign" ON public.co_schedule
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.co_campaigns c WHERE c.id = campaign_id AND (c.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.co_campaigns c WHERE c.id = campaign_id AND (c.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))));

-- Approvals workflow -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.co_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.co_campaigns(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.co_tasks(id) ON DELETE CASCADE,
  stage public.co_approval_stage NOT NULL,
  state public.co_approval_state NOT NULL DEFAULT 'pending',
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_co_approvals_campaign ON public.co_approvals(campaign_id, stage);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.co_approvals TO authenticated;
GRANT ALL ON public.co_approvals TO service_role;
ALTER TABLE public.co_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "co_approvals_via_campaign" ON public.co_approvals
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.co_campaigns c WHERE c.id = campaign_id AND (c.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.co_campaigns c WHERE c.id = campaign_id AND (c.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))));

-- Daily analytics rollup -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.co_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.co_campaigns(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  channel TEXT,
  views BIGINT NOT NULL DEFAULT 0,
  reach BIGINT NOT NULL DEFAULT 0,
  impressions BIGINT NOT NULL DEFAULT 0,
  clicks BIGINT NOT NULL DEFAULT 0,
  ctr NUMERIC(6,4),
  conversions BIGINT NOT NULL DEFAULT 0,
  enrollments BIGINT NOT NULL DEFAULT 0,
  revenue NUMERIC(12,2) NOT NULL DEFAULT 0,
  shares BIGINT NOT NULL DEFAULT 0,
  likes BIGINT NOT NULL DEFAULT 0,
  comments BIGINT NOT NULL DEFAULT 0,
  watch_time_seconds BIGINT NOT NULL DEFAULT 0,
  open_rate NUMERIC(6,4),
  bounce_rate NUMERIC(6,4),
  cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  cost_per_lead NUMERIC(10,2),
  cost_per_enrollment NUMERIC(10,2),
  roi NUMERIC(8,3),
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, day, channel)
);
CREATE INDEX IF NOT EXISTS idx_co_analytics_campaign ON public.co_analytics(campaign_id, day DESC);

GRANT SELECT ON public.co_analytics TO authenticated;
GRANT ALL ON public.co_analytics TO service_role;
ALTER TABLE public.co_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "co_analytics_read_via_campaign" ON public.co_analytics
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.co_campaigns c WHERE c.id = campaign_id AND (c.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))));

-- A/B tests --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.co_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.co_campaigns(id) ON DELETE CASCADE,
  hypothesis TEXT,
  metric TEXT NOT NULL DEFAULT 'ctr',
  variant_asset_ids UUID[] NOT NULL DEFAULT '{}',
  winner_asset_id UUID REFERENCES public.co_assets(id) ON DELETE SET NULL,
  results JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  concluded_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_co_ab_tests_campaign ON public.co_ab_tests(campaign_id, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.co_ab_tests TO authenticated;
GRANT ALL ON public.co_ab_tests TO service_role;
ALTER TABLE public.co_ab_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "co_ab_tests_via_campaign" ON public.co_ab_tests
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.co_campaigns c WHERE c.id = campaign_id AND (c.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.co_campaigns c WHERE c.id = campaign_id AND (c.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))));

-- Optimization recommendations ------------------------------------------
CREATE TABLE IF NOT EXISTS public.co_optimizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.co_campaigns(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  detail TEXT,
  recommended_action JSONB NOT NULL DEFAULT '{}'::jsonb,
  applied BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_co_opt_campaign ON public.co_optimizations(campaign_id, created_at DESC);

GRANT SELECT ON public.co_optimizations TO authenticated;
GRANT UPDATE(applied) ON public.co_optimizations TO authenticated;
GRANT ALL ON public.co_optimizations TO service_role;
ALTER TABLE public.co_optimizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "co_opt_read_via_campaign" ON public.co_optimizations
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.co_campaigns c WHERE c.id = campaign_id AND (c.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))));

CREATE POLICY "co_opt_apply_via_campaign" ON public.co_optimizations
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.co_campaigns c WHERE c.id = campaign_id AND (c.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.co_campaigns c WHERE c.id = campaign_id AND (c.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))));

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.co_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $fn$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $fn$;

DROP TRIGGER IF EXISTS trg_co_campaigns_touch ON public.co_campaigns;
CREATE TRIGGER trg_co_campaigns_touch BEFORE UPDATE ON public.co_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.co_touch_updated_at();

DROP TRIGGER IF EXISTS trg_co_tasks_touch ON public.co_tasks;
CREATE TRIGGER trg_co_tasks_touch BEFORE UPDATE ON public.co_tasks
  FOR EACH ROW EXECUTE FUNCTION public.co_touch_updated_at();

DROP TRIGGER IF EXISTS trg_co_schedule_touch ON public.co_schedule;
CREATE TRIGGER trg_co_schedule_touch BEFORE UPDATE ON public.co_schedule
  FOR EACH ROW EXECUTE FUNCTION public.co_touch_updated_at();
