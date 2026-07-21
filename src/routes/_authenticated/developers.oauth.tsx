import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DeveloperShell } from "@/components/developers/developer-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Copy, RotateCcw, PlayCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/developers/oauth")({ component: OAuthPage });

const SEED = [
  { id: "1", name: "Zapier Integration", clientId: "gk_oauth_a1b2c3d4", redirect: "https://zapier.com/oauth/return/glintr", scopes: ["projects:read","ai:write"] },
];

function OAuthPage() {
  const [apps, setApps] = useState(SEED);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [redirect, setRedirect] = useState("");

  const create = () => {
    if (!name.trim() || !redirect.trim()) return toast.error("Fill required fields");
    setApps((p) => [{ id: crypto.randomUUID(), name, clientId: "gk_oauth_" + Math.random().toString(36).slice(2, 10), redirect, scopes: ["projects:read"] }, ...p]);
    setName(""); setDesc(""); setRedirect(""); setOpen(false);
    toast.success("OAuth app created");
  };

  return (
    <DeveloperShell>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">OAuth Platform</h2>
          <p className="text-sm text-muted-foreground">Build integrations that let other users authorize your application.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Create OAuth App</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create OAuth App</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Application name" value={name} onChange={(e) => setName(e.target.value)} />
              <Textarea placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} />
              <Input placeholder="Redirect URI — https://..." value={redirect} onChange={(e) => setRedirect(e.target.value)} />
            </div>
            <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={create}>Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {apps.map((a) => (
          <Card key={a.id} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold">{a.name}</div>
                <div className="mt-0.5 font-mono text-xs text-muted-foreground">{a.clientId}</div>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(a.clientId); toast.success("Client ID copied"); }}><Copy className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => toast.success("Secret rotated")}><RotateCcw className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => toast.success("Test flow started")}><PlayCircle className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Redirect URI</span><span className="truncate font-mono text-xs">{a.redirect}</span></div>
              <div className="flex justify-between gap-2"><span className="text-muted-foreground">Scopes</span><div className="flex flex-wrap justify-end gap-1">{a.scopes.map((s) => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}</div></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Client Secret</span><span className="font-mono text-xs">••••••••••••••••</span></div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6 p-6">
        <div className="text-sm font-semibold">Authorization endpoint</div>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-950 p-4 text-xs text-zinc-100">
{`GET https://api.glintr.com/oauth/authorize
  ?client_id=YOUR_CLIENT_ID
  &redirect_uri=YOUR_REDIRECT_URI
  &scope=projects:read+ai:write
  &response_type=code
  &state=RANDOM_STRING`}
        </pre>
      </Card>
    </DeveloperShell>
  );
}
