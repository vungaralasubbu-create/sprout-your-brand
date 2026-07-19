
-- =====================================================================
-- INTERNAL LINKING ENGINE
-- =====================================================================
-- Directional link graph across courses, blogs, career paths, skills,
-- certifications, jobs, and FAQs. Populated deterministically from
-- existing relationships so links are always contextually relevant.
-- =====================================================================

-- Entity kinds we can link between.
DO $$ BEGIN
  CREATE TYPE public.internal_link_entity AS ENUM (
    'course', 'blog', 'career_path', 'skill', 'certification', 'job', 'faq'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1) CREATE TABLE
CREATE TABLE IF NOT EXISTS public.internal_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_type       public.internal_link_entity NOT NULL,
  from_id         UUID NOT NULL,
  to_type         public.internal_link_entity NOT NULL,
  to_id           UUID NOT NULL,
  relation        TEXT NOT NULL,          -- e.g. 'related_course', 'course_blog'
  score           REAL NOT NULL DEFAULT 1.0,
  reason          TEXT,                   -- short human-readable explanation
  auto_generated  BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT internal_links_no_self CHECK (NOT (from_type = to_type AND from_id = to_id)),
  CONSTRAINT internal_links_unique UNIQUE (from_type, from_id, to_type, to_id, relation)
);

CREATE INDEX IF NOT EXISTS idx_internal_links_from
  ON public.internal_links (from_type, from_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_internal_links_to
  ON public.internal_links (to_type, to_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_internal_links_relation
  ON public.internal_links (relation);

-- 2) GRANTS
GRANT SELECT ON public.internal_links TO anon, authenticated;
GRANT ALL    ON public.internal_links TO service_role;

-- 3) RLS
ALTER TABLE public.internal_links ENABLE ROW LEVEL SECURITY;

-- 4) POLICIES
DROP POLICY IF EXISTS "public read internal links" ON public.internal_links;
CREATE POLICY "public read internal links"
  ON public.internal_links FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "staff manage internal links" ON public.internal_links;
CREATE POLICY "staff manage internal links"
  ON public.internal_links FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- updated_at trigger (reuses the standard helper if present)
DO $$ BEGIN
  CREATE TRIGGER trg_internal_links_updated_at
    BEFORE UPDATE ON public.internal_links
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
         WHEN undefined_function THEN NULL; END $$;

-- =====================================================================
-- REBUILDER — recomputes the graph deterministically
-- =====================================================================
CREATE OR REPLACE FUNCTION public.rebuild_internal_links()
RETURNS TABLE (relation TEXT, inserted BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows BIGINT;
BEGIN
  -- Only staff may rebuild.
  IF auth.uid() IS NOT NULL
     AND NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  DELETE FROM public.internal_links WHERE auto_generated = true;

  -- ---- 1. Course <-> Related Courses (same category, weighted by shared skills) ----
  WITH shared AS (
    SELECT
      a.id AS from_id,
      b.id AS to_id,
      COUNT(DISTINCT sa.skill_id) AS shared_skills
    FROM public.courses a
    JOIN public.courses b
      ON b.id <> a.id
     AND (a.category_id = b.category_id OR COALESCE(a.subcategory,'') = COALESCE(b.subcategory,''))
    LEFT JOIN public.course_skills sa ON sa.course_id = a.id
    LEFT JOIN public.course_skills sb ON sb.course_id = b.id AND sb.skill_id = sa.skill_id
    WHERE a.is_published = true AND b.is_published = true
    GROUP BY a.id, b.id
  ),
  ranked AS (
    SELECT from_id, to_id, shared_skills,
           ROW_NUMBER() OVER (PARTITION BY from_id ORDER BY shared_skills DESC, to_id) AS rn
    FROM shared
  )
  INSERT INTO public.internal_links (from_type, from_id, to_type, to_id, relation, score, reason)
  SELECT 'course', from_id, 'course', to_id, 'related_course',
         1.0 + LEAST(shared_skills, 10) * 0.5,
         'Same category' || CASE WHEN shared_skills > 0 THEN ' • ' || shared_skills || ' shared skills' ELSE '' END
  FROM ranked
  WHERE rn <= 6
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  relation := 'related_course'; inserted := v_rows; RETURN NEXT;

  -- ---- 2. Course <-> Career Paths (via course_career_roles) ----
  INSERT INTO public.internal_links (from_type, from_id, to_type, to_id, relation, score, reason)
  SELECT 'course', ccr.course_id, 'career_path', ccr.career_role_id, 'course_career_path', 2.0,
         'Directly maps to career role'
  FROM public.course_career_roles ccr
  JOIN public.courses c ON c.id = ccr.course_id AND c.is_published = true
  ON CONFLICT DO NOTHING;

  INSERT INTO public.internal_links (from_type, from_id, to_type, to_id, relation, score, reason)
  SELECT 'career_path', ccr.career_role_id, 'course', ccr.course_id, 'career_path_course', 2.0,
         'Recommended course for this career'
  FROM public.course_career_roles ccr
  JOIN public.courses c ON c.id = ccr.course_id AND c.is_published = true
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  relation := 'course_career_path'; inserted := v_rows; RETURN NEXT;

  -- ---- 3. Course <-> Skills, Career Path <-> Skills ----
  INSERT INTO public.internal_links (from_type, from_id, to_type, to_id, relation, score, reason)
  SELECT 'course', cs.course_id, 'skill', cs.skill_id, 'course_skill', 1.5, 'Course teaches this skill'
  FROM public.course_skills cs
  JOIN public.courses c ON c.id = cs.course_id AND c.is_published = true
  ON CONFLICT DO NOTHING;

  -- career_path <-> skill via courses that link both
  INSERT INTO public.internal_links (from_type, from_id, to_type, to_id, relation, score, reason)
  SELECT DISTINCT
    'career_path', ccr.career_role_id, 'skill', cs.skill_id,
    'career_path_skill',
    1.5,
    'Required skill for this career'
  FROM public.course_career_roles ccr
  JOIN public.course_skills cs ON cs.course_id = ccr.course_id
  ON CONFLICT DO NOTHING;

  INSERT INTO public.internal_links (from_type, from_id, to_type, to_id, relation, score, reason)
  SELECT DISTINCT
    'skill', cs.skill_id, 'career_path', ccr.career_role_id,
    'skill_career_path',
    1.5,
    'Careers that use this skill'
  FROM public.course_career_roles ccr
  JOIN public.course_skills cs ON cs.course_id = ccr.course_id
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  relation := 'career_path_skill'; inserted := v_rows; RETURN NEXT;

  -- ---- 4. Skill <-> Certification (via courses that link both) ----
  INSERT INTO public.internal_links (from_type, from_id, to_type, to_id, relation, score, reason)
  SELECT DISTINCT
    'skill', cs.skill_id, 'certification', cc.id,
    'skill_certification', 1.2,
    'Certifications that validate this skill'
  FROM public.course_skills cs
  JOIN public.course_certifications cc ON cc.course_id = cs.course_id
  ON CONFLICT DO NOTHING;

  INSERT INTO public.internal_links (from_type, from_id, to_type, to_id, relation, score, reason)
  SELECT DISTINCT
    'certification', cc.id, 'skill', cs.skill_id,
    'certification_skill', 1.2,
    'Skills covered by this certification'
  FROM public.course_certifications cc
  JOIN public.course_skills cs ON cs.course_id = cc.course_id
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  relation := 'skill_certification'; inserted := v_rows; RETURN NEXT;

  -- ---- 5. Certification <-> Job (via career path title match) ----
  INSERT INTO public.internal_links (from_type, from_id, to_type, to_id, relation, score, reason)
  SELECT DISTINCT
    'certification', cc.id, 'job', hr.id,
    'certification_job', 1.0,
    'Roles that value this certification'
  FROM public.course_certifications cc
  JOIN public.course_career_roles ccr ON ccr.course_id = cc.course_id
  JOIN public.career_roles cr ON cr.id = ccr.career_role_id
  JOIN public.hiring_roles hr
    ON lower(hr.title) = lower(cr.title)
    AND hr.is_published = true
  ON CONFLICT DO NOTHING;

  INSERT INTO public.internal_links (from_type, from_id, to_type, to_id, relation, score, reason)
  SELECT DISTINCT
    'job', hr.id, 'certification', cc.id,
    'job_certification', 1.0,
    'Certifications relevant to this role'
  FROM public.course_certifications cc
  JOIN public.course_career_roles ccr ON ccr.course_id = cc.course_id
  JOIN public.career_roles cr ON cr.id = ccr.career_role_id
  JOIN public.hiring_roles hr
    ON lower(hr.title) = lower(cr.title)
    AND hr.is_published = true
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  relation := 'certification_job'; inserted := v_rows; RETURN NEXT;

  -- ---- 6. Job <-> Course (via matching career path titles) ----
  INSERT INTO public.internal_links (from_type, from_id, to_type, to_id, relation, score, reason)
  SELECT DISTINCT
    'job', hr.id, 'course', ccr.course_id,
    'job_course', 1.5,
    'Courses that prepare for this role'
  FROM public.hiring_roles hr
  JOIN public.career_roles cr ON lower(cr.title) = lower(hr.title)
  JOIN public.course_career_roles ccr ON ccr.career_role_id = cr.id
  JOIN public.courses c ON c.id = ccr.course_id AND c.is_published = true
  WHERE hr.is_published = true
  ON CONFLICT DO NOTHING;

  INSERT INTO public.internal_links (from_type, from_id, to_type, to_id, relation, score, reason)
  SELECT DISTINCT
    'course', ccr.course_id, 'job', hr.id,
    'course_job', 1.5,
    'Open roles this course prepares for'
  FROM public.hiring_roles hr
  JOIN public.career_roles cr ON lower(cr.title) = lower(hr.title)
  JOIN public.course_career_roles ccr ON ccr.career_role_id = cr.id
  JOIN public.courses c ON c.id = ccr.course_id AND c.is_published = true
  WHERE hr.is_published = true
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  relation := 'job_course'; inserted := v_rows; RETURN NEXT;

  -- ---- 7. Course <-> Blog (blog keyword ILIKE course name or subcategory) ----
  INSERT INTO public.internal_links (from_type, from_id, to_type, to_id, relation, score, reason)
  SELECT DISTINCT
    'course', c.id, 'blog', b.id,
    'course_blog', 1.0,
    'Blog mentions this course topic'
  FROM public.courses c
  JOIN public.blog_posts b
    ON b.is_published = true
   AND (
        EXISTS (
          SELECT 1 FROM unnest(COALESCE(b.keywords, ARRAY[]::text[])) k
          WHERE lower(k) = lower(c.name)
             OR (c.subcategory IS NOT NULL AND lower(k) = lower(c.subcategory))
        )
        OR b.title ILIKE '%' || c.name || '%'
       )
  WHERE c.is_published = true
  ON CONFLICT DO NOTHING;

  INSERT INTO public.internal_links (from_type, from_id, to_type, to_id, relation, score, reason)
  SELECT DISTINCT
    'blog', b.id, 'course', c.id,
    'blog_course', 1.0,
    'Course covered in this article'
  FROM public.courses c
  JOIN public.blog_posts b
    ON b.is_published = true
   AND (
        EXISTS (
          SELECT 1 FROM unnest(COALESCE(b.keywords, ARRAY[]::text[])) k
          WHERE lower(k) = lower(c.name)
             OR (c.subcategory IS NOT NULL AND lower(k) = lower(c.subcategory))
        )
        OR b.title ILIKE '%' || c.name || '%'
       )
  WHERE c.is_published = true
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  relation := 'course_blog'; inserted := v_rows; RETURN NEXT;

  -- ---- 8. Blog <-> FAQ (matched by category slug) ----
  INSERT INTO public.internal_links (from_type, from_id, to_type, to_id, relation, score, reason)
  SELECT DISTINCT
    'blog', b.id, 'faq', f.id,
    'blog_faq', 0.9,
    'FAQ shares this category'
  FROM public.blog_posts b
  JOIN public.blog_categories bc ON bc.id = b.category_id
  JOIN public.faq_categories fc  ON fc.slug = bc.slug
  JOIN public.faqs f ON f.category_id = fc.id AND f.is_published = true
  WHERE b.is_published = true
  ON CONFLICT DO NOTHING;

  INSERT INTO public.internal_links (from_type, from_id, to_type, to_id, relation, score, reason)
  SELECT DISTINCT
    'faq', f.id, 'blog', b.id,
    'faq_blog', 0.9,
    'Related article on this topic'
  FROM public.blog_posts b
  JOIN public.blog_categories bc ON bc.id = b.category_id
  JOIN public.faq_categories fc  ON fc.slug = bc.slug
  JOIN public.faqs f ON f.category_id = fc.id AND f.is_published = true
  WHERE b.is_published = true
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  relation := 'blog_faq'; inserted := v_rows; RETURN NEXT;

  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.rebuild_internal_links() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rebuild_internal_links() TO authenticated, service_role;

-- =====================================================================
-- READ HELPER — resolves an entity's outbound links with title + slug
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_internal_links(
  p_from_type public.internal_link_entity,
  p_from_id   UUID,
  p_limit     INT DEFAULT 8,
  p_relation  TEXT DEFAULT NULL
)
RETURNS TABLE (
  to_type   public.internal_link_entity,
  to_id     UUID,
  relation  TEXT,
  score     REAL,
  reason    TEXT,
  title     TEXT,
  slug      TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    il.to_type,
    il.to_id,
    il.relation,
    il.score,
    il.reason,
    CASE il.to_type
      WHEN 'course'         THEN (SELECT c.name  FROM public.courses c              WHERE c.id  = il.to_id)
      WHEN 'blog'           THEN (SELECT b.title FROM public.blog_posts b           WHERE b.id  = il.to_id)
      WHEN 'career_path'    THEN (SELECT cr.title FROM public.career_roles cr       WHERE cr.id = il.to_id)
      WHEN 'skill'          THEN (SELECT s.name  FROM public.skills s               WHERE s.id  = il.to_id)
      WHEN 'certification'  THEN (SELECT cc.name FROM public.course_certifications cc WHERE cc.id = il.to_id)
      WHEN 'job'            THEN (SELECT hr.title FROM public.hiring_roles hr       WHERE hr.id = il.to_id)
      WHEN 'faq'            THEN (SELECT f.slug  FROM public.faqs f                 WHERE f.id  = il.to_id)
    END AS title,
    CASE il.to_type
      WHEN 'course'         THEN (SELECT c.slug  FROM public.courses c              WHERE c.id  = il.to_id)
      WHEN 'blog'           THEN (SELECT b.slug  FROM public.blog_posts b           WHERE b.id  = il.to_id)
      WHEN 'career_path'    THEN (SELECT cr.slug FROM public.career_roles cr        WHERE cr.id = il.to_id)
      WHEN 'skill'          THEN (SELECT s.slug  FROM public.skills s               WHERE s.id  = il.to_id)
      WHEN 'certification'  THEN NULL
      WHEN 'job'            THEN (SELECT hr.slug FROM public.hiring_roles hr        WHERE hr.id = il.to_id)
      WHEN 'faq'            THEN (SELECT f.slug  FROM public.faqs f                 WHERE f.id  = il.to_id)
    END AS slug
  FROM public.internal_links il
  WHERE il.from_type = p_from_type
    AND il.from_id   = p_from_id
    AND (p_relation IS NULL OR il.relation = p_relation)
  ORDER BY il.score DESC, il.created_at DESC
  LIMIT GREATEST(p_limit, 1);
$$;

GRANT EXECUTE ON FUNCTION public.get_internal_links(public.internal_link_entity, UUID, INT, TEXT)
  TO anon, authenticated, service_role;

-- =====================================================================
-- ORPHAN DETECTION VIEW — entities with zero in/out edges
-- =====================================================================
CREATE OR REPLACE VIEW public.internal_link_orphans AS
WITH published_entities AS (
  SELECT 'course'::public.internal_link_entity AS entity_type, id, name  AS title, slug FROM public.courses       WHERE is_published = true
  UNION ALL
  SELECT 'blog',           id, title, slug FROM public.blog_posts  WHERE is_published = true
  UNION ALL
  SELECT 'career_path',    id, title, slug FROM public.career_roles
  UNION ALL
  SELECT 'skill',          id, name,  slug FROM public.skills
  UNION ALL
  SELECT 'job',            id, title, slug FROM public.hiring_roles WHERE is_published = true
  UNION ALL
  SELECT 'faq',            id, slug,  slug FROM public.faqs         WHERE is_published = true
),
edges AS (
  SELECT from_type AS entity_type, from_id AS id FROM public.internal_links
  UNION
  SELECT to_type,   to_id                  FROM public.internal_links
)
SELECT pe.entity_type, pe.id, pe.title, pe.slug
FROM published_entities pe
LEFT JOIN edges e ON e.entity_type = pe.entity_type AND e.id = pe.id
WHERE e.id IS NULL;

GRANT SELECT ON public.internal_link_orphans TO authenticated, service_role;
