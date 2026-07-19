// GEO scoring engine — pure functions + persistence.
// Computes AI Readiness Score from the shape of a content unit.

import type { GeoContentType } from "./constants";

export type ScoringInput = {
  contentType: GeoContentType | string;
  contentId: string;
  url?: string;
  title?: string | null;
  body?: string | null;
  html?: string | null;
  summary?: string | null;
  updatedAt?: string | Date | null;
  publishedAt?: string | Date | null;
  entityCount?: number;
  questionCount?: number;
  answeredQuestionCount?: number;
  faqCount?: number;
  sectionCount?: number;
  citationCount?: number;
  outboundLinks?: number;
  inboundLinks?: number;
  authorAuthority?: number; // 0..1
};

export type ScoreBreakdown = {
  ai_readiness: number;
  semantic_coverage: number;
  entity_coverage: number;
  question_coverage: number;
  answer_coverage: number;
  evidence_coverage: number;
  citation_readiness: number;
  freshness: number;
  authority: number;
  trust: number;
  details: Record<string, number>;
};

export type ScoringWeights = {
  semantic: number;
  entity: number;
  question: number;
  answer: number;
  evidence: number;
  citation: number;
  freshness: number;
  authority: number;
  trust: number;
};

const DEFAULT_WEIGHTS: ScoringWeights = {
  semantic: 0.15,
  entity: 0.15,
  question: 0.15,
  answer: 0.15,
  evidence: 0.1,
  citation: 0.1,
  freshness: 0.1,
  authority: 0.05,
  trust: 0.05,
};

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function ratio(actual: number, target: number): number {
  if (target <= 0) return 0;
  return clamp01(actual / target);
}

function textOf(input: ScoringInput): string {
  return [input.title, input.summary, input.body]
    .filter(Boolean)
    .join("\n");
}

function freshnessScore(input: ScoringInput): number {
  const raw = input.updatedAt ?? input.publishedAt;
  if (!raw) return 0.4;
  const ts = new Date(raw).getTime();
  if (!Number.isFinite(ts)) return 0.4;
  const days = (Date.now() - ts) / (1000 * 60 * 60 * 24);
  if (days <= 30) return 1;
  if (days <= 90) return 0.85;
  if (days <= 180) return 0.7;
  if (days <= 365) return 0.5;
  if (days <= 730) return 0.3;
  return 0.15;
}

function semanticStructure(input: ScoringInput): number {
  const html = input.html ?? "";
  const text = textOf(input);
  const hasH2 = /<h2[\s>]/i.test(html);
  const hasH3 = /<h3[\s>]/i.test(html);
  const hasList = /<(ul|ol)[\s>]/i.test(html);
  const hasTable = /<table[\s>]/i.test(html);
  const hasHeading = hasH2 || /^#\s/m.test(text) || /^##\s/m.test(text);
  const words = text.split(/\s+/).filter(Boolean).length;
  const lengthScore = ratio(words, 800);
  const structural =
    (hasHeading ? 0.35 : 0) +
    (hasH3 ? 0.15 : 0) +
    (hasList ? 0.2 : 0) +
    (hasTable ? 0.15 : 0);
  return clamp01(0.3 * lengthScore + 0.7 * structural);
}

export function computeScore(
  input: ScoringInput,
  weights: ScoringWeights = DEFAULT_WEIGHTS,
): ScoreBreakdown {
  const semantic = semanticStructure(input);
  const entity = ratio(input.entityCount ?? 0, 12);
  const question = ratio(input.questionCount ?? 0, 8);
  const answered = input.questionCount
    ? clamp01((input.answeredQuestionCount ?? 0) / input.questionCount)
    : 0;
  const answer = clamp01(0.6 * answered + 0.4 * ratio(input.faqCount ?? 0, 6));
  const evidence = ratio(input.sectionCount ?? 0, 8);
  const citation = clamp01(
    0.6 * ratio(input.citationCount ?? 0, 4) +
      0.4 * ratio(input.outboundLinks ?? 0, 6),
  );
  const fresh = freshnessScore(input);
  const authority = clamp01(
    0.5 * (input.authorAuthority ?? 0) +
      0.5 * ratio(input.inboundLinks ?? 0, 10),
  );
  const trust = clamp01(0.5 * citation + 0.3 * authority + 0.2 * fresh);

  const readiness =
    weights.semantic * semantic +
    weights.entity * entity +
    weights.question * question +
    weights.answer * answer +
    weights.evidence * evidence +
    weights.citation * citation +
    weights.freshness * fresh +
    weights.authority * authority +
    weights.trust * trust;

  return {
    ai_readiness: Math.round(clamp01(readiness) * 1000) / 1000,
    semantic_coverage: semantic,
    entity_coverage: entity,
    question_coverage: question,
    answer_coverage: answer,
    evidence_coverage: evidence,
    citation_readiness: citation,
    freshness: fresh,
    authority,
    trust,
    details: {
      words: textOf(input).split(/\s+/).filter(Boolean).length,
      entity_count: input.entityCount ?? 0,
      question_count: input.questionCount ?? 0,
      faq_count: input.faqCount ?? 0,
      section_count: input.sectionCount ?? 0,
      citation_count: input.citationCount ?? 0,
    },
  };
}

export const DEFAULT_SCORING_WEIGHTS = DEFAULT_WEIGHTS;
