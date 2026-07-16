import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getContentGaps } from "@/lib/admin/content-intelligence.functions";
import { Card } from "@/components/ui/card";
import { Search } from "lucide-react";
import { CONTENT_TYPE_LABEL } from "@/lib/admin/content-meta";

export const Route = createFileRoute("/_authenticated/admin/content-intelligence/gaps")({
  component: Gaps,
});

function Gaps() {
  const fn = useServerFn(getContentGaps);
  const { data, isLoading } = useQuery({ queryKey: ["ci-gaps"], queryFn: () => fn(), staleTime: 60_000 });
  const areas = Array.from(new Set((data?.gaps ?? []).map((g) => g.area)));

  return (
    <div className="space-y-5 max-w-6xl">
      <header className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h1 className="font-display text-xl font-semibold flex items-center gap-2"><Search className="size-4 text-primary" /> Content Gap Analysis</h1>
          <p className="text-sm text-muted-foreground">Educational topics the library is missing. Each item requires editor approval before creation.</p>
        </div>
        <div className="text-xs text-muted-foreground">{data?.total ?? 0} opportunities</div>
      </header>

      {isLoading && <div className="text-sm text-muted-foreground">Analysing library…</div>}

      {areas.map((area) => (
        <section key={area}>
          <h2 className="text-sm font-semibold mb-2 mt-4">{area}</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {(data?.gaps ?? []).filter((g) => g.area === area).slice(0, 12).map((g, i) => (
              <Card key={`${area}-${i}`} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium">{g.topic}</div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase font-mono ${g.priority === "high" ? "bg-rose-100 text-rose-700" : g.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-neutral-100 text-neutral-700"}`}>{g.priority}</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">{g.reason}</div>
                <div className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground mt-2">{CONTENT_TYPE_LABEL[g.type] ?? g.type}</div>
                <Link to={"/admin/ai-content/wizard" as any} className="mt-3 inline-flex text-xs font-medium text-primary hover:underline">Create with wizard →</Link>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
