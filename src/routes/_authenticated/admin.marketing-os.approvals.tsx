import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  listApprovalItems, getApprovalItem, changeApprovalStatus,
  bulkDeleteApprovals, bulkDuplicateApprovals, bulkMoveCampaign, bulkChangePlatform,
  updateApprovalItem, addApprovalComment, scoreApprovalItem, restoreApprovalVersion,
  seedApprovalDemo,
} from "@/lib/marketing-os/approvals.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Check, X as XIcon, MessageSquare, RefreshCw, History, Sparkles, Search, Filter,
  MoreHorizontal, Copy, Trash2, FileDown, Wand2, ChevronDown, Layers,
  Loader2, Undo2, Redo2, Calendar as CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/admin/marketing-os/approvals")({
  component: ApprovalCenter,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

type Item = {
  id: string; title: string; preview: string | null; body: string | null;
  platform: string; content_type: string; campaign: string | null;
  language: string | null; country: string | null; business_unit: string | null;
  ai_model: string | null; ai_generated: boolean;
  hashtags: string[] | null; cta: string | null;
  status: "draft"|"review"|"approved"|"scheduled"|"published"|"rejected"|"failed"|"archived";
  quality_score: number | null; seo_score: number | null; brand_score: number | null; engagement_score: number | null;
  scores: Any; warnings: Any; content: Any;
  version: number; scheduled_at: string | null; approved_at: string | null; published_at: string | null;
  created_by: string | null; created_at: string; updated_at: string;
};

const COLUMNS: { key: Item["status"]; label: string; tone: string }[] = [
  { key: "draft",     label: "Draft",     tone: "bg-slate-500" },
  { key: "review",    label: "Review",    tone: "bg-amber-500" },
  { key: "approved",  label: "Approved",  tone: "bg-emerald-500" },
  { key: "scheduled", label: "Scheduled", tone: "bg-sky-500" },
  { key: "published", label: "Published", tone: "bg-primary" },
  { key: "rejected",  label: "Rejected",  tone: "bg-destructive" },
];

const PLATFORM_ICONS: Record<string, string> = {
  Instagram: "📸", Facebook: "📘", LinkedIn: "💼", X: "𝕏", Threads: "🧵",
  Blog: "📝", Pinterest: "📌", YouTube: "▶️", TikTok: "🎵",
};

function scoreColor(v: number | null | undefined) {
  if (v == null) return "text-muted-foreground";
  if (v >= 80) return "text-emerald-600";
  if (v >= 60) return "text-amber-600";
  return "text-destructive";
}

function ApprovalCenter() {
  const list = useServerFn(listApprovalItems);
  const changeStatus = useServerFn(changeApprovalStatus);
  const bulkDel = useServerFn(bulkDeleteApprovals);
  const bulkDup = useServerFn(bulkDuplicateApprovals);
  const bulkCamp = useServerFn(bulkMoveCampaign);
  const bulkPlat = useServerFn(bulkChangePlatform);
  const seed = useServerFn(seedApprovalDemo);
  const qc = useQueryClient();

  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [fPlatform, setFPlatform] = useState<string[]>([]);
  const [fCampaign, setFCampaign] = useState<string[]>([]);
  const [fType, setFType] = useState<string[]>([]);
  const [fLang, setFLang] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["approvals", { search, fPlatform, fCampaign, fType, fLang }],
    queryFn: () => list({
      data: {
        search: search || undefined,
        platform: fPlatform.length ? fPlatform : undefined,
        campaign: fCampaign.length ? fCampaign : undefined,
        content_type: fType.length ? fType : undefined,
        language: fLang.length ? fLang : undefined,
      },
    }),
  });

  const items = (data?.items ?? []) as Item[];
  const invalidate = () => qc.invalidateQueries({ queryKey: ["approvals"] });

  const kpi = useMemo(() => {
    const c = (s: string) => items.filter((i) => i.status === s).length;
    return { draft: c("draft"), review: c("review"), approved: c("approved"), scheduled: c("scheduled"), published: c("published"), rejected: c("rejected"), failed: c("failed") };
  }, [items]);

  const facets = useMemo(() => {
    const uniq = (k: keyof Item) => Array.from(new Set(items.map((i) => i[k]).filter(Boolean))) as string[];
    return {
      platforms: uniq("platform"), campaigns: uniq("campaign"),
      types: uniq("content_type"), languages: uniq("language"),
    };
  }, [items]);

  const mChangeStatus = useMutation({
    mutationFn: (v: { ids: string[]; status: Item["status"]; note?: string }) => changeStatus({ data: v }),
    onSuccess: () => { toast.success("Status updated"); setSelected(new Set()); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const mBulkDel = useMutation({
    mutationFn: (ids: string[]) => bulkDel({ data: { ids } }),
    onSuccess: () => { toast.success("Deleted"); setSelected(new Set()); invalidate(); },
  });
  const mBulkDup = useMutation({
    mutationFn: (ids: string[]) => bulkDup({ data: { ids } }),
    onSuccess: (r) => { toast.success(`Duplicated ${r.created}`); setSelected(new Set()); invalidate(); },
  });
  const mSeed = useMutation({
    mutationFn: () => seed(),
    onSuccess: (r) => { toast.success(`Seeded ${r.created} demo items`); invalidate(); },
  });

  function toggleSelected(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function selectAllInColumn(status: Item["status"]) {
    setSelected(new Set(items.filter((i) => i.status === status).map((i) => i.id)));
  }

  function exportJson() {
    const rows = selected.size ? items.filter((i) => selected.has(i.id)) : items;
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `approvals-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  const bulkIds = Array.from(selected);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Approval Center</h2>
          <p className="text-sm text-muted-foreground">Review, score, and approve every AI-generated content piece before it ships.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-border overflow-hidden text-sm">
            <button className={cn("px-3 py-1.5", view === "kanban" && "bg-muted font-medium")} onClick={() => setView("kanban")}>Kanban</button>
            <button className={cn("px-3 py-1.5 border-l border-border", view === "list" && "bg-muted font-medium")} onClick={() => setView("list")}>List</button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowFilters((s) => !s)}>
            <Filter className="size-4 mr-2" /> Filters
          </Button>
          {items.length === 0 && (
            <Button size="sm" onClick={() => mSeed.mutate()} disabled={mSeed.isPending}>
              {mSeed.isPending ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Sparkles className="size-4 mr-2" />}
              Seed Demo
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
        {[
          { l: "Draft", v: kpi.draft, tone: "text-slate-600" },
          { l: "Pending Review", v: kpi.review, tone: "text-amber-600" },
          { l: "Approved", v: kpi.approved, tone: "text-emerald-600" },
          { l: "Scheduled", v: kpi.scheduled, tone: "text-sky-600" },
          { l: "Published", v: kpi.published, tone: "text-primary" },
          { l: "Rejected", v: kpi.rejected, tone: "text-destructive" },
          { l: "Failed", v: kpi.failed, tone: "text-destructive" },
        ].map((s) => (
          <Card key={s.l} className="p-3">
            <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">{s.l}</div>
            <div className={cn("mt-1 text-2xl font-semibold", s.tone)}>{s.v}</div>
          </Card>
        ))}
      </div>

      {showFilters && (
        <Card className="p-4">
          <div className="grid md:grid-cols-5 gap-3">
            <div>
              <Label className="text-xs">Search</Label>
              <div className="relative mt-1">
                <Search className="size-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Title or preview…" />
              </div>
            </div>
            <FacetFilter label="Platform" values={facets.platforms} selected={fPlatform} onChange={setFPlatform} />
            <FacetFilter label="Campaign" values={facets.campaigns} selected={fCampaign} onChange={setFCampaign} />
            <FacetFilter label="Content Type" values={facets.types} selected={fType} onChange={setFType} />
            <FacetFilter label="Language" values={facets.languages} selected={fLang} onChange={setFLang} />
          </div>
        </Card>
      )}

      {selected.size > 0 && (
        <Card className="p-3 flex items-center gap-2 flex-wrap sticky top-2 z-10 border-primary/50 shadow-md">
          <span className="text-sm font-medium mr-2">{selected.size} selected</span>
          <Button size="sm" variant="outline" onClick={() => mChangeStatus.mutate({ ids: bulkIds, status: "approved" })}>
            <Check className="size-4 mr-1" /> Approve
          </Button>
          <Button size="sm" variant="outline" onClick={() => mChangeStatus.mutate({ ids: bulkIds, status: "rejected" })}>
            <XIcon className="size-4 mr-1" /> Reject
          </Button>
          <Button size="sm" variant="outline" onClick={() => mChangeStatus.mutate({ ids: bulkIds, status: "scheduled" })}>
            <CalendarIcon className="size-4 mr-1" /> Schedule
          </Button>
          <Button size="sm" variant="outline" onClick={() => mBulkDup.mutate(bulkIds)}>
            <Copy className="size-4 mr-1" /> Duplicate
          </Button>
          <BulkMovePopover ids={bulkIds} onDone={() => { setSelected(new Set()); invalidate(); }} bulkCamp={bulkCamp} bulkPlat={bulkPlat} />
          <Button size="sm" variant="outline" onClick={exportJson}>
            <FileDown className="size-4 mr-1" /> Export
          </Button>
          <Button size="sm" variant="danger" onClick={() => { if (confirm(`Delete ${bulkIds.length} items?`)) mBulkDel.mutate(bulkIds); }}>
            <Trash2 className="size-4 mr-1" /> Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
        </Card>
      )}

      {isLoading ? (
        <div className="p-16 text-center text-muted-foreground">Loading queue…</div>
      ) : view === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3 min-h-[60vh]">
          {COLUMNS.map((col) => {
            const cards = items.filter((i) => i.status === col.key);
            return (
              <div
                key={col.key}
                className="bg-muted/30 rounded-lg p-2 flex flex-col"
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={(e) => {
                  const id = e.dataTransfer.getData("text/plain");
                  if (id) mChangeStatus.mutate({ ids: [id], status: col.key });
                }}
              >
                <div className="flex items-center justify-between px-2 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className={cn("size-2 rounded-full", col.tone)} />
                    <h3 className="font-semibold text-sm">{col.label}</h3>
                    <span className="text-xs text-muted-foreground">{cards.length}</span>
                  </div>
                  <button
                    className="text-[10px] text-muted-foreground hover:text-foreground"
                    onClick={() => selectAllInColumn(col.key)}
                  >
                    Select all
                  </button>
                </div>
                <div className="flex-1 space-y-2 mt-1 overflow-y-auto max-h-[72vh]">
                  {cards.map((it) => (
                    <ApprovalCard
                      key={it.id}
                      item={it}
                      selected={selected.has(it.id)}
                      onToggle={() => toggleSelected(it.id)}
                      onOpen={() => setOpenId(it.id)}
                    />
                  ))}
                  {cards.length === 0 && (
                    <div className="text-center text-[11px] text-muted-foreground py-8">No items</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-2 w-8"></th>
                <th className="text-left p-2">Title</th>
                <th className="text-left p-2">Platform</th>
                <th className="text-left p-2">Campaign</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Q</th>
                <th className="text-left p-2">SEO</th>
                <th className="text-left p-2">Brand</th>
                <th className="text-left p-2">Scheduled</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-t border-border/60 hover:bg-muted/30">
                  <td className="p-2"><Checkbox checked={selected.has(it.id)} onCheckedChange={() => toggleSelected(it.id)} /></td>
                  <td className="p-2 max-w-md">
                    <button className="text-left hover:underline font-medium" onClick={() => setOpenId(it.id)}>{it.title}</button>
                    <div className="text-xs text-muted-foreground truncate max-w-md">{it.preview}</div>
                  </td>
                  <td className="p-2">{PLATFORM_ICONS[it.platform] ?? "•"} {it.platform}</td>
                  <td className="p-2 text-muted-foreground">{it.campaign || "—"}</td>
                  <td className="p-2"><StatusBadge status={it.status} /></td>
                  <td className={cn("p-2 font-mono", scoreColor(it.quality_score))}>{it.quality_score ?? "—"}</td>
                  <td className={cn("p-2 font-mono", scoreColor(it.seo_score))}>{it.seo_score ?? "—"}</td>
                  <td className={cn("p-2 font-mono", scoreColor(it.brand_score))}>{it.brand_score ?? "—"}</td>
                  <td className="p-2 text-xs text-muted-foreground">{it.scheduled_at ? new Date(it.scheduled_at).toLocaleString() : "—"}</td>
                  <td className="p-2 text-right">
                    <Button size="sm" variant="ghost" onClick={() => setOpenId(it.id)}>Open</Button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={10} className="p-16 text-center text-muted-foreground">Queue is empty.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      <ApprovalDrawer id={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

/* ---------- Filter chip ---------- */
function FacetFilter({ label, values, selected, onChange }: { label: string; values: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="w-full mt-1 justify-between">
            <span className="truncate">{selected.length ? `${selected.length} selected` : "All"}</span>
            <ChevronDown className="size-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 max-h-72 overflow-y-auto">
          {values.length === 0 && <div className="p-3 text-xs text-muted-foreground">No values</div>}
          {values.map((v) => {
            const on = selected.includes(v);
            return (
              <DropdownMenuItem key={v} onSelect={(e) => { e.preventDefault(); onChange(on ? selected.filter((x) => x !== v) : [...selected, v]); }}>
                <Checkbox className="mr-2" checked={on} onCheckedChange={() => {}} />
                <span className="text-sm">{v}</span>
              </DropdownMenuItem>
            );
          })}
          {selected.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => onChange([])}>Clear</DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/* ---------- Card ---------- */
function ApprovalCard({ item, selected, onToggle, onOpen }: { item: Item; selected: boolean; onToggle: () => void; onOpen: () => void }) {
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", item.id)}
      className={cn(
        "bg-background rounded-md border border-border p-2.5 cursor-grab active:cursor-grabbing hover:border-primary/60 transition-colors",
        selected && "ring-2 ring-primary/60"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Checkbox checked={selected} onCheckedChange={onToggle} onClick={(e) => e.stopPropagation()} />
        <div className="flex items-center gap-1 text-[10px]">
          <span className="opacity-80">{PLATFORM_ICONS[item.platform] ?? "•"}</span>
          <span className="text-muted-foreground uppercase tracking-wider">{item.content_type}</span>
          {item.ai_generated && <Badge variant="muted" className="text-[9px] py-0 px-1">AI</Badge>}
        </div>
      </div>
      <button className="mt-1.5 text-left w-full" onClick={onOpen}>
        <div className="text-sm font-medium line-clamp-2">{item.title}</div>
        <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{item.preview}</div>
      </button>
      {item.campaign && <div className="mt-2 text-[10px] text-primary">🎯 {item.campaign}</div>}
      <div className="mt-2 flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-2">
          <span className={scoreColor(item.quality_score)}>Q {item.quality_score ?? "—"}</span>
          <span className={scoreColor(item.seo_score)}>S {item.seo_score ?? "—"}</span>
          <span className={scoreColor(item.brand_score)}>B {item.brand_score ?? "—"}</span>
        </div>
        {item.scheduled_at && <span className="text-muted-foreground">{new Date(item.scheduled_at).toLocaleDateString()}</span>}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Item["status"] }) {
  const map: Record<string, string> = {
    draft: "bg-slate-200 text-slate-700",
    review: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    scheduled: "bg-sky-100 text-sky-700",
    published: "bg-primary/10 text-primary",
    rejected: "bg-destructive/10 text-destructive",
    failed: "bg-destructive/10 text-destructive",
    archived: "bg-muted text-muted-foreground",
  };
  return <span className={cn("text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded", map[status])}>{status}</span>;
}

/* ---------- Bulk move campaign/platform ---------- */
function BulkMovePopover({ ids, onDone, bulkCamp, bulkPlat }: {
  ids: string[]; onDone: () => void;
  bulkCamp: (a: { data: { ids: string[]; campaign: string } }) => Promise<{ ok: boolean }>;
  bulkPlat: (a: { data: { ids: string[]; platform: string } }) => Promise<{ ok: boolean }>;
}) {
  const [openCamp, setOpenCamp] = useState(false);
  const [openPlat, setOpenPlat] = useState(false);
  const [camp, setCamp] = useState("");
  const [plat, setPlat] = useState("Instagram");
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpenCamp(true)}><Layers className="size-4 mr-1" /> Campaign</Button>
      <Button size="sm" variant="outline" onClick={() => setOpenPlat(true)}>Platform</Button>
      <Dialog open={openCamp} onOpenChange={setOpenCamp}>
        <DialogContent>
          <DialogHeader><DialogTitle>Move to campaign</DialogTitle></DialogHeader>
          <Input value={camp} onChange={(e) => setCamp(e.target.value)} placeholder="Campaign name" />
          <Button onClick={async () => { if (!camp) return; await bulkCamp({ data: { ids, campaign: camp } }); setOpenCamp(false); onDone(); toast.success("Moved"); }}>Move</Button>
        </DialogContent>
      </Dialog>
      <Dialog open={openPlat} onOpenChange={setOpenPlat}>
        <DialogContent>
          <DialogHeader><DialogTitle>Change platform</DialogTitle></DialogHeader>
          <select className="h-10 rounded-md border border-input bg-transparent px-3 text-sm" value={plat} onChange={(e) => setPlat(e.target.value)}>
            {["Instagram","Facebook","LinkedIn","X","Threads","Blog","Pinterest","YouTube","TikTok"].map((p) => <option key={p}>{p}</option>)}
          </select>
          <Button onClick={async () => { await bulkPlat({ data: { ids, platform: plat } }); setOpenPlat(false); onDone(); toast.success("Platform updated"); }}>Update</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ---------- Detail drawer ---------- */
function ApprovalDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const getFn = useServerFn(getApprovalItem);
  const upd = useServerFn(updateApprovalItem);
  const addComment = useServerFn(addApprovalComment);
  const score = useServerFn(scoreApprovalItem);
  const change = useServerFn(changeApprovalStatus);
  const restore = useServerFn(restoreApprovalVersion);
  const qc = useQueryClient();
  const [tab, setTab] = useState<"preview" | "edit" | "scores" | "comments" | "history">("preview");

  const { data, isLoading } = useQuery({
    queryKey: ["approval", id],
    queryFn: () => getFn({ data: { id: id! } }),
    enabled: !!id,
  });

  const item = data?.item as Item | undefined;
  const [draft, setDraft] = useState<Partial<Item> | null>(null);
  const [newComment, setNewComment] = useState("");
  const [historyOpen, setHistoryOpen] = useState<"undo" | null>(null); void historyOpen;

  const inv = () => {
    qc.invalidateQueries({ queryKey: ["approval", id] });
    qc.invalidateQueries({ queryKey: ["approvals"] });
  };

  const mSave = useMutation({
    mutationFn: () => upd({ data: {
      id: id!, patch: {
        title: draft?.title ?? item!.title,
        preview: draft?.preview ?? item!.preview,
        body: draft?.body ?? item!.body,
        cta: draft?.cta ?? item!.cta,
        hashtags: draft?.hashtags ?? item!.hashtags ?? [],
        campaign: draft?.campaign ?? item!.campaign,
      },
    } }),
    onSuccess: () => { toast.success("Saved"); setDraft(null); inv(); },
  });
  const mScore = useMutation({
    mutationFn: () => score({ data: { id: id! } }),
    onSuccess: () => { toast.success("AI review complete"); inv(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const mChange = useMutation({
    mutationFn: (status: Item["status"]) => change({ data: { ids: [id!], status } }),
    onSuccess: () => { toast.success("Updated"); inv(); },
  });
  const mComment = useMutation({
    mutationFn: () => addComment({ data: { queue_id: id!, body: newComment } }),
    onSuccess: () => { setNewComment(""); inv(); },
  });
  const mRestore = useMutation({
    mutationFn: (vid: string) => restore({ data: { version_id: vid } }),
    onSuccess: () => { toast.success("Restored"); inv(); },
  });

  if (!id) return null;

  const cur = { ...(item ?? {}), ...(draft ?? {}) } as Item;
  const wordCount = (cur.body ?? "").split(/\s+/).filter(Boolean).length;
  const charCount = (cur.body ?? "").length;
  const platformLimit = platformCharLimit(cur.platform);

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {item ? (
              <>
                <span>{PLATFORM_ICONS[item.platform] ?? "•"}</span>
                <span className="truncate">{item.title}</span>
                <StatusBadge status={item.status} />
              </>
            ) : "Loading…"}
          </SheetTitle>
        </SheetHeader>

        {isLoading || !item ? (
          <div className="p-10 text-center text-muted-foreground">Loading…</div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => mChange.mutate("approved")}><Check className="size-4 mr-1" /> Approve</Button>
              <Button size="sm" variant="outline" onClick={() => mChange.mutate("rejected")}><XIcon className="size-4 mr-1" /> Reject</Button>
              <Button size="sm" variant="outline" onClick={() => mChange.mutate("review")}>Request Changes</Button>
              <Button size="sm" variant="outline" onClick={() => mChange.mutate("scheduled")}><CalendarIcon className="size-4 mr-1" /> Schedule</Button>
              <Button size="sm" variant="outline" onClick={() => mScore.mutate()} disabled={mScore.isPending}>
                {mScore.isPending ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Wand2 className="size-4 mr-1" />} AI Review
              </Button>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <ScoreTile label="Quality" v={item.quality_score} />
              <ScoreTile label="SEO" v={item.seo_score} />
              <ScoreTile label="Brand" v={item.brand_score} />
              <ScoreTile label="Engage" v={item.engagement_score} />
            </div>

            {Array.isArray(item.warnings) && item.warnings.length > 0 && (
              <Card className="p-3 border-amber-300 bg-amber-50">
                <div className="text-xs font-semibold text-amber-800 mb-1">Warnings</div>
                <ul className="text-xs text-amber-900 space-y-0.5">
                  {(item.warnings as Any[]).map((w, i) => <li key={i}>· {w?.message ?? String(w)}</li>)}
                </ul>
              </Card>
            )}

            <div className="flex gap-1 border-b border-border/60">
              {(["preview","edit","scores","comments","history"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)} className={cn(
                  "px-3 py-1.5 text-sm border-b-2 capitalize",
                  tab === t ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground"
                )}>{t}</button>
              ))}
            </div>

            {tab === "preview" && <PlatformPreview item={cur} />}

            {tab === "edit" && (
              <div className="space-y-3">
                <div>
                  <Label>Title</Label>
                  <Input value={cur.title} onChange={(e) => setDraft((d) => ({ ...(d ?? {}), title: e.target.value }))} />
                </div>
                <div>
                  <Label>Preview / Caption</Label>
                  <Textarea rows={3} value={cur.preview ?? ""} onChange={(e) => setDraft((d) => ({ ...(d ?? {}), preview: e.target.value }))} />
                </div>
                <div>
                  <Label>Body (Markdown)</Label>
                  <Textarea rows={12} className="font-mono text-sm" value={cur.body ?? ""} onChange={(e) => setDraft((d) => ({ ...(d ?? {}), body: e.target.value }))} />
                  <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                    <span>{wordCount} words · {charCount} chars</span>
                    {platformLimit && <span className={charCount > platformLimit ? "text-destructive" : ""}>Limit: {platformLimit}</span>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>CTA</Label>
                    <Input value={cur.cta ?? ""} onChange={(e) => setDraft((d) => ({ ...(d ?? {}), cta: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Campaign</Label>
                    <Input value={cur.campaign ?? ""} onChange={(e) => setDraft((d) => ({ ...(d ?? {}), campaign: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>Hashtags (comma-separated)</Label>
                  <Input
                    value={(cur.hashtags ?? []).join(", ")}
                    onChange={(e) => setDraft((d) => ({ ...(d ?? {}), hashtags: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) }))}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={() => mSave.mutate()} disabled={!draft || mSave.isPending}>
                    {mSave.isPending ? <Loader2 className="size-4 mr-1 animate-spin" /> : null} Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDraft(null)} disabled={!draft}>Discard</Button>
                  <div className="ml-auto flex gap-1">
                    <Button size="sm" variant="ghost" disabled title="Undo (local edits are single-step)"><Undo2 className="size-4" /></Button>
                    <Button size="sm" variant="ghost" disabled><Redo2 className="size-4" /></Button>
                  </div>
                </div>
              </div>
            )}

            {tab === "scores" && (
              <div className="space-y-3">
                {item.scores && typeof item.scores === "object" ? (
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(item.scores as Record<string, Any>)
                      .filter(([, v]) => typeof v === "number")
                      .map(([k, v]) => (
                        <div key={k} className="border rounded-md p-2">
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.replace(/_/g, " ")}</div>
                          <div className={cn("text-2xl font-semibold", scoreColor(Number(v)))}>{v as number}</div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No AI review yet. Click <b>AI Review</b> to score this item.</p>
                )}
                {Array.isArray((item.scores as Any)?.suggestions) && (
                  <Card className="p-3">
                    <div className="text-xs font-semibold mb-1">Suggestions</div>
                    <ul className="text-sm space-y-1">
                      {((item.scores as Any).suggestions as string[]).map((s, i) => <li key={i}>· {s}</li>)}
                    </ul>
                  </Card>
                )}
              </div>
            )}

            {tab === "comments" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  {(data?.comments ?? []).map((c: Any) => (
                    <div key={c.id} className="border rounded-md p-2">
                      <div className="text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(c.created_at))} ago</div>
                      <div className="text-sm mt-1 whitespace-pre-wrap">{c.body}</div>
                    </div>
                  ))}
                  {(data?.comments ?? []).length === 0 && <div className="text-sm text-muted-foreground">No comments yet.</div>}
                </div>
                <Textarea rows={3} value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Leave a comment. Use @ to mention." />
                <Button size="sm" onClick={() => mComment.mutate()} disabled={!newComment.trim() || mComment.isPending}>
                  <MessageSquare className="size-4 mr-1" /> Post
                </Button>
              </div>
            )}

            {tab === "history" && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2"><History className="size-3" /> Versions</h4>
                  <div className="space-y-1">
                    {(data?.versions ?? []).map((v: Any) => (
                      <div key={v.id} className="flex items-center justify-between border rounded-md p-2 text-sm">
                        <div>
                          <div>v{v.version} {v.note && <span className="text-muted-foreground">— {v.note}</span>}</div>
                          <div className="text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(v.created_at))} ago</div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => mRestore.mutate(v.id)}>
                          <RefreshCw className="size-3.5 mr-1" /> Restore
                        </Button>
                      </div>
                    ))}
                    {(data?.versions ?? []).length === 0 && <div className="text-sm text-muted-foreground">No prior versions.</div>}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Activity</h4>
                  <div className="space-y-1">
                    {(data?.activity ?? []).map((a: Any) => (
                      <div key={a.id} className="text-sm flex justify-between border-b border-border/40 py-1">
                        <span className="capitalize">{a.event}</span>
                        <span className="text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(a.created_at))} ago</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ScoreTile({ label, v }: { label: string; v: number | null }) {
  return (
    <div className="border rounded-md p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("text-2xl font-semibold", scoreColor(v))}>{v ?? "—"}</div>
    </div>
  );
}

function platformCharLimit(p: string): number | null {
  switch (p) {
    case "X": return 280;
    case "Threads": return 500;
    case "LinkedIn": return 3000;
    case "Instagram": return 2200;
    case "Facebook": return 63206;
    default: return null;
  }
}

function PlatformPreview({ item }: { item: Item }) {
  const p = item.platform;
  const body = item.body || item.preview || "";
  const tags = (item.hashtags ?? []).map((h) => (h.startsWith("#") ? h : `#${h}`));
  if (p === "Instagram" || p === "Facebook" || p === "Threads") {
    return (
      <Card className="p-4 max-w-md mx-auto">
        <div className="flex items-center gap-2 mb-3">
          <div className="size-8 rounded-full bg-gradient-to-br from-pink-500 to-orange-400" />
          <div>
            <div className="text-sm font-semibold">your.brand</div>
            <div className="text-[11px] text-muted-foreground">Sponsored · {p}</div>
          </div>
        </div>
        <div className="aspect-square rounded-md bg-gradient-to-br from-muted to-background border grid place-items-center text-muted-foreground text-xs">
          [Media placeholder — planning only]
        </div>
        <div className="text-sm mt-3 whitespace-pre-wrap">{body}</div>
        <div className="text-xs text-primary mt-2">{tags.join(" ")}</div>
        {item.cta && <div className="mt-2 text-xs font-medium">CTA: {item.cta}</div>}
      </Card>
    );
  }
  if (p === "LinkedIn") {
    return (
      <Card className="p-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-3">
          <div className="size-10 rounded-full bg-sky-600" />
          <div>
            <div className="text-sm font-semibold">Your Brand</div>
            <div className="text-[11px] text-muted-foreground">EdTech · Promoted</div>
          </div>
        </div>
        <div className="text-sm whitespace-pre-wrap leading-relaxed">{body}</div>
        <div className="text-xs text-primary mt-3">{tags.join(" ")}</div>
      </Card>
    );
  }
  if (p === "X") {
    return (
      <Card className="p-4 max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-full bg-foreground/80" />
          <div className="flex-1">
            <div className="text-sm"><b>Your Brand</b> <span className="text-muted-foreground">@yourbrand</span></div>
            <div className="text-sm mt-1 whitespace-pre-wrap">{body}</div>
            <div className="text-xs text-primary mt-2">{tags.join(" ")}</div>
          </div>
        </div>
      </Card>
    );
  }
  if (p === "Blog") {
    return (
      <Card className="p-6 max-w-3xl mx-auto prose prose-sm">
        <h1 className="text-2xl font-semibold">{item.title}</h1>
        <div className="text-xs text-muted-foreground">Preview</div>
        <div className="mt-4 whitespace-pre-wrap text-sm">{body}</div>
      </Card>
    );
  }
  return (
    <Card className="p-4 whitespace-pre-wrap text-sm">{body}</Card>
  );
}
