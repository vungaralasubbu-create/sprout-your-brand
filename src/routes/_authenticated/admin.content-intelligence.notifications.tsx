import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getIntelligenceNotifications } from "@/lib/admin/content-intelligence.functions";
import { Card } from "@/components/ui/card";
import { Bell } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/content-intelligence/notifications")({
  component: Notifications,
});

function Notifications() {
  const fn = useServerFn(getIntelligenceNotifications);
  const { data, isLoading } = useQuery({ queryKey: ["ci-notifications"], queryFn: () => fn(), staleTime: 60_000 });

  return (
    <div className="space-y-5 max-w-5xl">
      <header>
        <h1 className="font-display text-xl font-semibold flex items-center gap-2"><Bell className="size-4 text-primary" /> Notifications</h1>
        <p className="text-sm text-muted-foreground">Editorial alerts derived from the current library state.</p>
      </header>

      {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}

      <Card className="divide-y">
        {(data?.notifications ?? []).map((n) => (
          <div key={n.id} className="p-3 flex items-center gap-3">
            <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase font-mono ${n.severity === "high" ? "bg-rose-100 text-rose-700" : n.severity === "medium" ? "bg-amber-100 text-amber-700" : "bg-neutral-100 text-neutral-700"}`}>{n.kind}</span>
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-medium">{n.title}</div>
              <div className="text-[11px] text-muted-foreground">{n.detail}</div>
            </div>
            {n.itemId && (
              <Link to={"/admin/content/articles/$id" as any} params={{ id: n.itemId } as any} className="text-xs font-medium text-primary">Open</Link>
            )}
          </div>
        ))}
        {!isLoading && (data?.notifications ?? []).length === 0 && <div className="p-4 text-sm text-muted-foreground">All clear — nothing to notify.</div>}
      </Card>
    </div>
  );
}
