
CREATE TABLE IF NOT EXISTS public.career_hub_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_type TEXT NOT NULL CHECK (page_type IN (
    'roadmap','salary_guide','job_description','interview_questions',
    'resume_tips','career_switch','skill','trending_tech'
  )),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  category TEXT,
  hero_emoji TEXT,
  hero_image_url TEXT,
  summary TEXT,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  faqs JSONB NOT NULL DEFAULT '[]'::jsonb,
  roadmap JSONB NOT NULL DEFAULT '[]'::jsonb,
  learning_path JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_courses JSONB NOT NULL DEFAULT '[]'::jsonb,
  projects JSONB NOT NULL DEFAULT '[]'::jsonb,
  certifications JSONB NOT NULL DEFAULT '[]'::jsonb,
  related_blogs JSONB NOT NULL DEFAULT '[]'::jsonb,
  related_slugs JSONB NOT NULL DEFAULT '[]'::jsonb,
  internal_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[],
  json_ld JSONB,
  cover_image_url TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  ai_model TEXT,
  ai_generated_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (page_type, slug)
);

GRANT SELECT ON public.career_hub_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.career_hub_pages TO authenticated;
GRANT ALL ON public.career_hub_pages TO service_role;

ALTER TABLE public.career_hub_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "career_hub public read published"
  ON public.career_hub_pages FOR SELECT
  USING (published = true);

CREATE POLICY "career_hub admins full"
  ON public.career_hub_pages FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_career_hub_type_pub ON public.career_hub_pages (page_type, published, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_career_hub_slug ON public.career_hub_pages (slug);
CREATE INDEX IF NOT EXISTS idx_career_hub_featured ON public.career_hub_pages (featured) WHERE featured = true;

CREATE TRIGGER trg_career_hub_updated_at
  BEFORE UPDATE ON public.career_hub_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.career_hub_generation_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_type TEXT NOT NULL,
  seeds JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed','partial')),
  total INTEGER NOT NULL DEFAULT 0,
  processed INTEGER NOT NULL DEFAULT 0,
  succeeded INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  results JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.career_hub_generation_jobs TO authenticated;
GRANT ALL ON public.career_hub_generation_jobs TO service_role;

ALTER TABLE public.career_hub_generation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "career_hub_jobs admins full"
  ON public.career_hub_generation_jobs FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_career_hub_jobs_updated_at
  BEFORE UPDATE ON public.career_hub_generation_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
