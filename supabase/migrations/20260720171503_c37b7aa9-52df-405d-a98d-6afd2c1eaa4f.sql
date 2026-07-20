
-- =====================================================================
-- MEDIA LIBRARY — Enterprise Digital Asset Management
-- =====================================================================

-- helper: is_staff (marketing staff can manage assets)
-- reuses existing public.mkt_is_staff(uuid) already used across marketing OS

-- =====================================================================
-- 1. media_folders (unlimited nesting)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.media_folders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id    UUID REFERENCES public.media_folders(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  slug         TEXT,
  icon         TEXT,
  color        TEXT,
  is_system    BOOLEAN NOT NULL DEFAULT false,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_media_folders_parent ON public.media_folders(parent_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_folders TO authenticated;
GRANT ALL ON public.media_folders TO service_role;
ALTER TABLE public.media_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media_folders_staff_read"   ON public.media_folders FOR SELECT TO authenticated USING (public.mkt_is_staff(auth.uid()));
CREATE POLICY "media_folders_staff_write"  ON public.media_folders FOR ALL    TO authenticated USING (public.mkt_is_staff(auth.uid())) WITH CHECK (public.mkt_is_staff(auth.uid()));

-- =====================================================================
-- 2. media_assets (unified asset)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.media_assets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id         UUID REFERENCES public.media_folders(id) ON DELETE SET NULL,
  brand_id          UUID,
  campaign_id       UUID,
  owner_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- classification
  kind              TEXT NOT NULL DEFAULT 'image', -- image | video | document | audio | archive | data | other
  source            TEXT NOT NULL DEFAULT 'upload', -- upload | ai_generated | url_import | integration
  ai_generated      BOOLEAN NOT NULL DEFAULT false,
  ai_prompt         TEXT,
  ai_model          TEXT,

  -- file
  bucket            TEXT NOT NULL DEFAULT 'media-library',
  storage_path      TEXT NOT NULL,
  public_url        TEXT,
  file_name         TEXT NOT NULL,
  original_name     TEXT,
  mime_type         TEXT,
  size_bytes        BIGINT,
  checksum          TEXT,

  -- media specifics
  width             INTEGER,
  height            INTEGER,
  duration_seconds  NUMERIC,
  color_palette     JSONB,
  orientation       TEXT, -- landscape | portrait | square

  -- descriptive
  title             TEXT,
  description       TEXT,
  alt_text          TEXT,
  caption           TEXT,
  tags              TEXT[] NOT NULL DEFAULT '{}',
  keywords          TEXT[] NOT NULL DEFAULT '{}',
  ai_tags           TEXT[] NOT NULL DEFAULT '{}',

  -- lifecycle
  current_version   INTEGER NOT NULL DEFAULT 1,
  visibility        TEXT NOT NULL DEFAULT 'workspace', -- workspace | private | public | shared
  status            TEXT NOT NULL DEFAULT 'active',    -- active | archived | processing
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,

  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_media_assets_folder     ON public.media_assets(folder_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_brand      ON public.media_assets(brand_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_campaign   ON public.media_assets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_owner      ON public.media_assets(owner_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_kind       ON public.media_assets(kind);
CREATE INDEX IF NOT EXISTS idx_media_assets_status     ON public.media_assets(status);
CREATE INDEX IF NOT EXISTS idx_media_assets_deleted_at ON public.media_assets(deleted_at);
CREATE INDEX IF NOT EXISTS idx_media_assets_tags       ON public.media_assets USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_media_assets_ai_tags    ON public.media_assets USING gin(ai_tags);
CREATE INDEX IF NOT EXISTS idx_media_assets_created    ON public.media_assets(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media_assets_staff_read"  ON public.media_assets FOR SELECT TO authenticated
  USING (public.mkt_is_staff(auth.uid()) OR owner_id = auth.uid());
CREATE POLICY "media_assets_staff_write" ON public.media_assets FOR ALL    TO authenticated
  USING (public.mkt_is_staff(auth.uid()) OR owner_id = auth.uid())
  WITH CHECK (public.mkt_is_staff(auth.uid()) OR owner_id = auth.uid());

-- =====================================================================
-- 3. media_versions (version history)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.media_versions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id       UUID NOT NULL REFERENCES public.media_assets(id) ON DELETE CASCADE,
  version        INTEGER NOT NULL,
  bucket         TEXT NOT NULL,
  storage_path   TEXT NOT NULL,
  file_name      TEXT,
  mime_type      TEXT,
  size_bytes     BIGINT,
  width          INTEGER,
  height         INTEGER,
  note           TEXT,
  created_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(asset_id, version)
);
CREATE INDEX IF NOT EXISTS idx_media_versions_asset ON public.media_versions(asset_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_versions TO authenticated;
GRANT ALL ON public.media_versions TO service_role;
ALTER TABLE public.media_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media_versions_staff_read"  ON public.media_versions FOR SELECT TO authenticated USING (public.mkt_is_staff(auth.uid()));
CREATE POLICY "media_versions_staff_write" ON public.media_versions FOR ALL    TO authenticated USING (public.mkt_is_staff(auth.uid())) WITH CHECK (public.mkt_is_staff(auth.uid()));

-- =====================================================================
-- 4. media_collections + items (unlimited collections)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.media_collections (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  description  TEXT,
  cover_asset_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  kind         TEXT NOT NULL DEFAULT 'custom', -- campaign | brand | launch | presentation | custom
  brand_id     UUID,
  campaign_id  UUID,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_collections TO authenticated;
GRANT ALL ON public.media_collections TO service_role;
ALTER TABLE public.media_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media_collections_staff_read"  ON public.media_collections FOR SELECT TO authenticated USING (public.mkt_is_staff(auth.uid()));
CREATE POLICY "media_collections_staff_write" ON public.media_collections FOR ALL    TO authenticated USING (public.mkt_is_staff(auth.uid())) WITH CHECK (public.mkt_is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.media_collection_items (
  collection_id UUID NOT NULL REFERENCES public.media_collections(id) ON DELETE CASCADE,
  asset_id      UUID NOT NULL REFERENCES public.media_assets(id) ON DELETE CASCADE,
  added_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  added_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  sort_order    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, asset_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_collection_items TO authenticated;
GRANT ALL ON public.media_collection_items TO service_role;
ALTER TABLE public.media_collection_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media_collection_items_staff_read"  ON public.media_collection_items FOR SELECT TO authenticated USING (public.mkt_is_staff(auth.uid()));
CREATE POLICY "media_collection_items_staff_write" ON public.media_collection_items FOR ALL    TO authenticated USING (public.mkt_is_staff(auth.uid())) WITH CHECK (public.mkt_is_staff(auth.uid()));

-- =====================================================================
-- 5. media_usage (where an asset is used)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.media_usage (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id     UUID NOT NULL REFERENCES public.media_assets(id) ON DELETE CASCADE,
  usage_type   TEXT NOT NULL, -- campaign | blog | landing_page | post | email | certificate | video | course | brand_kit | other
  ref_table    TEXT,
  ref_id       UUID,
  ref_url      TEXT,
  note         TEXT,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_media_usage_asset ON public.media_usage(asset_id);
CREATE INDEX IF NOT EXISTS idx_media_usage_ref   ON public.media_usage(ref_table, ref_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_usage TO authenticated;
GRANT ALL ON public.media_usage TO service_role;
ALTER TABLE public.media_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media_usage_staff_read"  ON public.media_usage FOR SELECT TO authenticated USING (public.mkt_is_staff(auth.uid()));
CREATE POLICY "media_usage_staff_write" ON public.media_usage FOR ALL    TO authenticated USING (public.mkt_is_staff(auth.uid())) WITH CHECK (public.mkt_is_staff(auth.uid()));

-- =====================================================================
-- 6. media_favorites (per-user stars)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.media_favorites (
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id  UUID NOT NULL REFERENCES public.media_assets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, asset_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_favorites TO authenticated;
GRANT ALL ON public.media_favorites TO service_role;
ALTER TABLE public.media_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media_favorites_owner_all" ON public.media_favorites FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- =====================================================================
-- 7. updated_at triggers
-- =====================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column' AND pronamespace = 'public'::regnamespace) THEN
    CREATE OR REPLACE FUNCTION public.update_updated_at_column()
    RETURNS TRIGGER AS $f$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $f$
    LANGUAGE plpgsql SET search_path = public;
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_media_assets_updated_at ON public.media_assets;
CREATE TRIGGER trg_media_assets_updated_at BEFORE UPDATE ON public.media_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_media_folders_updated_at ON public.media_folders;
CREATE TRIGGER trg_media_folders_updated_at BEFORE UPDATE ON public.media_folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_media_collections_updated_at ON public.media_collections;
CREATE TRIGGER trg_media_collections_updated_at BEFORE UPDATE ON public.media_collections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================================
-- 8. Seed system folders (idempotent)
-- =====================================================================
INSERT INTO public.media_folders (name, is_system, sort_order, icon)
VALUES
  ('Brand Assets',    true, 10, 'Palette'),
  ('Campaign Assets', true, 20, 'Megaphone'),
  ('AI Generated',    true, 30, 'Sparkles'),
  ('Certificates',    true, 40, 'Award'),
  ('Images',          true, 50, 'Image'),
  ('Videos',          true, 60, 'Video'),
  ('Documents',       true, 70, 'FileText'),
  ('Presentations',   true, 80, 'Presentation'),
  ('Landing Pages',   true, 90, 'LayoutTemplate'),
  ('Blogs',           true, 100, 'BookOpen'),
  ('Email Assets',    true, 110, 'Mail'),
  ('Icons',           true, 120, 'Shapes'),
  ('Logos',           true, 130, 'Hexagon'),
  ('Backgrounds',     true, 140, 'Image'),
  ('Templates',       true, 150, 'LayoutGrid'),
  ('Archive',         true, 999, 'Archive')
ON CONFLICT DO NOTHING;

-- =====================================================================
-- 9. Storage RLS on the new media-library bucket only
-- =====================================================================
DROP POLICY IF EXISTS "media_library_staff_read"   ON storage.objects;
DROP POLICY IF EXISTS "media_library_staff_write"  ON storage.objects;
DROP POLICY IF EXISTS "media_library_staff_update" ON storage.objects;
DROP POLICY IF EXISTS "media_library_staff_delete" ON storage.objects;

CREATE POLICY "media_library_staff_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'media-library' AND public.mkt_is_staff(auth.uid()));

CREATE POLICY "media_library_staff_write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media-library' AND public.mkt_is_staff(auth.uid()));

CREATE POLICY "media_library_staff_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'media-library' AND public.mkt_is_staff(auth.uid()))
  WITH CHECK (bucket_id = 'media-library' AND public.mkt_is_staff(auth.uid()));

CREATE POLICY "media_library_staff_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'media-library' AND public.mkt_is_staff(auth.uid()));
