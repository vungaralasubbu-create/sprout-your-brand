
CREATE TABLE public.partner_payment_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.partner_payment_submissions(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('submitted','mark_under_review','verify','reject','request_info','flag_duplicate')),
  from_status public.payment_submission_status,
  to_status public.payment_submission_status NOT NULL,
  actor_user_id UUID REFERENCES auth.users(id),
  actor_role TEXT NOT NULL,
  message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX partner_payment_actions_submission_idx ON public.partner_payment_actions(submission_id, created_at DESC);

GRANT SELECT, INSERT ON public.partner_payment_actions TO authenticated;
GRANT ALL ON public.partner_payment_actions TO service_role;

ALTER TABLE public.partner_payment_actions ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY ppa_admin_all ON public.partner_payment_actions
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Partner can view actions on their own submissions (to see admin messages)
CREATE POLICY ppa_partner_select_own ON public.partner_payment_actions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_payment_submissions s
      WHERE s.id = partner_payment_actions.submission_id
        AND s.partner_id = public.partner_id_for(auth.uid())
    )
  );

-- Backfill an initial "submitted" action for existing rows so history is complete
INSERT INTO public.partner_payment_actions (submission_id, action, from_status, to_status, actor_user_id, actor_role, created_at)
SELECT s.id, 'submitted', NULL, s.status,
  (SELECT user_id FROM public.partners WHERE id = s.partner_id),
  'partner',
  s.submitted_at
FROM public.partner_payment_submissions s
WHERE NOT EXISTS (SELECT 1 FROM public.partner_payment_actions a WHERE a.submission_id = s.id);
