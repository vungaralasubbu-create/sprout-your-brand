
DO $$ BEGIN CREATE TYPE public.content_status AS ENUM ('draft','published','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.lesson_type AS ENUM ('video','text','pdf','quiz','assignment','live','project','external'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.course_app_status AS ENUM ('new','contacted','qualified','enrolled','rejected','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.referral_event AS ENUM ('visit','lead','application','enrollment'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.course_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, slug text NOT NULL UNIQUE,
  short_description text, full_description text, icon text,
  thumbnail_url text, hero_image_url text, hero_title text, hero_subtitle text,
  accent_style text DEFAULT 'brand', display_order int NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false, is_active boolean NOT NULL DEFAULT true,
  status public.content_status NOT NULL DEFAULT 'draft',
  seo_title text, seo_description text, seo_keywords text[] DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id), updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.course_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.course_categories TO authenticated;
GRANT ALL ON public.course_categories TO service_role;
ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published categories" ON public.course_categories FOR SELECT USING (status='published' AND is_active=true);
CREATE POLICY "Admins manage categories" ON public.course_categories FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_course_categories_updated BEFORE UPDATE ON public.course_categories FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE, slug text NOT NULL UNIQUE,
  description text, icon text, is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.skills TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.skills TO authenticated;
GRANT ALL ON public.skills TO service_role;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read skills" ON public.skills FOR SELECT USING (is_active=true);
CREATE POLICY "Admins manage skills" ON public.skills FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_skills_updated BEFORE UPDATE ON public.skills FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE, slug text NOT NULL UNIQUE,
  logo_url text, description text, website_url text, category text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tools TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tools TO authenticated;
GRANT ALL ON public.tools TO service_role;
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read tools" ON public.tools FOR SELECT USING (is_active=true);
CREATE POLICY "Admins manage tools" ON public.tools FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_tools_updated BEFORE UPDATE ON public.tools FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.career_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL, slug text NOT NULL UNIQUE, description text,
  experience_level text, salary_min numeric, salary_max numeric,
  currency text DEFAULT 'INR', salary_period text DEFAULT 'yearly',
  salary_source text, salary_source_url text, salary_date date, region text,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.career_roles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.career_roles TO authenticated;
GRANT ALL ON public.career_roles TO service_role;
ALTER TABLE public.career_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read career roles" ON public.career_roles FOR SELECT USING (is_visible=true);
CREATE POLICY "Admins manage career roles" ON public.career_roles FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_career_roles_updated BEFORE UPDATE ON public.career_roles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.course_project_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, slug text NOT NULL UNIQUE,
  short_description text, full_description text, image_url text,
  difficulty text, duration text, industry text, project_type text,
  learning_outcomes text[] DEFAULT '{}', is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.course_project_templates TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.course_project_templates TO authenticated;
GRANT ALL ON public.course_project_templates TO service_role;
ALTER TABLE public.course_project_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read projects" ON public.course_project_templates FOR SELECT USING (is_active=true);
CREATE POLICY "Admins manage projects" ON public.course_project_templates FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON public.course_project_templates FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.course_categories(id) ON DELETE RESTRICT,
  name text NOT NULL, slug text NOT NULL,
  short_description text, full_description text,
  thumbnail_url text, hero_image_url text, promo_video_url text,
  status public.content_status NOT NULL DEFAULT 'draft',
  is_published boolean NOT NULL DEFAULT false, is_featured boolean NOT NULL DEFAULT false,
  is_trending boolean NOT NULL DEFAULT false, is_popular boolean NOT NULL DEFAULT false,
  is_bestseller boolean NOT NULL DEFAULT false,
  white_label_eligible boolean NOT NULL DEFAULT false,
  partner_sale_eligible boolean NOT NULL DEFAULT true,
  supported_sales_eligible boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  duration text, learning_mode text, level text, language text DEFAULT 'English',
  weekly_commitment text, format text, prerequisites text, eligibility text, target_audience text,
  base_price numeric, offer_price numeric, discount_pct numeric,
  currency text DEFAULT 'INR', emi_available boolean NOT NULL DEFAULT false,
  emi_starting numeric, scholarship_available boolean NOT NULL DEFAULT false,
  pricing_visibility text DEFAULT 'public', tax_config jsonb DEFAULT '{}'::jsonb, pricing_notes text,
  default_revenue_rule_id uuid REFERENCES public.revenue_share_rules(id),
  seo_title text, seo_description text, seo_keywords text[] DEFAULT '{}',
  og_image_url text, canonical_url text,
  created_by uuid REFERENCES auth.users(id), updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category_id);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON public.courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_published ON public.courses(is_published, status);
GRANT SELECT ON public.courses TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published courses" ON public.courses FOR SELECT USING (is_published=true AND status='published');
CREATE POLICY "Admins manage courses" ON public.courses FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_courses_updated BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.course_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  section_type text NOT NULL, title text, content jsonb DEFAULT '{}'::jsonb,
  display_order int NOT NULL DEFAULT 0, is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_course_sections_course ON public.course_sections(course_id);
GRANT SELECT ON public.course_sections TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.course_sections TO authenticated;
GRANT ALL ON public.course_sections TO service_role;
ALTER TABLE public.course_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read enabled sections" ON public.course_sections FOR SELECT USING (
  is_enabled=true AND EXISTS (SELECT 1 FROM public.courses c WHERE c.id=course_id AND c.is_published=true AND c.status='published')
);
CREATE POLICY "Admins manage sections" ON public.course_sections FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_course_sections_updated BEFORE UPDATE ON public.course_sections FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  number int, name text NOT NULL, description text, duration text,
  learning_outcomes text[] DEFAULT '{}', display_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.course_modules TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.course_modules TO authenticated;
GRANT ALL ON public.course_modules TO service_role;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read modules" ON public.course_modules FOR SELECT USING (
  is_published=true AND EXISTS (SELECT 1 FROM public.courses c WHERE c.id=course_id AND c.is_published=true AND c.status='published')
);
CREATE POLICY "Admins manage modules" ON public.course_modules FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_course_modules_updated BEFORE UPDATE ON public.course_modules FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.course_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  name text NOT NULL, description text, display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.course_topics TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.course_topics TO authenticated;
GRANT ALL ON public.course_topics TO service_role;
ALTER TABLE public.course_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read topics" ON public.course_topics FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.course_modules m JOIN public.courses c ON c.id=m.course_id WHERE m.id=module_id AND m.is_published=true AND c.is_published=true AND c.status='published')
);
CREATE POLICY "Admins manage topics" ON public.course_topics FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_course_topics_updated BEFORE UPDATE ON public.course_topics FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.course_topics(id) ON DELETE CASCADE,
  name text NOT NULL, lesson_type public.lesson_type NOT NULL DEFAULT 'video',
  duration text, is_free_preview boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true, resource_url text,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.course_lessons TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.course_lessons TO authenticated;
GRANT ALL ON public.course_lessons TO service_role;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read lessons meta" ON public.course_lessons FOR SELECT USING (is_published=true);
CREATE POLICY "Admins manage lessons" ON public.course_lessons FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_course_lessons_updated BEFORE UPDATE ON public.course_lessons FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.course_skills (
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  display_order int NOT NULL DEFAULT 0, PRIMARY KEY (course_id, skill_id)
);
GRANT SELECT ON public.course_skills TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.course_skills TO authenticated;
GRANT ALL ON public.course_skills TO service_role;
ALTER TABLE public.course_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read course_skills" ON public.course_skills FOR SELECT USING (true);
CREATE POLICY "Admins manage course_skills" ON public.course_skills FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.course_tools (
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  tool_id uuid NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  display_order int NOT NULL DEFAULT 0, PRIMARY KEY (course_id, tool_id)
);
GRANT SELECT ON public.course_tools TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.course_tools TO authenticated;
GRANT ALL ON public.course_tools TO service_role;
ALTER TABLE public.course_tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read course_tools" ON public.course_tools FOR SELECT USING (true);
CREATE POLICY "Admins manage course_tools" ON public.course_tools FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.course_projects (
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.course_project_templates(id) ON DELETE CASCADE,
  display_order int NOT NULL DEFAULT 0, PRIMARY KEY (course_id, project_id)
);
GRANT SELECT ON public.course_projects TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.course_projects TO authenticated;
GRANT ALL ON public.course_projects TO service_role;
ALTER TABLE public.course_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read course_projects" ON public.course_projects FOR SELECT USING (true);
CREATE POLICY "Admins manage course_projects" ON public.course_projects FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.course_career_roles (
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  career_role_id uuid NOT NULL REFERENCES public.career_roles(id) ON DELETE CASCADE,
  display_order int NOT NULL DEFAULT 0, PRIMARY KEY (course_id, career_role_id)
);
GRANT SELECT ON public.course_career_roles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.course_career_roles TO authenticated;
GRANT ALL ON public.course_career_roles TO service_role;
ALTER TABLE public.course_career_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read course_career_roles" ON public.course_career_roles FOR SELECT USING (true);
CREATE POLICY "Admins manage course_career_roles" ON public.course_career_roles FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.course_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name text NOT NULL, description text, image_url text, issuer text,
  verification_available boolean NOT NULL DEFAULT false, requirements text,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.course_certifications TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.course_certifications TO authenticated;
GRANT ALL ON public.course_certifications TO service_role;
ALTER TABLE public.course_certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read certifications" ON public.course_certifications FOR SELECT USING (is_enabled=true);
CREATE POLICY "Admins manage certifications" ON public.course_certifications FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_course_certs_updated BEFORE UPDATE ON public.course_certifications FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.course_placement_support (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  support_type text NOT NULL, description text,
  is_enabled boolean NOT NULL DEFAULT true, display_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.course_placement_support TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.course_placement_support TO authenticated;
GRANT ALL ON public.course_placement_support TO service_role;
ALTER TABLE public.course_placement_support ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read placement" ON public.course_placement_support FOR SELECT USING (is_enabled=true);
CREATE POLICY "Admins manage placement" ON public.course_placement_support FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.course_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  question text NOT NULL, answer text NOT NULL,
  display_order int NOT NULL DEFAULT 0, is_enabled boolean NOT NULL DEFAULT true
);
GRANT SELECT ON public.course_faqs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.course_faqs TO authenticated;
GRANT ALL ON public.course_faqs TO service_role;
ALTER TABLE public.course_faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read faqs" ON public.course_faqs FOR SELECT USING (is_enabled=true);
CREATE POLICY "Admins manage faqs" ON public.course_faqs FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.course_related (
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  related_course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  is_manual boolean NOT NULL DEFAULT true, display_order int NOT NULL DEFAULT 0,
  PRIMARY KEY (course_id, related_course_id), CHECK (course_id <> related_course_id)
);
GRANT SELECT ON public.course_related TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.course_related TO authenticated;
GRANT ALL ON public.course_related TO service_role;
ALTER TABLE public.course_related ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read related" ON public.course_related FOR SELECT USING (true);
CREATE POLICY "Admins manage related" ON public.course_related FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.course_brochures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  file_url text NOT NULL, version text,
  is_published boolean NOT NULL DEFAULT true, capture_lead boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.course_brochures TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.course_brochures TO authenticated;
GRANT ALL ON public.course_brochures TO service_role;
ALTER TABLE public.course_brochures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read brochures" ON public.course_brochures FOR SELECT USING (is_published=true);
CREATE POLICY "Admins manage brochures" ON public.course_brochures FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_course_brochures_updated BEFORE UPDATE ON public.course_brochures FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.course_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  full_name text NOT NULL, mobile text NOT NULL, email text NOT NULL,
  city text, state text, education text, graduation_year int,
  current_role_title text, work_experience text,
  preferred_mode text, start_timeline text, source text,
  consent boolean NOT NULL DEFAULT false, partner_ref text,
  status public.course_app_status NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.course_applications TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.course_applications TO authenticated;
GRANT ALL ON public.course_applications TO service_role;
ALTER TABLE public.course_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can apply" ON public.course_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read applications" ON public.course_applications FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins update applications" ON public.course_applications FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins delete applications" ON public.course_applications FOR DELETE USING (public.is_admin(auth.uid()));
CREATE TRIGGER trg_course_apps_updated BEFORE UPDATE ON public.course_applications FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.brochure_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  name text NOT NULL, mobile text, email text, partner_ref text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.brochure_leads TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.brochure_leads TO authenticated;
GRANT ALL ON public.brochure_leads TO service_role;
ALTER TABLE public.brochure_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit lead" ON public.brochure_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read leads" ON public.brochure_leads FOR SELECT USING (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.partner_referral_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_ref text, course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  session_id text, event_type public.referral_event NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ref_events_partner ON public.partner_referral_events(partner_ref);
CREATE INDEX IF NOT EXISTS idx_ref_events_course ON public.partner_referral_events(course_id);
GRANT INSERT ON public.partner_referral_events TO anon, authenticated;
GRANT SELECT ON public.partner_referral_events TO authenticated;
GRANT ALL ON public.partner_referral_events TO service_role;
ALTER TABLE public.partner_referral_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can log referral event" ON public.partner_referral_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read referral events" ON public.partner_referral_events FOR SELECT USING (public.is_admin(auth.uid()));

INSERT INTO public.course_categories (name, slug, short_description, full_description, icon, accent_style, display_order, is_featured, is_active, status, seo_title, seo_description)
VALUES
  ('Computer Science','computer-science','Build future-ready technology skills across software, data, artificial intelligence, and digital infrastructure.','Explore programs across AI, ML, web/app development, data, cloud, and cyber security.','Cpu','brand',1,true,true,'published','Computer Science Programs — Glintr','AI, ML, Web/App Dev, Data, Cloud & Cyber Security career programs.'),
  ('Electronics & Electrical','electronics-electrical','Explore intelligent hardware, semiconductor systems, connected devices, and automation technologies.','Programs across VLSI, embedded systems, IoT, and robotics.','Radio','cyan',2,true,true,'published','Electronics & Electrical Programs — Glintr','VLSI, Embedded Systems, IoT and Robotics career programs.'),
  ('Mechanical Engineering','mechanical-engineering','Develop practical engineering and design skills for modern product, manufacturing, and technology industries.','CAD, CAM, product design, drones, and manufacturing programs.','Cog','violet',3,true,true,'published','Mechanical Engineering Programs — Glintr','AutoCAD, SolidWorks, CAD/CAM, Drone Engineering programs.'),
  ('Management','management','Build practical business, finance, marketing, people management, and strategic decision-making skills.','Programs across HR, digital marketing, finance, investment, sales, and analytics.','Briefcase','lime',4,true,true,'published','Management Programs — Glintr','HR, Marketing, Finance, Investment Banking, Sales & Analytics programs.')
ON CONFLICT (slug) DO NOTHING;

WITH cats AS (SELECT id, slug FROM public.course_categories)
INSERT INTO public.courses (category_id, name, slug, short_description, status, is_published, is_featured, level, learning_mode, duration, language, base_price, offer_price, currency, emi_available, partner_sale_eligible, supported_sales_eligible, white_label_eligible, display_order)
SELECT c.id, x.name, x.slug, x.short_desc, 'published'::public.content_status, true, x.featured, x.level, 'Online', x.duration, 'English', x.base_price, x.offer_price, 'INR', true, true, true, true, x.ord
FROM (VALUES
  ('computer-science','Artificial Intelligence','artificial-intelligence','Explore intelligent systems and real-world AI applications transforming modern industries.',true,'Intermediate','6 months',75000::numeric,59000::numeric,1),
  ('computer-science','Machine Learning','machine-learning','Learn how machines predict, adapt, and drive data-powered technology.',true,'Intermediate','5 months',65000,52000,2),
  ('computer-science','Web Development','web-development','Design and develop responsive websites vital to today''s digital infrastructure.',true,'Beginner','4 months',45000,35000,3),
  ('computer-science','App Development','app-development','Build mobile applications that solve real-world problems and power digital experiences.',false,'Intermediate','5 months',55000,44000,4),
  ('computer-science','Data Science','data-science','Master data-driven decision-making and solve real-world problems using analytical skills.',true,'Intermediate','6 months',70000,55000,5),
  ('computer-science','Cloud Computing','cloud-computing','Understand cloud infrastructure, deployment, and services shaping modern IT systems.',false,'Intermediate','4 months',55000,44000,6),
  ('computer-science','Data Analytics','data-analytics','Extract meaningful insights from data to support smarter business decisions.',false,'Beginner','4 months',48000,38000,7),
  ('computer-science','Cyber Security','cyber-security','Learn to secure networks, data, and digital systems in an age of increasing cyber threats.',true,'Intermediate','5 months',65000,52000,8),
  ('electronics-electrical','VLSI Design','vlsi-design','Master chip design fundamentals and semiconductor workflows powering modern electronics.',true,'Advanced','6 months',72000,58000,1),
  ('electronics-electrical','Embedded Systems','embedded-systems','Build firmware and hardware skills for real-time and embedded computing systems.',false,'Intermediate','5 months',60000,48000,2),
  ('electronics-electrical','Internet of Things (IoT)','iot','Design connected devices and IoT solutions across consumer and industrial applications.',true,'Intermediate','4 months',52000,42000,3),
  ('electronics-electrical','Robotics','robotics','Explore robotics, automation, and control systems shaping the future of manufacturing.',false,'Advanced','5 months',65000,52000,4),
  ('mechanical-engineering','AutoCAD','autocad','Learn industry-standard drafting and 2D/3D design workflows used across engineering.',true,'Beginner','3 months',30000,24000,1),
  ('mechanical-engineering','Drone Engineering','drone-engineering','Design and build drones with hands-on knowledge of aerodynamics, control, and electronics.',true,'Intermediate','4 months',48000,38000,2),
  ('mechanical-engineering','CAD/CAM','cad-cam','Master CAD/CAM workflows for modern product engineering and manufacturing.',false,'Intermediate','4 months',45000,36000,3),
  ('mechanical-engineering','SolidWorks','solidworks','Design mechanical components and assemblies with SolidWorks industry workflows.',false,'Intermediate','3 months',35000,28000,4),
  ('mechanical-engineering','Product Design','product-design','Develop end-to-end product design skills spanning ideation, prototyping, and validation.',true,'Intermediate','5 months',55000,44000,5),
  ('mechanical-engineering','Manufacturing Engineering','manufacturing-engineering','Understand modern manufacturing, processes, and quality systems for industry.',false,'Intermediate','5 months',52000,42000,6),
  ('management','Human Resource Management','human-resource-management','Build practical people, talent, and organizational skills for modern HR roles.',true,'Beginner','4 months',42000,34000,1),
  ('management','Digital Marketing','digital-marketing','Master search, social, content, and performance marketing across digital channels.',true,'Beginner','4 months',45000,36000,2),
  ('management','Finance','finance','Learn corporate finance, valuation, and financial decision-making fundamentals.',true,'Intermediate','5 months',55000,44000,3),
  ('management','Investment Banking','investment-banking','Understand investment banking workflows, deal execution, and financial analysis.',false,'Advanced','5 months',65000,52000,4),
  ('management','Stock Market','stock-market','Learn stock market fundamentals, analysis frameworks, and investing principles for education purposes.',false,'Beginner','3 months',30000,24000,5),
  ('management','Sales & Marketing','sales-and-marketing','Build modern sales, marketing, and revenue-growth skills used across industries.',true,'Beginner','4 months',42000,34000,6),
  ('management','Business Analytics','business-analytics','Turn business data into actionable insights using modern analytics workflows.',false,'Intermediate','5 months',55000,44000,7),
  ('management','Operations Management','operations-management','Master operations, supply chain, and process management fundamentals for modern organizations.',false,'Intermediate','5 months',55000,44000,8)
) AS x(cat_slug,name,slug,short_desc,featured,level,duration,base_price,offer_price,ord)
JOIN cats c ON c.slug = x.cat_slug
ON CONFLICT (category_id, slug) DO NOTHING;
