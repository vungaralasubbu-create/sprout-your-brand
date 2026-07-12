
-- ================================================================
-- LAUNCH YOUR BRAND (White-Label) MODULE
-- ================================================================

DO $$ BEGIN
  CREATE TYPE public.brand_application_status AS ENUM (
    'draft','submitted','under_review','information_required','approved',
    'configuration_started','brand_design','website_setup','lms_setup',
    'program_configuration','quality_review','launch_ready','launched',
    'on_hold','rejected','suspended'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.brand_stage AS ENUM (
    'configuration','brand_design','website_setup','lms_setup',
    'program_configuration','quality_review','launch_ready','launched',
    'on_hold','suspended'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.brand_program_status AS ENUM (
    'requested','under_review','approved','published','paused','rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.brand_task_status AS ENUM (
    'not_started','in_progress','waiting_for_client','review_required','completed','blocked'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.brand_task_priority AS ENUM ('low','medium','high','urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- brand_applications
CREATE TABLE IF NOT EXISTS public.brand_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.brand_application_status NOT NULL DEFAULT 'draft',
  preferred_brand_name TEXT,
  alternative_name_1 TEXT,
  alternative_name_2 TEXT,
  name_availability_checked BOOLEAN NOT NULL DEFAULT false,
  brand_type TEXT,
  target_audience TEXT[],
  brand_vision TEXT,
  selected_program_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
  selected_category_slugs TEXT[] DEFAULT ARRAY[]::TEXT[],
  selected_services TEXT[] DEFAULT ARRAY[]::TEXT[],
  setup_type TEXT,
  brand_personality TEXT[] DEFAULT ARRAY[]::TEXT[],
  brand_colors JSONB DEFAULT '{}'::JSONB,
  logo_url TEXT,
  needs_logo_help BOOLEAN NOT NULL DEFAULT false,
  tagline TEXT,
  has_domain TEXT,
  domain_name TEXT,
  social_profiles JSONB DEFAULT '{}'::JSONB,
  business_type TEXT,
  country TEXT,
  state TEXT,
  city TEXT,
  business_email TEXT,
  business_mobile TEXT,
  consent_confirmed BOOLEAN NOT NULL DEFAULT false,
  current_step INT NOT NULL DEFAULT 1,
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_applications TO authenticated;
GRANT ALL ON public.brand_applications TO service_role;
ALTER TABLE public.brand_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages own brand application"
  ON public.brand_applications FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE TRIGGER trg_brand_applications_updated
  BEFORE UPDATE ON public.brand_applications
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- brand_packages (defined before brands so FK works)
CREATE TABLE IF NOT EXISTS public.brand_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tier TEXT NOT NULL,
  description TEXT,
  setup_fee NUMERIC(12,2),
  monthly_fee NUMERIC(12,2),
  annual_fee NUMERIC(12,2),
  revenue_share_percent NUMERIC(5,2),
  included_programs INT,
  includes_website BOOLEAN NOT NULL DEFAULT true,
  includes_lms BOOLEAN NOT NULL DEFAULT true,
  includes_crm BOOLEAN NOT NULL DEFAULT false,
  includes_marketing_support BOOLEAN NOT NULL DEFAULT false,
  includes_social_setup BOOLEAN NOT NULL DEFAULT false,
  includes_custom_domain BOOLEAN NOT NULL DEFAULT false,
  student_limit INT,
  team_member_limit INT,
  storage_limit_gb INT,
  support_level TEXT,
  features JSONB DEFAULT '[]'::JSONB,
  active BOOLEAN NOT NULL DEFAULT false,
  public_listed BOOLEAN NOT NULL DEFAULT false,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.brand_packages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_packages TO authenticated;
GRANT ALL ON public.brand_packages TO service_role;
ALTER TABLE public.brand_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads active listed packages"
  ON public.brand_packages FOR SELECT TO anon, authenticated
  USING (active = true AND public_listed = true);

CREATE POLICY "Admin manages packages"
  ON public.brand_packages FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_brand_packages_updated
  BEFORE UPDATE ON public.brand_packages
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- brands
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.brand_applications(id) ON DELETE SET NULL,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  brand_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tagline TEXT,
  about TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  accent_color TEXT,
  domain TEXT,
  custom_domain_status TEXT NOT NULL DEFAULT 'pending',
  website_status TEXT NOT NULL DEFAULT 'pending',
  lms_status TEXT NOT NULL DEFAULT 'pending',
  contact_email TEXT,
  contact_phone TEXT,
  whatsapp TEXT,
  social_links JSONB DEFAULT '{}'::JSONB,
  hero_content JSONB DEFAULT '{}'::JSONB,
  footer_content JSONB DEFAULT '{}'::JSONB,
  seo_title TEXT,
  seo_description TEXT,
  stage public.brand_stage NOT NULL DEFAULT 'configuration',
  package_id UUID REFERENCES public.brand_packages(id) ON DELETE SET NULL,
  launched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brands TO authenticated;
GRANT ALL ON public.brands TO service_role;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_brand_owner(_user_id UUID, _brand_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.brands WHERE id = _brand_id AND owner_user_id = _user_id);
$$;

CREATE POLICY "Owner or admin reads brand"
  ON public.brands FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Admin creates brand"
  ON public.brands FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Owner or admin updates brand"
  ON public.brands FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (owner_user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Admin deletes brand"
  ON public.brands FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER trg_brands_updated
  BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- brand_programs
CREATE TABLE IF NOT EXISTS public.brand_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  program_id TEXT NOT NULL,
  program_title TEXT,
  category_slug TEXT,
  status public.brand_program_status NOT NULL DEFAULT 'requested',
  display_price NUMERIC(12,2),
  offer_price NUMERIC(12,2),
  enrollment_status TEXT NOT NULL DEFAULT 'open',
  revenue_model TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (brand_id, program_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_programs TO authenticated;
GRANT ALL ON public.brand_programs TO service_role;
ALTER TABLE public.brand_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand owner or admin reads brand programs"
  ON public.brand_programs FOR SELECT TO authenticated
  USING (public.is_brand_owner(auth.uid(), brand_id) OR public.is_admin(auth.uid()));

CREATE POLICY "Brand owner requests programs"
  ON public.brand_programs FOR INSERT TO authenticated
  WITH CHECK (public.is_brand_owner(auth.uid(), brand_id) OR public.is_admin(auth.uid()));

CREATE POLICY "Admin manages brand program state"
  ON public.brand_programs FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin deletes brand programs"
  ON public.brand_programs FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER trg_brand_programs_updated
  BEFORE UPDATE ON public.brand_programs
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- brand_launch_tasks
CREATE TABLE IF NOT EXISTS public.brand_launch_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.brand_applications(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  department TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  priority public.brand_task_priority NOT NULL DEFAULT 'medium',
  status public.brand_task_status NOT NULL DEFAULT 'not_started',
  due_date TIMESTAMPTZ,
  completion_date TIMESTAMPTZ,
  internal_notes TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_launch_tasks TO authenticated;
GRANT ALL ON public.brand_launch_tasks TO service_role;
ALTER TABLE public.brand_launch_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand owner reads own launch tasks"
  ON public.brand_launch_tasks FOR SELECT TO authenticated
  USING (
    (brand_id IS NOT NULL AND public.is_brand_owner(auth.uid(), brand_id))
    OR (application_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.brand_applications a
      WHERE a.id = application_id AND a.user_id = auth.uid()
    ))
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Admin manages launch tasks"
  ON public.brand_launch_tasks FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_brand_launch_tasks_updated
  BEFORE UPDATE ON public.brand_launch_tasks
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- brand_team_members
CREATE TABLE IF NOT EXISTS public.brand_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_email TEXT,
  role TEXT NOT NULL DEFAULT 'sales',
  status TEXT NOT NULL DEFAULT 'invited',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_team_members TO authenticated;
GRANT ALL ON public.brand_team_members TO service_role;
ALTER TABLE public.brand_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand owner reads own team"
  ON public.brand_team_members FOR SELECT TO authenticated
  USING (
    public.is_brand_owner(auth.uid(), brand_id)
    OR user_id = auth.uid()
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Brand owner manages team"
  ON public.brand_team_members FOR ALL TO authenticated
  USING (public.is_brand_owner(auth.uid(), brand_id) OR public.is_admin(auth.uid()))
  WITH CHECK (public.is_brand_owner(auth.uid(), brand_id) OR public.is_admin(auth.uid()));

CREATE TRIGGER trg_brand_team_members_updated
  BEFORE UPDATE ON public.brand_team_members
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- brand_consultations
CREATE TABLE IF NOT EXISTS public.brand_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT NOT NULL,
  current_role_title TEXT,
  sales_experience TEXT,
  has_leads TEXT,
  lead_network_size TEXT,
  preferred_brand_name TEXT,
  programs_interested TEXT[],
  launch_timeline TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_consultations TO authenticated;
GRANT INSERT ON public.brand_consultations TO anon;
GRANT ALL ON public.brand_consultations TO service_role;
ALTER TABLE public.brand_consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit consultation"
  ON public.brand_consultations FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Owner reads own consultation"
  ON public.brand_consultations FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Admin manages consultations"
  ON public.brand_consultations FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_brand_consultations_updated
  BEFORE UPDATE ON public.brand_consultations
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_brand_applications_user ON public.brand_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_applications_status ON public.brand_applications(status);
CREATE INDEX IF NOT EXISTS idx_brands_owner ON public.brands(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_brands_tenant ON public.brands(tenant_id);
CREATE INDEX IF NOT EXISTS idx_brand_programs_brand ON public.brand_programs(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_launch_tasks_brand ON public.brand_launch_tasks(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_launch_tasks_app ON public.brand_launch_tasks(application_id);
CREATE INDEX IF NOT EXISTS idx_brand_consultations_email ON public.brand_consultations(email);
