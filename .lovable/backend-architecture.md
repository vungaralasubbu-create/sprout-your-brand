# Glintr Backend Architecture — Phase 8A-1

Enterprise-grade modular backend blueprint for scaling from thousands to millions of users. This document is the source of truth for how Glintr's server-side is organized; it complements (does not replace) the existing 180+ tables and server functions already shipped across Phases 1–7.

Runtime: TanStack Start on Cloudflare Workers + Supabase (Postgres, Auth, Storage, Realtime). App-internal server logic uses `createServerFn`; external callers use file routes under `src/routes/api/`.

---

## 1. Layered Architecture

```text
┌────────────────────────────────────────────────────────────┐
│  Presentation      TanStack routes, React 19, AI Elements  │
├────────────────────────────────────────────────────────────┤
│  API Layer         createServerFn (RPC) + /api/v1/* HTTP   │
├────────────────────────────────────────────────────────────┤
│  Service Modules   Auth · Users · Programs · Payments …    │
├────────────────────────────────────────────────────────────┤
│  Domain / Data     Postgres schemas · RLS · SQL functions  │
├────────────────────────────────────────────────────────────┤
│  Infra             Supabase Storage · pg_cron · pg_net     │
│                    Lovable AI Gateway · Email · Realtime   │
└────────────────────────────────────────────────────────────┘
```

Every module owns:
- one `src/lib/<module>/` folder (client-safe types + `.functions.ts`)
- one `src/lib/<module>/*.server.ts` for privileged helpers
- one namespace in Postgres (`public.<module>_*` table prefix)
- one section under `/api/v1/<module>` for external callers
- one owner in `admin_role_permissions`

---

## 2. Module Catalog

| # | Module | Prefix | Primary Tables (existing) | Consumers |
|---|--------|--------|---------------------------|-----------|
| 1 | Authentication | `auth_*` | `auth.users`, `auth_otp_codes`, `user_roles`, `admin_role_permissions`, `admin_permission_overrides` | All |
| 2 | Users | `users`, `profiles` | `profiles` (managed), `student_notification_preferences` | All |
| 3 | Students | `student_*` | `student_activity`, `student_education`, `student_skills`, `student_career_preferences`, `student_notifications`, `enrollments` | Learn, Programs, CRM |
| 4 | Partners | `partner_*`, `partners` | `partners`, `partner_applications`, `partner_brand_profiles`, `partner_leads`, `partner_referrals`, `partner_payment_submissions`, `partner_payout_details`, `partner_statements` | Earn, CRM |
| 5 | White Label | `brand_*`, `brands` | `brands`, `brand_applications`, `brand_packages`, `brand_programs`, `brand_team_members`, `brand_launch_tasks`, `brand_consultations` | Brand app |
| 6 | Campus Ambassadors | `ambassador_*`, `campus_ambassador_*` | `campus_ambassador_profiles`, `ambassador_commissions`, `ambassador_levels`, `ambassador_payouts`, `ambassador_referral_events`, `ambassador_badges` | Ambassadors |
| 7 | Programs (Courses) | `course_*`, `courses` | `courses`, `course_modules`, `course_lessons`, `course_categories`, `course_assessments`, `course_projects`, `course_faqs`, `course_skills`, `course_tools` | Learn, Programs |
| 8 | Learning Progress | `lesson_*`, `module_*`, `enrollments` | `lesson_progress`, `lesson_notes`, `module_completions`, `enrollments`, `student_assignments`, `assignment_submissions` | Student, Analytics |
| 9 | Quizzes / Assessments | `assessment_*` | `assessment_attempts`, `assessment_questions`, `course_assessments` | Programs, Certificates |
| 10 | Certificates | `certificates` | `certificates`, `course_certifications` | Programs, Verify |
| 11 | Live Sessions | `live_*`, `session_*` | `live_sessions`, `session_attendance`, `session_mentors`, `session_resources`, `session_join_events` | Programs |
| 12 | Payments | `payment_*`, `payouts` | `payment_links`, `partner_lead_payment_links`, `refund_adjustments`, `payouts`, `payout_items` | Revenue |
| 13 | Revenue Share | `commissions`, `revenue_share_rules`, `ambassador_commissions` | `commissions`, `revenue_share_rules`, `revenue_audit_logs`, `ambassador_commission_rules` | Partners, Ambassadors, Finance |
| 14 | Payouts | `partner_payment_*`, `ambassador_payout_*`, `payouts` | `partner_payment_submissions`, `ambassador_payouts`, `partner_payout_details`, `partner_statements` | Finance |
| 15 | CRM (Leads) | `partner_leads`, `brochure_leads`, `contact_enquiries`, `lead_*` | `partner_leads`, `contact_enquiries`, `lead_assignment_history`, `lead_ownership_reviews`, `round_robin_settings` | Sales |
| 16 | Marketing Assets | `marketing_resource_*` | `marketing_resources`, `marketing_resource_saves`, `marketing_resource_interactions`, `marketing_resource_issues` | Partners |
| 17 | AI Mentor | `ai_mentor_*` | `ai_mentor_conversations`, `ai_mentor_messages`, `ai_mentor_activity`, `ai_mentor_feedback`, `ai_mentor_usage` | All |
| 18 | Knowledge (Content) | `content_*`, `blog_*`, `faq_*` | `content_items`, `content_revisions`, `content_authors`, `content_media`, `content_tags`, `content_categories`, `content_analytics_events`, `content_internal_links`, `blog_posts`, `blog_categories`, `blog_topics`, `faqs`, `faq_categories` | Learn, Blog, Glossary |
| 19 | Media Library | `content_media`, `storage.objects` | `content_media`, Storage buckets | All |
| 20 | Search | (materialized views + `content_analytics_events`) | derived | Public site |
| 21 | Notifications | `*_notifications` | `student_notifications`, `ambassador_notifications`, `partner_notifications` | All |
| 22 | Analytics | `content_analytics_events`, `*_activity` | `career_activity`, `interview_activity`, `student_activity`, `partner_lead_activities`, `admin_activity_log` | Admin |
| 23 | Support | `student_support_*`, `partner_support_*` | tickets, messages, assignments, activity | Students, Partners |
| 24 | Careers / Hiring | `career_*`, `hiring_*` | `career_profiles`, `career_roles`, `hiring_roles`, `hiring_applications`, `interview_sessions` | Careers |
| 25 | Employees / HR | `employee_*`, `payroll_*`, `salary_*` | `employee_profiles`, `employee_attendance`, `employee_benefits`, `payroll_runs`, `salary_structures` | HR |
| 26 | Admin | `admin_*`, `platform_settings` | `admin_users`, `admin_activity_log`, `admin_permission_overrides`, `platform_settings` | Ops |
| 27 | Risk / Compliance | `risk_*` | `risk_flags`, `risk_flag_activity`, `risk_flag_notes`, `risk_review_settings` | Finance, Ops |

Each row above already has schema on disk; Phase 8A-1 introduces no new tables — it defines the modular contract those tables satisfy.

---

## 3. Roles & RBAC

Canonical roles (stored in `user_roles`, never on `profiles`):

- `super_admin` — full platform access
- `admin` — operations, content, finance sub-scopes via `admin_role_permissions`
- `partner` — Sales Partner (70% or 50% model)
- `wl_owner` — White-Label brand owner
- `campus_ambassador` — verified campus ambassador
- `instructor` — course/lesson author + live sessions
- `content_writer` — Learn/Blog/Glossary drafting
- `seo_manager` — SEO tooling, canonical/metadata edits
- `support_team` — student + partner support
- `student` — default authenticated user

Permission model:
- Coarse: `has_role(uid, role)` security-definer function (already deployed)
- Fine-grained: `admin_role_permissions` (role → resource → verb) + `admin_permission_overrides` (per-user grants/revokes)
- Every RLS policy uses `has_role()` or `auth.uid() = <owner_col>` — never a direct `profiles` subquery (prevents recursion)

---

## 4. API Surface

Two boundaries, one contract:

**Internal RPC** — `createServerFn` under `src/lib/<module>/<name>.functions.ts`. Zod-validated input, DTO output, authenticated via `requireSupabaseAuth`. Called from loaders, `useServerFn`, or Tanstack Query.

**External HTTP** — versioned under `src/routes/api/v1/<module>/*`.
- `/api/v1/health` — liveness (public)
- `/api/v1/version` — build metadata (public)
- `/api/v1/certificates/verify/:code` — public verification (public)
- `/api/v1/public/programs` — read-only catalog (public, cache-friendly)
- `/api/v1/public/glossary` — read-only glossary
- `/api/v1/public/blog` — read-only blog
- `/api/v1/webhooks/*` — signed webhooks (payments, providers) — always under `/api/public/webhooks/` in file layout for edge bypass
- `/api/v1/hooks/cron/*` — pg_cron callbacks, secured via anon `apikey`

Versioning rule: any breaking change ships as `/api/v2/...`. `v1` stays backward-compatible for ≥12 months after `v2` GA.

---

## 5. Data Conventions

- All tables have `id uuid default gen_random_uuid()`, `created_at`, `updated_at`, and a `BEFORE UPDATE` trigger calling `public.update_updated_at_column()`.
- Soft delete: `deleted_at timestamptz` on user-facing content (blog, learn, courses); RLS filters `deleted_at IS NULL`.
- Optimistic locking: `row_version int` where concurrent edits matter (`content_items`, `partner_brand_profiles`, `courses`).
- Audit: mutations on sensitive tables append to `admin_activity_log` or module-specific `*_activity` via triggers.
- Timestamps in UTC (`timestamptz`).
- Money in paise/cents (`bigint`), currency code alongside.

---

## 6. Background Jobs

Owned by `pg_cron` + `pg_net`, hitting `/api/public/hooks/cron/*`. Auth = anon `apikey` header (canonical pattern — never a custom `CRON_SECRET`).

| Job | Cadence | Endpoint |
|-----|---------|----------|
| Refresh search materialized views | every 15 min | `POST /api/public/hooks/cron/search-reindex` |
| Send lesson-reminder digest | daily 09:00 IST | `POST /api/public/hooks/cron/reminders-daily` |
| Aggregate ambassador leaderboard | hourly | `POST /api/public/hooks/cron/ambassador-leaderboard` |
| Content decay scan | daily 02:00 | `POST /api/public/hooks/cron/content-decay` |
| Certificate PDF backfill | every 10 min | `POST /api/public/hooks/cron/certificates-render` |
| Payout eligibility sweep | daily 03:00 | `POST /api/public/hooks/cron/payout-sweep` |
| Analytics rollup | hourly | `POST /api/public/hooks/cron/analytics-rollup` |
| Email queue drain | every 2 min | `POST /api/public/hooks/cron/email-drain` |

Long-running work (media transcoding, PDF rendering) is enqueued to a `jobs` table and drained by cron workers — no Cloudflare Worker holds a request open beyond 30 s.

---

## 7. Payments & Revenue

- **Providers**: Lovable Payments (Stripe seamless) for global digital, Razorpay-ready adapter for India-first flows.
- **Money flow**:
  1. Checkout creates `payment_links` row (idempotency-key indexed).
  2. Webhook → `/api/public/webhooks/payments/:provider` verifies signature (HMAC, timing-safe) using `supabaseAdmin` after verification.
  3. Verified charge inserts into `enrollments` + `commissions` (per `revenue_share_rules`).
  4. Nightly `payout-sweep` moves eligible commissions into `partner_payment_submissions` / `ambassador_payouts`.
  5. Every transition is journaled in `revenue_audit_logs`.
- **Revenue models**:
  - 70% Own-Lead: `revenue_share_rules.model = 'partner_70'`, requires `partner_leads.attribution = 'partner'`.
  - 50% Supported: `revenue_share_rules.model = 'partner_50'`, requires company-lead attribution + verified conversion.
  - Ambassador: `ambassador_commission_rules` layered on top (never double-counted; enforced by unique `(lead_id, model)`).

---

## 8. AI Mentor

- Conversations stored in `ai_mentor_conversations` + `ai_mentor_messages`; usage metered in `ai_mentor_usage` for cost/rate limits.
- Context bundle per turn: current lesson, current roadmap node, last N bookmarks, workspace notebook (client-side hub or server profile).
- Model routing via Lovable AI Gateway — text default `google/gemini-3.5-flash`, deep-reasoning fallback `openai/gpt-5.5`.
- Prompt-injection guardrails: strip system-token look-alikes from user content before prepending system prompt.
- Streaming via TanStack server route `/api/v1/mentor/stream` (Response streaming supported on Workers).

---

## 9. Knowledge System

Content unified under `content_items` with polymorphic `type` (`learn`, `glossary`, `blog`, `comparison`, `roadmap`, `career`, `interview`, `faq`). Related tables (`content_revisions`, `content_media`, `content_tags`, `content_internal_links`) key off `content_items.id`. Search indexes materialize from `content_items` + tags.

---

## 10. Search

- Postgres full-text (`tsvector` columns on `content_items`, `courses`, `blog_posts`, `faqs`) — `GIN` indexed.
- Optional `pg_trgm` for typo-tolerant title/slug lookups.
- Frontend hits `/api/v1/search?q=...&type=...` — server function returns unified `{ hits: [{ id, type, title, snippet, url, score }] }`.
- Analytics events (`content_analytics_events.type='search'`) feed query-log dashboards → drives gap analysis in Content Intelligence.

---

## 11. Notifications

Fan-out service with per-channel adapters:
- Email — provider-agnostic via `send_email` server helper; queued in `email_queue` (future table).
- In-app — `*_notifications` tables + Supabase Realtime subscription per user.
- Push (web) — VAPID via service worker (future).
- SMS/WhatsApp — provider stubs (future); adapter interface reserved: `sendSms({ to, template, vars })`.

User preferences respected via `student_notification_preferences` / `ambassador_notification_preferences`.

---

## 12. Media Library

- Buckets: `public-media` (public), `certificates` (private, signed URLs, 24h TTL), `partner-uploads` (private, RLS per owner), `brand-assets` (private, per-brand).
- Upload path: presigned URL via `createUploadUrl` server function → client PUT → `content_media` row on success.
- Optimization: on-upload trigger enqueues `media-processing` job for image resize variants (WebP + AVIF).

---

## 13. Security Baseline

- Every `public.*` table: RLS on, explicit GRANTs, `auth.uid()`-scoped or `has_role()`-scoped policies.
- Service role client (`supabaseAdmin`) never reachable from client — dynamic import inside handlers only.
- Bearer-token middleware attaches Supabase JWT to every server-fn call.
- Rate limits: `contact_enquiries` (5/hour/IP), AI Mentor (60 msg/hour/user via `ai_mentor_usage`), search (120 req/min/IP).
- CSRF: mutating server routes require `Origin` = same-origin, or valid bearer + Zod-validated body.
- XSS: no `dangerouslySetInnerHTML` on user content; markdown rendered via `react-markdown` with safe defaults.
- Input validation: Zod on every server-fn `inputValidator` and every `/api/v1` handler.
- Secrets: `LOVABLE_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, webhook signing secrets — all server-only.
- Audit log: `admin_activity_log` for every admin mutation; retention 24 months.

---

## 14. Observability

- Request logs: TanStack server routes tagged with `x-request-id` (generated per request; propagated to Supabase RPC calls via a `request_id` GUC).
- Error tracking: server-fn wrapper logs `{ requestId, userId, module, error }`.
- Performance: Web Vitals reported to `/api/v1/telemetry/vitals` (rate-limited, anonymized).
- AI cost: `ai_mentor_usage.tokens_in/out/cost` per turn.

---

## 15. Backups & DR

- Supabase point-in-time recovery (7 days by default; extend on production).
- Weekly logical backup of critical tables (`courses`, `enrollments`, `commissions`, `content_items`) exported to `certificates` bucket via cron (encrypted).
- Storage buckets versioned (`content_media.version`); deletes are soft (`deleted_at`) with 30-day purge job.
- Runbook lives at `.lovable/runbooks/dr.md` (future).

---

## 16. Folder Layout (canonical)

```text
src/
  lib/
    auth/                  # session helpers, role guards
    users/                 # profiles, preferences
    students/
    partners/
    ambassadors/
    brands/                # white-label
    programs/              # courses, modules, lessons
    progress/              # enrollments, lesson_progress
    assessments/           # quizzes, attempts
    certificates/
    live/                  # live_sessions
    payments/
    revenue/               # revenue_share_rules, commissions
    payouts/
    crm/                   # leads, opportunities
    marketing/
    mentor/                # AI Mentor
    knowledge/             # content_items unified
    media/
    search/
    notifications/
    analytics/
    support/
    careers/
    hr/
    admin/
    risk/
  routes/
    api/
      v1/
        health.ts
        version.ts
        certificates.verify.$code.ts
        public/
          programs.ts
          glossary.ts
          blog.ts
      public/
        webhooks/
          payments.$provider.ts
        hooks/
          cron.$job.ts
```

Every module file follows the same trio: `types.ts` (client-safe), `<module>.functions.ts` (server fns), `<module>.server.ts` (privileged helpers).

---

## 17. Scaling Posture

- Workers: stateless — no in-memory caches; use Postgres or Supabase KV.
- DB: read-heavy paths (programs, glossary, blog) served from materialized views refreshed by cron; write paths keep transactions <200 ms.
- N+1 avoidance: every list endpoint hydrates related data in a single SQL round-trip.
- Sharding readiness: all user-scoped tables carry `user_id`; brand-scoped carry `brand_id`. Future hot tables can partition by `created_at` month.
- CDN: static assets + `/api/v1/public/*` cached at Cloudflare edge with `s-maxage` + `stale-while-revalidate`.

---

## 18. What Phase 8A-1 Ships Now

Code delivered this phase (non-invasive — no existing UI or feature touched):

1. `/api/v1/health` — liveness probe returning `{ status, ts, version, region }`.
2. `/api/v1/version` — build metadata for the deployed commit.
3. `/api/v1/certificates/verify/$code` — public certificate verification (looks up `certificates` by public code).
4. This architecture document as the module contract.

Later 8A-x phases will progressively:
- Extract inline server functions into their module folders.
- Add `email_queue`, `jobs`, and `search_index` materialized views.
- Publish OpenAPI (JSON) for `/api/v1/*`.
- Register cron endpoints and roll off ad-hoc timers.

No schema migrations run this phase — the existing 180+ tables already cover every module above. Migrations resume when a module's contract requires a new column (row_version, deleted_at) or a new table (email_queue, jobs).
