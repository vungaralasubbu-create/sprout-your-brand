
# Glintr — Platform Architecture Blueprint

> Brand: **Glintr** — "Launch. Sell. Grow."
> Brand colors sampled from logo: Cyan `#22D3B8`, Azure `#2E9BFF`, Royal `#3A5BFF`, Lime `#3CE451`, Violet `#7C3AED`, Ink `#05070E`.
> This document defines architecture only. **No pages, UI, or feature code will be built in this step.**

---

## 1. Project Architecture (High Level)

Monolithic TanStack Start app (React 19 + Vite + Cloudflare Worker runtime) fronting a Lovable Cloud (Supabase) backend. Everything is CMS-driven — copy, pricing, revenue splits, roles, permissions, courses, commissions, white-label configs live in DB tables, never hardcoded.

```text
┌──────────────────────────────────────────────────────────────┐
│                    Client (TanStack Start)                   │
│  Public site · Auth · Role-based dashboards · LMS player     │
└──────────────────────────────────────────────────────────────┘
                │ server functions (RPC)  │ /api/public/* routes
                ▼                          ▼
┌──────────────────────────────────────────────────────────────┐
│              Edge Runtime (Cloudflare Worker)                │
│  Server fns · Webhooks · Cron · Signed uploads · Reports     │
└──────────────────────────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────────────────┐
│                    Lovable Cloud (Supabase)                  │
│  Postgres · Auth · RLS · Storage · pg_cron · Realtime        │
└──────────────────────────────────────────────────────────────┘
       │              │              │              │
   Payments        Email/SMS       AI Gateway     Analytics
  (Razorpay/       (Resend/         (Lovable)     (PostHog)
   Stripe)         Twilio)
```

**Core principles**
- Multi-tenant by `tenant_id` (platform tenant + one row per white-label brand).
- All business rules (commission %, payout SLA, KYC thresholds, tax rates, course pricing tiers) stored in `platform_settings` and `tenant_settings`.
- Every write goes through a server function with Zod validation + role check.
- Audit log on every privileged mutation.

---

## 2. Folder Structure

```text
src/
├── routes/                      # File-based routes (TanStack)
│   ├── __root.tsx
│   ├── index.tsx                # Marketing home
│   ├── (marketing)/             # Public: pricing, partners, whitelabel, about
│   ├── auth/                    # login, signup, reset, verify, mfa
│   ├── _authenticated/          # Gated shell (managed layout)
│   │   ├── dashboard/           # Role-routed dashboard
│   │   ├── learn/               # Student LMS
│   │   ├── teach/               # Instructor studio
│   │   ├── partner/             # Sales partner console
│   │   ├── whitelabel/          # WL owner console
│   │   ├── hr/                  # HR module
│   │   ├── finance/             # Finance module
│   │   ├── support/             # Support desk
│   │   └── admin/               # Super Admin CMS
│   └── api/
│       ├── public/              # Webhooks, cron, public feeds
│       └── internal/            # Signed uploads, exports
├── modules/                     # Domain modules (feature-sliced)
│   ├── auth/
│   ├── rbac/
│   ├── tenants/
│   ├── users/
│   ├── courses/
│   ├── enrollments/
│   ├── partners/
│   ├── leads/
│   ├── commissions/
│   ├── payouts/
│   ├── payments/
│   ├── whitelabel/
│   ├── hr/                      # offers, salary, PF/ESIC, letters
│   ├── cms/                     # pages, blocks, media, nav, seo
│   ├── notifications/
│   ├── analytics/
│   ├── support/
│   └── audit/
│       └── each module: {schema, server, functions, hooks, components, types}
├── components/ui/               # shadcn primitives
├── components/shared/           # cross-module composites
├── lib/                         # utils, error, logging, formatters
├── integrations/
│   ├── supabase/                # client, client.server, auth-middleware
│   ├── payments/                # razorpay, stripe adapters (interface)
│   ├── email/                   # provider-agnostic adapter
│   ├── sms/                     # provider-agnostic adapter
│   ├── storage/                 # signed URL helpers
│   └── ai/                      # Lovable AI Gateway
├── config/                      # runtime-loaded config resolvers
├── styles.css
└── router.tsx

supabase/migrations/             # every schema change
scripts/                         # seed, backfill, ops
```

---

## 3. Database Schema (Postgres)

All tables in `public` unless noted. Every table: `id uuid pk`, `tenant_id uuid`, `created_at`, `updated_at`, `created_by`, soft-delete `deleted_at`. Enums used everywhere for scalability.

### 3.1 Identity & Tenancy
- `tenants` — platform + white-label brands. Columns: name, slug, domain, logo_url, theme_json, status, plan, owner_user_id.
- `tenant_settings` — key/value JSON per tenant (commission %, payout SLA hours, currency, tax %, features flags).
- `platform_settings` — global key/value (only Super Admin editable).
- `profiles` — 1:1 with `auth.users`; display name, avatar, phone, locale, kyc_status, timezone.
- `user_tenants` — many-to-many (a user can be Partner on Tenant A and Student on Tenant B).

### 3.2 RBAC
- `app_role` enum: `super_admin, admin, sales_partner, whitelabel_owner, instructor, student, employee, hr, finance_manager, support`.
- `permissions` — catalog of permission keys (e.g. `courses.publish`, `payouts.approve`).
- `role_permissions` — mapping role → permission (editable via CMS).
- `user_roles` — (user_id, tenant_id, role) unique. Never on profiles.
- `has_role(_uid, _tenant, _role)` and `has_permission(_uid, _tenant, _perm)` — SECURITY DEFINER SQL functions used by every RLS policy.

### 3.3 Courses / LMS
- `course_categories` (nestable via parent_id).
- `courses` — title, slug, description, thumbnail, hero_video, level, language, status, base_price, currency, revenue_model_id, primary_instructor_id, tenant_id.
- `course_versions` — publishable versions (draft/live).
- `modules` (sections) → `lessons` (video, text, quiz, live, assignment) → `lesson_assets`.
- `quizzes`, `quiz_questions`, `quiz_attempts`.
- `assignments`, `assignment_submissions`.
- `enrollments` — user_id, course_id, source (partner_id?, campaign_id?), progress %, status.
- `lesson_progress` — per user per lesson.
- `certificates` — template_id, issued_to, verification_code, pdf_url.
- `certificate_templates` — CMS-managed.
- `instructor_profiles` — bio, payout share %, expertise tags.
- `reviews` — course ratings.
- `revenue_models` — CMS-defined splits (e.g. "70/30 own-lead", "50/50 company-lead", "Instructor 40 / Platform 40 / Partner 20") with rules JSON. Referenced by course, campaign, or override at sale time.

### 3.4 Sales, Leads, Partners
- `partner_profiles` — user_id, partner_type (`own_leads | company_leads | whitelabel`), tier, kyc_status, bank_account_id, referral_code.
- `leads` — name, phone, email, source (self/company), owner_partner_id, stage, score, tags, tenant_id.
- `lead_activities` — calls, notes, follow-ups, files.
- `lead_assignments` — round-robin / rules-based assignment log.
- `campaigns` — company-lead pools with cost basis and revenue model override.
- `deals` — lead_id, course_id, quoted_price, discount, status, closed_at, partner_id, revenue_model_id.
- `referrals` — referrer_user_id, referred_user_id, code, reward_rule_id.
- `reward_rules` — CMS-managed (flat / % / tiered / bonus).

### 3.5 Payments & Payouts
- `payment_providers` — adapter registry (`razorpay`, `stripe`, `paypal`), enable flags per tenant.
- `orders` — buyer_user_id, course_id/bundle_id, amount, currency, tax, coupon_id, partner_id, deal_id, status.
- `order_items` — supports bundles.
- `invoices` — GST-compliant, PDF url, series per tenant.
- `payment_transactions` — provider, provider_ref, status, raw_payload (jsonb), reconciled_at.
- `refunds` — linked to transaction; approvals workflow.
- `coupons` / `coupon_redemptions`.
- `wallets` — per user per tenant (earnings balance).
- `wallet_ledger` — append-only credit/debit with reason_code, ref_type, ref_id.
- `payout_requests` — user_id, amount, method, status; SLA target = now + tenant_settings.payout_sla_hours (default 48).
- `payout_batches` — grouped disbursements sent to provider.
- `bank_accounts` — encrypted (via pgcrypto/KMS), verification status.

### 3.6 Revenue Tracking
- `revenue_events` — immutable event stream: sale, refund, adjustment, chargeback, bonus. Fields: amount, currency, split_snapshot jsonb, actors[] (platform, tenant, instructor, partner, referrer).
- `revenue_splits` — derived per event per actor (materialized view refreshed via pg_cron).
- `revenue_reports_daily` / `_monthly` — rollups per tenant/partner/course/category.
- `commissions` — computed per partner per deal from split_snapshot; status pending → approved → paid.

### 3.7 White-Label
- `whitelabel_applications` — user_id, brand_name, desired_domain, plan, kyc.
- `whitelabel_brands` — provisioned tenant_id, dns_status, ssl_status, deployed_at.
- `brand_assets` — logo, favicons, palette, fonts, email templates.
- `provisioning_tasks` — 24-hour launch checklist (logo, website, LMS, payment gateway, student portal, instructor portal, CRM, certs, social, email, marketing, landing pages) with owner + SLA.

### 3.8 HR / Employees
- `employees` — user_id, tenant_id, employee_code, joining_date, ctc, mode (`full_time | part_time | contract`), pf_enabled, esic_enabled, status.
- `employment_letters` — type (`offer | experience | relieving | confirmation`), template_id, signed_pdf_url.
- `letter_templates` — CMS-managed Markdown/HTML with tokens.
- `payroll_cycles`, `payroll_runs`, `salary_slips` (basic/hra/allowances/pf/esic/tds jsonb), pdf_url.
- `benefits`, `benefit_enrollments`.
- `leaves`, `attendance` (optional module).

### 3.9 CMS / Content
- `pages` — slug, tenant_id, status, seo jsonb, blocks_ref.
- `page_blocks` — ordered block instances referencing `block_types`.
- `block_types` — registry with schema jsonb (hero, features, pricing, testimonials, faq, cta, media, custom-html).
- `navigation` — menus per tenant.
- `media_assets` — storage_key, mime, size, alt, tags, folder_id.
- `media_folders`.
- `translations` — key/locale/value.
- `announcements` — banner/toast targeting rules.

### 3.10 Support
- `tickets`, `ticket_messages`, `ticket_attachments`, `sla_policies`, `canned_replies`, `knowledge_articles`.

### 3.11 Notifications
- `notification_templates` (channel: email/sms/push/inapp, locale, tokens).
- `notifications` (user_id, template_id, payload, status).
- `notification_preferences` per user.

### 3.12 Audit & Security
- `audit_log` — actor, tenant, action, entity, before/after jsonb, ip, ua.
- `login_events`, `mfa_factors`, `api_keys` (hashed), `webhook_endpoints`, `webhook_deliveries`.

### 3.13 Storage GRANTs & RLS
Every table: `GRANT` block per role, `ENABLE RLS`, policies using `has_permission()`/`has_role()`. Anon reads only on public catalog tables (published courses, marketing pages, brand landing pages).

---

## 4. Authentication System

- Lovable Cloud (Supabase) Auth: email/password + Google + Apple (defaults).
- Optional phone OTP for Indian partners.
- MFA (TOTP) for Admin, Finance, HR, Support, WL Owner.
- Password reset via `/auth/reset-password` route (public, handles `type=recovery` hash).
- Session hydration: single root `onAuthStateChange` → `router.invalidate()`.
- Server calls: `requireSupabaseAuth` middleware; bearer attached via `functionMiddleware` in `src/start.ts`.
- Signup trigger auto-creates `profiles` row and assigns default role `student` on the platform tenant.
- Email-domain role auto-grant (e.g. `@glintr.com` → `admin`) only after `email_confirmed_at`, guarded per the platform's verified-domain trigger pattern.
- KYC gate: bank payout requires verified KYC before `payout_requests` insert (RLS check).

---

## 5. User Roles & Permissions

10 roles (enum `app_role`) scoped per tenant. Permissions are keys grouped by domain; roles map to permission sets in `role_permissions` (editable in Admin CMS → RBAC).

| Role | Core permissions (excerpt) |
|---|---|
| Super Admin | `*` on platform tenant; can impersonate; manages tenants, revenue models, RBAC, secrets registry |
| Admin | Everything except platform-wide destructive ops and RBAC edits |
| Sales Partner | `leads.*` (own), `deals.*` (own), `wallet.read`, `payouts.request`, `courses.read`, `referrals.*` |
| White Label Owner | Admin scope **within own tenant only**; branding, staff, courses, revenue reports |
| Instructor | `courses.author`, `lessons.*`, `quizzes.*`, `students.read`, `revenue.self` |
| Student | `enrollments.self`, `lessons.progress`, `certificates.self`, `reviews.create` |
| Employee | `hr.self`, `letters.self`, `salary_slips.self`, `leaves.*` |
| HR | `employees.*`, `letters.*`, `payroll.run`, `benefits.*` |
| Finance Manager | `payments.*`, `payouts.approve`, `invoices.*`, `refunds.approve`, `revenue.*` |
| Support | `tickets.*`, `users.read`, `orders.read`, `courses.read` |

Permission checks: `has_permission(auth.uid(), tenant_id, 'payouts.approve')` in RLS + server-fn guards. Multi-role users allowed (partner + student is common).

---

## 6. API Structure

Two surfaces:

**A. `createServerFn` (app-internal RPC)** — organized under `src/modules/<domain>/*.functions.ts`. Naming: `verbNoun` (e.g. `createCourseDraft`, `approvePayout`). Each function: `.middleware([requireSupabaseAuth])` + `.inputValidator(zodSchema)` + `.handler`. Permission check inside handler.

**B. Server routes under `src/routes/api/`**
- `api/public/webhooks/{razorpay|stripe|resend|twilio}` — signature-verified.
- `api/public/cron/{payouts|revenue-rollup|certificates|dunning}` — HMAC header.
- `api/public/rss`, `api/public/sitemap.xml`, `api/public/og/*` (dynamic OG images).
- `api/internal/uploads/sign` — signed storage URLs, auth-gated.
- `api/internal/exports/{csv,pdf}` — long-running via queue.

Rate limits and idempotency keys on all mutating public endpoints (idempotency table).

---

## 7. CMS Architecture

Everything the marketing team or Admin might change is a DB row.

- **Page Builder**: `pages` + ordered `page_blocks` referencing `block_types`. Each block_type has a JSON Schema; the CMS renders a form for it. Frontend has a `<BlockRenderer type=... data=... />` registry.
- **Navigation, Footer, Banners, Popups** — tenant-scoped tables.
- **Course CMS** — full course editor, drip rules, prerequisites, bundles, coupons.
- **Commercial CMS** — revenue models, coupon rules, tax rules, currency table, payout SLA.
- **RBAC CMS** — role ↔ permission matrix editor with diff preview.
- **HR CMS** — letter templates, payroll components (basic %, hra %, PF cap, ESIC threshold), benefits catalog.
- **Notification CMS** — templates with token preview + test-send.
- **White-label CMS** — provisioning checklist, brand asset library, domain manager.
- **Feature flags** — `feature_flags` table with rules (per tenant, per role, per user %).
- **Localization** — `translations` table, `i18n` resolver hook.
- All CMS mutations write `audit_log`.

---

## 8. Dashboard Architecture

Single gated shell at `_authenticated/dashboard`. On login the router computes primary role + tenant, redirects to that module home. Users with multiple roles get a **role switcher** in the top bar (persists per tenant).

Layout: left rail (module nav), top bar (tenant switcher + role switcher + search + notifications), main outlet.

| Module | Home widgets |
|---|---|
| Student | Continue learning, upcoming live, certificates, recommendations |
| Instructor | Draft/live courses, revenue this month, learner Q&A, ratings |
| Partner | Wallet, pipeline, this-week commissions, next payout ETA, leads inbox |
| WL Owner | Brand health, GMV, top courses, provisioning progress, partner leaderboard |
| HR | Headcount, upcoming letters, payroll cycle status, leave approvals |
| Finance | Revenue, pending payouts (SLA countdown), refund queue, reconciliation |
| Support | Ticket queue, SLA breaches, satisfaction |
| Admin/Super Admin | Platform KPIs, tenants list, feature flags, audit stream |

Every dashboard widget = a small server function returning a typed DTO; widgets composable via `<DashboardGrid>`.

---

## 9. File Storage Architecture

Supabase Storage buckets, all private except `public-media`.

| Bucket | Purpose | Access |
|---|---|---|
| `public-media` | marketing images, course thumbs, brand logos | anon read |
| `course-content` | videos, PDFs, slides | signed URLs, enrollment-checked |
| `certificates` | issued PDFs | signed URLs, owner or verifier |
| `kyc` | ID docs, bank proofs | signed URLs, KYC/Finance only |
| `hr-docs` | offer/experience letters, salary slips | signed URLs, self + HR |
| `invoices` | GST invoices | signed URLs, self + Finance |
| `whitelabel-assets` | brand kits | signed URLs, WL Owner + Admin |

Uploads via `/api/internal/uploads/sign` returning short-lived signed URL. Video pipeline hook (future: transcode via external provider) triggered by row insert in `lesson_assets`. AV/mime allowlists enforced server-side. Storage RLS mirrors table RLS.

---

## 10. Payment Architecture

Provider-agnostic adapter interface `PaymentProvider { createOrder, verifySignature, refund, capture, payout }`. Concrete adapters: Razorpay (India), Stripe (global), Paddle (optional). Choice per tenant via `payment_providers`.

Purchase flow:
1. Client calls `createOrder` server fn → row in `orders` (status `initiated`).
2. Server returns provider order token.
3. Client completes on provider.
4. Provider webhook → `/api/public/webhooks/{provider}` → verify signature → upsert `payment_transactions` → mark order `paid` → emit `revenue_event` → enqueue commission → issue enrollment + invoice + certificate eligibility.

Idempotency: `(provider, provider_ref)` unique; webhook table + retries.

Refunds: Finance-approved workflow; reverses revenue_events & commissions.

Taxes: `tax_rules` table (GST slabs, place-of-supply). Invoice series per tenant.

---

## 11. Referral Architecture

- Every user gets a `referral_code` on profile creation.
- `referrals` links referrer ↔ referred; attribution captured at signup (cookie or `?ref=`) or first purchase (last-touch).
- `reward_rules` (CMS): trigger (`signup | first_purchase | nth_purchase | subscription_renewal`), reward (`flat_wallet | percent_of_order | free_course`), caps.
- On qualifying event, rules engine emits `wallet_ledger` credit + `revenue_event`.
- Multi-level (2-tier) supported via rule config; not hardcoded.
- Anti-fraud: same-device, self-referral, disposable-email checks; flags to Support.

---

## 12. Revenue Tracking Architecture

Single source of truth: `revenue_events` (append-only). Everything else derives from it.

- **Split snapshot**: at event time, resolve the effective `revenue_model` (course > campaign > tenant default > platform default) and freeze the split into `split_snapshot` jsonb so future rule changes never rewrite history.
- **Actors**: platform, tenant (WL brand), instructor, partner, referrer — each with amount & percent.
- **Rollups**: pg_cron nightly job builds `revenue_reports_daily`; on-demand refresh for Finance.
- **Commissions**: derived per partner; state machine `pending → approved (T+settle) → paid`.
- **Payouts**: batched by Finance; SLA 48h from `approved`; SLA countdown surfaced in Partner + Finance dashboards.
- **Reconciliation**: nightly compare provider settlement report ↔ `payment_transactions`; discrepancies open Finance tickets.

---

## 13. Course Architecture

- Course → Versions → Modules → Lessons → Assets.
- Lesson types: `video, article, quiz, assignment, live_session, download, external_link`.
- Drip rules per module (by date or by prior-completion).
- Prerequisites graph (course → course).
- Bundles: `course_bundles` + `bundle_items` with independent pricing.
- Pricing: base + tenant override + coupon; multi-currency via `currencies` and daily FX table.
- Live sessions: metadata only (Zoom/Meet URL); attendance table.
- Progress engine: `lesson_progress` computes course % via view.
- Certificates: rule = 100% progress + passing quiz average; template merged server-side to PDF, stored, hash-verifiable via `/verify/:code`.
- Search: Postgres full-text index on courses/lessons; category + tag filters.
- Reviews & ratings with moderation queue.
- AI assist (Lovable AI Gateway) for outline generation, quiz suggestions, transcript summaries — **behind feature flag, opt-in per instructor**.

---

## 14. Cross-Cutting Concerns

- **Observability**: structured logs via `console.info` with request id; error boundary reports to Lovable error reporting; PostHog events for product analytics.
- **Testing**: Zod schemas shared client/server; unit tests on rules engines (revenue split, commission, referral); Playwright smoke on critical flows.
- **Security**: RLS on every table, service role only in `.server.ts`, secrets via Lovable Cloud secret store, MFA for privileged roles, HMAC on webhooks & cron.
- **Migrations**: every schema change is a `supabase/migrations/*.sql` file including GRANTs + RLS.
- **Seeding**: `scripts/seed.ts` populates permissions, roles, revenue models, block types, letter templates, notification templates.

---

## 15. Design System Tokens (brand-only, no pages yet)

To be encoded in `src/styles.css` when UI work starts:

```text
--ink:            oklch(0.14 0.03 260)   /* #05070E background */
--surface:        oklch(0.19 0.03 260)
--primary:        oklch(0.68 0.18 235)   /* Azure #2E9BFF */
--primary-2:      oklch(0.78 0.16 175)   /* Cyan #22D3B8 */
--accent-lime:    oklch(0.85 0.22 140)   /* #3CE451 */
--accent-violet:  oklch(0.58 0.22 295)   /* #7C3AED */
--royal:          oklch(0.55 0.24 265)   /* #3A5BFF */
```

Gradients: `linear-gradient(135deg, cyan → azure → royal)` for hero; lime + violet as spot accents (mirrors "Sell" / "Grow" in the logo).

---

## 16. Build Order (when you approve)

1. Design tokens + shell (root, auth gate, role switcher).
2. Tenancy + RBAC + audit (migrations + seed).
3. Courses + enrollments + storage.
4. Payments + revenue events + commissions + payouts.
5. Partner console + leads + referrals.
6. White-label provisioning.
7. HR module.
8. CMS (pages, blocks, notifications, RBAC editor).
9. Marketing site + white-label public sites.
10. Analytics, support, polish.

---

**Nothing above is hardcoded logic** — every %, SLA, template, split, and role→permission mapping is a row that Super Admin can edit through the CMS.
