import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { generateReport } from "@/lib/admin/content-intelligence.functions";
import { Card } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/content-intelligence/reports")({
  component: Reports,
});

const REPORTS: { kind: "weekly_health" | "monthly_seo" | "coverage" | "tasks" | "top_content" | "gaps"; title: string; desc: string }[] = [
  { kind: "weekly_health", title: "Weekly Content Health", desc: "Overall scoring plus what changed this week." },
  { kind: "monthly_seo", title: "Monthly SEO Report", desc: "Publishing rhythm and SEO metadata coverage." },
  { kind: "coverage", title: "Knowledge Coverage", desc: "Breakdown of content by type." },
  { kind: "tasks", title: "Editorial Tasks", desc: "Missing metadata, images, and other queues." },
  { kind: "top_content", title: "Top Performing Content", desc: "Best-scoring published articles." },
  { kind: "gaps", title: "Content Gaps", desc: "Snapshot of open opportunities." },
];

function Reports() {
  const fn = useServerFn(generateReport);
  const mut = useMutation({ mutationFn: (kind: any) => fn({ data: { kind } }) });
  const [last, setLast] = useState<{ markdown: string; filename: string } | null>(null);

  async function run(kind: any) {
    const r = await mut.mutateAsync(kind);
    setLast(r);
    const blob = new Blob([r.markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = r.filename; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <header>
        <h1 className="font-display text-xl font-semibold flex items-center gap-2"><FileText className="size-4 text-primary" /> Reports</h1>
        <p className="text-sm text-muted-foreground">Downloadable Markdown reports. Great for weekly standups and quarterly reviews.</p>
      </header>

      <div className="grid md:grid-cols-2 gap-3">
        {REPORTS.map((r) => (
          <Card key={r.kind} className="p-4">
            <div className="text-sm font-semibold">{r.title}</div>
            <div className="text-xs text-muted-foreground mt-1">{r.desc}</div>
            <button onClick={() => run(r.kind)} disabled={mut.isPending} className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-2.5 py-1.5 text-xs font-medium hover:opacity-90 disabled:opacity-50">
              <Download className="size-3" /> Generate & download
            </button>
          </Card>
        ))}
      </div>

      {last && (
        <Card className="p-4">
          <div className="text-xs font-mono text-muted-foreground mb-1">{last.filename}</div>
          <pre className="text-[11px] whitespace-pre-wrap font-mono max-h-80 overflow-auto">{last.markdown}</pre>
        </Card>
      )}
    </div>
  );
}
