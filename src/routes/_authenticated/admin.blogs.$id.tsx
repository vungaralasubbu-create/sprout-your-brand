import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  getBlogPost,
  upsertBlogPost,
  listBlogPosts,
} from "@/lib/admin/blogs.functions";

export const Route = createFileRoute("/_authenticated/admin/blogs/$id")({
  component: BlogEditor,
});

type FormState = {
  id?: string;
  slug: string;
  title: string;
  subtitle: string;
  short_summary: string;
  intro: string;
  content_markdown: string;
  topic_id: string;
  category_id: string;
  author_display_name: string;
  author_display_role: string;
  author_bio: string;
  reviewer_display_name: string;
  reviewer_display_role: string;
  skill_level: string;
  featured_image_url: string;
  thumbnail_url: string;
  hero_image_url: string;
  social_image_url: string;
  faqs: Array<{ question: string; answer: string }>;
  is_featured: boolean;
  is_trending: boolean;
  status: "draft" | "in_review" | "scheduled" | "published" | "archived";
  published_at: string;
  display_order: number;
  seo_title: string;
  seo_description: string;
  keywords: string;
  related_blog_slugs: string;
  related_course_slugs: string;
  schema_jsonld: string;
};

const empty: FormState = {
  slug: "",
  title: "",
  subtitle: "",
  short_summary: "",
  intro: "",
  content_markdown: "",
  topic_id: "",
  category_id: "",
  author_display_name: "Glintr Editorial",
  author_display_role: "",
  author_bio: "",
  reviewer_display_name: "",
  reviewer_display_role: "",
  skill_level: "",
  featured_image_url: "",
  thumbnail_url: "",
  hero_image_url: "",
  social_image_url: "",
  faqs: [],
  is_featured: false,
  is_trending: false,
  status: "draft",
  published_at: "",
  display_order: 0,
  seo_title: "",
  seo_description: "",
  keywords: "",
  related_blog_slugs: "",
  related_course_slugs: "",
  schema_jsonld: "",
};

function BlogEditor() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const getFn = useServerFn(getBlogPost);
  const upsertFn = useServerFn(upsertBlogPost);
  const listFn = useServerFn(listBlogPosts);

  const { data: taxonomy } = useQuery({
    queryKey: ["admin-blogs-taxonomy"],
    queryFn: () => listFn({ data: { limit: 1, offset: 0 } }),
    staleTime: 60_000,
  });

  const { data: post, isLoading } = useQuery({
    queryKey: ["admin-blog", id],
    queryFn: () => getFn({ data: { id } }),
  });

  const [form, setForm] = useState<FormState>(empty);
  useEffect(() => {
    if (!post) return;
    setForm({
      id: post.id,
      slug: post.slug ?? "",
      title: post.title ?? "",
      subtitle: post.subtitle ?? "",
      short_summary: post.short_summary ?? "",
      intro: post.intro ?? "",
      content_markdown: post.content_markdown ?? "",
      topic_id: post.topic_id ?? "",
      category_id: post.category_id ?? "",
      author_display_name: post.author_display_name ?? "Glintr Editorial",
      author_display_role: post.author_display_role ?? "",
      author_bio: post.author_bio ?? "",
      reviewer_display_name: post.reviewer_display_name ?? "",
      reviewer_display_role: post.reviewer_display_role ?? "",
      skill_level: post.skill_level ?? "",
      featured_image_url: post.featured_image_url ?? "",
      thumbnail_url: post.thumbnail_url ?? "",
      hero_image_url: post.hero_image_url ?? "",
      social_image_url: post.social_image_url ?? "",
      faqs: Array.isArray(post.faqs) ? (post.faqs as any) : [],
      is_featured: !!post.is_featured,
      is_trending: !!post.is_trending,
      status: (post.status ?? "draft") as FormState["status"],
      published_at: post.published_at ? post.published_at.slice(0, 16) : "",
      display_order: post.display_order ?? 0,
      seo_title: post.seo_title ?? "",
      seo_description: post.seo_description ?? "",
      keywords: (post.keywords ?? []).join(", "),
      related_blog_slugs: ((post as any).related_blog_slugs ?? []).join(", "),
      related_course_slugs: ((post as any).related_course_slugs ?? []).join(", "),
      schema_jsonld: (post as any).schema_jsonld
        ? JSON.stringify((post as any).schema_jsonld, null, 2)
        : "",
    });
  }, [post]);

  const saveMut = useMutation({
    mutationFn: () =>
      upsertFn({
        data: {
          id: form.id,
          slug: form.slug || undefined,
          title: form.title,
          subtitle: form.subtitle || null,
          short_summary: form.short_summary,
          intro: form.intro || null,
          content_markdown: form.content_markdown,
          topic_id: form.topic_id || null,
          category_id: form.category_id || null,
          author_display_name: form.author_display_name || "Glintr Editorial",
          author_display_role: form.author_display_role || null,
          author_bio: form.author_bio || null,
          reviewer_display_name: form.reviewer_display_name || null,
          reviewer_display_role: form.reviewer_display_role || null,
          skill_level: form.skill_level || null,
          featured_image_url: form.featured_image_url || null,
          thumbnail_url: form.thumbnail_url || null,
          hero_image_url: form.hero_image_url || null,
          social_image_url: form.social_image_url || null,
          faqs: form.faqs.filter((f) => f.question.trim() && f.answer.trim()),
          is_featured: form.is_featured,
          is_trending: form.is_trending,
          status: form.status,
          published_at: form.published_at
            ? new Date(form.published_at).toISOString()
            : null,
          display_order: Number(form.display_order) || 0,
          seo_title: form.seo_title || null,
          seo_description: form.seo_description || null,
          keywords: form.keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
        },
      }),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-blogs"] });
      qc.invalidateQueries({ queryKey: ["admin-blog", id] });
    },
    onError: (e: any) => toast.error(e.message ?? "Save failed"),
  });

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  if (isLoading && !post) {
    return (
      <div className="p-8 text-muted-foreground text-sm max-w-5xl">Loading post…</div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl pb-16">
      <header className="flex items-center justify-between gap-3 flex-wrap sticky top-0 z-10 -mx-4 md:mx-0 px-4 md:px-0 py-3 bg-background/85 backdrop-blur border-b border-border/60">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/admin/blogs" as any })}
          >
            <ArrowLeft className="size-4 mr-1.5" /> All posts
          </Button>
          <div className="min-w-0">
            <div className="font-display text-lg font-semibold truncate">
              {form.title || "Untitled draft"}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              /blog/{form.slug || "…"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {form.status === "published" && form.slug ? (
            <Button variant="outline" size="sm" asChild>
              <a href={`/blog/${form.slug}`} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4 mr-1.5" /> View live
              </a>
            </Button>
          ) : null}
          <Select
            value={form.status}
            onValueChange={(v) => update("status", v as FormState["status"])}
          >
            <SelectTrigger className="w-40 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
            <Save className="size-4 mr-1.5" />
            {saveMut.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </header>

      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="meta">Author & Meta</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="seo">SEO & Publish</TabsTrigger>
        </TabsList>

        {/* CONTENT */}
        <TabsContent value="content" className="space-y-4">
          <Card className="p-5 space-y-4">
            <Field label="Title">
              <Input
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="A compelling editorial title"
              />
            </Field>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Slug" hint="Auto-generated from title if empty. Must be unique.">
                <Input
                  value={form.slug}
                  onChange={(e) => update("slug", e.target.value)}
                  placeholder="my-post-slug"
                />
              </Field>
              <Field label="Skill level (optional)">
                <Select
                  value={form.skill_level || "__none"}
                  onValueChange={(v) => update("skill_level", v === "__none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">None</SelectItem>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Subtitle">
              <Input
                value={form.subtitle}
                onChange={(e) => update("subtitle", e.target.value)}
              />
            </Field>
            <Field label="Short summary" hint="Appears on cards and in TL;DR block.">
              <Textarea
                value={form.short_summary}
                onChange={(e) => update("short_summary", e.target.value)}
                rows={3}
              />
            </Field>
            <Field label="Intro paragraph (optional)">
              <Textarea
                value={form.intro}
                onChange={(e) => update("intro", e.target.value)}
                rows={3}
              />
            </Field>
            <Field label="Body (Markdown)" hint="Supports headings, lists, code blocks and images.">
              <Textarea
                value={form.content_markdown}
                onChange={(e) => update("content_markdown", e.target.value)}
                rows={20}
                className="font-mono text-sm"
              />
            </Field>
          </Card>
        </TabsContent>

        {/* MEDIA */}
        <TabsContent value="media" className="space-y-4">
          <Card className="p-5 space-y-4">
            <p className="text-xs text-muted-foreground">
              Paste image URLs (uploaded assets, CDN, or Lovable Assets). If nothing is set, a
              deterministic gradient cover is generated automatically until you replace it.
            </p>
            <Field label="Hero image URL" hint="Full-width visual at the top of the article.">
              <Input
                value={form.hero_image_url}
                onChange={(e) => update("hero_image_url", e.target.value)}
                placeholder="https://…"
              />
            </Field>
            <Field label="Featured image URL" hint="Fallback for hero and social share.">
              <Input
                value={form.featured_image_url}
                onChange={(e) => update("featured_image_url", e.target.value)}
              />
            </Field>
            <Field label="Thumbnail URL" hint="Used on cards and rails.">
              <Input
                value={form.thumbnail_url}
                onChange={(e) => update("thumbnail_url", e.target.value)}
              />
            </Field>
            <Field label="Social share image URL" hint="og:image / twitter:image (1200×630).">
              <Input
                value={form.social_image_url}
                onChange={(e) => update("social_image_url", e.target.value)}
              />
            </Field>
            {(form.hero_image_url || form.featured_image_url || form.thumbnail_url) && (
              <div className="rounded-2xl overflow-hidden border aspect-[16/9] bg-muted">
                <img
                  src={
                    form.hero_image_url ||
                    form.featured_image_url ||
                    form.thumbnail_url
                  }
                  alt="preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </Card>
        </TabsContent>

        {/* META */}
        <TabsContent value="meta" className="space-y-4">
          <Card className="p-5 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Topic">
                <Select
                  value={form.topic_id || "__none"}
                  onValueChange={(v) => update("topic_id", v === "__none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">None</SelectItem>
                    {(taxonomy?.topics ?? []).map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Category">
                <Select
                  value={form.category_id || "__none"}
                  onValueChange={(v) => update("category_id", v === "__none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">None</SelectItem>
                    {(taxonomy?.categories ?? []).map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Author name">
                <Input
                  value={form.author_display_name}
                  onChange={(e) => update("author_display_name", e.target.value)}
                />
              </Field>
              <Field label="Author role">
                <Input
                  value={form.author_display_role}
                  onChange={(e) => update("author_display_role", e.target.value)}
                  placeholder="Senior Editor"
                />
              </Field>
            </div>
            <Field label="Author bio">
              <Textarea
                value={form.author_bio}
                onChange={(e) => update("author_bio", e.target.value)}
                rows={3}
              />
            </Field>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Reviewer name">
                <Input
                  value={form.reviewer_display_name}
                  onChange={(e) => update("reviewer_display_name", e.target.value)}
                />
              </Field>
              <Field label="Reviewer role">
                <Input
                  value={form.reviewer_display_role}
                  onChange={(e) => update("reviewer_display_role", e.target.value)}
                  placeholder="Technical Reviewer"
                />
              </Field>
            </div>
          </Card>
        </TabsContent>

        {/* FAQs */}
        <TabsContent value="faqs" className="space-y-4">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-display text-lg font-semibold">FAQ block</div>
                <div className="text-xs text-muted-foreground">
                  Emitted as <code>FAQPage</code> JSON-LD and rendered under the article.
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  update("faqs", [...form.faqs, { question: "", answer: "" }])
                }
              >
                <Plus className="size-4 mr-1.5" /> Add FAQ
              </Button>
            </div>
            {form.faqs.length === 0 ? (
              <div className="text-sm text-muted-foreground border border-dashed rounded-xl p-6 text-center">
                No FAQs. Add at least 2–5 to boost AI search coverage.
              </div>
            ) : (
              <div className="space-y-3">
                {form.faqs.map((f, i) => (
                  <div key={i} className="rounded-xl border p-3 space-y-2 bg-card">
                    <div className="flex justify-between gap-2">
                      <Input
                        value={f.question}
                        onChange={(e) => {
                          const next = [...form.faqs];
                          next[i] = { ...next[i], question: e.target.value };
                          update("faqs", next);
                        }}
                        placeholder="Question"
                        className="font-medium"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          update(
                            "faqs",
                            form.faqs.filter((_, j) => j !== i),
                          )
                        }
                      >
                        <Trash2 className="size-4 text-muted-foreground" />
                      </Button>
                    </div>
                    <Textarea
                      value={f.answer}
                      onChange={(e) => {
                        const next = [...form.faqs];
                        next[i] = { ...next[i], answer: e.target.value };
                        update("faqs", next);
                      }}
                      rows={3}
                      placeholder="Answer"
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* SEO */}
        <TabsContent value="seo" className="space-y-4">
          <Card className="p-5 space-y-4">
            <Field label="SEO title" hint="Overrides <title>. Aim for < 60 chars.">
              <Input
                value={form.seo_title}
                onChange={(e) => update("seo_title", e.target.value)}
              />
            </Field>
            <Field
              label="Meta description"
              hint="Overrides description meta. Aim for < 160 chars."
            >
              <Textarea
                value={form.seo_description}
                onChange={(e) => update("seo_description", e.target.value)}
                rows={2}
              />
            </Field>
            <Field label="Keywords (comma separated)">
              <Input
                value={form.keywords}
                onChange={(e) => update("keywords", e.target.value)}
                placeholder="edtech, sales, ai"
              />
            </Field>
            <div className="grid md:grid-cols-3 gap-4">
              <Field label="Published at" hint="Local datetime. Filled automatically on publish.">
                <Input
                  type="datetime-local"
                  value={form.published_at}
                  onChange={(e) => update("published_at", e.target.value)}
                />
              </Field>
              <Field label="Display order">
                <Input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => update("display_order", Number(e.target.value) as any)}
                />
              </Field>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border p-2.5">
                  <Label className="text-sm">Featured</Label>
                  <Switch
                    checked={form.is_featured}
                    onCheckedChange={(v) => update("is_featured", v)}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-2.5">
                  <Label className="text-sm">Trending</Label>
                  <Switch
                    checked={form.is_trending}
                    onCheckedChange={(v) => update("is_trending", v)}
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint ? <div className="text-[11px] text-muted-foreground">{hint}</div> : null}
    </div>
  );
}
