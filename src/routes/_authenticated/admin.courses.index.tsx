import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Copy, Archive, ExternalLink } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/admin/courses/")({
  component: CoursesList,
});

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
}

function CoursesList() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [newCourse, setNewCourse] = useState({ name: "", slug: "", category_id: "" });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories-list"],
    queryFn: async () => (await supabase.from("course_categories").select("id,name").order("display_order")).data ?? [],
  });

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["admin-courses", search, statusFilter],
    queryFn: async () => {
      let q = supabase.from("courses").select("id,name,slug,status,is_featured,is_bestseller,base_price,offer_price,currency,category:course_categories(name,slug),display_order").order("display_order");
      if (statusFilter !== "all") q = q.eq("status", statusFilter as any);
      if (search) q = q.ilike("name", `%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!newCourse.name || !newCourse.category_id) throw new Error("Name & category required");
      const { data, error } = await supabase.from("courses").insert({
        name: newCourse.name,
        slug: newCourse.slug || slugify(newCourse.name),
        category_id: newCourse.category_id,
        status: "draft",
      }).select("id").single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      toast.success("Course created");
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      setCreating(false);
      navigate({ to: "/admin/courses/$id", params: { id } });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const bulk = useMutation({
    mutationFn: async ({ action }: { action: "publish" | "unpublish" | "archive" | "feature" | "unfeature" }) => {
      const ids = [...selected];
      if (!ids.length) throw new Error("Select courses first");
      const patch: Record<string, any> = {};
      if (action === "publish") patch.status = "published";
      if (action === "unpublish") patch.status = "draft";
      if (action === "archive") patch.status = "archived";
      if (action === "feature") patch.is_featured = true;
      if (action === "unfeature") patch.is_featured = false;
      const { error } = await supabase.from("courses").update(patch).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Updated");
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const duplicate = useMutation({
    mutationFn: async (id: string) => {
      const src = courses.find((c: any) => c.id === id);
      if (!src) return;
      const { data: full } = await supabase.from("courses").select("*").eq("id", id).single();
      if (!full) return;
      const { id: _omit, created_at, updated_at, created_by, updated_by, ...rest } = full as any;
      const copy = { ...rest, name: `${rest.name} (copy)`, slug: `${rest.slug}-copy-${Date.now().toString(36)}`, status: "draft" };
      const { error } = await supabase.from("courses").insert(copy as any);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Duplicated"); qc.invalidateQueries({ queryKey: ["admin-courses"] }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-heading-xl font-display font-semibold">Courses</h2>
          <p className="text-muted-foreground mt-1 text-sm">{courses.length} program{courses.length === 1 ? "" : "s"} · manage catalogue, pricing, curriculum.</p>
        </div>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild><Button variant="gradient"><Plus className="size-4" /> New course</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New course</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={newCourse.name} onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value, slug: slugify(e.target.value) })} className="mt-2 h-11" />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={newCourse.slug} onChange={(e) => setNewCourse({ ...newCourse, slug: e.target.value })} className="mt-2 h-11" />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={newCourse.category_id} onValueChange={(v) => setNewCourse({ ...newCourse, category_id: v })}>
                  <SelectTrigger className="mt-2 h-11"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
              <Button variant="gradient" onClick={() => create.mutate()} disabled={create.isPending}>Create & continue</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses" className="h-11 pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 h-11"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selected.size > 0 ? (
        <div className="card-elevated p-3 flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium mr-2">{selected.size} selected</span>
          <Button size="sm" variant="outline" onClick={() => bulk.mutate({ action: "publish" })}>Publish</Button>
          <Button size="sm" variant="outline" onClick={() => bulk.mutate({ action: "unpublish" })}>Unpublish</Button>
          <Button size="sm" variant="outline" onClick={() => bulk.mutate({ action: "feature" })}>Feature</Button>
          <Button size="sm" variant="outline" onClick={() => bulk.mutate({ action: "unfeature" })}>Unfeature</Button>
          <Button size="sm" variant="outline" onClick={() => bulk.mutate({ action: "archive" })}><Archive className="size-3.5" /> Archive</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      ) : null}

      <div className="card-elevated overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2/60 text-left text-caption">
            <tr>
              <th className="p-3 w-10"></th>
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Loading…</td></tr> : null}
            {courses.map((c: any) => {
              const price = c.offer_price ?? c.base_price;
              return (
                <tr key={c.id} className="border-t border-border/50">
                  <td className="p-3">
                    <Checkbox checked={selected.has(c.id)} onCheckedChange={(v) => {
                      const next = new Set(selected);
                      if (v) next.add(c.id); else next.delete(c.id);
                      setSelected(next);
                    }} />
                  </td>
                  <td className="p-3">
                    <Link to="/admin/courses/$id" params={{ id: c.id }} className="font-medium hover:text-primary">{c.name}</Link>
                    <div className="text-caption text-mono">/{c.slug}</div>
                  </td>
                  <td className="p-3">{c.category?.name ?? "—"}</td>
                  <td className="p-3 text-mono">{price ? `₹${Number(price).toLocaleString("en-IN")}` : "—"}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Badge variant={c.status === "published" ? "success" : c.status === "archived" ? "muted" : "outline"}>{c.status}</Badge>
                      {c.is_featured ? <Badge variant="featured">Featured</Badge> : null}
                      {c.is_bestseller ? <Badge variant="bestseller">Best</Badge> : null}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      {c.status === "published" && c.category?.slug ? (
                        <a href={`/programs/${c.category.slug}/${c.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center h-8 w-8 rounded hover:bg-surface-2"><ExternalLink className="size-4" /></a>
                      ) : null}
                      <Button variant="ghost" size="icon" title="Duplicate" onClick={() => duplicate.mutate(c.id)}><Copy className="size-4" /></Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!isLoading && courses.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No courses match your filters.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
