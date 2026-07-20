-- SEO Hub extension — clusters, pages, reports, audits, integrations
CREATE TABLE public.seo_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  category text,
  pillar_title text,
  pillar_url text,
  target_keyword text,
  supporting_keywords text[] DEFAULT '{}',
  intent text,
  status text NOT NULL DEFAULT 'draft',
  description text,
  color text,
  visualization jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_clusters TO authenticated;
GRANT ALL ON public.seo_clusters TO service_role;
ALTER TABLE public.seo_clusters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access seo_clusters" ON public.seo_clusters FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE INDEX idx_seo_clusters_owner ON public.seo_clusters (owner_id, updated_at DESC);
CREATE INDEX idx_seo_clusters_category ON public.seo_clusters (category);

CREATE TABLE public.seo_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  url text NOT NULL,
  page_type text,
  title text,
  meta_title text,
  meta_description text,
  slug text,
  canonical text,
  schema_type text,
  og_tags jsonb DEFAULT '{}'::jsonb,
  twitter_tags jsonb DEFAULT '{}'::jsonb,
  target_keyword text,
  supporting_keywords text[] DEFAULT '{}',
  cluster_id uuid REFERENCES public.seo_clusters(id) ON DELETE SET NULL,
  heading_score integer,
  readability_score integer,
  alt_coverage integer,
  internal_links integer,
  external_links integer,
  word_count integer,
  seo_score integer,
  content_score integer,
  last_audited_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX seo_pages_owner_url_uk ON public.seo_pages (owner_id, url);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_pages TO authenticated;
GRANT ALL ON public.seo_pages TO service_role;
ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access seo_pages" ON public.seo_pages FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE INDEX idx_seo_pages_cluster ON public.seo_pages (cluster_id);

CREATE TABLE public.seo_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  report_type text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  status text NOT NULL DEFAULT 'ready',
  metrics jsonb DEFAULT '{}'::jsonb,
  highlights jsonb DEFAULT '[]'::jsonb,
  recommendations jsonb DEFAULT '[]'::jsonb,
  generated_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_reports TO authenticated;
GRANT ALL ON public.seo_reports TO service_role;
ALTER TABLE public.seo_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access seo_reports" ON public.seo_reports FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE INDEX idx_seo_reports_owner ON public.seo_reports (owner_id, report_type, period_end DESC);

CREATE TABLE public.seo_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type text NOT NULL DEFAULT 'site',
  target_ref text,
  status text NOT NULL DEFAULT 'running',
  score integer,
  issues jsonb DEFAULT '[]'::jsonb,
  summary jsonb DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_audits TO authenticated;
GRANT ALL ON public.seo_audits TO service_role;
ALTER TABLE public.seo_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access seo_audits" ON public.seo_audits FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE INDEX idx_seo_audits_owner ON public.seo_audits (owner_id, started_at DESC);

CREATE TABLE public.seo_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  provider text NOT NULL,
  status text NOT NULL DEFAULT 'not_connected',
  config jsonb DEFAULT '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX seo_integrations_owner_provider_uk ON public.seo_integrations (owner_id, provider);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_integrations TO authenticated;
GRANT ALL ON public.seo_integrations TO service_role;
ALTER TABLE public.seo_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access seo_integrations" ON public.seo_integrations FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Reuse existing update_updated_at_column() trigger fn
CREATE TRIGGER trg_seo_clusters_updated BEFORE UPDATE ON public.seo_clusters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_seo_pages_updated BEFORE UPDATE ON public.seo_pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_seo_reports_updated BEFORE UPDATE ON public.seo_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_seo_audits_updated BEFORE UPDATE ON public.seo_audits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_seo_integrations_updated BEFORE UPDATE ON public.seo_integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();