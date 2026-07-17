import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bot, Send, X, Loader2, Phone, Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  startSalesConversation,
  sendSalesMessage,
  getSalesHistory,
  type SalesCard,
  type SalesReply,
} from "@/lib/sales-agent/chat.functions";

type UiMessage = {
  role: "user" | "assistant";
  content: string;
  quickReplies?: string[];
  cards?: SalesCard[];
  handover?: SalesReply["handover"];
};

const SESSION_KEY = "glintr_sales_session_v1";
const CONV_KEY = "glintr_sales_conv_v1";

function ensureSessionToken(): string {
  if (typeof window === "undefined") return "";
  let t = window.localStorage.getItem(SESSION_KEY);
  if (!t) {
    t = `web-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
    window.localStorage.setItem(SESSION_KEY, t);
  }
  return t;
}

const GREETING: UiMessage = {
  role: "assistant",
  content:
    "Hi 👋 I'm **GlintrAI**, your admissions & career counsellor. Before I suggest anything, tell me a little about you — **what brings you to Glintr today?** Are you looking for an internship, placement, a career switch, or just exploring AI? If you'd rather speak to a human counsellor, just say so.",
  quickReplies: [
    "I need an internship certificate",
    "I want placement support",
    "I want to learn AI",
    "Talk to a human counsellor",
  ],
};


export function SalesAgentWidget() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [handover, setHandover] = useState<SalesReply["handover"]>(null);
  const routerState = useRouterState();
  const path = routerState.location.pathname;

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Don't render on admin/partner authenticated shells that already own their own AI surface
  const hidden = useMemo(
    () => path.startsWith("/admin/") || path.startsWith("/hq") || path.startsWith("/workspace"),
    [path],
  );

  useEffect(() => {
    setReady(true);
    const existing = typeof window !== "undefined" ? window.localStorage.getItem(CONV_KEY) : null;
    if (existing) setConversationId(existing);
  }, []);

  useEffect(() => {
    if (!open || !listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open, sending]);

  const openAndInit = useCallback(async () => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 60);
    if (conversationId) return;
    try {
      const sessionToken = ensureSessionToken();
      const res = await startSalesConversation({
        data: { sessionToken, channel: "web", pagePath: path },
      });
      setConversationId(res.conversationId);
      if (typeof window !== "undefined") window.localStorage.setItem(CONV_KEY, res.conversationId);
      if (res.resumed) {
        const hist = await getSalesHistory({ data: { conversationId: res.conversationId, sessionToken } });
        if (hist.messages.length) {
          setMessages(
            hist.messages.map((m) => ({
              role: (m.role as string) === "user" ? ("user" as const) : ("assistant" as const),
              content: m.content as string,
              quickReplies: Array.isArray(m.quick_replies) ? (m.quick_replies as string[]) : undefined,
              cards: Array.isArray(m.cards) ? (m.cards as unknown as SalesCard[]) : undefined,
            })),
          );
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [conversationId, path]);

  const submit = useCallback(
    async (text: string) => {
      const value = text.trim();
      if (!value || sending) return;
      let convId = conversationId;
      if (!convId) {
        const sessionToken = ensureSessionToken();
        const res = await startSalesConversation({
          data: { sessionToken, channel: "web", pagePath: path },
        });
        convId = res.conversationId;
        setConversationId(convId);
        if (typeof window !== "undefined") window.localStorage.setItem(CONV_KEY, convId);
      }
      setMessages((prev) => [...prev, { role: "user", content: value }]);
      setInput("");
      setSending(true);
      try {
        const reply = await sendSalesMessage({ data: { conversationId: convId, message: value, pagePath: path } });
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: reply.reply,
            quickReplies: reply.quickReplies,
            cards: reply.cards,
            handover: reply.handover,
          },
        ]);
        if (reply.handover) setHandover(reply.handover);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "The counsellor is unreachable right now.");
      } finally {
        setSending(false);
      }
    },
    [conversationId, path, sending],
  );

  if (!ready || hidden) return null;

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={openAndInit}
          className={cn(
            "fixed z-40 bottom-5 left-5 md:bottom-6 md:left-6",
            "flex items-center gap-2 rounded-full pl-3 pr-4 py-2.5 shadow-xl",
            "bg-gradient-to-r from-primary via-primary to-lime-400 text-primary-foreground",
            "hover:-translate-y-0.5 transition-transform ring-1 ring-white/10",
          )}
          aria-label="Ask GlintrAI"
        >
          <span className="grid place-items-center w-8 h-8 rounded-full bg-white/15">
            <Bot className="w-4 h-4" />
          </span>
          <span className="text-sm font-semibold">Ask GlintrAI</span>
        </button>

      )}

      {open && (
        <div
          className={cn(
            "fixed z-50 bottom-4 left-4 md:bottom-6 md:left-6",
            "w-[calc(100vw-2rem)] sm:w-[380px] max-h-[80vh]",
            "rounded-2xl border border-border bg-background shadow-2xl overflow-hidden flex flex-col",
          )}
          role="dialog"
          aria-label="Ask GlintrAI"
        >
          <header className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary/90 to-lime-500/80 text-primary-foreground">
            <div className="grid place-items-center w-9 h-9 rounded-full bg-white/15">
              <Bot className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">GlintrAI · Admissions & Career Counsellor</div>
              <div className="text-[11px] opacity-80">Instant answers · human handover anytime</div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-md hover:bg-white/10"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-muted/30">
            {messages.map((m, i) => (
              <MessageBubble key={i} m={m} onQuick={submit} />
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> GlintrAI is typing…
              </div>
            )}
            {handover && (
              <div className="rounded-xl border border-border bg-card p-3 text-xs space-y-1.5">
                <div className="font-semibold text-foreground">Talk to a human counsellor</div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-3.5 h-3.5" />
                  <a href={`mailto:${handover.email}`} className="underline">{handover.email}</a>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-3.5 h-3.5" />
                  <a href={`tel:${handover.phone.replace(/\s/g, "")}`} className="underline">{handover.phone}</a>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <a
                    href={`https://wa.me/${handover.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            )}
          </div>

          <form
            className="border-t border-border p-2.5 flex items-end gap-2 bg-background"
            onSubmit={(e) => {
              e.preventDefault();
              void submit(input);
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void submit(input);
                }
              }}
              placeholder="Ask GlintrAI about programs, pricing, placements, internships…"
              rows={1}
              className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary max-h-28"
            />
            <Button type="submit" size="sm" disabled={sending || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}

function MessageBubble({ m, onQuick }: { m: UiMessage; onQuick: (s: string) => void }) {
  const isUser = m.role === "user";
  return (
    <div className={cn("flex flex-col", isUser ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap leading-relaxed shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-card text-foreground border border-border rounded-bl-sm",
        )}
      >
        {m.content}
      </div>
      {!!m.cards?.length && (
        <div className="mt-2 grid grid-cols-1 gap-2 w-full max-w-[85%]">
          {m.cards.map((c, i) => (
            <Link
              key={i}
              to={c.href ?? "/"}
              className="rounded-xl border border-border bg-card px-3 py-2 hover:border-primary transition-colors"
            >
              <div className="text-sm font-semibold text-foreground">{c.title}</div>
              {c.subtitle && <div className="text-xs text-muted-foreground mt-0.5">{c.subtitle}</div>}
              <div className="mt-1.5 flex items-center justify-between text-[11px]">
                {c.price && <span className="text-primary font-medium">{c.price}</span>}
                <span className="ml-auto text-primary font-semibold">{c.cta ?? "View"} →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
      {!!m.quickReplies?.length && (
        <div className="mt-2 flex flex-wrap gap-1.5 max-w-[85%]">
          {m.quickReplies.map((q, i) => (
            <button
              key={i}
              onClick={() => onQuick(q)}
              className="text-xs rounded-full border border-border bg-background hover:bg-accent px-3 py-1.5 text-foreground"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
