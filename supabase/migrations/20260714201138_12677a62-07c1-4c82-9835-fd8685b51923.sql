
-- 1. Role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'campus_ambassador';

-- 2. Sequences
CREATE SEQUENCE IF NOT EXISTS public.campus_ambassador_app_code_seq;
CREATE SEQUENCE IF NOT EXISTS public.campus_ambassador_amb_code_seq;

-- 3. Enums
DO $$ BEGIN
  CREATE TYPE public.ca_application_status AS ENUM (
    'draft','submitted','under_review','more_info_required','approved','rejected','withdrawn'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ca_ambassador_status AS ENUM (
    'active','temporarily_suspended','inactive','terminated'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Applications
CREATE TABLE IF NOT EXISTS public.campus_ambassador_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_code TEXT UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  email_normalized TEXT,
  mobile TEXT NOT NULL,
  mobile_normalized TEXT,

  college_name TEXT NOT NULL,
  campus_city TEXT NOT NULL,
  state TEXT NOT NULL,
  degree_course TEXT NOT NULL,
  specialisation TEXT,
  current_year_of_study TEXT NOT NULL,
  expected_graduation_year INT,

  instagram_url TEXT,
  linkedin_url TEXT,
  other_social_url TEXT,
  campus_network_size TEXT,

  motivation TEXT NOT NULL,
  introduction_plan TEXT,
  previous_ambassador BOOLEAN NOT NULL DEFAULT false,
  previous_brand TEXT,

  acknowledged_commission_program BOOLEAN NOT NULL DEFAULT false,
  confirmed_information_accuracy BOOLEAN NOT NULL DEFAULT false,

  status public.ca_application_status NOT NULL DEFAULT 'submitted',
  admin_message TEXT,          -- request-for-info message visible to applicant
  applicant_reply TEXT,        -- applicant's response to more-info request
  applicant_reply_at TIMESTAMPTZ,
  rejection_reason_public TEXT,-- applicant-visible reason for rejection

  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,

  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ca_apps_user ON public.campus_ambassador_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_ca_apps_status ON public.campus_ambassador_applications(status);

GRANT SELECT, INSERT, UPDATE ON public.campus_ambassador_applications TO authenticated;
GRANT ALL ON public.campus_ambassador_applications TO service_role;

ALTER TABLE public.campus_ambassador_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ca_apps_owner_select"
  ON public.campus_ambassador_applications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "ca_apps_admin_select"
  ON public.campus_ambassador_applications FOR SELECT TO authenticated
  USING (public.has_admin_permission(auth.uid(),'campus_ambassador.review'));
CREATE POLICY "ca_apps_owner_insert"
  ON public.campus_ambassador_applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ca_apps_owner_update"
  ON public.campus_ambassador_applications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id
    AND status IN ('draft','submitted','more_info_required'))
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ca_apps_admin_update"
  ON public.campus_ambassador_applications FOR UPDATE TO authenticated
  USING (public.has_admin_permission(auth.uid(),'campus_ambassador.review'))
  WITH CHECK (public.has_admin_permission(auth.uid(),'campus_ambassador.review'));

-- Trigger: application code + normalizations + updated_at + freeze privileged cols for non-admins
CREATE OR REPLACE FUNCTION public.tg_ca_application_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.application_code IS NULL OR NEW.application_code = '' THEN
      NEW.application_code := 'GL-CA-' || to_char(now(),'YYYY') || '-' ||
        lpad(nextval('public.campus_ambassador_app_code_seq')::text, 6, '0');
    END IF;
    NEW.email_normalized := public.normalize_email(NEW.email);
    NEW.mobile_normalized := public.normalize_phone(NEW.mobile);
    IF NOT public.has_admin_permission(auth.uid(),'campus_ambassador.review') THEN
      IF NEW.status NOT IN ('draft','submitted') THEN
        NEW.status := 'submitted';
      END IF;
      NEW.admin_message := NULL;
      NEW.rejection_reason_public := NULL;
      NEW.reviewed_by := NULL;
      NEW.reviewed_at := NULL;
      NEW.approved_at := NULL;
      NEW.rejected_at := NULL;
    END IF;
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  -- UPDATE
  NEW.email_normalized := public.normalize_email(NEW.email);
  NEW.mobile_normalized := public.normalize_phone(NEW.mobile);
  IF NOT public.has_admin_permission(auth.uid(),'campus_ambassador.review') THEN
    -- applicants may only edit their own draft fields, submit, respond to info requests, or withdraw
    NEW.application_code := OLD.application_code;
    NEW.user_id := OLD.user_id;
    NEW.admin_message := OLD.admin_message;
    NEW.rejection_reason_public := OLD.rejection_reason_public;
    NEW.reviewed_by := OLD.reviewed_by;
    NEW.reviewed_at := OLD.reviewed_at;
    NEW.approved_at := OLD.approved_at;
    NEW.rejected_at := OLD.rejected_at;
    IF OLD.status = 'more_info_required' THEN
      IF NEW.status NOT IN ('more_info_required','withdrawn') THEN
        NEW.status := 'more_info_required';
      END IF;
    ELSIF OLD.status IN ('draft','submitted') THEN
      IF NEW.status NOT IN ('draft','submitted','withdrawn') THEN
        NEW.status := OLD.status;
      END IF;
    ELSE
      NEW.status := OLD.status;
    END IF;
    IF NEW.status = 'withdrawn' AND OLD.status <> 'withdrawn' THEN
      NEW.withdrawn_at := now();
    ELSE
      NEW.withdrawn_at := OLD.withdrawn_at;
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_ca_application_defaults ON public.campus_ambassador_applications;
CREATE TRIGGER trg_ca_application_defaults
BEFORE INSERT OR UPDATE ON public.campus_ambassador_applications
FOR EACH ROW EXECUTE FUNCTION public.tg_ca_application_defaults();

-- 5. Ambassador profile
CREATE TABLE IF NOT EXISTS public.campus_ambassador_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_code TEXT UNIQUE,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.campus_ambassador_applications(id) ON DELETE SET NULL,

  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT NOT NULL,
  college_name TEXT NOT NULL,
  campus_city TEXT NOT NULL,
  state TEXT NOT NULL,
  degree_course TEXT NOT NULL,
  specialisation TEXT,
  current_year_of_study TEXT NOT NULL,
  expected_graduation_year INT,

  status public.ca_ambassador_status NOT NULL DEFAULT 'active',
  approved_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  referral_code TEXT UNIQUE,
  referral_link TEXT,
  commission_rule_id UUID,

  commission_ack_at TIMESTAMPTZ,
  commission_ack_version TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ca_profiles_status ON public.campus_ambassador_profiles(status);

GRANT SELECT, UPDATE ON public.campus_ambassador_profiles TO authenticated;
GRANT ALL ON public.campus_ambassador_profiles TO service_role;

ALTER TABLE public.campus_ambassador_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ca_profiles_owner_select"
  ON public.campus_ambassador_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "ca_profiles_admin_select"
  ON public.campus_ambassador_profiles FOR SELECT TO authenticated
  USING (public.has_admin_permission(auth.uid(),'campus_ambassador.review'));
-- Ambassador may only update their own commission acknowledgement fields (enforced by trigger)
CREATE POLICY "ca_profiles_owner_update"
  ON public.campus_ambassador_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ca_profiles_admin_update"
  ON public.campus_ambassador_profiles FOR UPDATE TO authenticated
  USING (public.has_admin_permission(auth.uid(),'campus_ambassador.review'))
  WITH CHECK (public.has_admin_permission(auth.uid(),'campus_ambassador.review'));

CREATE OR REPLACE FUNCTION public.tg_ca_profile_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.ambassador_code IS NULL OR NEW.ambassador_code = '' THEN
      NEW.ambassador_code := 'GL-CA-AMB-' || to_char(now(),'YYYY') || '-' ||
        lpad(nextval('public.campus_ambassador_amb_code_seq')::text, 6, '0');
    END IF;
    IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
      -- unique code: GLCA + 6 random alphanumerics
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

  -- UPDATE
  IF NOT public.has_admin_permission(auth.uid(),'campus_ambassador.review') THEN
    -- freeze privileged columns for non-admins; only commission acknowledgement may change
    NEW.ambassador_code := OLD.ambassador_code;
    NEW.user_id := OLD.user_id;
    NEW.application_id := OLD.application_id;
    NEW.full_name := OLD.full_name;
    NEW.email := OLD.email;
    NEW.mobile := OLD.mobile;
    NEW.college_name := OLD.college_name;
    NEW.campus_city := OLD.campus_city;
    NEW.state := OLD.state;
    NEW.degree_course := OLD.degree_course;
    NEW.specialisation := OLD.specialisation;
    NEW.current_year_of_study := OLD.current_year_of_study;
    NEW.expected_graduation_year := OLD.expected_graduation_year;
    NEW.status := OLD.status;
    NEW.approved_at := OLD.approved_at;
    NEW.referral_code := OLD.referral_code;
    NEW.referral_link := OLD.referral_link;
    NEW.commission_rule_id := OLD.commission_rule_id;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_ca_profile_defaults ON public.campus_ambassador_profiles;
CREATE TRIGGER trg_ca_profile_defaults
BEFORE INSERT OR UPDATE ON public.campus_ambassador_profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_ca_profile_defaults();

-- 6. Activity log
CREATE TABLE IF NOT EXISTS public.campus_ambassador_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.campus_ambassador_applications(id) ON DELETE CASCADE,
  ambassador_profile_id UUID REFERENCES public.campus_ambassador_profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role TEXT,
  event TEXT NOT NULL,
  detail TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ca_activity_app ON public.campus_ambassador_activity(application_id);
CREATE INDEX IF NOT EXISTS idx_ca_activity_user ON public.campus_ambassador_activity(user_id);

GRANT SELECT, INSERT ON public.campus_ambassador_activity TO authenticated;
GRANT ALL ON public.campus_ambassador_activity TO service_role;

ALTER TABLE public.campus_ambassador_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ca_activity_owner_select"
  ON public.campus_ambassador_activity FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "ca_activity_admin_select"
  ON public.campus_ambassador_activity FOR SELECT TO authenticated
  USING (public.has_admin_permission(auth.uid(),'campus_ambassador.review'));
CREATE POLICY "ca_activity_owner_insert"
  ON public.campus_ambassador_activity FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 7. Admin permission key seed
INSERT INTO public.admin_role_permissions (admin_role, permission_key)
SELECT r, 'campus_ambassador.review'
FROM (VALUES ('super_admin'::public.admin_role_type)) v(r)
ON CONFLICT DO NOTHING;
