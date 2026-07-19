// Supabase Edge Function entry point.
// Central AI gateway for the Glintr platform. Infrastructure-only:
// validates requests and returns a readiness envelope. Provider execution
// will be wired in a follow-up prompt.
//
// Layout:
//   config.ts             — constants, supported providers/tasks, env access
//   types.ts              — request/response contracts, AIProvider interface
//   errors.ts             — typed HTTP errors
//   validators.ts         — request validation
//   router.ts             — request pipeline
//   helpers/cors.ts       — CORS headers
//   helpers/logger.ts     — structured JSON logging (secret-safe)
//   helpers/retry.ts      — withRetry (exp. backoff + jitter) + withTimeout
//   providers/index.ts    — provider registry + resolveProvider()
//   providers/openai.ts   — OpenAI adapter (placeholder)
//   providers/anthropic.ts— Anthropic adapter (placeholder)
//   providers/gemini.ts   — Gemini adapter (placeholder)
import { handle } from "./router.ts";

// deno-lint-ignore no-explicit-any
(globalThis as any).Deno?.serve?.((req: Request) => handle(req));
