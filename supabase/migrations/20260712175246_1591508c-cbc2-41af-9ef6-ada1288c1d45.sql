
-- ============================================================
-- Partner Workspace — Phase A foundation
-- Adds lead CRM, follow-ups, agreements, notifications, support,
-- program links, sales enablement, statements, attribution reviews,
-- payout details vault, and helper functions.
-- ============================================================

-- ---------- Enums ----------
DO $$ BEGIN
  CREATE TYPE public.partner_lead_status AS ENUM (
    'new','contacted','interested','follow_up','application_started',
    'application_submitted','payment_pending','enrolled','not_interested',
    'lost','invalid','duplicate','refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.partner_lead_source AS ENUM (
    'personal_network','referral','social_media','whatsapp','instagram',
    'linkedin','website','event','college_network','assigned','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.partner_lead_attribution_status AS ENUM (
    'confirmed','duplicate_review','conflict','admin_review','rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.partner_activity_type AS ENUM (
    'note','stage_change','follow_up_scheduled','follow_up_completed',
    'link_shared','application_started','application_submitted',
    'payment_recorded','enrollment_verified','revenue_pending',
    'revenue_approved','revenue_reversed','assigned','reassigned'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.follow_up_type AS ENUM ('call','whatsapp','email','meeting','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.follow_up_status AS ENUM ('scheduled','completed','missed','rescheduled','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.support_ticket_status AS ENUM (
    'open','assigned','waiting_partner','under_review','resolved','closed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.support_ticket_category AS ENUM (
    'lead_attribution','revenue_share','payout','program_information',
    'technical','application','account','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.partner_notification_type AS ENUM (
    'new_lead_assigned','follow_up_due','application_submitted',
    'payment_pending','enrollment_verified','revenue_pending',
    'revenue_approved','payout_available','payout_processing',
    'payout_paid','revenue_reversed','program_update',
    'agreement_update','support_reply'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.partner_agreement_kind AS ENUM (
    'partner_terms','revenue_share','payout','lead_handling',
    'data_privacy','anti_spam','refund_reversal'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- Extend partners ----------
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS sales_model_selection text CHECK (sales_model_selection IN ('own','supported','dual')),
  ADD COLUMN IF NOT EXISTS payout_min_threshold numeric NOT NULL DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS bank_account_last4 text,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS payout_details_verified boolean NOT NULL DEFAULT false;

-- ---------- Helper functions ----------
CREATE OR REPLACE FUNCTION public.partner_id_for(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.partners WHERE user_id = _user_id AND status = 'active' LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_partner(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS(SELECT 1 FROM public.partners WHERE user_id = _user_id AND status = 'active');
$$;

CREATE OR REPLACE FUNCTION public.normalize_phone(_phone text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT NULLIF(regexp_replace(COALESCE(_phone,''), '[^0-9]', '', 'g'), '');
$$;

CREATE OR REPLACE FUNCTION public.normalize_email(_email text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT NULLIF(lower(trim(COALESCE(_email,''))), '');
$$;

-- ---------- partner_leads ----------
CREATE TABLE IF NOT EXISTS public.partner_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  assigned_partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  lead_model public.lead_model NOT NULL DEFAULT 'own_leads',
  full_name text NOT NULL,
  mobile text NOT NULL,
  mobile_normalized text GENERATED ALWAYS AS (public.normalize_phone(mobile)) STORED,
  email text,
  email_normalized text GENERATED ALWAYS AS (public.normalize_email(email)) STORED,
  city text, state text,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  program_interest text,
  source public.partner_lead_source NOT NULL DEFAULT 'other',
  notes text,
  preferred_contact_time text,
  status public.partner_lead_status NOT NULL DEFAULT 'new',
  attribution_status public.partner_lead_attribution_status NOT NULL DEFAULT 'confirmed',
  priority text CHECK (priority IN ('low','medium','high')) DEFAULT 'medium',
  last_activity_at timestamptz,
  next_follow_up_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_partner_leads_owner ON public.partner_leads(owner_partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_leads_assigned ON public.partner_leads(assigned_partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_leads_mobile_norm ON public.partner_leads(mobile_normalized);
CREATE INDEX IF NOT EXISTS idx_partner_leads_email_norm ON public.partner_leads(email_normalized);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_leads TO authenticated;
GRANT ALL ON public.partner_leads TO service_role;
ALTER TABLE public.partner_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "partners_own_or_assigned_leads_select" ON public.partner_leads FOR SELECT TO authenticated
  USING (
    owner_partner_id = public.partner_id_for(auth.uid())
    OR assigned_partner_id = public.partner_id_for(auth.uid())
    OR public.is_admin(auth.uid())
  );
CREATE POLICY "partners_insert_own_leads" ON public.partner_leads FOR INSERT TO authenticated
  WITH CHECK (owner_partner_id = public.partner_id_for(auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "partners_update_own_or_assigned" ON public.partner_leads FOR UPDATE TO authenticated
  USING (
    owner_partner_id = public.partner_id_for(auth.uid())
    OR assigned_partner_id = public.partner_id_for(auth.uid())
    OR public.is_admin(auth.uid())
  );
CREATE POLICY "admins_delete_leads" ON public.partner_leads FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE TRIGGER trg_partner_leads_updated BEFORE UPDATE ON public.partner_leads
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ---------- partner_lead_activities ----------
CREATE TABLE IF NOT EXISTS public.partner_lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.partner_leads(id) ON DELETE CASCADE,
  partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  activity_type public.partner_activity_type NOT NULL,
  content text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON public.partner_lead_activities(lead_id, created_at DESC);
GRANT SELECT, INSERT ON public.partner_lead_activities TO authenticated;
GRANT ALL ON public.partner_lead_activities TO service_role;
ALTER TABLE public.partner_lead_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activities_visible_when_lead_visible" ON public.partner_lead_activities FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.partner_leads l WHERE l.id = lead_id
    AND (l.owner_partner_id = public.partner_id_for(auth.uid())
      OR l.assigned_partner_id = public.partner_id_for(auth.uid())
      OR public.is_admin(auth.uid()))));
CREATE POLICY "activities_insert_by_partner" ON public.partner_lead_activities FOR INSERT TO authenticated
  WITH CHECK (partner_id = public.partner_id_for(auth.uid()) OR public.is_admin(auth.uid()));

-- ---------- partner_follow_ups ----------
CREATE TABLE IF NOT EXISTS public.partner_follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.partner_leads(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  due_at timestamptz NOT NULL,
  type public.follow_up_type NOT NULL DEFAULT 'call',
  status public.follow_up_status NOT NULL DEFAULT 'scheduled',
  notes text,
  reminder_sent boolean NOT NULL DEFAULT false,
  result text,
  completed_at timestamptz,
  next_follow_up_id uuid REFERENCES public.partner_follow_ups(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_follow_ups_partner_due ON public.partner_follow_ups(partner_id, due_at);
GRANT SELECT, INSERT, UPDATE ON public.partner_follow_ups TO authenticated;
GRANT ALL ON public.partner_follow_ups TO service_role;
ALTER TABLE public.partner_follow_ups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follow_ups_partner_scope" ON public.partner_follow_ups FOR ALL TO authenticated
  USING (partner_id = public.partner_id_for(auth.uid()) OR public.is_admin(auth.uid()))
  WITH CHECK (partner_id = public.partner_id_for(auth.uid()) OR public.is_admin(auth.uid()));
CREATE TRIGGER trg_follow_ups_updated BEFORE UPDATE ON public.partner_follow_ups
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ---------- partner_agreements + acceptances ----------
CREATE TABLE IF NOT EXISTS public.partner_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.partner_agreement_kind NOT NULL,
  version text NOT NULL,
  title text NOT NULL,
  body_markdown text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  effective_from timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(kind, version)
);
GRANT SELECT ON public.partner_agreements TO authenticated, anon;
GRANT ALL ON public.partner_agreements TO service_role;
ALTER TABLE public.partner_agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agreements_readable_active" ON public.partner_agreements FOR SELECT TO anon, authenticated
  USING (is_active = true);
CREATE POLICY "agreements_admin_manage" ON public.partner_agreements FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.partner_agreement_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  agreement_id uuid NOT NULL REFERENCES public.partner_agreements(id) ON DELETE RESTRICT,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  UNIQUE(partner_id, agreement_id)
);
GRANT SELECT, INSERT ON public.partner_agreement_acceptances TO authenticated;
GRANT ALL ON public.partner_agreement_acceptances TO service_role;
ALTER TABLE public.partner_agreement_acceptances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acceptances_own_scope" ON public.partner_agreement_acceptances FOR SELECT TO authenticated
  USING (partner_id = public.partner_id_for(auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "acceptances_insert_own" ON public.partner_agreement_acceptances FOR INSERT TO authenticated
  WITH CHECK (partner_id = public.partner_id_for(auth.uid()));

-- ---------- partner_program_links ----------
CREATE TABLE IF NOT EXISTS public.partner_program_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  ref_code text NOT NULL,
  label text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(partner_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_program_links_ref ON public.partner_program_links(ref_code);
GRANT SELECT, INSERT, UPDATE ON public.partner_program_links TO authenticated;
GRANT ALL ON public.partner_program_links TO service_role;
ALTER TABLE public.partner_program_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "links_own_scope" ON public.partner_program_links FOR ALL TO authenticated
  USING (partner_id = public.partner_id_for(auth.uid()) OR public.is_admin(auth.uid()))
  WITH CHECK (partner_id = public.partner_id_for(auth.uid()) OR public.is_admin(auth.uid()));

-- ---------- partner_sales_enablement (per course) ----------
CREATE TABLE IF NOT EXISTS public.partner_sales_enablement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL UNIQUE REFERENCES public.courses(id) ON DELETE CASCADE,
  icp text,
  pain_points text,
  value_proposition text,
  sales_angle text,
  key_benefits jsonb,
  objection_handling jsonb,
  talking_points jsonb,
  whatsapp_pitch text,
  short_pitch text,
  email_subject text,
  email_body text,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.partner_sales_enablement TO authenticated;
GRANT ALL ON public.partner_sales_enablement TO service_role;
ALTER TABLE public.partner_sales_enablement ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enablement_partner_read" ON public.partner_sales_enablement FOR SELECT TO authenticated
  USING (public.is_partner(auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "enablement_admin_manage" ON public.partner_sales_enablement FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_enablement_updated BEFORE UPDATE ON public.partner_sales_enablement
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ---------- partner_notifications ----------
CREATE TABLE IF NOT EXISTS public.partner_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  type public.partner_notification_type NOT NULL,
  title text NOT NULL,
  body text,
  link_url text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_partner ON public.partner_notifications(partner_id, is_read, created_at DESC);
GRANT SELECT, UPDATE ON public.partner_notifications TO authenticated;
GRANT ALL ON public.partner_notifications TO service_role;
ALTER TABLE public.partner_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifs_own_scope" ON public.partner_notifications FOR SELECT TO authenticated
  USING (partner_id = public.partner_id_for(auth.uid()));
CREATE POLICY "notifs_mark_read" ON public.partner_notifications FOR UPDATE TO authenticated
  USING (partner_id = public.partner_id_for(auth.uid()))
  WITH CHECK (partner_id = public.partner_id_for(auth.uid()));

-- ---------- partner_support_tickets + messages ----------
CREATE TABLE IF NOT EXISTS public.partner_support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  category public.support_ticket_category NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  priority text CHECK (priority IN ('low','medium','high','urgent')) DEFAULT 'medium',
  status public.support_ticket_status NOT NULL DEFAULT 'open',
  related_lead_id uuid REFERENCES public.partner_leads(id) ON DELETE SET NULL,
  related_commission_id uuid REFERENCES public.commissions(id) ON DELETE SET NULL,
  related_payout_id uuid REFERENCES public.payouts(id) ON DELETE SET NULL,
  attachment_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.partner_support_tickets TO authenticated;
GRANT ALL ON public.partner_support_tickets TO service_role;
ALTER TABLE public.partner_support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tickets_own_scope" ON public.partner_support_tickets FOR ALL TO authenticated
  USING (partner_id = public.partner_id_for(auth.uid()) OR public.is_admin(auth.uid()))
  WITH CHECK (partner_id = public.partner_id_for(auth.uid()) OR public.is_admin(auth.uid()));
CREATE TRIGGER trg_tickets_updated BEFORE UPDATE ON public.partner_support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.partner_support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.partner_support_tickets(id) ON DELETE CASCADE,
  author_user_id uuid,
  is_admin boolean NOT NULL DEFAULT false,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.partner_support_messages TO authenticated;
GRANT ALL ON public.partner_support_messages TO service_role;
ALTER TABLE public.partner_support_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msgs_by_ticket" ON public.partner_support_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.partner_support_tickets t WHERE t.id=ticket_id
    AND (t.partner_id = public.partner_id_for(auth.uid()) OR public.is_admin(auth.uid()))));
CREATE POLICY "msgs_insert_by_participant" ON public.partner_support_messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.partner_support_tickets t WHERE t.id=ticket_id
    AND (t.partner_id = public.partner_id_for(auth.uid()) OR public.is_admin(auth.uid()))));

-- ---------- partner_statements ----------
CREATE TABLE IF NOT EXISTS public.partner_statements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  period_month date NOT NULL,
  attributed_revenue numeric NOT NULL DEFAULT 0,
  approved_revenue_share numeric NOT NULL DEFAULT 0,
  adjustments numeric NOT NULL DEFAULT 0,
  reversals numeric NOT NULL DEFAULT 0,
  payouts numeric NOT NULL DEFAULT 0,
  closing_balance numeric NOT NULL DEFAULT 0,
  generated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(partner_id, period_month)
);
GRANT SELECT ON public.partner_statements TO authenticated;
GRANT ALL ON public.partner_statements TO service_role;
ALTER TABLE public.partner_statements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "statements_own_scope" ON public.partner_statements FOR SELECT TO authenticated
  USING (partner_id = public.partner_id_for(auth.uid()) OR public.is_admin(auth.uid()));

-- ---------- partner_lead_attribution_reviews ----------
CREATE TABLE IF NOT EXISTS public.partner_lead_attribution_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.partner_leads(id) ON DELETE CASCADE,
  existing_lead_id uuid REFERENCES public.partner_leads(id) ON DELETE SET NULL,
  claiming_partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  status public.partner_lead_attribution_status NOT NULL DEFAULT 'duplicate_review',
  reason text,
  admin_notes text,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.partner_lead_attribution_reviews TO authenticated;
GRANT ALL ON public.partner_lead_attribution_reviews TO service_role;
ALTER TABLE public.partner_lead_attribution_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attr_reviews_claimant_or_admin" ON public.partner_lead_attribution_reviews FOR SELECT TO authenticated
  USING (claiming_partner_id = public.partner_id_for(auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "attr_reviews_admin_write" ON public.partner_lead_attribution_reviews FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ---------- partner_payout_details (restricted vault) ----------
CREATE TABLE IF NOT EXISTS public.partner_payout_details (
  partner_id uuid PRIMARY KEY REFERENCES public.partners(id) ON DELETE CASCADE,
  legal_name text,
  account_holder_name text,
  bank_account_number text,
  ifsc_code text,
  bank_name text,
  upi_id text,
  pan text,
  tax_status text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Do NOT grant to anon; only service_role reads the vault directly.
GRANT SELECT, INSERT, UPDATE ON public.partner_payout_details TO authenticated;
GRANT ALL ON public.partner_payout_details TO service_role;
ALTER TABLE public.partner_payout_details ENABLE ROW LEVEL SECURITY;
-- Partner can INSERT/UPDATE own row but not SELECT the raw sensitive fields directly.
CREATE POLICY "payout_details_write_own" ON public.partner_payout_details FOR INSERT TO authenticated
  WITH CHECK (partner_id = public.partner_id_for(auth.uid()));
CREATE POLICY "payout_details_update_own" ON public.partner_payout_details FOR UPDATE TO authenticated
  USING (partner_id = public.partner_id_for(auth.uid()))
  WITH CHECK (partner_id = public.partner_id_for(auth.uid()));
CREATE POLICY "payout_details_admin_read" ON public.partner_payout_details FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE TRIGGER trg_payout_details_updated BEFORE UPDATE ON public.partner_payout_details
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ---------- Seed default agreements ----------
INSERT INTO public.partner_agreements (kind, version, title, body_markdown, is_active) VALUES
  ('partner_terms','v1','Glintr Partner Terms','Glintr Sales Partner Terms — v1. By accepting, you agree to represent Glintr programs accurately, follow applicable laws, and comply with lead handling and anti-spam rules.', true),
  ('revenue_share','v1','Revenue Share Terms','Revenue share applies only to verified eligible collected revenue for approved programs at the applicable rate as determined by Glintr revenue rules.', true),
  ('payout','v1','Payout Terms','Payouts are processed against approved eligible revenue share only, subject to verification, banking timelines, minimum threshold, and applicable compliance checks.', true),
  ('lead_handling','v1','Lead Handling Rules','Partners must handle leads ethically, respect consent, and never misrepresent Glintr programs, salaries, placements or outcomes.', true),
  ('data_privacy','v1','Data Privacy Requirements','Partners must protect lead personal data and use it only for the purpose of representing Glintr programs.', true),
  ('anti_spam','v1','Anti-Spam Rules','Unsolicited bulk messaging, misleading claims, and impersonation are strictly prohibited.', true),
  ('refund_reversal','v1','Refund and Reversal Rules','Revenue share may be reversed if the underlying enrollment is refunded, disputed or found ineligible.', true)
ON CONFLICT (kind, version) DO NOTHING;
