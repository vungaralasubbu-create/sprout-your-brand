import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Key, Plus, Copy, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { listTokens, createToken, revokeToken } from "@/lib/integrations/integrations.functions";

export const Route = createFileRoute("/_authenticated/integrations/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const lt = useServerFn(listTokens);
  const ct = useServerFn(createToken);
  const rt = useServerFn(revokeToken);
  const q = useQuery({ queryKey: ["intg-tokens"], queryFn: () => lt({}) });
  const [name, setName] = useState("");
  const [issued, setIssued] = useState<string | null>(null);
  const create = useMutation({
    mutationFn: () => ct({ data: { name, scopes: ["read","write"], expires_in_days: 90 } }),
    onSuccess: (r) => { setIssued(r.token); setName(""); toast.success("Token created"); qc.invalidateQueries({ queryKey: ["intg-tokens"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
  const revoke = useMutation({
    mutationFn: (id: string) => rt({ data: { id } }),
    onSuccess: () => { toast.success("Revoked"); qc.invalidateQueries({ queryKey: ["intg-tokens"] }); },
  });
  const tokens = q.data?.tokens ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-card">
        <div className="border-b p-5">
          <div className="text-sm font-semibold">API tokens</div>
          <p className="mt-0.5 text-xs text-muted-foreground">Programmatic access to your workspace integrations. Rotate and scope as needed.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2 p-5">
          <div className="flex-1 min-w-[240px]">
            <label className="text-xs font-medium text-muted-foreground">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Production integration"
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <Button disabled={!name.trim() || create.isPending} onClick={() => create.mutate()}>
            {create.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Plus className="mr-1 h-3 w-3" />} Create token
          </Button>
        </div>
        {issued && (
          <div className="mx-5 mb-5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <div className="text-xs font-semibold text-amber-700 dark:text-amber-500">Copy your token — you won't see it again</div>
            <div className="mt-2 flex items-center gap-2 rounded-lg border bg-background p-2 font-mono text-xs">
              <span className="flex-1 break-all">{issued}</span>
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(issued); toast.success("Copied"); }}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <Button size="sm" variant="ghost" className="mt-2" onClick={() => setIssued(null)}>I've saved it</Button>
          </div>
        )}
        {tokens.length === 0 ? (
          <div className="p-8 text-center">
            <Key className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-xs text-muted-foreground">No tokens yet.</p>
          </div>
        ) : (
          <div className="divide-y">
            {tokens.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="mt-0.5 font-mono text-xs text-muted-foreground">{t.token_prefix}••••••••</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    Created {new Date(t.created_at).toLocaleDateString()} · Expires {t.expires_at ? new Date(t.expires_at).toLocaleDateString() : "never"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    t.revoked_at ? "bg-muted text-muted-foreground" : "bg-emerald-500/10 text-emerald-600")}>
                    {t.revoked_at ? "Revoked" : "Active"}
                  </span>
                  {!t.revoked_at && (
                    <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => revoke.mutate(t.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <div className="text-sm font-semibold">Security</div>
        <p className="mt-1 text-xs text-muted-foreground">
          All OAuth tokens are encrypted at rest, scoped to the workspace, and rotated automatically. Every connect, sync, and disconnect writes an audit log.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          {["OAuth 2.0","Encrypted tokens","Workspace isolation","Audit logs","Permission scopes","Secret rotation","Rate limiting","Least privilege"].map((f) => (
            <div key={f} className="rounded-lg border bg-background px-3 py-2">{f}</div>
          ))}
        </div>
      </section>
    </div>
  );
}
