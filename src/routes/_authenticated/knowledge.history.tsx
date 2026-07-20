import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { History as HistoryIcon } from "lucide-react";
import { searchHistory } from "@/lib/knowledge/knowledge.functions";

export const Route = createFileRoute("/_authenticated/knowledge/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const sh = useServerFn(searchHistory);
  const q = useQuery({ queryKey: ["kn-history"], queryFn: () => sh({}) });
  const logs = q.data?.logs ?? [];

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="border-b p-5">
        <div className="text-sm font-semibold">Knowledge search history</div>
        <p className="mt-0.5 text-xs text-muted-foreground">Every query your team has asked the AI brain.</p>
      </div>
      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <HistoryIcon className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">No searches yet.</p>
        </div>
      ) : (
        <div className="divide-y">
          {logs.map((l: any) => (
            <div key={l.id} className="flex items-center justify-between p-4 text-sm">
              <div>
                <div className="font-medium">{l.query}</div>
                <div className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</div>
              </div>
              <div className="text-xs text-muted-foreground">
                {l.results_count} results · {l.duration_ms}ms
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
