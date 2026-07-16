import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listTopicClusters } from "@/lib/admin/ai-content.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network } from "lucide-react";
import { CONTENT_TYPE_LABEL } from "@/lib/admin/content-meta";

export const Route = createFileRoute("/_authenticated/admin/ai-content/clusters")({
  component: ClustersPage,
});

function ClustersPage() {
  const fn = useServerFn(listTopicClusters);
  const { data } = useQuery({ queryKey: ["ai-clusters"], queryFn: () => fn() });

  return (
    <div className="space-y-4 max-w-6xl">
      <header>
        <h1 className="font-display text-2xl font-semibold flex items-center gap-2"><Network className="size-5 text-primary" /> Topic Clusters</h1>
        <p className="text-sm text-muted-foreground">Every piece of content grouped into its editorial cluster — surface gaps and grow topical authority.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(data ?? []).map((c: any) => (
          <Card key={c.name} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-medium">{c.name}</h2>
              <Badge variant="outline">{c.count}</Badge>
            </div>
            <div className="space-y-1">
              {c.items.slice(0, 8).map((r: any) => (
                <Link key={r.id} to={"/admin/content/articles/$id" as any} params={{ id: r.id } as any} className="block text-xs hover:underline truncate">
                  · {r.title} <span className="text-muted-foreground">({CONTENT_TYPE_LABEL[r.type] ?? r.type})</span>
                </Link>
              ))}
              {!c.items.length && <div className="text-xs text-muted-foreground">No content in this cluster yet.</div>}
              {c.count > 8 && <div className="text-[10px] text-muted-foreground">+ {c.count - 8} more</div>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
