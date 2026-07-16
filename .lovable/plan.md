# CMS-Driven Course Platform

Convert the course ecosystem into a fully CMS-driven engine so admins never hand-build a course page again. This is a scaffolding + AI orchestration task spread across 5 phases. The public Program Detail template already exists (`programs.$category.$course.index.tsx`) and is data-driven via the content pack — we keep that UI unchanged and swap the data source from static packs to Supabase-backed CMS records enriched by AI.

---

## Phase 1 — CMS schema consolidation

Most tables already exist (`courses`, `course_categories`, `course_modules`, `course_lessons`, `course_projects`, `course_tools`, `course_skills`, `course_faqs`, `course_topics`, `course_related`, `course_certifications`, `course_placement_support`, `course_career_roles`, `course_sales_content`). Additive migration only — no destructive changes:

- Add nullable columns to `courses`: `subcategory`, `promo_video_url`, `gallery_urls jsonb`, `og_image_url`, `hero_image_url`, `mode`, `language`, `difficulty` (already exists → verify), `career_launch_price`, `career_pro_price`, `self_paced_price`, `keywords text[]`, `internal_links jsonb`, `structured_data jsonb`, `learning_outcomes jsonb`, `prerequisites jsonb`, `who_should_join jsonb`, `highlights jsonb`, `capstone jsonb`, `case_studies jsonb`, `internship_details jsonb`, `ai_generated_at timestamptz`, `ai_generation_status text`.
- New table `course_hiring_partners` (id, course_id, company_name, logo_url, sort_order).
- New table `course_learning_path_stages` (id, course_id, stage, position, note).
- New table `course_salary_stages` (id, course_id, stage, range, low, high, note, position).
- New table `course_ai_generations` (id, course_id, kind, prompt, output jsonb, model, tokens, created_by, status, created_at) — audit log.
- Row-level security: extend existing course policies (public SELECT for published, admin write).
- Add `is_published`, `published_at`, `seo_title`, `seo_description` if missing.

## Phase 2 — Data layer & content resolver

- `src/lib/course-cms.functions.ts` — `getCourseFull(slug, category)` server fn: single query hydrating course + all related tables into a `CoursePayload` DTO.
- `src/lib/course-content-resolver.ts` — merges: (a) DB record if present, (b) `course-content-pack.ts` fallback (existing), (c) generic default. Public route reads only from the resolver; static pack becomes the fallback layer, not the primary source.
- Refactor `programs.$category.$course.index.tsx` loader to consume the resolver. UI untouched.

## Phase 3 — AI generation pipeline

Server functions under `src/lib/admin/course-ai.functions.ts` — each idempotent, callable individually or via "Generate All":

- `generateCourseOverview` → hero title/subtitle, short + full description, highlights, who-should-join, prerequisites.
- `generateCurriculum` → modules + lessons + duration.
- `generateProjects` → 5–8 projects sized to category.
- `generateLearningOutcomes` + `generateSkills`.
- `generateCareerData` → job titles, salary_stages, learning_path_stages, hiring_partners.
- `generateTools` → mapped via existing `toolIcon` lookup.
- `generateFAQs` → 8–10 category-unique FAQs (prompt enforces uniqueness against category).
- `generateSEO` → title, description, keywords, canonical, JSON-LD Course schema, OG/Twitter meta.
- `generateBlogSuggestions` → 6–10 titles + slugs, queued into existing AI Content Factory (`content_items` with `status='draft'`).
- `generateRelatedCourses` → picks from existing categories by embedding-lite similarity (name + skills tokens).

Uses existing `src/lib/ai-json.ts` hardened parser and `src/lib/admin/ai-factory.functions.ts` patterns. Model: `google/gemini-3.1-flash` for structured JSON, split into parallel scoped calls to avoid schema-size failures (per `ai-sdk-agent-patterns` rules — no bounded `Output` schemas; prompt-driven, parse + clamp in code).

## Phase 4 — AI image pipeline

Server route `src/routes/api/admin/generate-course-image.ts` (streaming) + `createServerFn` orchestrator `generateCourseAssetSet`:

- Hero banner (1600×900), thumbnail (1200×800), OG image (1200×630), certificate preview, 3 section illustrations.
- Model: `google/gemini-3.1-flash-image` (fast + edit-capable); prompts derived from category + course theme.
- Upload output to Supabase Storage bucket `course-assets/{course_id}/…`; store URLs on the course record.
- Non-blocking: images generated async, admin sees progress in the CMS.

## Phase 5 — Admin CMS UI at `/admin/courses`

Keeps existing admin design tokens. Routes:

- `/admin/courses` — list with search, filter (category, status, published), bulk publish.
- `/admin/courses/new` — 3-field form (Name, Category, Slug) → Save → redirect to editor.
- `/admin/courses/$id/edit` — tabbed editor:
  - **Overview**: basic info + hero fields + pricing + CTAs.
  - **Curriculum**: drag-and-drop modules/lessons (using `@dnd-kit`, already in tree — verify).
  - **Learning**: outcomes, skills, prerequisites, projects, assignments, capstone.
  - **Career**: hiring partners, roadmap stages, salary stages, career roles.
  - **FAQs**: list editor.
  - **Media**: image generation panel with previews + regenerate per asset.
  - **SEO**: fields + live JSON-LD preview.
  - **AI Studio**: single "Generate with AI" button + per-section regenerate; shows `course_ai_generations` history.
  - **Publish**: preview link, publish toggle, status badge.

Every save writes to CMS; the public route re-fetches on the next request (staleTime honored).

## Phase 6 — Automation on course create

`onCourseCreated` server fn triggered from `/admin/courses/new`:

1. Insert course row (draft).
2. Fire `generateCourseOverview` → `generateCurriculum` → `generateLearningOutcomes` → `generateSkills` → `generateProjects` → `generateCareerData` → `generateTools` → `generateFAQs` → `generateSEO` in parallel groups.
3. Queue image generation.
4. Queue 6 blog suggestions into `content_items` as drafts.
5. Mark `ai_generation_status='ready_for_review'`.

Admin flow becomes: **Create → Wait ~60s → Review → Publish**.

## Out of scope for this turn

- Blog auto-publish (drafts only — human review remains).
- Certificate PDF renderer (existing `certificates` table already handles storage; UI generation deferred).
- Real-time collaborative editing.

---

## Technical section

- **DB**: additive migration; existing static pack code (`course-content-pack.ts`) becomes fallback for un-migrated courses. No breaking change to `programs.$category.$course.index.tsx` shape — resolver returns the same DTO the template consumes today.
- **AI budget**: each course full-generation ≈ 8 parallel Gemini Flash calls + 6 image calls. Rate-limit via existing gateway; surface 402/429 errors in admin UI per `connecting-to-ai-models-tanstack`.
- **Storage**: bucket `course-assets` (public read, admin write). RLS via existing pattern.
- **Types**: extend `src/lib/programs.ts` `Course` type via `CoursePayload` in resolver; keep `programs.ts` legacy path untouched for compatibility.
- **Rollout**: ship phases 1+2 first (schema + resolver) → existing courses unchanged. Then 3+4+5+6 in sequence. Each phase independently deployable.

## Delivery order this turn

Given the size, this turn implements **Phase 1 (schema)** + **Phase 2 (resolver + loader wiring)** + **skeleton of Phase 5 admin routes** so the platform is unblocked for content teams. Phases 3, 4, 6 land in a follow-up turn to keep the change reviewable.

Confirm to proceed, or narrow the scope (e.g. "AI generation first, admin UI later").
