import { createFileRoute } from "@tanstack/react-router";
import { AcademyGate } from "@/components/partner/academy-gate";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  Sparkles, Brain, Target, Megaphone, Search, BookOpen, Globe, FileText,
  Wallet, GraduationCap, LifeBuoy, Bell, Zap, TrendingUp, AlertTriangle,
  CheckCircle2, ArrowRight, Loader2, RefreshCw,
} from "lucide-react";
import {
  getBusinessBriefing, getSalesCoach, getMarketingIdeas, getPartnerKpis,
  type BusinessBriefing, type SalesCoachOutput, type MarketingIdeas,
} from "@/lib/partner/business-os.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/partner/business-os")({
  component: () => (<AcademyGate><BusinessOS /></AcademyGate>),
  head: () => ({ meta: [{ title: "AI Business OS — Glintr" }, { name: "robots", content: "noindex" }] }),
});

const MODULES = [
  { id: "advisor", label: "AI Advisor", icon: Brain },
  { id: "sales", label: "Sales Coach", icon: Target },
  { id: "marketing", label: "Marketing", icon: Megaphone },
  { id: "seo", label: "SEO", icon: Search },
  { id: "course", label: "Course Optimizer", icon: BookOpen },
  { id: "website", label: "Website", icon: Globe },
  { id: "content", label: "Content", icon: FileText },
  { id: "finance", label: "Finance", icon: Wallet },
  { id: "students", label: "Student Success", icon: GraduationCap },
  { id: "support", label: "Support", icon: LifeBuoy },
  { id: "insights", label: "Insights", icon: Sparkles },
  { id: "notifications", label: "Inbox", icon: Bell },
  { id: "automation", label: "Automation", icon: Zap },
];

function BusinessOS() {
  const [tab, setTab] = useState("advisor");
  const fetchKpis = useServerFn(getPartnerKpis);
  const { data: kpis } = useQuery({ queryKey: ["partner-kpis-os"], queryFn: () => fetchKpis() });

  return (
    <div className="min-h-screen bg-[#050915] text-slate-100">
      <div className="border-b border-white/5 bg-gradient-to-b from-cyan-500/5 to-transparent">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/30">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-cyan-300/80">Glintr</div>
              <h1 className="text-3xl font-semibold">AI Business Operating System</h1>
            </div>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Your AI CEO, Marketing Head, Sales Manager, SEO Expert and Operations Manager — working with you inside Glintr.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <KpiTile label="Leads Today" value={kpis?.leadsToday ?? "—"} />
            <KpiTile label="Leads This Month" value={kpis?.leadsMonth ?? "—"} />
            <KpiTile label="Pending Follow-ups" value={kpis?.followUpsPending ?? "—"} />
            <KpiTile label="Unread Messages" value={kpis?.unreadMessages ?? "—"} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-white/[0.03] p-1">
            {MODULES.map((m) => {
              const Icon = m.icon;
              return (
                <TabsTrigger key={m.id} value={m.id} className="gap-2 data-[state=active]:bg-cyan-500/15 data-[state=active]:text-cyan-200">
                  <Icon className="h-3.5 w-3.5" />
                  {m.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="mt-6">
            <TabsContent value="advisor"><AdvisorPanel /></TabsContent>
            <TabsContent value="sales"><SalesPanel /></TabsContent>
            <TabsContent value="marketing"><MarketingPanel /></TabsContent>
            <TabsContent value="seo"><SimplePanel title="AI SEO Manager" items={[
              "Scan for missing keywords across your top pages",
              "3 broken internal links detected — auto-repair suggestions ready",
              "Blog freshness score: 72/100 — refresh 4 articles this month",
              "Competitor gap: they rank for 'AI sales training' — you don't",
              "Suggested new landing page: /ai-tools-for-sales",
            ]} /></TabsContent>
            <TabsContent value="course"><SimplePanel title="AI Course Optimizer" items={[
              "Add module: 'Prompt engineering fundamentals' to ChatGPT course",
              "Missing project brief in Python module 4",
              "Refresh Gemini AI course — tool UI changed since last update",
              "Add quiz to Claude AI module 2 — completion drop-off detected",
              "Certificate design: upgrade to v2 template for stronger LinkedIn shares",
            ]} /></TabsContent>
            <TabsContent value="website"><SimplePanel title="AI Website Manager" items={[
              "404 on /old-launch — set up 301 redirect to /launch",
              "3 images missing alt text on /programs",
              "Slow page: /blog (LCP 3.4s) — compress hero image",
              "Accessibility: contrast fail on 2 buttons in footer",
              "SEO: canonical missing on /courses/chatgpt",
            ]} /></TabsContent>
            <TabsContent value="content"><SimplePanel title="AI Content Manager" items={[
              "12 blogs published this month · 4 drafts in review queue",
              "Top article: 'What is AI?' — 8,241 reads · 3.2% CTR to /programs",
              "Refresh candidate: 'Python Guide 2024' → update to 2026 stats",
              "Topic cluster gap: AI Agents (only 1 article; opportunity for 6)",
              "Next 3 recommended: RAG for education · AI for edtech · Prompt patterns",
            ]} /></TabsContent>
            <TabsContent value="finance"><FinancePanel /></TabsContent>
            <TabsContent value="students"><SimplePanel title="AI Student Success" items={[
              "3 students at risk of dropping out (missed 2+ classes)",
              "Assignment completion: 78% (target 85%) — send nudges",
              "5 certificates pending issue — approve batch",
              "Quiz avg: 74% — module 3 flagged as too hard",
              "Learning velocity: on track for 42% completion this cohort",
            ]} /></TabsContent>
            <TabsContent value="support"><SimplePanel title="AI Support" items={[
              "18 open tickets · 4 need escalation · avg first-reply 2h 14m",
              "Top question this week: 'How to switch cohorts?' — 12 tickets",
              "Auto-reply suggestion drafted for 9 tickets — 1-click send",
              "Partner requests: 3 payout queries pending finance review",
              "Sentiment: 87% positive · 2 negative flagged for personal reply",
            ]} /></TabsContent>
            <TabsContent value="insights"><InsightsPanel /></TabsContent>
            <TabsContent value="notifications"><InboxPanel /></TabsContent>
            <TabsContent value="automation"><AutomationPanel /></TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

function KpiTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="text-xs uppercase tracking-widest text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function AdvisorPanel() {
  const fn = useServerFn(getBusinessBriefing);
  const { data, isPending, mutate } = useMutation<BusinessBriefing>({
    mutationFn: () => fn({ data: {} }) as Promise<BusinessBriefing>,
  });
  return (
    <div className="space-y-6">
      <PanelHeader
        title="AI Business Advisor"
        subtitle="A daily briefing from your AI CEO — wins, risks, and priority actions."
        action={<Button onClick={() => mutate()} disabled={isPending} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400">
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Generate today's briefing
        </Button>}
      />
      {!data && !isPending && <EmptyHint text="Click generate to receive your AI business briefing." />}
      {data && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-3 border-white/10 bg-white/[0.03]">
            <CardHeader><CardTitle className="text-cyan-200">{data.headline}</CardTitle></CardHeader>
            <CardContent><p className="text-slate-300">{data.summary}</p></CardContent>
          </Card>
          <ListCard title="Wins" icon={CheckCircle2} tone="emerald" items={data.wins} />
          <ListCard title="Risks" icon={AlertTriangle} tone="amber" items={data.risks} />
          <Card className="border-white/10 bg-white/[0.03]">
            <CardHeader><CardTitle className="text-sm">Priority Tasks</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {data.priorityTasks.map((t, i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-slate-100">{t.title}</div>
                    <Badge className={cn("text-[10px]",
                      t.impact === "high" ? "bg-rose-500/20 text-rose-300" :
                      t.impact === "medium" ? "bg-amber-500/20 text-amber-300" :
                      "bg-slate-500/20 text-slate-300")}>{t.impact}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">{t.why}</div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="lg:col-span-3 border-white/10 bg-white/[0.03]">
            <CardHeader><CardTitle className="text-sm">Sectional Summaries</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(data.sections).map(([k, v]) => (
                <div key={k} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <div className="text-[11px] uppercase tracking-widest text-cyan-300/70">{k}</div>
                  <div className="mt-1 text-sm text-slate-300">{v}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function SalesPanel() {
  const fn = useServerFn(getSalesCoach);
  const { data, isPending, mutate } = useMutation<SalesCoachOutput>({
    mutationFn: () => fn({ data: {} }) as Promise<SalesCoachOutput>,
  });
  return (
    <div className="space-y-6">
      <PanelHeader
        title="AI Sales Coach"
        subtitle="Who to call first, best follow-up message, and estimated conversion probability."
        action={<Button onClick={() => mutate()} disabled={isPending} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400">
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Target className="mr-2 h-4 w-4" />}
          Coach my pipeline
        </Button>}
      />
      {!data && !isPending && <EmptyHint text="Analyse your leads to see today's hot list." />}
      {data && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-white/10 bg-white/[0.03]">
            <CardHeader><CardTitle className="text-sm">Hot leads</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {data.hotLeads.map((l, i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{l.name}</div>
                    <Badge className="bg-cyan-500/20 text-cyan-200">{l.probability}%</Badge>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">{l.reason}</div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-300">
                    <span className="inline-flex items-center gap-1"><ArrowRight className="h-3 w-3" /> {l.nextAction}</span>
                    <span className="inline-flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Best: {l.bestTime}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <ListCard title="Coach insights" icon={Brain} tone="cyan" items={data.insights} />
          <Card className="lg:col-span-3 border-white/10 bg-white/[0.03]">
            <CardHeader><CardTitle className="text-sm">Drafted follow-ups</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {data.followUps.length === 0 && <div className="text-sm text-slate-500">No follow-ups drafted.</div>}
              {data.followUps.map((f, i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-sm">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{f.name}</span><Badge className="bg-white/10 capitalize">{f.channel}</Badge>
                  </div>
                  <div className="mt-1 text-slate-200">{f.message}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function MarketingPanel() {
  const fn = useServerFn(getMarketingIdeas);
  const [topic, setTopic] = useState("AI courses for sales professionals");
  const { data, isPending, mutate } = useMutation<MarketingIdeas>({
    mutationFn: () => fn({ data: { topic } }) as Promise<MarketingIdeas>,
  });
  return (
    <div className="space-y-6">
      <PanelHeader
        title="AI Marketing Manager"
        subtitle="Multi-channel campaign ideas — from blogs to WhatsApp — generated on demand."
        action={<div className="flex gap-2">
          <input value={topic} onChange={(e) => setTopic(e.target.value)}
            className="w-64 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400" />
          <Button onClick={() => mutate()} disabled={isPending} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400">
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Megaphone className="mr-2 h-4 w-4" />}
            Generate
          </Button>
        </div>}
      />
      {!data && !isPending && <EmptyHint text="Enter a topic and generate a full multi-channel plan." />}
      {data && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[
            ["Blog", data.blog], ["LinkedIn", data.linkedin], ["Instagram", data.instagram],
            ["Facebook", data.facebook], ["Twitter/X", data.twitter], ["Email", data.email],
            ["YouTube", data.youtube], ["Shorts", data.shorts], ["Google Ads", data.googleAds],
            ["Meta Ads", data.metaAds], ["Push", data.push], ["WhatsApp", data.whatsapp],
          ].map(([label, arr]) => (
            <Card key={label as string} className="border-white/10 bg-white/[0.03]">
              <CardHeader><CardTitle className="text-sm text-cyan-200">{label as string}</CardTitle></CardHeader>
              <CardContent><ul className="space-y-1.5 text-sm text-slate-300">
                {(arr as string[]).map((s, i) => <li key={i} className="flex gap-2"><span className="text-cyan-400">•</span>{s}</li>)}
              </ul></CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function FinancePanel() {
  return (
    <div className="space-y-6">
      <PanelHeader title="AI Finance Manager" subtitle="Revenue, expenses, payouts, refunds, taxes, invoices & forecasts." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          ["Revenue MTD", "₹4,82,450"], ["Expenses", "₹1,12,300"], ["Partner Payouts", "₹2,10,500"],
          ["Refunds", "₹8,200"], ["Taxes Reserved", "₹86,841"], ["Outstanding", "₹34,900"],
          ["Invoices Sent", "42"], ["Forecast (30d)", "₹6,20,000"],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-widest text-slate-400">{l}</div>
            <div className="mt-1 text-2xl font-semibold text-cyan-200">{v}</div>
          </div>
        ))}
      </div>
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader><CardTitle className="text-sm">Forecast note</CardTitle></CardHeader>
        <CardContent className="text-sm text-slate-300">
          Based on the last 90 days, monthly revenue is projected to grow 12% — driven by rising AI course conversions
          and improved partner activation. Set aside 18% for taxes and reinvest 30% into paid growth.
        </CardContent>
      </Card>
    </div>
  );
}

function InsightsPanel() {
  const summaries = [
    ["Business", "Revenue trending up 14% WoW. Focus: convert 32 warm leads."],
    ["Marketing", "LinkedIn CTR at 4.2%. Publish 2 carousel posts this week."],
    ["Sales", "Follow-up delay avg 26h — target <12h for hot leads."],
    ["SEO", "Impressions +18%. Fix broken links on /programs to lift CTR."],
    ["Finance", "MTD profit margin 41%. Payouts scheduled Friday."],
    ["Student", "Completion 68% cohort-avg. Nudge 12 at-risk learners."],
  ];
  return (
    <div className="space-y-6">
      <PanelHeader title="AI Insights" subtitle="Every morning: a summary across business, marketing, sales, SEO, finance and students." />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {summaries.map(([label, text]) => (
          <Card key={label} className="border-white/10 bg-white/[0.03]">
            <CardHeader><CardTitle className="text-sm text-cyan-200">{label} Summary</CardTitle></CardHeader>
            <CardContent className="text-sm text-slate-300">{text}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function InboxPanel() {
  const items = [
    ["warning", "Your website has 1 broken page."],
    ["info", "Publish 2 blogs this week to stay on cadence."],
    ["success", "Meta Ads CTR up 22% — consider scaling budget."],
    ["warning", "5 certificates are pending issue."],
    ["info", "3 leads haven't been contacted for 48h."],
    ["success", "New enrollment: Priya Sharma → ChatGPT Mastery."],
  ] as const;
  return (
    <div className="space-y-4">
      <PanelHeader title="AI Inbox" subtitle="Proactive notifications from every module — sorted by urgency." />
      <div className="space-y-2">
        {items.map(([kind, text], i) => (
          <div key={i} className={cn("flex items-start gap-3 rounded-lg border p-3 text-sm",
            kind === "warning" && "border-amber-500/30 bg-amber-500/5",
            kind === "info" && "border-white/10 bg-white/[0.03]",
            kind === "success" && "border-emerald-500/30 bg-emerald-500/5")}>
            <Bell className={cn("mt-0.5 h-4 w-4",
              kind === "warning" && "text-amber-300",
              kind === "info" && "text-cyan-300",
              kind === "success" && "text-emerald-300")} />
            <div className="flex-1 text-slate-200">{text}</div>
            <Button size="sm" variant="ghost" className="text-xs">Dismiss</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AutomationPanel() {
  const rules = [
    { trigger: "New lead arrives", actions: ["Send welcome email", "Send WhatsApp", "Assign sales executive"] },
    { trigger: "Payment received", actions: ["Enroll in course", "Send onboarding kit", "Notify partner"] },
    { trigger: "Course completed", actions: ["Issue certificate", "Request review", "Offer advanced course"] },
    { trigger: "Lead cold for 7 days", actions: ["Send re-engagement email", "Trigger discount offer"] },
  ];
  return (
    <div className="space-y-6">
      <PanelHeader title="Automation" subtitle="If-this-then-that rules that run 24/7."
        action={<Button className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"><Zap className="mr-2 h-4 w-4" />New rule</Button>} />
      <div className="grid gap-3 md:grid-cols-2">
        {rules.map((r, i) => (
          <Card key={i} className="border-white/10 bg-white/[0.03]">
            <CardHeader><CardTitle className="text-sm text-cyan-200">When {r.trigger}</CardTitle></CardHeader>
            <CardContent className="space-y-1.5 text-sm text-slate-300">
              {r.actions.map((a, j) => (
                <div key={j} className="flex items-center gap-2"><ArrowRight className="h-3.5 w-3.5 text-cyan-400" />{a}</div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SimplePanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="space-y-4">
      <PanelHeader title={title} subtitle="AI-generated recommendations refreshed each morning." />
      <Card className="border-white/10 bg-white/[0.03]">
        <CardContent className="space-y-2 py-4">
          {items.map((t, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-sm text-slate-200">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
              <div className="flex-1">{t}</div>
              <Button size="sm" variant="ghost" className="text-xs">Act</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ListCard({ title, icon: Icon, tone, items }: { title: string; icon: typeof CheckCircle2; tone: "emerald" | "amber" | "cyan"; items: string[] }) {
  const toneCls = tone === "emerald" ? "text-emerald-300" : tone === "amber" ? "text-amber-300" : "text-cyan-300";
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <Icon className={cn("h-4 w-4", toneCls)} />
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent><ul className="space-y-1.5 text-sm text-slate-300">
        {items.map((s, i) => <li key={i} className="flex gap-2"><span className={toneCls}>•</span>{s}</li>)}
      </ul></CardContent>
    </Card>
  );
}

function PanelHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-sm text-slate-400">
      <RefreshCw className="mx-auto mb-3 h-6 w-6 text-cyan-400" />
      {text}
    </div>
  );
}
