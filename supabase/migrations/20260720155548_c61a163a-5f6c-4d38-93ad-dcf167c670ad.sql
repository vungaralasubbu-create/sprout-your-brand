
-- ============ marketing_plans ============
CREATE TABLE IF NOT EXISTS public.marketing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  industry text,
  goals jsonb NOT NULL DEFAULT '[]'::jsonb,
  target_audience jsonb NOT NULL DEFAULT '[]'::jsonb,
  countries jsonb NOT NULL DEFAULT '[]'::jsonb,
  primary_language text,
  secondary_languages jsonb NOT NULL DEFAULT '[]'::jsonb,
  brand_tone text,
  brand_personality text,
  brand_keywords jsonb NOT NULL DEFAULT '[]'::jsonb,
  competitors jsonb NOT NULL DEFAULT '[]'::jsonb,
  products jsonb NOT NULL DEFAULT '[]'::jsonb,
  courses jsonb NOT NULL DEFAULT '[]'::jsonb,
  services jsonb NOT NULL DEFAULT '[]'::jsonb,
  cta_preference text,
  platforms jsonb NOT NULL DEFAULT '[]'::jsonb,
  planning_period text NOT NULL DEFAULT '1_month',
  content_types jsonb NOT NULL DEFAULT '[]'::jsonb,
  content_mix jsonb NOT NULL DEFAULT '{}'::jsonb,
  posting_frequency jsonb NOT NULL DEFAULT '{}'::jsonb,
  campaigns jsonb NOT NULL DEFAULT '[]'::jsonb,
  planner_json jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','archived')),
  parent_plan_id uuid REFERENCES public.marketing_plans(id) ON DELETE SET NULL,
  version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_plans TO authenticated;
GRANT ALL ON public.marketing_plans TO service_role;

ALTER TABLE public.marketing_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mp_owner_select" ON public.marketing_plans
  FOR SELECT TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "mp_owner_insert" ON public.marketing_plans
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "mp_owner_update" ON public.marketing_plans
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "mp_owner_delete" ON public.marketing_plans
  FOR DELETE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX IF NOT EXISTS idx_marketing_plans_owner ON public.marketing_plans(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_plans_status ON public.marketing_plans(status);
CREATE INDEX IF NOT EXISTS idx_marketing_plans_parent ON public.marketing_plans(parent_plan_id);

-- ============ marketing_plan_versions (version history) ============
CREATE TABLE IF NOT EXISTS public.marketing_plan_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.marketing_plans(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version int NOT NULL,
  snapshot jsonb NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.marketing_plan_versions TO authenticated;
GRANT ALL ON public.marketing_plan_versions TO service_role;

ALTER TABLE public.marketing_plan_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mpv_owner_select" ON public.marketing_plan_versions
  FOR SELECT TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "mpv_owner_insert" ON public.marketing_plan_versions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "mpv_owner_delete" ON public.marketing_plan_versions
  FOR DELETE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX IF NOT EXISTS idx_mpv_plan ON public.marketing_plan_versions(plan_id, version DESC);

-- updated_at trigger reuse
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    CREATE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $f$
    BEGIN NEW.updated_at = now(); RETURN NEW; END;
    $f$ LANGUAGE plpgsql SET search_path = public;
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_marketing_plans_updated ON public.marketing_plans;
CREATE TRIGGER trg_marketing_plans_updated
  BEFORE UPDATE ON public.marketing_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
