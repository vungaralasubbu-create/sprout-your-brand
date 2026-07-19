# Glintr Performance & Modular Architecture Plan

This is a large refactor. Attempting all of it in one pass would break the running app. I'll ship it in **5 phases**, each independently verifiable, so the platform stays live throughout.

---

## Phase 1 — Route-level code splitting & bundle diet (biggest single win)

Goal: cut initial JS by 60–80%. Every dashboard becomes its own chunk.

- Convert heavy route files to `.lazy.tsx` split: `admin.*`, `partner.*`, `brand.*`, `instructor.*`, `student.*`, `_authenticated/counsellor/*`, `_authenticated/admin/*`, `launch-your-brand/*`, `academy-builder`, `business-os`, `sales-ai`, `ai-os`, `automation-hub`, `engage`, `enrollment-brain`.
- Move Homepage 3D hero, ecosystem grid, success stories carousel, mobile carousels behind `React.lazy` + `<Suspense>` with skeletons.
- Remove any `export function XComponent` from route files (blocks auto-splitting).
- Configure per-route `codeSplitGroupings` for the biggest routes.
- Add `vite-bundle-visualizer` script; commit a baseline size report in `.lovable/perf-baseline.md`.

Success: Homepage JS < 250KB gzipped, Admin routes lazy-loaded, no admin code in public bundles.

---

## Phase 2 — Data layer: TanStack Query everywhere + query hygiene

Goal: kill duplicate fetches, add real caching, tighten Supabase reads.

- Standardize on `queryOptions` + `ensureQueryData` (loader) + `useSuspenseQuery` (component) across all dashboards.
- Set global defaults: `staleTime` 60s for reference data (categories, programs, templates, settings, navigation), 5m for brand data, 10s for dashboard stats.
- Audit every `.select('*')` — replace with explicit column lists. Priority tables: `programs`, `blog_posts`, `brand_applications`, `lead_intelligence`, `email_logs`, `automation_runs`, `enrollments`.
- Add cursor pagination helpers (`useCursorPage`) for admin tables: leads, email logs, automation runs, enrollments, brand applications.
- Parallelize independent loader fetches with `Promise.all` inside server fns.
- Add indexes for common WHERE/ORDER BY combos found via `supabase--slow_queries` (created_at DESC, status, brand_id, user_id).

Success: no `select('*')` in hot paths, dashboard stats P95 < 500ms.

---

## Phase 3 — AI & heavy jobs → background queue

Goal: no AI call blocks the UI; heavy generation is durable.

- Introduce **Inngest** connector for durable background execution (already documented in stack).
- Move to Inngest: AI Academy Builder generation, Brand Website generation, AI blog batch generation, AI email content, bulk campaign send, CSV/PDF exports, certificate generation, nightly analytics rollups, automation workflow resumes.
- Replace synchronous AI calls in UI with: enqueue → return `job_id` → poll job status → stream/reveal result. Add `ai_jobs` table with status + result.
- Stream AI Gateway responses (SSE) where the UI expects a single completion (Ask GlintrAI, counsellor copilot, AI content writer).
- Cache identical AI prompts (hash of prompt+model) in `ai_response_cache` with TTL.

Success: Website generation, AI batch runs, exports never freeze the tab.

---

## Phase 4 — Assets, images, and animations

- Image transformer route with allow-list + `sharp` for WebP/AVIF (see `perf` knowledge).
- `<Img>` component: `loading="lazy"`, `decoding="async"`, `srcset`, WebP first with JPEG fallback.
- Preload only the homepage LCP hero via `head().links`.
- Wrap Framer Motion sections in `IntersectionObserver` — pause when off-screen; respect `prefers-reduced-motion`.
- Compress upload path in the brand website builder (client-side resize before Supabase Storage put).

Success: LCP < 2.0s on Homepage & Programs.

---

## Phase 5 — Monitoring, preloading & production hygiene

- Web Vitals reporter → new `perf_metrics` table (FCP/LCP/TTI/INP/CLS + route + user role).
- Admin **Performance Dashboard** at `/admin/performance`: Web Vitals p50/p95, slowest queries (from `pg_stat_statements`), largest routes, top AI cache misses, background job queue depth.
- Router preload rules: `Homepage→Programs`, `Programs→Course Detail`, `Dashboard→Analytics` only (never global).
- Sign-out cache teardown + `onAuthStateChange` filtering audit (already partially in place).
- Compute-size check via `db_health`; recommend Cloud instance upgrade only if metrics justify it.

Success: Admin can see real numbers; no accidental global preload.

---

## Non-goals / clarifications

- **No repo-splitting into micro-frontends.** "Independently deployable modules" in a single TanStack Start app = route-level chunks + shared services. True multi-repo micro-frontends aren't compatible with this stack and would slow you down, not speed you up.
- **Website Builder isolation**: achieved via Phase 1 code split + Phase 3 background jobs — the generator runs on Inngest workers, not in the user's tab.
- **No rewrite of Supabase client** or authentication flow.
- **No visual/UX changes** unless a component is genuinely dead-duplicated.

---

## Technical anchor points

- `src/routes/_authenticated/admin/*` — biggest offenders, split first.
- `src/lib/automation/*`, `src/lib/engage/*` — already server-fn shaped; wrap dispatchers in Inngest handlers.
- `src/components/home/*` — lazy-load carousels + ecosystem grid.
- New `src/lib/perf/` — Web Vitals reporter, `<Img>`, `useVisible`, `useCursorPage`.
- New tables: `ai_jobs`, `ai_response_cache`, `perf_metrics`, plus indexes on hot tables.

---

## Execution order

I'll start with **Phase 1** (code splitting) because it's the highest-leverage change with the lowest risk and gives you visible speed today. I'll ship each phase as a discrete change so you can approve and verify before the next one begins.

Reply **"go"** to start Phase 1, or tell me to reorder / drop phases.
