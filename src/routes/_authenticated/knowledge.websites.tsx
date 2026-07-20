import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Globe, Plus, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { listSources, importWebsite } from "@/lib/knowledge/knowledge.functions";

export const Route = createFileRoute("/_authenticated/knowledge/websites")({
  component: WebsitesPage,
});

function WebsitesPage() {
  const qc = useQueryClient();
  const [url, setUrl] = useState("");
  const ls = useServerFn(listSources);
  const iw = useServerFn(importWebsite);
  const q = useQuery({ queryKey: ["kn-sources"], queryFn: () => ls({}) });
  const mut = useMutation({
    mutationFn: () => iw({ data: { url } }),
    onSuccess: () => { toast.success("Website scheduled for import"); setUrl(""); qc.invalidateQueries({ queryKey: ["kn-sources"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
  const sources = q.data?.sources ?? [];
  const websites = sources.filter((s: any) => s.kind === "website");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-6">
        <div className="text-sm font-semibold">Import a website</div>
        <p className="mt-1 text-xs text-muted-foreground">
          Add your homepage URL. Our crawler indexes Home, About, Services, Products, Pricing, Blogs, FAQ, Policies, Contact.
        </p>
        <div className="mt-3 flex gap-2">
          <input value={url} onChange={(e) => setUrl(e.target.value)} type="url" placeholder="https://yourcompany.com"
            className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          <Button disabled={!url.trim() || mut.isPending} onClick={() => mut.mutate()}>
            {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-1 h-4 w-4" /> Import</>}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card">
        <div className="border-b p-4 text-sm font-semibold">Imported websites</div>
        {websites.length === 0 ? (
          <div className="p-12 text-center">
            <Globe className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No websites imported yet.</p>
          </div>
        ) : (
          <div className="divide-y">
            {websites.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.url}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase",
                    s.status === "completed" ? "bg-emerald-500/10 text-emerald-600" :
                    s.status === "running" ? "bg-blue-500/10 text-blue-600" :
                    s.status === "failed" ? "bg-red-500/10 text-red-600" :
                    "bg-amber-500/10 text-amber-600")}>{s.status}</span>
                  <Button size="sm" variant="outline"><RefreshCw className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
