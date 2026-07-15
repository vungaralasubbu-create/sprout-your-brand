
-- Blog topics
CREATE TABLE public.blog_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  visual_style TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_topics TO anon, authenticated;
GRANT ALL ON public.blog_topics TO service_role;
ALTER TABLE public.blog_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active topics" ON public.blog_topics
  FOR SELECT USING (is_active = true);

-- Blog categories (broader groupings: Technology / Engineering / Management / Career Insights / Learning / Emerging Skills)
CREATE TABLE public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_categories TO anon, authenticated;
GRANT ALL ON public.blog_categories TO service_role;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active categories" ON public.blog_categories
  FOR SELECT USING (is_active = true);

-- Blog posts
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  short_summary TEXT NOT NULL,
  intro TEXT,
  content_markdown TEXT NOT NULL,
  topic_id UUID REFERENCES public.blog_topics(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  program_category_slug TEXT,
  related_course_slug TEXT,
  related_course_category_slug TEXT,
  author_display_name TEXT NOT NULL DEFAULT 'Glintr Editorial',
  author_display_role TEXT,
  author_bio TEXT,
  featured_image_url TEXT,
  thumbnail_url TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_trending BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','scheduled','published','archived')),
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  editorial_updated_at TIMESTAMPTZ,
  reading_time_minutes INT,
  display_order INT NOT NULL DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published posts" ON public.blog_posts
  FOR SELECT
  USING (
    is_published = true
    AND status = 'published'
    AND published_at IS NOT NULL
    AND published_at <= now()
  );

CREATE INDEX blog_posts_published_at_idx ON public.blog_posts (published_at DESC) WHERE is_published = true;
CREATE INDEX blog_posts_topic_idx ON public.blog_posts (topic_id);
CREATE INDEX blog_posts_category_idx ON public.blog_posts (category_id);

CREATE OR REPLACE FUNCTION public.blog_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER blog_posts_touch_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.blog_touch_updated_at();

CREATE TRIGGER blog_topics_touch_updated_at
  BEFORE UPDATE ON public.blog_topics
  FOR EACH ROW EXECUTE FUNCTION public.blog_touch_updated_at();
