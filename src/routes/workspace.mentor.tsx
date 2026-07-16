import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2, Send, Sparkles, Trash2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Card, EmptyState, SectionHeader } from "@/components/workspace/hub-shell";
import { askMentor } from "@/lib/mentor/mentor.functions";
import { useChats, useNotebooks } from "@/lib/workspace/hub";

export const Route = createFileRoute("/workspace/mentor")({
  component: MentorPage,
});

function MentorPage() {
  const { chats, create, appendMessage, remove } = useChats();
  const { notebooks } = useNotebooks();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const runMentor = useServerFn(askMentor);
  const scrollRef = useRef<HTMLDivElement>(null);

  const active = chats.find((c) => c.id === activeId) ?? chats[0] ?? null;

  useEffect(() => {
    if (!activeId && chats.length > 0) setActiveId(chats[0].id);
  }, [activeId, chats]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [active?.messages.length]);

  const startChat = (notebookId?: string) => {
    const nb = notebooks.find((n) => n.id === notebookId);
    const c = create(nb ? `Chat • ${nb.name}` : "New chat", notebookId);
    setActiveId(c.id);
    setSuggestions([]);
  };

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || !active) return;
    setInput("");
    setBusy(true);
    setErr(null);
    appendMessage(active.id, { role: "user", content: message });
    try {
      const history = [...active.messages, { role: "user" as const, content: message, at: Date.now() }]
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));
      const out = await runMentor({ data: { messages: history, pageContext: { path: "/workspace/mentor" } } });
      appendMessage(active.id, { role: "assistant", content: out.reply });
      setSuggestions(out.suggestions ?? []);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Mentor is unavailable right now.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="AI Mentor"
        title="Chat with your mentor"
        description="Ask anything about programs, concepts, careers or study plans. Every chat is saved to your workspace."
        action={
          <button
            type="button"
            onClick={() => startChat()}
            className="inline-flex items-center gap-1 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background"
          >
            <Sparkles className="h-3.5 w-3.5" /> New chat
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <Card className="!p-3">
          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Chats</p>
          {chats.length === 0 ? (
            <p className="px-2 py-2 text-xs text-muted-foreground">No chats yet.</p>
          ) : (
            <ul className="space-y-1">
              {chats.map((c) => (
                <li key={c.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveId(c.id)}
                    className={`flex-1 truncate rounded-lg px-2 py-1.5 text-left text-xs ${
                      active?.id === c.id ? "bg-muted font-semibold text-foreground" : "text-muted-foreground hover:bg-muted/60"
                    }`}
                  >
                    {c.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Delete chat?")) remove(c.id);
                      if (active?.id === c.id) setActiveId(null);
                    }}
                    className="text-muted-foreground hover:text-red-500"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {notebooks.length > 0 && (
            <>
              <p className="mt-3 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                New chat linked to
              </p>
              <ul className="space-y-1">
                {notebooks.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => startChat(n.id)}
                      className="w-full truncate rounded-lg px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-muted/60"
                    >
                      {n.emoji} {n.name}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        <Card className="flex min-h-[60vh] flex-col !p-0">
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {!active ? (
              <EmptyState
                title="Start a new chat"
                hint="Create a new chat or link one to a notebook."
                action={
                  <button
                    type="button"
                    onClick={() => startChat()}
                    className="rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background"
                  >
                    New chat
                  </button>
                }
              />
            ) : active.messages.length === 0 ? (
              <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 text-center">
                <Sparkles className="h-6 w-6 text-primary" aria-hidden />
                <p className="text-sm text-muted-foreground">Ask anything about your learning journey.</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    "Summarize prompt engineering basics",
                    "Explain RLHF simply",
                    "Career path for AI product manager",
                    "Study plan for VLSI in 6 weeks",
                  ].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => send(p)}
                      className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              active.messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                      m.role === "user" ? "bg-foreground text-background" : "bg-muted text-foreground"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
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
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {err && <p className="px-4 py-2 text-xs text-red-500">{err}</p>}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!active) {
                startChat();
                return;
              }
              send(input);
            }}
            className="flex items-center gap-2 border-t border-border/60 p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={active ? "Ask your mentor…" : "Start a new chat to begin"}
              className="flex-1 rounded-full border border-border/60 bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              disabled={busy || !active}
            />
            <button
              type="submit"
              disabled={busy || !active || !input.trim()}
              className="inline-flex items-center gap-1 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-40"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Send
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
