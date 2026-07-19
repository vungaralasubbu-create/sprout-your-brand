// Site Health scoring engine — computes per-page scores across 9 categories.

import { CWV_THRESHOLDS } from "./constants";
import type { PageSignals } from "./analyzer.server";

export type ScoreInputs = {
  signals: PageSignals;
  statusCode?: number | null;
  responseTimeMs?: number | null;
  cwv?: {
    lcp?: number | null;
    inp?: number | null;
    cls?: number | null;
    ttfb?: number | null;
    fcp?: number | null;
  } | null;
  inboundLinks?: number;
  outboundLinks?: number;
  hasBrokenLinks?: boolean;
  isCanonicalOk?: boolean;
  isIndexable?: boolean;
  hasSchema?: boolean;
  aiReadiness?: number | null;
};

export type ScoreWeights = {
  technical: number;
  content_quality: number;
  metadata: number;
  performance: number;
  accessibility: number;
  internal_linking: number;
  schema_health: number;
  mobile: number;
  ai_readiness: number;
};

export const DEFAULT_TSH_WEIGHTS: ScoreWeights = {
  technical: 0.15,
  content_quality: 0.15,
  metadata: 0.1,
  performance: 0.15,
  accessibility: 0.1,
  internal_linking: 0.1,
  schema_health: 0.1,
  mobile: 0.05,
  ai_readiness: 0.1,
};

const clamp01 = (n: number) =>
  Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;

function cwvSubscore(v: number | null | undefined, threshold: { good: number; poor: number }) {
  if (v == null) return 0.5;
  if (v <= threshold.good) return 1;
  if (v >= threshold.poor) return 0.2;
  return 1 - (v - threshold.good) / (threshold.poor - threshold.good);
}

export function computeSiteHealthScore(input: ScoreInputs, weights = DEFAULT_TSH_WEIGHTS) {
  const s = input.signals;

  // Technical: HTTP status + canonical + indexability + link integrity
  const technical = clamp01(
    (input.statusCode && input.statusCode < 400 ? 1 : 0) * 0.4 +
      (input.isCanonicalOk ?? s.canonical ? 1 : 0.4) * 0.2 +
      (input.isIndexable !== false ? 1 : 0) * 0.2 +
      (input.hasBrokenLinks ? 0.2 : 1) * 0.2,
  );

  // Content quality: word count, headings, readability proxy
  const wc = s.wordCount;
  const wcScore =
    wc >= 900 ? 1 : wc >= 500 ? 0.8 : wc >= 300 ? 0.5 : wc >= 100 ? 0.3 : 0.1;
  const headingScore =
    (s.h1Count === 1 ? 0.5 : s.h1Count === 0 ? 0.1 : 0.3) +
    (s.h2Count > 0 ? 0.3 : 0) +
    (s.h3Count > 0 ? 0.2 : 0);
  const content_quality = clamp01(0.6 * wcScore + 0.4 * headingScore);

  // Metadata
  const titleLen = s.title?.length ?? 0;
  const metaLen = s.metaDescription?.length ?? 0;
  const metadata = clamp01(
    (titleLen >= 30 && titleLen <= 65 ? 1 : titleLen ? 0.5 : 0) * 0.35 +
      (metaLen >= 70 && metaLen <= 160 ? 1 : metaLen ? 0.4 : 0) * 0.35 +
      (s.ogTitle ? 1 : 0) * 0.15 +
      (s.twitterCard ? 1 : 0) * 0.15,
  );

  // Performance: response time + CWV composite
  const rt = input.responseTimeMs ?? 0;
  const rtScore = rt ? (rt < 300 ? 1 : rt < 800 ? 0.7 : rt < 1500 ? 0.4 : 0.15) : 0.5;
  const cwv = input.cwv ?? {};
  const cwvScore =
    0.35 * cwvSubscore(cwv.lcp, CWV_THRESHOLDS.lcp) +
    0.25 * cwvSubscore(cwv.inp, CWV_THRESHOLDS.inp) +
    0.2 * cwvSubscore(cwv.cls, CWV_THRESHOLDS.cls) +
    0.1 * cwvSubscore(cwv.ttfb, CWV_THRESHOLDS.ttfb) +
    0.1 * cwvSubscore(cwv.fcp, CWV_THRESHOLDS.fcp);
  const performance = clamp01(0.4 * rtScore + 0.6 * cwvScore);

  // Accessibility (very rough)
  const imgs = s.images;
  const altRatio = imgs.length
    ? imgs.filter((i) => i.alt && i.alt.length > 0).length / imgs.length
    : 1;
  const accessibility = clamp01(
    0.5 * altRatio + 0.25 * (s.lang ? 1 : 0) + 0.25 * (s.h1Count === 1 ? 1 : 0.4),
  );

  // Internal linking
  const outLinks = input.outboundLinks ?? s.links.filter((l) => !/^https?:\/\//.test(l.href)).length;
  const inbound = input.inboundLinks ?? 0;
  const internal_linking = clamp01(
    Math.min(outLinks / 15, 1) * 0.5 + Math.min(inbound / 10, 1) * 0.5,
  );

  // Schema
  const schema_health = clamp01(
    (input.hasSchema ?? s.jsonLd.length > 0 ? 1 : 0) * 0.7 +
      (s.jsonLd.length > 1 ? 0.3 : 0),
  );

  // Mobile
  const mobile = clamp01(
    (s.viewport ? 1 : 0) * 0.6 + (/(width\s*=\s*device-width)/i.test(s.viewport ?? "") ? 0.4 : 0),
  );

  const ai_readiness = clamp01(input.aiReadiness ?? 0);

  const overall =
    weights.technical * technical +
    weights.content_quality * content_quality +
    weights.metadata * metadata +
    weights.performance * performance +
    weights.accessibility * accessibility +
    weights.internal_linking * internal_linking +
    weights.schema_health * schema_health +
    weights.mobile * mobile +
    weights.ai_readiness * ai_readiness;

  return {
    overall: clamp01(overall),
    technical,
    content_quality,
    metadata,
    performance,
    accessibility,
    internal_linking,
    schema_health,
    mobile,
    ai_readiness,
    breakdown: {
      wordCount: s.wordCount,
      titleLen,
      metaLen,
      imageCount: s.images.length,
      altRatio,
      responseTimeMs: rt,
      cwvScore,
    },
  };
}
