
-- Plan enum
DO $$ BEGIN
  CREATE TYPE public.payment_plan AS ENUM ('self_paced_edge','career_launch','career_pro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_link_status AS ENUM ('assigned','payment_pending','verified','rejected','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Master payment links (admin-managed)
CREATE TABLE IF NOT EXISTS public.payment_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  plan public.payment_plan NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, plan)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_links TO authenticated;
GRANT ALL ON public.payment_links TO service_role;

ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;

-- Partners & admins can view active links; admins see all
CREATE POLICY "payment_links_select_partners_active"
ON public.payment_links FOR SELECT
TO authenticated
USING (
  is_admin(auth.uid())
  OR (
    is_active = true
    AND (is_partner(auth.uid()) OR is_admin(auth.uid()))
    AND EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.status = 'published' AND c.is_published = true)
  )
);

CREATE POLICY "payment_links_admin_write"
ON public.payment_links FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE TRIGGER trg_payment_links_updated_at
BEFORE UPDATE ON public.payment_links
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Assignments to leads
CREATE TABLE IF NOT EXISTS public.partner_lead_payment_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.partner_leads(id) ON DELETE CASCADE,
  payment_link_id uuid NOT NULL REFERENCES public.payment_links(id) ON DELETE RESTRICT,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  plan public.payment_plan NOT NULL,
  amount numeric(12,2) NOT NULL,
  url text NOT NULL,
  status public.payment_link_status NOT NULL DEFAULT 'assigned',
  assigned_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plpl_partner ON public.partner_lead_payment_links(partner_id);
CREATE INDEX IF NOT EXISTS idx_plpl_lead ON public.partner_lead_payment_links(lead_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_lead_payment_links TO authenticated;
GRANT ALL ON public.partner_lead_payment_links TO service_role;

ALTER TABLE public.partner_lead_payment_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plpl_partner_select_own"
ON public.partner_lead_payment_links FOR SELECT
TO authenticated
USING (partner_id = partner_id_for(auth.uid()) OR is_admin(auth.uid()));

CREATE POLICY "plpl_partner_insert_own"
ON public.partner_lead_payment_links FOR INSERT
TO authenticated
WITH CHECK (
  partner_id = partner_id_for(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.partner_leads l
    WHERE l.id = lead_id
      AND (l.owner_partner_id = partner_id_for(auth.uid()) OR l.assigned_partner_id = partner_id_for(auth.uid()))
  )
);

CREATE POLICY "plpl_admin_all"
ON public.partner_lead_payment_links FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE TRIGGER trg_plpl_updated_at
BEFORE UPDATE ON public.partner_lead_payment_links
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
