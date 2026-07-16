import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getTopicMap } from "@/lib/admin/content-intelligence.functions";
import { Card } from "@/components/ui/card";
import { Network, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/content-intelligence/topic-map")({
  component: TopicMap,
});

function TopicMap() {
  const fn = useServerFn(getTopicMap);
  const { data, isLoading } = useQuery({ queryKey: ["ci-topic-map"], queryFn: () => fn(), staleTime: 60_000 });

  return (
    <div className="space-y-5 max-w-6xl">
      <header>
        <h1 className="font-display text-xl font-semibold flex items-center gap-2"><Network className="size-4 text-primary" /> Topic Map</h1>
        <p className="text-sm text-muted-foreground">Major knowledge clusters and how they relate. Isolated topics are highlighted.</p>
      </header>

      {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {(data?.clusters ?? []).map((c) => (
          <Card key={c.key} className={`p-4 ${c.empty ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between">
              <div className="text-sm font-semibold">{c.label}</div>
              {c.isolated && <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-amber-600"><AlertCircle className="size-3" />Isolated</span>}
              {c.empty && <span className="text-[10px] font-mono uppercase text-rose-600">Empty</span>}
            </div>
            <div className="mt-2 text-2xl font-semibold">{c.count}</div>
            <div className="text-[11px] text-muted-foreground">
              {c.empty ? "No content yet" : `Connected to ${c.relatedCount} cluster${c.relatedCount === 1 ? "" : "s"}`}
            </div>
            {c.related.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {c.related.slice(0, 4).map((r) => (
                  <span key={r} className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-mono">{r}</span>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
