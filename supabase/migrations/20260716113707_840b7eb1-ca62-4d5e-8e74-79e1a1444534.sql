ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS related_blog_slugs text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS related_course_slugs text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS schema_jsonld jsonb;