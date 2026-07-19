
-- Blog OS: generation jobs, SEO scores, schedules, analytics, revisions

CREATE TABLE IF NOT EXISTS public.blog_generation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  job_type text NOT NULL, -- 'single' | 'programmatic' | 'refresh'
  title text NOT NULL,
  input_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued', -- queued | running | completed | failed | cancelled
  total_items integer NOT NULL DEFAULT 0,
  completed_items integer NOT NULL DEFAULT 0,
  failed_items integer NOT NULL DEFAULT 0,
  output_blog_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  error_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_provider text DEFAULT 'gemini',
  ai_model text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_generation_jobs TO authenticated;
GRANT ALL ON public.blog_generation_jobs TO service_role;
ALTER TABLE public.blog_generation_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage generation jobs" ON public.blog_generation_jobs
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "owners manage their generation jobs" ON public.blog_generation_jobs
  FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
CREATE INDEX IF NOT EXISTS idx_blog_generation_jobs_status ON public.blog_generation_jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_generation_jobs_brand ON public.blog_generation_jobs(brand_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.blog_seo_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  overall_score integer NOT NULL DEFAULT 0,
  keyword_score integer DEFAULT 0,
  readability_score integer DEFAULT 0,
  headings_score integer DEFAULT 0,
  links_score integer DEFAULT 0,
  images_score integer DEFAULT 0,
  meta_score integer DEFAULT 0,
  schema_score integer DEFAULT 0,
  word_count integer DEFAULT 0,
  suggestions jsonb NOT NULL DEFAULT '[]'::jsonb,
  scored_by text DEFAULT 'auto',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_seo_scores TO authenticated;
GRANT ALL ON public.blog_seo_scores TO service_role;
ALTER TABLE public.blog_seo_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins view all seo scores" ON public.blog_seo_scores
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_blog_seo_scores_blog ON public.blog_seo_scores(blog_post_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.blog_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  scheduled_for timestamptz NOT NULL,
  recurrence text DEFAULT 'once', -- once | daily | weekly | monthly
  status text NOT NULL DEFAULT 'pending', -- pending | published | cancelled | failed
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_schedules TO authenticated;
GRANT ALL ON public.blog_schedules TO service_role;
ALTER TABLE public.blog_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage schedules" ON public.blog_schedules
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_blog_schedules_pending ON public.blog_schedules(scheduled_for) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS public.blog_analytics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  day date NOT NULL,
  views integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  avg_position numeric(6,2) DEFAULT 0,
  ctr numeric(6,4) DEFAULT 0,
  bounce_rate numeric(6,4) DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  revenue_generated numeric(12,2) DEFAULT 0,
  top_keywords jsonb DEFAULT '[]'::jsonb,
  top_referrers jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(blog_post_id, day)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_analytics_daily TO authenticated;
GRANT ALL ON public.blog_analytics_daily TO service_role;
ALTER TABLE public.blog_analytics_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins view analytics" ON public.blog_analytics_daily
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_blog_analytics_daily_blog ON public.blog_analytics_daily(blog_post_id, day DESC);
CREATE INDEX IF NOT EXISTS idx_blog_analytics_daily_day ON public.blog_analytics_daily(day DESC);

CREATE TABLE IF NOT EXISTS public.blog_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  revision_number integer NOT NULL,
  title text,
  content_markdown text,
  seo_title text,
  seo_description text,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  edited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  edit_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_revisions TO authenticated;
GRANT ALL ON public.blog_revisions TO service_role;
ALTER TABLE public.blog_revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage revisions" ON public.blog_revisions
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_blog_revisions_blog ON public.blog_revisions(blog_post_id, revision_number DESC);

CREATE OR REPLACE FUNCTION public.blog_os_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_blog_generation_jobs_touch ON public.blog_generation_jobs;
CREATE TRIGGER trg_blog_generation_jobs_touch BEFORE UPDATE ON public.blog_generation_jobs
FOR EACH ROW EXECUTE FUNCTION public.blog_os_touch_updated_at();

DROP TRIGGER IF EXISTS trg_blog_schedules_touch ON public.blog_schedules;
CREATE TRIGGER trg_blog_schedules_touch BEFORE UPDATE ON public.blog_schedules
FOR EACH ROW EXECUTE FUNCTION public.blog_os_touch_updated_at();
