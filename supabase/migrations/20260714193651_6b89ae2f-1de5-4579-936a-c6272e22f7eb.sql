
-- ============================================================
-- Career Profile (one per student)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.career_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  headline TEXT,
  objective TEXT,
  city TEXT,
  state TEXT,
  education_level TEXT,
  college TEXT,
  degree TEXT,
  specialisation TEXT,
  graduation_year INT,
  current_student_status TEXT,
  years_of_experience NUMERIC(4,1),
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.career_profiles TO authenticated;
GRANT ALL ON public.career_profiles TO service_role;
ALTER TABLE public.career_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "career_profiles owner" ON public.career_profiles
  FOR ALL TO authenticated
  USING (auth.uid() = student_user_id)
  WITH CHECK (auth.uid() = student_user_id);
CREATE POLICY "career_profiles admin read" ON public.career_profiles
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE TRIGGER trg_career_profiles_updated
  BEFORE UPDATE ON public.career_profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- Education
-- ============================================================
CREATE TABLE IF NOT EXISTS public.student_education (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution TEXT NOT NULL,
  degree TEXT,
  specialisation TEXT,
  start_year INT,
  end_year INT,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX student_education_user_idx ON public.student_education (student_user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_education TO authenticated;
GRANT ALL ON public.student_education TO service_role;
ALTER TABLE public.student_education ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student_education owner" ON public.student_education
  FOR ALL TO authenticated
  USING (auth.uid() = student_user_id)
  WITH CHECK (auth.uid() = student_user_id);
CREATE POLICY "student_education admin read" ON public.student_education
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE TRIGGER trg_student_education_updated
  BEFORE UPDATE ON public.student_education
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- Skills (student-added or linked from program/project/internship)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.student_skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  skill_source TEXT NOT NULL DEFAULT 'student_added'
    CHECK (skill_source IN ('student_added','program_skill','project_skill','internship_skill')),
  skill_level TEXT
    CHECK (skill_level IS NULL OR skill_level IN ('beginner','intermediate','advanced')),
  linked_skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
  linked_course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  show_in_profile BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_user_id, skill_name, skill_source, linked_course_id)
);
CREATE INDEX student_skills_user_idx ON public.student_skills (student_user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_skills TO authenticated;
GRANT ALL ON public.student_skills TO service_role;
ALTER TABLE public.student_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student_skills owner" ON public.student_skills
  FOR ALL TO authenticated
  USING (auth.uid() = student_user_id)
  WITH CHECK (auth.uid() = student_user_id);
CREATE POLICY "student_skills admin read" ON public.student_skills
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE TRIGGER trg_student_skills_updated
  BEFORE UPDATE ON public.student_skills
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- Career preferences (one per student)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.student_career_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_role TEXT,
  preferred_industries TEXT[] NOT NULL DEFAULT '{}',
  preferred_work_types TEXT[] NOT NULL DEFAULT '{}',
  preferred_locations TEXT[] NOT NULL DEFAULT '{}',
  open_to_internship BOOLEAN NOT NULL DEFAULT FALSE,
  open_to_entry_level BOOLEAN NOT NULL DEFAULT FALSE,
  open_to_remote BOOLEAN NOT NULL DEFAULT FALSE,
  open_to_opportunities BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_career_preferences TO authenticated;
GRANT ALL ON public.student_career_preferences TO service_role;
ALTER TABLE public.student_career_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "career_prefs owner" ON public.student_career_preferences
  FOR ALL TO authenticated
  USING (auth.uid() = student_user_id)
  WITH CHECK (auth.uid() = student_user_id);
CREATE POLICY "career_prefs admin read" ON public.student_career_preferences
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE TRIGGER trg_career_prefs_updated
  BEFORE UPDATE ON public.student_career_preferences
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- Career activity log
-- ============================================================
CREATE TABLE IF NOT EXISTS public.career_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX career_activity_user_idx ON public.career_activity (student_user_id, created_at DESC);
GRANT SELECT, INSERT ON public.career_activity TO authenticated;
GRANT ALL ON public.career_activity TO service_role;
ALTER TABLE public.career_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "career_activity owner select" ON public.career_activity
  FOR SELECT TO authenticated
  USING (auth.uid() = student_user_id);
CREATE POLICY "career_activity owner insert" ON public.career_activity
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = student_user_id);
CREATE POLICY "career_activity admin read" ON public.career_activity
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
