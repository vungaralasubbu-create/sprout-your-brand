import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLlmsConfig } from "@/lib/admin/ai-search.functions";
import { Card } from "@/components/ui/card";
import { ListTree, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/llm/sections")({
  component: Sections,
});

function Sections() {
  const fn = useServerFn(getLlmsConfig);
  const { data } = useQuery({ queryKey: ["llms-config"], queryFn: () => fn(), staleTime: 60_000 });

  return (
    <div className="space-y-5 max-w-4xl">
      <header>
        <h1 className="font-display text-xl font-semibold flex items-center gap-2"><ListTree className="size-4 text-primary" /> Sections</h1>
        <p className="text-sm text-muted-foreground">Top-level sections listed in /llms.txt. Sections marked auto are updated whenever new public content ships.</p>
      </header>
      <div className="space-y-2">
        {data?.sections?.map((s: any) => (
          <Card key={s.key} className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">{s.label}</div>
              <div className="text-[11px] font-mono text-muted-foreground">{s.path}</div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {s.auto ? <span className="inline-flex items-center gap-1 text-emerald-600"><Check className="size-3.5" /> Auto-updated</span> : <span className="text-muted-foreground">Manual</span>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
