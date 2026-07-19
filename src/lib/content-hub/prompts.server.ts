// Prompt catalog for the AI Content Assistant.
// Server-only. Uses centralized AI Router — no Lovable AI.

import type { AIAssistAction } from "./types";

const RULES = `You are Glintr's enterprise content editor. Rules:
- Preserve the author's voice.
- Return only the requested output, no preambles.
- Never hallucinate URLs, prices, statistics, or product names.
- When Markdown is expected, return valid Markdown (no HTML).`;

export function systemFor(action: AIAssistAction): string {
  return RULES;
}

export function buildPrompt(
  action: AIAssistAction,
  body: string,
  context: { title?: string; focus_keyword?: string; secondary_keywords?: string[]; audience?: string } = {},
): string {
  const meta = [
    context.title && `Title: ${context.title}`,
    context.focus_keyword && `Focus keyword: ${context.focus_keyword}`,
    context.secondary_keywords?.length && `Secondary keywords: ${context.secondary_keywords.join(", ")}`,
    context.audience && `Audience: ${context.audience}`,
  ].filter(Boolean).join("\n");

  switch (action) {
    case "rewrite":
      return `${meta}\n\nRewrite the following section for clarity and flow. Keep facts. Return Markdown only.\n\n---\n${body}`;
    case "expand":
      return `${meta}\n\nExpand the following paragraph with concrete examples, statistics only if implied by the source, and a short list. Return Markdown.\n\n---\n${body}`;
    case "simplify":
      return `${meta}\n\nSimplify for a Grade 9 reading level. Shorter sentences, plain words. Return Markdown.\n\n---\n${body}`;
    case "improve_readability":
      return `${meta}\n\nImprove readability: shorter sentences, active voice, subheadings, bullets. Return Markdown.\n\n---\n${body}`;
    case "improve_seo":
      return `${meta}\n\nRewrite for SEO. Include the focus keyword naturally 3-6 times, add a compelling H1 title suggestion at top as "# TITLE", ensure semantic H2s. Return Markdown.\n\n---\n${body}`;
    case "generate_faq":
      return `${meta}\n\nProduce 6-10 FAQs relevant to the article. Return JSON: {"faqs":[{"q":"...","a":"..."}]}`;
    case "generate_cta":
      return `${meta}\n\nProduce 3 CTA variants (short punchy sentences) that map to a Glintr course or career program. Return JSON: {"ctas":[{"text":"...","intent":"course|career|newsletter"}]}`;
    case "generate_summary":
      return `${meta}\n\nWrite a 40-60 word article summary in plain prose. Return plain text.\n\n---\n${body}`;
    case "generate_conclusion":
      return `${meta}\n\nWrite a 90-120 word conclusion that reinforces the key insight and gently invites the reader to take the next step (course/roadmap). Return Markdown.\n\n---\n${body}`;
    case "generate_table":
      return `${meta}\n\nExtract a comparison / summary table from the following text. Return valid Markdown table.\n\n---\n${body}`;
    case "generate_internal_links":
      return `${meta}\n\nSuggest 8 internal linking opportunities in this content. Return JSON: {"links":[{"anchor":"...","target_kind":"course|blog|career|roadmap","hint":"why this link"}]}`;
    case "generate_external_refs":
      return `${meta}\n\nSuggest up to 5 authoritative external references (topics only, no fabricated URLs). Return JSON: {"refs":[{"title":"...","source_type":"paper|standards|docs|book","reason":"..."}]}`;
    case "generate_meta":
      return `${meta}\n\nGenerate SEO metadata for this article. Return JSON: {"seo_title":"<=60 chars","seo_description":"<=155 chars","excerpt":"<=180 chars","social_summary":"<=200 chars","focus_keyword":"...","secondary_keywords":["..."]}`;
    case "generate_schema":
      return `${meta}\n\nRecommend a JSON-LD schema type for this article (Article, HowTo, FAQPage, Course, TechArticle, VideoObject, JobPosting). Return JSON: {"schema_type":"...","reasoning":"..."}`;
    case "generate_image_prompt":
      return `${meta}\n\nWrite 3 detailed hero image prompts describing composition, color, and style — Glintr's brand is premium enterprise EdTech (cyan/azure/lime accents, dark navy background). Return JSON: {"prompts":[{"prompt":"...","aspect":"16:9|1:1|9:16"}]}`;
    case "generate_video_topics":
      return `${meta}\n\nSuggest 5 short-form video topic ideas that could accompany this article. Return JSON: {"topics":[{"title":"...","hook":"...","duration_sec":30}]}`;
  }
}
