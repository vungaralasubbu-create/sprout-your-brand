import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, RefreshCw, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getProvider } from "@/lib/integrations/catalog";
import { listAccounts, disconnectAccount, syncAccount } from "@/lib/integrations/integrations.functions";
import { ProviderLogo } from "@/components/integrations/integrations-shell";

export const Route = createFileRoute("/_authenticated/integrations/installed")({
  component: Installed,
});

function Installed() {
  const qc = useQueryClient();
  const la = useServerFn(listAccounts);
  const da = useServerFn(disconnectAccount);
  const sa = useServerFn(syncAccount);
  const q = useQuery({ queryKey: ["intg-accounts"], queryFn: () => la({}) });
  const disc = useMutation({
    mutationFn: (id: string) => da({ data: { id } }),
    onSuccess: () => { toast.success("Disconnected"); qc.invalidateQueries({ queryKey: ["intg-accounts"] }); },
  });
  const sync = useMutation({
    mutationFn: (id: string) => sa({ data: { id } }),
    onSuccess: () => { toast.success("Synced"); qc.invalidateQueries({ queryKey: ["intg-accounts"] }); },
  });
  const accounts = q.data?.accounts ?? [];

  return (
    <div className="space-y-4">
      {accounts.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">Nothing connected yet.</p>
          <Button asChild className="mt-4"><Link to="/integrations">Browse marketplace</Link></Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((a: any) => {
            const cat = getProvider(a.provider);
            return (
              <div key={a.id} className="rounded-2xl border bg-card p-5">
                <div className="flex items-start justify-between">
                  <ProviderLogo provider={a.provider} name={cat?.name ?? a.provider} brandColor={cat?.brandColor} />
                  <HealthPill health={a.health} />
                </div>
                <div className="mt-3">
                  <Link to="/integrations/$provider" params={{ provider: a.provider }} className="font-semibold hover:underline">
                    {cat?.name ?? a.provider}
                  </Link>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {a.external_account?.slice(0, 32)} · {a.sync_frequency}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Last sync: {a.last_synced_at ? new Date(a.last_synced_at).toLocaleString() : "never"}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Button size="sm" variant="outline" disabled={sync.isPending} onClick={() => sync.mutate(a.id)}>
                    {sync.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />} Sync
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700"
                    disabled={disc.isPending} onClick={() => disc.mutate(a.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HealthPill({ health }: { health: string }) {
  const map: Record<string, string> = {
    healthy: "bg-emerald-500/10 text-emerald-600",
    warning: "bg-amber-500/10 text-amber-600",
    error: "bg-red-500/10 text-red-600",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase",
      map[health] ?? "bg-muted text-muted-foreground")}>{health}</span>
  );
}
