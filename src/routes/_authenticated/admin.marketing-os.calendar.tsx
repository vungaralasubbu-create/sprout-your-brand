import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState, useCallback } from "react";
import {
  listPublishingJobs, bulkReschedule, bulkCancelJobs, bulkRetry, bulkDeleteJobs,
  publishJobNow, duplicateJob, listHolidays,
} from "@/lib/marketing-os/publisher.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ChevronLeft, ChevronRight, Search, Filter, Sparkles, Play, Pause, Copy,
  Trash2, RefreshCw, CalendarClock, Sun, Flame, AlertTriangle, ListChecks,
  Clock, XCircle, CheckCircle2, LayoutGrid, Rows, CalendarDays, Calendar as CalIcon,
  CalendarRange, Kanban as KanbanIcon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/admin/marketing-os/calendar")({
  component: CalendarWorkspace,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
type Job = {
  id: string; content_id: string | null; campaign: string | null; platform: string;
  account_id: string | null; account_label: string | null; scheduled_at: string;
  status: string; retry_count: number; priority: number; platform_url: string | null;
  error_message: string | null; timezone: string; payload: Any;
};

/* ----------- Platform color coding (spec-mandated) ----------- */
const PLATFORM_META: Record<string, { label: string; icon: string; bg: string; ring: string; text: string }> = {
  instagram: { label: "Instagram", icon: "📸", bg: "bg-purple-500", ring: "ring-purple-400", text: "text-purple-700" },
  facebook: { label: "Facebook", icon: "📘", bg: "bg-blue-500", ring: "ring-blue-400", text: "text-blue-700" },
  linkedin: { label: "LinkedIn", icon: "💼", bg: "bg-blue-900", ring: "ring-blue-700", text: "text-blue-900" },
  x: { label: "X", icon: "𝕏", bg: "bg-black", ring: "ring-neutral-700", text: "text-neutral-900" },
  threads: { label: "Threads", icon: "🧵", bg: "bg-neutral-500", ring: "ring-neutral-400", text: "text-neutral-700" },
  blog: { label: "Blog", icon: "📝", bg: "bg-emerald-500", ring: "ring-emerald-400", text: "text-emerald-700" },
  pinterest: { label: "Pinterest", icon: "📌", bg: "bg-red-600", ring: "ring-red-400", text: "text-red-700" },
  youtube: { label: "YouTube", icon: "▶️", bg: "bg-rose-700", ring: "ring-rose-500", text: "text-rose-800" },
  tiktok: { label: "TikTok", icon: "🎵", bg: "bg-cyan-500", ring: "ring-cyan-400", text: "text-cyan-700" },
  gbp: { label: "Google Business", icon: "🏢", bg: "bg-amber-500", ring: "ring-amber-400", text: "text-amber-700" },
};
const pm = (p: string) => PLATFORM_META[p] ?? { label: p, icon: "•", bg: "bg-slate-400", ring: "ring-slate-300", text: "text-slate-700" };

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-slate-200 text-slate-700",
  approved: "bg-indigo-100 text-indigo-700",
  queued: "bg-sky-100 text-sky-700",
  publishing: "bg-primary/15 text-primary animate-pulse",
  published: "bg-emerald-100 text-emerald-700",
  failed: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
  retrying: "bg-amber-100 text-amber-700",
};

type ViewKey = "day" | "week" | "month" | "quarter" | "year" | "timeline" | "agenda" | "kanban";

/* ============================================================== */
function CalendarWorkspace() {
  const listFn = useServerFn(listPublishingJobs);
  const reFn = useServerFn(bulkReschedule);
  const cancelFn = useServerFn(bulkCancelJobs);
  const retryFn = useServerFn(bulkRetry);
  const delFn = useServerFn(bulkDeleteJobs);
  const nowFn = useServerFn(publishJobNow);
  const dupFn = useServerFn(duplicateJob);
  const holFn = useServerFn(listHolidays);
  const qc = useQueryClient();

  const [view, setView] = useState<ViewKey>("month");
  const [anchor, setAnchor] = useState(() => new Date());
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [campaignFilter, setCampaignFilter] = useState<Set<string>>(new Set());
  const [sidebarPreset, setSidebarPreset] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<Job | null>(null);
  const [showHolidays, setShowHolidays] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);

  const range = useMemo(() => computeRange(view, anchor), [view, anchor]);
  const { data, isLoading } = useQuery({
    queryKey: ["cal-jobs", range.start.toISOString(), range.end.toISOString()],
    queryFn: () => listFn({ data: { from: range.start.toISOString(), to: range.end.toISOString(), limit: 1000 } }),
    refetchInterval: 20_000,
  });
  const { data: holidayData } = useQuery({
    queryKey: ["cal-holidays", range.start.toISOString(), range.end.toISOString()],
    queryFn: () => holFn({ data: { from: range.start.toISOString(), to: range.end.toISOString() } }),
    enabled: showHolidays,
  });
  const holidays = (holidayData?.holidays ?? []) as Array<{ id: string; event_date: string; category: string; title: string }>;

  const allJobs = (data?.jobs ?? []) as Job[];

  const jobs = useMemo(() => filterJobs(allJobs, { search, platformFilter, statusFilter, campaignFilter, sidebarPreset }), [allJobs, search, platformFilter, statusFilter, campaignFilter, sidebarPreset]);
  const conflicts = useMemo(() => detectConflicts(jobs), [jobs]);
  const facets = useMemo(() => ({
    campaigns: uniq(allJobs.map((j) => j.campaign).filter(Boolean) as string[]),
    platforms: uniq(allJobs.map((j) => j.platform)),
  }), [allJobs]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["cal-jobs"] });

  const onDropJob = useCallback(async (jobId: string, newDate: Date) => {
    const j = allJobs.find((x) => x.id === jobId);
    if (!j) return;
    const old = new Date(j.scheduled_at);
    const merged = new Date(newDate); merged.setHours(old.getHours(), old.getMinutes(), 0, 0);
    await reFn({ data: { ids: [jobId], scheduled_at: merged.toISOString() } });
    toast.success("Rescheduled");
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allJobs]);

  const bulkIds = Array.from(selected);
  const toggleSel = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[240px_1fr] gap-4">
      <Sidebar
        allJobs={allJobs} preset={sidebarPreset} onPreset={setSidebarPreset}
        showHolidays={showHolidays} setShowHolidays={setShowHolidays}
        showHeatmap={showHeatmap} setShowHeatmap={setShowHeatmap}
      />

      <div className="space-y-3">
        <TopBar
          view={view} setView={setView} anchor={anchor} setAnchor={setAnchor} range={range}
          search={search} setSearch={setSearch}
          facets={facets}
          platformFilter={platformFilter} setPlatformFilter={setPlatformFilter}
          statusFilter={statusFilter} setStatusFilter={setStatusFilter}
          campaignFilter={campaignFilter} setCampaignFilter={setCampaignFilter}
        />

        {conflicts.length > 0 && (
          <Card className="p-2 flex items-start gap-2 border-amber-400/60 bg-amber-50">
            <AlertTriangle className="size-4 text-amber-700 mt-0.5" />
            <div className="text-xs">
              <div className="font-medium text-amber-900">{conflicts.length} scheduling conflict{conflicts.length !== 1 ? "s" : ""} detected</div>
              <div className="text-amber-800 mt-0.5">{conflicts.slice(0, 3).map((c) => c.reason).join(" · ")}{conflicts.length > 3 && ` …+${conflicts.length - 3} more`}</div>
            </div>
          </Card>
        )}

        {selected.size > 0 && (
          <BulkBar
            count={selected.size}
            onApprove={async () => { await retryFn({ data: { ids: bulkIds } }); setSelected(new Set()); invalidate(); toast.success("Requeued"); }}
            onReschedule={async () => {
              const iso = window.prompt("New scheduled datetime (ISO or YYYY-MM-DDTHH:mm)", new Date(Date.now() + 3600_000).toISOString().slice(0,16));
              if (!iso) return;
              await reFn({ data: { ids: bulkIds, scheduled_at: new Date(iso).toISOString() } });
              setSelected(new Set()); invalidate(); toast.success("Rescheduled");
            }}
            onDuplicate={async () => { for (const id of bulkIds) await dupFn({ data: { id } }); setSelected(new Set()); invalidate(); toast.success("Duplicated"); }}
            onCancel={async () => { await cancelFn({ data: { ids: bulkIds } }); setSelected(new Set()); invalidate(); toast.success("Cancelled"); }}
            onDelete={async () => { if (!confirm(`Delete ${bulkIds.length} jobs?`)) return; await delFn({ data: { ids: bulkIds } }); setSelected(new Set()); invalidate(); }}
            onPublishNow={async () => { for (const id of bulkIds) await nowFn({ data: { id } }); setSelected(new Set()); invalidate(); toast.success("Publishing"); }}
            onClear={() => setSelected(new Set())}
          />
        )}

        <div className="min-h-[60vh]">
          {isLoading ? (
            <Card className="p-16 text-center text-sm text-muted-foreground">Loading calendar…</Card>
          ) : (
            <RenderView
              view={view} range={range} jobs={jobs} holidays={showHolidays ? holidays : []}
              showHeatmap={showHeatmap} conflicts={conflicts}
              selected={selected} toggleSel={toggleSel}
              onOpen={setDetail} onDropJob={onDropJob}
            />
          )}
        </div>

        <AiRecommendations jobs={allJobs} />
      </div>

      <JobDetailDialog
        job={detail} onClose={() => setDetail(null)}
        onPublishNow={async (id) => { await nowFn({ data: { id } }); invalidate(); setDetail(null); toast.success("Publishing"); }}
        onCancel={async (id) => { await cancelFn({ data: { ids: [id] } }); invalidate(); setDetail(null); }}
        onDelete={async (id) => { await delFn({ data: { ids: [id] } }); invalidate(); setDetail(null); }}
        onDuplicate={async (id) => { await dupFn({ data: { id } }); invalidate(); setDetail(null); toast.success("Duplicated"); }}
        onReschedule={async (id, when) => { await reFn({ data: { ids: [id], scheduled_at: when } }); invalidate(); setDetail(null); toast.success("Rescheduled"); }}
      />
    </div>
  );
}

/* ============================================================== */
function Sidebar(props: {
  allJobs: Job[]; preset: string; onPreset: (v: string) => void;
  showHolidays: boolean; setShowHolidays: (v: boolean) => void;
  showHeatmap: boolean; setShowHeatmap: (v: boolean) => void;
}) {
  const c = useMemo(() => countPresets(props.allJobs), [props.allJobs]);
  const item = (key: string, label: string, count: number, Icon: Any, tone = "text-foreground") => (
    <button
      onClick={() => props.onPreset(key)}
      className={cn(
        "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-left",
        props.preset === key ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted",
      )}
    >
      <span className="flex items-center gap-2"><Icon className={cn("size-3.5", tone)} />{label}</span>
      <span className="text-[10px] font-mono text-muted-foreground">{count}</span>
    </button>
  );
  return (
    <aside className="space-y-4">
      <Card className="p-2 space-y-1">
        {item("all", "All", c.all, ListChecks)}
        {item("today", "Today", c.today, Sun, "text-primary")}
        {item("tomorrow", "Tomorrow", c.tomorrow, CalendarClock)}
        {item("week", "This Week", c.week, CalendarRange)}
        {item("overdue", "Overdue", c.overdue, AlertTriangle, "text-amber-600")}
        {item("drafts", "Drafts", c.drafts, Rows)}
        {item("pending", "Pending Review", c.pending, Clock, "text-indigo-600")}
        {item("publishing_today", "Publishing Today", c.publishingToday, Play, "text-primary")}
        {item("failed", "Failed", c.failed, XCircle, "text-destructive")}
      </Card>
      <Card className="p-3 space-y-2">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Overlays</div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox checked={props.showHolidays} onCheckedChange={(v) => props.setShowHolidays(!!v)} />
          Holidays & awareness
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox checked={props.showHeatmap} onCheckedChange={(v) => props.setShowHeatmap(!!v)} />
          Density heatmap
        </label>
      </Card>
      <Card className="p-3 space-y-1.5">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Platforms</div>
        {Object.entries(PLATFORM_META).map(([k, m]) => (
          <div key={k} className="flex items-center gap-2 text-xs">
            <span className={cn("size-2.5 rounded-full", m.bg)} />
            <span>{m.icon} {m.label}</span>
          </div>
        ))}
      </Card>
    </aside>
  );
}

/* ============================================================== */
function TopBar({
  view, setView, anchor, setAnchor, range, search, setSearch,
  facets, platformFilter, setPlatformFilter, statusFilter, setStatusFilter, campaignFilter, setCampaignFilter,
}: Any) {
  const [openFilters, setOpenFilters] = useState(false);
  const shift = (dir: 1 | -1) => {
    const d = new Date(anchor);
    if (view === "day") d.setDate(d.getDate() + dir);
    else if (view === "week" || view === "timeline" || view === "agenda" || view === "kanban") d.setDate(d.getDate() + 7 * dir);
    else if (view === "month") d.setMonth(d.getMonth() + dir);
    else if (view === "quarter") d.setMonth(d.getMonth() + 3 * dir);
    else if (view === "year") d.setFullYear(d.getFullYear() + dir);
    setAnchor(d);
  };
  const views: Array<{ key: ViewKey; label: string; icon: Any }> = [
    { key: "day", label: "Day", icon: Sun },
    { key: "week", label: "Week", icon: CalendarRange },
    { key: "month", label: "Month", icon: CalendarDays },
    { key: "quarter", label: "Quarter", icon: CalIcon },
    { key: "year", label: "Year", icon: CalIcon },
    { key: "timeline", label: "Timeline", icon: Rows },
    { key: "agenda", label: "Agenda", icon: ListChecks },
    { key: "kanban", label: "Kanban", icon: KanbanIcon },
  ];
  const rangeLabel = formatRangeLabel(view, anchor, range);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" onClick={() => shift(-1)}><ChevronLeft className="size-4" /></Button>
          <Button size="sm" variant="outline" onClick={() => setAnchor(new Date())}>Today</Button>
          <Button size="sm" variant="outline" onClick={() => shift(1)}><ChevronRight className="size-4" /></Button>
        </div>
        <div className="text-sm font-semibold tracking-tight">{rangeLabel}</div>
        <div className="flex-1" />
        <div className="relative">
          <Search className="size-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, hashtag, campaign…" className="pl-8 h-9 w-64" />
        </div>
        <Button size="sm" variant={openFilters ? "primary" : "outline"} onClick={() => setOpenFilters((o) => !o)}>
          <Filter className="size-4 mr-1" /> Filters
        </Button>
      </div>

      <div className="flex flex-wrap gap-1 border rounded-md p-1 w-fit bg-muted/40">
        {views.map((v) => (
          <button key={v.key} onClick={() => setView(v.key)}
            className={cn("text-xs px-2.5 py-1 rounded flex items-center gap-1", view === v.key ? "bg-background shadow font-medium" : "text-muted-foreground hover:text-foreground")}>
            <v.icon className="size-3.5" />{v.label}
          </button>
        ))}
      </div>

      {openFilters && (
        <Card className="p-3 grid md:grid-cols-3 gap-3 text-xs">
          <FilterGroup label="Platform" values={facets.platforms} selected={platformFilter} setSelected={setPlatformFilter} renderLabel={(p) => `${pm(p).icon} ${pm(p).label}`} />
          <FilterGroup label="Status" values={["draft","approved","queued","publishing","published","failed","retrying","cancelled"]} selected={statusFilter} setSelected={setStatusFilter} renderLabel={(s) => s} />
          <FilterGroup label="Campaign" values={facets.campaigns} selected={campaignFilter} setSelected={setCampaignFilter} renderLabel={(c) => c} />
        </Card>
      )}
    </div>
  );
}

function FilterGroup({ label, values, selected, setSelected, renderLabel }: Any) {
  const toggle = (v: string) => setSelected((s: Set<string>) => { const n = new Set(s); n.has(v) ? n.delete(v) : n.add(v); return n; });
  return (
    <div>
      <div className="font-mono uppercase tracking-widest text-[10px] text-muted-foreground mb-1">{label}</div>
      <div className="flex flex-wrap gap-1">
        {values.length === 0 && <span className="text-muted-foreground text-[11px]">—</span>}
        {values.map((v: string) => (
          <button key={v} onClick={() => toggle(v)}
            className={cn("px-2 py-0.5 rounded-full border text-[11px]", selected.has(v) ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted")}>
            {renderLabel(v)}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================================================== */
function BulkBar(props: Any) {
  return (
    <Card className="p-2 sticky top-2 z-10 border-primary/60 shadow-md flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium mr-1">{props.count} selected</span>
      <Button size="sm" variant="outline" onClick={props.onPublishNow}><Play className="size-3.5 mr-1" />Publish Now</Button>
      <Button size="sm" variant="outline" onClick={props.onReschedule}><CalendarClock className="size-3.5 mr-1" />Reschedule</Button>
      <Button size="sm" variant="outline" onClick={props.onDuplicate}><Copy className="size-3.5 mr-1" />Duplicate</Button>
      <Button size="sm" variant="outline" onClick={props.onApprove}><RefreshCw className="size-3.5 mr-1" />Retry</Button>
      <Button size="sm" variant="outline" onClick={props.onCancel}><Pause className="size-3.5 mr-1" />Cancel</Button>
      <Button size="sm" variant="danger" onClick={props.onDelete}><Trash2 className="size-3.5 mr-1" />Delete</Button>
      <Button size="sm" variant="ghost" onClick={props.onClear}>Clear</Button>
    </Card>
  );
}

/* ============================================================== */
function RenderView({ view, range, jobs, holidays, showHeatmap, conflicts, selected, toggleSel, onOpen, onDropJob }: Any) {
  if (view === "kanban") return <KanbanView jobs={jobs} onOpen={onOpen} selected={selected} toggleSel={toggleSel} conflicts={conflicts} />;
  if (view === "agenda") return <AgendaView jobs={jobs} onOpen={onOpen} selected={selected} toggleSel={toggleSel} conflicts={conflicts} />;
  if (view === "timeline") return <TimelineView range={range} jobs={jobs} onOpen={onOpen} conflicts={conflicts} onDropJob={onDropJob} />;
  if (view === "year") return <YearView anchor={range.anchor} jobs={jobs} />;
  if (view === "quarter") return <QuarterView anchor={range.anchor} jobs={jobs} onOpen={onOpen} onDropJob={onDropJob} />;
  if (view === "week" || view === "day") return <WeekView view={view} range={range} jobs={jobs} onOpen={onOpen} onDropJob={onDropJob} conflicts={conflicts} holidays={holidays} />;
  return <MonthView range={range} jobs={jobs} onOpen={onOpen} onDropJob={onDropJob} conflicts={conflicts} holidays={holidays} showHeatmap={showHeatmap} />;
}

/* ============================================================== */
function MonthView({ range, jobs, onOpen, onDropJob, conflicts, holidays, showHeatmap }: Any) {
  const anchor = range.anchor as Date;
  const cells = useMemo(() => {
    const start = new Date(anchor); start.setDate(1); start.setDate(1 - start.getDay()); start.setHours(0,0,0,0);
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, [anchor]);
  const perDay = groupByDay(jobs as Job[]);
  const holidayByDay = new Map<string, Any[]>();
  for (const h of holidays as Any[]) { const k = h.event_date.slice(0,10); const arr = holidayByDay.get(k) ?? []; arr.push(h); holidayByDay.set(k, arr); }
  const conflictIds = new Set<string>(conflicts.flatMap((c: Any) => c.ids));
  const maxCount = Math.max(1, ...Array.from(perDay.values()).map((v) => v.length));

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-7 text-[10px] font-mono uppercase tracking-widest text-muted-foreground bg-muted/40">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => <div key={d} className="p-2 text-center">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          const key = dayKey(d);
          const dayJobs = (perDay.get(key) ?? []) as Job[];
          const inMonth = d.getMonth() === anchor.getMonth();
          const isToday = dayKey(new Date()) === key;
          const heat = showHeatmap ? Math.min(1, dayJobs.length / maxCount) : 0;
          const hol = holidayByDay.get(key);
          return (
            <div
              key={i}
              onDragOver={(e) => { e.preventDefault(); (e.currentTarget as HTMLElement).classList.add("bg-primary/10"); }}
              onDragLeave={(e) => (e.currentTarget as HTMLElement).classList.remove("bg-primary/10")}
              onDrop={(e) => { e.preventDefault(); (e.currentTarget as HTMLElement).classList.remove("bg-primary/10"); const id = e.dataTransfer.getData("text/job"); if (id) onDropJob(id, d); }}
              className={cn("min-h-28 border-t border-l border-border/60 p-1 relative text-xs transition-colors",
                !inMonth && "bg-muted/30 text-muted-foreground",
                isToday && "ring-2 ring-primary/40 z-10")}
              style={heat > 0 ? { backgroundColor: `hsl(var(--primary) / ${heat * 0.15})` } : undefined}
            >
              <div className="flex items-center justify-between">
                <div className={cn("text-[11px]", isToday && "font-bold text-primary")}>{d.getDate()}</div>
                {dayJobs.length > 0 && <span className="text-[9px] font-mono px-1 rounded bg-primary/10 text-primary">{dayJobs.length}</span>}
              </div>
              {hol && hol.length > 0 && (
                <div className="text-[9px] text-amber-700 truncate" title={hol.map((x: Any) => x.title).join(", ")}>🎉 {hol[0].title}</div>
              )}
              <div className="mt-1 space-y-0.5">
                {dayJobs.slice(0, 3).map((j) => (
                  <MiniPill key={j.id} job={j} conflict={conflictIds.has(j.id)} onOpen={() => onOpen(j)} />
                ))}
                {dayJobs.length > 3 && <div className="text-[10px] text-muted-foreground">+{dayJobs.length - 3} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ============================================================== */
function WeekView({ view, range, jobs, onOpen, onDropJob, conflicts, holidays }: Any) {
  const start = range.start as Date;
  const days = view === "day" ? [start] : Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const perDay = groupByDay(jobs as Job[]);
  const conflictIds = new Set<string>(conflicts.flatMap((c: Any) => c.ids));
  const holidayByDay = new Map<string, Any[]>();
  for (const h of holidays as Any[]) { const k = h.event_date.slice(0,10); const arr = holidayByDay.get(k) ?? []; arr.push(h); holidayByDay.set(k, arr); }

  return (
    <Card className="overflow-hidden">
      <div className={cn("grid text-xs", view === "day" ? "grid-cols-[60px_1fr]" : "grid-cols-[60px_repeat(7,1fr)]")}>
        <div className="bg-muted/40 border-b" />
        {days.map((d) => {
          const isToday = dayKey(new Date()) === dayKey(d);
          const hol = holidayByDay.get(dayKey(d));
          return (
            <div key={d.toISOString()} className={cn("p-2 border-b border-l bg-muted/40 text-center", isToday && "text-primary font-semibold")}>
              <div>{d.toLocaleDateString(undefined, { weekday: "short" })}</div>
              <div className="text-[11px]">{d.getDate()}</div>
              {hol && <div className="text-[9px] text-amber-700 truncate">🎉 {hol[0].title}</div>}
            </div>
          );
        })}
        {hours.map((h) => (
          <>
            <div key={`hr-${h}`} className="border-t border-r px-1 py-1 text-[10px] text-muted-foreground text-right">{String(h).padStart(2,"0")}:00</div>
            {days.map((d) => {
              const slot = new Date(d); slot.setHours(h, 0, 0, 0);
              const slotEnd = new Date(slot); slotEnd.setHours(h + 1);
              const dayJobs = (perDay.get(dayKey(d)) ?? []) as Job[];
              const inSlot = dayJobs.filter((j) => { const t = new Date(j.scheduled_at); return t >= slot && t < slotEnd; });
              return (
                <div key={`${d.toISOString()}-${h}`}
                  onDragOver={(e) => { e.preventDefault(); }}
                  onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/job"); if (id) onDropJob(id, slot); }}
                  className="border-t border-l min-h-10 p-0.5 space-y-0.5">
                  {inSlot.map((j) => <MiniPill key={j.id} job={j} conflict={conflictIds.has(j.id)} onOpen={() => onOpen(j)} />)}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </Card>
  );
}

/* ============================================================== */
function QuarterView({ anchor, jobs, onOpen, onDropJob }: Any) {
  const qStart = new Date(anchor); qStart.setMonth(Math.floor(qStart.getMonth() / 3) * 3, 1); qStart.setHours(0,0,0,0);
  const months = [0,1,2].map((m) => { const d = new Date(qStart); d.setMonth(d.getMonth() + m); return d; });
  return (
    <div className="grid md:grid-cols-3 gap-3">
      {months.map((m) => <MonthMini key={m.toISOString()} anchor={m} jobs={jobs} onOpen={onOpen} onDropJob={onDropJob} />)}
    </div>
  );
}

function MonthMini({ anchor, jobs, onOpen, onDropJob }: Any) {
  const start = new Date(anchor); start.setDate(1); start.setDate(1 - start.getDay());
  const cells = Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  const perDay = groupByDay(jobs as Job[]);
  return (
    <Card className="overflow-hidden">
      <div className="p-2 text-xs font-semibold border-b bg-muted/40">{anchor.toLocaleString(undefined, { month: "long", year: "numeric" })}</div>
      <div className="grid grid-cols-7 text-[10px]">
        {cells.map((d, i) => {
          const dayJobs = (perDay.get(dayKey(d)) ?? []) as Job[];
          const inMonth = d.getMonth() === anchor.getMonth();
          return (
            <div key={i}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/job"); if (id) onDropJob(id, d); }}
              className={cn("border-t border-l p-1 min-h-14", !inMonth && "bg-muted/30 text-muted-foreground")}>
              <div>{d.getDate()}</div>
              <div className="flex flex-wrap gap-0.5 mt-0.5">
                {dayJobs.slice(0, 6).map((j) => (
                  <span key={j.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/job", j.id)}
                    onClick={() => onOpen(j)} title={j.payload?.title ?? ""} className={cn("size-2 rounded-full cursor-pointer", pm(j.platform).bg)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ============================================================== */
function YearView({ anchor, jobs }: Any) {
  const year = anchor.getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));
  const perDay = groupByDay(jobs as Job[]);
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {months.map((m) => {
        const start = new Date(m); start.setDate(1 - start.getDay());
        const cells = Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
        return (
          <Card key={m.toISOString()} className="overflow-hidden">
            <div className="p-2 text-xs font-semibold border-b bg-muted/40">{m.toLocaleString(undefined, { month: "long" })}</div>
            <div className="grid grid-cols-7">
              {cells.map((d, i) => {
                const n = (perDay.get(dayKey(d)) ?? []).length;
                const inMonth = d.getMonth() === m.getMonth();
                const heat = Math.min(1, n / 4);
                return <div key={i} className={cn("size-4 border-t border-l", !inMonth && "opacity-30")} style={n ? { backgroundColor: `hsl(var(--primary) / ${0.15 + heat * 0.6})` } : undefined} title={`${dayKey(d)}: ${n}`} />;
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ============================================================== */
function TimelineView({ range, jobs, onOpen, conflicts, onDropJob }: Any) {
  const start = range.start as Date;
  const end = range.end as Date;
  const totalMs = end.getTime() - start.getTime();
  const platforms = uniq((jobs as Job[]).map((j) => j.platform));
  const conflictIds = new Set<string>(conflicts.flatMap((c: Any) => c.ids));
  return (
    <Card className="p-3 space-y-2 overflow-auto">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {start.toLocaleDateString()} → {end.toLocaleDateString()}
      </div>
      {platforms.length === 0 && <div className="text-sm text-muted-foreground py-8 text-center">Nothing scheduled in range.</div>}
      {platforms.map((p) => {
        const rowJobs = (jobs as Job[]).filter((j) => j.platform === p);
        return (
          <div key={p} className="flex items-center gap-2">
            <div className="w-28 text-xs font-medium flex items-center gap-1">{pm(p).icon} {pm(p).label}</div>
            <div className="relative flex-1 h-8 bg-muted/40 rounded"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { const id = e.dataTransfer.getData("text/job"); if (!id) return; const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); const pct = (e.clientX - rect.left) / rect.width; const t = new Date(start.getTime() + pct * totalMs); onDropJob(id, t); }}>
              {rowJobs.map((j) => {
                const pos = ((new Date(j.scheduled_at).getTime() - start.getTime()) / totalMs) * 100;
                return (
                  <button key={j.id} onClick={() => onOpen(j)} draggable onDragStart={(e) => e.dataTransfer.setData("text/job", j.id)}
                    className={cn("absolute top-1 h-6 px-1.5 rounded text-white text-[10px] truncate shadow", pm(p).bg, conflictIds.has(j.id) && "ring-2 ring-amber-400")}
                    style={{ left: `${Math.max(0, Math.min(97, pos))}%`, maxWidth: "160px" }}>
                    {(j.payload?.title ?? "•").slice(0, 22)}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </Card>
  );
}

/* ============================================================== */
function AgendaView({ jobs, onOpen, selected, toggleSel, conflicts }: Any) {
  const grouped = groupByDay(jobs as Job[]);
  const keys = Array.from(grouped.keys()).sort();
  const conflictIds = new Set<string>(conflicts.flatMap((c: Any) => c.ids));
  return (
    <Card className="divide-y">
      {keys.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">No scheduled content in range.</div>}
      {keys.map((k) => {
        const items = grouped.get(k)!.sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
        const d = new Date(k);
        return (
          <div key={k}>
            <div className="px-3 py-2 bg-muted/40 text-xs font-semibold">{d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</div>
            <div className="divide-y">
              {items.map((j) => (
                <div key={j.id} className="p-2 flex items-start gap-2 hover:bg-muted/30">
                  <Checkbox checked={selected.has(j.id)} onCheckedChange={() => toggleSel(j.id)} />
                  <button onClick={() => onOpen(j)} className="flex-1 text-left">
                    <div className="flex items-center gap-2 text-xs">
                      <span className={cn("size-2 rounded-full", pm(j.platform).bg)} />
                      <span className="font-medium">{j.payload?.title ?? "(untitled)"}</span>
                      {conflictIds.has(j.id) && <span className="text-[10px] text-amber-700">⚠ conflict</span>}
                      <span className={cn("text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded", STATUS_BADGE[j.status] ?? "bg-muted")}>{j.status}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(j.scheduled_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} · {j.timezone} · {pm(j.platform).label}{j.campaign ? ` · ${j.campaign}` : ""}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </Card>
  );
}

/* ============================================================== */
function KanbanView({ jobs, onOpen, conflicts }: Any) {
  const cols = ["draft","approved","queued","publishing","published","failed"];
  const conflictIds = new Set<string>(conflicts.flatMap((c: Any) => c.ids));
  const grouped: Record<string, Job[]> = Object.fromEntries(cols.map((c) => [c, []]));
  for (const j of jobs as Job[]) if (grouped[j.status]) grouped[j.status].push(j);
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cols.map((c) => (
        <Card key={c} className="p-2 min-h-40">
          <div className="text-[10px] font-mono uppercase tracking-widest mb-2 flex items-center justify-between">
            <span className={cn("px-1.5 py-0.5 rounded", STATUS_BADGE[c] ?? "bg-muted")}>{c}</span>
            <span className="text-muted-foreground">{grouped[c].length}</span>
          </div>
          <div className="space-y-1">
            {grouped[c].map((j) => (
              <button key={j.id} onClick={() => onOpen(j)}
                className={cn("w-full text-left rounded border p-1.5 text-xs bg-background hover:shadow", conflictIds.has(j.id) && "ring-1 ring-amber-400")}>
                <div className="flex items-center gap-1">
                  <span className={cn("size-1.5 rounded-full", pm(j.platform).bg)} />
                  <span className="text-[10px] text-muted-foreground">{pm(j.platform).label}</span>
                </div>
                <div className="font-medium truncate">{j.payload?.title ?? "(untitled)"}</div>
                <div className="text-[10px] text-muted-foreground">{new Date(j.scheduled_at).toLocaleString()}</div>
              </button>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ============================================================== */
function MiniPill({ job, conflict, onOpen }: { job: Job; conflict: boolean; onOpen: () => void }) {
  const m = pm(job.platform);
  return (
    <button
      draggable onDragStart={(e) => { e.dataTransfer.setData("text/job", job.id); e.dataTransfer.effectAllowed = "move"; }}
      onClick={onOpen}
      className={cn("group w-full text-left rounded px-1 py-0.5 text-white text-[10px] leading-tight truncate flex items-center gap-1 shadow-sm cursor-grab active:cursor-grabbing",
        m.bg, conflict && "ring-2 ring-amber-300")}
      title={`${job.payload?.title ?? ""} · ${new Date(job.scheduled_at).toLocaleString()}`}
    >
      <span>{m.icon}</span>
      <span className="truncate flex-1">{(job.payload?.title ?? "(untitled)").slice(0, 26)}</span>
      <span className="text-[8px] opacity-75">{new Date(job.scheduled_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
    </button>
  );
}

/* ============================================================== */
function AiRecommendations({ jobs }: { jobs: Job[] }) {
  const rec = useMemo(() => computeRecommendations(jobs), [jobs]);
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="size-4 text-primary" />
        <div className="text-sm font-semibold">AI Recommendations</div>
      </div>
      <ul className="space-y-1.5 text-xs">
        {rec.map((r, i) => (
          <li key={i} className="flex items-start gap-2">
            <Flame className="size-3.5 text-primary mt-0.5" />
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ============================================================== */
function JobDetailDialog({ job, onClose, onPublishNow, onCancel, onDelete, onDuplicate, onReschedule }: Any) {
  const [when, setWhen] = useState("");
  if (!job) return null;
  const m = pm(job.platform);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle className="flex items-center gap-2">
          <span className={cn("size-3 rounded-full", m.bg)} />
          {job.payload?.title ?? "(untitled)"}
        </DialogTitle></DialogHeader>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <MetaRow label="Platform" value={`${m.icon} ${m.label}`} />
            <MetaRow label="Campaign" value={job.campaign ?? "—"} />
            <MetaRow label="Scheduled" value={`${new Date(job.scheduled_at).toLocaleString()} (${job.timezone})`} />
            <MetaRow label="Status" value={<span className={cn("text-[10px] font-mono uppercase px-1.5 py-0.5 rounded", STATUS_BADGE[job.status] ?? "bg-muted")}>{job.status}</span>} />
            <MetaRow label="Priority" value={job.priority} />
            <MetaRow label="Retries" value={`${job.retry_count}`} />
            {job.platform_url && <MetaRow label="Post URL" value={<a href={job.platform_url} target="_blank" rel="noreferrer" className="text-primary underline break-all">{job.platform_url}</a>} />}
            {job.error_message && <MetaRow label="Error" value={<span className="text-destructive text-xs">{job.error_message}</span>} />}
          </div>
          <div className="space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Body</div>
            <div className="border rounded p-2 text-xs whitespace-pre-wrap max-h-52 overflow-y-auto">{job.payload?.body ?? "—"}</div>
            {Array.isArray(job.payload?.hashtags) && job.payload.hashtags.length > 0 && (
              <div className="text-xs text-muted-foreground">{job.payload.hashtags.map((h: string) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}</div>
            )}
            {Array.isArray(job.payload?.media_urls) && job.payload.media_urls.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {job.payload.media_urls.slice(0, 4).map((u: string, i: number) => <img key={i} src={u} alt="" className="size-16 rounded object-cover border" />)}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
          <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="w-56" />
          <Button size="sm" variant="outline" disabled={!when} onClick={() => when && onReschedule(job.id, new Date(when).toISOString())}>
            <CalendarClock className="size-4 mr-1" /> Reschedule
          </Button>
          <Button size="sm" onClick={() => onPublishNow(job.id)}><Play className="size-4 mr-1" />Publish Now</Button>
          <Button size="sm" variant="outline" onClick={() => onDuplicate(job.id)}><Copy className="size-4 mr-1" />Duplicate</Button>
          <Button size="sm" variant="outline" onClick={() => onCancel(job.id)}><Pause className="size-4 mr-1" />Cancel</Button>
          <Button size="sm" variant="danger" onClick={() => { if (confirm("Delete this job?")) onDelete(job.id); }}><Trash2 className="size-4 mr-1" />Delete</Button>
          <div className="flex-1" />
          <div className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(job.scheduled_at), { addSuffix: true })}</div>
          <CheckCircle2 className="size-3.5 text-emerald-600 hidden" />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MetaRow({ label, value }: { label: string; value: Any }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground w-24 shrink-0">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

/* ============================================================== */
/* Helpers                                                         */
/* ============================================================== */
function dayKey(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x.toISOString().slice(0,10); }
function uniq<T>(a: T[]) { return Array.from(new Set(a)); }
function groupByDay(jobs: Job[]) {
  const m = new Map<string, Job[]>();
  for (const j of jobs) { const k = dayKey(new Date(j.scheduled_at)); const arr = m.get(k) ?? []; arr.push(j); m.set(k, arr); }
  return m;
}

function computeRange(view: ViewKey, anchor: Date): { start: Date; end: Date; anchor: Date } {
  const start = new Date(anchor); start.setHours(0,0,0,0);
  const end = new Date(anchor); end.setHours(23,59,59,999);
  if (view === "day") return { start, end, anchor };
  if (view === "week" || view === "timeline" || view === "agenda" || view === "kanban") {
    start.setDate(start.getDate() - start.getDay());
    end.setTime(start.getTime()); end.setDate(start.getDate() + 6); end.setHours(23,59,59,999);
    return { start, end, anchor };
  }
  if (view === "month") {
    start.setDate(1); start.setDate(1 - start.getDay());
    end.setTime(start.getTime()); end.setDate(start.getDate() + 41); end.setHours(23,59,59,999);
    return { start, end, anchor };
  }
  if (view === "quarter") {
    start.setMonth(Math.floor(start.getMonth() / 3) * 3, 1);
    end.setTime(start.getTime()); end.setMonth(start.getMonth() + 3, 0); end.setHours(23,59,59,999);
    return { start, end, anchor };
  }
  // year
  start.setMonth(0, 1); end.setTime(start.getTime()); end.setFullYear(start.getFullYear() + 1, 0, 0); end.setHours(23,59,59,999);
  return { start, end, anchor };
}

function formatRangeLabel(view: ViewKey, anchor: Date, range: { start: Date; end: Date }) {
  if (view === "day") return anchor.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  if (view === "week" || view === "timeline" || view === "agenda" || view === "kanban") return `${range.start.toLocaleDateString()} – ${range.end.toLocaleDateString()}`;
  if (view === "month") return anchor.toLocaleString(undefined, { month: "long", year: "numeric" });
  if (view === "quarter") { const q = Math.floor(anchor.getMonth() / 3) + 1; return `Q${q} ${anchor.getFullYear()}`; }
  return String(anchor.getFullYear());
}

function filterJobs(jobs: Job[], f: Any): Job[] {
  const q = (f.search as string).trim().toLowerCase();
  const now = new Date(); const today = dayKey(now);
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const weekEnd = new Date(now); weekEnd.setDate(now.getDate() + 7);
  return jobs.filter((j) => {
    if (f.platformFilter.size && !f.platformFilter.has(j.platform)) return false;
    if (f.statusFilter.size && !f.statusFilter.has(j.status)) return false;
    if (f.campaignFilter.size && !f.campaignFilter.has(j.campaign ?? "")) return false;
    if (q) {
      const hay = [j.payload?.title, j.payload?.body, j.campaign, j.platform, (j.payload?.hashtags ?? []).join(" ")].filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    const dk = dayKey(new Date(j.scheduled_at));
    const t = new Date(j.scheduled_at);
    if (f.sidebarPreset === "today" && dk !== today) return false;
    if (f.sidebarPreset === "tomorrow" && dk !== dayKey(tomorrow)) return false;
    if (f.sidebarPreset === "week" && (t < now || t > weekEnd)) return false;
    if (f.sidebarPreset === "overdue" && !(t < now && ["queued","retrying","approved"].includes(j.status))) return false;
    if (f.sidebarPreset === "drafts" && j.status !== "draft") return false;
    if (f.sidebarPreset === "pending" && j.status !== "approved") return false;
    if (f.sidebarPreset === "publishing_today" && !(dk === today && ["queued","publishing","retrying"].includes(j.status))) return false;
    if (f.sidebarPreset === "failed" && j.status !== "failed") return false;
    return true;
  });
}

function countPresets(jobs: Job[]) {
  const now = new Date(); const today = dayKey(now);
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const weekEnd = new Date(now); weekEnd.setDate(now.getDate() + 7);
  let all=0, tdy=0, tmr=0, week=0, over=0, drafts=0, pending=0, pubToday=0, failed=0;
  for (const j of jobs) {
    all++;
    const t = new Date(j.scheduled_at); const dk = dayKey(t);
    if (dk === today) tdy++;
    if (dk === dayKey(tomorrow)) tmr++;
    if (t >= now && t <= weekEnd) week++;
    if (t < now && ["queued","retrying","approved"].includes(j.status)) over++;
    if (j.status === "draft") drafts++;
    if (j.status === "approved") pending++;
    if (dk === today && ["queued","publishing","retrying"].includes(j.status)) pubToday++;
    if (j.status === "failed") failed++;
  }
  return { all, today: tdy, tomorrow: tmr, week, overdue: over, drafts, pending, publishingToday: pubToday, failed };
}

function detectConflicts(jobs: Job[]): Array<{ ids: string[]; reason: string }> {
  const out: Array<{ ids: string[]; reason: string }> = [];
  // Same content on same platform within 24h.
  const byContent = new Map<string, Job[]>();
  for (const j of jobs) if (j.content_id) { const k = `${j.content_id}|${j.platform}`; const a = byContent.get(k) ?? []; a.push(j); byContent.set(k, a); }
  for (const [, arr] of byContent) {
    if (arr.length < 2) continue;
    const sorted = arr.slice().sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
    for (let i = 1; i < sorted.length; i++) {
      const diff = new Date(sorted[i].scheduled_at).getTime() - new Date(sorted[i-1].scheduled_at).getTime();
      if (diff < 24 * 3600_000) out.push({ ids: [sorted[i-1].id, sorted[i].id], reason: `Duplicate content on ${sorted[i].platform} within 24h` });
    }
  }
  // Same account, same 15-min slot.
  const bySlot = new Map<string, Job[]>();
  for (const j of jobs) if (j.account_id) {
    const t = new Date(j.scheduled_at); t.setSeconds(0, 0); const bucket = Math.floor(t.getMinutes() / 15) * 15; t.setMinutes(bucket);
    const k = `${j.account_id}|${t.toISOString()}`; const a = bySlot.get(k) ?? []; a.push(j); bySlot.set(k, a);
  }
  for (const [, arr] of bySlot) if (arr.length > 1) out.push({ ids: arr.map((x) => x.id), reason: `Overlapping schedule on ${pm(arr[0].platform).label}` });
  return out;
}

function computeRecommendations(jobs: Job[]): string[] {
  if (jobs.length === 0) return ["No scheduled content yet. Schedule approved content from the Publisher to unlock optimization insights."];
  const byHour = new Array(24).fill(0);
  const byDow = new Array(7).fill(0);
  const byPlatform = new Map<string, number>();
  const byDay = new Map<string, number>();
  for (const j of jobs) {
    const t = new Date(j.scheduled_at);
    byHour[t.getHours()]++; byDow[t.getDay()]++;
    byPlatform.set(j.platform, (byPlatform.get(j.platform) ?? 0) + 1);
    byDay.set(dayKey(t), (byDay.get(dayKey(t)) ?? 0) + 1);
  }
  const topHour = byHour.indexOf(Math.max(...byHour));
  const topDow = byDow.indexOf(Math.max(...byDow));
  const platforms = Array.from(byPlatform.entries()).sort((a,b) => b[1] - a[1]);
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const recs: string[] = [];
  recs.push(`Best posting window historically: ${days[topDow]} around ${String(topHour).padStart(2,"0")}:00 — schedule high-priority content here.`);
  if (platforms.length) recs.push(`Heaviest platform: ${pm(platforms[0][0]).label} (${platforms[0][1]} posts). Balance with lighter platforms to avoid audience fatigue.`);
  const zeroDays = new Date(); let empty = 0;
  for (let i = 0; i < 7; i++) { const d = new Date(zeroDays); d.setDate(zeroDays.getDate() + i); if (!byDay.get(dayKey(d))) empty++; }
  if (empty > 0) recs.push(`${empty} of the next 7 days have no scheduled content — fill gaps for consistent reach.`);
  const late = jobs.filter((j) => new Date(j.scheduled_at) < new Date() && ["queued","retrying"].includes(j.status)).length;
  if (late > 0) recs.push(`${late} posts are overdue in the queue — investigate account tokens or retry manually.`);
  return recs;
}
