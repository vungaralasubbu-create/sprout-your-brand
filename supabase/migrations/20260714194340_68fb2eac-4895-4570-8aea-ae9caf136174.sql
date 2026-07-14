
-- Enums
DO $$ BEGIN
  CREATE TYPE public.interview_type AS ENUM ('technical','hr','behavioural','project','internship','mixed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.interview_difficulty AS ENUM ('beginner','intermediate','advanced');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.interview_mode AS ENUM ('text','voice');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.interview_status AS ENUM ('in_progress','completed','incomplete');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- interview_sessions
CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interview_type public.interview_type NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  target_role TEXT,
  difficulty public.interview_difficulty NOT NULL DEFAULT 'intermediate',
  mode public.interview_mode NOT NULL DEFAULT 'text',
  question_count INT NOT NULL CHECK (question_count IN (5,10,15)),
  status public.interview_status NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  answered_count INT NOT NULL DEFAULT 0,
  skipped_count INT NOT NULL DEFAULT 0,
  avg_practice_score NUMERIC(5,2),
  use_resume BOOLEAN NOT NULL DEFAULT false,
  project_id UUID REFERENCES public.student_projects(id) ON DELETE SET NULL,
  internship_id UUID REFERENCES public.student_internships(id) ON DELETE SET NULL,
  ai_available BOOLEAN NOT NULL DEFAULT true,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_student ON public.interview_sessions(student_user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_status ON public.interview_sessions(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_sessions TO authenticated;
GRANT ALL ON public.interview_sessions TO service_role;

ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own interview sessions"
  ON public.interview_sessions FOR ALL
  USING (auth.uid() = student_user_id)
  WITH CHECK (auth.uid() = student_user_id);

CREATE POLICY "Admins view all interview sessions"
  ON public.interview_sessions FOR SELECT
  USING (public.is_active_admin(auth.uid()));

CREATE TRIGGER trg_interview_sessions_updated
  BEFORE UPDATE ON public.interview_sessions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- interview_questions
CREATE TABLE IF NOT EXISTS public.interview_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  position INT NOT NULL,
  question_text TEXT NOT NULL,
  category TEXT,
  expected_topics JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, position)
);

CREATE INDEX IF NOT EXISTS idx_interview_questions_session ON public.interview_questions(session_id, position);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_questions TO authenticated;
GRANT ALL ON public.interview_questions TO service_role;

ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students access own interview questions"
  ON public.interview_questions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.interview_sessions s WHERE s.id = session_id AND s.student_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.interview_sessions s WHERE s.id = session_id AND s.student_user_id = auth.uid()));

CREATE POLICY "Admins view interview questions"
  ON public.interview_questions FOR SELECT
  USING (public.is_active_admin(auth.uid()));

-- interview_answers
CREATE TABLE IF NOT EXISTS public.interview_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.interview_questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  transcript TEXT,
  is_skipped BOOLEAN NOT NULL DEFAULT false,
  practice_score NUMERIC(5,2),
  feedback JSONB NOT NULL DEFAULT '{}'::jsonb,
  category_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  evaluation_status TEXT NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  evaluated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_interview_answers_session ON public.interview_answers(session_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_answers TO authenticated;
GRANT ALL ON public.interview_answers TO service_role;

ALTER TABLE public.interview_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students access own interview answers"
  ON public.interview_answers FOR ALL
  USING (EXISTS (SELECT 1 FROM public.interview_sessions s WHERE s.id = session_id AND s.student_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.interview_sessions s WHERE s.id = session_id AND s.student_user_id = auth.uid()));

CREATE POLICY "Admins view interview answers"
  ON public.interview_answers FOR SELECT
  USING (public.is_active_admin(auth.uid()));

CREATE TRIGGER trg_interview_answers_updated
  BEFORE UPDATE ON public.interview_answers
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- interview_activity
CREATE TABLE IF NOT EXISTS public.interview_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interview_activity_student ON public.interview_activity(student_user_id, created_at DESC);

GRANT SELECT, INSERT ON public.interview_activity TO authenticated;
GRANT ALL ON public.interview_activity TO service_role;

ALTER TABLE public.interview_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students insert own interview activity"
  ON public.interview_activity FOR INSERT
  WITH CHECK (auth.uid() = student_user_id);

CREATE POLICY "Students read own interview activity"
  ON public.interview_activity FOR SELECT
  USING (auth.uid() = student_user_id);

CREATE POLICY "Admins view interview activity"
  ON public.interview_activity FOR SELECT
  USING (public.is_active_admin(auth.uid()));
