import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import * as React from "react";
import { ArrowLeft, Loader2, Send, Sparkles, ShieldCheck, MessageCircle } from "lucide-react";
import { z } from "zod";

import { Container, Section } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { sendSupportMessage, supportIntentLabel } from "@/lib/support/support.functions";

const SearchSchema = z.object({
  intent: z.string().optional(),
  q: z.string().optional(),
  source: z.string().optional(),
  faq: z.array(z.string()).optional(),
});

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Glintr AI Support — Continue The Conversation" },
      {
        name: "description",
        content:
          "Glintr AI Support helps continue your question with context from Smart FAQs and moves unresolved issues to the Glintr support team.",
      },
      { property: "og:title", content: "Glintr AI Support" },
      {
        property: "og:description",
        content: "Continue your Glintr question with AI Support and human escalation when needed.",
      },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://glintr.com/contact" }],
  }),
  validateSearch: (raw) => SearchSchema.parse(raw ?? {}),
  component: ContactPage,
});

type ChatMsg = { role: "user" | "assistant"; content: string };

const INTENT_GREETINGS: Record<string, string> = {
  program_discovery:
    "I can help you find the right Glintr program. Tell me what you'd like to learn or the outcome you're aiming for, and I'll suggest starting points.",
  payment_support:
    "I can help you continue with your payment and program access question. If this needs account-specific review, I'll guide you through the available support steps.",
  refund_policy:
    "I can help explain Glintr's approved refund information. Share a little more about your situation and I'll point you to the right next step.",
  payout_support:
    "I can help you continue with your payout question. For account-specific payout status, I'll guide you to the authorised support path.",
  partner_support:
    "I can help you continue with your Sales Partner question — becoming a partner, the 70% or 50% models, referrals, earnings or payouts.",
  campus_ambassador:
    "I can help you continue with your Campus Ambassador question — eligibility, application, commission, referrals or payouts.",
  account_specific:
    "This looks like a question about your Glintr account. I'll help you continue safely — account-specific status is handled through authorised support.",
  account_specific_payment:
    "I can help with your payment and access question. If your account needs review, I'll guide you through the authorised support steps.",
  status_lookup:
    "This looks like a status question about your Glintr account. I'll help you get to the right support path.",
  general:
    "Hi! I'm Glintr AI Support. Ask me anything about Glintr programs, learning, payments, partnerships, Campus Ambassador or platform support.",
};

function ContactPage() {
  const search = Route.useSearch();
  const sendFn = useServerFn(sendSupportMessage);

  const originalQuestion = search.q?.trim() || "";
  const intent = search.intent || null;
  const faqRefs = React.useMemo(() => (Array.isArray(search.faq) ? search.faq : []), [search.faq]);
  const intentLabel = supportIntentLabel(intent);

  const greeting = React.useMemo(() => {
    const base = INTENT_GREETINGS[intent ?? "general"] ?? INTENT_GREETINGS.general;
    if (originalQuestion) {
      return `${base}\n\nYou asked: "${originalQuestion}". Where would you like to start?`;
    }
    return base;
  }, [intent, originalQuestion]);

  const [messages, setMessages] = React.useState<ChatMsg[]>([]);
  const [input, setInput] = React.useState(originalQuestion ? "" : "");
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const send = useMutation({
    mutationFn: async (userText: string) => {
      const next: ChatMsg[] = [...messages, { role: "user", content: userText }];
      setMessages(next);
      const res = await sendFn({
        data: {
          messages: next,
          handoff: {
            originalQuestion: originalQuestion || undefined,
            supportIntent: intent || undefined,
            source: search.source || "faqs",
            faqRefs,
          },
        },
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
      return res;
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = input.trim();
    if (!val || send.isPending) return;
    setInput("");
    send.mutate(val);
  };

  return (
    <div className="bg-background">
      <Section className="pt-14 pb-8 border-b border-border/60">
        <Container size="md">
          <div className="flex flex-col gap-4">
            <Link
              to="/faqs"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit"
            >
              <ArrowLeft className="size-4" /> Back to Smart FAQs
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="muted" className="gap-1.5">
                <Sparkles className="size-3.5" /> GLINTR AI SUPPORT
              </Badge>
              {intent && <Badge variant="outline">{intentLabel}</Badge>}
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
              Continue the conversation
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Glintr AI Support continues from your Smart FAQ question. It shares approved
              information and moves anything unresolved to the Glintr support team — it cannot
              verify payments, approve refunds, or release payouts.
            </p>
          </div>
        </Container>
      </Section>

      <Section className="py-10">
        <Container size="md">
          <Card className="p-0 overflow-hidden flex flex-col h-[70vh] min-h-[520px]">
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-muted/20">
              <ChatBubble role="assistant" content={greeting} />
              {messages.map((m, i) => (
                <ChatBubble key={i} role={m.role} content={m.content} />
              ))}
              {send.isPending && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Glintr AI Support is typing...
                </div>
              )}
              {send.isError && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                  Glintr AI Support is temporarily unavailable. Please try again in a moment.
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={submit} className="border-t border-border/60 bg-card p-3 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  originalQuestion
                    ? "Continue your question..."
                    : "Ask Glintr AI Support anything..."
                }
                className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary/60"
                aria-label="Message Glintr AI Support"
                disabled={send.isPending}
              />
              <Button type="submit" variant="gradient" disabled={send.isPending || !input.trim()}>
                {send.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Send
              </Button>
            </form>
          </Card>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="flex gap-3 rounded-lg border border-border bg-card p-4">
              <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Account-safe</p>
                <p className="text-muted-foreground mt-0.5">
                  AI Support never approves payments, refunds or payouts. Sensitive review is
                  escalated to Glintr support.
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-lg border border-border bg-card p-4">
              <MessageCircle className="size-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Human support ready</p>
                <p className="text-muted-foreground mt-0.5">
                  If your question needs a person, AI Support will guide you to the right team.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}

function ChatBubble({ role, content }: ChatMsg) {
  const isUser = role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed " +
          (isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-card border border-border rounded-bl-md")
        }
      >
        {content}
      </div>
    </div>
  );
}
