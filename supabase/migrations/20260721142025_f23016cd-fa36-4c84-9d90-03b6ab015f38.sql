-- Column-level privilege restriction for anon on student_reviews.
-- RLS policy still applies (only approved rows), but anon can no longer
-- select sensitive columns even when the row passes RLS.
REVOKE SELECT ON public.student_reviews FROM anon;

GRANT SELECT (
  id,
  reviewer_name,
  reviewer_avatar_url,
  trigger_event,
  target_type,
  target_id,
  target_slug,
  target_label,
  rating,
  title,
  review_text,
  video_url,
  video_thumbnail_url,
  career_growth_notes,
  company_name,
  company_logo_url,
  status,
  display_locations,
  featured,
  seo_slug,
  success_story_id,
  source,
  created_at,
  updated_at,
  published_at
) ON public.student_reviews TO anon;