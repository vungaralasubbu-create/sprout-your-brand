import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Braces } from "lucide-react";

const TYPES = [
  { name: "Article", where: "Blog & Learn articles" },
  { name: "Course", where: "Program pages" },
  { name: "DefinedTerm", where: "Glossary & entity pages" },
  { name: "FAQPage", where: "Every page with a FAQ block" },
  { name: "HowTo", where: "Tutorials & step-by-step guides" },
  { name: "BreadcrumbList", where: "All indexed pages" },
  { name: "Organization", where: "Root layout" },
  { name: "Person", where: "Author profile pages" },
  { name: "ItemList", where: "Programs catalog & topic pages" },
  { name: "EducationalOrganization", where: "About & trust pages" },
];

export const Route = createFileRoute("/_authenticated/admin/ai-search/schema")({
  component: Schema,
});

function Schema() {
  return (
    <div className="space-y-5 max-w-4xl">
      <header>
        <h1 className="font-display text-xl font-semibold flex items-center gap-2"><Braces className="size-4 text-primary" /> Structured Data</h1>
        <p className="text-sm text-muted-foreground">JSON-LD types Glintr publishes across the site.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {TYPES.map((t) => (
          <Card key={t.name} className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">{t.name}</div>
              <div className="text-xs text-muted-foreground">{t.where}</div>
            </div>
            <span className="rounded bg-emerald-100 text-emerald-700 text-[10px] font-mono px-1.5 py-0.5">Live</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
