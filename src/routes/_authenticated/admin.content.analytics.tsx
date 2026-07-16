import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getContentAnalytics } from "@/lib/admin/content.functions";
import { Card } from "@/components/ui/card";
import { CONTENT_TYPE_LABEL } from "@/lib/admin/content-meta";

export const Route = createFileRoute("/_authenticated/admin/content/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const fn = useServerFn(getContentAnalytics);
  const { data } = useQuery({ queryKey: ["cms-analytics"], queryFn: () => fn({ data: {} }) });
  const rows: any[] = (data as any)?.rows ?? [];

  return (
    <div className="space-y-4 max-w-6xl">
      <header>
        <h1 className="font-display text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Top-performing published content. Views, reading time and completion rate populate as visitors read.</p>
      </header>
      <Card className="overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border/60 bg-surface-1/40">
          <div className="col-span-5">Title</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2 text-right">Views</div>
          <div className="col-span-1 text-right">Time</div>
          <div className="col-span-2 text-right">Completion</div>
        </div>
        <div className="divide-y divide-border/60">
          {rows.map((r) => (
            <Link key={r.id} to={"/admin/content/articles/$id" as any} params={{ id: r.id } as any} className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-surface-2/40">
              <div className="col-span-5 text-sm truncate">{r.title}</div>
              <div className="col-span-2 text-xs">{CONTENT_TYPE_LABEL[r.type]}</div>
              <div className="col-span-2 text-xs text-right font-mono">{r.view_count?.toLocaleString() ?? 0}</div>
              <div className="col-span-1 text-xs text-right font-mono">{Math.round((r.avg_reading_time_sec ?? 0) / 60)}m</div>
              <div className="col-span-2 text-xs text-right font-mono">{Number(r.completion_rate ?? 0).toFixed(0)}%</div>
            </Link>
          ))}
          {!rows.length && <div className="p-8 text-sm text-muted-foreground text-center">Analytics events appear once published pages start receiving traffic.</div>}
        </div>
      </Card>
    </div>
  );
}
