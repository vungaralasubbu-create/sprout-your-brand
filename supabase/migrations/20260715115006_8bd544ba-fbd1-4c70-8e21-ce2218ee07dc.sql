
CREATE TABLE public.ambassador_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ambassador_id uuid REFERENCES public.campus_ambassador_profiles(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN (
    'referral','enrollment','payment_verification','commission','earnings','payout',
    'campaign','milestone','badge','level','leaderboard','recognition',
    'marketing_resources','account','system'
  )),
  notif_type text NOT NULL DEFAULT 'information' CHECK (notif_type IN (
    'information','success','reminder','attention','action_required','update'
  )),
  title text NOT NULL,
  message text NOT NULL,
  related_entity_type text,
  related_entity_id uuid,
  action_type text,
  action_route text,
  dedupe_key text NOT NULL DEFAULT gen_random_uuid()::text,
  read_at timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, dedupe_key)
);

GRANT SELECT, UPDATE ON public.ambassador_notifications TO authenticated;
GRANT ALL ON public.ambassador_notifications TO service_role;

ALTER TABLE public.ambassador_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ambassadors read own notifications"
  ON public.ambassador_notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Ambassadors update own notifications"
  ON public.ambassador_notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX amb_notif_user_created_idx
  ON public.ambassador_notifications (user_id, created_at DESC);
CREATE INDEX amb_notif_user_unread_idx
  ON public.ambassador_notifications (user_id) WHERE read_at IS NULL AND status = 'active';
CREATE INDEX amb_notif_user_cat_idx
  ON public.ambassador_notifications (user_id, category, created_at DESC);

CREATE TRIGGER amb_notif_set_updated_at
  BEFORE UPDATE ON public.ambassador_notifications
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
