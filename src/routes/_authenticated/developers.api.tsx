import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DeveloperShell } from "@/components/developers/developer-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Key, Copy, RotateCcw, Trash2, Plus, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/developers/api")({
  component: ApiKeysPage,
});

type ApiKey = {
  id: string;
  name: string;
  environment: "development" | "production";
  prefix: string;
  scopes: string[];
  createdAt: string;
  lastUsed: string | null;
};

const SCOPES = [
  "projects:read", "projects:write",
  "campaigns:read", "campaigns:write",
  "ai:read", "ai:write",
  "knowledge:read", "knowledge:write",
  "analytics:read",
  "templates:read", "templates:write",
  "billing:read",
  "integrations:read", "integrations:write",
];

const SEED: ApiKey[] = [
  { id: "1", name: "Production server", environment: "production", prefix: "gk_live_a1b2", scopes: ["projects:read","ai:write"], createdAt: "2026-05-14", lastUsed: "2 min ago" },
  { id: "2", name: "Staging", environment: "development", prefix: "gk_test_c3d4", scopes: ["*"], createdAt: "2026-06-02", lastUsed: "1 h ago" },
];

function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>(SEED);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [env, setEnv] = useState<"development" | "production">("development");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const toggleScope = (s: string) =>
    setSelectedScopes((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  const create = () => {
    if (!name.trim()) return toast.error("Name is required");
    const prefix = env === "production" ? "gk_live_" : "gk_test_";
    const full = prefix + Math.random().toString(36).slice(2, 34);
    const nk: ApiKey = {
      id: crypto.randomUUID(),
      name,
      environment: env,
      prefix: full.slice(0, 12),
      scopes: selectedScopes.length ? selectedScopes : ["*"],
      createdAt: new Date().toISOString().slice(0, 10),
      lastUsed: null,
    };
    setKeys((p) => [nk, ...p]);
    setRevealedKey(full);
    setShowKey(true);
    setName("");
    setSelectedScopes([]);
    setOpen(false);
    toast.success("API key created");
  };

  const rotate = (id: string) => {
    setKeys((p) => p.map((k) => (k.id === id ? { ...k, prefix: (k.environment === "production" ? "gk_live_" : "gk_test_") + Math.random().toString(36).slice(2, 6) } : k)));
    toast.success("Key rotated. Copy the new secret.");
  };

  const revoke = (id: string) => {
    setKeys((p) => p.filter((k) => k.id !== id));
    toast.success("Key revoked");
  };

  return (
    <DeveloperShell>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">API Keys</h2>
          <p className="text-sm text-muted-foreground">Manage authentication credentials for your applications.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Create API Key</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input placeholder="Production server" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label>Environment</Label>
                <div className="mt-2 flex gap-2">
                  {(["development","production"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setEnv(v)}
                      className={`rounded-lg border px-3 py-1.5 text-sm capitalize ${env === v ? "border-primary bg-primary/10 text-primary" : ""}`}
                    >{v}</button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Scopes</Label>
                <div className="mt-2 grid max-h-48 grid-cols-2 gap-2 overflow-y-auto rounded-lg border p-3">
                  {SCOPES.map((s) => (
                    <label key={s} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={selectedScopes.includes(s)} onCheckedChange={() => toggleScope(s)} />
                      <span className="font-mono text-xs">{s}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={create}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {revealedKey && (
        <Card className="mt-6 border-amber-500/40 bg-amber-500/5 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold">Your new API key</div>
              <div className="mt-1 text-xs text-muted-foreground">Copy it now. You won't see it again.</div>
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100">
                <span className="truncate">{showKey ? revealedKey : revealedKey.slice(0, 8) + "•".repeat(24)}</span>
                <Button size="icon" variant="ghost" onClick={() => setShowKey((v) => !v)}>
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(revealedKey); toast.success("Copied"); }}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setRevealedKey(null)}>Dismiss</Button>
          </div>
        </Card>
      )}

      <Card className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Environment</th>
                <th className="px-4 py-3 text-left">Prefix</th>
                <th className="px-4 py-3 text-left">Scopes</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-left">Last used</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="border-t">
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-2"><Key className="h-4 w-4 text-muted-foreground" />{k.name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={k.environment === "production" ? "default" : "secondary"}>{k.environment}</Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{k.prefix}••••</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{k.scopes.slice(0, 2).join(", ")}{k.scopes.length > 2 ? ` +${k.scopes.length - 2}` : ""}</td>
                  <td className="px-4 py-3 text-muted-foreground">{k.createdAt}</td>
                  <td className="px-4 py-3 text-muted-foreground">{k.lastUsed ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => rotate(k.id)}><RotateCcw className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => revoke(k.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {keys.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">No API keys yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </DeveloperShell>
  );
}
