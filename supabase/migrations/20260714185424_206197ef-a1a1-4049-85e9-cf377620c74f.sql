
-- 1. Courses: unlock_mode
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS unlock_mode text NOT NULL DEFAULT 'sequential'
  CHECK (unlock_mode IN ('sequential','open'));

-- 2. Modules: is_required
ALTER TABLE public.course_modules
  ADD COLUMN IF NOT EXISTS is_required boolean NOT NULL DEFAULT true;

-- 3. Lessons: is_required
ALTER TABLE public.course_lessons
  ADD COLUMN IF NOT EXISTS is_required boolean NOT NULL DEFAULT true;

-- 4. Enrollments: current position + content completion cache
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS current_module_id uuid REFERENCES public.course_modules(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS current_lesson_id uuid REFERENCES public.course_lessons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS content_completed_at timestamptz;

-- 5. module_completions
CREATE TABLE IF NOT EXISTS public.module_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_user_id, module_id)
);
CREATE INDEX IF NOT EXISTS mc_student_course_idx
  ON public.module_completions (student_user_id, course_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.module_completions TO authenticated;
GRANT ALL ON public.module_completions TO service_role;
ALTER TABLE public.module_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students manage own module completions"
  ON public.module_completions
  FOR ALL TO authenticated
  USING (student_user_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (student_user_id = auth.uid() OR public.is_admin(auth.uid()));

-- 6. program_content_completions
CREATE TABLE IF NOT EXISTS public.program_content_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_user_id, course_id)
);
CREATE INDEX IF NOT EXISTS pcc_student_idx
  ON public.program_content_completions (student_user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_content_completions TO authenticated;
GRANT ALL ON public.program_content_completions TO service_role;
ALTER TABLE public.program_content_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students manage own program content completions"
  ON public.program_content_completions
  FOR ALL TO authenticated
  USING (student_user_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (student_user_id = auth.uid() OR public.is_admin(auth.uid()));
