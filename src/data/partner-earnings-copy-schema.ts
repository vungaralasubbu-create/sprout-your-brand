/**
 * Partner earnings marketing copy — schema + default value.
 *
 * Split from the React module so server functions can import it without
 * pulling React into the server bundle.
 */

import { z } from "zod";

export const PARTNER_EARNINGS_COPY_KEY = "marketing.partner_earnings_copy" as const;

export const partnerEarningsCopySchema = z.object({
  primarySharePct: z.number().int().min(1).max(100),
  supportedSharePct: z.number().int().min(1).max(100),
  cta: z.object({
    primary: z.string().min(1),
    short: z.string().min(1),
    apply: z.string().min(1),
  }),
  labels: z.object({
    partnerNav: z.string().min(1),
    revenueShare: z.string().min(1),
    revenueShareValue: z.string().min(1),
    revenueModel: z.string().min(1),
    supportedModel: z.string().min(1),
  }),
  taglines: z.object({
    hero: z.string().min(1),
    subtitle: z.string().min(1),
    meta: z.string().min(1),
    ogTitle: z.string().min(1),
  }),
});

export type PartnerEarningsCopy = z.infer<typeof partnerEarningsCopySchema>;

export const DEFAULT_PARTNER_EARNINGS_COPY: PartnerEarningsCopy = {
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

export function interpolatePartnerEarningsCopy(
  template: string,
  copy: PartnerEarningsCopy,
): string {
  return template
    .replace(/\{share\}/g, String(copy.primarySharePct))
    .replace(/\{supported\}/g, String(copy.supportedSharePct));
}

export function resolvePartnerEarningsCopy(copy: PartnerEarningsCopy): PartnerEarningsCopy {
  const i = (t: string) => interpolatePartnerEarningsCopy(t, copy);
  return {
    ...copy,
    cta: {
      primary: i(copy.cta.primary),
      short: i(copy.cta.short),
      apply: i(copy.cta.apply),
    },
    labels: {
      partnerNav: i(copy.labels.partnerNav),
      revenueShare: i(copy.labels.revenueShare),
      revenueShareValue: i(copy.labels.revenueShareValue),
      revenueModel: i(copy.labels.revenueModel),
      supportedModel: i(copy.labels.supportedModel),
    },
    taglines: {
      hero: i(copy.taglines.hero),
      subtitle: i(copy.taglines.subtitle),
      meta: i(copy.taglines.meta),
      ogTitle: i(copy.taglines.ogTitle),
    },
  };
}
