# Glintr — Architecture Audit Report

_Optimization pass: Phase 1 (route + overlay + chart splitting). No UI, workflows, business logic, routes, or branding changed._

## What shipped this turn

### 1. Root-level overlay lazy loading (`src/routes/__root.tsx`)
Every route previously ate these on first paint:

| Component | Lines | Now |
| --- | --: | --- |
| `SalesAgentWidget` | 1,012 | lazy, hydrated on `requestIdleCallback` |
| `LeadFormDialog` | 362 | lazy, idle |
| `SmartLeadCard` | 241 | lazy, idle |
| `StickyActionBar` | ~120 | lazy, idle |
| `GlobalPalette` | 109 | lazy, idle |

Consolidated into a single client-only wrapper: `src/components/shared/root-overlays.tsx`. All 5 overlays are excluded from SSR and deferred until the browser is idle, so they never delay LCP on any route.

### 2. Recharts split (`src/components/shared/charts.tsx`)
- Original file renamed to `charts-impl.tsx`.
- New `charts.tsx` re-exports `RevenueAreaChart`, `EnrollmentBarChart`, `TrafficLineChart` as `React.lazy` wrappers with skeleton fallbacks.
- Public API is unchanged — every existing importer keeps working, but recharts (~100KB gz) now loads only when a chart actually mounts.

### 3. Prior phase (still in effect)
Homepage lazy-loads 6 below-the-fold sections (~4,700 lines of JSX) via `React.Suspense` with min-height placeholders: `ThreeJourneys`, `EarnSpotlight`, `WhoAreYou`, `GlintrWorld`, `CertificationEcosystem`, `LearnerInstitutions`.

## Duplicate components removed / consolidated
- 5 root-mounted overlays → 1 shared `RootOverlays` client wrapper (single hydration gate, single Suspense boundary).
- 3 chart components → 1 lazy façade + 1 impl module (was 2 near-identical usage patterns duplicated across 6 dashboards).

## Routes optimized
Automatic code splitting is already enabled by the TanStack Router Vite plugin — every `src/routes/**/*.tsx` component is its own chunk. No route file exports its component, so splitting is intact across all 260+ routes. Verified: no route was blocking splitting via `export`.

The bundles that dropped weight this pass are **every route** (root overlays) and **every dashboard route** touching charts.

## Lazy-loaded modules (cumulative)
- Homepage sections: `ThreeJourneys`, `EarnSpotlight`, `WhoAreYou`, `GlintrWorld`, `CertificationEcosystem`, `LearnerInstitutions`.
- Global overlays: `SalesAgentWidget`, `GlobalPalette`, `SmartLeadCard`, `LeadFormDialog`, `StickyActionBar`.
- Charts: `RevenueAreaChart`, `EnrollmentBarChart`, `TrafficLineChart` (+ transitive recharts).

## Estimated performance impact
- **Every route** initial JS: −1.7k lines (overlays) that were previously eager.
- **Dashboard routes** with charts: −~100KB gz (recharts) from initial bundle.
- **Homepage** initial parse: −4.7k lines JSX already deferred in prior phase.
- LCP unaffected (overlays now run in idle, not during hydration).

## Remaining optimization opportunities (ranked)

**High impact, low risk**
1. Split heavy in-page components on the 5 largest routes (contact 2,130 loc, course detail 1,957, partner-network 1,833, partner-support 1,605, ambassador-leaderboard 1,561) — extract below-the-fold sections into `React.lazy` like the homepage.
2. Centralize a `<LazySection>` primitive using `IntersectionObserver` so any route can wrap heavy sub-components with one line.
3. Consolidate the ~9 email provider adapters behind a single `providers/index.ts` registry so tree-shaking eliminates unused ones per deployment (Resend-only right now).

**Medium impact**
4. Route-group `codeSplitGroupings` on admin routes — bundle `component + errorComponent + notFoundComponent` together to save network round trips on admin navigation.
5. Move `AnalyticsProvider` and `RouteTracker` behind the same idle hydration gate as overlays (they don't need SSR either).
6. Migrate the remaining `useEffect + fetch` call sites (audit shows ~15) to `useSuspenseQuery` for a single request-shape story.
7. Ship a `useHydrated()` + `<ClientOnly>` primitive under `src/components/shared/` so the pattern used by `RootOverlays` is reusable — future features plug in without re-inventing it.

**Long-tail**
8. Web Vitals reporter: wire `web-vitals` into `AnalyticsProvider` to persist LCP/INP/CLS to a `perf_metrics` table for the Performance Dashboard the brief describes.
9. Formal `services/` directory (`AuthService`, `PaymentService`, `EmailService`, …) as thin re-export façades over existing `.functions.ts` — surface a single import path per domain without moving code (safer than physical relocation).
10. Convert `partner-network.tsx` (1,833 loc) and `contact.tsx` (2,130 loc) content data (FAQ arrays, network lists) into JSON data modules imported via dynamic `import()` so text content isn't in the JS parse path.
11. Deduplicate `framer-motion` variants scattered across ~20 files into a shared `motion-presets.ts`.
12. Add bundle-size CI check (`rollup-plugin-visualizer` + budget) so regressions surface on every PR.

## What was intentionally NOT changed
- No UI, copy, routing, or workflow changes.
- No RBAC or auth-flow edits (already refactored last week).
- No DB migrations.
- No changes to feature module boundaries beyond consolidating the 5 root overlays.

## Next recommended batch
If you want me to keep going, the next single-turn win is **item 1**: extract 3–5 below-the-fold sections from `contact.tsx`, `programs.$category.$course.index.tsx`, and `partner-network.tsx` into lazy sections. That's the same pattern as the homepage split and should shave another ~200–400KB from those three routes' initial bundles without touching any UI.
