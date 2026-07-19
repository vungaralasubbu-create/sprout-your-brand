// End-to-end generation → review → auto-approve pipeline for one page.
import { getAdmin, fillPattern, fillHumanPattern } from "./service-client.server";
import { generatePageContent } from "./ai-generator.server";
import { reviewPage, hashContent } from "./quality-review.server";
import type { PseoTemplate } from "./types";

export type GenerateOptions = {
  template: PseoTemplate;
  variables: Record<string, string>;   // both slug and human vars: e.g. { technology:"python", technology_name:"Python" }
  batchId?: string | null;
  extraContext?: string;
  keywords?: string[];
  autoPublish?: boolean;
};

export async function generateAndStorePage(opts: GenerateOptions): Promise<{
  page_id: string;
  slug: string;
  status: string;
  quality_score: number;
}> {
  const admin = await getAdmin();
  const slug = fillPattern(opts.template.url_pattern, opts.variables).replace(/^\//, "");
  const title = fillHumanPattern(opts.template.title_pattern, opts.variables);
  const h1 = fillHumanPattern(opts.template.h1_pattern ?? opts.template.title_pattern, opts.variables);
  const meta = fillHumanPattern(opts.template.meta_pattern ?? title, opts.variables);

  // 1. Generate content via central AI Router.
  const content = await generatePageContent(opts.template, opts.variables, {
    extraContext: opts.extraContext,
    keywords: opts.keywords,
  });
  const contentHash = hashContent(content);

  // 2. Upsert draft page.
  const { data: existing } = await admin
    .from("pseo_pages").select("id").eq("slug", slug).maybeSingle();

  const settings = await admin.from("pseo_settings").select("*").eq("id", 1).maybeSingle();
  const canonicalDomain = (settings.data?.canonical_domain as string | undefined) ?? "https://glintr.com";
  const autoThreshold = (settings.data?.auto_publish_threshold as number | undefined) ?? 85;

  const basePayload = {
    template_id: opts.template.id,
    page_type: opts.template.page_type,
    slug,
    title,
    h1,
    meta_description: meta,
    canonical_url: `${canonicalDomain}/${slug}`,
    variables: opts.variables,
    content,
    keywords: content.keywords,
    schema_types: content.schema_suggestions ?? opts.template.schema_types,
    ai_prompt_version: opts.template.prompt_version,
    batch_id: opts.batchId ?? null,
    content_hash: contentHash,
    word_count: content.word_count,
    review_state: "ai_generated",
    status: "draft",
    updated_at: new Date().toISOString(),
  };

  const pageId = existing?.id
    ? (await admin.from("pseo_pages").update(basePayload).eq("id", existing.id).select("id").single()).data?.id
    : (await admin.from("pseo_pages").insert(basePayload).select("id").single()).data?.id;

  if (!pageId) throw new Error("pseo_page upsert failed");

  // 3. Quality review.
  const qr = await reviewPage(content, opts.template, pageId);
  await admin.from("pseo_quality_reviews").insert({
    page_id: pageId,
    grammar_score: qr.grammar_score,
    readability_score: qr.readability_score,
    seo_score: qr.seo_score,
    duplicate_score: qr.duplicate_score,
    keyword_coverage: qr.keyword_coverage,
    internal_link_count: qr.internal_link_count,
    schema_complete: qr.schema_complete,
    word_count: qr.word_count,
    overall_score: qr.overall_score,
    issues: qr.issues,
    suggestions: qr.suggestions,
    reviewer: "ai",
  });

  // 4. Update page with scores + decide auto-publish.
  const shouldPublish = !!opts.autoPublish && qr.overall_score >= autoThreshold && qr.duplicate_score < 0.6;
  await admin.from("pseo_pages").update({
    quality_score: qr.overall_score,
    seo_score: qr.seo_score,
    readability_score: qr.readability_score,
    duplicate_score: qr.duplicate_score,
    freshness_score: 100,
    review_state: shouldPublish ? "published" : "human_review",
    status: shouldPublish ? "published" : "draft",
    published_at: shouldPublish ? new Date().toISOString() : null,
  }).eq("id", pageId);

  return { page_id: pageId, slug, status: shouldPublish ? "published" : "draft", quality_score: qr.overall_score };
}
