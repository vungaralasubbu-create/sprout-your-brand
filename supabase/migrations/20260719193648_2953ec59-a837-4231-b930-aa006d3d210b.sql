
-- ============================================================
-- AI VIDEO STUDIO SCHEMA
-- ============================================================

-- Enum types
DO $$ BEGIN
  CREATE TYPE public.vs_project_status AS ENUM (
    'draft','brief','storyboard','generating','ready','failed','archived','published'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.vs_job_status AS ENUM (
    'queued','running','succeeded','failed','cancelled','retrying'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.vs_asset_kind AS ENUM (
    'video','thumbnail','voice','music','subtitle_srt','subtitle_vtt','image','logo','project_file','scene_clip','preview','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.vs_video_format AS ENUM (
    'instagram_reel','youtube_short','tiktok','linkedin_video','facebook_video',
    'course_promo','webinar_promo','workshop_promo','internship_promo','hiring',
    'explainer','product_demo','feature_announcement','success_story','testimonial',
    'corporate','avatar','slideshow','educational','animated_presentation'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------
-- vs_brand_kits
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vs_brand_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  watermark_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  accent_color TEXT,
  font_heading TEXT,
  font_body TEXT,
  intro_asset_url TEXT,
  outro_asset_url TEXT,
  cta_style JSONB NOT NULL DEFAULT '{}'::jsonb,
  tone_of_voice TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vs_brand_kits TO authenticated;
GRANT ALL ON public.vs_brand_kits TO service_role;
ALTER TABLE public.vs_brand_kits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vs_brand_kits owner" ON public.vs_brand_kits FOR ALL
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- ------------------------------------------------------------
-- vs_providers (video / voice / music providers registry)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vs_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('video','voice','music','image','subtitle')),
  adapter TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INT NOT NULL DEFAULT 100,
  capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
  pricing JSONB NOT NULL DEFAULT '{}'::jsonb,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.vs_providers TO authenticated;
GRANT ALL ON public.vs_providers TO service_role;
ALTER TABLE public.vs_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vs_providers read" ON public.vs_providers FOR SELECT
  TO authenticated USING (is_active = true);

-- ------------------------------------------------------------
-- vs_voices catalog
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vs_voices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_slug TEXT NOT NULL,
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  gender TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  accent TEXT,
  style TEXT,
  preview_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider_slug, external_id)
);

GRANT SELECT ON public.vs_voices TO authenticated;
GRANT ALL ON public.vs_voices TO service_role;
ALTER TABLE public.vs_voices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vs_voices read" ON public.vs_voices FOR SELECT
  TO authenticated USING (is_active = true);

-- ------------------------------------------------------------
-- vs_templates
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vs_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  format public.vs_video_format NOT NULL,
  category TEXT,
  aspect_ratio TEXT NOT NULL DEFAULT '9:16',
  default_duration INT NOT NULL DEFAULT 30,
  style TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  storyboard JSONB NOT NULL DEFAULT '[]'::jsonb,
  brand_kit_id UUID REFERENCES public.vs_brand_kits(id) ON DELETE SET NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vs_templates TO authenticated;
GRANT ALL ON public.vs_templates TO service_role;
ALTER TABLE public.vs_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vs_templates read" ON public.vs_templates FOR SELECT
  TO authenticated USING (is_public = true OR owner_id = auth.uid());
CREATE POLICY "vs_templates write" ON public.vs_templates FOR ALL
  TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- ------------------------------------------------------------
-- vs_projects
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vs_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id UUID,
  brand_kit_id UUID REFERENCES public.vs_brand_kits(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.vs_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  format public.vs_video_format NOT NULL,
  status public.vs_project_status NOT NULL DEFAULT 'draft',
  topic TEXT,
  goal TEXT,
  target_audience TEXT,
  duration_seconds INT NOT NULL DEFAULT 30,
  language TEXT NOT NULL DEFAULT 'en',
  style TEXT,
  platform TEXT,
  aspect_ratio TEXT NOT NULL DEFAULT '9:16',
  resolution TEXT NOT NULL DEFAULT '1080p',
  cta TEXT,
  script TEXT,
  brief JSONB NOT NULL DEFAULT '{}'::jsonb,
  storyboard JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  seo JSONB NOT NULL DEFAULT '{}'::jsonb,
  cost_credits NUMERIC NOT NULL DEFAULT 0,
  generation_ms BIGINT NOT NULL DEFAULT 0,
  source_type TEXT,
  source_id UUID,
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vs_projects_owner_idx ON public.vs_projects(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS vs_projects_status_idx ON public.vs_projects(status);
CREATE INDEX IF NOT EXISTS vs_projects_source_idx ON public.vs_projects(source_type, source_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vs_projects TO authenticated;
GRANT ALL ON public.vs_projects TO service_role;
ALTER TABLE public.vs_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vs_projects owner" ON public.vs_projects FOR ALL
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- ------------------------------------------------------------
-- vs_scenes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vs_scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.vs_projects(id) ON DELETE CASCADE,
  scene_number INT NOT NULL,
  duration_seconds NUMERIC NOT NULL DEFAULT 5,
  narration TEXT,
  visual_prompt TEXT,
  video_prompt TEXT,
  transition TEXT,
  camera_movement TEXT,
  animation_type TEXT,
  overlay_text TEXT,
  background_audio TEXT,
  brand_assets JSONB NOT NULL DEFAULT '{}'::jsonb,
  video_asset_id UUID,
  voice_asset_id UUID,
  subtitle_asset_id UUID,
  status public.vs_job_status NOT NULL DEFAULT 'queued',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, scene_number)
);

CREATE INDEX IF NOT EXISTS vs_scenes_project_idx ON public.vs_scenes(project_id, scene_number);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vs_scenes TO authenticated;
GRANT ALL ON public.vs_scenes TO service_role;
ALTER TABLE public.vs_scenes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vs_scenes via project" ON public.vs_scenes FOR ALL
  USING (EXISTS (SELECT 1 FROM public.vs_projects p WHERE p.id = project_id AND p.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.vs_projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));

-- ------------------------------------------------------------
-- vs_assets (unified media store references)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vs_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.vs_projects(id) ON DELETE CASCADE,
  scene_id UUID REFERENCES public.vs_scenes(id) ON DELETE SET NULL,
  kind public.vs_asset_kind NOT NULL,
  url TEXT,
  storage_path TEXT,
  mime_type TEXT,
  duration_seconds NUMERIC,
  width INT,
  height INT,
  bytes BIGINT,
  language TEXT,
  provider_slug TEXT,
  provider_ref TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vs_assets_project_idx ON public.vs_assets(project_id, kind);
CREATE INDEX IF NOT EXISTS vs_assets_owner_idx ON public.vs_assets(owner_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vs_assets TO authenticated;
GRANT ALL ON public.vs_assets TO service_role;
ALTER TABLE public.vs_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vs_assets owner" ON public.vs_assets FOR ALL
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- ------------------------------------------------------------
-- vs_jobs (provider generation jobs / queue)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vs_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.vs_projects(id) ON DELETE CASCADE,
  scene_id UUID REFERENCES public.vs_scenes(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  provider_slug TEXT NOT NULL,
  status public.vs_job_status NOT NULL DEFAULT 'queued',
  priority INT NOT NULL DEFAULT 100,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB NOT NULL DEFAULT '{}'::jsonb,
  provider_ref TEXT,
  error TEXT,
  cost_credits NUMERIC NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  next_poll_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vs_jobs_status_idx ON public.vs_jobs(status, next_poll_at);
CREATE INDEX IF NOT EXISTS vs_jobs_project_idx ON public.vs_jobs(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS vs_jobs_owner_idx ON public.vs_jobs(owner_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vs_jobs TO authenticated;
GRANT ALL ON public.vs_jobs TO service_role;
ALTER TABLE public.vs_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vs_jobs owner" ON public.vs_jobs FOR ALL
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- ------------------------------------------------------------
-- vs_versions (project version history)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vs_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.vs_projects(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  snapshot JSONB NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, version_number)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vs_versions TO authenticated;
GRANT ALL ON public.vs_versions TO service_role;
ALTER TABLE public.vs_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vs_versions via project" ON public.vs_versions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.vs_projects p WHERE p.id = project_id AND p.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.vs_projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));

-- ------------------------------------------------------------
-- vs_analytics
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vs_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.vs_projects(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT,
  views BIGINT NOT NULL DEFAULT 0,
  watch_time_seconds BIGINT NOT NULL DEFAULT 0,
  completion_rate NUMERIC NOT NULL DEFAULT 0,
  ctr NUMERIC NOT NULL DEFAULT 0,
  engagement NUMERIC NOT NULL DEFAULT 0,
  shares BIGINT NOT NULL DEFAULT 0,
  likes BIGINT NOT NULL DEFAULT 0,
  comments BIGINT NOT NULL DEFAULT 0,
  conversions BIGINT NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS vs_analytics_project_idx ON public.vs_analytics(project_id, recorded_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vs_analytics TO authenticated;
GRANT ALL ON public.vs_analytics TO service_role;
ALTER TABLE public.vs_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vs_analytics owner" ON public.vs_analytics FOR ALL
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- ------------------------------------------------------------
-- vs_automation_sources (auto-generate videos from other entities)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vs_automation_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  format public.vs_video_format NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_project_id UUID REFERENCES public.vs_projects(id) ON DELETE SET NULL,
  last_run_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vs_automation_sources TO authenticated;
GRANT ALL ON public.vs_automation_sources TO service_role;
ALTER TABLE public.vs_automation_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vs_automation_sources owner" ON public.vs_automation_sources FOR ALL
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- ------------------------------------------------------------
-- vs_audit_log
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vs_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.vs_projects(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vs_audit_project_idx ON public.vs_audit_log(project_id, created_at DESC);

GRANT SELECT, INSERT ON public.vs_audit_log TO authenticated;
GRANT ALL ON public.vs_audit_log TO service_role;
ALTER TABLE public.vs_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vs_audit read own" ON public.vs_audit_log FOR SELECT
  USING (owner_id = auth.uid() OR actor_id = auth.uid());
CREATE POLICY "vs_audit insert own" ON public.vs_audit_log FOR INSERT
  WITH CHECK (actor_id = auth.uid() OR owner_id = auth.uid());

-- ------------------------------------------------------------
-- updated_at trigger
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.vs_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'vs_brand_kits','vs_providers','vs_templates','vs_projects',
    'vs_scenes','vs_jobs','vs_automation_sources'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS %I ON public.%I; CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.vs_touch_updated_at();',
      t||'_touch', t, t||'_touch', t
    );
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- Seed default providers
-- ------------------------------------------------------------
INSERT INTO public.vs_providers (slug, name, kind, adapter, priority, capabilities)
VALUES
  ('lovable-videogen','Lovable VideoGen','video','lovable_videogen',10,
    '{"aspect_ratios":["16:9","9:16","1:1","3:4","4:3","21:9"],"resolutions":["480p","1080p"],"max_duration":10}'::jsonb),
  ('runway','Runway ML','video','runway',50,'{"planned":true}'::jsonb),
  ('luma','Luma Dream Machine','video','luma',60,'{"planned":true}'::jsonb),
  ('pika','Pika Labs','video','pika',70,'{"planned":true}'::jsonb),
  ('heygen','HeyGen Avatars','video','heygen',80,'{"avatar":true,"planned":true}'::jsonb),
  ('did','D-ID Avatars','video','did',85,'{"avatar":true,"planned":true}'::jsonb),
  ('lovable-tts','Lovable AI TTS','voice','lovable_tts',10,
    '{"languages":["en","hi","es","fr","de","ja","pt"],"emotions":true}'::jsonb),
  ('elevenlabs','ElevenLabs','voice','elevenlabs',20,
    '{"voice_cloning":true,"emotions":true}'::jsonb),
  ('elevenlabs-music','ElevenLabs Music','music','elevenlabs_music',20,'{}'::jsonb),
  ('whisper','OpenAI Whisper','subtitle','whisper',10,'{"srt":true,"vtt":true}'::jsonb)
ON CONFLICT (slug) DO NOTHING;
