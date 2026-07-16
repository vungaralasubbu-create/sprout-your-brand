import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getEditorTasks } from "@/lib/admin/content-intelligence.functions";
import { Card } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/content-intelligence/tasks")({
  component: Tasks,
});

function Tasks() {
  const fn = useServerFn(getEditorTasks);
  const { data, isLoading } = useQuery({ queryKey: ["ci-tasks"], queryFn: () => fn(), staleTime: 60_000 });
  const queues = Object.keys(data?.queues ?? {});
  const [active, setActive] = useState<string | null>(null);
  const activeQueue = active ?? queues[0] ?? "";

  return (
    <div className="space-y-5 max-w-6xl">
      <header>
        <h1 className="font-display text-xl font-semibold flex items-center gap-2"><ClipboardList className="size-4 text-primary" /> Editor Tasks</h1>
        <p className="text-sm text-muted-foreground">Review queues generated from the current state of the library.</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {queues.map((q) => (
          <button key={q} onClick={() => setActive(q)} className={`text-xs rounded-md px-3 py-1.5 border ${activeQueue === q ? "border-primary bg-primary/5 text-primary" : "border-border/60"}`}>
            {q} <span className="font-mono text-[10px] opacity-60 ml-1">{data?.queues[q]?.length ?? 0}</span>
          </button>
        ))}
      </div>

      {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}

      <Card className="divide-y">
        {(data?.queues[activeQueue] ?? []).slice(0, 100).map((t) => (
          <div key={`${activeQueue}-${t.id}`} className="p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-medium">{t.title}</div>
              <div className="text-[11px] text-muted-foreground font-mono">{t.type} · {t.status}</div>
            </div>
            <Link to={"/admin/content/articles/$id" as any} params={{ id: t.id } as any} className="text-xs font-medium text-primary">Open</Link>
          </div>
        ))}
        {!isLoading && (data?.queues[activeQueue] ?? []).length === 0 && <div className="p-4 text-sm text-muted-foreground">Queue is empty — nothing to do.</div>}
      </Card>
    </div>
  );
}
