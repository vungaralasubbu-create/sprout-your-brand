import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAiSearchDashboard } from "@/lib/admin/ai-search.functions";
import { Card } from "@/components/ui/card";
import { BookMarked } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/ai-search/definitions")({
  component: Definitions,
});

function Definitions() {
  const fn = useServerFn(getAiSearchDashboard);
  const { data } = useQuery({ queryKey: ["ai-search-dash"], queryFn: () => fn(), staleTime: 60_000 });
  return (
    <div className="space-y-5 max-w-4xl">
      <header>
        <h1 className="font-display text-xl font-semibold flex items-center gap-2"><BookMarked className="size-4 text-primary" /> Definition Coverage</h1>
        <p className="text-sm text-muted-foreground">A clear, up-front definition is required for citation in AI Overviews.</p>
      </header>
      <Card className="p-4">
        <div className="flex items-center justify-between text-sm">
          <span>Pages with an explicit definition</span>
          <span className="font-mono">{data?.coverage?.definition ?? 0}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary" style={{ width: `${data?.coverage?.definition ?? 0}%` }} />
        </div>
      </Card>
      <Card className="p-4 text-xs text-muted-foreground">
        A good definition is 1–2 sentences, plain language, and starts with the term. Follow it with an example and a distinction from adjacent concepts.
      </Card>
    </div>
  );
}
