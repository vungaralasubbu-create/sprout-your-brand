import { createFileRoute } from "@tanstack/react-router";

/**
 * Machine-readable topic hub index for AI search engines and agents.
 * Emits every pillar with tagline, overview, skills, tools, career
 * roles, and deep-dive cluster URLs — all keyed to their canonical URL.
 * Referenced from /llms.txt.
 */
export const Route = createFileRoute("/api/public/topics.json")({
  server: {
    handlers: {
      GET: async () => {
        const { listPillars, listClusters } = await import("@/data/topics");
        const origin = "https://glintr.com";
        const pillars = listPillars();

        const items = pillars.map((p: any) => {
          const clusters = listClusters(p.slug) || [];
          const url = `${origin}/topics/${p.slug}`;
          return {
            "@type": "WebPage",
            "@id": url,
            url,
            name: p.name,
            slug: p.slug,
            category: p.category,
            tagline: p.tagline,
            overview: p.overview,
            skills: p.skills ?? [],
            tools: p.tools ?? [],
            applications: p.applications ?? [],
            careers: (p.careers ?? []).map((c: any) => ({
              role: c.role,
              salaryInr: c.salaryInr,
            })),
            faqs: (p.faqs ?? []).map((f: any) => ({
              question: f.q,
              answer: f.a,
            })),
            clusters: clusters.map((c: any) => ({
              title: c.title,
              slug: c.slug,
              url: `${origin}/topics/${p.slug}/${c.slug}`,
              description: c.description,
              difficulty: c.difficulty ?? null,
              readingMinutes: c.readingMinutes ?? null,
            })),
          };
        });

        const body = {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Glintr — Topic Hubs",
          description:
            "Structured pillar topics across AI, Data Science, Cyber Security, Cloud Computing, VLSI, Robotics, IoT and career development. Each pillar links to deep-dive clusters.",
          url: `${origin}/api/public/topics.json`,
          generatedAt: new Date().toISOString(),
          totalItems: items.length,
          itemListElement: items,
        };

        return new Response(JSON.stringify(body, null, 2), {
          status: 200,
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "public, max-age=1800, s-maxage=3600",
            "access-control-allow-origin": "*",
            "x-robots-tag": "all",
          },
        });
      },
    },
  },
});
