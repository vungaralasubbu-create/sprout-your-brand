import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronUp, ChevronDown, Plus, Pencil, Archive, CheckCircle2, XCircle } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: CategoriesPage,
});

interface Category {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  display_order: number;
  status: "draft" | "published" | "archived";
  is_featured: boolean;
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
}

function CategoriesPage() {
  const qc = useQueryClient();
  const { data: cats = [], isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("course_categories").select("*").order("display_order");
      if (error) throw error;
      return data as Category[];
    },
  });

  const [editing, setEditing] = useState<Partial<Category> | null>(null);

  const save = useMutation({
    mutationFn: async (c: Partial<Category>) => {
      if (c.id) {
        const { error } = await supabase.from("course_categories").update(c).eq("id", c.id);
        if (error) throw error;
      } else {
        const nextOrder = (cats[cats.length - 1]?.display_order ?? 0) + 1;
        const { error } = await supabase.from("course_categories").insert({
          name: c.name!,
          slug: c.slug || slugify(c.name!),
          short_description: c.short_description ?? null,
          display_order: nextOrder,
          status: c.status ?? "draft",
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Category["status"] }) => {
      const { error } = await supabase.from("course_categories").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-categories"] }),
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const reorder = useMutation({
    mutationFn: async ({ id, dir }: { id: string; dir: "up" | "down" }) => {
      const idx = cats.findIndex((c) => c.id === id);
      const swap = cats[dir === "up" ? idx - 1 : idx + 1];
      if (!swap) return;
      const a = cats[idx];
      await supabase.from("course_categories").update({ display_order: swap.display_order }).eq("id", a.id);
      await supabase.from("course_categories").update({ display_order: a.display_order }).eq("id", swap.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-categories"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-heading-xl font-display font-semibold">Categories</h2>
          <p className="text-muted-foreground mt-1 text-sm">Reorder, publish, and manage program categories.</p>
        </div>
        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogTrigger asChild>
            <Button variant="gradient" onClick={() => setEditing({ name: "", slug: "", short_description: "", status: "draft" })}>
              <Plus className="size-4" /> New category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing?.id ? "Edit category" : "New category"}</DialogTitle></DialogHeader>
            {editing ? (
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.id ? editing.slug : slugify(e.target.value) })} className="mt-2 h-11" />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} className="mt-2 h-11" />
                </div>
                <div>
                  <Label>Short description</Label>
                  <Input value={editing.short_description ?? ""} onChange={(e) => setEditing({ ...editing, short_description: e.target.value })} className="mt-2 h-11" />
                </div>
              </div>
            ) : null}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button variant="gradient" onClick={() => save.mutate(editing!)} disabled={save.isPending || !editing?.name}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="card-elevated overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2/60 text-left text-caption">
            <tr>
              <th className="p-3 w-24">Order</th>
              <th className="p-3">Name</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Loading…</td></tr> : null}
            {cats.map((c, i) => (
              <tr key={c.id} className="border-t border-border/50">
                <td className="p-3">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" disabled={i === 0} onClick={() => reorder.mutate({ id: c.id, dir: "up" })}><ChevronUp className="size-4" /></Button>
                    <Button variant="ghost" size="icon" disabled={i === cats.length - 1} onClick={() => reorder.mutate({ id: c.id, dir: "down" })}><ChevronDown className="size-4" /></Button>
                  </div>
                </td>
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 text-mono text-caption">{c.slug}</td>
                <td className="p-3">
                  <Badge variant={c.status === "published" ? "success" : c.status === "archived" ? "muted" : "outline"}>{c.status}</Badge>
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditing(c)}><Pencil className="size-4" /></Button>
                    {c.status !== "published" ? (
                      <Button variant="ghost" size="icon" title="Publish" onClick={() => setStatus.mutate({ id: c.id, status: "published" })}><CheckCircle2 className="size-4 text-primary" /></Button>
                    ) : (
                      <Button variant="ghost" size="icon" title="Unpublish" onClick={() => setStatus.mutate({ id: c.id, status: "draft" })}><XCircle className="size-4" /></Button>
                    )}
                    <Button variant="ghost" size="icon" title="Archive" onClick={() => setStatus.mutate({ id: c.id, status: "archived" })}><Archive className="size-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
