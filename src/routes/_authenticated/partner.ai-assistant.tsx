import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2, AlertTriangle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { askPartnerAssistant, type AssistantResponse } from "@/lib/partner/ai-assistant.functions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/partner/ai-assistant")({
  head: () => ({ meta: [{ title: "AI Sales Assistant — Glintr Partner" }, { name: "robots", content: "noindex" }] }),
  component: PartnerAssistantPage,
});

type ChatMsg = { role: "user" | "assistant"; content: string };

const QUICK_ACTIONS: { label: string; prompt: string; intent: "explain_program" | "draft_message" | "answer_faq" | "next_action" | "summarize_policy" }[] = [
  { label: "Explain a program", prompt: "Explain the Mastering ChatGPT program to a mid-career marketer.", intent: "explain_program" },
  { label: "Draft a WhatsApp", prompt: "Draft a short WhatsApp message for a learner who asked about AI programs yesterday but hasn't replied.", intent: "draft_message" },
  { label: "Handle price objection", prompt: "The learner says the program is too expensive. Help me respond without discounting.", intent: "answer_faq" },
  { label: "Next step for a warm lead", prompt: "A learner is interested but keeps postponing the decision call. What's the next best step?", intent: "next_action" },
  { label: "Summarize payout policy", prompt: "Summarize the payout policy in plain language for a new partner.", intent: "summarize_policy" },
];

function PartnerAssistantPage() {
  const fn = useServerFn(askPartnerAssistant);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [last, setLast] = useState<AssistantResponse | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const mutation = useMutation({
    mutationFn: (payload: { messages: ChatMsg[]; intent?: string }) =>
      fn({ data: payload as any }),
    onSuccess: (res) => {
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
      setLast(res);
    },
  });

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, mutation.isPending]);

  function send(text: string, intent?: string) {
    const trimmed = text.trim();
    if (!trimmed || mutation.isPending) return;
    const next = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(next);
    setInput("");
    mutation.mutate({ messages: next, intent });
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-10 space-y-6">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 text-caption font-mono uppercase tracking-widest text-primary">
          <Sparkles className="size-3.5" /> Partner Copilot
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-semibold tracking-tight">AI Sales Assistant</h1>
        <p className="text-muted-foreground max-w-2xl">
          Draft messages, explain programs, handle objections, and think through the next action. This assistant knows Glintr — but never invents policy or income figures.
        </p>
      </header>

      {messages.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.label}
              onClick={() => send(a.prompt, a.intent)}
              className="text-left rounded-xl border bg-white p-4 hover:border-primary/40 hover:shadow-sm transition-all"
            >
              <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-1">Quick prompt</div>
              <div className="font-medium text-sm mb-1">{a.label}</div>
              <div className="text-xs text-muted-foreground line-clamp-2">{a.prompt}</div>
            </button>
          ))}
        </div>
      )}

      <div
        ref={scroller}
        className="rounded-2xl border bg-white min-h-[380px] max-h-[62vh] overflow-y-auto p-4 sm:p-6 space-y-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
      >
        {messages.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            Ask a question or pick a quick prompt above.
          </div>
        )}
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} content={m.content} />
        ))}
        {mutation.isPending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Thinking…
          </div>
        )}

        {last?.suggestions && last.suggestions.length > 0 && !mutation.isPending && (
          <div className="pt-2 flex flex-wrap gap-2">
            {last.suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => send(s.prompt)}
                className="text-xs bg-primary/[0.06] hover:bg-primary/[0.12] text-primary px-3 py-1.5 rounded-full border border-primary/20 transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {last?.disclaimer && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <span>{last.disclaimer}</span>
        </div>
      )}

      <div className="rounded-2xl border bg-white p-3 flex items-end gap-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="Ask anything — a program, a message, a policy summary…"
          rows={2}
          className="flex-1 resize-none px-3 py-2 text-sm bg-transparent focus:outline-none"
        />
        <Button size="sm" onClick={() => send(input)} disabled={!input.trim() || mutation.isPending}>
          <Send className="size-4" />
          Send
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        The assistant helps you think — the responsibility for what you send stays with you. Never promise jobs, salary, or guaranteed outcomes.
      </p>
    </div>
  );
}

function Bubble({ role, content }: ChatMsg) {
  const isUser = role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-slate-50 text-foreground border border-slate-200",
        )}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap">{content}</div>
        ) : (
          <div className="prose prose-sm max-w-none prose-p:my-2 prose-li:my-1">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
