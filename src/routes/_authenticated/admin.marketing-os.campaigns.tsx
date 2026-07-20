import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listCampaigns,
  getCampaignDashboard,
  saveCampaign,
  duplicateCampaign,
  setCampaignStatus,
  createFromTemplate,
  getCampaignTemplates,
  listBrandsForCampaigns,
  type Campaign,
} from "@/lib/marketing-os/campaigns.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  Megaphone, Plus, Copy, Archive, Pause, Play, TrendingUp, Users, IndianRupee, Target, Rocket,
  Search, Sparkles, MoreHorizontal, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Filter,
  Calendar as CalendarIcon, ListChecks, Activity, Wand2, GripVertical, ArrowUpRight, ArrowDownRight,
  CheckCircle2, Clock, X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/marketing-os/campaigns")({
  component: CampaignsLayout,
});

function CampaignsLayout() {
  const loc = useLocation();
  const isDetail = /\/admin\/marketing-os\/campaigns\/[^/]+/.test(loc.pathname);
  return isDetail ? <Outlet /> : <CampaignManager />;
}


const CAMPAIGN_TYPES = [
  "Admissions",
  "Course Launch",
  "Workshop",
  "Webinar",
  "Brand Awareness",
  "Lead Generation",
  "Sales",
  "Hiring",
  "Referral",
  "Festival",
  "SEO",
  "Email",
  "Social Media",
  "Product Launch",
  "Custom",
];

const CAMPAIGN_GOALS = [
  "Lead Generation",
  "Admissions",
  "Revenue",
  "Brand Awareness",
  "Traffic",
  "Followers",
  "Email Subscribers",
  "Community Growth",
  "App Downloads",
  "Customer Retention",
];

const PLATFORMS = [
  "Instagram",
  "Facebook",
  "LinkedIn",
  "X",
  "Threads",
  "Pinterest",
  "YouTube",
  "TikTok",
  "Blog",
  "Email",
  "Landing Pages",
];

const STATUSES: Array<{ key: string; label: string; variant: any }> = [
  { key: "draft", label: "Draft", variant: "muted" },
  { key: "planning", label: "Planning", variant: "info" },
  { key: "ready", label: "Ready", variant: "outline" },
  { key: "active", label: "Active", variant: "success" },
  { key: "paused", label: "Paused", variant: "warning" },
  { key: "completed", label: "Completed", variant: "primary" },
  { key: "archived", label: "Archived", variant: "muted" },
];

function formatMoney(cents: number | null | undefined) {
  const n = Number(cents ?? 0) / 100;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

const PIPELINE_COLUMNS: Array<{ key: string; label: string; tone: string }> = [
  { key: "planning", label: "Planning", tone: "from-slate-500/10 to-transparent border-slate-500/20" },
  { key: "ready", label: "Ready", tone: "from-blue-500/10 to-transparent border-blue-500/20" },
  { key: "active", label: "Running", tone: "from-emerald-500/10 to-transparent border-emerald-500/20" },
  { key: "paused", label: "Paused", tone: "from-amber-500/10 to-transparent border-amber-500/20" },
  { key: "completed", label: "Completed", tone: "from-violet-500/10 to-transparent border-violet-500/20" },
  { key: "archived", label: "Archived", tone: "from-zinc-500/10 to-transparent border-zinc-500/20" },
];

type SortKey = "name" | "status" | "budget" | "roi" | "leads" | "starts_at" | "ends_at";

function computeRoi(c: Campaign) {
  const rev = Number(c.actual_revenue_cents ?? 0);
  const bud = Number(c.budget_cents ?? 0);
  if (!bud) return 0;
  return ((rev - bud) / bud) * 100;
}

function CampaignManager() {
  const qc = useQueryClient();
  const dashboardFn = useServerFn(getCampaignDashboard);
  const listFn = useServerFn(listCampaigns);
  const brandsFn = useServerFn(listBrandsForCampaigns);
  const templatesFn = useServerFn(getCampaignTemplates);
  const saveFn = useServerFn(saveCampaign);
  const dupFn = useServerFn(duplicateCampaign);
  const statusFn = useServerFn(setCampaignStatus);
  const templateFn = useServerFn(createFromTemplate);

  const dashboard = useQuery({ queryKey: ["mkt-campaigns-dashboard"], queryFn: () => dashboardFn() });
  const campaigns = useQuery({ queryKey: ["mkt-campaigns"], queryFn: () => listFn() });
  const brands = useQuery({ queryKey: ["mkt-brands-for-campaigns"], queryFn: () => brandsFn() });
  const templates = useQuery({ queryKey: ["mkt-campaign-templates"], queryFn: () => templatesFn() });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortKey>("starts_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [drawer, setDrawer] = useState<Campaign | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  const all = campaigns.data?.campaigns ?? [];

  const filtered = useMemo(() => {
    return all.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (typeFilter !== "all" && c.campaign_type !== typeFilter) return false;
      if (search && !`${c.name} ${c.campaign_type ?? ""} ${c.objective ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [all, search, statusFilter, typeFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let av: any; let bv: any;
      switch (sortBy) {
        case "name": av = a.name.toLowerCase(); bv = b.name.toLowerCase(); break;
        case "status": av = a.status; bv = b.status; break;
        case "budget": av = a.budget_cents ?? 0; bv = b.budget_cents ?? 0; break;
        case "roi": av = computeRoi(a); bv = computeRoi(b); break;
        case "leads": av = a.actual_leads ?? 0; bv = b.actual_leads ?? 0; break;
        case "starts_at": av = a.starts_at ?? ""; bv = b.starts_at ?? ""; break;
        case "ends_at": av = a.ends_at ?? ""; bv = b.ends_at ?? ""; break;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  const pipeline = useMemo(() => {
    const map: Record<string, Campaign[]> = {};
    PIPELINE_COLUMNS.forEach((c) => (map[c.key] = []));
    all.forEach((c) => {
      if (map[c.status]) map[c.status].push(c);
    });
    return map;
  }, [all]);

  const saveMut = useMutation({
    mutationFn: async (payload: any) => saveFn({ data: payload }),
    onSuccess: () => {
      toast.success("Campaign created");
      setWizardOpen(false);
      qc.invalidateQueries({ queryKey: ["mkt-campaigns"] });
      qc.invalidateQueries({ queryKey: ["mkt-campaigns-dashboard"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to save campaign"),
  });

  const dupMut = useMutation({
    mutationFn: async (id: string) => dupFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Campaign duplicated");
      qc.invalidateQueries({ queryKey: ["mkt-campaigns"] });
    },
  });

  const statusMut = useMutation({
    mutationFn: async (v: { id: string; status: any }) => statusFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mkt-campaigns"] });
      qc.invalidateQueries({ queryKey: ["mkt-campaigns-dashboard"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to update status"),
  });

  const templateMut = useMutation({
    mutationFn: async (v: { brand_id: string; template_key: string; name: string }) => templateFn({ data: v }),
    onSuccess: () => {
      toast.success("Campaign created from template");
      setTemplateOpen(false);
      qc.invalidateQueries({ queryKey: ["mkt-campaigns"] });
      qc.invalidateQueries({ queryKey: ["mkt-campaigns-dashboard"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const t = dashboard.data?.totals;
  const c = dashboard.data?.counts;

  const uniqueTypes = useMemo(() => {
    const s = new Set<string>();
    all.forEach((x) => x.campaign_type && s.add(x.campaign_type));
    return Array.from(s).sort();
  }, [all]);

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (paged.every((r) => selected.has(r.id))) {
      const next = new Set(selected);
      paged.forEach((r) => next.delete(r.id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      paged.forEach((r) => next.add(r.id));
      setSelected(next);
    }
  };

  const bulkStatus = async (status: string) => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    await Promise.all(ids.map((id) => statusMut.mutateAsync({ id, status })));
    setSelected(new Set());
    toast.success(`Updated ${ids.length} campaigns`);
  };

  const handleDrop = (colKey: string) => {
    if (!dragging) return;
    const src = all.find((x) => x.id === dragging);
    setDragging(null);
    setDragOver(null);
    if (!src || src.status === colKey) return;
    statusMut.mutate({ id: dragging, status: colKey });
  };

  const toggleSort = (k: SortKey) => {
    if (sortBy === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(k); setSortDir("desc"); }
  };

  const kpis = [
    { label: "Active Campaigns", value: (c?.active ?? 0).toLocaleString(), delta: 12, icon: Rocket, accent: "text-emerald-500" },
    { label: "Revenue", value: formatMoney(t?.revenueCents), delta: 8, icon: IndianRupee, accent: "text-primary" },
    { label: "Leads", value: (t?.leads ?? 0).toLocaleString(), delta: 5, icon: Users, accent: "text-sky-500" },
    { label: "ROI", value: `${(t?.roi ?? 0).toFixed(0)}%`, delta: -3, icon: TrendingUp, accent: "text-violet-500" },
    { label: "Upcoming Campaigns", value: (c?.upcoming ?? 0).toLocaleString(), delta: 15, icon: CalendarIcon, accent: "text-amber-500" },
  ];

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-primary">Marketing OS · Campaigns</div>
          <h1 className="text-[26px] font-semibold tracking-tight flex items-center gap-2.5 mt-1">
            <span className="inline-flex size-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Megaphone className="size-5" />
            </span>
            Campaign Manager
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Plan, launch, monitor and analyze every campaign across brands, channels and teams — the enterprise command center.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-xl">
                <Sparkles className="size-4 mr-1.5" /> From Template
              </Button>
            </DialogTrigger>
            <TemplateDialog templates={templates.data?.templates ?? []} brands={brands.data?.brands ?? []} onCreate={(v) => templateMut.mutate(v)} />
          </Dialog>
          <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl shadow-sm">
                <Plus className="size-4 mr-1.5" /> New Campaign
              </Button>
            </DialogTrigger>
            <CampaignWizard brands={brands.data?.brands ?? []} onSave={(v) => saveMut.mutate(v)} />
          </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4 rounded-2xl border border-border/60 hover:border-border transition-all hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 duration-300">
            <div className="flex items-center justify-between">
              <div className={cn("inline-flex size-8 items-center justify-center rounded-xl bg-muted/60", k.accent)}>
                <k.icon className="size-4" />
              </div>
              <span className={cn(
                "inline-flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded-md",
                k.delta >= 0 ? "text-emerald-600 bg-emerald-500/10" : "text-red-600 bg-red-500/10",
              )}>
                {k.delta >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                {Math.abs(k.delta)}%
              </span>
            </div>
            <div className="mt-3">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{k.label}</div>
              <div className="text-2xl font-semibold tracking-tight mt-0.5">{k.value}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pipeline + Right rail */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-4">
        {/* Kanban */}
        <Card className="p-4 rounded-2xl border-border/60">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2"><ListChecks className="size-4 text-primary" /> Campaign Pipeline</h3>
              <p className="text-xs text-muted-foreground">Drag campaigns between stages to update status</p>
            </div>
            <Badge variant="outline" className="text-[10px]">{all.length} total</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {PIPELINE_COLUMNS.map((col) => {
              const items = pipeline[col.key] ?? [];
              const isOver = dragOver === col.key;
              return (
                <div
                  key={col.key}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(col.key); }}
                  onDragLeave={() => setDragOver((v) => (v === col.key ? null : v))}
                  onDrop={() => handleDrop(col.key)}
                  className={cn(
                    "rounded-xl border bg-gradient-to-b p-2.5 min-h-[280px] transition-all duration-200",
                    col.tone,
                    isOver && "ring-2 ring-primary/60 scale-[1.01]",
                  )}
                >
                  <div className="flex items-center justify-between px-1 pb-2">
                    <div className="text-[11px] font-semibold uppercase tracking-wider">{col.label}</div>
                    <span className="text-[10px] text-muted-foreground bg-background/60 rounded-md px-1.5 py-0.5">{items.length}</span>
                  </div>
                  <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-0.5">
                    {items.slice(0, 20).map((camp) => (
                      <div
                        key={camp.id}
                        draggable
                        onDragStart={() => setDragging(camp.id)}
                        onDragEnd={() => { setDragging(null); setDragOver(null); }}
                        onClick={() => setDrawer(camp)}
                        className={cn(
                          "group bg-background/95 backdrop-blur rounded-lg border border-border/60 p-2.5 cursor-grab active:cursor-grabbing hover:border-primary/40 hover:shadow-sm transition-all",
                          dragging === camp.id && "opacity-40",
                        )}
                      >
                        <div className="flex items-start gap-1.5">
                          <GripVertical className="size-3 text-muted-foreground/50 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium truncate">{camp.name}</div>
                            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
                              {camp.campaign_type && <span className="truncate">{camp.campaign_type}</span>}
                            </div>
                            <div className="flex items-center justify-between mt-1.5">
                              <span className="text-[10px] font-medium text-muted-foreground">{formatMoney(camp.budget_cents)}</span>
                              {camp.priority && camp.priority !== "medium" && (
                                <span className={cn(
                                  "size-1.5 rounded-full",
                                  camp.priority === "critical" ? "bg-red-500" : camp.priority === "high" ? "bg-amber-500" : "bg-slate-400",
                                )} />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {items.length === 0 && (
                      <div className="text-[11px] text-muted-foreground/70 text-center py-6 italic">No campaigns</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Right rail */}
        <div className="space-y-3">
          <MiniCalendar campaigns={all} onSelect={(c) => setDrawer(c)} />
          <UpcomingTasks campaigns={all} />
          <AIRecommendations />
          <RecentActivity campaigns={all} />
        </div>
      </div>

      {/* Table */}
      <Card className="rounded-2xl border-border/60 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap p-3 border-b border-border/60 bg-muted/20">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="size-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input placeholder="Search campaigns, objectives, types..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 rounded-lg" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] h-9 rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px] h-9 rounded-lg"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {uniqueTypes.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-9 rounded-lg"><Filter className="size-3.5 mr-1.5" />More filters</Button>
          <div className="ml-auto text-xs text-muted-foreground">
            {sorted.length} campaigns
          </div>
        </div>

        {/* Bulk bar */}
        {selected.size > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border-b border-border/60 animate-fade-in">
            <span className="text-xs font-medium">{selected.size} selected</span>
            <div className="h-4 w-px bg-border" />
            <Button size="sm" variant="ghost" className="h-7" onClick={() => bulkStatus("active")}><Play className="size-3 mr-1" />Activate</Button>
            <Button size="sm" variant="ghost" className="h-7" onClick={() => bulkStatus("paused")}><Pause className="size-3 mr-1" />Pause</Button>
            <Button size="sm" variant="ghost" className="h-7" onClick={() => bulkStatus("archived")}><Archive className="size-3 mr-1" />Archive</Button>
            <Button size="sm" variant="ghost" className="h-7 ml-auto" onClick={() => setSelected(new Set())}><X className="size-3 mr-1" />Clear</Button>
          </div>
        )}

        {/* Sticky-header table */}
        <div className="overflow-x-auto max-h-[620px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/60">
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="p-3 text-left w-8">
                  <Checkbox checked={paged.length > 0 && paged.every((r) => selected.has(r.id))} onCheckedChange={toggleAll} />
                </th>
                <SortableTh label="Campaign" k="name" sortBy={sortBy} dir={sortDir} onSort={toggleSort} className="min-w-[280px]" />
                <SortableTh label="Status" k="status" sortBy={sortBy} dir={sortDir} onSort={toggleSort} />
                <SortableTh label="Budget" k="budget" sortBy={sortBy} dir={sortDir} onSort={toggleSort} align="right" />
                <SortableTh label="ROI" k="roi" sortBy={sortBy} dir={sortDir} onSort={toggleSort} align="right" />
                <SortableTh label="Leads" k="leads" sortBy={sortBy} dir={sortDir} onSort={toggleSort} align="right" />
                <th className="p-3 text-left font-medium">Owner</th>
                <th className="p-3 text-left font-medium">Platforms</th>
                <SortableTh label="Start" k="starts_at" sortBy={sortBy} dir={sortDir} onSort={toggleSort} />
                <SortableTh label="End" k="ends_at" sortBy={sortBy} dir={sortDir} onSort={toggleSort} />
                <th className="p-3 text-right w-14">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.isLoading && (
                <tr><td colSpan={11} className="p-10 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {!campaigns.isLoading && paged.length === 0 && (
                <tr><td colSpan={11}>
                  <div className="p-14 text-center">
                    <Megaphone className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm font-medium">No campaigns match</p>
                    <p className="text-xs text-muted-foreground mt-1">Try clearing filters or start a new campaign.</p>
                  </div>
                </td></tr>
              )}
              {paged.map((row) => {
                const roi = computeRoi(row);
                const statusMeta = STATUSES.find((s) => s.key === row.status);
                return (
                  <tr key={row.id} onClick={() => setDrawer(row)} className="border-b border-border/40 hover:bg-muted/40 cursor-pointer transition-colors">
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selected.has(row.id)} onCheckedChange={() => toggleRow(row.id)} />
                    </td>
                    <td className="p-3">
                      <div className="font-medium truncate max-w-[280px]">{row.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-[280px]">
                        {row.campaign_type ?? "—"} · {row.objective ?? "No objective"}
                      </div>
                    </td>
                    <td className="p-3">
                      {statusMeta && <Badge variant={statusMeta.variant} className="text-[10px]">{statusMeta.label}</Badge>}
                    </td>
                    <td className="p-3 text-right font-medium tabular-nums">{formatMoney(row.budget_cents)}</td>
                    <td className={cn("p-3 text-right font-medium tabular-nums", roi > 0 ? "text-emerald-600" : roi < 0 ? "text-red-500" : "")}>
                      {roi ? `${roi.toFixed(0)}%` : "—"}
                    </td>
                    <td className="p-3 text-right tabular-nums">{row.actual_leads ?? 0}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <div className="size-6 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center text-[10px] font-semibold">
                          {row.business_unit?.[0]?.toUpperCase() ?? "G"}
                        </div>
                        <span className="text-xs truncate max-w-[100px]">{row.business_unit ?? "Team"}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex -space-x-1">
                        {(row.target_platforms ?? []).slice(0, 3).map((p, i) => (
                          <span key={p} className="size-5 rounded-full bg-muted border border-background flex items-center justify-center text-[9px] font-medium" style={{ zIndex: 10 - i }}>
                            {p[0]}
                          </span>
                        ))}
                        {(row.target_platforms ?? []).length > 3 && (
                          <span className="size-5 rounded-full bg-muted border border-background flex items-center justify-center text-[9px] font-medium text-muted-foreground">
                            +{row.target_platforms.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{row.starts_at ? new Date(row.starts_at).toLocaleDateString() : "—"}</td>
                    <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{row.ends_at ? new Date(row.ends_at).toLocaleDateString() : "—"}</td>
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="size-7 p-0"><MoreHorizontal className="size-3.5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to="/admin/marketing-os/campaigns/$id" params={{ id: row.id }}>Open details</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDrawer(row)}>Quick view</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {row.status === "active" ? (
                            <DropdownMenuItem onClick={() => statusMut.mutate({ id: row.id, status: "paused" })}><Pause className="size-3.5 mr-2" />Pause</DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => statusMut.mutate({ id: row.id, status: "active" })}><Play className="size-3.5 mr-2" />Activate</DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => dupMut.mutate(row.id)}><Copy className="size-3.5 mr-2" />Duplicate</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => statusMut.mutate({ id: row.id, status: "archived" })}><Archive className="size-3.5 mr-2" />Archive</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-3 border-t border-border/60 bg-muted/20">
          <div className="text-xs text-muted-foreground">
            Page {page} of {totalPages} · showing {paged.length} of {sorted.length}
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Floating FAB */}
      <button
        onClick={() => setWizardOpen(true)}
        className="fixed bottom-6 right-6 z-40 size-14 rounded-full bg-primary text-primary-foreground shadow-[0_10px_30px_-8px_rgba(0,0,0,0.35)] hover:scale-105 hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.4)] active:scale-95 transition-all duration-200 flex items-center justify-center group"
        aria-label="Create campaign"
      >
        <Plus className="size-6 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Slide-panel drawer */}
      <Sheet open={!!drawer} onOpenChange={(v) => !v && setDrawer(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
          {drawer && <CampaignDrawer campaign={drawer} onClose={() => setDrawer(null)} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SortableTh({ label, k, sortBy, dir, onSort, align = "left", className }: { label: string; k: SortKey; sortBy: SortKey; dir: "asc" | "desc"; onSort: (k: SortKey) => void; align?: "left" | "right"; className?: string }) {
  const active = sortBy === k;
  return (
    <th className={cn("p-3 font-medium select-none", align === "right" ? "text-right" : "text-left", className)}>
      <button onClick={() => onSort(k)} className={cn("inline-flex items-center gap-1 hover:text-foreground transition-colors", active && "text-foreground")}>
        {label}
        {active ? (dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ArrowUp className="size-3 opacity-0" />}
      </button>
    </th>
  );
}

function MiniCalendar({ campaigns, onSelect }: { campaigns: Campaign[]; onSelect: (c: Campaign) => void }) {
  const today = new Date();
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const startDay = first.getDay();
  const cells: Array<{ day: number | null; campaigns: Campaign[] }> = [];
  for (let i = 0; i < startDay; i++) cells.push({ day: null, campaigns: [] });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = new Date(month.getFullYear(), month.getMonth(), d).toISOString().slice(0, 10);
    const dayCampaigns = campaigns.filter((c) => c.starts_at?.slice(0, 10) === dateStr);
    cells.push({ day: d, campaigns: dayCampaigns });
  }
  const monthLabel = month.toLocaleString(undefined, { month: "long", year: "numeric" });

  return (
    <Card className="p-4 rounded-2xl border-border/60">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2"><CalendarIcon className="size-4 text-primary" /> Calendar</h3>
        <div className="flex items-center gap-1">
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="size-6 rounded-md hover:bg-muted flex items-center justify-center"><ChevronLeft className="size-3.5" /></button>
          <span className="text-xs font-medium w-24 text-center">{monthLabel}</span>
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="size-6 rounded-md hover:bg-muted flex items-center justify-center"><ChevronRight className="size-3.5" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] text-muted-foreground mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((cell, i) => {
          const isToday = cell.day && cell.day === today.getDate() && month.getMonth() === today.getMonth() && month.getFullYear() === today.getFullYear();
          const has = cell.campaigns.length > 0;
          return (
            <button
              key={i}
              disabled={!cell.day}
              onClick={() => cell.campaigns[0] && onSelect(cell.campaigns[0])}
              className={cn(
                "aspect-square text-[10px] rounded-md flex flex-col items-center justify-center relative transition-colors",
                cell.day && "hover:bg-muted",
                isToday && "bg-primary/10 text-primary font-semibold",
                has && !isToday && "bg-muted/60",
              )}
            >
              {cell.day && <span>{cell.day}</span>}
              {has && <span className="absolute bottom-0.5 size-1 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function UpcomingTasks({ campaigns }: { campaigns: Campaign[] }) {
  const upcoming = campaigns
    .filter((c) => c.starts_at && new Date(c.starts_at) > new Date())
    .sort((a, b) => new Date(a.starts_at!).getTime() - new Date(b.starts_at!).getTime())
    .slice(0, 4);
  return (
    <Card className="p-4 rounded-2xl border-border/60">
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-3"><Clock className="size-4 text-amber-500" /> Upcoming</h3>
      <div className="space-y-2">
        {upcoming.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">No upcoming launches</p>
        ) : upcoming.map((c) => (
          <div key={c.id} className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-amber-500/10 flex flex-col items-center justify-center text-amber-600 shrink-0">
              <span className="text-[8px] uppercase leading-none">{new Date(c.starts_at!).toLocaleString(undefined, { month: "short" })}</span>
              <span className="text-xs font-bold leading-none mt-0.5">{new Date(c.starts_at!).getDate()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium truncate">{c.name}</div>
              <div className="text-[10px] text-muted-foreground">{c.campaign_type ?? "Campaign"}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AIRecommendations() {
  const tips = [
    { icon: Wand2, tone: "text-violet-500 bg-violet-500/10", title: "Optimize spend", body: "Shift 12% of budget from paused campaigns to active workshops for better ROI." },
    { icon: Sparkles, tone: "text-primary bg-primary/10", title: "Launch window", body: "Best time to send admissions emails is Tuesday 10am based on last quarter data." },
    { icon: Rocket, tone: "text-emerald-500 bg-emerald-500/10", title: "Duplicate winner", body: "AI Bootcamp 2027 is your top ROI campaign — consider a follow-up cohort." },
  ];
  return (
    <Card className="p-4 rounded-2xl border-border/60 bg-gradient-to-br from-primary/5 to-transparent">
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-3"><Sparkles className="size-4 text-primary" /> AI Recommendations</h3>
      <div className="space-y-2.5">
        {tips.map((t) => (
          <div key={t.title} className="flex items-start gap-2.5">
            <div className={cn("size-7 rounded-lg flex items-center justify-center shrink-0", t.tone)}>
              <t.icon className="size-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium">{t.title}</div>
              <p className="text-[11px] text-muted-foreground leading-snug">{t.body}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RecentActivity({ campaigns }: { campaigns: Campaign[] }) {
  const recent = [...campaigns].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 4);
  return (
    <Card className="p-4 rounded-2xl border-border/60">
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-3"><Activity className="size-4 text-sky-500" /> Recent Activity</h3>
      <div className="space-y-2.5">
        {recent.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">No recent activity</p>
        ) : recent.map((c) => (
          <div key={c.id} className="flex items-start gap-2.5">
            <div className="size-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold shrink-0">
              {c.name[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs">
                <span className="font-medium">{c.name}</span>
                <span className="text-muted-foreground"> · {c.status}</span>
              </div>
              <div className="text-[10px] text-muted-foreground">{new Date(c.updated_at).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CampaignDrawer({ campaign, onClose }: { campaign: Campaign; onClose: () => void }) {
  const statusMeta = STATUSES.find((s) => s.key === campaign.status);
  const roi = computeRoi(campaign);
  return (
    <div>
      <SheetHeader className="p-6 pb-4 border-b border-border/60 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              {statusMeta && <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>}
              {campaign.campaign_type && <Badge variant="outline">{campaign.campaign_type}</Badge>}
              {campaign.priority && campaign.priority !== "medium" && (
                <Badge variant={campaign.priority === "critical" ? "danger" : campaign.priority === "high" ? "warning" : "muted"}>{campaign.priority}</Badge>
              )}
            </div>
            <SheetTitle className="text-xl font-semibold tracking-tight">{campaign.name}</SheetTitle>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{campaign.objective ?? campaign.description ?? "No objective set"}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} className="shrink-0"><X className="size-4" /></Button>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-4">
          <DrawerStat label="Budget" value={formatMoney(campaign.budget_cents)} />
          <DrawerStat label="Revenue" value={formatMoney(campaign.actual_revenue_cents)} />
          <DrawerStat label="ROI" value={roi ? `${roi.toFixed(0)}%` : "—"} tone={roi > 0 ? "text-emerald-600" : roi < 0 ? "text-red-500" : ""} />
          <DrawerStat label="Leads" value={String(campaign.actual_leads ?? 0)} />
        </div>
      </SheetHeader>

      <Tabs defaultValue="overview" className="p-6">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Description</div>
            <p className="text-sm">{campaign.description ?? "No description provided."}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InfoBlock label="Business unit" value={campaign.business_unit ?? "—"} />
            <InfoBlock label="Timeline stage" value={campaign.timeline_stage} />
            <InfoBlock label="Start date" value={campaign.starts_at ? new Date(campaign.starts_at).toLocaleDateString() : "—"} />
            <InfoBlock label="End date" value={campaign.ends_at ? new Date(campaign.ends_at).toLocaleDateString() : "—"} />
          </div>
          {(campaign.goals ?? []).length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Goals</div>
              <div className="flex flex-wrap gap-1.5">
                {campaign.goals.map((g) => <Badge key={g} variant="outline">{g}</Badge>)}
              </div>
            </div>
          )}
          {(campaign.target_platforms ?? []).length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Platforms</div>
              <div className="flex flex-wrap gap-1.5">
                {campaign.target_platforms.map((p) => <Badge key={p} variant="muted">{p}</Badge>)}
              </div>
            </div>
          )}
          <div className="pt-2 flex items-center gap-2">
            <Button asChild className="rounded-lg">
              <Link to="/admin/marketing-os/campaigns/$id" params={{ id: campaign.id }}>Open full workspace</Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="content" className="mt-4">
          <EmptyPane icon={CheckCircle2} title="Content workspace" body="Manage posts, blogs, emails and creatives attached to this campaign." />
        </TabsContent>
        <TabsContent value="calendar" className="mt-4">
          <EmptyPane icon={CalendarIcon} title="Campaign calendar" body="View scheduled content and milestones for this campaign." />
        </TabsContent>
        <TabsContent value="assets" className="mt-4">
          <EmptyPane icon={Sparkles} title="Assets" body="Creatives, briefs, and reference materials attached to this campaign." />
        </TabsContent>
        <TabsContent value="analytics" className="mt-4">
          <EmptyPane icon={TrendingUp} title="Analytics" body="Reach, engagement, leads, revenue and ROI attribution." />
        </TabsContent>
        <TabsContent value="automation" className="mt-4">
          <EmptyPane icon={Wand2} title="Automation" body="Workflows and triggers running for this campaign." />
        </TabsContent>
        <TabsContent value="settings" className="mt-4">
          <EmptyPane icon={ListChecks} title="Settings" body="Approvals, permissions, owners, and integrations." />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DrawerStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="p-2.5 rounded-xl bg-background/70 border border-border/60">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("text-sm font-semibold tabular-nums mt-0.5", tone)}>{value}</div>
    </div>
  );
}
function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm mt-0.5">{value}</div>
    </div>
  );
}
function EmptyPane({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <div className="text-center py-10 rounded-xl bg-muted/30 border border-dashed border-border/60">
      <Icon className="size-6 text-muted-foreground/60 mx-auto mb-2" />
      <div className="text-sm font-medium">{title}</div>
      <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">{body}</p>
    </div>
  );
}


function CampaignWizard({ brands, onSave }: { brands: any[]; onSave: (v: any) => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<any>({
    name: "",
    brand_id: brands[0]?.id ?? "",
    campaign_type: "Admissions",
    objective: "",
    description: "",
    goals: [] as string[],
    priority: "medium",
    business_unit: "",
    timeline_stage: "planning",
    target_platforms: [] as string[],
    target_audience: { segments: [] as string[], countries: [] as string[], age: "", experience: "", languages: [] as string[] },
    budget_cents: 0,
    expected_revenue_cents: 0,
    expected_leads: 0,
    status: "draft",
    starts_at: "",
    ends_at: "",
  });

  const toggle = (key: string, val: string) => {
    setForm((f: any) => {
      const arr = new Set<string>(f[key] ?? []);
      if (arr.has(val)) arr.delete(val);
      else arr.add(val);
      return { ...f, [key]: Array.from(arr) };
    });
  };

  const submit = () => {
    if (!form.name || !form.brand_id) {
      toast.error("Name and brand are required");
      return;
    }
    onSave({
      ...form,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
      budget_cents: Number(form.budget_cents) || null,
      expected_revenue_cents: Number(form.expected_revenue_cents) || null,
      expected_leads: Number(form.expected_leads) || null,
    });
  };

  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle>Create Campaign — Step {step} of 4</DialogTitle>
      </DialogHeader>

      {step === 1 && (
        <div className="space-y-3">
          <div>
            <Label>Campaign name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Admissions 2027" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Brand *</Label>
              <Select value={form.brand_id} onValueChange={(v) => setForm({ ...form, brand_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Campaign type</Label>
              <Select value={form.campaign_type} onValueChange={(v) => setForm({ ...form, campaign_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Objective</Label>
            <Input
              value={form.objective}
              onChange={(e) => setForm({ ...form, objective: e.target.value })}
              placeholder="Fill 200 seats for AI Bootcamp cohort 6"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Business unit</Label>
              <Input value={form.business_unit} onChange={(e) => setForm({ ...form, business_unit: e.target.value })} placeholder="Admissions" />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <div>
            <Label>Campaign goals</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {CAMPAIGN_GOALS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggle("goals", g)}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full border transition-colors",
                    form.goals.includes(g) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent",
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Target platforms</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => toggle("target_platforms", p)}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full border transition-colors",
                    form.target_platforms.includes(p) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Timeline stage</Label>
            <Select value={form.timeline_stage} onValueChange={(v) => setForm({ ...form, timeline_stage: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["planning", "preparation", "launch", "promotion", "closing", "analysis", "archive"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Target audience descriptors (all optional — used by AI Assistant).</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Segments</Label>
              <Input
                placeholder="Students, Working Professionals"
                onChange={(e) =>
                  setForm({ ...form, target_audience: { ...form.target_audience, segments: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) } })
                }
              />
            </div>
            <div>
              <Label>Countries</Label>
              <Input
                placeholder="India, UAE"
                onChange={(e) =>
                  setForm({ ...form, target_audience: { ...form.target_audience, countries: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) } })
                }
              />
            </div>
            <div>
              <Label>Age</Label>
              <Input placeholder="21-35" onChange={(e) => setForm({ ...form, target_audience: { ...form.target_audience, age: e.target.value } })} />
            </div>
            <div>
              <Label>Experience</Label>
              <Input
                placeholder="0-4 years"
                onChange={(e) => setForm({ ...form, target_audience: { ...form.target_audience, experience: e.target.value } })}
              />
            </div>
            <div className="col-span-2">
              <Label>Languages</Label>
              <Input
                placeholder="English, Hindi, Telugu"
                onChange={(e) =>
                  setForm({ ...form, target_audience: { ...form.target_audience, languages: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) } })
                }
              />
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start date</Label>
              <Input type="date" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
            </div>
            <div>
              <Label>End date</Label>
              <Input type="date" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Budget (₹)</Label>
              <Input
                type="number"
                value={form.budget_cents / 100 || ""}
                onChange={(e) => setForm({ ...form, budget_cents: Number(e.target.value) * 100 })}
              />
            </div>
            <div>
              <Label>Expected revenue (₹)</Label>
              <Input
                type="number"
                value={form.expected_revenue_cents / 100 || ""}
                onChange={(e) => setForm({ ...form, expected_revenue_cents: Number(e.target.value) * 100 })}
              />
            </div>
            <div>
              <Label>Expected leads</Label>
              <Input type="number" value={form.expected_leads || ""} onChange={(e) => setForm({ ...form, expected_leads: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <Label>Initial status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.filter((s) => s.key !== "archived").map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <DialogFooter className="flex items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">Every activity in Glintr flows through a campaign.</div>
        <div className="flex items-center gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)}>Next</Button>
          ) : (
            <Button onClick={submit}>Create Campaign</Button>
          )}
        </div>
      </DialogFooter>
    </DialogContent>
  );
}

function TemplateDialog({ templates, brands, onCreate }: { templates: any[]; brands: any[]; onCreate: (v: any) => void }) {
  const [brandId, setBrandId] = useState(brands[0]?.id ?? "");
  const [name, setName] = useState("");
  const [templateKey, setTemplateKey] = useState<string>("");
  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Start from a template</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-2 max-h-80 overflow-auto">
        {templates.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTemplateKey(t.key)}
            className={cn(
              "text-left p-3 rounded-lg border transition-colors",
              templateKey === t.key ? "border-primary bg-primary/5" : "border-border hover:bg-accent",
            )}
          >
            <div className="font-medium text-sm">{t.name}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{t.objective}</div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {(t.target_platforms ?? []).slice(0, 4).map((p: string) => (
                <Badge key={p} variant="muted" size="sm">
                  {p}
                </Badge>
              ))}
            </div>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Brand</Label>
          <Select value={brandId} onValueChange={setBrandId}>
            <SelectTrigger>
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Campaign name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        </div>
      </div>
      <DialogFooter>
        <Button
          disabled={!brandId || !name || !templateKey}
          onClick={() => onCreate({ brand_id: brandId, name, template_key: templateKey })}
        >
          Create from template
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
