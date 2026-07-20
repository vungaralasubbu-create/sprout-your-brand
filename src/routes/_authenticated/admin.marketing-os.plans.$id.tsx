import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMarketingPlan } from "@/lib/marketing-os/plans.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileDown, Calendar, Target, Users, Globe, Hash, Rocket } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/marketing-os/plans/$id")({
  component: PlanDetail,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

function PlanDetail() {
  const { id } = Route.useParams();
  const fn = useServerFn(getMarketingPlan);
  const { data, isLoading } = useQuery({
    queryKey: ["marketing-plan", id],
    queryFn: () => fn({ data: { id } }),
  });

  const [tab, setTab] = useState<"overview" | "calendar" | "platforms" | "seo" | "campaigns" | "trends" | "raw">("overview");

  if (isLoading) return <div className="p-10 text-center text-muted-foreground">Loading plan…</div>;
  if (!data) return <div className="p-10 text-center text-muted-foreground">Plan not found</div>;

  const plan = data.plan as Any;
  const pj: Any = plan.planner_json ?? {};

  function download() {
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${plan.business_name.replace(/\W+/g, "_")}-plan.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const TABS = [
    { k: "overview", l: "Overview", i: Target },
    { k: "calendar", l: "Content Calendar", i: Calendar },
    { k: "platforms", l: "Platforms", i: Hash },
    { k: "seo", l: "SEO Plan", i: Globe },
    { k: "campaigns", l: "Campaigns", i: Rocket },
    { k: "trends", l: "Trends", i: Users },
    { k: "raw", l: "Raw JSON", i: FileDown },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/marketing-os"><ArrowLeft className="size-4" /></Link>
          </Button>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{plan.business_name}</h2>
            <p className="text-sm text-muted-foreground">
              {plan.industry || "—"} · {plan.planning_period.replace("_", " ")} · v{plan.version} · {plan.status}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={download}><FileDown className="size-4 mr-2" /> Export JSON</Button>
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        {[
          { l: "Goals", v: (plan.goals ?? []).join(", ") || "—" },
          { l: "Audience", v: (plan.target_audience ?? []).join(", ") || "—" },
          { l: "Countries", v: (plan.countries ?? []).join(", ") || "Global" },
          { l: "Platforms", v: (plan.platforms ?? []).join(", ") || "—" },
        ].map((s) => (
          <Card key={s.l} className="p-4">
            <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">{s.l}</div>
            <div className="mt-1 text-sm">{s.v}</div>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border/60">
        {TABS.map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={
              "flex items-center gap-2 px-3 py-2 text-sm rounded-t-md border-b-2 " +
              (tab === t.k ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground")
            }
          >
            <t.i className="size-4" /> {t.l}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-5">
            <h3 className="font-semibold mb-2">Summary</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{pj.summary || "—"}</p>
          </Card>
          <Card className="p-5 space-y-2">
            <h3 className="font-semibold">Strategy</h3>
            <Row k="Positioning" v={pj.strategy?.positioning} />
            <Row k="Value Prop" v={pj.strategy?.value_proposition} />
            <Row k="North Star" v={pj.strategy?.north_star_metric} />
            {Array.isArray(pj.strategy?.kpis) && pj.strategy.kpis.length > 0 && (
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-3 mb-1">KPIs</div>
                <ul className="text-sm space-y-1">
                  {pj.strategy.kpis.map((k: Any, i: number) => (
                    <li key={i}>· <span className="font-medium">{k.name}</span> — {k.target}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
          <Card className="p-5 md:col-span-2">
            <h3 className="font-semibold mb-3">Audience Segments</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {(pj.audience_segments ?? []).map((a: Any, i: number) => (
                <div key={i} className="border rounded-md p-3">
                  <div className="font-medium text-sm">{a.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{a.persona}</div>
                  {Array.isArray(a.pain_points) && <div className="text-xs mt-2">Pains: {a.pain_points.join(", ")}</div>}
                  {Array.isArray(a.channels) && <div className="text-xs">Channels: {a.channels.join(", ")}</div>}
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5 md:col-span-2">
            <h3 className="font-semibold mb-2">Content Mix Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(pj.content_mix_summary ?? {}).map(([k, v]) => (
                <div key={k} className="border rounded-md p-3">
                  <div className="text-xs text-muted-foreground">{k}</div>
                  <div className="text-2xl font-semibold">{String(v)}%</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "calendar" && (
        <Card className="overflow-hidden">
          <div className="p-3 border-b border-border/60 text-sm text-muted-foreground">
            {Array.isArray(pj.content_calendar) ? `${pj.content_calendar.length} scheduled items` : "No calendar generated"}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Platform</th>
                  <th className="text-left p-2">Format</th>
                  <th className="text-left p-2">Pillar</th>
                  <th className="text-left p-2">Title</th>
                  <th className="text-left p-2">Hook</th>
                  <th className="text-left p-2">CTA</th>
                </tr>
              </thead>
              <tbody>
                {(pj.content_calendar ?? []).map((c: Any, i: number) => (
                  <tr key={i} className="border-t border-border/60 hover:bg-muted/30">
                    <td className="p-2 whitespace-nowrap font-mono text-xs">{c.date}</td>
                    <td className="p-2 whitespace-nowrap">{c.platform}</td>
                    <td className="p-2 whitespace-nowrap">{c.format}</td>
                    <td className="p-2 whitespace-nowrap text-muted-foreground">{c.pillar}</td>
                    <td className="p-2">{c.title}</td>
                    <td className="p-2 text-muted-foreground">{c.hook}</td>
                    <td className="p-2 text-xs">{c.cta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "platforms" && (
        <div className="grid md:grid-cols-2 gap-4">
          {Object.entries(pj.platform_strategy ?? {}).map(([p, s]) => {
            const ps = s as Any;
            return (
              <Card key={p} className="p-5 space-y-2">
                <h3 className="font-semibold">{p}</h3>
                <Row k="Role" v={ps.role} />
                <Row k="Tone" v={ps.tone} />
                <Row k="Cadence" v={ps.cadence} />
                <Row k="CTA style" v={ps.cta_style} />
                {Array.isArray(ps.content_pillars) && <Row k="Pillars" v={ps.content_pillars.join(", ")} />}
                {Array.isArray(ps.formats) && <Row k="Formats" v={ps.formats.join(", ")} />}
                {Array.isArray(ps.posting_times) && <Row k="Times" v={ps.posting_times.join(", ")} />}
                {Array.isArray(ps.hashtags) && ps.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ps.hashtags.map((h: string, i: number) => (
                      <span key={i} className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">{h}</span>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {tab === "seo" && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-5">
            <h3 className="font-semibold mb-2">Primary Keywords</h3>
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="text-left">Keyword</th><th className="text-left">Intent</th><th className="text-left">Vol</th></tr>
              </thead>
              <tbody>
                {(pj.seo_plan?.primary_keywords ?? []).map((k: Any, i: number) => (
                  <tr key={i} className="border-t border-border/60"><td className="py-1">{k.keyword}</td><td>{k.intent}</td><td className="text-muted-foreground">{k.monthly_volume_estimate}</td></tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold mb-2">Topic Clusters</h3>
            <ul className="text-sm space-y-2">
              {(pj.seo_plan?.topic_clusters ?? []).map((c: Any, i: number) => (
                <li key={i}>
                  <div className="font-medium">{c.pillar}</div>
                  <div className="text-xs text-muted-foreground">{(c.supporting_articles ?? []).join(" · ")}</div>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-5 md:col-span-2">
            <h3 className="font-semibold mb-2">Blog Calendar</h3>
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="text-left">Wk</th><th className="text-left">Title</th><th className="text-left">Keyword</th><th className="text-left">Outline</th></tr>
              </thead>
              <tbody>
                {(pj.seo_plan?.blog_calendar ?? []).map((b: Any, i: number) => (
                  <tr key={i} className="border-t border-border/60"><td className="py-1">{b.week}</td><td>{b.title}</td><td className="text-muted-foreground">{b.target_keyword}</td><td className="text-xs text-muted-foreground">{(b.outline ?? []).join(" › ")}</td></tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {tab === "campaigns" && (
        <div className="space-y-4">
          {(pj.campaign_plan ?? []).map((c: Any, i: number) => (
            <Card key={i} className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{c.name}</h3>
                  <p className="text-sm text-muted-foreground">{c.objective}</p>
                </div>
                <div className="text-xs font-mono text-muted-foreground">{c.start_date} → {c.end_date}</div>
              </div>
              <div className="mt-3 grid md:grid-cols-2 gap-2">
                {(c.phases ?? []).map((ph: Any, j: number) => (
                  <div key={j} className="border rounded-md p-3">
                    <div className="font-medium text-sm">{ph.phase} <span className="text-xs text-muted-foreground">({ph.days})</span></div>
                    <div className="text-xs mt-1">Channels: {(ph.channels ?? []).join(", ")}</div>
                    <div className="text-xs text-muted-foreground">Themes: {(ph.themes ?? []).join(", ")}</div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === "trends" && (
        <div className="grid md:grid-cols-2 gap-4">
          {[
            ["Trending Topics", pj.trend_plan?.trending_topics],
            ["Seasonal Topics", pj.trend_plan?.seasonal_topics],
            ["Festivals", pj.trend_plan?.festivals],
            ["Industry Events", pj.trend_plan?.industry_events],
            ["Hiring Season", pj.trend_plan?.hiring_season],
            ["Admissions Season", pj.trend_plan?.admissions_season],
          ].map(([label, arr]) => (
            <Card key={label as string} className="p-5">
              <h3 className="font-semibold mb-2">{label as string}</h3>
              <div className="flex flex-wrap gap-1.5">
                {(Array.isArray(arr) ? (arr as string[]) : []).map((x, i) => (
                  <span key={i} className="text-xs bg-muted px-2 py-1 rounded">{x}</span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === "raw" && (
        <Card className="p-4">
          <pre className="text-xs overflow-x-auto max-h-[70vh] whitespace-pre-wrap">{JSON.stringify(pj, null, 2)}</pre>
        </Card>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v?: string }) {
  if (!v) return null;
  return (
    <div className="text-sm">
      <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground mr-2">{k}</span>
      <span>{v}</span>
    </div>
  );
}
