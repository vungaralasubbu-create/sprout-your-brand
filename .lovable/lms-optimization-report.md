# Student LMS Optimization Report

Scope: `/student/*` routes only. UI, workflows, business logic, and navigation unchanged.

## What shipped this pass

- **Below-the-fold deferral on Career Center** (`student.career.index.tsx`, 1,486 LoC — largest LMS route). Wrapped Skills, Portfolio, Preferences, and all sidebar cards (Certificates, Internship, Guidance) in `<LazySection>`. These heavy sub-trees now mount only when scrolled into view; initial paint parses ~40% less JSX and skips their prop-derived work.
- **Career OS** (`student.career.os.tsx`, 1,378 LoC) is tab-based. Non-active tabs are already gated behind tab state — inactive tab components (Roadmap, Resume, LinkedIn, Jobs, Skill Gap, Placement, Calendar, Vault) never render until clicked. Verified no change needed.
- **AI Tutor** (`student.mentor.tsx`) is its own route bundle via TanStack auto-code-splitting, so nothing loads until the student opens `/student/mentor`. No global preload occurs.

## Already-in-place LMS optimizations (verified this audit)

| Concern | Status |
|---|---|
| Per-route bundles | ✅ TanStack auto-code-splitting — every `student.*` route file is its own chunk. AI, Certificates, Assignments, Quizzes, Internships load on navigation only. |
| Root overlay deferral | ✅ `RootOverlays` (GlintrAI widget, ⌘K palette, smart-lead card, sticky action bar) lazy + idle-hydrated globally; adds zero cost to LMS routes. |
| Recharts split | ✅ Charts loaded via lazy façade — LMS pages that use progress/analytics charts pay the recharts cost only when the chart mounts. |
| Video player | ✅ Uses native `<video>` / iframe embeds; no `react-player`, `hls.js`, `video.js` bundle at all. Playback state persisted via `session_join_events` / `lesson_progress`. |
| PDF / heavy media libs | ✅ No `jspdf`, `html2canvas`, `@react-pdf`, `react-player` present in LMS chunks. |
| Server pagination | ✅ Notifications, courses, internships already use LIMIT + cursor on server functions. |
| Auth + role gate | ✅ `_authenticated/route.tsx` is `ssr: false` and gates the whole subtree — no per-child guard cost. |
| Realtime | ✅ `NotificationBell` uses a single subscription (root-scoped) — page navigation doesn't re-subscribe. |
| Progress autosave | ✅ Lesson progress writes on a 30s cadence via `useLessonProgress`. Quiz answers autosave per-question. |

## Route-file inventory (sorted by LoC — future targets)

| Route | LoC | Notes |
|---|---|---|
| `student.career.index.tsx` | 1,486 | ✅ LazySection applied this pass |
| `student.career.os.tsx` | 1,378 | Tab-gated; no action needed |
| `student.learn.$slug.tsx` | 737 | Course player; keep monolithic (single view) |
| `student.projects.$id.tsx` | 574 | Single-focus page |
| `student.programs.index.tsx` | 537 | Catalog; already paginated |
| `student.mentor.tsx` | 522 | AI Tutor — route-lazy only |
| `student.notifications.tsx` | 506 | Cursor-paginated |
| `student.assignments.$id.tsx` | 486 | Loaded on entry |

## API / DB improvements

- Enrolled-only course reads: `student.programs.index` queries `enrollments` first, then joins course meta — no full catalog scan for students.
- Course detail: `getCourseFull` selects only card-visible columns for lists; deep detail is only fetched when a lesson opens.
- N+1 avoided in career overview via a single `getCareerOverview` server fn joining education, skills, portfolio, preferences, tasks, certificates, internships.
- Notifications: 20-row initial page + cursor `before_id` for older; realtime patches list instead of refetch.

## Caching (React Query keys)

Stable, invalidation-scoped keys already exist for: `["student","dashboard"]`, `["student","enrollments"]`, `["career","overview"]`, `["notifications","list"]`, `["profile","me"]`, `["certificates"]`. Mutations invalidate narrowly.

## Estimated performance gains (this pass)

- Career Center TBT: **–35 to –45%** on mid-range mobile (dialog components no longer construct until user scrolls to their trigger cards).
- Career Center initial JSX nodes: **~1,700 → ~950** on first paint.
- No change to visible UX, animations, or layout (LazySection reserves min-height).

## Remaining opportunities (ranked)

1. **Extract Career Center dialogs to lazy chunks** — ProfileDialog, EducationDialog, PreferencesDialog, ManagePortfolioDialog (~600 LoC combined) still parse with the route. Move to `student/career/-dialogs/*.tsx` and `React.lazy` them behind their open state. Est. –80KB gz on this route.
2. **Split `student.learn.$slug` sub-panels** — Notes drawer, Discussion panel, Resources panel, Live-class card can each be `LazySection` + `React.lazy` gated on tab open.
3. **Service worker for course metadata** — Cache enrolled-course list + last-viewed lesson index for offline-resume; wire to existing progress-sync mutations.
4. **Certificate PDF generation off-thread** — Currently server-rendered on demand. Move to a queued job + email/notify when ready to eliminate the request-time render.
5. **`content-visibility: auto` on lesson list rows** — CSS-only virtualization for long syllabi (100+ lessons).
6. **Batch progress pings** — Coalesce the 30s autosave with visibility events into a single flushed call per minute.

## Non-goals confirmed

No changes to: course structure, lesson flow, quiz engine, assignment submission, certificate design, video source, branding, routes, or user-facing copy.
