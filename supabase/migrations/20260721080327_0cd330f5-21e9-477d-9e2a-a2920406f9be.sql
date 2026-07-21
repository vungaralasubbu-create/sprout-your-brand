-- 1) student_reviews: strip PII from public reads.
DROP POLICY IF EXISTS "Approved reviews are public" ON public.student_reviews;

DROP VIEW IF EXISTS public.student_reviews_public;
CREATE VIEW public.student_reviews_public
WITH (security_invoker = true) AS
SELECT id, user_id, reviewer_name, reviewer_avatar_url, reviewer_linkedin_url,
       trigger_event, target_type, target_id, target_slug, target_label,
       rating, title, review_text, video_url, video_thumbnail_url,
       before_snapshot, after_snapshot, salary_before_lpa, salary_after_lpa,
       salary_growth_pct, career_growth_notes, company_name, company_logo_url,
       status, display_locations, featured, seo_slug, success_story_id,
       source, created_at, updated_at, published_at
FROM public.student_reviews
WHERE status = 'approved';
GRANT SELECT ON public.student_reviews_public TO anon, authenticated;

-- Revoke wide SELECT and grant only safe columns to anon; PostgREST will
-- return 401 for any anon query that projects reviewer_email/ip_address.
REVOKE SELECT ON public.student_reviews FROM anon;
GRANT SELECT (
  id, user_id, reviewer_name, reviewer_avatar_url, reviewer_linkedin_url,
  trigger_event, target_type, target_id, target_slug, target_label,
  rating, title, review_text, video_url, video_thumbnail_url,
  before_snapshot, after_snapshot, salary_before_lpa, salary_after_lpa,
  salary_growth_pct, career_growth_notes, company_name, company_logo_url,
  status, display_locations, featured, seo_slug, success_story_id,
  source, created_at, updated_at, published_at
) ON public.student_reviews TO anon;

CREATE POLICY "Public can read approved reviews (safe cols only)"
ON public.student_reviews
FOR SELECT TO anon
USING (status = 'approved');

-- 2) Internal cron secret plumbing.
CREATE SCHEMA IF NOT EXISTS internal;
REVOKE ALL ON SCHEMA internal FROM PUBLIC;
GRANT USAGE ON SCHEMA internal TO postgres;

CREATE TABLE IF NOT EXISTS internal.app_secrets (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON internal.app_secrets FROM PUBLIC;

CREATE OR REPLACE FUNCTION internal.get_cron_secret()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = internal, pg_temp
AS $fn$
  SELECT value FROM internal.app_secrets WHERE key = 'cron_secret';
$fn$;
REVOKE ALL ON FUNCTION internal.get_cron_secret() FROM PUBLIC;

CREATE OR REPLACE FUNCTION internal.set_cron_secret(new_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = internal, pg_temp
AS $fn$
BEGIN
  INSERT INTO internal.app_secrets(key, value)
  VALUES ('cron_secret', new_value)
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
END;
$fn$;
REVOKE ALL ON FUNCTION internal.set_cron_secret(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION internal.set_cron_secret(text) TO sandbox_exec;

-- 3) Re-schedule cron jobs to use x-cron-secret header sourced from internal.get_cron_secret().
SELECT cron.unschedule('glintr-brain-tick');
SELECT cron.schedule(
  'glintr-brain-tick',
  '*/5 * * * *',
  $cmd$
    SELECT net.http_post(
      url := 'https://project--84233618-ecae-483f-a5a7-f069293573cb.lovable.app/api/public/hooks/brain-tick',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', COALESCE(internal.get_cron_secret(), '')
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $cmd$
);

SELECT cron.unschedule('publisher-tick-every-minute');
SELECT cron.schedule(
  'publisher-tick-every-minute',
  '* * * * *',
  $cmd$
    SELECT net.http_post(
      url := 'https://project--84233618-ecae-483f-a5a7-f069293573cb.lovable.app/api/public/hooks/publisher-tick',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', COALESCE(internal.get_cron_secret(), '')
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $cmd$
);