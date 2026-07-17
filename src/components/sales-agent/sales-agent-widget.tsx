import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bot, Send, X, Loader2, Phone, Mail, MessageCircle, ShieldCheck,
  RefreshCw, ArrowLeft, LifeBuoy,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  startSalesConversation,
  sendSalesMessage,
  getSalesHistory,
  capturePhoneLead,
  type SalesCard,
  type SalesReply,
} from "@/lib/sales-agent/chat.functions";
import { getSalesOtpConfig } from "@/lib/sales-agent/otp.functions";
import { requestLoginOtp, verifyLoginOtp } from "@/lib/auth/otp.functions";
import { GLINTR_AI_OPEN_EVENT, type OpenGlintrAIDetail } from "@/lib/glintr-ai";
import { supabase } from "@/integrations/supabase/client";

type PhoneStep = "collect" | "otp" | "recovery";
const RESEND_SECONDS = 30;
const MAX_OTP_ATTEMPTS = 5;
const MAX_RESENDS = 3;

type UiMessage = {
  role: "user" | "assistant";
  content: string;
  quickReplies?: string[];
  cards?: SalesCard[];
  handover?: SalesReply["handover"];
};

const SESSION_KEY = "glintr_sales_session_v1";
const CONV_KEY = "glintr_sales_conv_v1";
const PHONE_KEY = "glintr_sales_phone_v1";
const FIRSTQ_KEY = "glintr_sales_firstq_v1";


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
    "Hi 👋 I'm **GlintrAI**, your AI Career Advisor.\n\nI can help you choose the right program, compare courses, and answer your questions on internships, placements and career outcomes.\n\n**How can I help you today?**",
  quickReplies: [
    "I want to learn AI",
    "Suggest a course",
    "I need an internship",
    "I need placement support",
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
  const [phoneCaptured, setPhoneCaptured] = useState(false);
  const [firstQuestion, setFirstQuestion] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [submittingPhone, setSubmittingPhone] = useState(false);

  // OTP flow state
  const [otpEnabled, setOtpEnabled] = useState(false);
  const [phoneStep, setPhoneStep] = useState<PhoneStep>("collect");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [otpResends, setOtpResends] = useState(0);
  const [resendIn, setResendIn] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [pendingLead, setPendingLead] = useState<null | (() => Promise<void>)>(null);
  const routerState = useRouterState();
  const path = routerState.location.pathname;

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const hidden = useMemo(
    () => path.startsWith("/admin/") || path.startsWith("/hq") || path.startsWith("/workspace"),
    [path],
  );

  // Show phone card only after the user has asked their first question AND the
  // assistant has replied at least once. Never re-prompt for verified users.
  const showPhoneCard = useMemo(() => {
    if (phoneCaptured) return false;
    const userTurns = messages.filter((m) => m.role === "user").length;
    const assistantTurns = messages.filter((m) => m.role === "assistant").length;
    // GREETING is the first assistant message. Wait for at least 2 assistant messages
    // (greeting + first real reply) once the user has spoken.
    return userTurns >= 1 && assistantTurns >= 2 && !sending;
  }, [messages, phoneCaptured, sending]);

  useEffect(() => {
    setReady(true);
    if (typeof window === "undefined") return;
    const existing = window.localStorage.getItem(CONV_KEY);
    if (existing) setConversationId(existing);
    if (window.localStorage.getItem(PHONE_KEY)) setPhoneCaptured(true);
    const savedFirstQ = window.localStorage.getItem(FIRSTQ_KEY);
    if (savedFirstQ) setFirstQuestion(savedFirstQ);
    // Logged-in users: trust their registered phone and skip lead capture.
    void supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata as { phone?: string } | undefined;
      const phone = data.user?.phone || meta?.phone;
      if (phone) {
        setPhoneCaptured(true);
        try { window.localStorage.setItem(PHONE_KEY, "1"); } catch { /* ignore */ }
      }
    });
    // Load OTP feature flag once — falls back to disabled on any failure.
    void getSalesOtpConfig()
      .then((cfg) => setOtpEnabled(Boolean(cfg?.enabled)))
      .catch(() => setOtpEnabled(false));
  }, []);

  // Resend cooldown timer for the OTP step.
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = window.setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, [resendIn]);


  useEffect(() => {
    if (!open || !listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open, sending, showPhoneCard]);

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

  // Unified entry point: any "Ask GlintrAI" button on the site dispatches
  // `glintr:open-ai` and lands the user in this single conversation.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<OpenGlintrAIDetail>).detail ?? {};
      void openAndInit();
      if (detail.prompt) setInput((prev) => (prev ? prev : detail.prompt!));
    };
    window.addEventListener(GLINTR_AI_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(GLINTR_AI_OPEN_EVENT, onOpen);
  }, [openAndInit]);


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
      // Remember the very first question so we can store it with the phone lead.
      if (!firstQuestion) {
        setFirstQuestion(value);
        if (typeof window !== "undefined") window.localStorage.setItem(FIRSTQ_KEY, value);
      }
      setMessages((prev) => [...prev, { role: "user", content: value }]);
      setInput("");
      setSending(true);
      try {
        const reply = await sendSalesMessage({ data: { conversationId: convId, message: value, pagePath: path, phoneCaptured } });
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
    [conversationId, path, sending, firstQuestion],
  );

  const submitPhone = useCallback(async () => {
    const raw = phoneInput.trim();
    const digits = raw.replace(/\D/g, "");
    if (digits.length < 6 || digits.length > 15) {
      toast.error("Please enter a valid mobile number.");
      return;
    }
    if (!conversationId) return;
    setSubmittingPhone(true);
    try {
      const device =
        typeof navigator !== "undefined" && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
          ? "mobile"
          : "desktop";
      const referralSource =
        typeof document !== "undefined" && document.referrer ? document.referrer.slice(0, 400) : null;
      const sourceUrl =
        typeof window !== "undefined" ? window.location.href.slice(0, 500) : null;
      const browser = typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 240) : null;
      const utm: Record<string, string> = {};
      if (typeof window !== "undefined") {
        const sp = new URLSearchParams(window.location.search);
        for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
          const v = sp.get(k);
          if (v) utm[k] = v.slice(0, 120);
        }
      }
      // Detect course slug when the user is on a programs/courses page.
      const courseMatch = path.match(/^\/(?:programs|courses)\/[^/]+\/([^/?#]+)/);
      await capturePhoneLead({
        data: {
          conversationId,
          phone: raw,
          firstQuestion: firstQuestion ?? undefined,
          pagePath: path,
          courseSlug: courseMatch ? courseMatch[1] : undefined,
          referralSource: referralSource ?? undefined,
          sourceUrl: sourceUrl ?? undefined,
          browser: browser ?? undefined,
          utm: Object.keys(utm).length ? utm : undefined,
          device,
        },
      });

      setPhoneCaptured(true);
      if (typeof window !== "undefined") window.localStorage.setItem(PHONE_KEY, "1");
      toast.success("Thanks! Continuing your conversation…");
      setTimeout(() => inputRef.current?.focus(), 60);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save your number. Please try again.");
    } finally {
      setSubmittingPhone(false);
    }
  }, [phoneInput, conversationId, firstQuestion, path]);

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
            {handover && phoneCaptured && (
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

            {showPhoneCard && (
              <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-background to-lime-400/5 p-4 shadow-sm">
                <div className="flex items-start gap-2.5">
                  <div className="grid place-items-center w-8 h-8 rounded-full bg-primary/15 text-primary shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground">
                      Let's personalize your learning journey.
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Enter your mobile number to continue chatting with GlintrAI and receive personalized
                      program recommendations, counselling support and exclusive updates.
                    </p>
                  </div>
                </div>
                <form
                  className="mt-3 flex flex-col gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void submitPhone();
                  }}
                >
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    autoFocus
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    aria-label="Mobile number"
                    maxLength={24}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <ShieldCheck className="w-3 h-3" /> Private. Never shared.
                    </div>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={submittingPhone || phoneInput.trim().replace(/\D/g, "").length < 6}
                    >
                      {submittingPhone ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving…
                        </>
                      ) : (
                        "Continue"
                      )}
                    </Button>
                  </div>
                </form>
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
                  if (!showPhoneCard) void submit(input);
                }
              }}
              placeholder={
                showPhoneCard
                  ? "Enter your mobile number above to continue…"
                  : "Ask GlintrAI about programs, pricing, placements, internships…"
              }
              rows={1}
              disabled={showPhoneCard}
              className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary max-h-28 disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <Button type="submit" size="sm" disabled={sending || !input.trim() || showPhoneCard}>
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
