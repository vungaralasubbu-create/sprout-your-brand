
-- Student profiles: canonical record for every learner. Auto-created on signup.
CREATE TABLE IF NOT EXISTS public.student_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  mobile TEXT,
  city TEXT,
  state TEXT,
  learner_type TEXT NOT NULL DEFAULT 'student' CHECK (learner_type IN ('student','working_professional')),
  education TEXT,
  graduation_year INT,
  current_role_title TEXT,
  work_experience TEXT,
  preferred_mode TEXT,
  onboarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.student_profiles TO authenticated;
GRANT ALL ON public.student_profiles TO service_role;

ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own student profile"
  ON public.student_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all student profiles"
  ON public.student_profiles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE OR REPLACE FUNCTION public.tg_touch_student_profiles_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS student_profiles_touch ON public.student_profiles;
CREATE TRIGGER student_profiles_touch BEFORE UPDATE ON public.student_profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_touch_student_profiles_updated_at();

-- Auto-provision student_profile + student role for every new auth user.
CREATE OR REPLACE FUNCTION public.tg_provision_student_on_signup()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  meta_full_name TEXT;
  meta_mobile TEXT;
  meta_learner_type TEXT;
BEGIN
  meta_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name');
  meta_mobile := COALESCE(NEW.raw_user_meta_data->>'mobile', NEW.phone);
  meta_learner_type := NEW.raw_user_meta_data->>'learner_type';
  IF meta_learner_type NOT IN ('student','working_professional') OR meta_learner_type IS NULL THEN
    meta_learner_type := 'student';
  END IF;

  INSERT INTO public.student_profiles (user_id, full_name, email, mobile, learner_type)
  VALUES (NEW.id, meta_full_name, NEW.email, meta_mobile, meta_learner_type)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created_provision_student ON auth.users;
CREATE TRIGGER on_auth_user_created_provision_student
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.tg_provision_student_on_signup();

-- Backfill: every existing auth user gets a student_profile.
INSERT INTO public.student_profiles (user_id, email)
SELECT u.id, u.email FROM auth.users u
LEFT JOIN public.student_profiles sp ON sp.user_id = u.id
WHERE sp.user_id IS NULL;
