import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getEmailOsDashboard, listEmailCampaigns, listEmailTemplates, listEmailSequences,
  CAMPAIGN_TAXONOMY,
} from "@/lib/marketing-os/email-os.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Mail, Send, Eye, MousePointerClick, MessageSquare, Target, DollarSign,
  AlertTriangle, ShieldAlert, Users, UserMinus, LayoutTemplate, Workflow,
  ExternalLink, Sparkles, Wand2, FileText, TestTube, ShieldCheck, Calendar,
  BarChart3, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/marketing-os/email")({
  head: () => ({
    meta: [
      { title: "Email Marketing — Glintr Marketing OS" },
      { name: "description", content: "Enterprise email marketing: newsletters, admissions, drips, transactional, launches — powered by Glintr Engage." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EmailOS,
});

function EmailOS() {
  const dashFn = useServerFn(getEmailOsDashboard);
  const { data: dash } = useQuery({ queryKey: ["email-os", "dash"], queryFn: () => dashFn() });

  const kpis = [
    { label: "Campaigns", value: dash?.campaigns ?? 0, icon: Mail, note: `${dash?.activeCampaigns ?? 0} active` },
    { label: "Emails Sent", value: (dash?.emailsSent ?? 0).toLocaleString(), icon: Send },
    { label: "Open Rate", value: `${dash?.openRate ?? 0}%`, icon: Eye, tone: (dash?.openRate ?? 0) >= 20 ? "emerald" : undefined },
    { label: "Click Rate", value: `${dash?.clickRate ?? 0}%`, icon: MousePointerClick },
    { label: "Replies", value: dash?.replies ?? 0, icon: MessageSquare },
    { label: "Conversions", value: dash?.conversions ?? 0, icon: Target, note: "Attribution pending" },
    { label: "Revenue", value: `₹${(dash?.revenue ?? 0).toLocaleString()}`, icon: DollarSign },
    { label: "Bounce Rate", value: `${dash?.bounceRate ?? 0}%`, icon: AlertTriangle, tone: (dash?.bounceRate ?? 0) > 5 ? "amber" : undefined },
    { label: "Spam Rate", value: `${dash?.spamRate ?? 0}%`, icon: ShieldAlert, tone: (dash?.spamRate ?? 0) > 1 ? "amber" : undefined },
    { label: "Subscribers", value: (dash?.subscribers ?? 0).toLocaleString(), icon: Users },
    { label: "Unsubscribes", value: dash?.unsubscribes ?? 0, icon: UserMinus },
    { label: "Templates", value: dash?.totalTemplates ?? 0, icon: LayoutTemplate },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-primary">Marketing OS · Email</div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Mail className="size-6 text-primary" /> Email Marketing OS
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Newsletters, admissions journeys, drip campaigns, placement updates, launches, and transactional flows. Powered by Glintr Engage · Lovable managed delivery · AI Router · Brand Kit inheritance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm"><Link to={"/admin/engage" as never}><ExternalLink className="size-3.5 mr-1.5" /> Engage Studio</Link></Button>
          <Button asChild size="sm"><Link to={"/admin/engage/campaigns/new" as never}><Wand2 className="size-3.5 mr-1.5" /> New Campaign</Link></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">{k.label}</div>
              <k.icon className="size-3.5 text-muted-foreground" />
            </div>
            <div className={cn(
              "mt-2 text-2xl font-semibold tracking-tight",
              k.tone === "emerald" && "text-emerald-600",
              k.tone === "amber" && "text-amber-600",
            )}>{String(k.value)}</div>
            {k.note && <div className="text-[10px] text-muted-foreground mt-0.5">{k.note}</div>}
          </Card>
        ))}
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList className="flex flex-wrap h-auto p-1 gap-1 justify-start">
          <TabsTrigger value="campaigns"><Layers className="size-3.5 mr-1.5" />Campaigns</TabsTrigger>
          <TabsTrigger value="templates"><LayoutTemplate className="size-3.5 mr-1.5" />Templates</TabsTrigger>
          <TabsTrigger value="automation"><Workflow className="size-3.5 mr-1.5" />Automation</TabsTrigger>
          <TabsTrigger value="ai"><Sparkles className="size-3.5 mr-1.5" />AI Writer</TabsTrigger>
          <TabsTrigger value="audience"><Users className="size-3.5 mr-1.5" />Audience</TabsTrigger>
          <TabsTrigger value="ab"><TestTube className="size-3.5 mr-1.5" />A/B Testing</TabsTrigger>
          <TabsTrigger value="compliance"><ShieldCheck className="size-3.5 mr-1.5" />Compliance</TabsTrigger>
          <TabsTrigger value="reports"><FileText className="size-3.5 mr-1.5" />Reports</TabsTrigger>
          <TabsTrigger value="providers"><ExternalLink className="size-3.5 mr-1.5" />Providers</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="mt-4"><CampaignsPane taxonomy={dash?.taxonomyCounts ?? []} /></TabsContent>
        <TabsContent value="templates" className="mt-4"><TemplatesPane /></TabsContent>
        <TabsContent value="automation" className="mt-4"><AutomationPane /></TabsContent>
        <TabsContent value="ai" className="mt-4"><AiPane /></TabsContent>
        <TabsContent value="audience" className="mt-4"><AudiencePane /></TabsContent>
        <TabsContent value="ab" className="mt-4"><AbPane /></TabsContent>
        <TabsContent value="compliance" className="mt-4"><CompliancePane /></TabsContent>
        <TabsContent value="reports" className="mt-4"><ReportsPane /></TabsContent>
        <TabsContent value="providers" className="mt-4"><ProvidersPane /></TabsContent>
      </Tabs>
    </div>
  );
}

function CampaignsPane({ taxonomy }: { taxonomy: Array<{ key: string; label: string; count: number }> }) {
  const listFn = useServerFn(listEmailCampaigns);
  const { data } = useQuery({ queryKey: ["email-os", "campaigns"], queryFn: () => listFn() });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-2">
        {(taxonomy.length ? taxonomy : CAMPAIGN_TAXONOMY.map((t) => ({ key: t.key, label: t.label, count: 0 }))).map((t) => (
          <Card key={t.key} className="p-3">
            <div className="text-xs font-medium">{t.label}</div>
            <div className="text-lg font-semibold tracking-tight mt-1">{t.count}</div>
          </Card>
        ))}
      </div>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-medium text-sm">Recent campaigns</div>
          <Button asChild size="sm" variant="outline"><Link to={"/admin/engage/campaigns" as never}><ExternalLink className="size-3.5 mr-1.5" /> Manage in Engage</Link></Button>
        </div>
        {(data?.campaigns ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No email campaigns yet. Create one in Engage to see it here.</p>
        ) : (
          <div className="divide-y divide-border/60 -mx-2">
            {(data?.campaigns ?? []).slice(0, 20).map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-2 py-2 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground">Category · {c.category}</div>
                </div>
                <Badge variant="outline" className="text-[10px] capitalize">{c.status}</Badge>
                <span className="text-xs text-muted-foreground">Sent {(c.sent_count ?? 0).toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">Opens {(c.opened_count ?? 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function TemplatesPane() {
  const listFn = useServerFn(listEmailTemplates);
  const { data } = useQuery({ queryKey: ["email-os", "templates"], queryFn: () => listFn() });
  const gallery = ["Welcome","Newsletter","Admissions","Placement","Workshop","Festival","Referral","Certificate","Reminder","Abandoned Registration","Custom"];
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-medium text-sm">Template gallery</div>
            <div className="text-xs text-muted-foreground">Curated starters — every one inherits the workspace Brand Kit at render time.</div>
          </div>
          <Button asChild size="sm"><Link to={"/admin/engage/templates" as never}><ExternalLink className="size-3.5 mr-1.5" /> Open Template Studio</Link></Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-2">
          {gallery.map((g) => (
            <div key={g} className="p-3 rounded-lg border border-border/60 hover:border-primary/60 cursor-pointer text-xs font-medium">{g}</div>
          ))}
        </div>
      </Card>
      <Card className="p-4">
        <div className="font-medium text-sm mb-2">Workspace templates ({data?.templates?.length ?? 0})</div>
        {(data?.templates ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No custom templates yet.</p>
        ) : (
          <div className="divide-y divide-border/60 -mx-2">
            {(data?.templates ?? []).map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-2 py-2 text-sm">
                <span className="flex-1 truncate">{t.name}</span>
                <Badge variant="outline" className="text-[10px]">{t.category ?? "custom"}</Badge>
                {t.is_active && <Badge variant="success" className="text-[10px]">Active</Badge>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function AutomationPane() {
  const listFn = useServerFn(listEmailSequences);
  const { data } = useQuery({ queryKey: ["email-os", "sequences"], queryFn: () => listFn() });
  const flows = ["Welcome Series","Drip Campaign","Reminder","Follow-up","Re-engagement","Birthday","Anniversary","Placement","Admissions","Workflow Trigger"];
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="font-medium text-sm mb-3">Automation blueprints</div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2">
          {flows.map((f) => (
            <div key={f} className="p-3 rounded-lg border border-border/60 text-xs flex items-center gap-2">
              <Workflow className="size-3.5 text-primary" /> {f}
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium text-sm">Sequences ({data?.sequences?.length ?? 0})</div>
          <Button asChild size="sm" variant="outline"><Link to={"/admin/marketing-os/automation" as never}><ExternalLink className="size-3.5 mr-1.5" /> Open Workflow Engine</Link></Button>
        </div>
        {(data?.sequences ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Create sequences in the Workflow Engine.</p>
        ) : (
          <div className="divide-y divide-border/60 -mx-2">
            {(data?.sequences ?? []).map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-2 py-2 text-sm">
                <span className="flex-1 truncate">{s.name}</span>
                <Badge variant="outline" className="text-[10px] capitalize">{s.trigger_event ?? "manual"}</Badge>
                <Badge variant={s.is_active ? "success" : "outline"} className="text-[10px]">{s.is_active ? "Active" : "Inactive"}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function AiPane() {
  const items = ["Subject Line","Preview Text","Body","CTA","Footer","Follow-up","Variants","Personalization"];
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-medium text-sm flex items-center gap-2"><Sparkles className="size-4 text-primary" /> AI Email Writer</div>
          <p className="text-xs text-muted-foreground max-w-2xl mt-1">
            Every draft flows through the central AI Router (`aiChat`), automatically inheriting Brand Kit voice, colors, logo, tone, CTA rules, and footer — never calls providers directly.
          </p>
        </div>
        <Button asChild size="sm"><Link to={"/admin/engage/ai" as never}>Open AI Writer</Link></Button>
      </div>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
        {items.map((i) => (
          <div key={i} className="p-3 rounded-lg border border-border/60 text-xs flex items-center gap-2">
            <Wand2 className="size-3.5 text-primary" /> {i}
          </div>
        ))}
      </div>
    </Card>
  );
}

function AudiencePane() {
  const groups = ["Students","Working Professionals","Recruiters","HR","Companies","Parents"];
  const filters = ["Country","Language","Course","Lead Score","CRM Segment","Custom"];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="p-5">
        <div className="font-medium text-sm flex items-center gap-2"><Users className="size-4" /> Audience groups</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {groups.map((g) => <div key={g} className="p-3 rounded-lg border border-border/60 text-sm">{g}</div>)}
        </div>
      </Card>
      <Card className="p-5">
        <div className="font-medium text-sm">Segmentation filters</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {filters.map((f) => <div key={f} className="p-3 rounded-lg border border-border/60 text-sm">{f}</div>)}
        </div>
        <Button asChild size="sm" className="mt-3" variant="outline">
          <Link to={"/admin/engage/segments" as never}><ExternalLink className="size-3.5 mr-1.5" /> Manage segments</Link>
        </Button>
      </Card>
    </div>
  );
}

function AbPane() {
  const items = ["Subject","CTA","Layout","Images","Send Time","Preview Text"];
  return (
    <Card className="p-5">
      <div className="font-medium text-sm flex items-center gap-2"><TestTube className="size-4" /> A/B Testing</div>
      <p className="text-xs text-muted-foreground mt-1">Configured on the campaign builder in Engage · ab_test JSONB persists variants.</p>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
        {items.map((i) => <div key={i} className="p-3 rounded-lg border border-border/60 text-sm">{i}</div>)}
      </div>
    </Card>
  );
}

function CompliancePane() {
  const rules = [
    { title: "Unsubscribe", note: "Lovable-hosted unsubscribe page. Never build one in-app." },
    { title: "Privacy", note: "Brand privacy policy referenced in footer." },
    { title: "CAN-SPAM", note: "Physical address + opt-out in every send." },
    { title: "GDPR", note: "Consent captured on double opt-in flow." },
    { title: "Double Opt-In", note: "Enabled per subscription category." },
  ];
  return (
    <Card className="p-5">
      <div className="font-medium text-sm flex items-center gap-2"><ShieldCheck className="size-4" /> Compliance</div>
      <div className="mt-3 space-y-2">
        {rules.map((r) => (
          <div key={r.title} className="flex items-start gap-3 p-3 rounded-lg border border-border/60">
            <ShieldCheck className="size-4 text-emerald-600 mt-0.5" />
            <div>
              <div className="text-sm font-medium">{r.title}</div>
              <div className="text-xs text-muted-foreground">{r.note}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ReportsPane() {
  const cadences = ["Daily","Weekly","Monthly","Campaign","Audience"];
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="font-medium text-sm flex items-center gap-2"><BarChart3 className="size-4" /> Reports</div>
        <Button asChild size="sm" variant="outline"><Link to={"/admin/marketing-os/analytics" as never}><ExternalLink className="size-3.5 mr-1.5" /> Full Analytics</Link></Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {cadences.map((c) => (
          <div key={c} className="p-3 rounded-lg border border-border/60 text-sm flex items-center gap-2">
            <Calendar className="size-3.5" /> {c}
          </div>
        ))}
      </div>
    </Card>
  );
}

function ProvidersPane() {
  const providers = [
    { name: "Lovable Email API", status: "active", note: "Managed delivery, retries, suppression, unsubscribe." },
    { name: "Resend", status: "future" },
    { name: "SendGrid", status: "future" },
    { name: "Mailgun", status: "future" },
    { name: "AWS SES", status: "future" },
    { name: "Postmark", status: "future" },
    { name: "SMTP", status: "future" },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {providers.map((p) => (
        <Card key={p.name} className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">{p.name}</div>
            <Badge variant={p.status === "active" ? "success" : "outline"} className="text-[10px] capitalize">{p.status === "future" ? "Placeholder" : p.status}</Badge>
          </div>
          {p.note && <div className="text-xs text-muted-foreground mt-1">{p.note}</div>}
          {p.status === "future" && (
            <Button size="sm" variant="outline" disabled className="mt-3 w-full">Connect (coming soon)</Button>
          )}
        </Card>
      ))}
    </div>
  );
}
