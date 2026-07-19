
-- ============================================================
-- Internal Linking Intelligence Engine (additive schema)
-- ============================================================

-- Graph nodes: every linkable content unit
CREATE TABLE IF NOT EXISTS public.link_graph_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_id text NOT NULL,
  url text NOT NULL,
  title text,
  summary text,
  topic_cluster text,
  keywords text[] DEFAULT '{}',
  authority real NOT NULL DEFAULT 0,
  pagerank real NOT NULL DEFAULT 0,
  depth int NOT NULL DEFAULT 0,
  inbound_count int NOT NULL DEFAULT 0,
  outbound_count int NOT NULL DEFAULT 0,
  is_orphan boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  last_crawled_at timestamptz,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(content_type, content_id)
);
CREATE INDEX IF NOT EXISTS idx_lgn_type ON public.link_graph_nodes(content_type);
CREATE INDEX IF NOT EXISTS idx_lgn_cluster ON public.link_graph_nodes(topic_cluster);
CREATE INDEX IF NOT EXISTS idx_lgn_authority ON public.link_graph_nodes(authority DESC);
CREATE INDEX IF NOT EXISTS idx_lgn_orphan ON public.link_graph_nodes(is_orphan) WHERE is_orphan;

GRANT SELECT ON public.link_graph_nodes TO authenticated;
GRANT ALL ON public.link_graph_nodes TO service_role;
ALTER TABLE public.link_graph_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage link_graph_nodes" ON public.link_graph_nodes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- Graph edges: authority-weighted link relationships (separate from existing internal_links)
CREATE TABLE IF NOT EXISTS public.link_graph_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_node_id uuid NOT NULL REFERENCES public.link_graph_nodes(id) ON DELETE CASCADE,
  to_node_id uuid NOT NULL REFERENCES public.link_graph_nodes(id) ON DELETE CASCADE,
  link_type text NOT NULL DEFAULT 'related',
  anchor_text text,
  anchor_style text,
  weight real NOT NULL DEFAULT 1.0,
  similarity real,
  discovered_by text NOT NULL DEFAULT 'auto',
  status text NOT NULL DEFAULT 'active',
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(from_node_id, to_node_id, link_type)
);
CREATE INDEX IF NOT EXISTS idx_lge_from ON public.link_graph_edges(from_node_id);
CREATE INDEX IF NOT EXISTS idx_lge_to ON public.link_graph_edges(to_node_id);
CREATE INDEX IF NOT EXISTS idx_lge_type ON public.link_graph_edges(link_type);

GRANT SELECT ON public.link_graph_edges TO authenticated;
GRANT ALL ON public.link_graph_edges TO service_role;
ALTER TABLE public.link_graph_edges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage link_graph_edges" ON public.link_graph_edges
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- AI-generated recommendations awaiting editor approval
CREATE TABLE IF NOT EXISTS public.link_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_node_id uuid REFERENCES public.link_graph_nodes(id) ON DELETE CASCADE,
  to_node_id uuid REFERENCES public.link_graph_nodes(id) ON DELETE CASCADE,
  from_content_type text,
  from_content_id text,
  to_content_type text,
  to_content_id text,
  link_type text NOT NULL DEFAULT 'related',
  anchor_text text NOT NULL,
  anchor_style text NOT NULL DEFAULT 'partial',
  context_snippet text,
  placement_hint text,
  relevance_score real NOT NULL DEFAULT 0,
  intent_match real,
  reasoning text,
  ai_model text,
  ai_prompt_version text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  rejection_reason text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ls_status ON public.link_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_ls_from ON public.link_suggestions(from_node_id);
CREATE INDEX IF NOT EXISTS idx_ls_score ON public.link_suggestions(relevance_score DESC);

GRANT SELECT, INSERT, UPDATE ON public.link_suggestions TO authenticated;
GRANT ALL ON public.link_suggestions TO service_role;
ALTER TABLE public.link_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage link_suggestions" ON public.link_suggestions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- Anchor text usage history for diversity tracking
CREATE TABLE IF NOT EXISTS public.link_anchor_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_node_id uuid REFERENCES public.link_graph_nodes(id) ON DELETE CASCADE,
  to_content_type text,
  to_content_id text,
  anchor_text text NOT NULL,
  anchor_style text,
  usage_count int NOT NULL DEFAULT 1,
  last_used_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lah_target ON public.link_anchor_history(to_node_id);
CREATE INDEX IF NOT EXISTS idx_lah_anchor ON public.link_anchor_history(anchor_text);

GRANT SELECT, INSERT, UPDATE ON public.link_anchor_history TO authenticated;
GRANT ALL ON public.link_anchor_history TO service_role;
ALTER TABLE public.link_anchor_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage link_anchor_history" ON public.link_anchor_history
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- Health issues: broken/redirect/orphan/soft-404
CREATE TABLE IF NOT EXISTS public.link_health_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id uuid REFERENCES public.link_graph_nodes(id) ON DELETE CASCADE,
  edge_id uuid REFERENCES public.link_graph_edges(id) ON DELETE CASCADE,
  url text,
  issue_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  status_code int,
  redirect_chain text[],
  detected_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  recommendation text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_lhi_type ON public.link_health_issues(issue_type);
CREATE INDEX IF NOT EXISTS idx_lhi_unresolved ON public.link_health_issues(resolved_at) WHERE resolved_at IS NULL;

GRANT SELECT, INSERT, UPDATE ON public.link_health_issues TO authenticated;
GRANT ALL ON public.link_health_issues TO service_role;
ALTER TABLE public.link_health_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage link_health_issues" ON public.link_health_issues
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- Internal link click tracking
CREATE TABLE IF NOT EXISTS public.link_clicks (
  id bigserial PRIMARY KEY,
  from_node_id uuid REFERENCES public.link_graph_nodes(id) ON DELETE CASCADE,
  to_node_id uuid REFERENCES public.link_graph_nodes(id) ON DELETE CASCADE,
  anchor_text text,
  session_id text,
  user_id uuid,
  clicked_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lc_from ON public.link_clicks(from_node_id, clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_lc_to ON public.link_clicks(to_node_id, clicked_at DESC);

GRANT SELECT, INSERT ON public.link_clicks TO authenticated;
GRANT INSERT ON public.link_clicks TO anon;
GRANT ALL ON public.link_clicks TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.link_clicks_id_seq TO authenticated, anon, service_role;
ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can insert clicks" ON public.link_clicks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins read link_clicks" ON public.link_clicks FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- Per-page Link Quality Score snapshots
CREATE TABLE IF NOT EXISTS public.link_page_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id uuid NOT NULL REFERENCES public.link_graph_nodes(id) ON DELETE CASCADE,
  score real NOT NULL DEFAULT 0,
  inbound_score real DEFAULT 0,
  outbound_score real DEFAULT 0,
  anchor_diversity real DEFAULT 0,
  topical_relevance real DEFAULT 0,
  cluster_participation real DEFAULT 0,
  authority_flow real DEFAULT 0,
  orphan_penalty real DEFAULT 0,
  ctr real DEFAULT 0,
  breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  computed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(node_id)
);
CREATE INDEX IF NOT EXISTS idx_lps_score ON public.link_page_scores(score DESC);

GRANT SELECT ON public.link_page_scores TO authenticated;
GRANT ALL ON public.link_page_scores TO service_role;
ALTER TABLE public.link_page_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read link_page_scores" ON public.link_page_scores FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "service manages link_page_scores" ON public.link_page_scores FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- Engine settings (singleton row)
CREATE TABLE IF NOT EXISTS public.link_intelligence_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  max_links_per_page int NOT NULL DEFAULT 30,
  min_links_per_page int NOT NULL DEFAULT 5,
  anchor_diversity_min real NOT NULL DEFAULT 0.6,
  suggestion_threshold real NOT NULL DEFAULT 0.55,
  auto_approve_threshold real NOT NULL DEFAULT 0.9,
  require_approval boolean NOT NULL DEFAULT true,
  excluded_types text[] NOT NULL DEFAULT '{}',
  excluded_urls text[] NOT NULL DEFAULT '{}',
  scoring_weights jsonb NOT NULL DEFAULT '{"inbound":0.25,"outbound":0.15,"anchor_diversity":0.15,"topical":0.2,"cluster":0.1,"authority":0.1,"ctr":0.05}'::jsonb,
  ai_prompt_version text NOT NULL DEFAULT 'v1',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT, INSERT, UPDATE ON public.link_intelligence_settings TO authenticated;
GRANT ALL ON public.link_intelligence_settings TO service_role;
ALTER TABLE public.link_intelligence_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage link_settings" ON public.link_intelligence_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

INSERT INTO public.link_intelligence_settings (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;
