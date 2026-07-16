import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Boxes, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/ai-search/entities")({
  component: Entities,
});

function Entities() {
  return (
    <div className="space-y-5 max-w-4xl">
      <header>
        <h1 className="font-display text-xl font-semibold flex items-center gap-2"><Boxes className="size-4 text-primary" /> Entity Coverage</h1>
        <p className="text-sm text-muted-foreground">Canonical concept pages that AI systems use to disambiguate and link.</p>
      </header>
      <Card className="p-4 space-y-2 text-sm">
        <p>The full entity directory lives at <Link to={"/entities" as any} className="text-primary hover:underline">/entities</Link> and is regenerated with the sitemap on every deploy.</p>
        <p className="text-muted-foreground text-xs">To review coverage and missing entities alongside content, use <Link to={"/admin/content-intelligence/entities" as any} className="text-primary hover:underline">Content Intelligence → Entity Coverage</Link>.</p>
      </Card>
      <Card className="p-4">
        <div className="text-sm font-semibold mb-2 flex items-center gap-2">Public entity directory <ExternalLink className="size-3.5" /></div>
        <p className="text-xs text-muted-foreground">Every entity page includes: Definition · Applications · Related Articles · Programs · Glossary · Roadmaps · FAQs · JSON-LD (DefinedTerm, FAQPage, BreadcrumbList).</p>
      </Card>
    </div>
  );
}
