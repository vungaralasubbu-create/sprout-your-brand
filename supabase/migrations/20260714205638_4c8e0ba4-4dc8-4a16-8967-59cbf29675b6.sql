
-- Enums
DO $$ BEGIN
  CREATE TYPE public.marketing_resource_type AS ENUM (
    'program_poster','square_social','portrait_social','instagram_story',
    'whatsapp_creative','linkedin_creative','program_banner','campaign_poster',
    'caption_instagram','caption_linkedin','short_copy','whatsapp_message','story_text'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.marketing_resource_status AS ENUM ('draft','scheduled','published','paused','expired','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.marketing_interaction_type AS ENUM (
    'viewed','downloaded','caption_copied','share_message_copied','referral_link_copied',
    'share_started','qr_downloaded','personalised_generated'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.marketing_issue_type AS ENUM (
    'broken_download','incorrect_program_info','outdated_price','incorrect_referral_link','image_quality','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.marketing_issue_status AS ENUM ('submitted','in_review','resolved','wont_fix');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Sequences
CREATE SEQUENCE IF NOT EXISTS public.marketing_resource_code_seq;
CREATE SEQUENCE IF NOT EXISTS public.marketing_issue_code_seq;

-- Permission for admin (optional)
INSERT INTO public.admin_role_permissions (admin_role, permission_key)
SELECT r::public.admin_role_type, 'marketing.manage'
FROM (VALUES ('super_admin'),('brand_manager')) AS t(r)
WHERE EXISTS (SELECT 1 FROM public.admin_role_permissions LIMIT 0) OR true
ON CONFLICT DO NOTHING;

-- MARKETING RESOURCES
CREATE TABLE IF NOT EXISTS public.marketing_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_code text UNIQUE NOT NULL,
  program_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  campaign_id uuid,
  resource_type public.marketing_resource_type NOT NULL,
  resource_category text,
  title text NOT NULL,
  description text,
  media_url text,
  thumbnail_url text,
  caption_content text,
  short_copy text,
  share_message text,
  aspect_ratio text,
  file_format text,
  file_size_bytes bigint,
  personalisation_allowed boolean NOT NULL DEFAULT false,
  personalisation_fields jsonb DEFAULT '[]'::jsonb,
  is_featured boolean NOT NULL DEFAULT false,
  status public.marketing_resource_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  effective_from timestamptz,
  effective_until timestamptz,
  version integer NOT NULL DEFAULT 1,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.marketing_resources TO authenticated;
GRANT ALL ON public.marketing_resources TO service_role;

ALTER TABLE public.marketing_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ambassadors_read_published" ON public.marketing_resources
  FOR SELECT TO authenticated
  USING (
    status = 'published'
    AND (effective_from IS NULL OR effective_from <= now())
    AND (effective_until IS NULL OR effective_until >= now())
    AND EXISTS (
      SELECT 1 FROM public.campus_ambassador_profiles p
      WHERE p.user_id = auth.uid() AND p.status = 'active'
    )
  );

CREATE POLICY "admins_manage_marketing_resources" ON public.marketing_resources
  FOR ALL TO authenticated
  USING (public.has_admin_permission(auth.uid(), 'marketing.manage'))
  WITH CHECK (public.has_admin_permission(auth.uid(), 'marketing.manage'));

CREATE INDEX IF NOT EXISTS idx_marketing_resources_program ON public.marketing_resources(program_id) WHERE status='published';
CREATE INDEX IF NOT EXISTS idx_marketing_resources_status ON public.marketing_resources(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_resources_type ON public.marketing_resources(resource_type);

-- Auto-generate resource_code + update_at
CREATE OR REPLACE FUNCTION public.tg_marketing_resource_defaults()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND (NEW.resource_code IS NULL OR NEW.resource_code = '') THEN
    NEW.resource_code := 'GL-CA-MKT-' || to_char(now(),'YYYY') || '-' ||
      lpad(nextval('public.marketing_resource_code_seq')::text, 6, '0');
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status <> 'published' AND NEW.status = 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at := now();
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_marketing_resource_defaults ON public.marketing_resources;
CREATE TRIGGER trg_marketing_resource_defaults
BEFORE INSERT OR UPDATE ON public.marketing_resources
FOR EACH ROW EXECUTE FUNCTION public.tg_marketing_resource_defaults();

-- SAVED RESOURCES
CREATE TABLE IF NOT EXISTS public.marketing_resource_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id uuid NOT NULL REFERENCES public.campus_ambassador_profiles(id) ON DELETE CASCADE,
  resource_id uuid NOT NULL REFERENCES public.marketing_resources(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ambassador_id, resource_id)
);

GRANT SELECT, INSERT, DELETE ON public.marketing_resource_saves TO authenticated;
GRANT ALL ON public.marketing_resource_saves TO service_role;

ALTER TABLE public.marketing_resource_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "amb_own_saves_read" ON public.marketing_resource_saves
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.campus_ambassador_profiles p
    WHERE p.id = ambassador_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "amb_own_saves_insert" ON public.marketing_resource_saves
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.campus_ambassador_profiles p
    WHERE p.id = ambassador_id AND p.user_id = auth.uid() AND p.status='active'
  ));

CREATE POLICY "amb_own_saves_delete" ON public.marketing_resource_saves
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.campus_ambassador_profiles p
    WHERE p.id = ambassador_id AND p.user_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_marketing_saves_amb ON public.marketing_resource_saves(ambassador_id, created_at DESC);

-- INTERACTIONS
CREATE TABLE IF NOT EXISTS public.marketing_resource_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id uuid NOT NULL REFERENCES public.campus_ambassador_profiles(id) ON DELETE CASCADE,
  resource_id uuid REFERENCES public.marketing_resources(id) ON DELETE SET NULL,
  program_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  campaign_id uuid,
  interaction_type public.marketing_interaction_type NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.marketing_resource_interactions TO authenticated;
GRANT ALL ON public.marketing_resource_interactions TO service_role;

ALTER TABLE public.marketing_resource_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "amb_own_interactions_read" ON public.marketing_resource_interactions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.campus_ambassador_profiles p
    WHERE p.id = ambassador_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "amb_own_interactions_insert" ON public.marketing_resource_interactions
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.campus_ambassador_profiles p
    WHERE p.id = ambassador_id AND p.user_id = auth.uid() AND p.status='active'
  ));

CREATE POLICY "admins_read_all_interactions" ON public.marketing_resource_interactions
  FOR SELECT TO authenticated
  USING (public.has_admin_permission(auth.uid(), 'marketing.manage'));

CREATE INDEX IF NOT EXISTS idx_marketing_int_amb ON public.marketing_resource_interactions(ambassador_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_int_resource ON public.marketing_resource_interactions(resource_id);

-- ISSUES
CREATE TABLE IF NOT EXISTS public.marketing_resource_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_code text UNIQUE NOT NULL,
  ambassador_id uuid NOT NULL REFERENCES public.campus_ambassador_profiles(id) ON DELETE CASCADE,
  resource_id uuid REFERENCES public.marketing_resources(id) ON DELETE SET NULL,
  program_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  issue_type public.marketing_issue_type NOT NULL,
  description text,
  status public.marketing_issue_status NOT NULL DEFAULT 'submitted',
  admin_note text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.marketing_resource_issues TO authenticated;
GRANT ALL ON public.marketing_resource_issues TO service_role;

ALTER TABLE public.marketing_resource_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "amb_own_issues_read" ON public.marketing_resource_issues
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.campus_ambassador_profiles p
    WHERE p.id = ambassador_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "amb_own_issues_insert" ON public.marketing_resource_issues
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.campus_ambassador_profiles p
    WHERE p.id = ambassador_id AND p.user_id = auth.uid() AND p.status='active'
  ));

CREATE POLICY "admins_manage_issues" ON public.marketing_resource_issues
  FOR ALL TO authenticated
  USING (public.has_admin_permission(auth.uid(), 'marketing.manage'))
  WITH CHECK (public.has_admin_permission(auth.uid(), 'marketing.manage'));

CREATE OR REPLACE FUNCTION public.tg_marketing_issue_defaults()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND (NEW.issue_code IS NULL OR NEW.issue_code = '') THEN
    NEW.issue_code := 'GL-CA-MKT-ISS-' || to_char(now(),'YYYY') || '-' ||
      lpad(nextval('public.marketing_issue_code_seq')::text, 6, '0');
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_marketing_issue_defaults ON public.marketing_resource_issues;
CREATE TRIGGER trg_marketing_issue_defaults
BEFORE INSERT OR UPDATE ON public.marketing_resource_issues
FOR EACH ROW EXECUTE FUNCTION public.tg_marketing_issue_defaults();

-- Storage policies: allow authenticated ambassadors to read marketing-resources bucket
DROP POLICY IF EXISTS "amb_read_marketing_resources_storage" ON storage.objects;
CREATE POLICY "amb_read_marketing_resources_storage" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'marketing-resources'
    AND EXISTS (
      SELECT 1 FROM public.campus_ambassador_profiles p
      WHERE p.user_id = auth.uid() AND p.status='active'
    )
  );

DROP POLICY IF EXISTS "admins_write_marketing_resources_storage" ON storage.objects;
CREATE POLICY "admins_write_marketing_resources_storage" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'marketing-resources' AND public.has_admin_permission(auth.uid(),'marketing.manage'))
  WITH CHECK (bucket_id = 'marketing-resources' AND public.has_admin_permission(auth.uid(),'marketing.manage'));
