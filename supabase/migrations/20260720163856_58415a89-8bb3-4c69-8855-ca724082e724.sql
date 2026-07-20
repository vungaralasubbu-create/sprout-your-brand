
CREATE TABLE IF NOT EXISTS public.mkt_analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  event_type text NOT NULL,
  platform text,
  campaign text,
  entity_type text,
  entity_id uuid,
  value numeric DEFAULT 0,
  currency text DEFAULT 'INR',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mkt_ae_owner_idx ON public.mkt_analytics_events(owner_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS mkt_ae_platform_idx ON public.mkt_analytics_events(platform, occurred_at DESC);
CREATE INDEX IF NOT EXISTS mkt_ae_type_idx ON public.mkt_analytics_events(event_type, occurred_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mkt_analytics_events TO authenticated;
GRANT ALL ON public.mkt_analytics_events TO service_role;
ALTER TABLE public.mkt_analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own analytics events" ON public.mkt_analytics_events
  FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
  WITH CHECK (owner_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE TABLE IF NOT EXISTS public.mkt_analytics_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'custom',
  range_from timestamptz,
  range_to timestamptz,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  format text NOT NULL DEFAULT 'json',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mkt_ar_owner_idx ON public.mkt_analytics_reports(owner_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mkt_analytics_reports TO authenticated;
GRANT ALL ON public.mkt_analytics_reports TO service_role;
ALTER TABLE public.mkt_analytics_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own analytics reports" ON public.mkt_analytics_reports
  FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
  WITH CHECK (owner_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE TABLE IF NOT EXISTS public.mkt_analytics_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  snapshot_date date NOT NULL,
  platform text,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_id, snapshot_date, platform)
);
CREATE INDEX IF NOT EXISTS mkt_as_owner_idx ON public.mkt_analytics_snapshots(owner_id, snapshot_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mkt_analytics_snapshots TO authenticated;
GRANT ALL ON public.mkt_analytics_snapshots TO service_role;
ALTER TABLE public.mkt_analytics_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own analytics snapshots" ON public.mkt_analytics_snapshots
  FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
  WITH CHECK (owner_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));
