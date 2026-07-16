/**
 * Content resolver — merges CMS course record with the static content pack
 * fallback (`course-content-pack.ts`). The public Program Detail template
 * consumes ONLY the shape this module returns.
 *
 * Precedence: CMS payload → static pack → empty defaults.
 */

import { getCourseContentPack } from "@/lib/course-content-pack";
import type { CourseCmsPayload } from "@/lib/admin/course-cms.functions";

export interface ResolvedCourseView {
  hiringPartners: string[];
  tools: Array<{ name: string; description?: string }>;
  projects: Array<{ title: string; description?: string }>;
  careerRoadmap: Array<{ stage: string; note?: string }>;
  salaryStages: Array<{ stage: string; rangeLabel?: string; low?: number; high?: number; note?: string }>;
  learningOutcomes: string[];
  highlights: string[];
  faqs: Array<{ question: string; answer: string }>;
  whoShouldJoin: string[];
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  return [];
}

export function resolveCourseView(
  categorySlug: string,
  courseSlug: string,
  cms: CourseCmsPayload | null,
): ResolvedCourseView {
  const pack = getCourseContentPack(categorySlug, courseSlug);
  const course = (cms?.course ?? {}) as Record<string, any>;

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
    hiringPartners: cmsHiring.length ? cmsHiring : pack.hiringPartners,
    tools: cmsTools.length ? cmsTools : pack.tools.map((t) => ({ name: t.name })),
    projects: cmsProjects.length
      ? cmsProjects
      : pack.portfolio.map((p) => ({ title: p.name, description: p.blurb })),
    careerRoadmap: cmsRoadmap.length
      ? cmsRoadmap
      : pack.careerRoadmap.map((r) => ({ stage: r.title, note: r.note })),
    salaryStages: cmsSalary.length
      ? cmsSalary
      : pack.salaryStages.map((s) => ({ stage: s.stage, rangeLabel: s.range, low: s.low, high: s.high, note: s.note })),
    learningOutcomes: toStringArray(course.learning_outcomes),
    highlights: toStringArray(course.highlights),
    faqs: cmsFaqs,
    whoShouldJoin: toStringArray(course.who_should_join),
  };
}
