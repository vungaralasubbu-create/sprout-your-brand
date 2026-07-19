
-- Enterprise GEO Platform (additive schema)

CREATE TABLE IF NOT EXISTS public.geo_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  entity_type text NOT NULL,
  aliases text[] NOT NULL DEFAULT '{}',
  description text,
  wikipedia_url text,
  wikidata_id text,
  authority real NOT NULL DEFAULT 0,
  mention_count int NOT NULL DEFAULT 0,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(entity_type, slug)
);
CREATE INDEX IF NOT EXISTS idx_geo_entities_type ON public.geo_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_geo_entities_name ON public.geo_entities(lower(name));
GRANT SELECT ON public.geo_entities TO authenticated, anon;
GRANT ALL ON public.geo_entities TO service_role;
ALTER TABLE public.geo_entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read geo_entities" ON public.geo_entities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins manage geo_entities" ON public.geo_entities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- Entity mentions per content unit
CREATE TABLE IF NOT EXISTS public.geo_entity_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES public.geo_entities(id) ON DELETE CASCADE,
  content_type text NOT NULL,
  content_id text NOT NULL,
  salience real NOT NULL DEFAULT 0,
  confidence real NOT NULL DEFAULT 0.5,
  extracted_by text NOT NULL DEFAULT 'auto',
  snippet text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(entity_id, content_type, content_id)
);
CREATE INDEX IF NOT EXISTS idx_gem_content ON public.geo_entity_mentions(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_gem_entity ON public.geo_entity_mentions(entity_id);
GRANT SELECT ON public.geo_entity_mentions TO authenticated;
GRANT ALL ON public.geo_entity_mentions TO service_role;
ALTER TABLE public.geo_entity_mentions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage geo_entity_mentions" ON public.geo_entity_mentions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- Semantic graph edges between entities/topics/content
CREATE TABLE IF NOT EXISTS public.geo_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_type text NOT NULL,
  from_id text NOT NULL,
  to_type text NOT NULL,
  to_id text NOT NULL,
  relation text NOT NULL,
  weight real NOT NULL DEFAULT 1.0,
  reason text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(from_type, from_id, to_type, to_id, relation)
);
CREATE INDEX IF NOT EXISTS idx_gr_from ON public.geo_relationships(from_type, from_id);
CREATE INDEX IF NOT EXISTS idx_gr_to ON public.geo_relationships(to_type, to_id);
GRANT SELECT ON public.geo_relationships TO authenticated;
GRANT ALL ON public.geo_relationships TO service_role;
ALTER TABLE public.geo_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage geo_relationships" ON public.geo_relationships FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- Per-page AI readiness score
CREATE TABLE IF NOT EXISTS public.geo_page_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_id text NOT NULL,
  url text,
  ai_readiness real NOT NULL DEFAULT 0,
  semantic_coverage real DEFAULT 0,
  entity_coverage real DEFAULT 0,
  question_coverage real DEFAULT 0,
  answer_coverage real DEFAULT 0,
  evidence_coverage real DEFAULT 0,
  citation_readiness real DEFAULT 0,
  freshness real DEFAULT 0,
  authority real DEFAULT 0,
  trust real DEFAULT 0,
  breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  computed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(content_type, content_id)
);
CREATE INDEX IF NOT EXISTS idx_gps_score ON public.geo_page_scores(ai_readiness DESC);
GRANT SELECT ON public.geo_page_scores TO authenticated;
GRANT ALL ON public.geo_page_scores TO service_role;
ALTER TABLE public.geo_page_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read geo_page_scores" ON public.geo_page_scores FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- AI-generated recommendations awaiting editor approval
CREATE TABLE IF NOT EXISTS public.geo_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_id text NOT NULL,
  category text NOT NULL,
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  priority text NOT NULL DEFAULT 'medium',
  impact real NOT NULL DEFAULT 0.5,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  ai_model text,
  ai_prompt_version text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_grc_content ON public.geo_recommendations(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_grc_status ON public.geo_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_grc_category ON public.geo_recommendations(category);
GRANT SELECT, INSERT, UPDATE ON public.geo_recommendations TO authenticated;
GRANT ALL ON public.geo_recommendations TO service_role;
ALTER TABLE public.geo_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage geo_recommendations" ON public.geo_recommendations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- Generated questions & answers per content
CREATE TABLE IF NOT EXISTS public.geo_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_id text NOT NULL,
  question text NOT NULL,
  question_type text NOT NULL DEFAULT 'what',
  intent text,
  short_answer text,
  standard_answer text,
  detailed_answer text,
  citations jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  ai_model text,
  ai_prompt_version text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid,
  reviewed_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_gq_content ON public.geo_questions(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_gq_status ON public.geo_questions(status);
GRANT SELECT, INSERT, UPDATE ON public.geo_questions TO authenticated;
GRANT ALL ON public.geo_questions TO service_role;
ALTER TABLE public.geo_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage geo_questions" ON public.geo_questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- Freshness signals
CREATE TABLE IF NOT EXISTS public.geo_freshness_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_id text NOT NULL,
  signal text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  detected_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  detail text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_gfs_content ON public.geo_freshness_signals(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_gfs_unresolved ON public.geo_freshness_signals(resolved_at) WHERE resolved_at IS NULL;
GRANT SELECT, INSERT, UPDATE ON public.geo_freshness_signals TO authenticated;
GRANT ALL ON public.geo_freshness_signals TO service_role;
ALTER TABLE public.geo_freshness_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage geo_freshness_signals" ON public.geo_freshness_signals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- Schema markup recommendations
CREATE TABLE IF NOT EXISTS public.geo_schema_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_id text NOT NULL,
  schema_type text NOT NULL,
  json_ld jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  ai_model text,
  ai_prompt_version text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid,
  reviewed_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_gss_content ON public.geo_schema_suggestions(content_type, content_id);
GRANT SELECT, INSERT, UPDATE ON public.geo_schema_suggestions TO authenticated;
GRANT ALL ON public.geo_schema_suggestions TO service_role;
ALTER TABLE public.geo_schema_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage geo_schema_suggestions" ON public.geo_schema_suggestions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- Score trend snapshots
CREATE TABLE IF NOT EXISTS public.geo_analytics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day date NOT NULL,
  avg_ai_readiness real DEFAULT 0,
  avg_entity_coverage real DEFAULT 0,
  avg_question_coverage real DEFAULT 0,
  avg_freshness real DEFAULT 0,
  avg_citation_readiness real DEFAULT 0,
  entity_count int DEFAULT 0,
  relationship_count int DEFAULT 0,
  recommendation_pending int DEFAULT 0,
  recommendation_accepted int DEFAULT 0,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(day)
);
GRANT SELECT ON public.geo_analytics_daily TO authenticated;
GRANT ALL ON public.geo_analytics_daily TO service_role;
ALTER TABLE public.geo_analytics_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read geo_analytics_daily" ON public.geo_analytics_daily FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- Settings (singleton)
CREATE TABLE IF NOT EXISTS public.geo_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scoring_weights jsonb NOT NULL DEFAULT '{"semantic":0.15,"entity":0.15,"question":0.15,"answer":0.15,"evidence":0.1,"citation":0.1,"freshness":0.1,"authority":0.05,"trust":0.05}'::jsonb,
  entity_rules jsonb NOT NULL DEFAULT '{"min_confidence":0.4,"max_per_page":50}'::jsonb,
  question_rules jsonb NOT NULL DEFAULT '{"min_per_page":6,"max_per_page":20}'::jsonb,
  quality_thresholds jsonb NOT NULL DEFAULT '{"auto_approve":0.9,"suggest":0.55}'::jsonb,
  schema_recommendations jsonb NOT NULL DEFAULT '{"default":["Article","FAQPage","BreadcrumbList"]}'::jsonb,
  ai_prompt_version text NOT NULL DEFAULT 'v1',
  require_approval boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT, INSERT, UPDATE ON public.geo_settings TO authenticated;
GRANT ALL ON public.geo_settings TO service_role;
ALTER TABLE public.geo_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage geo_settings" ON public.geo_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

INSERT INTO public.geo_settings (id) SELECT gen_random_uuid() WHERE NOT EXISTS (SELECT 1 FROM public.geo_settings);
