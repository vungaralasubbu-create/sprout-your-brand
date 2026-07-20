import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkles, ArrowLeft, FileText, Image as ImageIcon, Video, LayoutTemplate,
  ClipboardList, Mail, CalendarDays, Workflow, BarChart3, LayoutDashboard,
  TrendingUp, Users, DollarSign, Target, Lightbulb, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { getMarketingProject } from "@/lib/marketing-os/projects.functions";

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
              {content.length === 0 ? <Empty text="No content generated." /> :
                content.map((p, i) => (
                  <div key={i} className="rounded-2xl border border-border/60 p-4 bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="uppercase text-[10px]">{p.platform ?? "post"}</Badge>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">Edit</Button>
                        <Button variant="ghost" size="sm">Regenerate</Button>
                        <Button size="sm">Approve</Button>
                      </div>
                    </div>
                    <div className="font-semibold">{p.hook}</div>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{p.body}</p>
                    {p.cta && <div className="text-xs mt-2"><span className="font-mono uppercase tracking-widest text-muted-foreground">CTA</span> · {p.cta}</div>}
                  </div>
                ))
              }
            </TabsContent>

            <TabsContent value="images" className="mt-5">
              {posters.length === 0 ? <Empty text="No posters yet." /> :
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {posters.map((p, i) => (
                    <div key={i} className="rounded-2xl border border-border/60 overflow-hidden bg-card group">
                      <div className="aspect-square bg-gradient-to-br from-primary/20 via-fuchsia-500/10 to-amber-500/10 grid place-items-center relative">
                        <ImageIcon className="size-10 text-muted-foreground/40" />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-black/40 grid place-items-center gap-2">
                          <div className="flex gap-2">
                            <Button size="sm" variant="secondary">Preview</Button>
                            <Button size="sm" variant="secondary">Regenerate</Button>
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="font-medium text-sm">{p.title}</div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{p.concept}</p>
                      </div>
                    </div>
                  ))}
                </div>
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
                      <Badge variant="secondary">{e.status}</Badge>
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
