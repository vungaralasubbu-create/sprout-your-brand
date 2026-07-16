import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Play, Sparkles } from "lucide-react";
import { AGENTS } from "@/lib/aios/agents";
import { suggestAgent } from "@/lib/aios/marketplace";
import { runOrchestrator } from "@/lib/aios/orchestrator.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/ai-agents/orchestrator")({
  component: OrchestratorPage,
});

function OrchestratorPage() {
  const [q, setQ] = useState("");
  const [path, setPath] = useState("/");
  const [selected, setSelected] = useState<string[]>(["career-coach", "learning-mentor"]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof runOrchestrator>> | null>(null);
  const run = useServerFn(runOrchestrator);

  const suggested = suggestAgent(q || "", path);

  const toggle = (id: string) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id].slice(0, 4));

  const submit = async () => {
    if (!q.trim() || selected.length === 0 || busy) return;
    setBusy(true); setResult(null);
    try {
      const out = await run({ data: { agentIds: selected, messages: [{ role: "user", content: q }] } });
      setResult(out);
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-primary flex items-center gap-1.5"><Sparkles className="size-3" /> Orchestrator</p>
        <h1 className="mt-1 text-2xl font-semibold">Multi-agent orchestrator</h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">Route a question to the best agent, or run multiple agents in parallel and get a combined answer.</p>
      </div>

      <div className="rounded-lg border border-border/60 bg-white p-4 space-y-3">
        <textarea value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask a question. The orchestrator will suggest the best agent based on your text and current path." className="w-full min-h-[80px] rounded border border-border/60 px-3 py-2 text-sm" />
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-muted-foreground">Current page:</label>
          <input value={path} onChange={(e) => setPath(e.target.value)} className="rounded border border-border/60 px-2 py-1 text-[12px] font-mono" />
          <span className="text-[11px] text-muted-foreground ml-2">Auto-route suggests <strong className="text-foreground">{suggested}</strong></span>
          <button type="button" onClick={() => { if (!selected.includes(suggested)) setSelected([suggested, ...selected].slice(0, 4)); }} className="text-[11px] text-primary hover:underline">Add suggested</button>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Agents in run ({selected.length}/4)</p>
          <div className="flex flex-wrap gap-1.5">
            {AGENTS.map((a) => (
              <button key={a.id} type="button" onClick={() => toggle(a.id)} className={cn("rounded-full border px-3 py-1 text-[11px]", selected.includes(a.id) ? "bg-foreground text-background border-foreground" : "border-border/60 text-muted-foreground hover:bg-muted")}>{a.name}</button>
            ))}
          </div>
        </div>
        <button type="button" onClick={submit} disabled={busy || !q.trim() || selected.length === 0} className="inline-flex items-center gap-1 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-40">
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />} Run orchestrator
        </button>
      </div>

      {result && (
        <div className="space-y-3">
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">Combined summary</p>
            <div className="prose prose-sm max-w-none"><ReactMarkdown>{result.summary}</ReactMarkdown></div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {result.contributions.map((c) => (
              <div key={c.agentId} className="rounded-lg border border-border/60 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">{c.agentName}</p>
                <div className="prose prose-sm max-w-none"><ReactMarkdown>{c.text}</ReactMarkdown></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
