import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  Save, Send, Eye, History, MessageSquare, ShieldCheck, Sparkles, Link2, Calendar,
  Trash2, ArrowLeft, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import {
  getContent, upsertContent, changeContentStatus, listCategories, listAuthors, listTags,
  runQualityChecks, suggestInternalLinks, addContentComment, toggleCommentResolved, restoreRevision,
} from "@/lib/admin/content.functions";
import { CONTENT_TYPES, CONTENT_TYPE_LABEL, STATUS_COLOR, STATUS_LABEL, CONTENT_STATUSES, type ContentType } from "@/lib/admin/content-meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/content/articles/$id")({
  component: EditorPage,
});

type FormState = {
  type: ContentType;
  title: string;
  slug: string;
  summary: string;
  body_markdown: string;
  featured_image: string;
  featured_image_alt: string;
  category_id: string | null;
  author_id: string | null;
  reviewer_id: string | null;
  tag_slugs: string[];
  seo_title: string;
  seo_description: string;
  canonical_url: string;
  og_image: string;
  focus_topic: string;
  related_topics: string[];
  schema_type: string;
};

function EditorPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const getFn = useServerFn(getContent);
  const saveFn = useServerFn(upsertContent);
  const statusFn = useServerFn(changeContentStatus);
  const catsFn = useServerFn(listCategories);
  const authorsFn = useServerFn(listAuthors);
  const tagsFn = useServerFn(listTags);
  const qcFn = useServerFn(runQualityChecks);
  const linksFn = useServerFn(suggestInternalLinks);
  const commentFn = useServerFn(addContentComment);
  const resolveFn = useServerFn(toggleCommentResolved);
  const restoreFn = useServerFn(restoreRevision);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["content-item", id],
    queryFn: () => getFn({ data: { id } }),
    staleTime: 5_000,
  });
  const { data: categories } = useQuery({ queryKey: ["cats"], queryFn: () => catsFn(), staleTime: 60_000 });
  const { data: authors } = useQuery({ queryKey: ["authors"], queryFn: () => authorsFn(), staleTime: 60_000 });
  const { data: tags } = useQuery({ queryKey: ["tags"], queryFn: () => tagsFn(), staleTime: 60_000 });

  const [form, setForm] = useState<FormState | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (data?.item) {
      const it: any = data.item;
      setForm({
        type: it.type, title: it.title, slug: it.slug, summary: it.summary ?? "",
        body_markdown: it.body_markdown ?? "", featured_image: it.featured_image ?? "",
        featured_image_alt: it.featured_image_alt ?? "",
        category_id: it.category_id, author_id: it.author_id, reviewer_id: it.reviewer_id,
        tag_slugs: it.tag_slugs ?? [],
        seo_title: it.seo_title ?? "", seo_description: it.seo_description ?? "",
        canonical_url: it.canonical_url ?? "", og_image: it.og_image ?? "",
        focus_topic: it.focus_topic ?? "", related_topics: it.related_topics ?? [],
        schema_type: it.schema_type ?? "",
      });
      setDirty(false);
    }
  }, [data?.item]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((p) => (p ? { ...p, [k]: v } : p));
    setDirty(true);
  };

  const saveMut = useMutation({
    mutationFn: async (change_note?: string) => {
      if (!form) throw new Error("Not ready");
      return saveFn({ data: { id, ...form, change_note } as any });
    },
    onSuccess: () => { toast.success("Saved"); setDirty(false); qc.invalidateQueries({ queryKey: ["content-item", id] }); },
    onError: (e: any) => toast.error(e.message ?? "Save failed"),
  });

  const statusMut = useMutation({
    mutationFn: (payload: { status: any; scheduled_for?: string | null }) =>
      statusFn({ data: { id, ...payload } as any }),
    onSuccess: () => { toast.success("Status updated"); refetch(); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const quality = useMutation({
    mutationFn: () => qcFn({ data: { id } }),
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const [linkText, setLinkText] = useState("");
  const linksQuery = useMutation({
    mutationFn: () =>
      linksFn({ data: { id, text: form?.body_markdown ?? "", topic: form?.focus_topic } }),
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const [commentBody, setCommentBody] = useState("");
  const commentMut = useMutation({
    mutationFn: () => commentFn({ data: { content_id: id, body: commentBody } }),
    onSuccess: () => { setCommentBody(""); refetch(); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const restore = useMutation({
    mutationFn: (rid: string) => restoreFn({ data: { revision_id: rid } }),
    onSuccess: () => { toast.success("Restored"); refetch(); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const [schedule, setSchedule] = useState<string>("");

  const wc = useMemo(() => (form?.body_markdown ?? "").split(/\s+/).filter(Boolean).length, [form?.body_markdown]);
  const it: any = data?.item;

  if (isLoading || !form) return <div className="p-6 text-sm text-muted-foreground">Loading editor…</div>;

  return (
    <div className="space-y-4 max-w-[1600px]">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/admin/content/articles" as any })}>
            <ArrowLeft className="size-4 mr-1" /> All articles
          </Button>
          <div>
            <div className="text-xs text-muted-foreground">
              {CONTENT_TYPE_LABEL[form.type]} · {wc} words · {it?.reading_time_min ?? Math.max(1, Math.round(wc/220))} min read
              {it?.updated_at && <> · saved {formatDistanceToNow(new Date(it.updated_at))} ago</>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("inline-flex px-2 py-0.5 rounded text-[10px] uppercase font-medium", STATUS_COLOR[it?.status ?? "draft"])}>
            {STATUS_LABEL[it?.status ?? "draft"]}
          </span>
          <Button size="sm" variant="secondary" onClick={() => saveMut.mutate(undefined)} disabled={saveMut.isPending}>
            <Save className="size-4 mr-1.5" /> Save
          </Button>
          <Button size="sm" onClick={() => statusMut.mutate({ status: "in_review" })}>
            <Send className="size-4 mr-1.5" /> Send to review
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <Card className="p-4 space-y-3">
            <Input
              value={form.title} onChange={(e) => set("title", e.target.value)}
              className="text-xl font-display font-semibold h-auto py-2" placeholder="Title"
            />
            <Input
              value={form.slug} onChange={(e) => set("slug", e.target.value)}
              className="text-sm text-muted-foreground font-mono h-8" placeholder="url-slug"
            />
            <Textarea
              value={form.summary} onChange={(e) => set("summary", e.target.value)}
              placeholder="Editorial summary (shown in cards, feeds, and social previews)"
              className="min-h-16"
            />
          </Card>

          <Tabs defaultValue="write">
            <TabsList>
              <TabsTrigger value="write">Write</TabsTrigger>
              <TabsTrigger value="preview"><Eye className="size-3.5 mr-1" /> Preview</TabsTrigger>
              <TabsTrigger value="outline">Outline</TabsTrigger>
            </TabsList>
            <TabsContent value="write">
              <Card className="p-0">
                <Textarea
                  value={form.body_markdown}
                  onChange={(e) => set("body_markdown", e.target.value)}
                  placeholder={`# Heading\n\nWrite in Markdown. Use ## for sections. Use [link text](/glossary/slug) for internal links.`}
                  className="min-h-[560px] font-mono text-sm border-0 rounded-none focus-visible:ring-0"
                />
              </Card>
            </TabsContent>
            <TabsContent value="preview">
              <Card className="p-6 prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{form.body_markdown || "*Preview will appear here.*"}</ReactMarkdown>
              </Card>
            </TabsContent>
            <TabsContent value="outline">
              <Card className="p-4 space-y-1 text-sm">
                {(form.body_markdown.match(/^#{1,3}\s.+$/gm) ?? []).map((h, i) => {
                  const level = h.match(/^#+/)?.[0].length ?? 2;
                  return <div key={i} style={{ paddingLeft: (level - 1) * 12 }} className="text-muted-foreground">{h.replace(/^#+\s/, "")}</div>;
                })}
                {!form.body_markdown.match(/^#{1,3}\s.+$/gm) && <div className="text-muted-foreground">No headings yet.</div>}
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm flex items-center gap-2"><MessageSquare className="size-4" /> Editorial notes ({data?.comments?.length ?? 0})</h3>
            </div>
            <div className="flex gap-2">
              <Input value={commentBody} onChange={(e) => setCommentBody(e.target.value)} placeholder="Add a review note…" />
              <Button size="sm" onClick={() => commentMut.mutate()} disabled={!commentBody.trim() || commentMut.isPending}>Add</Button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(data?.comments ?? []).map((c: any) => (
                <div key={c.id} className={cn("rounded-md border border-border/60 p-2.5", c.resolved && "opacity-60")}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xs text-muted-foreground">
                      {c.author_name ?? "Editor"} · {formatDistanceToNow(new Date(c.created_at))} ago
                    </div>
                    <button
                      className="text-[10px] uppercase tracking-wide text-primary hover:underline"
                      onClick={() => resolveFn({ data: { id: c.id, resolved: !c.resolved } }).then(() => refetch())}
                    >{c.resolved ? "Reopen" : "Resolve"}</button>
                  </div>
                  <div className="text-sm mt-1">{c.body}</div>
                </div>
              ))}
              {!(data?.comments ?? []).length && <div className="text-xs text-muted-foreground">No notes yet.</div>}
            </div>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-4">
          <Card className="p-4 space-y-3">
            <h3 className="font-medium text-sm">Workflow</h3>
            <div className="grid grid-cols-2 gap-2">
              {CONTENT_STATUSES.filter((s) => s !== "scheduled").map((s) => (
                <Button key={s} size="sm" variant={it?.status === s ? "primary" : "outline"} onClick={() => statusMut.mutate({ status: s })}>
                  {STATUS_LABEL[s]}
                </Button>
              ))}
            </div>
            <div className="pt-2 border-t border-border/60 space-y-2">
              <Label className="text-xs flex items-center gap-1.5"><Calendar className="size-3.5" /> Schedule publish</Label>
              <Input type="datetime-local" value={schedule} onChange={(e) => setSchedule(e.target.value)} className="h-9" />
              <Button size="sm" variant="secondary" onClick={() => schedule && statusMut.mutate({ status: "scheduled", scheduled_for: new Date(schedule).toISOString() })} disabled={!schedule}>
                Schedule
              </Button>
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <h3 className="font-medium text-sm">Metadata</h3>
            <div className="space-y-2 text-sm">
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={form.type} onValueChange={(v) => set("type", v as ContentType)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{CONTENT_TYPES.map((t) => <SelectItem key={t} value={t}>{CONTENT_TYPE_LABEL[t]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={form.category_id ?? "__none"} onValueChange={(v) => set("category_id", v === "__none" ? null : v)}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Uncategorized" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Uncategorized</SelectItem>
                    {(categories ?? []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Author</Label>
                <Select value={form.author_id ?? "__none"} onValueChange={(v) => set("author_id", v === "__none" ? null : v)}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="No author" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">No author</SelectItem>
                    {(authors ?? []).map((a: any) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Reviewer</Label>
                <Select value={form.reviewer_id ?? "__none"} onValueChange={(v) => set("reviewer_id", v === "__none" ? null : v)}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="No reviewer" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">No reviewer</SelectItem>
                    {(authors ?? []).map((a: any) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <TagPicker value={form.tag_slugs} onChange={(v) => set("tag_slugs", v)} suggestions={(tags ?? []).map((t: any) => t.slug)} />
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <h3 className="font-medium text-sm flex items-center gap-2">SEO Panel</h3>
            <div className="text-sm space-y-2">
              <div>
                <Label className="text-xs">SEO Title <span className="text-muted-foreground">({form.seo_title.length}/70)</span></Label>
                <Input value={form.seo_title} onChange={(e) => set("seo_title", e.target.value)} className="h-9" />
              </div>
              <div>
                <Label className="text-xs">Meta Description <span className="text-muted-foreground">({form.seo_description.length}/160)</span></Label>
                <Textarea value={form.seo_description} onChange={(e) => set("seo_description", e.target.value)} className="min-h-16" />
              </div>
              <div>
                <Label className="text-xs">Focus topic</Label>
                <Input value={form.focus_topic} onChange={(e) => set("focus_topic", e.target.value)} className="h-9" />
              </div>
              <div>
                <Label className="text-xs">Canonical URL</Label>
                <Input value={form.canonical_url} onChange={(e) => set("canonical_url", e.target.value)} className="h-9" />
              </div>
              <div>
                <Label className="text-xs">Schema type</Label>
                <Select value={form.schema_type || "__none"} onValueChange={(v) => set("schema_type", v === "__none" ? "" : v)}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Auto" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Auto</SelectItem>
                    <SelectItem value="Article">Article</SelectItem>
                    <SelectItem value="DefinedTerm">DefinedTerm (glossary)</SelectItem>
                    <SelectItem value="HowTo">HowTo (roadmap)</SelectItem>
                    <SelectItem value="FAQPage">FAQPage</SelectItem>
                    <SelectItem value="Course">Course</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Featured image URL</Label>
                <Input value={form.featured_image} onChange={(e) => set("featured_image", e.target.value)} className="h-9" placeholder="https://…" />
                <Input value={form.featured_image_alt} onChange={(e) => set("featured_image_alt", e.target.value)} className="h-9 mt-1.5" placeholder="Alt text" />
              </div>
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm flex items-center gap-2"><ShieldCheck className="size-4" /> Quality checks</h3>
              <Button size="sm" variant="secondary" onClick={() => quality.mutate()} disabled={quality.isPending || dirty}>Run</Button>
            </div>
            {dirty && <div className="text-[11px] text-amber-600">Save before running quality checks.</div>}
            {quality.data && (
              <>
                <div className="text-2xl font-display font-semibold">{quality.data.score}<span className="text-sm text-muted-foreground">/100</span></div>
                <div className="space-y-1">
                  {quality.data.checks.map((c: any) => (
                    <div key={c.key} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("size-1.5 rounded-full", c.pass ? "bg-emerald-500" : "bg-red-500")} />
                        {c.label}
                      </div>
                      <span className="text-muted-foreground">{c.detail}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm flex items-center gap-2"><Link2 className="size-4" /> Internal link suggestions</h3>
              <Button size="sm" variant="secondary" onClick={() => linksQuery.mutate()} disabled={linksQuery.isPending}>Suggest</Button>
            </div>
            <div className="space-y-1 text-sm max-h-64 overflow-y-auto">
              {(linksQuery.data ?? []).map((r: any) => (
                <div key={r.id} className="flex items-center justify-between rounded-md hover:bg-surface-2/50 px-2 py-1">
                  <div className="min-w-0">
                    <div className="text-xs truncate">{r.title}</div>
                    <div className="text-[10px] text-muted-foreground truncate">/{r.slug}</div>
                  </div>
                  <button
                    className="text-[10px] uppercase tracking-wide text-primary hover:underline"
                    onClick={() => {
                      const md = `[${r.title}](/${r.type === "glossary" ? "glossary" : "learn"}/${r.slug})`;
                      set("body_markdown", (form.body_markdown ?? "") + `\n\nSee also: ${md}`);
                      toast.success("Added to body");
                    }}
                  >Insert</button>
                </div>
              ))}
              {!linksQuery.data?.length && <div className="text-xs text-muted-foreground">Click Suggest to find related published items.</div>}
            </div>
          </Card>

          <Card className="p-4 space-y-2">
            <h3 className="font-medium text-sm flex items-center gap-2"><History className="size-4" /> Revision history ({data?.revisions?.length ?? 0})</h3>
            <div className="space-y-1 text-sm max-h-64 overflow-y-auto">
              {(data?.revisions ?? []).map((r: any) => (
                <div key={r.id} className="flex items-center justify-between rounded-md px-2 py-1 hover:bg-surface-2/50">
                  <div>
                    <div className="text-xs">Rev #{r.revision_number}</div>
                    <div className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(r.created_at))} ago</div>
                  </div>
                  <button className="text-[10px] uppercase text-primary hover:underline" onClick={() => { if (confirm("Restore this revision?")) restore.mutate(r.id); }}>
                    Restore
                  </button>
                </div>
              ))}
              {!(data?.revisions ?? []).length && <div className="text-xs text-muted-foreground">No revisions yet.</div>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TagPicker({ value, onChange, suggestions }: { value: string[]; onChange: (v: string[]) => void; suggestions: string[] }) {
  const [input, setInput] = useState("");
  return (
    <div>
      <Label className="text-xs">Tags</Label>
      <div className="flex flex-wrap gap-1 mt-1">
        {value.map((t) => (
          <Badge key={t} variant="outline" className="text-[10px] cursor-pointer" onClick={() => onChange(value.filter((x) => x !== t))}>
            {t} ×
          </Badge>
        ))}
      </div>
      <div className="flex gap-1.5 mt-1.5">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Add tag…" className="h-8" list="tag-suggestions" />
        <Button size="sm" variant="secondary" onClick={() => { if (input.trim()) { onChange([...new Set([...value, input.trim().toLowerCase().replace(/\s+/g, "-")])]); setInput(""); } }}>Add</Button>
      </div>
      <datalist id="tag-suggestions">
        {suggestions.map((s) => <option key={s} value={s} />)}
      </datalist>
    </div>
  );
}
