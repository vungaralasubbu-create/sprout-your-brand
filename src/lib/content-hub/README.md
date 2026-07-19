# Enterprise AI Content Hub

Backend-only additive module. No existing UI, route, auth or payment logic was
changed. All AI text generation flows through the centralized AI Router
(`src/lib/ai-gateway.server.ts` → `src/lib/ai/router/failover.server.ts` →
OpenAI native adapter). Lovable AI is not used.

## Files created

- `src/lib/content-hub/types.ts` — taxonomy (25 content types, 7 statuses, 16
  AI assistant actions, 6 supported languages, 7 relation targets).
- `src/lib/content-hub/prompts.server.ts` — prompt catalog for the AI Content
  Assistant.
- `src/lib/content-hub/relationship-engine.server.ts` — rebuilds the
  `content_relations` graph from arrays + tag siblings.
- `src/lib/content-hub/hub.functions.ts` — 15 `createServerFn` endpoints:
  `runContentAssistant`, `searchContentHub`, `acquireContentLock`,
  `releaseContentLock`, `upsertCalendarEntry`, `listCalendar`,
  `deleteCalendarEntry`, `rebuildContentRelations`, `addContentRelation`,
  `listContentRelations`, `registerTranslation`, `listTranslations`,
  `transitionContentStatus`, `recordContentEvent`, `getAuthorDashboard`.
- `src/lib/content-hub/README.md` — this document.

## Files modified

- `src/lib/admin/content.functions.ts` — strip the new non-serializable
  `search_tsv` column from `getContent` responses and revision snapshots
  (surface-level compatibility fix; no business-logic change).
- `src/lib/admin/ai-factory.functions.ts` — strip `search_tsv` from
  `loadFactoryDraft` return payload.

## Database schema (additive migration)

New enum values on `content_type`:
`blog_article, technology_guide, interview_questions, project, mini_tutorial,
course_guide, salary_guide, company_hiring_guide, certification_guide,
industry_news, ai_trend, success_story, case_study, tool_review, student_story`.

New enum value on `content_status`: `rejected`.

New columns on `content_items`: `language, subcategory, difficulty,
target_audience, related_course_ids, related_career_ids, related_project_ids,
related_content_ids, related_certification_slugs, secondary_keywords,
robots_directives, twitter_card, twitter_title, twitter_description,
twitter_image, breadcrumb, editor_blocks, hero_video_url, media_gallery,
downloads, review_due_at, refresh_due_at, expires_at, rejection_reason,
locale_group_id, seo_score, ai_generated, search_tsv` + GIN + partial indexes.

New tables:

| Table                       | Purpose                                          |
| --------------------------- | ------------------------------------------------ |
| `content_locks`             | Edit locking with 15-minute default TTL          |
| `content_schedule`          | Editorial calendar / review / refresh reminders  |
| `content_relations`         | Graph edges to courses, careers, projects, etc.  |
| `content_translations`      | Language variant architecture (no auto-translate)|
| `content_ai_assist_jobs`    | Log of every AI assistant call and its output    |

Triggers: `search_tsv` auto-populates on insert/update; `updated_at` triggers
on the new tables.

## CMS architecture

The existing tables `content_items`, `content_revisions`, `content_comments`,
`content_media`, `content_authors`, `content_categories`, `content_tags` and
`content_internal_links` remain the source of truth. This module layers on:

1. **Workflow** — `transitionContentStatus` enforces the finite-state machine
   `draft → in_review → approved → scheduled → published → archived` (plus
   `rejected`) with explicit legal transitions. Auto-timestamps
   `published_at`, `archived_at`, `scheduled_for`.
2. **Version history** — the pre-existing `content_revisions` table plus the
   snapshot logic in `admin/content.functions.ts`.
3. **Content locking** — `content_locks` with `acquire`/`release` server
   functions. Expired locks are cleaned on acquisition attempts.
4. **Publishing calendar** — `content_schedule` supports one-off publishes,
   recurring reviews, refresh reminders and expiry reminders.

## Publishing workflow

    draft ──▶ in_review ──▶ approved ──▶ scheduled ──▶ published ──▶ archived
                │                                            ▲
                └─▶ rejected ──▶ draft ──────────────────────┘

Only the transitions in `VALID_TRANSITIONS` inside `hub.functions.ts` are
accepted. `transitionContentStatus` runs under `requireSupabaseAuth` and RLS,
so authors can only advance their own content; editors/admins can operate on
any row via the existing content-admin policies.

## SEO architecture

Every article now carries the enterprise SEO surface required by the brief:
`seo_title`, `seo_description`, `canonical_url`, `robots_directives`,
`focus_topic`, `secondary_keywords`, `og_image`, `twitter_card`,
`twitter_title`, `twitter_description`, `twitter_image`, `schema_type`,
`breadcrumb` and `language`. These fields are consumed by the existing SEO
Engine (`src/lib/seo/`) that produces `<head>` metadata, JSON-LD and sitemap
entries — no changes needed to that engine.

The `search_tsv` column is a weighted `tsvector` (`title A, summary B,
focus_topic B, tags C, body D`) refreshed by trigger, powering full-text and
faceted search via `searchContentHub`.

## Content relationship architecture

`content_relations` is an explicit graph. Sources are always
`content_items.id`. Targets can be:
- another `content_items` row (blog ↔ blog, blog ↔ roadmap, ...)
- a `courses` row
- a `career_roles` row
- an `internship_projects` / `course_projects` row
- a certification (by slug)
- a company or `success_stories` row.

`rebuildContentRelations` regenerates all `auto_generated = true` rows for a
given source from its `related_*_ids` columns and its tag siblings (top 10
published items sharing tags, weighted by shared-tag count). Editor-authored
relations (`auto_generated = false`) are preserved.

## AI Content Assistant

`runContentAssistant` accepts any of the 16 actions defined in
`AI_ASSIST_ACTIONS`. Free-form actions (rewrite, expand, simplify,
readability, SEO, summary, conclusion, table) return Markdown; structured
actions (FAQ, CTA, internal links, external refs, meta, schema, image
prompts, video topics) return JSON parsed by `safeParseAiJson`. Every call
writes a row to `content_ai_assist_jobs` (pending → running → succeeded |
failed) with the prompt inputs, output and token cost fields for later
observability. All requests go through `aiChat` → central AI Router → OpenAI
native adapter.

## Analytics

`recordContentEvent` writes to the existing `content_analytics_events` table
(view, scroll_25/50/75/100, share, download, cta_click, course_click,
lead_submit). `getAuthorDashboard` aggregates counts per author for
Draft / In Review / Scheduled / Published, plus recent items, top-viewed
content and total AI assist jobs consumed.

## Multi-language

`content_translations` groups language variants under a shared
`locale_group_id`. `registerTranslation` creates or reuses a group and
stamps the source article. No content is auto-translated — this is purely
the architecture required to plug in translators later.

## Guarantees

- **No UI redesigned.** Only added files under `src/lib/content-hub/`.
- **No existing backend logic changed.** Two content admin functions
  received a one-line filter to drop the new `search_tsv` column from
  their return payloads; behavior is unchanged.
- **No auth or payment logic changed.**
- **No existing features removed or modified.**
- **All AI generation uses the centralized AI Router / OpenAI.**
- **No Lovable AI runtime was used.**
