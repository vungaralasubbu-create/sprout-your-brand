// AI + heuristic quality review for generated pSEO pages.
import { aiChat } from "@/lib/ai/router.server";
import { getAdmin } from "./service-client.server";
import type { GeneratedPageContent, PseoTemplate, QualityReview } from "./types";
import { createHash } from "node:crypto";

export function hashContent(content: GeneratedPageContent): string {
  const canon = JSON.stringify({
    i: content.intro,
    s: content.sections.map((x) => x.body),
    f: content.faqs,
  });
  return createHash("sha256").update(canon).digest("hex");
}

function jaccard(a: string, b: string): number {
  const toks = (s: string) => new Set(s.toLowerCase().match(/\b[a-z]{4,}\b/g) ?? []);
  const A = toks(a), B = toks(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / (A.size + B.size - inter);
}

function fleschKincaid(text: string): number {
  const sentences = Math.max(1, (text.match(/[.!?]+/g) ?? []).length);
  const words = (text.match(/\b[\w'-]+\b/g) ?? []);
  const wordCount = Math.max(1, words.length);
  const syllables = words.reduce((n, w) => n + Math.max(1, (w.match(/[aeiouy]+/gi) ?? []).length), 0);
  const asl = wordCount / sentences;
  const asw = syllables / wordCount;
  const score = 206.835 - 1.015 * asl - 84.6 * asw;
  return Math.max(0, Math.min(100, score));
}

function extractText(c: GeneratedPageContent): string {
  return [c.intro, ...c.sections.map((s) => s.body), ...(c.faqs.map((f) => `${f.q} ${f.a}`)), c.summary ?? ""]
    .join(" ")
    .replace(/<[^>]+>/g, " ");
}

export async function computeDuplicateScore(pageId: string | null, hash: string, sample: string): Promise<number> {
  const admin = await getAdmin();
  const { data } = await admin
    .from("pseo_pages")
    .select("id, content_hash, content")
    .neq("id", pageId ?? "00000000-0000-0000-0000-000000000000")
    .limit(50)
    .order("created_at", { ascending: false });
  if (!data?.length) return 0;
  let maxSim = 0;
  for (const row of data) {
    if (row.content_hash === hash) return 1;
    const other = (row.content as { intro?: string } | null)?.intro ?? "";
    if (!other) continue;
    const sim = jaccard(sample.slice(0, 4000), String(other).slice(0, 4000));
    if (sim > maxSim) maxSim = sim;
  }
  return Math.round(maxSim * 100) / 100;
}

export async function reviewPage(
  content: GeneratedPageContent,
  template: PseoTemplate,
  pageId: string | null,
): Promise<QualityReview> {
  const plain = extractText(content);
  const wordCount = content.word_count || (plain.match(/\b[\w'-]+\b/g) ?? []).length;
  const readability = fleschKincaid(plain);

  // Keyword coverage: percentage of target keywords appearing in body
  const kws = (content.keywords ?? []).map((k) => k.toLowerCase());
  const bodyLower = plain.toLowerCase();
  const covered = kws.filter((k) => k && bodyLower.includes(k)).length;
  const keywordCoverage = kws.length ? Math.round((covered / kws.length) * 100) : 0;

  const internalLinkCount = (content.internal_link_suggestions ?? []).length;
  const schemaComplete = (content.schema_suggestions ?? []).length >= template.schema_types.length;
  const hash = hashContent(content);
  const dup = await computeDuplicateScore(pageId, hash, content.intro + " " + (content.sections[0]?.body ?? ""));

  // Ask AI for a grammar + SEO score. Cheap prompt.
  let grammar = 85, seoScore = 70;
  try {
    const raw = await aiChat({
      system: "Return strict JSON only.",
      messages: [{
        role: "user",
        content:
          `Rate the following content 0-100 on grammar_score and seo_score. Return JSON {grammar_score,seo_score,issues:[{severity,message}],suggestions:[]}.\n\n` +
          plain.slice(0, 6000),
      }],
      responseFormat: "json",
      temperature: 0.2,
      maxTokens: 500,
    });
    const j = raw as { grammar_score?: number; seo_score?: number; issues?: unknown; suggestions?: unknown };
    if (typeof j.grammar_score === "number") grammar = j.grammar_score;
    if (typeof j.seo_score === "number") seoScore = j.seo_score;
    var issues = Array.isArray(j.issues) ? j.issues as QualityReview["issues"] : [];
    var suggestions = Array.isArray(j.suggestions) ? j.suggestions as string[] : [];
  } catch {
    var issues: QualityReview["issues"] = [];
    var suggestions: string[] = [];
  }

  // Overall weighted score.
  const overall = Math.round(
    0.20 * grammar +
    0.20 * readability +
    0.25 * seoScore +
    0.15 * (100 - dup * 100) +
    0.10 * keywordCoverage +
    0.05 * (schemaComplete ? 100 : 40) +
    0.05 * Math.min(100, (wordCount / template.min_words) * 100)
  );

  return {
    grammar_score: grammar,
    readability_score: Math.round(readability),
    seo_score: seoScore,
    duplicate_score: dup,
    keyword_coverage: keywordCoverage,
    internal_link_count: internalLinkCount,
    schema_complete: schemaComplete,
    word_count: wordCount,
    overall_score: overall,
    issues,
    suggestions,
  };
}
