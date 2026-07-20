import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listGenerationJobs,
  listGenerationProviders,
  getGenerationUsage,
} from "@/lib/generation-engine/engine.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, CheckCircle2, XCircle, Clock, Cpu, Zap,
  Image as ImageIcon, FileText, Video, Mic, FileCode2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/marketing-os/generation-engine")({
  component: EngineDashboard,
});

const CATEGORY_ICON: Record<string, typeof Sparkles> = {
  text: FileText, image: ImageIcon, video: Video, audio: Mic, document: FileCode2, presentation: FileCode2,
};

function EngineDashboard() {
  const jobsFn = useServerFn(listGenerationJobs);
  const providersFn = useServerFn(listGenerationProviders);
  const usageFn = useServerFn(getGenerationUsage);

  const { data: jobsData } = useQuery({ queryKey: ["engine-jobs"], queryFn: () => jobsFn({ data: { limit: 50 } }) });
  const { data: providersData } = useQuery({ queryKey: ["engine-providers"], queryFn: () => providersFn() });
  const { data: usageData } = useQuery({ queryKey: ["engine-usage"], queryFn: () => usageFn({ data: {} }) });

  const jobs = jobsData?.jobs ?? [];
  const providers = providersData?.providers ?? [];
  const usage = usageData?.usage ?? [];

  const stats = useMemo(() => {
    const total = jobs.length;
    const done = jobs.filter((j: { status: string }) => j.status === "completed").length;
    const failed = jobs.filter((j: { status: string }) => j.status === "failed").length;
    const running = jobs.filter((j: { status: string }) => ["queued","preparing","generating","retrying"].includes(j.status)).length;
    const successRate = total ? Math.round((done / total) * 100) : 100;
    const credits = usage.reduce((sum: number, u) => sum + Number(u.credits_used ?? 0), 0);
    const cents = usage.reduce((sum: number, u) => sum + Number(u.estimated_cost_cents ?? 0), 0);
    return { total, done, failed, running, successRate, credits, cost: (cents / 100).toFixed(2) };
  }, [jobs, usage]);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-primary">Universal AI Infrastructure</div>
        <h1 className="text-2xl font-semibold tracking-tight">Generation Engine</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          The single gateway for every AI generation across Glintr. Every module routes through this engine → AI Router → provider adapter. No module calls providers directly.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Jobs" value={stats.total} icon={Sparkles} />
        <Kpi label="Success rate" value={`${stats.successRate}%`} icon={CheckCircle2} tone="text-emerald-600" />
        <Kpi label="Running" value={stats.running} icon={Clock} tone="text-amber-600" />
        <Kpi label="Credits · $" value={`${stats.credits} · $${stats.cost}`} icon={Zap} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Recent Jobs</h3>
            <span className="text-xs text-muted-foreground">{jobs.length} total</span>
          </div>
          {jobs.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No generations yet.</div>
          ) : (
            <div className="divide-y divide-border/60 -mx-2">
              {jobs.slice(0, 12).map((j: { id: string; content_type: string; status: string; prompt: string | null; chosen_provider: string | null; created_at: string }) => (
                <Link
                  key={j.id}
                  to={"/admin/marketing-os/generation-engine/$id" as unknown as "/admin/marketing-os/generation-engine"}
                  params={{ id: j.id } as never}
                  className="flex items-center gap-3 px-2 py-2.5 hover:bg-muted/30 rounded-lg transition-colors"
                >
                  <StatusIcon status={j.status} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{j.prompt ?? "(no prompt)"}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {j.content_type} · {j.chosen_provider ?? "—"} · {new Date(j.created_at).toLocaleString()}
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize text-[10px]">{j.status}</Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Providers</h3>
            <Cpu className="size-4 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            {providers.map((p: { provider_key: string; display_name: string; category: string; enabled: boolean; health_status: string }) => {
              const Icon = CATEGORY_ICON[p.category] ?? Sparkles;
              return (
                <div key={p.provider_key} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30">
                  <div className="size-7 rounded bg-muted grid place-items-center shrink-0">
                    <Icon className="size-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{p.display_name}</div>
                    <div className="text-[11px] text-muted-foreground capitalize">{p.category}</div>
                  </div>
                  <span className={cn(
                    "size-2 rounded-full",
                    p.enabled && p.health_status === "healthy" ? "bg-emerald-500" :
                    p.enabled && p.health_status === "degraded" ? "bg-amber-500" :
                    p.enabled && p.health_status === "down" ? "bg-red-500" : "bg-neutral-300",
                  )} />
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: typeof Sparkles; tone?: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
        <div className="size-8 rounded-lg bg-muted grid place-items-center"><Icon className="size-4" /></div>
      </div>
      <div className={cn("mt-3 text-2xl font-semibold tracking-tight", tone)}>{value}</div>
    </Card>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "completed") return <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />;
  if (status === "failed" || status === "cancelled") return <XCircle className="size-4 text-red-500 shrink-0" />;
  return <Clock className="size-4 text-amber-500 shrink-0" />;
}
