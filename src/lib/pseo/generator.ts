import type { PseoPage, PseoStatus, PseoTemplateDef } from "./types";
import { getTemplate } from "./templates";

function fill(str: string, vars: Record<string, string>) {
  return str.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? `{${k}}`);
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readingTime(text: string) {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(3, Math.round(words / 220));
}

export interface GenerateInput {
  templateId: string;
  variables: Record<string, string>;
  category?: string;
  author?: string;
  keywords?: string[];
}

export function generatePseoPage(input: GenerateInput): PseoPage {
  const template = getTemplate(input.templateId) as PseoTemplateDef | undefined;
  if (!template) throw new Error(`Unknown template: ${input.templateId}`);

  const vars: Record<string, string> = { year: "2026", region: "India", ...input.variables };
  // Normalise all vars — trim and prettify
  for (const k of Object.keys(vars)) vars[k] = vars[k].trim();

  const variablesForSlug: Record<string, string> = {};
  for (const [k, v] of Object.entries(vars)) variablesForSlug[k] = slugify(v);

  const title = fill(template.titleTemplate, vars);
  const description = fill(template.descriptionTemplate, vars);
  const slug = fill(template.slugTemplate, variablesForSlug);
  const h1 = fill(template.h1Template, vars);
  const sections = template.sectionPlan.map((s) => ({
    heading: fill(s.heading, vars),
    body: fill(s.body, vars),
    bullets: s.bullets?.map((b) => fill(b, vars)),
  }));
  const faqs = template.faqPlan.map((f) => ({ q: fill(f.q, vars), a: fill(f.a, vars) }));
  const keywords = [
    ...template.keywords.map((k) => fill(k, vars)),
    ...(input.keywords ?? []),
  ];

  const bodyText = sections.map((s) => `${s.heading}. ${s.body} ${(s.bullets ?? []).join(" ")}`).join(" ");
  const now = new Date().toISOString();
  const id = `pseo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

  return {
    id,
    slug,
    pageType: template.pageType,
    templateId: template.id,
    category: input.category ?? template.pageType,
    status: "draft" as PseoStatus,
    author: input.author ?? "Glintr Editorial",
    title,
    description,
    canonical: `https://glintr.com/p/${slug}`,
    h1,
    keywords,
    variables: vars,
    sections,
    faqs,
    related: [],
    readingTimeMin: readingTime(bodyText),
    createdAt: now,
    updatedAt: now,
    analytics: { impressions: 0, clicks: 0, ctr: 0, avgPosition: 0, organicTraffic: 0, internalClicks: 0 },
  };
}

// Batch generate — accepts a matrix of variables and returns pages.
// Example: { templateId, variableMatrix: { skill: ["ai","data science"], city: ["hyderabad","bangalore"] } }
export function generatePseoBatch(input: {
  templateId: string;
  variableMatrix: Record<string, string[]>;
  category?: string;
  author?: string;
}): PseoPage[] {
  const keys = Object.keys(input.variableMatrix);
  if (keys.length === 0) return [];
  const combos: Record<string, string>[] = [{}];
  for (const k of keys) {
    const next: Record<string, string>[] = [];
    for (const combo of combos) {
      for (const v of input.variableMatrix[k]) next.push({ ...combo, [k]: v });
    }
    combos.length = 0;
    combos.push(...next);
  }
  return combos.map((variables) =>
    generatePseoPage({
      templateId: input.templateId,
      variables,
      category: input.category,
      author: input.author,
    }),
  );
}

// Similarity check for duplicate prevention
export function contentFingerprint(page: PseoPage): string {
  return [page.title, page.h1, page.slug, page.sections.map((s) => s.heading).join("|")]
    .join("::")
    .toLowerCase();
}

// Quality checks — enforces "no thin content"
export interface QualityIssue {
  level: "error" | "warn";
  message: string;
}

export function pageQualityCheck(page: PseoPage, existing: PseoPage[] = []): QualityIssue[] {
  const issues: QualityIssue[] = [];
  if (page.title.length < 25) issues.push({ level: "warn", message: "Title is shorter than 25 characters." });
  if (page.title.length > 70) issues.push({ level: "warn", message: "Title exceeds 70 characters and may truncate in search results." });
  if (page.description.length < 90) issues.push({ level: "warn", message: "Description is shorter than 90 characters." });
  if (page.description.length > 170) issues.push({ level: "warn", message: "Description exceeds 170 characters." });
  const wordCount = page.sections.reduce((n, s) => n + s.body.split(/\s+/).length + (s.bullets ?? []).join(" ").split(/\s+/).length, 0);
  if (wordCount < 500) issues.push({ level: "error", message: `Body content is thin (${wordCount} words). Add editorial depth before publishing.` });
  if (page.faqs.length < 2) issues.push({ level: "warn", message: "Add at least two FAQs for FAQ schema coverage." });
  const fp = contentFingerprint(page);
  const dupe = existing.find((p) => p.id !== page.id && contentFingerprint(p) === fp);
  if (dupe) issues.push({ level: "error", message: `Duplicate content detected (matches page ${dupe.slug}).` });
  const dupeSlug = existing.find((p) => p.id !== page.id && p.slug === page.slug);
  if (dupeSlug) issues.push({ level: "error", message: `Slug collision with ${dupeSlug.title}.` });
  // Keyword stuffing check — no keyword should exceed 3% density
  const flatBody = page.sections.map((s) => s.body).join(" ").toLowerCase();
  const totalWords = flatBody.split(/\s+/).length;
  for (const kw of page.keywords) {
    const count = (flatBody.match(new RegExp(`\\b${kw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g")) ?? []).length;
    if (count > 0 && count / totalWords > 0.03) {
      issues.push({ level: "warn", message: `Possible keyword stuffing for "${kw}" (${count} mentions).` });
    }
  }
  return issues;
}
