# AI Marketing Automation Engine

Glintr already has a marketing spine ("Glintr Engage") with campaigns, sequences, templates, segments, providers, senders, in-app + push, and AI generations. This plan turns it into a full **AI Marketing Automation Engine** by adding a behavior event stream, an AI decision layer, a visual workflow builder, multi-channel dispatch (WhatsApp/SMS added), attribution reporting, and per-brand white-label isolation.

Nothing existing is thrown away — every new module composes with `engage_*` tables and the centralized email service.

---

## What we're adding (on top of what exists)

1. **Behavior tracking layer** — one event stream powering AI + workflows.
2. **AI Decision Engine** — picks the next-best campaign per user.
3. **Visual Workflow Builder** — drag-and-drop triggers → conditions → actions → delays → branches → goals.
4. **Multi-channel dispatch** — Email, In-App, Push (existing) + WhatsApp, SMS (new adapters, plug-and-play interface).
5. **AI Content Studio** — generate subject lines, email/SMS/WhatsApp/push copy, captions, recommendation blocks.
6. **Attribution & ROI reporting** — enrollments and revenue tied back to campaigns.
7. **White-label isolation** — brand-scoped campaigns, templates, senders, domains, colors, analytics.
8. **Scheduled worker** — one cron entry drives the whole engine (event scoring, workflow ticks, campaign dispatch).

---

## Technical section

### 1. Database (single migration)

New tables (all with `brand_id nullable` for white-label scoping, RLS, GRANTs, timestamps):

- `automation_events` — unified behavior stream: `user_id`, `brand_id`, `event_name` (`signup|login|logout|page_view|course_view|wishlist_add|cart_add|payment|certificate_earned|internship_apply|workshop_register|inactive`), `properties jsonb`, `session_id`, `device`, `location`, `utm jsonb`, `occurred_at`.
- `automation_user_profiles` — rolling per-user aggregates: `last_active_at`, `total_course_views`, `top_interests jsonb`, `lead_source`, `referral_source`, `lifetime_revenue`, `engagement_score int`, `ai_segment_labels text[]`, `next_best_action jsonb`.
- `automation_workflows` — visual workflow definitions: `name`, `brand_id`, `status`, `trigger jsonb` (event or schedule), `graph jsonb` (nodes/edges), `goal jsonb`, `stats jsonb`.
- `automation_workflow_runs` — per-user execution state: `workflow_id`, `user_id`, `current_node_id`, `wait_until`, `status` (`running|completed|goal_met|exited`), `context jsonb`, `history jsonb`.
- `automation_recommendations` — AI-generated per-user next-course/internship/program suggestions with `reason`, `score`, `expires_at`.
- `automation_channel_messages` — unified log for WhatsApp/SMS sends (email/push already tracked in `email_logs` + `engage_messages`).
- `automation_attribution` — links `automation_events` of type `enrollment|payment` to originating `workflow_run_id` / `campaign_id` for ROI math.

`app_role` policies: super_admin sees all; brand_owner/partner sees own `brand_id`; end users see only their own rows on read-appropriate tables.

### 2. Server-side engine

New client-safe function modules (`src/lib/automation/*.functions.ts`) + server-only helpers (`*.server.ts`):

- `track.functions.ts` → `trackEvent({ event, properties })` — RLS-scoped write with `requireSupabaseAuth`, plus public endpoint for anonymous website events.
- `profile.server.ts` — pure functions rolling events into `automation_user_profiles`.
- `decision.server.ts` — AI decision engine. Uses `google/gemini-3.5-flash` via Lovable AI Gateway to score candidate actions from a rule catalog (signed-up-never-logged-in, viewed-N-times, completed-course, inactive-30d, partner-no-sales-15d, brand-no-website, etc.) and writes to `automation_recommendations` + `next_best_action`.
- `workflows.server.ts` — executor: given a `workflow_run`, walk `graph.nodes` (Trigger / Condition / Delay / Action / Branch / Goal). Actions dispatch to channel adapters. `Delay` sets `wait_until` and returns; the tick worker resumes.
- `channels/` — pluggable adapters exposing a common `dispatch({ userId, brandId, payload })`:
  - `email.ts` → existing `sendEmail` (branded shell already applied).
  - `push.ts` / `inapp.ts` → existing Engage paths.
  - `whatsapp.ts` — connector-gateway adapter (WhatsApp Cloud / provider TBD via `standard_connectors--connect` when the user links one; interface ready today with a graceful "not configured" state).
  - `sms.ts` — same shape, provider-agnostic.
- `ai/content.functions.ts` — generate subject lines, email/SMS/WhatsApp/push copy, captions, recommendation blocks (Lovable AI).

### 3. Cron / worker (single entry, no duplication)

One public route `src/routes/api/public/hooks/automation-tick.ts` handles:
1. Roll new `automation_events` into profiles.
2. Advance `automation_workflow_runs` whose `wait_until <= now()`.
3. Enqueue scheduled campaigns.
4. Refresh top-of-funnel AI recommendations for active users.

One `pg_cron` job (every 5 min) calls it. No new secrets required.

### 4. Visual Workflow Builder UI

`/admin/automation` and `/brand/automation` — same component, brand-scoped by route:
- Canvas built on `@xyflow/react` (already common in this codebase pattern for graph UIs; installed if missing).
- Node palette: Trigger, Condition, Delay, Send (Email/WhatsApp/SMS/Push/In-App), Branch (If/Else), Notify Partner, Wait for Goal, Exit.
- Inline AI writer for each Send node using `ai/content.functions.ts`.
- Live "test with user" preview.

### 5. Reporting dashboard

`/admin/automation/reports` (super admin) and `/brand/automation/reports` (brand):
- Open rate, click rate, conversion rate, revenue, enrollments, campaign ROI.
- Top campaigns, inactive users, most engaged users.
- Aggregations run via Supabase RPCs off `automation_events` + `automation_attribution` + `email_logs`.

### 6. White-label

Everything keys off `brand_id`. Brand Owner routes never see other brands' rows (RLS). Uses existing `email_brand_settings` for senders/logos/colors and `email_partner_logos` for logo strips.

### 7. Behavior tracking hooks

- Client util `src/lib/automation/track.ts` — `trackEvent()` fired from: signup/login/logout flows, program cards, course viewer, wishlist/cart, payment success, certificate issue, internship apply, workshop registration.
- Passive collector for `device` (UA), `location` (accept-language / IP-region best-effort server side), UTM params on landing.

### 8. Files created (high level)

```text
supabase migration (7 tables, RLS, GRANTs, triggers, seed rule catalog)
src/lib/automation/
  track.functions.ts
  track.ts                     # client
  profile.server.ts
  decision.server.ts
  workflows.functions.ts
  workflows.server.ts
  ai/content.functions.ts
  channels/{email,push,inapp,whatsapp,sms}.ts
  channels/index.ts            # registry + plug-and-play interface
src/routes/api/public/hooks/automation-tick.ts
src/routes/_authenticated/admin/automation/
  index.tsx                    # workflow list
  builder.$id.tsx              # visual builder
  reports.tsx
  recommendations.tsx
  events.tsx                   # live event stream (debug + audit)
src/routes/_authenticated/brand/automation/
  index.tsx / builder.$id.tsx / reports.tsx
src/components/automation/
  workflow-canvas.tsx
  node-palette.tsx
  node-inspector.tsx
  ai-writer-inline.tsx
  channel-badge.tsx
  metric-cards.tsx
```

Nav entries added to Admin, Brand, Partner shells.

### 9. What ships in this pass

All of the above except **WhatsApp / SMS live providers** — adapters and UI ship, but they show a "Connect provider" empty state until the user links a WhatsApp Business or SMS connector. Every other channel (Email, Push, In-App) works end-to-end on the first turn.

### 10. What is intentionally NOT changed

- Existing `engage_*` tables — kept as-is; new tables sit alongside.
- Existing centralized `sendEmail` + branded shell.
- Auth / roles.
- Homepage / marketing site.

---

## Rollout order in a single build

1. Migration + seed rule catalog.
2. Server engine (`track` → `profile` → `decision` → `workflows` + channel adapters).
3. Cron worker route + `pg_cron` schedule.
4. Client `trackEvent` + wire into key user flows.
5. Admin + Brand builder UI, reports, recommendations.
6. Verify with a build + one seeded workflow ("Signup → Wait 2d → If not verified → Reminder → Wait 3d → Offer coupon → Notify partner").
