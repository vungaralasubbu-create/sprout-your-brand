import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, XCircle, Activity, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { listAgentRuns, listAgents } from "@/lib/ai-team/team.functions";
import { AgentAvatar } from "@/components/ai-team/agent-visuals";
import { metaFor } from "@/lib/ai-team/agent-meta";

export const Route = createFileRoute("/_authenticated/agents/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const [filter, setFilter] = useState<string>("");
  const la = useServerFn(listAgents);
  const lr = useServerFn(listAgentRuns);
  const agentsQ = useQuery({ queryKey: ["agents"], queryFn: () => la({}) });
  const runsQ = useQuery({
    queryKey: ["agent-runs", filter],
    queryFn: () => lr({ data: { slug: filter || undefined, limit: 120 } }),
  });
  const agents = agentsQ.data?.agents ?? [];
  const runs = runsQ.data?.runs ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="text-xs font-semibold uppercase tracking-widest text-primary">Observability</div>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Agent execution history</h1>
      <p className="mt-1 text-sm text-muted-foreground">Every AI agent invocation across your workspace.</p>

      {/* Filter chips */}
      <div className="mt-6 flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter("")}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition",
            !filter ? "bg-primary text-primary-foreground" : "border text-muted-foreground hover:bg-muted",
          )}
        >All agents</button>
        {agents.map((a: any) => (
          <button
            key={a.slug}
            onClick={() => setFilter(a.slug)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition",
              filter === a.slug ? "bg-primary text-primary-foreground" : "border text-muted-foreground hover:bg-muted",
            )}
          >
            <AgentAvatar slug={a.slug} size={18} />
            {metaFor(a.slug).short}
          </button>
        ))}
      </div>

      {/* Runs table */}
      <div className="mt-6 overflow-hidden rounded-2xl border bg-card">
        {runsQ.isLoading ? (
          <div className="h-40 animate-pulse bg-muted/40" />
        ) : runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Activity className="h-10 w-10 text-muted-foreground/40" />
            <div className="mt-3 font-medium">No runs yet</div>
            <p className="mt-1 text-sm text-muted-foreground">Agent invocations will appear here as you use the AI team.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="p-4">Agent</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Model</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Tokens</th>
                  <th className="p-4">Retries</th>
                  <th className="p-4">When</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {runs.map((r: any) => (
                  <tr key={r.id} className="hover:bg-muted/20">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <AgentAvatar slug={r.agent_slug} size={24} />
                        <span className="font-medium">{metaFor(r.agent_slug).short}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase",
                        r.status === "success" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600",
                      )}>
                        {r.status === "success" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">{r.model}</td>
                    <td className="p-4"><span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{((r.duration_ms ?? 0) / 1000).toFixed(2)}s</span></td>
                    <td className="p-4 text-muted-foreground">{r.total_tokens ?? "—"}</td>
                    <td className="p-4 text-muted-foreground">{r.retry_count}</td>
                    <td className="p-4 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
