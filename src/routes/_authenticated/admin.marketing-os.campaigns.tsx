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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Megaphone,
  Plus,
  Copy,
  Archive,
  Pause,
  Play,
  TrendingUp,
  Users,
  IndianRupee,
  Target,
  Rocket,
  Search,
  Sparkles,
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
  const [wizardOpen, setWizardOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);

  const filtered = useMemo(() => {
    const all = campaigns.data?.campaigns ?? [];
    return all.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (search && !`${c.name} ${c.campaign_type ?? ""} ${c.objective ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [campaigns.data, search, statusFilter]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-primary">Marketing OS</div>
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Megaphone className="size-6 text-primary" />
            Campaign Manager
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Every marketing activity belongs to a campaign. Plan, launch, monitor and analyze from one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Sparkles className="size-4 mr-1.5" /> From Template
              </Button>
            </DialogTrigger>
            <TemplateDialog templates={templates.data?.templates ?? []} brands={brands.data?.brands ?? []} onCreate={(v) => templateMut.mutate(v)} />
          </Dialog>
          <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4 mr-1.5" /> New Campaign
              </Button>
            </DialogTrigger>
            <CampaignWizard brands={brands.data?.brands ?? []} onSave={(v) => saveMut.mutate(v)} />
          </Dialog>
        </div>
      </div>

      {/* KPI cards — status counts */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatusCard label="Active" value={c?.active ?? 0} icon={Play} tone="text-success" />
        <StatusCard label="Upcoming" value={c?.upcoming ?? 0} icon={Rocket} tone="text-info" />
        <StatusCard label="Draft" value={c?.draft ?? 0} icon={Sparkles} tone="text-muted-foreground" />
        <StatusCard label="Paused" value={c?.paused ?? 0} icon={Pause} tone="text-warning" />
        <StatusCard label="Completed" value={c?.completed ?? 0} icon={Target} tone="text-primary" />
        <StatusCard label="Archived" value={c?.archived ?? 0} icon={Archive} tone="text-muted-foreground" />
      </div>

      {/* Business KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Campaign ROI" value={`${(t?.roi ?? 0).toFixed(1)}%`} icon={TrendingUp} />
        <KpiCard label="Revenue" value={formatMoney(t?.revenueCents)} icon={IndianRupee} />
        <KpiCard label="Reach" value={(t?.reach ?? 0).toLocaleString()} icon={Users} />
        <KpiCard label="Leads" value={(t?.leads ?? 0).toLocaleString()} icon={Target} />
        <KpiCard label="Admissions" value={(t?.admissions ?? 0).toLocaleString()} icon={Rocket} />
        <KpiCard label="Budget" value={formatMoney(t?.budgetCents)} icon={IndianRupee} />
      </div>

      {/* Filters */}
      <Card className="p-3 flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="size-4 absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input placeholder="Search campaigns..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s.key} value={s.key}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {/* Campaigns list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {campaigns.isLoading && <div className="text-sm text-muted-foreground p-8">Loading campaigns…</div>}
        {!campaigns.isLoading && filtered.length === 0 && (
          <Card className="p-10 text-center col-span-full">
            <Megaphone className="size-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm font-medium">No campaigns yet</p>
            <p className="text-xs text-muted-foreground mt-1">Start a fresh campaign or pick a template.</p>
          </Card>
        )}
        {filtered.map((c) => (
          <CampaignRow
            key={c.id}
            campaign={c}
            onDuplicate={() => dupMut.mutate(c.id)}
            onStatus={(status) => statusMut.mutate({ id: c.id, status })}
          />
        ))}
      </div>
    </div>
  );
}

function StatusCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: any; tone: string }) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className={cn("size-3.5", tone)} />
        {label}
      </div>
      <div className="text-2xl font-semibold tracking-tight mt-1">{value}</div>
    </Card>
  );
}
function KpiCard({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className="text-lg font-semibold tracking-tight mt-1">{value}</div>
    </Card>
  );
}

function CampaignRow({ campaign, onDuplicate, onStatus }: { campaign: Campaign; onDuplicate: () => void; onStatus: (s: string) => void }) {
  const statusMeta = STATUSES.find((s) => s.key === campaign.status);
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to="/admin/marketing-os/campaigns/$id"
              params={{ id: campaign.id }}
              className="font-semibold hover:text-primary transition-colors truncate"
            >
              {campaign.name}
            </Link>
            {statusMeta && <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>}
            {campaign.campaign_type && <Badge variant="outline">{campaign.campaign_type}</Badge>}
            {campaign.priority && campaign.priority !== "medium" && (
              <Badge variant={campaign.priority === "critical" ? "danger" : campaign.priority === "high" ? "warning" : "muted"}>
                {campaign.priority}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{campaign.objective ?? campaign.description ?? "—"}</p>
          <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground">
            <span>Budget: {formatMoney(campaign.budget_cents)}</span>
            <span>Rev: {formatMoney(campaign.actual_revenue_cents)}</span>
            <span>Leads: {campaign.actual_leads ?? 0}</span>
            {campaign.starts_at && <span>Start: {new Date(campaign.starts_at).toLocaleDateString()}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {campaign.status === "active" ? (
            <Button size="sm" variant="ghost" onClick={() => onStatus("paused")}>
              <Pause className="size-3.5" />
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => onStatus("active")}>
              <Play className="size-3.5" />
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onDuplicate}>
            <Copy className="size-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onStatus("archived")}>
            <Archive className="size-3.5" />
          </Button>
        </div>
      </div>
    </Card>
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
