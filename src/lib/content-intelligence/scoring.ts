// Composite score computations for the Content Intelligence dashboard.
// Pure functions — no side effects. Consumed by the server function that
// aggregates content_items metrics.

export type DashboardScores = {
  overallSeo: number;
  topicalAuthority: number;
  entityCoverage: number;
  knowledgeGraphHealth: number;
  internalLinkHealth: number;
  contentFreshness: number;
  geoScore: number;
  aiCitationReadiness: number;
  searchVisibility: number;
  contentQuality: number;
};

export type ScoreInput = {
  publishedCount: number;
  avgReadability: number;
  avgStructure: number;
  avgSeo: number;
  avgGeo: number;
  avgLinking: number;
  avgAccessibility: number;
  avgCompleteness: number;
  avgMedia: number;
  avgFreshness: number;
  domainCoveragePct: number;
  entityCoveragePct: number;
  orphanRatio: number; // 0..1 (higher = worse)
  brokenLinks: number;
};

export function computeScores(i: ScoreInput): DashboardScores {
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  const overallSeo = clamp((i.avgSeo + i.avgStructure + i.avgLinking) / 3);
  const topicalAuthority = clamp(i.domainCoveragePct * 0.7 + i.entityCoveragePct * 0.3);
  const entityCoverage = clamp(i.entityCoveragePct);
  const knowledgeGraphHealth = clamp(100 - i.orphanRatio * 100);
  const internalLinkHealth = clamp(i.avgLinking - Math.min(50, i.brokenLinks * 2));
  const contentFreshness = clamp(i.avgFreshness);
  const geoScore = clamp(i.avgGeo);
  const aiCitationReadiness = clamp((i.avgGeo * 0.6 + i.avgStructure * 0.4));
  // Placeholder — replaced by real GSC data when integration is connected.
  const searchVisibility = clamp((overallSeo + contentFreshness + entityCoverage) / 3);
  const contentQuality = clamp(
    (i.avgReadability + i.avgStructure + i.avgCompleteness + i.avgAccessibility + i.avgMedia) / 5,
  );
  return {
    overallSeo, topicalAuthority, entityCoverage, knowledgeGraphHealth,
    internalLinkHealth, contentFreshness, geoScore, aiCitationReadiness,
    searchVisibility, contentQuality,
  };
}

export function scoreTone(v: number): "good" | "warn" | "bad" {
  return v >= 70 ? "good" : v >= 45 ? "warn" : "bad";
}
