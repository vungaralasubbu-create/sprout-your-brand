## Scope

Add a centralized UPI-QR payment flow used by every course. Strictly additive: no changes to existing pages, components, tables, or the AI/Marketing stack. Existing `enrollments`, `courses`, `payment_links`, `partner_lead_payment_links`, and `bill_*` tables stay untouched; existing admin pages (`admin.payment-verification`, `admin.payment-links.*`) stay as-is — the new admin UI is a separate menu item.

## New database objects (one migration)

All new tables use `owner`/`admin` RLS, timestamps, `updated_at` triggers, and full `GRANT` blocks.

1. `public.payment_settings` — singleton config row.
   Columns: `id uuid pk`, `qr_image_url text`, `upi_id text`, `merchant_name text`, `support_email text`, `support_phone text`, `is_active bool default true`, `updated_by uuid`, timestamps.
   RLS: `SELECT` for `authenticated` when `is_active`; full CRUD for admin role via `has_role(auth.uid(),'admin')`.

2. `public.course_payments` — one row per checkout attempt. NOT a replacement for `enrollments`; a sibling record that the flow uses to track UPI payment + verification. Links to `enrollments.id` once approved.
   Columns: `id uuid pk`, `order_id text unique` (human ref, e.g. `GLR-YYYYMMDD-XXXX`), `user_id uuid` (nullable — supports guest→signup), `course_id uuid references courses(id)`, `enrollment_id uuid references enrollments(id) on delete set null`, form fields (`first_name`, `last_name`, `email`, `phone`, `college`, `degree`, `graduation_year int`, `city`, `state`, `country`), `referral_code text`, `coupon_code text`, `base_amount_inr numeric(12,2)`, `discount_inr numeric(12,2) default 0`, `final_amount_inr numeric(12,2)`, `utr_number text`, `screenshot_url text`, `status text check in ('pending','submitted','verified','rejected','refunded') default 'pending'`, `rejection_reason text`, `verified_by uuid`, `verified_at timestamptz`, `provider text default 'upi_manual'`, `provider_ref text`, timestamps.
   Unique index on `(utr_number)` where `utr_number is not null` (dedupe).
   Indexes: `(user_id, created_at desc)`, `(status, created_at desc)`, `(course_id)`.
   RLS: owner (`auth.uid() = user_id`) can SELECT/INSERT/UPDATE own pending row; admin full CRUD.

3. `public.course_payment_events` — append-only audit trail (`payment_id`, `type`, `actor_user_id`, `meta jsonb`, `created_at`). Admin-only reads.

4. Storage bucket `payment-screenshots` (private). Policies: owner can upload to `${auth.uid()}/*`, admin can read all, size ≤ 5 MB, mime in image/*.

5. Storage bucket `payment-config` (public read) for QR image uploads.

## New server functions (`.functions.ts`)

`src/lib/payments/central/settings.functions.ts`
- `getActivePaymentSettings()` — public, returns latest active row (used by payment page).
- `updatePaymentSettings(...)` — admin only.

`src/lib/payments/central/checkout.functions.ts`
- `createCoursePayment({ courseId, form, couponCode?, referralCode? })` — authenticated. Loads course, computes final amount, creates `course_payments` row (`status='pending'`), returns `{ orderId, amount, qr, upiId, merchantName }`.
- `submitPaymentConfirmation({ orderId, utrNumber, screenshotUrl? })` — authenticated, owner-only. Sets `status='submitted'`. Rejects duplicate UTRs. Enqueues admin-notification email.
- `getMyPayment({ orderId })` — authenticated, owner-only.

`src/lib/payments/central/admin.functions.ts` — all gated by `has_role('admin')`:
- `listPayments({ status?, q?, cursor? })`
- `getPaymentDetail({ id })`
- `approvePayment({ id })` → creates/activates `enrollments` row (reusing existing enrollment status enum via `verified`), sets `course_payments.status='verified'`, writes event, sends student email.
- `rejectPayment({ id, reason })`
- `requestMoreInfo({ id, note })`

`src/lib/payments/central/upload.functions.ts`
- `getScreenshotUploadUrl({ orderId, mime, sizeBytes })` — returns signed upload URL scoped to `${userId}/${orderId}.ext`.

Emails go through the existing send helper; templates added under the existing `react-email` registry (additive, no changes to existing templates).

## New client routes (all additive, no edits to existing files)

- `src/routes/_authenticated/payment.$courseId.tsx` — enrollment form → order summary (single page, two steps in local state).
- `src/routes/_authenticated/payment.tsx` — pathless helper (redirects `/payment` → `/programs`).
- `src/routes/_authenticated/payment.pay.$orderId.tsx` — QR + UTR + screenshot upload; polls status.
- `src/routes/_authenticated/payment.success.$orderId.tsx`
- `src/routes/_authenticated/payment.failed.$orderId.tsx`
- `src/routes/_authenticated/payment.pending.$orderId.tsx`
- `src/routes/_authenticated/admin.payments.index.tsx` — tabs: Pending / Verified / Rejected / All. Reuses existing admin shell.
- `src/routes/_authenticated/admin.payments.$id.tsx` — detail + Approve/Reject/Request-info actions.
- `src/routes/_authenticated/admin.payments.settings.tsx` — QR/UPI/merchant editor.

Routes are all under `_authenticated/`, so the platform's auth gate covers them. Guest checkout is out of scope for v1 (spec says "Generate Student Account if required" — approval flow can invite via existing auth); a follow-up can add a public entry.

## Course "Enroll Now" wiring

The only touch to existing UI. Find every `<Link>` / `<button>` currently labelled "Enroll Now" / "Apply Now" / "Buy Now" on the course pages and make the click navigate to `/payment/${course.id}`. No visual change — only the `to` / `onClick` handler. Files expected: `src/routes/programs.$category.$course.index.tsx`, `src/components/course/*` CTA components, and course cards used elsewhere. Existing `programs.$category.$course.apply.tsx` (lead form) is left as-is; the new payment route is the paid enrollment path.

If a course page's CTA is deeply nested inside a shared component used outside programs, we add an opt-in prop (default preserves current behaviour) rather than editing that component's default.

## Admin menu

Add exactly one item — "Payments" — pointing to `/admin/payments`, appended to the existing admin sidebar registry. No other admin UI change.

## Emails (additive templates only)

- `PaymentReceivedEmail` → student on submit.
- `PaymentApprovedEmail` → student on approve (+ enrollment link).
- `PaymentRejectedEmail` → student on reject (with reason).
- `EnrollmentActivatedEmail` → student.
- `NewPaymentAdminEmail` → admins on submit.

Wired via existing `sendLovableEmail` helper; if the project has no email domain configured yet, sending is a no-op and the flow still succeeds (logged).

## Security

- All form input validated with `zod` (lengths, regex for phone/UTR).
- Screenshot upload: max 5 MB, `image/png|image/jpeg|image/webp`, scoped to owner path.
- Duplicate UTR rejected at DB (partial unique index) and in server fn.
- Every server fn re-verifies auth / role. Admin fns re-check `has_role`.
- No secrets read at module scope.

## Provider abstraction (future-ready)

Reuse the existing `PaymentProvider` interface in `src/lib/billing/providers/types.ts` by adding a new `upi_manual` implementation under `src/lib/payments/central/providers/upi-manual.server.ts`. The checkout server fn depends on that interface, so adding Razorpay/Stripe later is one new adapter + one registry entry. `payments--enable_stripe_payments` / Cashfree paths are untouched.

## Verification

- `bun run build` and `tsgo --noEmit` pass.
- Manual walkthrough via Playwright of one course → `/payment/:id` → form submit → payment page (mock QR) → UTR submit → admin approve → success page.
- Confirm no existing routes changed behaviour (spot-check `/`, `/programs`, `/admin`).

## What is intentionally NOT done

- No changes to `enrollments` schema. Approval writes a new `enrollments` row using existing columns.
- No changes to existing admin dashboards, `admin.payment-verification`, `admin.payment-links.*`, or partner payment flows.
- No auto gateway integration (Cashfree/Stripe/etc.) — interface is ready but v1 ships UPI manual only, per spec.
- No refund UI — DB status supports it; UI is deferred.

Reply "go" to implement, or tell me which parts to trim/expand. This is ~15 new files + 1 migration + storage buckets + 5 email templates.
