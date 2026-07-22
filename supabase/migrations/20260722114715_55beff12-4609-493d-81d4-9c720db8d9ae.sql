
-- Citations library
CREATE TABLE public.content_citations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url text NOT NULL,
  source_type text NOT NULL DEFAULT 'other' CHECK (source_type IN ('gov','research','university','docs','vendor','industry','news','other')),
  title text,
  publisher text,
  published_at date,
  accessed_at date NOT NULL DEFAULT (now()::date),
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX content_citations_url_idx ON public.content_citations (source_url);
CREATE INDEX content_citations_type_idx ON public.content_citations (source_type);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_citations TO authenticated;
GRANT ALL ON public.content_citations TO service_role;
ALTER TABLE public.content_citations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage citations" ON public.content_citations FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Detected claims
CREATE TABLE public.content_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('blog','course','landing','program','resource','career','kb')),
  content_id uuid NOT NULL,
  claim_text text NOT NULL,
  claim_type text NOT NULL DEFAULT 'general' CHECK (claim_type IN ('stat','percentage','salary','job_growth','tech_trend','market','general')),
  offset_start integer,
  offset_end integer,
  status text NOT NULL DEFAULT 'needs_citation' CHECK (status IN ('verified','needs_citation','unverified','dismissed')),
  citation_id uuid REFERENCES public.content_citations(id) ON DELETE SET NULL,
  detected_at timestamptz NOT NULL DEFAULT now(),
  detected_by text NOT NULL DEFAULT 'analyzer' CHECK (detected_by IN ('analyzer','ai','user')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX content_claims_content_idx ON public.content_claims (content_type, content_id);
CREATE INDEX content_claims_status_idx ON public.content_claims (status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_claims TO authenticated;
GRANT ALL ON public.content_claims TO service_role;
ALTER TABLE public.content_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage claims" ON public.content_claims FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Authority scores
CREATE TABLE public.content_authority_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('blog','course','landing','program','resource','career','kb')),
  content_id uuid NOT NULL,
  overall_score integer NOT NULL DEFAULT 0,
  experience_score integer NOT NULL DEFAULT 0,
  expertise_score integer NOT NULL DEFAULT 0,
  authoritativeness_score integer NOT NULL DEFAULT 0,
  trust_score integer NOT NULL DEFAULT 0,
  freshness_score integer NOT NULL DEFAULT 0,
  originality_score integer NOT NULL DEFAULT 0,
  signals jsonb NOT NULL DEFAULT '{}'::jsonb,
  workflow_status text NOT NULL DEFAULT 'draft' CHECK (workflow_status IN ('draft','ai_generated','under_review','fact_checked','seo_approved','legal_approved','published','archived')),
  computed_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (content_type, content_id)
);
CREATE INDEX content_authority_overall_idx ON public.content_authority_scores (overall_score);
CREATE INDEX content_authority_freshness_idx ON public.content_authority_scores (freshness_score);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_authority_scores TO authenticated;
GRANT ALL ON public.content_authority_scores TO service_role;
ALTER TABLE public.content_authority_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage authority scores" ON public.content_authority_scores FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Review workflow audit log
CREATE TABLE public.content_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('blog','course','landing','program','resource','career','kb')),
  content_id uuid NOT NULL,
  from_status text,
  to_status text NOT NULL CHECK (to_status IN ('draft','ai_generated','under_review','fact_checked','seo_approved','legal_approved','published','archived')),
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_name text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX content_reviews_content_idx ON public.content_reviews (content_type, content_id, created_at DESC);
GRANT SELECT, INSERT ON public.content_reviews TO authenticated;
GRANT ALL ON public.content_reviews TO service_role;
ALTER TABLE public.content_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins view reviews" ON public.content_reviews FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "admins insert reviews" ON public.content_reviews FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- updated_at triggers (reuse existing helper if present, else create local one)
DO $$ BEGIN
  CREATE OR REPLACE FUNCTION public.set_authority_updated_at() RETURNS trigger LANGUAGE plpgsql AS $f$
  BEGIN NEW.updated_at = now(); RETURN NEW; END;
  $f$;
END $$;

CREATE TRIGGER trg_citations_updated BEFORE UPDATE ON public.content_citations
  FOR EACH ROW EXECUTE FUNCTION public.set_authority_updated_at();
CREATE TRIGGER trg_claims_updated BEFORE UPDATE ON public.content_claims
  FOR EACH ROW EXECUTE FUNCTION public.set_authority_updated_at();
CREATE TRIGGER trg_authority_scores_updated BEFORE UPDATE ON public.content_authority_scores
  FOR EACH ROW EXECUTE FUNCTION public.set_authority_updated_at();
