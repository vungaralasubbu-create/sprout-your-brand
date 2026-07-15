
-- 1) Extend preferences with per-category in-app toggles
ALTER TABLE public.ambassador_notification_preferences
  ADD COLUMN IF NOT EXISTS earnings_updates boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS milestone_updates boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS badge_updates boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS level_updates boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS leaderboard_updates boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS recognition_updates boolean NOT NULL DEFAULT true;

-- 2) Notification archive support
ALTER TABLE public.ambassador_notifications
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE INDEX IF NOT EXISTS amb_notif_user_status_created_idx
  ON public.ambassador_notifications (user_id, status, created_at DESC);

-- 3) Category configuration table (mandatory vs optional + default)
CREATE TABLE IF NOT EXISTS public.ambassador_notification_categories (
  category_key text PRIMARY KEY,
  label text NOT NULL,
  description text,
  is_optional boolean NOT NULL DEFAULT true,
  in_app_default boolean NOT NULL DEFAULT true,
  pref_column text,
  display_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ambassador_notification_categories TO authenticated, anon;
GRANT ALL ON public.ambassador_notification_categories TO service_role;

ALTER TABLE public.ambassador_notification_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ambassadors read notification categories"
  ON public.ambassador_notification_categories;
CREATE POLICY "Ambassadors read notification categories"
  ON public.ambassador_notification_categories FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage notification categories"
  ON public.ambassador_notification_categories;
CREATE POLICY "Admins manage notification categories"
  ON public.ambassador_notification_categories FOR ALL
  TO authenticated
  USING (public.has_admin_permission(auth.uid(),'campus_ambassador.review'))
  WITH CHECK (public.has_admin_permission(auth.uid(),'campus_ambassador.review'));

-- Seed categories
INSERT INTO public.ambassador_notification_categories
  (category_key, label, description, is_optional, in_app_default, pref_column, display_order)
VALUES
  ('referral',              'Referral Updates',        'New referral leads and lead status changes.',       true,  true, 'referral_updates',   10),
  ('enrollment',            'Enrollment Updates',      'Enrollment created, verified, cancelled or refunded.', true, true, 'enrollment_updates', 20),
  ('payment_verification',  'Payment Verification',    'Payment submissions and verification updates.',      false, true, NULL,                 30),
  ('commission',            'Commission Updates',      'Commission eligibility and status changes.',         false, true, NULL,                 40),
  ('earnings',              'Earnings Updates',        'Earnings milestones and wallet updates.',            true,  true, 'earnings_updates',   50),
  ('payout',                'Payout Updates',          'Payout submissions, holds, failures and completions.', false, true, NULL,               60),
  ('campaign',              'Campaign Updates',        'New campaigns, start, ending soon and completion.',  true,  true, 'campaign_updates',   70),
  ('milestone',             'Milestone Updates',       'Campaign milestone progress and achievements.',      true,  true, 'milestone_updates',  80),
  ('badge',                 'Badge Updates',           'Badge achievements.',                                true,  true, 'badge_updates',      90),
  ('level',                 'Level Updates',           'Ambassador level achievements and changes.',         true,  true, 'level_updates',     100),
  ('leaderboard',           'Leaderboard Updates',     'Top 10, Top 3, Rank #1 and final rank updates.',     true,  true, 'leaderboard_updates',110),
  ('recognition',           'Recognition Updates',     'Recognition awards and honours.',                    true,  true, 'recognition_updates',120),
  ('marketing_resources',   'Marketing Resource Updates','New marketing resources and program kits.',        true,  true, 'marketing_updates', 130),
  ('account',               'Account & Security',      'Account security, profile and important account notices.', false, true, NULL,        140),
  ('system',                'System Notices',          'Important system-wide announcements.',               false, true, NULL,                150)
ON CONFLICT (category_key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  is_optional = EXCLUDED.is_optional,
  in_app_default = EXCLUDED.in_app_default,
  pref_column = EXCLUDED.pref_column,
  display_order = EXCLUDED.display_order,
  updated_at = now();

-- 4) Backend preference resolution helper
CREATE OR REPLACE FUNCTION public.amb_category_is_enabled(
  _ambassador_id uuid, _category text
) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_cat public.ambassador_notification_categories%ROWTYPE;
  v_enabled boolean;
  v_sql text;
BEGIN
  SELECT * INTO v_cat FROM public.ambassador_notification_categories
    WHERE category_key = _category;
  -- Unknown / mandatory categories: always allow
  IF NOT FOUND OR NOT v_cat.is_optional OR v_cat.pref_column IS NULL THEN
    RETURN true;
  END IF;
  -- Optional: look up user preference; fall back to config default
  v_sql := format(
    'SELECT %I FROM public.ambassador_notification_preferences WHERE ambassador_id = $1',
    v_cat.pref_column
  );
  EXECUTE v_sql INTO v_enabled USING _ambassador_id;
  IF v_enabled IS NULL THEN
    RETURN COALESCE(v_cat.in_app_default, true);
  END IF;
  -- Also respect the coarse channel toggle
  RETURN v_enabled AND COALESCE((
    SELECT channel_in_app FROM public.ambassador_notification_preferences
      WHERE ambassador_id = _ambassador_id
  ), true);
END $$;

-- 5) Update the shared notification insert helper to respect optional preferences
CREATE OR REPLACE FUNCTION public.tg_amb_notify_insert(
  p_ambassador_id uuid,
  p_category text,
  p_notif_type text,
  p_title text,
  p_message text,
  p_related_entity_type text,
  p_related_entity_id uuid,
  p_action_route text,
  p_dedupe_key text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF p_ambassador_id IS NULL THEN RETURN; END IF;
  SELECT user_id INTO v_user_id FROM public.campus_ambassador_profiles
    WHERE id = p_ambassador_id;
  IF v_user_id IS NULL THEN RETURN; END IF;

  -- Backend preference resolution — suppress optional categories the ambassador has disabled
  IF NOT public.amb_category_is_enabled(p_ambassador_id, p_category) THEN
    RETURN;
  END IF;

  INSERT INTO public.ambassador_notifications (
    user_id, ambassador_id, category, notif_type, title, message,
    related_entity_type, related_entity_id, action_type, action_route, dedupe_key
  ) VALUES (
    v_user_id, p_ambassador_id, p_category, p_notif_type, p_title, p_message,
    p_related_entity_type, p_related_entity_id, 'view', p_action_route, p_dedupe_key
  )
  ON CONFLICT (user_id, dedupe_key) DO NOTHING;
END;
$$;
