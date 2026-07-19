import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Rocket, ArrowRight, Sparkles } from "lucide-react";
import { listPublicCareerPages } from "@/lib/admin/career-hub.functions";
import { CAREER_HUB_TYPES, type CareerHubTypeId } from "@/lib/career-hub/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/career-hub")({
  component: CareerHubIndex,
  head: () => ({
    meta: [
      { title: "AI Career Hub — Roadmaps, Salaries, Interviews | Glintr" },
      { name: "description", content: "Explore AI-generated career roadmaps, salary guides, interview questions, resume tips, and skill deep-dives. Land your dream role with Glintr." },
      { property: "og:title", content: "AI Career Hub — Glintr" },
      { property: "og:description", content: "Career roadmaps, salary data, interview prep, and skill guides — all in one place." },
      { property: "og:url", content: "https://glintr.com/career-hub" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://glintr.com/career-hub" }],
  }),
});

function CareerHubIndex() {
  const [filter, setFilter] = useState<CareerHubTypeId | "all">("all");
  const fn = useServerFn(listPublicCareerPages);
  const q = useQuery({
    queryKey: ["career-hub-public", filter],
    queryFn: () => fn({ data: { page_type: filter === "all" ? undefined : filter, limit: 96 } }),
    staleTime: 60_000,
  });

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden py-20 border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-background/50 backdrop-blur mb-4 text-xs">
            <Sparkles className="w-3 h-3 text-primary" /> AI-generated · Updated continuously
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            The AI Career Hub for <span className="text-primary">India's Next Generation</span>
          </h1>
          <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
            Explore hundreds of career roadmaps, salary guides, interview questions, and skill deep-dives — built for the way you'll actually work.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold mb-4">Browse by category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {CAREER_HUB_TYPES.map((t) => (
            <Link key={t.id} to="/career-hub/$type" params={{ type: t.path }}
              className="p-4 rounded-lg border hover:border-primary hover:shadow-md transition group">
              <div className="text-3xl">{t.emoji}</div>
              <div className="font-semibold mt-2 group-hover:text-primary">{t.label}</div>
              <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{t.desc}</div>
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Latest guides</h2>
          <select className="text-sm border rounded px-2 py-1 bg-background" value={filter} onChange={(e) => setFilter(e.target.value as any)}>
            <option value="all">All types</option>
            {CAREER_HUB_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>

        {q.isLoading ? (
          <div className="text-muted-foreground">Loading guides…</div>
        ) : q.data?.pages.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            <Rocket className="w-10 h-10 mx-auto mb-3 text-primary/50" />
            No guides published yet. Ask an admin to generate some in the Career Hub console.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {q.data?.pages.map((p: any) => {
              const path = CAREER_HUB_TYPES.find((t) => t.id === p.page_type)?.path || "roadmap";
              return (
                <Link key={`${p.page_type}-${p.slug}`} to="/career-hub/$type/$slug" params={{ type: path, slug: p.slug }}>
                  <Card className="p-4 h-full hover:border-primary hover:shadow-md transition group">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{p.hero_emoji || "🎯"}</div>
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">{CAREER_HUB_TYPES.find((t) => t.id === p.page_type)?.label}</div>
                        <div className="font-semibold mt-0.5 group-hover:text-primary line-clamp-2">{p.title}</div>
                        {p.subtitle && <div className="text-sm text-muted-foreground line-clamp-2 mt-1">{p.subtitle}</div>}
                        {p.category && <div className="text-xs text-primary mt-2">{p.category}</div>}
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        <div className="text-center mt-16 py-10 border-t">
          <h3 className="text-2xl font-bold">Ready to actually build the career?</h3>
          <p className="text-muted-foreground mt-2">Reading guides is a start. Glintr Programs get you paid.</p>
          <Button size="lg" className="mt-4" asChild><Link to="/programs">Explore Programs <ArrowRight className="w-4 h-4 ml-2" /></Link></Button>
        </div>
      </section>
    </div>
  );
}
