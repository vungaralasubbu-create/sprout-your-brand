import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAiSearchTasks } from "@/lib/admin/ai-search.functions";
import { Card } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/ai-search/tasks")({
  component: Tasks,
});

function Tasks() {
  const fn = useServerFn(getAiSearchTasks);
  const { data, isLoading } = useQuery({ queryKey: ["ai-search-tasks"], queryFn: () => fn(), staleTime: 60_000 });

  return (
    <div className="space-y-5 max-w-5xl">
      <header>
        <h1 className="font-display text-xl font-semibold flex items-center gap-2"><ClipboardList className="size-4 text-primary" /> Editor Tasks</h1>
        <p className="text-sm text-muted-foreground">Pages that need Quick Answers, Definitions, FAQs, Schema or Internal Links to be AI-search ready.</p>
      </header>

      {isLoading && <div className="text-sm text-muted-foreground">Scanning…</div>}
      {!isLoading && (
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-3">{data?.total ?? 0} pages need improvements — showing first {(data?.tasks ?? []).length}.</div>
          <div className="divide-y divide-border/60">
            {data?.tasks?.map((t: any) => (
              <div key={t.id} className="py-2.5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{t.title}</div>
                  <div className="text-[11px] font-mono text-muted-foreground">/{t.slug} · {t.type}</div>
                </div>
                <div className="flex flex-wrap gap-1 justify-end max-w-md">
                  {t.missing.map((m: string) => (
                    <span key={m} className="rounded bg-amber-100 text-amber-800 text-[10px] font-mono px-1.5 py-0.5">{m}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
