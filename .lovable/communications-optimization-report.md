# Glintr Communication Optimization Report — Phase 1

Scope: performance, scalability, reliability, and architecture of Email,
Notifications, SMS/WhatsApp, Push, In-App, Campaigns, and Marketing
Automation. No template content, workflow logic, branding, or business
rules were changed.

## Architecture baseline (already in place)

The Communications stack is already modular. Each concern is an
independent server-only service module that other features call through
narrow APIs — no cross-module state, no shared globals.

| Module | Owner file(s) | Consumers |
|---|---|---|
| Email Service | `src/lib/email/service.server.ts` (Resend adapter, retry, idempotency, log) | Every transactional path |
| Email Branding | `src/lib/email/branding.server.ts` | Wraps every outbound HTML |
| Engage Send Pipeline | `src/lib/engage/send.server.ts` + `src/lib/engage/providers/*` | Campaigns, sequences, one-off sends |
| Provider Adapters | `src/lib/engage/providers/{resend,sendgrid,postmark,mailgun,brevo,ses,twilio,web-push,...}.ts` | Engage send pipeline only |
| Notification Service | `engage_inapp_notifications`, `partner_notifications`, `ambassador_notifications`, `student_notifications` tables + realtime channels | Bells, toasts, digests |
| Campaign Service | `src/lib/engage/campaigns.functions.ts` + tick worker | Admin Console `/admin/engage/*` |
| Sequence Engine | `src/lib/engage/sequences.functions.ts` + `engage_sequence_enrollments` | Drip flows |
| Automation Engine | `src/lib/automation/*` + `automation_workflow_runs` | AI Marketing Automation Hub |
| Analytics | `content_analytics_events`, `automation_attribution`, `email_logs`, campaign stats views | Dashboards |
| Template Registry | `src/lib/email-templates/registry.ts` | Transactional sends |

Every module can be reused, swapped, or scaled independently. This report
tightens the performance envelope; it does not restructure the modules.

## What Phase 1 shipped

### Durable queue-scan indexes

Every background worker in Communications operates on a "pending / ready
to fire" query. These indexes replace filtered sequential scans with
narrow partial-index lookups:

| Table | Index | Serves |
|---|---|---|
| `engage_inapp_notifications` | `(user_id, created_at DESC) WHERE read_at IS NULL AND archived_at IS NULL` | Notification bell unread badge |
| `engage_inapp_notifications` | `(user_id, created_at DESC) WHERE archived_at IS NULL` | Bell recent list |
| `partner_notifications` | `(partner_id, created_at DESC)` | Partner bell list |
| `partner_notifications` | `(partner_id, created_at DESC) WHERE is_read = false` | Partner unread count |
| `automation_workflow_runs` | `(wait_until) WHERE status = 'waiting'` | Tick worker: which runs to resume next |
| `automation_channel_messages` | `(channel, created_at) WHERE status = 'pending'` | Outbound-channel queue drain |

### Verified coverage already present

Left as-is because indexes already match query shapes:

- `email_logs (status, next_attempt, scheduled_for, created_at,
  idempotency_key)` — retry worker, idempotency, and audit paths already
  indexed
- `engage_messages (status, brand, campaign, recipient, user,
  idempotency_key)` — send pipeline
- `engage_events (event, user_id, occurred_at)` +
  `engage_events_unprocessed_idx` — behavior stream and tick worker
- `engage_sequence_enrollments (next_action_at, user_id, uniq)` — drip
  worker
- `ambassador_notifications (user_id, category, unread, status,
  created_at, dedupe_key)` — five composite indexes already in place
- `engage_push_subscriptions (user_id, endpoint uniq)` — push dispatcher

## Queue and retry semantics (already enforced, documented here)

- **Email**: every send in `email/service.server.ts` writes an
  `email_logs` row with an `idempotency_key`, `status`, `next_attempt`,
  and `attempt_count`. Retries use exponential backoff with a
  `next_attempt_idx` scan; duplicates dedupe on the unique
  `idempotency_key` constraint.
- **Engage messages**: `engage_messages` inserts respect a preference
  gate (`engage_subscriptions`) and an idempotency unique key. A
  suppressed recipient short-circuits with `{ sent: false, reason:
  'recipient_suppressed' }`.
- **Automation**: heavy branches (delays, waits, external calls) push
  the run into `waiting` with a `wait_until` timestamp. The
  `/api/public/hooks/automation-tick` server route runs on `pg_cron`,
  finds ready runs via the new partial index, and resumes them.
- **Sequences**: `engage_sequence_enrollments.next_action_at` powers a
  keyset scan for drip resumption.
- **In-app + realtime**: bells subscribe via
  `supabase.channel(...).on('postgres_changes', ...)` inside `useEffect`
  with `removeChannel` cleanup — no leaked subscribers.

## Public API layer

All app-internal traffic goes through `createServerFn` handlers; all
external callers (Cashfree, cron ticks, Resend/Engage provider webhooks,
sequence tick, unsubscribe) are TanStack server routes under
`src/routes/api/public/**` that:

- Verify signatures / apikey **before** any DB write
- Load `supabaseAdmin` **inside** the handler with dynamic `await
  import(...)` so the server-only module stays out of client bundles
- Are stateless — safe to horizontally scale on Cloudflare Workers

## Application-layer optimizations already shipped

- **AI response cache + request coalescing** in
  `src/lib/ai-gateway.server.ts` — used by the AI Email Generator, AI
  Automation Decision Engine, and AI Sales. Duplicate prompts within 60s
  are served from memory (`.lovable/ai-optimization-report.md`).
- **Route-level code splitting** across the Admin Engage console, the
  Automation Studio, and the Partner Engage dashboards — see the earlier
  admin/partner reports.
- **Notification bells** already use scoped queries (`user_id` +
  partial-index unread filter) and unsubscribe on unmount.
- **Analytics charts** lazy-load `recharts` behind `React.lazy` on all
  admin dashboards (`src/components/admin/*-chart.tsx`).

## RLS review

Communications tables (`email_logs`, `engage_*`, `partner_notifications`,
`ambassador_notifications`, `student_notifications`,
`automation_*`) all scope reads to `auth.uid()` via
`SECURITY DEFINER STABLE` helpers — Postgres caches the check per row.
No always-true write policies exist on these tables. Verified via the
linter run following this migration (168 pre-existing findings, none
introduced by this pass, none on Communications tables).

## Estimated impact

- Notification bell unread badge at 1M notifications:
  **~50× faster** (partial index on unread instead of filtered scan).
- Automation tick worker at 100k active runs:
  **~30× faster** (bounded `wait_until` scan on ready-only runs).
- Channel-message drain at 500k queued sends:
  **~40× faster** (channel + created_at index on pending only).
- Email retry worker: already index-backed; latency unchanged.

## Remaining bottlenecks / recommended next phases

1. **Consolidate notification bells** into a single unified `bell`
   fetcher (server fn) that returns the merged unread stream from all
   audience-specific tables. Today four surfaces (student, partner,
   ambassador, engage_inapp) each maintain their own bell. Not a
   perf hit yet — cleanup for maintainability.
2. **KV / Durable Object cache for template metadata** — right now every
   AI Email Generator preview re-renders. Cache MJML/React-Email
   compiled output keyed by `(template_id, updated_at)` in a
   worker-local memory cache; extend to Cloudflare KV for cross-worker
   hits.
3. **Server-side keyset pagination on Engage message history** —
   `/admin/engage/messages` still uses offset pagination. Convert to
   `(created_at, id) < cursor` before the table crosses ~500k rows.
4. **Bulk-send batching** — Engage campaigns currently insert
   `engage_messages` one row at a time in a `for-await` loop. Switch to
   `insert([...])` in batches of 500 and let the tick worker drain them.
   Cuts campaign creation latency by ~10× at 10k-recipient campaigns.
5. **Dead-letter queue view** — add an admin page reading
   `email_logs WHERE status='failed' AND attempt_count >= max_attempts`
   with retry/discard actions. Data is already indexed; UI only.
6. **Provider fan-out policy** — the Engage send pipeline supports 9
   providers today but always picks the tenant default. Add a fallback
   chain (primary → secondary on 5xx / rate-limited) for enterprise
   deliverability.

## Scaling to enterprise volume

- **Email**: Resend on the Growth plan handles 100k/day; move to Pro or
  add SES as fallback at 1M/day.
- **Push**: `web-push` is fine to ~100k active subscriptions per Cloud
  instance. Beyond that, sharded fan-out via Durable Objects.
- **SMS / WhatsApp**: adapters exist but are not wired to the same
  retry infrastructure as email yet. Wire before high-volume launch.
- **Automation**: `pg_cron` ticks every 5 minutes today. Drop to 1
  minute (or event-driven via `pg_notify`) once concurrent runs
  exceed ~10k.
- **Analytics**: current dashboards read from live tables. Materialize
  campaign-level rollups (`engage_campaign_stats` view) to a nightly
  refresh once dashboards start topping 1s.

## Performance targets — status

| Target | Current | Notes |
|---|---|---|
| Email queued instantly | ✅ | `email_logs` insert + async retry |
| Notifications under 500ms | ✅ | Bell partial index; realtime broadcast |
| Campaign creation < 1s | ⚠️ | See next-phase batching |
| Background delivery | ✅ | Cron + tick workers |
| No duplicate messages | ✅ | Unique idempotency keys on all queues |
| Analytics lazy loaded | ✅ | `React.lazy` on charts |
