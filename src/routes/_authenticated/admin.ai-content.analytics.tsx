import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAiFactoryDashboard } from "@/lib/admin/ai-content.functions";
import { Card } from "@/components/ui/card";
import { BarChart3, TrendingUp, CheckCircle2, Clock, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/ai-content/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const fn = useServerFn(getAiFactoryDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["ai-factory-dashboard"], queryFn: () => fn(), staleTime: 30_000 });
  const k: any = data?.kpis ?? {};

  return (
    <div className="space-y-6 max-w-7xl">
      <header>
        <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
          <BarChart3 className="size-5 text-primary" /> Analytics
        </h1>
        <p className="text-sm text-muted-foreground">Editorial throughput, quality signals, and publishing velocity across the AI Content Engine.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric icon={Sparkles} label="Articles Generated" value={isLoading ? "…" : (k.aiGenerated ?? 0)} />
        <Metric icon={CheckCircle2} label="Published" value={isLoading ? "…" : (k.published ?? 0)} />
        <Metric icon={Clock} label="Pending Review" value={isLoading ? "…" : (k.pendingReview ?? 0)} />
        <Metric icon={TrendingUp} label="Quality Score" value={isLoading ? "…" : `${k.qualityScore ?? 0}/100`} />
      </div>

      <Card className="p-6">
        <h2 className="font-display text-base font-semibold mb-4">Quality signals</h2>
        <div className="space-y-4">
          {[
            { label: "SEO Score", value: k.seoScore ?? 0 },
            { label: "Internal Linking", value: k.linkScore ?? 0 },
            { label: "Overall Quality", value: k.qualityScore ?? 0 },
          ].map((row) => (
            <div key={row.label}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-mono font-semibold">{row.value}/100</span>
              </div>
              <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${row.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-base font-semibold mb-1">Publishing velocity</h2>
        <p className="text-sm text-muted-foreground">Deep charts (throughput by week, average review time, top authors, top-performing topics) roll out in Phase 2.</p>
      </Card>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </div>
      <div className="text-2xl font-display font-semibold mt-1.5">{value}</div>
    </Card>
  );
}
