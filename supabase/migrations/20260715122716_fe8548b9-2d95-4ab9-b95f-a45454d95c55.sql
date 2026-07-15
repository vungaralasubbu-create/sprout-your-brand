
CREATE TABLE IF NOT EXISTS public.hiring_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  headline TEXT,
  purpose TEXT,
  focus_areas TEXT[] NOT NULL DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hiring_departments TO anon, authenticated;
GRANT ALL ON public.hiring_departments TO service_role;
ALTER TABLE public.hiring_departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hiring_departments public read active" ON public.hiring_departments FOR SELECT USING (is_active = true);
CREATE POLICY "hiring_departments admin manage" ON public.hiring_departments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.hiring_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_code TEXT UNIQUE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  department_id UUID REFERENCES public.hiring_departments(id) ON DELETE SET NULL,
  short_summary TEXT,
  overview TEXT,
  responsibilities TEXT[] NOT NULL DEFAULT '{}',
  requirements TEXT[] NOT NULL DEFAULT '{}',
  preferred_qualifications TEXT[] NOT NULL DEFAULT '{}',
  skills TEXT[] NOT NULL DEFAULT '{}',
  employment_type TEXT NOT NULL DEFAULT 'full_time',
  work_type TEXT NOT NULL DEFAULT 'full_time',
  location_type TEXT NOT NULL DEFAULT 'remote',
  location_display TEXT,
  experience_level TEXT,
  application_open_at TIMESTAMPTZ,
  application_close_at TIMESTAMPTZ,
  is_published BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hiring_roles_pub_status_idx ON public.hiring_roles(is_published, status);
CREATE INDEX IF NOT EXISTS hiring_roles_department_idx ON public.hiring_roles(department_id);
GRANT SELECT ON public.hiring_roles TO anon, authenticated;
GRANT ALL ON public.hiring_roles TO service_role;
ALTER TABLE public.hiring_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hiring_roles public read published" ON public.hiring_roles FOR SELECT
  USING (is_published = true AND status IN ('open','paused','closed'));
CREATE POLICY "hiring_roles admin manage" ON public.hiring_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.hiring_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_code TEXT UNIQUE,
  role_id UUID NOT NULL REFERENCES public.hiring_roles(id) ON DELETE CASCADE,
  applicant_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT NOT NULL,
  current_location TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  resume_path TEXT,
  cover_note TEXT,
  experience_summary TEXT,
  source TEXT DEFAULT 'careers_page',
  consent_status BOOLEAN NOT NULL DEFAULT false,
  application_status TEXT NOT NULL DEFAULT 'submitted',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hiring_applications_role_idx ON public.hiring_applications(role_id);
CREATE INDEX IF NOT EXISTS hiring_applications_email_idx ON public.hiring_applications(lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS hiring_applications_dedupe ON public.hiring_applications(role_id, lower(email));
GRANT INSERT ON public.hiring_applications TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.hiring_applications TO authenticated;
GRANT ALL ON public.hiring_applications TO service_role;
ALTER TABLE public.hiring_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hiring_applications public submit" ON public.hiring_applications FOR INSERT TO anon, authenticated
  WITH CHECK (consent_status = true);
CREATE POLICY "hiring_applications admin read" ON public.hiring_applications FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "hiring_applications admin update" ON public.hiring_applications FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "hiring_applications admin delete" ON public.hiring_applications FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_hiring_application_code()
RETURNS TRIGGER AS $$
DECLARE
  year_str TEXT := to_char(now(), 'YYYY');
  seq_num INTEGER;
BEGIN
  IF NEW.application_code IS NULL THEN
    SELECT COALESCE(COUNT(*), 0) + 1 INTO seq_num FROM public.hiring_applications
    WHERE application_code LIKE 'GL-CAR-' || year_str || '-%';
    NEW.application_code := 'GL-CAR-' || year_str || '-' || lpad(seq_num::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_hiring_application_code ON public.hiring_applications;
CREATE TRIGGER trg_hiring_application_code BEFORE INSERT ON public.hiring_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_hiring_application_code();

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column' AND pronamespace = 'public'::regnamespace) THEN
    CREATE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $inner$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $inner$ LANGUAGE plpgsql SET search_path = public;
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_hiring_departments_updated_at ON public.hiring_departments;
CREATE TRIGGER trg_hiring_departments_updated_at BEFORE UPDATE ON public.hiring_departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_hiring_roles_updated_at ON public.hiring_roles;
CREATE TRIGGER trg_hiring_roles_updated_at BEFORE UPDATE ON public.hiring_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_hiring_applications_updated_at ON public.hiring_applications;
CREATE TRIGGER trg_hiring_applications_updated_at BEFORE UPDATE ON public.hiring_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.hiring_departments (name, slug, headline, purpose, focus_areas, display_order) VALUES
('Product','product','Design Clearer Learning And Platform Journeys','Shape the experiences learners, partners and internal teams use across the Glintr ecosystem.',ARRAY['Learner Discovery','Program Experiences','Partner Products','Internal Workflows','Product Research','Platform Strategy'],10),
('Engineering','engineering','Build Reliable Systems For A Growing Education Platform','Design, build and operate the systems that power Glintr for learners, partners and internal teams.',ARRAY['Web Applications','Backend Systems','Data Workflows','Authentication','Platform Integrations','Performance','Security','Developer Experience'],20),
('Design','design','Create Experiences That Make Complex Journeys Easier To Understand','Design product interfaces, brand systems and content experiences that make Glintr feel clear and considered.',ARRAY['Product Design','UX Research','Design Systems','Interaction Design','Visual Communication','Responsive Experiences'],30),
('Learning And Programs','learning-and-programs','Help Shape Career-Focused Learning Experiences','Curate, structure and evolve the programs learners engage with across Glintr.',ARRAY['Program Research','Learning Structure','Content Operations','Domain Exploration','Program Quality','Learning Experience'],40),
('Growth And Marketing','growth-and-marketing','Help More Learners Discover Relevant Learning Opportunities','Reach more learners with clear, honest and useful communication about Glintr programs.',ARRAY['Growth Strategy','Digital Marketing','Content','Campaigns','Learner Acquisition','Marketing Operations'],50),
('Partnerships','partnerships','Build Relationships Across The Glintr Learning Ecosystem','Grow the network of partners and communities that help extend Glintr responsibly.',ARRAY['Partner Growth','Program Partnerships','Education Communities','Partner Operations','Relationship Management'],60),
('Operations','operations','Build The Processes That Keep The Platform Moving','Design and operate the workflows behind programs, learners and partners.',ARRAY['Program Operations','Learner Operations','Partner Operations','Workflow Quality','Process Improvement','Cross-Team Coordination'],70),
('People And Culture','people-and-culture','Help Build The Environment Behind The Team','Support the people, hiring and internal experience that shape how Glintr works day to day.',ARRAY['Talent','People Operations','Team Experience','Internal Communication','Hiring Operations'],80)
ON CONFLICT (slug) DO NOTHING;
