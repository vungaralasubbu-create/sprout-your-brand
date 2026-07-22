/**
 * Platform feature flags.
 *
 * Flags are read from environment variables (server-only via process.env).
 * Defaults are conservative: publishing paths default to ENABLED so existing
 * production integrations continue working; a flag must be explicitly set to
 * "false" / "0" / "off" to disable a path.
 *
 * NOTE: Authentication, OAuth, tokens, and provider configuration are treated
 * as immutable production infrastructure. These flags MUST NOT gate OAuth
 * connect/callback/refresh/disconnect flows — only downstream execution
 * (e.g. publishing jobs).
 */

const FLAG_DEFAULTS = {
  ENABLE_LINKEDIN_PUBLISHING: false, // Paused: pending Community Management API approval.
} as const;

export type FeatureFlagName = keyof typeof FLAG_DEFAULTS;

export const LINKEDIN_PUBLISHING_DISABLED_MESSAGE =
  "LinkedIn publishing is temporarily disabled while Company Page permissions are pending approval.";

function readEnv(name: string): string | undefined {
  if (typeof process !== "undefined" && process.env) return process.env[name];
  return undefined;
}

function parseBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw == null) return fallback;
  const v = raw.trim().toLowerCase();
  if (["false", "0", "off", "no", "disabled"].includes(v)) return false;
  if (["true", "1", "on", "yes", "enabled"].includes(v)) return true;
  return fallback;
}

export function isFeatureEnabled(name: FeatureFlagName): boolean {
  return parseBool(readEnv(name), FLAG_DEFAULTS[name]);
}

export function isLinkedInPublishingEnabled(): boolean {
  return isFeatureEnabled("ENABLE_LINKEDIN_PUBLISHING");
}
