import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Sparkles, ArrowRight, Loader2, Send, History, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { listAgents, runTeamProject } from "@/lib/ai-team/team.functions";
import { AgentCard, AgentAvatar } from "@/components/ai-team/agent-visuals";
import { AGENT_META } from "@/lib/ai-team/agent-meta";

export const Route = createFileRoute("/_authenticated/agents/")({
  component: AgentsHome,
});

const AGENT_ORDER = [
  "ceo","marketing-strategist","content-writer","creative-director","video-producer",
  "seo-specialist","ads-manager","email-specialist","crm-specialist","automation-engineer",
  "analytics-specialist","design-qa",
];

const EXECUTION_STEPS = [
  { agents: ["ceo"], label: "Understanding your goal" },
  { agents: ["marketing-strategist"], label: "Building strategy" },
  { agents: ["content-writer","seo-specialist"], label: "Writing content" },
  { agents: ["creative-director"], label: "Directing visuals" },
  { agents: ["video-producer"], label: "Producing video plan" },
  { agents: ["ads-manager"], label: "Planning paid media" },
  { agents: ["email-specialist"], label: "Designing email funnel" },
  { agents: ["automation-engineer"], label: "Wiring automation" },
  { agents: ["analytics-specialist"], label: "Setting up analytics" },
  { agents: ["ceo","design-qa"], label: "Final review & delivery" },
];

function AgentsHome() {
  const [prompt, setPrompt] = useState("");
  const navigate = useNavigate();
  const la = useServerFn(listAgents);
  const rt = useServerFn(runTeamProject);

  const q = useQuery({ queryKey: ["agents"], queryFn: () => la({}) });
  const agents = q.data?.agents ?? [];
  const bySlug = new Map(agents.map((a: any) => [a.slug, a]));
  const ordered = AGENT_ORDER.map((s) => bySlug.get(s)).filter(Boolean) as any[];

  const runMut = useMutation({
    mutationFn: () => rt({ data: { prompt } }),
    onSuccess: (r) => {
      toast.success("Your AI team is on it");
      navigate({ to: "/workspace/project/$projectId", params: { projectId: r.projectId } });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to start"),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-fuchsia-500/5 to-blue-500/10 p-8 md:p-12">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-1 rounded-full border bg-background/60 px-3 py-1 text-xs font-semibold text-primary backdrop-blur">
            <Sparkles className="h-3 w-3" /> AI Marketing Company
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
            12 AI specialists. One team.
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            You talk to one AI. Behind the scenes, twelve specialist agents collaborate — strategists, writers, designers, video producers, SEO, ads, email, CRM, automation, analytics, and QA — to deliver complete marketing projects.
          </p>

          {/* Team prompt */}
          <div className="mt-6 rounded-2xl border bg-background p-3 shadow-sm">
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask the AI Team to launch anything — 'Launch my AI course', 'Grow my SaaS to 1000 signups', 'Diwali sale for my ecom store'…"
              className="w-full resize-none bg-transparent px-3 py-2 text-sm outline-none"
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <History className="h-3.5 w-3.5" />
                <Link to="/agents/history" className="hover:text-foreground">Recent runs</Link>
                <span>·</span>
                <Settings2 className="h-3.5 w-3.5" />
                <Link to="/agents/settings" className="hover:text-foreground">Settings</Link>
              </div>
              <Button
                disabled={prompt.trim().length < 4 || runMut.isPending}
                onClick={() => runMut.mutate()}
              >
                {runMut.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Assembling team…</> : <><Send className="mr-2 h-4 w-4" /> Brief the team</>}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Live team execution preview */}
      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">How your team executes</h2>
            <p className="text-sm text-muted-foreground">A typical run flows through these specialists.</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          {EXECUTION_STEPS.map((s, i) => (
            <div key={i} className="rounded-2xl border bg-card p-4">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {s.agents.map((a) => (
                    <AgentAvatar key={a} slug={a} size={32} />
                  ))}
                </div>
                <span className="rounded-full border bg-muted/40 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">Step {i + 1}</span>
              </div>
              <div className="mt-3 text-sm font-medium">{s.label}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {s.agents.map((a) => AGENT_META[a]?.short ?? a).join(" · ")}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agent grid */}
      <div className="mt-12">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Meet your specialists</h2>
            <p className="text-sm text-muted-foreground">Tap any agent to chat directly, review runs, or tune settings.</p>
          </div>
          <Button asChild variant="outline" size="sm"><Link to="/agents/history"><History className="mr-1 h-4 w-4" /> History</Link></Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {q.isLoading && Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted/40" />)}
          {ordered.map((a: any) => <AgentCard key={a.slug} agent={a} />)}
        </div>
      </div>
    </div>
  );
}
