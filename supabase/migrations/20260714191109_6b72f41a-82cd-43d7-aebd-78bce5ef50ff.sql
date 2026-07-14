
-- 1) Extend the project catalog
ALTER TABLE public.course_project_templates
  ADD COLUMN IF NOT EXISTS objective text,
  ADD COLUMN IF NOT EXISTS requirements text,
  ADD COLUMN IF NOT EXISTS expected_outcome text,
  ADD COLUMN IF NOT EXISTS submission_instructions text,
  ADD COLUMN IF NOT EXISTS evaluation_criteria text,
  ADD COLUMN IF NOT EXISTS estimated_duration_hours integer,
  ADD COLUMN IF NOT EXISTS portfolio_eligible boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_repo_link boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_live_link boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_attachment boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;

-- 2) Course-Project link: module + unlock + due date + published flag
ALTER TABLE public.course_projects
  ADD COLUMN IF NOT EXISTS module_id uuid REFERENCES public.course_modules(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS unlock_rule text NOT NULL DEFAULT 'module_available'
    CHECK (unlock_rule IN ('enrollment','module_available','module_completed','lesson_completed','previous_project_completed','manual')),
  ADD COLUMN IF NOT EXISTS required_lesson_id uuid REFERENCES public.course_lessons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS required_project_id uuid REFERENCES public.course_project_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS due_days_from_start integer,
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;

-- 3) Project tasks
CREATE TABLE IF NOT EXISTS public.project_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.course_project_templates(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.project_tasks TO authenticated, anon;
GRANT ALL ON public.project_tasks TO service_role;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage project_tasks" ON public.project_tasks;
CREATE POLICY "Admins manage project_tasks" ON public.project_tasks
  FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Public read project_tasks" ON public.project_tasks;
CREATE POLICY "Public read project_tasks" ON public.project_tasks FOR SELECT USING (true);
DROP TRIGGER IF EXISTS trg_project_tasks_updated ON public.project_tasks;
CREATE TRIGGER trg_project_tasks_updated BEFORE UPDATE ON public.project_tasks
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX IF NOT EXISTS project_tasks_project_idx ON public.project_tasks(project_id, display_order);

-- 4) Per-student project progress
CREATE TABLE IF NOT EXISTS public.student_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.course_project_templates(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES public.enrollments(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress','submitted','under_review','needs_revision','completed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  last_submitted_at timestamptz,
  completed_at timestamptz,
  current_version integer NOT NULL DEFAULT 0,
  portfolio_added boolean NOT NULL DEFAULT false,
  portfolio_selected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_user_id, course_id, project_id)
);
GRANT SELECT, INSERT, UPDATE ON public.student_projects TO authenticated;
GRANT ALL ON public.student_projects TO service_role;
ALTER TABLE public.student_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "students read own student_projects" ON public.student_projects;
CREATE POLICY "students read own student_projects" ON public.student_projects
  FOR SELECT TO authenticated
  USING (student_user_id = auth.uid() OR is_admin(auth.uid()));
DROP POLICY IF EXISTS "students insert own student_projects" ON public.student_projects;
CREATE POLICY "students insert own student_projects" ON public.student_projects
  FOR INSERT TO authenticated
  WITH CHECK (student_user_id = auth.uid()
              AND student_enrolled_in_course(auth.uid(), course_id));
-- Students may only update rows in student-controlled states, and only to
-- other student-controlled states or 'submitted'. Reviewer-controlled states
-- (under_review, completed) can only be set by admin/reviewer policies.
DROP POLICY IF EXISTS "students update own student_projects" ON public.student_projects;
CREATE POLICY "students update own student_projects" ON public.student_projects
  FOR UPDATE TO authenticated
  USING (student_user_id = auth.uid()
         AND status IN ('in_progress','submitted','needs_revision'))
  WITH CHECK (student_user_id = auth.uid()
              AND status IN ('in_progress','submitted','needs_revision'));
DROP POLICY IF EXISTS "admins manage student_projects" ON public.student_projects;
CREATE POLICY "admins manage student_projects" ON public.student_projects
  FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
DROP TRIGGER IF EXISTS trg_sp_updated ON public.student_projects;
CREATE TRIGGER trg_sp_updated BEFORE UPDATE ON public.student_projects
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX IF NOT EXISTS student_projects_student_idx ON public.student_projects(student_user_id);
CREATE INDEX IF NOT EXISTS student_projects_course_idx ON public.student_projects(course_id);

-- 5) Versioned student project submissions
CREATE TABLE IF NOT EXISTS public.student_project_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_project_id uuid NOT NULL REFERENCES public.student_projects(id) ON DELETE CASCADE,
  student_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.course_project_templates(id) ON DELETE CASCADE,
  version integer NOT NULL,
  title text,
  summary text,
  submission_notes text,
  repository_url text,
  live_url text,
  reference_url text,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted','under_review','needs_revision','approved','completed')),
  reviewer_feedback text,
  reviewer_notes text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_project_id, version)
);
GRANT SELECT, INSERT ON public.student_project_submissions TO authenticated;
GRANT ALL ON public.student_project_submissions TO service_role;
ALTER TABLE public.student_project_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "students read own project_submissions" ON public.student_project_submissions;
CREATE POLICY "students read own project_submissions" ON public.student_project_submissions
  FOR SELECT TO authenticated
  USING (student_user_id = auth.uid() OR is_admin(auth.uid()));
DROP POLICY IF EXISTS "students insert own project_submissions" ON public.student_project_submissions;
CREATE POLICY "students insert own project_submissions" ON public.student_project_submissions
  FOR INSERT TO authenticated
  WITH CHECK (student_user_id = auth.uid()
              AND student_enrolled_in_course(auth.uid(), course_id));
DROP POLICY IF EXISTS "admins manage project_submissions" ON public.student_project_submissions;
CREATE POLICY "admins manage project_submissions" ON public.student_project_submissions
  FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
DROP TRIGGER IF EXISTS trg_sps_updated ON public.student_project_submissions;
CREATE TRIGGER trg_sps_updated BEFORE UPDATE ON public.student_project_submissions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX IF NOT EXISTS sps_project_idx ON public.student_project_submissions(student_project_id);
CREATE INDEX IF NOT EXISTS sps_student_idx ON public.student_project_submissions(student_user_id);

-- 6) Learning activity: add project events
ALTER TABLE public.student_activity
  DROP CONSTRAINT IF EXISTS student_activity_activity_type_check;
ALTER TABLE public.student_activity
  ADD CONSTRAINT student_activity_activity_type_check
  CHECK (activity_type = ANY (ARRAY[
    'lesson_completed','assignment_submitted','assessment_completed',
    'course_completed','certificate_issued',
    'program_started','program_opened','module_opened','lesson_opened',
    'module_unlocked','program_content_completed',
    'session_details_opened','session_join_attempt',
    'session_recording_opened','session_resource_opened',
    'project_opened','project_started','project_submitted','project_resubmitted',
    'project_revision_requested','project_approved','project_completed',
    'project_portfolio_updated'
  ]));
