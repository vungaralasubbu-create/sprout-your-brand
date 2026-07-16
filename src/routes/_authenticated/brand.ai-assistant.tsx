import { createFileRoute } from "@tanstack/react-router";
import { BrandPageHeader, BrandBody, GlassCard } from "@/components/brand-os/brand-shell";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { brandAssistantChat, type BrandAssistantResponse } from "@/lib/brand-os/ai-assistant.functions";
import { buildPageHead } from "@/lib/seo-head";

export const Route = createFileRoute("/_authenticated/brand/ai-assistant")({
  ssr: false,
  head: () => buildPageHead({ path: "/brand/ai-assistant", title: "AI Business Assistant — Glintr", noindex: true }),
  component: Assistant,
});

type Msg = { role: "user" | "assistant"; content: string };
const QUICK: { label: string; intent: any; prompt: string }[] = [
  { label: "Hero copy", intent: "marketing_copy", prompt: "Write hero copy for an AI-focused academy that trains sales professionals." },
  { label: "Program description", intent: "program_description", prompt: "Write a compelling description for ChatGPT Mastery targeting working professionals." },
  { label: "Welcome email", intent: "email_draft", prompt: "Draft a warm welcome email for a newly enrolled student." },
  { label: "Sales response", intent: "sales_response", prompt: "How do I respond when a lead says 'It's too expensive'?" },
  { label: "Blog ideas", intent: "blog_idea", prompt: "Give me 5 SEO blog ideas for an AI academy." },
  { label: "FAQ", intent: "faq", prompt: "Write 6 FAQs for my academy landing page." },
];

function Assistant() {
  const call = useServerFn(brandAssistantChat);
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: "**Welcome.** I help with marketing copy, program descriptions, emails, sales responses, FAQs, and blog ideas. What would you like to work on?" }]);
  const [suggestions, setSuggestions] = useState<BrandAssistantResponse["suggestions"]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" }); }, [messages, busy]);

  const send = async (text: string, intent?: any) => {
    if (!text.trim() || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: text.trim() }];
    setMessages(next); setInput(""); setBusy(true);
    try {
      const res = await call({ data: { messages: next.slice(-12).map((m) => ({ role: m.role, content: m.content })), intent } });
      setMessages([...next, { role: "assistant", content: res.reply }]);
      setSuggestions(res.suggestions);
    } catch {
      setMessages([...next, { role: "assistant", content: "I couldn't reach the assistant. Please retry." }]);
    } finally { setBusy(false); }
  };

  return (
    <>
      <BrandPageHeader eyebrow="Growth" title="AI business assistant" description="Your copilot for marketing, sales, and content — grounded in your brand." />
      <BrandBody>
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="space-y-3">
            <GlassCard>
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Quick actions</h3>
              <div className="space-y-1.5">
                {QUICK.map((q) => (
                  <button key={q.label} onClick={() => send(q.prompt, q.intent)} className="w-full text-left rounded-lg border bg-white px-3 py-2 text-xs hover:border-primary/40 hover:bg-primary/5 transition-colors">
                    <div className="font-medium">{q.label}</div>
                    <div className="text-muted-foreground truncate mt-0.5">{q.prompt}</div>
                  </button>
                ))}
              </div>
            </GlassCard>
          </div>

          <GlassCard className="p-0 flex flex-col h-[600px]">
            <div ref={scroller} className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === "user" ? "bg-primary text-white" : "bg-slate-50 border"
                  }`}>
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                    ) : m.content}
                  </div>
                </div>
              ))}
              {busy && <div className="flex justify-start"><div className="rounded-2xl bg-slate-50 border px-4 py-2.5 text-sm"><Sparkles className="size-4 animate-pulse inline mr-2" />Thinking…</div></div>}
              {!!suggestions.length && !busy && (
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((s, i) => (
                    <button key={i} onClick={() => send(s.prompt)} className="rounded-full border bg-white px-3 py-1 text-xs hover:border-primary/40 hover:bg-primary/5">{s.label}</button>
                  ))}
                </div>
              )}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="border-t p-3 flex gap-2">
              <Textarea rows={1} value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                placeholder="Ask for copy, an email, a description, or feedback…" className="resize-none min-h-[44px]" />
              <Button type="submit" disabled={busy || !input.trim()} className="shrink-0"><Send className="size-4" /></Button>
            </form>
          </GlassCard>
        </div>
      </BrandBody>
    </>
  );
}
