
-- ==============================================================
-- Enums
-- ==============================================================
DO $$ BEGIN
  CREATE TYPE public.student_support_category AS ENUM (
    'program_access','lesson_or_video','learning_progress','live_session',
    'project','assignment','certificate','internship','career_center',
    'resume_builder','interview_practice','ai_mentor','technical_issue',
    'account_issue','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.student_support_context_type AS ENUM (
    'none','program','lesson','live_session','project','assignment',
    'certificate','internship','internship_task','resume','interview_session',
    'ai_mentor_conversation'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.student_support_status AS ENUM (
    'open','assigned','in_progress','waiting_student','waiting_support','resolved','closed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.student_support_priority AS ENUM ('low','normal','high','urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ==============================================================
-- Code sequence
-- ==============================================================
CREATE SEQUENCE IF NOT EXISTS public.student_support_ticket_code_seq START 1;

-- ==============================================================
-- Tickets
-- ==============================================================
CREATE TABLE IF NOT EXISTS public.student_support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_code text UNIQUE,
  student_user_id uuid NOT NULL,
  program_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  category public.student_support_category NOT NULL,
  context_type public.student_support_context_type NOT NULL DEFAULT 'none',
  context_record_id uuid,
  subject text NOT NULL,
  description text NOT NULL,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  status public.student_support_status NOT NULL DEFAULT 'open',
  priority public.student_support_priority NOT NULL DEFAULT 'normal',
  assigned_admin_id uuid,
  assigned_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz,
  reopened_at timestamptz,
  resolution_note text,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sst_student ON public.student_support_tickets(student_user_id, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_sst_status ON public.student_support_tickets(status);

GRANT SELECT, INSERT, UPDATE ON public.student_support_tickets TO authenticated;
GRANT ALL ON public.student_support_tickets TO service_role;
ALTER TABLE public.student_support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sst_student_select ON public.student_support_tickets;
CREATE POLICY sst_student_select ON public.student_support_tickets
  FOR SELECT TO authenticated
  USING (auth.uid() = student_user_id
         OR public.has_admin_permission(auth.uid(),'support.review'));

DROP POLICY IF EXISTS sst_student_insert ON public.student_support_tickets;
CREATE POLICY sst_student_insert ON public.student_support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = student_user_id);

-- Students may update only limited fields; enforce column protection via trigger.
DROP POLICY IF EXISTS sst_student_update ON public.student_support_tickets;
CREATE POLICY sst_student_update ON public.student_support_tickets
  FOR UPDATE TO authenticated
  USING (auth.uid() = student_user_id
         OR public.has_admin_permission(auth.uid(),'support.review'))
  WITH CHECK (auth.uid() = student_user_id
              OR public.has_admin_permission(auth.uid(),'support.review'));

-- Trigger: assign ticket_code + last_updated + protect privileged fields for students
CREATE OR REPLACE FUNCTION public.tg_student_support_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.ticket_code IS NULL OR NEW.ticket_code = '' THEN
      NEW.ticket_code := 'GL-ST-' || to_char(now(),'YYYY') || '-' ||
        lpad(nextval('public.student_support_ticket_code_seq')::text, 6, '0');
    END IF;
    -- Students may not set privileged status/priority on creation
    IF NOT public.has_admin_permission(auth.uid(),'support.review') THEN
      NEW.status := 'open';
      NEW.priority := 'normal';
      NEW.assigned_admin_id := NULL;
      NEW.assigned_at := NULL;
      NEW.resolved_at := NULL;
      NEW.closed_at := NULL;
      NEW.resolution_note := NULL;
    END IF;
    NEW.last_activity_at := now();
    RETURN NEW;
  END IF;

  -- UPDATE: if the actor is not an authorised support admin, freeze privileged columns
  IF NOT public.has_admin_permission(auth.uid(),'support.review') THEN
    NEW.status := OLD.status;
    NEW.priority := OLD.priority;
    NEW.assigned_admin_id := OLD.assigned_admin_id;
    NEW.assigned_at := OLD.assigned_at;
    NEW.resolved_at := OLD.resolved_at;
    NEW.closed_at := OLD.closed_at;
    NEW.resolution_note := OLD.resolution_note;
    NEW.student_user_id := OLD.student_user_id;
    NEW.category := OLD.category;
    NEW.context_type := OLD.context_type;
    NEW.context_record_id := OLD.context_record_id;
    NEW.program_id := OLD.program_id;
    NEW.subject := OLD.subject;
    NEW.description := OLD.description;
    NEW.ticket_code := OLD.ticket_code;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $fn$;

DROP TRIGGER IF EXISTS trg_sst_defaults ON public.student_support_tickets;
CREATE TRIGGER trg_sst_defaults
  BEFORE INSERT OR UPDATE ON public.student_support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.tg_student_support_defaults();

-- ==============================================================
-- Messages
-- ==============================================================
CREATE TABLE IF NOT EXISTS public.student_support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.student_support_tickets(id) ON DELETE CASCADE,
  author_user_id uuid NOT NULL,
  is_admin boolean NOT NULL DEFAULT false,
  is_internal boolean NOT NULL DEFAULT false,
  body text NOT NULL,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ssm_ticket ON public.student_support_messages(ticket_id, created_at);

GRANT SELECT, INSERT ON public.student_support_messages TO authenticated;
GRANT ALL ON public.student_support_messages TO service_role;
ALTER TABLE public.student_support_messages ENABLE ROW LEVEL SECURITY;

-- Students can view only non-internal messages on their own tickets. Admins with support.review see all.
DROP POLICY IF EXISTS ssm_select ON public.student_support_messages;
CREATE POLICY ssm_select ON public.student_support_messages
  FOR SELECT TO authenticated
  USING (
    public.has_admin_permission(auth.uid(),'support.review')
    OR (
      is_internal = false
      AND EXISTS (
        SELECT 1 FROM public.student_support_tickets t
        WHERE t.id = ticket_id AND t.student_user_id = auth.uid()
      )
    )
  );

-- Students can insert their own reply messages on their own open tickets; is_internal must be false.
DROP POLICY IF EXISTS ssm_insert ON public.student_support_messages;
CREATE POLICY ssm_insert ON public.student_support_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_admin_permission(auth.uid(),'support.review')
    OR (
      author_user_id = auth.uid()
      AND is_admin = false
      AND is_internal = false
      AND EXISTS (
        SELECT 1 FROM public.student_support_tickets t
        WHERE t.id = ticket_id AND t.student_user_id = auth.uid()
              AND t.status IN ('open','assigned','in_progress','waiting_student','waiting_support','resolved')
      )
    )
  );

-- ==============================================================
-- Activity log
-- ==============================================================
CREATE TABLE IF NOT EXISTS public.student_support_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.student_support_tickets(id) ON DELETE CASCADE,
  student_user_id uuid NOT NULL,
  actor_role text NOT NULL,
  action text NOT NULL,
  detail text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ssa_ticket ON public.student_support_activity(ticket_id, created_at);

GRANT SELECT, INSERT ON public.student_support_activity TO authenticated;
GRANT ALL ON public.student_support_activity TO service_role;
ALTER TABLE public.student_support_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ssa_select ON public.student_support_activity;
CREATE POLICY ssa_select ON public.student_support_activity
  FOR SELECT TO authenticated
  USING (student_user_id = auth.uid()
         OR public.has_admin_permission(auth.uid(),'support.review'));

DROP POLICY IF EXISTS ssa_insert ON public.student_support_activity;
CREATE POLICY ssa_insert ON public.student_support_activity
  FOR INSERT TO authenticated
  WITH CHECK (student_user_id = auth.uid()
              OR public.has_admin_permission(auth.uid(),'support.review'));
