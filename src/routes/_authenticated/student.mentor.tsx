import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles,
  Plus,
  MessageSquare,
  Send,
  ThumbsUp,
  ThumbsDown,
  Archive,
  Loader2,
  BookOpen,
  ClipboardList,
  Briefcase,
  Rocket,
  Radio,
  Compass,
  Info,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  getMentorOverview,
  listMentorConversations,
  createMentorConversation,
  getMentorConversation,
  sendMentorMessage,
  archiveMentorConversation,
  setConversationContext,
  getContextOptions,
  submitMessageFeedback,
} from "@/lib/student/mentor.functions";

export const Route = createFileRoute("/_authenticated/student/mentor")({
  validateSearch: (s: Record<string, unknown>) => ({
    conv: typeof s.conv === "string" ? s.conv : undefined,
    program: typeof s.program === "string" ? s.program : undefined,
    ctx: typeof s.ctx === "string" ? s.ctx : undefined,
    ref: typeof s.ref === "string" ? s.ref : undefined,
  }),
  component: MentorPage,
});

const QUICK_ACTIONS: {
  label: string;
  prompt: string;
  icon: any;
}[] = [
  { label: "Explain this lesson", prompt: "Please explain the current lesson in simple terms with a short example.", icon: BookOpen },
  { label: "Give me a study plan", prompt: "Create a focused 7-day study plan for this program based on my current progress.", icon: Compass },
  { label: "Practice questions", prompt: "Give me 5 practice questions on the current topic. Do not include the answers yet.", icon: ClipboardList },
  { label: "Project guidance", prompt: "Help me plan the next steps for my current project without doing it for me.", icon: Briefcase },
  { label: "Interview prep tip", prompt: "Give me one high-signal interview tip relevant to my current program and career preferences.", icon: Rocket },
  { label: "Live session prep", prompt: "How should I prepare for my next live session? Give me 5 focused prep steps.", icon: Radio },
];

function MentorPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const overviewFn = useServerFn(getMentorOverview);
  const listFn = useServerFn(listMentorConversations);
  const createFn = useServerFn(createMentorConversation);
  const getConvFn = useServerFn(getMentorConversation);
  const sendFn = useServerFn(sendMentorMessage);
  const archiveFn = useServerFn(archiveMentorConversation);
  const setCtxFn = useServerFn(setConversationContext);
  const optionsFn = useServerFn(getContextOptions);
  const feedbackFn = useServerFn(submitMessageFeedback);

  const overviewQ = useQuery({ queryKey: ["mentor-overview"], queryFn: () => overviewFn() });
  const convsQ = useQuery({ queryKey: ["mentor-convs"], queryFn: () => listFn() });

  const activeId = search.conv ?? null;
  const convQ = useQuery({
    queryKey: ["mentor-conv", activeId],
    queryFn: () => getConvFn({ data: { id: activeId! } }),
    enabled: !!activeId,
  });

  // Auto-create initial conversation if user has none / lands with deep-link params
  const createdRef = useRef(false);
  useEffect(() => {
    if (createdRef.current) return;
    if (!overviewQ.data || !convsQ.data) return;
    if (activeId) return;
    if (convsQ.data.length > 0 && !search.program && !search.ctx) {
      // Auto-open latest
      navigate({ to: "/student/mentor", search: { conv: convsQ.data[0].id }, replace: true });
      return;
    }
    if (convsQ.data.length === 0 || search.program || search.ctx) {
      createdRef.current = true;
      createFn({
        data: {
          program_id: (search.program as string | undefined) ?? overviewQ.data.defaultProgramId ?? null,
          context_type: (search.ctx as any) ?? "general",
          context_record_id: (search.ref as string | undefined) ?? null,
        },
      }).then((r) => {
        qc.invalidateQueries({ queryKey: ["mentor-convs"] });
        navigate({ to: "/student/mentor", search: { conv: r.id }, replace: true });
      });
    }
  }, [overviewQ.data, convsQ.data, activeId, search.program, search.ctx, search.ref, createFn, navigate, qc]);

  const [pendingText, setPendingText] = useState<string | null>(null);
  const sendMut = useMutation({
    mutationFn: async (payload: { content: string; quick_action?: string }) => {
      setPendingText(payload.content);
      return sendFn({
        data: {
          conversation_id: activeId!,
          content: payload.content,
          quick_action: payload.quick_action ?? null,
        },
      });
    },
    onSuccess: () => {
      setPendingText(null);
      qc.invalidateQueries({ queryKey: ["mentor-conv", activeId] });
      qc.invalidateQueries({ queryKey: ["mentor-convs"] });
    },
    onError: (e: any) => {
      setPendingText(null);
      toast.error(e?.message ?? "Failed to send");
    },
  });

  const archiveMut = useMutation({
    mutationFn: async (id: string) => archiveFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mentor-convs"] });
      navigate({ to: "/student/mentor", search: {}, replace: true });
    },
  });

  const feedbackMut = useMutation({
    mutationFn: async (v: { message_id: string; feedback_type: "helpful" | "not_helpful" }) =>
      feedbackFn({ data: { conversation_id: activeId!, ...v } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mentor-conv", activeId] }),
  });

  const handleNewConversation = async () => {
    const r = await createFn({
      data: {
        program_id: overviewQ.data?.defaultProgramId ?? null,
        context_type: "general",
      },
    });
    qc.invalidateQueries({ queryKey: ["mentor-convs"] });
    navigate({ to: "/student/mentor", search: { conv: r.id } });
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row bg-slate-50">
      {/* Left: conversation list */}
      <aside className="w-full lg:w-72 border-r bg-white flex flex-col">
        <div className="p-3 border-b flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 grid place-items-center text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Glintr AI Mentor</div>
            <div className="text-[11px] text-slate-500">Personalised learning support</div>
          </div>
        </div>
        <div className="p-3">
          <Button size="sm" className="w-full gap-2" onClick={handleNewConversation}>
            <Plus className="h-4 w-4" /> New conversation
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
          {convsQ.data?.length === 0 && (
            <div className="text-xs text-slate-500 px-2 py-3">No conversations yet.</div>
          )}
          {convsQ.data?.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate({ to: "/student/mentor", search: { conv: c.id } })}
              className={cn(
                "w-full text-left rounded-md px-2 py-2 flex items-start gap-2 hover:bg-slate-100 transition",
                activeId === c.id && "bg-slate-100",
              )}
            >
              <MessageSquare className="h-4 w-4 mt-0.5 text-slate-400" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{c.title}</div>
                <div className="text-[11px] text-slate-500 truncate">
                  {c.program_title ?? "General"} · {c.message_count} msgs
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Main: chat */}
      <main className="flex-1 flex flex-col min-h-0">
        {!activeId || convQ.isLoading ? (
          <div className="flex-1 grid place-items-center text-slate-500 text-sm">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <ChatArea
            data={convQ.data!}
            overview={overviewQ.data}
            onSend={(content, qa) => sendMut.mutate({ content, quick_action: qa })}
            pending={pendingText}
            isSending={sendMut.isPending}
            onArchive={() => archiveMut.mutate(activeId)}
            onContextChange={async (patch) => {
              await setCtxFn({ data: { id: activeId, ...patch } });
              qc.invalidateQueries({ queryKey: ["mentor-conv", activeId] });
              qc.invalidateQueries({ queryKey: ["mentor-convs"] });
            }}
            optionsFn={optionsFn}
            onFeedback={(mid, type) => feedbackMut.mutate({ message_id: mid, feedback_type: type })}
          />
        )}
      </main>
    </div>
  );
}

function ChatArea({
  data,
  overview,
  onSend,
  pending,
  isSending,
  onArchive,
  onContextChange,
  optionsFn,
  onFeedback,
}: {
  data: Awaited<ReturnType<typeof getMentorConversation>>;
  overview: Awaited<ReturnType<typeof getMentorOverview>> | undefined;
  onSend: (content: string, quickAction?: string) => void;
  pending: string | null;
  isSending: boolean;
  onArchive: () => void;
  onContextChange: (patch: any) => Promise<void>;
  optionsFn: ReturnType<typeof useServerFn<typeof getContextOptions>>;
  onFeedback: (messageId: string, type: "helpful" | "not_helpful") => void;
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const conv = data.conversation as any;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [data.messages.length, pending]);

  const [ctxOptions, setCtxOptions] = useState<{ id: string; label: string }[]>([]);
  useEffect(() => {
    if (!conv.context_type || conv.context_type === "general" || conv.context_type === "program") {
      setCtxOptions([]);
      return;
    }
    optionsFn({
      data: { context_type: conv.context_type, program_id: conv.program_id ?? null },
    }).then((r) => setCtxOptions(r.options));
  }, [conv.context_type, conv.program_id, optionsFn]);

  const submit = () => {
    if (!input.trim() || isSending) return;
    onSend(input.trim());
    setInput("");
  };

  const showQuickActions = data.messages.length === 0 && !pending;

  return (
    <>
      {/* Header */}
      <div className="border-b bg-white px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{conv.title}</div>
          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className="capitalize">
              {String(conv.context_type).replace(/_/g, " ")}
            </Badge>
            {conv.program_title && <span className="truncate">{conv.program_title}</span>}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onArchive} className="gap-1 text-slate-500">
          <Archive className="h-4 w-4" /> Archive
        </Button>
      </div>

      {/* Context bar */}
      <div className="border-b bg-slate-50/60 px-4 py-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-500">Context:</span>
        <select
          className="rounded border bg-white px-2 py-1"
          value={conv.program_id ?? ""}
          onChange={(e) =>
            onContextChange({ program_id: e.target.value || null, context_record_id: null })
          }
        >
          <option value="">— Program —</option>
          {overview?.programs.map((p: any) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <select
          className="rounded border bg-white px-2 py-1"
          value={conv.context_type}
          onChange={(e) =>
            onContextChange({ context_type: e.target.value, context_record_id: null })
          }
        >
          <option value="general">General</option>
          <option value="program">Program-wide</option>
          <option value="current_module">Module</option>
          <option value="current_lesson">Lesson</option>
          <option value="project">Project</option>
          <option value="assignment">Assignment</option>
          <option value="live_session">Live Session</option>
          <option value="internship">Internship Task</option>
          <option value="career">Career</option>
        </select>
        {ctxOptions.length > 0 && (
          <select
            className="rounded border bg-white px-2 py-1 max-w-[240px]"
            value={conv.context_record_id ?? ""}
            onChange={(e) => onContextChange({ context_record_id: e.target.value || null })}
          >
            <option value="">— Select —</option>
            {ctxOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {data.messages.length === 0 && (
            <div className="text-center py-8">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 grid place-items-center text-white shadow-lg">
                <Sparkles className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                Hi — I'm your Glintr AI Mentor
              </h2>
              <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                Ask me to explain a concept, plan your studies, review an approach, or give you
                practice questions. I never grade or submit work — I help you learn.
              </p>
            </div>
          )}

          {showQuickActions && (
            <div className="grid sm:grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((qa) => {
                const Icon = qa.icon;
                return (
                  <button
                    key={qa.label}
                    onClick={() => onSend(qa.prompt, qa.label)}
                    disabled={isSending}
                    className="text-left rounded-lg border bg-white p-3 hover:shadow-md transition disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2 text-slate-900">
                      <Icon className="h-4 w-4 text-cyan-600" />
                      <div className="text-sm font-medium">{qa.label}</div>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{qa.prompt}</div>
                  </button>
                );
              })}
            </div>
          )}

          {data.messages.map((m: any) => (
            <MessageBubble key={m.id} message={m} onFeedback={onFeedback} />
          ))}

          {pending && (
            <>
              <MessageBubble
                message={{
                  id: "pending-user",
                  role: "student",
                  content: pending,
                  status: "sent",
                  created_at: new Date().toISOString(),
                }}
                onFeedback={() => {}}
              />
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking…
              </div>
            </>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t bg-white px-4 py-3">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Glintr AI Mentor…"
              className="min-h-[52px] max-h-40 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              disabled={isSending}
            />
            <Button onClick={submit} disabled={!input.trim() || isSending} className="gap-1">
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send
            </Button>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <Info className="h-3 w-3" /> AI Mentor gives guidance, not grades. Verify important
            details with your program mentor.
          </div>
        </div>
      </div>
    </>
  );
}

function MessageBubble({
  message,
  onFeedback,
}: {
  message: any;
  onFeedback: (id: string, t: "helpful" | "not_helpful") => void;
}) {
  const isMentor = message.role === "mentor";
  const [copied, setCopied] = useState(false);

  if (message.status === "failed") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
        AI Mentor is temporarily unavailable{message.error_reason ? `: ${message.error_reason}` : "."}
      </div>
    );
  }

  return (
    <div className={cn("flex gap-3", isMentor ? "justify-start" : "justify-end")}>
      {isMentor && (
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 grid place-items-center text-white flex-shrink-0">
          <Sparkles className="h-4 w-4" />
        </div>
      )}
      <div className={cn("max-w-[80%]", isMentor ? "" : "")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed",
            isMentor
              ? "bg-white border shadow-sm text-slate-800"
              : "bg-slate-900 text-white",
          )}
        >
          {message.content}
        </div>
        {isMentor && message.content && (
          <div className="mt-1.5 flex items-center gap-1 text-slate-400">
            <button
              onClick={() => {
                navigator.clipboard.writeText(message.content);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="p-1 hover:text-slate-700 rounded"
              title="Copy"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => onFeedback(message.id, "helpful")}
              className={cn(
                "p-1 hover:text-emerald-600 rounded",
                message.feedback === "helpful" && "text-emerald-600",
              )}
              title="Helpful"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onFeedback(message.id, "not_helpful")}
              className={cn(
                "p-1 hover:text-red-600 rounded",
                message.feedback === "not_helpful" && "text-red-600",
              )}
              title="Not helpful"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
