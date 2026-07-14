
-- Extend category enum
ALTER TYPE support_ticket_category ADD VALUE IF NOT EXISTS 'lead_issue';
ALTER TYPE support_ticket_category ADD VALUE IF NOT EXISTS 'lead_ownership';
ALTER TYPE support_ticket_category ADD VALUE IF NOT EXISTS 'payment_verification';
ALTER TYPE support_ticket_category ADD VALUE IF NOT EXISTS 'duplicate_utr';
ALTER TYPE support_ticket_category ADD VALUE IF NOT EXISTS 'payout_delay';
ALTER TYPE support_ticket_category ADD VALUE IF NOT EXISTS 'earnings_issue';
ALTER TYPE support_ticket_category ADD VALUE IF NOT EXISTS 'referral_bonus';
ALTER TYPE support_ticket_category ADD VALUE IF NOT EXISTS 'brand_approval';
ALTER TYPE support_ticket_category ADD VALUE IF NOT EXISTS 'account_problem';
ALTER TYPE support_ticket_category ADD VALUE IF NOT EXISTS 'full_time_application';
ALTER TYPE support_ticket_category ADD VALUE IF NOT EXISTS 'employment_payroll';
ALTER TYPE support_ticket_category ADD VALUE IF NOT EXISTS 'program_question';
ALTER TYPE support_ticket_category ADD VALUE IF NOT EXISTS 'payment_link_issue';
ALTER TYPE support_ticket_category ADD VALUE IF NOT EXISTS 'technical_issue';

-- Extend status enum
ALTER TYPE support_ticket_status ADD VALUE IF NOT EXISTS 'admin_replied';

-- Ticket code sequence
CREATE SEQUENCE IF NOT EXISTS public.support_ticket_code_seq;

-- New columns
ALTER TABLE public.partner_support_tickets
  ADD COLUMN IF NOT EXISTS ticket_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS related_referral_id uuid REFERENCES public.partner_referrals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS related_brand_profile_id uuid REFERENCES public.partner_brand_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS related_program_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS related_payment_submission_id uuid REFERENCES public.partner_payment_submissions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS related_payment_link_id uuid REFERENCES public.payment_links(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_admin_id uuid,
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolution_note text,
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz NOT NULL DEFAULT now();

-- Ticket code default trigger
CREATE OR REPLACE FUNCTION public.tg_support_ticket_defaults()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.ticket_code IS NULL OR NEW.ticket_code = '' THEN
    NEW.ticket_code := 'GL-SUP-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.support_ticket_code_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_support_ticket_defaults ON public.partner_support_tickets;
CREATE TRIGGER trg_support_ticket_defaults
  BEFORE INSERT ON public.partner_support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.tg_support_ticket_defaults();

-- Backfill missing codes
UPDATE public.partner_support_tickets
SET ticket_code = 'GL-SUP-' || to_char(created_at, 'YYYY') || '-' || lpad(nextval('public.support_ticket_code_seq')::text, 4, '0')
WHERE ticket_code IS NULL;

-- Add is_internal and attachment_url to messages
ALTER TABLE public.partner_support_messages
  ADD COLUMN IF NOT EXISTS is_internal boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS attachment_url text;

-- Replace SELECT policy on messages to hide internal notes from partners
DROP POLICY IF EXISTS msgs_by_ticket ON public.partner_support_messages;
CREATE POLICY msgs_by_ticket ON public.partner_support_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.partner_support_tickets t
    WHERE t.id = partner_support_messages.ticket_id
      AND (
        (t.partner_id = partner_id_for(auth.uid()) AND is_internal = false)
        OR is_admin(auth.uid())
      )
  )
);

-- Only admins may write is_internal = true
DROP POLICY IF EXISTS msgs_insert_by_participant ON public.partner_support_messages;
CREATE POLICY msgs_insert_by_participant ON public.partner_support_messages FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.partner_support_tickets t
    WHERE t.id = partner_support_messages.ticket_id
      AND (
        (t.partner_id = partner_id_for(auth.uid()) AND is_internal = false)
        OR is_admin(auth.uid())
      )
  )
);

-- Assignment history
CREATE TABLE IF NOT EXISTS public.partner_support_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.partner_support_tickets(id) ON DELETE CASCADE,
  assigned_admin_id uuid NOT NULL,
  assigned_by uuid NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  unassigned_at timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_support_assignments TO authenticated;
GRANT ALL ON public.partner_support_assignments TO service_role;
ALTER TABLE public.partner_support_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY assignments_admin_only ON public.partner_support_assignments FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- Activity log
CREATE TABLE IF NOT EXISTS public.partner_support_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.partner_support_tickets(id) ON DELETE CASCADE,
  action text NOT NULL,
  actor_user_id uuid,
  actor_role text,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.partner_support_activity TO authenticated;
GRANT ALL ON public.partner_support_activity TO service_role;
ALTER TABLE public.partner_support_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY activity_view ON public.partner_support_activity FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_support_tickets t
      WHERE t.id = partner_support_activity.ticket_id
        AND (t.partner_id = partner_id_for(auth.uid()) OR is_admin(auth.uid()))
    )
  );
CREATE POLICY activity_insert ON public.partner_support_activity FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.partner_support_tickets t
      WHERE t.id = partner_support_activity.ticket_id
        AND (t.partner_id = partner_id_for(auth.uid()) OR is_admin(auth.uid()))
    )
  );

CREATE INDEX IF NOT EXISTS idx_support_tickets_partner ON public.partner_support_tickets(partner_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.partner_support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON public.partner_support_tickets(assigned_admin_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON public.partner_support_messages(ticket_id, created_at);
CREATE INDEX IF NOT EXISTS idx_support_activity_ticket ON public.partner_support_activity(ticket_id, created_at DESC);
