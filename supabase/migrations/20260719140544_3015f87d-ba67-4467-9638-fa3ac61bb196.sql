
CREATE TABLE public.keyword_research_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scope TEXT NOT NULL DEFAULT 'admin',
  brand_id UUID,
  name TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  seed_query TEXT NOT NULL,
  location TEXT,
  language TEXT DEFAULT 'en',
  notes TEXT,
  summary JSONB,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.keyword_research_keywords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.keyword_research_projects(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  category TEXT NOT NULL,
  intent TEXT,
  cluster TEXT,
  monthly_volume INTEGER,
  competition TEXT,
  difficulty INTEGER,
  cpc NUMERIC,
  seasonality TEXT,
  estimated_traffic INTEGER,
  business_value INTEGER,
  conversion_score INTEGER,
  priority INTEGER,
  suggested_content_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.keyword_content_plan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.keyword_research_projects(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL,
  target_keyword TEXT,
  supporting_keywords TEXT[],
  cluster TEXT,
  priority INTEGER,
  business_value INTEGER,
  status TEXT NOT NULL DEFAULT 'planned',
  internal_links JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.keyword_research_projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.keyword_research_keywords TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.keyword_content_plan TO authenticated;
GRANT ALL ON public.keyword_research_projects TO service_role;
GRANT ALL ON public.keyword_research_keywords TO service_role;
GRANT ALL ON public.keyword_content_plan TO service_role;

ALTER TABLE public.keyword_research_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_research_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_content_plan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access projects" ON public.keyword_research_projects FOR ALL
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Owners manage own projects" ON public.keyword_research_projects FOR ALL
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Admins full access keywords" ON public.keyword_research_keywords FOR ALL
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Owners manage own keywords" ON public.keyword_research_keywords FOR ALL
  USING (EXISTS (SELECT 1 FROM public.keyword_research_projects p WHERE p.id = project_id AND p.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.keyword_research_projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));

CREATE POLICY "Admins full access plan" ON public.keyword_content_plan FOR ALL
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Owners manage own plan" ON public.keyword_content_plan FOR ALL
  USING (EXISTS (SELECT 1 FROM public.keyword_research_projects p WHERE p.id = project_id AND p.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.keyword_research_projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));

CREATE INDEX idx_kw_projects_owner ON public.keyword_research_projects(owner_id, updated_at DESC);
CREATE INDEX idx_kw_keywords_project ON public.keyword_research_keywords(project_id, category);
CREATE INDEX idx_kw_plan_project ON public.keyword_content_plan(project_id, month);
