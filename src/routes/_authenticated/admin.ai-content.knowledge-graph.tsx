import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Network, GraduationCap, BookOpen, Map, Wrench, Braces } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/ai-content/knowledge-graph")({
  component: KnowledgeGraphPage,
});

const ENTITIES = [
  { icon: GraduationCap, label: "Programs", href: "/admin/content/articles" as const, desc: "Every course page becomes a graph node connected to its topics." },
  { icon: BookOpen, label: "Blogs", href: "/admin/blogs" as const, desc: "Blog posts link into pillar topics and related programs." },
  { icon: Map, label: "Roadmaps", href: "/admin/content/roadmaps" as const, desc: "Phased learning paths tie topics to programs and outcomes." },
  { icon: Braces, label: "Glossary", href: "/admin/content/glossary" as const, desc: "Every definition is a semantic anchor for GEO." },
  { icon: Wrench, label: "Projects", href: "/admin/content" as const, desc: "Hands-on projects wire skills back into learning paths." },
];

function KnowledgeGraphPage() {
  return (
    <div className="space-y-6 max-w-7xl">
      <header>
        <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
          <Network className="size-5 text-primary" /> Knowledge Graph
        </h1>
        <p className="text-sm text-muted-foreground">The semantic layer that connects Glintr's programs, articles, glossary and roadmaps into one AI-searchable graph.</p>
      </header>

      <Card className="p-6 bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5 border-primary/20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2">
            <h2 className="font-display text-lg font-semibold">Every AI article is graph-native</h2>
            <p className="text-sm text-muted-foreground mt-2">
              The engine attaches entities, related topics and internal links at generation time, so every published article becomes a citable node for search engines and LLMs.
            </p>
          </div>
          <div className="rounded-lg bg-white border border-border/60 p-4 text-center">
            <div className="text-3xl font-display font-semibold text-primary">1,240+</div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground mt-1">Graph nodes</div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {ENTITIES.map((e) => {
          const Icon = e.icon;
          return (
            <Link key={e.label} to={e.href as any} className="block">
              <Card className="p-5 h-full hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="size-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="size-4" />
                  </div>
                  <h3 className="font-display font-semibold">{e.label}</h3>
                </div>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{e.desc}</p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
