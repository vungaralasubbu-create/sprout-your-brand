import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Pin, Star, Sparkles, BookOpen, Wrench, Globe, ShieldCheck } from "lucide-react";
import { getAgent } from "@/lib/aios/agents";
import { getAgentMeta, useAgentInstall } from "@/lib/aios/marketplace";
import { buildPageHead } from "@/lib/seo-head";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ai-agents/$id")({
  loader: ({ params }) => {
    const agent = getAgent(params.id);
    if (!agent) throw notFound();
    return { agent };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Agent — Glintr" }, { name: "robots", content: "noindex" }] };
    return buildPageHead({
      title: `${loaderData.agent.name} — Glintr AI Agents`,
      description: loaderData.agent.tagline,
      path: `/ai-agents/${loaderData.agent.id}`,
    });
  },
  component: AgentProfile,
  notFoundComponent: () => <p className="p-10 text-center text-sm text-muted-foreground">Agent not found.</p>,
});

function AgentProfile() {
  const { agent } = Route.useLoaderData();
  const meta = getAgentMeta(agent.id);
  const { state, toggleEnabled, togglePinned, toggleFavorite, setDefault } = useAgentInstall();
  const Icon = agent.icon;
  const enabled = state.enabled.includes(agent.id);
  const pinned = state.pinned.includes(agent.id);
  const favorite = state.favorites.includes(agent.id);
  const isDefault = state.defaultAgent === agent.id;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
      <Link to="/ai-agents" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" /> Back to marketplace</Link>

      <header className="flex items-start gap-4 rounded-xl border border-border/60 bg-white p-6">
        <span className="rounded-xl p-3" style={{ background: `color-mix(in oklch, ${agent.color} 15%, white)` }}>
          <Icon className="size-7" style={{ color: agent.color }} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-primary flex items-center gap-1.5"><Sparkles className="size-3" /> Glintr AI Agent</p>
          <h1 className="mt-1 text-2xl font-semibold">{agent.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{agent.tagline}</p>
          {meta && <p className="mt-1 text-[11px] text-muted-foreground/80 font-mono">v{meta.version} · Updated {meta.updatedAt} · {meta.department}</p>}
        </div>
        <div className="flex flex-col gap-2 items-end">
          <button type="button" onClick={() => toggleEnabled(agent.id)} className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold", enabled ? "bg-emerald-100 text-emerald-800" : "bg-foreground text-background")}>
            {enabled ? <><CheckCircle2 className="size-3.5" /> Enabled</> : "Enable"}
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => togglePinned(agent.id)} className={cn("rounded-full border p-1.5", pinned ? "border-primary text-primary" : "border-border/60 text-muted-foreground")} title={pinned ? "Unpin" : "Pin"}><Pin className="size-3.5" /></button>
            <button type="button" onClick={() => toggleFavorite(agent.id)} className={cn("rounded-full border p-1.5", favorite ? "border-amber-500 text-amber-500" : "border-border/60 text-muted-foreground")} title="Favorite"><Star className={cn("size-3.5", favorite && "fill-amber-500")} /></button>
            <button type="button" onClick={() => setDefault(agent.id)} className={cn("rounded-full border px-3 py-1 text-[11px]", isDefault ? "border-primary text-primary bg-primary/10" : "border-border/60 text-muted-foreground")}>{isDefault ? "Default" : "Set default"}</button>
          </div>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="md:col-span-2 space-y-4">
          <Panel title="Overview">
            <p className="text-sm text-muted-foreground">{agent.tagline} Uses only Glintr's approved knowledge and never fabricates policies, guarantees or partnerships.</p>
          </Panel>
          <Panel title="Capabilities">
            <ul className="grid gap-1.5 sm:grid-cols-2 text-sm">
              {(meta?.capabilities ?? []).map((c) => (<li key={c} className="rounded-md border border-border/60 px-2.5 py-1.5 text-[12px]">{c}</li>))}
            </ul>
          </Panel>
          <Panel title="Responsibilities">
            <ul className="grid gap-1 text-sm text-muted-foreground list-disc pl-4">
              {agent.responsibilities.map((r) => (<li key={r}>{r}</li>))}
            </ul>
          </Panel>
          <Panel title="Example questions">
            <div className="flex flex-wrap gap-2">
              {agent.starters.map((s) => (
                <span key={s} className="rounded-full border border-border/60 px-3 py-1 text-[11px] text-muted-foreground">{s}</span>
              ))}
            </div>
          </Panel>
          <Panel title="Recent updates">
            <ul className="space-y-1 text-[12px] text-muted-foreground">
              <li>• {meta?.updatedAt ?? "—"}: Guardrails refresh + prompt template versioning.</li>
              <li>• 2026-06-15: Added new starter prompts and shared knowledge integration.</li>
              <li>• 2026-05-01: Launched under Glintr AIOS.</li>
            </ul>
          </Panel>
        </section>

        <aside className="space-y-4">
          <Panel title="Knowledge sources" icon={BookOpen}>
            <ul className="space-y-1 text-[12px]">
              {agent.knowledge.map((k) => (<li key={k} className="rounded-md bg-muted/50 px-2 py-1">{k}</li>))}
            </ul>
          </Panel>
          <Panel title="Tools" icon={Wrench}>
            <ul className="space-y-1 text-[12px]">
              {(meta?.tools ?? []).map((t) => (<li key={t} className="rounded-md bg-muted/50 px-2 py-1">{t}</li>))}
            </ul>
          </Panel>
          <Panel title="Languages" icon={Globe}>
            <p className="text-[12px] text-muted-foreground">{(meta?.languages ?? ["English"]).join(", ")}</p>
          </Panel>
          <Panel title="Permissions" icon={ShieldCheck}>
            <p className="text-[12px] text-muted-foreground capitalize">Recommended for: {agent.audience.join(", ")}</p>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon?: any; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-white p-4">
      <h2 className="text-sm font-semibold mb-2 flex items-center gap-1.5">{Icon && <Icon className="size-4 text-muted-foreground" />} {title}</h2>
      {children}
    </div>
  );
}
