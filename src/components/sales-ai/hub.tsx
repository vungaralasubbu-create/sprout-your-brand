/**
 * Sales AI Operating System — hub UI for the Sales Partner Dashboard.
 *
 * Composes agent cards, lead priority board, timeline, command bar,
 * cadence generator, negotiation guardrails, proposal builder,
 * forecast, leaderboard and admin controls into a single workspace.
 */

import { useMemo, useState } from "react";
import { useMemo, useState } from "react";
import {
  Sparkles, Target, MessageSquare, Clock, Headphones, ShieldQuestion, FileText,
  ScrollText, Calendar, Handshake, CheckCircle2, Database, LineChart, Trophy,
  Megaphone, GraduationCap, Send, Bot, User, ArrowRight, Zap, Flame, Snowflake,
  Sun, Copy, RefreshCw, Settings2, ListChecks, BarChart3, Search, Command,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

import {
  SALES_AGENTS, OBJECTIONS, LEAD_STAGES,
  type SalesAgent, type SalesAgentId, type MessageChannel,
} from "@/lib/sales-ai/catalog";
import {
  useSalesLeads, useSalesAgents, useAdminControls, useCommandHistory,
  setAgentState, bumpAgent, setLeadStage, addLeadEvent, upsertLead, pushCommandHistory,
  setAdminControls, type SalesLead,
} from "@/lib/sales-ai/storage";
import {
  qualifyLead, generateMessage, generateCadence, buildCallBrief, buildPostCallSummary,
  responsesForObjection, buildProposal, generateScript, suggestNegotiation,
  detectClosingSignal, forecastRevenue, performanceRecommendations, runCommand,
  timeAgo, priceForProgram,
} from "@/lib/sales-ai/engine";

const AGENT_ICONS: Record<string, typeof Sparkles> = {
  Target, MessageSquare, Clock, Headphones, ShieldQuestion, FileText, ScrollText,
  Calendar, Handshake, CheckCircle2, Database, LineChart, Trophy, Megaphone, GraduationCap,
};

function IntentPill({ intent }: { intent: "hot" | "warm" | "cold" }) {
  const cfg = {
    hot: { icon: Flame, label: "Hot", bg: "rgba(244,114,182,0.18)", fg: "#f472b6" },
    warm: { icon: Sun, label: "Warm", bg: "rgba(250,204,21,0.18)", fg: "#facc15" },
    cold: { icon: Snowflake, label: "Cold", bg: "rgba(96,165,250,0.18)", fg: "#60a5fa" },
  }[intent];
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider" style={{ backgroundColor: cfg.bg, color: cfg.fg }}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Top strip — KPIs
// ---------------------------------------------------------------------------

function KpiStrip() {
  const leads = useSalesLeads();
  const admin = useAdminControls();
  const enriched = useMemo(() => leads.map((l) => ({ l, r: qualifyLead(l, admin) })), [leads, admin]);
  const hot = enriched.filter((x) => x.r.intent === "hot").length;
  const warm = enriched.filter((x) => x.r.intent === "warm").length;
  const f = forecastRevenue(leads, 70);
  const idleOver30 = leads.filter((l) => Date.now() - l.updatedAt > 30 * 60000 && l.stage === "New").length;

  const kpis = [
    { label: "Hot leads", value: hot, sub: `${warm} warm · ${leads.length} total`, icon: Flame, color: "#f472b6" },
    { label: "Pipeline (weighted)", value: `₹${(f.monthly / 1000).toFixed(0)}k`, sub: `Daily ₹${(f.daily / 1000).toFixed(1)}k`, icon: LineChart, color: "#4ade80" },
    { label: "Est. commission", value: `₹${(f.commission / 1000).toFixed(0)}k`, sub: `${f.commissionPercent}% share`, icon: Trophy, color: "#facc15" },
    { label: "SLA breaches", value: idleOver30, sub: `> ${admin.escalation.responseTimeMinutes}m untouched`, icon: Zap, color: "#fb7185" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {kpis.map((k) => (
        <Card key={k.label} className="border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-white/50">{k.label}</span>
            <k.icon className="h-4 w-4" style={{ color: k.color }} />
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">{k.value}</div>
          <div className="mt-1 text-xs text-white/50">{k.sub}</div>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Command bar
// ---------------------------------------------------------------------------

function CommandBar() {
  const leads = useSalesLeads();
  const admin = useAdminControls();
  const history = useCommandHistory();
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);

  const suggestions = [
    "Who should I call first today?",
    "Which lead is most likely to convert?",
    `Generate WhatsApp message for ${leads[0]?.name.split(" ")[0] ?? "Rahul"}`,
    `Prepare me for my next call with ${leads[0]?.name.split(" ")[0] ?? "Priya"}`,
    "Forecast monthly revenue",
  ];

  const run = (text: string) => {
    if (!text.trim()) return;
    setThinking(true);
    setTimeout(() => {
      const res = runCommand(text, leads, admin);
      setAnswer(res.answer);
      pushCommandHistory({ q: text, a: res.answer });
      bumpAgent("crm", 1);
      setThinking(false);
    }, 200);
  };

  return (
    <Card className="border-white/10 bg-gradient-to-br from-cyan-500/10 via-transparent to-lime-500/10 p-5">
      <div className="mb-3 flex items-center gap-2 text-sm text-white/70">
        <Command className="h-4 w-4 text-cyan-300" />
        <span className="font-medium text-white">Ask the Sales AI Director</span>
        <span className="text-white/40">— natural-language commands</span>
      </div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); run(q); setQ(""); }}>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. Generate a WhatsApp message for Rahul about the AI Engineering Bootcamp"
          className="border-white/10 bg-black/40 text-white placeholder:text-white/40"
        />
        <Button type="submit" disabled={thinking} className="bg-cyan-400 text-black hover:bg-cyan-300">
          {thinking ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button key={s} onClick={() => run(s)} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70 hover:bg-white/10">
            {s}
          </button>
        ))}
      </div>
      <AnimatePresence>
        {answer && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 rounded-2xl border border-cyan-400/20 bg-black/40 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-cyan-300"><Bot className="h-3.5 w-3.5" /> AI Director</div>
            <pre className="whitespace-pre-wrap font-sans text-sm text-white/90">{answer}</pre>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(answer); toast.success("Copied"); }}>
                <Copy className="mr-1 h-3.5 w-3.5" />Copy
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {history.length > 0 && (
        <div className="mt-4">
          <div className="mb-1 text-xs uppercase tracking-wider text-white/40">Recent</div>
          <div className="flex flex-wrap gap-2">
            {history.slice(0, 5).map((h) => (
              <button key={h.id} onClick={() => run(h.q)} className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/60 hover:bg-white/5">
                <User className="mr-1 inline h-3 w-3" />
                {h.q.length > 40 ? `${h.q.slice(0, 40)}…` : h.q}
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Agent grid
// ---------------------------------------------------------------------------

function AgentGrid({ onOpen }: { onOpen: (id: SalesAgentId) => void }) {
  const agents = useSalesAgents();
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {SALES_AGENTS.map((a) => {
        const Icon = AGENT_ICONS[a.icon] ?? Sparkles;
        const state = agents[a.id];
        const enabled = state?.enabled ?? true;
        return (
          <Card key={a.id} className="group border-white/10 bg-white/[0.03] p-4 transition hover:border-white/25">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border" style={{ borderColor: `${a.color}55`, backgroundColor: `${a.color}18`, color: a.color }}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-white">{a.name}</div>
                    <div className="text-[11px] uppercase tracking-wider text-white/40">{a.role}</div>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(v) => { setAgentState(a.id, { enabled: v }); toast.success(`${a.name} ${v ? "enabled" : "paused"}`); }}
                    aria-label={`Toggle ${a.name}`}
                  />
                </div>
                <p className="mt-2 line-clamp-3 text-xs text-white/60">{a.purpose}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {a.outputs.slice(0, 4).map((o) => (
                    <span key={o} className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] text-white/60">{o}</span>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-white/40">
                  <span>{state ? `${state.runs} runs · ${state.timeSavedMinutes} min saved` : "Ready"}</span>
                  <button onClick={() => onOpen(a.id)} className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200">Open <ArrowRight className="h-3 w-3" /></button>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Priority board — leads
// ---------------------------------------------------------------------------

function PriorityBoard({ onSelect }: { onSelect: (id: string) => void }) {
  const leads = useSalesLeads();
  const admin = useAdminControls();
  const ranked = useMemo(
    () => leads.map((l) => ({ lead: l, r: qualifyLead(l, admin) })).sort((a, b) => b.r.priority - a.r.priority),
    [leads, admin],
  );
  return (
    <Card className="border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-white"><Target className="h-4 w-4 text-pink-300" /> Priority Queue</div>
        <span className="text-xs text-white/40">Powered by Lead Qualification AI</span>
      </div>
      <div className="space-y-2">
        {ranked.map(({ lead, r }) => (
          <button key={lead.id} onClick={() => onSelect(lead.id)} className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3 text-left hover:border-cyan-400/40 hover:bg-white/[0.05]">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-cyan-400/30 to-lime-400/20 text-xs font-semibold text-white">
              {lead.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-white">{lead.name}</span>
                <IntentPill intent={r.intent} />
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/60">{lead.stage}</span>
              </div>
              <div className="mt-0.5 truncate text-xs text-white/50">{lead.program} · {r.reasons.slice(0, 2).join(" · ")}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-white">{r.score}</div>
              <div className="text-[10px] uppercase text-white/40">score</div>
            </div>
            <div className="hidden text-right md:block">
              <div className="text-xs text-white/70">₹{r.expectedRevenue.toLocaleString()}</div>
              <div className="text-[10px] text-white/40">{r.bestTimeToContact}</div>
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Lead detail workspace
// ---------------------------------------------------------------------------

function LeadWorkspace({ lead }: { lead: SalesLead }) {
  const admin = useAdminControls();
  const q = qualifyLead(lead, admin);
  const [channel, setChannel] = useState<MessageChannel>("whatsapp");
  const [callNotes, setCallNotes] = useState("");
  const [discount, setDiscount] = useState(0);
  const [scholarship, setScholarship] = useState(10);
  const [objectionId, setObjectionId] = useState(OBJECTIONS[0].id);

  const message = generateMessage(lead, channel, q.intent);
  const cadence = generateCadence(lead, q.intent);
  const brief = buildCallBrief(lead);
  const proposal = buildProposal(lead, admin, { discountPercent: discount, scholarshipPercent: scholarship });
  const negotiation = suggestNegotiation(lead, admin);
  const closing = detectClosingSignal(lead);
  const objectionResponses = responsesForObjection(objectionId);

  const stageIdx = LEAD_STAGES.indexOf(lead.stage);

  return (
    <Card className="border-white/10 bg-white/[0.03] p-5">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-white/10 pb-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-cyan-400/30 to-lime-400/20 text-sm font-semibold text-white">
            {lead.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-white">{lead.name}</span>
              <IntentPill intent={q.intent} />
              <Badge variant="outline" className="border-white/15 text-[11px] text-white/70">{lead.stage}</Badge>
            </div>
            <div className="text-xs text-white/50">{lead.program} · Source: {lead.source} · Updated {timeAgo(lead.updatedAt)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={lead.stage} onValueChange={(v) => setLeadStage(lead.id, v as (typeof LEAD_STAGES)[number])}>
            <SelectTrigger className="w-40 border-white/15 bg-black/40 text-xs text-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LEAD_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-right">
            <div className="text-lg font-semibold text-white">{q.score}</div>
            <div className="text-[10px] uppercase text-white/40">Lead score</div>
          </div>
        </div>
      </div>

      {/* Timeline strip */}
      <div className="my-4 flex items-center gap-2 overflow-x-auto pb-1">
        {LEAD_STAGES.filter((s) => s !== "Lost").map((s, i) => (
          <div key={s} className="flex items-center gap-2 whitespace-nowrap">
            <div className={`h-2 w-2 rounded-full ${i <= stageIdx ? "bg-cyan-400" : "bg-white/15"}`} />
            <span className={`text-[11px] uppercase tracking-wider ${i <= stageIdx ? "text-white" : "text-white/40"}`}>{s}</span>
            {i < LEAD_STAGES.filter((x) => x !== "Lost").length - 1 && <span className="text-white/20">·</span>}
          </div>
        ))}
      </div>

      <Tabs defaultValue="conversation">
        <TabsList className="flex flex-wrap gap-1 bg-transparent">
          <TabsTrigger value="conversation">Conversation</TabsTrigger>
          <TabsTrigger value="cadence">Cadence</TabsTrigger>
          <TabsTrigger value="call">Call Coach</TabsTrigger>
          <TabsTrigger value="objections">Objections</TabsTrigger>
          <TabsTrigger value="proposal">Proposal</TabsTrigger>
          <TabsTrigger value="negotiation">Negotiation</TabsTrigger>
          <TabsTrigger value="closing">Closing</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* Conversation */}
        <TabsContent value="conversation" className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {(["whatsapp", "email", "sms", "linkedin", "instagram", "telegram"] as MessageChannel[]).map((c) => (
              <button key={c} onClick={() => setChannel(c)} className={`rounded-full border px-3 py-1 text-xs capitalize ${channel === c ? "border-cyan-400 bg-cyan-400/10 text-cyan-200" : "border-white/10 bg-white/[0.03] text-white/60"}`}>
                {c}
              </button>
            ))}
          </div>
          <Textarea readOnly value={message} className="min-h-[140px] border-white/10 bg-black/40 text-sm text-white/90" />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => { navigator.clipboard.writeText(message); toast.success("Message copied"); bumpAgent("conversation", 3); }} className="bg-cyan-400 text-black hover:bg-cyan-300">
              <Copy className="mr-1 h-3.5 w-3.5" /> Copy
            </Button>
            <Button size="sm" variant="outline" className="border-white/15 text-white" onClick={() => {
              addLeadEvent(lead.id, { kind: "message", channel, by: "partner", summary: `Sent ${channel} message via Conversation AI`, detail: message });
              bumpAgent("conversation", 3);
              toast.success("Logged to timeline");
            }}>
              Log as sent
            </Button>
          </div>
        </TabsContent>

        {/* Cadence */}
        <TabsContent value="cadence" className="mt-4">
          <div className="space-y-2">
            {cadence.map((step, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-cyan-400/15 text-xs font-semibold text-cyan-200">{i + 1}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{step.action}</div>
                  <div className="text-xs text-white/50">{step.detail}</div>
                </div>
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase text-white/60">{step.channel}</span>
                <span className="text-xs text-white/40">+{step.offsetHours}h</span>
              </div>
            ))}
          </div>
          <Button size="sm" className="mt-3 bg-lime-400 text-black hover:bg-lime-300" onClick={() => {
            cadence.forEach((s) => addLeadEvent(lead.id, { kind: "task", channel: s.channel === "call" ? "call" : s.channel, by: "ai", summary: `Follow-Up AI: ${s.action}`, detail: s.detail }));
            bumpAgent("follow-up", 5);
            toast.success("Cadence scheduled — 4 steps added to timeline");
          }}>
            <ListChecks className="mr-1 h-3.5 w-3.5" /> Activate cadence
          </Button>
        </TabsContent>

        {/* Call coach */}
        <TabsContent value="call" className="mt-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="mb-1 text-xs uppercase tracking-wider text-white/40">Pre-call brief</div>
              <p className="text-sm text-white/85">{brief.summary}</p>
              <div className="mt-2 text-xs text-white/60"><strong className="text-white/80">Interests:</strong> {brief.interests.join(", ")}</div>
              <div className="mt-1 text-xs text-white/60"><strong className="text-white/80">Likely objections:</strong> {brief.likelyObjections.join(", ")}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="mb-1 text-xs uppercase tracking-wider text-white/40">Suggested script</div>
              <p className="text-sm text-white/85">{brief.suggestedScript}</p>
            </div>
          </div>
          <div>
            <div className="mb-1 text-xs uppercase tracking-wider text-white/40">Post-call notes</div>
            <Textarea value={callNotes} onChange={(e) => setCallNotes(e.target.value)} placeholder="What was discussed? Objections? Next step?" className="min-h-[100px] border-white/10 bg-black/40 text-sm text-white/90" />
            <Button size="sm" className="mt-2 bg-cyan-400 text-black hover:bg-cyan-300" onClick={() => {
              const s = buildPostCallSummary(lead, callNotes);
              addLeadEvent(lead.id, { kind: "call", channel: "call", by: "partner", summary: `Call logged: ${s.summary}`, detail: s.actions.join(" · ") });
              bumpAgent("call-coach", 5);
              toast.success("Call summary logged");
              setCallNotes("");
            }}>Log call</Button>
          </div>
        </TabsContent>

        {/* Objections */}
        <TabsContent value="objections" className="mt-4">
          <div className="flex flex-wrap gap-2">
            {OBJECTIONS.map((o) => (
              <button key={o.id} onClick={() => setObjectionId(o.id)} className={`rounded-full border px-3 py-1 text-xs ${objectionId === o.id ? "border-orange-400 bg-orange-400/10 text-orange-200" : "border-white/10 bg-white/[0.03] text-white/60"}`}>
                {o.title}
              </button>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            {objectionResponses.map((r, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white/85">
                <span className="mr-2 rounded-full bg-orange-400/15 px-2 py-0.5 text-[10px] font-semibold text-orange-200">Option {i + 1}</span>
                {r}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Proposal */}
        <TabsContent value="proposal" className="mt-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="text-xs uppercase tracking-wider text-white/40">Discount</div>
              <div className="mt-1 text-lg font-semibold text-white">{discount}%</div>
              <Slider min={0} max={admin.maxDiscountPercent} step={1} value={[discount]} onValueChange={([v]) => setDiscount(v)} />
              <div className="mt-1 text-[10px] text-white/40">Cap {admin.maxDiscountPercent}%</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="text-xs uppercase tracking-wider text-white/40">Scholarship</div>
              <div className="mt-1 text-lg font-semibold text-white">{scholarship}%</div>
              <Slider min={0} max={admin.maxScholarshipPercent} step={1} value={[scholarship]} onValueChange={([v]) => setScholarship(v)} />
              <div className="mt-1 text-[10px] text-white/40">Cap {admin.maxScholarshipPercent}%</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="text-xs uppercase tracking-wider text-white/40">Program price</div>
              <div className="mt-1 text-lg font-semibold text-white">₹{priceForProgram(lead.program).toLocaleString()}</div>
              <div className="mt-1 text-[10px] text-white/40">Base sticker price</div>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="mb-2 text-sm font-semibold text-white">{proposal.headline}</div>
            <div className="space-y-1 text-sm">
              {proposal.feeBreakdown.map((r) => (
                <div key={r.label} className="flex justify-between border-b border-white/5 py-1 text-white/80 last:border-0 last:pt-2 last:font-semibold last:text-white">
                  <span>{r.label}</span>
                  <span className={r.amount < 0 ? "text-lime-300" : ""}>{r.amount < 0 ? "− " : ""}₹{Math.abs(r.amount).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <div className="text-xs uppercase tracking-wider text-white/40">EMI options</div>
              <div className="mt-1 grid gap-2 md:grid-cols-3">
                {proposal.emiOptions.map((e) => (
                  <div key={e.months} className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-center">
                    <div className="text-sm font-semibold text-white">₹{e.monthly.toLocaleString()}/mo</div>
                    <div className="text-[10px] text-white/50">{e.months} months · {e.interest === 0 ? "0% (no-cost)" : `${e.interest}% p.a.`}</div>
                  </div>
                ))}
              </div>
            </div>
            <Button size="sm" className="mt-3 bg-cyan-400 text-black hover:bg-cyan-300" onClick={() => {
              addLeadEvent(lead.id, { kind: "proposal", channel: "email", by: "ai", summary: `Proposal generated · Scholarship ${proposal.scholarship.percent}%`, detail: `Net ₹${proposal.feeBreakdown.at(-1)?.amount.toLocaleString()}` });
              upsertLead({ ...lead, stage: "Proposal Sent" });
              bumpAgent("proposal", 8);
              toast.success("Proposal sent · stage moved to Proposal Sent");
            }}>Send proposal</Button>
          </div>
        </TabsContent>

        {/* Negotiation */}
        <TabsContent value="negotiation" className="mt-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="mb-2 text-xs uppercase tracking-wider text-white/40">Suggested offer</div>
              <div className="space-y-1 text-sm text-white/80">
                <div>Scholarship: <span className="text-white">{negotiation.scholarshipPercent}%</span></div>
                <div>Discount: <span className="text-white">{negotiation.discountPercent}%</span></div>
                <div>EMI: <span className="text-white">{negotiation.emiMonths} months</span></div>
                {negotiation.bonus && <div>Bonus: <span className="text-white">{negotiation.bonus}</span></div>}
                {negotiation.upsell && <div>Upsell: <span className="text-white">{negotiation.upsell}</span></div>}
                {negotiation.crossSell && <div>Cross-sell: <span className="text-white">{negotiation.crossSell}</span></div>}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="mb-2 text-xs uppercase tracking-wider text-white/40">Guardrails</div>
              <div className="space-y-1 text-sm text-white/80">
                <div className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-lime-300" /> Max discount {admin.maxDiscountPercent}%</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-lime-300" /> Max scholarship {admin.maxScholarshipPercent}%</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-lime-300" /> EMI {admin.emiRules.minMonths}–{admin.emiRules.maxMonths}m · {admin.emiRules.zeroCostMonths}m no-cost</div>
                <div className="mt-2 text-xs text-white/50">{negotiation.reason}</div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Closing */}
        <TabsContent value="closing" className="mt-4">
          <div className="rounded-2xl border border-lime-400/20 bg-lime-400/5 p-4">
            <div className="text-xs uppercase tracking-wider text-lime-200">Closing AI recommends</div>
            <div className="mt-1 text-lg font-semibold text-white capitalize">{closing.action.replace("-", " ")}</div>
            <div className="mt-1 text-sm text-white/70">{closing.reason}</div>
          </div>
        </TabsContent>

        {/* Timeline */}
        <TabsContent value="timeline" className="mt-4">
          <div className="space-y-2">
            {lead.timeline.map((t) => (
              <div key={t.id} className="flex gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
                <div className="w-16 shrink-0 text-[10px] uppercase text-white/40">{timeAgo(t.at)}</div>
                <div className="flex-1">
                  <div className="text-sm text-white">{t.summary}</div>
                  {t.detail && <div className="mt-0.5 text-xs text-white/50">{t.detail}</div>}
                </div>
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase text-white/60">{t.kind}</span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Marketing / Learning / Scripts panels
// ---------------------------------------------------------------------------

function MarketingPanel() {
  const [topic, setTopic] = useState("AI Engineering Bootcamp");
  const [channel, setChannel] = useState("linkedin");
  const message = useMemo(() => {
    const first = "Hey there";
    switch (channel) {
      case "linkedin":
        return `Just watched a fresher land a ₹18 LPA offer after 12 weeks in the ${topic} at Glintr.\n\nOne thing separated her: relentless follow-up on internships.\n\nComment "roadmap" and I'll DM the 90-day plan.`;
      case "instagram":
        return `Swipe →\n1️⃣ Career gap? Fix it in 12 weeks.\n2️⃣ ${topic} · outcomes-based · placement guarantee.\n3️⃣ DM "start" for the roadmap.`;
      case "whatsapp":
        return `📣 ${topic} · new cohort opens Monday. First 20 seats get a ₹15,000 early-bird scholarship. Reply YES for the fee sheet.`;
      case "facebook":
        return `${topic} · outcomes we're proud of ↓\n• 320 admissions in Q3\n• 82% placement inside 6 months\n• Median uplift 68%\n\nBook a career call — link in bio.`;
      case "reel":
        return `Hook (0-3s): "This student went from 4L to 18L in 12 weeks."\nBeat (3-8s): show program modules.\nBeat (8-15s): show hiring partners.\nCTA (15-20s): "Comment ROADMAP for the plan."`;
      case "poster":
        return `Headline: "12 weeks. 18 LPA. Real placements."\nSub: "${topic} cohort — new batch this Monday."\nCTA: "Book a career call."`;
      default:
        return `Subject: ${topic} — your career roadmap inside\n\nHi ${first}, opening 20 seats for the ${topic} cohort. Attaching outcomes, fee sheet + 3 alumni stories.`;
    }
  }, [topic, channel]);

  return (
    <Card className="border-white/10 bg-white/[0.03] p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><Megaphone className="h-4 w-4 text-pink-300" /> Marketing AI</div>
      <div className="grid gap-2 md:grid-cols-2">
        <Input value={topic} onChange={(e) => setTopic(e.target.value)} className="border-white/10 bg-black/40 text-white" />
        <Select value={channel} onValueChange={setChannel}>
          <SelectTrigger className="border-white/15 bg-black/40 text-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["linkedin", "instagram", "whatsapp", "facebook", "reel", "poster", "email"].map((c) => (
              <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Textarea readOnly value={message} className="mt-3 min-h-[160px] border-white/10 bg-black/40 text-sm text-white/90" />
      <Button size="sm" className="mt-2 bg-cyan-400 text-black hover:bg-cyan-300" onClick={() => { navigator.clipboard.writeText(message); toast.success("Copied"); bumpAgent("marketing", 4); }}>
        <Copy className="mr-1 h-3.5 w-3.5" /> Copy
      </Button>
    </Card>
  );
}

function LearningPanel() {
  const quizzes = [
    { q: "What is the #1 driver of lead-to-admission conversion?", a: "Speed to lead — a first response inside 30 minutes typically converts 4× better." },
    { q: "How do you handle 'need parent's approval'?", a: "Offer a joint call, share parent-facing FAQs (fees, safety, placements), and send one alumni-parent testimonial." },
    { q: "When should you push for close?", a: "When the lead is in Negotiation with 2+ inbound signals, or has consumed the proposal + testimonials." },
  ];
  return (
    <Card className="border-white/10 bg-white/[0.03] p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><GraduationCap className="h-4 w-4 text-sky-300" /> Learning AI · Daily drills</div>
      <div className="space-y-2">
        {quizzes.map((q, i) => (
          <details key={i} className="rounded-xl border border-white/10 bg-black/30 p-3">
            <summary className="cursor-pointer text-sm font-medium text-white">Drill {i + 1} · {q.q}</summary>
            <div className="mt-2 text-sm text-white/70">{q.a}</div>
          </details>
        ))}
      </div>
    </Card>
  );
}

function ScriptsPanel() {
  const kinds = ["phone", "zoom", "college", "corporate", "parents", "career"] as const;
  const [kind, setKind] = useState<(typeof kinds)[number]>("phone");
  const s = generateScript(kind);
  return (
    <Card className="border-white/10 bg-white/[0.03] p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><ScrollText className="h-4 w-4 text-fuchsia-300" /> Sales Script AI</div>
      <div className="flex flex-wrap gap-2">
        {kinds.map((k) => (
          <button key={k} onClick={() => setKind(k)} className={`rounded-full border px-3 py-1 text-xs capitalize ${kind === k ? "border-cyan-400 bg-cyan-400/10 text-cyan-200" : "border-white/10 bg-white/[0.03] text-white/60"}`}>{k}</button>
        ))}
      </div>
      <div className="mt-3 text-sm font-semibold text-white">{s.title}</div>
      <div className="mt-2 space-y-2">
        {s.sections.map((sec) => (
          <div key={sec.heading} className="rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="text-xs uppercase tracking-wider text-white/40">{sec.heading}</div>
            <div className="mt-1 text-sm text-white/85">{sec.body}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Forecast + Coach + Leaderboard
// ---------------------------------------------------------------------------

function ForecastPanel() {
  const leads = useSalesLeads();
  const f = forecastRevenue(leads);
  const cells = [
    { label: "Daily admissions", value: `${Math.max(0, Math.round(f.daily / 90000))}` },
    { label: "Weekly admissions", value: `${Math.max(1, Math.round(f.weekly / 90000))}` },
    { label: "Monthly admissions", value: `${Math.max(1, Math.round(f.monthly / 90000))}` },
    { label: "Monthly revenue", value: `₹${(f.monthly / 100000).toFixed(1)}L` },
    { label: `Commission (${f.commissionPercent}%)`, value: `₹${(f.commission / 100000).toFixed(1)}L` },
    { label: "Pipeline value", value: `₹${(f.totalPipeline / 100000).toFixed(1)}L` },
  ];
  return (
    <Card className="border-white/10 bg-white/[0.03] p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><LineChart className="h-4 w-4 text-lime-300" /> Revenue Forecast AI</div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {cells.map((c) => (
          <div key={c.label} className="rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="text-xs uppercase tracking-wider text-white/40">{c.label}</div>
            <div className="mt-1 text-lg font-semibold text-white">{c.value}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CoachPanel() {
  const leads = useSalesLeads();
  const recs = performanceRecommendations(leads);
  return (
    <Card className="border-white/10 bg-white/[0.03] p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><Trophy className="h-4 w-4 text-amber-300" /> Performance Coach AI</div>
      <div className="space-y-2">
        {recs.map((r, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
            <span className={`mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${r.severity === "high" ? "bg-pink-400/15 text-pink-300" : r.severity === "medium" ? "bg-amber-400/15 text-amber-300" : "bg-white/10 text-white/60"}`}>{r.severity}</span>
            <div>
              <div className="text-sm font-medium text-white">{r.title}</div>
              <div className="text-xs text-white/60">{r.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function LeaderboardPanel() {
  const rows = [
    { partner: "You", revenue: 620000, admissions: 7, conversion: 22, responseMin: 14, followUp: 92, rating: 4.8, rank: 3 },
    { partner: "Aarav K.", revenue: 940000, admissions: 11, conversion: 27, responseMin: 9, followUp: 96, rating: 4.9, rank: 1 },
    { partner: "Ishita R.", revenue: 810000, admissions: 9, conversion: 24, responseMin: 12, followUp: 94, rating: 4.85, rank: 2 },
    { partner: "Sohail M.", revenue: 480000, admissions: 5, conversion: 18, responseMin: 26, followUp: 78, rating: 4.6, rank: 4 },
  ];
  return (
    <Card className="border-white/10 bg-white/[0.03] p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><BarChart3 className="h-4 w-4 text-cyan-300" /> Monthly leaderboard</div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-[11px] uppercase text-white/40">
            <tr><th className="pb-2">#</th><th>Partner</th><th>Revenue</th><th>Admissions</th><th>Conv.</th><th>Response</th><th>Follow-up</th><th>Rating</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((r) => (
              <tr key={r.partner} className={r.partner === "You" ? "bg-cyan-400/5" : ""}>
                <td className="py-2 text-white/70">{r.rank}</td>
                <td className="py-2 text-white">{r.partner}</td>
                <td className="py-2 text-white/80">₹{(r.revenue / 100000).toFixed(1)}L</td>
                <td className="py-2 text-white/80">{r.admissions}</td>
                <td className="py-2 text-white/80">{r.conversion}%</td>
                <td className="py-2 text-white/80">{r.responseMin}m</td>
                <td className="py-2 text-white/80">{r.followUp}</td>
                <td className="py-2 text-white/80">{r.rating}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Admin controls
// ---------------------------------------------------------------------------

function AdminPanel() {
  const admin = useAdminControls();
  return (
    <Card className="border-white/10 bg-white/[0.03] p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><Settings2 className="h-4 w-4 text-white/70" /> Admin controls</div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="text-xs uppercase tracking-wider text-white/40">Max discount</div>
          <div className="mt-1 text-lg font-semibold text-white">{admin.maxDiscountPercent}%</div>
          <Slider min={0} max={40} step={1} value={[admin.maxDiscountPercent]} onValueChange={([v]) => setAdminControls({ maxDiscountPercent: v })} />
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="text-xs uppercase tracking-wider text-white/40">Max scholarship</div>
          <div className="mt-1 text-lg font-semibold text-white">{admin.maxScholarshipPercent}%</div>
          <Slider min={0} max={50} step={1} value={[admin.maxScholarshipPercent]} onValueChange={([v]) => setAdminControls({ maxScholarshipPercent: v })} />
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="text-xs uppercase tracking-wider text-white/40">EMI window (months)</div>
          <div className="mt-1 text-lg font-semibold text-white">{admin.emiRules.minMonths}–{admin.emiRules.maxMonths}</div>
          <div className="text-[11px] text-white/50">{admin.emiRules.zeroCostMonths} months no-cost</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="text-xs uppercase tracking-wider text-white/40">Business hours</div>
          <div className="mt-1 text-lg font-semibold text-white">{admin.businessHours.startHour}:00 – {admin.businessHours.endHour}:00</div>
          <div className="text-[11px] text-white/50">{admin.businessHours.timezone} · Mon–Sat</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="text-xs uppercase tracking-wider text-white/40">Escalation SLA</div>
          <div className="mt-1 text-sm text-white/80">Respond within {admin.escalation.responseTimeMinutes}m · {admin.escalation.followUpsPerLead} follow-ups per lead · reassign after {admin.escalation.inactivityHoursBeforeReassign}h</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="text-xs uppercase tracking-wider text-white/40">Templates & scripts</div>
          <div className="mt-1 text-sm text-white/80">{admin.templates.length} message templates · {admin.scripts.length} scripts</div>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export function SalesAiHub() {
  const leads = useSalesLeads();
  const [selectedId, setSelectedId] = useState<string | null>(leads[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("workspace");
  const selected = leads.find((l) => l.id === selectedId) ?? leads[0];

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return leads;
    return leads.filter((l) => `${l.name} ${l.program} ${l.source}`.toLowerCase().includes(q));
  }, [leads, query]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-wider text-cyan-200">
            <Sparkles className="h-3 w-3" /> Sales AI Operating System
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">Your AI sales team</h1>
          <p className="mt-1 max-w-2xl text-sm text-white/60">15 specialised AI agents that qualify leads, write messages, coach calls, generate proposals, forecast revenue and coach you — inside admin-approved limits.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-white/40" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search leads…" className="w-64 border-white/10 bg-black/40 pl-8 text-white placeholder:text-white/40" />
          </div>
        </div>
      </div>

      <KpiStrip />
      <CommandBar />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap gap-1 bg-transparent">
          <TabsTrigger value="workspace">Lead workspace</TabsTrigger>
          <TabsTrigger value="agents">AI agents ({SALES_AGENTS.length})</TabsTrigger>
          <TabsTrigger value="forecast">Forecast & coach</TabsTrigger>
          <TabsTrigger value="content">Marketing · Scripts · Learning</TabsTrigger>
          <TabsTrigger value="admin">Admin controls</TabsTrigger>
        </TabsList>

        <TabsContent value="workspace" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_1fr]">
            <div className="space-y-3">
              <PriorityBoard onSelect={setSelectedId} />
              {filtered.length !== leads.length && (
                <Card className="border-white/10 bg-white/[0.03] p-3 text-xs text-white/60">
                  {filtered.length} of {leads.length} leads match "{query}"
                </Card>
              )}
            </div>
            {selected && <LeadWorkspace key={selected.id} lead={selected} />}
          </div>
        </TabsContent>

        <TabsContent value="agents" className="mt-4">
          <AgentGrid onOpen={() => setTab("workspace")} />
        </TabsContent>

        <TabsContent value="forecast" className="mt-4 grid gap-4 lg:grid-cols-2">
          <ForecastPanel />
          <CoachPanel />
          <div className="lg:col-span-2"><LeaderboardPanel /></div>
        </TabsContent>

        <TabsContent value="content" className="mt-4 grid gap-4 lg:grid-cols-2">
          <MarketingPanel />
          <ScriptsPanel />
          <div className="lg:col-span-2"><LearningPanel /></div>
        </TabsContent>

        <TabsContent value="admin" className="mt-4">
          <AdminPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
