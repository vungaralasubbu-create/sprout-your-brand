
-- 1. Extend enrollments for LMS
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS student_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lms_status TEXT NOT NULL DEFAULT 'active' CHECK (lms_status IN ('active','completed','paused')),
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS enrollments_student_idx ON public.enrollments(student_user_id);
CREATE INDEX IF NOT EXISTS enrollments_course_idx ON public.enrollments(course_id);

-- Allow students to read their own enrollments
DROP POLICY IF EXISTS "student reads own enrollments" ON public.enrollments;
CREATE POLICY "student reads own enrollments" ON public.enrollments FOR SELECT
  TO authenticated USING (student_user_id = auth.uid());

DROP POLICY IF EXISTS "student updates own enrollment access" ON public.enrollments;
CREATE POLICY "student updates own enrollment access" ON public.enrollments FOR UPDATE
  TO authenticated USING (student_user_id = auth.uid())
  WITH CHECK (student_user_id = auth.uid() AND lms_status IN ('active','paused'));

-- Helper: is_student
CREATE OR REPLACE FUNCTION public.is_student(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'student');
$$;

-- Helper: verify enrollment ownership + course
CREATE OR REPLACE FUNCTION public.student_enrolled_in_course(_user_id UUID, _course_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.enrollments
    WHERE student_user_id = _user_id
      AND course_id = _course_id
      AND lms_status IN ('active','completed','paused')
  );
$$;

-- 2. lesson_progress
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_user_id, lesson_id)
);
CREATE INDEX IF NOT EXISTS lp_student_course_idx ON public.lesson_progress(student_user_id, course_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students manage own lesson progress" ON public.lesson_progress FOR ALL TO authenticated
  USING (student_user_id = auth.uid() OR is_admin(auth.uid()))
  WITH CHECK (student_user_id = auth.uid() OR is_admin(auth.uid()));
CREATE TRIGGER trg_lp_updated BEFORE UPDATE ON public.lesson_progress FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 3. course_assignments
CREATE TABLE IF NOT EXISTS public.course_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.course_modules(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  allow_text BOOLEAN NOT NULL DEFAULT true,
  allow_file BOOLEAN NOT NULL DEFAULT true,
  due_days INTEGER,
  is_required BOOLEAN NOT NULL DEFAULT true,
  is_published BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_assignments TO authenticated;
GRANT ALL ON public.course_assignments TO service_role;
ALTER TABLE public.course_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students read published assignments they can access" ON public.course_assignments FOR SELECT TO authenticated
  USING (is_admin(auth.uid()) OR (is_published AND student_enrolled_in_course(auth.uid(), course_id)));
CREATE POLICY "admins manage assignments" ON public.course_assignments FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE TRIGGER trg_ca_updated BEFORE UPDATE ON public.course_assignments FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 4. assignment_submissions
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.course_assignments(id) ON DELETE CASCADE,
  student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  submission_text TEXT,
  file_url TEXT,
  submission_notes TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','under_review','approved','changes_required')),
  reviewer_feedback TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS as_student_idx ON public.assignment_submissions(student_user_id);
CREATE INDEX IF NOT EXISTS as_assignment_idx ON public.assignment_submissions(assignment_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignment_submissions TO authenticated;
GRANT ALL ON public.assignment_submissions TO service_role;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students read own submissions" ON public.assignment_submissions FOR SELECT TO authenticated
  USING (student_user_id = auth.uid() OR is_admin(auth.uid()));
CREATE POLICY "students insert own submissions" ON public.assignment_submissions FOR INSERT TO authenticated
  WITH CHECK (student_user_id = auth.uid() AND student_enrolled_in_course(auth.uid(), course_id));
CREATE POLICY "students update own pending submissions" ON public.assignment_submissions FOR UPDATE TO authenticated
  USING (student_user_id = auth.uid() AND status IN ('submitted','changes_required'))
  WITH CHECK (student_user_id = auth.uid());
CREATE POLICY "admins manage submissions" ON public.assignment_submissions FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE TRIGGER trg_as_updated BEFORE UPDATE ON public.assignment_submissions FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 5. course_assessments
CREATE TABLE IF NOT EXISTS public.course_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.course_modules(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  pass_percentage NUMERIC(5,2) NOT NULL DEFAULT 60,
  time_limit_minutes INTEGER,
  is_required BOOLEAN NOT NULL DEFAULT true,
  is_published BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_assessments TO authenticated;
GRANT ALL ON public.course_assessments TO service_role;
ALTER TABLE public.course_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students read published assessments they can access" ON public.course_assessments FOR SELECT TO authenticated
  USING (is_admin(auth.uid()) OR (is_published AND student_enrolled_in_course(auth.uid(), course_id)));
CREATE POLICY "admins manage assessments" ON public.course_assessments FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE TRIGGER trg_asx_updated BEFORE UPDATE ON public.course_assessments FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 6. assessment_questions
CREATE TABLE IF NOT EXISTS public.assessment_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.course_assessments(id) ON DELETE CASCADE,
  question_type TEXT NOT NULL CHECK (question_type IN ('mcq','multi','tf')),
  question_text TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  points NUMERIC(6,2) NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessment_questions TO authenticated;
GRANT ALL ON public.assessment_questions TO service_role;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students read questions of accessible assessments" ON public.assessment_questions FOR SELECT TO authenticated
  USING (is_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.course_assessments a
    WHERE a.id = assessment_questions.assessment_id
      AND a.is_published
      AND student_enrolled_in_course(auth.uid(), a.course_id)
  ));
CREATE POLICY "admins manage questions" ON public.assessment_questions FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE TRIGGER trg_aq_updated BEFORE UPDATE ON public.assessment_questions FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 7. assessment_attempts
CREATE TABLE IF NOT EXISTS public.assessment_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.course_assessments(id) ON DELETE CASCADE,
  student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  score NUMERIC(6,2),
  max_score NUMERIC(6,2),
  percentage NUMERIC(5,2),
  passed BOOLEAN,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','submitted')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS aa_student_idx ON public.assessment_attempts(student_user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessment_attempts TO authenticated;
GRANT ALL ON public.assessment_attempts TO service_role;
ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students read own attempts" ON public.assessment_attempts FOR SELECT TO authenticated
  USING (student_user_id = auth.uid() OR is_admin(auth.uid()));
CREATE POLICY "students insert own attempts" ON public.assessment_attempts FOR INSERT TO authenticated
  WITH CHECK (student_user_id = auth.uid() AND student_enrolled_in_course(auth.uid(), course_id));
CREATE POLICY "students update own in-progress attempts" ON public.assessment_attempts FOR UPDATE TO authenticated
  USING (student_user_id = auth.uid() AND status = 'in_progress')
  WITH CHECK (student_user_id = auth.uid());
CREATE POLICY "admins manage attempts" ON public.assessment_attempts FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE TRIGGER trg_aa_updated BEFORE UPDATE ON public.assessment_attempts FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 8. course_completion_requirements
CREATE TABLE IF NOT EXISTS public.course_completion_requirements (
  course_id UUID NOT NULL PRIMARY KEY REFERENCES public.courses(id) ON DELETE CASCADE,
  require_lessons BOOLEAN NOT NULL DEFAULT true,
  require_assignments BOOLEAN NOT NULL DEFAULT false,
  require_assessments BOOLEAN NOT NULL DEFAULT false,
  require_projects BOOLEAN NOT NULL DEFAULT false,
  min_lesson_completion_pct NUMERIC(5,2) NOT NULL DEFAULT 100,
  certificate_type TEXT NOT NULL DEFAULT 'Course Completion Certificate',
  accreditation_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.course_completion_requirements TO authenticated, anon;
GRANT ALL ON public.course_completion_requirements TO service_role;
ALTER TABLE public.course_completion_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read completion reqs" ON public.course_completion_requirements FOR SELECT USING (true);
CREATE POLICY "admins manage completion reqs" ON public.course_completion_requirements FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE TRIGGER trg_ccr_updated BEFORE UPDATE ON public.course_completion_requirements FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 9. certificates
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  course_name TEXT NOT NULL,
  certificate_number TEXT NOT NULL UNIQUE,
  verification_code TEXT NOT NULL UNIQUE,
  certificate_type TEXT NOT NULL DEFAULT 'Course Completion Certificate',
  completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_user_id, course_id)
);
CREATE INDEX IF NOT EXISTS certs_student_idx ON public.certificates(student_user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
-- Public verification uses a security-definer RPC, so no broad anon SELECT.
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students read own certificates" ON public.certificates FOR SELECT TO authenticated
  USING (student_user_id = auth.uid() OR is_admin(auth.uid()));
CREATE POLICY "admins manage certificates" ON public.certificates FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE TRIGGER trg_cert_updated BEFORE UPDATE ON public.certificates FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 10. student_activity
CREATE TABLE IF NOT EXISTS public.student_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('lesson_completed','assignment_submitted','assessment_completed','course_completed','certificate_issued')),
  description TEXT NOT NULL,
  entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sa_student_idx ON public.student_activity(student_user_id, created_at DESC);
GRANT SELECT, INSERT ON public.student_activity TO authenticated;
GRANT ALL ON public.student_activity TO service_role;
ALTER TABLE public.student_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students read own activity" ON public.student_activity FOR SELECT TO authenticated
  USING (student_user_id = auth.uid() OR is_admin(auth.uid()));
CREATE POLICY "students insert own activity" ON public.student_activity FOR INSERT TO authenticated
  WITH CHECK (student_user_id = auth.uid());

-- 11. Public verification RPC (only minimal info)
CREATE OR REPLACE FUNCTION public.verify_certificate(_code TEXT)
RETURNS TABLE(
  is_valid BOOLEAN,
  student_name TEXT,
  course_name TEXT,
  certificate_number TEXT,
  certificate_type TEXT,
  completion_date DATE,
  issued_at TIMESTAMPTZ
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    (c.revoked_at IS NULL) AS is_valid,
    c.student_name, c.course_name, c.certificate_number, c.certificate_type, c.completion_date, c.issued_at
  FROM public.certificates c
  WHERE c.verification_code = _code
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.verify_certificate(TEXT) TO anon, authenticated;
