import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getContentDashboard } from "@/lib/admin/content.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { FileText, CheckCircle2, Clock, Calendar, Eye, TrendingUp } from "lucide-react";
import { CONTENT_TYPE_LABEL } from "@/lib/admin/content-meta";

export const Route = createFileRoute("/_authenticated/admin/content/")({
  component: DashboardPage,
});

function DashboardPage() {
  const fn = useServerFn(getContentDashboard);
  const { data, isLoading } = useQuery({
    queryKey: ["content-dashboard"],
    queryFn: () => fn(),
    staleTime: 30_000,
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <header>
        <h1 className="font-display text-2xl font-semibold">Content Dashboard</h1>
        <p className="text-sm text-muted-foreground">Manage every learn guide, glossary term, comparison, roadmap and support article across Glintr.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi icon={FileText} label="Total" value={data?.kpis.total ?? 0} tone="default" loading={isLoading} />
        <Kpi icon={Clock} label="Drafts" value={data?.kpis.drafts ?? 0} tone="warn" loading={isLoading} />
        <Kpi icon={CheckCircle2} label="Published" value={data?.kpis.published ?? 0} tone="good" loading={isLoading} />
        <Kpi icon={Calendar} label="Scheduled" value={data?.kpis.scheduled ?? 0} tone="info" loading={isLoading} />
        <Kpi icon={Eye} label="In Review" value={data?.kpis.review ?? 0} tone="warn" loading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-semibold">Recently updated</h2>
            <Link to="/admin/content/articles" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {(data?.recent ?? []).map((r: any) => (
              <Link
                key={r.id}
                to={"/admin/content/articles/$id" as any}
                params={{ id: r.id }}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-surface-2/50"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{r.title}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {CONTENT_TYPE_LABEL[r.type as string]} · {formatDistanceToNow(new Date(r.updated_at))} ago
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px] uppercase">{r.status}</Badge>
              </Link>
            ))}
            {!isLoading && !(data?.recent ?? []).length && (
              <div className="text-sm text-muted-foreground py-6 text-center">Nothing here yet — start with the AI Writer.</div>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-semibold flex items-center gap-2"><TrendingUp className="size-4" /> Top performing</h2>
          </div>
          <div className="space-y-2">
            {(data?.top ?? []).map((r: any) => (
              <div key={r.id} className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{r.title}</div>
                  <div className="text-[11px] text-muted-foreground">{CONTENT_TYPE_LABEL[r.type as string]}</div>
                </div>
                <div className="text-xs font-mono">{r.view_count?.toLocaleString() ?? 0}</div>
              </div>
            ))}
            {!isLoading && !(data?.top ?? []).length && (
              <div className="text-sm text-muted-foreground py-6 text-center">No published content yet.</div>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="font-display text-base font-semibold mb-4">Coverage by content type</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {Object.entries(data?.typeBreakdown ?? {}).map(([type, v]: any) => (
            <div key={type} className="rounded-lg border border-border/60 px-3 py-2.5">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{CONTENT_TYPE_LABEL[type] ?? type}</div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-lg font-semibold">{v.published}</span>
                <span className="text-xs text-muted-foreground">/ {v.total}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-display text-base font-semibold mb-4">Upcoming scheduled</h2>
        {(data?.upcoming ?? []).length ? (
          <div className="space-y-2">
            {(data?.upcoming ?? []).map((r: any) => (
              <Link key={r.id} to={"/admin/content/articles/$id" as any} params={{ id: r.id }} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-surface-2/50">
                <div className="text-sm">{r.title}</div>
                <div className="text-xs text-muted-foreground">
                  {r.scheduled_for ? new Date(r.scheduled_for).toLocaleString() : "—"}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground py-4">Nothing scheduled.</div>
        )}
      </Card>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, tone, loading }: any) {
  const toneClasses = {
    default: "text-foreground", good: "text-emerald-600", warn: "text-amber-600", info: "text-primary",
  }[tone as string] ?? "text-foreground";
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </div>
      <div className={`mt-1.5 text-2xl font-display font-semibold ${toneClasses}`}>
        {loading ? "—" : value?.toLocaleString() ?? 0}
      </div>
    </Card>
  );
}
