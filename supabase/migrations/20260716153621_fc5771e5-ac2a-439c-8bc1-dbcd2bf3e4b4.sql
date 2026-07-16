
-- Phase 1: CMS-driven course platform schema extensions

-- Additive columns on courses
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS subcategory text,
  ADD COLUMN IF NOT EXISTS gallery_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS self_paced_price numeric,
  ADD COLUMN IF NOT EXISTS career_launch_price numeric,
  ADD COLUMN IF NOT EXISTS career_pro_price numeric,
  ADD COLUMN IF NOT EXISTS internal_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS structured_data jsonb,
  ADD COLUMN IF NOT EXISTS learning_outcomes jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS who_should_join jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS highlights jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS capstone jsonb,
  ADD COLUMN IF NOT EXISTS case_studies jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS internship_details jsonb,
  ADD COLUMN IF NOT EXISTS ai_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS ai_generation_status text;

-- Hiring partners per course
CREATE TABLE IF NOT EXISTS public.course_hiring_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  logo_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.course_hiring_partners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_hiring_partners TO authenticated;
GRANT ALL ON public.course_hiring_partners TO service_role;

ALTER TABLE public.course_hiring_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view course hiring partners"
  ON public.course_hiring_partners FOR SELECT
  USING (true);

CREATE POLICY "Admins manage hiring partners"
  ON public.course_hiring_partners FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_course_hiring_partners_course ON public.course_hiring_partners(course_id);

-- Learning path stages
CREATE TABLE IF NOT EXISTS public.course_learning_path_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  stage text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.course_learning_path_stages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_learning_path_stages TO authenticated;
GRANT ALL ON public.course_learning_path_stages TO service_role;

ALTER TABLE public.course_learning_path_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view learning path stages"
  ON public.course_learning_path_stages FOR SELECT
  USING (true);

CREATE POLICY "Admins manage learning path stages"
  ON public.course_learning_path_stages FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_course_learning_stages_course ON public.course_learning_path_stages(course_id);

-- Salary stages
CREATE TABLE IF NOT EXISTS public.course_salary_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  stage text NOT NULL,
  range_label text,
  low numeric,
  high numeric,
  note text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.course_salary_stages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_salary_stages TO authenticated;
GRANT ALL ON public.course_salary_stages TO service_role;

ALTER TABLE public.course_salary_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view salary stages"
  ON public.course_salary_stages FOR SELECT
  USING (true);

CREATE POLICY "Admins manage salary stages"
  ON public.course_salary_stages FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_course_salary_stages_course ON public.course_salary_stages(course_id);

-- AI generation audit log
CREATE TABLE IF NOT EXISTS public.course_ai_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  kind text NOT NULL,
  prompt text,
  output jsonb,
  model text,
  status text NOT NULL DEFAULT 'success',
  error_message text,
  tokens_used integer,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_ai_generations TO authenticated;
GRANT ALL ON public.course_ai_generations TO service_role;

ALTER TABLE public.course_ai_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view ai generations"
  ON public.course_ai_generations FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert ai generations"
  ON public.course_ai_generations FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_course_ai_generations_course ON public.course_ai_generations(course_id);
CREATE INDEX IF NOT EXISTS idx_course_ai_generations_kind ON public.course_ai_generations(course_id, kind);

-- updated_at triggers
DROP TRIGGER IF EXISTS trg_course_hiring_partners_updated ON public.course_hiring_partners;
CREATE TRIGGER trg_course_hiring_partners_updated
  BEFORE UPDATE ON public.course_hiring_partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_course_learning_stages_updated ON public.course_learning_path_stages;
CREATE TRIGGER trg_course_learning_stages_updated
  BEFORE UPDATE ON public.course_learning_path_stages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_course_salary_stages_updated ON public.course_salary_stages;
CREATE TRIGGER trg_course_salary_stages_updated
  BEFORE UPDATE ON public.course_salary_stages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
