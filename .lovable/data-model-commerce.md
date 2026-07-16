# Glintr Enterprise Data Model — Phase 8A-2 Part 2

Commerce, CRM, revenue-share and support data-model contract, mapping spec Modules 17–37 onto the live schema. No migrations run this phase — gaps are captured for later execution.

Universal conventions (from Part 1) apply: `uuid` PK, `created_at`/`updated_at` + trigger, `status` where lifecycle exists, `deleted_at` on soft-deletable content, FKs to `auth.users(id)`, roles only in `user_roles`.

---

## Module 17 — Quizzes

**Live: `course_assessments`** (12 columns) — full coverage.

| Spec | Live |
|---|---|
| programId | `course_id` |
| lessonId | `lesson_id` |
| title, description, difficulty | ✅ |
| timeLimit | `time_limit_minutes` |
| passingScore | `pass_percentage` |
| maxAttempts | `max_attempts` |
| shuffleQuestions, randomizeOptions, showAnswersAfterSubmission | ✅ (settings jsonb) |
| status | ✅ |

No change.

---

## Module 18 — Quiz Questions

**Live: `assessment_questions`** (10 columns).

| Spec | Live |
|---|---|
| quizId | `assessment_id` |
| questionType | `question_type` (mcq / true_false / fill_blank / code / scenario) |
| question, options (jsonb), correctAnswer, explanation, marks, negativeMarks, difficulty, order | ✅ |

No change.

---

## Module 19 — Quiz Attempts

**Live: `assessment_attempts`** (15 columns).

| Spec | Live |
|---|---|
| studentId | `student_user_id` |
| quizId | `assessment_id` |
| score, percentage, attempt_number, answers (jsonb), started_at, submitted_at, passed | ✅ |

No change.

---

## Module 20 — Assignments

**Live: `course_assignments`** (30 columns) — coverage exceeds spec.

`course_id`, `lesson_id`, `title`, `description`, `submission_type` (text / file / link / repo), `max_marks`, `due_at`, `status`, plus rubric, sample submissions, plagiarism flags.

No change.

---

## Module 21 — Assignment Submissions

**Two live tables** — one per audience:
- `student_assignments` (12 cols) — student-owned view + status per assignment.
- `assignment_submissions` (24 cols) — submission events (submission text, `attachments jsonb`, submitted_at, reviewed_at, marks, feedback, review_status).

No change. Documentation note: `student_assignments` is the join row, `assignment_submissions` are the append-only submission events.

---

## Module 22 — Certificates

**Live: `certificates`** (14 columns).

| Spec | Live |
|---|---|
| studentId | `student_user_id` |
| programId | `course_id` |
| certificateType | `certificate_type` |
| certificateNumber | `certificate_number` (unique) |
| verificationCode | `verification_code` (unique) |
| issueDate | `issued_at` |
| expiryDate | **Gap I** — not stored; add `expires_at timestamptz NULL` if program certificates ever expire |
| pdfUrl | **Gap J** — not stored on `certificates`; PDF rendered on demand via server function. Recommend `pdf_url text` for cached rendering. |
| verificationUrl | derived (`/verify/<code>`) — no column needed |
| status | derived from `revoked_at` — add `status text CHECK (status IN ('issued','revoked','expired'))` for explicit indexing |

**Optional Part 3 migration** — add `expires_at`, `pdf_url`, `status` for cache + expiry semantics.

---

## Module 23 — Payments

**Live: `payment_links`** (15 columns) — checkout intents + gateway receipts.

| Spec | Live |
|---|---|
| studentId | `student_user_id` (via enrollment link) |
| orderNumber | `order_reference` |
| gateway | `provider` (`razorpay`, `stripe`) |
| transactionId | `provider_payment_id` |
| paymentMethod | `payment_method` |
| amount, currency, tax_amount, discount_amount | ✅ |
| couponId | **Gap K** — coupon table missing (see Module 25) |
| invoiceId | **Gap L** — invoice table missing (see Module 26) |
| paymentStatus | `status` |
| paidAt | `paid_at` |

Two supporting tables:
- `partner_lead_payment_links` — partner-generated checkout URLs
- `partner_payment_submissions` — payout-side (not consumer payments)

**Recommendation for Part 3:** rename references from ad-hoc "payment_links" toward a canonical `payments` table + normalize `orders` (see Module 24).

---

## Module 24 — Orders

**Gap M — no dedicated `orders` table today.** `enrollments` acts as the order row (with `gross_revenue`, `eligible_revenue`), but that conflates the commerce order with the LMS enrollment. For multi-item carts, coupon linkage, or invoice grouping, add:

```sql
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  student_user_id uuid NOT NULL REFERENCES auth.users(id),
  subtotal numeric(12,2) NOT NULL,
  discount numeric(12,2) NOT NULL DEFAULT 0,
  tax numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL,             -- pending / paid / failed / refunded / cancelled
  payment_id uuid,                  -- FK payment_links(id) once renamed
  coupon_id uuid,                   -- FK coupons(id)
  invoice_id uuid,                  -- FK invoices(id)
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id),
  unit_amount numeric(12,2) NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  revenue_rule_id uuid,             -- pins the model at purchase time
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
```

Currently everything is single-item; a formal `orders` unblocks bundles, corporate purchase orders, and refund granularity.

---

## Module 25 — Coupons

**Gap N — no `coupons` table.** Discounts today are inline on `payment_links.discount_amount` with no code/redemption tracking. For Part 3:

```sql
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code citext UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percent','flat')),
  discount_value numeric(12,2) NOT NULL,
  max_discount numeric(12,2),
  min_order_value numeric(12,2),
  valid_from timestamptz,
  valid_to timestamptz,
  usage_limit int,
  usage_count int NOT NULL DEFAULT 0,
  per_user_limit int NOT NULL DEFAULT 1,
  applies_to jsonb NOT NULL DEFAULT '{"scope":"all"}',  -- course_ids / category_ids
  status text NOT NULL DEFAULT 'active',                 -- active / paused / archived
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id),
  order_id uuid NOT NULL,
  student_user_id uuid NOT NULL,
  amount numeric(12,2) NOT NULL,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coupon_id, order_id)
);
```

Do NOT use CHECK constraints on `valid_from < now()` — use a validation trigger (immutability rule).

---

## Module 26 — Invoices

**Gap O — no `invoices` table.** For GST compliance (India-first) and receipts, Part 3:

```sql
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,   -- format: INV-YYYY-######
  order_id uuid REFERENCES public.orders(id),
  student_user_id uuid NOT NULL,
  gst_number text,
  billing_name text NOT NULL,
  billing_address jsonb NOT NULL,        -- {line1,line2,city,state,country,postal}
  place_of_supply text,
  subtotal numeric(12,2) NOT NULL,
  cgst numeric(12,2) NOT NULL DEFAULT 0,
  sgst numeric(12,2) NOT NULL DEFAULT 0,
  igst numeric(12,2) NOT NULL DEFAULT 0,
  total_tax numeric(12,2) NOT NULL,
  total numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  pdf_url text,
  status text NOT NULL DEFAULT 'issued', -- issued / cancelled / credited
  issued_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

`invoice_number` is legally sequential — allocate via a Postgres sequence, never `gen_random_uuid()`.

---

## Module 27 — Refunds

**Live: `refund_adjustments`** (13 columns) — coverage complete.
`payment_id`, `refund_amount`, `reason`, `status`, `requested_at`, `processed_at`, `gateway_reference`, plus `initiated_by`, `commission_reversal_id`.

No change.

---

## Module 28 — Leads

**Live: `partner_leads`** (29 columns, 4 policies), `brochure_leads` (7), `contact_enquiries` (19).

Canonical spec mapping onto `partner_leads`:

| Spec | Live |
|---|---|
| name | `full_name` |
| email, phone, city | ✅ |
| programInterested | `program_interest` |
| leadSource | `source` |
| assignedPartner | `assigned_partner_id` |
| assignedCounselor | `assigned_counselor_id` |
| priority | `priority` |
| status | `status` |
| lastContacted | `last_contacted_at` |
| notes | `notes` |

`brochure_leads` and `contact_enquiries` feed into `partner_leads` via ingestion jobs — no schema change.

---

## Module 29 — Consultations

**Live: `brand_consultations`** (16 columns) — for white-label consultations.

**Gap P — no student/course consultation table.** For general 1:1 counselling calls booked from the site:

```sql
CREATE TABLE public.consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.partner_leads(id),
  student_user_id uuid,                    -- populated if consulter is signed in
  consultant_user_id uuid,
  program_interest text,
  scheduled_at timestamptz NOT NULL,
  duration_minutes int NOT NULL DEFAULT 30,
  meeting_platform text,                   -- zoom / gmeet / phone
  meeting_link text,
  status text NOT NULL DEFAULT 'scheduled', -- scheduled / completed / no_show / cancelled / rescheduled
  summary text,
  next_action text,
  next_action_due timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

Book-consultation page currently writes into `contact_enquiries` with a topic tag — this table would separate that flow.

---

## Module 30 — Revenue Share

**Live: `commissions`** (31 columns) — full coverage plus lifecycle.

| Spec | Live |
|---|---|
| partnerId, studentId, programId | ✅ (`partner_id`, `student_user_id`, `course_id`) |
| modelType | `model` (`partner_70` / `partner_50` / `ambassador`) |
| eligibleRevenue | ✅ |
| commissionPercentage | `commission_pct` |
| commissionAmount | ✅ |
| verificationStatus | `verification_status` |
| status | `status commission_status` |

Rules stored in `revenue_share_rules` (15 cols) with lifecycle in `ambassador_commission_status_history` (8) and audit in `revenue_audit_logs` (8).

No change.

---

## Module 31 — Payouts

**Live: `payouts`** (19 columns), `partner_payment_submissions` (27), `ambassador_payouts` (27) — full coverage.

`payouts.payout_reference`, `period_start`, `period_end`, `eligible_revenue`, `commission`, `tax_deduction` (TDS), `net_amount`, `processed_at`, `status` — all present.

No change.

---

## Module 32 — Partner Leads

**Live: `partner_leads`** + `lead_assignment_history` (10 cols) + `partner_lead_activities` (7).

`lead_assignment_history`:
- `partner_id`, `lead_id`, `assignment_type` (manual / round_robin / auto), `assigned_at`, `accepted_at`, `completed_at`, `performance_score`, plus reassignment audit.

No change.

---

## Module 33 — Marketing Assets

**Live: `marketing_resources`** (27 columns), with satellites: `marketing_resource_saves`, `marketing_resource_interactions`, `marketing_resource_issues`.

| Spec | Live |
|---|---|
| title, category, file_type, thumbnail, download_url, language, tags, version, status | ✅ |

No change.

---

## Module 34 — Support Tickets

**Two live tables** — one per audience:
- `student_support_tickets` (21 cols)
- `partner_support_tickets` (25 cols)

Each with:
- `ticket_number` (unique, human-readable e.g. `GS-2026-####`)
- `category`, `priority`, `subject`, `description`
- `assigned_to`, `status`, `resolved_at`, `first_response_at`, `sla_breach_at`
- Message tables (`student_support_messages`, `partner_support_messages`) and assignment tables

**Design note:** the split is intentional — RLS is simpler when each ticket table maps to a single audience. A unified `support_tickets` view can be added for admin dashboards without merging the tables.

No change.

---

## Module 35 — Announcements

**Gap Q — no `announcements` table.** Currently announcements are curated in `content_items` with `type='announcement'` (client-side). For a first-class in-app broadcast:

```sql
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,                    -- markdown
  audience text NOT NULL,                   -- all / students / partners / ambassadors / brand_owners / admins
  audience_filter jsonb DEFAULT '{}',       -- role/tier/brand filters
  publish_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  priority text NOT NULL DEFAULT 'normal',  -- low / normal / high / urgent
  cta_label text, cta_url text,
  status text NOT NULL DEFAULT 'draft',     -- draft / scheduled / published / archived
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.announcement_reads (
  announcement_id uuid REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (announcement_id, user_id)
);
```

---

## Module 36 — Notifications

**Live: three per-audience tables** — `student_notifications` (15), `partner_notifications` (8), `ambassador_notifications` (17).

Common columns: `user_id`, `type`, `title`, `message`, `channel` (in_app / email / push), `sent_at`, `read_at`, `status`, plus link metadata.

**Design note:** matches the ticket-table pattern; RLS is per-audience. Preferences in `student_notification_preferences` + `ambassador_notification_preferences`.

**Gap R (small)** — no unified `notifications` union view. Optional convenience view for the admin dashboard, not required for the runtime.

---

## Module 37 — Audit Logs

**Live: `admin_activity_log`** (10 columns), plus per-module activity streams:
- `revenue_audit_logs`, `partner_lead_activities`, `content_analytics_events`, `student_activity`, `career_activity`, `interview_activity`, `ambassador_profile_activity`, `risk_flag_activity`, `partner_support_activity`, `student_support_activity`, `session_join_events`, `admin_finance_actions`.

`admin_activity_log`:
`user_id, module, action, entity_type, entity_id, old_value jsonb, new_value jsonb, ip_address inet, user_agent text, created_at`.

No change — coverage is comprehensive. Retention policy: 24 months hot in Postgres, then archive to Storage (`audit-archive` bucket) via cron.

---

## Gap Summary (Part 2)

| Gap | Scope | Priority |
|---|---|---|
| I. `certificates.expires_at` | Column | Low |
| J. `certificates.pdf_url` + `status` | Columns | Medium |
| K. `payment_links.coupon_id` | Column (post-N) | Medium |
| L. `payment_links.invoice_id` | Column (post-O) | Medium |
| M. `orders` + `order_items` tables | New | **High** — unblocks bundles/coupons/invoices |
| N. `coupons` + `coupon_redemptions` | New | Medium |
| O. `invoices` (GST-compliant) | New | Medium |
| P. `consultations` table | New | Medium |
| Q. `announcements` + `announcement_reads` | New | Low |
| R. Unified `notifications_view` | View | Low |

None of these are blocking today's flows — the platform already books revenue via `enrollments` + `commissions` + `refund_adjustments`. Gaps M/N/O become important when marketing wants coupon campaigns or GST invoicing goes live.

---

## Indexes (canonical)

Live tables already carry the required indexes. Additions to standardize when new tables ship in Part 3:

- `orders`: `(student_user_id, created_at DESC)`, `(status)`, `(order_number)`
- `coupons`: `LOWER(code)` unique (via `citext`), `(status, valid_to)`
- `invoices`: `(invoice_number)` unique, `(student_user_id, issued_at DESC)`
- `consultations`: `(scheduled_at)`, `(consultant_user_id, scheduled_at)`, `(status)`
- `announcements`: `(audience, status, publish_at DESC)`
- Every `*_notifications` table: `(user_id, read_at NULLS FIRST, sent_at DESC)` — already live.

---

## Microservice Readiness

Every module in this document meets the extraction contract:
1. **Namespace prefix** on tables (`orders_*`, `partner_*`, `content_*`, `ambassador_*`, `brand_*`).
2. **FK boundaries** cross namespaces only through `auth.users(id)` and immutable identifiers (`course_id`, `enrollment_id`).
3. **No shared mutable state** across namespaces — cross-module updates use domain events (append to `admin_activity_log` or a future `domain_events` outbox table).
4. **API contracts** in `.lovable/backend-architecture.md` map 1:1 to these namespaces, so a future split (e.g. dedicated Payments service) can carry its tables + `/api/v1/payments/*` routes wholesale.

Ready to execute Gap M (orders/order_items) → N (coupons) → O (invoices) → K/L (linking columns) as a single Part 3 migration set when approved.
