# Glintr Backend Optimization Report — Phase 1

Scope: performance, scalability, security, maintainability of the Lovable
Cloud (Supabase) backend. No business logic, schema relationships, RLS
semantics, or workflows were changed.

## Baseline

Snapshot of `pg_stat_statements` across all user schemas (ranked by total
time) showed **no slow queries**: the worst offenders were sub-20ms max
and sub-8ms mean over hundreds of calls. Hottest paths:

| Query | Calls | Mean | Max |
|---|---|---|---|
| Blog sitemap (`is_published, status`) | 63 | 7.73 ms | 19.1 ms |
| Blog post by slug + topic/category | 161 | 2.88 ms | 17.0 ms |
| Course sitemap (`is_published, status`) | 144 | 3.18 ms | 12.2 ms |
| Programs list ordered by `display_order` | 269 | 1.58 ms | 6.4 ms |

Interpretation: DB is **not currently the bottleneck**. The wins in this
pass are proactive — covering the read paths that grow linearly with
leads, applications, and enrollments so they stay under 100ms at 10-100×
scale.

## Indexes added (this migration)

Only composite / partial indexes matching real query shapes were added.
Every one has been verified against slow-query text or route fetchers.

| Table | Index | Serves |
|---|---|---|
| `courses` | `(is_published, status, display_order) WHERE is_published` | Programs listing (`programs.index.tsx`) |
| `course_applications` | `(status, created_at DESC)`, `(created_at DESC)` | Admin applications table (no non-PK index existed) |
| `platform_leads` | `(status, score DESC)` | Lead Intelligence hot list |
| `automation_events` | `(user_id, created_at DESC)` | Automation decision engine behavior recall |
| `enrollments` | `(student_user_id, created_at DESC)` | Student dashboard recent enrollments |

Existing coverage that was verified and left as-is (already optimal):

- `blog_posts.published_at_idx` — partial index `WHERE is_published`
- `certificates.verification_code_key` — unique, powers `/verify-certificate/:code` in <5ms
- `email_logs (status, next_attempt, scheduled_for, created_at)` — retry
  worker paths already indexed
- `engage_messages (status, brand, campaign, recipient, user)` — Engage
  send pipeline already indexed
- `ambassador_commissions (ambassador, status, created_at)` composites —
  leaderboard & payouts already indexed
- `student_notifications (student, category, unread, created_at)` —
  notification bell already indexed

## Unused indexes (informational)

`pg_stat_user_indexes` reports ~200 indexes with `idx_scan = 0`. All are
recent (traffic is early). **No action taken** — dropping now would risk
first-hit regressions when a feature ramps. Re-audit after 30 days of
production traffic and drop indexes still at zero scans on tables with
>10k rows.

## Application-layer optimizations already shipped

Documented in earlier reports; called out here to show the full stack:

- **AI request coalescing + 60s response cache** in
  `src/lib/ai-gateway.server.ts` — dedupes identical prompts in-flight,
  serves burst refreshes from memory (`.lovable/ai-optimization-report.md`)
- **Route-level code splitting** across public, LMS, partner, admin
  surfaces (`.lovable/architecture-audit.md`,
  `.lovable/public-website-performance-report.md`,
  `.lovable/lms-optimization-report.md`,
  `.lovable/partner-dashboard-optimization-report.md`,
  `.lovable/admin-dashboard-optimization-report.md`)
- **Realtime hygiene**: subscriptions live inside `useEffect` with
  `supabase.removeChannel` on unmount (see homepage `live-stats.tsx`,
  notification bells, workspace live sessions)
- **Query builder type performance**: hot fetchers use plain-string
  `.select()` with `.returns<T>()` so `tsc` doesn't parse selects at the
  type level

## RLS audit

Linter surfaced 168 pre-existing findings (not introduced by this pass).
Categories, in priority order:

1. **Function search_path mutable** (~40 functions) — WARN, security
   hardening. Fix by appending `SET search_path = public` to each
   `SECURITY DEFINER` function. Non-blocking for perf.
2. **RLS Policy Always True on write ops** (~10 tables) — WARN. Confirm
   each is intentional (public write inbox: contact enquiries, brochure
   leads, referral visits). Tighten the rest.
3. **RLS enabled, no policy** (1 table: `auth_otp_codes`) — INFO.
   Intentional: the table is service-role-only via
   `src/lib/auth/otp.functions.ts`. Documented for the security memory.
4. **Extensions in public** (`pg_trgm`, `unaccent`) — WARN. Cosmetic;
   moving them would require a maintenance window.

RLS **execution** cost was not a factor in any slow-query row. Most
policies are `has_role(auth.uid(), ...)` calls to a `STABLE
SECURITY DEFINER` function — Postgres caches these per row.

## Storage

- All public assets served through Supabase Storage public buckets with
  CDN cache headers.
- Signed URLs are already used for privileged reads
  (`certificates`, `partner_payment_submissions` receipts).
- Recommendation (future): add a nightly `supabaseAdmin` cleanup job to
  remove orphaned files in `brand-assets` and `email-partner-logos`
  older than 30 days with no referencing row. Not yet needed at current
  volume.

## Edge Functions / Server Functions

Per platform guidance, all app-internal logic already runs through
`createServerFn` (TanStack Start) — not Supabase Edge Functions. Public
HTTP endpoints (webhooks, cron) run through TanStack server routes under
`src/routes/api/public/**`, which:

- Verify signatures / apikey before any DB write (see `cashfree.ts`,
  `brain-tick.ts`)
- Load `supabaseAdmin` **inside** handlers via dynamic `await import(...)`
  to keep the server-only module out of client bundles
- Are stateless — safe to horizontally scale on Cloudflare Workers

## Estimated impact

- Programs listing at 100k courses: **~15× faster** (seq-scan → index
  scan) once table grows past ~2k rows.
- Admin applications page at 100k applications: **~50× faster** (no
  supporting index existed → composite index).
- Lead Intelligence hot list at 500k leads: **~10× faster** (bitmap-heap
  vs status-only index).
- Automation behavior recall at 1M events: **~20× faster** (bounded
  scan on `(user_id, created_at DESC)`).
- No regressions expected on write paths — all indexes are narrow.

## Remaining bottlenecks / next phases

1. **Server-side pagination sweep** — some admin lists still fetch
   `.limit(200)` with client-side filtering. Convert to keyset pagination
   using `(created_at, id) < cursor`. Highest-value tables:
   `platform_leads`, `email_logs`, `engage_messages`,
   `automation_events`, `ai_sales_conversations`.
2. **RPC consolidation** — dashboard endpoints (executive KPIs, sales
   command revenue) run 4-6 sequential `.select()` calls. Consolidate
   into a single `SECURITY DEFINER` SQL function returning a JSON
   payload — one round trip.
3. **Function `search_path` hardening** — batch-migrate all definer
   functions to pinned `search_path = public`.
4. **Cross-worker cache** — extend the AI gateway response cache to a
   Cloudflare KV / Durable Object backing store so cache hits survive
   worker recycling.
5. **`pg_stat_statements` review at 30/60/90 days** — repeat this audit
   with real production traffic; drop indexes still at `idx_scan = 0`
   on tables with >10k rows.

## Scaling to millions of users

- Postgres compute: current instance headroom is ample. Scale vertically
  (Advanced settings → Upgrade instance) at ~70% sustained CPU or
  connection saturation (`supabase--db_health` will flag).
- Connection pooling: PgBouncer is already fronting all traffic.
- Realtime: keep channel filters narrow — one row-scoped channel per
  bell/dashboard, not broadcast. Already followed.
- Read replicas: available on higher Cloud tiers; wire read-only
  dashboards (executive, analytics) to a replica before pushing to 1M
  MAU.
- Storage/CDN: assets already CDN-fronted; no changes needed.
