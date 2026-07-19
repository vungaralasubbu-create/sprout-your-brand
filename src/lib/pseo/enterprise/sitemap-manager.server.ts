// Sitemap manager for pSEO pages. Splits per page_type and by size.
import { getAdmin } from "./service-client.server";

export const PSEO_SITEMAP_GROUPS = [
  "course", "career", "technology", "certification", "interview_questions",
  "interview_experience", "project", "tutorial", "roadmap", "skill",
  "salary", "college", "university", "company_hiring", "company_interview",
  "job_role", "industry", "tool", "comparison", "trending", "location",
  "event", "scholarship", "internship", "placement", "success_story", "case_study",
] as const;
export type PseoSitemapGroup = (typeof PSEO_SITEMAP_GROUPS)[number];

export async function listSitemapChunks(group: PseoSitemapGroup): Promise<{ chunks: number; total: number; chunkSize: number }> {
  const admin = await getAdmin();
  const settings = await admin.from("pseo_settings").select("sitemap_split_size").eq("id", 1).maybeSingle();
  const chunkSize = (settings.data?.sitemap_split_size as number | undefined) ?? 5000;
  const { count } = await admin.from("pseo_pages")
    .select("id", { count: "exact", head: true })
    .eq("page_type", group).eq("status", "published");
  const total = count ?? 0;
  return { chunks: Math.max(1, Math.ceil(total / chunkSize)), total, chunkSize };
}

export async function fetchSitemapChunk(group: PseoSitemapGroup, chunkIndex: number): Promise<Array<{
  slug: string; updated_at: string;
}>> {
  const admin = await getAdmin();
  const settings = await admin.from("pseo_settings").select("sitemap_split_size").eq("id", 1).maybeSingle();
  const chunkSize = (settings.data?.sitemap_split_size as number | undefined) ?? 5000;
  const from = chunkIndex * chunkSize;
  const to = from + chunkSize - 1;
  const { data } = await admin.from("pseo_pages")
    .select("slug, updated_at")
    .eq("page_type", group).eq("status", "published")
    .order("updated_at", { ascending: false })
    .range(from, to);
  return (data ?? []) as Array<{ slug: string; updated_at: string }>;
}
