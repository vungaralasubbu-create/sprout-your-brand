import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getContentDecay } from "@/lib/admin/content-intelligence.functions";
import { Card } from "@/components/ui/card";
import { Snowflake } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/content-intelligence/decay")({
  component: Decay,
});

function Decay() {
  const fn = useServerFn(getContentDecay);
  const { data, isLoading } = useQuery({ queryKey: ["ci-decay"], queryFn: () => fn(), staleTime: 60_000 });

  return (
    <div className="space-y-5 max-w-6xl">
      <header>
        <h1 className="font-display text-xl font-semibold flex items-center gap-2"><Snowflake className="size-4 text-primary" /> Content Decay</h1>
        <p className="text-sm text-muted-foreground">Signals suggesting a page may need refreshing. Rewrites remain a human decision.</p>
      </header>

      {isLoading && <div className="text-sm text-muted-foreground">Analysing…</div>}

      <Card className="divide-y">
        {(data?.rows ?? []).slice(0, 80).map((r) => (
          <div key={r.id} className="p-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-medium">{r.title}</div>
                <div className="text-[11px] text-muted-foreground font-mono">{r.type} · {r.ageDays} days</div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${r.decayScore >= 70 ? "bg-rose-100 text-rose-700" : r.decayScore >= 40 ? "bg-amber-100 text-amber-700" : "bg-neutral-100 text-neutral-700"}`}>{r.decayScore}</span>
              <Link to={"/admin/content/articles/$id" as any} params={{ id: r.id } as any} className="text-xs font-medium text-primary">Review</Link>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {r.factors.map((f, i) => (
                <span key={i} className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-mono">{f}</span>
              ))}
            </div>
          </div>
        ))}
        {!isLoading && (data?.rows ?? []).length === 0 && <div className="p-4 text-sm text-muted-foreground">Nothing decaying right now.</div>}
      </Card>
    </div>
  );
}
