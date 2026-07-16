import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getRoadmapSuggestions } from "@/lib/admin/content-intelligence.functions";
import { Card } from "@/components/ui/card";
import { Route as RouteIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/content-intelligence/roadmaps")({
  component: Roadmaps,
});

function Roadmaps() {
  const fn = useServerFn(getRoadmapSuggestions);
  const { data, isLoading } = useQuery({ queryKey: ["ci-roadmaps"], queryFn: () => fn(), staleTime: 60_000 });

  return (
    <div className="space-y-5 max-w-5xl">
      <header>
        <h1 className="font-display text-xl font-semibold flex items-center gap-2"><RouteIcon className="size-4 text-primary" /> Roadmap Suggestions</h1>
        <p className="text-sm text-muted-foreground">Career roadmaps that don't yet exist. Editorial approval required before creation.</p>
      </header>

      {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}

      <div className="grid md:grid-cols-2 gap-3">
        {(data?.suggestions ?? []).map((s, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">{s.title} Roadmap</div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase font-mono ${s.priority === "high" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>{s.priority}</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 flex gap-3"><span>Duration: {s.duration}</span><span>{s.audience}</span></div>
            <Link to={"/admin/ai-content/wizard" as any} className="mt-3 inline-flex text-xs font-medium text-primary hover:underline">Start draft →</Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
