import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAiSearchDashboard } from "@/lib/admin/ai-search.functions";
import { Card } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/ai-search/faqs")({
  component: Faqs,
});

function Faqs() {
  const fn = useServerFn(getAiSearchDashboard);
  const { data } = useQuery({ queryKey: ["ai-search-dash"], queryFn: () => fn(), staleTime: 60_000 });
  return (
    <div className="space-y-5 max-w-4xl">
      <header>
        <h1 className="font-display text-xl font-semibold flex items-center gap-2"><HelpCircle className="size-4 text-primary" /> FAQ Coverage</h1>
        <p className="text-sm text-muted-foreground">FAQs are the single highest-leverage block for AI Overviews and answer cards.</p>
      </header>
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm">Pages with FAQ blocks</div>
          <div className="font-mono">{data?.coverage?.faq ?? 0}%</div>
        </div>
        <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary" style={{ width: `${data?.coverage?.faq ?? 0}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-3">Every FAQ must be attached to <code>FAQPage</code> JSON-LD and reflect a real question a learner would ask.</p>
      </Card>
    </div>
  );
}
