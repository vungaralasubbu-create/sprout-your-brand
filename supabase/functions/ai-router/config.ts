// Central configuration for the AI Router.
// Secrets are read from Supabase Edge Function environment variables.
// Never hardcode credentials. Never log these values.

export const CONFIG = {
  // Request handling
  requestTimeoutMs: 30_000,
  maxPromptChars: 200_000,

  // Retry policy for upstream provider calls (used by helpers/retry.ts)
  retry: {
    maxAttempts: 3,
    baseDelayMs: 400,
    maxDelayMs: 4_000,
    jitter: true,
  },

  // Provider IDs supported by the router. Adding a new provider only requires
  // registering it in providers/index.ts — no changes elsewhere.
  providers: ["openai", "anthropic", "gemini"] as const,

  // Task types the platform is allowed to request. This is a whitelist —
  // unknown tasks are rejected at validation.
  tasks: [
    "generate_blog",
    "generate_metadata",
    "generate_faq",
    "generate_landing_page",
    "generate_course",
    "generate_social_post",
    "generate_email",
    "generate_seo",
    "generate_certificate_text",
    "generate_ad_copy",
    "chat",
  ] as const,
} as const;

export type ProviderId = (typeof CONFIG.providers)[number];
export type TaskType = (typeof CONFIG.tasks)[number];

// Env accessor — keeps `Deno.env.get` calls in one place so they can be mocked.
export function getSecret(name: string): string | undefined {
  try {
    // deno-lint-ignore no-explicit-any
    return (globalThis as any).Deno?.env?.get?.(name) ?? undefined;
  } catch {
    return undefined;
  }
}
