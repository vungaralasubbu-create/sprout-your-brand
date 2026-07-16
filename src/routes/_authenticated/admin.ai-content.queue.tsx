import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Clock, CheckCircle2, Calendar as CalendarIcon, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/ai-content/queue")({
  component: QueuePage,
});

const LANES = [
  { key: "review", label: "In Review", icon: Clock, tone: "bg-amber-50 border-amber-200 text-amber-700" },
  { key: "approved", label: "Approved", icon: CheckCircle2, tone: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  { key: "scheduled", label: "Scheduled", icon: CalendarIcon, tone: "bg-sky-50 border-sky-200 text-sky-700" },
  { key: "blocked", label: "Blocked", icon: AlertTriangle, tone: "bg-rose-50 border-rose-200 text-rose-700" },
];

function QueuePage() {
  return (
    <div className="space-y-6 max-w-7xl">
      <header>
        <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
          <Send className="size-5 text-primary" /> Publishing Queue
        </h1>
        <p className="text-sm text-muted-foreground">Track every article from editor review to scheduled publish. Human approval is required at every stage.</p>
      </header>

      <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-[12px] leading-relaxed">
        <strong className="text-primary">Editorial rule:</strong> AI drafts never publish on their own. Articles move forward only when an editor approves them here.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {LANES.map((lane) => {
          const Icon = lane.icon;
          return (
            <Card key={lane.key} className="p-4">
              <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-medium ${lane.tone}`}>
                <Icon className="size-3.5" /> {lane.label}
              </div>
              <div className="mt-3 space-y-2 min-h-[160px]">
                <div className="text-xs text-muted-foreground italic">No articles in this lane yet.</div>
              </div>
              <div className="mt-3 pt-3 border-t border-border/60 text-[11px] text-muted-foreground">
                <Badge variant="secondary" className="text-[10px]">0 items</Badge>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <h2 className="font-display text-base font-semibold mb-2">How the queue works</h2>
        <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal pl-5">
          <li>An editor generates a draft in <Link to={"/admin/ai-content/wizard" as any} className="text-primary hover:underline">Generate Content</Link>.</li>
          <li>The AI Quality Check runs (grammar, readability, SEO, schema, images).</li>
          <li>Article moves to <em>In Review</em> for human editorial review.</li>
          <li>Once approved, it lands in <em>Approved</em> and can be scheduled or published.</li>
          <li>Blocked articles surface a checklist of what to fix before re-review.</li>
        </ol>
      </Card>
    </div>
  );
}
