# Glintr Marketing Automation Platform

Backend-only extension. No UI, auth, or payment changes.

## Architecture

```
                   ┌──────────────────────────┐
                   │  AI Content Engine       │
                   │  content.functions.ts    │─── aiChat (AI Router)
                   │                          │─── aiImage
                   └───────────┬──────────────┘
                               │ writes
                               ▼
   ┌──────────────┐   ┌──────────────────────┐   ┌──────────────────┐
   │ mkt_brands   │◄──┤ mkt_content_items    │──►│ mkt_assets       │
   │ mkt_channels │   │ + mkt_content_variants│  │ (images, videos) │
   └──────────────┘   └──────────┬───────────┘   └──────────────────┘
                                 │
                                 │ scheduleContent()
                                 ▼
                       ┌───────────────────┐
                       │ mkt_schedules     │  (cron / recurring)
                       │ mkt_posts (queue) │  (due_at, status, attempts)
                       └────────┬──────────┘
                                │
                       every minute via pg_cron ──► /api/public/hooks/mkt-publish
                                │
                                ▼
                       ┌─────────────────────┐
                       │  worker.server.ts   │
                       │  claims + dispatches│
                       └────────┬────────────┘
                                │
                       ┌────────┴────────┐
                       ▼                 ▼
              publishers/index.ts   mkt_analytics ◄── recordAnalytics()
              linkedin / instagram          │
              facebook / telegram           ▼
              blog / email / …       mkt_learnings (AI optimization)
```

## Publishing lifecycle

1. `generateContent()` — creates `mkt_content_items` + one `mkt_content_variants` per channel.
2. Optional `generateContentImage()` / `generateVideoScript()`.
3. Approval (`decideApproval`) unless `approval_mode = 'auto'`.
4. `scheduleContent()` — inserts `mkt_posts` rows with `due_at` + optional `mkt_schedules`.
5. Cron hits `POST /api/public/hooks/mkt-publish` every minute →
   `runPublishWorker()` claims due posts, dispatches through the right adapter,
   records `external_id`/`external_url`/`provider_response`.
6. Failures back off: attempts 1→5m, 5→60m, etc; max 5 attempts before terminal `failed`.
7. `recordAnalytics()` writes per-post metrics; `recomputeLearnings()` rolls them up.

## Channel adapters (`publishers/`)

| Channel            | Adapter status | Requires |
|--------------------|----------------|----------|
| LinkedIn           | Live via connector gateway | `LINKEDIN` connector, `channel.config.author` |
| Instagram Business | Live via Graph API | `IG_ACCESS_TOKEN`, `channel.config.ig_user_id`, image asset |
| Facebook Page      | Live via Graph API | `FACEBOOK_PAGE_TOKEN`, `channel.config.page_id` |
| Telegram           | Live via Bot API | `TELEGRAM_BOT_TOKEN`, `channel.config.chat_id` |
| Blog               | Live (writes `blog_posts` draft) | none |
| Email              | Live (enqueues `engage_messages`) | Existing engage delivery |
| X / Threads / YouTube Community / WhatsApp Channel | Queued (payload stored for manual dispatch — public APIs restricted/unavailable) | — |

Adding a real adapter for a queued channel: implement a `Publisher` and swap it into `PUBLISHERS` in `publishers/index.ts`.

## Cron

Install with the `supabase--insert` tool (values are project-specific):

```sql
select cron.schedule(
  'mkt-publish-every-minute',
  '* * * * *',
  $$
  select net.http_post(
    url:='https://project--84233618-ecae-483f-a5a7-f069293573cb.lovable.app/api/public/hooks/mkt-publish',
    headers:='{"content-type":"application/json","apikey":"YOUR_ANON_KEY"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);
```

## Preserved

No changes to existing UI routes, `src/integrations/supabase/*`, auth flow, or payment code paths.
