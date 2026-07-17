/**
 * AI Lead Intelligence Dashboard — Super Admin.
 *
 * Displays every lead automatically scored (0-100) by the Glintr AI scoring
 * microservice, with priority-sorted table, KPIs, filters, timeline drawer,
 * and configurable scoring rules.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Flame, Loader2, RefreshCw, Search, Sparkles, Settings2, TrendingUp } from "lucide-react";

import {
  listLeadIntelligence,
  getLeadIntelligenceStats,
  getLeadProfile,
  recomputeAllLeadScores,
  recomputeLeadScore,
  updateLeadIntelligence,
  getScoringConfig,
  updateScoringConfig,
  type LeadIntelligenceRow,
} from "@/lib/lead-intelligence/service.functions";
import { DEFAULT_WEIGHTS, DEFAULT_THRESHOLDS } from "@/lib/lead-intelligence/scoring";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin/lead-intelligence")({
  component: LeadIntelligencePage,
  head: () => ({
    meta: [
      { title: "AI Lead Intelligence · Glintr Admin" },
      {
        name: "description",
        content:
          "Enterprise AI Lead Scoring — every lead automatically scored, ranked and matched to the best next action.",
      },
    ],
  }),
});

type CategoryFilter = "all" | "hot" | "warm" | "nurture" | "cold";

function categoryTone(cat: string) {
  switch (cat) {
    case "hot":
      return "bg-rose-500/20 text-rose-200 border-rose-500/40";
    case "warm":
      return "bg-amber-500/20 text-amber-200 border-amber-500/40";
    case "nurture":
      return "bg-sky-500/20 text-sky-200 border-sky-500/40";
    default:
      return "bg-muted text-muted-foreground border-border/60";
  }
}

function categoryLabel(cat: string) {
  switch (cat) {
    case "hot":
      return "🔥 Hot";
    case "warm":
      return "🟠 Warm";
    case "nurture":
      return "🔵 Nurture";
    case "cold":
      return "⚪ Cold";
    default:
      return cat;
  }
}

function scoreColor(score: number) {
  if (score >= 90) return "text-rose-400";
  if (score >= 70) return "text-amber-300";
  if (score >= 40) return "text-sky-300";
  return "text-muted-foreground";
}

function LeadIntelligencePage() {
  const [category, setCategory] = React.useState<CategoryFilter>("all");
  const [search, setSearch] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [configOpen, setConfigOpen] = React.useState(false);

  const listFn = useServerFn(listLeadIntelligence);
  const statsFn = useServerFn(getLeadIntelligenceStats);
  const recomputeAll = useServerFn(recomputeAllLeadScores);

  const qc = useQueryClient();

  const leadsQuery = useQuery({
    queryKey: ["lead-intel", "list", category, search],
    queryFn: () => listFn({ data: { category, search: search || undefined, limit: 200 } }),
  });

  const statsQuery = useQuery({
    queryKey: ["lead-intel", "stats"],
    queryFn: () => statsFn(),
  });

  const bulkRecompute = useMutation({
    mutationFn: () => recomputeAll(),
    onSuccess: (res) => {
      toast.success(`AI re-scored ${res.updated} leads`);
      qc.invalidateQueries({ queryKey: ["lead-intel"] });
    },
    onError: () => toast.error("Failed to recompute scores"),
  });

  const stats = statsQuery.data;
  const leads = leadsQuery.data ?? [];

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary/80">
            <Sparkles className="h-4 w-4" /> AI Lead Intelligence
          </div>
          <h1 className="text-3xl font-semibold mt-1">Every lead, automatically scored</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            GlintrAI reads every page view, download, chat and consultation to score leads 0–100
            and surface the highest-priority conversations first.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => bulkRecompute.mutate()}
            disabled={bulkRecompute.isPending}
          >
            {bulkRecompute.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Re-score all
          </Button>
          <Button variant="outline" size="sm" onClick={() => setConfigOpen(true)}>
            <Settings2 className="h-4 w-4 mr-2" />
            AI Settings
          </Button>
        </div>
      </header>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard label="Total Leads" value={stats?.total ?? 0} />
        <KpiCard label="Today" value={stats?.today ?? 0} accent="text-primary" />
        <KpiCard label="🔥 Hot" value={stats?.hot ?? 0} accent="text-rose-400" />
        <KpiCard label="🟠 Warm" value={stats?.warm ?? 0} accent="text-amber-300" />
        <KpiCard label="🔵 Nurture" value={stats?.nurture ?? 0} accent="text-sky-300" />
        <KpiCard label="⚪ Cold" value={stats?.cold ?? 0} />
        <KpiCard label="Converted" value={stats?.converted ?? 0} accent="text-emerald-400" />
        <KpiCard label="Lost" value={stats?.lost ?? 0} />
        <KpiCard
          label="Avg Score"
          value={stats?.averageScore ?? 0}
          suffix="/100"
          accent="text-primary"
        />
        <KpiCard
          label="AI Conversion Prediction"
          value={stats?.predictedConversion ?? 0}
          suffix="%"
          accent="text-emerald-400"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      {/* Filters */}
      <Card className="p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search name, email, phone, course…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={(v) => setCategory(v as CategoryFilter)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="hot">🔥 Hot</SelectItem>
            <SelectItem value="warm">🟠 Warm</SelectItem>
            <SelectItem value="nurture">🔵 Nurture</SelectItem>
            <SelectItem value="cold">⚪ Cold</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Score</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Interest</TableHead>
                <TableHead>AI Summary</TableHead>
                <TableHead>Next Action</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leadsQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center">
                    <Loader2 className="h-5 w-5 animate-spin inline" />
                  </TableCell>
                </TableRow>
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    No leads match these filters yet.
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((l: LeadIntelligenceRow) => (
                  <TableRow
                    key={l.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => setSelectedId(l.id)}
                  >
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <span className={`text-2xl font-bold tabular-nums ${scoreColor(l.score)}`}>
                          {l.score}
                        </span>
                        <Badge variant="outline" className={categoryTone(l.score_category)}>
                          {categoryLabel(l.score_category)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[180px]">
                      <div className="font-medium">{l.name || "—"}</div>
                      <div className="text-xs text-muted-foreground truncate">{l.phone || l.email || "—"}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {l.interested_course || l.predicted_course || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs max-w-[320px]">
                      <span className="line-clamp-2 text-muted-foreground">
                        {l.ai_summary || "Awaiting first activity…"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="secondary" className="whitespace-nowrap">
                        <Flame className="h-3 w-3 mr-1 text-primary" />
                        {l.ai_next_action || "Assess"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="capitalize">{l.source}</span>
                      {l.utm_source && (
                        <div className="text-[10px] text-muted-foreground">{l.utm_source}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs capitalize">{l.status}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {l.last_activity_at
                        ? new Date(l.last_activity_at).toLocaleString()
                        : new Date(l.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <LeadProfileDrawer
        leadId={selectedId}
        onClose={() => setSelectedId(null)}
        onChanged={() => qc.invalidateQueries({ queryKey: ["lead-intel"] })}
      />

      <ScoringConfigDialog open={configOpen} onOpenChange={setConfigOpen} />
    </div>
  );
}

function KpiCard({
  label,
  value,
  suffix,
  accent,
  icon,
}: {
  label: string;
  value: number;
  suffix?: string;
  accent?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wide">
        <span>{label}</span>
        {icon}
      </div>
      <div className={`text-2xl font-bold mt-2 ${accent ?? ""}`}>
        {value.toLocaleString()}
        {suffix && <span className="text-sm font-normal text-muted-foreground ml-1">{suffix}</span>}
      </div>
    </Card>
  );
}

function LeadProfileDrawer({
  leadId,
  onClose,
  onChanged,
}: {
  leadId: string | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const profileFn = useServerFn(getLeadProfile);
  const recomputeFn = useServerFn(recomputeLeadScore);
  const updateFn = useServerFn(updateLeadIntelligence);

  const { data, isLoading, refetch } = useQuery({
    enabled: Boolean(leadId),
    queryKey: ["lead-intel", "profile", leadId],
    queryFn: () => profileFn({ data: { leadId: leadId! } }),
  });

  const recompute = useMutation({
    mutationFn: () => recomputeFn({ data: { leadId: leadId! } }),
    onSuccess: () => {
      toast.success("Score refreshed by AI");
      refetch();
      onChanged();
    },
  });

  const [notes, setNotes] = React.useState("");
  const [status, setStatus] = React.useState("new");
  const lead = data ? (JSON.parse(data.lead_json) as Record<string, unknown>) : null;

  React.useEffect(() => {
    if (lead) {
      setNotes((lead.notes as string) ?? "");
      setStatus((lead.status as string) ?? "new");
    }
  }, [lead]);

  const save = useMutation({
    mutationFn: () =>
      updateFn({ data: { leadId: leadId!, status, notes } }),
    onSuccess: () => {
      toast.success("Lead updated");
      onChanged();
    },
  });

  return (
    <Sheet open={Boolean(leadId)} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Lead Profile · AI Intelligence</SheetTitle>
        </SheetHeader>

        {isLoading || !lead ? (
          <div className="py-16 text-center">
            <Loader2 className="h-6 w-6 animate-spin inline" />
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            {/* Score panel */}
            <Card className="p-5 bg-gradient-to-br from-primary/10 to-transparent">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase text-muted-foreground">AI Score</div>
                  <div className={`text-5xl font-bold tabular-nums ${scoreColor(lead.score as number)}`}>
                    {lead.score as number}
                    <span className="text-lg text-muted-foreground">/100</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`mt-2 ${categoryTone(lead.score_category as string)}`}
                  >
                    {categoryLabel(lead.score_category as string)}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase text-muted-foreground">
                    Conversion probability
                  </div>
                  <div className="text-2xl font-semibold text-emerald-400">
                    {Number(lead.probability ?? 0)}%
                  </div>
                  <Progress value={Number(lead.probability ?? 0)} className="mt-2 w-32" />
                </div>
              </div>
              <p className="text-sm mt-4 leading-relaxed">
                {(lead.ai_summary as string) || "Not enough behaviour yet to summarize."}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Badge className="bg-primary/20 text-primary border-primary/40">
                  Next: {(lead.ai_next_action as string) || "Assess"}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => recompute.mutate()}
                  disabled={recompute.isPending}
                >
                  {recompute.isPending ? (
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-2" />
                  )}
                  Ask AI to re-score
                </Button>
              </div>
            </Card>

            <Tabs defaultValue="timeline">
              <TabsList>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="manage">Manage</TabsTrigger>
              </TabsList>

              <TabsContent value="timeline" className="mt-4 space-y-2">
                {data!.events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity logged yet.</p>
                ) : (
                  data!.events.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-start gap-3 p-3 rounded-lg border border-border/60"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">
                            {e.event_type.replace(/_/g, " ")}
                          </span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(e.created_at).toLocaleString()}
                          </span>
                        </div>
                        {e.page_path && (
                          <div className="text-xs text-muted-foreground truncate">{e.page_path}</div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="details" className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Detail label="Name" value={(lead.name as string) || "—"} />
                <Detail label="Email" value={(lead.email as string) || "—"} />
                <Detail label="Phone" value={(lead.phone as string) || "—"} />
                <Detail label="Interest" value={(lead.interested_course as string) || "—"} />
                <Detail label="Career interest" value={(lead.career_interest as string) || "—"} />
                <Detail label="Budget" value={(lead.budget_range as string) || "—"} />
                <Detail label="Timing" value={(lead.preferred_timing as string) || "—"} />
                <Detail label="Source" value={(lead.source as string) || "—"} />
                <Detail label="UTM source" value={(lead.utm_source as string) || "—"} />
                <Detail label="UTM campaign" value={(lead.utm_campaign as string) || "—"} />
                <Detail label="Device" value={(lead.device as string) || "—"} />
                <Detail label="Country" value={(lead.country as string) || "—"} />
                <Detail label="Visits" value={String(lead.visit_count ?? 0)} />
                <Detail label="Events" value={String(lead.event_count ?? 0)} />
              </TabsContent>

              <TabsContent value="manage" className="mt-4 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs uppercase text-muted-foreground">Status</label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase text-muted-foreground">Counsellor notes</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={5}
                    placeholder="Log counsellor observations, next steps, objections…"
                  />
                </div>
                <Button onClick={() => save.mutate()} disabled={save.isPending}>
                  {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 p-2.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm mt-0.5">{value}</div>
    </div>
  );
}

function ScoringConfigDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const getFn = useServerFn(getScoringConfig);
  const updateFn = useServerFn(updateScoringConfig);
  const qc = useQueryClient();
  const { data } = useQuery({
    enabled: open,
    queryKey: ["lead-intel", "config"],
    queryFn: () => getFn(),
  });

  const [weights, setWeights] = React.useState<Record<string, number>>(DEFAULT_WEIGHTS);
  const [thresholds, setThresholds] = React.useState(DEFAULT_THRESHOLDS);

  React.useEffect(() => {
    if (data) {
      setWeights({ ...DEFAULT_WEIGHTS, ...(data.weights ?? {}) });
      setThresholds({ ...DEFAULT_THRESHOLDS, ...(data.thresholds ?? {}) });
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () => updateFn({ data: { weights, thresholds } }),
    onSuccess: () => {
      toast.success("Scoring rules updated");
      qc.invalidateQueries({ queryKey: ["lead-intel"] });
      onOpenChange(false);
    },
    onError: () => toast.error("Failed to save"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Scoring Rules</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          <div className="grid grid-cols-3 gap-3">
            {(["hot", "warm", "nurture"] as const).map((k) => (
              <div key={k}>
                <label className="text-xs uppercase text-muted-foreground">{k} threshold</label>
                <Input
                  type="number"
                  value={thresholds[k]}
                  onChange={(e) =>
                    setThresholds((t) => ({ ...t, [k]: Number(e.target.value) }))
                  }
                />
              </div>
            ))}
          </div>
          <div>
            <div className="text-xs uppercase text-muted-foreground mb-2">Signal weights</div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(weights).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="text-xs flex-1 truncate">{k.replace(/_/g, " ")}</span>
                  <Input
                    type="number"
                    className="w-20"
                    value={v}
                    onChange={(e) =>
                      setWeights((w) => ({ ...w, [k]: Number(e.target.value) }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save rules
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
