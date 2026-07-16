import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Workflow, Plus, Sparkles, Search, Calendar, BarChart3, CheckCircle2, Clock,
  FileText, Send, Archive, Eye, RefreshCw, ShieldCheck, Ban, PenLine, User, Filter,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/content-pipeline")({
  component: ContentPipelinePage,
});

// ------- Types -------
type Status =
  | "planned" | "generating" | "draft" | "review" | "approved" | "scheduled" | "published" | "rejected" | "archived";

type ContentType =
  | "Blog" | "Learn Guide" | "Career Guide" | "Roadmap" | "Glossary"
  | "FAQ" | "Comparison" | "Interview Guide" | "Project Guide" | "Case Study";

type Priority = "P0" | "P1" | "P2" | "P3";

interface Topic {
  id: string;
  topic: string;
  primaryKeyword: string;
  secondaryKeywords: string;
  category: string;
  contentType: ContentType;
  priority: Priority;
  audience: string;
  estimatedLength: number;
  language: string;
  country: string;
  status: Status;
  editor?: string;
  reviewer?: string;
  scheduledAt?: string;
  seoScore?: number;
  contentScore?: number;
  createdAt: string;
}

const CONTENT_TYPES: ContentType[] = [
  "Blog", "Learn Guide", "Career Guide", "Roadmap", "Glossary",
  "FAQ", "Comparison", "Interview Guide", "Project Guide", "Case Study",
];

const CATEGORIES = ["AI & ML", "Career", "Data Science", "Cyber Security", "Programming", "Business", "Design"];

const STATUS_TONES: Record<Status, string> = {
  planned:    "bg-slate-100 text-slate-700 border-slate-200",
  generating: "bg-violet-50 text-violet-700 border-violet-200",
  draft:      "bg-blue-50 text-blue-700 border-blue-200",
  review:     "bg-amber-50 text-amber-700 border-amber-200",
  approved:   "bg-emerald-50 text-emerald-700 border-emerald-200",
  scheduled:  "bg-sky-50 text-sky-700 border-sky-200",
  published:  "bg-teal-50 text-teal-700 border-teal-200",
  rejected:   "bg-rose-50 text-rose-700 border-rose-200",
  archived:   "bg-neutral-100 text-neutral-600 border-neutral-200",
};

const SEED: Topic[] = [
  { id: "t1", topic: "What is Prompt Engineering?", primaryKeyword: "prompt engineering", secondaryKeywords: "llm prompting, ai prompts", category: "AI & ML", contentType: "Learn Guide", priority: "P0", audience: "Beginners", estimatedLength: 3000, language: "English", country: "IN", status: "planned", createdAt: new Date().toISOString() },
  { id: "t2", topic: "Data Analyst vs Data Scientist", primaryKeyword: "data analyst vs data scientist", secondaryKeywords: "career comparison", category: "Career", contentType: "Comparison", priority: "P1", audience: "Students", estimatedLength: 2200, language: "English", country: "IN", status: "draft", editor: "Aarav", createdAt: new Date().toISOString() },
  { id: "t3", topic: "AI Product Manager Roadmap 2026", primaryKeyword: "ai product manager roadmap", secondaryKeywords: "ai pm skills", category: "Career", contentType: "Roadmap", priority: "P1", audience: "Working Pros", estimatedLength: 3500, language: "English", country: "IN", status: "review", editor: "Meera", reviewer: "Kabir", seoScore: 82, contentScore: 88, createdAt: new Date().toISOString() },
  { id: "t4", topic: "Top 25 ML Interview Questions", primaryKeyword: "ml interview questions", secondaryKeywords: "machine learning interview", category: "AI & ML", contentType: "Interview Guide", priority: "P2", audience: "Job Seekers", estimatedLength: 4000, language: "English", country: "IN", status: "approved", editor: "Ravi", reviewer: "Sana", seoScore: 91, contentScore: 92, createdAt: new Date().toISOString() },
  { id: "t5", topic: "Build a RAG Chatbot with LangChain", primaryKeyword: "rag chatbot langchain", secondaryKeywords: "retrieval augmented", category: "AI & ML", contentType: "Project Guide", priority: "P0", audience: "Developers", estimatedLength: 3800, language: "English", country: "IN", status: "scheduled", editor: "Meera", reviewer: "Kabir", scheduledAt: "2026-07-22T09:00", seoScore: 88, contentScore: 90, createdAt: new Date().toISOString() },
];

// ------- Page -------
function ContentPipelinePage() {
  const [topics, setTopics] = useState<Topic[]>(SEED);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const stats = useMemo(() => {
    const c = (s: Status) => topics.filter((t) => t.status === s).length;
    return {
      planned: c("planned"),
      draft: c("draft"),
      review: c("review"),
      approved: c("approved"),
      scheduled: c("scheduled"),
      published: c("published"),
      rejected: c("rejected"),
    };
  }, [topics]);

  const filtered = useMemo(() => {
    return topics.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (typeFilter !== "all" && t.contentType !== typeFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          t.topic.toLowerCase().includes(q) ||
          t.primaryKeyword.toLowerCase().includes(q) ||
          (t.editor?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [topics, query, statusFilter, categoryFilter, typeFilter]);

  const updateStatus = (id: string, status: Status, extra?: Partial<Topic>) => {
    setTopics((prev) => prev.map((t) => (t.id === id ? { ...t, status, ...extra } : t)));
  };

  return (
    <div className="space-y-6 max-w-[1400px]">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
            <Workflow className="size-5 text-primary" /> Content Pipeline
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Queue hundreds of future articles, generate drafts on demand with AI, and route every piece through editor review before it publishes.
          </p>
        </div>
        <AddTopicDialog onCreate={(t) => setTopics((prev) => [t, ...prev])} />
      </header>

      <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-[12px] leading-relaxed">
        <strong className="text-primary">Editorial rule:</strong> nothing publishes automatically. Every article requires a human approval step before it can be scheduled or shipped.
      </div>

      <StatsRow stats={stats} totalPlanned={topics.length} />

      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="queue"><FileText className="size-4 mr-1.5" />Topic Queue</TabsTrigger>
          <TabsTrigger value="review"><Eye className="size-4 mr-1.5" />Editor Review</TabsTrigger>
          <TabsTrigger value="schedule"><Calendar className="size-4 mr-1.5" />Scheduling</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart3 className="size-4 mr-1.5" />Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          <FilterBar
            query={query} setQuery={setQuery}
            statusFilter={statusFilter} setStatusFilter={setStatusFilter}
            categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter}
            typeFilter={typeFilter} setTypeFilter={setTypeFilter}
          />
          <QueueTable topics={filtered} onAction={updateStatus} />
        </TabsContent>

        <TabsContent value="review">
          <ReviewLane topics={topics.filter((t) => t.status === "review" || t.status === "draft")} onAction={updateStatus} />
        </TabsContent>

        <TabsContent value="schedule">
          <ScheduleLane topics={topics.filter((t) => t.status === "approved" || t.status === "scheduled")} onAction={updateStatus} />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsView topics={topics} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ------- Stats -------
function StatsRow({ stats, totalPlanned }: { stats: Record<string, number>; totalPlanned: number }) {
  const cards = [
    { label: "Topics Planned", value: totalPlanned, icon: FileText, tone: "text-slate-700" },
    { label: "Drafts Generated", value: stats.draft, icon: Sparkles, tone: "text-blue-700" },
    { label: "Awaiting Review", value: stats.review, icon: Clock, tone: "text-amber-700" },
    { label: "Approved", value: stats.approved, icon: CheckCircle2, tone: "text-emerald-700" },
    { label: "Scheduled", value: stats.scheduled, icon: Calendar, tone: "text-sky-700" },
    { label: "Published", value: stats.published, icon: Send, tone: "text-teal-700" },
    { label: "Rejected", value: stats.rejected, icon: Ban, tone: "text-rose-700" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card key={c.label} className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{c.label}</span>
              <Icon className={`size-4 ${c.tone}`} />
            </div>
            <div className="mt-1 text-2xl font-semibold">{c.value}</div>
          </Card>
        );
      })}
    </div>
  );
}

// ------- Add Topic -------
function AddTopicDialog({ onCreate }: { onCreate: (t: Topic) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Topic>>({
    contentType: "Blog", priority: "P2", language: "English", country: "IN",
    estimatedLength: 2500, category: CATEGORIES[0], status: "planned",
  });

  const submit = () => {
    if (!form.topic || !form.primaryKeyword) {
      toast.error("Topic and primary keyword are required");
      return;
    }
    const t: Topic = {
      id: crypto.randomUUID(),
      topic: form.topic!,
      primaryKeyword: form.primaryKeyword!,
      secondaryKeywords: form.secondaryKeywords || "",
      category: form.category || CATEGORIES[0],
      contentType: (form.contentType as ContentType) || "Blog",
      priority: (form.priority as Priority) || "P2",
      audience: form.audience || "General",
      estimatedLength: Number(form.estimatedLength) || 2500,
      language: form.language || "English",
      country: form.country || "IN",
      status: "planned",
      createdAt: new Date().toISOString(),
    };
    onCreate(t);
    toast.success("Topic added to queue");
    setOpen(false);
    setForm({ contentType: "Blog", priority: "P2", language: "English", country: "IN", estimatedLength: 2500, category: CATEGORIES[0], status: "planned" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="size-4 mr-1.5" />Add Topic</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Queue a new topic</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label>Topic</Label>
            <Input value={form.topic || ""} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="e.g. What is Retrieval Augmented Generation?" />
          </div>
          <div className="space-y-1.5">
            <Label>Primary Keyword</Label>
            <Input value={form.primaryKeyword || ""} onChange={(e) => setForm({ ...form, primaryKeyword: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Secondary Keywords</Label>
            <Input value={form.secondaryKeywords || ""} onChange={(e) => setForm({ ...form, secondaryKeywords: e.target.value })} placeholder="comma separated" />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Content Type</Label>
            <Select value={form.contentType} onValueChange={(v) => setForm({ ...form, contentType: v as ContentType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CONTENT_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Priority })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(["P0","P1","P2","P3"] as Priority[]).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Target Audience</Label>
            <Input value={form.audience || ""} onChange={(e) => setForm({ ...form, audience: e.target.value })} placeholder="Beginners, Working Pros..." />
          </div>
          <div className="space-y-1.5">
            <Label>Estimated Length (words)</Label>
            <Input type="number" value={form.estimatedLength || 2500} onChange={(e) => setForm({ ...form, estimatedLength: Number(e.target.value) })} />
          </div>
          <div className="space-y-1.5">
            <Label>Language</Label>
            <Input value={form.language || ""} onChange={(e) => setForm({ ...form, language: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Target Country</Label>
            <Input value={form.country || ""} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="IN, US, GB..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}>Add to queue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------- Filters -------
function FilterBar(props: {
  query: string; setQuery: (s: string) => void;
  statusFilter: Status | "all"; setStatusFilter: (s: Status | "all") => void;
  categoryFilter: string; setCategoryFilter: (s: string) => void;
  typeFilter: string; setTypeFilter: (s: string) => void;
}) {
  return (
    <Card className="p-3 flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[240px]">
        <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-8" placeholder="Search by keyword, topic, or editor" value={props.query} onChange={(e) => props.setQuery(e.target.value)} />
      </div>
      <Filter className="size-4 text-muted-foreground" />
      <Select value={props.statusFilter} onValueChange={(v) => props.setStatusFilter(v as Status | "all")}>
        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {(Object.keys(STATUS_TONES) as Status[]).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={props.categoryFilter} onValueChange={props.setCategoryFilter}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={props.typeFilter} onValueChange={props.setTypeFilter}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {CONTENT_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>
    </Card>
  );
}

// ------- Queue Table -------
function QueueTable({ topics, onAction }: { topics: Topic[]; onAction: (id: string, s: Status, extra?: Partial<Topic>) => void }) {
  if (!topics.length) {
    return <Card className="p-10 text-center text-sm text-muted-foreground">No topics match the current filters.</Card>;
  }

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Topic</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Editor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topics.map((t) => (
            <TableRow key={t.id}>
              <TableCell>
                <div className="font-medium">{t.topic}</div>
                <div className="text-[11px] text-muted-foreground">{t.primaryKeyword} · {t.category} · {t.estimatedLength}w · {t.country}</div>
              </TableCell>
              <TableCell><Badge variant="outline" className="text-[11px]">{t.contentType}</Badge></TableCell>
              <TableCell><Badge variant="outline" className="text-[11px]">{t.priority}</Badge></TableCell>
              <TableCell className="text-xs">
                {t.editor ? <span className="inline-flex items-center gap-1"><User className="size-3" />{t.editor}</span> : <span className="text-muted-foreground">Unassigned</span>}
              </TableCell>
              <TableCell><Badge className={`text-[11px] border ${STATUS_TONES[t.status]}`} variant="outline">{t.status}</Badge></TableCell>
              <TableCell className="text-right">
                <RowActions topic={t} onAction={onAction} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function RowActions({ topic, onAction }: { topic: Topic; onAction: (id: string, s: Status, extra?: Partial<Topic>) => void }) {
  const generate = () => {
    onAction(topic.id, "generating");
    toast.info("Generating draft with AI…");
    setTimeout(() => {
      onAction(topic.id, "draft", { editor: topic.editor || "Auto-assigned", seoScore: 78, contentScore: 82 });
      toast.success("Draft ready for review");
    }, 900);
  };

  return (
    <div className="inline-flex items-center gap-1">
      {(topic.status === "planned" || topic.status === "rejected") && (
        <Button size="sm" variant="outline" onClick={generate}><Sparkles className="size-3.5 mr-1" />Generate</Button>
      )}
      {topic.status === "draft" && (
        <Button size="sm" variant="outline" onClick={() => onAction(topic.id, "review")}><Eye className="size-3.5 mr-1" />Send to Review</Button>
      )}
      {topic.status === "review" && (
        <>
          <Button size="sm" variant="outline" onClick={() => onAction(topic.id, "approved")}><ShieldCheck className="size-3.5 mr-1" />Approve</Button>
          <Button size="sm" variant="ghost" onClick={() => onAction(topic.id, "rejected")}><Ban className="size-3.5 mr-1" />Reject</Button>
        </>
      )}
      {topic.status === "approved" && (
        <Button size="sm" variant="outline" onClick={() => onAction(topic.id, "scheduled", { scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16) })}><Calendar className="size-3.5 mr-1" />Schedule</Button>
      )}
      {topic.status === "scheduled" && (
        <Button size="sm" variant="outline" onClick={() => onAction(topic.id, "published")}><Send className="size-3.5 mr-1" />Publish</Button>
      )}
      {["draft","review","approved"].includes(topic.status) && (
        <Button size="sm" variant="ghost" onClick={() => { toast.info("Regenerating…"); setTimeout(() => toast.success("Draft refreshed"), 700); }}><RefreshCw className="size-3.5" /></Button>
      )}
      {topic.status !== "archived" && (
        <Button size="sm" variant="ghost" onClick={() => onAction(topic.id, "archived")}><Archive className="size-3.5" /></Button>
      )}
    </div>
  );
}

// ------- Review Lane -------
function ReviewLane({ topics, onAction }: { topics: Topic[]; onAction: (id: string, s: Status, extra?: Partial<Topic>) => void }) {
  if (!topics.length) return <Card className="p-10 text-center text-sm text-muted-foreground">Nothing awaiting editor review.</Card>;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {topics.map((t) => (
        <Card key={t.id} className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-medium">{t.topic}</div>
              <div className="text-[11px] text-muted-foreground">{t.contentType} · {t.category} · {t.primaryKeyword}</div>
            </div>
            <Badge className={`text-[11px] border ${STATUS_TONES[t.status]}`} variant="outline">{t.status}</Badge>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <ScoreChip label="SEO" value={t.seoScore ?? 0} />
            <ScoreChip label="Content" value={t.contentScore ?? 0} />
            <ScoreChip label="Length" value={t.estimatedLength} suffix="w" max={5000} />
          </div>

          <div className="rounded-md border bg-muted/30 p-2.5 text-[12px] space-y-1">
            <div className="font-medium text-foreground">AI output includes</div>
            <ul className="text-muted-foreground grid grid-cols-2 gap-x-3 gap-y-0.5">
              <li>· SEO title & slug</li>
              <li>· Meta description</li>
              <li>· Outline & article</li>
              <li>· FAQs</li>
              <li>· Internal links</li>
              <li>· Hero + infographic prompts</li>
              <li>· Social posts</li>
              <li>· Schema JSON-LD</li>
            </ul>
          </div>

          <Textarea placeholder="Editor notes (optional)…" className="min-h-[60px] text-sm" />

          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="outline"><PenLine className="size-3.5 mr-1" />Rewrite Section</Button>
            <Button size="sm" variant="outline"><Eye className="size-3.5 mr-1" />Preview</Button>
            <div className="flex-1" />
            <Button size="sm" variant="ghost" onClick={() => onAction(t.id, "rejected")}><Ban className="size-3.5 mr-1" />Reject</Button>
            <Button size="sm" onClick={() => onAction(t.id, "approved")}><ShieldCheck className="size-3.5 mr-1" />Approve</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function ScoreChip({ label, value, suffix, max = 100 }: { label: string; value: number; suffix?: string; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const tone = pct >= 80 ? "text-emerald-700 bg-emerald-50 border-emerald-200" : pct >= 60 ? "text-amber-700 bg-amber-50 border-amber-200" : "text-rose-700 bg-rose-50 border-rose-200";
  return (
    <div className={`rounded-md border px-2 py-1.5 ${tone}`}>
      <div className="text-[10px] uppercase tracking-wide opacity-70">{label}</div>
      <div className="font-semibold">{value}{suffix ?? ""}</div>
    </div>
  );
}

// ------- Schedule Lane -------
function ScheduleLane({ topics, onAction }: { topics: Topic[]; onAction: (id: string, s: Status, extra?: Partial<Topic>) => void }) {
  if (!topics.length) return <Card className="p-10 text-center text-sm text-muted-foreground">No approved articles ready to schedule.</Card>;
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Article</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Publish at</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topics.map((t) => (
            <TableRow key={t.id}>
              <TableCell>
                <div className="font-medium">{t.topic}</div>
                <div className="text-[11px] text-muted-foreground">{t.contentType} · {t.primaryKeyword}</div>
              </TableCell>
              <TableCell className="text-xs">{t.category}</TableCell>
              <TableCell>
                <Input
                  type="datetime-local"
                  className="h-8 w-[200px] text-xs"
                  value={t.scheduledAt || ""}
                  onChange={(e) => onAction(t.id, t.status, { scheduledAt: e.target.value })}
                />
              </TableCell>
              <TableCell><Badge className={`text-[11px] border ${STATUS_TONES[t.status]}`} variant="outline">{t.status}</Badge></TableCell>
              <TableCell className="text-right">
                {t.status === "approved" ? (
                  <Button size="sm" variant="outline" onClick={() => onAction(t.id, "scheduled")}><Calendar className="size-3.5 mr-1" />Schedule</Button>
                ) : (
                  <Button size="sm" onClick={() => onAction(t.id, "published")}><Send className="size-3.5 mr-1" />Publish now</Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

// ------- Analytics -------
function AnalyticsView({ topics }: { topics: Topic[] }) {
  const published = topics.filter((t) => t.status === "published").length;
  const drafts = topics.filter((t) => t.status === "draft" || t.status === "review").length;
  const avgSeo = avg(topics.map((t) => t.seoScore).filter(Boolean) as number[]);
  const avgContent = avg(topics.map((t) => t.contentScore).filter(Boolean) as number[]);

  const byCategory = CATEGORIES.map((c) => ({
    category: c,
    count: topics.filter((t) => t.category === c).length,
  })).filter((r) => r.count > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <StatCard label="Published" value={published} icon={Send} />
      <StatCard label="Drafts & In Review" value={drafts} icon={FileText} />
      <StatCard label="Avg SEO Score" value={avgSeo || "—"} icon={BarChart3} />
      <StatCard label="Avg Content Score" value={avgContent || "—"} icon={ShieldCheck} />
      <Card className="p-4 lg:col-span-2">
        <div className="text-sm font-medium mb-3">Volume by category</div>
        <div className="space-y-2">
          {byCategory.length ? byCategory.map((r) => (
            <div key={r.category} className="flex items-center gap-3 text-xs">
              <span className="w-32 shrink-0 text-muted-foreground">{r.category}</span>
              <div className="flex-1 h-2 bg-muted rounded"><div className="h-full bg-primary rounded" style={{ width: `${Math.min(100, r.count * 15)}%` }} /></div>
              <span className="w-6 text-right">{r.count}</span>
            </div>
          )) : <div className="text-xs text-muted-foreground">No data yet.</div>}
        </div>
      </Card>
      <Card className="p-4 lg:col-span-2">
        <div className="text-sm font-medium mb-3">Review time (median)</div>
        <div className="text-3xl font-semibold">4.2h</div>
        <div className="text-xs text-muted-foreground mt-1">From draft ready → editor approval, last 30 days.</div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
          <MiniStat label="Fastest" value="42m" />
          <MiniStat label="P50" value="4.2h" />
          <MiniStat label="P95" value="16.8h" />
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number | string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className="size-4 text-primary" />
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/30 p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}
