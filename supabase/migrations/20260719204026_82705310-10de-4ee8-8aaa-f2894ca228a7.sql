
-- 1) Templates registry
CREATE TABLE IF NOT EXISTS public.pseo_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  page_type text NOT NULL,
  url_pattern text NOT NULL,
  title_pattern text NOT NULL,
  meta_pattern text,
  h1_pattern text,
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  schema_types text[] DEFAULT ARRAY[]::text[],
  prompt_version text,
  min_words int DEFAULT 900,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.pseo_templates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pseo_templates TO authenticated;
GRANT ALL ON public.pseo_templates TO service_role;
ALTER TABLE public.pseo_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pseo_templates_public_read" ON public.pseo_templates FOR SELECT USING (is_active = true);
CREATE POLICY "pseo_templates_admin_all" ON public.pseo_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.pseo_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  aliases text[] DEFAULT ARRAY[]::text[],
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  priority int DEFAULT 100,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (kind, slug)
);
CREATE INDEX IF NOT EXISTS idx_pseo_entities_kind ON public.pseo_entities(kind, is_active);
GRANT SELECT ON public.pseo_entities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pseo_entities TO authenticated;
GRANT ALL ON public.pseo_entities TO service_role;
ALTER TABLE public.pseo_entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pseo_entities_public_read" ON public.pseo_entities FOR SELECT USING (is_active = true);
CREATE POLICY "pseo_entities_admin_all" ON public.pseo_entities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

ALTER TABLE public.pseo_pages
  ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.pseo_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS entity_id uuid REFERENCES public.pseo_entities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS entity_id_secondary uuid REFERENCES public.pseo_entities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS variables jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS content_hash text,
  ADD COLUMN IF NOT EXISTS similarity_score numeric,
  ADD COLUMN IF NOT EXISTS freshness_score numeric,
  ADD COLUMN IF NOT EXISTS seo_score numeric,
  ADD COLUMN IF NOT EXISTS readability_score numeric,
  ADD COLUMN IF NOT EXISTS duplicate_score numeric,
  ADD COLUMN IF NOT EXISTS review_state text DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS canonical_of uuid REFERENCES public.pseo_pages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS index_status text DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS index_last_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS schema_types text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS ai_prompt_version text,
  ADD COLUMN IF NOT EXISTS batch_id uuid;

CREATE INDEX IF NOT EXISTS idx_pseo_pages_page_type ON public.pseo_pages(page_type);
CREATE INDEX IF NOT EXISTS idx_pseo_pages_status ON public.pseo_pages(status);
CREATE INDEX IF NOT EXISTS idx_pseo_pages_batch ON public.pseo_pages(batch_id);
CREATE INDEX IF NOT EXISTS idx_pseo_pages_content_hash ON public.pseo_pages(content_hash);
CREATE INDEX IF NOT EXISTS idx_pseo_pages_template ON public.pseo_pages(template_id);

CREATE TABLE IF NOT EXISTS public.pseo_quality_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.pseo_pages(id) ON DELETE CASCADE,
  grammar_score numeric,
  readability_score numeric,
  seo_score numeric,
  duplicate_score numeric,
  keyword_coverage numeric,
  internal_link_count int,
  schema_complete boolean,
  word_count int,
  overall_score numeric,
  issues jsonb DEFAULT '[]'::jsonb,
  suggestions jsonb DEFAULT '[]'::jsonb,
  reviewer text DEFAULT 'ai',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pseo_quality_page ON public.pseo_quality_reviews(page_id, created_at DESC);
GRANT SELECT, INSERT ON public.pseo_quality_reviews TO authenticated;
GRANT ALL ON public.pseo_quality_reviews TO service_role;
ALTER TABLE public.pseo_quality_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pseo_qr_admin_all" ON public.pseo_quality_reviews FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.pseo_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  template_id uuid REFERENCES public.pseo_templates(id) ON DELETE SET NULL,
  page_type text,
  total int DEFAULT 0,
  succeeded int DEFAULT 0,
  failed int DEFAULT 0,
  status text DEFAULT 'queued',
  config jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);
GRANT SELECT, INSERT, UPDATE ON public.pseo_batches TO authenticated;
GRANT ALL ON public.pseo_batches TO service_role;
ALTER TABLE public.pseo_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pseo_batches_admin_all" ON public.pseo_batches FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.pseo_indexing_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid REFERENCES public.pseo_pages(id) ON DELETE CASCADE,
  url text NOT NULL,
  coverage_state text,
  last_crawl_at timestamptz,
  canonical_url text,
  google_canonical text,
  indexing_verdict text,
  robots_txt_state text,
  page_fetch_state text,
  checked_at timestamptz DEFAULT now(),
  raw jsonb
);
CREATE INDEX IF NOT EXISTS idx_pseo_idx_status_page ON public.pseo_indexing_status(page_id, checked_at DESC);
GRANT SELECT, INSERT ON public.pseo_indexing_status TO authenticated;
GRANT ALL ON public.pseo_indexing_status TO service_role;
ALTER TABLE public.pseo_indexing_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pseo_idx_admin_all" ON public.pseo_indexing_status FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.pseo_analytics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.pseo_pages(id) ON DELETE CASCADE,
  day date NOT NULL,
  impressions int DEFAULT 0,
  clicks int DEFAULT 0,
  ctr numeric DEFAULT 0,
  avg_position numeric,
  views int DEFAULT 0,
  bounce_rate numeric,
  conversions int DEFAULT 0,
  leads int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (page_id, day)
);
CREATE INDEX IF NOT EXISTS idx_pseo_analytics_day ON public.pseo_analytics_daily(day DESC);
GRANT SELECT, INSERT, UPDATE ON public.pseo_analytics_daily TO authenticated;
GRANT ALL ON public.pseo_analytics_daily TO service_role;
ALTER TABLE public.pseo_analytics_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pseo_analytics_admin_all" ON public.pseo_analytics_daily FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.pseo_settings (
  id int PRIMARY KEY DEFAULT 1,
  batch_size int DEFAULT 25,
  daily_generation_limit int DEFAULT 2000,
  min_quality_score numeric DEFAULT 70,
  auto_publish_threshold numeric DEFAULT 85,
  canonical_domain text DEFAULT 'https://glintr.com',
  indexing_enabled boolean DEFAULT true,
  sitemap_split_size int DEFAULT 5000,
  rules jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now(),
  CHECK (id = 1)
);
GRANT SELECT, INSERT, UPDATE ON public.pseo_settings TO authenticated;
GRANT ALL ON public.pseo_settings TO service_role;
ALTER TABLE public.pseo_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pseo_settings_admin_all" ON public.pseo_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));
INSERT INTO public.pseo_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.pseo_generation_jobs
  ADD COLUMN IF NOT EXISTS batch_id uuid,
  ADD COLUMN IF NOT EXISTS job_type text DEFAULT 'generate',
  ADD COLUMN IF NOT EXISTS payload jsonb DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS idx_pseo_jobs_status_prio ON public.pseo_generation_jobs(status, priority DESC, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_pseo_jobs_batch ON public.pseo_generation_jobs(batch_id);
