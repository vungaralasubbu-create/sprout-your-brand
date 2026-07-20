import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Star, Users2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/agency/templates")({
  component: () => (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Template Library</h2>
          <p className="text-sm text-muted-foreground">Curate what every client can use, remix, or must follow.</p>
        </div>
        <Button>+ New template</Button>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {["All", "Agency", "Shared", "Locked", "Premium", "Community"].map((f) => (
          <button key={f} className="rounded-full border px-3 py-1 hover:bg-muted">{f}</button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="h-32 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent" />
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">Campaign Template {i + 1}</div>
                {i % 3 === 0 && <Badge variant="secondary" className="gap-1"><Lock className="h-3 w-3" /> Locked</Badge>}
                {i % 3 === 1 && <Badge className="gap-1"><Star className="h-3 w-3" /> Premium</Badge>}
                {i % 3 === 2 && <Badge variant="outline" className="gap-1"><Users2 className="h-3 w-3" /> Shared</Badge>}
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">Complete multi-channel launch playbook, editable per client.</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">Preview</Button>
                <Button size="sm" className="flex-1">Assign</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  ),
});
