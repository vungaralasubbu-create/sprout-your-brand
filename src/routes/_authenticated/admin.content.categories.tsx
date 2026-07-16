import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { listCategories, upsertCategory, deleteCategory } from "@/lib/admin/content.functions";

export const Route = createFileRoute("/_authenticated/admin/content/categories")({
  component: CategoriesPage,
});

function CategoriesPage() {
  const listFn = useServerFn(listCategories);
  const saveFn = useServerFn(upsertCategory);
  const delFn = useServerFn(deleteCategory);
  const { data, refetch } = useQuery({ queryKey: ["cats"], queryFn: () => listFn() });

  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "", sort_order: 0 });

  const save = useMutation({
    mutationFn: () => saveFn({ data: { id: editing?.id, name: form.name, slug: form.slug, description: form.description, sort_order: Number(form.sort_order) } }),
    onSuccess: () => { toast.success("Saved"); setOpen(false); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  function openNew() { setEditing(null); setForm({ name: "", slug: "", description: "", sort_order: 0 }); setOpen(true); }
  function openEdit(c: any) { setEditing(c); setForm({ name: c.name, slug: c.slug, description: c.description ?? "", sort_order: c.sort_order }); setOpen(true); }

  return (
    <div className="space-y-4 max-w-4xl">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Categories</h1>
          <p className="text-sm text-muted-foreground">Top-level taxonomy for grouping content across the site.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew}><Plus className="size-4 mr-1.5" />New</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} category</DialogTitle></DialogHeader>
            <div className="space-y-2">
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Slug (optional)</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>Sort order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} /></div>
            </div>
            <DialogFooter>
              <Button onClick={() => save.mutate()} disabled={!form.name.trim() || save.isPending}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <Card className="divide-y divide-border/60">
        {(data ?? []).map((c: any) => (
          <div key={c.id} className="flex items-center justify-between px-4 py-2.5">
            <div>
              <div className="font-medium text-sm">{c.name}</div>
              <div className="text-xs text-muted-foreground">/{c.slug} · {c.description}</div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="ghost" onClick={() => openEdit(c)}><Edit className="size-3.5" /></Button>
              <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Delete ${c.name}?`)) del.mutate(c.id); }}><Trash2 className="size-3.5 text-red-600" /></Button>
            </div>
          </div>
        ))}
        {!(data ?? []).length && <div className="p-6 text-sm text-muted-foreground text-center">No categories yet.</div>}
      </Card>
    </div>
  );
}
