import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Loader2, MessageSquare, Zap, Activity, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getAgent, chatWithAgent } from "@/lib/ai-team/team.functions";
import { AgentAvatar } from "@/components/ai-team/agent-visuals";
import { metaFor } from "@/lib/ai-team/agent-meta";

export const Route = createFileRoute("/_authenticated/agents/$agent")({
  component: AgentDetail,
});

type Msg = { role: "user" | "assistant"; content: string };

function AgentDetail() {
  const { agent: slug } = Route.useParams();
  const ga = useServerFn(getAgent);
  const ca = useServerFn(chatWithAgent);
  const q = useQuery({ queryKey: ["agent", slug], queryFn: () => ga({ data: { slug } }) });

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const chatMut = useMutation({
    mutationFn: async (text: string) => {
      const history = messages.slice(-14);
      return ca({ data: { slug, message: text, history } });
    },
    onSuccess: (r) => setMessages((m) => [...m, { role: "assistant", content: r.reply }]),
    onError: (e: any) => toast.error(e?.message ?? "Chat failed"),
  });

  if (q.isLoading) return <div className="mx-auto max-w-6xl px-4 py-10"><div className="h-96 animate-pulse rounded-3xl bg-muted/40" /></div>;
  const a = q.data?.agent as any;
  if (!a) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <div className="text-2xl font-semibold">Agent not found</div>
        <Button asChild className="mt-4"><Link to="/agents">Back to team</Link></Button>
      </div>
    );
  }
  const meta = metaFor(a.slug);
  const stats = q.data?.stats;
  const runs = q.data?.recentRuns ?? [];

  const submit = () => {
    if (!input.trim() || chatMut.isPending) return;
    const text = input.trim();
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    chatMut.mutate(text);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <Link to="/agents" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All agents
      </Link>

      {/* Header */}
      <div className="mt-4 flex items-start gap-4">
        <AgentAvatar slug={a.slug} size={64} ring />
        <div className="flex-1">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{meta.discipline}</div>
          <div className="text-3xl font-semibold tracking-tight">{a.name}</div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{a.description}</p>
        </div>
        <span className={cn(
          "rounded-full px-3 py-1 text-xs font-semibold",
          a.is_active ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground",
        )}>{a.is_active ? "Active" : "Disabled"}</span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Chat panel */}
        <div className="lg:col-span-2">
          <div className="flex h-[560px] flex-col overflow-hidden rounded-2xl border bg-card">
            <div className="border-b px-5 py-3 text-sm font-semibold">
              <MessageSquare className="mr-2 inline h-4 w-4" /> Chat with {a.name.split(" ")[0]}
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-muted-foreground">
                  <AgentAvatar slug={a.slug} size={48} />
                  <div className="mt-3 max-w-sm">
                    Ask {a.name.split(" ")[0]} directly. This specialist focuses on <span className="text-foreground">{meta.discipline.toLowerCase()}</span>.
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={cn("flex gap-2", m.role === "user" && "justify-end")}>
                  {m.role === "assistant" && <AgentAvatar slug={a.slug} size={28} />}
                  <div className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm",
                    m.role === "user" ? "bg-primary text-primary-foreground" : "border bg-background",
                  )}>{m.content}</div>
                </div>
              ))}
              {chatMut.isPending && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <AgentAvatar slug={a.slug} size={28} />
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: "300ms" }} />
                  </div>
                  {meta.short} is thinking…
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            <div className="border-t bg-muted/20 p-3">
              <div className="flex items-end gap-2">
                <textarea
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
                  }}
                  placeholder={`Message ${a.name}…`}
                  className="max-h-40 min-h-[40px] flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <Button size="sm" onClick={submit} disabled={!input.trim() || chatMut.isPending}>
                  {chatMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-5">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Responsibilities</div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {meta.responsibilities.map((r) => (
                <li key={r} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-primary" /> {r}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Runtime</div>
            <div className="mt-3 space-y-3 text-sm">
              <Row icon={Activity} label="Runs" value={stats?.total ?? 0} />
              <Row icon={CheckCircle2} label="Success rate" value={`${stats?.successRate ?? 100}%`} />
              <Row icon={Zap} label="Avg latency" value={`${((stats?.avgDurationMs ?? 0) / 1000).toFixed(2)}s`} />
              <Row icon={Zap} label="Model" value={a.model_preference} />
            </div>
          </div>

          <div className="rounded-2xl border bg-card">
            <div className="border-b p-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recent runs</div>
            <div className="max-h-64 divide-y overflow-y-auto">
              {runs.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">No runs yet.</div>
              ) : runs.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between px-4 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    {r.status === "success" ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-red-500" />}
                    <span className="capitalize">{r.status}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span>{((r.duration_ms ?? 0) / 1000).toFixed(2)}s</span>
                    <span>{new Date(r.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <div className="flex items-center justify-between">
      <span className="inline-flex items-center gap-2 text-muted-foreground"><Icon className="h-4 w-4" /> {label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
