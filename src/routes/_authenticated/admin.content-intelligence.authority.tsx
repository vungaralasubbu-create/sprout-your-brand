import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getIntelSummary } from "@/lib/content-intelligence/intel.functions";
import { Card } from "@/components/ui/card";
import { Network, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/content-intelligence/authority")({
  component: AuthorityPage,
});

function AuthorityPage() {
  const fn = useServerFn(getIntelSummary);
  const { data, isLoading } = useQuery({ queryKey: ["intel-summary"], queryFn: () => fn(), staleTime: 60_000 });

  return (
    <div className="space-y-6 max-w-7xl">
      <header>
        <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
          <Network className="size-5 text-primary" /> Topical Authority
        </h1>
        <p className="text-sm text-muted-foreground">
          Domain-by-domain coverage across the 25 educational verticals Glintr targets. Highlights missing entities so editors know what to write next.
        </p>
      </header>

      {isLoading && <div className="text-sm text-muted-foreground">Analysing the knowledge library…</div>}

      <div className="grid gap-3 md:grid-cols-2">
        {data?.domainRows.map((d) => {
          const tone =
            d.state === "covered" ? "bg-emerald-500" :
            d.state === "partial" ? "bg-amber-500" :
            d.state === "weak" ? "bg-orange-500" : "bg-rose-500";
          return (
            <Card key={d.slug} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-sm font-semibold">{d.name}</div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{d.category}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold font-mono">{d.pct}%</div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{d.hits}/{d.total} entities</div>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden mb-3">
                <div className={cn("h-full transition-all", tone)} style={{ width: `${d.pct}%` }} />
              </div>
              {d.missing.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground mb-1.5">Missing</div>
                  <div className="flex flex-wrap gap-1.5">
                    {d.missing.slice(0, 8).map((m) => (
                      <span key={m} className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 text-rose-700 px-2 py-0.5 text-[11px]">
                        <ChevronRight className="size-3" /> {m}
                      </span>
                    ))}
                    {d.missing.length > 8 && (
                      <span className="text-[11px] text-muted-foreground">+{d.missing.length - 8} more</span>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
