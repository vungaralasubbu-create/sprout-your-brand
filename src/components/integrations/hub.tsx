/**
 * Integration Hub UI — Hub, Connect Dialog, Marketplace, API Center, Health.
 *
 * Single presentation module for the /admin/integrations route. Keeps
 * heavy composition in one place so the route file stays a thin shell.
 */

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Copy,
  KeyRound,
  Package,
  Plug,
  Plus,
  RefreshCcw,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  CATEGORIES,
  MARKETPLACE,
  PROVIDERS,
  findProvider,
  providersByCategory,
  type CategoryId,
  type Provider,
  type ProviderField,
} from "@/lib/integrations/catalog";
import {
  createApiKey,
  disconnect,
  maskValue,
  revokeApiKey,
  setConnection,
  setDefaultInCategory,
  setAppInstalled,
  useApiKeys,
  useConnections,
  useInstalledApps,
  type ConnectionState,
} from "@/lib/integrations/storage";

// --- Hub (browse & connect) --------------------------------------------------

export function IntegrationHub() {
  const { connections } = useConnections();
  const [activeCat, setActiveCat] = useState<CategoryId>("payments");
  const [query, setQuery] = useState("");
  const [connecting, setConnecting] = useState<Provider | null>(null);

  const filtered = useMemo(() => {
    const base = query.trim()
      ? PROVIDERS.filter((p) => (p.name + p.blurb).toLowerCase().includes(query.toLowerCase()))
      : providersByCategory(activeCat);
    return base;
  }, [activeCat, query]);

  const connectedCount = Object.values(connections).filter((c) => c.connected).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-label mb-1">Integration Hub</p>
          <h1 className="text-2xl font-semibold tracking-tight">Connect your stack</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {connectedCount} of {PROVIDERS.length} providers connected · credentials stored per academy brand
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search integrations"
              className="h-9 w-64 pl-8"
            />
          </div>
        </div>
      </header>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-900 dark:text-amber-200">
        <div className="flex gap-2">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong>Preview mode.</strong> Connection metadata is stored per-brand in local storage. Real credential
            storage graduates to encrypted server-side rows via App User Connectors — no live traffic is sent to
            providers from this preview.
          </span>
        </div>
      </div>

      <nav className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          const count = providersByCategory(c.id).length;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setActiveCat(c.id);
                setQuery("");
              }}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                activeCat === c.id && !query
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {c.name}
              <span className="text-[10px] opacity-70">{count}</span>
            </button>
          );
        })}
      </nav>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => {
          const state = connections[p.id];
          return <ProviderCard key={p.id} provider={p} state={state} onConnect={() => setConnecting(p)} />;
        })}
        {filtered.length === 0 && (
          <p className="col-span-full py-12 text-center text-sm text-muted-foreground">
            No providers match "{query}".
          </p>
        )}
      </div>

      {connecting && <ConnectDialog provider={connecting} onClose={() => setConnecting(null)} />}
    </div>
  );
}

function ProviderCard({
  provider,
  state,
  onConnect,
}: {
  provider: Provider;
  state?: ConnectionState;
  onConnect: () => void;
}) {
  const connected = !!state?.connected;
  return (
    <div className="group flex flex-col rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">{provider.name}</h3>
            {provider.status === "future" && <Badge variant="outline" className="text-[10px]">Soon</Badge>}
            {provider.status === "beta" && <Badge variant="outline" className="text-[10px]">Beta</Badge>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{provider.blurb}</p>
        </div>
        <div
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
            connected ? "bg-emerald-500/20 text-emerald-500" : "bg-muted text-muted-foreground",
          )}
        >
          {connected ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Plug className="h-3 w-3" />}
        </div>
      </div>

      {connected && state && (
        <dl className="mb-3 space-y-1 rounded-lg bg-background/60 p-2.5 text-[11px]">
          {Object.entries(state.fieldHints).slice(0, 2).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="truncate font-mono text-foreground">{v}</dd>
            </div>
          ))}
          {state.isDefault && (
            <div className="flex justify-end">
              <Badge className="text-[10px]">Default</Badge>
            </div>
          )}
        </dl>
      )}

      <div className="mt-auto flex items-center justify-between gap-2">
        <Button
          variant={connected ? "outline" : "primary"}
          size="sm"
          className="h-8 text-xs"
          onClick={onConnect}
          disabled={provider.status === "future"}
        >
          {connected ? "Manage" : provider.status === "future" ? "Coming soon" : "Connect"}
        </Button>
        {connected && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-muted-foreground hover:text-danger"
            onClick={() => {
              disconnect(provider.id);
              toast.success(`${provider.name} disconnected`);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

// --- Connect dialog ---------------------------------------------------------

function ConnectDialog({ provider, onClose }: { provider: Provider; onClose: () => void }) {
  const { connections } = useConnections();
  const existing = connections[provider.id];
  const [values, setValues] = useState<Record<string, string>>({});
  const [makeDefault, setMakeDefault] = useState(existing?.isDefault ?? false);

  const supportsDefault = provider.supportsDefault === true;

  const handleSave = () => {
    // Mask any secret values before persisting — we never store the real thing
    const hints: Record<string, string> = { ...(existing?.fieldHints ?? {}) };
    for (const f of provider.fields) {
      const v = values[f.key];
      if (!v) continue;
      hints[f.label] = f.kind === "secret" ? maskValue(v) : v;
    }
    setConnection(provider.id, {
      connected: true,
      connectedAt: Date.now(),
      fieldHints: hints,
      lastSyncAt: Date.now(),
      errorCount: 0,
    });
    if (supportsDefault) {
      const siblings = providersByCategory(provider.category).map((p) => p.id);
      setDefaultInCategory(siblings, makeDefault ? provider.id : "");
    }
    toast.success(`${provider.name} ${existing ? "updated" : "connected"}`);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plug className="h-4 w-4" />
            {existing ? `Manage ${provider.name}` : `Connect ${provider.name}`}
          </DialogTitle>
          <DialogDescription>{provider.blurb}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {provider.fields.map((f) => (
            <FieldEditor key={f.key} field={f} value={values[f.key] ?? ""} onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))} />
          ))}

          {supportsDefault && (
            <label className="flex items-center justify-between rounded-lg border border-border bg-background/40 p-3">
              <span>
                <span className="text-sm font-medium">Make default</span>
                <span className="block text-xs text-muted-foreground">
                  Route new {provider.category} events through {provider.name}
                </span>
              </span>
              <Switch checked={makeDefault} onCheckedChange={setMakeDefault} />
            </label>
          )}

          <p className="rounded-lg bg-muted/60 p-2.5 text-[11px] text-muted-foreground">
            Secrets are masked before local persistence. Nothing leaves your browser in preview mode.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>{existing ? "Save changes" : "Connect"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FieldEditor({ field, value, onChange }: { field: ProviderField; value: string; onChange: (v: string) => void }) {
  const label = (
    <label className="mb-1.5 block text-xs font-medium text-foreground">
      {field.label}
      {field.optional && <span className="ml-1 text-muted-foreground">(optional)</span>}
    </label>
  );

  if (field.kind === "select" && field.options) {
    return (
      <div>
        {label}
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
          <SelectContent>
            {field.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    );
  }
  if (field.kind === "toggle") {
    return (
      <label className="flex items-center justify-between">
        <span className="text-sm">{field.label}</span>
        <Switch checked={value === "true"} onCheckedChange={(v) => onChange(v ? "true" : "false")} />
      </label>
    );
  }
  const isLong = field.kind === "secret" && (field.key.includes("json") || field.key.includes("private"));
  return (
    <div>
      {label}
      {isLong ? (
        <Textarea rows={4} value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} className="font-mono text-xs" />
      ) : (
        <Input
          type={field.kind === "secret" ? "password" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      )}
      {field.help && <p className="mt-1 text-[11px] text-muted-foreground">{field.help}</p>}
    </div>
  );
}

// --- Marketplace ------------------------------------------------------------

export function AppMarketplace() {
  const installed = useInstalledApps();
  return (
    <div className="space-y-5">
      <header>
        <p className="text-label mb-1">Marketplace</p>
        <h2 className="text-xl font-semibold tracking-tight">Install optional apps</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Extend Glintr with modular plugins. Each app respects your role, brand, and integration settings.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MARKETPLACE.map((app) => {
          const Icon = app.icon;
          const isInstalled = installed[app.id] ?? app.status === "installed";
          const isFuture = app.status === "coming_soon";
          return (
            <div key={app.id} className="flex flex-col rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                {isInstalled && !isFuture && <Badge className="text-[10px]">Installed</Badge>}
                {isFuture && <Badge variant="outline" className="text-[10px]">Soon</Badge>}
              </div>
              <h3 className="text-sm font-semibold">{app.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground flex-1">{app.blurb}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{app.category}</span>
                <Button
                  size="sm"
                  variant={isInstalled ? "outline" : "primary"}
                  disabled={isFuture}
                  onClick={() => {
                    setAppInstalled(app.id, !isInstalled);
                    toast.success(`${app.name} ${isInstalled ? "uninstalled" : "installed"}`);
                  }}
                  className="h-8 text-xs"
                >
                  {isFuture ? "Notify me" : isInstalled ? "Uninstall" : "Install"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- API Center -------------------------------------------------------------

const SCOPES = ["courses:read", "courses:write", "students:read", "leads:read", "leads:write", "webhooks:write"];

export function ApiCenter() {
  const keys = useApiKeys();
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState("");
  const [mode, setMode] = useState<"live" | "sandbox">("sandbox");
  const [scopes, setScopes] = useState<string[]>(["courses:read"]);

  const handleCreate = () => {
    if (!label.trim()) return toast.error("Label is required");
    const k = createApiKey({ label: label.trim(), scopes, mode });
    toast.success(`Created ${k.prefix}`);
    setCreating(false);
    setLabel("");
  };

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-label mb-1">Developer</p>
          <h2 className="text-xl font-semibold tracking-tight">API Center</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Programmatic access to your Glintr academy. Keys are per-brand and per-mode.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus className="mr-1 h-4 w-4" /> New key</Button>
      </header>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Label</th>
              <th className="px-4 py-3 font-medium">Key</th>
              <th className="px-4 py-3 font-medium">Mode</th>
              <th className="px-4 py-3 font-medium">Scopes</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {keys.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No API keys yet. Create one to start using Glintr's API.
                </td>
              </tr>
            )}
            {keys.map((k) => (
              <tr key={k.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{k.label}</td>
                <td className="px-4 py-3 font-mono text-xs">
                  <span className="flex items-center gap-1.5">
                    {k.prefix}
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(k.prefix);
                        toast.success("Copied");
                      }}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Copy key prefix"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={k.mode === "live" ? "default" : "outline" as never} className="text-[10px] uppercase">{k.mode}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{k.scopes.join(", ")}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(k.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      revokeApiKey(k.id);
                      toast.success("Key revoked");
                    }}
                    className="text-danger hover:bg-danger/10"
                  >
                    Revoke
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Zap className="h-4 w-4 text-primary" /> Getting started
        </h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Authenticate every request with a bearer token. Sandbox keys never affect live data.
        </p>
        <pre className="overflow-x-auto rounded-lg bg-background/70 p-3 font-mono text-[11px] leading-relaxed">
{`curl https://api.glintr.com/v1/courses \\
  -H "Authorization: Bearer <YOUR_KEY>" \\
  -H "Content-Type: application/json"`}
        </pre>
      </section>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create API key</DialogTitle>
            <DialogDescription>Scopes limit what this key can do.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium">Label</label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Production backend" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium">Mode</label>
              <Select value={mode} onValueChange={(v) => setMode(v as "live" | "sandbox")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium">Scopes</label>
              <div className="flex flex-wrap gap-1.5">
                {SCOPES.map((s) => {
                  const on = scopes.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setScopes((cur) => (on ? cur.filter((x) => x !== s) : [...cur, s]))}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[11px] font-mono",
                        on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40",
                      )}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
            <Button onClick={handleCreate}><KeyRound className="mr-1 h-4 w-4" /> Create key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Health monitor ---------------------------------------------------------

export function HealthMonitor() {
  const { connections } = useConnections();
  const rows = Object.entries(connections)
    .map(([id, s]) => ({ id, state: s, provider: findProvider(id) }))
    .filter((r) => r.provider) as Array<{ id: string; state: ConnectionState; provider: Provider }>;

  const healthy = rows.filter((r) => r.state.connected && (r.state.errorCount ?? 0) === 0).length;
  const degraded = rows.length - healthy;

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-label mb-1">Health</p>
          <h2 className="text-xl font-semibold tracking-tight">Connection health monitor</h2>
        </div>
        <div className="flex gap-2 text-xs">
          <Stat label="Healthy" value={healthy} tone="emerald" />
          <Stat label="Degraded" value={degraded} tone="amber" />
          <Stat label="Total" value={rows.length} tone="muted" />
        </div>
      </header>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Provider</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Last sync</th>
              <th className="px-4 py-3 font-medium">Errors</th>
              <th className="px-4 py-3 font-medium">Usage</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No integrations connected yet.
                </td>
              </tr>
            )}
            {rows.map(({ id, state, provider }) => {
              const errored = (state.errorCount ?? 0) > 0;
              return (
                <tr key={id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{provider.name}</td>
                  <td className="px-4 py-3">
                    {state.connected ? (
                      errored ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-amber-500">
                          <AlertTriangle className="h-3.5 w-3.5" /> Degraded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-500">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Healthy
                        </span>
                      )
                    ) : (
                      <span className="text-xs text-muted-foreground">Disconnected</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {state.lastSyncAt ? new Date(state.lastSyncAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs">{state.errorCount ?? 0}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{state.usage ?? 0} calls / 30d</td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => {
                        setConnection(id, { lastSyncAt: Date.now(), errorCount: 0 });
                        toast.success(`${provider.name} re-synced`);
                      }}
                    >
                      <RefreshCcw className="mr-1 h-3 w-3" /> Test
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-primary" /> Credential hygiene
        </h3>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li className="flex items-start gap-2"><ChevronRight className="mt-0.5 h-3 w-3 text-primary" /> Rotate production API keys every 90 days.</li>
          <li className="flex items-start gap-2"><ChevronRight className="mt-0.5 h-3 w-3 text-primary" /> Use sandbox keys during development — live keys only from CI/CD secret stores.</li>
          <li className="flex items-start gap-2"><ChevronRight className="mt-0.5 h-3 w-3 text-primary" /> Prefer OAuth over static tokens where the provider supports it.</li>
          <li className="flex items-start gap-2"><ChevronRight className="mt-0.5 h-3 w-3 text-primary" /> Audit connection changes from the Activity center.</li>
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "emerald" | "amber" | "muted" }) {
  const map: Record<typeof tone, string> = {
    emerald: "bg-emerald-500/10 text-emerald-500",
    amber: "bg-amber-500/10 text-amber-500",
    muted: "bg-muted text-foreground",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", map[tone])}>
      <Package className="h-3 w-3" />
      {label}: {value}
    </span>
  );
}
