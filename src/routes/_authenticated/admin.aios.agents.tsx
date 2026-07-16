import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Send, Sparkles, ThumbsDown, ThumbsUp, AlertTriangle } from "lucide-react";
import { AGENTS, getAgent } from "@/lib/aios/agents";
import { aiosChat } from "@/lib/aios/aios.functions";
import { useConversations, useFeedback } from "@/lib/aios/storage";
import { cn } from "@/lib/utils";

type Search = { agent?: string; convo?: string };

export const Route = createFileRoute("/_authenticated/admin/aios/agents")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    agent: typeof s.agent === "string" ? s.agent : undefined,
    convo: typeof s.convo === "string" ? s.convo : undefined,
  }),
  component: AgentsPage,
});

function AgentsPage() {
  const { agent: agentParam } = Route.useSearch();
  const nav = Route.useNavigate();
  const activeAgentId = agentParam && getAgent(agentParam) ? agentParam : AGENTS[0].id;
  const agent = getAgent(activeAgentId)!;

  const { items: convos, create, append } = useConversations();
  const { submit: submitFeedback } = useFeedback();
  const [convoId, setConvoId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>(agent.starters);
  const scrollRef = useRef<HTMLDivElement>(null);
  const runChat = useServerFn(aiosChat);

  const active = useMemo(() => convos.find((c) => c.id === convoId) ?? null, [convos, convoId]);

  useEffect(() => {
    setConvoId(null);
    setSuggestions(agent.starters);
  }, [activeAgentId, agent.starters]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [active?.messages.length]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;
    setInput(""); setBusy(true); setErr(null);

    let cId = convoId;
    if (!cId) {
      const c = create(agent.id, message.slice(0, 60));
      cId = c.id;
      setConvoId(c.id);
    }
    append(cId, { role: "user", content: message, at: Date.now() });

    try {
      const conv = (convos.find((c) => c.id === cId)?.messages ?? []).concat({ role: "user" as const, content: message, at: Date.now() });
      const history = conv.slice(-12).map((m) => ({ role: m.role, content: m.content }));
      const out = await runChat({ data: { agentId: agent.id, messages: history } });
      append(cId, { role: "assistant", content: out.reply, at: Date.now() });
      setSuggestions(out.suggestions?.length ? out.suggestions : agent.starters);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const Icon = agent.icon;
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-primary flex items-center gap-1.5"><Sparkles className="size-3" /> AIOS Agents</p>
        <h1 className="mt-1 text-2xl font-semibold">Specialized AI Agents</h1>
        <p className="mt-1 text-sm text-muted-foreground">Ten role-specific assistants sharing the same intelligence layer.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-lg border border-border/60 bg-white p-2">
          <ul className="space-y-0.5">
            {AGENTS.map((a) => {
              const I = a.icon;
              const active = a.id === agent.id;
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => nav({ search: { agent: a.id } })}
                    className={cn(
                      "w-full flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors",
                      active ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-surface-2/60 hover:text-foreground",
                    )}
                  >
                    <I className="size-[15px]" style={{ color: active ? undefined : a.color }} />
                    <span className="truncate">{a.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="rounded-lg border border-border/60 bg-white flex flex-col min-h-[70vh]">
          <div className="border-b border-border/60 p-4 flex items-start gap-3">
            <span className="rounded-md p-2" style={{ background: `color-mix(in oklch, ${agent.color} 15%, white)` }}>
              <Icon className="size-5" style={{ color: agent.color }} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold">{agent.name}</h2>
              <p className="text-[12px] text-muted-foreground">{agent.tagline}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {agent.knowledge.map((k) => (
                  <span key={k} className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground">{k}</span>
                ))}
              </div>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {!active || active.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-10">
                <div className="rounded-full p-3" style={{ background: `color-mix(in oklch, ${agent.color} 15%, white)` }}>
                  <Icon className="size-6" style={{ color: agent.color }} />
                </div>
                <div className="max-w-md">
                  <p className="text-sm font-semibold">Start a conversation with {agent.name}</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">Responsibilities: {agent.responsibilities.slice(0, 3).join(" · ")}</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                  {agent.starters.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
                    >{s}</button>
                  ))}
                </div>
              </div>
            ) : (
              active.messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
                    m.role === "user" ? "bg-foreground text-background" : "bg-muted",
                  )}>
                    {m.role === "assistant" ? (
                      <>
                        <div className="prose prose-sm max-w-none"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                        <div className="mt-2 flex items-center gap-1 text-muted-foreground">
                          <button
                            type="button"
                            title="Helpful"
                            onClick={() => submitFeedback({ agentId: agent.id, conversationId: active.id, messageIndex: i, rating: "helpful" })}
                            className="rounded-full p-1 hover:bg-background"
                          ><ThumbsUp className="size-3" /></button>
                          <button
                            type="button"
                            title="Not helpful"
                            onClick={() => submitFeedback({ agentId: agent.id, conversationId: active.id, messageIndex: i, rating: "not_helpful" })}
                            className="rounded-full p-1 hover:bg-background"
                          ><ThumbsDown className="size-3" /></button>
                          <button
                            type="button"
                            title="Needs improvement"
                            onClick={() => submitFeedback({ agentId: agent.id, conversationId: active.id, messageIndex: i, rating: "needs_improvement" })}
                            className="rounded-full p-1 hover:bg-background"
                          ><AlertTriangle className="size-3" /></button>
                        </div>
                      </>
                    ) : (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {active && suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-border/60 p-3">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-border/70 px-3 py-1 text-[11px] text-muted-foreground hover:bg-muted"
                >{s}</button>
              ))}
            </div>
          )}

          {err && <p className="px-4 py-2 text-xs text-red-500">{err}</p>}

          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex items-center gap-2 border-t border-border/60 p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask ${agent.name}…`}
              className="flex-1 rounded-full border border-border/60 bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              disabled={busy}
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="inline-flex items-center gap-1 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-40"
            >
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
