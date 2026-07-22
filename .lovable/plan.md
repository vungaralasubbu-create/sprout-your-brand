Same discipline as the SEO Copilot ask — planning first, blog-first slice, extend the other content types on your explicit go-ahead. Nothing in this plan touches existing content, SEO, metadata, schema, or editor layout.

## Reuse map (no rewrites)

| Capability | Reused source |
|---|---|
| Author profiles | `content_authors` (already has name, bio, expertise, socials) |
| Review workflow states | `blog_posts.status` extended via new state enum, plus new `content_reviews` audit table |
| Freshness signals | `geo_freshness_signals`, `blog_posts.updated_at` |
| Duplicate / thin content | Existing content-intelligence heuristics from SEO Copilot analyzer |
| Trust display on public page | Existing `blog.$slug.tsx` author block (additive slots only) |
| Editor dashboard shell | Existing `admin.content-intelligence.*` route pattern |

## New surface (additive)

### 1. Schema — one migration, all with GRANTs + RLS

- `content_authority_scores` — one row per (content_type, content_id): overall, experience, expertise, authoritativeness, trust, freshness, originality, computed_at, signals JSONB.
- `content_claims` — detected claims per content item: claim_text, claim_type (stat/percentage/salary/job-growth/tech-trend/market/general), offset, status (verified/needs_citation/unverified), citation_id, detected_at.
- `content_citations` — source_url, source_type (gov/research/university/docs/vendor/industry), title, publisher, published_at, accessed_at, notes. Shared library; a claim references one citation.
- `content_reviews` — content_type, content_id, from_status, to_status, reviewer_id, note, created_at. Immutable audit log.
- Extend `blog_posts.status` allowed values via app-level enum (no DB enum change): `draft | ai_generated | under_review | fact_checked | seo_approved | legal_approved | published | archived`. Existing `draft/published` rows keep working.

All tables: RLS on, authenticated read+write scoped by admin role via `has_role`, `service_role` full, no anon.

### 2. One analyzer server fn — `src/lib/admin/content-authority.functions.ts`

- `analyzeContentAuthority({ content_type, content_id, draft? })` returns:
  - 7 scores (heuristic + light AI: `google/gemini-3.6-flash`).
  - Extracted claims with type + offset (regex + AI pass for nuanced claims).
  - Quality checks: duplicate paragraphs, AI repetition (n-gram overlap), weak intro/conclusion, passive-voice ratio, readability grade, missing examples/visuals/FAQ/CTA — same signal set as SEO Copilot, exposed here for authority framing.
  - Freshness verdict: last_updated age, outdated stats (>18mo), broken references (link-health from `link_health_issues`), old tech mentions (versioned tech vocab).
- `attachCitation({ claim_id, citation_id })`, `createCitation(...)`, `markClaimVerified/Unverified(...)` — explicit user actions only, no auto-writes.
- `transitionReviewStatus({ content_type, content_id, to_status, note })` — writes `content_reviews` row + updates `blog_posts.status`. Guards allowed transitions.

Content-type dispatcher: `blog` (v1); `course`, `landing` added per request.

### 3. One CMS side panel — `src/components/authority/authority-panel.tsx`

- Right `<Sheet>` opened from a **"Authority"** button in the blog editor toolbar (sibling to the SEO Copilot button).
- Sections match your spec:
  - Score header (7 scores, color-coded).
  - Claims list — inline highlights, "Attach citation" / "Mark verified" / "Mark needs citation".
  - Citation library — search + create.
  - Author + reviewer picker (from `content_authors`).
  - Quality checks (collapsible).
  - Freshness card with refresh recommendation.
  - Workflow bar: current status + allowed next transitions.

Zero auto-rewrites. Every mutation is an explicit button.

### 4. Editor Dashboard — `src/routes/_authenticated/admin.content-authority.tsx`

New admin route (does not touch existing content-intelligence routes). Six lists driven by `content_authority_scores`:

- Content needing updates (freshness < threshold)
- Low authority pages (overall < 60)
- Pages missing citations (claims with status = needs_citation)
- Pages with outdated info (outdated stats > 0)
- Most trusted pages (overall > 85)
- Lowest quality pages (quality_signals.passing_ratio < 0.5)

Add "Authority" entry under the existing Content group in the admin sidebar, gated by content-editor permission.

### 5. Public-page trust signals (additive, blog only in v1)

In `blog.$slug.tsx`, add a compact "Reviewed by · Fact-checked · Last updated · N sources" strip above the article body, plus a Sources section at the end that lists attached citations. Skipped when no data — zero visual change for posts without authority data.

## Explicit non-goals

- No changes to existing SEO metadata, schema, canonical, OG, sitemaps.
- No changes to existing blog editor composition or layout.
- No changes to public blog design beyond the additive trust strip + sources block, which render only when data exists.
- No auto-rewriting of content, ever.
- No changes to `content_authors` schema (already sufficient).

## Order of build

1. Migration (5 tables + grants + RLS + trigger).
2. Analyzer server fn + workflow transitions + citation CRUD.
3. Authority panel wired into blog editor.
4. Editor dashboard route + sidebar entry.
5. Public trust strip + sources block on blog detail.
6. Extend to courses + landing pages when you say so (adapter ~50 lines each).

## Open items I still need before I write code

1. **Scope**: blog-only v1 (then courses/landing per follow-up), or all three in one pass?
2. **Unshipped prior asks** — still waiting on your steer for the blog perf/analytics/section-regen plan and the Enterprise SEO Phase 2/3/4 direction (options 1/2/3 I offered last time), and the SEO Copilot "blog only vs all 7" pick from the message before this one.

Reply with any of: `authority: blog only` / `authority: all 3` / `authority: pause, do SEO Copilot first` / `authority: pause, do blog perf first`. Whichever you pick I'll build straight through without re-asking.
