import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  getBlogOsOverview,
  generateBlogWithAI,
  startProgrammaticJob,
  processProgrammaticJob,
  listGenerationJobs,
  scoreBlogSeo,
  scheduleBlog,
  listSchedules,
  refreshBlogWithAI,
  generateBlogAuditReport,
} from "@/lib/admin/blog-os.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sparkles, FileText, CheckCircle2, Clock, TrendingUp, TrendingDown, Eye, MousePointerClick,
  Activity, Calendar, Wand2, ListChecks, RefreshCw, FileBarChart2, Play, Loader2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/blog-os")({
  component: BlogOsDashboard,
});

function BlogOsDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-white">
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-cyan-300/80">
              <Sparkles className="h-3.5 w-3.5" /> Enterprise Blog Operating System
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Blog OS</h1>
            <p className="mt-1 text-sm text-white/60">
              Generate, optimize, schedule, and analyze thousands of SEO blogs from one command center.
            </p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6 flex w-full flex-wrap justify-start gap-2 bg-white/5 p-1">
            <TabsTrigger value="overview"><Activity className="mr-1.5 h-3.5 w-3.5" />Overview</TabsTrigger>
            <TabsTrigger value="generator"><Wand2 className="mr-1.5 h-3.5 w-3.5" />AI Generator</TabsTrigger>
            <TabsTrigger value="programmatic"><ListChecks className="mr-1.5 h-3.5 w-3.5" />Programmatic</TabsTrigger>
            <TabsTrigger value="scheduler"><Calendar className="mr-1.5 h-3.5 w-3.5" />Scheduler</TabsTrigger>
            <TabsTrigger value="seo"><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />SEO Score</TabsTrigger>
            <TabsTrigger value="refresh"><RefreshCw className="mr-1.5 h-3.5 w-3.5" />Refresh</TabsTrigger>
            <TabsTrigger value="report"><FileBarChart2 className="mr-1.5 h-3.5 w-3.5" />Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><OverviewPanel /></TabsContent>
          <TabsContent value="generator"><GeneratorPanel /></TabsContent>
          <TabsContent value="programmatic"><ProgrammaticPanel /></TabsContent>
          <TabsContent value="scheduler"><SchedulerPanel /></TabsContent>
          <TabsContent value="seo"><SeoPanel /></TabsContent>
          <TabsContent value="refresh"><RefreshPanel /></TabsContent>
          <TabsContent value="report"><AuditPanel /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, sub }: any) {
  return (
    <Card className="border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/50">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-white/50">{sub}</div>}
    </Card>
  );
}

function OverviewPanel() {
  const fetchOverview = useServerFn(getBlogOsOverview);
  const { data, isLoading } = useQuery({ queryKey: ["blog-os-overview"], queryFn: () => fetchOverview() });

  if (isLoading) return <div className="flex items-center gap-2 text-white/60"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>;
  if (!data) return <div className="text-white/60">No data.</div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={FileText} label="Total Blogs" value={data.counts.total} />
        <Metric icon={CheckCircle2} label="Published" value={data.counts.published} />
        <Metric icon={Clock} label="Drafts" value={data.counts.drafts} />
        <Metric icon={Calendar} label="Scheduled" value={data.counts.scheduled} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Metric icon={Eye} label="Views (30d)" value={data.traffic.views.toLocaleString()} />
        <Metric icon={MousePointerClick} label="Clicks (30d)" value={data.traffic.clicks.toLocaleString()} />
        <Metric icon={Activity} label="Impressions" value={data.traffic.impressions.toLocaleString()} />
        <Metric icon={TrendingUp} label="CTR" value={`${data.traffic.ctr}%`} />
        <Metric icon={TrendingUp} label="Avg Position" value={data.traffic.avgPosition || "—"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PostList title="Top Performers (30d)" icon={TrendingUp} posts={data.topPerformers} showViews />
        <PostList title="Needs Attention" icon={TrendingDown} posts={data.lowPerformers} showViews />
        <PostList title="Recently Published" icon={CheckCircle2} posts={data.recentlyPublished} />
        <PostList title="Recently Updated" icon={Clock} posts={data.recentlyUpdated} />
      </div>
    </div>
  );
}

function PostList({ title, icon: Icon, posts, showViews }: any) {
  return (
    <Card className="border-white/10 bg-white/[0.03] p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-cyan-300" /> {title}
      </div>
      <div className="space-y-2">
        {(posts ?? []).length === 0 && <div className="text-xs text-white/40">No data yet.</div>}
        {(posts ?? []).map((p: any) => (
          <div key={p.id} className="flex items-center justify-between rounded border border-white/5 bg-white/[0.02] px-3 py-2 text-sm">
            <div className="truncate">{p.title}</div>
            {showViews ? <Badge variant="muted" className="text-xs">{p.views ?? 0} views</Badge> : <span className="text-xs text-white/40">/{p.slug}</span>}
          </div>
        ))}
      </div>
    </Card>
  );
}

function GeneratorPanel() {
  const generate = useServerFn(generateBlogWithAI);
  const [form, setForm] = useState({
    primary_keyword: "",
    secondary_keywords: "",
    topic: "",
    angle: "guide" as const,
    target_words: 2000 as 1000 | 2000 | 3000 | 5000 | 10000,
    audience: "",
    location: "",
    provider: "gemini" as "gemini" | "openai",
  });
  const [result, setResult] = useState<any>(null);

  const m = useMutation({
    mutationFn: () => generate({
      data: {
        primary_keyword: form.primary_keyword,
        secondary_keywords: form.secondary_keywords.split(",").map((s) => s.trim()).filter(Boolean),
        topic: form.topic || undefined,
        angle: form.angle,
        target_words: form.target_words,
        audience: form.audience || undefined,
        location: form.location || undefined,
        save_as_draft: true,
        provider: form.provider,
      },
    }),
    onSuccess: (r: any) => { setResult(r); toast.success("Draft generated"); },
    onError: (e: any) => toast.error(e?.message ?? "Generation failed"),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <Card className="border-white/10 bg-white/[0.03] p-6">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold"><Wand2 className="h-4 w-4 text-cyan-300" />Blog Inputs</div>
        <div className="space-y-3">
          <div>
            <Label>Primary keyword</Label>
            <Input value={form.primary_keyword} onChange={(e) => setForm({ ...form, primary_keyword: e.target.value })} placeholder="best AI course in Bangalore" />
          </div>
          <div>
            <Label>Secondary keywords (comma-separated)</Label>
            <Input value={form.secondary_keywords} onChange={(e) => setForm({ ...form, secondary_keywords: e.target.value })} placeholder="ML course, generative AI training" />
          </div>
          <div>
            <Label>Topic angle</Label>
            <Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="Optional topic override" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Format</Label>
              <Select value={form.angle} onValueChange={(v: any) => setForm({ ...form, angle: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["guide", "tutorial", "comparison", "review", "roadmap", "listicle", "news"].map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Target length</Label>
              <Select value={String(form.target_words)} onValueChange={(v) => setForm({ ...form, target_words: Number(v) as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1000, 2000, 3000, 5000, 10000].map((n) => <SelectItem key={n} value={String(n)}>{n} words</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Audience</Label>
              <Input value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} placeholder="Career switchers" />
            </div>
            <div>
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Bangalore, India" />
            </div>
          </div>
          <div>
            <Label>AI provider</Label>
            <Select value={form.provider} onValueChange={(v: any) => setForm({ ...form, provider: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">Gemini 3.5 Flash (fast)</SelectItem>
                <SelectItem value="openai">GPT-5.4 Mini (premium)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" disabled={!form.primary_keyword || m.isPending} onClick={() => m.mutate()}>
            {m.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</> : <><Sparkles className="mr-2 h-4 w-4" />Generate blog draft</>}
          </Button>
        </div>
      </Card>

      <Card className="border-white/10 bg-white/[0.03] p-6">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold"><FileText className="h-4 w-4 text-cyan-300" />Preview</div>
        {!result && <div className="text-sm text-white/50">Generated content will appear here.</div>}
        {result?.ai && (
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-xs uppercase text-white/40">SEO Title</div>
              <div className="font-semibold">{result.ai.seo_title}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-white/40">Meta Description</div>
              <div className="text-white/80">{result.ai.meta_description}</div>
            </div>
            {result.blog && <Badge className="bg-emerald-500/20 text-emerald-300">Saved as draft · /{result.blog.slug}</Badge>}
            <div>
              <div className="text-xs uppercase text-white/40 mb-1">Content (Markdown)</div>
              <Textarea readOnly value={result.ai.content_markdown} className="min-h-[300px] font-mono text-xs" />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function ProgrammaticPanel() {
  const start = useServerFn(startProgrammaticJob);
  const process = useServerFn(processProgrammaticJob);
  const list = useServerFn(listGenerationJobs);
  const qc = useQueryClient();
  const [template, setTemplate] = useState("Best {course} Course in {city}");
  const [courses, setCourses] = useState("AI, Machine Learning, Data Science");
  const [cities, setCities] = useState("Bangalore, Hyderabad, Chennai, Pune, Mumbai");
  const [autoPublish, setAutoPublish] = useState(false);
  const jobs = useQuery({ queryKey: ["blog-os-jobs"], queryFn: () => list() });

  const startM = useMutation({
    mutationFn: () => start({
      data: {
        template,
        variables: {
          course: courses.split(",").map((s) => s.trim()).filter(Boolean),
          city: cities.split(",").map((s) => s.trim()).filter(Boolean),
        },
        angle: "guide",
        target_words: 1200,
        auto_publish: autoPublish,
      },
    }),
    onSuccess: (r: any) => { toast.success(`Queued ${r.count} blogs`); qc.invalidateQueries({ queryKey: ["blog-os-jobs"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const runM = useMutation({
    mutationFn: (id: string) => process({ data: { job_id: id, batch: 3 } }),
    onSuccess: () => { toast.success("Batch processed"); qc.invalidateQueries({ queryKey: ["blog-os-jobs"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/[0.03] p-6">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold"><ListChecks className="h-4 w-4 text-cyan-300" />Programmatic Matrix</div>
        <p className="mb-4 text-xs text-white/50">Use <code className="rounded bg-white/10 px-1">{"{variable}"}</code> tokens. Cartesian expansion — courses × cities.</p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>Title template</Label>
            <Input value={template} onChange={(e) => setTemplate(e.target.value)} />
          </div>
          <div>
            <Label>{"{course}"} values</Label>
            <Textarea value={courses} onChange={(e) => setCourses(e.target.value)} className="min-h-[80px]" />
          </div>
          <div>
            <Label>{"{city}"} values</Label>
            <Textarea value={cities} onChange={(e) => setCities(e.target.value)} className="min-h-[80px]" />
          </div>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={autoPublish} onChange={(e) => setAutoPublish(e.target.checked)} />
          Auto-publish (skip draft review)
        </label>
        <Button className="mt-4" onClick={() => startM.mutate()} disabled={startM.isPending}>
          {startM.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ListChecks className="mr-2 h-4 w-4" />}
          Queue programmatic job
        </Button>
      </Card>

      <Card className="border-white/10 bg-white/[0.03] p-6">
        <div className="mb-3 text-sm font-semibold">Recent Jobs</div>
        <div className="space-y-2">
          {jobs.data?.jobs?.length === 0 && <div className="text-xs text-white/40">No jobs yet.</div>}
          {jobs.data?.jobs?.map((j: any) => (
            <div key={j.id} className="flex items-center justify-between rounded border border-white/5 bg-white/[0.02] px-3 py-2 text-sm">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{j.title}</div>
                <div className="text-xs text-white/50">
                  {j.completed_items}/{j.total_items} done · {j.failed_items} failed · <Badge variant="outline" className="ml-1">{j.status}</Badge>
                </div>
              </div>
              {j.status !== "completed" && j.status !== "cancelled" && (
                <Button size="sm" variant="muted" onClick={() => runM.mutate(j.id)} disabled={runM.isPending}>
                  <Play className="mr-1 h-3 w-3" />Run batch
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SchedulerPanel() {
  const list = useServerFn(listSchedules);
  const sched = useServerFn(scheduleBlog);
  const qc = useQueryClient();
  const [blogId, setBlogId] = useState("");
  const [when, setWhen] = useState("");
  const [rec, setRec] = useState<"once" | "daily" | "weekly" | "monthly">("once");
  const items = useQuery({ queryKey: ["blog-os-schedules"], queryFn: () => list() });

  const m = useMutation({
    mutationFn: () => sched({ data: { blog_post_id: blogId, scheduled_for: new Date(when).toISOString(), recurrence: rec } }),
    onSuccess: () => { toast.success("Scheduled"); qc.invalidateQueries({ queryKey: ["blog-os-schedules"] }); setBlogId(""); setWhen(""); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-white/10 bg-white/[0.03] p-6">
        <div className="mb-4 text-sm font-semibold">Schedule a blog</div>
        <div className="space-y-3">
          <div><Label>Blog post ID</Label><Input value={blogId} onChange={(e) => setBlogId(e.target.value)} placeholder="uuid" /></div>
          <div><Label>Publish at</Label><Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /></div>
          <div>
            <Label>Recurrence</Label>
            <Select value={rec} onValueChange={(v: any) => setRec(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["once","daily","weekly","monthly"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" disabled={!blogId || !when} onClick={() => m.mutate()}>Schedule</Button>
        </div>
      </Card>
      <Card className="border-white/10 bg-white/[0.03] p-6">
        <div className="mb-3 text-sm font-semibold">Upcoming</div>
        <div className="space-y-2">
          {items.data?.schedules?.length === 0 && <div className="text-xs text-white/40">Nothing scheduled.</div>}
          {items.data?.schedules?.map((s: any) => (
            <div key={s.id} className="rounded border border-white/5 bg-white/[0.02] px-3 py-2 text-sm">
              <div className="font-medium">{s.blog_posts?.title ?? s.blog_post_id}</div>
              <div className="text-xs text-white/50">{new Date(s.scheduled_for).toLocaleString()} · {s.recurrence} · {s.status}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SeoPanel() {
  const score = useServerFn(scoreBlogSeo);
  const [blogId, setBlogId] = useState("");
  const [result, setResult] = useState<any>(null);
  const m = useMutation({
    mutationFn: () => score({ data: { blog_post_id: blogId } }),
    onSuccess: (r: any) => { setResult(r); toast.success("Scored"); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-white/10 bg-white/[0.03] p-6">
        <div className="mb-4 text-sm font-semibold">Score a blog post</div>
        <Label>Blog post ID</Label>
        <Input value={blogId} onChange={(e) => setBlogId(e.target.value)} placeholder="uuid" />
        <Button className="mt-3 w-full" onClick={() => m.mutate()} disabled={!blogId || m.isPending}>
          {m.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
          Run SEO audit
        </Button>
      </Card>
      <Card className="border-white/10 bg-white/[0.03] p-6">
        {result?.score ? (
          <>
            <div className="text-6xl font-bold text-cyan-300">{result.score.overall_score}</div>
            <div className="mt-1 text-xs uppercase text-white/50">Overall SEO Score</div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              {[
                ["Keywords", result.score.keyword_score],
                ["Readability", result.score.readability_score],
                ["Headings", result.score.headings_score],
                ["Links", result.score.links_score],
                ["Images", result.score.images_score],
                ["Meta", result.score.meta_score],
                ["Schema", result.score.schema_score],
                ["Word count", result.score.word_count],
              ].map(([k, v]) => (
                <div key={k as string} className="flex justify-between rounded border border-white/5 bg-white/[0.02] px-2 py-1">
                  <span className="text-white/60">{k}</span><span className="font-semibold">{v as any}</span>
                </div>
              ))}
            </div>
            {result.score.suggestions?.length > 0 && (
              <div className="mt-4">
                <div className="text-xs uppercase text-white/50 mb-1">Suggestions</div>
                <ul className="space-y-1 text-sm">
                  {result.score.suggestions.map((s: string, i: number) => (
                    <li key={i} className="text-white/70">• {s}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-white/50">Enter a blog ID and run audit.</div>
        )}
      </Card>
    </div>
  );
}

function RefreshPanel() {
  const refresh = useServerFn(refreshBlogWithAI);
  const [blogId, setBlogId] = useState("");
  const [result, setResult] = useState<any>(null);
  const m = useMutation({
    mutationFn: () => refresh({ data: { blog_post_id: blogId } }),
    onSuccess: (r: any) => { setResult(r); toast.success(`Refreshed · revision ${r.revision}`); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
  return (
    <Card className="border-white/10 bg-white/[0.03] p-6">
      <div className="mb-4 text-sm font-semibold">AI-refresh an old blog</div>
      <p className="mb-3 text-xs text-white/50">Snapshots the current version, then rewrites for the current year with updated stats, keywords, and FAQs.</p>
      <Label>Blog post ID</Label>
      <Input value={blogId} onChange={(e) => setBlogId(e.target.value)} placeholder="uuid" />
      <Button className="mt-3" onClick={() => m.mutate()} disabled={!blogId || m.isPending}>
        {m.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Refresh with AI
      </Button>
      {result && (
        <div className="mt-4 rounded border border-white/5 bg-white/[0.02] p-3">
          <div className="text-xs uppercase text-white/50">Changelog</div>
          <ul className="mt-1 space-y-1 text-sm">
            {(result.changelog ?? []).map((c: string, i: number) => <li key={i}>• {c}</li>)}
          </ul>
        </div>
      )}
    </Card>
  );
}

function AuditPanel() {
  const audit = useServerFn(generateBlogAuditReport);
  const { data, isLoading, refetch } = useQuery({ queryKey: ["blog-os-audit"], queryFn: () => audit() });

  if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
  if (!data) return null;
  return (
    <Card className="border-white/10 bg-white/[0.03] p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm font-semibold">Blog System Audit Report</div>
        <Button size="sm" variant="muted" onClick={() => refetch()}><RefreshCw className="mr-1 h-3 w-3" />Regenerate</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Metric icon={FileText} label="Total" value={data.totals.total} />
        <Metric icon={CheckCircle2} label="Published" value={data.totals.published} />
        <Metric icon={Activity} label="With Schema" value={data.totals.with_schema} />
        <Metric icon={Clock} label="Updated 30d" value={data.totals.updated_last_30d} />
      </div>
      {[
        ["Architecture", data.architecture],
        ["SEO Features", data.seo_features],
        ["AI Features", data.ai_features],
        ["Remaining Opportunities", data.opportunities],
      ].map(([title, items]: any) => (
        <div key={title} className="mt-5">
          <div className="text-xs uppercase tracking-wider text-white/50">{title}</div>
          <ul className="mt-2 space-y-1 text-sm">
            {items.map((s: string, i: number) => <li key={i} className="text-white/80">• {s}</li>)}
          </ul>
        </div>
      ))}
      <div className="mt-5 text-xs text-white/40">Generated {new Date(data.generated_at).toLocaleString()}</div>
    </Card>
  );
}
