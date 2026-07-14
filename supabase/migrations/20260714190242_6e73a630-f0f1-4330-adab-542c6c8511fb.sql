
-- =====================================================================
-- ENUMS
-- =====================================================================
DO $$ BEGIN
  CREATE TYPE public.live_session_status AS ENUM
    ('scheduled','starting_soon','live','completed','cancelled','rescheduled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.session_attendance_status AS ENUM
    ('not_marked','attended','partially_attended','missed','excused');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.session_resource_type AS ENUM
    ('pdf','presentation','document','dataset','code','link','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================================
-- MENTORS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.session_mentors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  photo_url TEXT,
  title TEXT,
  bio TEXT,
  expertise TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.session_mentors TO authenticated;
GRANT ALL ON public.session_mentors TO service_role;
ALTER TABLE public.session_mentors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users can view active mentors"
  ON public.session_mentors FOR SELECT TO authenticated
  USING (is_active = TRUE);

CREATE POLICY "Admins manage mentors"
  ON public.session_mentors FOR ALL TO authenticated
  USING (public.is_active_admin(auth.uid()))
  WITH CHECK (public.is_active_admin(auth.uid()));

CREATE TRIGGER trg_session_mentors_updated
  BEFORE UPDATE ON public.session_mentors
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =====================================================================
-- LIVE SESSIONS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.course_modules(id) ON DELETE SET NULL,
  mentor_id UUID REFERENCES public.session_mentors(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  learning_topics TEXT[] NOT NULL DEFAULT '{}',
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 60,
  meeting_url TEXT,
  join_window_minutes INT NOT NULL DEFAULT 15,
  status public.live_session_status NOT NULL DEFAULT 'scheduled',
  previous_scheduled_at TIMESTAMPTZ,
  cancellation_note TEXT,
  recording_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS live_sessions_course_scheduled_idx
  ON public.live_sessions (course_id, scheduled_at);
CREATE INDEX IF NOT EXISTS live_sessions_status_idx
  ON public.live_sessions (status);

GRANT SELECT ON public.live_sessions TO authenticated;
GRANT ALL ON public.live_sessions TO service_role;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enrolled students can view program sessions"
  ON public.live_sessions FOR SELECT TO authenticated
  USING (
    is_published = TRUE
    AND public.student_enrolled_in_course(auth.uid(), course_id)
  );

CREATE POLICY "Admins view all sessions"
  ON public.live_sessions FOR SELECT TO authenticated
  USING (public.is_active_admin(auth.uid()));

CREATE POLICY "Admins manage sessions"
  ON public.live_sessions FOR ALL TO authenticated
  USING (public.is_active_admin(auth.uid()))
  WITH CHECK (public.is_active_admin(auth.uid()));

CREATE TRIGGER trg_live_sessions_updated
  BEFORE UPDATE ON public.live_sessions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =====================================================================
-- SESSION RESOURCES
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.session_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  resource_type public.session_resource_type NOT NULL DEFAULT 'link',
  url TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS session_resources_session_idx
  ON public.session_resources (session_id, display_order);

GRANT SELECT ON public.session_resources TO authenticated;
GRANT ALL ON public.session_resources TO service_role;
ALTER TABLE public.session_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enrolled students view published session resources"
  ON public.session_resources FOR SELECT TO authenticated
  USING (
    is_published = TRUE
    AND EXISTS (
      SELECT 1 FROM public.live_sessions s
      WHERE s.id = session_resources.session_id
        AND s.is_published = TRUE
        AND public.student_enrolled_in_course(auth.uid(), s.course_id)
    )
  );

CREATE POLICY "Admins view all session resources"
  ON public.session_resources FOR SELECT TO authenticated
  USING (public.is_active_admin(auth.uid()));

CREATE POLICY "Admins manage session resources"
  ON public.session_resources FOR ALL TO authenticated
  USING (public.is_active_admin(auth.uid()))
  WITH CHECK (public.is_active_admin(auth.uid()));

CREATE TRIGGER trg_session_resources_updated
  BEFORE UPDATE ON public.session_resources
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =====================================================================
-- SESSION ATTENDANCE
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.session_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.session_attendance_status NOT NULL DEFAULT 'not_marked',
  minutes_attended INT,
  confirmed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  confirmed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, student_user_id)
);

CREATE INDEX IF NOT EXISTS session_attendance_student_idx
  ON public.session_attendance (student_user_id);

GRANT SELECT ON public.session_attendance TO authenticated;
GRANT ALL ON public.session_attendance TO service_role;
ALTER TABLE public.session_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view their own attendance"
  ON public.session_attendance FOR SELECT TO authenticated
  USING (student_user_id = auth.uid());

CREATE POLICY "Admins view all attendance"
  ON public.session_attendance FOR SELECT TO authenticated
  USING (public.is_active_admin(auth.uid()));

CREATE POLICY "Admins manage attendance"
  ON public.session_attendance FOR ALL TO authenticated
  USING (public.is_active_admin(auth.uid()))
  WITH CHECK (public.is_active_admin(auth.uid()));

CREATE TRIGGER trg_session_attendance_updated
  BEFORE UPDATE ON public.session_attendance
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =====================================================================
-- SESSION JOIN EVENTS (join attempt log — NOT attendance)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.session_join_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS session_join_events_student_idx
  ON public.session_join_events (student_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS session_join_events_session_idx
  ON public.session_join_events (session_id);

GRANT SELECT, INSERT ON public.session_join_events TO authenticated;
GRANT ALL ON public.session_join_events TO service_role;
ALTER TABLE public.session_join_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view their own join events"
  ON public.session_join_events FOR SELECT TO authenticated
  USING (student_user_id = auth.uid());

CREATE POLICY "Admins view all join events"
  ON public.session_join_events FOR SELECT TO authenticated
  USING (public.is_active_admin(auth.uid()));

-- Inserts happen via the server function (which uses the user's supabase client);
-- allow the row if it belongs to the caller and they are enrolled.
CREATE POLICY "Students record their own join events"
  ON public.session_join_events FOR INSERT TO authenticated
  WITH CHECK (
    student_user_id = auth.uid()
    AND public.student_enrolled_in_course(auth.uid(), course_id)
  );
