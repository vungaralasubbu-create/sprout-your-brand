
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS role_title text,
  ADD COLUMN IF NOT EXISTS role_title_other text,
  ADD COLUMN IF NOT EXISTS sales_experience text,
  ADD COLUMN IF NOT EXISTS sold_education_before boolean,
  ADD COLUMN IF NOT EXISTS sales_domains text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS monthly_sales_target text,
  ADD COLUMN IF NOT EXISTS income_situation text,
  ADD COLUMN IF NOT EXISTS lead_sources text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS lead_reach_range text,
  ADD COLUMN IF NOT EXISTS approved_sales_model text,
  ADD COLUMN IF NOT EXISTS sales_model_approval_status text NOT NULL DEFAULT 'selected',
  ADD COLUMN IF NOT EXISTS sales_model_selected_at timestamptz,
  ADD COLUMN IF NOT EXISTS sales_model_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS sales_model_approved_by uuid,
  ADD COLUMN IF NOT EXISTS onboarding_status text NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS onboarding_current_step int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS onboarding_draft jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS onboarding_last_saved_at timestamptz,
  ADD COLUMN IF NOT EXISTS payout_profile_status text NOT NULL DEFAULT 'not_provided',
  ADD COLUMN IF NOT EXISTS agreement_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS dual_model_enabled boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS partners_user_id_key ON public.partners(user_id);

DROP POLICY IF EXISTS "partner inserts self" ON public.partners;
CREATE POLICY "partner inserts self" ON public.partners
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "partner updates self" ON public.partners;
CREATE POLICY "partner updates self" ON public.partners
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.partner_program_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.course_categories(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (course_id IS NOT NULL OR category_id IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS ppi_partner_course_uk ON public.partner_program_interests(partner_id, course_id) WHERE course_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ppi_partner_category_uk ON public.partner_program_interests(partner_id, category_id) WHERE category_id IS NOT NULL AND course_id IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_program_interests TO authenticated;
GRANT ALL ON public.partner_program_interests TO service_role;
ALTER TABLE public.partner_program_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "interests own read" ON public.partner_program_interests
  FOR SELECT TO authenticated
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "interests own write" ON public.partner_program_interests
  FOR ALL TO authenticated
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()))
  WITH CHECK (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));
