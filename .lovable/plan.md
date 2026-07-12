# Sales Partner Dashboard & Revenue Workspace

Scope is very large (30 sections, 20+ routes, RBAC, payouts, statements). To ship this reliably I'll build it in **4 phases**, each independently usable in Preview. Each phase ends with a working Preview state so you can review before I continue.

I'll reuse the existing schema (`partner_applications`, `partners`, `commissions`, `payouts`, `payout_items`, `revenue_share_rules`, `enrollments`, `partner_referral_events`, `course_applications`, `user_roles`) — no duplicate systems. New tables only where truly missing (leads, follow-ups, agreements, sales enablement, notifications, support tickets, statements, attribution reviews).

---

## Phase A — Foundation & Access (this turn)

**DB migration** (single migration, RLS + GRANTs on every new table):
- `partner_leads` — own + assigned leads, `owner_partner_id`, `assigned_partner_id`, `lead_model` (`own` | `supported`), normalized phone/email, status enum, source, notes, timestamps.
- `partner_lead_activities` — timeline (note, follow_up, stage_change, link_shared, application_started, payment_recorded, enrollment_verified, revenue_pending, revenue_approved).
- `partner_follow_ups` — lead_id, due_at, type, status, result, next_follow_up_id.
- `partner_agreements` + `partner_agreement_acceptances` — versioned terms consent.
- `partner_program_links` — partner_id, course_id, ref_code, click/session/application/enrollment/revenue counters (backed by joins to `partner_referral_events`).
- `partner_sales_enablement` — per-course admin content (icp, pain points, positioning, whatsapp/email pitch, objection handling, talking points).
- `partner_notifications` + `partner_notification_preferences`.
- `partner_support_tickets` + `partner_support_messages`.
- `partner_statements` (materialized monthly rollup metadata; PDFs generated on demand).
- `partner_lead_attribution_reviews` — duplicate/conflict workflow.
- Extend `partners` with `sales_model` (`own` | `supported` | `dual`), `partner_code` (unique), `onboarding_status`, `payout_min_threshold`, `bank_account_last4`, masked banking columns.
- Extend `user_roles` app_role enum to include `partner` if not present.
- Helper functions: `is_partner(uuid)`, `partner_id_for(uuid)`, `normalize_phone(text)`, `normalize_email(text)`.
- RLS everywhere: partners see only their own rows via `partner_id_for(auth.uid())`. Bank/payout columns unreadable except via masked view. Admins via existing `is_admin()`.

**Auth & routing shell**:
- Add `src/routes/_authenticated/partner/` gated subtree (uses integration-managed `_authenticated` layout).
- Nested layout `_authenticated/partner/route.tsx` — checks `has_role('partner')` via server fn; redirects non-partners to `/partner/apply`.
- Left sidebar navigation (`PartnerShell`) with 14 items, mobile bottom nav.
- Server fns in `src/lib/partner/*.functions.ts` (all with `requireSupabaseAuth`): `getPartnerProfile`, `getDashboardStats`, `getEligiblePrograms`, `listLeads`, `createLead`, `listAssignedLeads`, `getLeadDetail`, `addLeadActivity`, `listFollowUps`, `createFollowUp`, `listLinks`, `createLink`, `listEarnings`, `listPayouts`, `requestPayout`, `getRevenueRulesExplanation`, `listNotifications`, `listStatements`, `createSupportTicket`.
- Dashboard overview page (`/partner/dashboard`) — greeting, 4 KPI cards, active model card, quick actions grid, today's follow-ups.

**Preview verify**: signed-in partner lands on `/partner/dashboard`, sees zero-state KPIs, sidebar navigation works.

---

## Phase B — Sales workflow (leads, follow-ups, programs)

- `/partner/programs` marketplace — reads `courses` where `partner_sale_eligible=true` via existing publishable client; filters, search.
- `/partner/programs/$course` sales enablement page — pulls `partner_sales_enablement` (admin CMS content), Copy Message / Copy Email buttons using `navigator.clipboard`.
- `/partner/leads` — Kanban + Table view, Add Lead modal with dedupe check (normalized phone/email) → attribution review row if collision.
- `/partner/leads/$leadId` — profile, timeline, notes, stage change, follow-up scheduling, "Start Application" using existing `course_applications` insert with `partner_id` + `lead_id` attribution.
- `/partner/assigned-leads` — supported model workspace, filtered by `assigned_partner_id`.
- `/partner/follow-ups` — Today/Overdue/Upcoming/Completed tabs.
- `/partner/links` — generate `?ref=PARTNERCODE`, copy + QR (using `qrcode` lib), aggregate counters from `partner_referral_events` and `commissions`.

**Preview verify**: add a lead, schedule a follow-up, generate a link, start an application for a lead.

---

## Phase C — Earnings, revenue, payouts

- `/partner/earnings` — table over `commissions`, KPI cards for each status bucket. Snapshot of the `revenue_share_rules` row applied is already stored per-commission — display it.
- `/partner/revenue-rules` — plain-language explanation page with the illustrative 70%/50% examples clearly labelled "Illustrative only".
- `/partner/payouts` — history table, request modal (locks selected commissions), status timeline, 48-hour language.
- Server-side payout request: validates min threshold, locks commissions via `payout_items` insert inside a transaction (RPC `request_partner_payout`).
- `/partner/performance` — aggregate metrics over date filters (7/30/90/custom) with real data.
- `/partner/statements` — monthly rollup list with "Partner Earnings Statement" label (explicitly NOT payslip); on-demand PDF via server fn using `pdf-lib`.

**Preview verify**: earnings zero-state, payout button disabled until threshold met, revenue rules page renders with illustrative examples.

---

## Phase D — Onboarding, profile, notifications, support, admin, careers

- First-time onboarding wizard (7 steps as specified) — persists to `partners.onboarding_status`, agreement acceptance rows, sales model choice, bank details (last 4 stored on `partners`, full details in `partner_payout_details` with column-level restricted read).
- `/partner/profile` — sections per spec; bank change triggers `partner_verification_requests` row instead of direct update.
- `/partner/notifications` — center + prefs.
- `/partner/support` — tickets + messages.
- `/careers/sales-pathways` — public informational page contrasting Independent Partner vs Employment.
- Admin extensions under `_authenticated/admin/partners/*`: approve/reject/suspend, model toggles, program assignment, attribution review queue, revenue approve/hold/reverse, payout approve/mark-paid, statements viewer, agreements viewer, support triage.

**Preview verify**: full onboarding flow, admin can approve a partner, notifications and support work end-to-end.

---

## Design & security guardrails (applied to every phase)

- Light-first, white cards, soft grey surfaces, navy text, blue/cyan accents — same tokens as homepage. No crypto/MLM vibes.
- Every partner query gated by `partner_id_for(auth.uid())` in RLS AND server fn — no frontend-only filtering.
- Bank/payout details: full number never returned to client; only `bank_account_last4` and `bank_name` exposed.
- All revenue math server-side using existing `revenue_share_rules` priority order (partner-specific → program → campaign → default). No frontend percent hardcoding.
- Clicks in `partner_referral_events` are analytics only — never inserted into `commissions`.
- Sensitive changes (bank account, sales model) require verification row before taking effect.
- All CMS content (sales enablement, agreements, revenue rules copy) editable by admin, not hardcoded in components.

---

## Technical notes

```text
src/routes/_authenticated/partner/
  route.tsx                (partner role gate + sidebar shell)
  dashboard.tsx
  programs.index.tsx
  programs.$course.tsx
  leads.index.tsx
  leads.$leadId.tsx
  assigned-leads.tsx
  follow-ups.tsx
  links.tsx
  earnings.tsx
  revenue-rules.tsx
  payouts.tsx
  performance.tsx
  statements.tsx
  profile.tsx
  notifications.tsx
  support.tsx
  onboarding.tsx

src/lib/partner/
  *.functions.ts           (all createServerFn + requireSupabaseAuth)
  attribution.server.ts    (dedupe + review workflow)
  revenue.server.ts        (rule resolution)
  payouts.server.ts        (request + lock)

src/components/partner/
  partner-shell.tsx, kpi-card.tsx, model-card.tsx,
  lead-kanban.tsx, lead-table.tsx, lead-form.tsx,
  follow-up-form.tsx, earnings-table.tsx, payout-request-modal.tsx, etc.
```

I'll start Phase A now: DB migration first (needs your approval), then build the shell + dashboard on top of it. Say "go" to proceed, or tell me to reorder / trim phases.
