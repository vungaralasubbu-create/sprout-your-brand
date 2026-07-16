import { createFileRoute } from "@tanstack/react-router";
import { Star, ThumbsUp, ThumbsDown, AlertTriangle } from "lucide-react";
import { useFeedback } from "@/lib/aios/storage";
import { getAgent } from "@/lib/aios/agents";

export const Route = createFileRoute("/_authenticated/admin/aios/feedback")({
  component: FeedbackPage,
});

function FeedbackPage() {
  const { items } = useFeedback();
  const total = items.length;
  const helpful = items.filter((f) => f.rating === "helpful").length;
  const notHelpful = items.filter((f) => f.rating === "not_helpful").length;
  const needs = items.filter((f) => f.rating === "needs_improvement").length;

  const byAgent = items.reduce<Record<string, { total: number; helpful: number }>>((acc, f) => {
    acc[f.agentId] = acc[f.agentId] ?? { total: 0, helpful: 0 };
    acc[f.agentId].total += 1;
    if (f.rating === "helpful") acc[f.agentId].helpful += 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-primary flex items-center gap-1.5"><Star className="size-3" /> Feedback</p>
        <h1 className="mt-1 text-2xl font-semibold">AI response feedback</h1>
        <p className="mt-1 text-sm text-muted-foreground">Learners and staff can rate every AI response. We use this signal to improve prompts and guardrails.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Total ratings" value={total} icon={Star} />
        <Stat label="Helpful" value={helpful} icon={ThumbsUp} tone="emerald" />
        <Stat label="Not helpful" value={notHelpful} icon={ThumbsDown} tone="red" />
        <Stat label="Needs improvement" value={needs} icon={AlertTriangle} tone="amber" />
      </div>

      <div className="rounded-lg border border-border/60 bg-white p-4">
        <h2 className="text-sm font-semibold mb-2">By agent</h2>
        {Object.keys(byAgent).length === 0 ? (
          <p className="text-sm text-muted-foreground">No feedback yet. Rate a response in Agents to see it here.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {Object.entries(byAgent).map(([id, v]) => {
              const a = getAgent(id);
              const pct = v.total ? Math.round((v.helpful / v.total) * 100) : 0;
              return (
                <li key={id} className="flex items-center justify-between border-b border-border/40 py-2 last:border-0">
                  <span>{a?.name ?? id}</span>
                  <span className="text-[12px] text-muted-foreground">{v.helpful}/{v.total} helpful ({pct}%)</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon, tone = "muted" }: { label: string; value: number; icon: any; tone?: "muted" | "emerald" | "red" | "amber" }) {
  const bg = { muted: "bg-muted", emerald: "bg-emerald-100 text-emerald-700", red: "bg-red-100 text-red-700", amber: "bg-amber-100 text-amber-700" }[tone];
  return (
    <div className="rounded-lg border border-border/60 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <span className={"rounded-md p-1.5 " + bg}><Icon className="size-3.5" /></span>
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
