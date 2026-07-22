
ALTER TABLE public.marketing_projects
  ADD COLUMN IF NOT EXISTS post_states jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS publish_state jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Backfill from existing result blob (one-time).
UPDATE public.marketing_projects
   SET post_states = COALESCE(result->'post_states', '{}'::jsonb)
 WHERE post_states = '{}'::jsonb
   AND jsonb_typeof(result->'post_states') = 'object';

UPDATE public.marketing_projects
   SET publish_state = COALESCE(result->'publish', '{}'::jsonb)
 WHERE publish_state = '{}'::jsonb
   AND jsonb_typeof(result->'publish') = 'object';
