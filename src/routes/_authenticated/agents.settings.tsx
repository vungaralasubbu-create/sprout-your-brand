import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { listAgents, updateAgentSettings } from "@/lib/ai-team/team.functions";
import { AgentAvatar } from "@/components/ai-team/agent-visuals";
import { metaFor } from "@/lib/ai-team/agent-meta";

export const Route = createFileRoute("/_authenticated/agents/settings")({
  component: AgentSettings,
});

function AgentSettings() {
  const la = useServerFn(listAgents);
  const q = useQuery({ queryKey: ["agents"], queryFn: () => la({}) });
  const agents = q.data?.agents ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="text-xs font-semibold uppercase tracking-widest text-primary">Team settings</div>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Configure your AI team</h1>
      <p className="mt-1 text-sm text-muted-foreground">Enable or disable agents, tune temperature, and swap models. Prompt overrides require admin access.</p>

      <div className="mt-8 space-y-3">
        {q.isLoading && Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/40" />)}
        {agents.map((a: any) => <AgentRow key={a.slug} agent={a} />)}
      </div>
    </div>
  );
}

function AgentRow({ agent }: { agent: any }) {
  const qc = useQueryClient();
  const meta = metaFor(agent.slug);
  const [temp, setTemp] = useState<number>(Number(agent.temperature ?? 0.5));
  const [active, setActive] = useState<boolean>(agent.is_active);
  const [model, setModel] = useState<string>(agent.model_preference);

  const ua = useServerFn(updateAgentSettings);
  const mut = useMutation({
    mutationFn: () => ua({ data: { slug: agent.slug, is_active: active, temperature: temp, model_preference: model } }),
    onSuccess: () => {
      toast.success(`${agent.name} updated`);
      qc.invalidateQueries({ queryKey: ["agents"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Permission denied — admin only"),
  });

  const dirty = active !== agent.is_active || temp !== Number(agent.temperature ?? 0.5) || model !== agent.model_preference;

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex flex-wrap items-center gap-4">
        <AgentAvatar slug={agent.slug} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{meta.discipline}</span>
            {agent.is_active ? (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">Active</span>
            ) : (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">Disabled</span>
            )}
          </div>
          <div className="mt-0.5 font-semibold truncate">{agent.name}</div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-xs">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 rounded" />
            <span>Enabled</span>
          </label>

          <div>
            <label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Temperature</label>
            <div className="flex items-center gap-2">
              <input
                type="range" min={0} max={2} step={0.1}
                value={temp} onChange={(e) => setTemp(Number(e.target.value))}
                className="w-32"
              />
              <span className="w-8 text-xs font-mono">{temp.toFixed(1)}</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="block w-48 rounded-lg border bg-background px-2 py-1 text-xs outline-none focus:border-primary"
            >
              <option value="google/gemini-3.5-flash">Gemini 3.5 Flash</option>
              <option value="google/gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
              <option value="openai/gpt-5.5">GPT-5.5</option>
              <option value="openai/gpt-5.4-mini">GPT-5.4 Mini</option>
              <option value="google/gemini-2.5-flash">Gemini 2.5 Flash</option>
            </select>
          </div>

          <Button size="sm" onClick={() => mut.mutate()} disabled={!dirty || mut.isPending}>
            {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-1 h-4 w-4" /> Save</>}
          </Button>
        </div>
      </div>
      <p className={cn("mt-2 line-clamp-2 text-xs text-muted-foreground", !dirty && "opacity-70")}>{agent.description}</p>
    </div>
  );
}
