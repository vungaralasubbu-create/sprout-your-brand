
-- Enum for brand status
DO $$ BEGIN
  CREATE TYPE public.partner_brand_status AS ENUM ('draft','pending_review','verified','needs_information','rejected','suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.partner_brand_type AS ENUM ('own','partnered');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.partner_selling_model AS ENUM ('glintr','own','partnered','multiple');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1. partners.brand_selling_model
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS brand_selling_model public.partner_selling_model;

-- 2. partner_brand_profiles
CREATE TABLE IF NOT EXISTS public.partner_brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_type public.partner_brand_type NOT NULL,
  selling_model public.partner_selling_model NOT NULL,
  brand_name TEXT NOT NULL,
  company_name TEXT,
  website TEXT,
  social_link TEXT,
  business_email TEXT,
  business_phone TEXT,
  brand_description TEXT,
  logo_bucket TEXT,
  logo_path TEXT,
  logo_mime TEXT,
  -- partnered-brand specific
  relationship_to_brand TEXT,
  authorized_contact_name TEXT,
  authorized_contact_email TEXT,
  notes TEXT,
  status public.partner_brand_status NOT NULL DEFAULT 'pending_review',
  admin_message TEXT,
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pbp_partner ON public.partner_brand_profiles(partner_id);
CREATE INDEX IF NOT EXISTS idx_pbp_status ON public.partner_brand_profiles(status);
CREATE INDEX IF NOT EXISTS idx_pbp_user ON public.partner_brand_profiles(user_id);

GRANT SELECT, INSERT, UPDATE ON public.partner_brand_profiles TO authenticated;
GRANT ALL ON public.partner_brand_profiles TO service_role;

ALTER TABLE public.partner_brand_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner reads own brand profiles"
  ON public.partner_brand_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Partner creates own brand profiles"
  ON public.partner_brand_profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Partner updates editable own profiles"
  ON public.partner_brand_profiles FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    AND status IN ('draft','needs_information','pending_review')
  )
  WITH CHECK (
    user_id = auth.uid()
    AND status IN ('draft','needs_information','pending_review')
  );

CREATE POLICY "Admin updates any brand profile"
  ON public.partner_brand_profiles FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_pbp_updated
BEFORE UPDATE ON public.partner_brand_profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 3. partner_brand_review_actions
CREATE TABLE IF NOT EXISTS public.partner_brand_review_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.partner_brand_profiles(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id),
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL, -- submitted, verified, request_info, rejected, suspended, resubmitted, updated
  from_status public.partner_brand_status,
  to_status public.partner_brand_status,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pbra_profile ON public.partner_brand_review_actions(profile_id);

GRANT SELECT, INSERT ON public.partner_brand_review_actions TO authenticated;
GRANT ALL ON public.partner_brand_review_actions TO service_role;

ALTER TABLE public.partner_brand_review_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner reads own brand review history"
  ON public.partner_brand_review_actions FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.partner_brand_profiles p
      WHERE p.id = partner_brand_review_actions.profile_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin logs brand review actions"
  ON public.partner_brand_review_actions FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- 4. Selling brand tracking on downstream records
ALTER TABLE public.partner_leads
  ADD COLUMN IF NOT EXISTS selling_brand_profile_id UUID REFERENCES public.partner_brand_profiles(id) ON DELETE SET NULL;

ALTER TABLE public.partner_lead_payment_links
  ADD COLUMN IF NOT EXISTS selling_brand_profile_id UUID REFERENCES public.partner_brand_profiles(id) ON DELETE SET NULL;

ALTER TABLE public.partner_payment_submissions
  ADD COLUMN IF NOT EXISTS selling_brand_profile_id UUID REFERENCES public.partner_brand_profiles(id) ON DELETE SET NULL;

-- 5. Storage policies for partner-brand-logos
-- Path convention: <partner_id>/<profile_id>/<filename>
CREATE POLICY "Partners manage own brand logos - read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'partner-brand-logos'
    AND (
      public.is_admin(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.partners pp
        WHERE pp.user_id = auth.uid()
          AND pp.id::text = split_part(name, '/', 1)
      )
    )
  );

CREATE POLICY "Partners manage own brand logos - insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'partner-brand-logos'
    AND EXISTS (
      SELECT 1 FROM public.partners pp
      WHERE pp.user_id = auth.uid()
        AND pp.id::text = split_part(name, '/', 1)
    )
  );

CREATE POLICY "Partners manage own brand logos - update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'partner-brand-logos'
    AND EXISTS (
      SELECT 1 FROM public.partners pp
      WHERE pp.user_id = auth.uid()
        AND pp.id::text = split_part(name, '/', 1)
    )
  );

CREATE POLICY "Partners manage own brand logos - delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'partner-brand-logos'
    AND EXISTS (
      SELECT 1 FROM public.partners pp
      WHERE pp.user_id = auth.uid()
        AND pp.id::text = split_part(name, '/', 1)
    )
  );
