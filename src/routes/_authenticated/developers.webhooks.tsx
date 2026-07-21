import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DeveloperShell } from "@/components/developers/developer-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Webhook, RotateCcw, PlayCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/developers/webhooks")({ component: WebhooksPage });

const EVENTS = [
  "project.created","project.updated","campaign.published","ai.completed",
  "payment.success","payment.failed","subscription.changed","user.invited",
  "template.published","workflow.completed",
];

const SEED_HOOKS = [
  { id: "1", url: "https://api.example.com/glintr", events: ["project.created","ai.completed"], active: true },
];
const SEED_DELIVERIES = [
  { id: "d1", event: "ai.completed", status: "success", latency: 142, at: "2 min ago" },
  { id: "d2", event: "project.created", status: "success", latency: 98, at: "5 min ago" },
  { id: "d3", event: "payment.failed", status: "failed", latency: 4210, at: "1 h ago" },
];

function WebhooksPage() {
  const [hooks, setHooks] = useState(SEED_HOOKS);
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [sel, setSel] = useState<string[]>([]);

  const create = () => {
    if (!url.trim()) return toast.error("URL required");
    setHooks((p) => [{ id: crypto.randomUUID(), url, events: sel, active: true }, ...p]);
    setUrl(""); setSel([]); setOpen(false);
    toast.success("Webhook created");
  };

  return (
    <DeveloperShell>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Webhooks</h2>
          <p className="text-sm text-muted-foreground">Receive real-time events with retries and replay.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Create Webhook</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Webhook</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="https://your-app.com/webhooks/glintr" value={url} onChange={(e) => setUrl(e.target.value)} />
              <div>
                <div className="mb-2 text-sm font-medium">Events</div>
                <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto rounded-lg border p-3 sm:grid-cols-2">
                  {EVENTS.map((e) => (
                    <label key={e} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={sel.includes(e)} onCheckedChange={() => setSel((p) => p.includes(e) ? p.filter((x) => x !== e) : [...p, e])} />
                      <span className="font-mono text-xs">{e}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={create}>Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-0">
          <div className="border-b p-4 text-sm font-semibold">Endpoints</div>
          <div className="divide-y">
            {hooks.map((h) => (
              <div key={h.id} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2"><Webhook className="h-4 w-4 text-muted-foreground" /><span className="truncate font-mono text-sm">{h.url}</span></div>
                    <div className="mt-1 flex flex-wrap gap-1">{h.events.map((e) => <Badge key={e} variant="secondary" className="text-[10px]">{e}</Badge>)}</div>
                  </div>
                  <Badge variant={h.active ? "default" : "secondary"}>{h.active ? "Active" : "Paused"}</Badge>
                </div>
              </div>
            ))}
            {hooks.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No webhooks yet.</div>}
          </div>
        </Card>

        <Card className="p-0">
          <div className="flex items-center justify-between border-b p-4">
            <div className="text-sm font-semibold">Recent deliveries</div>
            <Button size="sm" variant="ghost"><RotateCcw className="mr-2 h-3.5 w-3.5" />Refresh</Button>
          </div>
          <div className="divide-y">
            {SEED_DELIVERIES.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-4 text-sm">
                <div>
                  <div className="font-mono text-xs">{d.event}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{d.at} · {d.latency}ms</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={d.status === "success" ? "default" : "destructive"}>{d.status}</Badge>
                  <Button size="icon" variant="ghost"><PlayCircle className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DeveloperShell>
  );
}
