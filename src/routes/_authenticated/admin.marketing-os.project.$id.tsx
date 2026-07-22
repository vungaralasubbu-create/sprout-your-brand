import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkles, ArrowLeft, FileText, Image as ImageIcon, Video, LayoutTemplate,
  ClipboardList, Mail, CalendarDays, Workflow, BarChart3, LayoutDashboard,
  TrendingUp, Users, DollarSign, Target, Lightbulb, Activity,
  Send, Clock, Save, Check, X as XIcon, Loader2, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getMarketingProject } from "@/lib/marketing-os/projects.functions";
import {
  getProjectPublishStatus, saveProjectDraft, approveProject, rejectProject,
  publishProjectNow, scheduleProject,
  approvePosts, rejectPosts, publishPostsNow, schedulePosts, updatePost, regeneratePost,
} from "@/lib/marketing-os/project-publish.functions";
import { listConnectedAccounts } from "@/lib/marketing-os/publisher.functions";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw } from "lucide-react";
import { PosterCanvas, downloadPosterPng, type PosterModel } from "@/components/marketing-os/poster-canvas";
import { PosterEditorDialog } from "@/components/marketing-os/poster-editor-dialog";


export const Route = createFileRoute("/_authenticated/admin/marketing-os/project/$id")({
  component: ProjectOverview,
});


function ProjectOverview() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const getFn = useServerFn(getMarketingProject);
  const q = useQuery({
    queryKey: ["marketing-project", id],
    queryFn: () => getFn({ data: { id } }),
    refetchInterval: (query) => {
      const p = query.state.data?.project;
      return p && p.status === "running" ? 2500 : false;
    },
  });

  if (q.isLoading) {
    return <div className="p-6"><div className="h-64 rounded-2xl bg-muted/40 animate-pulse" /></div>;
  }
  const project = q.data?.project;
  if (!project) return <div className="p-6">Project not found.</div>;

  const r = project.result || {};
  const brief = r.brief || {};
  const content: any[] = Array.isArray(r.content) ? r.content : [];
  const posters: any[] = Array.isArray(r.posters) ? r.posters : [];
  const emails: any[] = Array.isArray(r.emails) ? r.emails : [];
  const calendar: any[] = Array.isArray(r.calendar) ? r.calendar : [];

  const kpis = [
    { label: "Campaign", value: r.campaign ? 1 : 0, icon: Target, tone: "from-blue-500/20 to-cyan-500/10" },
    { label: "Posts", value: content.length, icon: FileText, tone: "from-fuchsia-500/20 to-pink-500/10" },
    { label: "Posters", value: posters.length, icon: ImageIcon, tone: "from-amber-500/20 to-orange-500/10" },
    { label: "Landing pages", value: r.landing ? 1 : 0, icon: LayoutTemplate, tone: "from-indigo-500/20 to-violet-500/10" },
    { label: "Forms", value: r.form ? 1 : 0, icon: ClipboardList, tone: "from-emerald-500/20 to-teal-500/10" },
    { label: "Emails", value: emails.length, icon: Mail, tone: "from-rose-500/20 to-red-500/10" },
    { label: "Est. reach", value: (content.length * 1200).toLocaleString(), icon: Users, tone: "from-sky-500/20 to-blue-500/10" },
    { label: "Est. leads", value: (content.length * 45).toLocaleString(), icon: TrendingUp, tone: "from-lime-500/20 to-green-500/10" },
    { label: "Projected ROI", value: "3.4x", icon: DollarSign, tone: "from-yellow-500/20 to-amber-500/10" },
  ];

  return (
    <div className="max-w-[1500px] mx-auto pb-16">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/admin/marketing-os" })}>
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Marketing project
            </div>
            <h1 className="text-2xl font-bold tracking-tight line-clamp-2">{project.name}</h1>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{project.prompt}</p>
          </div>
        </div>
        <Badge variant={project.status === "completed" ? "success" : "muted"} className="capitalize shrink-0">
          {project.status}
        </Badge>
      </div>

      <ProjectPublishToolbar projectId={id} />



      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="min-w-0">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="flex flex-wrap h-auto">
              <TabsTrigger value="overview"><LayoutDashboard className="size-3.5 mr-1.5" />Overview</TabsTrigger>
              <TabsTrigger value="strategy"><Sparkles className="size-3.5 mr-1.5" />Strategy</TabsTrigger>
              <TabsTrigger value="content"><FileText className="size-3.5 mr-1.5" />Content</TabsTrigger>
              <TabsTrigger value="images"><ImageIcon className="size-3.5 mr-1.5" />Images</TabsTrigger>
              <TabsTrigger value="videos"><Video className="size-3.5 mr-1.5" />Videos</TabsTrigger>
              <TabsTrigger value="landing"><LayoutTemplate className="size-3.5 mr-1.5" />Landing</TabsTrigger>
              <TabsTrigger value="forms"><ClipboardList className="size-3.5 mr-1.5" />Forms</TabsTrigger>
              <TabsTrigger value="emails"><Mail className="size-3.5 mr-1.5" />Emails</TabsTrigger>
              <TabsTrigger value="calendar"><CalendarDays className="size-3.5 mr-1.5" />Calendar</TabsTrigger>
              <TabsTrigger value="automation"><Workflow className="size-3.5 mr-1.5" />Automation</TabsTrigger>
              <TabsTrigger value="analytics"><BarChart3 className="size-3.5 mr-1.5" />Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-5 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {kpis.map((k) => {
                  const Icon = k.icon;
                  return (
                    <motion.div
                      key={k.label}
                      whileHover={{ y: -2 }}
                      className={cn("rounded-2xl border border-border/60 p-4 bg-gradient-to-br", k.tone)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{k.label}</span>
                        <Icon className="size-4 text-muted-foreground" />
                      </div>
                      <div className="text-2xl font-bold mt-2">{k.value}</div>
                    </motion.div>
                  );
                })}
              </div>
              {brief.objective && (
                <div className="rounded-2xl border border-border/60 p-5 bg-card">
                  <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Objective</div>
                  <p className="text-sm">{brief.objective}</p>
                  {brief.audience && (
                    <>
                      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2 mt-4">Audience</div>
                      <p className="text-sm">{brief.audience}</p>
                    </>
                  )}
                  {brief.key_message && (
                    <>
                      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2 mt-4">Key message</div>
                      <p className="text-sm">{brief.key_message}</p>
                    </>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="strategy" className="mt-5">
              <PrettyJson data={r.strategy} empty="No strategy yet." />
            </TabsContent>

            <TabsContent value="content" className="mt-5 space-y-3">
              <PostReviewList projectId={id} content={content} posters={posters} onChanged={() => q.refetch()} postStates={r.post_states ?? {}} />
            </TabsContent>

            <TabsContent value="images" className="mt-5">
              {posters.length === 0 ? <Empty text="No posters yet." /> :
                <PosterGrid projectId={id} posters={posters} />
              }
            </TabsContent>


            <TabsContent value="videos" className="mt-5">
              <Empty text="Video generation coming soon. Reuses existing AI Video Studio." />
            </TabsContent>

            <TabsContent value="landing" className="mt-5">
              {!r.landing ? <Empty text="Landing page not generated." /> :
                <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
                  <div className="p-8 md:p-12 bg-gradient-to-br from-primary/5 to-fuchsia-500/5 text-center">
                    <h2 className="text-3xl font-bold tracking-tight">{r.landing.hero?.headline}</h2>
                    <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">{r.landing.hero?.sub}</p>
                    <Button className="mt-6" size="lg">{r.landing.hero?.cta ?? "Get started"}</Button>
                  </div>
                  <div className="p-6 grid md:grid-cols-3 gap-4">
                    {(r.landing.features ?? []).slice(0, 6).map((f: any, i: number) => (
                      <div key={i} className="rounded-xl border border-border/60 p-4">
                        <div className="font-semibold">{f.title}</div>
                        <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-6 flex justify-end gap-2 border-t border-border/60">
                    <Button variant="outline">Edit</Button>
                    <Button variant="outline">Duplicate</Button>
                    <Button>Publish</Button>
                  </div>
                </div>
              }
            </TabsContent>

            <TabsContent value="forms" className="mt-5">
              {!r.form ? <Empty text="No form yet." /> :
                <div className="rounded-2xl border border-border/60 bg-card p-6 max-w-lg">
                  <h3 className="font-semibold text-lg">{r.form.title}</h3>
                  <p className="text-sm text-muted-foreground">{r.form.description}</p>
                  <div className="mt-4 space-y-3">
                    {(r.form.fields ?? []).map((f: any, i: number) => (
                      <div key={i}>
                        <label className="text-xs font-medium">{f.label}{f.required && " *"}</label>
                        <div className="mt-1 h-10 rounded-lg border border-border/60 bg-muted/30 px-3 grid items-center text-xs text-muted-foreground">
                          {f.type} input
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button className="mt-4 w-full">{r.form.submit_label ?? "Submit"}</Button>
                  <div className="mt-3 text-xs text-muted-foreground">Submissions: 0</div>
                </div>
              }
            </TabsContent>

            <TabsContent value="emails" className="mt-5 space-y-3">
              {emails.length === 0 ? <Empty text="No emails yet." /> :
                emails.map((e, i) => (
                  <div key={i} className="rounded-2xl border border-border/60 p-5 bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">Day {e.day ?? i + 1}</Badge>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">Edit</Button>
                        <Button variant="ghost" size="sm">Regenerate</Button>
                        <Button size="sm">Schedule</Button>
                      </div>
                    </div>
                    <div className="font-semibold">{e.subject}</div>
                    <div className="text-xs text-muted-foreground">{e.preheader}</div>
                    <p className="text-sm mt-3 whitespace-pre-wrap">{e.body}</p>
                  </div>
                ))
              }
            </TabsContent>

            <TabsContent value="calendar" className="mt-5">
              {calendar.length === 0 ? <Empty text="No calendar entries yet." /> :
                <div className="rounded-2xl border border-border/60 bg-card divide-y">
                  {calendar.map((e, i) => (
                    <div key={i} className="flex items-center gap-4 p-4">
                      <div className="text-xs font-mono w-24">{e.date}</div>
                      <Badge variant="outline" className="uppercase text-[10px]">{e.platform}</Badge>
                      <div className="text-sm flex-1 truncate">{e.hook}</div>
                      <Badge variant="muted">{e.status}</Badge>
                    </div>
                  ))}
                </div>
              }
            </TabsContent>

            <TabsContent value="automation" className="mt-5">
              <PrettyJson data={r.workflow} empty="No workflow yet." />
            </TabsContent>

            <TabsContent value="analytics" className="mt-5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {["Reach","Engagement","Leads","Revenue","CTR","ROI"].map((m) => (
                  <div key={m} className="rounded-2xl border border-border/60 p-4 bg-card">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{m}</div>
                    <div className="text-2xl font-bold mt-2">—</div>
                    <div className="text-xs text-muted-foreground">Awaits live data</div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right rail */}
        <aside className="space-y-4">
          <RailCard icon={Lightbulb} title="AI Suggestions">
            <ul className="text-sm space-y-2">
              <li>· Add urgency to landing hero CTA</li>
              <li>· Post LinkedIn content on Tue &amp; Thu 9am IST</li>
              <li>· Retarget form drop-offs on day 3</li>
            </ul>
          </RailCard>
          <RailCard icon={Activity} title="Campaign health">
            <div className="text-sm space-y-2">
              <div className="flex items-center justify-between"><span>Strategy</span><Badge variant={r.strategy ? "default" : "outline"}>{r.strategy ? "Ready" : "Missing"}</Badge></div>
              <div className="flex items-center justify-between"><span>Content</span><Badge variant={content.length ? "default" : "outline"}>{content.length ? `${content.length} posts` : "—"}</Badge></div>
              <div className="flex items-center justify-between"><span>Landing</span><Badge variant={r.landing ? "default" : "outline"}>{r.landing ? "Ready" : "—"}</Badge></div>
              <div className="flex items-center justify-between"><span>Emails</span><Badge variant={emails.length ? "default" : "outline"}>{emails.length ? `${emails.length}` : "—"}</Badge></div>
            </div>
          </RailCard>
          <RailCard icon={TrendingUp} title="Optimization tips">
            <ul className="text-sm space-y-2">
              <li>· A/B test your top 2 hooks</li>
              <li>· Add UTM tags before publishing</li>
              <li>· Warm up domain before email blast</li>
            </ul>
          </RailCard>
        </aside>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">{text}</div>;
}

function PrettyJson({ data, empty }: { data: any; empty: string }) {
  if (!data) return <Empty text={empty} />;
  return (
    <pre className="rounded-2xl border border-border/60 bg-card p-5 text-xs overflow-auto max-h-[600px]">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function RailCard({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="size-7 rounded-lg bg-primary/10 grid place-items-center">
          <Icon className="size-4 text-primary" />
        </div>
        <div className="text-sm font-semibold">{title}</div>
      </div>
      {children}
    </div>
  );
}

/* ================= Publish Toolbar (additive, non-redesigning) ================= */

const PUBLISH_STATE_TONE: Record<string, { label: string; variant: "success" | "muted" | "outline" | "destructive" | "default" }> = {
  draft:      { label: "Draft",      variant: "outline" },
  approved:   { label: "Approved",   variant: "default" },
  scheduled:  { label: "Scheduled",  variant: "default" },
  publishing: { label: "Publishing", variant: "default" },
  published:  { label: "Published",  variant: "success" },
  failed:     { label: "Failed",     variant: "destructive" },
  rejected:   { label: "Rejected",   variant: "muted" },
};

function ProjectPublishToolbar({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const statusFn = useServerFn(getProjectPublishStatus);
  const saveFn = useServerFn(saveProjectDraft);
  const approveFn = useServerFn(approveProject);
  const rejectFn = useServerFn(rejectProject);
  const publishNowFn = useServerFn(publishProjectNow);
  const scheduleFn = useServerFn(scheduleProject);
  const [busy, setBusy] = useState<null | "draft" | "approve" | "reject" | "publish" | "schedule">(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [when, setWhen] = useState<string>(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    d.setSeconds(0, 0);
    return d.toISOString().slice(0, 16); // local-format for datetime-local
  });
  const [tz, setTz] = useState<string>(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");

  const q = useQuery({
    queryKey: ["project-publish-status", projectId],
    queryFn: () => statusFn({ data: { projectId } }),
    refetchInterval: (query) => {
      const s = (query.state.data as any)?.publish?.state;
      const jobs = (query.state.data as any)?.jobs as any[] | undefined;
      const hasActive = jobs?.some((j) => j.status === "queued" || j.status === "publishing" || j.status === "retrying");
      return s === "publishing" || hasActive ? 3000 : false;
    },
  });

  const publish = (q.data as any)?.publish ?? { state: "draft" };
  const jobs: any[] = (q.data as any)?.jobs ?? [];
  const tone = PUBLISH_STATE_TONE[publish.state] ?? PUBLISH_STATE_TONE.draft;

  const wrap = async (name: NonNullable<typeof busy>, fn: () => Promise<unknown>, ok: string) => {
    try {
      setBusy(name);
      await fn();
      toast.success(ok);
      await qc.invalidateQueries({ queryKey: ["project-publish-status", projectId] });
    } catch (e) {
      toast.error((e as Error).message ?? "Action failed");
    } finally {
      setBusy(null);
    }
  };

  const summary = (() => {
    if (!jobs.length) return null;
    const c = (s: string) => jobs.filter((j) => j.status === s).length;
    return { pending: c("queued") + c("retrying"), publishing: c("publishing"), published: c("published"), failed: c("failed") };
  })();

  return (
    <div className="mb-6 rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 mr-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Publish</span>
          <Badge variant={tone.variant as any} className="capitalize">{tone.label}</Badge>
        </div>
        <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => wrap("draft", () => saveFn({ data: { projectId } }), "Saved as draft")}>
          {busy === "draft" ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <Save className="size-3.5 mr-1.5" />} Save Draft
        </Button>
        <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => wrap("approve", async () => {
          const res = await approveFn({ data: { projectId } }) as { publishing?: { jobs?: Array<{ id: string }> } };
          const firstId = res?.publishing?.jobs?.[0]?.id;
          await navigate({
            to: "/admin/marketing-os/publisher",
            search: firstId ? { highlight: firstId } : undefined,
          }).catch(() => { /* route may not accept search; ignore */ });
        }, "Approved — publishing jobs queued")}>
          {busy === "approve" ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <Check className="size-3.5 mr-1.5" />} Approve
        </Button>
        <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => wrap("reject", () => rejectFn({ data: { projectId } }), "Rejected")}>
          {busy === "reject" ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <XIcon className="size-3.5 mr-1.5" />} Reject
        </Button>
        <div className="flex-1" />
        <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => setScheduleOpen(true)}>
          <Clock className="size-3.5 mr-1.5" /> Schedule
        </Button>
        <Button size="sm" disabled={busy !== null} onClick={() => wrap("publish", () => publishNowFn({ data: { projectId } }), "Publishing started")}>
          {busy === "publish" ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <Send className="size-3.5 mr-1.5" />} Publish Now
        </Button>
      </div>

      {summary && (
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>{summary.pending} pending</span>
          <span>·</span>
          <span>{summary.publishing} publishing</span>
          <span>·</span>
          <span>{summary.published} published</span>
          <span>·</span>
          <span className={summary.failed > 0 ? "text-destructive" : ""}>{summary.failed} failed</span>
        </div>
      )}

      {jobs.length > 0 && (
        <div className="mt-3 border-t border-border/60 pt-3 space-y-1.5 max-h-56 overflow-auto">
          {jobs.map((j) => (
            <div key={j.id} className="flex items-center gap-2 text-xs">
              <Badge variant="outline" className="uppercase text-[10px] min-w-[70px] justify-center">{j.platform}</Badge>
              <span className="capitalize text-muted-foreground min-w-[80px]">{j.status}</span>
              <span className="text-muted-foreground truncate flex-1">{j.account_label ?? "—"}</span>
              {j.platform_url ? (
                <a href={j.platform_url} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                  View <ExternalLink className="size-3" />
                </a>
              ) : j.error_message ? (
                <span className="text-destructive truncate max-w-[240px]" title={j.error_message}>{j.error_message}</span>
              ) : (
                <span className="text-muted-foreground">{new Date(j.scheduled_at).toLocaleString()}</span>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule publish</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="pp-when">Date &amp; time</Label>
              <Input id="pp-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="pp-tz">Timezone</Label>
              <Input id="pp-tz" value={tz} onChange={(e) => setTz(e.target.value)} placeholder="e.g. Asia/Kolkata" />
            </div>
            <p className="text-xs text-muted-foreground">
              Posts publish to every connected account (Instagram, Facebook, LinkedIn, X).
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>Cancel</Button>
            <Button
              disabled={busy !== null}
              onClick={async () => {
                const iso = new Date(when).toISOString();
                await wrap("schedule", () => scheduleFn({ data: { projectId, scheduled_at: iso, timezone: tz } }), "Scheduled");
                setScheduleOpen(false);
              }}
            >
              {busy === "schedule" ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <Clock className="size-3.5 mr-1.5" />} Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ================= Per-post review list (additive) ================= */

type PostStateRow = {
  state?: "draft" | "approved" | "rejected" | "scheduled" | "publishing" | "published" | "failed";
  scheduled_at?: string;
  timezone?: string;
  job_ids?: string[];
};

const POST_STATE_TONE: Record<string, "outline" | "default" | "success" | "destructive" | "muted"> = {
  draft: "outline", approved: "default", rejected: "muted",
  scheduled: "default", publishing: "default", published: "success", failed: "destructive",
};

function PostReviewList({ projectId, content, posters, postStates, onChanged }: {
  projectId: string;
  content: any[];
  posters: any[];
  postStates: Record<string, PostStateRow>;
  onChanged: () => void;
}) {
  const approveFn = useServerFn(approvePosts);
  const rejectFn = useServerFn(rejectPosts);
  const publishFn = useServerFn(publishPostsNow);
  const scheduleFn = useServerFn(schedulePosts);
  const updateFn = useServerFn(updatePost);
  const regenFn = useServerFn(regeneratePost);
  const accountsFn = useServerFn(listConnectedAccounts);

  const accountsQ = useQuery({
    queryKey: ["mos-connected-accounts"],
    queryFn: () => accountsFn(),
  });
  const accounts: Array<{ platform: string; account_name: string | null }> =
    ((accountsQ.data as any)?.accounts ?? []) as any[];

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [scheduleFor, setScheduleFor] = useState<number[] | null>(null);
  const [editorIdx, setEditorIdx] = useState<number | null>(null);
  const [when, setWhen] = useState<string>(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    d.setSeconds(0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [tz] = useState<string>(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");

  if (!content.length) {
    return <Empty text="No content generated." />;
  }

  const allIdx = content.map((_, i) => i);
  const allSelected = selected.size === content.length;
  const toggle = (i: number) => {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i); else next.add(i);
    setSelected(next);
  };
  const selectAll = () => setSelected(allSelected ? new Set() : new Set(allIdx));

  const run = async (label: string, fn: () => Promise<unknown>, ok: string) => {
    try {
      setBusy(label);
      await fn();
      toast.success(ok);
      setSelected(new Set());
      onChanged();
    } catch (e) {
      toast.error((e as Error).message ?? "Action failed");
    } finally {
      setBusy(null);
    }
  };

  const doBulk = (action: "approve" | "reject" | "publish", indexes: number[]) => {
    if (!indexes.length) { toast.error("Select at least one post"); return; }
    if (action === "approve") return run("approve", () => approveFn({ data: { projectId, indexes } }), `Approved ${indexes.length} post(s)`);
    if (action === "reject") return run("reject", () => rejectFn({ data: { projectId, indexes } }), `Rejected ${indexes.length} post(s)`);
    if (action === "publish") return run("publish", () => publishFn({ data: { projectId, indexes } }), `Publishing ${indexes.length} post(s)`);
  };

  const imageFor = (i: number): string | undefined => {
    const poster = posters[i] ?? posters[0];
    return typeof poster?.image_url === "string" ? poster.image_url : undefined;
  };

  return (
    <div className="space-y-3">
      {/* Bulk toolbar */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-card/95 backdrop-blur px-3 py-2">
        <label className="flex items-center gap-2 text-xs font-medium">
          <Checkbox checked={allSelected} onCheckedChange={selectAll} />
          {selected.size ? `${selected.size} selected` : "Select all"}
        </label>
        <div className="flex-1" />
        <Button size="sm" variant="outline" disabled={busy !== null || !selected.size} onClick={() => doBulk("approve", [...selected])}>
          <Check className="size-3.5 mr-1.5" /> Approve
        </Button>
        <Button size="sm" variant="outline" disabled={busy !== null || !selected.size} onClick={() => doBulk("reject", [...selected])}>
          <XIcon className="size-3.5 mr-1.5" /> Reject
        </Button>
        <Button size="sm" variant="outline" disabled={busy !== null || !selected.size} onClick={() => setScheduleFor([...selected])}>
          <Clock className="size-3.5 mr-1.5" /> Schedule
        </Button>
        <Button size="sm" disabled={busy !== null || !selected.size} onClick={() => doBulk("publish", [...selected])}>
          {busy === "publish" ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <Send className="size-3.5 mr-1.5" />}
          Publish Now
        </Button>
      </div>

      {content.map((p, i) => {
        const st = postStates[String(i)] ?? {};
        const stateKey = st.state ?? "draft";
        const tone = POST_STATE_TONE[stateKey] ?? "outline";
        const img = imageFor(i);
        return (
          <div
            key={i}
            role="button"
            tabIndex={0}
            onClick={() => setEditorIdx(i)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setEditorIdx(i); } }}
            className="rounded-2xl border border-border/60 p-4 bg-card cursor-pointer hover:border-primary/40 hover:bg-accent/20 transition"
          >
            <div className="flex items-start gap-3">
              <div onClick={(e) => e.stopPropagation()}>
                <Checkbox className="mt-1" checked={selected.has(i)} onCheckedChange={() => toggle(i)} />
              </div>
              {img && (
                <img
                  src={img}
                  alt=""
                  loading="lazy"
                  className="size-20 rounded-lg object-cover border border-border/60 shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="uppercase text-[10px]">{p.platform ?? "post"}</Badge>
                    <Badge variant={tone as any} className="capitalize text-[10px]">{stateKey}</Badge>
                    {st.scheduled_at && (
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(st.scheduled_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => setEditorIdx(i)}>Edit</Button>
                    <Button variant="ghost" size="sm" disabled={busy !== null}
                      onClick={() => run("approve1", () => approveFn({ data: { projectId, indexes: [i] } }), "Approved")}>
                      <Check className="size-3.5 mr-1" />Approve
                    </Button>
                    <Button variant="ghost" size="sm" disabled={busy !== null}
                      onClick={() => run("reject1", () => rejectFn({ data: { projectId, indexes: [i] } }), "Rejected")}>
                      <XIcon className="size-3.5 mr-1" />Reject
                    </Button>
                    <Button variant="ghost" size="sm" disabled={busy !== null} onClick={() => setScheduleFor([i])}>
                      <Clock className="size-3.5 mr-1" />Schedule
                    </Button>
                    <Button size="sm" disabled={busy !== null}
                      onClick={() => run("pub1", () => publishFn({ data: { projectId, indexes: [i] } }), "Publishing")}>
                      <Send className="size-3.5 mr-1" />Publish Now
                    </Button>
                  </div>
                </div>
                <div className="font-semibold">{p.hook}</div>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-3">{p.body}</p>
                {p.cta && <div className="text-xs mt-2"><span className="font-mono uppercase tracking-widest text-muted-foreground">CTA</span> · {p.cta}</div>}
                {Array.isArray(p.hashtags) && p.hashtags.length > 0 && (
                  <div className="text-xs mt-2 text-muted-foreground">{p.hashtags.map((h: string) => h.startsWith("#") ? h : `#${h}`).join(" ")}</div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Schedule dialog (bulk + single) */}
      <Dialog open={scheduleFor !== null} onOpenChange={(o) => !o && setScheduleFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule {scheduleFor?.length ?? 0} post(s)</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="post-when">Date &amp; time</Label>
              <Input id="post-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">
              Enqueues to every connected account (Instagram, Facebook, LinkedIn, X).
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleFor(null)}>Cancel</Button>
            <Button disabled={busy !== null} onClick={async () => {
              const iso = new Date(when).toISOString();
              const indexes = scheduleFor ?? [];
              await run("schedule", () => scheduleFn({ data: { projectId, indexes, scheduled_at: iso, timezone: tz } }), "Scheduled");
              setScheduleFor(null);
            }}>
              {busy === "schedule" ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <Clock className="size-3.5 mr-1.5" />} Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Content Editor */}
      <ContentEditorDialog
        open={editorIdx !== null}
        onClose={() => setEditorIdx(null)}
        index={editorIdx}
        post={editorIdx !== null ? content[editorIdx] : null}
        image={editorIdx !== null ? imageFor(editorIdx) : undefined}
        stateKey={editorIdx !== null ? (postStates[String(editorIdx)]?.state ?? "draft") : "draft"}
        accounts={accounts}
        busy={busy}
        onSave={async (edits) => {
          if (editorIdx === null) return;
          await run("edit", () => updateFn({ data: { projectId, index: editorIdx, edits } }), "Saved");
        }}
        onRegenerate={async (instructions) => {
          if (editorIdx === null) return;
          await run("regen", () => regenFn({ data: { projectId, index: editorIdx, instructions } }), "Regenerated");
        }}
        onApprove={async () => {
          if (editorIdx === null) return;
          await run("approve1", () => approveFn({ data: { projectId, indexes: [editorIdx] } }), "Approved");
        }}
        onReject={async () => {
          if (editorIdx === null) return;
          await run("reject1", () => rejectFn({ data: { projectId, indexes: [editorIdx] } }), "Rejected");
        }}
        onPublishNow={async () => {
          if (editorIdx === null) return;
          await run("pub1", () => publishFn({ data: { projectId, indexes: [editorIdx] } }), "Publishing");
          setEditorIdx(null);
        }}
        onSchedule={() => {
          if (editorIdx === null) return;
          setScheduleFor([editorIdx]);
        }}
      />
    </div>
  );
}

function ContentEditorDialog({
  open, onClose, index, post, image, stateKey, accounts, busy,
  onSave, onRegenerate, onApprove, onReject, onPublishNow, onSchedule,
}: {
  open: boolean;
  onClose: () => void;
  index: number | null;
  post: any;
  image?: string;
  stateKey: string;
  accounts: Array<{ platform: string; account_name: string | null }>;
  busy: string | null;
  onSave: (edits: { hook?: string; body?: string; cta?: string; hashtags?: string[] }) => Promise<void>;
  onRegenerate: (instructions?: string) => Promise<void>;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
  onPublishNow: () => Promise<void>;
  onSchedule: () => void;
}) {
  const [hook, setHook] = useState("");
  const [body, setBody] = useState("");
  const [cta, setCta] = useState("");
  const [tags, setTags] = useState("");
  const [regenNote, setRegenNote] = useState("");

  useEffect(() => {
    if (open && post) {
      setHook(String(post.hook ?? ""));
      setBody(String(post.body ?? ""));
      setCta(String(post.cta ?? ""));
      setTags(Array.isArray(post.hashtags) ? post.hashtags.join(" ") : "");
      setRegenNote("");
    }
  }, [open, post, index]);

  const tone = POST_STATE_TONE[stateKey] ?? "outline";
  const platform = String(post?.platform ?? "").toLowerCase();
  const matching = platform ? accounts.filter((a) => a.platform.toLowerCase() === platform) : accounts;

  const save = () => {
    const hashtags = tags.split(/\s+/).filter(Boolean).map((h) => h.replace(/^#/, ""));
    return onSave({ hook, body, cta, hashtags });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Content editor
            <Badge variant="outline" className="uppercase text-[10px]">{post?.platform ?? "post"}</Badge>
            <Badge variant={tone as any} className="capitalize text-[10px]">{stateKey}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-5">
          <div className="space-y-3">
            <div className="aspect-square rounded-xl border border-border/60 overflow-hidden bg-muted/30 grid place-items-center">
              {image ? (
                <img src={image} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="size-8 text-muted-foreground/40" />
              )}
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">Target platforms</div>
              {matching.length ? (
                <div className="flex flex-wrap gap-1">
                  {matching.map((a, i) => (
                    <Badge key={i} variant="muted" className="text-[10px] capitalize">
                      {a.platform}{a.account_name ? ` · ${a.account_name}` : ""}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No connected accounts for this platform.</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label>Hook</Label>
              <Input value={hook} onChange={(e) => setHook(e.target.value)} />
            </div>
            <div>
              <Label>Caption / body</Label>
              <Textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)} />
            </div>
            <div>
              <Label>CTA</Label>
              <Input value={cta} onChange={(e) => setCta(e.target.value)} />
            </div>
            <div>
              <Label>Hashtags (space-separated)</Label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="#launch #ai" />
            </div>
            <div className="rounded-xl border border-dashed border-border/60 p-3">
              <Label className="text-xs">Regenerate with instructions (optional)</Label>
              <Input
                value={regenNote}
                onChange={(e) => setRegenNote(e.target.value)}
                placeholder="e.g. Make it punchier, add a question hook"
                className="mt-1"
              />
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                disabled={busy !== null}
                onClick={() => onRegenerate(regenNote || undefined)}
              >
                {busy === "regen" ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="size-3.5 mr-1.5" />}
                Regenerate
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <div className="flex-1" />
          <Button variant="outline" disabled={busy !== null} onClick={onReject}>
            <XIcon className="size-3.5 mr-1.5" /> Reject
          </Button>
          <Button variant="outline" disabled={busy !== null} onClick={onApprove}>
            <Check className="size-3.5 mr-1.5" /> Approve
          </Button>
          <Button variant="outline" disabled={busy !== null} onClick={save}>
            {busy === "edit" ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <Save className="size-3.5 mr-1.5" />} Save
          </Button>
          <Button variant="outline" disabled={busy !== null} onClick={onSchedule}>
            <Clock className="size-3.5 mr-1.5" /> Schedule
          </Button>
          <Button disabled={busy !== null} onClick={onPublishNow}>
            {busy === "pub1" ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <Send className="size-3.5 mr-1.5" />} Publish Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PosterGrid({ projectId, posters }: { projectId: string; posters: any[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const active = openIdx !== null ? (posters[openIdx] as PosterModel) : null;
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {posters.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpenIdx(i)}
            className="text-left rounded-2xl border border-border/60 overflow-hidden bg-card group focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <PosterCanvas poster={p as PosterModel} className="rounded-none border-b border-border/60" />
            <div className="p-3">
              <div className="font-medium text-sm line-clamp-1">{p.title ?? p.headline ?? "Poster"}</div>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{p.concept ?? p.subtitle}</p>
              <div className="mt-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Click to edit</span>
              </div>
              {p.image_error && (
                <p className="text-[11px] text-destructive mt-1">Image: {p.image_error}</p>
              )}
            </div>
          </button>
        ))}
      </div>
      {active && openIdx !== null ? (
        <PosterEditorDialog
          open={openIdx !== null}
          onOpenChange={(v) => !v && setOpenIdx(null)}
          projectId={projectId}
          index={openIdx}
          poster={active}
        />
      ) : null}
    </>
  );
}

