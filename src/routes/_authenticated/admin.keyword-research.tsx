import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listKeywordProjects, createKeywordProject, deleteKeywordProject,
  getKeywordProject, discoverKeywords, generateContentCalendar,
  generateOpportunityReport, suggestInternalLinks,
} from "@/lib/admin/keyword-research.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, Sparkles, Plus, Trash2, Calendar, FileText, Link2, TrendingUp,
  Target, BarChart3, Loader2, Zap, Layers,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/keyword-research")({
  component: KeywordResearchPage,
});

const SUBJECTS: Array<{ v: string; label: string }> = [
  { v: "course", label: "Course" },
  { v: "internship", label: "Internship" },
  { v: "technology", label: "Technology" },
  { v: "programming_language", label: "Programming Language" },
  { v: "career", label: "Career" },
  { v: "skill", label: "Skill" },
  { v: "college", label: "College" },
  { v: "university", label: "University" },
  { v: "job_role", label: "Job Role" },
  { v: "city", label: "City" },
  { v: "state", label: "State" },
  { v: "country", label: "Country" },
];

const CATEGORY_LABEL: Record<string, string> = {
  primary: "Primary", secondary: "Secondary", long_tail: "Long Tail",
  question: "Question", transactional: "Transactional", commercial: "Commercial",
  informational: "Informational", comparison: "Comparison", trending: "Trending",
};

function KeywordResearchPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listKeywordProjects);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const projectsQ = useQuery({ queryKey: ["kw-projects"], queryFn: () => listFn() });

  return (
    <div className="space-y-4 max-w-[1400px]">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
            <Search className="size-5 text-primary" /> AI Keyword Research
          </h1>
          <p className="text-sm text-muted-foreground">
            Discover keywords, cluster them, generate a 12-month calendar and internal-linking plan.
          </p>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <ProjectsSidebar
          projects={projectsQ.data ?? []}
          loading={projectsQ.isLoading}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onChanged={() => qc.invalidateQueries({ queryKey: ["kw-projects"] })}
        />
        {selectedId ? (
          <ProjectWorkspace
            projectId={selectedId}
            onDeleted={() => {
              setSelectedId(null);
              qc.invalidateQueries({ queryKey: ["kw-projects"] });
            }}
          />
        ) : (
          <Card className="p-10 text-center text-muted-foreground">
            <Sparkles className="size-8 mx-auto mb-3 text-primary" />
            <p className="text-sm">Select a research project or create a new one to begin.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

// ============= SIDEBAR =============

function ProjectsSidebar({ projects, loading, selectedId, onSelect, onChanged }: {
  projects: any[]; loading: boolean; selectedId: string | null;
  onSelect: (id: string) => void; onChanged: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const createFn = useServerFn(createKeywordProject);
  const [form, setForm] = useState({
    name: "", subject_type: "course", seed_query: "", location: "India",
  });

  const createM = useMutation({
    mutationFn: () => createFn({ data: form as any }),
    onSuccess: (r: any) => {
      toast.success("Project created");
      setCreating(false);
      setForm({ name: "", subject_type: "course", seed_query: "", location: "India" });
      onChanged();
      onSelect(r.id);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to create"),
  });

  return (
    <Card className="p-3 space-y-3 h-fit">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-sm">Projects</h2>
        <Button size="sm" variant="outline" onClick={() => setCreating((v) => !v)}>
          <Plus className="size-3.5 mr-1" /> New
        </Button>
      </div>

      {creating && (
        <div className="space-y-2 rounded-lg border p-3 bg-muted/30">
          <Input placeholder="Project name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select value={form.subject_type} onValueChange={(v) => setForm({ ...form, subject_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SUBJECTS.map((s) => <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="Seed query (e.g. Data Science)" value={form.seed_query}
            onChange={(e) => setForm({ ...form, seed_query: e.target.value })} />
          <Input placeholder="Location (optional)" value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <Button size="sm" className="w-full" disabled={!form.name || !form.seed_query || createM.isPending}
            onClick={() => createM.mutate()}>
            {createM.isPending ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
            Create Project
          </Button>
        </div>
      )}

      <div className="space-y-1 max-h-[600px] overflow-y-auto">
        {loading && <div className="text-xs text-muted-foreground p-3">Loading…</div>}
        {!loading && projects.length === 0 && (
          <div className="text-xs text-muted-foreground p-3">No projects yet.</div>
        )}
        {projects.map((p) => (
          <button key={p.id} onClick={() => onSelect(p.id)}
            className={`w-full text-left rounded-md px-3 py-2 text-sm transition ${
              selectedId === p.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted"
            }`}>
            <div className="font-medium truncate">{p.name}</div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <Badge variant="outline" className="text-[9px]">
                {SUBJECTS.find((s) => s.v === p.subject_type)?.label ?? p.subject_type}
              </Badge>
              <span className="truncate">{p.seed_query}</span>
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}

// ============= WORKSPACE =============

function ProjectWorkspace({ projectId, onDeleted }: { projectId: string; onDeleted: () => void }) {
  const qc = useQueryClient();
  const getFn = useServerFn(getKeywordProject);
  const discoverFn = useServerFn(discoverKeywords);
  const calendarFn = useServerFn(generateContentCalendar);
  const reportFn = useServerFn(generateOpportunityReport);
  const linksFn = useServerFn(suggestInternalLinks);
  const deleteFn = useServerFn(deleteKeywordProject);

  const q = useQuery({
    queryKey: ["kw-project", projectId],
    queryFn: () => getFn({ data: { id: projectId } as any }),
  });

  const [report, setReport] = useState<any>(null);
  const [links, setLinks] = useState<any[] | null>(null);

  const discoverM = useMutation({
    mutationFn: () => discoverFn({ data: { project_id: projectId } as any }),
    onSuccess: (r: any) => {
      toast.success(`Generated ${r.keywords_generated} keywords`);
      qc.invalidateQueries({ queryKey: ["kw-project", projectId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Discovery failed"),
  });

  const calendarM = useMutation({
    mutationFn: () => calendarFn({ data: { project_id: projectId } as any }),
    onSuccess: (r: any) => {
      toast.success(`Planned ${r.items_generated} content items`);
      qc.invalidateQueries({ queryKey: ["kw-project", projectId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Calendar failed"),
  });

  const reportM = useMutation({
    mutationFn: () => reportFn({ data: { project_id: projectId } as any }),
    onSuccess: (r: any) => { setReport(r); toast.success("Report generated"); },
    onError: (e: any) => toast.error(e?.message ?? "Report failed"),
  });

  const linksM = useMutation({
    mutationFn: () => linksFn({ data: { project_id: projectId } as any }),
    onSuccess: (r: any) => { setLinks(r.links); toast.success("Links suggested"); },
    onError: (e: any) => toast.error(e?.message ?? "Links failed"),
  });

  const deleteM = useMutation({
    mutationFn: () => deleteFn({ data: { id: projectId } as any }),
    onSuccess: () => { toast.success("Deleted"); onDeleted(); },
  });

  if (q.isLoading) return <Card className="p-10 text-center"><Loader2 className="size-6 animate-spin mx-auto" /></Card>;
  if (!q.data) return null;

  const { project, keywords, plan } = q.data as any;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-display text-xl font-semibold">{project.name}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="outline">{SUBJECTS.find((s) => s.v === project.subject_type)?.label}</Badge>
              <Badge variant="outline"><Target className="size-3 mr-1" />{project.seed_query}</Badge>
              {project.location && <Badge variant="outline">{project.location}</Badge>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" onClick={() => discoverM.mutate()} disabled={discoverM.isPending}>
              {discoverM.isPending ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <Sparkles className="size-3.5 mr-1" />}
              Discover Keywords
            </Button>
            <Button size="sm" variant="outline" onClick={() => calendarM.mutate()}
              disabled={calendarM.isPending || !keywords.length}>
              {calendarM.isPending ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <Calendar className="size-3.5 mr-1" />}
              Build 12-Month Calendar
            </Button>
            <Button size="sm" variant="outline" onClick={() => reportM.mutate()} disabled={reportM.isPending}>
              {reportM.isPending ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <BarChart3 className="size-3.5 mr-1" />}
              SEO Report
            </Button>
            <Button size="sm" variant="ghost" onClick={() => deleteM.mutate()}
              disabled={deleteM.isPending} className="text-destructive hover:text-destructive">
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
        {project.summary && (
          <div className="mt-3 grid gap-2 md:grid-cols-3 text-xs">
            <div className="rounded-md bg-muted/40 p-2"><b>Opportunity:</b> {project.summary.opportunity}</div>
            <div className="rounded-md bg-muted/40 p-2"><b>Audience:</b> {project.summary.audience}</div>
            <div className="rounded-md bg-muted/40 p-2"><b>Positioning:</b> {project.summary.positioning}</div>
          </div>
        )}
      </Card>

      <Tabs defaultValue="keywords">
        <TabsList>
          <TabsTrigger value="keywords"><Sparkles className="size-3.5 mr-1" />Keywords ({keywords.length})</TabsTrigger>
          <TabsTrigger value="clusters"><Layers className="size-3.5 mr-1" />Clusters</TabsTrigger>
          <TabsTrigger value="calendar"><Calendar className="size-3.5 mr-1" />Calendar ({plan.length})</TabsTrigger>
          <TabsTrigger value="links"><Link2 className="size-3.5 mr-1" />Internal Links</TabsTrigger>
          <TabsTrigger value="report"><BarChart3 className="size-3.5 mr-1" />Report</TabsTrigger>
        </TabsList>

        <TabsContent value="keywords">
          <KeywordsTable keywords={keywords} />
        </TabsContent>

        <TabsContent value="clusters">
          <ClustersView keywords={keywords} />
        </TabsContent>

        <TabsContent value="calendar">
          <CalendarView plan={plan} />
        </TabsContent>

        <TabsContent value="links">
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">AI recommendations for internal links between planned pages.</div>
              <Button size="sm" onClick={() => linksM.mutate()} disabled={linksM.isPending || !plan.length}>
                {linksM.isPending ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <Zap className="size-3.5 mr-1" />}
                Suggest Links
              </Button>
            </div>
            {links && links.length > 0 && (
              <div className="space-y-2">
                {links.map((l: any, i: number) => (
                  <div key={i} className="rounded-md border p-2 text-sm">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{l.from}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium">{l.to}</span>
                      <Badge variant="outline" className="text-[10px]">{l.anchor}</Badge>
                    </div>
                    {l.reason && <div className="text-xs text-muted-foreground mt-1">{l.reason}</div>}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="report">
          <ReportView report={report} onGenerate={() => reportM.mutate()} loading={reportM.isPending} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============= SUB-VIEWS =============

function KeywordsTable({ keywords }: { keywords: any[] }) {
  const [filter, setFilter] = useState<string>("all");
  const filtered = filter === "all" ? keywords : keywords.filter((k) => k.category === filter);

  const cats = Object.keys(CATEGORY_LABEL);

  if (!keywords.length) {
    return <Card className="p-10 text-center text-sm text-muted-foreground">
      No keywords yet. Click <b>Discover Keywords</b> to run AI research.
    </Card>;
  }

  return (
    <Card className="p-3 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
          All ({keywords.length})
        </Button>
        {cats.map((c) => {
          const n = keywords.filter((k) => k.category === c).length;
          if (!n) return null;
          return (
            <Button key={c} size="sm" variant={filter === c ? "default" : "outline"} onClick={() => setFilter(c)}>
              {CATEGORY_LABEL[c]} ({n})
            </Button>
          );
        })}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground border-b">
            <tr>
              <th className="text-left py-2 px-2">Keyword</th>
              <th className="text-left px-2">Category</th>
              <th className="text-left px-2">Intent</th>
              <th className="text-right px-2">Volume</th>
              <th className="text-right px-2">Diff</th>
              <th className="text-right px-2">CPC</th>
              <th className="text-right px-2">Est. Traffic</th>
              <th className="text-right px-2">Priority</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((k) => (
              <tr key={k.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="py-1.5 px-2 font-medium">{k.keyword}</td>
                <td className="px-2"><Badge variant="outline" className="text-[10px]">{CATEGORY_LABEL[k.category] || k.category}</Badge></td>
                <td className="px-2 text-xs">{k.intent}</td>
                <td className="px-2 text-right">{(k.monthly_volume || 0).toLocaleString()}</td>
                <td className="px-2 text-right">
                  <span className={
                    k.difficulty < 30 ? "text-emerald-600" :
                    k.difficulty < 60 ? "text-amber-600" : "text-red-600"
                  }>{k.difficulty}</span>
                </td>
                <td className="px-2 text-right">${Number(k.cpc || 0).toFixed(2)}</td>
                <td className="px-2 text-right">{(k.estimated_traffic || 0).toLocaleString()}</td>
                <td className="px-2 text-right font-medium">{k.priority}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ClustersView({ keywords }: { keywords: any[] }) {
  const clusters: Record<string, any[]> = {};
  keywords.forEach((k) => {
    const c = k.cluster || "Uncategorised";
    if (!clusters[c]) clusters[c] = [];
    clusters[c].push(k);
  });
  const entries = Object.entries(clusters).sort((a, b) => b[1].length - a[1].length);

  if (!entries.length) return <Card className="p-10 text-center text-sm text-muted-foreground">No clusters yet.</Card>;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {entries.map(([name, items]) => {
        const totalVol = items.reduce((s, k) => s + (k.monthly_volume || 0), 0);
        return (
          <Card key={name} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">{name}</h3>
              <div className="text-xs text-muted-foreground">
                {items.length} kw · {totalVol.toLocaleString()} vol
              </div>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {items.slice(0, 20).map((k) => (
                <div key={k.id} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                  <span className="truncate">{k.keyword}</span>
                  <Badge variant="outline" className="text-[9px] ml-2 shrink-0">{CATEGORY_LABEL[k.category] || k.category}</Badge>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function CalendarView({ plan }: { plan: any[] }) {
  if (!plan.length) {
    return <Card className="p-10 text-center text-sm text-muted-foreground">
      No calendar yet. Discover keywords, then click <b>Build 12-Month Calendar</b>.
    </Card>;
  }
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {months.map((m) => {
        const items = plan.filter((p) => p.month === m);
        if (!items.length) return null;
        return (
          <Card key={m} className="p-3">
            <div className="font-medium text-sm mb-2 flex items-center gap-2">
              <Calendar className="size-3.5 text-primary" />
              Month {m} — {monthNames[m - 1]}
              <Badge variant="outline" className="text-[10px] ml-auto">{items.length}</Badge>
            </div>
            <div className="space-y-2">
              {items.map((it) => (
                <div key={it.id} className="rounded-md border p-2 text-xs space-y-1">
                  <div className="font-medium text-sm">{it.title}</div>
                  <div className="flex items-center gap-1 flex-wrap">
                    <Badge variant="outline" className="text-[9px]">{it.content_type}</Badge>
                    {it.cluster && <Badge variant="outline" className="text-[9px]">{it.cluster}</Badge>}
                    {typeof it.priority === "number" && (
                      <Badge variant="outline" className="text-[9px]">
                        <TrendingUp className="size-2.5 mr-0.5" />P{it.priority}
                      </Badge>
                    )}
                  </div>
                  {it.target_keyword && (
                    <div className="text-muted-foreground">🎯 {it.target_keyword}</div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function ReportView({ report, onGenerate, loading }: { report: any; onGenerate: () => void; loading: boolean }) {
  if (!report) {
    return (
      <Card className="p-10 text-center">
        <FileText className="size-8 mx-auto mb-3 text-primary" />
        <p className="text-sm text-muted-foreground mb-3">Generate a complete SEO opportunity report.</p>
        <Button onClick={onGenerate} disabled={loading}>
          {loading ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <BarChart3 className="size-3.5 mr-1" />}
          Generate Report
        </Button>
      </Card>
    );
  }
  const { totals, distribution, top_opportunities, quick_wins } = report;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-5">
        <MetricCard label="Keywords" value={totals.keywords} />
        <MetricCard label="Total Volume" value={totals.total_monthly_volume.toLocaleString()} />
        <MetricCard label="Est. Traffic / mo" value={totals.estimated_monthly_traffic.toLocaleString()} />
        <MetricCard label="Avg Difficulty" value={totals.average_difficulty} />
        <MetricCard label="Content Planned" value={totals.content_planned} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="p-4">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" /> Top Opportunities
          </h3>
          <div className="space-y-1.5">
            {top_opportunities.map((k: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm border-b last:border-0 py-1.5">
                <div className="truncate">
                  <div className="font-medium">{k.keyword}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {CATEGORY_LABEL[k.category] || k.category} · {k.cluster}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className="text-xs">V {k.volume?.toLocaleString()} · D {k.difficulty}</div>
                  <div className="text-[10px] text-muted-foreground">P {k.priority}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Zap className="size-4 text-emerald-600" /> Quick Wins (low difficulty + solid volume)
          </h3>
          {quick_wins.length === 0 ? (
            <p className="text-xs text-muted-foreground">No quick wins found — consider longer-tail phrasing.</p>
          ) : (
            <div className="space-y-1.5">
              {quick_wins.map((k: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm border-b last:border-0 py-1.5">
                  <span className="truncate font-medium">{k.keyword}</span>
                  <div className="text-xs text-muted-foreground shrink-0 ml-2">
                    V {k.volume?.toLocaleString()} · D <span className="text-emerald-600">{k.difficulty}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="font-medium mb-3">Distribution</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <div className="text-xs text-muted-foreground mb-1">By Category</div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(distribution.by_category).map(([k, v]: any) => (
                <Badge key={k} variant="outline">{CATEGORY_LABEL[k] || k}: {v}</Badge>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">By Cluster</div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(distribution.by_cluster).map(([k, v]: any) => (
                <Badge key={k} variant="outline">{k}: {v}</Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: any }) {
  return (
    <Card className="p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </Card>
  );
}
