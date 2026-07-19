
-- Categories
CREATE TABLE public.kb_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  parent_id UUID REFERENCES public.kb_categories(id) ON DELETE SET NULL,
  position INT NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.kb_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kb_categories TO authenticated;
GRANT ALL ON public.kb_categories TO service_role;
ALTER TABLE public.kb_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kb_categories public read" ON public.kb_categories FOR SELECT USING (published = true);
CREATE POLICY "kb_categories admin all" ON public.kb_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Articles
CREATE TABLE public.kb_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.kb_categories(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'article' CHECK (kind IN ('article','faq','documentation','tutorial','guide','walkthrough','video')),
  summary TEXT,
  body_md TEXT,
  video_url TEXT,
  cover_image TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[] NOT NULL DEFAULT '{}',
  json_ld JSONB,
  related_ids UUID[] NOT NULL DEFAULT '{}',
  view_count INT NOT NULL DEFAULT 0,
  helpful_count INT NOT NULL DEFAULT 0,
  unhelpful_count INT NOT NULL DEFAULT 0,
  reading_time INT,
  published BOOLEAN NOT NULL DEFAULT false,
  featured BOOLEAN NOT NULL DEFAULT false,
  version INT NOT NULL DEFAULT 1,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX kb_articles_category_idx ON public.kb_articles(category_id) WHERE published;
CREATE INDEX kb_articles_kind_idx ON public.kb_articles(kind) WHERE published;
CREATE INDEX kb_articles_search_idx ON public.kb_articles USING gin (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(body_md,'')));
CREATE INDEX kb_articles_tags_idx ON public.kb_articles USING gin(tags);
GRANT SELECT ON public.kb_articles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kb_articles TO authenticated;
GRANT ALL ON public.kb_articles TO service_role;
ALTER TABLE public.kb_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kb_articles public read" ON public.kb_articles FOR SELECT USING (published = true);
CREATE POLICY "kb_articles admin all" ON public.kb_articles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Version history
CREATE TABLE public.kb_article_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.kb_articles(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  title TEXT NOT NULL,
  body_md TEXT,
  summary TEXT,
  note TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (article_id, version_number)
);
CREATE INDEX kb_article_versions_article_idx ON public.kb_article_versions(article_id, version_number DESC);
GRANT SELECT ON public.kb_article_versions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kb_article_versions TO authenticated;
GRANT ALL ON public.kb_article_versions TO service_role;
ALTER TABLE public.kb_article_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kb_versions public read" ON public.kb_article_versions FOR SELECT USING (true);
CREATE POLICY "kb_versions admin all" ON public.kb_article_versions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Feedback
CREATE TABLE public.kb_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.kb_articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  helpful BOOLEAN NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX kb_feedback_article_idx ON public.kb_feedback(article_id);
GRANT SELECT, INSERT ON public.kb_feedback TO authenticated;
GRANT ALL ON public.kb_feedback TO service_role;
ALTER TABLE public.kb_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kb_feedback insert own" ON public.kb_feedback FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "kb_feedback read own or admin" ON public.kb_feedback FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- updated_at triggers
CREATE TRIGGER kb_categories_updated_at BEFORE UPDATE ON public.kb_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER kb_articles_updated_at BEFORE UPDATE ON public.kb_articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed core categories
INSERT INTO public.kb_categories (slug, name, description, icon, color, position) VALUES
  ('getting-started','Getting Started','New to Glintr? Start here.','Rocket','#22d3ee',1),
  ('students','Students & Learners','Enrollment, courses, certificates.','GraduationCap','#84cc16',2),
  ('partners','Partners & Academies','Revenue models, payouts, brand launch.','Building2','#3b82f6',3),
  ('instructors','Instructors','Teaching, live classes, grading.','Presentation','#a855f7',4),
  ('billing','Billing & Payments','Invoices, refunds, tax.','CreditCard','#f97316',5),
  ('technical','Technical & API','Integrations, webhooks, SSO.','Code','#ec4899',6),
  ('policies','Policies & Legal','Terms, privacy, refund policy.','Shield','#64748b',7);
