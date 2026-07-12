
-- Extend payouts
ALTER TABLE public.payouts
  ADD COLUMN IF NOT EXISTS requested_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS approved_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS payout_method text,
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS processed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hold_reason text,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Backfill requested_amount from existing amount if null
UPDATE public.payouts SET requested_amount = amount WHERE requested_amount IS NULL;

-- Extend refund_adjustments
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'refund_adjustment_type') THEN
    CREATE TYPE refund_adjustment_type AS ENUM (
      'full_refund','partial_refund','chargeback','cancelled_enrollment',
      'failed_payment','duplicate_enrollment','fraud_review','manual_adjustment'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'refund_adjustment_status') THEN
    CREATE TYPE refund_adjustment_status AS ENUM ('pending','approved','rejected','applied','reversed');
  END IF;
END $$;

ALTER TABLE public.refund_adjustments
  ADD COLUMN IF NOT EXISTS adjustment_type refund_adjustment_type NOT NULL DEFAULT 'manual_adjustment',
  ADD COLUMN IF NOT EXISTS original_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS approval_status refund_adjustment_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS notes text;

-- Lead assignment history
CREATE TABLE IF NOT EXISTS public.lead_assignment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.partner_leads(id) ON DELETE CASCADE,
  from_partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  to_partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('assigned','reassigned','unassigned','hold','priority_changed','note')),
  reason text,
  metadata jsonb,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lah_lead ON public.lead_assignment_history(lead_id, created_at DESC);

GRANT SELECT, INSERT ON public.lead_assignment_history TO authenticated;
GRANT ALL ON public.lead_assignment_history TO service_role;

ALTER TABLE public.lead_assignment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lah_admin_all" ON public.lead_assignment_history
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "lah_partner_read_own" ON public.lead_assignment_history
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.partner_leads l
    WHERE l.id = lead_assignment_history.lead_id
      AND (l.owner_partner_id = public.partner_id_for(auth.uid())
           OR l.assigned_partner_id = public.partner_id_for(auth.uid()))
  ));

-- Admin finance actions (audit)
CREATE TABLE IF NOT EXISTS public.admin_finance_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  reason text,
  metadata jsonb,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_afa_target ON public.admin_finance_actions(target_type, target_id, created_at DESC);

GRANT SELECT, INSERT ON public.admin_finance_actions TO authenticated;
GRANT ALL ON public.admin_finance_actions TO service_role;

ALTER TABLE public.admin_finance_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "afa_admin_all" ON public.admin_finance_actions
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
