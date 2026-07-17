/**
 * Super-Admin Lead Management for the unified platform lead-capture system.
 * Lists all leads from `platform_leads` with filters, status updates, notes,
 * counsellor assignment, CSV export and lightweight analytics.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Loader2, Search } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin/platform-leads")({
  component: PlatformLeadsPage,
  head: () => ({
    meta: [{ title: "Lead Management · Glintr Admin" }],
  }),
});

type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost";

interface LeadRow {
  id: string;
  created_at: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  interested_course: string | null;
  qualification: string | null;
  current_status: string | null;
  source: string;
  source_detail: string | null;
  campaign: string | null;
  page_path: string | null;
  status: LeadStatus;
  assigned_to: string | null;
  notes: string | null;
}

const STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "converted", "lost"];
const STATUS_COLORS: Record<LeadStatus, string> = {
  new: "bg-cyan-500/10 text-cyan-700 border-cyan-500/30",
  contacted: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  qualified: "bg-violet-500/10 text-violet-700 border-violet-500/30",
  converted: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  lost: "bg-slate-500/10 text-slate-700 border-slate-500/30",
};

function PlatformLeadsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [sourceFilter, setSourceFilter] = React.useState<string>("all");
  const [editing, setEditing] = React.useState<LeadRow | null>(null);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["platform-leads", search, statusFilter, sourceFilter],
    queryFn: async () => {
      let q = supabase
        .from("platform_leads")
        .select(
          "id,created_at,name,email,phone,interested_course,qualification,current_status,source,source_detail,campaign,page_path,status,assigned_to,notes",
        )
        .order("created_at", { ascending: false })
        .limit(500);
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      if (sourceFilter !== "all") q = q.eq("source", sourceFilter);
      if (search.trim()) {
        const s = `%${search.trim()}%`;
        q = q.or(`name.ilike.${s},email.ilike.${s},phone.ilike.${s},interested_course.ilike.${s}`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as LeadRow[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["platform-leads-stats"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [{ count: total }, { count: todayCount }, { data: byStatus }, { data: bySource }] = await Promise.all([
        supabase.from("platform_leads").select("id", { count: "exact", head: true }),
        supabase.from("platform_leads").select("id", { count: "exact", head: true }).gte("created_at", today.toISOString()),
        supabase.from("platform_leads").select("status"),
        supabase.from("platform_leads").select("source"),
      ]);
      const statusCounts: Record<string, number> = {};
      (byStatus ?? []).forEach((r: { status: string | null }) => {
        const k = r.status ?? "unknown";
        statusCounts[k] = (statusCounts[k] || 0) + 1;
      });
      const sourceCounts: Record<string, number> = {};
      (bySource ?? []).forEach((r: { source: string | null }) => {
        const k = r.source ?? "unknown";
        sourceCounts[k] = (sourceCounts[k] || 0) + 1;
      });
      return { total: total ?? 0, today: todayCount ?? 0, statusCounts, sourceCounts };
    },
  });

  const updateLead = useMutation({
    mutationFn: async (patch: Partial<LeadRow> & { id: string }) => {
      const { id, ...rest } = patch;
      const { error } = await supabase.from("platform_leads").update(rest as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lead updated");
      qc.invalidateQueries({ queryKey: ["platform-leads"] });
      qc.invalidateQueries({ queryKey: ["platform-leads-stats"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uniqueSources = React.useMemo(() => {
    const s = new Set<string>();
    leads.forEach((l) => l.source && s.add(l.source));
    return Array.from(s).sort();
  }, [leads]);

  function exportCsv() {
    const headers = [
      "id",
      "created_at",
      "name",
      "email",
      "phone",
      "interested_course",
      "qualification",
      "current_status",
      "source",
      "source_detail",
      "campaign",
      "page_path",
      "status",
      "notes",
    ] as const;
    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = [
      headers.join(","),
      ...leads.map((l) => headers.map((h) => escape((l as unknown as Record<string, unknown>)[h])).join(",")),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `glintr-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${leads.length} leads`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Lead Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All leads captured via GlintrAI, popups, brochures, exit-intent, consultations and CTAs.
          </p>
        </div>
        <Button onClick={exportCsv} variant="outline" className="gap-2">
          <Download className="size-4" /> Export CSV
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Kpi label="Total leads" value={stats?.total ?? 0} />
        <Kpi label="Today" value={stats?.today ?? 0} />
        <Kpi label="New" value={stats?.statusCounts?.new ?? 0} />
        <Kpi label="Converted" value={stats?.statusCounts?.converted ?? 0} />
      </div>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, phone, course…"
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {uniqueSources.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Name / Contact</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  <Loader2 className="mx-auto size-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No leads yet — they'll appear here as visitors submit forms across the site.
                </TableCell>
              </TableRow>
            ) : (
              leads.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(l.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{l.name || "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {l.email}
                      {l.phone ? ` · ${l.phone}` : ""}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{l.interested_course || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {l.source.replaceAll("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_COLORS[l.status]}`}
                    >
                      {l.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => setEditing(l)}>
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage lead</DialogTitle>
          </DialogHeader>
          {editing ? (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <div className="font-semibold">{editing.name || "Unnamed"}</div>
                <div className="text-xs text-muted-foreground">
                  {editing.email}
                  {editing.phone ? ` · ${editing.phone}` : ""}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {editing.interested_course ? `Course: ${editing.interested_course}` : "No course specified"}
                  {editing.qualification ? ` · ${editing.qualification}` : ""}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  Source: {editing.source} · Path: {editing.page_path || "—"}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </label>
                <Select
                  value={editing.status}
                  onValueChange={(v) => setEditing({ ...editing, status: v as LeadStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Counsellor (email or id)
                </label>
                <Input
                  value={editing.assigned_to ?? ""}
                  onChange={(e) => setEditing({ ...editing, assigned_to: e.target.value || null })}
                  placeholder="user id"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Notes
                </label>
                <Textarea
                  value={editing.notes ?? ""}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  rows={4}
                  placeholder="Call notes, next steps, objections…"
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                editing &&
                updateLead.mutate({
                  id: editing.id,
                  status: editing.status,
                  assigned_to: editing.assigned_to,
                  notes: editing.notes,
                })
              }
              disabled={updateLead.isPending}
            >
              {updateLead.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-black tracking-tight">{value.toLocaleString()}</p>
    </Card>
  );
}
