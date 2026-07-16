# Glintr Enterprise Data Model — Phase 8A-2 Part 1

Canonical mapping of the Phase 8A-2 spec (Modules 1–16) onto Glintr's live Postgres schema, plus the gap list. No migrations run this phase — this document is the review target.

**Universal conventions** applied to every entity below (already present on the majority of live tables):
- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()` + `BEFORE UPDATE` trigger
- `created_by uuid NULL` / `updated_by uuid NULL` on editorial + admin-owned tables
- `deleted_at timestamptz NULL` for soft-deletable content (blog, learn, media, courses); RLS filters `deleted_at IS NULL`
- `status <domain enum or text>` on every entity with a lifecycle

Every table references `auth.users(id)` via `user_id` (never a foreign key to a `public.profiles` shadow).

---

## Module 1 — Users

**Spec entity:** `User` (identity + profile + preferences)

**Live mapping (split by concern; no monolithic `users` table — Supabase owns identity):**

| Spec field | Live location |
|---|---|
| id, email, phone, passwordHash, emailVerified, phoneVerified, lastLogin | `auth.users` (Supabase managed) |
| firstName, lastName, displayName, avatar, bio, country, state, city, timezone, language, dateOfBirth, gender | **GAP — no `public.profiles` table exists.** See Gap A. |
| status | `auth.users.banned_until` (identity) + module-scoped status (student/partner/etc.) |
| roleId → many | `public.user_roles (user_id, role app_role)` — many-to-many, not a single FK |
| preferences | Module-scoped: `student_notification_preferences`, `ambassador_notification_preferences`, `pf_preferences` |
| notificationSettings | Same as above |

**Gap A — `public.profiles`.** The rest of the platform reads user display data from module-specific tables (`campus_ambassador_profiles`, `partner_brand_profiles`, `employee_profiles`, `career_profiles`, `student_education`). A unified `profiles` table is not yet on disk. If we introduce one, it must:
- FK `id` → `auth.users(id) ON DELETE CASCADE`
- No role columns (roles live in `user_roles`)
- Auto-created via `AFTER INSERT ON auth.users` trigger
- RLS: owner read/update; admins read all

Recommendation: introduce in Phase 8A-2 Part 2 with a migration.

---

## Module 2 — Roles

**Spec:** enumerated roles list + description + permissions.

**Live mapping:**
- Enum `public.app_role` — the canonical role set.
- `public.user_roles(user_id, role, id, created_at)` — assignments (2 rows shown, 1 policy live).
- `public.admin_role_permissions(role, resource, actions)` — role → permission matrix (4 columns, 2 policies).
- `public.admin_permission_overrides(user_id, resource, action, granted, ...)` — per-user overrides.

**Spec role coverage check:**

| Spec role | Present in `app_role`? |
|---|---|
| Student | ✅ `student` |
| Partner | ✅ `partner` |
| Instructor | ✅ `instructor` (verify below) |
| Admin | ✅ `admin` |
| Super Admin | ✅ `super_admin` |
| Content Writer | ⚠️ verify — likely under `admin` + `admin_role_permissions` scope, not a dedicated role |
| SEO Manager | ⚠️ verify — same |
| Support | ✅ `support_team` (or similar — verify) |
| White Label Owner | ✅ `wl_owner` |

**Gap B** — confirm which spec roles are enum members vs permission-scoped admins. If Content Writer / SEO Manager are enum members, no change; otherwise leave them as `admin` sub-scopes gated by `admin_role_permissions.resource IN ('content', 'seo')`.

---

## Module 3 — Permissions

**Spec fields:** id, module, action, description.

**Live mapping:**
- `admin_role_permissions(role, resource, actions text[])` — action list per role per resource.
- `admin_permission_overrides(user_id, resource, action, granted bool, reason, ...)` — one-row-per-permission overrides.

**Naming convention (canonical):** `Module.Action` (e.g. `Programs.Create`, `Programs.Publish`). Stored as `resource='programs'`, `actions ARRAY['create','edit','delete','publish']`. The `Module.Action` string is derived at read time.

**Suggested canonical action verbs** (used across every module):
`view · list · create · edit · delete · publish · unpublish · archive · restore · assign · approve · reject · export · impersonate`

No schema change needed.

---

## Module 4 — User Sessions

**Spec:** device, browser, ip, loginTime, logoutTime, refreshToken, expiresAt.

**Live mapping:**
- Sessions are owned by Supabase Auth (`auth.sessions`, `auth.refresh_tokens`) — **do not shadow** them.
- Login analytics are recorded via `session_join_events` (for live class sessions — different concept) and `student_activity` / `admin_activity_log` (auth events).

**Gap C** — if we need per-device audit visible to users (Zoom-style "active sessions" list), add a `public.user_session_events` table:
```
user_id uuid, event text CHECK (event IN ('login','logout')),
ip inet, user_agent text, device text, browser text,
country text, city text, at timestamptz DEFAULT now()
```
Read via `has_role(auth.uid(),'super_admin')` OR `auth.uid() = user_id`.
Recommended for a later phase; do NOT proxy Supabase refresh tokens.

---

## Module 5 — Student Profile

**Spec fields:** userId, learningGoals, currentPrograms, completedPrograms, learningLevel, interests, studyHoursPerWeek, streak, masteryScore.

**Live mapping (composed, not monolithic):**

| Spec field | Live source |
|---|---|
| userId | `student_education.user_id`, `student_career_preferences.user_id`, `enrollments.student_user_id` |
| learningGoals | `student_career_preferences` (target roles, industries) + client-side `hub` goals |
| currentPrograms | derived: `enrollments WHERE status IN ('active','received') AND completed_at IS NULL` |
| completedPrograms | derived: `enrollments WHERE completed_at IS NOT NULL` |
| learningLevel | `student_skills.proficiency` aggregate; `student_career_preferences.experience_level` |
| interests | `student_career_preferences.interests text[]`, `student_skills` |
| studyHoursPerWeek | **GAP D** — not stored; add to a future `student_profiles` table |
| streak | **GAP D** — currently client-side in workspace hub; server-side needs `student_streaks(user_id, current, longest, last_active_date)` |
| masteryScore | derived from `lesson_progress` + `assessment_attempts` |

**Gap D** — introduce `public.student_profiles(user_id PK, study_hours_per_week int, weekly_goal_minutes int, avatar_url, headline, bio, primary_language, ...)` in Phase 8A-2 Part 2 for the server-side view of the workspace.

---

## Module 6 — Partner Profile

**Spec fields:** userId, businessName, partnerType, verificationStatus, bankStatus, taxStatus, commissionModel, performanceScore, totalRevenue, lifetimeCommission.

**Live mapping (55 columns on `partners` — full coverage):**

| Spec | Live |
|---|---|
| userId | `partners.user_id` |
| businessName | `partners.business_name` / `partner_brand_profiles.brand_name` |
| partnerType | `partners.partner_type` (individual / firm / agency) |
| verificationStatus | `partners.verification_status` + `partner_applications.status` |
| bankStatus | `partner_payout_details.verification_status` |
| taxStatus | `partners.gstin_verified`, `partners.pan_verified` |
| commissionModel | `partners.default_model` (partner_70 / partner_50) |
| performanceScore | derived — computed in `partner_referrals` + `commissions`; consider a materialized view |
| totalRevenue | derived from `commissions.gross_revenue` sum |
| lifetimeCommission | derived from `commissions.commission_amount` sum |

**No schema change** — but a `mv_partner_performance` materialized view (refresh hourly) would replace the per-request aggregate.

---

## Module 7 — White Label Client

**Spec fields:** companyName, brandName, domain, subdomain, logo, theme, status, ownerId, subscriptionPlan, storageUsed, studentCount.

**Live mapping (`brands` has 30 columns, `brand_packages` 26):**

| Spec | Live |
|---|---|
| companyName | `brands.company_name` |
| brandName | `brands.brand_name` |
| domain | `brands.custom_domain` |
| subdomain | `brands.subdomain` |
| logo | `brands.logo_url` |
| theme | `brands.theme_config jsonb` (colors, fonts, motion) |
| status | `brands.status` (draft / live / suspended) |
| ownerId | `brands.owner_user_id` |
| subscriptionPlan | `brand_packages.tier` |
| storageUsed | **GAP E** — not currently tracked; add `brands.storage_bytes bigint DEFAULT 0` + update on `content_media` insert/delete |
| studentCount | derived — count of `enrollments.brand_id = brands.id` |

**Gap E** — storage accounting. Optional and can be batch-computed by cron (`brand-storage-rollup` job).

---

## Module 8 — Program Categories

**Spec fields:** id, name, slug, description, icon, coverImage, parentCategory, displayOrder, seoTitle, metaDescription.

**Live: `course_categories` (22 columns)** — full coverage. Fields:
`id, name, slug, description, icon, cover_image_url, parent_id (self-FK), display_order, seo_title, seo_description, canonical_url, og_image_url, is_published, is_featured, ...`

No change.

---

## Module 9 — Programs

**Spec fields:** id, categoryId, title, slug, summary, description, difficulty, estimatedDuration, thumbnail, banner, visibility, featured, status, seoTitle, metaDescription, canonical.

**Live: `courses` (49 columns)** — full coverage. Renames only:

| Spec | Live |
|---|---|
| title | `name` |
| summary | `short_description` |
| description | `full_description` |
| difficulty | `level` |
| estimatedDuration | `duration` |
| thumbnail | `thumbnail_url` |
| banner | `hero_image_url` |
| visibility | `pricing_visibility` + `is_published` |
| featured | `is_featured` |
| status | `status` (enum `content_status`) |
| seoTitle | `seo_title` |
| metaDescription | `seo_description` |
| canonical | `canonical_url` |

Additional live fields: promo_video_url, is_trending/popular/bestseller, white_label_eligible, partner_sale_eligible, base_price/offer_price/currency/emi_available, seo_keywords[], og_image_url, default_revenue_rule_id, unlock_mode.

No change.

---

## Module 10 — Program Modules

**Spec:** id, programId, title, description, order, estimatedDuration, status.

**Live: `course_modules`** (12 columns) — covers all fields.
`id, course_id (programId), title, description, sort_order, duration, status, is_published, ...`

No change.

---

## Module 11 — Lessons

**Spec:** id, moduleId, title, slug, lessonType, videoUrl, pdfUrl, articleContent, duration, resources, transcript, status.

**Live: `course_lessons`** (14 columns).
`id, module_id, title, slug, lesson_type (video/pdf/article/quiz/assignment/lab), video_url, pdf_url, content, duration_minutes, transcript, status, ...`

`resources` is normalized into a separate table (see Module 12), not a JSON blob — better for querying.

No change.

---

## Module 12 — Resources

**Spec:** lessonId, resourceType, title, file, url, size.

**Live: `session_resources`** (9 columns) — for live sessions.
**Coverage gap F** — no dedicated `lesson_resources` table. Downloadables today are stored inline in `course_lessons.pdf_url` / `content_media` refs. If needed, add:
```
lesson_resources(id, lesson_id FK, resource_type, title, file_url, size_bytes, sort_order)
```
Not urgent — `content_media` already covers uploads; the FK to `lesson_id` can be added there.

---

## Module 13 — Learning Paths

**Spec:** id, title, description, difficulty, estimatedDuration, category, coverImage, status.

**Live:** learning paths and roadmaps are currently curated in `src/data/*.ts` (static content on the site: skill maps, learning journeys). No dedicated table.

**Gap G** — if we move learning paths into the CMS, unify under `content_items.type = 'roadmap'` (already exists) — no new table. Roadmap-specific structure lives in `content_items.data jsonb` (`steps`, `estimated_months`, `career`).

---

## Module 14 — Roadmaps

Same as Module 13 — covered by `content_items.type = 'roadmap'` today.

---

## Module 15 — Enrollments

**Spec:** studentId, programId, enrollmentDate, completionDate, progress, status.

**Live: `enrollments`** (26 columns) — full coverage plus revenue attribution.

| Spec | Live |
|---|---|
| studentId | `student_user_id` |
| programId | `course_id` (and legacy `program_id text`) |
| enrollmentDate | `enrolled_at` |
| completionDate | `completed_at` |
| progress | derived from `lesson_progress` |
| status | `status enrollment_status` (received / active / completed / refunded) |

Live extras: partner attribution (`partner_id`, `lead_source`), revenue (`gross_revenue`, `eligible_revenue`), ambassador attribution, LMS state (`current_module_id`, `current_lesson_id`).

No change.

---

## Module 16 — Learning Progress

**Spec:** studentId, lessonId, completed, watchTime, lastVisited, completionPercent, notesCount, bookmarkCount.

**Live: `lesson_progress`** (13 columns).

| Spec | Live |
|---|---|
| studentId | `student_user_id` |
| lessonId | `lesson_id` |
| completed | `status = 'completed'` + `completed_at` |
| watchTime | `last_position_seconds` (last position) — derive total watch from activity |
| lastVisited | `last_accessed_at` |
| completionPercent | `video_progress_pct` |
| notesCount | derived: `count(lesson_notes WHERE lesson_id = ...)` |
| bookmarkCount | derived from workspace hub (client) — server side would need a `lesson_bookmarks` table |

**Gap H** — surfacing `notesCount` / `bookmarkCount` on every progress row is a hot-path denormalization. Recommendation: keep them derived via a materialized view (`mv_learning_progress_summary`) refreshed by cron.

---

## Gap Summary (for Phase 8A-2 Part 2)

| Gap | Scope | Priority |
|---|---|---|
| A. `public.profiles` unified table | New table + trigger + RLS | **High** — pre-req for cross-module display data |
| B. Confirm `content_writer` / `seo_manager` roles | Enum audit; potential `ALTER TYPE` | Low |
| C. `user_session_events` audit table | New table | Low (nice-to-have) |
| D. `student_profiles` (study_hours, streak, mastery cache) + `student_streaks` | New tables | Medium |
| E. `brands.storage_bytes` accounting | Column add + cron rollup | Low |
| F. `lesson_resources` (or add `lesson_id` to `content_media`) | Schema tweak | Medium |
| G. Learning paths / roadmaps in CMS | Data migration into `content_items` | Low (already static) |
| H. `mv_learning_progress_summary` | Materialized view | Medium |

None of the gaps block current functionality — they formalize cross-cutting concerns for enterprise scale.

---

## Cross-Cutting Rules

1. **PK type**: `uuid` everywhere. All live tables comply.
2. **Timestamps**: `created_at`, `updated_at` on every table, `timestamptz`, UTC. Trigger `update_updated_at_column()` on every table with `updated_at`. All live tables comply.
3. **Soft delete**: `deleted_at timestamptz NULL` on `courses`, `course_lessons`, `content_items`, `blog_posts`, `content_media`, `marketing_resources`. Live tables partially comply — add where missing in Part 2.
4. **Audit columns**: `created_by`, `updated_by` on editorial + admin-mutable tables (courses ✅, content_items ✅, brands ✅, revenue_share_rules ✅).
5. **Status columns**: enum-typed where the domain is finite (`content_status`, `enrollment_status`, `commission_status`). Free-text `status` only for polymorphic module states.
6. **No FK to `profiles`**: FKs point to `auth.users(id)`. All live tables comply.
7. **No role columns on any content/profile table**: roles only in `user_roles`. All live tables comply.
8. **RLS**: mandatory on every public-schema table. Enforced by CI.

---

## Next Step

Phase 8A-2 Part 2 will run migrations to close Gaps A, D, and H (the enterprise-blocking ones). Gaps B, C, E, F, G are optional/opportunistic and can be scheduled once product signals demand them.
