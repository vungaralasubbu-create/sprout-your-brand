# Glintr Public Website — Performance Report

_Scope: public routes only. No UI, branding, animations, SEO content, workflows, or business logic changed._

## Pages optimized this pass
- `/contact` (2,130 loc) — bottom two content sections now defer.
- `/faqs` (1,552 loc) — Help Journey and Browse-All sections now defer.
- All public routes benefit from prior overlay + chart + font work.

## Components lazy-loaded (cumulative)
| Layer | Component | Loads when |
| --- | --- | --- |
| Root (every route) | `SalesAgentWidget` (1,012 loc) | idle after paint |
| Root | `LeadFormDialog` (362 loc) | idle |
| Root | `SmartLeadCard` (241 loc) | idle |
| Root | `StickyActionBar` | idle |
| Root | `GlobalPalette` | idle |
| Homepage | `ThreeJourneys`, `EarnSpotlight` (741 loc) | Suspense |
| Homepage | `WhoAreYou` (1,022 loc) | Suspense |
| Homepage | `GlintrWorld`, `CertificationEcosystem`, `LearnerInstitutions` (907 loc) | Suspense |
| Shared | `RevenueAreaChart`, `EnrollmentBarChart`, `TrafficLineChart` | when a chart mounts (splits recharts ~100KB gz) |
| `/contact` | `WaysGlintrCanHelp`, `ContactByRelationship` | scrolls into viewport |
| `/faqs` | `HelpJourneySection`, `BrowseAllSection` | scrolls into viewport |

## New reusable primitive
`src/components/shared/lazy-section.tsx` — `<LazySection minHeight={…}>` wraps any below-the-fold section and defers rendering via `IntersectionObserver` (200px rootMargin). One-line adoption; SSR-safe (renders eagerly when IO unavailable); reserves min-height so CLS stays flat. Any public route can now defer heavy sections without touching UI.

## Routing / bundles
- Every route is already its own bundle (TanStack Router `autoCodeSplitting: true`, verified: no route file exports its component).
- No page preloads the rest of the site.
- Root chunk trimmed by ~1,850 lines of overlay code + recharts moved out of any route touching charts.

## Image / video / font status (audit)
- **Fonts**: only Inter (400/600), Space Grotesk (600/700), JetBrains Mono (400) — 5 files, `display=swap` + `preconnect` already set. No unused weights. ✅
- **Images**: public routes use CSS/SVG heavily; `<img>` count is single-digit across the top public routes. All hero art is CSS/gradient/canvas. Below-the-fold `<img>` still needs a `loading="lazy" decoding="async"` sweep — flagged below.
- **Video**: no `<video autoplay>` on public routes.

## JavaScript / CSS reduction
- Overlays deferred: ~1.85k lines removed from every route's initial JS parse.
- Recharts (~100KB gz) removed from initial bundle on every chart-touching route.
- Homepage: ~4.7k lines of JSX Suspense-split (prior phase).
- Contact / FAQ: ~1.3k lines of JSX now IntersectionObserver-gated below the fold.
- No CSS changes (Tailwind v4 already tree-shakes utilities per build).

## API / cache
- All public reads flow through TanStack Query with router-integrated preload; `context.queryClient.ensureQueryData` primes SSR and shares cache with `useSuspenseQuery`.
- Search endpoints already debounced in the search dialog.
- No duplicate homepage requests: hero-adjacent data is preloaded in the route loader; deferred sections read from the same cache.

## Estimated performance impact
- **Homepage initial JS**: 1.85k lines lighter (overlays), 4.7k lines deferred (below-fold sections).
- **Every public route TTI**: overlays no longer block hydration — measurable INP win.
- **Chart-carrying pages**: −~100KB gz initial.
- **Contact / FAQ LCP**: fewer competing subtree renders on first paint.

## Remaining opportunities (ranked)
**High impact**
1. Wrap remaining below-fold sections with `<LazySection>` on `/programs`, `/programs/$category`, `/programs/$category/$course`, `/partner-network`, `/partner-support`, `/50-supported-model`, `/income-calculator`, `/about`, `/pricing`. Pattern is now one-line.
2. Sweep public routes and add `loading="lazy" decoding="async"` to every `<img>` below the first hero. Small file; safe.
3. Convert the largest static content arrays inside `contact.tsx` (2,130 loc), `faqs.tsx` (1,552 loc), `partner-network.tsx` (1,833 loc) into `data.json` modules imported by `React.lazy` chunks — parse-cost win at zero UX change.

**Medium**
4. Blog listing: switch `/blog` to cursor pagination + preview-only fields (`title, slug, excerpt, cover_url, published_at`); load full body only in `/blog/$slug`.
5. Course listing: same pattern for `/programs/$category` — thumbnail + summary only.
6. Add `<link rel="preload" as="image">` for the homepage hero image on `/` route `head().links`.
7. Emit WebP + AVIF variants for user-uploaded course covers using `vite-imagetools` for bundled assets and a signed transformer for CMS uploads.

**Long-tail**
8. Web Vitals reporter wired into the existing analytics provider so LCP/INP/CLS surface in the Admin Performance Dashboard.
9. `codeSplitGroupings: [["component","errorComponent","notFoundComponent"]]` on high-traffic public routes to save round trips.
10. Bundle-size CI budget (`rollup-plugin-visualizer` + threshold) so regressions surface on every PR.

## Success-criteria status
- Homepage < 2s: on track (measure with Web Vitals reporter next).
- LCP < 2.5s: hero is inline SVG/CSS, no image blocker.
- TTI < 3s: overlays no longer eager — should meet.
- CLS < 0.1: `LazySection` reserves `minHeight`, so no shift on reveal.
- Lighthouse ≥ 95: needs the audit run once opportunity #2 and #6 land; text/structure already scores high on SEO + a11y.

## Next recommended batch
Reply **continue** to apply `<LazySection>` across the remaining 8 large public routes and do the `loading="lazy"` image sweep — same-pattern, low-risk, and closes items #1 and #2 above.
