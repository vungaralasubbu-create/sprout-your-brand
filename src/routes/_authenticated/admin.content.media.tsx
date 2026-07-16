import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Upload, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { listMedia, registerMedia, deleteMedia } from "@/lib/admin/content.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/content/media")({
  component: MediaLibrary,
});

function MediaLibrary() {
  const list = useServerFn(listMedia);
  const register = useServerFn(registerMedia);
  const del = useServerFn(deleteMedia);
  const [q, setQ] = useState("");
  const [folder, setFolder] = useState("all");
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, refetch } = useQuery({
    queryKey: ["cms-media", folder, q],
    queryFn: () => list({ data: { q: q || undefined, folder } }),
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${folder === "all" ? "general" : folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("content-media").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data: signed } = await supabase.storage.from("content-media").createSignedUrl(path, 60 * 60 * 24 * 365);
      const publicUrl = signed?.signedUrl ?? "";
      return register({ data: {
        file_name: file.name, storage_path: path, public_url: publicUrl,
        mime_type: file.type, size_bytes: file.size, folder: folder === "all" ? "general" : folder,
      } });
    },
    onSuccess: () => { toast.success("Uploaded"); refetch(); },
    onError: (e: any) => toast.error(e.message ?? "Upload failed"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4 max-w-6xl">
      <header className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="font-display text-2xl font-semibold">Media Library</h1>
          <p className="text-sm text-muted-foreground">Images, illustrations, PDFs and SVGs used across content.</p>
        </div>
        <div>
          <input ref={fileRef} type="file" hidden onChange={(e) => e.target.files?.[0] && upload.mutate(e.target.files[0])} />
          <Button onClick={() => fileRef.current?.click()} disabled={upload.isPending}><Upload className="size-4 mr-1.5" />Upload</Button>
        </div>
      </header>

      <Card className="p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search filename…" className="pl-9 h-9" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["all", "general", "hero", "diagrams", "icons", "seo", "video"].map((f) => (
            <button
              key={f}
              onClick={() => setFolder(f)}
              className={`text-xs px-2.5 py-1 rounded-full border ${folder === f ? "bg-primary text-primary-foreground border-primary" : "border-border/60 hover:bg-surface-2"}`}
            >{f}</button>
          ))}
          {(data?.folders ?? []).filter((f: string) => !["general","hero","diagrams","icons","seo","video"].includes(f)).map((f: string) => (
            <button key={f} onClick={() => setFolder(f)}
              className={`text-xs px-2.5 py-1 rounded-full border ${folder === f ? "bg-primary text-primary-foreground border-primary" : "border-border/60 hover:bg-surface-2"}`}
            >{f}</button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {(data?.rows ?? []).map((m: any) => (
          <Card key={m.id} className="overflow-hidden group">
            <div className="aspect-square bg-surface-1 flex items-center justify-center overflow-hidden">
              {m.mime_type?.startsWith("image") ? (
                <img src={m.public_url} alt={m.alt_text ?? m.file_name} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="text-xs text-muted-foreground p-3 text-center">{m.mime_type}</div>
              )}
            </div>
            <div className="p-2 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs truncate">{m.file_name}</div>
                <div className="text-[10px] text-muted-foreground">{m.folder}</div>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(m.public_url); toast.success("URL copied"); }} className="text-[10px] text-primary hover:underline">Copy</button>
              <button onClick={() => { if (confirm("Delete?")) remove.mutate(m.id); }} className="text-muted-foreground hover:text-red-600"><Trash2 className="size-3.5" /></button>
            </div>
          </Card>
        ))}
        {!(data?.rows ?? []).length && <div className="col-span-full text-sm text-muted-foreground text-center py-12">No media yet — upload your first asset.</div>}
      </div>
    </div>
  );
}
