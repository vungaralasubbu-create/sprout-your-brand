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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { listAuthors, upsertAuthor, deleteAuthor } from "@/lib/admin/content.functions";

export const Route = createFileRoute("/_authenticated/admin/content/authors")({
  component: AuthorsPage,
});

function AuthorsPage() {
  const list = useServerFn(listAuthors);
  const save = useServerFn(upsertAuthor);
  const del = useServerFn(deleteAuthor);
  const { data, refetch } = useQuery({ queryKey: ["cms-authors"], queryFn: () => list() });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", role: "", bio: "", avatar_url: "" });

  const saveMut = useMutation({
    mutationFn: () => save({ data: { id: editing?.id, ...form } }),
    onSuccess: () => { toast.success("Saved"); setOpen(false); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  function openNew() { setEditing(null); setForm({ name: "", slug: "", role: "", bio: "", avatar_url: "" }); setOpen(true); }
  function openEdit(a: any) { setEditing(a); setForm({ name: a.name, slug: a.slug, role: a.role ?? "", bio: a.bio ?? "", avatar_url: a.avatar_url ?? "" }); setOpen(true); }

  return (
    <div className="space-y-4 max-w-5xl">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Authors</h1>
          <p className="text-sm text-muted-foreground">Editorial bylines used on published content.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew}><Plus className="size-4 mr-1.5" />Author</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} author</DialogTitle></DialogHeader>
            <div className="space-y-2">
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
              <div><Label>Role / Title</Label><Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Senior Editor, Head of Curriculum" /></div>
              <div><Label>Avatar URL</Label><Input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} /></div>
              <div><Label>Bio</Label><Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4} /></div>
            </div>
            <DialogFooter><Button onClick={() => saveMut.mutate()} disabled={!form.name.trim()}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(data ?? []).map((a: any) => (
          <Card key={a.id} className="p-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={a.avatar_url} />
                <AvatarFallback>{a.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm truncate">{a.name}</div>
                <div className="text-xs text-muted-foreground truncate">{a.role || "—"}</div>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => openEdit(a)} className="text-muted-foreground hover:text-foreground"><Edit className="size-3.5" /></button>
                <button onClick={() => { if (confirm("Delete?")) del({ data: { id: a.id } }).then(() => refetch()); }} className="text-muted-foreground hover:text-red-600"><Trash2 className="size-3.5" /></button>
              </div>
            </div>
            {a.bio && <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{a.bio}</p>}
          </Card>
        ))}
        {!(data ?? []).length && <div className="col-span-full text-sm text-muted-foreground text-center py-12">No authors yet.</div>}
      </div>
    </div>
  );
}
