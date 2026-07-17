/**
 * Partner Earnings — Marketing Copy CMS
 *
 * SINGLE SOURCE OF TRUTH for every partner-earning marketing string on the
 * public site. UI components MUST import from here rather than hardcoding
 * "70%", "Start Earning", "Earn 70%", etc. inline.
 *
 * When Lovable Cloud (Supabase) is wired for marketing copy, swap the body
 * of `getPartnerEarningsCopy()` for a query against the `marketing_copy`
 * table — every consumer keeps working because they read through this loader.
 *
 * Editorial rules enforced by this module:
 *   1. The primary revenue share number is one value (currently 70).
 *   2. Every earning CTA is one of two variants: primary or secondary.
 *   3. "Up to 50%" only appears in comparison contexts, never as a CTA.
 *   4. Copy tokens interpolate `{share}` so a percentage change ripples
 *      through headlines, buttons, meta tags and structured data at once.
 */

// ---------- Types ----------

export interface PartnerEarningsCopy {
  /** Primary partner revenue share percentage (integer, e.g. 70). */
  primarySharePct: number;
  /** Supported model share percentage (integer, e.g. 50). */
  supportedSharePct: number;

  cta: {
    /** Primary earn CTA — always the highest-intent button. */
    primary: string;
    /** Shorter variant for tight spaces (nav pills, cards, mobile chips). */
    short: string;
    /** Applies-to-partner CTA on onboarding surfaces. */
    apply: string;
  };

  labels: {
    /** Nav / footer label linking to /earn. */
    partnerNav: string;
    /** Card / rate tile headline for own-leads model. */
    revenueShare: string;
    /** Rate value used in comparison tables and pricing tiles. */
    revenueShareValue: string;
    /** Model page anchor label. */
    revenueModel: string;
    /** Supported model label (comparison-only). */
    supportedModel: string;
  };

  taglines: {
    /** Homepage / earn hero tagline. */
    hero: string;
    /** One-liner used under hero and in featured cards. */
    subtitle: string;
    /** SEO meta description default. */
    meta: string;
    /** OG title default. */
    ogTitle: string;
  };
}

// ---------- Data (edit here — this is the CMS surface) ----------

const DEFAULT_COPY: PartnerEarningsCopy = {
  primarySharePct: 70,
  supportedSharePct: 50,

  cta: {
    primary: "Start Earning {share}%",
    short: "Earn {share}%",
    apply: "Become a {share}% Partner",
  },

  labels: {
    partnerNav: "Earn {share}%",
    revenueShare: "{share}% Revenue Share",
    revenueShareValue: "Flat {share}%",
    revenueModel: "{share}% Revenue Model",
    supportedModel: "{supported}% Supported Model",
  },

  taglines: {
    hero: "Earn {share}% Revenue Share",
    subtitle:
      "Turn your sales skill into predictable income. Earn {share}% revenue share on every eligible enrolment.",
    meta:
      "Earn {share}% revenue share as a Glintr Partner. Weekly payouts, no cap, transparent attribution.",
    ogTitle: "Earn With Glintr — {share}% Revenue Share",
  },
};

// ---------- Interpolation ----------

function interpolate(template: string, copy: PartnerEarningsCopy): string {
  return template
    .replace(/\{share\}/g, String(copy.primarySharePct))
    .replace(/\{supported\}/g, String(copy.supportedSharePct));
}

/** Deep-resolve `{share}`/`{supported}` tokens across every string. */
function resolve(copy: PartnerEarningsCopy): PartnerEarningsCopy {
  return {
    ...copy,
    cta: {
      primary: interpolate(copy.cta.primary, copy),
      short: interpolate(copy.cta.short, copy),
      apply: interpolate(copy.cta.apply, copy),
    },
    labels: {
      partnerNav: interpolate(copy.labels.partnerNav, copy),
      revenueShare: interpolate(copy.labels.revenueShare, copy),
      revenueShareValue: interpolate(copy.labels.revenueShareValue, copy),
      revenueModel: interpolate(copy.labels.revenueModel, copy),
      supportedModel: interpolate(copy.labels.supportedModel, copy),
    },
    taglines: {
      hero: interpolate(copy.taglines.hero, copy),
      subtitle: interpolate(copy.taglines.subtitle, copy),
      meta: interpolate(copy.taglines.meta, copy),
      ogTitle: interpolate(copy.taglines.ogTitle, copy),
    },
  };
}

// ---------- Public API ----------

/**
 * Sync accessor. Prefer this in components — copy is static per build until
 * the CMS-backed loader below is wired.
 */
export const partnerEarningsCopy: PartnerEarningsCopy = resolve(DEFAULT_COPY);

/**
 * Async loader — swap the body for a Supabase query without touching
 * consumers. Consumers using this via TanStack Query get automatic
 * invalidation when the CMS row updates.
 */
export async function getPartnerEarningsCopy(): Promise<PartnerEarningsCopy> {
  return partnerEarningsCopy;
}

/** Convenience: interpolate any template string using the active copy. */
export function formatEarningsCopy(template: string): string {
  return interpolate(template, partnerEarningsCopy);
}
