
-- Authors
CREATE TABLE public.content_authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  role TEXT,
  bio TEXT,
  avatar_url TEXT,
  socials JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.content_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES public.content_categories(id) ON DELETE SET NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.content_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  usage_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.content_type NOT NULL,
  status public.content_status NOT NULL DEFAULT 'draft',
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  summary TEXT,
  body_markdown TEXT DEFAULT '',
  featured_image TEXT,
  featured_image_alt TEXT,
  category_id UUID REFERENCES public.content_categories(id) ON DELETE SET NULL,
  tag_slugs TEXT[] DEFAULT '{}',
  author_id UUID REFERENCES public.content_authors(id) ON DELETE SET NULL,
  reviewer_id UUID REFERENCES public.content_authors(id) ON DELETE SET NULL,
  seo_title TEXT,
  seo_description TEXT,
  canonical_url TEXT,
  og_image TEXT,
  focus_topic TEXT,
  related_topics TEXT[] DEFAULT '{}',
  schema_type TEXT,
  reading_time_min INT,
  word_count INT,
  outline JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_edited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  view_count INT NOT NULL DEFAULT 0,
  completion_rate NUMERIC DEFAULT 0,
  avg_reading_time_sec INT DEFAULT 0,
  internal_click_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(type, slug)
);
CREATE INDEX idx_content_items_type_status ON public.content_items(type, status);
CREATE INDEX idx_content_items_slug ON public.content_items(slug);
CREATE INDEX idx_content_items_updated_at ON public.content_items(updated_at DESC);
CREATE INDEX idx_content_items_category ON public.content_items(category_id);
CREATE INDEX idx_content_items_tags ON public.content_items USING GIN(tag_slugs);

CREATE TABLE public.content_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  revision_number INT NOT NULL,
  title TEXT,
  body_markdown TEXT,
  status public.content_status,
  snapshot JSONB NOT NULL,
  change_note TEXT,
  edited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(content_id, revision_number)
);
CREATE INDEX idx_content_revisions_content_id ON public.content_revisions(content_id, revision_number DESC);

CREATE TABLE public.content_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  author_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT,
  body TEXT NOT NULL,
  anchor TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_content_comments_content_id ON public.content_comments(content_id, created_at DESC);

CREATE TABLE public.content_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  width INT,
  height INT,
  folder TEXT DEFAULT 'general',
  alt_text TEXT,
  caption TEXT,
  tags TEXT[] DEFAULT '{}',
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_content_media_folder ON public.content_media(folder);
CREATE INDEX idx_content_media_tags ON public.content_media USING GIN(tags);

CREATE TABLE public.content_internal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_content_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  target_url TEXT NOT NULL,
  target_content_id UUID REFERENCES public.content_items(id) ON DELETE SET NULL,
  target_kind TEXT,
  anchor_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_content_internal_links_source ON public.content_internal_links(source_content_id);
CREATE INDEX idx_content_internal_links_target ON public.content_internal_links(target_content_id);

CREATE TABLE public.content_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  session_id TEXT,
  reading_time_sec INT,
  scroll_percent INT,
  referrer TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_content_analytics_events_content ON public.content_analytics_events(content_id, created_at DESC);

-- GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_authors, public.content_categories, public.content_tags, public.content_items, public.content_revisions, public.content_comments, public.content_media, public.content_internal_links, public.content_analytics_events TO authenticated;
GRANT SELECT ON public.content_items, public.content_authors, public.content_categories, public.content_tags, public.content_media TO anon;
GRANT INSERT ON public.content_analytics_events TO anon;
GRANT ALL ON public.content_authors, public.content_categories, public.content_tags, public.content_items, public.content_revisions, public.content_comments, public.content_media, public.content_internal_links, public.content_analytics_events TO service_role;

-- RLS
ALTER TABLE public.content_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_internal_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read authors" ON public.content_authors FOR SELECT USING (true);
CREATE POLICY "admin manage authors" ON public.content_authors FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "public read categories" ON public.content_categories FOR SELECT USING (true);
CREATE POLICY "admin manage categories" ON public.content_categories FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "public read tags" ON public.content_tags FOR SELECT USING (true);
CREATE POLICY "admin manage tags" ON public.content_tags FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "public read published content" ON public.content_items FOR SELECT USING (status = 'published');
CREATE POLICY "admin read all content" ON public.content_items FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "admin manage content" ON public.content_items FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "admin manage revisions" ON public.content_revisions FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "admin manage comments" ON public.content_comments FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "public read media" ON public.content_media FOR SELECT USING (true);
CREATE POLICY "admin manage media" ON public.content_media FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "admin manage internal links" ON public.content_internal_links FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "anon insert analytics" ON public.content_analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "admin read analytics" ON public.content_analytics_events FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- updated_at trigger (reuse existing helper if present, else create one)
DO $$ BEGIN
  CREATE OR REPLACE FUNCTION public.set_cms_updated_at() RETURNS TRIGGER
  LANGUAGE plpgsql SET search_path = public AS $f$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $f$;
END $$;

CREATE TRIGGER trg_content_items_updated_at BEFORE UPDATE ON public.content_items
  FOR EACH ROW EXECUTE FUNCTION public.set_cms_updated_at();
CREATE TRIGGER trg_content_authors_updated_at BEFORE UPDATE ON public.content_authors
  FOR EACH ROW EXECUTE FUNCTION public.set_cms_updated_at();
CREATE TRIGGER trg_content_categories_updated_at BEFORE UPDATE ON public.content_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_cms_updated_at();

CREATE OR REPLACE FUNCTION public.promote_scheduled_content()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.content_items
  SET status = 'published', published_at = COALESCE(published_at, now())
  WHERE status = 'scheduled' AND scheduled_for IS NOT NULL AND scheduled_for <= now();
END; $$;

INSERT INTO public.content_categories (name, slug, description, sort_order) VALUES
  ('Foundations','foundations','Core concepts every learner needs',1),
  ('Career','career','Career paths, interview and hiring guides',2),
  ('AI & Machine Learning','ai-ml','AI, ML, generative AI and applied tools',3),
  ('Engineering','engineering','Software, systems and technical craft',4),
  ('Business & Sales','business-sales','Entrepreneurship, sales and revenue',5),
  ('Reference','reference','Glossary, cheat sheets and comparisons',6);
