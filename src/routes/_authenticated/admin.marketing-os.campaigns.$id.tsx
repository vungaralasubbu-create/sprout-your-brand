import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getCampaign,
  saveCampaign,
  saveCampaignTask,
  deleteCampaignTask,
  addCampaignAsset,
  deleteCampaignAsset,
  generateCampaignAI,
  generateCampaignReport,
  setCampaignStatus,
} from "@/lib/marketing-os/campaigns.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Plus, Trash2, Sparkles, FileBarChart, Play, Pause, Archive, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/marketing-os/campaigns/$id")({
  component: CampaignDetail,
});

const AI_MODES = [
  { key: "strategy", label: "Strategy" },
  { key: "timeline", label: "Timeline" },
  { key: "weekly_plan", label: "Weekly Plan" },
  { key: "content_plan", label: "Content Plan" },
  { key: "budget_allocation", label: "Budget Allocation" },
  { key: "posting_frequency", label: "Posting Frequency" },
  { key: "success_prediction", label: "Predict Success" },
  { key: "roi_prediction", label: "Predict ROI" },
  { key: "improvements", label: "Improvements" },
];

const REPORT_TYPES = [
  { key: "summary", label: "Summary" },
  { key: "performance", label: "Performance" },
  { key: "roi", label: "ROI" },
  { key: "revenue", label: "Revenue" },
  { key: "lead_funnel", label: "Lead Funnel" },
  { key: "conversion_funnel", label: "Conversion Funnel" },
  { key: "platform_performance", label: "Platform" },
  { key: "content_performance", label: "Content" },
];

const TIMELINE_STAGES = ["planning", "preparation", "launch", "promotion", "closing", "analysis", "archive"];

function formatMoney(cents: number | null | undefined) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(cents ?? 0) / 100);
}

function CampaignDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const fetchFn = useServerFn(getCampaign);
  const saveFn = useServerFn(saveCampaign);
  const saveTaskFn = useServerFn(saveCampaignTask);
  const delTaskFn = useServerFn(deleteCampaignTask);
  const addAssetFn = useServerFn(addCampaignAsset);
  const delAssetFn = useServerFn(deleteCampaignAsset);
  const aiFn = useServerFn(generateCampaignAI);
  const reportFn = useServerFn(generateCampaignReport);
  const statusFn = useServerFn(setCampaignStatus);

  const query = useQuery({ queryKey: ["mkt-campaign", id], queryFn: () => fetchFn({ data: { id } }) });

  const saveMut = useMutation({
    mutationFn: async (payload: any) => saveFn({ data: payload }),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["mkt-campaign", id] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Save failed"),
  });

  const statusMut = useMutation({
    mutationFn: async (status: string) => statusFn({ data: { id, status: status as any } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mkt-campaign", id] }),
  });

  const aiMut = useMutation({
    mutationFn: async (mode: string) => aiFn({ data: { campaign_id: id, mode: mode as any } }),
    onSuccess: () => {
      toast.success("AI response ready");
      qc.invalidateQueries({ queryKey: ["mkt-campaign", id] });
    },
    onError: (e: any) => toast.error(e?.message ?? "AI failed"),
  });

  const reportMut = useMutation({
    mutationFn: async (report_type: string) => reportFn({ data: { campaign_id: id, report_type: report_type as any } }),
    onSuccess: () => {
      toast.success("Report generated");
      qc.invalidateQueries({ queryKey: ["mkt-campaign", id] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Report failed"),
  });

  const taskMut = useMutation({
    mutationFn: async (payload: any) => saveTaskFn({ data: payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mkt-campaign", id] }),
  });

  const delTaskMut = useMutation({
    mutationFn: async (tid: string) => delTaskFn({ data: { id: tid } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mkt-campaign", id] }),
  });

  const addAssetMut = useMutation({
    mutationFn: async (payload: any) => addAssetFn({ data: payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mkt-campaign", id] }),
  });

  const delAssetMut = useMutation({
    mutationFn: async (aid: string) => delAssetFn({ data: { id: aid } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mkt-campaign", id] }),
  });

  if (query.isLoading) return <div className="p-8 text-sm text-muted-foreground">Loading campaign…</div>;
  if (!query.data) return <div className="p-8 text-sm text-muted-foreground">Not found.</div>;

  const { campaign, tasks, assets, metrics, reports } = query.data;

  const totalReach = metrics.reduce((s: number, m: any) => s + Number(m.reach ?? 0), 0);
  const totalImpressions = metrics.reduce((s: number, m: any) => s + Number(m.impressions ?? 0), 0);
  const totalLeads = metrics.reduce((s: number, m: any) => s + Number(m.leads ?? 0), 0);
  const totalRevenue = metrics.reduce((s: number, m: any) => s + Number(m.revenue_cents ?? 0), 0);
  const totalSpend = metrics.reduce((s: number, m: any) => s + Number(m.spend_cents ?? 0), 0);
  const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <Link
            to="/admin/marketing-os/campaigns"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <ChevronLeft className="size-3.5" /> All campaigns
          </Link>
          <h2 className="text-2xl font-semibold tracking-tight mt-1">{campaign.name}</h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant={campaign.status === "active" ? "success" : "muted"}>{campaign.status}</Badge>
            {campaign.campaign_type && <Badge variant="outline">{campaign.campaign_type}</Badge>}
            <span className="text-xs text-muted-foreground">Stage: {campaign.timeline_stage}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {campaign.status === "active" ? (
            <Button variant="outline" size="sm" onClick={() => statusMut.mutate("paused")}>
              <Pause className="size-4 mr-1.5" /> Pause
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => statusMut.mutate("active")}>
              <Play className="size-4 mr-1.5" /> Activate
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => statusMut.mutate("completed")}>
            <CheckCircle2 className="size-4 mr-1.5" /> Complete
          </Button>
          <Button variant="outline" size="sm" onClick={() => statusMut.mutate("archived")}>
            <Archive className="size-4 mr-1.5" /> Archive
          </Button>
        </div>
      </div>

      {/* Quick metrics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <MetricPill label="Reach" value={totalReach.toLocaleString()} />
        <MetricPill label="Impressions" value={totalImpressions.toLocaleString()} />
        <MetricPill label="Leads" value={totalLeads.toLocaleString()} />
        <MetricPill label="Revenue" value={formatMoney(totalRevenue)} />
        <MetricPill label="Spend" value={formatMoney(totalSpend)} />
        <MetricPill label="ROI" value={`${roi.toFixed(1)}%`} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="ai">AI Assistant</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="p-4 lg:col-span-2 space-y-3">
              <div>
                <Label>Objective</Label>
                <Input
                  defaultValue={campaign.objective ?? ""}
                  onBlur={(e) => saveMut.mutate({ id: campaign.id, brand_id: campaign.brand_id, name: campaign.name, objective: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  defaultValue={campaign.description ?? ""}
                  rows={3}
                  onBlur={(e) =>
                    saveMut.mutate({ id: campaign.id, brand_id: campaign.brand_id, name: campaign.name, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Priority</Label>
                  <Select
                    defaultValue={campaign.priority}
                    onValueChange={(v) =>
                      saveMut.mutate({ id: campaign.id, brand_id: campaign.brand_id, name: campaign.name, priority: v as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["low", "medium", "high", "critical"].map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Timeline stage</Label>
                  <Select
                    defaultValue={campaign.timeline_stage}
                    onValueChange={(v) =>
                      saveMut.mutate({ id: campaign.id, brand_id: campaign.brand_id, name: campaign.name, timeline_stage: v as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMELINE_STAGES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Budget (₹)</Label>
                  <Input
                    type="number"
                    defaultValue={(campaign.budget_cents ?? 0) / 100 || ""}
                    onBlur={(e) =>
                      saveMut.mutate({
                        id: campaign.id,
                        brand_id: campaign.brand_id,
                        name: campaign.name,
                        budget_cents: Number(e.target.value) * 100 || null,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Expected revenue</Label>
                  <Input
                    type="number"
                    defaultValue={(campaign.expected_revenue_cents ?? 0) / 100 || ""}
                    onBlur={(e) =>
                      saveMut.mutate({
                        id: campaign.id,
                        brand_id: campaign.brand_id,
                        name: campaign.name,
                        expected_revenue_cents: Number(e.target.value) * 100 || null,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Actual revenue</Label>
                  <Input
                    type="number"
                    defaultValue={(campaign.actual_revenue_cents ?? 0) / 100 || ""}
                    onBlur={(e) =>
                      saveMut.mutate({
                        id: campaign.id,
                        brand_id: campaign.brand_id,
                        name: campaign.name,
                        actual_revenue_cents: Number(e.target.value) * 100 || null,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Expected leads</Label>
                  <Input
                    type="number"
                    defaultValue={campaign.expected_leads ?? ""}
                    onBlur={(e) =>
                      saveMut.mutate({
                        id: campaign.id,
                        brand_id: campaign.brand_id,
                        name: campaign.name,
                        expected_leads: Number(e.target.value) || null,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Actual leads</Label>
                  <Input
                    type="number"
                    defaultValue={campaign.actual_leads ?? ""}
                    onBlur={(e) =>
                      saveMut.mutate({
                        id: campaign.id,
                        brand_id: campaign.brand_id,
                        name: campaign.name,
                        actual_leads: Number(e.target.value) || null,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Admissions</Label>
                  <Input
                    type="number"
                    defaultValue={campaign.actual_admissions ?? ""}
                    onBlur={(e) =>
                      saveMut.mutate({
                        id: campaign.id,
                        brand_id: campaign.brand_id,
                        name: campaign.name,
                        actual_admissions: Number(e.target.value) || null,
                      })
                    }
                  />
                </div>
              </div>
            </Card>
            <Card className="p-4 space-y-2">
              <h3 className="font-semibold text-sm">Snapshot</h3>
              <div className="text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Goals</span>
                  <span>{(campaign.goals ?? []).join(", ") || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platforms</span>
                  <span className="text-right">{(campaign.target_platforms ?? []).join(", ") || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start</span>
                  <span>{campaign.starts_at ? new Date(campaign.starts_at).toLocaleDateString() : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">End</span>
                  <span>{campaign.ends_at ? new Date(campaign.ends_at).toLocaleDateString() : "—"}</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Timeline */}
        <TabsContent value="timeline">
          <Card className="p-4">
            <h3 className="font-semibold text-sm mb-3">Campaign phases</h3>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
              {TIMELINE_STAGES.map((s, i) => {
                const active = campaign.timeline_stage === s;
                const stageTasks = tasks.filter((t: any) => t.stage === s);
                return (
                  <div
                    key={s}
                    className={cn(
                      "p-3 rounded-lg border text-xs",
                      active ? "border-primary bg-primary/5" : "border-border",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold uppercase tracking-wide">{i + 1}</span>
                      {active && <span className="size-2 rounded-full bg-primary" />}
                    </div>
                    <div className="capitalize mt-1 font-medium">{s}</div>
                    <div className="text-muted-foreground mt-1">{stageTasks.length} tasks</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        {/* Tasks */}
        <TabsContent value="tasks">
          <TasksBoard
            tasks={tasks}
            onSave={(v) => taskMut.mutate(v)}
            onDelete={(tid) => delTaskMut.mutate(tid)}
            campaignId={id}
          />
        </TabsContent>

        {/* Assets */}
        <TabsContent value="assets">
          <AssetsPanel
            assets={assets}
            onAdd={(v) => addAssetMut.mutate(v)}
            onDelete={(aid) => delAssetMut.mutate(aid)}
            campaignId={id}
          />
        </TabsContent>

        {/* AI */}
        <TabsContent value="ai">
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {AI_MODES.map((m) => (
                <Button
                  key={m.key}
                  size="sm"
                  variant="outline"
                  onClick={() => aiMut.mutate(m.key)}
                  disabled={aiMut.isPending}
                >
                  <Sparkles className="size-3.5 mr-1.5" />
                  {m.label}
                </Button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">Every response is routed through the central AI Router and uses the active Brand Kit automatically.</p>
            {campaign.ai_strategy && (
              <div className="space-y-3 mt-2">
                {Object.entries(campaign.ai_strategy as Record<string, any>).map(([mode, entry]) => (
                  <Card key={mode} className="p-3 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide">{mode.replace(/_/g, " ")}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {entry?.generated_at ? new Date(entry.generated_at).toLocaleString() : ""}
                      </span>
                    </div>
                    <pre className="mt-2 text-[11px] whitespace-pre-wrap break-words max-h-72 overflow-auto">
                      {JSON.stringify(entry?.payload ?? entry, null, 2)}
                    </pre>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Reports */}
        <TabsContent value="reports">
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {REPORT_TYPES.map((r) => (
                <Button key={r.key} size="sm" variant="outline" onClick={() => reportMut.mutate(r.key)} disabled={reportMut.isPending}>
                  <FileBarChart className="size-3.5 mr-1.5" />
                  {r.label}
                </Button>
              ))}
            </div>
            <div className="space-y-2">
              {reports.length === 0 && <p className="text-xs text-muted-foreground">No reports yet.</p>}
              {reports.map((r: any) => (
                <Card key={r.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium capitalize">{r.title}</div>
                      <div className="text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                    </div>
                    <Badge variant="muted">{r.report_type}</Badge>
                  </div>
                  {r.summary && <p className="text-xs mt-2 text-muted-foreground">{r.summary}</p>}
                  {r.ai_insights && (
                    <pre className="mt-2 text-[11px] whitespace-pre-wrap break-words max-h-52 overflow-auto">
                      {JSON.stringify(r.ai_insights, null, 2)}
                    </pre>
                  )}
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-2.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold mt-0.5">{value}</div>
    </Card>
  );
}

function TasksBoard({
  tasks,
  campaignId,
  onSave,
  onDelete,
}: {
  tasks: any[];
  campaignId: string;
  onSave: (v: any) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [stage, setStage] = useState("planning");
  const cols = ["todo", "in_progress", "review", "done"];
  return (
    <div className="space-y-3">
      <Card className="p-3 flex items-center gap-2 flex-wrap">
        <Input placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 min-w-[220px]" />
        <Select value={stage} onValueChange={setStage}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMELINE_STAGES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => {
            if (!title) return;
            onSave({ campaign_id: campaignId, title, stage });
            setTitle("");
          }}
        >
          <Plus className="size-4 mr-1.5" /> Add
        </Button>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {cols.map((col) => (
          <Card key={col} className="p-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground p-1.5 capitalize">
              {col.replace(/_/g, " ")}
            </div>
            <div className="space-y-1.5">
              {tasks.filter((t) => t.status === col).map((t) => (
                <div key={t.id} className="p-2 rounded border bg-background">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xs font-medium flex-1">{t.title}</div>
                    <button onClick={() => onDelete(t.id)} className="text-muted-foreground hover:text-danger">
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {t.stage && <Badge size="sm" variant="muted">{t.stage}</Badge>}
                    <Select
                      value={t.status}
                      onValueChange={(v) => onSave({ id: t.id, campaign_id: campaignId, title: t.title, status: v as any })}
                    >
                      <SelectTrigger className="h-6 text-[10px] w-[110px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["todo", "in_progress", "blocked", "review", "done"].map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AssetsPanel({
  assets,
  campaignId,
  onAdd,
  onDelete,
}: {
  assets: any[];
  campaignId: string;
  onAdd: (v: any) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("post");
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState("");

  const types = ["post", "image", "video", "blog", "email", "landing_page", "form", "document", "certificate", "creative"];
  return (
    <div className="space-y-3">
      <Card className="p-3 grid grid-cols-1 md:grid-cols-5 gap-2">
        <Input placeholder="Asset title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Select value={type} onValueChange={setType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {types.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input placeholder="Platform (optional)" value={platform} onChange={(e) => setPlatform(e.target.value)} />
        <Input placeholder="URL (optional)" value={url} onChange={(e) => setUrl(e.target.value)} />
        <Button
          onClick={() => {
            if (!title) return;
            onAdd({
              campaign_id: campaignId,
              title,
              asset_type: type,
              platform: platform || null,
              url: url || null,
              status: "draft",
            });
            setTitle("");
            setUrl("");
            setPlatform("");
          }}
        >
          <Plus className="size-4 mr-1.5" /> Add asset
        </Button>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {assets.map((a) => (
          <Card key={a.id} className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{a.title}</div>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <Badge size="sm" variant="muted">{a.asset_type}</Badge>
                  {a.platform && <Badge size="sm" variant="outline">{a.platform}</Badge>}
                  <Badge size="sm" variant={a.status === "published" ? "success" : "muted"}>{a.status}</Badge>
                </div>
                {a.url && (
                  <a href={a.url} target="_blank" rel="noreferrer" className="text-[11px] text-primary hover:underline mt-1 block truncate">
                    {a.url}
                  </a>
                )}
              </div>
              <button onClick={() => onDelete(a.id)} className="text-muted-foreground hover:text-danger">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </Card>
        ))}
        {assets.length === 0 && <p className="text-xs text-muted-foreground p-2">No assets linked yet.</p>}
      </div>
    </div>
  );
}
