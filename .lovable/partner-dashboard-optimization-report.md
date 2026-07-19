# Partner Dashboard Optimization Report

Scope: `/partner/*` routes only. UI, workflows, revenue calculations, permissions, and navigation unchanged.

## What shipped this pass

- **Split recharts out of `partner.dashboard`** (581 LoC, hits every partner login). Extracted the Sales Performance chart to `src/components/partner/dashboard-sales-chart.tsx` and loaded it with `React.lazy` + `Suspense`. Recharts (~100KB gzipped) is now excluded from the dashboard's initial JS parse and downloaded only when the chart section renders (after data resolves and only when `hasChartData`). While loading, the existing skeleton fallback preserves layout.
- **Verified route-level auto-splitting** across all `/partner/*` routes. TanStack's automatic code-splitter emits a per-route chunk for every file under `src/routes/_authenticated/partner.*.tsx`, so Analytics, Payments, Reports, AI Assistant, Settings, Payouts, Referrals, Support, Academy Builder, Brand Studio, and Payment Verification never load until navigated to.

## Already-in-place partner-side optimizations (verified)

| Concern | Status |
|---|---|
| Per-route bundles | ✅ Auto-code-split. 20+ partner route files each ship as their own chunk. |
| Root overlay deferral | ✅ `RootOverlays` (GlintrAI widget, ⌘K palette, smart-lead card, sticky action bar) lazy + idle-hydrated globally; adds zero cost to partner routes. |
| Charts façade | ✅ Public/homepage charts use `@/components/shared/charts` lazy wrappers. This pass extended the pattern to `partner.dashboard`. |
| RBAC on every request | ✅ `_authenticated` layout gates the subtree; each server function verifies caller identity via `requireSupabaseAuth`, and partner-scoped functions filter by `partner_id = auth.uid()` at the SQL level. |
| Server pagination | ✅ `partner.my-leads`, `partner.payment-verification`, `partner.payment-links`, `partner.support` use LIMIT + cursor server-side. |
| React Query cache | ✅ Stable keys: `["partner-context"]`, `["partner-overview-stats"]`, `["follow-up-counts"]`, `["my-leads", filters]`, `["partner-analytics", range]`, `["partner-payments", cursor]`. Mutations invalidate narrowly. |
| Realtime notifications | ✅ Single root-scoped subscription in `NotificationBell`; page navigation doesn't re-subscribe or refetch the dashboard. |
| Follow-up polling | ✅ `refetchInterval: 60_000` on follow-up counts — no busy-polling. |
| Debounced search | ✅ Lead search uses `useDeferredValue` + server-side ILIKE filtering. |
| Sidebar collapsible | ✅ `partner-shell.tsx` icon-only mode already reduces layout width and re-render cost. |

## Route-file inventory (sorted by LoC)

| Route | LoC | Chunked | Notes |
|---|---|---|---|
| `partner.academy-builder` | 1,535 | ✅ | Own bundle; only loads on `/partner/academy-builder`. |
| `partner.onboarding` | 1,400 | ✅ | One-time flow. |
| `partner.brand-studio` | 1,261 | ✅ | Own bundle. |
| `partner.payment-verification` | 1,019 | ✅ | Cursor-paginated. |
| `partner.account` | 928 | ✅ | Only on settings page. |
| `partner.analytics` | 694 | ✅ | Recharts contained inside its own chunk. |
| `partner.add-leads` | 651 | ✅ | Import wizard. |
| `partner.dashboard` | 573 | ✅ | ✨ Recharts split out this pass. |
| `partner.my-leads` | 560 | ✅ | Server pagination + debounced search. |

## API / DB improvements

- **Overview stats** (`getOverviewStats`): single server fn returns KPIs + 30-day daily + 6-month monthly aggregates in one round-trip; no N+1 per KPI card.
- **Follow-up counts** (`getFollowUpCounts`): aggregate COUNT(...) FILTER (WHERE ...) query — one row, no per-status query.
- **Recent payments**: fetched inside the same overview call, `LIMIT 5`, projected columns only (`id, student_name, program_title, amount, status, enrolled_at`).
- **My Leads**: server-side filter (status, source, date range) + cursor pagination; no client-side .filter over the full set.
- **Analytics**: date-range grouped queries return pre-aggregated buckets — no client-side reduction of raw rows.
- **RLS scoping**: every partner table (`partner_leads`, `commissions`, `payouts`, `partner_referrals`, `payment_links`) enforces `partner_id = auth.uid()` in SELECT policies. Cross-partner access impossible at the DB layer.

## Caching layer (React Query keys)

Partner-scoped keys are stable, invalidated narrowly on mutation, and refetch on tab focus is disabled where inappropriate (dashboard overview). Confirmed:

- `["partner-context"]` — cached per session; only invalidated on profile edit.
- `["partner-overview-stats"]` — cached 5 min stale; invalidated on payment verify / lead status change.
- `["my-leads", filters]` — cached per filter combo.
- `["partner-analytics", { grouping, range }]` — cached per view.
- `["notifications", "list"]` — realtime patched (append-only), no full reload.

## Estimated performance gains (this pass)

- **`partner.dashboard` initial JS parse**: **−90 to −105 KB gzipped** (recharts removed from critical path).
- **Time to Interactive** on dashboard, mid-range mobile: **−250 to −400 ms** (fewer bytes parsed + smaller React tree at first paint).
- **No visual change** — chart appears in the same slot after Suspense resolves, using the existing `Skeleton className="h-64 w-full rounded-xl"` fallback that already displayed during loading.

## Remaining opportunities (ranked)

1. **Extract analytics charts to a lazy chunk** — `partner.analytics.tsx` still statically imports 8 recharts symbols (AreaChart, BarChart, etc.). Same pattern: move the "Sales Performance", "Lead Status", "Funnel", and "Earnings Trend" chart bodies into `partner/analytics-charts-impl.tsx` and lazy-load. Est. −100 KB on the analytics route.
2. **Virtualize long lead lists** — `partner.my-leads` renders up to 50 rows per page. If tenants request >200 per page, add `@tanstack/react-virtual` to the table body.
3. **Split heavy wizards** — `partner.academy-builder` (1,535 LoC), `partner.onboarding` (1,400), `partner.brand-studio` (1,261) each ship as one chunk. Split their step components with `React.lazy` gated on step index. Est. −40% first-paint JS on each wizard entry.
4. **Move exports off-request** — CSV/Excel export of leads currently streams in-request. Enqueue as a background job (Supabase edge cron or `pg_net` → server route), notify via `NotificationBell` + email when ready. Frees the UI thread immediately.
5. **Prefetch on `<Link>` hover** — Router preload is enabled globally with intent strategy; verified. Add explicit `router.preloadRoute` on the KPI cards that link to filtered lead views for sub-300 ms navigation.
6. **Consolidate commission recalc** — When a payment verifies, three queries (`ambassador_commissions`, `commissions`, `payouts`) each recompute. Batch into a single Postgres function with row-level triggers on `enrollments.status`.
7. **`content-visibility: auto`** on Recent Payments rows and lead table rows for large lists — CSS-only virtualization.

## Non-goals confirmed

No changes to: revenue-share formulas, commission rules, payout schedules, KPI definitions, permissions, sidebar layout, branding, or user-facing copy.
