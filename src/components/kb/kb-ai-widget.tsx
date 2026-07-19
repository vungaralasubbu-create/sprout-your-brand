import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { askKbAi } from "@/lib/admin/kb.functions";
import { Link } from "@tanstack/react-router";
import { Sparkles, Send, X, MessageSquare, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string; sources?: any[] };

export function KbAiWidget({
  triggerLabel = "Ask AI",
  floating = false,
  initialQuestion,
}: { triggerLabel?: string; floating?: boolean; initialQuestion?: string }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(initialQuestion || "");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send() {
    const q = input.trim();
    if (!q || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const history = next.slice(-10).map((m) => ({ role: m.role, content: m.content }));
      const res: any = await askKbAi({ data: { question: q, history } });
      setMessages((m) => [...m, { role: "assistant", content: res.answer, sources: res.sources }]);
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setBusy(false);
    }
  }

  const Panel = (
    <Card className="flex flex-col w-full max-w-md h-[560px] shadow-2xl border-2 border-primary/30">
      <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-primary" />
          <div>
            <div className="font-semibold text-sm">Glintr Help AI</div>
            <div className="text-xs text-muted-foreground">Answers from the Knowledge Base</div>
          </div>
        </div>
        <Button size="icon" variant="ghost" onClick={() => setOpen(false)}><X size={16} /></Button>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-sm text-muted-foreground">
            Ask me anything about Glintr — enrollment, payouts, courses, live classes, brand launch...
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div className={`rounded-2xl px-3 py-2 max-w-[85%] text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {m.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : m.content}
              {m.sources?.length ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {m.sources.map((s: any, si: number) => (
                    <Link key={s.id} to="/help/$slug" params={{ slug: s.slug }}>
                      <Badge variant="outline" className="text-[10px]">[{si + 1}] {s.title}</Badge>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={14} className="animate-spin" /> Thinking…
          </div>
        )}
      </div>
      <form className="p-3 border-t flex gap-2" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your question..." disabled={busy} />
        <Button type="submit" disabled={busy || !input.trim()}><Send size={16} /></Button>
      </form>
    </Card>
  );

  if (floating) {
    return (
      <>
        {!open && (
          <Button
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-40 rounded-full shadow-2xl h-14 w-14 p-0"
          >
            <MessageSquare size={22} />
          </Button>
        )}
        {open && <div className="fixed bottom-6 right-6 z-50">{Panel}</div>}
      </>
    );
  }

  return (
    <>
      {!open ? (
        <Button size="lg" onClick={() => setOpen(true)}>
          <Sparkles className="mr-2" size={16} /> {triggerLabel}
        </Button>
      ) : (
        <div className="mt-4 flex justify-center">{Panel}</div>
      )}
    </>
  );
}
