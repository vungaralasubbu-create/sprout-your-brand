
-- 1. Extend enums
DO $$
BEGIN
  -- content_type additions
  BEGIN ALTER TYPE public.content_type ADD VALUE IF NOT EXISTS 'blog_article'; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

ALTER TYPE public.content_type ADD VALUE IF NOT EXISTS 'technology_guide';
ALTER TYPE public.content_type ADD VALUE IF NOT EXISTS 'interview_questions';
ALTER TYPE public.content_type ADD VALUE IF NOT EXISTS 'project';
ALTER TYPE public.content_type ADD VALUE IF NOT EXISTS 'mini_tutorial';
ALTER TYPE public.content_type ADD VALUE IF NOT EXISTS 'course_guide';
ALTER TYPE public.content_type ADD VALUE IF NOT EXISTS 'salary_guide';
ALTER TYPE public.content_type ADD VALUE IF NOT EXISTS 'company_hiring_guide';
ALTER TYPE public.content_type ADD VALUE IF NOT EXISTS 'certification_guide';
ALTER TYPE public.content_type ADD VALUE IF NOT EXISTS 'industry_news';
ALTER TYPE public.content_type ADD VALUE IF NOT EXISTS 'ai_trend';
ALTER TYPE public.content_type ADD VALUE IF NOT EXISTS 'success_story';
ALTER TYPE public.content_type ADD VALUE IF NOT EXISTS 'case_study';
ALTER TYPE public.content_type ADD VALUE IF NOT EXISTS 'tool_review';
ALTER TYPE public.content_type ADD VALUE IF NOT EXISTS 'student_story';
ALTER TYPE public.content_type ADD VALUE IF NOT EXISTS 'blog_article';

ALTER TYPE public.content_status ADD VALUE IF NOT EXISTS 'rejected';

-- 2. Extend content_items with new fields (all optional / defaulted)
ALTER TABLE public.content_items
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS subcategory TEXT,
  ADD COLUMN IF NOT EXISTS difficulty TEXT,
  ADD COLUMN IF NOT EXISTS target_audience TEXT,
  ADD COLUMN IF NOT EXISTS related_course_ids UUID[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS related_career_ids UUID[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS related_project_ids UUID[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS related_content_ids UUID[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS related_certification_slugs TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS secondary_keywords TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS robots_directives TEXT NOT NULL DEFAULT 'index,follow',
  ADD COLUMN IF NOT EXISTS twitter_card TEXT NOT NULL DEFAULT 'summary_large_image',
  ADD COLUMN IF NOT EXISTS twitter_title TEXT,
  ADD COLUMN IF NOT EXISTS twitter_description TEXT,
  ADD COLUMN IF NOT EXISTS twitter_image TEXT,
  ADD COLUMN IF NOT EXISTS breadcrumb JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS editor_blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS hero_video_url TEXT,
  ADD COLUMN IF NOT EXISTS media_gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS downloads JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS review_due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refresh_due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS locale_group_id UUID,
  ADD COLUMN IF NOT EXISTS seo_score INTEGER,
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS search_tsv TSVECTOR;

CREATE INDEX IF NOT EXISTS idx_content_items_language ON public.content_items(language);
CREATE INDEX IF NOT EXISTS idx_content_items_status_type ON public.content_items(status, type);
CREATE INDEX IF NOT EXISTS idx_content_items_scheduled ON public.content_items(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_content_items_review_due ON public.content_items(review_due_at) WHERE review_due_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_items_search_tsv ON public.content_items USING GIN(search_tsv);
CREATE INDEX IF NOT EXISTS idx_content_items_locale_group ON public.content_items(locale_group_id) WHERE locale_group_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_items_related_courses ON public.content_items USING GIN(related_course_ids);
CREATE INDEX IF NOT EXISTS idx_content_items_related_careers ON public.content_items USING GIN(related_career_ids);

-- 3. Search vector trigger
CREATE OR REPLACE FUNCTION public.content_items_search_tsv_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.search_tsv :=
    setweight(to_tsvector('simple', coalesce(NEW.title,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.summary,'')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.focus_topic,'')), 'B') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(NEW.tag_slugs, '{}'::text[]), ' ')), 'C') ||
    setweight(to_tsvector('simple', coalesce(NEW.body_markdown,'')), 'D');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_content_items_search_tsv ON public.content_items;
CREATE TRIGGER trg_content_items_search_tsv
  BEFORE INSERT OR UPDATE OF title, summary, focus_topic, tag_slugs, body_markdown
  ON public.content_items
  FOR EACH ROW EXECUTE FUNCTION public.content_items_search_tsv_update();

-- 4. Content Locks (edit locking)
CREATE TABLE IF NOT EXISTS public.content_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '15 minutes'),
  UNIQUE (content_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_locks TO authenticated;
GRANT ALL ON public.content_locks TO service_role;
ALTER TABLE public.content_locks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authors manage own locks"
  ON public.content_locks FOR ALL
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Any authenticated can view locks"
  ON public.content_locks FOR SELECT
  TO authenticated
  USING (true);

-- 5. Publishing / editorial calendar
CREATE TABLE IF NOT EXISTS public.content_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES public.content_items(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, -- 'publish' | 'review' | 'refresh' | 'expiry' | 'editorial'
  title TEXT,
  notes TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  recurrence TEXT, -- 'once' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  assigned_to UUID,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | done | skipped
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_content_schedule_when ON public.content_schedule(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_content_schedule_content ON public.content_schedule(content_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_schedule TO authenticated;
GRANT ALL ON public.content_schedule TO service_role;
ALTER TABLE public.content_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Editors manage calendar"
  ON public.content_schedule FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = assigned_to OR auth.uid() = created_by)
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR auth.uid() = assigned_to OR auth.uid() = created_by);

-- 6. Content Relations graph
CREATE TABLE IF NOT EXISTS public.content_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL, -- 'content' | 'course' | 'career' | 'project' | 'certification' | 'company' | 'success_story'
  target_id UUID,
  target_slug TEXT,
  relation TEXT NOT NULL DEFAULT 'related', -- 'related' | 'prerequisite' | 'next' | 'referenced_in'
  weight NUMERIC NOT NULL DEFAULT 1.0,
  auto_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_content_relations_source ON public.content_relations(source_id);
CREATE INDEX IF NOT EXISTS idx_content_relations_target ON public.content_relations(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_content_relations_target_slug ON public.content_relations(target_type, target_slug);
GRANT SELECT ON public.content_relations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.content_relations TO authenticated;
GRANT ALL ON public.content_relations TO service_role;
ALTER TABLE public.content_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view relations"
  ON public.content_relations FOR SELECT
  TO anon, authenticated
  USING (true);
CREATE POLICY "Editors write relations"
  ON public.content_relations FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Editors update relations"
  ON public.content_relations FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Editors delete relations"
  ON public.content_relations FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 7. Content Translations (architecture only)
CREATE TABLE IF NOT EXISTS public.content_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  locale_group_id UUID NOT NULL,
  content_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (locale_group_id, language)
);
CREATE INDEX IF NOT EXISTS idx_content_translations_group ON public.content_translations(locale_group_id);
GRANT SELECT ON public.content_translations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.content_translations TO authenticated;
GRANT ALL ON public.content_translations TO service_role;
ALTER TABLE public.content_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view translations"
  ON public.content_translations FOR SELECT
  TO anon, authenticated
  USING (true);
CREATE POLICY "Editors manage translations"
  ON public.content_translations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 8. AI Assist Jobs
CREATE TABLE IF NOT EXISTS public.content_ai_assist_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES public.content_items(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL,
  action TEXT NOT NULL, -- rewrite | expand | simplify | improve_readability | improve_seo | generate_faq | generate_cta | generate_summary | generate_conclusion | generate_table | generate_internal_links | generate_external_refs | generate_meta | generate_schema | generate_image_prompt | generate_video_topics
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB,
  model TEXT,
  tokens_used INTEGER,
  cost_usd NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | running | succeeded | failed
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_content_ai_jobs_content ON public.content_ai_assist_jobs(content_id);
CREATE INDEX IF NOT EXISTS idx_content_ai_jobs_user ON public.content_ai_assist_jobs(requested_by);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_ai_assist_jobs TO authenticated;
GRANT ALL ON public.content_ai_assist_jobs TO service_role;
ALTER TABLE public.content_ai_assist_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own AI jobs"
  ON public.content_ai_assist_jobs FOR SELECT
  TO authenticated
  USING (requested_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create own AI jobs"
  ON public.content_ai_assist_jobs FOR INSERT
  TO authenticated
  WITH CHECK (requested_by = auth.uid());
CREATE POLICY "Users update own AI jobs"
  ON public.content_ai_assist_jobs FOR UPDATE
  TO authenticated
  USING (requested_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (requested_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 9. Updated-at triggers
CREATE OR REPLACE FUNCTION public.set_updated_at_col()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_content_schedule_updated ON public.content_schedule;
CREATE TRIGGER trg_content_schedule_updated
  BEFORE UPDATE ON public.content_schedule
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_col();

DROP TRIGGER IF EXISTS trg_content_translations_updated ON public.content_translations;
CREATE TRIGGER trg_content_translations_updated
  BEFORE UPDATE ON public.content_translations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_col();
