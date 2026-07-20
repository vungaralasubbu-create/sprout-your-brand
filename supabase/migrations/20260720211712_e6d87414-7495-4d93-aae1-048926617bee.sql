CREATE EXTENSION IF NOT EXISTS vector;

DO $$ BEGIN
  CREATE TYPE public.kn_source_kind AS ENUM ('file','website','notion','google_drive','slack','github','confluence','manual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.kn_sync_status AS ENUM ('pending','running','completed','failed','paused');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.kn_category AS ENUM (
    'documents','websites','brand','products','services','sales','marketing','support',
    'competitors','personas','faqs','team','media','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================ Sources ============================
CREATE TABLE IF NOT EXISTS public.kn_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.mc_workspaces(id) ON DELETE CASCADE,
  kind kn_source_kind NOT NULL,
  name text NOT NULL,
  url text,
  status kn_sync_status NOT NULL DEFAULT 'pending',
  auto_sync boolean NOT NULL DEFAULT false,
  sync_frequency text,
  last_synced_at timestamptz,
  next_sync_at timestamptz,
  error_message text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS kn_sources_ws_idx ON public.kn_sources(workspace_id, updated_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kn_sources TO authenticated;
GRANT ALL ON public.kn_sources TO service_role;
ALTER TABLE public.kn_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kn_src member read" ON public.kn_sources FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = kn_sources.workspace_id AND m.user_id = auth.uid()));
CREATE POLICY "kn_src editor write" ON public.kn_sources FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = kn_sources.workspace_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin','editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = kn_sources.workspace_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin','editor')));

-- ============================ Documents ==========================
CREATE TABLE IF NOT EXISTS public.kn_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.mc_workspaces(id) ON DELETE CASCADE,
  source_id uuid REFERENCES public.kn_sources(id) ON DELETE SET NULL,
  category kn_category NOT NULL DEFAULT 'documents',
  title text NOT NULL,
  summary text,
  content text NOT NULL DEFAULT '',
  mime_type text,
  file_url text,
  file_size_bytes bigint,
  external_url text,
  tags text[] NOT NULL DEFAULT '{}',
  is_pinned boolean NOT NULL DEFAULT false,
  language text NOT NULL DEFAULT 'en',
  version int NOT NULL DEFAULT 1,
  content_tsv tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary,'')), 'B') ||
    setweight(to_tsvector('english', coalesce(content,'')), 'C')
  ) STORED,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS kn_docs_ws_idx ON public.kn_documents(workspace_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS kn_docs_cat_idx ON public.kn_documents(workspace_id, category);
CREATE INDEX IF NOT EXISTS kn_docs_tsv_idx ON public.kn_documents USING gin(content_tsv);
CREATE INDEX IF NOT EXISTS kn_docs_tags_idx ON public.kn_documents USING gin(tags);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kn_documents TO authenticated;
GRANT ALL ON public.kn_documents TO service_role;
ALTER TABLE public.kn_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kn_docs member read" ON public.kn_documents FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = kn_documents.workspace_id AND m.user_id = auth.uid()));
CREATE POLICY "kn_docs editor write" ON public.kn_documents FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = kn_documents.workspace_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin','editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = kn_documents.workspace_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin','editor')));

-- ============================ Chunks + Embeddings ==========================
CREATE TABLE IF NOT EXISTS public.kn_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.mc_workspaces(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.kn_documents(id) ON DELETE CASCADE,
  chunk_index int NOT NULL,
  content text NOT NULL,
  token_count int,
  embedding vector(1536),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_id, chunk_index)
);
CREATE INDEX IF NOT EXISTS kn_chunks_doc_idx ON public.kn_chunks(document_id);
CREATE INDEX IF NOT EXISTS kn_chunks_ws_idx ON public.kn_chunks(workspace_id);
-- Embedding HNSW index (1536-dim fits directly)
CREATE INDEX IF NOT EXISTS kn_chunks_embedding_idx ON public.kn_chunks
  USING hnsw (embedding vector_cosine_ops);
GRANT SELECT, INSERT, DELETE ON public.kn_chunks TO authenticated;
GRANT ALL ON public.kn_chunks TO service_role;
ALTER TABLE public.kn_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kn_chunks member read" ON public.kn_chunks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = kn_chunks.workspace_id AND m.user_id = auth.uid()));

-- ============================ Products ==========================
CREATE TABLE IF NOT EXISTS public.kn_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.mc_workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price text,
  benefits text[] NOT NULL DEFAULT '{}',
  target_audience text,
  features text[] NOT NULL DEFAULT '{}',
  competitors text[] NOT NULL DEFAULT '{}',
  images text[] NOT NULL DEFAULT '{}',
  landing_pages text[] NOT NULL DEFAULT '{}',
  case_studies text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS kn_products_ws_idx ON public.kn_products(workspace_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kn_products TO authenticated;
GRANT ALL ON public.kn_products TO service_role;
ALTER TABLE public.kn_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kn_prod member read" ON public.kn_products FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = kn_products.workspace_id AND m.user_id = auth.uid()));
CREATE POLICY "kn_prod editor write" ON public.kn_products FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = kn_products.workspace_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin','editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = kn_products.workspace_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin','editor')));

-- ============================ Services ==========================
CREATE TABLE IF NOT EXISTS public.kn_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.mc_workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  pricing text,
  workflow text,
  deliverables text[] NOT NULL DEFAULT '{}',
  timeline text,
  faqs jsonb NOT NULL DEFAULT '[]'::jsonb,
  documents text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS kn_services_ws_idx ON public.kn_services(workspace_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kn_services TO authenticated;
GRANT ALL ON public.kn_services TO service_role;
ALTER TABLE public.kn_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kn_svc member read" ON public.kn_services FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = kn_services.workspace_id AND m.user_id = auth.uid()));
CREATE POLICY "kn_svc editor write" ON public.kn_services FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = kn_services.workspace_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin','editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = kn_services.workspace_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin','editor')));

-- ============================ Personas / Competitors / Brand ==========================
CREATE TABLE IF NOT EXISTS public.kn_personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.mc_workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  age_range text,
  industry text,
  goals text[] NOT NULL DEFAULT '{}',
  pain_points text[] NOT NULL DEFAULT '{}',
  objections text[] NOT NULL DEFAULT '{}',
  buying_journey text,
  channels text[] NOT NULL DEFAULT '{}',
  messaging text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kn_personas TO authenticated;
GRANT ALL ON public.kn_personas TO service_role;
ALTER TABLE public.kn_personas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kn_pers member read" ON public.kn_personas FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = kn_personas.workspace_id AND m.user_id = auth.uid()));
CREATE POLICY "kn_pers editor write" ON public.kn_personas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = kn_personas.workspace_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin','editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = kn_personas.workspace_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin','editor')));

CREATE TABLE IF NOT EXISTS public.kn_competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.mc_workspaces(id) ON DELETE CASCADE,
  company text NOT NULL,
  website text,
  strengths text[] NOT NULL DEFAULT '{}',
  weaknesses text[] NOT NULL DEFAULT '{}',
  pricing text,
  positioning text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kn_competitors TO authenticated;
GRANT ALL ON public.kn_competitors TO service_role;
ALTER TABLE public.kn_competitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kn_comp member read" ON public.kn_competitors FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = kn_competitors.workspace_id AND m.user_id = auth.uid()));
CREATE POLICY "kn_comp editor write" ON public.kn_competitors FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = kn_competitors.workspace_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin','editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = kn_competitors.workspace_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin','editor')));

-- One brand profile per workspace
CREATE TABLE IF NOT EXISTS public.kn_brand (
  workspace_id uuid PRIMARY KEY REFERENCES public.mc_workspaces(id) ON DELETE CASCADE,
  mission text,
  vision text,
  values text[] NOT NULL DEFAULT '{}',
  brand_voice text,
  tone text,
  writing_rules text,
  colors text[] NOT NULL DEFAULT '{}',
  fonts text[] NOT NULL DEFAULT '{}',
  logo_url text,
  style_guide text,
  forbidden_words text[] NOT NULL DEFAULT '{}',
  approved_terminology text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.kn_brand TO authenticated;
GRANT ALL ON public.kn_brand TO service_role;
ALTER TABLE public.kn_brand ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kn_brand member read" ON public.kn_brand FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = kn_brand.workspace_id AND m.user_id = auth.uid()));
CREATE POLICY "kn_brand editor write" ON public.kn_brand FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = kn_brand.workspace_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin','editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = kn_brand.workspace_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin','editor')));

-- ============================ Sales playbook & FAQs ==========================
CREATE TABLE IF NOT EXISTS public.kn_sales_playbook (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.mc_workspaces(id) ON DELETE CASCADE,
  kind text NOT NULL,  -- 'sales_script'|'call_script'|'objection'|'pricing_rule'|'discount'|'negotiation'|'closing'
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS kn_sales_ws_idx ON public.kn_sales_playbook(workspace_id, kind);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kn_sales_playbook TO authenticated;
GRANT ALL ON public.kn_sales_playbook TO service_role;
ALTER TABLE public.kn_sales_playbook ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kn_sales member read" ON public.kn_sales_playbook FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = kn_sales_playbook.workspace_id AND m.user_id = auth.uid()));
CREATE POLICY "kn_sales editor write" ON public.kn_sales_playbook FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = kn_sales_playbook.workspace_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin','editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = kn_sales_playbook.workspace_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin','editor')));

CREATE TABLE IF NOT EXISTS public.kn_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.mc_workspaces(id) ON DELETE CASCADE,
  category text,
  question text NOT NULL,
  answer text NOT NULL,
  is_published boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS kn_faqs_ws_idx ON public.kn_faqs(workspace_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kn_faqs TO authenticated;
GRANT ALL ON public.kn_faqs TO service_role;
ALTER TABLE public.kn_faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kn_faq member read" ON public.kn_faqs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = kn_faqs.workspace_id AND m.user_id = auth.uid()));
CREATE POLICY "kn_faq editor write" ON public.kn_faqs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = kn_faqs.workspace_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin','editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = kn_faqs.workspace_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin','editor')));

-- ============================ Versions + Search logs ==========================
CREATE TABLE IF NOT EXISTS public.kn_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.kn_documents(id) ON DELETE CASCADE,
  version int NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  changelog text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_id, version)
);
GRANT SELECT, INSERT ON public.kn_versions TO authenticated;
GRANT ALL ON public.kn_versions TO service_role;
ALTER TABLE public.kn_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kn_ver member read" ON public.kn_versions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.kn_documents d JOIN public.mc_workspace_members m ON m.workspace_id = d.workspace_id
                 WHERE d.id = kn_versions.document_id AND m.user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.kn_search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.mc_workspaces(id) ON DELETE CASCADE,
  user_id uuid,
  query text NOT NULL,
  results_count int NOT NULL DEFAULT 0,
  duration_ms int,
  answer text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS kn_search_ws_idx ON public.kn_search_logs(workspace_id, created_at DESC);
GRANT SELECT, INSERT ON public.kn_search_logs TO authenticated;
GRANT ALL ON public.kn_search_logs TO service_role;
ALTER TABLE public.kn_search_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kn_search member read" ON public.kn_search_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = kn_search_logs.workspace_id AND m.user_id = auth.uid()));
CREATE POLICY "kn_search insert" ON public.kn_search_logs FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = kn_search_logs.workspace_id AND m.user_id = auth.uid()));

-- ============================ Triggers ==========================
CREATE OR REPLACE FUNCTION public.kn_touch() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS kn_sources_touch ON public.kn_sources;
CREATE TRIGGER kn_sources_touch BEFORE UPDATE ON public.kn_sources FOR EACH ROW EXECUTE FUNCTION public.kn_touch();
DROP TRIGGER IF EXISTS kn_docs_touch ON public.kn_documents;
CREATE TRIGGER kn_docs_touch BEFORE UPDATE ON public.kn_documents FOR EACH ROW EXECUTE FUNCTION public.kn_touch();
DROP TRIGGER IF EXISTS kn_products_touch ON public.kn_products;
CREATE TRIGGER kn_products_touch BEFORE UPDATE ON public.kn_products FOR EACH ROW EXECUTE FUNCTION public.kn_touch();
DROP TRIGGER IF EXISTS kn_services_touch ON public.kn_services;
CREATE TRIGGER kn_services_touch BEFORE UPDATE ON public.kn_services FOR EACH ROW EXECUTE FUNCTION public.kn_touch();
DROP TRIGGER IF EXISTS kn_personas_touch ON public.kn_personas;
CREATE TRIGGER kn_personas_touch BEFORE UPDATE ON public.kn_personas FOR EACH ROW EXECUTE FUNCTION public.kn_touch();
DROP TRIGGER IF EXISTS kn_brand_touch ON public.kn_brand;
CREATE TRIGGER kn_brand_touch BEFORE UPDATE ON public.kn_brand FOR EACH ROW EXECUTE FUNCTION public.kn_touch();
DROP TRIGGER IF EXISTS kn_sales_touch ON public.kn_sales_playbook;
CREATE TRIGGER kn_sales_touch BEFORE UPDATE ON public.kn_sales_playbook FOR EACH ROW EXECUTE FUNCTION public.kn_touch();
DROP TRIGGER IF EXISTS kn_faqs_touch ON public.kn_faqs;
CREATE TRIGGER kn_faqs_touch BEFORE UPDATE ON public.kn_faqs FOR EACH ROW EXECUTE FUNCTION public.kn_touch();

-- Save version on document update
CREATE OR REPLACE FUNCTION public.kn_docs_snapshot() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.content IS DISTINCT FROM OLD.content OR NEW.title IS DISTINCT FROM OLD.title THEN
    INSERT INTO public.kn_versions(document_id,version,title,content,created_by)
    VALUES (OLD.id, OLD.version, OLD.title, OLD.content, NEW.created_by);
    NEW.version = OLD.version + 1;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS kn_docs_versioning ON public.kn_documents;
CREATE TRIGGER kn_docs_versioning BEFORE UPDATE ON public.kn_documents
  FOR EACH ROW EXECUTE FUNCTION public.kn_docs_snapshot();