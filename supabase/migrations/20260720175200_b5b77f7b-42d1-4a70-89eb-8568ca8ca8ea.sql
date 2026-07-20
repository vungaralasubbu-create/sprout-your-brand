-- ============================================================
-- ENTERPRISE AI GENERATION ENGINE — SCHEMA
-- ============================================================

-- 1) PROVIDERS REGISTRY --------------------------------------
CREATE TABLE public.generation_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,               -- text | image | video | audio | document | presentation
  enabled BOOLEAN NOT NULL DEFAULT true,
  priority INT NOT NULL DEFAULT 100,
  weight INT NOT NULL DEFAULT 1,
  fallback_key TEXT,
  api_endpoint TEXT,
  version TEXT,
  capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
  health_status TEXT NOT NULL DEFAULT 'unknown',  -- healthy | degraded | down | unknown
  last_health_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.generation_providers TO authenticated;
GRANT ALL ON public.generation_providers TO service_role;
ALTER TABLE public.generation_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "providers readable by auth" ON public.generation_providers FOR SELECT TO authenticated USING (true);
CREATE POLICY "providers admin manage" ON public.generation_providers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- 2) JOBS ----------------------------------------------------
CREATE TABLE public.generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL DEFAULT auth.uid(),
  workspace_id UUID,
  brand_id UUID,
  campaign_id UUID,
  parent_job_id UUID REFERENCES public.generation_jobs(id) ON DELETE SET NULL,
  content_type TEXT NOT NULL,           -- text|image|video|voice|presentation|document|pdf|landing_page|ad|banner|logo|illustration|certificate
  output_kinds TEXT[] NOT NULL DEFAULT '{}',
  mode TEXT NOT NULL DEFAULT 'single',  -- single|bulk|campaign|scheduled|workflow|api
  prompt TEXT,
  negative_prompt TEXT,
  language TEXT,
  country TEXT,
  platform TEXT,
  aspect_ratio TEXT,
  duration_seconds NUMERIC,
  resolution TEXT,
  voice TEXT,
  quality TEXT DEFAULT 'balanced',
  creativity NUMERIC,
  requested_provider TEXT,
  requested_model TEXT,
  chosen_provider TEXT,
  chosen_model TEXT,
  status TEXT NOT NULL DEFAULT 'queued', -- queued|preparing|generating|completed|failed|cancelled|retrying
  progress INT NOT NULL DEFAULT 0,
  error_code TEXT,
  error_message TEXT,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  brand_context JSONB,
  campaign_context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX gen_jobs_owner_idx ON public.generation_jobs(owner_id, created_at DESC);
CREATE INDEX gen_jobs_campaign_idx ON public.generation_jobs(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX gen_jobs_status_idx ON public.generation_jobs(status) WHERE status IN ('queued','preparing','generating','retrying');
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generation_jobs TO authenticated;
GRANT ALL ON public.generation_jobs TO service_role;
ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jobs owner all" ON public.generation_jobs FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- 3) OUTPUTS -------------------------------------------------
CREATE TABLE public.generation_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.generation_jobs(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL DEFAULT auth.uid(),
  output_kind TEXT NOT NULL,            -- text|markdown|html|json|image|video|audio|pdf|zip
  media_asset_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  approval_id UUID,
  storage_path TEXT,
  public_url TEXT,
  text_content TEXT,
  json_content JSONB,
  mime_type TEXT,
  size_bytes BIGINT,
  width INT,
  height INT,
  duration_seconds NUMERIC,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX gen_outputs_job_idx ON public.generation_outputs(job_id);
CREATE INDEX gen_outputs_owner_idx ON public.generation_outputs(owner_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generation_outputs TO authenticated;
GRANT ALL ON public.generation_outputs TO service_role;
ALTER TABLE public.generation_outputs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "outputs owner all" ON public.generation_outputs FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- 4) USAGE (COST / CREDITS) ---------------------------------
CREATE TABLE public.generation_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.generation_jobs(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL DEFAULT auth.uid(),
  workspace_id UUID,
  provider TEXT NOT NULL,
  model TEXT,
  tokens_in INT,
  tokens_out INT,
  units NUMERIC,                        -- image count, seconds of audio, seconds of video, etc.
  credits_used NUMERIC NOT NULL DEFAULT 0,
  estimated_cost_cents INT,
  actual_cost_cents INT,
  latency_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX gen_usage_owner_idx ON public.generation_usage(owner_id, created_at DESC);
CREATE INDEX gen_usage_provider_idx ON public.generation_usage(provider, created_at DESC);
GRANT SELECT, INSERT ON public.generation_usage TO authenticated;
GRANT ALL ON public.generation_usage TO service_role;
ALTER TABLE public.generation_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usage owner read" ON public.generation_usage FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "usage owner insert" ON public.generation_usage FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- 5) LOGS ----------------------------------------------------
CREATE TABLE public.generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.generation_jobs(id) ON DELETE CASCADE,
  owner_id UUID DEFAULT auth.uid(),
  event TEXT NOT NULL,                  -- started|validated|context_built|routed|generated|stored|approved|failed|retried|cancelled|health
  provider TEXT,
  model TEXT,
  latency_ms INT,
  level TEXT NOT NULL DEFAULT 'info',   -- info|warn|error
  message TEXT,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX gen_logs_job_idx ON public.generation_logs(job_id, created_at DESC);
GRANT SELECT, INSERT ON public.generation_logs TO authenticated;
GRANT ALL ON public.generation_logs TO service_role;
ALTER TABLE public.generation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs owner read" ON public.generation_logs FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "logs owner insert" ON public.generation_logs FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() OR owner_id IS NULL);

-- 6) updated_at triggers -------------------------------------
CREATE TRIGGER trg_generation_providers_updated_at
  BEFORE UPDATE ON public.generation_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_generation_jobs_updated_at
  BEFORE UPDATE ON public.generation_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7) SEED CORE PROVIDERS -------------------------------------
INSERT INTO public.generation_providers (provider_key, display_name, category, enabled, priority, capabilities, health_status)
VALUES
  ('router.text.openai',    'AI Router · OpenAI (text)',    'text',    true,  10,  '{"structured":true,"tools":true,"streaming":true}'::jsonb, 'healthy'),
  ('router.text.google',    'AI Router · Google (text)',    'text',    true,  20,  '{"structured":true,"tools":true,"streaming":true}'::jsonb, 'healthy'),
  ('router.text.anthropic', 'AI Router · Anthropic (text)', 'text',    true,  30,  '{"structured":true,"tools":true,"streaming":true}'::jsonb, 'healthy'),
  ('router.image.openai',   'AI Router · OpenAI (image)',   'image',   true,  10,  '{"sizes":["1024x1024","1024x1536","1536x1024"],"quality":["low","medium","high"]}'::jsonb, 'healthy'),
  ('video.runway',          'Runway (video)',               'video',   false, 10,  '{"resolutions":["720p","1080p"],"maxDurationSec":10}'::jsonb, 'unknown'),
  ('video.veo',             'Google Veo (video)',           'video',   false, 20,  '{"resolutions":["1080p"],"maxDurationSec":8}'::jsonb, 'unknown'),
  ('video.kling',           'Kling (video)',                'video',   false, 30,  '{}'::jsonb, 'unknown'),
  ('audio.elevenlabs',      'ElevenLabs (voice)',           'audio',   false, 10,  '{"voices":"library"}'::jsonb, 'unknown'),
  ('document.pdfkit',       'PDF Composer',                 'document',false, 10,  '{"formats":["pdf"]}'::jsonb, 'unknown'),
  ('presentation.builder',  'Presentation Builder',         'presentation', false, 10, '{}'::jsonb, 'unknown')
ON CONFLICT (provider_key) DO NOTHING;