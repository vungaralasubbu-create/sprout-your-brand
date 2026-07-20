import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getIntelDashboard, listTrends, listNews, listKeywordTrends,
  listOpportunities, listAlerts, markAlertRead,
  discoverTrends, generateKeywordTrends, generateOpportunities,
  summarizeIndustryNews, generateMarketReport, listIndustries,
} from "@/lib/market-intel/intel.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Radar, TrendingUp, Newspaper, Zap, Target, Bell, Sparkles,
  BarChart3, Loader2, ExternalLink, Trophy, Calendar, Globe,
  Lightbulb, Search, FileText, ArrowUpRight, ArrowDownRight, Plug,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/marketing-os/intelligence")({
  head: () => ({
    meta: [
      { title: "Market Intelligence — Glintr Marketing OS" },
      { name: "description", content: "Continuously discover industry trends, keywords, viral topics, competitor moves, and content opportunities." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MarketIntel,
});

function MarketIntel() {
  const dashFn = useServerFn(getIntelDashboard);
  const { data: dash } = useQuery({ queryKey: ["intel", "dash"], queryFn: () => dashFn() });

  const kpis = [
    { label: "Trending Topics", value: dash?.trendingTopics ?? 0, icon: TrendingUp },
    { label: "Trending Keywords", value: dash?.trendingKeywords ?? 0, icon: Search },
    { label: "Viral Posts", value: dash?.viralPosts ?? 0, icon: Zap, note: "Social listening pending" },
    { label: "Competitor Activity", value: dash?.competitorActivity ?? 0, icon: Trophy, note: "Connectors ready" },
    { label: "Industry News", value: dash?.industryNews ?? 0, icon: Newspaper },
    { label: "Search Growth", value: `${Math.round(dash?.searchGrowth ?? 0)}%`, icon: ArrowUpRight },
    { label: "Content Opportunities", value: dash?.contentOpportunities ?? 0, icon: Lightbulb },
    { label: "Content Gaps", value: dash?.contentGaps ?? 0, icon: Layers },
    { label: "Upcoming Events", value: dash?.upcomingEvents ?? 0, icon: Calendar },
    { label: "Market Score", value: `${dash?.marketScore ?? 0}`, icon: Target, tone: (dash?.marketScore ?? 0) >= 70 ? "emerald" : "amber" },
    { label: "Alerts", value: dash?.unreadAlerts ?? 0, icon: Bell, tone: (dash?.unreadAlerts ?? 0) > 0 ? "amber" : undefined },
    { label: "GEO Questions", value: dash?.totalGeoQuestions ?? 0, icon: Globe },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-primary">Marketing OS · Intelligence</div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Radar className="size-6 text-primary" /> Market Intelligence
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Continuously discover industry trends, keyword shifts, viral topics, competitor moves, and content opportunities. Every insight is reusable by AI Planner, Campaigns, SEO Hub, Workflows, and the Content Generator.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">{k.label}</div>
              <k.icon className="size-3.5 text-muted-foreground" />
            </div>
            <div className={cn(
              "mt-2 text-2xl font-semibold tracking-tight",
              k.tone === "emerald" && "text-emerald-600",
              k.tone === "amber" && "text-amber-600",
            )}>{String(k.value)}</div>
            {k.note && <div className="text-[10px] text-muted-foreground mt-0.5">{k.note}</div>}
          </Card>
        ))}
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="flex flex-wrap h-auto p-1 gap-1 justify-start">
          <TabsTrigger value="dashboard"><BarChart3 className="size-3.5 mr-1.5" />Dashboard</TabsTrigger>
          <TabsTrigger value="trends"><TrendingUp className="size-3.5 mr-1.5" />Trends</TabsTrigger>
          <TabsTrigger value="keywords"><Search className="size-3.5 mr-1.5" />Keyword Trends</TabsTrigger>
          <TabsTrigger value="news"><Newspaper className="size-3.5 mr-1.5" />News</TabsTrigger>
          <TabsTrigger value="opportunities"><Lightbulb className="size-3.5 mr-1.5" />Opportunities</TabsTrigger>
          <TabsTrigger value="gaps"><Layers className="size-3.5 mr-1.5" />Gaps</TabsTrigger>
          <TabsTrigger value="events"><Calendar className="size-3.5 mr-1.5" />Events</TabsTrigger>
          <TabsTrigger value="seasonality"><Zap className="size-3.5 mr-1.5" />Seasonality</TabsTrigger>
          <TabsTrigger value="competitors"><Trophy className="size-3.5 mr-1.5" />Competitors</TabsTrigger>
          <TabsTrigger value="alerts"><Bell className="size-3.5 mr-1.5" />Alerts</TabsTrigger>
          <TabsTrigger value="reports"><FileText className="size-3.5 mr-1.5" />Reports</TabsTrigger>
          <TabsTrigger value="connectors"><Plug className="size-3.5 mr-1.5" />Connectors</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4"><DashPane dash={dash} /></TabsContent>
        <TabsContent value="trends" className="mt-4"><TrendsPane /></TabsContent>
        <TabsContent value="keywords" className="mt-4"><KeywordsPane /></TabsContent>
        <TabsContent value="news" className="mt-4"><NewsPane /></TabsContent>
        <TabsContent value="opportunities" className="mt-4"><OpportunitiesPane /></TabsContent>
        <TabsContent value="gaps" className="mt-4"><GapsPane /></TabsContent>
        <TabsContent value="events" className="mt-4"><EventsPane /></TabsContent>
        <TabsContent value="seasonality" className="mt-4"><SeasonalityPane /></TabsContent>
        <TabsContent value="competitors" className="mt-4"><CompetitorsPane /></TabsContent>
        <TabsContent value="alerts" className="mt-4"><AlertsPane /></TabsContent>
        <TabsContent value="reports" className="mt-4"><ReportsPane /></TabsContent>
        <TabsContent value="connectors" className="mt-4"><ConnectorsPane /></TabsContent>
      </Tabs>
    </div>
  );
}

function DashPane({ dash }: { dash: Awaited<ReturnType<typeof getIntelDashboard>> | undefined }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="p-5">
        <div className="font-medium text-sm flex items-center gap-2 mb-3"><TrendingUp className="size-4" /> Latest trends</div>
        {(dash?.recentTrends ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground py-3 text-center">Run discovery from the Trends tab to seed insights.</p>
        ) : (
          <div className="divide-y divide-border/60 -mx-2">
            {(dash?.recentTrends ?? []).map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-2 py-2 text-sm">
                <span className="flex-1 truncate">{t.topic}</span>
                <Badge variant="outline" className="text-[10px]">{t.industry}</Badge>
                <span className="text-xs text-emerald-600">{Math.round(Number(t.opportunity_score) || 0)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Card className="p-5">
        <div className="font-medium text-sm flex items-center gap-2 mb-3"><Lightbulb className="size-4" /> Top opportunities</div>
        {(dash?.topOpportunities ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground py-3 text-center">Generate opportunities from the Opportunities tab.</p>
        ) : (
          <div className="divide-y divide-border/60 -mx-2">
            {(dash?.topOpportunities ?? []).map((o) => (
              <div key={o.id} className="flex items-center gap-3 px-2 py-2 text-sm">
                <span className="flex-1 truncate">{o.title}</span>
                <Badge variant="outline" className="text-[10px] capitalize">{o.type}</Badge>
                <span className="text-xs">{Math.round(Number(o.priority_score) || 0)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function DiscoverBar({ onRun, running, industries }: { onRun: (industry: string) => void; running: boolean; industries: string[] }) {
  const [ind, setInd] = useState(industries[0] ?? "AI");
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select className="h-9 px-2 rounded-md border border-border/60 bg-background text-sm" value={ind} onChange={(e) => setInd(e.target.value)}>
        {industries.map((i) => <option key={i}>{i}</option>)}
      </select>
      <Button size="sm" onClick={() => onRun(ind)} disabled={running}>
        {running && <Loader2 className="size-3.5 mr-1.5 animate-spin" />} Discover with AI
      </Button>
    </div>
  );
}

function TrendsPane() {
  const qc = useQueryClient();
  const listFn = useServerFn(listTrends);
  const discoverFn = useServerFn(discoverTrends);
  const industriesFn = useServerFn(listIndustries);
  const { data } = useQuery({ queryKey: ["intel", "trends"], queryFn: () => listFn() });
  const { data: inds } = useQuery({ queryKey: ["intel", "industries"], queryFn: () => industriesFn() });
  const run = useMutation({
    mutationFn: async (industry: string) => discoverFn({ data: { industry, timeframe: "weekly", limit: 10 } }),
    onSuccess: (r) => { toast.success(`Discovered ${r.inserted} trends`); qc.invalidateQueries({ queryKey: ["intel"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="space-y-4">
      <Card className="p-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm">
          <div className="font-medium">Trend discovery</div>
          <div className="text-xs text-muted-foreground">Every run routes through the central AI Router — no direct provider calls.</div>
        </div>
        <DiscoverBar onRun={(i) => run.mutate(i)} running={run.isPending} industries={inds?.industries ?? []} />
      </Card>
      {(data?.trends ?? []).length === 0 ? (
        <Card className="p-8 text-center"><TrendingUp className="size-6 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">No trends yet. Run discovery above.</p></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {(data?.trends ?? []).map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{t.topic}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.industry} · {t.category}</div>
                </div>
                <Badge variant="outline" className="text-[10px]">{Math.round(Number(t.opportunity_score) || 0)}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1 text-[10px] text-muted-foreground">
                <div>Growth <span className="text-foreground font-medium">{Math.round(Number(t.growth_rate) || 0)}</span></div>
                <div>Velocity <span className="text-foreground font-medium">{Math.round(Number(t.velocity) || 0)}</span></div>
                <div>Rel <span className="text-foreground font-medium">{Math.round(Number(t.business_relevance) || 0)}</span></div>
                <div>Comp <span className="text-foreground font-medium">{Math.round(Number(t.competition) || 0)}</span></div>
                <div>Diff <span className="text-foreground font-medium">{Math.round(Number(t.difficulty) || 0)}</span></div>
                <div>Pop <span className="text-foreground font-medium">{Math.round(Number(t.popularity) || 0)}</span></div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function KeywordsPane() {
  const qc = useQueryClient();
  const listFn = useServerFn(listKeywordTrends);
  const runFn = useServerFn(generateKeywordTrends);
  const { data } = useQuery({ queryKey: ["intel", "kws"], queryFn: () => listFn() });
  const run = useMutation({
    mutationFn: async () => runFn({ data: { limit: 15 } }),
    onSuccess: () => { toast.success("Keyword trends refreshed"); qc.invalidateQueries({ queryKey: ["intel"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="space-y-4">
      <Card className="p-4 flex items-center justify-between">
        <div className="text-sm">
          <div className="font-medium">Keyword trends</div>
          <div className="text-xs text-muted-foreground">Growing · declining · seasonal · emerging · long-tail · questions.</div>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline"><Link to={"/admin/keyword-research" as never}><ExternalLink className="size-3.5 mr-1.5" /> Full research</Link></Button>
          <Button size="sm" onClick={() => run.mutate()} disabled={run.isPending}>
            {run.isPending && <Loader2 className="size-3.5 mr-1.5 animate-spin" />} Refresh
          </Button>
        </div>
      </Card>
      {(data?.keywords ?? []).length === 0 ? (
        <Card className="p-8 text-center"><Search className="size-6 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">No keyword trends yet.</p></Card>
      ) : (
        <Card className="p-4">
          <div className="divide-y divide-border/60 -mx-2">
            {(data?.keywords ?? []).map((k) => (
              <div key={k.id} className="flex items-center gap-3 px-2 py-2 text-sm">
                <span className="flex-1 truncate">{k.keyword}</span>
                <Badge variant="outline" className="text-[10px] capitalize">{k.direction}</Badge>
                <span className="text-xs text-muted-foreground">{(k.monthly_volume ?? 0).toLocaleString()} vol</span>
                <span className={cn("text-xs flex items-center", Number(k.growth_percent) >= 0 ? "text-emerald-600" : "text-red-500")}>
                  {Number(k.growth_percent) >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                  {Math.round(Number(k.growth_percent) || 0)}%
                </span>
                <span className="text-xs text-muted-foreground">Diff {Math.round(Number(k.difficulty) || 0)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function NewsPane() {
  const qc = useQueryClient();
  const listFn = useServerFn(listNews);
  const runFn = useServerFn(summarizeIndustryNews);
  const { data } = useQuery({ queryKey: ["intel", "news"], queryFn: () => listFn() });
  const run = useMutation({
    mutationFn: async () => runFn({ data: { limit: 8 } }),
    onSuccess: () => { toast.success("News synthesized"); qc.invalidateQueries({ queryKey: ["intel"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="space-y-4">
      <Card className="p-4 flex items-center justify-between">
        <div className="text-sm">
          <div className="font-medium">Industry news</div>
          <div className="text-xs text-muted-foreground">AI summarizes headlines and derives marketing opportunities.</div>
        </div>
        <Button size="sm" onClick={() => run.mutate()} disabled={run.isPending}>
          {run.isPending && <Loader2 className="size-3.5 mr-1.5 animate-spin" />} Synthesize
        </Button>
      </Card>
      {(data?.news ?? []).length === 0 ? (
        <Card className="p-8 text-center"><Newspaper className="size-6 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">No news yet.</p></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(data?.news ?? []).map((n) => (
            <Card key={n.id} className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px]">{n.industry ?? "General"}</Badge>
                <Badge variant={n.impact === "high" ? "destructive" : "outline"} className="text-[10px] capitalize">{n.impact ?? "medium"}</Badge>
              </div>
              <div className="font-medium text-sm">{n.headline}</div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{n.ai_summary || n.summary}</p>
              {(n.recommended_actions ?? []).length > 0 && (
                <div className="mt-3 text-xs">
                  <div className="text-[10px] uppercase tracking-wider text-primary mb-1">Recommended actions</div>
                  <ul className="list-disc pl-4 space-y-0.5">{n.recommended_actions!.slice(0, 3).map((a: string, i: number) => <li key={i}>{a}</li>)}</ul>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function OpportunitiesPane() {
  const qc = useQueryClient();
  const listFn = useServerFn(listOpportunities);
  const runFn = useServerFn(generateOpportunities);
  const { data } = useQuery({ queryKey: ["intel", "opps"], queryFn: () => listFn() });
  const run = useMutation({
    mutationFn: async () => runFn({ data: { limit: 10 } }),
    onSuccess: () => { toast.success("Opportunities generated"); qc.invalidateQueries({ queryKey: ["intel"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="space-y-4">
      <Card className="p-4 flex items-center justify-between">
        <div className="text-sm">
          <div className="font-medium">Opportunity finder</div>
          <div className="text-xs text-muted-foreground">AI mines trends for untapped topics, low competition, high conversion potential.</div>
        </div>
        <Button size="sm" onClick={() => run.mutate()} disabled={run.isPending}>
          {run.isPending && <Loader2 className="size-3.5 mr-1.5 animate-spin" />} Generate
        </Button>
      </Card>
      {(data?.opportunities ?? []).length === 0 ? (
        <Card className="p-8 text-center"><Lightbulb className="size-6 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">No opportunities yet.</p></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(data?.opportunities ?? []).map((o) => (
            <Card key={o.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{o.title}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{o.type} · {o.industry}</div>
                </div>
                <Badge variant="outline" className="text-[10px]">{Math.round(Number(o.priority_score) || 0)}</Badge>
              </div>
              {o.target_keyword && <div className="text-xs mt-2">Target · <span className="font-medium">{o.target_keyword}</span></div>}
              {o.rationale && <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{o.rationale}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function GapsPane() {
  return (
    <Card className="p-8 text-center">
      <Layers className="size-6 text-muted-foreground mx-auto mb-2" />
      <div className="font-medium">Content gap analysis</div>
      <p className="text-sm text-muted-foreground max-w-lg mx-auto mt-1">
        Compares existing blogs, landing pages, courses, campaigns, and social posts against trending topics to surface missing articles, videos, campaigns, and landing pages. Live once trend history exceeds 30 rows.
      </p>
      <Button asChild size="sm" variant="outline" className="mt-3"><Link to="/admin/marketing-os/seo-hub">Open SEO Hub</Link></Button>
    </Card>
  );
}

function EventsPane() {
  const cats = ["Technology Events","Conferences","Hackathons","Admissions","Placement Season","Festivals","International Days","Awareness Days"];
  return (
    <Card className="p-5">
      <div className="font-medium text-sm flex items-center gap-2 mb-3"><Calendar className="size-4" /> Event calendar</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {cats.map((c) => <div key={c} className="p-3 rounded-lg border border-border/60 text-sm">{c}</div>)}
      </div>
      <p className="text-xs text-muted-foreground mt-3">Auto-detected events feed the Campaign Manager once the connector layer ships.</p>
    </Card>
  );
}

function SeasonalityPane() {
  const peaks = ["Admission Peaks","Hiring Peaks","Exam Seasons","Holiday Traffic","Festival Demand"];
  return (
    <Card className="p-5">
      <div className="font-medium text-sm flex items-center gap-2 mb-3"><Zap className="size-4" /> Seasonality</div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {peaks.map((p) => <div key={p} className="p-3 rounded-lg border border-border/60 text-sm">{p}</div>)}
      </div>
    </Card>
  );
}

function CompetitorsPane() {
  const rows = ["Competitor Profiles","Content Comparison","Campaign Comparison","SEO Comparison","Posting Frequency"];
  return (
    <Card className="p-5">
      <div className="font-medium text-sm flex items-center gap-2 mb-1"><Trophy className="size-4" /> Competitor watch</div>
      <p className="text-xs text-muted-foreground mb-3">Architecture only — scraping not implemented. Lights up when connectors ship.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {rows.map((r) => <div key={r} className="p-3 rounded-lg border border-border/60 text-sm">{r}</div>)}
      </div>
    </Card>
  );
}

function AlertsPane() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAlerts);
  const markFn = useServerFn(markAlertRead);
  const { data } = useQuery({ queryKey: ["intel", "alerts"], queryFn: () => listFn() });
  const mark = useMutation({
    mutationFn: async (id: string) => markFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["intel"] }),
  });
  return (
    <Card className="p-5">
      <div className="font-medium text-sm flex items-center gap-2 mb-3"><Bell className="size-4" /> Alerts</div>
      {(data?.alerts ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No alerts yet.</p>
      ) : (
        <div className="divide-y divide-border/60 -mx-2">
          {(data?.alerts ?? []).map((a) => (
            <div key={a.id} className={cn("flex items-center gap-3 px-2 py-2 text-sm", !a.is_read && "bg-primary/5")}>
              <Badge variant={a.severity === "high" ? "destructive" : "outline"} className="text-[10px] capitalize">{a.severity}</Badge>
              <span className="flex-1 truncate">{a.title}</span>
              <span className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
              {!a.is_read && <Button size="sm" variant="ghost" onClick={() => mark.mutate(a.id)}>Mark read</Button>}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function ReportsPane() {
  const qc = useQueryClient();
  const genFn = useServerFn(generateMarketReport);
  const gen = useMutation({
    mutationFn: async (t: "daily"|"weekly"|"monthly"|"quarterly"|"yearly") => genFn({ data: { type: t } }),
    onSuccess: () => { toast.success("Report generated"); qc.invalidateQueries({ queryKey: ["intel"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Card className="p-5">
      <div className="font-medium text-sm flex items-center gap-2 mb-3"><FileText className="size-4" /> Reports</div>
      <div className="flex flex-wrap gap-2">
        {(["daily","weekly","monthly","quarterly","yearly"] as const).map((t) => (
          <Button key={t} size="sm" variant="outline" onClick={() => gen.mutate(t)} disabled={gen.isPending} className="capitalize">{t}</Button>
        ))}
      </div>
    </Card>
  );
}

function ConnectorsPane() {
  const connectors = [
    "Google Trends","Google News","Search Console","Reddit",
    "LinkedIn Trends","X Trends","YouTube Trends","GitHub Trending",
    "Product Hunt","Hacker News",
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
      {connectors.map((c) => (
        <Card key={c} className="p-4">
          <div className="text-sm font-medium">{c}</div>
          <Badge variant="outline" className="text-[10px] mt-2">Placeholder</Badge>
          <Button size="sm" variant="outline" disabled className="mt-3 w-full"><Plug className="size-3.5 mr-1.5" /> Coming soon</Button>
        </Card>
      ))}
    </div>
  );
}
