
-- Extend mkt_campaigns with enterprise fields
ALTER TABLE public.mkt_campaigns
  ADD COLUMN IF NOT EXISTS campaign_type text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS goals text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS business_unit text,
  ADD COLUMN IF NOT EXISTS timeline_stage text NOT NULL DEFAULT 'planning',
  ADD COLUMN IF NOT EXISTS template_key text,
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS target_audience jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS target_platforms text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS expected_revenue_cents bigint,
  ADD COLUMN IF NOT EXISTS actual_revenue_cents bigint,
  ADD COLUMN IF NOT EXISTS expected_leads integer,
  ADD COLUMN IF NOT EXISTS actual_leads integer,
  ADD COLUMN IF NOT EXISTS actual_admissions integer,
  ADD COLUMN IF NOT EXISTS ai_strategy jsonb,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE INDEX IF NOT EXISTS mkt_campaigns_status_idx ON public.mkt_campaigns(status);
CREATE INDEX IF NOT EXISTS mkt_campaigns_owner_idx ON public.mkt_campaigns(owner_id);
CREATE INDEX IF NOT EXISTS mkt_campaigns_starts_idx ON public.mkt_campaigns(starts_at);

-- ============ mkt_campaign_assets ============
CREATE TABLE IF NOT EXISTS public.mkt_campaign_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.mkt_campaigns(id) ON DELETE CASCADE,
  asset_type text NOT NULL,
  title text NOT NULL,
  description text,
  url text,
  thumbnail_url text,
  ref_table text,
  ref_id uuid,
  platform text,
  status text NOT NULL DEFAULT 'draft',
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mkt_campaign_assets_campaign_idx ON public.mkt_campaign_assets(campaign_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mkt_campaign_assets TO authenticated;
GRANT ALL ON public.mkt_campaign_assets TO service_role;
ALTER TABLE public.mkt_campaign_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaign_assets via brand" ON public.mkt_campaign_assets
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.mkt_campaigns c
    JOIN public.mkt_brands b ON b.id = c.brand_id
    WHERE c.id = mkt_campaign_assets.campaign_id
      AND (b.owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.mkt_campaigns c
    JOIN public.mkt_brands b ON b.id = c.brand_id
    WHERE c.id = mkt_campaign_assets.campaign_id
      AND (b.owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))
  ));
CREATE TRIGGER mkt_campaign_assets_touch BEFORE UPDATE ON public.mkt_campaign_assets
  FOR EACH ROW EXECUTE FUNCTION public.mkt_touch_updated_at();

-- ============ mkt_campaign_tasks ============
CREATE TABLE IF NOT EXISTS public.mkt_campaign_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.mkt_campaigns(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'todo',
  progress integer NOT NULL DEFAULT 0,
  deadline timestamptz,
  checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
  depends_on uuid[] NOT NULL DEFAULT '{}'::uuid[],
  stage text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mkt_campaign_tasks_campaign_idx ON public.mkt_campaign_tasks(campaign_id);
CREATE INDEX IF NOT EXISTS mkt_campaign_tasks_status_idx ON public.mkt_campaign_tasks(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mkt_campaign_tasks TO authenticated;
GRANT ALL ON public.mkt_campaign_tasks TO service_role;
ALTER TABLE public.mkt_campaign_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaign_tasks via brand" ON public.mkt_campaign_tasks
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.mkt_campaigns c
    JOIN public.mkt_brands b ON b.id = c.brand_id
    WHERE c.id = mkt_campaign_tasks.campaign_id
      AND (b.owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.mkt_campaigns c
    JOIN public.mkt_brands b ON b.id = c.brand_id
    WHERE c.id = mkt_campaign_tasks.campaign_id
      AND (b.owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))
  ));
CREATE TRIGGER mkt_campaign_tasks_touch BEFORE UPDATE ON public.mkt_campaign_tasks
  FOR EACH ROW EXECUTE FUNCTION public.mkt_touch_updated_at();

-- ============ mkt_campaign_members ============
CREATE TABLE IF NOT EXISTS public.mkt_campaign_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.mkt_campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'contributor',
  added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, user_id)
);
CREATE INDEX IF NOT EXISTS mkt_campaign_members_campaign_idx ON public.mkt_campaign_members(campaign_id);
CREATE INDEX IF NOT EXISTS mkt_campaign_members_user_idx ON public.mkt_campaign_members(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mkt_campaign_members TO authenticated;
GRANT ALL ON public.mkt_campaign_members TO service_role;
ALTER TABLE public.mkt_campaign_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaign_members via brand" ON public.mkt_campaign_members
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.mkt_campaigns c
    JOIN public.mkt_brands b ON b.id = c.brand_id
    WHERE c.id = mkt_campaign_members.campaign_id
      AND (b.owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.mkt_campaigns c
    JOIN public.mkt_brands b ON b.id = c.brand_id
    WHERE c.id = mkt_campaign_members.campaign_id
      AND (b.owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))
  ));

-- ============ mkt_campaign_reports ============
CREATE TABLE IF NOT EXISTS public.mkt_campaign_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.mkt_campaigns(id) ON DELETE CASCADE,
  report_type text NOT NULL,
  title text NOT NULL,
  summary text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_insights jsonb,
  format text NOT NULL DEFAULT 'json',
  generated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mkt_campaign_reports_campaign_idx ON public.mkt_campaign_reports(campaign_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mkt_campaign_reports TO authenticated;
GRANT ALL ON public.mkt_campaign_reports TO service_role;
ALTER TABLE public.mkt_campaign_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaign_reports via brand" ON public.mkt_campaign_reports
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.mkt_campaigns c
    JOIN public.mkt_brands b ON b.id = c.brand_id
    WHERE c.id = mkt_campaign_reports.campaign_id
      AND (b.owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.mkt_campaigns c
    JOIN public.mkt_brands b ON b.id = c.brand_id
    WHERE c.id = mkt_campaign_reports.campaign_id
      AND (b.owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))
  ));

-- ============ mkt_campaign_metrics ============
CREATE TABLE IF NOT EXISTS public.mkt_campaign_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.mkt_campaigns(id) ON DELETE CASCADE,
  captured_on date NOT NULL DEFAULT CURRENT_DATE,
  platform text,
  reach integer NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  ctr numeric(6,4),
  engagement integer NOT NULL DEFAULT 0,
  leads integer NOT NULL DEFAULT 0,
  admissions integer NOT NULL DEFAULT 0,
  revenue_cents bigint NOT NULL DEFAULT 0,
  spend_cents bigint NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  followers_delta integer NOT NULL DEFAULT 0,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, captured_on, platform)
);
CREATE INDEX IF NOT EXISTS mkt_campaign_metrics_campaign_idx ON public.mkt_campaign_metrics(campaign_id);
CREATE INDEX IF NOT EXISTS mkt_campaign_metrics_date_idx ON public.mkt_campaign_metrics(captured_on);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mkt_campaign_metrics TO authenticated;
GRANT ALL ON public.mkt_campaign_metrics TO service_role;
ALTER TABLE public.mkt_campaign_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaign_metrics via brand" ON public.mkt_campaign_metrics
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.mkt_campaigns c
    JOIN public.mkt_brands b ON b.id = c.brand_id
    WHERE c.id = mkt_campaign_metrics.campaign_id
      AND (b.owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.mkt_campaigns c
    JOIN public.mkt_brands b ON b.id = c.brand_id
    WHERE c.id = mkt_campaign_metrics.campaign_id
      AND (b.owner_id = auth.uid() OR public.mkt_is_staff(auth.uid()))
  ));
