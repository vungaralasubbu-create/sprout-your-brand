# Razorpay Payment Infrastructure — Platform-Wide

A single, reusable payment engine used by every current and future paid surface on Glintr (courses, workshops, internships, certifications, white-label brands, partner links, upgrades, brand launch fees, etc.).

## 1. Architecture

```text
Client "Pay" button (any page)
        │
        ▼
  <PayButton product={...} />  ── shared component
        │
        ▼
  createOrder() server fn ──► Razorpay Orders API
        │                       (uses admin-configured keys)
        ▼
  Razorpay Checkout (modal)
        │
        ▼
  /api/public/webhooks/razorpay  (signature verified)
        │
        ▼
  payments table  →  post_payment_actions()
                      • enroll student / create LMS account
                      • generate invoice + receipt
                      • email + WhatsApp + notify partner/brand/admin
                      • attribute revenue share (70% / 50%)
                      • update analytics
```

One service. Every payment surface calls it. New pages inherit automatically.

## 2. Database (single migration)

- `payment_settings` — singleton row: mode (test/live), key_id, key_secret, webhook_secret, gst %, invoice prefix, company details.
- `payment_products` — canonical priced item: `type` (course|workshop|internship|certification|bootcamp|brand_launch|upgrade|donation|custom), `ref_id`, brand_id, title, description, amount, currency, gst_included.
- `payment_links` — extended: brand_id, partner_id, product_id, campaign, expiry, short_code, clicks, unique_visitors, conversions, revenue. (Existing `payment_links` already exists — additive alter.)
- `payment_link_visits` — click + unique visitor tracking, UA, referrer, city, device.
- `payments` — transaction of record: razorpay_order_id, razorpay_payment_id, signature, amount, gst, coupon, status, method, utr, student_id, partner_id, brand_id, product_id, link_id, campaign, attribution snapshot, invoice_no, receipt_url.
- `payment_webhook_events` — raw payload, event id (unique), status, retries, last_error — for idempotency + replay protection.
- `payment_refunds` — refund_id, payment_id, amount, reason, status.
- `invoices` — invoice_no (sequence), payment_id, pdf_url, gst breakdown, buyer + seller (brand) snapshot.
- Revenue share view: `v_payment_attribution` computing 70/50 based on `is_own_lead`.
- RLS: admins full; brand owners see their brand; partners see own attributions; students see own payments.

## 3. Server functions (`src/lib/payments/*.functions.ts`)

- `getPaymentSettings`, `updatePaymentSettings` (admin).
- `createOrder({ product_id | link_code, buyer, coupon })` — issues Razorpay order, records pending `payments` row.
- `verifyPayment({ order_id, payment_id, signature })` — client-side fallback verification.
- `handleWebhook` — server route `/api/public/webhooks/razorpay` (HMAC verified, idempotent by event id).
- `postPaymentActions(payment_id)` — enroll, invoice, notify.
- Link generator: `createPaymentLink`, `listPaymentLinks`, `updatePaymentLink`, `disable/archive/delete`, `duplicatePaymentLink`, `getLinkAnalytics`, `trackLinkVisit`.
- Admin analytics: `getPaymentCenterOverview`, `revenueByBrand/Partner/Course`, `topPrograms`, `recentTransactions`, `refundsList`.

## 4. Shared UI

- `<PayButton />` — universal. Props: `productId` or `linkCode`. Handles checkout modal, loading, success/error, redirect.
- `<PaymentCheckoutPage />` — hosted checkout at `/pay/$code` showing brand logo, product, price, coupon, GST, student details form → Razorpay modal.
- `<PaymentLinkGenerator />` — used by brand + admin dashboards (product type picker, price, expiry, campaign; outputs short URL + QR + copy/share).
- `<PaymentAnalyticsCards />`, `<TransactionsTable />`, `<RefundsPanel />` — reused in admin, brand, partner dashboards.

## 5. Routes

- Admin: `/admin/payments` (overview + transactions + refunds + settings tabs).
- Admin: `/admin/payments/settings` — Razorpay keys, mode toggle, webhook secret, GST, invoice.
- Brand owner: `/brand/payments` — links generator + brand-scoped analytics.
- Partner: `/partner/payment-links` (already exists) — wire to new engine; partner-created links attribute to Glintr Razorpay, revenue share auto-computed.
- Student: `/student/payments` — history + invoices.
- Public: `/pay/$code` — hosted checkout. `/r/$short` — short-URL resolver + click tracking.
- Webhook: `/api/public/webhooks/razorpay`.

## 6. Existing surfaces wired to `<PayButton />`

Course apply, Program enroll, Workshop register, Internship apply, Certification purchase, Brand launch fee, Premium upgrade, Partner dashboard "Generate Link", White-label brand storefronts. Every existing "Enroll / Pay / Apply / Register" CTA swaps to the shared component so future pages inherit.

## 7. Post-payment automation

Triggered from webhook (idempotent):
1. Insert enrollment in `enrollments`, create student profile if missing.
2. Generate invoice (sequential per brand), store PDF in Supabase storage.
3. Email receipt (existing email pipeline), WhatsApp via Pearl SMS gateway.
4. Notify partner + brand owner + admin (existing notification tables).
5. Update `platform_leads` → status=enrolled, attach payment.
6. Update analytics + revenue dashboards.

## 8. Security

- Signature verification on both client callback and webhook.
- Webhook idempotency via `payment_webhook_events.event_id UNIQUE`.
- Replay protection: reject events older than 5 min.
- Retries with exponential backoff for post-payment actions (queue table).
- Secrets stored via `add_secret` (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`); admin UI can override per environment.
- Signed short URLs; expiry enforced server-side; disabled links reject at order-create.

## 9. Rollout order

1. Migration (settings, products, payments, webhook_events, refunds, invoices, link extensions, visits) + RLS + GRANTs.
2. Secrets + `payments.server.ts` (Razorpay SDK wrapper) + webhook route.
3. Server functions (order, verify, post-actions, links, analytics).
4. Shared `<PayButton />` and `/pay/$code` hosted checkout.
5. Admin `/admin/payments` (overview, transactions, refunds, settings).
6. Brand `/brand/payments` link generator.
7. Wire existing CTAs (course apply, program enroll, partner link generator, brand launch).
8. Student payment history + invoice download.

## Technical notes

- Razorpay Node SDK is not Worker-safe for all calls; use `fetch` against Razorpay REST API directly from server functions (Basic Auth with key_id:key_secret). This runs cleanly on the TSS Worker runtime.
- Webhook uses raw body + HMAC-SHA256 with `RAZORPAY_WEBHOOK_SECRET`; verify with `timingSafeEqual`.
- Invoice PDF rendering via HTML → `@react-pdf/renderer` at request time, cached in Supabase storage bucket `invoices`.
- Client-side Razorpay checkout script loaded lazily on `<PayButton />` mount (`https://checkout.razorpay.com/v1/checkout.js`).
- Short URLs: `/r/:code` route logs visit → 302 to `/pay/:code`.
- All amounts stored as integer paise; UI formats INR.
- Feature-flagged: if `payment_settings.mode = 'test'`, badge shown on hosted checkout.

Given the scope, I'll implement in the order above across multiple turns, verifying each layer (migration → engine → UI → wiring) before moving on.
