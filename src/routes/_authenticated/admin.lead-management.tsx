import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  Users, UserPlus, Upload, RefreshCw, ShieldCheck, AlertTriangle, CheckCircle2,
  Loader2, Sparkles, Filter, Search, ChevronRight, History, Repeat, Settings2, BarChart3,
} from "lucide-react";
import {
  addAdminLead, assignLeadsEqualDistribution, assignLeadsManual, assignLeadsRoundRobin,
  bulkImportAdminLeads, getAdminLeadMetrics, getAllocationAnalytics, getLeadAssignmentHistory,
  getRoundRobinSettings, listAdminGlintrLeads, listAssignablePartners, listPrograms,
  reassignLead, saveRoundRobinSettings, unassignLead,
} from "@/lib/admin/lead-management.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/lead-management")({
  component: LeadManagementPage,
});

type TabKey = "overview" | "add" | "upload" | "roundrobin" | "analytics";

function LeadManagementPage() {
  const [tab, setTab] = useState<TabKey>("overview");
  return (
    <div className="space-y-6 max-w-[1600px]">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-primary/80">Sales Operations</div>
        <h1 className="text-2xl lg:text-3xl font-display font-semibold tracking-tight mt-1">Glintr Lead Management</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Add, import and allocate Glintr-provided leads. These leads use the <b>50% revenue share</b> after a verified sale.
        </p>
      </header>

      <div className="inline-flex rounded-xl border bg-white p-1 flex-wrap gap-1">
        <Tab k="overview" cur={tab} set={setTab} icon={<Users className="size-4"/>}>Leads</Tab>
        <Tab k="add" cur={tab} set={setTab} icon={<UserPlus className="size-4"/>}>Add Lead</Tab>
        <Tab k="upload" cur={tab} set={setTab} icon={<Upload className="size-4"/>}>Bulk Upload</Tab>
        <Tab k="roundrobin" cur={tab} set={setTab} icon={<Repeat className="size-4"/>}>Round-Robin</Tab>
        <Tab k="analytics" cur={tab} set={setTab} icon={<BarChart3 className="size-4"/>}>Analytics</Tab>
      </div>

      {tab === "overview" && <OverviewTab />}
      {tab === "add" && <AddLeadTab />}
      {tab === "upload" && <UploadTab />}
      {tab === "roundrobin" && <RoundRobinTab />}
      {tab === "analytics" && <AnalyticsTab />}
    </div>
  );
}

function Tab({ k, cur, set, icon, children }: any) {
  const active = cur === k;
  return (
    <button
      onClick={() => set(k)}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >{icon}{children}</button>
  );
}

// ─────────────────────────── Overview ───────────────────────────

const FILTERS = [
  { k: "all", label: "All" },
  { k: "unassigned", label: "Unassigned" },
  { k: "assigned", label: "Assigned" },
  { k: "new", label: "New" },
  { k: "no_answer", label: "No Answer" },
  { k: "follow_up", label: "Follow-Up" },
  { k: "interested", label: "Interested" },
  { k: "payment_pending", label: "Payment Pending" },
  { k: "converted", label: "Converted" },
] as const;

function OverviewTab() {
  const metricsFn = useServerFn(getAdminLeadMetrics);
  const listFn = useServerFn(listAdminGlintrLeads);
  const programsFn = useServerFn(listPrograms);

  const { data: metrics } = useQuery({ queryKey: ["glintr-lead-metrics"], queryFn: () => metricsFn() });
  const { data: programs = [] } = useQuery({ queryKey: ["admin-programs-select"], queryFn: () => programsFn() });

  const [filter, setFilter] = useState<any>("all");
  const [search, setSearch] = useState("");
  const [programId, setProgramId] = useState<string | undefined>();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: leads = [], isLoading, refetch } = useQuery({
    queryKey: ["glintr-leads", filter, search, programId],
    queryFn: () => listFn({ data: { filter, search: search || null, program_id: programId ?? null } as any }),
  });

  const [assignDialog, setAssignDialog] = useState<{ mode: "single" | "bulk"; leadIds: string[] } | null>(null);
  const [reassignDialog, setReassignDialog] = useState<{ leadId: string; currentPartnerId?: string | null } | null>(null);
  const [historyDialog, setHistoryDialog] = useState<string | null>(null);
  const [unassignPending, setUnassignPending] = useState<string | null>(null);

  const unassignFn = useServerFn(unassignLead);
  const unassignMutation = useMutation({
    mutationFn: (leadId: string) => unassignFn({ data: { lead_id: leadId, reason: null } }),
    onSuccess: () => { refetch(); setUnassignPending(null); },
  });

  function toggle(id: string) {
    const n = new Set(selected);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelected(n);
  }
  function toggleAll() {
    if (selected.size === leads.length) setSelected(new Set());
    else setSelected(new Set(leads.map((l: any) => l.id)));
  }

  const m = metrics ?? {} as any;

  return (
    <div className="space-y-5">
      {/* Metrics */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-5 xl:grid-cols-10">
        <Metric label="Total" value={m.total} tone="primary" />
        <Metric label="Unassigned" value={m.unassigned} tone="amber" />
        <Metric label="Assigned" value={m.assigned} tone="emerald" />
        <Metric label="New" value={m.new} />
        <Metric label="Contacted" value={m.contacted} />
        <Metric label="No Answer" value={m.no_answer} />
        <Metric label="Follow-Up" value={m.follow_up} />
        <Metric label="Interested" value={m.interested} />
        <Metric label="Payment Pending" value={m.payment_pending} />
        <Metric label="Converted" value={m.converted} tone="emerald" />
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border/70 bg-white p-3 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button key={f.k} onClick={() => setFilter(f.k)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                filter === f.k ? "bg-primary text-primary-foreground border-primary" : "bg-white text-muted-foreground border-border hover:text-foreground",
              )}>{f.label}</button>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" placeholder="Search name, mobile, email, program, partner ID (GLINTR-…)" />
          </div>
          <Select value={programId ?? "all"} onValueChange={(v) => setProgramId(v === "all" ? undefined : v)}>
            <SelectTrigger><SelectValue placeholder="Program" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All programs</SelectItem>
              {programs.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="size-3.5" /> Refresh
            </Button>
          </div>
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-3 rounded-lg bg-primary/5 border border-primary/20 px-4 py-2.5">
            <span className="text-sm font-medium">{selected.size} selected</span>
            <div className="flex-1" />
            <Button size="sm" onClick={() => setAssignDialog({ mode: "bulk", leadIds: Array.from(selected) })}>
              <Sparkles className="size-3.5" /> Bulk Assign
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSelected(new Set())}>Clear</Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/70 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={leads.length > 0 && selected.size === leads.length} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead>Lead</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Assigned Partner</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>}
            {!isLoading && leads.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No Glintr-provided leads match your filters.</TableCell></TableRow>}
            {leads.map((l: any) => (
              <TableRow key={l.id} className={selected.has(l.id) ? "bg-primary/5" : ""}>
                <TableCell>
                  <Checkbox checked={selected.has(l.id)} onCheckedChange={() => toggle(l.id)} />
                </TableCell>
                <TableCell>
                  <div className="font-medium">{l.full_name}</div>
                  <div className="text-[11px] text-muted-foreground">{l.mobile}{l.email ? ` · ${l.email}` : ""}</div>
                </TableCell>
                <TableCell className="text-sm">{l.course?.name ?? l.program_interest ?? "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <div>{l.source}</div>
                  {l.campaign_source && <div className="text-[10px]">{l.campaign_source}</div>}
                </TableCell>
                <TableCell className="text-sm">
                  {l.assigned ? (
                    <div>
                      <div className="font-medium">{l.assigned.display_name}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">{l.assigned.referral_code}</div>
                    </div>
                  ) : <span className="text-muted-foreground italic">Unassigned</span>}
                </TableCell>
                <TableCell><Badge variant="outline">{String(l.status).replaceAll("_", " ")}</Badge></TableCell>
                <TableCell className="text-[11px] text-muted-foreground">{l.assignment_method ?? "—"}</TableCell>
                <TableCell className="text-[11px] text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right space-x-1">
                  {!l.assigned_partner_id ? (
                    <Button size="sm" variant="outline" onClick={() => setAssignDialog({ mode: "single", leadIds: [l.id] })}>Assign</Button>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setReassignDialog({ leadId: l.id, currentPartnerId: l.assigned_partner_id })}>Reassign</Button>
                      <Button size="sm" variant="ghost" onClick={() => setUnassignPending(l.id)}>Unassign</Button>
                    </>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setHistoryDialog(l.id)}><History className="size-3.5" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {assignDialog && (
        <AssignDialog
          mode={assignDialog.mode}
          leadIds={assignDialog.leadIds}
          onClose={() => setAssignDialog(null)}
          onDone={() => { setAssignDialog(null); setSelected(new Set()); refetch(); }}
        />
      )}
      {reassignDialog && (
        <ReassignDialog
          leadId={reassignDialog.leadId}
          onClose={() => setReassignDialog(null)}
          onDone={() => { setReassignDialog(null); refetch(); }}
        />
      )}
      {historyDialog && (
        <HistoryDialog leadId={historyDialog} onClose={() => setHistoryDialog(null)} />
      )}
      <Dialog open={!!unassignPending} onOpenChange={(o) => !o && setUnassignPending(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Unassign lead?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">The Sales Partner will lose access to this lead. Assignment history is preserved.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnassignPending(null)}>Cancel</Button>
            <Button variant="destructive" disabled={unassignMutation.isPending} onClick={() => unassignMutation.mutate(unassignPending!)}>
              {unassignMutation.isPending ? <Loader2 className="size-4 animate-spin"/> : null} Unassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value?: number; tone?: "primary" | "emerald" | "amber" }) {
  const cls = tone === "primary" ? "text-primary" : tone === "emerald" ? "text-emerald-600" : tone === "amber" ? "text-amber-600" : "text-foreground";
  return (
    <div className="rounded-xl border border-border/70 bg-white p-4">
      <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-2xl font-display font-semibold tabular-nums", cls)}>{value ?? "—"}</div>
    </div>
  );
}

// ─────────────────────────── Add Lead ───────────────────────────

const SOURCES = [
  "personal_network","referral","social_media","whatsapp","instagram","linkedin",
  "website","event","college_network","other",
];

function AddLeadTab() {
  const addFn = useServerFn(addAdminLead);
  const programsFn = useServerFn(listPrograms);
  const { data: programs = [] } = useQuery({ queryKey: ["admin-programs-select"], queryFn: () => programsFn() });

  const [form, setForm] = useState({
    full_name: "", mobile: "", email: "", course_id: "",
    source: "other", campaign_source: "", notes: "",
  });
  const [result, setResult] = useState<{ kind: "ok" | "dup" | "err"; msg?: string } | null>(null);

  const mutation = useMutation({
    mutationFn: async () => addFn({
      data: {
        full_name: form.full_name.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim() || null,
        course_id: form.course_id || null,
        program_interest: null,
        source: form.source as any,
        campaign_source: form.campaign_source.trim() || null,
        notes: form.notes.trim() || null,
      },
    }),
    onSuccess: (r: any) => {
      if (r.status === "duplicate") setResult({ kind: "dup", msg: r.message });
      else {
        setResult({ kind: "ok" });
        setForm({ full_name: "", mobile: "", email: "", course_id: "", source: "other", campaign_source: "", notes: "" });
      }
    },
    onError: (e: any) => setResult({ kind: "err", msg: e?.message }),
  });

  const canSubmit = form.full_name.trim().length >= 2 && form.mobile.replace(/\D/g,"").length >= 6;

  return (
    <div className="rounded-2xl border bg-white p-6 lg:p-8 max-w-4xl">
      <div className="mb-4 rounded-lg bg-primary/5 border border-primary/20 px-4 py-2.5 text-xs text-primary/90 flex items-center gap-2">
        <ShieldCheck className="size-4" /> Ownership set to <b>Glintr Provided</b> — verified sale earns partner <b>50% revenue share</b>.
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Lead Name" required>
          <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Full name" />
        </Field>
        <Field label="Mobile Number" required>
          <Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="10-digit mobile" inputMode="tel" />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@example.com" />
        </Field>
        <Field label="Interested Program">
          <Select value={form.course_id} onValueChange={(v) => setForm({ ...form, course_id: v })}>
            <SelectTrigger><SelectValue placeholder="Select a program" /></SelectTrigger>
            <SelectContent>
              {programs.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Lead Source">
          <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SOURCES.map((s) => <SelectItem key={s} value={s}>{s.replaceAll("_"," ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Campaign Source">
          <Input value={form.campaign_source} onChange={(e) => setForm({ ...form, campaign_source: e.target.value })} placeholder="e.g. Meta Ads – April Q1" />
        </Field>
        <Field label="Notes" className="md:col-span-2">
          <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Context, interest level, best call window…" />
        </Field>
      </div>

      {result?.kind === "dup" && <Alert tone="amber" icon={<AlertTriangle className="size-4" />} title="Possible Duplicate Lead" body={result.msg} />}
      {result?.kind === "ok" && <Alert tone="emerald" icon={<CheckCircle2 className="size-4" />} title="Lead added" body="You can now assign it to a Sales Partner." />}
      {result?.kind === "err" && <Alert tone="red" icon={<AlertTriangle className="size-4" />} title="Failed" body={result.msg} />}

      <div className="mt-6">
        <Button onClick={() => { setResult(null); mutation.mutate(); }} disabled={!canSubmit || mutation.isPending}>
          {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
          Add Glintr Lead
        </Button>
      </div>
    </div>
  );
}

function Field({ label, required, className, children }: any) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-sm">{label} {required && <span className="text-red-500">*</span>}</Label>
      {children}
    </div>
  );
}
function Alert({ tone, icon, title, body }: any) {
  const map: any = {
    amber: "border-amber-300 bg-amber-50 text-amber-900",
    emerald: "border-emerald-300 bg-emerald-50 text-emerald-900",
    red: "border-red-300 bg-red-50 text-red-900",
  };
  return (
    <div className={cn("mt-6 flex items-start gap-3 rounded-xl border p-4", map[tone])}>
      {icon}<div><div className="font-semibold">{title}</div>{body && <div className="text-sm mt-0.5">{body}</div>}</div>
    </div>
  );
}

// ─────────────────────────── Bulk Upload ───────────────────────────

const HEADER_MAP: Record<string, string> = {
  "lead name": "full_name", name: "full_name", "full name": "full_name",
  "mobile number": "mobile", mobile: "mobile", phone: "mobile",
  email: "email",
  "interested program": "program_interest", program: "program_interest", course: "program_interest",
  "lead source": "source", source: "source",
  "campaign source": "campaign_source", campaign: "campaign_source",
  notes: "notes", note: "notes",
};

function normalizePhone(v: string) {
  const d = (v ?? "").toString().replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) return d.slice(2);
  if (d.length === 11 && d.startsWith("0")) return d.slice(1);
  return d;
}
function mapRow(raw: Record<string, any>): any {
  const out: any = {};
  for (const [k, v] of Object.entries(raw)) {
    const key = HEADER_MAP[k.trim().toLowerCase()];
    if (key) out[key] = v == null ? "" : String(v).trim();
  }
  return out;
}

function UploadTab() {
  const uploadFn = useServerFn(bulkImportAdminLeads);
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<any[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [postAssignChoice, setPostAssignChoice] = useState<"none" | "roundrobin">("roundrobin");

  const rrFn = useServerFn(assignLeadsRoundRobin);

  const stats = useMemo(() => {
    if (!rows) return null;
    const seen = new Set<string>();
    let invalid = 0, dup = 0;
    for (const r of rows) {
      const norm = normalizePhone(r.mobile ?? "");
      if (!r.full_name || norm.length < 6) { r._issue = "invalid"; invalid++; continue; }
      if (seen.has(norm)) { r._issue = "duplicate"; dup++; continue; }
      seen.add(norm); r._issue = null;
    }
    return { total: rows.length, valid: rows.length - invalid - dup, duplicates: dup, invalid };
  }, [rows]);

  async function handleFile(file: File) {
    setParseError(null); setResult(null); setFileName(file.name);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      let raw: any[] = [];
      if (ext === "csv") {
        const t = await file.text();
        raw = Papa.parse<any>(t, { header: true, skipEmptyLines: true }).data;
      } else if (ext === "xlsx" || ext === "xls") {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
      } else throw new Error("Unsupported file. Upload CSV or XLSX.");
      setRows(raw.map(mapRow));
    } catch (e: any) { setParseError(e?.message ?? "Failed to parse"); setRows(null); }
  }

  const importMutation = useMutation({
    mutationFn: async () => {
      const valid = (rows ?? []).filter((r) => !r._issue);
      const res: any = await uploadFn({ data: { leads: valid } });
      if (postAssignChoice === "roundrobin" && res.inserted_ids?.length) {
        try {
          const rr: any = await rrFn({ data: { lead_ids: res.inserted_ids } });
          res.round_robin_assigned = rr.assigned;
        } catch (e: any) { res.round_robin_error = e?.message; }
      }
      return res;
    },
    onSuccess: (r) => { setResult(r); setRows(null); setFileName(null); if (inputRef.current) inputRef.current.value = ""; },
  });

  if (result) {
    return (
      <div className="rounded-2xl border bg-white p-8 text-center max-w-2xl">
        <div className="mx-auto inline-flex size-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="size-6" />
        </div>
        <h2 className="mt-4 text-xl font-display font-semibold">Import complete</h2>
        <p className="mt-1 text-muted-foreground">{result.added} leads added.</p>
        <div className="mt-3 flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <span>Duplicates: {result.duplicates}</span><span>·</span>
          <span>Invalid: {result.invalid}</span>
          {result.round_robin_assigned != null && <><span>·</span><span>Round-robin assigned: {result.round_robin_assigned}</span></>}
        </div>
        {result.round_robin_error && <div className="mt-3 text-sm text-amber-700">Round-robin skipped: {result.round_robin_error}</div>}
        <Button className="mt-6" onClick={() => setResult(null)}>Upload another file</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="rounded-2xl border bg-white p-6">
        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 py-10 cursor-pointer">
          <Upload className="size-6 text-primary" />
          <div className="font-medium">Drop CSV / XLSX or click to browse</div>
          <div className="text-xs text-muted-foreground">Columns: Lead Name, Mobile Number, Email, Interested Program, Lead Source, Campaign Source, Notes</div>
          <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </label>
        {fileName && <div className="mt-3 text-sm text-muted-foreground">Selected: <b>{fileName}</b></div>}
        {parseError && <Alert tone="red" icon={<AlertTriangle className="size-4"/>} title="Parse error" body={parseError} />}
      </div>

      {stats && (
        <div className="rounded-2xl border bg-white p-6">
          <h3 className="font-display font-semibold">Validation Summary</h3>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4 mt-3">
            <Metric label="Total Rows" value={stats.total} />
            <Metric label="Valid Leads" value={stats.valid} tone="emerald" />
            <Metric label="Duplicates" value={stats.duplicates} tone="amber" />
            <Metric label="Invalid Rows" value={stats.invalid} tone="amber" />
          </div>

          <div className="mt-4 rounded-lg bg-surface-2/50 border border-border/60 p-4 text-sm">
            <div className="font-medium mb-2">After import</div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="radio" checked={postAssignChoice === "roundrobin"} onChange={() => setPostAssignChoice("roundrobin")} />
              <span>Auto-assign new leads via <b>Round-Robin</b></span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer mt-1">
              <input type="radio" checked={postAssignChoice === "none"} onChange={() => setPostAssignChoice("none")} />
              <span>Keep as <b>Unassigned</b> (allocate later)</span>
            </label>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Button disabled={stats.valid === 0 || importMutation.isPending} onClick={() => importMutation.mutate()}>
              {importMutation.isPending ? <Loader2 className="size-4 animate-spin"/> : <ShieldCheck className="size-4"/>}
              Confirm Import — {stats.valid} leads
            </Button>
            <Button variant="ghost" onClick={() => { setRows(null); setFileName(null); if (inputRef.current) inputRef.current.value = ""; }}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── Assign / Reassign / History Dialogs ───────────────────────────

function AssignDialog({ mode, leadIds, onClose, onDone }: { mode: "single" | "bulk"; leadIds: string[]; onClose: () => void; onDone: () => void }) {
  const [method, setMethod] = useState<"manual" | "equal" | "roundrobin">(mode === "single" ? "manual" : "manual");
  const [search, setSearch] = useState("");
  const [workModel, setWorkModel] = useState<"any" | "flexible" | "full_time">("any");
  const [verifiedBrandOnly, setVerifiedBrandOnly] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [selectedPartnerSet, setSelectedPartnerSet] = useState<Set<string>>(new Set());

  const partnersFn = useServerFn(listAssignablePartners);
  const { data: partners = [] } = useQuery({
    queryKey: ["assignable-partners", search, workModel, verifiedBrandOnly],
    queryFn: () => partnersFn({ data: { search: search || null, work_model: workModel, verified_brand_only: verifiedBrandOnly } as any }),
  });

  const manualFn = useServerFn(assignLeadsManual);
  const equalFn = useServerFn(assignLeadsEqualDistribution);
  const rrFn = useServerFn(assignLeadsRoundRobin);

  const mutation = useMutation({
    mutationFn: async () => {
      if (method === "manual") {
        if (!selectedPartner) throw new Error("Select a partner");
        return manualFn({ data: { lead_ids: leadIds, partner_id: selectedPartner } });
      }
      if (method === "equal") {
        const ids = Array.from(selectedPartnerSet);
        if (!ids.length) throw new Error("Select at least one partner");
        return equalFn({ data: { lead_ids: leadIds, partner_ids: ids } });
      }
      return rrFn({ data: { lead_ids: leadIds } });
    },
    onSuccess: onDone,
  });

  function togglePartner(id: string) {
    const n = new Set(selectedPartnerSet); n.has(id) ? n.delete(id) : n.add(id); setSelectedPartnerSet(n);
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Assign {leadIds.length} lead{leadIds.length>1?"s":""}</DialogTitle></DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <MethodChip active={method === "manual"} onClick={() => setMethod("manual")} label="Manual" hint={leadIds.length > 1 ? "One partner for all" : "Choose partner"} />
            {leadIds.length > 1 && <MethodChip active={method === "equal"} onClick={() => setMethod("equal")} label="Equal Distribution" hint="Split across selected partners" />}
            {leadIds.length > 1 && <MethodChip active={method === "roundrobin"} onClick={() => setMethod("roundrobin")} label="Round-Robin" hint="Uses saved rotation" />}
          </div>

          {method !== "roundrobin" && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" placeholder="Search name or Sales Partner ID" />
                </div>
                <Select value={workModel} onValueChange={(v) => setWorkModel(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any work model</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                    <SelectItem value="full_time">Full-Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={verifiedBrandOnly} onCheckedChange={(v) => setVerifiedBrandOnly(!!v)} /> Verified Brand Partners only
              </label>

              <div className="max-h-72 overflow-y-auto rounded-lg border">
                {partners.length === 0 && <div className="p-4 text-sm text-muted-foreground text-center">No active partners.</div>}
                {partners.map((p: any) => {
                  const active = method === "manual" ? selectedPartner === p.id : selectedPartnerSet.has(p.id);
                  return (
                    <button key={p.id}
                      onClick={() => method === "manual" ? setSelectedPartner(p.id) : togglePartner(p.id)}
                      className={cn("w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-primary/5 border-b last:border-b-0", active && "bg-primary/10")}>
                      <div>
                        <div className="text-sm font-medium">{p.display_name}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">{p.referral_code} · {p.work_model}</div>
                      </div>
                      {active && <CheckCircle2 className="size-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {method === "roundrobin" && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 text-sm">
              <div className="font-medium mb-1 flex items-center gap-2"><Repeat className="size-4"/> Round-robin allocation</div>
              <div className="text-muted-foreground">Leads will be assigned in sequence using the Round-Robin Settings. Continues from the last cursor position.</div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <ChevronRight className="size-4" />}
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MethodChip({ active, onClick, label, hint }: any) {
  return (
    <button onClick={onClick} className={cn(
      "text-left rounded-lg border px-3 py-2 transition-colors",
      active ? "border-primary bg-primary/10" : "hover:bg-surface-2/60",
    )}>
      <div className="text-sm font-medium">{label}</div>
      <div className="text-[10px] text-muted-foreground">{hint}</div>
    </button>
  );
}

function ReassignDialog({ leadId, onClose, onDone }: { leadId: string; onClose: () => void; onDone: () => void }) {
  const [search, setSearch] = useState("");
  const [reason, setReason] = useState("");
  const [partnerId, setPartnerId] = useState<string | null>(null);

  const partnersFn = useServerFn(listAssignablePartners);
  const { data: partners = [] } = useQuery({
    queryKey: ["reassign-partners", search],
    queryFn: () => partnersFn({ data: { search: search || null, work_model: "any", verified_brand_only: false } as any }),
  });
  const reassignFn = useServerFn(reassignLead);
  const mutation = useMutation({
    mutationFn: () => reassignFn({ data: { lead_id: leadId, new_partner_id: partnerId!, reason } }),
    onSuccess: onDone,
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Reassign lead</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="mb-1 block text-xs">Reason (required)</Label>
            <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Original partner unresponsive for 5 days" />
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search partners" />
          </div>
          <div className="max-h-64 overflow-y-auto rounded-lg border">
            {partners.map((p: any) => (
              <button key={p.id} onClick={() => setPartnerId(p.id)}
                className={cn("w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-primary/5 border-b last:border-b-0", partnerId === p.id && "bg-primary/10")}>
                <div>
                  <div className="text-sm font-medium">{p.display_name}</div>
                  <div className="text-[10px] font-mono text-muted-foreground">{p.referral_code} · {p.work_model}</div>
                </div>
                {partnerId === p.id && <CheckCircle2 className="size-4 text-primary" />}
              </button>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!partnerId || reason.trim().length < 3 || mutation.isPending}>
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null} Reassign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HistoryDialog({ leadId, onClose }: { leadId: string; onClose: () => void }) {
  const fn = useServerFn(getLeadAssignmentHistory);
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["lead-history", leadId],
    queryFn: () => fn({ data: { lead_id: leadId } }),
  });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Assignment History</DialogTitle></DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto space-y-3">
          {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
          {!isLoading && rows.length === 0 && <div className="text-sm text-muted-foreground">No history.</div>}
          {rows.map((r: any) => (
            <div key={r.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="uppercase font-mono">{r.action}{r.method ? ` · ${r.method}` : ""}</span>
                <span>{new Date(r.created_at).toLocaleString()}</span>
              </div>
              <div className="mt-1 text-sm">
                {r.from_partner ? <><b>{r.from_partner.display_name}</b> ({r.from_partner.referral_code}) → </> : null}
                {r.to_partner ? <><b>{r.to_partner.display_name}</b> ({r.to_partner.referral_code})</> : <i className="text-muted-foreground">Unassigned</i>}
              </div>
              {r.reason && <div className="mt-1 text-xs text-muted-foreground">Reason: {r.reason}</div>}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────── Round-Robin Settings ───────────────────────────

function RoundRobinTab() {
  const settingsFn = useServerFn(getRoundRobinSettings);
  const saveFn = useServerFn(saveRoundRobinSettings);
  const partnersFn = useServerFn(listAssignablePartners);
  const qc = useQueryClient();

  const { data: settings } = useQuery({ queryKey: ["rr-settings"], queryFn: () => settingsFn() });
  const [search, setSearch] = useState("");
  const { data: partners = [] } = useQuery({
    queryKey: ["rr-partners", search],
    queryFn: () => partnersFn({ data: { search: search || null, work_model: "any", verified_brand_only: false } as any }),
  });

  const [isActive, setIsActive] = useState(true);
  const [flexible, setFlexible] = useState(true);
  const [fullTime, setFullTime] = useState(true);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Sync form once settings arrives
  useMemo(() => {
    if (!settings) return;
    setIsActive(settings.is_active);
    const wm = settings.eligible_work_models ?? [];
    setFlexible(wm.includes("flexible"));
    setFullTime(wm.includes("full_time"));
    setVerifiedOnly(settings.require_verified_brand);
    setSelected(new Set(settings.selected_partner_ids ?? []));
  }, [settings]);

  const mutation = useMutation({
    mutationFn: () => saveFn({ data: {
      is_active: isActive,
      eligible_work_models: [flexible && "flexible", fullTime && "full_time"].filter(Boolean) as any,
      require_verified_brand: verifiedOnly,
      selected_partner_ids: Array.from(selected),
    }}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rr-settings"] }),
  });

  function toggle(id: string) {
    const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2 max-w-6xl">
      <div className="rounded-2xl border bg-white p-6 space-y-4">
        <h3 className="font-display font-semibold flex items-center gap-2"><Settings2 className="size-4"/> Round-Robin Settings</h3>

        <label className="flex items-center gap-2"><Checkbox checked={isActive} onCheckedChange={(v) => setIsActive(!!v)} /> <span className="text-sm font-medium">Round-Robin is Active</span></label>

        <div>
          <div className="text-xs font-medium mb-2">Eligible Work Models</div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={flexible} onCheckedChange={(v) => setFlexible(!!v)} /> Flexible Sales Partners</label>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={fullTime} onCheckedChange={(v) => setFullTime(!!v)} /> Full-Time Sales Professionals</label>
          </div>
        </div>

        <label className="flex items-center gap-2"><Checkbox checked={verifiedOnly} onCheckedChange={(v) => setVerifiedOnly(!!v)} /> <span className="text-sm">Require Verified Brand Partners only</span></label>

        <div className="text-xs text-muted-foreground border-t pt-3">
          Current cursor: <span className="font-mono">{settings?.last_partner_id ?? "—"}</span>. Suspended / inactive / rejected accounts are never included.
        </div>

        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="size-4 animate-spin"/> : <ShieldCheck className="size-4"/>} Save Settings
        </Button>
      </div>

      <div className="rounded-2xl border bg-white p-6 space-y-3">
        <h3 className="font-display font-semibold">Selected Sales Partners ({selected.size})</h3>
        <p className="text-xs text-muted-foreground">If none selected, rotation uses all active partners matching the eligible work models above.</p>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search partners" />
        </div>
        <div className="max-h-96 overflow-y-auto rounded-lg border">
          {partners.map((p: any) => {
            const active = selected.has(p.id);
            return (
              <button key={p.id} onClick={() => toggle(p.id)}
                className={cn("w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-primary/5 border-b last:border-b-0", active && "bg-primary/10")}>
                <div>
                  <div className="text-sm font-medium">{p.display_name}</div>
                  <div className="text-[10px] font-mono text-muted-foreground">{p.referral_code} · {p.work_model}</div>
                </div>
                {active && <CheckCircle2 className="size-4 text-primary" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────── Analytics ───────────────────────────

function AnalyticsTab() {
  const fn = useServerFn(getAllocationAnalytics);
  const { data } = useQuery({ queryKey: ["allocation-analytics"], queryFn: () => fn() });
  if (!data) return <div className="text-sm text-muted-foreground">Loading…</div>;
  const a = data as any;
  return (
    <div className="space-y-5 max-w-6xl">
      <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
        <Metric label="Total Glintr Leads" value={a.total} tone="primary" />
        <Metric label="Unassigned" value={a.unassigned} tone="amber" />
        <Metric label="Assigned" value={a.assigned} tone="emerald" />
        <Metric label="Converted" value={a.converted} tone="emerald" />
        <div className="rounded-xl border border-border/70 bg-white p-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">Conv. Rate</div>
          <div className="mt-1 text-2xl font-display font-semibold tabular-nums text-primary">{(a.conversion_rate * 100).toFixed(1)}%</div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6">
          <h3 className="font-display font-semibold mb-3">Leads Assigned Per Sales Partner</h3>
          <div className="text-xs text-muted-foreground mb-3">Avg per active partner: <b>{a.avg_leads_per_active_partner.toFixed(1)}</b></div>
          <div className="space-y-2">
            {a.per_partner.length === 0 && <div className="text-sm text-muted-foreground">No assignments yet.</div>}
            {a.per_partner.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-[10px] font-mono text-muted-foreground">{p.ref}</div>
                </div>
                <div className="text-right">
                  <div className="tabular-nums font-semibold">{p.total}</div>
                  <div className="text-[10px] text-emerald-600">{p.converted} converted</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6">
          <h3 className="font-display font-semibold mb-3">Assignment Method Distribution</h3>
          <div className="space-y-2">
            {Object.entries(a.method_distribution).map(([k, v]: any) => (
              <div key={k} className="flex items-center justify-between text-sm">
                <span className="font-mono text-xs uppercase">{k}</span>
                <span className="tabular-nums font-semibold">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
