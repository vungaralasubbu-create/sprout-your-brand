
-- Enterprise Technical SEO & Site Health Center (additive)

CREATE TABLE IF NOT EXISTS public.tsh_audit_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  started_at timestamptz,
  finished_at timestamptz,
  pages_scanned int NOT NULL DEFAULT 0,
  issues_found int NOT NULL DEFAULT 0,
  triggered_by uuid,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tsh_runs_status ON public.tsh_audit_runs(status);
GRANT SELECT ON public.tsh_audit_runs TO authenticated;
GRANT ALL ON public.tsh_audit_runs TO service_role;
ALTER TABLE public.tsh_audit_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage tsh_audit_runs" ON public.tsh_audit_runs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.tsh_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL UNIQUE,
  path text NOT NULL,
  content_type text,
  content_id text,
  status_code int,
  content_length int,
  response_time_ms int,
  last_crawled_at timestamptz,
  last_modified_at timestamptz,
  canonical_url text,
  robots_directive text,
  is_indexable boolean DEFAULT true,
  is_orphan boolean DEFAULT false,
  in_sitemap boolean DEFAULT false,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tsh_pages_path ON public.tsh_pages(path);
CREATE INDEX IF NOT EXISTS idx_tsh_pages_status ON public.tsh_pages(status_code);
GRANT SELECT ON public.tsh_pages TO authenticated;
GRANT ALL ON public.tsh_pages TO service_role;
ALTER TABLE public.tsh_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage tsh_pages" ON public.tsh_pages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.tsh_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES public.tsh_audit_runs(id) ON DELETE SET NULL,
  page_id uuid REFERENCES public.tsh_pages(id) ON DELETE CASCADE,
  url text,
  category text NOT NULL,
  code text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  title text NOT NULL,
  detail text,
  recommendation text,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'open',
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  ignored_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_tsh_issues_status ON public.tsh_issues(status);
CREATE INDEX IF NOT EXISTS idx_tsh_issues_page ON public.tsh_issues(page_id);
CREATE INDEX IF NOT EXISTS idx_tsh_issues_category ON public.tsh_issues(category);
CREATE INDEX IF NOT EXISTS idx_tsh_issues_severity ON public.tsh_issues(severity);
CREATE UNIQUE INDEX IF NOT EXISTS uq_tsh_issue_open
  ON public.tsh_issues(page_id, code) WHERE status = 'open';
GRANT SELECT, INSERT, UPDATE ON public.tsh_issues TO authenticated;
GRANT ALL ON public.tsh_issues TO service_role;
ALTER TABLE public.tsh_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage tsh_issues" ON public.tsh_issues FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.tsh_page_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid REFERENCES public.tsh_pages(id) ON DELETE CASCADE,
  url text NOT NULL,
  technical real DEFAULT 0,
  content_quality real DEFAULT 0,
  metadata real DEFAULT 0,
  performance real DEFAULT 0,
  accessibility real DEFAULT 0,
  internal_linking real DEFAULT 0,
  schema_health real DEFAULT 0,
  mobile real DEFAULT 0,
  ai_readiness real DEFAULT 0,
  overall real DEFAULT 0,
  breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  computed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(url)
);
GRANT SELECT ON public.tsh_page_scores TO authenticated;
GRANT ALL ON public.tsh_page_scores TO service_role;
ALTER TABLE public.tsh_page_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read tsh_page_scores" ON public.tsh_page_scores FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.tsh_core_web_vitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  device text NOT NULL DEFAULT 'mobile',
  lcp real,
  inp real,
  cls real,
  fcp real,
  ttfb real,
  tbt real,
  speed_index real,
  source text NOT NULL DEFAULT 'psi',
  measured_at timestamptz NOT NULL DEFAULT now(),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_tsh_cwv_url ON public.tsh_core_web_vitals(url);
CREATE INDEX IF NOT EXISTS idx_tsh_cwv_time ON public.tsh_core_web_vitals(measured_at DESC);
GRANT SELECT ON public.tsh_core_web_vitals TO authenticated;
GRANT ALL ON public.tsh_core_web_vitals TO service_role;
ALTER TABLE public.tsh_core_web_vitals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read tsh_cwv" ON public.tsh_core_web_vitals FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.tsh_link_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_url text NOT NULL,
  to_url text NOT NULL,
  is_external boolean NOT NULL DEFAULT false,
  status_code int,
  redirect_target text,
  hops int DEFAULT 0,
  detected_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(from_url, to_url)
);
CREATE INDEX IF NOT EXISTS idx_tsh_edges_from ON public.tsh_link_edges(from_url);
CREATE INDEX IF NOT EXISTS idx_tsh_edges_to ON public.tsh_link_edges(to_url);
GRANT SELECT ON public.tsh_link_edges TO authenticated;
GRANT ALL ON public.tsh_link_edges TO service_role;
ALTER TABLE public.tsh_link_edges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read tsh_link_edges" ON public.tsh_link_edges FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.tsh_sitemap_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sitemap text NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  status_code int,
  url_count int DEFAULT 0,
  invalid_urls int DEFAULT 0,
  duplicate_urls int DEFAULT 0,
  broken_entries int DEFAULT 0,
  size_bytes int DEFAULT 0,
  error text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_tsh_sitemap ON public.tsh_sitemap_status(sitemap, fetched_at DESC);
GRANT SELECT ON public.tsh_sitemap_status TO authenticated;
GRANT ALL ON public.tsh_sitemap_status TO service_role;
ALTER TABLE public.tsh_sitemap_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read tsh_sitemap_status" ON public.tsh_sitemap_status FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.tsh_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  period_start date,
  period_end date,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_summary text,
  generated_at timestamptz NOT NULL DEFAULT now(),
  generated_by uuid
);
CREATE INDEX IF NOT EXISTS idx_tsh_reports_kind ON public.tsh_reports(kind, generated_at DESC);
GRANT SELECT ON public.tsh_reports TO authenticated;
GRANT ALL ON public.tsh_reports TO service_role;
ALTER TABLE public.tsh_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read tsh_reports" ON public.tsh_reports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.tsh_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  severity text NOT NULL DEFAULT 'medium',
  title text NOT NULL,
  detail text,
  category text,
  url text,
  acknowledged_at timestamptz,
  acknowledged_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_tsh_alerts_active ON public.tsh_alerts(acknowledged_at) WHERE acknowledged_at IS NULL;
GRANT SELECT, UPDATE ON public.tsh_alerts TO authenticated;
GRANT ALL ON public.tsh_alerts TO service_role;
ALTER TABLE public.tsh_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage tsh_alerts" ON public.tsh_alerts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.tsh_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_url text NOT NULL DEFAULT 'https://glintr.com',
  audit_frequency text NOT NULL DEFAULT 'daily',
  scoring_weights jsonb NOT NULL DEFAULT '{"technical":0.15,"content_quality":0.15,"metadata":0.1,"performance":0.15,"accessibility":0.1,"internal_linking":0.1,"schema":0.1,"mobile":0.05,"ai_readiness":0.1}'::jsonb,
  severity_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  ignored_urls text[] NOT NULL DEFAULT '{}',
  ignored_file_types text[] NOT NULL DEFAULT '{}',
  report_schedule jsonb NOT NULL DEFAULT '{"daily":true,"weekly":true,"monthly":true}'::jsonb,
  notification_prefs jsonb NOT NULL DEFAULT '{"critical_alerts":true,"weekly_digest":true}'::jsonb,
  psi_enabled boolean NOT NULL DEFAULT false,
  max_pages_per_run int NOT NULL DEFAULT 500,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT, INSERT, UPDATE ON public.tsh_settings TO authenticated;
GRANT ALL ON public.tsh_settings TO service_role;
ALTER TABLE public.tsh_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage tsh_settings" ON public.tsh_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

INSERT INTO public.tsh_settings (id) SELECT gen_random_uuid() WHERE NOT EXISTS (SELECT 1 FROM public.tsh_settings);
