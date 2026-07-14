
CREATE TABLE public.course_sales_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL UNIQUE REFERENCES public.courses(id) ON DELETE CASCADE,
  talking_points text[] NOT NULL DEFAULT '{}',
  ideal_learners text[] NOT NULL DEFAULT '{}',
  faqs jsonb NOT NULL DEFAULT '[]'::jsonb,
  objections jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_sales_content TO authenticated;
GRANT ALL ON public.course_sales_content TO service_role;

ALTER TABLE public.course_sales_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners and admins read sales content"
  ON public.course_sales_content FOR SELECT
  TO authenticated
  USING (public.is_partner(auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY "Admins write sales content"
  ON public.course_sales_content FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_course_sales_content_updated_at
  BEFORE UPDATE ON public.course_sales_content
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
