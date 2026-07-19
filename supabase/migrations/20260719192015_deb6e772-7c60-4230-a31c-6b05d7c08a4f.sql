
-- ============ Prompt Registry ============
CREATE TABLE public.ce_prompt_registry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  active_version_id UUID,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ce_prompt_registry TO authenticated;
GRANT ALL ON public.ce_prompt_registry TO service_role;
ALTER TABLE public.ce_prompt_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prompt registry readable to authed" ON public.ce_prompt_registry
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "prompt registry writable to admins" ON public.ce_prompt_registry
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TABLE public.ce_prompt_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registry_id UUID NOT NULL REFERENCES public.ce_prompt_registry(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  template TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  model_preference JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (registry_id, version)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ce_prompt_versions TO authenticated;
GRANT ALL ON public.ce_prompt_versions TO service_role;
ALTER TABLE public.ce_prompt_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prompt versions readable" ON public.ce_prompt_versions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "prompt versions writable to admins" ON public.ce_prompt_versions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

ALTER TABLE public.ce_prompt_registry
  ADD CONSTRAINT ce_prompt_registry_active_version_fkey
  FOREIGN KEY (active_version_id) REFERENCES public.ce_prompt_versions(id) ON DELETE SET NULL;

-- ============ Campaigns ============
CREATE TABLE public.ce_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.mkt_brands(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  goal TEXT,
  audience TEXT,
  platforms TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  language TEXT NOT NULL DEFAULT 'en',
  tone TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ce_campaigns_owner_idx ON public.ce_campaigns(owner_id);
CREATE INDEX ce_campaigns_status_idx ON public.ce_campaigns(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ce_campaigns TO authenticated;
GRANT ALL ON public.ce_campaigns TO service_role;
ALTER TABLE public.ce_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own campaigns" ON public.ce_campaigns
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- ============ Generations ============
CREATE TABLE public.ce_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.ce_campaigns(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  prompt_version_id UUID REFERENCES public.ce_prompt_versions(id) ON DELETE SET NULL,
  model_used TEXT,
  provider TEXT,
  parent_generation_id UUID REFERENCES public.ce_generations(id) ON DELETE SET NULL,
  edited BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  usage JSONB NOT NULL DEFAULT '{}'::jsonb,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ce_generations_campaign_idx ON public.ce_generations(campaign_id);
CREATE INDEX ce_generations_owner_idx ON public.ce_generations(owner_id);
CREATE INDEX ce_generations_asset_idx ON public.ce_generations(asset_type);
CREATE INDEX ce_generations_status_idx ON public.ce_generations(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ce_generations TO authenticated;
GRANT ALL ON public.ce_generations TO service_role;
ALTER TABLE public.ce_generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own generations" ON public.ce_generations
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- ============ Templates ============
CREATE TABLE public.ce_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ce_templates_owner_idx ON public.ce_templates(owner_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ce_templates TO authenticated;
GRANT ALL ON public.ce_templates TO service_role;
ALTER TABLE public.ce_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates readable" ON public.ce_templates
  FOR SELECT TO authenticated
  USING (is_public = true OR auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "templates writable by owner" ON public.ce_templates
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- ============ Triggers ============
CREATE TRIGGER ce_prompt_registry_updated_at BEFORE UPDATE ON public.ce_prompt_registry
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ce_campaigns_updated_at BEFORE UPDATE ON public.ce_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ce_generations_updated_at BEFORE UPDATE ON public.ce_generations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ce_templates_updated_at BEFORE UPDATE ON public.ce_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
