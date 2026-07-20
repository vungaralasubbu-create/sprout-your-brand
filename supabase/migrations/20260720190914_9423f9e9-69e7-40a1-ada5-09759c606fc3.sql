
CREATE TABLE public.marketing_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID REFERENCES public.mkt_brands(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.mkt_campaigns(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled marketing project',
  prompt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  progress INT NOT NULL DEFAULT 0,
  current_step TEXT,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX marketing_projects_owner_idx ON public.marketing_projects(created_by, created_at DESC);
CREATE INDEX marketing_projects_brand_idx ON public.marketing_projects(brand_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_projects TO authenticated;
GRANT ALL ON public.marketing_projects TO service_role;
ALTER TABLE public.marketing_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their marketing projects"
  ON public.marketing_projects FOR ALL
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);
CREATE TRIGGER update_marketing_projects_updated_at
  BEFORE UPDATE ON public.marketing_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
