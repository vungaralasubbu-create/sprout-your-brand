
-- Student in-app notifications
CREATE TABLE public.student_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'learning','program','live_session','project','assignment',
    'certificate','internship','career','interview','ai_mentor',
    'support','account','system'
  )),
  notif_type TEXT NOT NULL DEFAULT 'information' CHECK (notif_type IN (
    'information','success','reminder','attention','action_required','update'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_entity_type TEXT,
  related_entity_id UUID,
  action_label TEXT,
  action_route TEXT,
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  dedupe_key TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_user_id, dedupe_key)
);

CREATE INDEX sn_student_created_idx ON public.student_notifications (student_user_id, created_at DESC);
CREATE INDEX sn_student_unread_idx ON public.student_notifications (student_user_id) WHERE read_at IS NULL;
CREATE INDEX sn_student_category_idx ON public.student_notifications (student_user_id, category, created_at DESC);

GRANT SELECT, UPDATE ON public.student_notifications TO authenticated;
GRANT ALL ON public.student_notifications TO service_role;

ALTER TABLE public.student_notifications ENABLE ROW LEVEL SECURITY;

-- Students see only their own notifications; admins may view any.
CREATE POLICY "students read own notifications"
  ON public.student_notifications FOR SELECT
  TO authenticated
  USING (student_user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Students may update read state (read_at) on their own notifications only.
-- Column-level write control is enforced in the server function (only read_at may change).
CREATE POLICY "students update own notifications"
  ON public.student_notifications FOR UPDATE
  TO authenticated
  USING (student_user_id = auth.uid())
  WITH CHECK (student_user_id = auth.uid());

-- No client INSERT / DELETE policy → only service_role (server functions) may write.

CREATE TRIGGER student_notifications_set_updated_at
  BEFORE UPDATE ON public.student_notifications
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Notification preferences (per student, per category)
CREATE TABLE public.student_notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'learning','live_session','project','assignment','certificate',
    'internship','career','support','ai_mentor','interview'
  )),
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_user_id, category)
);

GRANT SELECT, INSERT, UPDATE ON public.student_notification_preferences TO authenticated;
GRANT ALL ON public.student_notification_preferences TO service_role;

ALTER TABLE public.student_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students manage own notification prefs"
  ON public.student_notification_preferences FOR ALL
  TO authenticated
  USING (student_user_id = auth.uid())
  WITH CHECK (student_user_id = auth.uid());

CREATE TRIGGER student_notif_prefs_set_updated_at
  BEFORE UPDATE ON public.student_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
