
-- 1. Provider config (Zoom, Google Meet, Teams, Webex)
CREATE TABLE IF NOT EXISTS public.live_class_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL UNIQUE, -- 'zoom' | 'google_meet' | 'ms_teams' | 'webex'
  is_connected boolean NOT NULL DEFAULT false,
  account_email text,
  account_name text,
  account_id text,
  scopes text[],
  connected_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  connected_at timestamptz,
  expires_at timestamptz,
  last_error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.live_class_providers TO authenticated;
GRANT ALL ON public.live_class_providers TO service_role;
ALTER TABLE public.live_class_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "provider_read_authenticated" ON public.live_class_providers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "provider_admin_manage" ON public.live_class_providers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

-- Seed the four providers
INSERT INTO public.live_class_providers (provider) VALUES
  ('zoom'), ('google_meet'), ('ms_teams'), ('webex')
ON CONFLICT (provider) DO NOTHING;

-- 2. Batches
CREATE TABLE IF NOT EXISTS public.batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  cohort_start_date date,
  cohort_end_date date,
  schedule_summary text,
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  capacity integer,
  status text NOT NULL DEFAULT 'active', -- 'active' | 'archived' | 'draft'
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.batches TO authenticated;
GRANT ALL ON public.batches TO service_role;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "batches_read_authenticated" ON public.batches
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "batches_admin_manage" ON public.batches
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

-- 3. Batch enrollments (which students belong to which batch)
CREATE TABLE IF NOT EXISTS public.batch_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  student_user_id uuid NOT NULL,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true,
  UNIQUE (batch_id, student_user_id)
);

GRANT SELECT ON public.batch_enrollments TO authenticated;
GRANT ALL ON public.batch_enrollments TO service_role;
ALTER TABLE public.batch_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "batch_enrollments_self_read" ON public.batch_enrollments
  FOR SELECT TO authenticated
  USING (student_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "batch_enrollments_admin_manage" ON public.batch_enrollments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

-- 4. Extend live_sessions with provider metadata
ALTER TABLE public.live_sessions
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'zoom',
  ADD COLUMN IF NOT EXISTS provider_meeting_id text,
  ADD COLUMN IF NOT EXISTS passcode text,
  ADD COLUMN IF NOT EXISTS host_url text,
  ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES public.batches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_webinar boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_recurring boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurrence jsonb,
  ADD COLUMN IF NOT EXISTS waiting_room boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS require_registration boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recording_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS breakout_rooms boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS chat_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS max_participants integer,
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  ADD COLUMN IF NOT EXISTS instructor_notes text,
  ADD COLUMN IF NOT EXISTS agenda text;

CREATE INDEX IF NOT EXISTS idx_live_sessions_batch ON public.live_sessions(batch_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_scheduled_at ON public.live_sessions(scheduled_at);

-- 5. Notification queue for classes
CREATE TABLE IF NOT EXISTS public.live_class_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  student_user_id uuid NOT NULL,
  channel text NOT NULL DEFAULT 'in_app', -- 'in_app' | 'email' | 'sms' | 'whatsapp' | 'push'
  event text NOT NULL, -- 'reminder_24h' | 'reminder_1h' | 'reminder_15m' | 'started' | 'missed' | 'recording_available'
  scheduled_for timestamptz NOT NULL,
  delivered_at timestamptz,
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'delivered' | 'failed' | 'cancelled'
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lcn_session ON public.live_class_notifications(session_id);
CREATE INDEX IF NOT EXISTS idx_lcn_student ON public.live_class_notifications(student_user_id);
CREATE INDEX IF NOT EXISTS idx_lcn_pending ON public.live_class_notifications(status, scheduled_for);

GRANT SELECT, UPDATE ON public.live_class_notifications TO authenticated;
GRANT ALL ON public.live_class_notifications TO service_role;
ALTER TABLE public.live_class_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lcn_self_read" ON public.live_class_notifications
  FOR SELECT TO authenticated
  USING (student_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "lcn_admin_manage" ON public.live_class_notifications
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

-- 6. AI outputs per class (summary, key notes, quiz, recommendations)
CREATE TABLE IF NOT EXISTS public.live_class_ai_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  summary text,
  key_notes jsonb,
  important_topics jsonb,
  quiz jsonb,
  assignments jsonb,
  interview_questions jsonb,
  next_module_recommendation jsonb,
  transcript text,
  generated_at timestamptz NOT NULL DEFAULT now(),
  generated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (session_id)
);

GRANT SELECT ON public.live_class_ai_outputs TO authenticated;
GRANT ALL ON public.live_class_ai_outputs TO service_role;
ALTER TABLE public.live_class_ai_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_outputs_read_authenticated" ON public.live_class_ai_outputs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_outputs_admin_manage" ON public.live_class_ai_outputs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

-- 7. updated_at triggers
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS tg_provider_updated ON public.live_class_providers;
CREATE TRIGGER tg_provider_updated BEFORE UPDATE ON public.live_class_providers
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

DROP TRIGGER IF EXISTS tg_batches_updated ON public.batches;
CREATE TRIGGER tg_batches_updated BEFORE UPDATE ON public.batches
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
