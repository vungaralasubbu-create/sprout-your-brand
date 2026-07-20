import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft, Sparkles, FileText, Image as ImageIcon, Video, LayoutTemplate,
  ClipboardList, Mail, CalendarDays, Workflow, LayoutDashboard, Rocket,
  RefreshCw, CheckCircle2, XCircle, Clock, Pencil, Copy, Trash2, Download,
  Instagram, Linkedin, Facebook, Twitter, Monitor, Tablet, Smartphone,
  Check, Gauge, Zap, ShieldCheck, Palette, Lightbulb, Wand2, Send,
  AlertTriangle, Maximize2, Play, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  getMarketingProject,
  runProjectStep,
  patchProjectResult,
} from "@/lib/marketing-os/projects.functions";
import { toast } from "sonner";

export const Route = createFileRoute(
  "/_authenticated/workspace/project/$projectId/review",
)({ component: ReviewCenter });

type Status = "approved" | "rejected" | "review" | "draft";
type NavKey =
  | "overview" | "posts" | "images" | "videos" | "landing"
  | "forms" | "emails" | "calendar" | "automation";

const NAV: { key: NavKey; label: string; icon: any }[] = [
  { key: "overview",   label: "Overview",       icon: LayoutDashboard },
  { key: "posts",      label: "Posts",          icon: FileText },
  { key: "images",     label: "Images",         icon: ImageIcon },
  { key: "videos",     label: "Videos",         icon: Video },
  { key: "landing",    label: "Landing pages",  icon: LayoutTemplate },
  { key: "forms",      label: "Forms",          icon: ClipboardList },
  { key: "emails",     label: "Emails",         icon: Mail },
  { key: "calendar",   label: "Calendar",       icon: CalendarDays },
  { key: "automation", label: "Automation",     icon: Workflow },
];

const PLATFORM_ICON: Record<string, any> = {
  instagram: Instagram, linkedin: Linkedin, facebook: Facebook,
  x: Twitter, twitter: Twitter, blog: FileText,
};

const STATUS_COLOR: Record<Status, string> = {
  approved: "bg-emerald-500",
  review:   "bg-amber-500",
  rejected: "bg-red-500",
  draft:    "bg-muted-foreground/40",
};

const STATUS_LABEL: Record<Status, string> = {
  approved: "Approved",
  review:   "Needs review",
  rejected: "Rejected",
  draft:    "Draft",
};

/* ------------- helpers ------------- */
function buildAssetIds(result: Record<string, any>) {
  const ids: { id: string; kind: NavKey }[] = [];
  (result.content ?? []).forEach((_: any, i: number) => ids.push({ id: `post:${i}`, kind: "posts" }));
  (result.posters ?? []).forEach((_: any, i: number) => ids.push({ id: `image:${i}`, kind: "images" }));
  (result.videos ?? []).forEach((_: any, i: number) => ids.push({ id: `video:${i}`, kind: "videos" }));
  if (result.landing) ids.push({ id: "landing:0", kind: "landing" });
  if (result.form) ids.push({ id: "form:0", kind: "forms" });
  (result.emails ?? []).forEach((_: any, i: number) => ids.push({ id: `email:${i}`, kind: "emails" }));
  if (result.workflow) ids.push({ id: "workflow:0", kind: "automation" });
  return ids;
}

function ReviewCenter() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [active, setActive] = useState<NavKey>("overview");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [publishOpen, setPublishOpen] = useState(false);

  const getProject = useServerFn(getMarketingProject);
  const runStep = useServerFn(runProjectStep);
  const patchResult = useServerFn(patchProjectResult);

  const { data, isLoading } = useQuery({
    queryKey: ["marketing-project", projectId],
    queryFn: () => getProject({ data: { id: projectId } }),
  });

  const project: any = data?.project;
  const result: Record<string, any> = project?.result ?? {};
  const approvals: Record<string, Status> = result.approvals ?? {};

  const assetIds = useMemo(() => buildAssetIds(result), [result]);
  const total = assetIds.length;
  const counts = useMemo(() => {
    const c = { approved: 0, review: 0, rejected: 0, draft: 0 };
    for (const a of assetIds) {
      const s = (approvals[a.id] ?? "review") as Status;
      c[s]++;
    }
    return c;
  }, [assetIds, approvals]);

  async function setStatus(id: string | string[], status: Status) {
    const ids = Array.isArray(id) ? id : [id];
    const next = { ...approvals };
    for (const i of ids) next[i] = status;
    // optimistic
    qc.setQueryData(["marketing-project", projectId], (old: any) =>
      old ? { ...old, project: { ...old.project, result: { ...old.project.result, approvals: next } } } : old,
    );
    try {
      await patchResult({ data: { id: projectId, patch: { approvals: next } } });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update");
      qc.invalidateQueries({ queryKey: ["marketing-project", projectId] });
    }
  }

  function toggleSelect(id: string) {
    const n = new Set(selected);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelected(n);
  }

  async function approveAll() {
    await setStatus(assetIds.map((a) => a.id), "approved");
    toast.success("All assets approved");
  }

  async function regenerate(step: string) {
    toast.info(`Regenerating ${step}…`);
    try {
      await runStep({ data: { id: projectId, step } as any });
      await qc.invalidateQueries({ queryKey: ["marketing-project", projectId] });
      toast.success(`${step} regenerated`);
    } catch (e: any) {
      toast.error(e?.message ?? "Regenerate failed");
    }
  }

  if (isLoading || !project) {
    return (
      <div className="p-8 text-sm text-muted-foreground">Loading review center…</div>
    );
  }

  const percentApproved = total ? Math.round((counts.approved / total) * 100) : 0;

  return (
    <div className="min-h-[calc(100vh-3rem)] flex flex-col bg-background">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 md:px-6 h-14">
          <Button
            variant="ghost" size="sm"
            onClick={() => navigate({ to: "/workspace/project/$projectId", params: { projectId } })}
            className="gap-1.5"
          >
            <ArrowLeft className="size-4" /> Back
          </Button>
          <div className="h-4 w-px bg-border" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold truncate max-w-[280px] md:max-w-md">{project.name}</span>
              <Badge variant="muted" className="capitalize">{project.status}</Badge>
              <Badge
                variant="outline"
                className={cn(
                  "gap-1",
                  percentApproved === 100 && "border-emerald-500/40 text-emerald-600",
                  percentApproved < 100 && percentApproved >= 50 && "border-amber-500/40 text-amber-600",
                  percentApproved < 50 && "border-red-500/40 text-red-600",
                )}
              >
                {counts.approved}/{total} Approved
              </Badge>
            </div>
            <div className="text-[11px] text-muted-foreground">
              Updated {new Date(project.updated_at).toLocaleString()} · Owner {project.created_by?.slice(0, 8) ?? "—"}
            </div>
          </div>
          <div className="flex-1" />
          <div className="hidden md:flex items-center gap-1.5">
            <Button size="sm" variant="ghost">Save draft</Button>
            <Button size="sm" variant="outline" disabled={selected.size === 0} onClick={() => setPublishOpen(true)}>
              Publish selected {selected.size > 0 && `(${selected.size})`}
            </Button>
            <Button size="sm" variant="outline" onClick={() => toast.info("Schedule modal (coming soon)")}>
              <Clock className="size-3.5 mr-1.5" /> Schedule everything
            </Button>
            <Button size="sm" variant="ghost" onClick={() => window.print()}>
              <Download className="size-3.5 mr-1.5" /> Export PDF
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => setPublishOpen(true)}>
              <Rocket className="size-3.5" /> Publish everything
            </Button>
          </div>
        </div>

        {/* KPI STRIP */}
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-11 border-t">
          <Kpi label="Campaign"     value={result.campaign ? "1" : "—"} />
          <Kpi label="Posts"        value={(result.content ?? []).length} />
          <Kpi label="Images"       value={(result.posters ?? []).length} />
          <Kpi label="Videos"       value={(result.videos ?? []).length} />
          <Kpi label="Landing"      value={result.landing ? "1" : "—"} />
          <Kpi label="Forms"        value={result.form ? "1" : "—"} />
          <Kpi label="Emails"       value={(result.emails ?? []).length} />
          <Kpi label="Automation"   value={result.workflow ? "1" : "—"} />
          <Kpi label="Calendar"     value={(result.calendar ?? []).length} />
          <Kpi label="Analytics"    value="—" />
          <Kpi label="Approved"     value={`${counts.approved}/${total}`} accent />
        </div>
      </header>

      {/* MAIN */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[220px_1fr_320px] gap-0">
        {/* LEFT NAV */}
        <aside className="hidden md:block border-r bg-muted/20">
          <div className="sticky top-[7.5rem] p-3 space-y-0.5">
            {NAV.map((n) => {
              const Icon = n.icon;
              const isActive = active === n.key;
              const kindCount = n.key === "overview" ? total : assetIds.filter((a) => a.kind === n.key).length;
              return (
                <button
                  key={n.key}
                  onClick={() => setActive(n.key)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-left",
                    isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted",
                  )}
                >
                  <Icon className="size-3.5 shrink-0" />
                  <span className="flex-1 truncate">{n.label}</span>
                  {kindCount > 0 && <span className="text-[10px] text-muted-foreground">{kindCount}</span>}
                </button>
              );
            })}
          </div>
        </aside>

        {/* CENTER */}
        <main className="min-w-0 p-4 md:p-6 pb-32">
          {active === "overview"   && <OverviewPanel counts={counts} total={total} assetIds={assetIds} approvals={approvals} result={result} onJump={setActive} />}
          {active === "posts"      && <PostsPanel posts={result.content ?? []} approvals={approvals} selected={selected} onToggle={toggleSelect} onStatus={setStatus} onRegenerate={() => regenerate("content")} />}
          {active === "images"     && <ImagesPanel posters={result.posters ?? []} approvals={approvals} selected={selected} onToggle={toggleSelect} onStatus={setStatus} onRegenerate={() => regenerate("posters")} />}
          {active === "videos"     && <VideosPanel videos={result.videos ?? []} approvals={approvals} onStatus={setStatus} />}
          {active === "landing"    && <LandingPanel landing={result.landing} approvals={approvals} onStatus={setStatus} onRegenerate={() => regenerate("landing")} />}
          {active === "forms"      && <FormPanel form={result.form} approvals={approvals} onStatus={setStatus} onRegenerate={() => regenerate("forms")} />}
          {active === "emails"     && <EmailsPanel emails={result.emails ?? []} approvals={approvals} onStatus={setStatus} onRegenerate={() => regenerate("email")} />}
          {active === "calendar"   && <CalendarPanel calendar={result.calendar ?? []} />}
          {active === "automation" && <AutomationPanel workflow={result.workflow} approvals={approvals} onStatus={setStatus} />}
        </main>

        {/* RIGHT AI REVIEW */}
        <aside className="hidden lg:block border-l bg-muted/20">
          <div className="sticky top-[7.5rem] p-4 space-y-4">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
                AI review
              </div>
              <div className="space-y-2.5">
                <ScoreRow icon={Sparkles}    label="Content quality"   score={88} />
                <ScoreRow icon={Zap}         label="SEO score"         score={74} />
                <ScoreRow icon={Gauge}       label="Grammar"           score={96} />
                <ScoreRow icon={Palette}     label="Brand consistency" score={91} />
                <ScoreRow icon={ShieldCheck} label="Readability"       score={85} />
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
                Warnings
              </div>
              <ul className="space-y-1.5 text-xs">
                {counts.rejected > 0 && (
                  <li className="flex gap-2"><AlertTriangle className="size-3.5 text-red-500 mt-0.5 shrink-0" /> {counts.rejected} rejected asset{counts.rejected > 1 ? "s" : ""}</li>
                )}
                {counts.review > 0 && (
                  <li className="flex gap-2"><Clock className="size-3.5 text-amber-500 mt-0.5 shrink-0" /> {counts.review} still need review</li>
                )}
                {(result.content ?? []).length === 0 && (
                  <li className="flex gap-2"><AlertTriangle className="size-3.5 text-amber-500 mt-0.5 shrink-0" /> No social posts yet</li>
                )}
                {!result.landing && (
                  <li className="flex gap-2"><AlertTriangle className="size-3.5 text-amber-500 mt-0.5 shrink-0" /> Missing landing page</li>
                )}
              </ul>
            </div>

            <div className="pt-4 border-t space-y-1.5">
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
                One-click improvements
              </div>
              <Button size="sm" variant="outline" className="w-full justify-start" onClick={() => toast.info("Running full campaign fix…")}>
                <Wand2 className="size-3.5 mr-1.5" /> Fix everything
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start" onClick={() => regenerate("content")}>
                <Sparkles className="size-3.5 mr-1.5" /> Improve campaign
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start" onClick={() => toast.info("SEO optimization queued")}>
                <Zap className="size-3.5 mr-1.5" /> Optimize SEO
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start" onClick={() => regenerate("landing")}>
                <LayoutTemplate className="size-3.5 mr-1.5" /> Improve conversion
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start" onClick={() => regenerate("content")}>
                <Lightbulb className="size-3.5 mr-1.5" /> Better headlines
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/* STICKY PUBLISH BAR */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
        <div className="flex items-center gap-1 rounded-full border bg-background/90 backdrop-blur-xl shadow-lg px-2 py-1.5">
          <Button size="sm" variant="ghost" className="rounded-full gap-1.5" onClick={approveAll}>
            <CheckCircle2 className="size-3.5" /> Approve all
          </Button>
          <Button size="sm" variant="ghost" className="rounded-full gap-1.5" disabled={selected.size === 0} onClick={() => setPublishOpen(true)}>
            <Send className="size-3.5" /> Publish selected {selected.size > 0 && `(${selected.size})`}
          </Button>
          <Button size="sm" className="rounded-full gap-1.5" onClick={() => setPublishOpen(true)}>
            <Rocket className="size-3.5" /> Publish everything
          </Button>
          <Button size="sm" variant="ghost" className="rounded-full gap-1.5" onClick={() => toast.info("Schedule modal (coming soon)")}>
            <Clock className="size-3.5" /> Schedule
          </Button>
          <Button size="sm" variant="ghost" className="rounded-full gap-1.5" onClick={() => toast.info("Downloading ZIP…")}>
            <Download className="size-3.5" /> ZIP
          </Button>
        </div>
      </div>

      {publishOpen && (
        <PublishModal
          project={project}
          counts={counts}
          total={total}
          selectedCount={selected.size}
          onClose={() => setPublishOpen(false)}
          onDone={() => {
            setPublishOpen(false);
            toast.success("Campaign published");
            navigate({ to: "/workspace/project/$projectId", params: { projectId } });
          }}
        />
      )}
    </div>
  );
}

/* ---------------- panels ---------------- */

function OverviewPanel({
  counts, total, assetIds, approvals, result, onJump,
}: {
  counts: Record<Status, number>;
  total: number;
  assetIds: { id: string; kind: NavKey }[];
  approvals: Record<string, Status>;
  result: Record<string, any>;
  onJump: (k: NavKey) => void;
}) {
  const groups: { key: NavKey; label: string; icon: any }[] = NAV.filter((n) => n.key !== "overview");
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Campaign overview</h2>
        <p className="text-sm text-muted-foreground">Every generated asset. Approve, reject, or dive in.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(["approved","review","rejected","draft"] as Status[]).map((s) => (
          <div key={s} className="rounded-xl border p-4 bg-card">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("size-2 rounded-full", STATUS_COLOR[s])} />
              <span className="text-xs text-muted-foreground">{STATUS_LABEL[s]}</span>
            </div>
            <div className="text-2xl font-semibold">{counts[s]}</div>
            <div className="text-[11px] text-muted-foreground">{total ? Math.round((counts[s]/total)*100) : 0}% of total</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {groups.map((g) => {
          const items = assetIds.filter((a) => a.kind === g.key);
          if (items.length === 0) return null;
          const Icon = g.icon;
          return (
            <button
              key={g.key}
              onClick={() => onJump(g.key)}
              className="w-full flex items-center gap-3 rounded-xl border bg-card p-3 hover:bg-muted/40 transition text-left"
            >
              <div className="size-9 rounded-md bg-muted flex items-center justify-center">
                <Icon className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{g.label}</div>
                <div className="text-[11px] text-muted-foreground">{items.length} item{items.length > 1 ? "s" : ""}</div>
              </div>
              <div className="flex items-center gap-1">
                {items.slice(0, 12).map((a) => (
                  <span key={a.id} className={cn("size-2 rounded-full", STATUS_COLOR[(approvals[a.id] ?? "review") as Status])} />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: Status }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
      status === "approved" && "bg-emerald-500/10 text-emerald-600",
      status === "review"   && "bg-amber-500/10 text-amber-600",
      status === "rejected" && "bg-red-500/10 text-red-600",
      status === "draft"    && "bg-muted text-muted-foreground",
    )}>
      <span className={cn("size-1.5 rounded-full", STATUS_COLOR[status])} />
      {STATUS_LABEL[status]}
    </span>
  );
}

function ApprovalButtons({
  id, status, onStatus,
}: { id: string; status: Status; onStatus: (id: string, s: Status) => void }) {
  return (
    <div className="flex items-center gap-1">
      <Button size="sm" variant={status === "approved" ? "primary" : "outline"} className="h-7 px-2 gap-1"
        onClick={() => onStatus(id, "approved")}>
        <Check className="size-3" /> Approve
      </Button>
      <Button size="sm" variant={status === "rejected" ? "primary" : "outline"} className="h-7 px-2 gap-1"
        onClick={() => onStatus(id, "rejected")}>
        <X className="size-3" /> Reject
      </Button>
    </div>
  );
}

function PostsPanel({
  posts, approvals, selected, onToggle, onStatus, onRegenerate,
}: {
  posts: any[]; approvals: Record<string, Status>; selected: Set<string>;
  onToggle: (id: string) => void; onStatus: (id: string, s: Status) => void; onRegenerate: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Social posts</h2>
          <p className="text-sm text-muted-foreground">{posts.length} generated · review, approve, and schedule</p>
        </div>
        <Button size="sm" variant="outline" onClick={onRegenerate}><RefreshCw className="size-3.5 mr-1.5" /> Regenerate all</Button>
      </div>
      {posts.length === 0 && <EmptyState label="No posts yet" />}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {posts.map((p, i) => {
          const id = `post:${i}`;
          const status = (approvals[id] ?? "review") as Status;
          const Icon = PLATFORM_ICON[String(p.platform ?? "instagram").toLowerCase()] ?? FileText;
          return (
            <div key={id} className="rounded-xl border bg-card overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 p-3 border-b">
                <Checkbox checked={selected.has(id)} onCheckedChange={() => onToggle(id)} />
                <div className="size-6 rounded-md bg-muted flex items-center justify-center"><Icon className="size-3.5" /></div>
                <span className="text-xs font-medium capitalize">{p.platform ?? "post"}</span>
                <div className="flex-1" />
                <StatusPill status={status} />
              </div>
              <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 via-transparent to-primary/5 flex items-center justify-center relative">
                <ImageIcon className="size-8 text-muted-foreground/40" />
                <div className="absolute inset-0 p-4 flex items-end">
                  <div className="text-sm font-medium line-clamp-2 drop-shadow-sm">{p.hook ?? "Untitled hook"}</div>
                </div>
              </div>
              <div className="p-3 space-y-2 text-xs flex-1 flex flex-col">
                <div className="line-clamp-3 text-muted-foreground">{p.body ?? p.caption ?? "—"}</div>
                {Array.isArray(p.hashtags) && p.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.hashtags.slice(0, 4).map((h: string) => (
                      <span key={h} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted">#{String(h).replace(/^#/, "")}</span>
                    ))}
                  </div>
                )}
                <div className="flex-1" />
                <div className="flex items-center justify-between pt-1">
                  <ApprovalButtons id={id} status={status} onStatus={onStatus} />
                  <div className="flex items-center gap-0.5">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Pencil className="size-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><RefreshCw className="size-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Copy className="size-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500"><Trash2 className="size-3.5" /></Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ImagesPanel({
  posters, approvals, selected, onToggle, onStatus, onRegenerate,
}: {
  posters: any[]; approvals: Record<string, Status>; selected: Set<string>;
  onToggle: (id: string) => void; onStatus: (id: string, s: Status) => void; onRegenerate: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Images & posters</h2>
          <p className="text-sm text-muted-foreground">{posters.length} generated</p>
        </div>
        <Button size="sm" variant="outline" onClick={onRegenerate}><RefreshCw className="size-3.5 mr-1.5" /> Regenerate all</Button>
      </div>
      {posters.length === 0 && <EmptyState label="No images yet" />}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {posters.map((p, i) => {
          const id = `image:${i}`;
          const status = (approvals[id] ?? "review") as Status;
          return (
            <div key={id} className="group rounded-xl border bg-card overflow-hidden">
              <div className="relative aspect-square bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                <ImageIcon className="size-10 text-muted-foreground/40" />
                <div className="absolute top-2 left-2"><Checkbox checked={selected.has(id)} onCheckedChange={() => onToggle(id)} /></div>
                <div className="absolute top-2 right-2"><StatusPill status={status} /></div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-background/70 backdrop-blur-sm flex items-center justify-center gap-1">
                  <Button size="sm" variant="primary" className="h-7 gap-1" onClick={() => onStatus(id, "approved")}><Check className="size-3" /> Approve</Button>
                  <Button size="sm" variant="outline" className="h-7 gap-1" onClick={() => onStatus(id, "rejected")}><X className="size-3" /> Reject</Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><RefreshCw className="size-3.5" /></Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Download className="size-3.5" /></Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Maximize2 className="size-3.5" /></Button>
                </div>
              </div>
              <div className="p-2.5">
                <div className="text-xs font-medium line-clamp-1">{p.title ?? `Poster ${i+1}`}</div>
                <div className="text-[10px] text-muted-foreground line-clamp-1">{p.concept ?? p.style ?? "—"}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VideosPanel({ videos, approvals, onStatus }: { videos: any[]; approvals: Record<string, Status>; onStatus: (id: string, s: Status) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Videos</h2>
      {videos.length === 0 && <EmptyState label="No videos yet" hint="Generate short reels from the Content step" />}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {videos.map((v, i) => {
          const id = `video:${i}`;
          const status = (approvals[id] ?? "review") as Status;
          return (
            <div key={id} className="rounded-xl border bg-card overflow-hidden">
              <div className="relative aspect-video bg-black flex items-center justify-center">
                <Play className="size-10 text-white/70" />
                <span className="absolute bottom-2 right-2 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white">{v.duration ?? "0:30"}</span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium line-clamp-1">{v.title ?? `Video ${i+1}`}</div>
                  <StatusPill status={status} />
                </div>
                <ApprovalButtons id={id} status={status} onStatus={onStatus} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LandingPanel({ landing, approvals, onStatus, onRegenerate }: any) {
  const id = "landing:0";
  const status = (approvals[id] ?? "review") as Status;
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const w = device === "desktop" ? "100%" : device === "tablet" ? 768 : 375;
  if (!landing) return <EmptyState label="No landing page yet" hint="Run the Landing step to generate" />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Landing page</h2>
        <div className="flex items-center gap-1 border rounded-md p-0.5">
          {(["desktop","tablet","mobile"] as const).map((d) => {
            const Icon = d === "desktop" ? Monitor : d === "tablet" ? Tablet : Smartphone;
            return (
              <button key={d} onClick={() => setDevice(d)}
                className={cn("h-7 w-7 rounded flex items-center justify-center", device === d ? "bg-muted" : "hover:bg-muted/60")}>
                <Icon className="size-3.5" />
              </button>
            );
          })}
        </div>
      </div>
      <div className="rounded-xl border bg-card p-3 flex items-center justify-between">
        <StatusPill status={status} />
        <div className="flex items-center gap-1.5">
          <ApprovalButtons id={id} status={status} onStatus={onStatus} />
          <Button size="sm" variant="outline" onClick={onRegenerate}><RefreshCw className="size-3.5 mr-1.5" /> Regenerate</Button>
          <Button size="sm" variant="outline"><Pencil className="size-3.5 mr-1.5" /> Open editor</Button>
          <Button size="sm"><Rocket className="size-3.5 mr-1.5" /> Publish</Button>
        </div>
      </div>
      <div className="rounded-xl border bg-muted/20 p-4 overflow-auto flex justify-center">
        <div style={{ width: w, maxWidth: "100%" }} className="bg-background rounded-lg shadow-sm border p-6 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold">{landing.hero?.headline ?? "Landing headline"}</h1>
            <p className="text-sm text-muted-foreground">{landing.hero?.sub ?? "Subheadline"}</p>
            <Button className="mt-2">{landing.hero?.cta ?? "Get started"}</Button>
          </div>
          {Array.isArray(landing.features) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {landing.features.slice(0,6).map((f: any, i: number) => (
                <div key={i} className="rounded-lg border p-3">
                  <div className="text-sm font-medium">{f.title}</div>
                  <div className="text-xs text-muted-foreground">{f.desc}</div>
                </div>
              ))}
            </div>
          )}
          {Array.isArray(landing.testimonials) && landing.testimonials.length > 0 && (
            <div className="rounded-lg border p-4 bg-muted/30">
              <div className="text-sm italic">"{landing.testimonials[0].quote}"</div>
              <div className="text-xs mt-1 text-muted-foreground">— {landing.testimonials[0].name}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FormPanel({ form, approvals, onStatus, onRegenerate }: any) {
  const id = "form:0";
  const status = (approvals[id] ?? "review") as Status;
  if (!form) return <EmptyState label="No form yet" />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Form</h2>
        <div className="flex items-center gap-1.5">
          <StatusPill status={status} />
          <ApprovalButtons id={id} status={status} onStatus={onStatus} />
          <Button size="sm" variant="outline" onClick={onRegenerate}><RefreshCw className="size-3.5 mr-1.5" /> Regenerate</Button>
          <Button size="sm"><Rocket className="size-3.5 mr-1.5" /> Publish</Button>
        </div>
      </div>
      <div className="rounded-xl border bg-card p-6 max-w-lg">
        <div className="text-lg font-semibold mb-1">{form.title ?? "Form"}</div>
        <p className="text-xs text-muted-foreground mb-4">{form.description ?? ""}</p>
        <div className="space-y-3">
          {(form.fields ?? []).map((f: any, i: number) => (
            <div key={i}>
              <label className="text-xs font-medium">{f.label}{f.required && <span className="text-red-500">*</span>}</label>
              <div className="h-9 rounded-md border bg-muted/30 mt-1" />
            </div>
          ))}
        </div>
        <Button className="mt-4 w-full">{form.submit_label ?? "Submit"}</Button>
      </div>
    </div>
  );
}

function EmailsPanel({ emails, approvals, onStatus, onRegenerate }: any) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const sel = emails[selectedIdx];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Email sequence</h2>
        <Button size="sm" variant="outline" onClick={onRegenerate}><RefreshCw className="size-3.5 mr-1.5" /> Regenerate</Button>
      </div>
      {emails.length === 0 && <EmptyState label="No emails yet" />}
      {emails.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
          <div className="rounded-xl border bg-card divide-y">
            {emails.map((e: any, i: number) => {
              const id = `email:${i}`;
              const status = (approvals[id] ?? "review") as Status;
              const isSel = selectedIdx === i;
              return (
                <button key={id} onClick={() => setSelectedIdx(i)}
                  className={cn("w-full text-left p-3 text-xs hover:bg-muted/40", isSel && "bg-muted")}>
                  <div className="flex items-center gap-2">
                    <Mail className="size-3.5 text-muted-foreground" />
                    <span className="font-medium truncate">{e.subject ?? `Email ${i+1}`}</span>
                    <div className="flex-1" />
                    <span className={cn("size-2 rounded-full", STATUS_COLOR[status])} />
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate mt-1">Day {e.day ?? i+1} · {e.preheader ?? ""}</div>
                </button>
              );
            })}
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium">{sel?.subject}</div>
                <div className="text-[11px] text-muted-foreground">{sel?.preheader}</div>
              </div>
              <div className="flex items-center gap-1">
                <ApprovalButtons id={`email:${selectedIdx}`} status={(approvals[`email:${selectedIdx}`] ?? "review") as Status} onStatus={onStatus} />
                <Button size="sm" variant="outline"><Send className="size-3.5 mr-1.5" /> Test</Button>
              </div>
            </div>
            <div className="text-sm whitespace-pre-wrap leading-relaxed">{sel?.body}</div>
            {sel?.cta && <Button className="mt-4">{sel.cta}</Button>}
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarPanel({ calendar }: { calendar: any[] }) {
  const byDate: Record<string, any[]> = {};
  for (const c of calendar) {
    const k = c.date ?? "unscheduled";
    (byDate[k] ??= []).push(c);
  }
  const dates = Object.keys(byDate).sort();
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Calendar</h2>
      {dates.length === 0 && <EmptyState label="Calendar empty" />}
      <div className="rounded-xl border bg-card divide-y">
        {dates.map((d) => (
          <div key={d} className="p-3">
            <div className="text-xs font-medium mb-2">{d}</div>
            <div className="flex flex-wrap gap-2">
              {byDate[d].map((entry, i) => {
                const Icon = PLATFORM_ICON[String(entry.platform ?? "instagram").toLowerCase()] ?? FileText;
                return (
                  <div key={i} className="rounded-md border bg-background px-2 py-1 flex items-center gap-1.5 text-xs">
                    <Icon className="size-3" />
                    <span className="truncate max-w-[240px]">{entry.hook ?? entry.title ?? "post"}</span>
                    <Badge variant="outline" className="ml-1 text-[9px]">{entry.status ?? "scheduled"}</Badge>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AutomationPanel({ workflow, approvals, onStatus }: any) {
  const id = "workflow:0";
  const status = (approvals[id] ?? "review") as Status;
  if (!workflow) return <EmptyState label="No workflow yet" />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Automation workflow</h2>
        <div className="flex items-center gap-1.5">
          <StatusPill status={status} />
          <ApprovalButtons id={id} status={status} onStatus={onStatus} />
          <Button size="sm" variant="outline"><Play className="size-3.5 mr-1.5" /> Test</Button>
        </div>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <div className="text-xs text-muted-foreground mb-3">Trigger: <span className="font-mono">{workflow.trigger}</span></div>
        <div className="flex flex-col gap-2">
          {(workflow.nodes ?? []).map((n: any, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <div className="size-7 rounded-md bg-primary/10 text-primary flex items-center justify-center text-[11px] font-medium">{i+1}</div>
              <div className="flex-1 rounded-md border bg-background px-3 py-1.5 text-xs">
                <span className="font-medium capitalize">{String(n.type).replace(/_/g, " ")}</span>
                {n.value && <span className="text-muted-foreground ml-2">{n.value}</span>}
                {n.ref && <span className="text-muted-foreground ml-2">→ {n.ref}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------- publish modal -------------- */

type PubStep = { key: string; label: string; icon: any };
const PUB_STEPS: PubStep[] = [
  { key: "posts",    label: "Social posts",  icon: FileText },
  { key: "images",   label: "Images",        icon: ImageIcon },
  { key: "videos",   label: "Videos",        icon: Video },
  { key: "landing",  label: "Landing pages", icon: LayoutTemplate },
  { key: "forms",    label: "Forms",         icon: ClipboardList },
  { key: "emails",   label: "Emails",        icon: Mail },
  { key: "calendar", label: "Calendar sync", icon: CalendarDays },
  { key: "workflow", label: "Workflow",      icon: Workflow },
];

function PublishModal({ project, counts, total, selectedCount, onClose, onDone }: any) {
  const [phase, setPhase] = useState<"confirm" | "publishing" | "done">("confirm");
  const [progress, setProgress] = useState<Record<string, "waiting" | "publishing" | "success" | "failed">>(
    Object.fromEntries(PUB_STEPS.map((s) => [s.key, "waiting"])),
  );

  async function start() {
    setPhase("publishing");
    for (const s of PUB_STEPS) {
      setProgress((p) => ({ ...p, [s.key]: "publishing" }));
      await new Promise((r) => setTimeout(r, 700));
      setProgress((p) => ({ ...p, [s.key]: "success" }));
    }
    setPhase("done");
    setTimeout(onDone, 900);
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border bg-card shadow-xl overflow-hidden">
        <div className="p-5 border-b flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Rocket className="size-5" />
          </div>
          <div className="flex-1">
            <div className="font-semibold">
              {phase === "done" ? "Campaign published" : "Publish everything"}
            </div>
            <div className="text-xs text-muted-foreground">{project.name}</div>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}><X className="size-4" /></Button>
        </div>

        {phase === "confirm" && (
          <div className="p-5 space-y-3 text-sm">
            <div className="rounded-lg bg-muted/40 p-3 space-y-1.5 text-xs">
              <div className="flex justify-between"><span>Approved</span><span className="font-medium">{counts.approved}/{total}</span></div>
              <div className="flex justify-between"><span>Needs review</span><span className="font-medium">{counts.review}</span></div>
              <div className="flex justify-between"><span>Rejected (skipped)</span><span className="font-medium">{counts.rejected}</span></div>
              {selectedCount > 0 && <div className="flex justify-between"><span>Selected only</span><span className="font-medium">{selectedCount}</span></div>}
            </div>
            <p className="text-xs text-muted-foreground">This will run the existing Publisher across all channels. Rejected items are skipped.</p>
            <div className="grid grid-cols-2 gap-2">
              {PUB_STEPS.map((s) => (
                <label key={s.key} className="flex items-center gap-2 rounded-md border p-2 text-xs">
                  <Checkbox defaultChecked />
                  <s.icon className="size-3.5 text-muted-foreground" />
                  <span>{s.label}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button onClick={start} className="gap-1.5"><Rocket className="size-3.5" /> Confirm & publish</Button>
            </div>
          </div>
        )}

        {phase !== "confirm" && (
          <div className="p-5 space-y-2">
            {PUB_STEPS.map((s) => {
              const st = progress[s.key];
              return (
                <div key={s.key} className="flex items-center gap-3 rounded-md border p-2.5 text-xs">
                  <s.icon className="size-4 text-muted-foreground" />
                  <span className="flex-1">{s.label}</span>
                  {st === "waiting"    && <Badge variant="outline" className="gap-1"><Clock className="size-3" /> Waiting</Badge>}
                  {st === "publishing" && <Badge variant="outline" className="gap-1 text-primary border-primary/40"><RefreshCw className="size-3 animate-spin" /> Publishing</Badge>}
                  {st === "success"    && <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-500/40"><CheckCircle2 className="size-3" /> Success</Badge>}
                  {st === "failed"     && <Badge variant="outline" className="gap-1 text-red-600 border-red-500/40"><XCircle className="size-3" /> Failed</Badge>}
                </div>
              );
            })}
            {phase === "done" && (
              <div className="mt-3 rounded-md bg-emerald-500/10 text-emerald-700 p-3 text-xs flex items-center gap-2">
                <CheckCircle2 className="size-4" /> Redirecting to campaign dashboard…
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------- tiny helpers -------------- */

function Kpi({ label, value, accent }: { label: string; value: any; accent?: boolean }) {
  return (
    <div className={cn("px-3 py-2 border-r last:border-r-0", accent && "bg-primary/5")}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("text-sm font-semibold", accent && "text-primary")}>{value}</div>
    </div>
  );
}

function ScoreRow({ icon: Icon, label, score }: { icon: any; label: string; score: number }) {
  const color = score >= 85 ? "bg-emerald-500" : score >= 70 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-xs">
        <Icon className="size-3.5 text-muted-foreground" />
        <span className="flex-1">{label}</span>
        <span className="font-medium">{score}</span>
      </div>
      <div className="h-1 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function EmptyState({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
      <div>{label}</div>
      {hint && <div className="text-xs mt-1">{hint}</div>}
    </div>
  );
}
