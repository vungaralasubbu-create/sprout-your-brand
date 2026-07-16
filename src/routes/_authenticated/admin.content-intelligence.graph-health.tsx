import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getGraphHealth } from "@/lib/admin/content-intelligence.functions";
import { Card } from "@/components/ui/card";
import { Share2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/content-intelligence/graph-health")({
  component: GraphHealth,
});

function GraphHealth() {
  const fn = useServerFn(getGraphHealth);
  const { data, isLoading } = useQuery({ queryKey: ["ci-graph"], queryFn: () => fn(), staleTime: 60_000 });

  return (
    <div className="space-y-5 max-w-5xl">
      <header>
        <h1 className="font-display text-xl font-semibold flex items-center gap-2"><Share2 className="size-4 text-primary" /> Knowledge Graph Health</h1>
        <p className="text-sm text-muted-foreground">How well the library links to itself.</p>
      </header>

      {isLoading && <div className="text-sm text-muted-foreground">Measuring…</div>}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Kpi label="Total nodes" value={data?.totalNodes} />
        <Kpi label="Connected nodes" value={data?.connectedNodes} tone="good" />
        <Kpi label="Isolated nodes" value={data?.isolatedNodes} tone="warn" />
        <Kpi label="Total links" value={data?.totalLinks} />
        <Kpi label="Broken relationships" value={data?.brokenRelationships} tone="warn" />
        <Kpi label="Avg connections / node" value={data?.averageConnections} />
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold mb-2">Visualisation</h2>
        <p className="text-xs text-muted-foreground">Nodes are sized by connection count. Yellow dots are isolated pages that need internal links to related concepts, guides or roadmaps.</p>
        <div className="mt-4 grid grid-cols-8 md:grid-cols-12 gap-2">
          {Array.from({ length: Math.min(120, data?.totalNodes ?? 0) }).map((_, i) => {
            const iso = i < (data?.isolatedNodes ?? 0);
            return <div key={i} className={`aspect-square rounded-full ${iso ? "bg-amber-400" : "bg-emerald-500"}`} title={iso ? "Isolated" : "Connected"} />;
          })}
        </div>
      </Card>
    </div>
  );
}

function Kpi({ label, value, tone }: any) {
  const cls = tone === "warn" ? "text-amber-600" : tone === "good" ? "text-emerald-600" : "text-foreground";
  return (
    <Card className="p-4">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${cls}`}>{value ?? "—"}</div>
    </Card>
  );
}
