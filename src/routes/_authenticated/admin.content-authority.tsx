import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAuthorityDashboard } from "@/lib/admin/content-authority.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertCircle, Clock, FileWarning, TrendingUp, TrendingDown, BookOpen } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/content-authority")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Content Authority · Glintr Admin" },
      { name: "description", content: "Editor dashboard for content authority, citations, and freshness." },
    ],
  }),
});

function scoreBadge(n: number) {
  const cls = n >= 85 ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : n >= 65 ? "bg-amber-100 text-amber-700 border-amber-200"
    : "bg-red-100 text-red-700 border-red-200";
  return <Badge variant="outline" className={cls}>{n}</Badge>;
}

function DashboardPage() {
  const get = useServerFn(getAuthorityDashboard);
  const { data, isLoading } = useQuery({
    queryKey: ["authority-dashboard"],
    queryFn: () => get({ data: undefined as any }),
  });

  if (isLoading || !data) return <div className="p-6 text-sm text-muted-foreground">Loading dashboard…</div>;

  const stats = [
    { label: "Analyzed", value: data.totals.analyzed, icon: ShieldCheck, color: "text-primary" },
    { label: "Need updates", value: data.totals.needs_updates, icon: Clock, color: "text-amber-600" },
    { label: "Low authority", value: data.totals.low_authority, icon: TrendingDown, color: "text-red-600" },
    { label: "Missing citations", value: data.totals.missing_citations, icon: FileWarning, color: "text-amber-600" },
    { label: "Outdated info", value: data.totals.outdated, icon: AlertCircle, color: "text-red-600" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <header>
        <h1 className="text-2xl font-semibold font-display flex items-center gap-2">
          <ShieldCheck className="size-6 text-primary" /> Content Authority
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Freshness, trust, citations, and quality across published content.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center justify-between">
              <s.icon className={`size-5 ${s.color}`} />
              <div className="text-2xl font-semibold">{s.value}</div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ListSection title="Content needing updates" icon={Clock} rows={data.needs_updates} metric="freshness_score" />
        <ListSection title="Low authority pages" icon={TrendingDown} rows={data.low_authority} metric="overall_score" />
        <ListSection title="Missing citations" icon={FileWarning} rows={data.missing_citations} metric="needs_citation_count" suffix=" claims" />
        <ListSection title="Pages with outdated info" icon={AlertCircle} rows={data.outdated} metric="freshness_score" />
        <ListSection title="Most trusted pages" icon={TrendingUp} rows={data.most_trusted} metric="overall_score" />
        <ListSection title="Lowest quality pages" icon={BookOpen} rows={data.lowest_quality} metric="overall_score" />
      </div>
    </div>
  );
}

function ListSection({ title, icon: Icon, rows, metric, suffix }: { title: string; icon: any; rows: any[]; metric: string; suffix?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="size-4 text-muted-foreground" />
        <div className="font-medium text-sm">{title}</div>
        <Badge variant="outline" className="ml-auto text-xs">{rows.length}</Badge>
      </div>
      <div className="space-y-1.5 max-h-96 overflow-y-auto">
        {rows.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-6">Nothing to show.</div>
        ) : rows.map((r: any) => (
          <div key={`${r.content_type}:${r.content_id}`} className="flex items-center justify-between gap-2 border rounded p-2 hover:bg-muted/40 text-xs">
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{r.title}</div>
              <div className="text-[10px] text-muted-foreground capitalize">{r.content_type} · {r.workflow_status?.replace(/_/g, " ") ?? "draft"}</div>
            </div>
            {metric === "needs_citation_count"
              ? <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">{r[metric]}{suffix ?? ""}</Badge>
              : scoreBadge(r[metric] ?? 0)}
            {r.content_type === "blog" && r.content_id ? (
              <Link to={`/admin/blogs/${r.content_id}` as any} className="text-primary hover:underline text-[11px]">Open</Link>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  );
}
