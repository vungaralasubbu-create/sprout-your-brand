/**
 * Copilot lead brief — analysis + generators + call notes.
 */
import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Sparkles,
  RefreshCw,
  Mail,
  MessageCircle,
  Phone,
  Send,
  Copy,
  Flame,
  Target,
  Brain,
  AlertTriangle,
  ChevronLeft,
  Loader2,
  Check,
} from "lucide-react";

import {
  analyzeLead,
  generateCopilotMessage,
  saveCallNotes,
  askCopilot,
  getCopilotLeadHistory,
  type CopilotAnalysis,
} from "@/lib/counsellor-copilot/copilot.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/counsellor/copilot/$leadId")({
  component: LeadCopilotBrief,
  head: () => ({ meta: [{ title: "Lead Brief · AI Copilot · Glintr" }] }),
});

function LeadCopilotBrief() {
  const { leadId } = Route.useParams();
  const analyzeFn = useServerFn(analyzeLead);
  const historyFn = useServerFn(getCopilotLeadHistory);
  const qc = useQueryClient();

  const analysisQuery = useQuery({
    queryKey: ["copilot", "analysis", leadId],
    queryFn: () => analyzeFn({ data: { leadId } }),
  });

  const historyQuery = useQuery({
    queryKey: ["copilot", "history", leadId],
    queryFn: () => historyFn({ data: { leadId } }),
  });

  const rerun = useMutation({
    mutationFn: () => analyzeFn({ data: { leadId, force: true } }),
    onSuccess: () => {
      toast.success("AI re-analysed");
      qc.invalidateQueries({ queryKey: ["copilot", "analysis", leadId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const a = analysisQuery.data?.analysis;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/counsellor/copilot"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Copilot
        </Link>
        <Button size="sm" variant="outline" onClick={() => rerun.mutate()} disabled={rerun.isPending}>
          {rerun.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Re-analyse with AI
        </Button>
      </div>

      {analysisQuery.isLoading && (
        <Card className="p-10 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground mt-2">AI is analysing this lead…</p>
        </Card>
      )}
      {analysisQuery.error && (
        <Card className="p-6 border-rose-500/40 bg-rose-500/10">
          <div className="text-sm text-rose-200">{(analysisQuery.error as Error).message}</div>
        </Card>
      )}

      {a && <CopilotOverview a={a} />}
      {a && (
        <div className="grid gap-4 lg:grid-cols-2">
          <SalesScriptCard script={a.sales_script} nextAction={a.next_best_action} />
          <SignalsCard a={a} />
        </div>
      )}

      {a && (
        <Tabs defaultValue="messages" className="w-full">
          <TabsList>
            <TabsTrigger value="messages">Generators</TabsTrigger>
            <TabsTrigger value="notes">Call Notes</TabsTrigger>
            <TabsTrigger value="ask">Ask Copilot</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="messages">
            <MessageGenerators leadId={leadId} />
          </TabsContent>
          <TabsContent value="notes">
            <CallNotesEditor leadId={leadId} onSaved={() => qc.invalidateQueries({ queryKey: ["copilot", "history", leadId] })} />
          </TabsContent>
          <TabsContent value="ask">
            <AskCopilot leadId={leadId} />
          </TabsContent>
          <TabsContent value="history">
            <HistoryPanel data={historyQuery.data} loading={historyQuery.isLoading} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// ============================================================

function CopilotOverview({ a }: { a: CopilotAnalysis }) {
  return (
    <Card className="p-6 bg-gradient-to-br from-primary/10 via-background to-background border-primary/30">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary/80">
            <Sparkles className="h-4 w-4" /> AI Copilot
            {a.hot_lead_alert && (
              <Badge className="bg-rose-500/20 text-rose-200 border-rose-500/40 ml-2">
                <Flame className="h-3 w-3 mr-1" /> Hot Lead Alert
              </Badge>
            )}
          </div>
          <h2 className="text-2xl font-semibold mt-2">{a.headline}</h2>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-3xl">{a.summary}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <Meta label="Buying Intent" value={a.buying_intent.replace(/_/g, " ")} />
        <Meta label="Priority" value={a.priority} />
        <Meta label="Recommended Course" value={a.recommended_course.primary} />
        <Meta label="Expected Revenue" value={`₹${(a.expected_revenue || 0).toLocaleString()}`} />
        <Meta label="Follow-up" value={a.follow_up.timing.replace(/_/g, " ")} />
        <Meta label="Offer" value={a.offer_recommendation.type.replace(/_/g, " ")} />
        <Meta label="Next Best Action" value={a.next_best_action} />
        <Meta label="Signals" value={`${a.buying_signals.length} detected`} />
      </div>
    </Card>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/50 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-medium mt-1 capitalize truncate" title={value}>
        {value || "—"}
      </div>
    </div>
  );
}

function SalesScriptCard({ script, nextAction }: { script: string; nextAction: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" /> Personalised Sales Script
        </h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(script);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
          Copy
        </Button>
      </div>
      <p className="text-sm mt-3 leading-relaxed whitespace-pre-wrap">{script}</p>
      <div className="mt-4 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
        <span className="text-xs uppercase text-primary/80 tracking-wider">Next Best Action</span>
        <div className="mt-1 font-medium">{nextAction}</div>
      </div>
    </Card>
  );
}

function SignalsCard({ a }: { a: CopilotAnalysis }) {
  return (
    <Card className="p-5 space-y-4">
      <Bucket icon={<Flame className="h-4 w-4 text-rose-400" />} label="Buying Signals" items={a.buying_signals} tone="rose" />
      <Bucket icon={<Brain className="h-4 w-4 text-sky-300" />} label="Personality" items={a.personality} tone="sky" />
      <Bucket
        icon={<AlertTriangle className="h-4 w-4 text-amber-300" />}
        label="Predicted Objections"
        items={a.objections}
        tone="amber"
      />
      <div className="rounded-md border border-border/60 p-3">
        <div className="text-xs uppercase text-muted-foreground">Offer Recommendation</div>
        <div className="text-sm font-medium mt-1 capitalize">
          {a.offer_recommendation.type.replace(/_/g, " ")}
        </div>
        <div className="text-xs text-muted-foreground mt-1">{a.offer_recommendation.reason}</div>
      </div>
    </Card>
  );
}

function Bucket({
  icon,
  label,
  items,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  items: string[];
  tone: "rose" | "sky" | "amber";
}) {
  const toneCls =
    tone === "rose"
      ? "bg-rose-500/15 text-rose-100 border-rose-500/30"
      : tone === "sky"
        ? "bg-sky-500/15 text-sky-100 border-sky-500/30"
        : "bg-amber-500/15 text-amber-100 border-amber-500/30";
  return (
    <div>
      <div className="text-xs uppercase text-muted-foreground flex items-center gap-2">
        {icon} {label}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.length === 0 ? (
          <span className="text-xs text-muted-foreground">None detected.</span>
        ) : (
          items.map((s, i) => (
            <Badge key={i} variant="outline" className={toneCls}>
              {s}
            </Badge>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================
// Message Generators
// ============================================================

function MessageGenerators({ leadId }: { leadId: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <GeneratorCard leadId={leadId} channel="email" title="Email" icon={<Mail className="h-4 w-4" />} />
      <GeneratorCard leadId={leadId} channel="whatsapp" title="WhatsApp" icon={<MessageCircle className="h-4 w-4" />} />
      <GeneratorCard leadId={leadId} channel="sms" title="SMS" icon={<Phone className="h-4 w-4" />} />
    </div>
  );
}

function GeneratorCard({
  leadId,
  channel,
  title,
  icon,
}: {
  leadId: string;
  channel: "email" | "whatsapp" | "sms";
  title: string;
  icon: React.ReactNode;
}) {
  const fn = useServerFn(generateCopilotMessage);
  const [intent, setIntent] = React.useState("");
  const [subject, setSubject] = React.useState<string | null>(null);
  const [body, setBody] = React.useState("");

  const gen = useMutation({
    mutationFn: () => fn({ data: { leadId, channel, intent: intent || undefined } }),
    onSuccess: (r) => {
      setSubject(r.subject ?? null);
      setBody(r.body);
      toast.success(`${title} draft ready`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="p-4 flex flex-col">
      <div className="flex items-center gap-2 font-semibold">
        {icon} {title}
      </div>
      <Input
        placeholder="Intent (optional): 'push demo booking'"
        className="mt-2 text-xs"
        value={intent}
        onChange={(e) => setIntent(e.target.value)}
      />
      <Button
        size="sm"
        className="mt-2"
        onClick={() => gen.mutate()}
        disabled={gen.isPending}
      >
        {gen.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
        Generate
      </Button>
      {subject && (
        <div className="mt-3 text-xs">
          <span className="text-muted-foreground">Subject: </span>
          <span className="font-medium">{subject}</span>
        </div>
      )}
      {body && (
        <>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="mt-2 min-h-[160px] text-xs" />
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={() => {
              navigator.clipboard.writeText(subject ? `${subject}\n\n${body}` : body);
              toast.success("Copied");
            }}
          >
            <Copy className="h-4 w-4 mr-2" /> Copy
          </Button>
        </>
      )}
    </Card>
  );
}

// ============================================================
// Call notes
// ============================================================

function CallNotesEditor({ leadId, onSaved }: { leadId: string; onSaved: () => void }) {
  const fn = useServerFn(saveCallNotes);
  const [notes, setNotes] = React.useState("");
  const [outcome, setOutcome] = React.useState("");
  const [result, setResult] = React.useState<{ summary: string; tasks: Array<{ title: string }> } | null>(null);

  const save = useMutation({
    mutationFn: () =>
      fn({ data: { leadId, rawNotes: notes, outcome: outcome || undefined, channel: "call" } }),
    onSuccess: (r) => {
      setResult({ summary: r.summary, tasks: r.tasks });
      setNotes("");
      setOutcome("");
      toast.success("AI summary saved");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="p-4 space-y-3">
      <div className="text-sm font-semibold">Log a call — AI summarises and schedules follow-ups.</div>
      <Textarea
        placeholder="Paste raw call notes here…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="min-h-[140px]"
      />
      <Input
        placeholder="Outcome (e.g. Interested, Follow-up Friday, Not qualified)"
        value={outcome}
        onChange={(e) => setOutcome(e.target.value)}
      />
      <Button onClick={() => save.mutate()} disabled={!notes.trim() || save.isPending}>
        {save.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
        Save & summarise with AI
      </Button>
      {result && (
        <div className="rounded-md border border-primary/30 bg-primary/5 p-3 space-y-2">
          <div>
            <div className="text-xs uppercase text-primary/80">AI Summary</div>
            <div className="text-sm mt-1">{result.summary}</div>
          </div>
          {result.tasks?.length > 0 && (
            <div>
              <div className="text-xs uppercase text-primary/80">Scheduled Tasks</div>
              <ul className="text-sm mt-1 list-disc pl-5">
                {result.tasks.map((t, i) => (
                  <li key={i}>{t.title}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ============================================================
// Ask Copilot
// ============================================================

function AskCopilot({ leadId }: { leadId: string }) {
  const fn = useServerFn(askCopilot);
  const [q, setQ] = React.useState("");
  const [answer, setAnswer] = React.useState("");

  const ask = useMutation({
    mutationFn: () => fn({ data: { leadId, question: q } }),
    onSuccess: (r) => setAnswer(r.answer),
    onError: (e: Error) => toast.error(e.message),
  });

  const suggestions = [
    "Why hasn't this lead enrolled?",
    "What should I say next?",
    "Should I offer a scholarship?",
    "When is the best time to call?",
  ];

  return (
    <Card className="p-4 space-y-3">
      <div className="text-sm font-semibold">Ask the Copilot anything about this lead</div>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((s) => (
          <Button key={s} size="sm" variant="outline" onClick={() => setQ(s)}>
            {s}
          </Button>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask a question…" />
        <Button onClick={() => ask.mutate()} disabled={!q.trim() || ask.isPending}>
          {ask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ask"}
        </Button>
      </div>
      {answer && (
        <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-sm whitespace-pre-wrap">
          {answer}
        </div>
      )}
    </Card>
  );
}

// ============================================================

interface HistoryData {
  callsJson: string;
  messagesJson: string;
  tasksJson: string;
}

function HistoryPanel({ data, loading }: { data: HistoryData | undefined; loading: boolean }) {
  if (loading) return <Loader2 className="h-4 w-4 animate-spin" />;
  if (!data) return null;
  const calls: Array<Record<string, unknown>> = JSON.parse(data.callsJson);
  const msgs: Array<Record<string, unknown>> = JSON.parse(data.messagesJson);
  const tasks: Array<Record<string, unknown>> = JSON.parse(data.tasksJson);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="p-4">
        <div className="text-sm font-semibold mb-2">Calls</div>
        {calls.length === 0 ? <p className="text-xs text-muted-foreground">None yet.</p> : calls.map((c) => (
          <div key={String(c.id)} className="text-xs border-b border-border/40 py-2">
            <div className="text-muted-foreground">{new Date(String(c.created_at)).toLocaleString()}</div>
            <div>{String(c.ai_summary ?? "—")}</div>
          </div>
        ))}
      </Card>
      <Card className="p-4">
        <div className="text-sm font-semibold mb-2">Messages</div>
        {msgs.length === 0 ? <p className="text-xs text-muted-foreground">None yet.</p> : msgs.map((m) => (
          <div key={String(m.id)} className="text-xs border-b border-border/40 py-2">
            <div className="text-muted-foreground">
              {String(m.channel)} · {new Date(String(m.created_at)).toLocaleString()}
            </div>
            {m.subject ? <div className="font-medium">{String(m.subject)}</div> : null}
            <div className="line-clamp-3">{String(m.body ?? "")}</div>
          </div>
        ))}
      </Card>
      <Card className="p-4">
        <div className="text-sm font-semibold mb-2">Tasks</div>
        {tasks.length === 0 ? <p className="text-xs text-muted-foreground">None yet.</p> : tasks.map((t) => (
          <div key={String(t.id)} className="text-xs border-b border-border/40 py-2 flex justify-between">
            <span>{String(t.title)}</span>
            <Badge variant="outline">{String(t.status)}</Badge>
          </div>
        ))}
      </Card>
    </div>
  );
}
