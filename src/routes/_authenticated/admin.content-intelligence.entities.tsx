import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getEntityCoverage } from "@/lib/admin/content-intelligence.functions";
import { Card } from "@/components/ui/card";
import { Boxes } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/content-intelligence/entities")({
  component: Entities,
});

function Entities() {
  const fn = useServerFn(getEntityCoverage);
  const { data, isLoading } = useQuery({ queryKey: ["ci-entities"], queryFn: () => fn(), staleTime: 60_000 });

  const covered = (data?.entities ?? []).filter((e) => e.status === "covered");
  const partial = (data?.entities ?? []).filter((e) => e.status === "partial");
  const missing = (data?.entities ?? []).filter((e) => e.status === "missing");

  return (
    <div className="space-y-5 max-w-6xl">
      <header>
        <h1 className="font-display text-xl font-semibold flex items-center gap-2"><Boxes className="size-4 text-primary" /> Entity Coverage</h1>
        <p className="text-sm text-muted-foreground">Educational entities the platform should own on the web.</p>
      </header>

      {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Group title="Covered" tone="bg-emerald-100 text-emerald-700" list={covered} />
        <Group title="Partial" tone="bg-amber-100 text-amber-700" list={partial} />
        <Group title="Missing" tone="bg-rose-100 text-rose-700" list={missing} />
      </div>
    </div>
  );
}

function Group({ title, tone, list }: any) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-mono uppercase ${tone}`}>{title}</span>
        <span className="text-xs text-muted-foreground">{list.length}</span>
      </div>
      <div className="space-y-1.5">
        {list.map((e: any) => (
          <div key={e.entity} className="flex items-center justify-between text-sm">
            <span className="truncate">{e.entity}</span>
            <span className="text-[10px] font-mono text-muted-foreground">{e.dedicated}d · {e.mentions}m</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
