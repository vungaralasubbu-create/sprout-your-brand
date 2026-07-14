
-- 1. Extend course_assignments with configuration fields
ALTER TABLE public.course_assignments
  ADD COLUMN IF NOT EXISTS assignment_type text NOT NULL DEFAULT 'lesson_assignment',
  ADD COLUMN IF NOT EXISTS learning_objective text,
  ADD COLUMN IF NOT EXISTS requirements text,
  ADD COLUMN IF NOT EXISTS expected_format text,
  ADD COLUMN IF NOT EXISTS evaluation_criteria text,
  ADD COLUMN IF NOT EXISTS max_score numeric,
  ADD COLUMN IF NOT EXISTS passing_score numeric,
  ADD COLUMN IF NOT EXISTS due_at timestamptz,
  ADD COLUMN IF NOT EXISTS allow_link boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_repo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_multiple_files boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS block_late boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS unlock_rule text NOT NULL DEFAULT 'module_available',
  ADD COLUMN IF NOT EXISTS unlock_lesson_id uuid REFERENCES public.course_lessons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS unlock_module_id uuid REFERENCES public.course_modules(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS unlock_assignment_id uuid REFERENCES public.course_assignments(id) ON DELETE SET NULL;

-- 2. Extend assignment_submissions with versioning + scoring + link fields
ALTER TABLE public.assignment_submissions
  ADD COLUMN IF NOT EXISTS version int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS submission_link text,
  ADD COLUMN IF NOT EXISTS repository_link text,
  ADD COLUMN IF NOT EXISTS files jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_draft boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_late boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS score numeric,
  ADD COLUMN IF NOT EXISTS result text,
  ADD COLUMN IF NOT EXISTS revision_notes text;

-- Replace the tight status check with the expanded set
ALTER TABLE public.assignment_submissions
  DROP CONSTRAINT IF EXISTS assignment_submissions_status_check;
ALTER TABLE public.assignment_submissions
  ADD CONSTRAINT assignment_submissions_status_check
  CHECK (status IN ('draft','submitted','under_review','needs_revision','approved'));

CREATE INDEX IF NOT EXISTS as_student_assignment_version_idx
  ON public.assignment_submissions (student_user_id, assignment_id, version DESC);

-- Old submit-in-place UPDATE policy no longer applies; students only INSERT new versions.
DROP POLICY IF EXISTS "students update own submissions" ON public.assignment_submissions;

-- 3. Per-student assignment state
CREATE TABLE IF NOT EXISTS public.student_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_id uuid NOT NULL REFERENCES public.course_assignments(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started','in_progress','submitted','under_review','needs_revision','completed')),
  started_at timestamptz,
  last_submitted_at timestamptz,
  current_version int NOT NULL DEFAULT 0,
  completed_at timestamptz,
  is_portfolio boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_user_id, assignment_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_assignments TO authenticated;
GRANT ALL ON public.student_assignments TO service_role;

ALTER TABLE public.student_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student reads own assignment progress"
  ON public.student_assignments FOR SELECT TO authenticated
  USING (student_user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "student inserts own assignment progress"
  ON public.student_assignments FOR INSERT TO authenticated
  WITH CHECK (
    student_user_id = auth.uid()
    AND public.student_enrolled_in_course(auth.uid(), course_id)
  );

CREATE POLICY "student updates own progress limited"
  ON public.student_assignments FOR UPDATE TO authenticated
  USING (student_user_id = auth.uid())
  WITH CHECK (
    student_user_id = auth.uid()
    AND status IN ('not_started','in_progress','submitted','needs_revision')
  );

CREATE POLICY "admins manage student assignments"
  ON public.student_assignments FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_sa_updated
  BEFORE UPDATE ON public.student_assignments
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
