import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
// AdminShell is intentionally not imported — this page renders inside the authenticated layout.
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Send, Sparkles, TestTube2, Trash2, Plus, Zap, Mail, Users, BarChart3, Layers } from "lucide-react";
import { bootstrapEngageDefaults } from "@/lib/engage/bootstrap.functions";
import { listEngageProviders, saveEngageProvider, deleteEngageProvider, testEngageProvider } from "@/lib/engage/providers.functions";
import { listEngageTemplates, sendEngageTest } from "@/lib/engage/templates.functions";
import { listEngageCampaigns, upsertEngageCampaign, dispatchEngageCampaign } from "@/lib/engage/campaigns.functions";
import { listEngageSequences } from "@/lib/engage/sequences.functions";
import { listEngageSegments, previewEngageSegment } from "@/lib/engage/segments.functions";
import { getEngageAnalytics } from "@/lib/engage/analytics.functions";
import { aiDraftEmail } from "@/lib/engage/ai.functions";

export const Route = createFileRoute("/_authenticated/admin/engage/")({
  head: () => ({
    meta: [
      { title: "Engage — Glintr Admin" },
      { name: "description", content: "Email marketing, notifications and customer engagement center." },
    ],
  }),
  component: EngagePage,
});

function EngagePage() {
  return (
    <>
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
        <Header />
        <Analytics />
        <Tabs defaultValue="templates" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-6">
            <TabsTrigger value="templates"><Mail className="mr-2 h-4 w-4" />Templates</TabsTrigger>
            <TabsTrigger value="campaigns"><Send className="mr-2 h-4 w-4" />Campaigns</TabsTrigger>
            <TabsTrigger value="sequences"><Zap className="mr-2 h-4 w-4" />Sequences</TabsTrigger>
            <TabsTrigger value="segments"><Users className="mr-2 h-4 w-4" />Segments</TabsTrigger>
            <TabsTrigger value="providers"><Layers className="mr-2 h-4 w-4" />Providers</TabsTrigger>
            <TabsTrigger value="ai"><Sparkles className="mr-2 h-4 w-4" />AI Writer</TabsTrigger>
          </TabsList>
          <TabsContent value="templates"><TemplatesPanel /></TabsContent>
          <TabsContent value="campaigns"><CampaignsPanel /></TabsContent>
          <TabsContent value="sequences"><SequencesPanel /></TabsContent>
          <TabsContent value="segments"><SegmentsPanel /></TabsContent>
          <TabsContent value="providers"><ProvidersPanel /></TabsContent>
          <TabsContent value="ai"><AIWriterPanel /></TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function Header() {
  const bootstrap = useServerFn(bootstrapEngageDefaults);
  const qc = useQueryClient();
  const seed = useMutation({
    mutationFn: async () => bootstrap(),
    onSuccess: (r) => {
      if (r.ok) {
        toast.success(`Seeded ${r.templates} templates & ${r.sequences} sequences`);
        qc.invalidateQueries();
      } else toast.error(r.error);
    },
  });
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="text-xs font-medium uppercase tracking-widest text-cyan-500">Glintr Engage</div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Email, Push & Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          One control room for transactional emails, drip sequences, marketing campaigns, and the in-app notification bell.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="muted" onClick={() => seed.mutate()} disabled={seed.isPending}>
          {seed.isPending ? "Seeding…" : "Seed default templates"}
        </Button>
      </div>
    </div>
  );
}

function Analytics() {
  const fn = useServerFn(getEngageAnalytics);
  const { data } = useQuery({ queryKey: ["engage-analytics"], queryFn: () => fn({ data: { days: 30 } }) });
  const m = data?.ok ? data.metrics : null;
  const cells: Array<[string, string | number, string]> = [
    ["Sent", m?.sent ?? 0, "last 30 days"],
    ["Delivered", m?.delivered ?? 0, `${m?.open_rate ?? 0}% open rate`],
    ["Clicks", m?.clicked ?? 0, `${m?.click_rate ?? 0}% CTR`],
    ["Bounces", m?.bounced ?? 0, `${m?.bounce_rate ?? 0}% bounce`],
    ["Unsubscribes", m?.unsubscribed ?? 0, "opt-outs"],
  ];
  return (
    <div className="grid gap-4 md:grid-cols-5">
      {cells.map(([label, value, sub]) => (
        <Card key={label} className="p-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="mt-2 text-2xl font-bold tabular-nums">{value.toLocaleString?.() ?? value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
        </Card>
      ))}
    </div>
  );
}

function TemplatesPanel() {
  const fn = useServerFn(listEngageTemplates);
  const test = useServerFn(sendEngageTest);
  const [search, setSearch] = useState("");
  const [testOpen, setTestOpen] = useState<string | null>(null);
  const [testTo, setTestTo] = useState("");
  const { data } = useQuery({ queryKey: ["engage-templates", search], queryFn: () => fn({ data: { search: search || null } }) });
  const rows = data?.ok ? data.templates : [];
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Input placeholder="Search templates…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
        <Badge variant="muted">{rows.length} templates</Badge>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {rows.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-lg border p-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium truncate">{t.name}</div>
                {t.is_system && <Badge variant="outline" className="text-[10px]">system</Badge>}
              </div>
              <div className="text-xs text-muted-foreground truncate">{t.subject}</div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setTestOpen(t.template_key)}>
              <TestTube2 className="mr-1 h-3.5 w-3.5" />Test
            </Button>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="col-span-2 p-8 text-center text-sm text-muted-foreground">
            No templates yet. Click <b>Seed default templates</b> above to install the platform library.
          </div>
        )}
      </div>
      <Dialog open={Boolean(testOpen)} onOpenChange={() => setTestOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send a test email</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Send to</Label>
            <Input type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="you@example.com" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTestOpen(null)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!testOpen || !testTo) return;
                const r = await test({ data: { template_key: testOpen, to: testTo } });
                if (r.ok) toast.success("Test sent");
                else toast.error(r.error_message ?? r.error_code ?? "Failed");
                setTestOpen(null);
              }}
            >Send test</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function CampaignsPanel() {
  const listFn = useServerFn(listEngageCampaigns);
  const upsertFn = useServerFn(upsertEngageCampaign);
  const sendFn = useServerFn(dispatchEngageCampaign);
  const templatesFn = useServerFn(listEngageTemplates);
  const segmentsFn = useServerFn(listEngageSegments);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["engage-campaigns"], queryFn: () => listFn({ data: {} }) });
  const { data: templates } = useQuery({ queryKey: ["engage-templates-lite"], queryFn: () => templatesFn({ data: {} }) });
  const { data: segments } = useQuery({ queryKey: ["engage-segments-lite"], queryFn: () => segmentsFn({ data: {} }) });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [template, setTemplate] = useState("");
  const [segment, setSegment] = useState<string | undefined>();

  const save = useMutation({
    mutationFn: () => upsertFn({ data: { name, template_key: template, segment_id: segment ?? null, schedule_type: "immediate", channel: "email" } }),
    onSuccess: (r) => {
      if (r.ok) { toast.success("Campaign saved"); setOpen(false); qc.invalidateQueries({ queryKey: ["engage-campaigns"] }); }
      else toast.error(r.error);
    },
  });
  const send = useMutation({
    mutationFn: (id: string) => sendFn({ data: { id } }),
    onSuccess: (r) => {
      if (r.ok) toast.success(`Sent to ${r.sent} of ${r.total}`);
      else toast.error(r.error);
      qc.invalidateQueries({ queryKey: ["engage-campaigns"] });
    },
  });

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Broadcast a template to a segment, immediately or on schedule.</div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" />New campaign</Button>
      </div>
      <div className="divide-y rounded-lg border">
        {(data?.ok ? data.campaigns : []).map((c) => (
          <div key={c.id} className="flex items-center justify-between p-3">
            <div>
              <div className="font-medium">{c.name}</div>
              <div className="text-xs text-muted-foreground">Template: {c.template_key} · Status: {c.status} · Sent: {c.sent_count ?? 0}/{c.total_recipients ?? 0}</div>
            </div>
            <Button size="sm" variant="outline" onClick={() => send.mutate(c.id)} disabled={send.isPending || c.status === "sending"}>
              <Send className="mr-1 h-3.5 w-3.5" />Send now
            </Button>
          </div>
        ))}
        {(!data?.ok || data.campaigns.length === 0) && (
          <div className="p-8 text-center text-sm text-muted-foreground">No campaigns yet.</div>
        )}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New campaign</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div>
              <Label>Template</Label>
              <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {(templates?.ok ? templates.templates : []).map((t) => (
                    <SelectItem key={t.id} value={t.template_key}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Segment</Label>
              <Select value={segment} onValueChange={setSegment}>
                <SelectTrigger><SelectValue placeholder="All matching users" /></SelectTrigger>
                <SelectContent>
                  {(segments?.ok ? segments.segments : []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={!name || !template || save.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function SequencesPanel() {
  const listFn = useServerFn(listEngageSequences);
  const { data } = useQuery({ queryKey: ["engage-sequences"], queryFn: () => listFn({ data: {} }) });
  return (
    <Card className="p-6">
      <div className="mb-3 text-sm text-muted-foreground">Automated drip sequences fire when trigger events are emitted. Seeded defaults cover signup, abandonment, and course completion.</div>
      <div className="divide-y rounded-lg border">
        {(data?.ok ? data.sequences : []).map((s) => (
          <div key={s.id} className="flex items-center justify-between p-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="font-medium">{s.name}</div>
                {s.is_system && <Badge variant="outline" className="text-[10px]">system</Badge>}
                {!s.is_active && <Badge variant="muted" className="text-[10px]">off</Badge>}
              </div>
              <div className="text-xs text-muted-foreground">Trigger: {s.trigger_event} · {(s.steps as unknown as unknown[]).length} steps</div>
            </div>
          </div>
        ))}
        {(!data?.ok || data.sequences.length === 0) && (
          <div className="p-8 text-center text-sm text-muted-foreground">No sequences yet.</div>
        )}
      </div>
    </Card>
  );
}

function SegmentsPanel() {
  const listFn = useServerFn(listEngageSegments);
  const previewFn = useServerFn(previewEngageSegment);
  const { data } = useQuery({ queryKey: ["engage-segments"], queryFn: () => listFn({ data: {} }) });
  return (
    <Card className="p-6">
      <div className="mb-3 text-sm text-muted-foreground">Reusable audience filters. Use them from campaigns to send to a slice of users.</div>
      <div className="divide-y rounded-lg border">
        {(data?.ok ? data.segments : []).map((s) => (
          <div key={s.id} className="flex items-center justify-between p-3">
            <div>
              <div className="font-medium">{s.name}</div>
              <div className="text-xs text-muted-foreground">Audience: {s.audience}</div>
            </div>
            <Button size="sm" variant="ghost" onClick={async () => {
              const r = await previewFn({ data: { id: s.id } });
              if (r.ok) toast.success(`Matches ${r.total} users`);
              else toast.error(r.error);
            }}>Preview</Button>
          </div>
        ))}
        {(!data?.ok || data.segments.length === 0) && (
          <div className="p-8 text-center text-sm text-muted-foreground">No segments yet.</div>
        )}
      </div>
    </Card>
  );
}

function ProvidersPanel() {
  const listFn = useServerFn(listEngageProviders);
  const testFn = useServerFn(testEngageProvider);
  const deleteFn = useServerFn(deleteEngageProvider);
  const saveFn = useServerFn(saveEngageProvider);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["engage-providers"], queryFn: () => listFn({ data: {} }) });
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("lovable");
  const [displayName, setDisplayName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [secretRef, setSecretRef] = useState("");
  return (
    <Card className="p-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Configure how emails are sent. Lovable Emails is the default and works with no keys.</div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" />Add provider</Button>
      </div>
      <div className="divide-y rounded-lg border">
        {(data?.ok ? data.providers : []).map((p) => (
          <div key={p.id} className="flex items-center justify-between p-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="font-medium">{p.display_name ?? p.kind}</div>
                <Badge variant="outline" className="text-[10px]">{p.kind}</Badge>
                {p.is_default && <Badge className="text-[10px]">default</Badge>}
                {p.last_test_status === "ok" && <Badge variant="muted" className="text-[10px]">verified</Badge>}
                {p.last_test_status === "failed" && <Badge variant="danger" className="text-[10px]">failed</Badge>}
              </div>
              <div className="text-xs text-muted-foreground">{p.channel} · secret: {p.secret_ref ?? "—"}</div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={async () => {
                const r = await testFn({ data: { id: p.id } });
                if (r.ok) toast.success("Connection verified");
                else toast.error(r.error);
                qc.invalidateQueries({ queryKey: ["engage-providers"] });
              }}>Test</Button>
              <Button size="sm" variant="ghost" onClick={async () => {
                if (!confirm("Delete this provider?")) return;
                await deleteFn({ data: { id: p.id } });
                qc.invalidateQueries({ queryKey: ["engage-providers"] });
              }}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        ))}
        {(!data?.ok || data.providers.length === 0) && (
          <div className="p-8 text-center text-sm text-muted-foreground">No providers yet.</div>
        )}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add sending provider</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Provider</Label>
              <Select value={kind} onValueChange={setKind}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lovable">Lovable Emails (managed)</SelectItem>
                  <SelectItem value="resend">Resend</SelectItem>
                  <SelectItem value="sendgrid">SendGrid</SelectItem>
                  <SelectItem value="postmark">Postmark</SelectItem>
                  <SelectItem value="mailgun">Mailgun</SelectItem>
                  <SelectItem value="brevo">Brevo (Sendinblue)</SelectItem>
                  <SelectItem value="ses">Amazon SES</SelectItem>
                  <SelectItem value="smtp">SMTP (Gmail / Outlook / Custom)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Display name</Label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Production" /></div>
            <div><Label>From email</Label><Input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} placeholder="notify@yourdomain.com" /></div>
            {kind !== "lovable" && (
              <div>
                <Label>Secret env var name</Label>
                <Input value={secretRef} onChange={(e) => setSecretRef(e.target.value)} placeholder="e.g. RESEND_API_KEY" />
                <p className="mt-1 text-xs text-muted-foreground">Store the actual value via Project Settings → Secrets, then reference the variable name here.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              const r = await saveFn({ data: {
                kind, channel: "email", display_name: displayName || null,
                config: fromEmail ? { from_email: fromEmail } : {}, secret_ref: secretRef || null,
                is_active: true,
              } });
              if (r.ok) { toast.success("Provider added"); setOpen(false); qc.invalidateQueries({ queryKey: ["engage-providers"] }); }
              else toast.error(r.error);
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function AIWriterPanel() {
  const fn = useServerFn(aiDraftEmail);
  const [goal, setGoal] = useState("");
  const [tone, setTone] = useState<"friendly" | "professional" | "urgent" | "playful" | "authoritative">("friendly");
  const [result, setResult] = useState<Array<{ subject?: string; preview?: string; headline?: string; body?: string; cta_label?: string }>>([]);
  const draft = useMutation({
    mutationFn: async () => fn({ data: { goal, tone, variants: 2 } }),
    onSuccess: (r) => {
      if (r.ok) setResult(r.variants as never);
      else toast.error(r.error);
    },
  });
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-cyan-500" />
        <div className="text-sm font-medium">AI Email Writer</div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-3 md:col-span-1">
          <div>
            <Label>Goal / prompt</Label>
            <Textarea rows={6} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. Announce our new AI Sales bootcamp, target working professionals, drive early-bird enrollments." />
          </div>
          <div>
            <Label>Tone</Label>
            <Select value={tone} onValueChange={(v) => setTone(v as never)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="playful">Playful</SelectItem>
                <SelectItem value="authoritative">Authoritative</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => draft.mutate()} disabled={!goal || draft.isPending} className="w-full">
            {draft.isPending ? "Drafting…" : "Draft 2 variants"}
          </Button>
        </div>
        <div className="space-y-3 md:col-span-2">
          {result.map((v, i) => (
            <div key={i} className="rounded-lg border p-4">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Variant {i + 1}</div>
              <div className="mt-1 font-semibold">{v.subject}</div>
              <div className="text-xs text-muted-foreground">{v.preview}</div>
              <div className="mt-2 whitespace-pre-wrap text-sm">{v.body}</div>
              {v.cta_label && <div className="mt-3 text-xs"><Badge variant="outline">CTA: {v.cta_label}</Badge></div>}
            </div>
          ))}
          {result.length === 0 && <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">AI-generated variants will appear here.</div>}
        </div>
      </div>
    </Card>
  );
}
