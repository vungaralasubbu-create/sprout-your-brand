import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { metaFor } from "@/lib/ai-team/agent-meta";

export function AgentAvatar({ slug, size = 40, ring = false }: { slug: string; size?: number; ring?: boolean }) {
  const meta = metaFor(slug);
  const Icon = meta.icon;
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-inner",
        meta.gradient,
        ring && `ring-2 ${meta.ring}`,
      )}
      style={{ width: size, height: size }}
    >
      <Icon className="text-foreground/80" style={{ width: size * 0.5, height: size * 0.5 }} />
    </div>
  );
}

export function AgentCard({ agent }: { agent: any }) {
  const meta = metaFor(agent.slug);
  return (
    <Link
      to="/agents/$agent"
      params={{ agent: agent.slug }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/5",
        !agent.is_active && "opacity-50",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <AgentAvatar slug={agent.slug} size={48} />
        <span className={cn(
          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
          agent.is_active ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground",
        )}>{agent.is_active ? "Active" : "Off"}</span>
      </div>
      <div className="mt-4">
        <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{meta.discipline}</div>
        <div className="mt-0.5 font-semibold">{agent.name}</div>
        <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{agent.description}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-1">
        {(agent.tags ?? []).slice(0, 2).map((t: string) => (
          <span key={t} className="rounded-full border bg-muted/40 px-2 py-0.5 text-[10px] capitalize text-muted-foreground">{t}</span>
        ))}
      </div>
    </Link>
  );
}
