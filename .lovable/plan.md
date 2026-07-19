# Glintr Engage — Email Marketing & Notification Center

A single Marketing Automation Engine powering emails, push, and in-app notifications across the public site, Student LMS, Partner, Brand Owner, Instructor, Admin, and White-Label surfaces. One reusable infrastructure, no duplicate code.

The default sending path is Lovable Emails (managed sender, DKIM/SPF/DMARC and unsubscribe handled for us). Third-party ESPs (Resend, SendGrid, SES, Mailgun, Postmark, Brevo, SMTP, Gmail SMTP, Outlook SMTP) plug in as optional providers per tenant.

## Architecture

```text
                 ┌────────────────────────────────────────────┐
                 │        Glintr Engage Core (server)         │
                 │                                            │
  event/trigger ─┤  1. Event bus (server fns emit events)     │
                 │  2. Rules engine (segments + sequences)    │
                 │  3. Template renderer (React Email + MJML) │
                 │  4. Dispatcher (provider adapters)         │
                 │  5. Delivery log + analytics + webhooks    │
                 └───────────────┬────────────────────────────┘
                                 │
   ┌─────────────────────────────┼──────────────────────────────┐
   ▼                             ▼                              ▼
 Email adapters             Push adapters              In-app notifications
 - lovable (default)        - web push (VAPID)         - existing tables
 - resend / sendgrid / ses  - FCM (future)             - notification center UI
 - mailgun / postmark       - OneSignal (future)
 - brevo / smtp / gmail / outlook
```

Every generated tenant (white-label brand) inherits the same engine and template library; brand-scoped rows override sender identity, theme, and templates.

## Data model (one migration)

- `engage_providers` — tenant_scope (`platform` | `brand:{id}`), kind (`lovable|resend|sendgrid|ses|mailgun|postmark|brevo|smtp|gmail|outlook`), config JSONB (non-secret), secret_ref (name of stored secret), verified_at, is_default
- `engage_senders` — tenant_scope, from_name, from_email, reply_to, domain, dkim_status, spf_status, dmarc_status
- `engage_templates` — tenant_scope, key (welcome, verify_email, course_completion, …), channel (`email|push|inapp`), subject, preview_text, body_mjml, body_json (builder blocks), locale, version, is_active
- `engage_segments` — tenant_scope, name, rules JSONB (audience, filters, tags)
- `engage_sequences` — tenant_scope, name, trigger (`user.signup`, `enrollment.abandoned`, `login.returning`, `course.completed`, …), steps JSONB (delay + template_key + condition)
- `engage_campaigns` — tenant_scope, name, template_id, segment_id, schedule (immediate/scheduled/recurring/best_time), timezone, status
- `engage_messages` — one row per rendered send; recipient, channel, provider, template_key, campaign_id, sequence_step_id, status, opened_at, clicked_at, bounced_at, complained_at, unsubscribed_at
- `engage_events` — event_bus rows (`user_id`, `event`, `payload`, `processed_at`) so sequences can be evaluated by a worker
- `engage_subscriptions` — user_id/email, category, is_subscribed (preference center)
- `engage_push_subscriptions` — user_id, endpoint, keys JSONB, device
- `engage_inapp_notifications` — extends existing `student_notifications` / `partner_notifications` via a unified view; keep those tables, add category, priority, archived_at
- `engage_ai_generations` — audit log of AI-drafted subjects/bodies/variants

All tables: GRANT to authenticated + service_role, RLS scoped by tenant + role.

## Server surface (TanStack)

Server functions in `src/lib/engage/*.functions.ts`:
- `getProviders`, `saveProvider`, `verifyProvider`, `testProvider`
- `listTemplates`, `upsertTemplate`, `previewTemplate`, `renderTemplate`
- `listSegments`, `saveSegment`, `evaluateSegment`
- `listSequences`, `saveSequence`, `enrollInSequence`
- `listCampaigns`, `createCampaign`, `scheduleCampaign`, `cancelCampaign`
- `sendTestEmail`, `sendCampaign`, `sendTransactional`
- `getAnalytics`, `getCampaignAnalytics`
- AI: `aiDraftSubject`, `aiDraftBody`, `aiGenerateVariants`, `aiPersonalize`
- In-app: `listNotifications`, `markRead`, `archive`, `deleteNotification`, `subscribePush`, `unsubscribePush`

Public routes under `src/routes/api/public/engage/`:
- `webhooks/{provider}.ts` — bounce/complaint/open/click ingestion (HMAC verified per provider)
- `unsubscribe/$token.ts` — one-click unsubscribe endpoint
- `push/vapid.ts` — VAPID public key
- `hooks/sequence-tick.ts` — pg_cron-driven worker that advances sequences and dispatches queued sends

Existing Lovable auth email webhook and events webhook remain untouched.

## Provider adapters

`src/lib/engage/providers/*.server.ts` — one file per provider, common interface:

```ts
type EngageProvider = {
  kind: string;
  verify(config): Promise<VerifyResult>;
  send(msg: RenderedMessage): Promise<SendResult>;
  parseWebhook(req: Request): Promise<WebhookEvent[]>;
};
```

- `lovable.server.ts` uses `sendLovableEmail` from `@lovable.dev/email-js` (default; no user secret).
- `resend.server.ts`, `sendgrid.server.ts`, `postmark.server.ts`, `mailgun.server.ts`, `brevo.server.ts` call the **connector gateway** when the workspace connector is linked; otherwise use provider REST with a stored API key.
- `ses.server.ts` uses AWS SES REST + SigV4.
- `smtp.server.ts`, `gmail-smtp.server.ts`, `outlook-smtp.server.ts` use SMTP via `nodemailer` (Worker-compatible smtp lib) or SMTP HTTP relay.

Adding a new provider = one file + registry entry; the rest of the system is unchanged.

## Templates & builder

- 45+ system templates ship as React Email `.tsx` in `src/lib/email-templates/` (Welcome, Verify, Verify Reminder, Password Reset, Login Alert, New Device Login, Account Created, Profile Reminder, Enrollment, Course Started/Progress/Completed, Certificate Ready, Internship Assigned, Workshop Registration, Live Class Reminder, Assignment/Quiz Reminder, Payment Success/Failed, Invoice, Refund, Subscription Renewal/Expiry, Coupon, Referral Invite/Reward, Brand/Instructor/Sales/Admin Invitation, Lead Assigned/Converted, Support Ticket Created/Resolved, Newsletter, Monthly/Weekly Updates, Feature Release, New Course Launch, Special Offers, Festival Offers, Flash Sale, Career Tips, Placement Updates, Success Stories).
- Every template is registered in `src/lib/email-templates/registry.ts` and satisfies the existing `TemplateEntry` shape so the Lovable managed sender picks them up automatically.
- Drag-and-drop builder saves normalized JSON (`engage_templates.body_json`) with blocks: Text, Buttons, Image, Video (thumb+link), Countdown, Social, Testimonial, Pricing Card, Certificate, Hero, Footer. Rendered to MJML → HTML on send; also renders in-app previews.
- Tenants override any system template; overrides live in `engage_templates` and win when present.

## Sequences engine

Sequence = ordered steps `{ delay, template_key, condition, channel }`. `pg_cron` calls `/api/public/engage/hooks/sequence-tick` every minute; the worker:
1. Reads `engage_events` and enrolls users into matching sequences.
2. Advances due steps, evaluates conditions (e.g. `not email_verified`, `no enrollment yet`).
3. Renders + dispatches through the tenant's default provider.

Signup sequence (default): Welcome → 24h Reminder 1 → 48h Reminder 2 → 72h Reminder 3 → 7d Benefits → 10d Popular Courses → 14d Limited Offer → 21d Success Stories → 30d Personalized recs.
Login sequence: Welcome Back with new courses / internships / certifications / AI tools / career paths.
Abandoned enrollment: Forgot something → Benefits → Discount → Testimonials → Reminder → Final Offer.
All are seeded as editable rows — not hard-coded.

## AI Email Generator

Server fns in `src/lib/engage/ai.functions.ts` use the AI SDK + Lovable AI Gateway (`google/gemini-3.5-flash` default). Structured output via `Output.object` for `{subject, preview, headline, body_markdown, cta_label, cta_url}` and `Output.array` for A/B variants. Personalization tokens (`{{first_name}}`, `{{course}}`, …) hydrated at render time from the user, brand, and activity context.

## Push & in-app

- Web Push via VAPID keys (server-generated with `generate_secret`), subscription stored in `engage_push_subscriptions`. `pushcrypt` compatible library, no native binaries.
- Mobile/FCM/OneSignal wired behind the same adapter interface — swap without touching UI.
- In-app: extends the existing notification tables with a unified `engage_inapp_notifications` view exposing category, priority, archived state. Bell UI lives in `src/components/engage/notification-bell.tsx`, reused across shells.

## Admin & Brand UI

- `/admin/engage` (Super Admin): Overview, Providers, Templates, Sequences, Campaigns, Segments, Analytics, Logs, Preferences, White-Label defaults.
- `/brand/engage` (Brand Owner): same modules scoped to that brand — sender identity, template overrides, campaigns to their audience only, analytics for their sends.
- `/partner/engage/notifications` and `/student/notifications` — preference center + in-app inbox.
- Public `/preferences/{token}` — unsubscribe & category preferences (Lovable-hosted unsubscribe stays the source of truth; this UI is the extended preference center feeding `engage_subscriptions`).

## Segmentation

Rule builder produces JSONB: `{all:[{field:'country',op:'in',value:['IN','US']},{field:'enrolled_course_id',op:'=', value:'…'}]}`. Compiled to SQL against `student_profiles`, `enrollments`, `course_categories`, `platform_leads`, custom tags. Support "students, partners, brand owners, instructors, admins, country, state, course, category, completed courses, inactive users, active users, revenue, custom tags".

## Analytics

`engage_messages` + webhook events feed a materialized view. Dashboard tiles: sent, delivered, opened, clicked, CTR, bounce %, spam %, unsubscribes, revenue (joined via `payments`), conversion %, top campaigns, campaign comparison.

## Security

- SPF/DKIM/DMARC via Lovable domain for default sender; per-provider validation for BYO senders.
- Webhook signature verification per provider (HMAC/JWT/SigV4).
- Rate limiting per tenant per hour (soft cap, surfaces the limit; no custom backend rate-limit primitive exists in Lovable — documented tradeoff).
- All secrets via `secrets--add_secret` / connector gateway; no keys in code.
- RLS on every table; brand-scoped isolation.

## Future-proof integrations

Adapter interface + tenant-scoped provider rows already accommodate Mailchimp, HubSpot, Zoho, Customer.io, Klaviyo, OneSignal, FCM, WhatsApp Business, Twilio, Messenger, Telegram. Ship stubs that surface "Connect" but no live send until requested.

## Phased rollout

1. **Foundation** — migration, provider registry, Lovable default adapter, template registry expansion, notification unification, preference center. Ships auth-safe: no external secrets needed to start sending.
2. **Templates & builder** — 45 seeded templates, drag-and-drop builder, tenant overrides, preview/testing.
3. **Sequences & event bus** — `engage_events`, `sequence-tick` worker, seeded signup/login/abandonment sequences.
4. **Providers** — Resend/SendGrid/Postmark/Mailgun/Brevo via connector gateway; SES/SMTP/Gmail/Outlook via BYO secrets; provider settings UI + verify.
5. **Campaigns & segmentation** — segment builder, campaign scheduler, best-time send.
6. **AI generator** — subject/body/variants + personalization.
7. **Push** — VAPID web push; FCM adapter stub.
8. **Analytics** — dashboards, webhook ingestion, revenue attribution.
9. **White-label surfacing** — `/brand/engage` per brand, scoped templates + sender identity.

Each phase is independently shippable; the platform still works after phase 1 with just Lovable Emails.

## Out of scope

- Native mobile push SDKs (only web push in phase 7).
- SMS/WhatsApp send in this iteration (adapter stubs only).
- Marketing-list imports for cold outreach (Lovable Emails prohibits bulk/marketing to non-consenting recipients; the system only sends to opted-in tenant audiences).

## Deliverables

- One migration for all `engage_*` tables + RLS + GRANTs.
- `src/lib/engage/**` server layer (providers, sequences, AI, analytics, webhooks).
- `src/lib/email-templates/**` — 45+ templates registered.
- `src/components/engage/**` — shared UI (bell, template editor, sequence editor, campaign wizard, analytics widgets, preference center).
- Admin (`/admin/engage/*`) and Brand (`/brand/engage/*`) routes.
- Public routes: unsubscribe token page, provider webhooks, VAPID key, sequence worker.
- `pg_cron` schedule for sequence tick.
- Documentation stub in `.lovable/engage.md` explaining the adapter contract and how to add a new provider.

Ready to implement in the phase order above.