import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getSeoDashboard, listKeywordGroups, listClusters, upsertCluster, deleteCluster,
  listSeoPages, listReports, generateReport, runQuickAudit, listIntegrations,
  aiSuggestNextContent,
} from "@/lib/seo/hub.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  TrendingUp, Search, LayoutGrid, GitBranch, FileText, Sparkles,
  Calendar, ShieldCheck, Monitor, Trophy, BookOpen, Plug, BarChart3,
  Loader2, Plus, Trash2, Zap, Globe, Smartphone, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/marketing-os/seo-hub")({
  head: () => ({
    meta: [
      { title: "SEO Hub — Glintr Marketing OS" },
      { name: "description", content: "The SEO brain for every AI-generated blog, landing page, campaign, course page, and social post." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SeoHub,
});

const CATEGORIES = [
  "Admissions", "AI", "Machine Learning", "Data Science", "Cloud",
  "Cyber Security", "VLSI", "Robotics", "IoT",
  "Digital Marketing", "Finance", "HR",
];
const INTENTS = ["Informational", "Commercial", "Navigational", "Transactional", "Career", "Educational"];

function SeoHub() {
  const [tab, setTab] = useState("dashboard");
  const dashFn = useServerFn(getSeoDashboard);
  const { data: dash } = useQuery({ queryKey: ["seo-hub", "dash"], queryFn: () => dashFn() });

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-primary">Marketing OS · SEO</div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <TrendingUp className="size-6 text-primary" />
            SEO Hub
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            The SEO brain. Every AI-generated blog, landing page, campaign, course, and social post inherits keyword strategy, topic clusters, and technical health from this workspace.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/keyword-research"><Search className="size-3.5 mr-1.5" /> Keyword Research</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/seo-health"><ShieldCheck className="size-3.5 mr-1.5" /> Technical Health</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to={"/admin/programmatic-seo" as never}><LayoutGrid className="size-3.5 mr-1.5" /> pSEO</Link>
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto p-1 gap-1 justify-start">
          <TabsTrigger value="dashboard"><BarChart3 className="size-3.5 mr-1.5" />Dashboard</TabsTrigger>
          <TabsTrigger value="keywords"><Search className="size-3.5 mr-1.5" />Keywords</TabsTrigger>
          <TabsTrigger value="groups"><LayoutGrid className="size-3.5 mr-1.5" />Groups</TabsTrigger>
          <TabsTrigger value="clusters"><GitBranch className="size-3.5 mr-1.5" />Clusters</TabsTrigger>
          <TabsTrigger value="content"><FileText className="size-3.5 mr-1.5" />Content</TabsTrigger>
          <TabsTrigger value="ai"><Sparkles className="size-3.5 mr-1.5" />AI Suggestions</TabsTrigger>
          <TabsTrigger value="planner"><Calendar className="size-3.5 mr-1.5" />Blog Planner</TabsTrigger>
          <TabsTrigger value="onpage"><BookOpen className="size-3.5 mr-1.5" />On-Page</TabsTrigger>
          <TabsTrigger value="technical"><ShieldCheck className="size-3.5 mr-1.5" />Technical</TabsTrigger>
          <TabsTrigger value="serp"><Monitor className="size-3.5 mr-1.5" />SERP Preview</TabsTrigger>
          <TabsTrigger value="competitors"><Trophy className="size-3.5 mr-1.5" />Competitors</TabsTrigger>
          <TabsTrigger value="reports"><FileText className="size-3.5 mr-1.5" />Reports</TabsTrigger>
          <TabsTrigger value="integrations"><Plug className="size-3.5 mr-1.5" />Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4"><DashboardPane dash={dash} /></TabsContent>
        <TabsContent value="keywords" className="mt-4"><KeywordsPane /></TabsContent>
        <TabsContent value="groups" className="mt-4"><GroupsPane /></TabsContent>
        <TabsContent value="clusters" className="mt-4"><ClustersPane /></TabsContent>
        <TabsContent value="content" className="mt-4"><ContentPane /></TabsContent>
        <TabsContent value="ai" className="mt-4"><AiSuggestionsPane /></TabsContent>
        <TabsContent value="planner" className="mt-4"><PlannerPane /></TabsContent>
        <TabsContent value="onpage" className="mt-4"><OnPagePane /></TabsContent>
        <TabsContent value="technical" className="mt-4"><TechnicalPane /></TabsContent>
        <TabsContent value="serp" className="mt-4"><SerpPreviewPane /></TabsContent>
        <TabsContent value="competitors" className="mt-4"><CompetitorsPane /></TabsContent>
        <TabsContent value="reports" className="mt-4"><ReportsPane /></TabsContent>
        <TabsContent value="integrations" className="mt-4"><IntegrationsPane /></TabsContent>
      </Tabs>
    </div>
  );
}

// ---------- Dashboard ----------
function DashboardPane({ dash }: { dash: Awaited<ReturnType<typeof getSeoDashboard>> | undefined }) {
  const kpis = [
    { label: "Organic Traffic", value: dash?.organicTraffic ?? "—", note: "Awaiting GSC" },
    { label: "Indexed Pages", value: dash?.indexedPages ?? 0 },
    { label: "Keyword Rankings", value: dash?.keywordRankings ?? 0 },
    { label: "Top Keywords", value: dash?.topKeywordsCount ?? 0, note: "> 1k volume" },
    { label: "Landing Pages", value: dash?.totalPages ?? 0 },
    { label: "Blogs", value: dash?.totalBlogs ?? 0 },
    { label: "CTR", value: dash?.ctr ?? "—", note: "Awaiting GSC" },
    { label: "Avg Position", value: dash?.avgPosition ?? "—", note: "Awaiting GSC" },
    { label: "Backlinks", value: dash?.backlinks ?? "—", note: "Awaiting Ahrefs/SEMrush" },
    { label: "Technical Health", value: `${dash?.technicalHealth ?? 0}%`, tone: (dash?.technicalHealth ?? 0) >= 80 ? "emerald" : "amber" },
    { label: "Content Score", value: `${dash?.contentScore ?? 0}%` },
    { label: "SEO Score", value: `${dash?.seoScore ?? 0}%`, tone: (dash?.seoScore ?? 0) >= 80 ? "emerald" : "amber" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {kpis.map((k) => (
        <Card key={k.label} className="p-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">{k.label}</div>
          <div className={cn(
            "mt-2 text-2xl font-semibold tracking-tight",
            k.tone === "emerald" && "text-emerald-600",
            k.tone === "amber" && "text-amber-600",
          )}>{String(k.value)}</div>
          {k.note && <div className="text-[10px] text-muted-foreground mt-0.5">{k.note}</div>}
        </Card>
      ))}
      <Card className="p-4 col-span-2 md:col-span-3 xl:col-span-6 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-3">
          <Sparkles className="size-5 text-primary" />
          <div className="flex-1">
            <div className="font-medium text-sm">Content intelligence</div>
            <div className="text-xs text-muted-foreground">
              {dash?.clusters ?? 0} topic clusters · {dash?.suggestions ?? 0} AI suggestions · {dash?.geoQuestions ?? 0} GEO questions · {dash?.tshPagesCrawled ?? 0} pages crawled · {dash?.openIssues ?? 0} open issues
            </div>
          </div>
          <Button size="sm" asChild>
            <Link to="/admin/ai-seo">Open AI SEO</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ---------- Keywords (delegates to existing route) ----------
function KeywordsPane() {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-medium flex items-center gap-2"><Search className="size-4" /> Keyword Research</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Volume, difficulty, intent, trend, competition, CPC, country, language, SERP features, related keywords, questions, autocomplete, and long-tail — all managed inside the dedicated Keyword Research workspace.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            {["Volume","Difficulty","Intent","Trend","Competition","CPC","Country","Language","SERP Features","Related","Questions","Autocomplete","Long tail"].map((f) => (
              <span key={f} className="px-2 py-0.5 rounded-full border border-border/60">{f}</span>
            ))}
          </div>
        </div>
        <Button asChild><Link to="/admin/keyword-research"><ExternalLink className="size-3.5 mr-1.5" />Open workspace</Link></Button>
      </div>
    </Card>
  );
}

// ---------- Groups ----------
function GroupsPane() {
  const listFn = useServerFn(listKeywordGroups);
  const { data } = useQuery({ queryKey: ["seo-hub", "groups"], queryFn: () => listFn() });
  const preset = CATEGORIES;
  const groups = data?.groups ?? [];
  const totalByPreset = new Map(groups.map((g) => [g.name, g]));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {preset.map((cat) => {
          const g = totalByPreset.get(cat);
          return (
            <Card key={cat} className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{cat}</div>
                <Badge variant="outline" className="text-[10px]">{g?.keywords ?? 0}</Badge>
              </div>
              <div className="mt-3 text-xs text-muted-foreground space-y-0.5">
                <div>Volume · <span className="text-foreground">{(g?.totalVolume ?? 0).toLocaleString()}</span></div>
                <div>Avg difficulty · <span className="text-foreground">{g?.avgDifficulty ?? 0}</span></div>
                <div>Intents · <span className="text-foreground">{(g?.intents ?? []).join(", ") || "—"}</span></div>
              </div>
            </Card>
          );
        })}
      </div>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium text-sm">Custom groups</div>
          <span className="text-xs text-muted-foreground">{groups.length} total</span>
        </div>
        {groups.filter((g) => !preset.includes(g.name)).length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No custom groups yet. Any keyword `cluster` value that isn't a preset appears here automatically.</p>
        ) : (
          <div className="divide-y divide-border/60">
            {groups.filter((g) => !preset.includes(g.name)).map((g) => (
              <div key={g.name} className="flex items-center gap-3 py-2 text-sm">
                <span className="font-medium flex-1">{g.name}</span>
                <span className="text-xs text-muted-foreground">{g.keywords} kw · {g.totalVolume.toLocaleString()} vol · diff {g.avgDifficulty}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ---------- Clusters ----------
function ClustersPane() {
  const qc = useQueryClient();
  const listFn = useServerFn(listClusters);
  const upsertFn = useServerFn(upsertCluster);
  const deleteFn = useServerFn(deleteCluster);
  const { data } = useQuery({ queryKey: ["seo-hub", "clusters"], queryFn: () => listFn() });

  const [form, setForm] = useState({ name: "", category: "", pillar_title: "", target_keyword: "", intent: "Informational", supporting: "" });
  const [open, setOpen] = useState(false);

  const save = useMutation({
    mutationFn: async () => upsertFn({ data: {
      name: form.name, category: form.category || undefined,
      pillar_title: form.pillar_title || undefined,
      target_keyword: form.target_keyword || undefined,
      intent: form.intent,
      supporting_keywords: form.supporting.split(",").map((s) => s.trim()).filter(Boolean),
    } }),
    onSuccess: () => {
      toast.success("Cluster saved");
      setOpen(false); setForm({ name: "", category: "", pillar_title: "", target_keyword: "", intent: "Informational", supporting: "" });
      qc.invalidateQueries({ queryKey: ["seo-hub", "clusters"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seo-hub", "clusters"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium flex items-center gap-2"><GitBranch className="size-4" /> Topic Clusters</h3>
          <p className="text-xs text-muted-foreground">Pillar pages, supporting articles, internal linking, content hierarchy.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="size-3.5 mr-1.5" /> New cluster</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create topic cluster</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Cluster name</label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Generative AI for Sales" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Category</label>
                  <select className="w-full h-9 rounded-md border border-border/60 bg-background px-2 text-sm" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                    <option value="">—</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Intent</label>
                  <select className="w-full h-9 rounded-md border border-border/60 bg-background px-2 text-sm" value={form.intent} onChange={(e) => setForm((f) => ({ ...f, intent: e.target.value }))}>
                    {INTENTS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Pillar title</label>
                <Input value={form.pillar_title} onChange={(e) => setForm((f) => ({ ...f, pillar_title: e.target.value }))} placeholder="The complete guide to generative AI in sales" />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Target keyword</label>
                <Input value={form.target_keyword} onChange={(e) => setForm((f) => ({ ...f, target_keyword: e.target.value }))} />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Supporting keywords (comma-separated)</label>
                <Textarea rows={3} value={form.supporting} onChange={(e) => setForm((f) => ({ ...f, supporting: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => save.mutate()} disabled={!form.name || save.isPending}>
                {save.isPending && <Loader2 className="size-3.5 mr-1.5 animate-spin" />} Save cluster
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {(data?.clusters ?? []).length === 0 ? (
        <Card className="p-8 text-center">
          <GitBranch className="size-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No clusters yet. Create one to anchor a pillar page and its supporting articles.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {(data?.clusters ?? []).map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{c.pillar_title || "—"}</div>
                </div>
                <Badge variant="outline" className="capitalize text-[10px]">{c.status}</Badge>
              </div>
              <div className="mt-3 text-xs text-muted-foreground space-y-0.5">
                <div>Target · <span className="text-foreground">{c.target_keyword || "—"}</span></div>
                <div>Intent · <span className="text-foreground">{c.intent || "—"}</span></div>
                <div>Supporting · <span className="text-foreground">{(c.supporting_keywords ?? []).length}</span></div>
              </div>
              <div className="mt-3 flex justify-end">
                <Button size="sm" variant="ghost" onClick={() => del.mutate(c.id)}>
                  <Trash2 className="size-3.5 text-red-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Content Intelligence ----------
function ContentPane() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="p-5">
        <h3 className="font-medium flex items-center gap-2"><FileText className="size-4" /> Analyze existing assets</h3>
        <p className="text-xs text-muted-foreground mt-1">Route to the modules where each asset type lives.</p>
        <div className="mt-4 space-y-2">
          {[
            { label: "Existing blogs", to: "/admin/blogs", icon: FileText },
            { label: "Landing pages", to: "/admin/programmatic-seo", icon: LayoutGrid },
            { label: "Course pages", to: "/admin/courses", icon: BookOpen },
            { label: "Emails", to: "/admin/marketing-os/campaigns", icon: FileText },
            { label: "Social posts", to: "/admin/marketing-os/publisher", icon: FileText },
          ].map((r) => (
            <Link key={r.to} to={r.to as never} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border/60 hover:border-primary/60 hover:bg-muted/40 text-sm">
              <r.icon className="size-4 text-muted-foreground" />
              <span className="flex-1">{r.label}</span>
              <ExternalLink className="size-3.5 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="font-medium flex items-center gap-2"><Sparkles className="size-4" /> Suggested actions</h3>
        <p className="text-xs text-muted-foreground mt-1">AI-detected gaps to prioritize.</p>
        <div className="mt-4 space-y-3">
          {[
            { label: "Missing topics", note: "Topics your competitors cover but you don't." },
            { label: "Content gaps", note: "Clusters with pillar pages but few supporting articles." },
            { label: "Duplicate topics", note: "Multiple pages targeting the same keyword." },
            { label: "Thin content", note: "Pages under recommended word count / score." },
          ].map((g) => (
            <div key={g.label} className="flex items-start gap-3 p-3 rounded-lg border border-border/60">
              <Zap className="size-4 text-primary mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium">{g.label}</div>
                <div className="text-xs text-muted-foreground">{g.note}</div>
              </div>
              <Button asChild size="sm" variant="ghost"><Link to="/admin/ai-seo">Analyze</Link></Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ---------- AI Suggestions ----------
function AiSuggestionsPane() {
  const aiFn = useServerFn(aiSuggestNextContent);
  const [topic, setTopic] = useState("");
  const mut = useMutation({
    mutationFn: async () => aiFn({ data: { topic } }),
    onError: (e: Error) => toast.error(e.message),
  });
  const s = (mut.data?.suggestions ?? {}) as Record<string, string>;
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="font-medium flex items-center gap-2"><Sparkles className="size-4 text-primary" /> Recommend next content</h3>
        <p className="text-xs text-muted-foreground">AI drafts the next blog, landing page, keyword, campaign, FAQ, and course topic — all through the central AI Router.</p>
        <div className="mt-3 flex gap-2">
          <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. AI-powered sales careers in India" />
          <Button onClick={() => mut.mutate()} disabled={!topic || mut.isPending}>
            {mut.isPending && <Loader2 className="size-3.5 mr-1.5 animate-spin" />} Suggest
          </Button>
        </div>
      </Card>
      {mut.data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { key: "next_blog", label: "Next Blog" },
            { key: "next_landing_page", label: "Next Landing Page" },
            { key: "next_keyword", label: "Next Keyword" },
            { key: "next_campaign", label: "Next Campaign" },
            { key: "next_faq", label: "Next FAQ" },
            { key: "next_course_topic", label: "Next Course Topic" },
          ].map((r) => (
            <Card key={r.key} className="p-4">
              <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-primary">{r.label}</div>
              <div className="mt-2 text-sm">{s[r.key] ?? "—"}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Blog Planner ----------
function PlannerPane() {
  const now = new Date();
  const weeks = Array.from({ length: 4 }, (_, i) => `Week ${i + 1}`);
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-medium flex items-center gap-2"><Calendar className="size-4" /> Blog Planner</h3>
          <p className="text-xs text-muted-foreground">Monthly view · {now.toLocaleString("default", { month: "long", year: "numeric" })}</p>
        </div>
        <Button asChild size="sm" variant="outline"><Link to="/admin/marketing-os/calendar"><ExternalLink className="size-3.5 mr-1.5" /> Full calendar</Link></Button>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {weeks.map((w) => (
          <div key={w} className="rounded-lg border border-border/60 p-3 bg-muted/20 min-h-[160px]">
            <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground mb-2">{w}</div>
            <div className="text-xs text-muted-foreground">Priority slots seeded from clusters + keyword gaps land here as you approve them from AI Suggestions.</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---------- On-Page SEO ----------
function OnPagePane() {
  const listFn = useServerFn(listSeoPages);
  const { data } = useQuery({ queryKey: ["seo-hub", "pages"], queryFn: () => listFn() });
  const pages = data?.pages ?? [];
  const fields = ["Title","Meta Title","Meta Description","Slug","Canonical","Schema","OG","Twitter","Alt","H-Struct","Read","Internal","External"];
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium flex items-center gap-2"><BookOpen className="size-4" /> On-Page SEO</h3>
        <span className="text-xs text-muted-foreground">{pages.length} tracked pages</span>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {fields.map((f) => <span key={f} className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 uppercase tracking-wider text-muted-foreground">{f}</span>)}
      </div>
      {pages.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No pages tracked yet. Tracked pages appear here as they are audited by the SEO engine.
        </p>
      ) : (
        <div className="divide-y divide-border/60 -mx-2">
          {pages.slice(0, 25).map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-2 py-2 text-sm">
              <div className="flex-1 min-w-0">
                <div className="truncate font-medium">{p.title || p.url}</div>
                <div className="text-xs text-muted-foreground truncate">{p.url}</div>
              </div>
              <Badge variant="outline" className="text-[10px]">SEO {p.seo_score ?? 0}</Badge>
              <Badge variant="outline" className="text-[10px]">Content {p.content_score ?? 0}</Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ---------- Technical ----------
function TechnicalPane() {
  const qc = useQueryClient();
  const auditFn = useServerFn(runQuickAudit);
  const run = useMutation({
    mutationFn: async () => auditFn({ data: {} }),
    onSuccess: () => { toast.success("Audit complete"); qc.invalidateQueries({ queryKey: ["seo-hub"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const items = [
    "Broken links", "Redirects", "Canonical issues", "Robots.txt", "Sitemap.xml",
    "Structured data", "Duplicate content", "Performance", "Core Web Vitals",
  ];
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium flex items-center gap-2"><ShieldCheck className="size-4" /> Technical SEO</h3>
            <p className="text-xs text-muted-foreground">Live signals stream from the existing `tsh_*` crawler tables. Core Web Vitals ships when the GA/GSC integration is enabled.</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => run.mutate()} disabled={run.isPending}>
              {run.isPending && <Loader2 className="size-3.5 mr-1.5 animate-spin" />} Run quick audit
            </Button>
            <Button asChild size="sm"><Link to="/admin/seo-health"><ExternalLink className="size-3.5 mr-1.5" /> Open Health Center</Link></Button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
          {items.map((it) => (
            <div key={it} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/60 text-sm">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              <span className="flex-1">{it}</span>
              {it === "Core Web Vitals" && <Badge variant="outline" className="text-[10px]">Placeholder</Badge>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ---------- SERP Preview ----------
function SerpPreviewPane() {
  const [title, setTitle] = useState("Learn AI-powered sales careers with Glintr");
  const [desc, setDesc] = useState("Launch. Sell. Grow. Glintr trains sales professionals to become entrepreneurs with AI-powered programs, mentorship, and hiring partners.");
  const [url, setUrl] = useState("https://glintr.com/programs/ai-sales");
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="p-5">
        <h3 className="font-medium flex items-center gap-2"><Monitor className="size-4" /> Preview inputs</h3>
        <div className="mt-3 space-y-3">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">URL</label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Title ({title.length}/60)</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Meta description ({desc.length}/160)</label>
            <Textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
        </div>
      </Card>
      <div className="space-y-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground"><Globe className="size-3.5" /> Desktop preview</div>
          <div className="text-xs text-emerald-700">{url}</div>
          <div className="text-lg text-blue-800 hover:underline cursor-pointer mt-1 line-clamp-1">{title}</div>
          <div className="text-sm text-neutral-600 line-clamp-2 mt-1">{desc}</div>
        </Card>
        <Card className="p-5 max-w-[380px]">
          <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground"><Smartphone className="size-3.5" /> Mobile preview</div>
          <div className="text-[11px] text-emerald-700">{url}</div>
          <div className="text-base text-blue-800 hover:underline cursor-pointer mt-1 line-clamp-2">{title}</div>
          <div className="text-xs text-neutral-600 line-clamp-3 mt-1">{desc}</div>
        </Card>
        <Card className="p-4 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Rich results:</span> once schema (`Course`, `FAQ`, `Article`, `BreadcrumbList`) is enabled on the page, star ratings, price, and FAQ dropdowns render here.
        </Card>
      </div>
    </div>
  );
}

// ---------- Competitors ----------
function CompetitorsPane() {
  return (
    <Card className="p-8 text-center">
      <Trophy className="size-6 text-muted-foreground mx-auto mb-2" />
      <div className="font-medium">Competitor architecture ready</div>
      <p className="text-sm text-muted-foreground max-w-lg mx-auto mt-1">
        Scraping and rank tracking are not implemented in this build. The data model, workspace scoping, and integration slots for Ahrefs, SEMrush, and Moz are prepared under Integrations so this pane lights up the moment a provider connects.
      </p>
    </Card>
  );
}

// ---------- Reports ----------
function ReportsPane() {
  const qc = useQueryClient();
  const listFn = useServerFn(listReports);
  const genFn = useServerFn(generateReport);
  const { data } = useQuery({ queryKey: ["seo-hub", "reports"], queryFn: () => listFn() });
  const gen = useMutation({
    mutationFn: async (type: "daily"|"weekly"|"monthly"|"quarterly"|"yearly") => genFn({ data: { type } }),
    onSuccess: () => { toast.success("Report generated"); qc.invalidateQueries({ queryKey: ["seo-hub", "reports"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium flex items-center gap-2"><FileText className="size-4" /> Reports</h3>
          <div className="flex flex-wrap gap-1.5">
            {(["daily","weekly","monthly","quarterly","yearly"] as const).map((t) => (
              <Button key={t} size="sm" variant="outline" onClick={() => gen.mutate(t)} disabled={gen.isPending} className="capitalize">
                {t}
              </Button>
            ))}
          </div>
        </div>
        {(data?.reports ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No reports yet. Generate one from the buttons above.</p>
        ) : (
          <div className="divide-y divide-border/60 -mx-2">
            {(data?.reports ?? []).map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-2 py-2 text-sm">
                <Badge variant="outline" className="capitalize">{r.report_type}</Badge>
                <span className="text-xs text-muted-foreground">{r.period_start} → {r.period_end}</span>
                <div className="flex-1" />
                <span className="text-xs">{Object.keys((r.metrics ?? {}) as object).length} metric groups</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ---------- Integrations ----------
function IntegrationsPane() {
  const listFn = useServerFn(listIntegrations);
  const { data } = useQuery({ queryKey: ["seo-hub", "integrations"], queryFn: () => listFn() });
  const meta: Record<string, { name: string; note: string }> = {
    google_search_console: { name: "Google Search Console", note: "Impressions, clicks, CTR, average position, queries." },
    google_analytics: { name: "Google Analytics", note: "Sessions, engagement, conversion attribution." },
    bing_webmaster: { name: "Bing Webmaster Tools", note: "Impressions and coverage from Bing." },
    ahrefs: { name: "Ahrefs", note: "Backlink profile, referring domains, DR." },
    semrush: { name: "SEMrush", note: "Keyword position, SERP features, competitors." },
    moz: { name: "Moz", note: "Domain authority, page authority, spam score." },
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {(data?.integrations ?? []).map((i) => {
        const m = meta[i.provider] ?? { name: i.provider, note: "" };
        return (
          <Card key={i.provider} className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{m.name}</div>
              <Badge variant={i.status === "connected" ? "success" : "outline"} className="text-[10px] capitalize">{String(i.status).replace("_", " ")}</Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-1">{m.note}</div>
            <Button size="sm" variant="outline" disabled className="mt-3 w-full">
              <Plug className="size-3.5 mr-1.5" /> Connect (coming soon)
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
