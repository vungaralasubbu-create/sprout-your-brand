import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AGENTS } from "@/lib/aios/agents";
import { getAgentMeta, useAgentInstall } from "@/lib/aios/marketplace";
import { Pin, Star, CheckCircle2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/ai-agents/")({
  component: AdminMarketplace,
});

function AdminMarketplace() {
  const { state, toggleEnabled, togglePinned, toggleFavorite, setDefault } = useAgentInstall();
  const [q, setQ] = useState("");
  const filtered = AGENTS.filter((a) => !q || (a.name + " " + a.tagline).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Agent Marketplace</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage which agents are enabled and set organization defaults.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search agents…" className="w-full rounded-full border border-border/60 bg-white pl-8 pr-3 py-2 text-sm" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((a) => {
          const meta = getAgentMeta(a.id);
          const Icon = a.icon;
          const enabled = state.enabled.includes(a.id);
          const pinned = state.pinned.includes(a.id);
          const fav = state.favorites.includes(a.id);
          const isDefault = state.defaultAgent === a.id;
          return (
            <div key={a.id} className="rounded-lg border border-border/60 bg-white p-4">
              <div className="flex items-start gap-3">
                <span className="rounded-md p-2" style={{ background: `color-mix(in oklch, ${a.color} 15%, white)` }}>
                  <Icon className="size-4" style={{ color: a.color }} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">{a.name}</p>
                    {enabled && <CheckCircle2 className="size-3.5 text-emerald-600" />}
                    {isDefault && <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px]">Default</span>}
                  </div>
                  <p className="text-[12px] text-muted-foreground line-clamp-1">{a.tagline}</p>
                  <p className="text-[10px] font-mono text-muted-foreground/80 mt-0.5">{meta?.department} · v{meta?.version}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => togglePinned(a.id)} className={cn("rounded-full border p-1", pinned ? "border-primary text-primary" : "border-border/60 text-muted-foreground")}><Pin className="size-3" /></button>
                  <button type="button" onClick={() => toggleFavorite(a.id)} className={cn("rounded-full border p-1", fav ? "border-amber-500 text-amber-500" : "border-border/60 text-muted-foreground")}><Star className={cn("size-3", fav && "fill-amber-500")} /></button>
                  <button type="button" onClick={() => setDefault(a.id)} className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground">Set default</button>
                </div>
                <div className="flex items-center gap-2">
                  <Link to="/ai-agents/$id" params={{ id: a.id }} className="text-[11px] text-primary hover:underline">Profile</Link>
                  <button type="button" onClick={() => toggleEnabled(a.id)} className={cn("rounded-full px-3 py-1 text-[11px] font-semibold", enabled ? "bg-emerald-100 text-emerald-800" : "bg-foreground text-background")}>{enabled ? "Enabled" : "Enable"}</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
