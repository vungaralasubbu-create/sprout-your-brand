
-- Add lesson content fields (nullable, additive)
ALTER TABLE public.course_lessons
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS content text;

-- Extend lesson_progress with video-tracking fields
ALTER TABLE public.lesson_progress
  ADD COLUMN IF NOT EXISTS video_progress_pct integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_position_seconds numeric NOT NULL DEFAULT 0;

-- Private per-student lesson notes
CREATE TABLE IF NOT EXISTS public.lesson_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_user_id, lesson_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_notes TO authenticated;
GRANT ALL ON public.lesson_notes TO service_role;

ALTER TABLE public.lesson_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage their own lesson notes"
  ON public.lesson_notes FOR ALL
  TO authenticated
  USING (student_user_id = auth.uid())
  WITH CHECK (student_user_id = auth.uid());

CREATE POLICY "Admins can view lesson notes for support"
  ON public.lesson_notes FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

DROP TRIGGER IF EXISTS trg_lesson_notes_updated_at ON public.lesson_notes;
CREATE TRIGGER trg_lesson_notes_updated_at
  BEFORE UPDATE ON public.lesson_notes
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_lesson_notes_student ON public.lesson_notes(student_user_id, lesson_id);
