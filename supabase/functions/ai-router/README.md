# ai-router

Central AI gateway Edge Function. POST-only, JSON in / JSON out.

## Request

```json
{
  "task": "generate_blog",
  "prompt": "...",
  "options": {},
  "provider": "openai",
  "model": "gpt-4o-mini",
  "stream": false
}
```

Supported tasks: `generate_blog`, `generate_text`, `summarize`, `classify`, `embed`.

## Response (current milestone)

```json
{
  "success": true,
  "message": "AI Router Ready",
  "requestId": "…",
  "task": "generate_blog",
  "provider": "openai"
}
```

## Secrets

- `OPENAI_API_KEY` — required before enabling OpenAI provider.
- `ANTHROPIC_API_KEY` — optional, for Claude.
- `GEMINI_API_KEY` — optional, for Gemini.

Read via `Deno.env.get(...)` inside the function only. Never returned to clients.

## Structure

- `index.ts` — HTTP entry, CORS, timeout, error boundary.
- `lib/validate.ts` — input validation.
- `lib/router.ts` — task → provider dispatch.
- `lib/providers.ts` — pluggable provider registry (OpenAI, Claude, Gemini).
- `lib/retry.ts` — exponential-backoff retry with full jitter.
- `lib/logger.ts` — structured JSON logging.
- `lib/response.ts` — JSON / error helpers.
- `lib/cors.ts` — CORS headers + preflight.

Streaming: `stream: true` is accepted by validation; wire providers to expose an async iterable and switch the entry to `TransformStream` when enabling.
