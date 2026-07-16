import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getQualityRanking } from "@/lib/admin/content-intelligence.functions";
import { Card } from "@/components/ui/card";
import { Gauge } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/content-intelligence/quality")({
  component: Quality,
});

function Quality() {
  const fn = useServerFn(getQualityRanking);
  const { data, isLoading } = useQuery({ queryKey: ["ci-quality"], queryFn: () => fn(), staleTime: 60_000 });

  return (
    <div className="space-y-5 max-w-6xl">
      <header>
        <h1 className="font-display text-xl font-semibold flex items-center gap-2"><Gauge className="size-4 text-primary" /> Quality Scores</h1>
        <p className="text-sm text-muted-foreground">Every published article scored across nine dimensions. Weakest articles surface first.</p>
      </header>

      {isLoading && <div className="text-sm text-muted-foreground">Scoring…</div>}

      <Card className="divide-y">
        {(data?.rows ?? []).slice(0, 80).map((r) => (
          <div key={r.id} className="p-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-medium">{r.title}</div>
                <div className="text-[11px] text-muted-foreground font-mono">{r.type}</div>
              </div>
              <ScoreBadge score={r.score.overall} />
              <Link to={"/admin/content/articles/$id" as any} params={{ id: r.id } as any} className="text-xs font-medium text-primary">Open</Link>
            </div>
            <div className="mt-2 grid grid-cols-3 md:grid-cols-9 gap-1.5 text-[10px]">
              {[
                ["Read", r.score.readability],["Struct", r.score.structure],["SEO", r.score.seo],
                ["GEO", r.score.geo],["Links", r.score.linking],["A11y", r.score.accessibility],
                ["Compl", r.score.completeness],["Media", r.score.media],["Fresh", r.score.freshness],
              ].map(([k, v]) => (
                <div key={k as string} className="rounded bg-surface-2/70 px-1 py-0.5 flex justify-between font-mono">
                  <span className="text-muted-foreground">{k}</span><span>{v as number}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 80 ? "bg-emerald-100 text-emerald-700" : score >= 60 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-mono ${cls}`}>{score}</span>;
}
