import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Image as ImageIcon, Sparkles, Layers, Grid3x3, Palette } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/ai-content/media")({
  component: MediaPage,
});

const GENERATORS = [
  { icon: Sparkles, label: "Hero Banner", desc: "Full-width dimensional hero with brand gradient." },
  { icon: Grid3x3, label: "Thumbnail", desc: "Compact 16:9 card image for feeds and search." },
  { icon: Layers, label: "Section Illustration", desc: "Editorial mid-article visual matched to the section." },
  { icon: Palette, label: "Infographic", desc: "Data-forward composition with labels and callouts." },
  { icon: Layers, label: "Timeline Graphic", desc: "Horizontal timeline with milestones and captions." },
  { icon: Grid3x3, label: "Comparison Graphic", desc: "Side-by-side scorecard visual." },
  { icon: Sparkles, label: "Icon Set", desc: "Consistent line icons on the Glintr palette." },
  { icon: Palette, label: "Diagram / Flowchart", desc: "Systems, architectures and process flows." },
  { icon: Layers, label: "Career Roadmap", desc: "Phase-by-phase learning path illustration." },
];

function MediaPage() {
  return (
    <div className="space-y-6 max-w-7xl">
      <header>
        <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
          <ImageIcon className="size-5 text-primary" /> Media
        </h1>
        <p className="text-sm text-muted-foreground">Generate and manage every visual asset produced by the AI Content Engine. All images match Glintr's premium brand.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {GENERATORS.map((g) => {
          const Icon = g.icon;
          return (
            <Card key={g.label} className="p-5">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="size-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="size-4" />
                </div>
                <h3 className="font-display font-semibold">{g.label}</h3>
              </div>
              <p className="text-[13px] text-muted-foreground leading-relaxed">{g.desc}</p>
              <div className="mt-4 pt-3 border-t border-border/60">
                <Link to={"/admin/ai-content/wizard" as any} className="text-[12px] text-primary font-medium hover:underline inline-flex items-center gap-1">
                  <Sparkles className="size-3.5" /> Generate in wizard
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <h2 className="font-display text-base font-semibold mb-1">Asset library</h2>
        <p className="text-sm text-muted-foreground">Every asset generated during article creation is stored on Glintr's CDN and reusable across future articles. Search, filters and reuse will roll out in Phase 2.</p>
      </Card>
    </div>
  );
}
