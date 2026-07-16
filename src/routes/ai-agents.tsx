import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Sparkles, Star, Pin, CheckCircle2, Filter } from "lucide-react";
import { AGENTS } from "@/lib/aios/agents";
import { getAgentMeta, useAgentInstall } from "@/lib/aios/marketplace";
import { buildPageHead } from "@/lib/seo-head";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ai-agents")({
  head: () =>
    buildPageHead({
      title: "AI Agents Marketplace — Glintr",
      description: "Enterprise-grade AI agents for learning, career, sales, marketing, content, support and analytics. All powered by Glintr AIOS.",
      path: "/ai-agents",
    }),
  component: MarketplacePage,
});

const DEPTS = ["All", "Learning", "Career", "Sales", "Marketing", "Content", "Support", "Operations", "Analytics"] as const;

function MarketplacePage() {
  const [q, setQ] = useState("");
  const [dept, setDept] = useState<(typeof DEPTS)[number]>("All");
  const { state, toggleFavorite, togglePinned } = useAgentInstall();

  const items = useMemo(() => {
    return AGENTS.map((a) => ({ a, m: getAgentMeta(a.id) })).filter(({ a, m }) => {
      if (dept !== "All" && m?.department !== dept) return false;
      if (!q.trim()) return true;
      const s = (a.name + " " + a.tagline + " " + a.knowledge.join(" ") + " " + (m?.capabilities.join(" ") ?? "") + " " + (m?.tools.join(" ") ?? "") + " " + (m?.languages.join(" ") ?? "")).toLowerCase();
      return s.includes(q.toLowerCase());
    });
  }, [q, dept]);

  const featured = items.filter(({ m }) => m?.featured);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-primary flex items-center gap-1.5"><Sparkles className="size-3" /> AI Agents Marketplace</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Every department has an AI specialist</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">One centralized intelligence layer, twelve role-specialized assistants. Enable the ones you need, pin the ones you use daily.</p>
      </div>

      <div className="rounded-xl border border-border/60 bg-white/70 backdrop-blur p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search agents, capabilities, tools, languages…" className="w-full rounded-full border border-border/60 bg-white pl-9 pr-4 py-2 text-sm" />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter className="size-3.5 text-muted-foreground shrink-0" />
          {DEPTS.map((d) => (
            <button key={d} type="button" onClick={() => setDept(d)} className={cn("rounded-full border px-3 py-1 text-xs whitespace-nowrap", dept === d ? "bg-foreground text-background border-foreground" : "border-border/60 text-muted-foreground hover:bg-muted")}>{d}</button>
          ))}
        </div>
      </div>

      {featured.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Featured</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featured.slice(0, 6).map(({ a, m }) => (
              <AgentCard
                key={a.id}
                agent={a}
                meta={m!}
                enabled={state.enabled.includes(a.id)}
                pinned={state.pinned.includes(a.id)}
                favorite={state.favorites.includes(a.id)}
                onPin={() => togglePinned(a.id)}
                onFav={() => toggleFavorite(a.id)}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">All agents ({items.length})</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map(({ a, m }) => (
            <AgentCard
              key={a.id}
              agent={a}
              meta={m!}
              enabled={state.enabled.includes(a.id)}
              pinned={state.pinned.includes(a.id)}
              favorite={state.favorites.includes(a.id)}
              onPin={() => togglePinned(a.id)}
              onFav={() => toggleFavorite(a.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function AgentCard({ agent, meta, enabled, pinned, favorite, onPin, onFav }: any) {
  const Icon = agent.icon;
  return (
    <div className="group rounded-xl border border-border/60 bg-white p-4 hover:border-primary/40 hover:shadow-sm transition flex flex-col">
      <div className="flex items-start gap-3">
        <span className="rounded-lg p-2.5" style={{ background: `color-mix(in oklch, ${agent.color} 15%, white)` }}>
          <Icon className="size-5" style={{ color: agent.color }} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold truncate">{agent.name}</p>
            {enabled && <CheckCircle2 className="size-3.5 text-emerald-600" aria-label="Enabled" />}
          </div>
          <p className="text-[12px] text-muted-foreground line-clamp-2">{agent.tagline}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button type="button" onClick={onPin} className={cn("rounded-full p-1", pinned ? "text-primary" : "text-muted-foreground hover:text-foreground")} title={pinned ? "Unpin" : "Pin"}><Pin className="size-3.5" /></button>
          <button type="button" onClick={onFav} className={cn("rounded-full p-1", favorite ? "text-amber-500" : "text-muted-foreground hover:text-foreground")} title="Favorite"><Star className={cn("size-3.5", favorite && "fill-amber-500")} /></button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {meta.capabilities.slice(0, 4).map((c: string) => (
          <span key={c} className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground">{c}</span>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
        <div><span className="uppercase tracking-wide">Tools</span><p className="mt-0.5 line-clamp-1 text-foreground/70">{meta.tools.join(" · ")}</p></div>
        <div><span className="uppercase tracking-wide">Languages</span><p className="mt-0.5 line-clamp-1 text-foreground/70">{meta.languages.join(", ")}</p></div>
      </div>
      <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>v{meta.version} · {meta.updatedAt}</span>
        <Link to="/ai-agents/$id" params={{ id: agent.id }} className="text-primary hover:underline text-[11px]">Open profile →</Link>
      </div>
    </div>
  );
}
