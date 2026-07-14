
ALTER TABLE public.campus_ambassador_profiles
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS profile_photo_url text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS youtube_url text,
  ADD COLUMN IF NOT EXISTS other_profile_url text,
  ADD COLUMN IF NOT EXISTS current_level_id uuid,
  ADD COLUMN IF NOT EXISTS profile_completion_percentage int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS leaderboard_show_first_name boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS leaderboard_show_college boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS leaderboard_show_photo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS leaderboard_display_name text;

UPDATE public.campus_ambassador_profiles
SET first_name = COALESCE(first_name, NULLIF(split_part(full_name,' ',1),'')),
    last_name  = COALESCE(last_name,  NULLIF(trim(substring(full_name from position(' ' in full_name)+1)),''))
WHERE first_name IS NULL OR last_name IS NULL;

CREATE TABLE IF NOT EXISTS public.ambassador_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  level_order int NOT NULL,
  icon text,
  gradient_from text,
  gradient_to text,
  min_verified_enrollments int NOT NULL DEFAULT 0,
  min_referral_leads int NOT NULL DEFAULT 0,
  min_commission_earned numeric(12,2) NOT NULL DEFAULT 0,
  min_conversion_rate numeric(5,2) NOT NULL DEFAULT 0,
  min_campaign_milestones int NOT NULL DEFAULT 0,
  min_profile_completion int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ambassador_levels TO authenticated;
GRANT ALL ON public.ambassador_levels TO service_role;
ALTER TABLE public.ambassador_levels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS amb_levels_read_published ON public.ambassador_levels;
CREATE POLICY amb_levels_read_published ON public.ambassador_levels
  FOR SELECT TO authenticated USING (is_published = true OR public.has_admin_permission(auth.uid(),'campus_ambassador.review'));
DROP POLICY IF EXISTS amb_levels_admin_write ON public.ambassador_levels;
CREATE POLICY amb_levels_admin_write ON public.ambassador_levels
  FOR ALL TO authenticated
  USING (public.has_admin_permission(auth.uid(),'campus_ambassador.review'))
  WITH CHECK (public.has_admin_permission(auth.uid(),'campus_ambassador.review'));
DROP TRIGGER IF EXISTS amb_levels_updated_at ON public.ambassador_levels;
CREATE TRIGGER amb_levels_updated_at BEFORE UPDATE ON public.ambassador_levels
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.ambassador_level_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id uuid NOT NULL REFERENCES public.campus_ambassador_profiles(id) ON DELETE CASCADE,
  level_id uuid NOT NULL REFERENCES public.ambassador_levels(id) ON DELETE RESTRICT,
  previous_level_id uuid REFERENCES public.ambassador_levels(id) ON DELETE SET NULL,
  achieved_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'achieved',
  evaluation_reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_amb_level_assign_amb ON public.ambassador_level_assignments(ambassador_id, achieved_at DESC);
GRANT SELECT ON public.ambassador_level_assignments TO authenticated;
GRANT ALL ON public.ambassador_level_assignments TO service_role;
ALTER TABLE public.ambassador_level_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS amb_level_assign_owner_read ON public.ambassador_level_assignments;
CREATE POLICY amb_level_assign_owner_read ON public.ambassador_level_assignments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.campus_ambassador_profiles p
                 WHERE p.id = ambassador_id AND p.user_id = auth.uid())
         OR public.has_admin_permission(auth.uid(),'campus_ambassador.review'));

CREATE TABLE IF NOT EXISTS public.ambassador_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  icon text,
  category text NOT NULL DEFAULT 'special',
  rule_type text NOT NULL,
  rule_threshold numeric(12,2) NOT NULL DEFAULT 0,
  visibility text NOT NULL DEFAULT 'visible',
  is_published boolean NOT NULL DEFAULT false,
  gradient_from text,
  gradient_to text,
  display_order int NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ambassador_badges TO authenticated;
GRANT ALL ON public.ambassador_badges TO service_role;
ALTER TABLE public.ambassador_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS amb_badges_read_published ON public.ambassador_badges;
CREATE POLICY amb_badges_read_published ON public.ambassador_badges
  FOR SELECT TO authenticated USING (is_published = true OR public.has_admin_permission(auth.uid(),'campus_ambassador.review'));
DROP POLICY IF EXISTS amb_badges_admin_write ON public.ambassador_badges;
CREATE POLICY amb_badges_admin_write ON public.ambassador_badges
  FOR ALL TO authenticated
  USING (public.has_admin_permission(auth.uid(),'campus_ambassador.review'))
  WITH CHECK (public.has_admin_permission(auth.uid(),'campus_ambassador.review'));
DROP TRIGGER IF EXISTS amb_badges_updated_at ON public.ambassador_badges;
CREATE TRIGGER amb_badges_updated_at BEFORE UPDATE ON public.ambassador_badges
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.ambassador_badge_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id uuid NOT NULL REFERENCES public.campus_ambassador_profiles(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.ambassador_badges(id) ON DELETE CASCADE,
  achieved_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'earned',
  related_entity_type text,
  related_entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ambassador_id, badge_id)
);
CREATE INDEX IF NOT EXISTS idx_amb_badge_ach_amb ON public.ambassador_badge_achievements(ambassador_id, achieved_at DESC);
GRANT SELECT ON public.ambassador_badge_achievements TO authenticated;
GRANT ALL ON public.ambassador_badge_achievements TO service_role;
ALTER TABLE public.ambassador_badge_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS amb_badge_ach_owner_read ON public.ambassador_badge_achievements;
CREATE POLICY amb_badge_ach_owner_read ON public.ambassador_badge_achievements
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.campus_ambassador_profiles p
                 WHERE p.id = ambassador_id AND p.user_id = auth.uid())
         OR public.has_admin_permission(auth.uid(),'campus_ambassador.review'));

CREATE TABLE IF NOT EXISTS public.ambassador_institution_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id uuid NOT NULL REFERENCES public.campus_ambassador_profiles(id) ON DELETE CASCADE,
  suggested_name text NOT NULL,
  city text,
  state text,
  country text DEFAULT 'India',
  official_website text,
  status text NOT NULL DEFAULT 'submitted',
  admin_note text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ambassador_institution_suggestions TO authenticated;
GRANT ALL ON public.ambassador_institution_suggestions TO service_role;
ALTER TABLE public.ambassador_institution_suggestions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS amb_inst_sugg_owner_read ON public.ambassador_institution_suggestions;
CREATE POLICY amb_inst_sugg_owner_read ON public.ambassador_institution_suggestions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.campus_ambassador_profiles p WHERE p.id = ambassador_id AND p.user_id = auth.uid())
         OR public.has_admin_permission(auth.uid(),'campus_ambassador.review'));
DROP POLICY IF EXISTS amb_inst_sugg_owner_insert ON public.ambassador_institution_suggestions;
CREATE POLICY amb_inst_sugg_owner_insert ON public.ambassador_institution_suggestions
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.campus_ambassador_profiles p WHERE p.id = ambassador_id AND p.user_id = auth.uid()));
DROP POLICY IF EXISTS amb_inst_sugg_admin_update ON public.ambassador_institution_suggestions;
CREATE POLICY amb_inst_sugg_admin_update ON public.ambassador_institution_suggestions
  FOR UPDATE TO authenticated
  USING (public.has_admin_permission(auth.uid(),'campus_ambassador.review'))
  WITH CHECK (public.has_admin_permission(auth.uid(),'campus_ambassador.review'));
DROP TRIGGER IF EXISTS amb_inst_sugg_updated_at ON public.ambassador_institution_suggestions;
CREATE TRIGGER amb_inst_sugg_updated_at BEFORE UPDATE ON public.ambassador_institution_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.ambassador_college_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id uuid NOT NULL REFERENCES public.campus_ambassador_profiles(id) ON DELETE CASCADE,
  current_college_name text NOT NULL,
  requested_college_name text NOT NULL,
  requested_city text,
  requested_state text,
  change_reason text,
  status text NOT NULL DEFAULT 'submitted',
  admin_note text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.ambassador_college_change_requests TO authenticated;
GRANT ALL ON public.ambassador_college_change_requests TO service_role;
ALTER TABLE public.ambassador_college_change_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS amb_ccr_owner_read ON public.ambassador_college_change_requests;
CREATE POLICY amb_ccr_owner_read ON public.ambassador_college_change_requests
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.campus_ambassador_profiles p WHERE p.id = ambassador_id AND p.user_id = auth.uid())
         OR public.has_admin_permission(auth.uid(),'campus_ambassador.review'));
DROP POLICY IF EXISTS amb_ccr_owner_insert ON public.ambassador_college_change_requests;
CREATE POLICY amb_ccr_owner_insert ON public.ambassador_college_change_requests
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.campus_ambassador_profiles p WHERE p.id = ambassador_id AND p.user_id = auth.uid()));
DROP POLICY IF EXISTS amb_ccr_owner_cancel ON public.ambassador_college_change_requests;
CREATE POLICY amb_ccr_owner_cancel ON public.ambassador_college_change_requests
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.campus_ambassador_profiles p WHERE p.id = ambassador_id AND p.user_id = auth.uid())
         OR public.has_admin_permission(auth.uid(),'campus_ambassador.review'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.campus_ambassador_profiles p WHERE p.id = ambassador_id AND p.user_id = auth.uid())
              OR public.has_admin_permission(auth.uid(),'campus_ambassador.review'));
DROP TRIGGER IF EXISTS amb_ccr_updated_at ON public.ambassador_college_change_requests;
CREATE TRIGGER amb_ccr_updated_at BEFORE UPDATE ON public.ambassador_college_change_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.ambassador_notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id uuid NOT NULL UNIQUE REFERENCES public.campus_ambassador_profiles(id) ON DELETE CASCADE,
  referral_updates boolean NOT NULL DEFAULT true,
  enrollment_updates boolean NOT NULL DEFAULT true,
  commission_updates boolean NOT NULL DEFAULT true,
  payout_updates boolean NOT NULL DEFAULT true,
  campaign_updates boolean NOT NULL DEFAULT true,
  marketing_updates boolean NOT NULL DEFAULT true,
  level_badge_updates boolean NOT NULL DEFAULT true,
  channel_in_app boolean NOT NULL DEFAULT true,
  channel_email boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.ambassador_notification_preferences TO authenticated;
GRANT ALL ON public.ambassador_notification_preferences TO service_role;
ALTER TABLE public.ambassador_notification_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS amb_notif_pref_owner_all ON public.ambassador_notification_preferences;
CREATE POLICY amb_notif_pref_owner_all ON public.ambassador_notification_preferences
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.campus_ambassador_profiles p WHERE p.id = ambassador_id AND p.user_id = auth.uid())
         OR public.has_admin_permission(auth.uid(),'campus_ambassador.review'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.campus_ambassador_profiles p WHERE p.id = ambassador_id AND p.user_id = auth.uid())
              OR public.has_admin_permission(auth.uid(),'campus_ambassador.review'));
DROP TRIGGER IF EXISTS amb_notif_pref_updated_at ON public.ambassador_notification_preferences;
CREATE TRIGGER amb_notif_pref_updated_at BEFORE UPDATE ON public.ambassador_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.ambassador_profile_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id uuid NOT NULL REFERENCES public.campus_ambassador_profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_amb_profile_activity_amb ON public.ambassador_profile_activity(ambassador_id, created_at DESC);
GRANT SELECT, INSERT ON public.ambassador_profile_activity TO authenticated;
GRANT ALL ON public.ambassador_profile_activity TO service_role;
ALTER TABLE public.ambassador_profile_activity ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS amb_profile_activity_owner_read ON public.ambassador_profile_activity;
CREATE POLICY amb_profile_activity_owner_read ON public.ambassador_profile_activity
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.campus_ambassador_profiles p WHERE p.id = ambassador_id AND p.user_id = auth.uid())
         OR public.has_admin_permission(auth.uid(),'campus_ambassador.review'));
DROP POLICY IF EXISTS amb_profile_activity_owner_insert ON public.ambassador_profile_activity;
CREATE POLICY amb_profile_activity_owner_insert ON public.ambassador_profile_activity
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.campus_ambassador_profiles p WHERE p.id = ambassador_id AND p.user_id = auth.uid()));

-- Update profile defaults trigger to allow editable fields
CREATE OR REPLACE FUNCTION public.tg_ca_profile_defaults()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.ambassador_code IS NULL OR NEW.ambassador_code = '' THEN
      NEW.ambassador_code := 'GL-CA-AMB-' || to_char(now(),'YYYY') || '-' ||
        lpad(nextval('public.campus_ambassador_amb_code_seq')::text, 6, '0');
    END IF;
    IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
      LOOP
        NEW.referral_code := 'GLCA' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
        EXIT WHEN NOT EXISTS (
          SELECT 1 FROM public.campus_ambassador_profiles
          WHERE referral_code = NEW.referral_code
        );
      END LOOP;
    END IF;
    IF NEW.referral_link IS NULL OR NEW.referral_link = '' THEN
      NEW.referral_link := '/r/ca/' || NEW.referral_code;
    END IF;
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  IF NOT public.has_admin_permission(auth.uid(),'campus_ambassador.review') THEN
    NEW.ambassador_code := OLD.ambassador_code;
    NEW.user_id := OLD.user_id;
    NEW.application_id := OLD.application_id;
    NEW.email := OLD.email;
    NEW.mobile := OLD.mobile;
    NEW.status := OLD.status;
    NEW.approved_at := OLD.approved_at;
    NEW.referral_code := OLD.referral_code;
    NEW.referral_link := OLD.referral_link;
    NEW.commission_rule_id := OLD.commission_rule_id;
    NEW.current_level_id := OLD.current_level_id;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.evaluate_ambassador_level(_ambassador_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  verified_enrollments int; referral_leads int; commission_earned numeric;
  conversion_rate numeric; profile_completion int;
  target_level_id uuid; current_lvl uuid;
BEGIN
  SELECT COUNT(*) INTO verified_enrollments FROM public.ambassador_commissions
    WHERE ambassador_id = _ambassador_id AND status IN ('approved','paid','available');
  SELECT COUNT(*) INTO referral_leads FROM public.ambassador_referral_leads WHERE ambassador_id = _ambassador_id;
  SELECT COALESCE(SUM(amount_final),0) INTO commission_earned FROM public.ambassador_commissions
    WHERE ambassador_id = _ambassador_id AND status IN ('approved','paid','available');
  IF referral_leads > 0 THEN
    conversion_rate := (verified_enrollments::numeric / referral_leads::numeric) * 100;
  ELSE
    conversion_rate := 0;
  END IF;
  SELECT profile_completion_percentage, current_level_id INTO profile_completion, current_lvl
    FROM public.campus_ambassador_profiles WHERE id = _ambassador_id;

  SELECT id INTO target_level_id FROM public.ambassador_levels
    WHERE is_published = true
      AND min_verified_enrollments <= verified_enrollments
      AND min_referral_leads <= referral_leads
      AND min_commission_earned <= commission_earned
      AND min_conversion_rate <= conversion_rate
      AND min_profile_completion <= COALESCE(profile_completion,0)
    ORDER BY level_order DESC LIMIT 1;

  IF target_level_id IS NOT NULL AND (current_lvl IS DISTINCT FROM target_level_id) THEN
    INSERT INTO public.ambassador_level_assignments
      (ambassador_id, level_id, previous_level_id, evaluation_reference)
    VALUES (_ambassador_id, target_level_id, current_lvl, 'auto');
    UPDATE public.campus_ambassador_profiles SET current_level_id = target_level_id WHERE id = _ambassador_id;
    INSERT INTO public.ambassador_profile_activity (ambassador_id, event_type, description, metadata)
    VALUES (_ambassador_id, 'level_achieved',
      (SELECT 'Achieved level: ' || name FROM public.ambassador_levels WHERE id = target_level_id),
      jsonb_build_object('level_id', target_level_id));
  END IF;
  RETURN target_level_id;
END $$;

CREATE OR REPLACE FUNCTION public.evaluate_ambassador_badges(_ambassador_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referral_leads int; verified_enrollments int; commission_earned numeric;
  marketing_resources_used int; b record; granted int := 0;
BEGIN
  SELECT COUNT(*) INTO referral_leads FROM public.ambassador_referral_leads WHERE ambassador_id = _ambassador_id;
  SELECT COUNT(*) INTO verified_enrollments FROM public.ambassador_commissions
    WHERE ambassador_id = _ambassador_id AND status IN ('approved','paid','available');
  SELECT COALESCE(SUM(amount_final),0) INTO commission_earned FROM public.ambassador_commissions
    WHERE ambassador_id = _ambassador_id AND status IN ('approved','paid','available');
  SELECT COUNT(DISTINCT resource_id) INTO marketing_resources_used
    FROM public.marketing_resource_interactions
    WHERE ambassador_id = _ambassador_id
      AND interaction_type IN ('downloaded','caption_copied','share_message_copied','qr_downloaded','personalised_generated');

  FOR b IN SELECT * FROM public.ambassador_badges WHERE is_published = true LOOP
    IF (b.rule_type = 'referral_leads' AND referral_leads >= b.rule_threshold)
       OR (b.rule_type = 'verified_enrollments' AND verified_enrollments >= b.rule_threshold)
       OR (b.rule_type = 'commission_earned' AND commission_earned >= b.rule_threshold)
       OR (b.rule_type = 'marketing_resources_used' AND marketing_resources_used >= b.rule_threshold)
    THEN
      INSERT INTO public.ambassador_badge_achievements (ambassador_id, badge_id, metadata)
      VALUES (_ambassador_id, b.id, jsonb_build_object('rule_type', b.rule_type, 'threshold', b.rule_threshold))
      ON CONFLICT (ambassador_id, badge_id) DO NOTHING;
      IF FOUND THEN
        granted := granted + 1;
        INSERT INTO public.ambassador_profile_activity (ambassador_id, event_type, description, metadata)
        VALUES (_ambassador_id, 'badge_earned', 'Earned badge: ' || b.name, jsonb_build_object('badge_id', b.id));
      END IF;
    END IF;
  END LOOP;
  RETURN granted;
END $$;

INSERT INTO public.ambassador_levels
  (level_key, name, description, level_order, icon, gradient_from, gradient_to,
   min_verified_enrollments, min_referral_leads, min_commission_earned,
   min_conversion_rate, min_profile_completion, is_published)
VALUES
  ('starter','Starter','Every ambassador starts here. Build your first referrals to grow.',1,'Sparkles','#94a3b8','#cbd5e1',0,0,0,0,0,true),
  ('rising','Rising Ambassador','Referring and enrolling actively across your campus.',2,'TrendingUp','#22d3ee','#0ea5e9',3,10,5000,0,60,true),
  ('influencer','Campus Influencer','Consistent conversions and campus-wide reach.',3,'Users','#3b82f6','#6366f1',10,25,20000,20,80,true),
  ('leader','Campus Leader','A recognised leader driving strong ambassador results.',4,'Award','#a855f7','#7c3aed',25,60,60000,30,90,true),
  ('elite','Elite Ambassador','Top-tier Glintr ambassador with exceptional performance.',5,'Crown','#f59e0b','#ea580c',50,120,150000,35,100,true)
ON CONFLICT (level_key) DO NOTHING;

INSERT INTO public.ambassador_badges
  (badge_key, name, description, icon, category, rule_type, rule_threshold, is_published, gradient_from, gradient_to, display_order)
VALUES
  ('first_referral','First Referral','Your very first referral lead. Every big journey starts here.','Rocket','referral','referral_leads',1,true,'#22d3ee','#3b82f6',10),
  ('referral_pro','Referral Pro','Reached 25 valid referral leads.','Users','referral','referral_leads',25,true,'#6366f1','#8b5cf6',20),
  ('first_enrollment','First Verified Enrollment','Converted your first enrollment.','CheckCircle2','enrollment','verified_enrollments',1,true,'#10b981','#059669',30),
  ('five_enrollments','5 Verified Enrollments','Delivered 5 verified enrollments.','TrendingUp','enrollment','verified_enrollments',5,true,'#0ea5e9','#3b82f6',40),
  ('ten_enrollments','10 Verified Enrollments','Delivered 10 verified enrollments.','Trophy','enrollment','verified_enrollments',10,true,'#f59e0b','#ea580c',50),
  ('high_converter','High Converter','Crossed 25 verified enrollments — a true converter.','Zap','performance','verified_enrollments',25,true,'#a855f7','#6366f1',60),
  ('commission_milestone_10k','Commission Milestone: 10K','Total commission earned crossed 10,000.','IndianRupee','earnings','commission_earned',10000,true,'#059669','#0d9488',70),
  ('commission_milestone_50k','Commission Milestone: 50K','Total commission earned crossed 50,000.','IndianRupee','earnings','commission_earned',50000,true,'#f59e0b','#ea580c',80),
  ('marketing_creator','Marketing Creator','Used 5 different marketing resources.','Palette','marketing','marketing_resources_used',5,true,'#ec4899','#a855f7',90)
ON CONFLICT (badge_key) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='amb_photos_read_own') THEN
    CREATE POLICY "amb_photos_read_own" ON storage.objects FOR SELECT TO authenticated
      USING (bucket_id = 'ambassador-profile-photos' AND owner = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='amb_photos_write_own') THEN
    CREATE POLICY "amb_photos_write_own" ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'ambassador-profile-photos' AND owner = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='amb_photos_update_own') THEN
    CREATE POLICY "amb_photos_update_own" ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'ambassador-profile-photos' AND owner = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='amb_photos_delete_own') THEN
    CREATE POLICY "amb_photos_delete_own" ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'ambassador-profile-photos' AND owner = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='amb_photos_admin_read') THEN
    CREATE POLICY "amb_photos_admin_read" ON storage.objects FOR SELECT TO authenticated
      USING (bucket_id = 'ambassador-profile-photos' AND public.has_admin_permission(auth.uid(),'campus_ambassador.review'));
  END IF;
END $$;
