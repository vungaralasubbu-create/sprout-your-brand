
DO $$ BEGIN
  CREATE TYPE public.ai_mentor_context_type AS ENUM (
    'general','current_lesson','current_module','program','project',
    'assignment','live_session','internship','career'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ai_mentor_message_role AS ENUM ('student','mentor','system');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ai_mentor_message_status AS ENUM ('sent','generating','completed','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ai_mentor_feedback_type AS ENUM ('helpful','not_helpful');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Conversations
CREATE TABLE IF NOT EXISTS public.ai_mentor_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'New AI Mentor Conversation',
  program_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  context_type public.ai_mentor_context_type NOT NULL DEFAULT 'general',
  context_record_id uuid,
  include_notes boolean NOT NULL DEFAULT false,
  include_submission boolean NOT NULL DEFAULT false,
  include_draft boolean NOT NULL DEFAULT false,
  message_count int NOT NULL DEFAULT 0,
  archived_at timestamptz,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_mentor_conv_student ON public.ai_mentor_conversations(student_user_id, last_activity_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_mentor_conversations TO authenticated;
GRANT ALL ON public.ai_mentor_conversations TO service_role;
ALTER TABLE public.ai_mentor_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_mentor_conv_self ON public.ai_mentor_conversations;
CREATE POLICY ai_mentor_conv_self ON public.ai_mentor_conversations
  FOR ALL TO authenticated
  USING (auth.uid() = student_user_id)
  WITH CHECK (auth.uid() = student_user_id);

DROP POLICY IF EXISTS ai_mentor_conv_admin_read ON public.ai_mentor_conversations;
CREATE POLICY ai_mentor_conv_admin_read ON public.ai_mentor_conversations
  FOR SELECT TO authenticated
  USING (public.has_admin_permission(auth.uid(),'lms.review'));

DROP TRIGGER IF EXISTS trg_ai_mentor_conv_updated ON public.ai_mentor_conversations;
CREATE TRIGGER trg_ai_mentor_conv_updated
  BEFORE UPDATE ON public.ai_mentor_conversations
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Messages
CREATE TABLE IF NOT EXISTS public.ai_mentor_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_mentor_conversations(id) ON DELETE CASCADE,
  student_user_id uuid NOT NULL,
  role public.ai_mentor_message_role NOT NULL,
  content text NOT NULL DEFAULT '',
  context_snapshot jsonb,
  status public.ai_mentor_message_status NOT NULL DEFAULT 'completed',
  error_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_mentor_msg_conv ON public.ai_mentor_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_mentor_msg_student ON public.ai_mentor_messages(student_user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_mentor_messages TO authenticated;
GRANT ALL ON public.ai_mentor_messages TO service_role;
ALTER TABLE public.ai_mentor_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_mentor_msg_self ON public.ai_mentor_messages;
CREATE POLICY ai_mentor_msg_self ON public.ai_mentor_messages
  FOR ALL TO authenticated
  USING (auth.uid() = student_user_id)
  WITH CHECK (auth.uid() = student_user_id);

DROP POLICY IF EXISTS ai_mentor_msg_admin_read ON public.ai_mentor_messages;
CREATE POLICY ai_mentor_msg_admin_read ON public.ai_mentor_messages
  FOR SELECT TO authenticated
  USING (public.has_admin_permission(auth.uid(),'lms.review'));

-- Feedback
CREATE TABLE IF NOT EXISTS public.ai_mentor_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.ai_mentor_messages(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.ai_mentor_conversations(id) ON DELETE CASCADE,
  student_user_id uuid NOT NULL,
  feedback_type public.ai_mentor_feedback_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id, student_user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_mentor_feedback TO authenticated;
GRANT ALL ON public.ai_mentor_feedback TO service_role;
ALTER TABLE public.ai_mentor_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_mentor_fb_self ON public.ai_mentor_feedback;
CREATE POLICY ai_mentor_fb_self ON public.ai_mentor_feedback
  FOR ALL TO authenticated
  USING (auth.uid() = student_user_id)
  WITH CHECK (auth.uid() = student_user_id);

-- Usage tracking (admin visibility only)
CREATE TABLE IF NOT EXISTS public.ai_mentor_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id uuid NOT NULL,
  conversation_id uuid REFERENCES public.ai_mentor_conversations(id) ON DELETE SET NULL,
  message_id uuid REFERENCES public.ai_mentor_messages(id) ON DELETE SET NULL,
  model text,
  ai_service_status text,
  tokens_prompt int,
  tokens_completion int,
  duration_ms int,
  requested_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_mentor_usage_student ON public.ai_mentor_usage(student_user_id, requested_at DESC);

GRANT SELECT ON public.ai_mentor_usage TO authenticated;
GRANT ALL ON public.ai_mentor_usage TO service_role;
ALTER TABLE public.ai_mentor_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_mentor_usage_self ON public.ai_mentor_usage;
CREATE POLICY ai_mentor_usage_self ON public.ai_mentor_usage
  FOR SELECT TO authenticated
  USING (auth.uid() = student_user_id
         OR public.has_admin_permission(auth.uid(),'lms.review'));

-- Activity
CREATE TABLE IF NOT EXISTS public.ai_mentor_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id uuid NOT NULL,
  conversation_id uuid REFERENCES public.ai_mentor_conversations(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_mentor_activity_student ON public.ai_mentor_activity(student_user_id, created_at DESC);

GRANT SELECT, INSERT ON public.ai_mentor_activity TO authenticated;
GRANT ALL ON public.ai_mentor_activity TO service_role;
ALTER TABLE public.ai_mentor_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_mentor_activity_self ON public.ai_mentor_activity;
CREATE POLICY ai_mentor_activity_self ON public.ai_mentor_activity
  FOR ALL TO authenticated
  USING (auth.uid() = student_user_id
         OR public.has_admin_permission(auth.uid(),'lms.review'))
  WITH CHECK (auth.uid() = student_user_id);
