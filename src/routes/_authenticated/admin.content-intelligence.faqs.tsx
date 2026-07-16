import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getFaqSuggestions } from "@/lib/admin/content-intelligence.functions";
import { Card } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/content-intelligence/faqs")({
  component: Faqs,
});

function Faqs() {
  const fn = useServerFn(getFaqSuggestions);
  const { data, isLoading } = useQuery({ queryKey: ["ci-faqs"], queryFn: () => fn(), staleTime: 60_000 });

  return (
    <div className="space-y-5 max-w-5xl">
      <header>
        <h1 className="font-display text-xl font-semibold flex items-center gap-2"><HelpCircle className="size-4 text-primary" /> FAQ Discovery</h1>
        <p className="text-sm text-muted-foreground">Unanswered learner questions ranked by confidence. Approve to build a dedicated answer.</p>
      </header>

      {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}

      <Card className="divide-y">
        {(data?.suggestions ?? []).map((s, i) => (
          <div key={i} className="p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{s.q}</div>
              <div className="text-[11px] text-muted-foreground font-mono">{s.cluster}</div>
            </div>
            <div className="w-24">
              <div className="text-[10px] font-mono text-muted-foreground text-right">{s.confidence}%</div>
              <div className="h-1 mt-1 rounded-full bg-surface-2 overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${s.confidence}%` }} />
              </div>
            </div>
            <Link to={"/admin/ai-content/wizard" as any} className="text-xs font-medium text-primary">Draft</Link>
          </div>
        ))}
      </Card>
    </div>
  );
}
