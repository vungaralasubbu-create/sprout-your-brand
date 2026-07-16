import { Link, useRouterState } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Bookmark as BookmarkIcon,
  BookmarkCheck,
  Clock,
  Compass,
  LifeBuoy,
  Mail,
  MessageSquare,
  Phone,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { track } from "@/lib/intent";
import { askMentor, type MentorLink } from "@/lib/mentor/mentor.functions";
import { contextualSuggestions, derivePageContext } from "@/lib/mentor/context";
import {
  inferKindFromPath,
  useBookmarks,
  useRecentlyViewed,
} from "@/lib/mentor/storage";

type MessageKind = "text" | "support" | "escalation";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  kind?: MessageKind;
  suggestions?: string[];
  links?: MentorLink[];
};

// GlintrAI quick actions (per platform brand spec)
const QUICK_ACTIONS: { label: string; prompt: string }[] = [
  { label: "Recommend a course", prompt: "Recommend a course for me based on my goals." },
  { label: "Build my learning roadmap", prompt: "Build me a personalised learning roadmap." },
  { label: "Help me choose a career", prompt: "Help me choose a career path that fits my skills." },
  { label: "Compare programs", prompt: "Compare programs so I can decide which one to pick." },
  { label: "Explain a concept", prompt: "Explain a concept to me clearly with an example." },
  { label: "Help me become a partner", prompt: "How do I become a Glintr sales partner?" },
  { label: "Launch my academy", prompt: "How do I launch my own academy with Glintr?" },
];

// Support contact — surfaced in the support card.
const SUPPORT_CONTACT = {
  email: "support@glintr.com",
  phone: "+91 80000 00000",
  whatsapp: "+91 80000 00000",
  hours: "Mon–Sat, 10:00 AM – 7:00 PM IST",
};

// Phrases that trigger an immediate hand-off to the human support card.
const HUMAN_TRIGGERS = [
  /\bhuman\s+(support|help|agent)\b/i,
  /\bspeak\s+to\s+(a\s+)?(person|human|someone|agent|representative)\b/i,
  /\btalk\s+to\s+(a\s+)?(person|human|someone|agent|representative)\b/i,
  /\bcontact\s+support\b/i,
  /\bcall\s+(someone|support|glintr)\b/i,
  /\braise\s+(a\s+)?ticket\b/i,
  /\bbook\s+(a\s+)?(consultation|call|demo)\b/i,
  /\breal\s+person\b/i,
];

const SUPPRESS_PATHS = ["/auth", "/dashboard", "/admin", "/partner-support", "/student-support"];

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function greeting(section?: string): string {
  switch (section) {
    case "programs":
      return "Hi, I'm GlintrAI. Exploring programs? I can help you compare, plan your learning, or pick a starting course.";
    case "earn":
      return "Hi, I'm GlintrAI. Curious about earning with Glintr? Ask me about the 70% or 50% models, payouts, or how to apply.";
    case "launch":
      return "Hi, I'm GlintrAI. Want to launch your own EdTech brand? I can walk you through white-label, LMS, and marketing support.";
    case "blog":
      return "Hi, I'm GlintrAI. I can recommend related reads, explain any concept, or suggest a program that goes deeper.";
    case "glossary":
      return "Hi, I'm GlintrAI. Ask me to explain any term simply — with examples, related terms, and programs to go deeper.";
    default:
      return "Hi, I'm GlintrAI. What would you like to explore today? I can help with courses, career guidance, learning roadmaps, becoming a partner, or launching your own academy.";
  }
}

export function AiMentor() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [tab, setTab] = useState<"chat" | "bookmarks" | "recent">("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const bookmarks = useBookmarks();
  const recent = useRecentlyViewed();

  const ctx = useMemo(() => derivePageContext(pathname), [pathname]);
  const chips = useMemo(() => contextualSuggestions(ctx), [ctx]);
  const suppress = SUPPRESS_PATHS.some((p) => pathname.startsWith(p));

  // Pulse only after inactivity (no scroll/click for 12s), first-time-per-session
  useEffect(() => {
    if (suppress || typeof window === "undefined") return;
    if (sessionStorage.getItem("glintr_mentor_seen") === "1") return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      setPulse(false);
      clearTimeout(timer);
      timer = setTimeout(() => setPulse(true), 12000);
    };
    reset();
    window.addEventListener("scroll", reset, { passive: true });
    window.addEventListener("mousemove", reset, { passive: true });
    window.addEventListener("keydown", reset);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", reset);
      window.removeEventListener("mousemove", reset);
      window.removeEventListener("keydown", reset);
    };
  }, [suppress]);

  // Reset pulse & mark seen on open
  useEffect(() => {
    if (!open) return;
    setPulse(false);
    try {
      sessionStorage.setItem("glintr_mentor_seen", "1");
    } catch {
      /* ignore */
    }
    // greet on first open
    setMessages((prev) => {
      if (prev.length > 0) return prev;
      return [
        {
          id: makeId(),
          role: "assistant",
          content: greeting(ctx.section),
          suggestions: chips,
        },
      ];
    });
    // focus after mount
    setTimeout(() => inputRef.current?.focus(), 60);
  }, [open, ctx.section, chips]);

  // Auto-scroll on new message
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const failStreakRef = useRef(0);

  const pushSupportCard = useCallback(() => {
    setMessages((prev) => [
      ...prev,
      {
        id: makeId(),
        role: "assistant",
        kind: "support",
        content:
          "I'll hand you over to our team so you get help quickly. Their details are right here.",
      },
    ]);
  }, []);

  const send = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean || loading) return;
      const userMsg: ChatMessage = { id: makeId(), role: "user", content: clean };
      const nextHistory = [...messages, userMsg];
      setMessages(nextHistory);
      setInput("");
      track("mentor_message_sent", { path: pathname });

      // Human-support escalation trigger — skip the AI call entirely.
      if (HUMAN_TRIGGERS.some((rx) => rx.test(clean))) {
        pushSupportCard();
        setTimeout(() => inputRef.current?.focus(), 60);
        return;
      }

      setLoading(true);
      try {
        const res = await askMentor({
          data: {
            messages: nextHistory.map((m) => ({ role: m.role, content: m.content })),
            pageContext: ctx,
          },
        });
        failStreakRef.current = 0;
        setMessages((prev) => [
          ...prev,
          {
            id: makeId(),
            role: "assistant",
            content: res.reply,
            suggestions: res.suggestions,
            links: res.links,
          },
        ]);
      } catch {
        failStreakRef.current += 1;
        setMessages((prev) => [
          ...prev,
          {
            id: makeId(),
            role: "assistant",
            content:
              "I couldn't reach GlintrAI just now. Try again in a moment, or explore [Find Your Program](/find-your-program).",
          },
        ]);
        // Smart escalation after repeated failures
        if (failStreakRef.current >= 2) {
          failStreakRef.current = 0;
          setMessages((prev) => [
            ...prev,
            {
              id: makeId(),
              role: "assistant",
              kind: "escalation",
              content:
                "I'm not completely confident I can resolve this. Would you like me to connect you with the Glintr support team?",
            },
          ]);
        }
      } finally {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 60);
      }
    },
    [ctx, loading, messages, pathname, pushSupportCard],
  );

  const clearChat = useCallback(() => {
    setMessages([
      {
        id: makeId(),
        role: "assistant",
        content: greeting(ctx.section),
        suggestions: chips,
      },
    ]);
    setTimeout(() => inputRef.current?.focus(), 60);
  }, [ctx.section, chips]);

  if (suppress) return null;

  return (
    <>
      {/* Floating trigger */}
      <button
        type="button"
        aria-label="Open GlintrAI"
        aria-haspopup="dialog"
        onClick={() => {
          setOpen(true);
          track("mentor_opened", { path: pathname });
        }}
        className={cn(
          "fixed z-40 bottom-5 right-5 md:bottom-6 md:right-6",
          "group inline-flex items-center justify-center rounded-full",
          "size-12 md:size-14 bg-foreground text-background shadow-xl",
          "transition-all duration-300 hover:scale-[1.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        )}
        title="GlintrAI"
      >
        <span
          className={cn(
            "relative inline-flex size-7 md:size-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#00E6FF] via-[#2E5CFF] to-[#7CFF6B]",
          )}
        >
          <Sparkles className="size-3.5 md:size-4 text-white" aria-hidden />
          {pulse && (
            <span
              className="absolute inset-0 rounded-full bg-primary/40 animate-ping"
              aria-hidden
            />
          )}
        </span>
        <span className="sr-only">Open GlintrAI</span>
      </button>


      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className={cn(
            "flex flex-col p-0 gap-0",
            "w-full sm:max-w-[440px] md:max-w-[480px]",
            "bg-background/95 backdrop-blur border-l",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#00E6FF] via-[#2E5CFF] to-[#7CFF6B]">
                <Sparkles className="size-4 text-white" aria-hidden />
              </span>
              <div className="leading-tight">
                <div className="text-sm font-semibold">GlintrAI</div>
                <div className="text-[11px] text-muted-foreground">
                  Your intelligent assistant
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Talk to a human"
                title="Talk to a human"
                onClick={pushSupportCard}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <LifeBuoy className="size-4" />
              </button>
              {tab === "chat" && messages.length > 1 && (
                <button
                  type="button"
                  aria-label="Clear conversation"
                  title="Clear conversation"
                  onClick={clearChat}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
              <button
                type="button"
                aria-label="Close GlintrAI"
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-accent"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div
            role="tablist"
            aria-label="GlintrAI sections"
            className="flex items-center gap-1 border-b px-2 py-1.5 text-xs"
          >
            <TabBtn active={tab === "chat"} onClick={() => setTab("chat")} icon={<MessageSquare className="size-3.5" />} label="Chat" />
            <TabBtn active={tab === "bookmarks"} onClick={() => setTab("bookmarks")} icon={<BookmarkIcon className="size-3.5" />} label={`Bookmarks${bookmarks.items.length ? ` (${bookmarks.items.length})` : ""}`} />
            <TabBtn active={tab === "recent"} onClick={() => setTab("recent")} icon={<Clock className="size-3.5" />} label="Recent" />
          </div>

          {tab === "chat" ? (
            <>
              <ScrollArea className="flex-1">
                <div
                  ref={scrollRef}
                  className="max-h-full space-y-4 px-4 py-4"
                  aria-live="polite"
                  aria-busy={loading}
                >
                  {messages.map((m) => (
                    <MessageBubble
                      key={m.id}
                      message={m}
                      onSuggestion={send}
                      onLink={() => setOpen(false)}
                      onEscalate={pushSupportCard}
                    />
                  ))}
                  {loading && <TypingIndicator />}
                </div>
              </ScrollArea>

              {/* Suggestion chips (contextual, above input) */}
              {messages.length <= 1 && chips.length > 0 && (
                <div className="border-t px-3 py-2">
                  <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Try asking
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {chips.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => send(c)}
                        className="rounded-full border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-accent"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick actions row — GlintrAI prompts */}
              <div className="border-t px-3 py-2">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <Compass className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  {QUICK_ACTIONS.map((a) => (
                    <button
                      key={a.label}
                      type="button"
                      onClick={() => send(a.prompt)}
                      className="shrink-0 rounded-full border border-border/70 bg-card px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-accent"
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>


              {/* Composer */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="border-t p-3"
              >
                <div className="flex items-end gap-2 rounded-2xl border bg-card p-2 focus-within:ring-2 focus-within:ring-primary/30">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send(input);
                      }
                    }}
                    rows={1}
                    aria-label="Ask GlintrAI"
                    placeholder="Ask about programs, careers, or concepts…"
                    className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground max-h-32"
                    maxLength={2000}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    aria-label="Send message"
                    disabled={loading || !input.trim()}
                    className="size-9 rounded-xl"
                  >
                    <Send className="size-4" />
                  </Button>
                </div>
                <p className="mt-1.5 px-1 text-[10px] text-muted-foreground">
                  Mentor guidance is educational. Not a job or salary promise.
                </p>
              </form>
            </>
          ) : tab === "bookmarks" ? (
            <SavedList
              title="Your bookmarks"
              empty="Bookmark programs, blogs, or glossary terms and they'll appear here."
              items={bookmarks.items.map((b) => ({ href: b.href, label: b.label, kind: b.kind }))}
              onOpen={() => setOpen(false)}
              onRemove={(href) => bookmarks.remove(href)}
            />
          ) : (
            <SavedList
              title="Recently viewed"
              empty="Pages you visit will show up here so you can jump back in."
              items={recent.map((r) => ({ href: r.href, label: r.label, kind: r.kind }))}
              onOpen={() => setOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors",
        active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-accent",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function MessageBubble({
  message,
  onSuggestion,
  onLink,
  onEscalate,
}: {
  message: ChatMessage;
  onSuggestion: (text: string) => void;
  onLink: () => void;
  onEscalate: () => void;
}) {
  const isUser = message.role === "user";

  if (!isUser && message.kind === "support") {
    return <SupportCard intro={message.content} onLink={onLink} />;
  }

  if (!isUser && message.kind === "escalation") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[86%] rounded-2xl rounded-bl-md border border-primary/30 bg-primary/5 px-3.5 py-2.5 text-sm">
          <p className="leading-relaxed">{message.content}</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={onEscalate}
              className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1 text-[11px] font-semibold text-background hover:opacity-90"
            >
              <LifeBuoy className="size-3" /> Yes, connect me
            </button>
            <button
              type="button"
              onClick={() => onSuggestion("Let me rephrase my question.")}
              className="rounded-full border bg-background px-3 py-1 text-[11px] font-medium hover:bg-accent"
            >
              No, I'll rephrase
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[86%] rounded-2xl px-3.5 py-2.5 text-sm",
          isUser
            ? "bg-foreground text-background rounded-br-md"
            : "bg-card border rounded-bl-md",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-a:text-primary prose-a:underline-offset-2">
            <ReactMarkdown
              components={{
                a: ({ href, children }: { href?: string; children?: React.ReactNode }) => {
                  const to = href || "";
                  if (to.startsWith("/")) {
                    return (
                      <Link to={to} onClick={onLink} className="text-primary underline underline-offset-2">
                        {children}
                      </Link>
                    );
                  }
                  return (
                    <a href={to} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">
                      {children}
                    </a>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {!isUser && message.links && message.links.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {message.links.map((l) => (
              <Link
                key={l.href}
                to={l.href}
                onClick={onLink}
                className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-[11px] font-medium hover:bg-accent"
              >
                {l.label} →
              </Link>
            ))}
          </div>
        )}

        {!isUser && message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {message.suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSuggestion(s)}
                className="rounded-full bg-accent/60 px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-accent"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SupportCard({ intro, onLink }: { intro: string; onLink: () => void }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-primary/30 bg-gradient-to-br from-primary/5 to-accent/30 px-4 py-3.5 text-sm shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-flex size-7 items-center justify-center rounded-full bg-foreground text-background">
            <LifeBuoy className="size-3.5" />
          </span>
          <div className="font-semibold">Glintr Support Team</div>
        </div>
        <p className="mb-3 leading-relaxed text-muted-foreground">{intro}</p>
        <ul className="mb-3 space-y-1.5 text-[12.5px]">
          <li className="flex items-center gap-2">
            <Mail className="size-3.5 text-muted-foreground" />
            <a href={`mailto:${SUPPORT_CONTACT.email}`} className="font-medium text-foreground hover:text-primary">
              {SUPPORT_CONTACT.email}
            </a>
          </li>
          <li className="flex items-center gap-2">
            <Phone className="size-3.5 text-muted-foreground" />
            <a href={`tel:${SUPPORT_CONTACT.phone.replace(/\s/g, "")}`} className="font-medium text-foreground hover:text-primary">
              {SUPPORT_CONTACT.phone}
            </a>
          </li>
          <li className="flex items-center gap-2">
            <MessageSquare className="size-3.5 text-muted-foreground" />
            <a
              href={`https://wa.me/${SUPPORT_CONTACT.whatsapp.replace(/[^\d]/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground hover:text-primary"
            >
              WhatsApp {SUPPORT_CONTACT.whatsapp}
            </a>
          </li>
          <li className="flex items-center gap-2 text-muted-foreground">
            <Clock className="size-3.5" />
            {SUPPORT_CONTACT.hours}
          </li>
        </ul>
        <div className="flex flex-wrap gap-1.5">
          <Link
            to="/book-consultation"
            onClick={onLink}
            className="inline-flex items-center rounded-full bg-foreground px-3 py-1.5 text-[11px] font-semibold text-background hover:opacity-90"
          >
            Book a consultation
          </Link>
          <Link
            to="/contact"
            onClick={onLink}
            className="inline-flex items-center rounded-full border bg-background px-3 py-1.5 text-[11px] font-medium hover:bg-accent"
          >
            Contact form
          </Link>
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start" aria-label="GlintrAI is thinking">
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border bg-card px-3.5 py-2.5">
        <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.2s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.1s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-primary" />
      </div>
    </div>
  );
}

function SavedList({
  title,
  empty,
  items,
  onOpen,
  onRemove,
}: {
  title: string;
  empty: string;
  items: { href: string; label: string; kind: string }[];
  onOpen: () => void;
  onRemove?: (href: string) => void;
}) {
  return (
    <ScrollArea className="flex-1">
      <div className="px-4 py-4">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </div>
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-xs text-muted-foreground">
            {empty}
          </p>
        ) : (
          <ul className="space-y-1.5">
            {items.map((i) => (
              <li key={i.href} className="group flex items-center gap-2 rounded-xl border bg-card p-2.5">
                <Link
                  to={i.href}
                  onClick={onOpen}
                  className="flex-1 truncate text-sm font-medium hover:text-primary"
                >
                  {i.label}
                </Link>
                <span className="rounded-full bg-accent/60 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {i.kind}
                </span>
                {onRemove && (
                  <button
                    type="button"
                    aria-label={`Remove ${i.label}`}
                    onClick={() => onRemove(i.href)}
                    className="rounded-full p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </ScrollArea>
  );
}

/**
 * Small standalone bookmark toggle usable on any page.
 */
export function BookmarkToggle({
  href,
  label,
  kind = "other",
  className,
}: {
  href: string;
  label: string;
  kind?: ReturnType<typeof inferKindFromPath>;
  className?: string;
}) {
  const { isBookmarked, toggle } = useBookmarks();
  const active = isBookmarked(href);
  return (
    <button
      type="button"
      onClick={() => toggle({ href, label, kind })}
      aria-pressed={active}
      aria-label={active ? "Remove bookmark" : "Bookmark this page"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active ? "border-primary/40 bg-primary/10 text-primary" : "bg-card hover:bg-accent",
        className,
      )}
    >
      {active ? <BookmarkCheck className="size-3.5" /> : <BookmarkIcon className="size-3.5" />}
      {active ? "Saved" : "Save"}
    </button>
  );
}
