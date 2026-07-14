
DO $$ BEGIN CREATE TYPE public.internship_status AS ENUM ('locked','eligible','active','in_progress','completion_review','completed','suspended','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.internship_task_status AS ENUM ('locked','available','in_progress','submitted','under_review','needs_revision','completed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.internship_stage_status AS ENUM ('locked','available','in_progress','completed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.internship_task_type AS ENUM ('learning','research','practical','technical','case_study','industry','documentation','presentation','portfolio'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.internship_project_type AS ENUM ('practice','industry_inspired','capstone','final'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.internship_submission_review AS ENUM ('pending','under_review','needs_revision','approved'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.internships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  duration_weeks int,
  sequential boolean NOT NULL DEFAULT true,
  publish_status text NOT NULL DEFAULT 'draft',
  eligibility jsonb NOT NULL DEFAULT '{}'::jsonb,
  completion_requirements jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(course_id)
);
GRANT SELECT ON public.internships TO authenticated;
GRANT ALL ON public.internships TO service_role;
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students view internships for enrolled programs" ON public.internships FOR SELECT TO authenticated
  USING (publish_status = 'published' AND public.student_enrolled_in_course(auth.uid(), course_id));
CREATE POLICY "admins manage internships" ON public.internships FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.internship_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id uuid NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
  order_index int NOT NULL DEFAULT 0,
  name text NOT NULL,
  description text,
  is_required boolean NOT NULL DEFAULT true,
  publish_status text NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.internship_stages TO authenticated;
GRANT ALL ON public.internship_stages TO service_role;
ALTER TABLE public.internship_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students view stages" ON public.internship_stages FOR SELECT TO authenticated
  USING (publish_status='published' AND EXISTS (SELECT 1 FROM public.internships i WHERE i.id=internship_id AND i.publish_status='published' AND public.student_enrolled_in_course(auth.uid(), i.course_id)));
CREATE POLICY "admins manage stages" ON public.internship_stages FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.internship_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid NOT NULL REFERENCES public.internship_stages(id) ON DELETE CASCADE,
  order_index int NOT NULL DEFAULT 0,
  title text NOT NULL,
  task_type public.internship_task_type NOT NULL DEFAULT 'practical',
  description text,
  objective text,
  instructions text,
  requirements text,
  expected_outcome text,
  submission_instructions text,
  evaluation_criteria text,
  submission_types text[] NOT NULL DEFAULT ARRAY['text','file']::text[],
  allow_multiple_files boolean NOT NULL DEFAULT false,
  due_offset_days int,
  estimated_hours numeric(6,2),
  is_required boolean NOT NULL DEFAULT true,
  publish_status text NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.internship_tasks TO authenticated;
GRANT ALL ON public.internship_tasks TO service_role;
ALTER TABLE public.internship_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students view tasks" ON public.internship_tasks FOR SELECT TO authenticated
  USING (publish_status='published' AND EXISTS (SELECT 1 FROM public.internship_stages s JOIN public.internships i ON i.id=s.internship_id WHERE s.id=stage_id AND i.publish_status='published' AND public.student_enrolled_in_course(auth.uid(), i.course_id)));
CREATE POLICY "admins manage tasks" ON public.internship_tasks FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.internship_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id uuid NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
  project_type public.internship_project_type NOT NULL DEFAULT 'practice',
  title text NOT NULL,
  description text,
  requirements text,
  expected_outcome text,
  submission_instructions text,
  is_final boolean NOT NULL DEFAULT false,
  is_required boolean NOT NULL DEFAULT true,
  course_project_template_id uuid REFERENCES public.course_project_templates(id) ON DELETE SET NULL,
  order_index int NOT NULL DEFAULT 0,
  publish_status text NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.internship_projects TO authenticated;
GRANT ALL ON public.internship_projects TO service_role;
ALTER TABLE public.internship_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students view internship projects" ON public.internship_projects FOR SELECT TO authenticated
  USING (publish_status='published' AND EXISTS (SELECT 1 FROM public.internships i WHERE i.id=internship_id AND i.publish_status='published' AND public.student_enrolled_in_course(auth.uid(), i.course_id)));
CREATE POLICY "admins manage internship projects" ON public.internship_projects FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.student_internships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  internship_id uuid NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
  status public.internship_status NOT NULL DEFAULT 'eligible',
  started_at timestamptz,
  completed_at timestamptz,
  review_started_at timestamptz,
  current_stage_id uuid REFERENCES public.internship_stages(id) ON DELETE SET NULL,
  progress_percent numeric(5,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_user_id, internship_id)
);
GRANT SELECT, INSERT, UPDATE ON public.student_internships TO authenticated;
GRANT ALL ON public.student_internships TO service_role;
ALTER TABLE public.student_internships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student view own internships" ON public.student_internships FOR SELECT TO authenticated
  USING (student_user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "student create own internship" ON public.student_internships FOR INSERT TO authenticated
  WITH CHECK (student_user_id = auth.uid());
CREATE POLICY "student update own internship" ON public.student_internships FOR UPDATE TO authenticated
  USING (student_user_id = auth.uid()) WITH CHECK (student_user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.student_internship_stage_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_internship_id uuid NOT NULL REFERENCES public.student_internships(id) ON DELETE CASCADE,
  stage_id uuid NOT NULL REFERENCES public.internship_stages(id) ON DELETE CASCADE,
  status public.internship_stage_status NOT NULL DEFAULT 'locked',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_internship_id, stage_id)
);
GRANT SELECT, INSERT, UPDATE ON public.student_internship_stage_progress TO authenticated;
GRANT ALL ON public.student_internship_stage_progress TO service_role;
ALTER TABLE public.student_internship_stage_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student view stage progress" ON public.student_internship_stage_progress FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.student_internships si WHERE si.id=student_internship_id AND (si.student_user_id=auth.uid() OR public.is_admin(auth.uid()))));
CREATE POLICY "student insert stage progress" ON public.student_internship_stage_progress FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.student_internships si WHERE si.id=student_internship_id AND si.student_user_id=auth.uid()));
CREATE POLICY "student update stage progress" ON public.student_internship_stage_progress FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.student_internships si WHERE si.id=student_internship_id AND si.student_user_id=auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.student_internships si WHERE si.id=student_internship_id AND si.student_user_id=auth.uid()));

CREATE TABLE IF NOT EXISTS public.student_internship_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_internship_id uuid NOT NULL REFERENCES public.student_internships(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.internship_tasks(id) ON DELETE CASCADE,
  status public.internship_task_status NOT NULL DEFAULT 'available',
  started_at timestamptz,
  completed_at timestamptz,
  current_version int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_internship_id, task_id)
);
GRANT SELECT, INSERT, UPDATE ON public.student_internship_tasks TO authenticated;
GRANT ALL ON public.student_internship_tasks TO service_role;
ALTER TABLE public.student_internship_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student view task progress" ON public.student_internship_tasks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.student_internships si WHERE si.id=student_internship_id AND (si.student_user_id=auth.uid() OR public.is_admin(auth.uid()))));
CREATE POLICY "student insert task progress" ON public.student_internship_tasks FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.student_internships si WHERE si.id=student_internship_id AND si.student_user_id=auth.uid()));
CREATE POLICY "student update task progress" ON public.student_internship_tasks FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.student_internships si WHERE si.id=student_internship_id AND si.student_user_id=auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.student_internships si WHERE si.id=student_internship_id AND si.student_user_id=auth.uid()));

CREATE TABLE IF NOT EXISTS public.student_internship_task_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_internship_task_id uuid NOT NULL REFERENCES public.student_internship_tasks(id) ON DELETE CASCADE,
  version int NOT NULL DEFAULT 1,
  text_response text,
  submission_link text,
  repository_link text,
  live_project_link text,
  files jsonb NOT NULL DEFAULT '[]'::jsonb,
  submission_notes text,
  is_late boolean NOT NULL DEFAULT false,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  review_status public.internship_submission_review NOT NULL DEFAULT 'pending',
  review_notes text,
  reviewed_at timestamptz,
  reviewer_user_id uuid,
  score numeric(6,2),
  max_score numeric(6,2),
  result text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_internship_task_id, version)
);
GRANT SELECT, INSERT ON public.student_internship_task_submissions TO authenticated;
GRANT ALL ON public.student_internship_task_submissions TO service_role;
ALTER TABLE public.student_internship_task_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student view submissions" ON public.student_internship_task_submissions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.student_internship_tasks sit JOIN public.student_internships si ON si.id=sit.student_internship_id WHERE sit.id=student_internship_task_id AND (si.student_user_id=auth.uid() OR public.is_admin(auth.uid()))));
CREATE POLICY "student insert submission" ON public.student_internship_task_submissions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.student_internship_tasks sit JOIN public.student_internships si ON si.id=sit.student_internship_id WHERE sit.id=student_internship_task_id AND si.student_user_id=auth.uid()));

CREATE TABLE IF NOT EXISTS public.student_internship_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_internship_id uuid REFERENCES public.student_internships(id) ON DELETE CASCADE,
  event text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.student_internship_activity TO authenticated;
GRANT ALL ON public.student_internship_activity TO service_role;
ALTER TABLE public.student_internship_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student view own activity" ON public.student_internship_activity FOR SELECT TO authenticated
  USING (student_user_id=auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "student insert own activity" ON public.student_internship_activity FOR INSERT TO authenticated
  WITH CHECK (student_user_id=auth.uid());

CREATE TRIGGER trg_internships_updated BEFORE UPDATE ON public.internships FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_internship_stages_updated BEFORE UPDATE ON public.internship_stages FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_internship_tasks_updated BEFORE UPDATE ON public.internship_tasks FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_internship_projects_updated BEFORE UPDATE ON public.internship_projects FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_student_internships_updated BEFORE UPDATE ON public.student_internships FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_sisp_updated BEFORE UPDATE ON public.student_internship_stage_progress FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_sit_updated BEFORE UPDATE ON public.student_internship_tasks FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_sits_updated BEFORE UPDATE ON public.student_internship_task_submissions FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_internship_stages_internship ON public.internship_stages(internship_id, order_index);
CREATE INDEX IF NOT EXISTS idx_internship_tasks_stage ON public.internship_tasks(stage_id, order_index);
CREATE INDEX IF NOT EXISTS idx_student_internships_user ON public.student_internships(student_user_id);
CREATE INDEX IF NOT EXISTS idx_student_internship_tasks_si ON public.student_internship_tasks(student_internship_id);
CREATE INDEX IF NOT EXISTS idx_sits_task ON public.student_internship_task_submissions(student_internship_task_id, version);
CREATE INDEX IF NOT EXISTS idx_sia_user ON public.student_internship_activity(student_user_id, occurred_at DESC);
