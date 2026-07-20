import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ShieldCheck, Zap, Clock, CheckCircle2, ExternalLink, Loader2, ArrowLeft, Trash2, RefreshCw, Bot, Book } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getProvider } from "@/lib/integrations/catalog";
import { listAccounts, connectProvider, disconnectAccount, syncAccount, updateSyncFrequency } from "@/lib/integrations/integrations.functions";
import { ProviderLogo } from "@/components/integrations/integrations-shell";

export const Route = createFileRoute("/_authenticated/integrations/$provider")({
  component: ProviderDetail,
});

function ProviderDetail() {
  const { provider } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState<"idle" | "oauth" | "permissions" | "verifying" | "done">("idle");
  const info = getProvider(provider);
  const la = useServerFn(listAccounts);
  const cp = useServerFn(connectProvider);
  const da = useServerFn(disconnectAccount);
  const sa = useServerFn(syncAccount);
  const uf = useServerFn(updateSyncFrequency);
  const q = useQuery({ queryKey: ["intg-accounts"], queryFn: () => la({}) });
  const account = (q.data?.accounts ?? []).find((a: any) => a.provider === provider);

  const connect = useMutation({
    mutationFn: async () => {
      setStep("oauth"); await sleep(600);
      setStep("permissions"); await sleep(600);
      setStep("verifying"); await sleep(500);
      const res = await cp({ data: {
        provider, category: info?.category ?? "productivity",
        display_name: info?.name ?? provider, scopes: info?.scopes ?? [],
      } });
      setStep("done");
      return res;
    },
    onSuccess: () => { toast.success(`${info?.name ?? provider} connected`); qc.invalidateQueries({ queryKey: ["intg-accounts"] }); },
    onError: (e: any) => { setStep("idle"); toast.error(e?.message ?? "Failed to connect"); },
  });

  if (!info) {
    return (
      <div className="rounded-2xl border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">Unknown integration.</p>
        <Button asChild className="mt-4"><Link to="/integrations">Back to marketplace</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/integrations" })}>
        <ArrowLeft className="mr-1 h-3 w-3" /> Marketplace
      </Button>

      <div className="rounded-3xl border bg-card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="scale-125">
              <ProviderLogo provider={info.id} name={info.name} brandColor={info.brandColor} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-semibold tracking-tight">{info.name}</h2>
                {info.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </span>
                )}
              </div>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">{info.tagline}</p>
              <div className="mt-2 text-[11px] uppercase tracking-wider text-muted-foreground">{info.category}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {account ? (
              <>
                <Button variant="outline" onClick={() => sa({ data: { id: account.id } }).then(() => { toast.success("Synced"); qc.invalidateQueries({ queryKey: ["intg-accounts"] }); })}>
                  <RefreshCw className="mr-1 h-3 w-3" /> Sync now
                </Button>
                <Button variant="ghost" className="text-red-600 hover:text-red-700"
                  onClick={() => da({ data: { id: account.id } }).then(() => { toast.success("Disconnected"); qc.invalidateQueries({ queryKey: ["intg-accounts"] }); })}>
                  <Trash2 className="mr-1 h-3 w-3" /> Disconnect
                </Button>
              </>
            ) : (
              <Button disabled={connect.isPending} onClick={() => connect.mutate()}>
                {connect.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Zap className="mr-1 h-3 w-3" />} Connect
              </Button>
            )}
            {info.docsUrl && (
              <Button asChild variant="ghost"><a href={info.docsUrl} target="_blank" rel="noreferrer"><Book className="mr-1 h-3 w-3" /> Docs</a></Button>
            )}
          </div>
        </div>

        {connect.isPending && step !== "done" && <ConnectFlow step={step} />}
      </div>

      {account && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title="Connected account" icon={CheckCircle2}>
            <Row k="Status" v={<span className="text-emerald-600">Connected</span>} />
            <Row k="Health" v={account.health} />
            <Row k="Account" v={account.display_name} />
            <Row k="Connected" v={new Date(account.created_at).toLocaleString()} />
          </Panel>
          <Panel title="Sync" icon={Clock}>
            <div>
              <div className="text-xs text-muted-foreground">Frequency</div>
              <select value={account.sync_frequency}
                onChange={async (e) => { await uf({ data: { id: account.id, sync_frequency: e.target.value as any } }); qc.invalidateQueries({ queryKey: ["intg-accounts"] }); toast.success("Updated"); }}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary">
                <option value="manual">Manual</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="realtime">Real-time</option>
              </select>
            </div>
            <Row k="Last sync" v={account.last_synced_at ? new Date(account.last_synced_at).toLocaleString() : "never"} />
          </Panel>
          <Panel title="Version" icon={ShieldCheck}>
            <Row k="Provider version" v="v1" />
            <Row k="Adapter" v="1.0.0" />
            <Button asChild size="sm" variant="outline" className="mt-2 w-full">
              <Link to="/integrations/logs">View logs <ExternalLink className="ml-1 h-3 w-3" /></Link>
            </Button>
          </Panel>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Capabilities" icon={Zap}>
          {info.capabilities.length ? (
            <ul className="space-y-1.5 text-sm">
              {info.capabilities.map((c) => (
                <li key={c} className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> {c}</li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">Standard read & write via provider API.</p>}
        </Panel>
        <Panel title="AI capability" icon={Bot}>
          <p className="text-sm text-muted-foreground">
            Once connected, your <span className="font-semibold text-foreground">{info.aiAgent ?? "AI Team"}</span> automatically uses {info.name} data — no extra configuration.
          </p>
          <div className="mt-3 rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{info.name}</span> → {info.aiAgent ?? "AI Team"} → contextualized answers, plans, and actions.
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ConnectFlow({ step }: { step: string }) {
  const steps = [
    { id: "oauth", label: "Authorize OAuth" },
    { id: "permissions", label: "Grant permissions" },
    { id: "verifying", label: "Verify connection" },
    { id: "done", label: "Connected" },
  ];
  const active = steps.findIndex((s) => s.id === step);
  return (
    <div className="mt-6 rounded-2xl border bg-muted/20 p-4">
      <div className="flex flex-wrap items-center gap-3">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
              i < active ? "bg-emerald-500 text-white" :
              i === active ? "bg-primary text-primary-foreground animate-pulse" :
              "bg-background border text-muted-foreground")}>
              {i < active ? "✓" : i + 1}
            </div>
            <span className={cn("text-xs", i <= active ? "text-foreground font-medium" : "text-muted-foreground")}>{s.label}</span>
            {i < steps.length - 1 && <span className="mx-1 text-muted-foreground/50">→</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Panel({ title, icon: Icon, children }: any) {
  return (
    <div className="rounded-2xl border bg-card">
      <div className="flex items-center gap-2 border-b p-4 text-sm font-semibold">
        <Icon className="h-4 w-4 text-primary" /> {title}
      </div>
      <div className="space-y-2 p-4">{children}</div>
    </div>
  );
}
function Row({ k, v }: any) {
  return <div className="flex justify-between gap-4 text-sm"><span className="text-muted-foreground">{k}</span><span className="text-right font-medium">{v}</span></div>;
}
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
