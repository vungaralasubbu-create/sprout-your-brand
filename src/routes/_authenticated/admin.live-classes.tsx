import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  getProviderStatus, connectProvider, disconnectProvider,
  listAdminSessions, createLiveSession, cancelLiveSession, listBatches, createBatch,
  getLiveAnalytics,
} from "@/lib/live-classes/live-classes.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Video, Plug, PlugZap, Calendar as CalendarIcon, Users, Radio, PlayCircle,
  ExternalLink, Copy, XCircle, ShieldCheck, Sparkles, Layers, ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/live-classes")({
  head: () => ({ meta: [{ title: "Live Classes — Glintr Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminLiveClassesPage,
});

type ProviderRow = {
  provider: string; is_connected: boolean;
  account_email: string | null; account_name: string | null;
  connected_at: string | null; expires_at: string | null; last_error: string | null;
};

function AdminLiveClassesPage() {
  const qc = useQueryClient();
  const statusFn = useServerFn(getProviderStatus);
  const sessionsFn = useServerFn(listAdminSessions);
  const batchesFn = useServerFn(listBatches);
  const analyticsFn = useServerFn(getLiveAnalytics);

  const status = useQuery({ queryKey: ["lc-status"], queryFn: () => statusFn() });
  const sessions = useQuery({ queryKey: ["lc-sessions"], queryFn: () => sessionsFn() });
  const batches = useQuery({ queryKey: ["lc-batches"], queryFn: () => batchesFn() });
  const analytics = useQuery({ queryKey: ["lc-analytics"], queryFn: () => analyticsFn() });

  const zoom = (status.data?.providers as ProviderRow[] | undefined)?.find((p) => p.provider === "zoom");
  const zoomConfigured = status.data?.env.zoomConfigured ?? false;

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <Radio className="h-3 w-3" /> Live Classes
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Zoom LMS — Command Center</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Connect Zoom, schedule classes and webinars, assign them to batches, and let the LMS handle join links, reminders, attendance and recordings.
        </p>
      </header>

      {/* Analytics */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={CalendarIcon} label="Total classes" value={analytics.data?.totalClasses ?? 0} />
        <Kpi icon={ShieldCheck} label="Attendance %" value={`${analytics.data?.attendancePct ?? 0}%`} />
        <Kpi icon={PlayCircle} label="Avg watch (min)" value={analytics.data?.avgWatchMinutes ?? 0} />
        <Kpi icon={XCircle} label="Cancelled" value={analytics.data?.cancelled ?? 0} />
      </section>

      {/* Providers */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plug className="h-4 w-4" /> Meeting providers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ProviderCard
              logo={<Video className="h-5 w-5 text-sky-500" />}
              name="Zoom" configured={zoomConfigured} row={zoom}
              onConnected={() => qc.invalidateQueries({ queryKey: ["lc-status"] })}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FutureProvider name="Google Meet" />
              <FutureProvider name="Microsoft Teams" />
              <FutureProvider name="Cisco Webex" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Batches */}
      <section>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4" /> Batches
            </CardTitle>
            <NewBatchDialog onCreated={() => qc.invalidateQueries({ queryKey: ["lc-batches"] })} />
          </CardHeader>
          <CardContent>
            {batches.data?.length ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {batches.data.map((b: { id: string; name: string; slug: string; schedule_summary: string | null; status: string }) => (
                  <div key={b.id} className="rounded-xl border p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{b.name}</div>
                      <Badge variant="outline" className="text-[10px] uppercase">{b.status}</Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{b.slug}</div>
                    {b.schedule_summary && <div className="mt-2 text-sm">{b.schedule_summary}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                No batches yet. Create one to assign live classes to specific cohorts.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Sessions */}
      <section>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarIcon className="h-4 w-4" /> Scheduled classes
            </CardTitle>
            <NewSessionDialog
              batches={batches.data ?? []}
              onCreated={() => qc.invalidateQueries({ queryKey: ["lc-sessions"] })}
              zoomAvailable={Boolean(zoom?.is_connected && zoomConfigured)}
            />
          </CardHeader>
          <CardContent>
            {sessions.data?.length ? (
              <div className="divide-y">
                {sessions.data.map((s) => <SessionRow key={s.id} s={s} onChanged={() => qc.invalidateQueries({ queryKey: ["lc-sessions"] })} />)}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                No live classes yet. Click <em>Create class</em> to schedule one.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function ProviderCard({
  logo, name, configured, row, onConnected,
}: { logo: React.ReactNode; name: string; configured: boolean; row?: ProviderRow; onConnected: () => void }) {
  const connectFn = useServerFn(connectProvider);
  const disconnectFn = useServerFn(disconnectProvider);
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);
  const connect = useMutation({
    mutationFn: () => connectFn({ data: { provider: "zoom", accountEmail: email || undefined } }),
    onSuccess: () => { toast.success("Zoom account linked"); setOpen(false); onConnected(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const disconnect = useMutation({
    mutationFn: () => disconnectFn({ data: { provider: "zoom" } }),
    onSuccess: () => { toast.success("Zoom disconnected"); onConnected(); },
  });

  return (
    <div className="flex items-center justify-between rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">{logo}</div>
        <div>
          <div className="font-medium">{name}</div>
          <div className="mt-0.5 flex items-center gap-2 text-xs">
            {row?.is_connected ? (
              <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20" variant="outline">
                <PlugZap className="mr-1 h-3 w-3" /> Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">Not connected</Badge>
            )}
            {configured ? (
              <Badge variant="outline" className="border-sky-500/20 bg-sky-500/10 text-sky-700">API keys set</Badge>
            ) : (
              <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-700">Manual link mode</Badge>
            )}
            {row?.account_email && <span className="text-muted-foreground">· {row.account_email}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {row?.is_connected ? (
          <Button variant="outline" size="sm" onClick={() => disconnect.mutate()}>Disconnect</Button>
        ) : (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Connect Zoom</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Link a Zoom account</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  For live Zoom API meeting creation, ask an admin to add these secrets in Project settings:
                  <code className="mx-1 rounded bg-slate-100 px-1 text-xs">ZOOM_ACCOUNT_ID</code>,
                  <code className="mx-1 rounded bg-slate-100 px-1 text-xs">ZOOM_CLIENT_ID</code>,
                  <code className="mx-1 rounded bg-slate-100 px-1 text-xs">ZOOM_CLIENT_SECRET</code>{" "}
                  (Server-to-Server OAuth app in the Zoom Marketplace). Without them, classes still schedule but you paste the meeting URL manually.
                </p>
                <div>
                  <Label>Account email (label only)</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="host@yourcompany.com" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => connect.mutate()} disabled={connect.isPending}>Link account</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

function FutureProvider({ name }: { name: string }) {
  return (
    <div className="rounded-xl border border-dashed p-3 text-sm">
      <div className="font-medium">{name}</div>
      <div className="text-xs text-muted-foreground">Coming soon — same LMS surface</div>
    </div>
  );
}

function NewBatchDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [schedule, setSchedule] = useState("");
  const fn = useServerFn(createBatch);
  const m = useMutation({
    mutationFn: () => fn({ data: { name, slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), scheduleSummary: schedule || null } }),
    onSuccess: () => { toast.success("Batch created"); setOpen(false); setName(""); setSlug(""); setSchedule(""); onCreated(); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline">New batch</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create batch</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="AI Batch A" /></div>
          <div><Label>Slug</Label><Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="ai-batch-a" /></div>
          <div><Label>Schedule</Label><Input value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="Mon/Wed/Fri · 7 PM IST" /></div>
        </div>
        <DialogFooter><Button onClick={() => m.mutate()} disabled={!name.trim() || m.isPending}>Create</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewSessionDialog({ batches, onCreated, zoomAvailable }: {
  batches: Array<{ id: string; name: string }>; onCreated: () => void; zoomAvailable: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", agenda: "",
    batchId: "",
    scheduledAt: new Date(Date.now() + 3600_000).toISOString().slice(0, 16),
    durationMinutes: 60,
    provider: zoomAvailable ? "zoom" : "manual",
    isWebinar: false, isRecurring: false,
    waitingRoom: true, requireRegistration: false,
    recordingEnabled: true, breakoutRooms: false, chatEnabled: true,
    maxParticipants: "",
    manualMeetingUrl: "", manualPasscode: "",
  });
  const fn = useServerFn(createLiveSession);
  const m = useMutation({
    mutationFn: () => fn({
      data: {
        title: form.title,
        description: form.description || null,
        agenda: form.agenda || null,
        batchId: form.batchId || null,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        durationMinutes: Number(form.durationMinutes),
        timezone: "Asia/Kolkata",
        provider: form.provider as any,
        isWebinar: form.isWebinar, isRecurring: form.isRecurring,
        waitingRoom: form.waitingRoom, requireRegistration: form.requireRegistration,
        recordingEnabled: form.recordingEnabled, breakoutRooms: form.breakoutRooms, chatEnabled: form.chatEnabled,
        maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : null,
        manualMeetingUrl: form.manualMeetingUrl || null, manualPasscode: form.manualPasscode || null,
      },
    }),
    onSuccess: () => { toast.success("Class scheduled"); setOpen(false); onCreated(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const useManual = form.provider === "manual";
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Sparkles className="mr-1.5 h-3.5 w-3.5" /> Create class</Button></DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Schedule live class</DialogTitle></DialogHeader>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="md:col-span-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Prompt Engineering — Session 3" /></div>
            <div className="md:col-span-2"><Label>Agenda</Label><Textarea rows={3} value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} placeholder="1. Recap · 2. Live demo · 3. Q&A" /></div>
            <div>
              <Label>Batch</Label>
              <Select value={form.batchId || "none"} onValueChange={(v) => setForm({ ...form, batchId: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None (global) —</SelectItem>
                  {batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Provider</Label>
              <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="zoom" disabled={!zoomAvailable}>Zoom {zoomAvailable ? "(auto)" : "(configure secrets first)"}</SelectItem>
                  <SelectItem value="manual">Manual link</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Start</Label><Input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} /></div>
            <div><Label>Duration (min)</Label><Input type="number" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} /></div>
            <div><Label>Max participants</Label><Input type="number" value={form.maxParticipants} onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })} placeholder="Optional" /></div>
          </div>

          {useManual && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 rounded-lg border border-dashed p-3">
              <div className="md:col-span-2"><Label>Manual meeting URL</Label><Input value={form.manualMeetingUrl} onChange={(e) => setForm({ ...form, manualMeetingUrl: e.target.value })} placeholder="https://zoom.us/j/..." /></div>
              <div><Label>Passcode</Label><Input value={form.manualPasscode} onChange={(e) => setForm({ ...form, manualPasscode: e.target.value })} /></div>
            </div>
          )}

          <Separator />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <Toggle label="Webinar" checked={form.isWebinar} onChange={(v) => setForm({ ...form, isWebinar: v })} />
            <Toggle label="Recurring" checked={form.isRecurring} onChange={(v) => setForm({ ...form, isRecurring: v })} />
            <Toggle label="Waiting room" checked={form.waitingRoom} onChange={(v) => setForm({ ...form, waitingRoom: v })} />
            <Toggle label="Registration" checked={form.requireRegistration} onChange={(v) => setForm({ ...form, requireRegistration: v })} />
            <Toggle label="Recording" checked={form.recordingEnabled} onChange={(v) => setForm({ ...form, recordingEnabled: v })} />
            <Toggle label="Breakout rooms" checked={form.breakoutRooms} onChange={(v) => setForm({ ...form, breakoutRooms: v })} />
            <Toggle label="Chat" checked={form.chatEnabled} onChange={(v) => setForm({ ...form, chatEnabled: v })} />
          </div>
        </div>
        <DialogFooter><Button disabled={!form.title.trim() || m.isPending} onClick={() => m.mutate()}>Schedule</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function SessionRow({ s, onChanged }: { s: any; onChanged: () => void }) {
  const cancelFn = useServerFn(cancelLiveSession);
  const cancel = useMutation({
    mutationFn: () => cancelFn({ data: { id: s.id } }),
    onSuccess: () => { toast.success("Class cancelled"); onChanged(); },
  });
  const when = new Date(s.scheduled_at);
  return (
    <div className="flex items-center justify-between py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{s.title}</span>
          <Badge variant="outline" className="text-[10px] uppercase">{s.provider}</Badge>
          {s.is_webinar && <Badge variant="outline" className="text-[10px] uppercase">Webinar</Badge>}
          <Badge variant="outline" className={`text-[10px] uppercase ${s.status === "cancelled" ? "bg-rose-500/10 text-rose-700" : "bg-emerald-500/10 text-emerald-700"}`}>{s.status}</Badge>
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {when.toLocaleString()} · {s.duration_minutes} min · {s.provider_meeting_id ? `ID ${s.provider_meeting_id}` : "no meeting id"}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {s.meeting_url && (
          <>
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(s.meeting_url); toast.success("Join link copied"); }}>
              <Copy className="mr-1 h-3.5 w-3.5" /> Copy link
            </Button>
            <a href={s.meeting_url} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline"><ExternalLink className="mr-1 h-3.5 w-3.5" /> Open</Button>
            </a>
          </>
        )}
        {s.status !== "cancelled" && (
          <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => cancel.mutate()}>
            <XCircle className="mr-1 h-3.5 w-3.5" /> Cancel
          </Button>
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}
