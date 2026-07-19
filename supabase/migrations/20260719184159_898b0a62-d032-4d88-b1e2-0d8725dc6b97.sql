
CREATE TABLE public.ai_seo_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN (
    'title','meta_description','faq_schema','internal_links','breadcrumbs',
    'structured_data','keyword_opportunities','duplicate_content',
    'content_improvements','heading_hierarchy','missing_pages','image_alt'
  )),
  target_type TEXT,
  target_id TEXT,
  target_url TEXT,
  input_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  suggestion JSONB NOT NULL,
  rationale TEXT,
  model TEXT,
  score NUMERIC,
  priority INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','published')),
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  review_notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ai_seo_suggestions_status_kind_idx ON public.ai_seo_suggestions (status, kind, created_at DESC);
CREATE INDEX ai_seo_suggestions_target_idx ON public.ai_seo_suggestions (target_type, target_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_seo_suggestions TO authenticated;
GRANT ALL ON public.ai_seo_suggestions TO service_role;

ALTER TABLE public.ai_seo_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view AI SEO suggestions"
  ON public.ai_seo_suggestions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Staff can insert AI SEO suggestions"
  ON public.ai_seo_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Staff can update AI SEO suggestions"
  ON public.ai_seo_suggestions FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Staff can delete AI SEO suggestions"
  ON public.ai_seo_suggestions FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER ai_seo_suggestions_updated_at
  BEFORE UPDATE ON public.ai_seo_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
