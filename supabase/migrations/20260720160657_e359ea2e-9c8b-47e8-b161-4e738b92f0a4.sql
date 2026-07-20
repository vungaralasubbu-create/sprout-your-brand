
-- =========================================================
-- APPROVAL CENTER
-- =========================================================

CREATE TABLE IF NOT EXISTS public.approval_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.marketing_plans(id) ON DELETE SET NULL,
  content_id TEXT,
  title TEXT NOT NULL,
  preview TEXT,
  body TEXT,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  platform TEXT NOT NULL DEFAULT 'blog',
  content_type TEXT NOT NULL DEFAULT 'post',
  campaign TEXT,
  language TEXT DEFAULT 'English',
  country TEXT,
  business_unit TEXT,
  ai_model TEXT,
  ai_generated BOOLEAN NOT NULL DEFAULT true,
  hashtags TEXT[] DEFAULT '{}',
  cta TEXT,
  media_prompts JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','review','approved','scheduled','published','rejected','failed','archived')),
  approval_mode TEXT NOT NULL DEFAULT 'manual'
    CHECK (approval_mode IN ('manual','manager','auto','multi_level')),
  reviewer UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  review_notes TEXT,
  quality_score INT CHECK (quality_score BETWEEN 0 AND 100),
  seo_score INT CHECK (seo_score BETWEEN 0 AND 100),
  brand_score INT CHECK (brand_score BETWEEN 0 AND 100),
  engagement_score INT CHECK (engagement_score BETWEEN 0 AND 100),
  scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  version INT NOT NULL DEFAULT 1,
  scheduled_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.approval_queue TO authenticated;
GRANT ALL ON public.approval_queue TO service_role;
ALTER TABLE public.approval_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aq_owner_all" ON public.approval_queue FOR ALL TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX IF NOT EXISTS approval_queue_owner_status_idx ON public.approval_queue (owner_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS approval_queue_platform_idx ON public.approval_queue (platform);
CREATE INDEX IF NOT EXISTS approval_queue_campaign_idx ON public.approval_queue (campaign);
CREATE INDEX IF NOT EXISTS approval_queue_scheduled_idx ON public.approval_queue (scheduled_at);

-- =========================================================
-- COMMENTS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.approval_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID NOT NULL REFERENCES public.approval_queue(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  mentions UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.approval_comments TO authenticated;
GRANT ALL ON public.approval_comments TO service_role;
ALTER TABLE public.approval_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ac_owner_all" ON public.approval_comments FOR ALL TO authenticated
  USING (auth.uid() = owner_id OR auth.uid() = author_id OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (auth.uid() = owner_id OR auth.uid() = author_id OR public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX IF NOT EXISTS approval_comments_queue_idx ON public.approval_comments (queue_id, created_at);

-- =========================================================
-- VERSIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.approval_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID NOT NULL REFERENCES public.approval_queue(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version INT NOT NULL,
  snapshot JSONB NOT NULL,
  note TEXT,
  edited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.approval_versions TO authenticated;
GRANT ALL ON public.approval_versions TO service_role;
ALTER TABLE public.approval_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "av_owner_all" ON public.approval_versions FOR ALL TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX IF NOT EXISTS approval_versions_queue_idx ON public.approval_versions (queue_id, version DESC);

-- =========================================================
-- ACTIVITY TIMELINE
-- =========================================================
CREATE TABLE IF NOT EXISTS public.approval_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID NOT NULL REFERENCES public.approval_queue(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event TEXT NOT NULL,
  detail JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.approval_activity TO authenticated;
GRANT ALL ON public.approval_activity TO service_role;
ALTER TABLE public.approval_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aa_owner_all" ON public.approval_activity FOR ALL TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX IF NOT EXISTS approval_activity_queue_idx ON public.approval_activity (queue_id, created_at DESC);

-- =========================================================
-- updated_at trigger
-- =========================================================
CREATE OR REPLACE FUNCTION public.approval_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_approval_queue_updated ON public.approval_queue;
CREATE TRIGGER trg_approval_queue_updated
BEFORE UPDATE ON public.approval_queue
FOR EACH ROW EXECUTE FUNCTION public.approval_touch_updated_at();
