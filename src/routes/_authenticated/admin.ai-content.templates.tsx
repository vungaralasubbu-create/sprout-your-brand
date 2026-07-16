import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { LayoutTemplate, BookOpen, GitCompare, Briefcase, IndianRupee, ListChecks, Wrench, Map, Factory, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/ai-content/templates")({
  component: TemplatesPage,
});

const TEMPLATES = [
  { id: "beginner-guide", name: "Beginner Guide", icon: BookOpen, desc: "Complete intro article: what it is, how it works, examples, FAQs.", sections: 12 },
  { id: "complete-guide", name: "Complete Guide", icon: BookOpen, desc: "Long-form pillar content, 3000+ words, deep dives and comparisons.", sections: 18 },
  { id: "comparison", name: "Comparison", icon: GitCompare, desc: "A vs B article with a scorecard, use cases, pricing and verdict.", sections: 10 },
  { id: "career-guide", name: "Career Guide", icon: Briefcase, desc: "Roles, skills, salary, roadmap, interview prep, portfolio tips.", sections: 14 },
  { id: "salary-guide", name: "Salary Guide", icon: IndianRupee, desc: "Salary ranges by experience, city, industry, plus negotiation tips.", sections: 9 },
  { id: "how-to", name: "How-To Guide", icon: ListChecks, desc: "Step-by-step tutorial with prerequisites, code and screenshots.", sections: 11 },
  { id: "project-tutorial", name: "Project Tutorial", icon: Wrench, desc: "End-to-end build with tech stack, code, deployment, learning outcomes.", sections: 13 },
  { id: "roadmap", name: "Roadmap", icon: Map, desc: "Phased learning path with milestones, timelines, and resources.", sections: 10 },
  { id: "industry-guide", name: "Industry Guide", icon: Factory, desc: "Deep dive into how a sector uses the topic with real case studies.", sections: 12 },
];

function TemplatesPage() {
  return (
    <div className="space-y-6 max-w-7xl">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
            <LayoutTemplate className="size-5 text-primary" /> Content Templates
          </h1>
          <p className="text-sm text-muted-foreground">Reusable article blueprints. Every template ships with structured sections, SEO defaults and schema.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {TEMPLATES.map((t) => {
          const Icon = t.icon;
          return (
            <Card key={t.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="size-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="size-4" />
                </div>
                <h3 className="font-display font-semibold">{t.name}</h3>
              </div>
              <p className="text-[13px] text-muted-foreground leading-relaxed">{t.desc}</p>
              <div className="mt-4 flex items-center justify-between pt-3 border-t border-border/60">
                <span className="text-[11px] text-muted-foreground">{t.sections} sections</span>
                <Link
                  to={"/admin/ai-content/wizard" as any}
                  search={{ template: t.id } as any}
                  className="inline-flex items-center gap-1 text-[12px] text-primary font-medium hover:underline"
                >
                  <Sparkles className="size-3.5" /> Use template
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
