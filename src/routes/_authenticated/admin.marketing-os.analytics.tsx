import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  getAnalyticsKpis, getPlatformAnalytics, getBusinessMetrics,
  getCampaignAnalytics, getTimeseries, getPostingHeatmap,
  getAIInsights, getForecast, listAnalyticsReports, createAnalyticsReport,
} from "@/lib/marketing-os/analytics.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  BarChart3, TrendingUp, Users, DollarSign, Target, Sparkles,
  Download, Calendar, Zap, Activity, PieChart as PieIcon,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/marketing-os/analytics")({
  component: AnalyticsWorkspace,
});

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#A855F7", facebook: "#3B82F6", linkedin: "#1E3A8A",
  x: "#0F172A", threads: "#6B7280", pinterest: "#EF4444",
  youtube: "#DC2626", tiktok: "#06B6D4", blog: "#10B981",
};

const RANGES: Array<{ id: string; label: string; days: number }> = [
  { id: "7d", label: "7d", days: 7 },
  { id: "30d", label: "30d", days: 30 },
  { id: "90d", label: "90d", days: 90 },
  { id: "365d", label: "1y", days: 365 },
];

function AnalyticsWorkspace() {
  const [rangeId, setRangeId] = useState("30d");

  const range = useMemo(() => {
    const days = RANGES.find((r) => r.id === rangeId)?.days ?? 30;
    const to = new Date();
    const from = new Date(to.getTime() - days * 86400000);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [rangeId]);

  const kpisFn = useServerFn(getAnalyticsKpis);
  const platformFn = useServerFn(getPlatformAnalytics);
  const businessFn = useServerFn(getBusinessMetrics);
  const campaignFn = useServerFn(getCampaignAnalytics);
  const seriesFn = useServerFn(getTimeseries);
  const heatFn = useServerFn(getPostingHeatmap);
  const insightsFn = useServerFn(getAIInsights);
  const forecastFn = useServerFn(getForecast);
  const listReportsFn = useServerFn(listAnalyticsReports);
  const createReportFn = useServerFn(createAnalyticsReport);

  const kpis = useQuery({ queryKey: ["mkt-kpis", range], queryFn: () => kpisFn({ data: range }) });
  const platforms = useQuery({ queryKey: ["mkt-platforms", range], queryFn: () => platformFn({ data: range }) });
  const business = useQuery({ queryKey: ["mkt-business", range], queryFn: () => businessFn({ data: range }) });
  const campaigns = useQuery({ queryKey: ["mkt-campaigns", range], queryFn: () => campaignFn({ data: range }) });
  const series = useQuery({ queryKey: ["mkt-series", range], queryFn: () => seriesFn({ data: range }) });
  const heatmap = useQuery({ queryKey: ["mkt-heat", range], queryFn: () => heatFn({ data: range }) });
  const insights = useQuery({ queryKey: ["mkt-insights", range], queryFn: () => insightsFn({ data: range }), staleTime: 60_000 });
  const forecast = useQuery({ queryKey: ["mkt-forecast", range], queryFn: () => forecastFn({ data: range }), staleTime: 60_000 });
  const reports = useQuery({ queryKey: ["mkt-reports"], queryFn: () => listReportsFn() });

  const c = kpis.data?.cards;

  async function saveReport() {
    if (!c) return;
    try {
      await createReportFn({ data: {
        name: `Report ${new Date().toLocaleDateString()}`,
        kind: "custom",
        range_from: range.from, range_to: range.to,
        filters: {}, data: { kpis: c }, format: "json",
      }});
      toast.success("Report saved");
      reports.refetch();
    } catch (e) { toast.error(String(e)); }
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify({ range, kpis: c, platforms: platforms.data, business: business.data, campaigns: campaigns.data }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "marketing-analytics.json"; a.click();
    URL.revokeObjectURL(url);
  }

  function exportCSV() {
    const rows = [["Metric", "Value"]];
    if (c) Object.entries(c).forEach(([k, v]) => rows.push([k, String(v)]));
    const csv = rows.map((r) => r.map((x) => `"${x}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "kpis.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Marketing Analytics</h2>
          <p className="text-sm text-muted-foreground">Business outcomes across content, campaigns, and platforms.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border p-0.5">
            {RANGES.map((r) => (
              <button key={r.id} onClick={() => setRangeId(r.id)}
                className={cn("px-3 py-1 text-xs rounded", rangeId === r.id ? "bg-primary text-white" : "text-muted-foreground")}>
                {r.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="size-4 mr-1"/>CSV</Button>
          <Button variant="outline" size="sm" onClick={exportJSON}><Download className="size-4 mr-1"/>JSON</Button>
          <Button size="sm" onClick={saveReport}><Sparkles className="size-4 mr-1"/>Save Report</Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
        <Kpi icon={<Users className="size-4"/>} label="Reach" value={c?.totalReach ?? 0} />
        <Kpi icon={<Activity className="size-4"/>} label="Impressions" value={c?.totalImpressions ?? 0} />
        <Kpi icon={<TrendingUp className="size-4"/>} label="Engagement Rate" value={`${c?.engagementRate ?? 0}%`} />
        <Kpi icon={<Users className="size-4"/>} label="Followers Δ" value={c?.followersGrowth ?? 0} />
        <Kpi icon={<Target className="size-4"/>} label="Website Visits" value={c?.websiteVisits ?? 0} />
        <Kpi icon={<Target className="size-4"/>} label="Leads" value={c?.leadsGenerated ?? 0} />
        <Kpi icon={<Zap className="size-4"/>} label="Admissions" value={c?.admissions ?? 0} />
        <Kpi icon={<DollarSign className="size-4"/>} label="Revenue" value={`₹${(c?.revenue ?? 0).toLocaleString()}`} />
        <Kpi icon={<TrendingUp className="size-4"/>} label="CTR" value={`${c?.ctr ?? 0}%`} />
        <Kpi icon={<Target className="size-4"/>} label="Conversions" value={c?.conversions ?? 0} />
        <Kpi icon={<DollarSign className="size-4"/>} label="ROI" value={`${c?.roi ?? 0}x`} />
        <Kpi icon={<BarChart3 className="size-4"/>} label="Campaign Perf" value={`${c?.campaignPerformance ?? 0}%`} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="posting">Posting</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="ai">AI Insights</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 pt-4">
          <Card className="p-4">
            <div className="text-sm font-medium mb-2">Activity Timeline</div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series.data?.series ?? []}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3}/>
                  <XAxis dataKey="date" fontSize={10}/>
                  <YAxis fontSize={10}/>
                  <Tooltip/><Legend/>
                  <Line type="monotone" dataKey="posts" stroke="#3B82F6" strokeWidth={2}/>
                  <Line type="monotone" dataKey="leads" stroke="#10B981" strokeWidth={2}/>
                  <Line type="monotone" dataKey="admissions" stroke="#F59E0B" strokeWidth={2}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-medium mb-2">Revenue Curve</div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series.data?.series ?? []}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3}/>
                  <XAxis dataKey="date" fontSize={10}/><YAxis fontSize={10}/><Tooltip/>
                  <Bar dataKey="revenue" fill="#10B981"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-4 pt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="text-sm font-medium mb-2">Posts by Platform</div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={platforms.data?.rows ?? []}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3}/>
                    <XAxis dataKey="platform" fontSize={10}/><YAxis fontSize={10}/><Tooltip/>
                    <Bar dataKey="postsPublished">
                      {(platforms.data?.rows ?? []).map((r, i) => (
                        <Cell key={i} fill={PLATFORM_COLORS[r.platform] ?? "#94A3B8"}/>
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm font-medium mb-2">Engagement Distribution</div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={(platforms.data?.rows ?? []).filter(r => (r.likes + r.comments + r.shares) > 0)}
                      dataKey={(r) => r.likes + r.comments + r.shares} nameKey="platform" outerRadius={80} label>
                      {(platforms.data?.rows ?? []).map((r, i) => (
                        <Cell key={i} fill={PLATFORM_COLORS[r.platform] ?? "#94A3B8"}/>
                      ))}
                    </Pie>
                    <Tooltip/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
          <Card className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left p-3">Platform</th>
                  <th className="text-right p-3">Posts</th>
                  <th className="text-right p-3">Reach</th>
                  <th className="text-right p-3">Impressions</th>
                  <th className="text-right p-3">Likes</th>
                  <th className="text-right p-3">Comments</th>
                  <th className="text-right p-3">Shares</th>
                  <th className="text-right p-3">Clicks</th>
                  <th className="text-right p-3">Followers Δ</th>
                  <th className="text-right p-3">ER %</th>
                  <th className="text-right p-3">CTR %</th>
                </tr>
              </thead>
              <tbody>
                {(platforms.data?.rows ?? []).map((r) => (
                  <tr key={r.platform} className="border-t">
                    <td className="p-3 font-medium capitalize flex items-center gap-2">
                      <span className="size-2 rounded-full" style={{ background: PLATFORM_COLORS[r.platform] }}/>
                      {r.platform}
                    </td>
                    <td className="p-3 text-right">{r.postsPublished}</td>
                    <td className="p-3 text-right">{r.reach}</td>
                    <td className="p-3 text-right">{r.impressions}</td>
                    <td className="p-3 text-right">{r.likes}</td>
                    <td className="p-3 text-right">{r.comments}</td>
                    <td className="p-3 text-right">{r.shares}</td>
                    <td className="p-3 text-right">{r.clicks}</td>
                    <td className="p-3 text-right">{r.followerGrowth}</td>
                    <td className="p-3 text-right">{r.engagementRate}</td>
                    <td className="p-3 text-right">{r.ctr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            <Kpi label="MQL" value={business.data?.mql ?? 0} icon={<Target className="size-4"/>}/>
            <Kpi label="SQL" value={business.data?.sql ?? 0} icon={<Target className="size-4"/>}/>
            <Kpi label="Admissions" value={business.data?.admissions ?? 0} icon={<Zap className="size-4"/>}/>
            <Kpi label="Applications" value={business.data?.applications ?? 0} icon={<Users className="size-4"/>}/>
            <Kpi label="Revenue" value={`₹${(business.data?.revenue ?? 0).toLocaleString()}`} icon={<DollarSign className="size-4"/>}/>
            <Kpi label="Course Purchases" value={business.data?.coursePurchases ?? 0} icon={<Sparkles className="size-4"/>}/>
            <Kpi label="Newsletter" value={business.data?.newsletterSignups ?? 0} icon={<Users className="size-4"/>}/>
            <Kpi label="Contact Requests" value={business.data?.contactRequests ?? 0} icon={<Users className="size-4"/>}/>
            <Kpi label="Demo Bookings" value={business.data?.demoBookings ?? 0} icon={<Calendar className="size-4"/>}/>
          </div>
          <Card className="p-4 mt-4">
            <div className="text-sm font-medium mb-2">Funnel</div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { stage: "Impressions", v: c?.totalImpressions ?? 0 },
                  { stage: "Visits", v: c?.websiteVisits ?? 0 },
                  { stage: "Leads", v: business.data?.mql ?? 0 },
                  { stage: "SQL", v: business.data?.sql ?? 0 },
                  { stage: "Admissions", v: business.data?.admissions ?? 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3}/>
                  <XAxis dataKey="stage" fontSize={10}/><YAxis fontSize={10}/><Tooltip/>
                  <Bar dataKey="v" fill="#3B82F6"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="pt-4">
          <Card className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left p-3">Campaign</th>
                  <th className="text-right p-3">Total</th>
                  <th className="text-right p-3">Published</th>
                  <th className="text-right p-3">Failed</th>
                  <th className="text-right p-3">Platforms</th>
                  <th className="text-right p-3">Success %</th>
                </tr>
              </thead>
              <tbody>
                {(campaigns.data?.campaigns ?? []).map((r) => (
                  <tr key={r.campaign} className="border-t">
                    <td className="p-3 font-medium">{r.campaign}</td>
                    <td className="p-3 text-right">{r.total}</td>
                    <td className="p-3 text-right">{r.published}</td>
                    <td className="p-3 text-right">{r.failed}</td>
                    <td className="p-3 text-right">{r.platforms.join(", ")}</td>
                    <td className="p-3 text-right">{r.successRate}%</td>
                  </tr>
                ))}
                {(campaigns.data?.campaigns ?? []).length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No campaigns yet.</td></tr>
                )}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="pt-4 space-y-3">
          <ContentSection title="Top Hooks" items={insights.data?.insights?.topHooks as unknown as string[]}/>
          <ContentSection title="Top Headlines" items={insights.data?.insights?.topHeadlines as unknown as string[]}/>
          <ContentSection title="Top Keywords" items={insights.data?.insights?.topKeywords as unknown as string[]}/>
          <ContentSection title="Top CTAs" items={insights.data?.insights?.topCtas as unknown as string[]}/>
        </TabsContent>

        <TabsContent value="posting" className="pt-4 space-y-4">
          <Card className="p-4">
            <div className="text-sm font-medium mb-3 flex items-center justify-between">
              <span>Posting Heatmap (day × hour)</span>
              {heatmap.data && (
                <Badge variant="info">
                  Best: {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][heatmap.data.bestDay]} @ {heatmap.data.bestHour}:00
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-[auto_repeat(24,1fr)] gap-0.5 text-[9px]">
              <div/>
              {Array.from({ length: 24 }).map((_, h) => <div key={h} className="text-center text-muted-foreground">{h}</div>)}
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d, di) => (
                <div key={d} className="contents">
                  <div className="text-muted-foreground pr-1 self-center">{d}</div>
                  {Array.from({ length: 24 }).map((_, h) => {
                    const v = heatmap.data?.grid?.[di]?.[h] ?? 0;
                    const alpha = Math.min(1, v / 5);
                    return (
                      <div key={h} className="aspect-square rounded"
                        style={{ background: `rgba(59,130,246,${0.08 + alpha * 0.8})` }}
                        title={`${d} ${h}:00 → ${v}`}/>
                    );
                  })}
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="audience" className="pt-4">
          <Card className="p-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 mb-2"><PieIcon className="size-4"/><span className="font-medium text-foreground">Audience Analytics</span></div>
            Country, State, City, Age, Language, Device, and Profession breakdowns become available once
            connectors (GA4, Meta Insights, LinkedIn, X, Search Console) are enabled. Architecture is prepared.
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="pt-4">
          <Card className="p-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 mb-2"><BarChart3 className="size-4"/><span className="font-medium text-foreground">SEO Analytics</span></div>
            Organic traffic, keyword rankings, blog performance, CTR/bounce, backlinks — pulls from the
            existing SEO Engine and Blog OS once Search Console is connected. Placeholder module.
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="pt-4 space-y-3">
          <Card className="p-4">
            <div className="text-sm font-medium mb-2 flex items-center gap-2"><Sparkles className="size-4 text-primary"/>AI Insights</div>
            {insights.isLoading ? <div className="text-sm text-muted-foreground">Analyzing…</div> : (
              <div className="space-y-2 text-sm">
                <Insight k="Highest quality leads platform" v={insights.data?.insights?.highestQualityLeadsPlatform as unknown as string}/>
                <Insight k="Highest ROI campaign" v={insights.data?.insights?.highestRoiCampaign as unknown as string}/>
                <Insight k="Best posting time" v={insights.data?.insights?.bestPostingTime as unknown as string}/>
                <Insight k="Content type driving admissions" v={insights.data?.insights?.contentTypeDrivingAdmissions as unknown as string}/>
                <Insight k="Best CTA" v={insights.data?.insights?.bestCta as unknown as string}/>
                <Insight k="Next week recommendation" v={insights.data?.insights?.nextWeekRecommendation as unknown as string}/>
              </div>
            )}
          </Card>
          <Card className="p-4">
            <div className="text-sm font-medium mb-2">Top Insights</div>
            <ul className="text-sm space-y-1 list-disc pl-5">
              {(insights.data?.insights?.topInsights as unknown as string[] ?? []).map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="pt-4">
          <Card className="p-4">
            <div className="text-sm font-medium mb-2 flex items-center gap-2"><TrendingUp className="size-4 text-primary"/>Next 30 Days Forecast</div>
            {forecast.isLoading ? <div className="text-sm text-muted-foreground">Predicting…</div> : (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Kpi label="Expected Reach" value={String(forecast.data?.forecast?.expectedReach ?? "—")} icon={<Users className="size-4"/>}/>
                <Kpi label="Expected Leads" value={String(forecast.data?.forecast?.expectedLeads ?? "—")} icon={<Target className="size-4"/>}/>
                <Kpi label="Expected Revenue" value={String(forecast.data?.forecast?.expectedRevenue ?? "—")} icon={<DollarSign className="size-4"/>}/>
                <Kpi label="Follower Growth" value={String(forecast.data?.forecast?.followerGrowth ?? "—")} icon={<TrendingUp className="size-4"/>}/>
                <Kpi label="Campaign Success" value={`${forecast.data?.forecast?.campaignSuccessProbability ?? "—"}%`} icon={<Zap className="size-4"/>}/>
              </div>
            )}
            {forecast.data?.forecast?.rationale && (
              <div className="mt-3 text-sm text-muted-foreground">{String(forecast.data.forecast.rationale)}</div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="pt-4">
          <Card className="p-0 overflow-hidden">
            <div className="p-3 flex items-center justify-between border-b">
              <div className="text-sm font-medium">Saved Reports</div>
              <Button size="sm" onClick={saveReport}><Sparkles className="size-4 mr-1"/>Save current view</Button>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Kind</th>
                  <th className="text-left p-3">Range</th>
                  <th className="text-left p-3">Format</th>
                  <th className="text-left p-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {(reports.data?.reports ?? []).map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-3 font-medium">{r.name}</td>
                    <td className="p-3 capitalize">{r.kind}</td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {r.range_from ? new Date(r.range_from).toLocaleDateString() : "—"} → {r.range_to ? new Date(r.range_to).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-3">{r.format}</td>
                    <td className="p-3 text-muted-foreground text-xs">{new Date(r.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {(reports.data?.reports ?? []).length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No reports yet.</td></tr>
                )}
              </tbody>
            </table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Future connectors */}
      <Card className="p-4">
        <div className="text-sm font-medium mb-2">Future Connectors</div>
        <div className="flex flex-wrap gap-2 text-xs">
          {["Google Analytics 4","Meta Insights","LinkedIn Analytics","X Analytics","Google Search Console","HubSpot","Salesforce"].map((n) => (
            <Badge key={n} variant="outline">{n} · prepared</Badge>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Kpi({ icon, label, value }: { icon?: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        {icon}{label}
      </div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </Card>
  );
}

function Insight({ k, v }: { k: string; v?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground w-56 shrink-0">{k}</div>
      <div className="text-sm">{v ?? "—"}</div>
    </div>
  );
}

function ContentSection({ title, items }: { title: string; items?: string[] }) {
  return (
    <Card className="p-4">
      <div className="text-sm font-medium mb-2">{title}</div>
      {items && items.length ? (
        <ul className="text-sm space-y-1 list-disc pl-5">{items.map((t, i) => <li key={i}>{String(t)}</li>)}</ul>
      ) : <div className="text-sm text-muted-foreground">Not enough data yet.</div>}
    </Card>
  );
}
