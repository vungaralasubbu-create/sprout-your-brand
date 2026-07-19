
CREATE TABLE public.pseo_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('city','state','country')),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  parent_slug text,
  country text NOT NULL DEFAULT 'IN',
  population bigint,
  priority integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pseo_locations TO anon, authenticated;
GRANT ALL ON public.pseo_locations TO service_role;
ALTER TABLE public.pseo_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pseo_locations public read" ON public.pseo_locations FOR SELECT USING (is_active = true);
CREATE POLICY "pseo_locations admin manage" ON public.pseo_locations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.pseo_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  page_type text NOT NULL CHECK (page_type IN (
    'by_city','by_state','online','career_roadmap','interview_questions',
    'salary_guide','projects','certification','faq','internship'
  )),
  location_id uuid REFERENCES public.pseo_locations(id) ON DELETE SET NULL,
  slug text NOT NULL UNIQUE,
  title text,
  h1 text,
  meta_description text,
  canonical_url text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  keywords text[] NOT NULL DEFAULT '{}',
  related_slugs text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','generating','published','failed','archived')),
  quality_score numeric,
  word_count integer,
  view_count bigint NOT NULL DEFAULT 0,
  published_at timestamptz,
  last_regenerated_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, page_type, location_id)
);
GRANT SELECT ON public.pseo_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pseo_pages TO authenticated;
GRANT ALL ON public.pseo_pages TO service_role;
ALTER TABLE public.pseo_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pseo_pages public read published" ON public.pseo_pages FOR SELECT USING (status = 'published');
CREATE POLICY "pseo_pages admin manage" ON public.pseo_pages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'instructor'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'instructor'));

CREATE INDEX pseo_pages_status_idx ON public.pseo_pages(status) WHERE status = 'published';
CREATE INDEX pseo_pages_course_idx ON public.pseo_pages(course_id);
CREATE INDEX pseo_pages_type_idx ON public.pseo_pages(page_type);
CREATE INDEX pseo_pages_updated_idx ON public.pseo_pages(updated_at DESC);

CREATE TABLE public.pseo_generation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.pseo_pages(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed')),
  priority integer NOT NULL DEFAULT 100,
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pseo_generation_jobs TO authenticated;
GRANT ALL ON public.pseo_generation_jobs TO service_role;
ALTER TABLE public.pseo_generation_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pseo_jobs admin manage" ON public.pseo_generation_jobs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));
CREATE INDEX pseo_jobs_status_idx ON public.pseo_generation_jobs(status, priority, scheduled_for);

CREATE TABLE public.pseo_interlinks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_page_id uuid NOT NULL REFERENCES public.pseo_pages(id) ON DELETE CASCADE,
  to_page_id uuid NOT NULL REFERENCES public.pseo_pages(id) ON DELETE CASCADE,
  relation text NOT NULL,
  anchor text,
  weight numeric NOT NULL DEFAULT 1.0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (from_page_id, to_page_id)
);
GRANT SELECT ON public.pseo_interlinks TO anon, authenticated;
GRANT ALL ON public.pseo_interlinks TO service_role;
ALTER TABLE public.pseo_interlinks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pseo_interlinks public read" ON public.pseo_interlinks FOR SELECT USING (true);
CREATE POLICY "pseo_interlinks admin manage" ON public.pseo_interlinks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));
CREATE INDEX pseo_interlinks_from_idx ON public.pseo_interlinks(from_page_id);
CREATE INDEX pseo_interlinks_to_idx ON public.pseo_interlinks(to_page_id);

CREATE TRIGGER pseo_locations_updated BEFORE UPDATE ON public.pseo_locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER pseo_pages_updated BEFORE UPDATE ON public.pseo_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER pseo_jobs_updated BEFORE UPDATE ON public.pseo_generation_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.pseo_locations (kind, name, slug, parent_slug, population, priority) VALUES
  ('state','Telangana','telangana',NULL,NULL,10),
  ('state','Karnataka','karnataka',NULL,NULL,10),
  ('state','Tamil Nadu','tamil-nadu',NULL,NULL,10),
  ('state','Maharashtra','maharashtra',NULL,NULL,10),
  ('state','Delhi','delhi-state',NULL,NULL,10),
  ('state','West Bengal','west-bengal',NULL,NULL,20),
  ('state','Kerala','kerala',NULL,NULL,20),
  ('state','Uttar Pradesh','uttar-pradesh',NULL,NULL,20),
  ('state','Gujarat','gujarat',NULL,NULL,20),
  ('state','Haryana','haryana',NULL,NULL,30),
  ('state','Punjab','punjab',NULL,NULL,30),
  ('state','Andhra Pradesh','andhra-pradesh',NULL,NULL,20),
  ('city','Hyderabad','hyderabad','telangana',10000000,5),
  ('city','Bangalore','bangalore','karnataka',13000000,5),
  ('city','Chennai','chennai','tamil-nadu',11000000,5),
  ('city','Mumbai','mumbai','maharashtra',22000000,5),
  ('city','Delhi','delhi','delhi-state',30000000,5),
  ('city','Pune','pune','maharashtra',7500000,10),
  ('city','Kolkata','kolkata','west-bengal',15000000,10),
  ('city','Ahmedabad','ahmedabad','gujarat',8000000,15),
  ('city','Noida','noida','uttar-pradesh',700000,15),
  ('city','Gurugram','gurugram','haryana',1200000,15),
  ('city','Kochi','kochi','kerala',2200000,20),
  ('city','Coimbatore','coimbatore','tamil-nadu',2200000,20),
  ('city','Vijayawada','vijayawada','andhra-pradesh',1500000,20),
  ('city','Visakhapatnam','visakhapatnam','andhra-pradesh',2000000,20),
  ('city','Jaipur','jaipur',NULL,3900000,25),
  ('city','Lucknow','lucknow','uttar-pradesh',3800000,25),
  ('city','Bhopal','bhopal',NULL,2400000,30),
  ('city','Indore','indore',NULL,2200000,30),
  ('city','Chandigarh','chandigarh',NULL,1200000,30),
  ('city','Nagpur','nagpur','maharashtra',2900000,30),
  ('city','Thiruvananthapuram','thiruvananthapuram','kerala',1700000,30),
  ('city','Mysore','mysore','karnataka',1200000,35),
  ('city','Surat','surat','gujarat',5400000,35),
  ('city','Bhubaneswar','bhubaneswar',NULL,1200000,35),
  ('city','Guwahati','guwahati',NULL,1000000,40);

CREATE OR REPLACE FUNCTION public.seed_pseo_pages_for_course(p_course_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_course RECORD;
  v_loc RECORD;
  v_page_id uuid;
  v_slug text;
  v_count integer := 0;
  v_types text[] := ARRAY['online','career_roadmap','interview_questions','salary_guide','projects','certification','faq','internship'];
  v_type text;
BEGIN
  SELECT id, slug, name INTO v_course FROM public.courses WHERE id = p_course_id;
  IF NOT FOUND OR v_course.slug IS NULL THEN RETURN 0; END IF;

  FOREACH v_type IN ARRAY v_types LOOP
    v_slug := CASE v_type
      WHEN 'online' THEN v_course.slug || '-online'
      WHEN 'career_roadmap' THEN v_course.slug || '-career-roadmap'
      WHEN 'interview_questions' THEN v_course.slug || '-interview-questions'
      WHEN 'salary_guide' THEN v_course.slug || '-salary'
      WHEN 'projects' THEN v_course.slug || '-projects'
      WHEN 'certification' THEN v_course.slug || '-certification'
      WHEN 'faq' THEN v_course.slug || '-faq'
      WHEN 'internship' THEN v_course.slug || '-internship'
    END;
    INSERT INTO public.pseo_pages (course_id, page_type, slug, canonical_url, status)
    VALUES (v_course.id, v_type, v_slug, '/p/' || v_slug, 'queued')
    ON CONFLICT (course_id, page_type, location_id) DO NOTHING
    RETURNING id INTO v_page_id;
    IF v_page_id IS NOT NULL THEN
      INSERT INTO public.pseo_generation_jobs (page_id, priority) VALUES (v_page_id, 50);
      v_count := v_count + 1;
    END IF;
    v_page_id := NULL;
  END LOOP;

  FOR v_loc IN
    SELECT id, kind, name, slug, priority FROM public.pseo_locations
    WHERE is_active = true ORDER BY priority ASC
  LOOP
    v_slug := v_course.slug || '-' || v_loc.slug;
    INSERT INTO public.pseo_pages (course_id, page_type, location_id, slug, canonical_url, status)
    VALUES (
      v_course.id,
      CASE WHEN v_loc.kind = 'city' THEN 'by_city' ELSE 'by_state' END,
      v_loc.id, v_slug, '/p/' || v_slug, 'queued'
    )
    ON CONFLICT (course_id, page_type, location_id) DO NOTHING
    RETURNING id INTO v_page_id;
    IF v_page_id IS NOT NULL THEN
      INSERT INTO public.pseo_generation_jobs (page_id, priority) VALUES (v_page_id, 100 + v_loc.priority);
      v_count := v_count + 1;
    END IF;
    v_page_id := NULL;
  END LOOP;

  RETURN v_count;
END; $$;
GRANT EXECUTE ON FUNCTION public.seed_pseo_pages_for_course(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.trg_courses_seed_pseo()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_published = true AND (TG_OP = 'INSERT' OR OLD.is_published IS DISTINCT FROM NEW.is_published) THEN
    PERFORM public.seed_pseo_pages_for_course(NEW.id);
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS courses_seed_pseo ON public.courses;
CREATE TRIGGER courses_seed_pseo
  AFTER INSERT OR UPDATE OF is_published ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.trg_courses_seed_pseo();

CREATE OR REPLACE FUNCTION public.recompute_pseo_interlinks(p_page_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_page RECORD;
  v_count integer := 0;
BEGIN
  SELECT * INTO v_page FROM public.pseo_pages WHERE id = p_page_id;
  IF NOT FOUND THEN RETURN 0; END IF;
  DELETE FROM public.pseo_interlinks WHERE from_page_id = p_page_id;

  INSERT INTO public.pseo_interlinks (from_page_id, to_page_id, relation, weight)
  SELECT v_page.id, p.id, 'sibling_variant', 1.0
  FROM public.pseo_pages p
  WHERE p.course_id = v_page.course_id AND p.id <> v_page.id AND p.status = 'published'
  ON CONFLICT DO NOTHING;

  IF v_page.location_id IS NOT NULL THEN
    INSERT INTO public.pseo_interlinks (from_page_id, to_page_id, relation, weight)
    SELECT v_page.id, p.id, 'sibling_location', 0.8
    FROM public.pseo_pages p
    WHERE p.course_id = v_page.course_id AND p.page_type = v_page.page_type
      AND p.id <> v_page.id AND p.status = 'published'
    ON CONFLICT DO NOTHING;
  END IF;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END; $$;
GRANT EXECUTE ON FUNCTION public.recompute_pseo_interlinks(uuid) TO authenticated, service_role;
