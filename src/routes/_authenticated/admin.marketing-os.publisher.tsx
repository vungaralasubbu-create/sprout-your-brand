import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  listPublishingJobs, getPublishingStats, enqueueFromApproval,
  bulkCancelJobs, bulkReschedule, bulkRetry, bulkDeleteJobs,
  publishJobNow, campaignAction,
  listConnectedAccounts, listApprovedForPublishing,
} from "@/lib/marketing-os/publisher.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Play, Pause, RefreshCw, Trash2, Copy, CalendarClock, Send, Loader2,
  Users, Clock, CheckCircle2, XCircle, AlertTriangle, ListChecks, Zap,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/admin/marketing-os/publisher")({
  component: PublisherPage,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
type Job = {
  id: string; content_id: string | null; campaign: string | null; platform: string;
  account_id: string | null; account_label: string | null; scheduled_at: string;
  status: string; retry_count: number; priority: number; platform_url: string | null;
  error_message: string | null; payload: Any;
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-200 text-slate-700",
  approved: "bg-indigo-100 text-indigo-700",
  queued: "bg-sky-100 text-sky-700",
  publishing: "bg-primary/15 text-primary animate-pulse",
  published: "bg-emerald-100 text-emerald-700",
  failed: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
  retrying: "bg-amber-100 text-amber-700",
  skipped: "bg-muted text-muted-foreground",
};
const PLATFORM_ICONS: Record<string, string> = { facebook: "📘", instagram: "📸", linkedin: "💼", x: "𝕏", threads: "🧵", pinterest: "📌", youtube: "▶️", tiktok: "🎵" };

function PublisherPage() {
  const listFn = useServerFn(listPublishingJobs);
  const statsFn = useServerFn(getPublishingStats);
  const enqueueFn = useServerFn(enqueueFromApproval);
  const cancelFn = useServerFn(bulkCancelJobs);
  const reFn = useServerFn(bulkReschedule);
  const retryFn = useServerFn(bulkRetry);
  const delFn = useServerFn(bulkDeleteJobs);
  const nowFn = useServerFn(publishJobNow);
  const campFn = useServerFn(campaignAction);
  const accountsFn = useServerFn(listConnectedAccounts);
  const approvedFn = useServerFn(listApprovedForPublishing);
  const qc = useQueryClient();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openSchedule, setOpenSchedule] = useState(false);
  const [scheduleOpenId, setScheduleOpenId] = useState<string | null>(null);
  const [scheduleWhen, setScheduleWhen] = useState<string>(() => new Date(Date.now() + 3600_000).toISOString().slice(0, 16));

  const { data: stats } = useQuery({ queryKey: ["pubstats"], queryFn: () => statsFn(), refetchInterval: 15000 });
  const { data: list, isLoading } = useQuery({ queryKey: ["pubjobs"], queryFn: () => listFn({ data: {} }), refetchInterval: 10000 });
  const jobs = (list?.jobs ?? []) as Job[];

  const invalidate = () => { qc.invalidateQueries({ queryKey: ["pubjobs"] }); qc.invalidateQueries({ queryKey: ["pubstats"] }); };

  const facets = useMemo(() => ({
    campaigns: Array.from(new Set(jobs.map((j) => j.campaign).filter(Boolean))) as string[],
    platforms: Array.from(new Set(jobs.map((j) => j.platform))),
  }), [jobs]);

  const bulkIds = Array.from(selected);
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const stat = stats ?? { connectedAccounts: 0, pending: 0, scheduled: 0, publishing: 0, publishedToday: 0, failed: 0, queued: 0, upcomingWeek: 0 };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Publisher</h2>
          <p className="text-sm text-muted-foreground">One-click scheduling across every connected platform. Auto-retry, evergreen, campaign controls.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setOpenSchedule(true)}>
            <Send className="size-4 mr-2" /> Schedule Approved
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2">
        <Kpi label="Connected" value={stat.connectedAccounts} icon={Users} tone="text-primary" />
        <Kpi label="Pending" value={stat.pending} icon={ListChecks} tone="text-indigo-600" />
        <Kpi label="Scheduled" value={stat.scheduled} icon={CalendarClock} tone="text-sky-600" />
        <Kpi label="Publishing" value={stat.publishing} icon={Zap} tone="text-primary" />
        <Kpi label="Today" value={stat.publishedToday} icon={CheckCircle2} tone="text-emerald-600" />
        <Kpi label="Failed" value={stat.failed} icon={XCircle} tone="text-destructive" />
        <Kpi label="Queued" value={stat.queued} icon={Clock} tone="text-sky-600" />
        <Kpi label="This Week" value={stat.upcomingWeek} icon={AlertTriangle} tone="text-amber-600" />
      </div>

      {selected.size > 0 && (
        <Card className="p-3 sticky top-2 z-10 border-primary/50 shadow-md flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium mr-2">{selected.size} selected</span>
          <Button size="sm" variant="outline" onClick={async () => { for (const id of bulkIds) await nowFn({ data: { id } }); setSelected(new Set()); invalidate(); toast.success("Publishing now"); }}>
            <Play className="size-4 mr-1" /> Publish Now
          </Button>
          <Button size="sm" variant="outline" onClick={() => setScheduleOpenId("bulk")}>
            <CalendarClock className="size-4 mr-1" /> Reschedule
          </Button>
          <Button size="sm" variant="outline" onClick={async () => { await retryFn({ data: { ids: bulkIds } }); setSelected(new Set()); invalidate(); toast.success("Requeued"); }}>
            <RefreshCw className="size-4 mr-1" /> Retry
          </Button>
          <Button size="sm" variant="outline" onClick={async () => { await cancelFn({ data: { ids: bulkIds } }); setSelected(new Set()); invalidate(); toast.success("Cancelled"); }}>
            <Pause className="size-4 mr-1" /> Cancel
          </Button>
          <Button size="sm" variant="danger" onClick={async () => { if (confirm(`Delete ${bulkIds.length} jobs?`)) { await delFn({ data: { ids: bulkIds } }); setSelected(new Set()); invalidate(); } }}>
            <Trash2 className="size-4 mr-1" /> Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
        </Card>
      )}

      {facets.campaigns.length > 0 && (
        <Card className="p-3">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Campaign controls</div>
          <div className="flex flex-wrap gap-2">
            {facets.campaigns.map((c) => (
              <div key={c} className="flex items-center gap-1 border rounded-md pl-3 pr-1 py-1 text-sm">
                <span className="font-medium">🎯 {c}</span>
                <Button size="sm" variant="ghost" title="Publish all now" onClick={async () => { await campFn({ data: { campaign: c, action: "publish_all" } }); invalidate(); toast.success("Publishing campaign"); }}>
                  <Play className="size-3.5" />
                </Button>
                <Button size="sm" variant="ghost" title="Pause" onClick={async () => { await campFn({ data: { campaign: c, action: "pause" } }); invalidate(); }}>
                  <Pause className="size-3.5" />
                </Button>
                <Button size="sm" variant="ghost" title="Resume" onClick={async () => { await campFn({ data: { campaign: c, action: "resume" } }); invalidate(); }}>
                  <RefreshCw className="size-3.5" />
                </Button>
                <Button size="sm" variant="ghost" title="Clone" onClick={async () => { await campFn({ data: { campaign: c, action: "clone" } }); invalidate(); toast.success("Cloned"); }}>
                  <Copy className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-2 w-8"></th>
              <th className="text-left p-2">Post</th>
              <th className="text-left p-2">Platform</th>
              <th className="text-left p-2">Campaign</th>
              <th className="text-left p-2">Scheduled</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Retry</th>
              <th className="text-left p-2">Priority</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">Loading…</td></tr>}
            {!isLoading && jobs.length === 0 && (
              <tr><td colSpan={9} className="p-12 text-center text-muted-foreground">
                No publishing jobs yet. Click <b>Schedule Approved</b> to send approved content to your platforms.
              </td></tr>
            )}
            {jobs.map((j) => (
              <tr key={j.id} className="border-t border-border/60 hover:bg-muted/30">
                <td className="p-2"><Checkbox checked={selected.has(j.id)} onCheckedChange={() => toggle(j.id)} /></td>
                <td className="p-2 max-w-md">
                  <div className="font-medium truncate">{(j.payload as Any)?.title ?? "(untitled)"}</div>
                  <div className="text-xs text-muted-foreground truncate">{(j.payload as Any)?.body?.slice(0, 90)}</div>
                  {j.platform_url && <a href={j.platform_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">View post ↗</a>}
                  {j.error_message && <div className="text-xs text-destructive mt-0.5">⚠ {j.error_message}</div>}
                </td>
                <td className="p-2">{PLATFORM_ICONS[j.platform] ?? "•"} <span className="capitalize">{j.platform}</span></td>
                <td className="p-2 text-muted-foreground">{j.campaign ?? "—"}</td>
                <td className="p-2 text-xs">
                  <div>{new Date(j.scheduled_at).toLocaleString()}</div>
                  <div className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(j.scheduled_at), { addSuffix: true })}</div>
                </td>
                <td className="p-2">
                  <span className={cn("text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded", STATUS_COLORS[j.status] ?? "bg-muted")}>{j.status}</span>
                </td>
                <td className="p-2 text-xs">{j.retry_count}</td>
                <td className="p-2 text-xs">{j.priority}</td>
                <td className="p-2 text-right space-x-1">
                  {(j.status === "queued" || j.status === "retrying") && (
                    <Button size="sm" variant="ghost" title="Publish now" onClick={async () => { await nowFn({ data: { id: j.id } }); invalidate(); toast.success("Published (or queued)"); }}>
                      <Play className="size-3.5" />
                    </Button>
                  )}
                  {j.status === "failed" && (
                    <Button size="sm" variant="ghost" title="Retry" onClick={async () => { await retryFn({ data: { ids: [j.id] } }); invalidate(); }}>
                      <RefreshCw className="size-3.5" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" title="Reschedule" onClick={() => setScheduleOpenId(j.id)}>
                    <CalendarClock className="size-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <ScheduleApprovedDialog
        open={openSchedule} onClose={() => setOpenSchedule(false)}
        enqueueFn={enqueueFn} accountsFn={accountsFn} approvedFn={approvedFn}
        onDone={invalidate}
      />
      <Dialog open={!!scheduleOpenId} onOpenChange={(o) => !o && setScheduleOpenId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reschedule</DialogTitle></DialogHeader>
          <Label>Publish at</Label>
          <Input type="datetime-local" value={scheduleWhen} onChange={(e) => setScheduleWhen(e.target.value)} />
          <Button onClick={async () => {
            const iso = new Date(scheduleWhen).toISOString();
            const ids = scheduleOpenId === "bulk" ? bulkIds : [scheduleOpenId!];
            await reFn({ data: { ids, scheduled_at: iso } });
            setScheduleOpenId(null); setSelected(new Set()); invalidate();
            toast.success("Rescheduled");
          }}>Save</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Kpi({ label, value, icon: Icon, tone }: { label: string; value: number; icon: Any; tone: string }) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2">
        <Icon className={cn("size-4", tone)} />
        <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      </div>
      <div className={cn("mt-1 text-2xl font-semibold", tone)}>{value}</div>
    </Card>
  );
}

/* -------- Schedule Approved dialog: select approved items + platforms + schedule -------- */

function ScheduleApprovedDialog({ open, onClose, enqueueFn, accountsFn, approvedFn, onDone }: {
  open: boolean; onClose: () => void;
  enqueueFn: Any; accountsFn: Any; approvedFn: Any; onDone: () => void;
}) {
  const { data: acctData } = useQuery({ queryKey: ["conn-accounts"], queryFn: () => accountsFn(), enabled: open });
  const { data: appData } = useQuery({ queryKey: ["approved-for-pub"], queryFn: () => approvedFn(), enabled: open });
  const accounts = (acctData?.accounts ?? []) as Array<{ id: string; platform: string; account_name: string }>;
  const items = (appData?.items ?? []) as Array<{ id: string; title: string; platform: string; campaign: string | null }>;

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"publish_now" | "schedule">("schedule");
  const [when, setWhen] = useState(() => new Date(Date.now() + 3600_000).toISOString().slice(0, 16));
  const tz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!selectedItems.size || !selectedAccounts.size) { toast.error("Pick at least one content and one account"); return; }
    setSubmitting(true);
    try {
      const platformSel = accounts.filter((a) => selectedAccounts.has(a.id)).map((a) => ({ platform: a.platform, account_id: a.id }));
      let total = 0;
      for (const id of selectedItems) {
        const r = await enqueueFn({ data: {
          content_id: id, platforms: platformSel,
          mode, scheduled_at: mode === "schedule" ? new Date(when).toISOString() : undefined,
          timezone: tz,
        } });
        total += r.created ?? 0;
      }
      toast.success(`Created ${total} publishing jobs`);
      setSelectedItems(new Set()); setSelectedAccounts(new Set());
      onDone(); onClose();
    } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
    finally { setSubmitting(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Schedule Approved Content</DialogTitle></DialogHeader>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Approved content ({items.length})</Label>
            <div className="border rounded-md max-h-72 overflow-y-auto mt-1">
              {items.length === 0 && <div className="p-4 text-sm text-muted-foreground text-center">No approved content yet.</div>}
              {items.map((i) => (
                <label key={i.id} className="flex items-start gap-2 p-2 border-b hover:bg-muted/40">
                  <Checkbox checked={selectedItems.has(i.id)} onCheckedChange={() => setSelectedItems((s) => { const n = new Set(s); n.has(i.id) ? n.delete(i.id) : n.add(i.id); return n; })} />
                  <div className="text-sm">
                    <div className="font-medium">{i.title}</div>
                    <div className="text-[11px] text-muted-foreground">{i.platform}{i.campaign ? ` · ${i.campaign}` : ""}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs">Connected accounts ({accounts.length})</Label>
            <div className="border rounded-md max-h-72 overflow-y-auto mt-1">
              {accounts.length === 0 && <div className="p-4 text-sm text-muted-foreground text-center">No connected accounts.</div>}
              {accounts.map((a) => (
                <label key={a.id} className="flex items-center gap-2 p-2 border-b hover:bg-muted/40">
                  <Checkbox checked={selectedAccounts.has(a.id)} onCheckedChange={() => setSelectedAccounts((s) => { const n = new Set(s); n.has(a.id) ? n.delete(a.id) : n.add(a.id); return n; })} />
                  <div className="text-sm">
                    <div className="font-medium">{PLATFORM_ICONS[a.platform] ?? "•"} {a.account_name}</div>
                    <div className="text-[11px] text-muted-foreground capitalize">{a.platform}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex gap-2">
                <label className="flex items-center gap-1 text-sm"><input type="radio" checked={mode === "schedule"} onChange={() => setMode("schedule")} /> Schedule</label>
                <label className="flex items-center gap-1 text-sm"><input type="radio" checked={mode === "publish_now"} onChange={() => setMode("publish_now")} /> Publish now</label>
              </div>
              {mode === "schedule" && (
                <div>
                  <Label className="text-xs">When ({tz})</Label>
                  <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Send className="size-4 mr-2" />}
            Create {selectedItems.size * selectedAccounts.size} jobs
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
