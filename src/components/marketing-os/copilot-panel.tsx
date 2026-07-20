import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import ReactMarkdown from "react-markdown";
import {
  Sparkles, Send, X, ChevronRight, Loader2, Wand2, Trash2, RefreshCw,
  CheckCircle2, AlertCircle, Command,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  chatWithCopilot,
  getCopilotMessages,
  clearCopilotMessages,
  runProjectStep,
} from "@/lib/marketing-os/projects.functions";
import { toast } from "sonner";

const SUGGESTED_PROMPTS = [
  "Improve my campaign",
  "Generate 10 more LinkedIn posts",
  "Improve SEO",
  "Generate better hashtags",
  "Improve captions",
  "Create YouTube Shorts",
  "Generate email sequence",
  "Generate WhatsApp messages",
  "Improve landing page CTA",
  "Improve conversion rate",
  "Generate webinar plan",
  "Generate placement campaign",
];

const SLASH_COMMANDS: { cmd: string; label: string; step?: string }[] = [
  { cmd: "/new-post",     label: "Generate more social posts", step: "content" },
  { cmd: "/new-email",    label: "Generate email sequence",    step: "email" },
  { cmd: "/new-poster",   label: "Generate new posters",       step: "posters" },
  { cmd: "/new-workflow", label: "Generate automation",        step: "workflow" },
  { cmd: "/improve",      label: "Improve current strategy",   step: "strategy" },
  { cmd: "/landing-page", label: "Regenerate landing page",    step: "landing" },
  { cmd: "/forms",        label: "Regenerate lead form",       step: "forms" },
  { cmd: "/publish",      label: "Publish approved assets" },
  { cmd: "/analyze",      label: "Analyze campaign health" },
];

type Msg = { role: "user" | "assistant"; content: string; createdAt: string; pending?: boolean };

export function CopilotPanel({
  projectId,
  projectName,
  status,
  open,
  onClose,
}: {
  projectId: string;
  projectName: string;
  status: string;
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const chatFn = useServerFn(chatWithCopilot);
  const getFn = useServerFn(getCopilotMessages);
  const clearFn = useServerFn(clearCopilotMessages);
  const runFn = useServerFn(runProjectStep);

  const [input, setInput] = useState("");
  const [showCommands, setShowCommands] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [recent, setRecent] = useState<{ label: string; status: "running" | "ok" | "err"; step?: string }[]>([]);

  const q = useQuery({
    queryKey: ["copilot", projectId],
    queryFn: () => getFn({ data: { projectId } }),
    enabled: open,
  });
  const persisted: Msg[] = (q.data?.messages ?? []) as any;

  const [pendingUser, setPendingUser] = useState<Msg | null>(null);
  const [thinking, setThinking] = useState(false);

  const messages: Msg[] = useMemo(() => {
    const base = [...persisted];
    if (pendingUser) base.push(pendingUser);
    return base;
  }, [persisted, pendingUser]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
        inputRef.current?.focus();
      });
    }
  }, [open, messages.length, thinking]);

  const sendMutation = useMutation({
    mutationFn: async (message: string) => chatFn({ data: { projectId, message } }),
    onMutate: (message) => {
      setPendingUser({ role: "user", content: message, createdAt: new Date().toISOString() });
      setThinking(true);
    },
    onSuccess: async (res) => {
      setPendingUser(null);
      setThinking(false);
      qc.invalidateQueries({ queryKey: ["copilot", projectId] });
      const action = res.suggestedAction;
      if (action && ["content", "posters", "landing", "forms", "email", "calendar", "workflow", "strategy"].includes(action)) {
        toast(`Copilot proposed: regenerate ${action}`, {
          action: {
            label: "Approve",
            onClick: () => executeAction(action),
          },
        });
      }
    },
    onError: (e: any) => {
      setPendingUser(null);
      setThinking(false);
      toast.error(e?.message ?? "Copilot error");
    },
  });

  const executeAction = async (step: string) => {
    const entry = { label: `Regenerate ${step}`, status: "running" as const, step };
    setRecent((p) => [entry, ...p].slice(0, 8));
    try {
      await runFn({ data: { id: projectId, step: step as any } });
      setRecent((p) => p.map((r) => (r === entry ? { ...r, status: "ok" as const } : r)));
      qc.invalidateQueries({ queryKey: ["marketing-project", projectId] });
      toast.success(`${step} updated`);
    } catch (e: any) {
      setRecent((p) => p.map((r) => (r === entry ? { ...r, status: "err" as const } : r)));
      toast.error(e?.message ?? "Action failed");
    }
  };

  const submit = (text?: string) => {
    const t = (text ?? input).trim();
    if (!t) return;
    // slash command shortcut
    if (t.startsWith("/")) {
      const match = SLASH_COMMANDS.find((c) => t.toLowerCase().startsWith(c.cmd));
      if (match?.step) {
        setInput("");
        setShowCommands(false);
        executeAction(match.step);
        return;
      }
    }
    setInput("");
    setShowCommands(false);
    sendMutation.mutate(t);
  };

  const onInputChange = (v: string) => {
    setInput(v);
    setShowCommands(v.startsWith("/"));
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed z-50 bg-background border-l shadow-2xl flex flex-col transition-transform duration-300",
          // desktop: right rail 420px
          "lg:top-0 lg:right-0 lg:h-screen lg:w-[420px]",
          !open && "lg:translate-x-full",
          // mobile: bottom sheet
          "inset-x-0 bottom-0 h-[85vh] rounded-t-2xl lg:rounded-none border-t lg:border-t-0",
          !open && "translate-y-full lg:translate-y-0",
        )}
      >
        {/* Header */}
        <header className="px-4 py-3 border-b flex items-center gap-3 shrink-0">
          <div className="size-9 rounded-lg bg-gradient-to-br from-primary to-primary/60 grid place-items-center shrink-0">
            <Sparkles className="size-4 text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Glintr AI</span>
              <Badge variant="success" className="text-[9px] h-4 px-1.5">Context active</Badge>
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              {projectName} · <span className="capitalize">{status}</span>
            </div>
          </div>
          <Button size="icon" variant="ghost" className="size-8" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </header>

        {/* Messages */}
        <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && !thinking && (
            <div className="space-y-4">
              <div className="rounded-xl border border-dashed p-4 text-sm">
                <div className="flex items-start gap-2">
                  <Wand2 className="size-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium mb-1">Hi! I'm your marketing copilot.</div>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      I already know this project's campaign, audience, brand kit, posts, images, landing page, forms, emails and calendar. Ask me anything or approve an action below.
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-medium">
                  Try
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_PROMPTS.slice(0, 8).map((p) => (
                    <button
                      key={p}
                      onClick={() => submit(p)}
                      className="text-xs px-2.5 py-1.5 rounded-full border bg-background hover:bg-muted transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <MessageBubble key={i} msg={m} onApproveAction={executeAction} />
          ))}

          {thinking && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Thinking…
            </div>
          )}
        </div>

        {/* Recent actions */}
        {recent.length > 0 && (
          <div className="border-t px-4 py-2 max-h-24 overflow-y-auto">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-medium">
              Recent AI actions
            </div>
            <div className="space-y-1">
              {recent.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {r.status === "running" && <Loader2 className="size-3 animate-spin text-blue-500" />}
                  {r.status === "ok" && <CheckCircle2 className="size-3 text-emerald-500" />}
                  {r.status === "err" && <AlertCircle className="size-3 text-red-500" />}
                  <span className="truncate flex-1">{r.label}</span>
                  {r.status === "err" && r.step && (
                    <button className="text-primary hover:underline" onClick={() => executeAction(r.step!)}>
                      Retry
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Slash command menu */}
        {showCommands && (
          <div className="border-t bg-muted/40 max-h-56 overflow-y-auto">
            {SLASH_COMMANDS.filter((c) => c.cmd.startsWith(input.toLowerCase())).map((c) => (
              <button
                key={c.cmd}
                onClick={() => {
                  if (c.step) {
                    setInput("");
                    setShowCommands(false);
                    executeAction(c.step);
                  } else {
                    submit(c.cmd);
                  }
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted text-left"
              >
                <Command className="size-3 text-muted-foreground" />
                <span className="font-mono text-xs">{c.cmd}</span>
                <span className="text-muted-foreground text-xs truncate">{c.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Composer */}
        <div className="border-t p-3 shrink-0">
          <div className="relative">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Ask Glintr AI or type / for commands…"
              rows={2}
              className="resize-none pr-11 text-sm min-h-[60px]"
              disabled={thinking}
            />
            <Button
              size="icon"
              className="absolute right-1.5 bottom-1.5 size-8 rounded-md"
              onClick={() => submit()}
              disabled={thinking || !input.trim()}
            >
              {thinking ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
          <div className="flex items-center justify-between mt-1.5 px-0.5">
            <div className="text-[10px] text-muted-foreground">Enter to send · Shift+Enter for newline</div>
            <button
              className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
              onClick={async () => {
                if (!confirm("Clear conversation history?")) return;
                await clearFn({ data: { projectId } });
                qc.invalidateQueries({ queryKey: ["copilot", projectId] });
              }}
            >
              <Trash2 className="size-3" /> Clear
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function MessageBubble({ msg, onApproveAction }: { msg: Msg; onApproveAction: (step: string) => void }) {
  const isUser = msg.role === "user";
  // detect ACTION suggestion in assistant markdown
  const actionMatch = !isUser ? msg.content.match(/(?:^|\n)\s*(?:approve|regenerate|update)\s+(content|posters|landing|forms|email|calendar|workflow|strategy)/i) : null;
  const step = actionMatch?.[1]?.toLowerCase();

  return (
    <div className={cn("flex gap-2.5", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "size-7 rounded-full grid place-items-center shrink-0 text-[10px] font-semibold",
          isUser ? "bg-muted" : "bg-gradient-to-br from-primary to-primary/60 text-primary-foreground",
        )}
      >
        {isUser ? "You" : <Sparkles className="size-3.5" />}
      </div>
      <div className={cn("min-w-0 max-w-[85%]", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2 text-sm",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted/60 rounded-tl-sm",
          )}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap">{msg.content}</div>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-pre:my-2 prose-headings:mt-2 prose-headings:mb-1">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          )}
        </div>
        {step && (
          <div className="mt-1.5 flex gap-1">
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onApproveAction(step)}>
              <CheckCircle2 className="size-3 mr-1" /> Approve & run
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs">
              <RefreshCw className="size-3 mr-1" /> Regenerate
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function CopilotToggle({ onClick, open }: { onClick: () => void; open: boolean }) {
  if (open) return null;
  return (
    <button
      onClick={onClick}
      className="fixed z-40 bottom-6 right-6 lg:top-20 lg:bottom-auto flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary/70 text-primary-foreground shadow-xl px-4 py-2.5 hover:shadow-2xl transition-shadow"
    >
      <Sparkles className="size-4" />
      <span className="text-sm font-medium">Glintr AI</span>
      <ChevronRight className="size-4 opacity-70" />
    </button>
  );
}
