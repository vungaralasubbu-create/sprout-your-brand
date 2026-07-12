# Dynamic Course CMS + Public Program Pages

Scope is very large. I'll ship it in 3 tightly-scoped phases so each is reviewable and the site stays deployable between them. No changes to homepage, design system, revenue module, brand module, or auth.

## Phase 1 — Data Model + Seed + Public Read Layer

**DB migration** (single migration, all with GRANTs + RLS):

Tables (all with `id`, `created_at`, `updated_at`, `created_by`, `updated_by` where noted):

- `course_categories` — name, slug (unique), short_description, full_description, icon, thumbnail_url, hero_image_url, hero_title, hero_subtitle, accent_style, display_order, is_featured, is_active, status (draft/published/archived), seo_title, seo_description, seo_keywords[]
- `skills` — name (unique), slug, description, icon
- `tools` — name (unique), slug, logo_url, description, website_url, category, is_active
- `career_roles` — title, slug, description, experience_level, salary_min, salary_max, currency, salary_period, salary_source, salary_source_url, salary_date, region, is_visible
- `projects` — name, slug, short_description, full_description, image_url, difficulty, duration, industry, project_type, learning_outcomes[]
- `courses` — category_id (FK), name, slug (unique per category), short_description, full_description, thumbnail_url, hero_image_url, promo_video_url, status, is_published, is_featured, is_trending, is_popular, is_bestseller, white_label_eligible, partner_sale_eligible, supported_sales_eligible, display_order, duration, learning_mode, level, language, weekly_commitment, format, prerequisites, eligibility, target_audience, base_price, offer_price, discount_pct, currency, emi_available, emi_starting, scholarship_available, pricing_visibility, tax_config jsonb, pricing_notes, default_revenue_rule_id (FK to `revenue_share_rules`), seo_title, seo_description, seo_keywords[], og_image_url, canonical_url
- `course_sections` — course_id, section_type, title, content jsonb, display_order, is_enabled (drives modular section ordering)
- `course_modules` — course_id, number, name, description, duration, learning_outcomes[], display_order
- `course_topics` — module_id, name, description, display_order
- `course_lessons` — topic_id, name, lesson_type (video/text/pdf/quiz/assignment/live/project/external), duration, is_free_preview, is_published, resource_url, display_order
- `course_skills` — course_id, skill_id (many-to-many)
- `course_tools` — course_id, tool_id
- `course_projects` — course_id, project_id
- `course_career_roles` — course_id, career_role_id
- `course_certifications` — course_id, name, description, image_url, issuer, verification_available, requirements
- `course_placement_support` — course_id, support_type, description, is_enabled
- `course_faqs` — course_id, question, answer, display_order
- `course_related` — course_id, related_course_id, is_manual (manual > auto)
- `course_brochures` — course_id, file_url, version, is_published, capture_lead
- `course_applications` — course_id, full_name, mobile, email, city, state, education, graduation_year, current_role, work_experience, preferred_mode, start_timeline, source, consent, partner_ref (nullable → partners.code), status
- `brochure_leads` — course_id, name, mobile, email
- `partner_referral_events` — partner_id, course_id, session_id, event_type (visit/lead/application/enrollment), metadata jsonb

**RLS pattern**:
- Public SELECT on published rows (`is_published = true` and/or `status = 'published'`) with `TO anon, authenticated`.
- Admin ALL via `public.is_admin(auth.uid())`.
- Applications/leads: INSERT open to `anon`; SELECT admin-only.
- Owner reads for course drafts via admin role.

**Seed migration**: 4 default categories + all named default courses (Computer Science, Electronics & Electrical, Mechanical Engineering, Management) with short descriptions from the brief, `status = 'published'`, sensible defaults for pricing/duration (admin-editable). Idempotent via `ON CONFLICT (slug) DO NOTHING`.

## Phase 2 — Public Program Pages

Routes (all leaf `head()` with SEO, all read via TanStack Query + server publishable client for anon):

- `/programs` — discovery: search (name/skill/tool/role/category), filters (category, duration, mode, level, price range, EMI, featured, popular), sorted grid using existing `CourseCard`.
- `/programs/$category` — category hero + featured + all programs + skills + roles + FAQ + CTA. Dynamic for any published category slug.
- `/programs/$category/$course` — hero (breadcrumb, name, rating/enrollment only if data), sticky apply card (desktop) + mobile sticky Apply, sections rendered in admin-defined order (fallback to default), hides empty sections, related programs (manual > auto by category/skills/tools).
- `/programs/$course/apply` — application form; captures `?ref=CODE` from query/session; writes to `course_applications` + `partner_referral_events`.
- Brochure download: modal on course page — if `capture_lead`, collect name/mobile/email then serve URL.

Referral tracking: `?ref=CODE` sets sessionStorage, logs `visit` event on program view, and attaches to application/brochure lead.

Server fns (public, publishable-key client):
- `listPublishedCategories`, `getCategoryBySlug`, `listPublishedCourses(filters)`, `getCourseBySlug(category, slug)`, `submitCourseApplication`, `submitBrochureLead`, `logReferralEvent`.

Update `src/data/cms.ts` fallback hook to prefer live categories, keep fallback only if fetch fails (homepage stays untouched visually).

## Phase 3 — Admin CMS

Route tree under `_authenticated/admin/`:

- `/admin/categories` — table with reorder (drag handle), publish/unpublish/archive, create/edit drawer.
- `/admin/courses` — table with search, filters, bulk actions (publish, unpublish, archive, category change, featured, WL eligibility, partner/supported eligibility). Row actions: edit, duplicate, delete (safe: only if no enrollments).
- `/admin/courses/new` and `/admin/courses/$id/edit` — 10-step guided builder (Basic, Category & Eligibility, Pricing, Details, Curriculum, Skills & Tools, Projects, Career, Certification & Support, SEO & Publishing). Save Draft / Preview / Publish. Auto-save.
- `/admin/skills`, `/admin/tools`, `/admin/projects`, `/admin/career-roles` — simple CRUD tables.
- `/admin/applications`, `/admin/brochures`, `/admin/brochure-leads` — read tables with status.
- Curriculum builder inside course edit: modules → topics → lessons with reorder + duplicate.
- Section ordering: drag-to-reorder in course edit "Sections" tab (writes `course_sections.display_order` + `is_enabled`).

Access: gated by `_authenticated` layout + `has_role(uid, 'admin' | 'super_admin')` check via server fn; non-admins get 403.

Uploads: use existing Supabase Storage; create a `course-assets` public bucket in the same migration.

## Technical Notes

- Reuse existing `CourseCard`, `CategoryCard`, `FAQ`, `Timeline`, `EmptyState` primitives.
- All course reads go through server functions using publishable key (no service role on public pages).
- Pricing/eligibility read on public pages; commission math stays in existing revenue module.
- Sitemap: extend existing sitemap route (or create `src/routes/sitemap[.]xml.ts`) to include published categories + courses.
- Never render "coming soon" / empty placeholders on public pages — sections return `null` when empty.

## Delivery Order

1. Phase 1 migration (categories, skills, tools, roles, projects, courses, sections, modules/topics/lessons, joins, applications, brochures, referrals) + seed + storage bucket.
2. Phase 2 public routes + server fns + brochure/apply forms + referral tracking + sitemap update.
3. Phase 3 admin CMS (categories/courses list, 10-step builder, curriculum builder, skills/tools/projects/roles CRUD, applications/brochure leads, bulk actions).

I'll pause between phases so you can review before I proceed. Confirm to start Phase 1 (DB migration + seed) — that's the only step that needs your approval before running.
