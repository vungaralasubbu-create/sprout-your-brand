import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft, Sparkles, FileText, Image as ImageIcon, Video, LayoutTemplate,
  ClipboardList, Mail, CalendarDays, Workflow, BarChart3, LayoutDashboard,
  Settings, Search, Share2, Download, Rocket, RefreshCw, CheckCircle2,
  Users, TrendingUp, DollarSign, Target, Lightbulb, Activity, Trash2,
  Instagram, Linkedin, Facebook, Twitter, Monitor, Tablet, Smartphone,
  Play, Pencil, Copy, Eye, Check, Zap, Gauge, ShieldCheck, Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CopilotPanel, CopilotToggle } from "@/components/marketing-os/copilot-panel";
import {
  getMarketingProject,
  runProjectStep,
  renameMarketingProject,
  deleteMarketingProject,
} from "@/lib/marketing-os/projects.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/workspace/project/$projectId")({
  component: WorkspaceProject,
});

type NavKey =
  | "overview" | "strategy" | "social" | "images" | "videos"
  | "landing" | "forms" | "emails" | "calendar" | "automation"
  | "analytics" | "settings";

const NAV: { key: NavKey; label: string; icon: any }[] = [
  { key: "overview",   label: "Overview",       icon: LayoutDashboard },
  { key: "strategy",   label: "Strategy",       icon: Sparkles },
  { key: "social",     label: "Social content", icon: FileText },
  { key: "images",     label: "Images",         icon: ImageIcon },
  { key: "videos",     label: "Videos",         icon: Video },
  { key: "landing",    label: "Landing page",   icon: LayoutTemplate },
  { key: "forms",      label: "Forms",          icon: ClipboardList },
  { key: "emails",     label: "Email campaign", icon: Mail },
  { key: "calendar",   label: "Calendar",       icon: CalendarDays },
  { key: "automation", label: "Automation",     icon: Workflow },
  { key: "analytics",  label: "Analytics",      icon: BarChart3 },
  { key: "settings",   label: "Settings",       icon: Settings },
];

const PLATFORM_ICON: Record<string, any> = {
  instagram: Instagram, linkedin: Linkedin, facebook: Facebook,
  x: Twitter, twitter: Twitter, blog: FileText,
};

function WorkspaceProject() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [active, setActive] = useState<NavKey>("overview");
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  const getFn = useServerFn(getMarketingProject);
  const runFn = useServerFn(runProjectStep);
  const renameFn = useServerFn(renameMarketingProject);
  const deleteFn = useServerFn(deleteMarketingProject);

  const q = useQuery({
    queryKey: ["marketing-project", projectId],
    queryFn: () => getFn({ data: { id: projectId } }),
    refetchInterval: (query) => {
      const p: any = query.state.data?.project;
      return p && p.status === "running" ? 2500 : false;
    },
  });

  const project: any = q.data?.project;

  const result = project?.result || {};
  const brief = result.brief || {};
  const strategy = result.strategy || null;
  const content: any[] = Array.isArray(result.content) ? result.content : [];
  const posters: any[] = Array.isArray(result.posters) ? result.posters : [];
  const videos: any[] = Array.isArray(result.videos) ? result.videos : [];
  const emails: any[] = Array.isArray(result.emails) ? result.emails : [];
  const calendar: any[] = Array.isArray(result.calendar) ? result.calendar : [];
  const landing = result.landing || null;
  const form = result.form || null;
  const workflow = result.workflow || null;

  // ------- header helpers -------
  const statusVariant = (s?: string): any =>
    s === "completed" ? "success"
      : s === "running" ? "default"
      : s === "failed" ? "danger"
      : "muted";

  const saveName = async () => {
    if (!nameDraft.trim() || nameDraft === project?.name) {
      setEditingName(false);
      return;
    }
    try {
      await renameFn({ data: { id: projectId, name: nameDraft.trim() } });
      toast.success("Project renamed");
      qc.invalidateQueries({ queryKey: ["marketing-project", projectId] });
    } catch (e: any) {
      toast.error(e?.message ?? "Rename failed");
    }
    setEditingName(false);
  };

  const regenerateStep = async (step: string) => {
    toast.loading(`Regenerating ${step}…`, { id: `regen-${step}` });
    try {
      await runFn({ data: { id: projectId, step: step as any } });
      toast.success(`${step} regenerated`, { id: `regen-${step}` });
      qc.invalidateQueries({ queryKey: ["marketing-project", projectId] });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed", { id: `regen-${step}` });
    }
  };

  const doDelete = async () => {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    await deleteFn({ data: { id: projectId } });
    toast.success("Project deleted");
    navigate({ to: "/admin/marketing-os" });
  };

  // ------- kpis -------
  const kpis = useMemo(() => [
    { label: "Campaign",         value: result.campaign ? 1 : 0, icon: Target,          tone: "from-blue-500/15 to-cyan-500/5" },
    { label: "Posts",            value: content.length,          icon: FileText,        tone: "from-fuchsia-500/15 to-pink-500/5" },
    { label: "Images",           value: posters.length,          icon: ImageIcon,       tone: "from-amber-500/15 to-orange-500/5" },
    { label: "Videos",           value: videos.length,           icon: Video,           tone: "from-purple-500/15 to-violet-500/5" },
    { label: "Landing page",     value: landing ? 1 : 0,         icon: LayoutTemplate,  tone: "from-indigo-500/15 to-blue-500/5" },
    { label: "Forms",            value: form ? 1 : 0,            icon: ClipboardList,   tone: "from-emerald-500/15 to-teal-500/5" },
    { label: "Emails",           value: emails.length,           icon: Mail,            tone: "from-rose-500/15 to-red-500/5" },
    { label: "Scheduled posts",  value: calendar.length,         icon: CalendarDays,    tone: "from-sky-500/15 to-blue-500/5" },
    { label: "Est. reach",       value: (content.length * 1200).toLocaleString(), icon: Users,     tone: "from-cyan-500/15 to-blue-500/5" },
    { label: "Est. leads",       value: (content.length * 45).toLocaleString(),   icon: TrendingUp, tone: "from-lime-500/15 to-green-500/5" },
    { label: "Est. revenue",     value: `₹${(content.length * 8500).toLocaleString()}`, icon: DollarSign, tone: "from-yellow-500/15 to-amber-500/5" },
    { label: "Projected ROI",    value: "3.4x",                  icon: Activity,        tone: "from-teal-500/15 to-emerald-500/5" },
  ], [result, content.length, posters.length, videos.length, landing, form, emails.length, calendar.length]);

  // ------- filtered search -------
  const s = search.trim().toLowerCase();
  const matches = (t: string) => !s || t.toLowerCase().includes(s);
  const contentFiltered = content.filter((p: any) =>
    matches(`${p.title ?? ""} ${p.caption ?? ""} ${p.platform ?? ""} ${(p.hashtags ?? []).join(" ")}`),
  );

  if (q.isLoading) {
    return (
      <div className="p-6 space-y-3">
        <div className="h-14 rounded-2xl bg-muted/40 animate-pulse" />
        <div className="h-96 rounded-2xl bg-muted/40 animate-pulse" />
      </div>
    );
  }
  if (!project) return <div className="p-6">Project not found.</div>;

  return (
    <div className="min-h-[calc(100vh-3rem)] flex flex-col bg-background">
      {/* ============== HEADER ============== */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b">
        <div className="flex items-center gap-3 px-4 md:px-6 h-16">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/admin/marketing-os" })}>
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0 flex-1 flex items-center gap-3">
            {editingName ? (
              <Input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveName();
                  if (e.key === "Escape") setEditingName(false);
                }}
                className="h-9 max-w-md font-semibold"
              />
            ) : (
              <button
                onClick={() => { setNameDraft(project.name); setEditingName(true); }}
                className="text-left group min-w-0"
                title="Rename"
              >
                <h1 className="text-base md:text-lg font-semibold tracking-tight truncate group-hover:text-primary transition-colors">
                  {project.name}
                </h1>
              </button>
            )}
            <Badge variant={statusVariant(project.status)} className="capitalize shrink-0">
              {project.status}
            </Badge>
            <span className="hidden md:inline text-xs text-muted-foreground shrink-0">
              · {new Date(project.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search this project…"
                className="pl-8 h-9 w-64"
              />
            </div>
            <Button variant="ghost" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["marketing-project", projectId] })}>
              <RefreshCw className="size-4 mr-1.5" /> Regenerate
            </Button>
            <Button variant="ghost" size="sm"><Share2 className="size-4 mr-1.5" /> Share</Button>
            <Button variant="ghost" size="sm"><Download className="size-4 mr-1.5" /> Export</Button>
            <Button size="sm" className="gap-1.5"><Rocket className="size-4" /> Publish all</Button>
          </div>
        </div>
      </header>

      {/* ============== BODY ============== */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[220px_1fr_320px] gap-0">
        {/* -------- LEFT SIDEBAR -------- */}
        <aside className="hidden md:block border-r bg-muted/20">
          <nav className="p-3 space-y-0.5 sticky top-16">
            {NAV.map((n) => {
              const Icon = n.icon;
              const isActive = active === n.key;
              return (
                <button
                  key={n.key}
                  onClick={() => setActive(n.key)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-background shadow-sm border font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/70",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{n.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* -------- MAIN -------- */}
        <main className="min-w-0 p-4 md:p-6 pb-28">
          {/* mobile nav pills */}
          <div className="md:hidden -mx-4 px-4 pb-3 overflow-x-auto flex gap-1.5">
            {NAV.map((n) => (
              <button
                key={n.key}
                onClick={() => setActive(n.key)}
                className={cn(
                  "shrink-0 text-xs px-3 py-1.5 rounded-full border",
                  active === n.key ? "bg-primary text-primary-foreground border-primary" : "bg-background",
                )}
              >
                {n.label}
              </button>
            ))}
          </div>

          {active === "overview" && (
            <div className="space-y-6">
              {/* KPI cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {kpis.map((k) => {
                  const Icon = k.icon;
                  return (
                    <div
                      key={k.label}
                      className={cn(
                        "relative rounded-xl border p-4 bg-gradient-to-br overflow-hidden",
                        k.tone,
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                          {k.label}
                        </span>
                        <Icon className="size-4 text-muted-foreground" />
                      </div>
                      <div className="text-2xl font-semibold tracking-tight">{k.value}</div>
                    </div>
                  );
                })}
              </div>

              {/* AI summary */}
              <div className="rounded-xl border p-5 bg-gradient-to-br from-primary/5 to-transparent">
                <div className="flex items-start gap-3">
                  <div className="size-9 rounded-lg bg-primary/15 grid place-items-center shrink-0">
                    <Sparkles className="size-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                      AI summary
                    </div>
                    <p className="text-sm leading-relaxed">
                      {brief.summary || strategy?.summary || project.prompt}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Button size="sm" variant="outline" onClick={() => regenerateStep("strategy")}>
                        <Sparkles className="size-3.5 mr-1.5" /> Improve strategy
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => regenerateStep("understand")}>
                        <RefreshCw className="size-3.5 mr-1.5" /> Regenerate summary
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step status */}
              {Array.isArray(project.steps) && project.steps.length > 0 && (
                <div className="rounded-xl border">
                  <div className="px-4 py-3 border-b text-sm font-medium">Generation pipeline</div>
                  <div className="divide-y">
                    {project.steps.map((st: any) => (
                      <div key={st.key} className="flex items-center justify-between px-4 py-2.5 text-sm">
                        <div className="flex items-center gap-2.5">
                          {st.status === "completed" ? (
                            <CheckCircle2 className="size-4 text-emerald-500" />
                          ) : st.status === "error" ? (
                            <div className="size-2 rounded-full bg-red-500" />
                          ) : st.status === "running" ? (
                            <div className="size-2 rounded-full bg-blue-500 animate-pulse" />
                          ) : (
                            <div className="size-2 rounded-full bg-muted-foreground/30" />
                          )}
                          <span className="capitalize">{st.label ?? st.key}</span>
                        </div>
                        {st.status === "error" && (
                          <Button size="sm" variant="ghost" onClick={() => regenerateStep(st.key)}>
                            Retry
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {active === "strategy" && (
            <section className="space-y-4">
              <SectionHeader title="Strategy" onRegenerate={() => regenerateStep("strategy")} />
              <div className="rounded-xl border p-5 prose prose-sm max-w-none dark:prose-invert">
                <pre className="whitespace-pre-wrap text-sm font-sans bg-transparent p-0">
                  {typeof strategy === "string"
                    ? strategy
                    : strategy
                    ? JSON.stringify(strategy, null, 2)
                    : "No strategy generated yet."}
                </pre>
              </div>
            </section>
          )}

          {active === "social" && (
            <section className="space-y-4">
              <SectionHeader
                title={`Social content · ${contentFiltered.length}`}
                onRegenerate={() => regenerateStep("content")}
              />
              {contentFiltered.length === 0 ? (
                <EmptyState label="No posts yet." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {contentFiltered.map((p: any, i: number) => {
                    const Icon = PLATFORM_ICON[(p.platform ?? "").toLowerCase()] ?? FileText;
                    return (
                      <div key={i} className="rounded-xl border p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className="size-4 text-muted-foreground" />
                            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              {p.platform ?? "Post"} · #{i + 1}
                            </span>
                          </div>
                          <Badge variant="muted" className="text-[10px]">{p.status ?? "draft"}</Badge>
                        </div>
                        {p.title && <div className="font-medium text-sm mb-1 line-clamp-1">{p.title}</div>}
                        <p className="text-sm text-muted-foreground line-clamp-3">{p.caption ?? p.body ?? ""}</p>
                        {Array.isArray(p.hashtags) && p.hashtags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {p.hashtags.slice(0, 5).map((h: string, hi: number) => (
                              <span key={hi} className="text-[11px] text-primary">#{h.replace(/^#/, "")}</span>
                            ))}
                          </div>
                        )}
                        <div className="mt-3 pt-3 border-t flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">
                            {p.scheduledAt ? new Date(p.scheduledAt).toLocaleDateString() : "Unscheduled"}
                          </span>
                          <div className="flex gap-1">
                            <IconBtn icon={Pencil} label="Edit" />
                            <IconBtn icon={RefreshCw} label="Regenerate" onClick={() => regenerateStep("content")} />
                            <IconBtn icon={Check} label="Approve" />
                            <IconBtn icon={CalendarDays} label="Schedule" />
                            <IconBtn icon={Copy} label="Duplicate" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {active === "images" && (
            <section className="space-y-4">
              <SectionHeader title={`Images · ${posters.length}`} onRegenerate={() => regenerateStep("posters")} />
              {posters.length === 0 ? (
                <EmptyState label="No images generated yet." />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {posters.map((img: any, i: number) => (
                    <div key={i} className="group relative aspect-square rounded-xl border overflow-hidden bg-muted">
                      {img.url ? (
                        <img src={img.url} alt={img.title ?? `poster-${i}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-muted-foreground">
                          <ImageIcon className="size-8" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center gap-2">
                        <div className="flex gap-1.5">
                          <IconBtn icon={Eye} label="Preview" tone="light" />
                          <IconBtn icon={RefreshCw} label="Regenerate" tone="light" onClick={() => regenerateStep("posters")} />
                          <IconBtn icon={Check} label="Approve" tone="light" />
                          <IconBtn icon={Download} label="Download" tone="light" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {active === "videos" && (
            <section className="space-y-4">
              <SectionHeader title={`Videos · ${videos.length}`} onRegenerate={() => regenerateStep("videos" as any)} />
              {videos.length === 0 ? (
                <EmptyState label="No videos yet." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {videos.map((v: any, i: number) => (
                    <div key={i} className="rounded-xl border overflow-hidden">
                      <div className="aspect-video bg-muted grid place-items-center relative">
                        {v.thumbnail ? (
                          <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" />
                        ) : (
                          <Video className="size-8 text-muted-foreground" />
                        )}
                        <Button size="icon" variant="secondary" className="absolute inset-0 m-auto size-12 rounded-full">
                          <Play className="size-5" />
                        </Button>
                      </div>
                      <div className="p-3 flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{v.title ?? `Video ${i + 1}`}</div>
                          <div className="text-xs text-muted-foreground">{v.duration ?? "—"}</div>
                        </div>
                        <Badge variant="muted" className="text-[10px]">{v.status ?? "draft"}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {active === "landing" && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <SectionHeader title="Landing page" onRegenerate={() => regenerateStep("landing")} inline />
                <div className="flex gap-1 border rounded-lg p-0.5">
                  {([["desktop", Monitor], ["tablet", Tablet], ["mobile", Smartphone]] as const).map(([k, Ic]) => (
                    <button
                      key={k}
                      onClick={() => setDevice(k)}
                      className={cn(
                        "size-8 grid place-items-center rounded-md transition-colors",
                        device === k ? "bg-muted" : "hover:bg-muted/60",
                      )}
                    >
                      <Ic className="size-4" />
                    </button>
                  ))}
                </div>
              </div>
              {!landing ? (
                <EmptyState label="No landing page yet." />
              ) : (
                <div className="rounded-xl border overflow-hidden bg-muted/30 grid place-items-center py-6">
                  <div
                    className={cn(
                      "bg-background border rounded-lg shadow-sm transition-all",
                      device === "desktop" && "w-full max-w-4xl aspect-[16/10]",
                      device === "tablet" && "w-[600px] aspect-[3/4]",
                      device === "mobile" && "w-[320px] aspect-[9/16]",
                    )}
                  >
                    <div className="p-6 h-full overflow-auto">
                      <h2 className="text-2xl font-bold">{landing.headline ?? project.name}</h2>
                      <p className="text-muted-foreground mt-2 text-sm">{landing.subheadline ?? brief.summary}</p>
                      {Array.isArray(landing.sections) &&
                        landing.sections.map((sec: any, i: number) => (
                          <div key={i} className="mt-4">
                            <div className="text-sm font-semibold">{sec.title}</div>
                            <p className="text-xs text-muted-foreground">{sec.body}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline"><Pencil className="size-3.5 mr-1.5" /> Open editor</Button>
                <Button size="sm" variant="outline"><Rocket className="size-3.5 mr-1.5" /> Publish</Button>
                <Button size="sm" variant="ghost"><Eye className="size-3.5 mr-1.5" /> Preview</Button>
                <Button size="sm" variant="ghost"><Copy className="size-3.5 mr-1.5" /> Duplicate</Button>
              </div>
            </section>
          )}

          {active === "forms" && (
            <section className="space-y-4">
              <SectionHeader title="Forms" onRegenerate={() => regenerateStep("forms")} />
              {!form ? (
                <EmptyState label="No form generated yet." />
              ) : (
                <div className="grid md:grid-cols-[1fr_280px] gap-4">
                  <div className="rounded-xl border p-5">
                    <div className="text-sm font-semibold mb-3">{form.title ?? "Lead capture"}</div>
                    <div className="space-y-3">
                      {(form.fields ?? [{ label: "Name" }, { label: "Email" }, { label: "Phone" }]).map(
                        (f: any, i: number) => (
                          <div key={i}>
                            <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
                            <div className="mt-1 h-9 border rounded-md bg-muted/30" />
                          </div>
                        ),
                      )}
                      <Button size="sm" className="w-full">Submit</Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <StatBlock label="Submissions" value={form.submissions ?? 0} />
                    <StatBlock label="Conversion" value={`${form.conversionRate ?? 0}%`} />
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">Edit</Button>
                      <Button size="sm" variant="outline" className="flex-1">Publish</Button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {active === "emails" && (
            <section className="space-y-4">
              <SectionHeader title={`Email campaign · ${emails.length}`} onRegenerate={() => regenerateStep("email")} />
              {emails.length === 0 ? (
                <EmptyState label="No emails yet." />
              ) : (
                <div className="rounded-xl border overflow-hidden divide-y">
                  {emails.map((e: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 cursor-pointer">
                      <Mail className="size-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{e.subject ?? `Email ${i + 1}`}</div>
                        <div className="text-xs text-muted-foreground truncate">{e.audience ?? "All subscribers"}</div>
                      </div>
                      <div className="hidden md:block text-xs text-muted-foreground w-20">
                        Open {e.openRate ?? "—"}
                      </div>
                      <Badge variant="muted" className="text-[10px]">{e.status ?? "draft"}</Badge>
                      <Button size="sm" variant="ghost">Edit</Button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {active === "calendar" && (
            <section className="space-y-4">
              <SectionHeader title="Calendar" onRegenerate={() => regenerateStep("calendar")} />
              <CalendarView events={calendar} />
            </section>
          )}

          {active === "automation" && (
            <section className="space-y-4">
              <SectionHeader title="Automation" onRegenerate={() => regenerateStep("workflow")} />
              {!workflow ? (
                <EmptyState label="No workflow yet." />
              ) : (
                <div className="rounded-xl border p-6">
                  <div className="flex items-center gap-3 overflow-x-auto pb-2">
                    {(workflow.nodes ?? [
                      { type: "trigger", label: "Lead submits form" },
                      { type: "action", label: "Send welcome email" },
                      { type: "delay", label: "Wait 2 days" },
                      { type: "condition", label: "Opened?" },
                      { type: "action", label: "Send follow-up" },
                    ]).map((n: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 shrink-0">
                        <div className="rounded-lg border bg-muted/30 px-3 py-2 min-w-[140px]">
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{n.type}</div>
                          <div className="text-xs font-medium mt-0.5">{n.label}</div>
                        </div>
                        {i < (workflow.nodes ?? [1, 2, 3, 4, 5]).length - 1 && (
                          <div className="w-6 h-px bg-border" />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline"><Pencil className="size-3.5 mr-1.5" /> Edit</Button>
                    <Button size="sm" variant="outline"><Play className="size-3.5 mr-1.5" /> Run test</Button>
                    <Button size="sm" variant="outline">Enable</Button>
                  </div>
                </div>
              )}
            </section>
          )}

          {active === "analytics" && (
            <section className="space-y-4">
              <SectionHeader title="Analytics" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { l: "Reach", v: "—" }, { l: "Engagement", v: "—" }, { l: "CTR", v: "—" },
                  { l: "Leads", v: "—" }, { l: "Revenue", v: "—" }, { l: "ROI", v: "—" },
                ].map((m) => (
                  <div key={m.l} className="rounded-xl border p-4">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{m.l}</div>
                    <div className="text-xl font-semibold mt-1">{m.v}</div>
                  </div>
                ))}
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <ChartCard title="Daily performance" />
                <ChartCard title="Platform performance" />
                <ChartCard title="Top posts" />
                <ChartCard title="Lead sources" />
              </div>
              <p className="text-xs text-muted-foreground">
                Analytics populate once campaign begins publishing.
              </p>
            </section>
          )}

          {active === "settings" && (
            <section className="space-y-4 max-w-2xl">
              <SectionHeader title="Settings" />
              <div className="rounded-xl border p-5 space-y-4">
                <div>
                  <label className="text-xs font-medium">Project name</label>
                  <Input defaultValue={project.name} onBlur={(e) => {
                    if (e.target.value.trim() && e.target.value !== project.name) {
                      renameFn({ data: { id: projectId, name: e.target.value.trim() } })
                        .then(() => qc.invalidateQueries({ queryKey: ["marketing-project", projectId] }));
                    }
                  }} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium">Prompt</label>
                  <div className="mt-1 text-sm text-muted-foreground p-3 rounded-md bg-muted/30 border">
                    {project.prompt}
                  </div>
                </div>
              </div>
              <Button variant="danger" size="sm" onClick={doDelete}>
                <Trash2 className="size-3.5 mr-1.5" /> Delete project
              </Button>
            </section>
          )}
        </main>

        {/* -------- RIGHT AI PANEL -------- */}
        <aside className="hidden lg:block border-l bg-muted/20">
          <div className="sticky top-16 p-4 space-y-4">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
                Campaign health
              </div>
              <div className="space-y-2.5">
                <ScoreRow icon={Gauge}       label="Optimization"       score={82} />
                <ScoreRow icon={Zap}         label="SEO score"          score={74} />
                <ScoreRow icon={Sparkles}    label="Content quality"    score={88} />
                <ScoreRow icon={Palette}     label="Brand consistency"  score={91} />
                <ScoreRow icon={ShieldCheck} label="Compliance"         score={95} />
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
                Suggestions
              </div>
              <ul className="space-y-2 text-xs">
                <li className="flex gap-2"><Lightbulb className="size-3.5 text-amber-500 mt-0.5 shrink-0" /> Add UTM tags to landing page CTAs.</li>
                <li className="flex gap-2"><Lightbulb className="size-3.5 text-amber-500 mt-0.5 shrink-0" /> Post reels between 6–9 PM for engagement.</li>
                <li className="flex gap-2"><Lightbulb className="size-3.5 text-amber-500 mt-0.5 shrink-0" /> Add student testimonial as post #12.</li>
              </ul>
            </div>

            <div className="pt-4 border-t">
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
                Trending topics
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["AI internships", "GenAI careers", "Bootcamp roi", "Placement stories", "Cyber security"].map((t) => (
                  <span key={t} className="text-[11px] px-2 py-1 rounded-full border bg-background">{t}</span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t space-y-1.5">
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
                One-click actions
              </div>
              <Button size="sm" variant="outline" className="w-full justify-start" onClick={() => regenerateStep("content")}>
                <Sparkles className="size-3.5 mr-1.5" /> Improve posts
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start" onClick={() => regenerateStep("email")}>
                <Mail className="size-3.5 mr-1.5" /> Improve emails
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start" onClick={() => regenerateStep("landing")}>
                <LayoutTemplate className="size-3.5 mr-1.5" /> Improve landing page
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start" onClick={() => regenerateStep("content")}>
                <FileText className="size-3.5 mr-1.5" /> Generate more content
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/* ============== GLOBAL ACTION BAR ============== */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
        <div className="flex items-center gap-1 rounded-full border bg-background/90 backdrop-blur-xl shadow-lg px-2 py-1.5">
          <Button size="sm" className="rounded-full gap-1.5"><Rocket className="size-3.5" /> Publish all</Button>
          <Button size="sm" variant="ghost" className="rounded-full gap-1.5"><Check className="size-3.5" /> Approve all</Button>
          <Button size="sm" variant="ghost" className="rounded-full gap-1.5"><Download className="size-3.5" /> ZIP</Button>
          <Button size="sm" variant="ghost" className="rounded-full gap-1.5"><FileText className="size-3.5" /> PDF</Button>
          <Button size="sm" variant="ghost" className="rounded-full gap-1.5"><Share2 className="size-3.5" /> Share</Button>
          <Button size="sm" variant="ghost" className="rounded-full text-destructive" onClick={doDelete}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* ============== AI COPILOT ============== */}
      <CopilotToggle open={copilotOpen} onClick={() => setCopilotOpen(true)} />
      <CopilotPanel
        projectId={projectId}
        projectName={project.name}
        status={project.status}
        open={copilotOpen}
        onClose={() => setCopilotOpen(false)}
      />
    </div>
  );
}

/* ---------------- small helpers ---------------- */

function SectionHeader({
  title, onRegenerate, inline,
}: { title: string; onRegenerate?: () => void; inline?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between", inline && "flex-1")}>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {onRegenerate && (
        <Button size="sm" variant="ghost" onClick={onRegenerate}>
          <RefreshCw className="size-3.5 mr-1.5" /> Regenerate
        </Button>
      )}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function IconBtn({
  icon: Icon, label, onClick, tone,
}: { icon: any; label: string; onClick?: () => void; tone?: "light" }) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={cn(
        "size-8 grid place-items-center rounded-md transition-colors",
        tone === "light" ? "bg-white/90 hover:bg-white text-slate-900" : "hover:bg-muted",
      )}
    >
      <Icon className="size-3.5" />
    </button>
  );
}

function StatBlock({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function ScoreRow({ icon: Icon, label, score }: { icon: any; label: string; score: number }) {
  const color =
    score >= 85 ? "bg-emerald-500" : score >= 70 ? "bg-amber-500" : "bg-red-500";
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="size-3.5" /> {label}
        </span>
        <span className="font-medium">{score}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full transition-all", color)} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function ChartCard({ title }: { title: string }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-sm font-medium mb-3">{title}</div>
      <div className="h-40 rounded-md bg-gradient-to-t from-primary/10 to-transparent grid place-items-end">
        <div className="w-full flex items-end justify-around gap-1 h-full px-3 pb-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-primary/30 rounded-t"
              style={{ height: `${20 + Math.abs(Math.sin(i)) * 70}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CalendarView({ events }: { events: any[] }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const first = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: Array<{ day: number | null; events: any[] }> = [];
  for (let i = 0; i < first; i++) cells.push({ day: null, events: [] });
  for (let d = 1; d <= daysInMonth; d++) {
    const dayEvents = events.filter((e) => {
      if (!e.scheduledAt && !e.date) return false;
      const dt = new Date(e.scheduledAt ?? e.date);
      return dt.getFullYear() === year && dt.getMonth() === month && dt.getDate() === d;
    });
    cells.push({ day: d, events: dayEvents });
  }

  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="grid grid-cols-7 text-[11px] uppercase tracking-wider text-muted-foreground border-b bg-muted/20">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="px-2 py-2 text-center">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((c, i) => (
          <div key={i} className="min-h-[86px] border-r border-b p-1.5 text-xs">
            {c.day && (
              <>
                <div className={cn(
                  "text-[11px] font-medium mb-1",
                  c.day === today.getDate() && "text-primary",
                )}>
                  {c.day}
                </div>
                <div className="space-y-1">
                  {c.events.slice(0, 2).map((e: any, ei: number) => (
                    <div key={ei} className="truncate px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px]">
                      {e.title ?? e.platform ?? "Post"}
                    </div>
                  ))}
                  {c.events.length > 2 && (
                    <div className="text-[10px] text-muted-foreground">+{c.events.length - 2} more</div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
