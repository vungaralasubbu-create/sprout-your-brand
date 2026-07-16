/**
 * Content resolver — merges CMS course record with the static content pack
 * fallback (`course-content-pack.ts`). The public Program Detail template
 * consumes ONLY the shape this module returns, so both hand-authored and
 * AI-generated courses render identically.
 *
 * Precedence:
 *   1. Course CMS payload (Supabase, populated by admin + AI)
 *   2. Static content pack (existing `getCourseContentPack`)
 *   3. Generic defaults
 */

import { getCourseContentPack } from "@/lib/course-content-pack";
import type { CourseCmsPayload } from "@/lib/admin/course-cms.functions";

export interface ResolvedCourseView {
  /** Hiring partners: array of company names (may be empty). */
  hiringPartners: string[];
  /** Tools/technologies taught. */
  tools: Array<{ name: string; description?: string }>;
  /** Portfolio projects. */
  projects: Array<{ title: string; description?: string; tools?: string[] }>;
  /** Career roadmap stages. */
  careerRoadmap: Array<{ stage: string; note?: string }>;
  /** Salary progression. */
  salaryStages: Array<{ stage: string; rangeLabel?: string; low?: number; high?: number; note?: string }>;
  /** Learning outcomes bullet list. */
  learningOutcomes: string[];
  /** Highlights of the program. */
  highlights: string[];
  /** FAQs. */
  faqs: Array<{ question: string; answer: string }>;
  /** Who should join. */
  whoShouldJoin: string[];
}

function toStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  return [];
}

/**
 * Merge a CMS payload with the static pack fallback. Pass either a CMS payload
 * (from `getCourseCmsBySlug`) or `null` to fall back entirely to the pack.
 */
export function resolveCourseView(
  categorySlug: string,
  courseSlug: string,
  cms: CourseCmsPayload | null,
): ResolvedCourseView {
  const pack = getCourseContentPack(categorySlug, courseSlug);
  const course = (cms?.course ?? {}) as Record<string, unknown>;

  const cmsHiring = (cms?.hiring_partners ?? [])
    .map((r) => (r as { company_name?: string }).company_name)
    .filter((n): n is string => Boolean(n));

  const cmsTools = (cms?.tools ?? []).map((row) => {
    const tool = (row as { tool?: { name?: string; description?: string } }).tool ?? {};
    return { name: tool.name ?? "Tool", description: tool.description };
  });

  const cmsProjects = (cms?.projects ?? []).map((row) => {
    const p = row as { title?: string; description?: string };
    return { title: p.title ?? "Project", description: p.description ?? undefined };
  });

  const cmsRoadmap = (cms?.learning_path_stages ?? []).map((row) => {
    const s = row as { stage?: string; note?: string };
    return { stage: s.stage ?? "", note: s.note ?? undefined };
  });

  const cmsSalary = (cms?.salary_stages ?? []).map((row) => {
    const s = row as { stage?: string; range_label?: string; low?: number; high?: number; note?: string };
    return {
      stage: s.stage ?? "",
      rangeLabel: s.range_label ?? undefined,
      low: s.low ?? undefined,
      high: s.high ?? undefined,
      note: s.note ?? undefined,
    };
  });

  const cmsFaqs = (cms?.faqs ?? []).map((row) => {
    const f = row as { question?: string; answer?: string };
    return { question: f.question ?? "", answer: f.answer ?? "" };
  });

  return {
    hiringPartners: cmsHiring.length ? cmsHiring : pack.hiringPartners.map((h) => h.name),
    tools: cmsTools.length ? cmsTools : pack.tools.map((t) => ({ name: t.name, description: t.tagline })),
    projects: cmsProjects.length
      ? cmsProjects
      : pack.projects.map((p) => ({ title: p.title, description: p.summary })),
    careerRoadmap: cmsRoadmap.length
      ? cmsRoadmap
      : pack.careerRoadmap.map((r) => ({ stage: r.role, note: r.summary })),
    salaryStages: cmsSalary.length
      ? cmsSalary
      : pack.salary.map((s) => ({ stage: s.stage, rangeLabel: s.range, note: s.note })),
    learningOutcomes: toStringArray(course.learning_outcomes).length
      ? toStringArray(course.learning_outcomes)
      : pack.learningOutcomes,
    highlights: toStringArray(course.highlights).length ? toStringArray(course.highlights) : pack.highlights,
    faqs: cmsFaqs.length ? cmsFaqs : pack.faqs,
    whoShouldJoin: toStringArray(course.who_should_join).length
      ? toStringArray(course.who_should_join)
      : pack.whoShouldJoin,
  };
}
