import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { listLogs } from "@/lib/integrations/integrations.functions";

export const Route = createFileRoute("/_authenticated/integrations/logs")({
  component: LogsPage,
});

function LogsPage() {
  const ll = useServerFn(listLogs);
  const q = useQuery({ queryKey: ["intg-logs"], queryFn: () => ll({}) });
  const logs = q.data?.logs ?? [];
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="border-b p-5">
        <div className="text-sm font-semibold">Activity log</div>
        <p className="mt-0.5 text-xs text-muted-foreground">Every connect, sync, and disconnect event across your integrations.</p>
      </div>
      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <Activity className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">No activity yet.</p>
        </div>
      ) : (
        <div className="divide-y">
          {logs.map((l: any) => (
            <div key={l.id} className="flex items-center justify-between gap-3 p-4 text-sm">
              <div className="flex items-center gap-3">
                <span className={cn("inline-flex h-2 w-2 rounded-full",
                  l.status === "success" ? "bg-emerald-500" :
                  l.status === "error" ? "bg-red-500" :
                  l.status === "warning" ? "bg-amber-500" : "bg-muted-foreground")} />
                <div>
                  <div className="font-medium capitalize">{l.event_type.replace(/_/g, " ")}</div>
                  <div className="text-xs text-muted-foreground">{l.provider}</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
