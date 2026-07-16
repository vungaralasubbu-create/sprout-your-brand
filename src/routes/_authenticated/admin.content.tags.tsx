import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listTags, upsertTag, deleteTag } from "@/lib/admin/content.functions";

export const Route = createFileRoute("/_authenticated/admin/content/tags")({
  component: TagsPage,
});

function TagsPage() {
  const list = useServerFn(listTags);
  const save = useServerFn(upsertTag);
  const del = useServerFn(deleteTag);
  const { data, refetch } = useQuery({ queryKey: ["cms-tags"], queryFn: () => list() });
  const [name, setName] = useState("");

  const create = useMutation({
    mutationFn: () => save({ data: { name } }),
    onSuccess: () => { setName(""); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => refetch(),
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4 max-w-4xl">
      <header>
        <h1 className="font-display text-2xl font-semibold">Tags</h1>
        <p className="text-sm text-muted-foreground">Cross-cutting labels shared across content types.</p>
      </header>
      <Card className="p-4 flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New tag name" />
        <Button onClick={() => create.mutate()} disabled={!name.trim()}><Plus className="size-4 mr-1.5" />Add</Button>
      </Card>
      <Card className="p-4">
        <div className="flex flex-wrap gap-1.5">
          {(data ?? []).map((t: any) => (
            <div key={t.id} className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2.5 py-1 text-xs">
              <span>{t.name}</span>
              <span className="text-muted-foreground text-[10px]">({t.usage_count})</span>
              <button onClick={() => { if (confirm(`Delete ${t.name}?`)) remove.mutate(t.id); }} className="text-muted-foreground hover:text-red-600 ml-1"><Trash2 className="size-3" /></button>
            </div>
          ))}
          {!(data ?? []).length && <Badge variant="outline">No tags yet</Badge>}
        </div>
      </Card>
    </div>
  );
}
