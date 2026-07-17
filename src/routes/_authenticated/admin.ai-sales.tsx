import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  Activity, Bot, MessageSquare, Users, Flame, Zap, HelpCircle,
  Clock, TrendingUp, Handshake, CheckCircle2, RefreshCw, Send,
} from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  salesAgentMetrics,
  salesAgentLeads,
  salesAgentConversation,
  listUnanswered,
  teachAgent,
} from "@/lib/sales-agent/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/ai-sales")({
  component: AiSalesPage,
  head: () => ({
    meta: [
      { title: "AI Sales Agent · Admin · Glintr" },
      { name: "description", content: "Monitor AI counsellor conversations, qualified leads, hot pipeline and teach the assistant." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

function scoreColor(score: string) {
  return score === "hot"
    ? "bg-red-500/15 text-red-600"
    : score === "warm"
    ? "bg-amber-500/15 text-amber-600"
    : score === "cold"
    ? "bg-sky-500/15 text-sky-600"
    : "bg-muted text-muted-foreground";
}

function AiSalesPage() {
  const fetchMetrics = useServerFn(salesAgentMetrics);
  const fetchLeads = useServerFn(salesAgentLeads);
  const fetchConv = useServerFn(salesAgentConversation);
  const fetchUnanswered = useServerFn(listUnanswered);
  const teach = useServerFn(teachAgent);
  const qc = useQueryClient();

  const [openConv, setOpenConv] = useState<string | null>(null);
  const [teachOpen, setTeachOpen] = useState<null | { id?: string; question: string }>(null);
  const [teachForm, setTeachForm] = useState({ topic: "general", answer: "" });

  const metrics = useQuery({
    queryKey: ["admin", "ai-sales", "metrics"],
    queryFn: () => fetchMetrics(),
  });
  const leads = useQuery({
    queryKey: ["admin", "ai-sales", "leads"],
    queryFn: () => fetchLeads({ data: { score: "all", limit: 80 } }),
  });
  const unanswered = useQuery({
    queryKey: ["admin", "ai-sales", "unanswered"],
    queryFn: () => fetchUnanswered(),
  });

  const convDetail = useQuery({
    queryKey: ["admin", "ai-sales", "conversation", openConv],
    queryFn: () => fetchConv({ data: { id: openConv! } }),
    enabled: !!openConv,
  });

  const teachMutation = useMutation({
    mutationFn: (payload: { unansweredId?: string; topic: string; question: string; answer: string }) =>
      teach({ data: { ...payload, keywords: [] } }),
    onSuccess: () => {
      toast.success("Answer added — the AI will use this from now on.");
      qc.invalidateQueries({ queryKey: ["admin", "ai-sales", "unanswered"] });
      setTeachOpen(null);
      setTeachForm({ topic: "general", answer: "" });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed to save answer"),
  });

  const m = metrics.data?.metrics;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary/15 to-lime-500/15 px-2.5 py-1 text-xs font-semibold text-primary">
              <Bot className="w-3.5 h-3.5" /> AI Sales OS
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">AI Sales Agent Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live counsellor performance across web, WhatsApp, Instagram, Messenger and more.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            metrics.refetch();
            leads.refetch();
            unanswered.refetch();
          }}
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        <MetricCard icon={<MessageSquare />} label="Chats today" value={m?.conversationsToday ?? 0} />
        <MetricCard icon={<Users />} label="Qualified" value={m?.qualifiedLeads ?? 0} />
        <MetricCard icon={<Flame />} label="Hot leads" value={m?.hotLeads ?? 0} color="text-red-500" />
        <MetricCard icon={<Handshake />} label="Handovers" value={m?.handovers ?? 0} />
        <MetricCard icon={<CheckCircle2 />} label="Enrollments" value={m?.enrollments ?? 0} color="text-emerald-500" />
        <MetricCard icon={<TrendingUp />} label="Conversion" value={`${m?.conversionRate ?? 0}%`} />
        <MetricCard icon={<HelpCircle />} label="Unanswered" value={m?.openUnanswered ?? 0} color="text-amber-500" />
        <MetricCard icon={<Clock />} label="Follow-ups" value={m?.scheduledFollowups ?? 0} />
      </section>

      <Tabs defaultValue="conversations">
        <TabsList>
          <TabsTrigger value="conversations">
            <Activity className="w-4 h-4 mr-2" /> Conversations
          </TabsTrigger>
          <TabsTrigger value="leads">
            <Users className="w-4 h-4 mr-2" /> Leads
          </TabsTrigger>
          <TabsTrigger value="unanswered">
            <HelpCircle className="w-4 h-4 mr-2" /> Teach the AI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversations" className="mt-4">
          <Card className="p-0 overflow-hidden">
            <div className="grid grid-cols-[1fr_100px_100px_130px_100px] px-4 py-2.5 text-xs font-semibold text-muted-foreground border-b bg-muted/30">
              <div>Contact</div>
              <div>Channel</div>
              <div>Score</div>
              <div>Status</div>
              <div className="text-right">Last</div>
            </div>
            {(metrics.data?.recent ?? []).map((c) => (
              <button
                key={c.id as string}
                onClick={() => setOpenConv(c.id as string)}
                className="grid grid-cols-[1fr_100px_100px_130px_100px] px-4 py-2.5 text-sm border-b hover:bg-accent text-left w-full"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {(c.contact_name as string) ?? (c.contact_email as string) ?? (c.contact_phone as string) ?? "Anonymous visitor"}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {[(c.contact_email as string), (c.contact_phone as string)].filter(Boolean).join(" · ") || (c.handover_reason as string) || "—"}
                  </div>
                </div>
                <div className="text-xs uppercase tracking-wide">{c.channel as string}</div>
                <div>
                  <Badge className={scoreColor(c.lead_score as string)}>{c.lead_score as string}</Badge>
                </div>
                <div className="text-xs">{c.status as string}</div>
                <div className="text-right text-xs text-muted-foreground">
                  {c.last_message_at ? new Date(c.last_message_at as string).toLocaleTimeString() : "—"}
                </div>
              </button>
            ))}
            {!metrics.data?.recent?.length && (
              <div className="p-8 text-center text-sm text-muted-foreground">No conversations yet.</div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="leads" className="mt-4">
          <Card className="p-0 overflow-hidden">
            <div className="grid grid-cols-[1fr_140px_120px_110px_110px] px-4 py-2.5 text-xs font-semibold text-muted-foreground border-b bg-muted/30">
              <div>Lead</div>
              <div>Goal</div>
              <div>Budget</div>
              <div>Score</div>
              <div>Status</div>
            </div>
            {(leads.data?.leads ?? []).map((l) => (
              <div key={l.id as string} className="grid grid-cols-[1fr_140px_120px_110px_110px] px-4 py-2.5 text-sm border-b">
                <div className="min-w-0">
                  <div className="font-medium truncate">{(l.name as string) ?? "Unnamed"}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {[(l.email as string), (l.phone as string), (l.city as string)].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <div className="text-xs truncate">{(l.career_goal as string) ?? "—"}</div>
                <div className="text-xs">{(l.budget as string) ?? "—"}</div>
                <div>
                  <Badge className={scoreColor(l.score as string)}>{l.score as string}</Badge>
                </div>
                <div className="text-xs">{l.status as string}</div>
              </div>
            ))}
            {!leads.data?.leads?.length && (
              <div className="p-8 text-center text-sm text-muted-foreground">No qualified leads yet.</div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="unanswered" className="mt-4">
          <Card className="p-4 mb-4 bg-gradient-to-r from-primary/5 to-lime-500/5">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <div className="font-semibold text-sm">Every answer you add here makes the AI smarter.</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Your response is stored in the curated knowledge base and used verbatim by the counsellor from the next chat onwards.
                </div>
              </div>
            </div>
          </Card>
          <div className="space-y-2">
            {(unanswered.data?.items ?? []).map((u) => (
              <Card key={u.id as string} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs uppercase text-muted-foreground mb-1">{u.status as string}</div>
                    <div className="font-medium text-sm mb-1">{u.question as string}</div>
                    {u.ai_response && (
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        AI said: {u.ai_response as string}
                      </div>
                    )}
                    {u.admin_answer && (
                      <div className="text-xs mt-1 text-emerald-600">
                        You taught: {u.admin_answer as string}
                      </div>
                    )}
                  </div>
                  {u.status !== "answered" && (
                    <Button
                      size="sm"
                      onClick={() => setTeachOpen({ id: u.id as string, question: u.question as string })}
                    >
                      Teach AI
                    </Button>
                  )}
                </div>
              </Card>
            ))}
            {!unanswered.data?.items?.length && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No open questions — you're all caught up.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Conversation drawer */}
      <Dialog open={!!openConv} onOpenChange={(v) => !v && setOpenConv(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Conversation transcript</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
            {(convDetail.data?.messages ?? []).map((msg, i) => (
              <div
                key={i}
                className={
                  msg.role === "user"
                    ? "ml-8 rounded-lg bg-primary/10 p-3 text-sm"
                    : "mr-8 rounded-lg bg-muted p-3 text-sm"
                }
              >
                <div className="text-[10px] uppercase text-muted-foreground mb-1">{msg.role as string}</div>
                <div className="whitespace-pre-wrap">{msg.content as string}</div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Teach dialog */}
      <Dialog open={!!teachOpen} onOpenChange={(v) => !v && setTeachOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Teach the AI Sales Agent</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Question</div>
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">{teachOpen?.question}</div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Topic</label>
              <Input
                value={teachForm.topic}
                onChange={(e) => setTeachForm((s) => ({ ...s, topic: e.target.value }))}
                placeholder="pricing, placement, refund, EMI, curriculum…"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Your answer (used verbatim by the AI)</label>
              <Textarea
                rows={6}
                value={teachForm.answer}
                onChange={(e) => setTeachForm((s) => ({ ...s, answer: e.target.value }))}
                placeholder="Write a clear, concise answer the counsellor should give."
              />
            </div>
            <Button
              className="w-full"
              disabled={!teachForm.answer.trim() || teachMutation.isPending}
              onClick={() =>
                teachMutation.mutate({
                  unansweredId: teachOpen?.id,
                  topic: teachForm.topic || "general",
                  question: teachOpen?.question ?? "",
                  answer: teachForm.answer.trim(),
                })
              }
            >
              <Send className="w-4 h-4 mr-2" /> Save & train
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <Card className="p-3">
      <div className={`w-8 h-8 rounded-lg bg-muted grid place-items-center ${color ?? "text-primary"}`}>
        {icon}
      </div>
      <div className="mt-2 text-xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Card>
  );
}
