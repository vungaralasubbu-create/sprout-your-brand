import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { listCareerMaps } from "@/data/career-maps";
import { renderUrlset, xmlResponse, getServerSupabase, type UrlEntry } from "@/lib/seo/sitemap-utils";

export const Route = createFileRoute("/sitemap-careers.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: UrlEntry[] = [
          { path: "/careers", changefreq: "weekly", priority: "0.7" },
          { path: "/career-maps", changefreq: "monthly", priority: "0.6" },
          { path: "/career-hub", changefreq: "weekly", priority: "0.8" },
          ...listCareerMaps().map((c) => ({
            path: `/career-maps/${c.slug}`, changefreq: "monthly", priority: "0.5",
          })),
        ];
        const sb = getServerSupabase();
        if (sb) {
          const { data } = await sb.from("hiring_roles").select("slug,updated_at").eq("is_published", true);
          for (const r of (data ?? []) as any[]) {
            entries.push({ path: `/careers/${r.slug}`, lastmod: r.updated_at ?? undefined, changefreq: "monthly", priority: "0.6" });
          }
          const TYPE_PATH: Record<string, string> = {
            roadmap: "roadmap", salary_guide: "salary", job_description: "job",
            interview_questions: "interview", resume_tips: "resume", career_switch: "switch",
            skill: "skill", trending_tech: "trending",
          };
          for (const t of Object.keys(TYPE_PATH)) {
            entries.push({ path: `/career-hub/${TYPE_PATH[t]}`, changefreq: "weekly", priority: "0.6" });
          }
          const { data: hub } = await sb.from("career_hub_pages")
            .select("slug,page_type,updated_at").eq("published", true).limit(5000);
          for (const p of (hub ?? []) as any[]) {
            const path = TYPE_PATH[p.page_type];
            if (!path) continue;
            entries.push({ path: `/career-hub/${path}/${p.slug}`, lastmod: p.updated_at ?? undefined, changefreq: "monthly", priority: "0.6" });
          }
        }

        return xmlResponse(renderUrlset(entries));
      },
    },
  },
});
