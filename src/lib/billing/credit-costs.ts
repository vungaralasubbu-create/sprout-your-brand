/**
 * Canonical credit costs per AI operation.
 * Keep this in sync with pricing docs.
 */
export const CREDIT_COSTS = {
  strategy: 100,
  post: 20,
  poster: 40,
  video: 250,
  landing: 100,
  email: 15,
  workflow: 10,
  seo_audit: 50,
  analytics: 25,
} as const;

export type CreditReason = keyof typeof CREDIT_COSTS;
