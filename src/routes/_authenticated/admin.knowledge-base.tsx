import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminListKbCategories, adminListKbArticles, upsertKbCategory, upsertKbArticle,
  aiGenerateKbArticle, deleteKbArticle, deleteKbCategory, getAdminKbArticle, restoreKbVersion,
  kbKinds,
} from "@/lib/admin/kb.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Sparkles, Trash2, History, Save, FolderTree, FileText, Wand2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/knowledge-base")({
  head: () => ({ meta: [{ title: "Knowledge Base — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminKb,
});

function AdminKb() {
  const qc = useQueryClient();
  const cats = useQuery({ queryKey: ["adm-kb-cats"], queryFn: () => adminListKbCategories() });
  const arts = useQuery({ queryKey: ["adm-kb-arts"], queryFn: () => adminListKbArticles({ data: {} }) });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Knowledge Base</h1>
        <p className="text-muted-foreground">Help articles, FAQs, tutorials, guides, walkthroughs & videos.</p>
      </div>

      <Tabs defaultValue="articles">
        <TabsList>
          <TabsTrigger value="articles"><FileText size={14} className="mr-1" /> Articles</TabsTrigger>
          <TabsTrigger value="categories"><FolderTree size={14} className="mr-1" /> Categories</TabsTrigger>
          <TabsTrigger value="ai"><Sparkles size={14} className="mr-1" /> AI Generator</TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="mt-6">
          <ArticlesPanel qc={qc} categories={cats.data?.categories || []} articles={arts.data?.articles || []} loading={arts.isLoading} />
        </TabsContent>
        <TabsContent value="categories" className="mt-6">
          <CategoriesPanel qc={qc} categories={cats.data?.categories || []} />
        </TabsContent>
        <TabsContent value="ai" className="mt-6">
          <AiGeneratorPanel qc={qc} categories={cats.data?.categories || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CategoriesPanel({ qc, categories }: any) {
  const [form, setForm] = useState<any>({ name: "", description: "", icon: "BookOpen", color: "#22d3ee", position: 0, published: true });
  const save = useMutation({
    mutationFn: (data: any) => upsertKbCategory({ data }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["adm-kb-cats"] }); qc.invalidateQueries({ queryKey: ["kb-cats"] }); toast.success("Saved"); setForm({ name: "", description: "", icon: "BookOpen", color: "#22d3ee", position: 0, published: true }); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteKbCategory({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["adm-kb-cats"] }); toast.success("Deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="p-4">
        <div className="font-semibold mb-3">{form.id ? "Edit category" : "New category"}</div>
        <div className="space-y-3">
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Icon" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
            <Input placeholder="#Color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            <Input type="number" placeholder="Position" value={form.position} onChange={(e) => setForm({ ...form, position: Number(e.target.value) })} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} /> Published
          </label>
          <Button onClick={() => save.mutate(form)} disabled={save.isPending || !form.name}>
            <Save size={14} className="mr-1" /> Save
          </Button>
        </div>
      </Card>
      <Card className="p-4">
        <div className="font-semibold mb-3">Categories ({categories.length})</div>
        <div className="space-y-2">
          {categories.map((c: any) => (
            <div key={c.id} className="flex items-center justify-between p-2 border rounded hover:bg-accent/40">
              <div>
                <div className="font-medium text-sm">{c.name} <Badge variant="outline" className="ml-2 text-[10px]">{c.slug}</Badge></div>
                {c.description && <div className="text-xs text-muted-foreground line-clamp-1">{c.description}</div>}
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => setForm(c)}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => confirm(`Delete "${c.name}"?`) && del.mutate(c.id)}><Trash2 size={14} /></Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ArticlesPanel({ qc, categories, articles, loading }: any) {
  const [editing, setEditing] = useState<any | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const del = useMutation({
    mutationFn: (id: string) => deleteKbArticle({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["adm-kb-arts"] }); toast.success("Deleted"); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button onClick={() => { setEditing(null); setShowEditor(true); }}><Plus size={14} className="mr-1" /> New article</Button>
      </div>
      <Card className="divide-y">
        {loading && <div className="p-6 text-muted-foreground">Loading…</div>}
        {articles.map((a: any) => (
          <div key={a.id} className="p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium truncate">{a.title}</div>
              <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="uppercase text-[10px]">{a.kind}</Badge>
                {a.published ? <Badge variant="info">Published</Badge> : <Badge variant="outline">Draft</Badge>}
                {a.featured && <Badge variant="featured">Featured</Badge>}
                <span>v{a.version}</span>
                <span>{a.view_count} views</span>
                <span>{a.helpful_count}👍 / {a.unhelpful_count}👎</span>
              </div>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => { setEditing(a); setShowEditor(true); }}>Edit</Button>
              <Button size="sm" variant="ghost" onClick={() => confirm("Delete article?") && del.mutate(a.id)}><Trash2 size={14} /></Button>
            </div>
          </div>
        ))}
        {!loading && articles.length === 0 && <div className="p-6 text-muted-foreground text-center">No articles yet. Create one or use the AI Generator.</div>}
      </Card>

      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit article" : "New article"}</DialogTitle></DialogHeader>
          <ArticleEditor
            initial={editing}
            categories={categories}
            onSaved={() => { setShowEditor(false); qc.invalidateQueries({ queryKey: ["adm-kb-arts"] }); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ArticleEditor({ initial, categories, onSaved }: any) {
  const [form, setForm] = useState<any>(
    initial
      ? { ...initial, tags: (initial.tags || []).join(", "), seo_keywords: (initial.seo_keywords || []).join(", ") }
      : { title: "", kind: "article", summary: "", body_md: "", tags: "", seo_keywords: "", published: false, featured: false },
  );
  const [tab, setTab] = useState("content");
  const detail = useQuery({
    queryKey: ["adm-kb-detail", initial?.id],
    queryFn: () => getAdminKbArticle({ data: { id: initial.id } }),
    enabled: !!initial?.id,
  });
  const save = useMutation({
    mutationFn: (data: any) => upsertKbArticle({ data }),
    onSuccess: () => { toast.success("Saved"); onSaved(); },
    onError: (e: any) => toast.error(e.message),
  });
  const restore = useMutation({
    mutationFn: (v: any) => restoreKbVersion({ data: { article_id: initial.id, version_id: v.id } }),
    onSuccess: () => { toast.success("Restored"); onSaved(); },
    onError: (e: any) => toast.error(e.message),
  });

  function submit() {
    save.mutate({
      id: initial?.id,
      title: form.title,
      kind: form.kind,
      category_id: form.category_id || null,
      summary: form.summary,
      body_md: form.body_md,
      video_url: form.video_url || undefined,
      cover_image: form.cover_image || undefined,
      tags: (form.tags || "").split(",").map((s: string) => s.trim()).filter(Boolean),
      seo_title: form.seo_title,
      seo_description: form.seo_description,
      seo_keywords: (form.seo_keywords || "").split(",").map((s: string) => s.trim()).filter(Boolean),
      published: form.published,
      featured: form.featured,
      version_note: form.version_note,
    });
  }

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="content">Content</TabsTrigger>
        <TabsTrigger value="seo">SEO</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
        {initial?.id && <TabsTrigger value="history"><History size={14} className="mr-1" /> History</TabsTrigger>}
      </TabsList>
      <TabsContent value="content" className="space-y-3 mt-4">
        <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {kbKinds.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={form.category_id || ""} onValueChange={(v) => setForm({ ...form, category_id: v || null })}>
            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Textarea placeholder="Summary (150-200 chars)" value={form.summary || ""} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
        <Textarea
          placeholder="Body (Markdown)"
          className="min-h-[280px] font-mono text-sm"
          value={form.body_md || ""}
          onChange={(e) => setForm({ ...form, body_md: e.target.value })}
        />
        {form.kind === "video" && (
          <Input placeholder="Video URL (YouTube/Vimeo embed)" value={form.video_url || ""} onChange={(e) => setForm({ ...form, video_url: e.target.value })} />
        )}
        <Input placeholder="Tags (comma separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
        <Input placeholder="Version note (optional)" value={form.version_note || ""} onChange={(e) => setForm({ ...form, version_note: e.target.value })} />
      </TabsContent>
      <TabsContent value="seo" className="space-y-3 mt-4">
        <Input placeholder="SEO title (≤60 chars)" value={form.seo_title || ""} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} />
        <Textarea placeholder="SEO description (≤160 chars)" value={form.seo_description || ""} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} />
        <Input placeholder="Keywords (comma separated)" value={form.seo_keywords} onChange={(e) => setForm({ ...form, seo_keywords: e.target.value })} />
        <Input placeholder="Cover image URL" value={form.cover_image || ""} onChange={(e) => setForm({ ...form, cover_image: e.target.value })} />
      </TabsContent>
      <TabsContent value="settings" className="space-y-3 mt-4">
        <label className="flex items-center gap-2"><Switch checked={!!form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} /> Published (Google-indexable)</label>
        <label className="flex items-center gap-2"><Switch checked={!!form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} /> Featured</label>
      </TabsContent>
      {initial?.id && (
        <TabsContent value="history" className="mt-4">
          <div className="space-y-2">
            {(detail.data?.versions || []).map((v: any) => (
              <div key={v.id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <div className="text-sm font-medium">v{v.version_number} — {v.title}</div>
                  <div className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleString()} {v.note ? `· ${v.note}` : ""}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => restore.mutate(v)}>Restore</Button>
              </div>
            ))}
            {!detail.data?.versions?.length && <div className="text-muted-foreground text-sm">No previous versions yet.</div>}
            <div className="mt-4 font-semibold">Recent feedback</div>
            {(detail.data?.feedback || []).map((f: any) => (
              <div key={f.id} className="p-2 border rounded text-sm">
                {f.helpful ? "👍" : "👎"} {f.comment && <span className="text-muted-foreground">— {f.comment}</span>}
              </div>
            ))}
          </div>
        </TabsContent>
      )}
      <div className="pt-4 flex justify-end gap-2">
        <Button onClick={submit} disabled={save.isPending || !form.title}>
          <Save size={14} className="mr-1" /> Save
        </Button>
      </div>
    </Tabs>
  );
}

function AiGeneratorPanel({ qc, categories }: any) {
  const [form, setForm] = useState<any>({ topic: "", kind: "article", category_id: "", audience: "", publish: false });
  const [preview, setPreview] = useState<any | null>(null);
  const gen = useMutation({
    mutationFn: (save: boolean) => aiGenerateKbArticle({
      data: {
        topic: form.topic,
        kind: form.kind,
        category_id: form.category_id || null,
        audience: form.audience || undefined,
        save,
        publish: save && form.publish,
      },
    }),
    onSuccess: (res: any) => {
      setPreview(res.preview);
      if (res.article) { toast.success("Article saved"); qc.invalidateQueries({ queryKey: ["adm-kb-arts"] }); }
      else toast.success("Preview ready");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="p-4 space-y-3">
        <div className="font-semibold flex items-center gap-2"><Wand2 size={16} /> AI article generator</div>
        <Input placeholder='Topic (e.g. "How to enroll in a course")' value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {kbKinds.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Input placeholder='Audience (e.g. "First-time students")' value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} />
        <label className="flex items-center gap-2 text-sm"><Switch checked={form.publish} onCheckedChange={(v) => setForm({ ...form, publish: v })} /> Publish immediately</label>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => gen.mutate(false)} disabled={gen.isPending || !form.topic}>Preview</Button>
          <Button onClick={() => gen.mutate(true)} disabled={gen.isPending || !form.topic}>
            <Sparkles size={14} className="mr-1" /> Generate & Save
          </Button>
        </div>
        {gen.isPending && <div className="text-sm text-muted-foreground">Generating…</div>}
      </Card>
      <Card className="p-4">
        <div className="font-semibold mb-2">Preview</div>
        {!preview && <div className="text-muted-foreground text-sm">Generate to preview the AI output.</div>}
        {preview && (
          <div className="space-y-2 text-sm">
            <div className="text-lg font-bold">{preview.title}</div>
            <div className="text-muted-foreground">{preview.summary}</div>
            <div className="max-h-[400px] overflow-y-auto border rounded p-3 whitespace-pre-wrap font-mono text-xs bg-muted/30">{preview.body_md}</div>
            <div className="flex flex-wrap gap-1">
              {(preview.tags || []).map((t: string) => <Badge key={t} variant="outline">#{t}</Badge>)}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
