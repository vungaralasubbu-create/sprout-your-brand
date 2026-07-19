// AI content generation via the existing centralized AI Router.
// NEVER calls Lovable AI. Uses `aiChat` which routes to OpenAI/native providers.
import { aiChat } from "@/lib/ai/router.server";
import type { GeneratedPageContent, PseoTemplate } from "./types";
import { fillHumanPattern } from "./service-client.server";

const SYSTEM = `You are an expert SEO writer for an EdTech platform.
Write factual, original, well-structured long-form content.
Never fabricate specific salary numbers or company hiring data — use ranges and hedged language.
Return STRICT JSON matching the schema requested. No markdown fences.`;

type SectionOut = { id: string; heading: string; body: string };
type Draft = {
  intro: string;
  sections: SectionOut[];
  faqs: Array<{ q: string; a: string }>;
  pros?: string[];
  cons?: string[];
  bullets?: Record<string, string[]>;
  cta?: { title: string; body: string; href?: string };
  summary?: string;
  keywords: string[];
  image_prompts?: string[];
  internal_link_suggestions?: Array<{ anchor: string; slug: string }>;
  schema_suggestions?: string[];
};

function countWords(text: string): number {
  return (text.match(/\b[\w'-]+\b/g) ?? []).length;
}

export async function generatePageContent(
  template: PseoTemplate,
  humanVars: Record<string, string>,
  opts?: { extraContext?: string; keywords?: string[] },
): Promise<GeneratedPageContent> {
  const h1 = fillHumanPattern(template.h1_pattern ?? template.title_pattern, humanVars);
  const title = fillHumanPattern(template.title_pattern, humanVars);
  const sectionsSpec = template.sections.map((s) => ({
    id: s.id,
    heading: fillHumanPattern(s.heading, humanVars),
    prompt: fillHumanPattern(s.prompt, humanVars),
    minWords: s.minWords ?? 120,
  }));

  const prompt = [
    `Page type: ${template.page_type}`,
    `Title: ${title}`,
    `H1: ${h1}`,
    `Variables: ${JSON.stringify(humanVars)}`,
    opts?.extraContext ? `Context:\n${opts.extraContext}` : "",
    opts?.keywords?.length ? `Target keywords: ${opts.keywords.join(", ")}` : "",
    `Minimum total word count: ${template.min_words}`,
    ``,
    `Write the following sections (return each in "body" as clean HTML — use <h2>, <h3>, <p>, <ul>, <li>, <table>).`,
    `Sections:`,
    ...sectionsSpec.map((s) => `- id="${s.id}", heading="${s.heading}", min ${s.minWords} words. Instruction: ${s.prompt}`),
    ``,
    `Also produce:`,
    `- intro (2 short paragraphs, HTML)`,
    `- faqs: 5-8 items {q, a}`,
    `- pros / cons arrays (5 each) where relevant`,
    `- summary: 2-3 sentence TL;DR`,
    `- keywords: 10-15 SEO keywords`,
    `- image_prompts: 3 concise image generation prompts`,
    `- internal_link_suggestions: 6 {anchor, slug} suggestions targeting related pages (use plausible slugs based on the topic)`,
    `- schema_suggestions: from ${JSON.stringify(template.schema_types)}`,
    `- cta: {title, body, href} pointing to /programs`,
    ``,
    `Return JSON keys: intro, sections[{id,heading,body}], faqs, pros, cons, summary, keywords, image_prompts, internal_link_suggestions, schema_suggestions, cta`,
  ].filter(Boolean).join("\n");

  const raw = await aiChat({
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
    responseFormat: "json",
    temperature: 0.6,
    maxTokens: 4200,
  });

  const draft = (typeof raw === "object" && raw ? (raw as Draft) : {} as Draft);
  const sections: SectionOut[] = Array.isArray(draft.sections) ? draft.sections : [];
  const bodyText = [draft.intro ?? "", ...sections.map((s) => s.body ?? ""), draft.summary ?? ""].join(" ");
  const word_count = countWords(bodyText);

  return {
    intro: String(draft.intro ?? ""),
    sections,
    faqs: Array.isArray(draft.faqs) ? draft.faqs : [],
    pros: draft.pros,
    cons: draft.cons,
    bullets: draft.bullets,
    cta: draft.cta,
    summary: draft.summary,
    keywords: Array.isArray(draft.keywords) ? draft.keywords : (opts?.keywords ?? []),
    image_prompts: draft.image_prompts,
    internal_link_suggestions: draft.internal_link_suggestions,
    schema_suggestions: draft.schema_suggestions ?? template.schema_types,
    word_count,
  };
}
