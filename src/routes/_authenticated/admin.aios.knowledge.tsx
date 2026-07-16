import { createFileRoute } from "@tanstack/react-router";
import { Database, BookOpen, GraduationCap, Newspaper, Map, Network, FileText, Shield } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/aios/knowledge")({
  component: KnowledgePage,
});

const SOURCES = [
  { id: "programs", label: "Programs", desc: "All course pages, category hubs and pricing.", icon: GraduationCap, count: "26 programs" },
  { id: "learn", label: "Learn Guides", desc: "Long-form educational articles under /learn.", icon: BookOpen, count: "20+ guides" },
  { id: "glossary", label: "Glossary", desc: "Structured glossary entries with relations.", icon: FileText, count: "45+ terms" },
  { id: "blogs", label: "Blog", desc: "Editorial blog articles.", icon: Newspaper, count: "16 articles" },
  { id: "roadmaps", label: "Roadmaps & Paths", desc: "Learning paths and career maps.", icon: Map, count: "Paths + Careers" },
  { id: "graph", label: "Knowledge Graph", desc: "Concept relations connecting every resource.", icon: Network, count: "Interactive" },
  { id: "policies", label: "Policies", desc: "Privacy, Terms, Refund, Payout, Revenue Share.", icon: Shield, count: "6 documents" },
];

function KnowledgePage() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-primary flex items-center gap-1.5"><Database className="size-3" /> Shared knowledge</p>
        <h1 className="mt-1 text-2xl font-semibold">Knowledge sources</h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">Every AIOS agent grounds its answers in these approved sources. Nothing is invented — if the knowledge does not exist, agents will say so.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {SOURCES.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.id} className="rounded-lg border border-border/60 bg-white p-4">
              <div className="flex items-start gap-3">
                <span className="rounded-md bg-primary/10 p-2 text-primary"><Icon className="size-4" /></span>
                <div>
                  <p className="text-sm font-semibold">{s.label}</p>
                  <p className="text-[12px] text-muted-foreground">{s.desc}</p>
                  <p className="mt-1 text-[11px] font-mono text-muted-foreground/80">{s.count}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-md border border-primary/20 bg-primary/5 p-4 text-[12px] leading-relaxed">
        <strong className="text-primary">Guardrail:</strong> Agents only surface information that exists in these sources or the user's own conversation. They will never fabricate policies, guarantees, revenue numbers or partnerships.
      </div>
    </div>
  );
}
