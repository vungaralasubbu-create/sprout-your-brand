import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";

const REPORTS = [
  { name: "Weekly AI Readiness Report", cadence: "Weekly · Mondays", desc: "Overall AI readiness, delta vs. last week, top improvements." },
  { name: "Citation Report", cadence: "Weekly", desc: "Definitions, FAQs and Quick Answers coverage across published pages." },
  { name: "Knowledge Coverage Report", cadence: "Monthly", desc: "Topical authority + entity coverage across all 25 verticals." },
  { name: "Entity Growth Report", cadence: "Monthly", desc: "New entity pages added, coverage gaps, related-content depth." },
  { name: "FAQ Coverage Report", cadence: "Monthly", desc: "FAQPage schema coverage and answer quality sampling." },
];

export const Route = createFileRoute("/_authenticated/admin/ai-search/reports")({
  component: Reports,
});

function Reports() {
  return (
    <div className="space-y-5 max-w-4xl">
      <header>
        <h1 className="font-display text-xl font-semibold flex items-center gap-2"><FileText className="size-4 text-primary" /> AI Search Reports</h1>
        <p className="text-sm text-muted-foreground">Scheduled reports summarizing progress across the AI Search dimensions.</p>
      </header>
      <div className="space-y-2">
        {REPORTS.map((r) => (
          <Card key={r.name} className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">{r.name}</div>
              <div className="text-xs text-muted-foreground">{r.cadence} · {r.desc}</div>
            </div>
            <button className="text-xs inline-flex items-center gap-1.5 rounded border px-2.5 py-1.5 hover:bg-surface-2">
              <Download className="size-3.5" /> Generate
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
