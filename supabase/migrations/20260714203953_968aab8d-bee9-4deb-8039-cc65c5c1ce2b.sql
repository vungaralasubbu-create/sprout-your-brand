-- Extend ambassador_commissions for transaction type + payout tracking; add lightweight status history for journey timeline

DO $$ BEGIN
  CREATE TYPE public.ambassador_commission_txn_type AS ENUM (
    'enrollment_commission',
    'bonus_commission',
    'positive_adjustment',
    'negative_adjustment',
    'recovery',
    'correction'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.ambassador_commissions
  ADD COLUMN IF NOT EXISTS transaction_type public.ambassador_commission_txn_type NOT NULL DEFAULT 'enrollment_commission',
  ADD COLUMN IF NOT EXISTS payout_reference text,
  ADD COLUMN IF NOT EXISTS payout_processing_at timestamptz,
  ADD COLUMN IF NOT EXISTS adjustment_public_note text;

CREATE INDEX IF NOT EXISTS idx_amb_commissions_ambassador_created
  ON public.ambassador_commissions (ambassador_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_amb_commissions_ambassador_status
  ON public.ambassador_commissions (ambassador_id, status);

-- Commission status journey
CREATE TABLE IF NOT EXISTS public.ambassador_commission_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id uuid NOT NULL REFERENCES public.ambassador_commissions(id) ON DELETE CASCADE,
  ambassador_id uuid NOT NULL,
  from_status public.ambassador_commission_status,
  to_status public.ambassador_commission_status NOT NULL,
  event_type text NOT NULL,
  public_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ambassador_commission_status_history TO authenticated;
GRANT ALL ON public.ambassador_commission_status_history TO service_role;
ALTER TABLE public.ambassador_commission_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS amb_read_own_commission_history ON public.ambassador_commission_status_history;
CREATE POLICY amb_read_own_commission_history ON public.ambassador_commission_status_history
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.campus_ambassador_profiles p
    WHERE p.id = ambassador_commission_status_history.ambassador_id
      AND p.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS admin_manage_commission_history ON public.ambassador_commission_status_history;
CREATE POLICY admin_manage_commission_history ON public.ambassador_commission_status_history
  FOR ALL TO authenticated
  USING (public.has_admin_permission(auth.uid(),'ambassador.commissions.review'))
  WITH CHECK (public.has_admin_permission(auth.uid(),'ambassador.commissions.review'));

CREATE INDEX IF NOT EXISTS idx_amb_commission_history_commission
  ON public.ambassador_commission_status_history (commission_id, created_at);

-- Auto-append a history row when status changes
CREATE OR REPLACE FUNCTION public.tg_amb_commission_status_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.ambassador_commission_status_history
      (commission_id, ambassador_id, from_status, to_status, event_type, public_note)
    VALUES (NEW.id, NEW.ambassador_id, NULL, NEW.status, 'created', NEW.public_reason);
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.ambassador_commission_status_history
      (commission_id, ambassador_id, from_status, to_status, event_type, public_note)
    VALUES (NEW.id, NEW.ambassador_id, OLD.status, NEW.status, NEW.status::text, NEW.public_reason);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tg_amb_commission_status_history ON public.ambassador_commissions;
CREATE TRIGGER tg_amb_commission_status_history
AFTER INSERT OR UPDATE OF status ON public.ambassador_commissions
FOR EACH ROW EXECUTE FUNCTION public.tg_amb_commission_status_history();
