
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS hero_image_url text,
  ADD COLUMN IF NOT EXISTS social_image_url text,
  ADD COLUMN IF NOT EXISTS reviewer_display_name text,
  ADD COLUMN IF NOT EXISTS reviewer_display_role text,
  ADD COLUMN IF NOT EXISTS skill_level text,
  ADD COLUMN IF NOT EXISTS faqs jsonb NOT NULL DEFAULT '[]'::jsonb;
