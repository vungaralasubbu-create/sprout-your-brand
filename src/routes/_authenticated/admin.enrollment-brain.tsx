/**
 * AI Enrollment Brain — central intelligence dashboard.
 * Access: Super Admin / Admin / Brand Owner / Counsellor.
 */
import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Brain,
  Sparkles,
  Flame,
  TrendingUp,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Send,
  Users,
  Target,
  Phone,
  Mail,
  MessageCircle,
} from "lucide-react";

import {
  getBrainDashboard,
  triggerBrainTick,
  askEnrollmentBrain,
  queueWinBack,
  acknowledgeAlert,
} from "@/lib/enrollment-brain/brain.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/enrollment-brain")({
  component: EnrollmentBrainPage,
  head: () => ({
    meta: [
      { title: "AI Enrollment Brain · Glintr" },
      {
        name: "description",
        content:
          "The central intelligence engine of Glintr — priorities, revenue forecasts, drop-off reasons, real-time alerts and AI decisions for every lead.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
});

interface PriorityLead {
  lead_id: string;
  priority: string;
  urgency: string;
  best_channel: string;
  best_time_window: string;
  recommended_course: string;
  expected_revenue: number;
  expected_close_date: string;
  scholarship_pct: number;
  probability_pct: number;
  health_score: number;
  reasoning: string;
  needs_parent_mode: boolean;
}

interface BrainAlert {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string | null;
  lead_id: string | null;
  created_at: string;
}

interface Forecast {
  expected_revenue: number;
  expected_admissions: number;
  avg_ticket_size: number;
  conversion_rate: number;
  hot_leads: number;
  warm_leads: number;
  breakdown: { today?: number; week?: number; month?: number; quarter?: number } | null;
}

function EnrollmentBrainPage() {
  const dashFn = useServerFn(getBrainDashboard);
  const tickFn = useServerFn(triggerBrainTick);
  const askFn = useServerFn(askEnrollmentBrain);
  const winBackFn = useServerFn(queueWinBack);
  const ackFn = useServerFn(acknowledgeAlert);
  const qc = useQueryClient();

  const q = useQuery({ queryKey: ["brain", "dashboard"], queryFn: () => dashFn() });

  const [question, setQuestion] = React.useState("Who should I call first today?");
  const [answer, setAnswer] = React.useState("");

  const runTick = useMutation({
    mutationFn: () => tickFn({ data: { limit: 15 } }),
    onSuccess: (r) => {
      toast.success(`Brain decided on ${r.decided} of ${r.scanned} leads`);
      qc.invalidateQueries({ queryKey: ["brain", "dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const ask = useMutation({
    mutationFn: () => askFn({ data: { question } }),
    onSuccess: (r) => setAnswer(r.answer),
    onError: (e: Error) => toast.error(e.message),
  });

  const winback = useMutation({
    mutationFn: (days: "7" | "14" | "30") => winBackFn({ data: { inactiveDays: days } }),
    onSuccess: (r) => toast.success(`Queued ${r.queued} win-back messages`),
  });

  const ack = useMutation({
    mutationFn: (id: string) => ackFn({ data: { alertId: id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brain", "dashboard"] }),
  });

  const priorityLeads: PriorityLead[] = q.data ? JSON.parse(q.data.priorityLeadsJson) : [];
  const alerts: BrainAlert[] = q.data ? JSON.parse(q.data.alertsJson) : [];
  const forecast = (q.data?.forecast ?? null) as Forecast | null;
  const dropoffs = q.data?.dropoffs ?? [];

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-8 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary/80">
            <Brain className="h-4 w-4" /> AI Enrollment Brain
          </div>
          <h1 className="text-3xl font-semibold mt-1">The central intelligence of Glintr</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            AI monitors every lead continuously — deciding who to call, what to say, when to
            reach out, which scholarship to offer, and forecasting revenue in real time.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => q.refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button size="sm" onClick={() => runTick.mutate()} disabled={runTick.isPending}>
            {runTick.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Run Brain now
          </Button>
        </div>
      </header>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi label="Expected Revenue (30d)" value={`₹${(forecast?.expected_revenue ?? 0).toLocaleString()}`} accent="text-emerald-400" />
        <Kpi label="Predicted Enrollments" value={forecast?.expected_admissions ?? 0} accent="text-primary" />
        <Kpi label="Avg Ticket Size" value={`₹${(forecast?.avg_ticket_size ?? 0).toLocaleString()}`} />
        <Kpi label="Conversion Rate" value={`${forecast?.conversion_rate ?? 0}%`} />
        <Kpi label="🔥 Hot / Warm" value={`${forecast?.hot_leads ?? 0} / ${forecast?.warm_leads ?? 0}`} accent="text-rose-400" />
      </div>

      {/* Forecast breakdown */}
      {forecast?.breakdown && (
        <Card className="p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" /> Revenue Forecast
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ForecastPill label="Today" value={forecast.breakdown.today ?? 0} />
            <ForecastPill label="This Week" value={forecast.breakdown.week ?? 0} />
            <ForecastPill label="This Month" value={forecast.breakdown.month ?? 0} />
            <ForecastPill label="Quarter" value={forecast.breakdown.quarter ?? 0} />
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Priority pipeline */}
        <Card className="p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Flame className="h-4 w-4 text-rose-400" /> Today's Priority Pipeline
            </h2>
            <span className="text-xs text-muted-foreground">Ranked by AI</span>
          </div>
          {q.isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : priorityLeads.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No brain decisions yet. Click <b>Run Brain now</b> to analyse active leads.
            </div>
          ) : (
            <div className="space-y-2">
              {priorityLeads.slice(0, 15).map((l) => (
                <Link
                  key={l.lead_id}
                  to="/counsellor/copilot/$leadId"
                  params={{ leadId: l.lead_id }}
                  className="flex items-center gap-3 rounded-lg border border-border/60 p-3 hover:bg-muted/40"
                >
                  <PriorityBadge priority={l.priority} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {l.recommended_course || "—"}{" "}
                      {l.needs_parent_mode && (
                        <Badge variant="outline" className="ml-1 text-[10px]">
                          Parent Mode
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{l.reasoning}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <ChannelBadge channel={l.best_channel} />
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {l.best_time_window}
                      </Badge>
                      {l.scholarship_pct > 0 && (
                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 border-amber-500/40 text-amber-200">
                          {l.scholarship_pct}% scholarship
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-muted-foreground">Probability</div>
                    <div
                      className={`text-lg font-bold ${
                        l.probability_pct >= 70 ? "text-emerald-400" : l.probability_pct >= 40 ? "text-amber-300" : "text-muted-foreground"
                      }`}
                    >
                      {l.probability_pct}%
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      ₹{Number(l.expected_revenue || 0).toLocaleString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Alerts + Ask brain */}
        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="font-semibold flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-300" /> Real-time Alerts
            </h2>
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">All clear.</p>
            ) : (
              <div className="space-y-2">
                {alerts.slice(0, 8).map((a) => (
                  <div key={a.id} className="rounded-md border border-border/60 p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{a.title}</span>
                      <Button size="icon" variant="ghost" onClick={() => ack.mutate(a.id)}>
                        ✓
                      </Button>
                    </div>
                    {a.message && <div className="text-xs text-muted-foreground">{a.message}</div>}
                    {a.lead_id && (
                      <Link
                        to="/counsellor/copilot/$leadId"
                        params={{ leadId: a.lead_id }}
                        className="text-xs text-primary hover:underline"
                      >
                        Open lead →
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <h2 className="font-semibold flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" /> Ask the Brain
            </h2>
            <div className="flex gap-2">
              <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Who is likely to enroll today?" />
              <Button onClick={() => ask.mutate()} disabled={ask.isPending || !question.trim()}>
                {ask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {[
                "Who should I call first?",
                "Which lead is easiest to close?",
                "Which lead needs scholarship?",
                "Who is likely to enroll today?",
              ].map((s) => (
                <Button key={s} size="sm" variant="outline" onClick={() => setQuestion(s)} className="text-[11px] h-7">
                  {s}
                </Button>
              ))}
            </div>
            {answer && (
              <div className="mt-3 rounded-md border border-border/60 bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                {answer}
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="font-semibold flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-primary" /> Drop-off Analysis
          </h2>
          {dropoffs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No drop-offs detected yet.</p>
          ) : (
            <div className="space-y-2">
              {dropoffs.map((d) => {
                const total = dropoffs.reduce((s, x) => s + x.count, 0);
                const pct = Math.round((d.count / total) * 100);
                return (
                  <div key={d.reason}>
                    <div className="flex justify-between text-sm">
                      <span className="truncate max-w-[70%]">{d.reason}</span>
                      <span className="text-muted-foreground">{pct}%</span>
                    </div>
                    <div className="h-1.5 mt-1 rounded bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-primary" /> Win-back Campaigns
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            Automatically send personalised nurture messages to inactive leads.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => winback.mutate("7")} disabled={winback.isPending}>
              Inactive 7d
            </Button>
            <Button size="sm" variant="outline" onClick={() => winback.mutate("14")} disabled={winback.isPending}>
              Inactive 14d
            </Button>
            <Button size="sm" variant="outline" onClick={() => winback.mutate("30")} disabled={winback.isPending}>
              Inactive 30d
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold mt-2 ${accent ?? ""}`}>{value}</div>
    </Card>
  );
}

function ForecastPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/60 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold mt-1 text-emerald-400">
        ₹{value.toLocaleString()}
      </div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const cls: Record<string, string> = {
    critical: "bg-rose-500/20 text-rose-200 border-rose-500/40",
    very_high: "bg-rose-500/15 text-rose-100 border-rose-500/30",
    high: "bg-amber-500/20 text-amber-200 border-amber-500/40",
    medium: "bg-sky-500/15 text-sky-200 border-sky-500/30",
    low: "bg-muted text-muted-foreground",
    dormant: "bg-muted/50 text-muted-foreground",
  };
  return (
    <Badge variant="outline" className={`capitalize ${cls[priority] ?? "bg-muted"}`}>
      {priority.replace(/_/g, " ")}
    </Badge>
  );
}

function ChannelBadge({ channel }: { channel: string }) {
  const icon =
    channel === "phone" || channel === "parent_call" ? <Phone className="h-3 w-3 mr-1" /> :
    channel === "whatsapp" ? <MessageCircle className="h-3 w-3 mr-1" /> :
    channel === "email" ? <Mail className="h-3 w-3 mr-1" /> :
    <Send className="h-3 w-3 mr-1" />;
  return (
    <Badge variant="outline" className="text-[10px] capitalize">
      {icon}
      {channel.replace(/_/g, " ")}
    </Badge>
  );
}
