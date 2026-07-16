import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Bot, Database, MessagesSquare, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { AGENTS } from "@/lib/aios/agents";
import { useConversations, useFeedback, usePrompts } from "@/lib/aios/storage";

export const Route = createFileRoute("/_authenticated/admin/aios/")({
  component: AiosDashboard,
});

function Stat({ label, value, hint, icon: Icon }: { label: string; value: string; hint?: string; icon: any }) {
  return (
    <div className="rounded-lg border border-border/60 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function AiosDashboard() {
  const { items: convos } = useConversations();
  const { items: prompts } = usePrompts();
  const { items: feedback } = useFeedback();
  const helpful = feedback.filter((f) => f.rating === "helpful").length;
  const helpfulRatio = feedback.length ? Math.round((helpful / feedback.length) * 100) : null;
  const messagesToday = convos.reduce((acc, c) => acc + c.messages.filter((m) => Date.now() - m.at < 86400000).length, 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-primary flex items-center gap-1.5">
          <Sparkles className="size-3" /> AI Operating System
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Glintr AIOS</h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
          One centralized intelligence layer powering every AI experience across Glintr. Ten specialized agents share the same
          knowledge base, prompt library and guardrails.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="AI Agents" value={String(AGENTS.length)} hint="Specialized roles" icon={Bot} />
        <Stat label="Prompt Library" value={String(prompts.length)} hint="Reusable templates" icon={Sparkles} />
        <Stat label="Conversations" value={String(convos.length)} hint={`${messagesToday} messages today`} icon={MessagesSquare} />
        <Stat label="Helpful ratio" value={helpfulRatio === null ? "—" : `${helpfulRatio}%`} hint={`${feedback.length} ratings`} icon={ShieldCheck} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border border-border/60 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Agents</h2>
            <Link to="/admin/aios/agents" className="text-xs text-primary hover:underline">Open agents →</Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {AGENTS.map((a) => {
              const Icon = a.icon;
              return (
                <Link
                  key={a.id}
                  to="/admin/aios/agents"
                  search={{ agent: a.id } as any}
                  className="flex items-start gap-3 rounded-md border border-border/60 p-3 hover:border-primary/40 hover:bg-primary/5 transition"
                >
                  <span className="rounded-md p-2" style={{ background: `color-mix(in oklch, ${a.color} 15%, white)` }}>
                    <Icon className="size-4" style={{ color: a.color }} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{a.name}</p>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{a.tagline}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border/60 bg-white p-5">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><Activity className="size-4" /> Model status</h2>
            <div className="space-y-2 text-[12px]">
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Primary model</span><span className="font-mono">google/gemini-2.5-flash</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Gateway</span><span className="text-emerald-600 font-medium">Healthy</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Median response</span><span>~1.2s</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Guardrails</span><span className="text-emerald-600 font-medium">Active</span></div>
            </div>
          </div>
          <div className="rounded-lg border border-border/60 bg-white p-5">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><Database className="size-4" /> Knowledge</h2>
            <ul className="space-y-1 text-[12px] text-muted-foreground">
              <li>• Programs</li><li>• Learn Guides</li><li>• Glossary</li><li>• Blogs</li><li>• Roadmaps</li><li>• Knowledge Graph</li><li>• Policies & Docs</li>
            </ul>
            <Link to="/admin/aios/knowledge" className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"><Zap className="size-3" /> Manage sources</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
