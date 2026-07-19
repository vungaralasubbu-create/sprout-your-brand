
-- Brand Kits
CREATE TABLE public.cs_brand_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  accent_color TEXT,
  heading_font TEXT,
  body_font TEXT,
  button_style TEXT,
  border_radius TEXT,
  illustration_style TEXT,
  icon_style TEXT,
  tone_of_voice TEXT,
  cta_style TEXT,
  watermark_url TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Templates (reusable presets)
CREATE TABLE public.cs_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  format TEXT NOT NULL, -- instagram_post, linkedin_banner, etc
  style TEXT,           -- minimal, modern, luxury, etc
  layout JSONB NOT NULL DEFAULT '{}'::jsonb,
  thumbnail_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  usage_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Folders
CREATE TABLE public.cs_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.cs_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Designs
CREATE TABLE public.cs_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.cs_folders(id) ON DELETE SET NULL,
  brand_kit_id UUID REFERENCES public.cs_brand_kits(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.cs_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  prompt TEXT,
  format TEXT NOT NULL,       -- e.g. instagram_post
  style TEXT,                 -- minimal, modern, etc
  status TEXT NOT NULL DEFAULT 'draft', -- draft, generating, ready, approved, archived
  layout JSONB NOT NULL DEFAULT '{}'::jsonb,   -- structured design spec (canvas + elements)
  copy JSONB NOT NULL DEFAULT '{}'::jsonb,     -- headline, subheadline, body, cta, hashtags...
  palette JSONB NOT NULL DEFAULT '{}'::jsonb,
  typography JSONB NOT NULL DEFAULT '{}'::jsonb,
  preview_url TEXT,
  export_urls JSONB NOT NULL DEFAULT '{}'::jsonb, -- {png:..., jpeg:..., pdf:...}
  locked_elements JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Design versions (history + undo/redo persistence)
CREATE TABLE public.cs_design_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id UUID NOT NULL REFERENCES public.cs_designs(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  layout JSONB NOT NULL DEFAULT '{}'::jsonb,
  copy JSONB NOT NULL DEFAULT '{}'::jsonb,
  palette JSONB NOT NULL DEFAULT '{}'::jsonb,
  typography JSONB NOT NULL DEFAULT '{}'::jsonb,
  preview_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (design_id, version)
);

-- Asset library
CREATE TABLE public.cs_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_kit_id UUID REFERENCES public.cs_brand_kits(id) ON DELETE SET NULL,
  kind TEXT NOT NULL, -- image, logo, icon, illustration, photo, video, background, font, animation, template
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  width INTEGER,
  height INTEGER,
  source TEXT NOT NULL DEFAULT 'upload', -- upload, ai_generated, stock
  ai_prompt TEXT,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comments / approvals
CREATE TABLE public.cs_design_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id UUID NOT NULL REFERENCES public.cs_designs(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  status TEXT, -- optional: approved, changes_requested, resolved
  anchor JSONB, -- optional element pointer
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Analytics events
CREATE TABLE public.cs_design_analytics (
  id BIGSERIAL PRIMARY KEY,
  design_id UUID NOT NULL REFERENCES public.cs_designs(id) ON DELETE CASCADE,
  event TEXT NOT NULL, -- view, export, share, edit, duplicate, ai_regenerate
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX cs_designs_owner_idx ON public.cs_designs(owner_id, updated_at DESC);
CREATE INDEX cs_designs_folder_idx ON public.cs_designs(folder_id);
CREATE INDEX cs_designs_status_idx ON public.cs_designs(status);
CREATE INDEX cs_design_versions_design_idx ON public.cs_design_versions(design_id, version DESC);
CREATE INDEX cs_assets_owner_idx ON public.cs_assets(owner_id, kind, created_at DESC);
CREATE INDEX cs_assets_brand_idx ON public.cs_assets(brand_kit_id);
CREATE INDEX cs_brand_kits_owner_idx ON public.cs_brand_kits(owner_id);
CREATE INDEX cs_templates_cat_idx ON public.cs_templates(category, format);
CREATE INDEX cs_design_comments_design_idx ON public.cs_design_comments(design_id, created_at DESC);
CREATE INDEX cs_design_analytics_design_idx ON public.cs_design_analytics(design_id, created_at DESC);
CREATE INDEX cs_folders_owner_idx ON public.cs_folders(owner_id, parent_id);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cs_brand_kits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cs_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cs_folders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cs_designs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cs_design_versions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cs_assets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cs_design_comments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cs_design_analytics TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE cs_design_analytics_id_seq TO authenticated;
GRANT ALL ON public.cs_brand_kits, public.cs_templates, public.cs_folders, public.cs_designs, public.cs_design_versions, public.cs_assets, public.cs_design_comments, public.cs_design_analytics TO service_role;
GRANT ALL ON SEQUENCE cs_design_analytics_id_seq TO service_role;

ALTER TABLE public.cs_brand_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cs_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cs_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cs_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cs_design_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cs_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cs_design_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cs_design_analytics ENABLE ROW LEVEL SECURITY;

-- Policies: owners manage own; admins full
CREATE POLICY "cs_brand_kits owner" ON public.cs_brand_kits FOR ALL USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')) WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "cs_templates read" ON public.cs_templates FOR SELECT USING (is_public OR auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "cs_templates write" ON public.cs_templates FOR INSERT WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "cs_templates update" ON public.cs_templates FOR UPDATE USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')) WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "cs_templates delete" ON public.cs_templates FOR DELETE USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "cs_folders owner" ON public.cs_folders FOR ALL USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')) WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "cs_designs owner" ON public.cs_designs FOR ALL USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')) WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "cs_design_versions read" ON public.cs_design_versions FOR SELECT USING (EXISTS (SELECT 1 FROM public.cs_designs d WHERE d.id = design_id AND (d.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))));
CREATE POLICY "cs_design_versions insert" ON public.cs_design_versions FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.cs_designs d WHERE d.id = design_id AND (d.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))));

CREATE POLICY "cs_assets owner" ON public.cs_assets FOR ALL USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')) WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "cs_design_comments read" ON public.cs_design_comments FOR SELECT USING (EXISTS (SELECT 1 FROM public.cs_designs d WHERE d.id = design_id AND (d.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))));
CREATE POLICY "cs_design_comments write" ON public.cs_design_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "cs_design_comments update" ON public.cs_design_comments FOR UPDATE USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "cs_design_comments delete" ON public.cs_design_comments FOR DELETE USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "cs_design_analytics read" ON public.cs_design_analytics FOR SELECT USING (EXISTS (SELECT 1 FROM public.cs_designs d WHERE d.id = design_id AND (d.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))));
CREATE POLICY "cs_design_analytics insert" ON public.cs_design_analytics FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Timestamp triggers
CREATE TRIGGER cs_brand_kits_updated_at BEFORE UPDATE ON public.cs_brand_kits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER cs_templates_updated_at BEFORE UPDATE ON public.cs_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER cs_designs_updated_at BEFORE UPDATE ON public.cs_designs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
